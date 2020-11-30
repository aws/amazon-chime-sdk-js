// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import MeetingSessionStatus from '../meetingsession/MeetingSessionStatus';
import MeetingSessionStatusCode from '../meetingsession/MeetingSessionStatusCode';
import MeetingSessionTURNCredentials from '../meetingsession/MeetingSessionTURNCredentials';
import SignalingClient from '../signalingclient/SignalingClient';
import SignalingClientEvent from '../signalingclient/SignalingClientEvent';
import SignalingClientEventType from '../signalingclient/SignalingClientEventType';
import SignalingClientJoin from '../signalingclient/SignalingClientJoin';
import SignalingClientObserver from '../signalingclientobserver/SignalingClientObserver';
import { SdkIndexFrame, SdkSignalFrame } from '../signalingprotocol/SignalingProtocol.js';
import TaskCanceler from '../taskcanceler/TaskCanceler';
import BaseTask from './BaseTask';

/*
 * [[JoinAndReceiveIndexTask]] sends the JoinFrame and asynchronously waits for the server to send the [[SdkIndexFrame]].
 * It should run with the [[TimeoutTask]] as the subtask so it can get canceled after timeout.
 */
export default class JoinAndReceiveIndexTask extends BaseTask {
  protected taskName = 'JoinAndReceiveIndexTask';
  private taskCanceler: TaskCanceler | null = null;
  private maxVideos = 16;

  constructor(private context: AudioVideoControllerState) {
    super(context.logger);
  }

  cancel(): void {
    if (this.taskCanceler) {
      this.taskCanceler.cancel();
      this.taskCanceler = null;
    }
  }

  async run(): Promise<void> {
    const indexFrame = await new Promise<SdkIndexFrame>((resolve, reject) => {
      const context = this.context;
      context.turnCredentials = null;
      class IndexFrameInterceptor implements SignalingClientObserver, TaskCanceler {
        constructor(private signalingClient: SignalingClient) {}

        cancel(): void {
          this.signalingClient.removeObserver(this);
          reject(new Error(`JoinAndReceiveIndexTask got canceled while waiting for SdkIndexFrame`));
        }

        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketClosed) {
            context.logger.warn(
              `signaling connection closed by server with code ${event.closeCode} and reason: ${event.closeReason}`
            );
            let statusCode: MeetingSessionStatusCode = MeetingSessionStatusCode.SignalingBadRequest;
            if (event.closeCode === 4410) {
              context.logger.warn(`the meeting cannot be joined because it is has been ended`);
              statusCode = MeetingSessionStatusCode.MeetingEnded;
            } else if (event.closeCode >= 4500 && event.closeCode < 4600) {
              statusCode = MeetingSessionStatusCode.SignalingInternalServerError;
            }
            context.audioVideoController.handleMeetingSessionStatus(
              new MeetingSessionStatus(statusCode),
              null
            );
            return;
          }
          if (event.type !== SignalingClientEventType.ReceivedSignalFrame) {
            return;
          }
          if (event.message.type === SdkSignalFrame.Type.JOIN_ACK) {
            // @ts-ignore: force cast to SdkJoinAckFrame
            const joinAckFrame: SdkJoinAckFrame = event.message.joinack;
            if (joinAckFrame && joinAckFrame.turnCredentials) {
              context.turnCredentials = new MeetingSessionTURNCredentials();
              context.turnCredentials.username = joinAckFrame.turnCredentials.username;
              context.turnCredentials.password = joinAckFrame.turnCredentials.password;
              context.turnCredentials.ttl = joinAckFrame.turnCredentials.ttl;
              context.turnCredentials.uris = joinAckFrame.turnCredentials.uris
                .map((uri: string): string => {
                  return context.meetingSessionConfiguration.urls.urlRewriter(uri);
                })
                .filter((uri: string) => {
                  return !!uri;
                });
            } else {
              context.logger.error('missing TURN credentials in JoinAckFrame');
            }
            return;
          }
          if (event.message.type !== SdkSignalFrame.Type.INDEX) {
            return;
          }
          this.signalingClient.removeObserver(this);
          // @ts-ignore: force cast to SdkIndexFrame
          const indexFrame: SdkIndexFrame = event.message.index;
          resolve(indexFrame);
        }
      }
      const interceptor = new IndexFrameInterceptor(this.context.signalingClient);
      this.context.signalingClient.registerObserver(interceptor);
      this.taskCanceler = interceptor;
      this.context.signalingClient.join(new SignalingClientJoin(this.maxVideos, true));
    });
    this.context.logger.info(`received first index ${JSON.stringify(indexFrame)}`);
    this.context.indexFrame = indexFrame;
  }
}
