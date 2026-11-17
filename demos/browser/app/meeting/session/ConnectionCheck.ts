// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  DefaultSignalingClient,
  DefaultWebSocketAdapter,
  Logger,
  MeetingSessionConfiguration,
  SignalingClientConnectionRequest,
  SignalingClientEvent,
  SignalingClientEventType,
  SignalingClientJoin,
} from 'amazon-chime-sdk-js';

export type Transport = 'udp' | 'tcp';

export interface TransportResult {
  works: boolean;
  uri: string;
  ms?: number;
}

export type ConnectionCheckResult =
  | { reached: true; transports: Partial<Record<Transport, TransportResult>> }
  | { reached: false; error: string };

interface TurnCredentials {
  username: string;
  password: string;
  uris: string[];
}

const JOIN_TIMEOUT_MS = 10000;
const GATHER_TIMEOUT_MS = 5000;

export function transportOf(uri: string): Transport {
  return uri.startsWith('turns:') || uri.includes('transport=tcp') ? 'tcp' : 'udp';
}

/**
 * Tests UDP and TCP to the meeting's TURN servers, which carry all media. A signaling JOIN without
 * SUBSCRIBE returns the TURN credentials and never joins audio, so no one sees the attendee.
 */
export default class ConnectionCheck {
  private client: DefaultSignalingClient | undefined;
  private readonly peers = new Set<RTCPeerConnection>();
  private generation = 0;

  constructor(private readonly logger: Logger) {}

  /** null when cancelled. */
  async check(configuration: MeetingSessionConfiguration): Promise<ConnectionCheckResult | null> {
    this.cancel();
    const generation = this.generation;
    const client = new DefaultSignalingClient(
      new DefaultWebSocketAdapter(this.logger),
      this.logger
    );
    this.client = client;
    let turn: TurnCredentials;
    try {
      turn = await this.turnCredentials(client, configuration);
    } catch (error) {
      return generation === this.generation
        ? { reached: false, error: (error as Error).message }
        : null;
    } finally {
      this.leave(client);
    }
    const results = await Promise.all(turn.uris.map(uri => this.gather(uri, turn)));
    if (generation !== this.generation) {
      return null;
    }
    const transports: Partial<Record<Transport, TransportResult>> = {};
    for (const result of results) {
      const transport = transportOf(result.uri);
      if (!transports[transport]?.works) {
        transports[transport] = result;
      }
    }
    return { reached: true, transports };
  }

  cancel(): void {
    this.generation++;
    if (this.client) {
      this.leave(this.client);
    }
    for (const peer of this.peers) {
      peer.close();
    }
    this.peers.clear();
  }

  private turnCredentials(
    client: DefaultSignalingClient,
    configuration: MeetingSessionConfiguration
  ): Promise<TurnCredentials> {
    const urls = configuration.urls!;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('no reply from signaling')), JOIN_TIMEOUT_MS);
      const fail = (reason: string): void => {
        clearTimeout(timer);
        reject(new Error(reason));
      };
      client.registerObserver({
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          switch (event.type) {
            case SignalingClientEventType.WebSocketOpen:
              client.join(new SignalingClientJoin());
              break;
            case SignalingClientEventType.WebSocketFailed:
            case SignalingClientEventType.WebSocketError:
            case SignalingClientEventType.WebSocketClosed:
              fail('signaling connection failed');
              break;
            case SignalingClientEventType.ReceivedSignalFrame: {
              const ack = event.message?.joinack;
              if (!ack) {
                break;
              }
              clearTimeout(timer);
              if (!ack.turnCredentials) {
                reject(new Error('no TURN credentials'));
                break;
              }
              resolve({
                username: ack.turnCredentials.username!,
                password: ack.turnCredentials.password!,
                uris: (ack.turnCredentials.uris ?? [])
                  .map(uri => urls.urlRewriter(uri))
                  .filter((uri): uri is string => !!uri),
              });
              break;
            }
          }
        },
      });
      client.openConnection(
        new SignalingClientConnectionRequest(
          urls.signalingURL!,
          configuration.credentials!.joinToken!
        )
      );
    });
  }

  private leave(client: DefaultSignalingClient): void {
    if (this.client === client) {
      this.client = undefined;
    }
    if (client.ready()) {
      client.leave();
    }
    client.closeConnection();
  }

  /** Works when the browser gets a relay candidate from the TURN server over this URI. */
  private async gather(uri: string, turn: TurnCredentials): Promise<TransportResult> {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: [uri], username: turn.username, credential: turn.password }],
      iceTransportPolicy: 'relay',
    });
    this.peers.add(peer);
    const start = performance.now();
    try {
      const relay = new Promise<number | null>(resolve => {
        peer.addEventListener('icecandidate', event => {
          if (!event.candidate) {
            resolve(null);
          } else if (/ typ relay /.test(event.candidate.candidate)) {
            resolve(performance.now() - start);
          }
        });
        setTimeout(() => resolve(null), GATHER_TIMEOUT_MS);
      });
      peer.createDataChannel('connection-check');
      await peer.setLocalDescription(await peer.createOffer());
      const ms = await relay;
      return ms === null ? { works: false, uri } : { works: true, uri, ms: Math.round(ms) };
    } catch {
      return { works: false, uri };
    } finally {
      peer.close();
      this.peers.delete(peer);
    }
  }
}
