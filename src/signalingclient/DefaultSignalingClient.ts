// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DefaultBrowserBehavior from '../browserbehavior/DefaultBrowserBehavior';
import Logger from '../logger/Logger';
import SignalingClientObserver from '../signalingclientobserver/SignalingClientObserver';
import {
  SdkAudioControlFrame,
  SdkClientDetails,
  SdkClientMetricFrame,
  SdkDataMessageFrame,
  SdkJoinFlags,
  SdkJoinFrame,
  SdkLeaveFrame,
  SdkPauseResumeFrame,
  SdkPingPongFrame,
  SdkSignalFrame,
  SdkStreamDescriptor,
  SdkStreamMediaType,
  SdkStreamServiceType,
  SdkSubscribeFrame,
} from '../signalingprotocol/SignalingProtocol.js';
import Versioning from '../versioning/Versioning';
import WebSocketAdapter from '../websocketadapter/WebSocketAdapter';
import WebSocketReadyState from '../websocketadapter/WebSocketReadyState';
import SignalingClient from './SignalingClient';
import SignalingClientConnectionRequest from './SignalingClientConnectionRequest';
import SignalingClientEvent from './SignalingClientEvent';
import SignalingClientEventType from './SignalingClientEventType';
import SignalingClientJoin from './SignalingClientJoin';
import SignalingClientSubscribe from './SignalingClientSubscribe';

/**
 * [[DefaultSignalingClient]] implements the SignalingClient interface.
 */
export default class DefaultSignalingClient implements SignalingClient {
  private static FRAME_TYPE_RTC: number = 0x5;
  private observerQueue: Set<SignalingClientObserver>;
  private wasOpened: boolean;
  private isClosing: boolean;
  private connectionRequestQueue: SignalingClientConnectionRequest[];
  private unloadHandler: () => void | null = null;
  private audioSessionId: number;

  constructor(private webSocket: WebSocketAdapter, private logger: Logger) {
    this.observerQueue = new Set<SignalingClientObserver>();
    this.connectionRequestQueue = [];
    this.resetConnection();
    this.logger.debug(() => 'signaling client init');
    this.audioSessionId = this.generateNewAudioSessionId();
  }

  registerObserver(observer: SignalingClientObserver): void {
    this.logger.debug(() => 'registering signaling client observer');
    this.observerQueue.add(observer);
  }

  removeObserver(observer: SignalingClientObserver): void {
    this.logger.debug(() => 'removing signaling client observer');
    this.observerQueue.delete(observer);
  }

  openConnection(request: SignalingClientConnectionRequest): void {
    this.logger.info('adding connection request to queue: ' + request.url());
    this.connectionRequestQueue.push(request);
    this.closeConnection();
  }

  pingPong(pingPongFrame: SdkPingPongFrame): number {
    this.logger.debug(() => 'sending ping');
    const message = SdkSignalFrame.create();
    message.type = SdkSignalFrame.Type.PING_PONG;
    message.pingPong = pingPongFrame;
    this.sendMessage(message);
    return message.timestampMs as number;
  }

  join(settings: SignalingClientJoin): void {
    this.logger.info('sending join');
    const joinFrame = SdkJoinFrame.create();
    joinFrame.protocolVersion = 2;
    joinFrame.maxNumOfVideos = settings.maxVideos;
    joinFrame.flags = SdkJoinFlags.HAS_STREAM_UPDATE;
    // Only Chrome currently supports the new send side bandwidth estimation
    const browserBehavior = new DefaultBrowserBehavior();
    if (browserBehavior.hasChromiumWebRTC()) {
      joinFrame.flags |= SdkJoinFlags.USE_SEND_SIDE_BWE;
    }
    joinFrame.flags |= settings.sendBitrates ? SdkJoinFlags.SEND_BITRATES : 0;
    joinFrame.clientDetails = SdkClientDetails.create({
      platformName: browserBehavior.name(),
      platformVersion: browserBehavior.version(),
      clientSource: Versioning.sdkName,
      chimeSdkVersion: Versioning.sdkVersion,
    });
    joinFrame.audioSessionId = this.audioSessionId;

    const message = SdkSignalFrame.create();
    message.type = SdkSignalFrame.Type.JOIN;
    message.join = joinFrame;
    this.sendMessage(message);
  }

  subscribe(settings: SignalingClientSubscribe): void {
    const subscribeFrame = SdkSubscribeFrame.create();
    subscribeFrame.sendStreams = [];
    subscribeFrame.sdpOffer = settings.sdpOffer;
    subscribeFrame.audioCheckin = settings.audioCheckin;
    subscribeFrame.audioHost = settings.audioHost;
    subscribeFrame.audioMuted = settings.audioMuted;
    if (settings.connectionTypeHasVideo) {
      subscribeFrame.receiveStreamIds = settings.receiveStreamIds;
    }
    subscribeFrame.duplex = SdkStreamServiceType.RX;
    if (!settings.audioCheckin) {
      const audioStream = SdkStreamDescriptor.create();
      audioStream.mediaType = SdkStreamMediaType.AUDIO;
      audioStream.trackLabel = 'AmazonChimeExpressAudio';
      audioStream.attendeeId = settings.attendeeId;
      audioStream.streamId = 1;
      audioStream.groupId = 1;
      audioStream.framerate = 15;
      audioStream.maxBitrateKbps = 600;
      audioStream.avgBitrateBps = 400000;
      subscribeFrame.sendStreams.push(audioStream);
    }
    if (settings.localVideoEnabled) {
      subscribeFrame.duplex = SdkStreamServiceType.DUPLEX;
      for (let i = 0; i < settings.videoStreamDescriptions.length; i++) {
        // Non-simulcast use DefaultVideoStreamIndex.localStreamDescriptions
        // which is the exact old behavior
        const streamDescription = settings.videoStreamDescriptions[i].clone();
        streamDescription.attendeeId = settings.attendeeId;
        subscribeFrame.sendStreams.push(streamDescription.toStreamDescriptor());
      }
    }
    const message = SdkSignalFrame.create();
    message.type = SdkSignalFrame.Type.SUBSCRIBE;
    message.sub = subscribeFrame;
    this.sendMessage(message);
  }

  leave(): void {
    const message = SdkSignalFrame.create();
    message.type = SdkSignalFrame.Type.LEAVE;
    message.leave = SdkLeaveFrame.create();
    this.sendMessage(message);
    this.logger.debug(() => {
      return 'sent leave';
    });
  }

  sendClientMetrics(clientMetricFrame: SdkClientMetricFrame): void {
    const message = SdkSignalFrame.create();
    message.type = SdkSignalFrame.Type.CLIENT_METRIC;
    message.clientMetric = clientMetricFrame;
    this.sendMessage(message);
  }

  sendDataMessage(messageFrame: SdkDataMessageFrame): void {
    const message = SdkSignalFrame.create();
    message.type = SdkSignalFrame.Type.DATA_MESSAGE;
    message.dataMessage = messageFrame;
    this.sendMessage(message);
  }

  closeConnection(): void {
    if (
      this.webSocket.readyState() !== WebSocketReadyState.None &&
      this.webSocket.readyState() !== WebSocketReadyState.Closed
    ) {
      this.isClosing = true;
      this.sendEvent(
        new SignalingClientEvent(this, SignalingClientEventType.WebSocketClosing, null)
      );
      this.webSocket.close();
      this.deactivatePageUnloadHandler();
    } else {
      this.logger.info('no existing connection needs closing');
      this.serviceConnectionRequestQueue();
    }
  }

  ready(): boolean {
    return (
      this.webSocket.readyState() === WebSocketReadyState.Open && !this.isClosing && this.wasOpened
    );
  }

  mute(muted: boolean): void {
    const message = SdkSignalFrame.create();
    message.type = SdkSignalFrame.Type.AUDIO_CONTROL;
    const audioControl = SdkAudioControlFrame.create();
    audioControl.muted = muted;
    message.audioControl = audioControl;
    this.sendMessage(message);
  }

  pause(streamIds: number[]): void {
    const message = SdkSignalFrame.create();
    message.type = SdkSignalFrame.Type.PAUSE;
    message.pause = SdkPauseResumeFrame.create();
    message.pause.streamIds = streamIds;
    this.sendMessage(message);
  }

  resume(streamIds: number[]): void {
    const message = SdkSignalFrame.create();
    message.type = SdkSignalFrame.Type.RESUME;
    message.pause = SdkPauseResumeFrame.create();
    message.pause.streamIds = streamIds;
    this.sendMessage(message);
  }

  private resetConnection(): void {
    this.webSocket.destroy();
    this.wasOpened = false;
  }

  private sendMessage(message: SdkSignalFrame): void {
    message.timestampMs = Date.now();
    this.logger.debug(() => `sending: ${JSON.stringify(message)}`);
    const buffer = this.prependWithFrameTypeRTC(SdkSignalFrame.encode(message).finish());
    if (this.ready()) {
      if (!this.webSocket.send(buffer)) {
        this.sendEvent(
          new SignalingClientEvent(this, SignalingClientEventType.WebSocketSendMessageFailure, null)
        );
        return;
      }
      this.sendEvent(
        new SignalingClientEvent(this, SignalingClientEventType.WebSocketSentMessage, null)
      );
    } else {
      this.sendEvent(
        new SignalingClientEvent(this, SignalingClientEventType.WebSocketSkippedMessage, null)
      );
    }
  }

  private receiveMessage(inBuffer: Uint8Array): void {
    let message: SdkSignalFrame;
    try {
      message = SdkSignalFrame.decode(inBuffer);
    } catch (e) {
      this.logger.info(`failed to decode: ${inBuffer}`);
      this.sendEvent(
        new SignalingClientEvent(this, SignalingClientEventType.ProtocolDecodeFailure, null)
      );
      return;
    }
    this.logger.debug(() => `received: ${JSON.stringify(message)}`);
    if (this.webSocket.readyState() === WebSocketReadyState.Open) {
      this.sendEvent(
        new SignalingClientEvent(this, SignalingClientEventType.ReceivedSignalFrame, message)
      );
    } else {
      this.logger.info(
        `skipping notification of message since WebSocket is not open: ${JSON.stringify(message)}`
      );
    }
  }

  private stripFrameTypeRTC(inBuffer: Uint8Array): Uint8Array {
    const frameType = inBuffer[0];
    // TODO: change server frame type to send 0x05
    if (frameType !== DefaultSignalingClient.FRAME_TYPE_RTC && frameType !== 0x02) {
      this.logger.warn(`expected FrameTypeRTC for message but got ${frameType}`);
    }
    return inBuffer.slice(1);
  }

  private prependWithFrameTypeRTC(inBuffer: Uint8Array): Uint8Array {
    const outBuffer = new Uint8Array(inBuffer.length + 1);
    outBuffer[0] = DefaultSignalingClient.FRAME_TYPE_RTC;
    outBuffer.set(inBuffer, 1);
    return outBuffer;
  }

  private serviceConnectionRequestQueue(): void {
    if (this.connectionRequestQueue.length === 0) {
      this.logger.info('no connection requests to service');
      return;
    }
    const request = this.connectionRequestQueue.shift();
    this.logger.info(`opening connection to ${request.url()}`);
    this.isClosing = false;
    this.webSocket.create(request.url(), request.protocols());
    this.setUpEventListeners();
    this.sendEvent(
      new SignalingClientEvent(this, SignalingClientEventType.WebSocketConnecting, null)
    );
  }

  private sendEvent(event: SignalingClientEvent): void {
    switch (event.type) {
      case SignalingClientEventType.WebSocketMessage:
      case SignalingClientEventType.ReceivedSignalFrame:
      case SignalingClientEventType.WebSocketSentMessage:
        this.logger.debug(() => `notifying event: ${SignalingClientEventType[event.type]}`);
        break;
      case SignalingClientEventType.WebSocketSkippedMessage:
        this.logger.debug(
          () =>
            `notifying event: ${SignalingClientEventType[event.type]}, websocket state=${
              WebSocketReadyState[this.webSocket.readyState()]
            }`
        );
        break;
      default:
        this.logger.info(`notifying event: ${SignalingClientEventType[event.type]}`);
        break;
    }

    for (const observer of this.observerQueue) {
      observer.handleSignalingClientEvent(event);
    }
  }

  private setUpEventListeners(): void {
    this.webSocket.addEventListener('open', () => {
      this.activatePageUnloadHandler();
      this.wasOpened = true;
      this.sendEvent(new SignalingClientEvent(this, SignalingClientEventType.WebSocketOpen, null));
    });
    this.webSocket.addEventListener('message', (event: MessageEvent) => {
      this.sendEvent(
        new SignalingClientEvent(this, SignalingClientEventType.WebSocketMessage, null)
      );
      this.receiveMessage(this.stripFrameTypeRTC(new Uint8Array(event.data)));
    });
    this.webSocket.addEventListener('close', (event: CloseEvent) => {
      this.deactivatePageUnloadHandler();
      this.resetConnection();
      this.sendEvent(
        new SignalingClientEvent(
          this,
          SignalingClientEventType.WebSocketClosed,
          null,
          event.code,
          event.reason
        )
      );
      this.serviceConnectionRequestQueue();
    });
    this.webSocket.addEventListener('error', () => {
      if (this.isClosing && !this.wasOpened) {
        this.logger.info('ignoring error closing signaling while connecting');
        return;
      }
      if (this.wasOpened) {
        this.logger.error('received error while connected');
        this.sendEvent(
          new SignalingClientEvent(this, SignalingClientEventType.WebSocketError, null)
        );
      } else {
        this.logger.error('failed to connect');
        this.sendEvent(
          new SignalingClientEvent(this, SignalingClientEventType.WebSocketFailed, null)
        );
      }
    });
  }

  private activatePageUnloadHandler(): void {
    this.unloadHandler = () => {
      this.leave();
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const GlobalAny = global as any;
    GlobalAny['window'] &&
      GlobalAny['window']['addEventListener'] &&
      window.addEventListener('unload', this.unloadHandler);
  }

  private deactivatePageUnloadHandler(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const GlobalAny = global as any;
    GlobalAny['window'] &&
      GlobalAny['window']['addEventListener'] &&
      window.removeEventListener('unload', this.unloadHandler);
    this.unloadHandler = null;
  }

  private generateNewAudioSessionId(): number {
    const num = new Uint32Array(1);
    const randomNum = window.crypto.getRandomValues(num);
    return randomNum[0];
  }
}
