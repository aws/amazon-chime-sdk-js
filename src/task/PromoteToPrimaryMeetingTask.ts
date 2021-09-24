// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { MeetingSessionCredentials, MeetingSessionStatus, MeetingSessionStatusCode } from '..';
import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import Logger from '../logger/Logger';
import SignalingClient from '../signalingclient/SignalingClient';
import SignalingClientEvent from '../signalingclient/SignalingClientEvent';
import SignalingClientEventType from '../signalingclient/SignalingClientEventType';
import SignalingClientObserver from '../signalingclientobserver/SignalingClientObserver';
import { SdkSignalFrame } from '../signalingprotocol/SignalingProtocol.js';
import TaskCanceler from '../taskcanceler/TaskCanceler';
import BaseTask from './BaseTask';

/**
 * [[PromoteToPrimaryMeetingTask]] sends a `SdkSignalFrame.PrimaryMeetingJoin` and waits for
 * a `SdkSignalFrame.PrimaryMeetingJoinAck`  frame.
 */
export default class PromoteToPrimaryMeetingTask extends BaseTask {
  protected taskName = 'PromoteToPrimaryMeetingTask';
  private taskCanceler: TaskCanceler | null = null;

  constructor(
    private context: AudioVideoControllerState,
    private credentials: MeetingSessionCredentials,
    private completionCallback: (status: MeetingSessionStatus) => void
  ) {
    super(context.logger);
  }

  cancel(): void {
    if (this.taskCanceler) {
      this.taskCanceler.cancel();
      this.taskCanceler = null;
    }
  }

  async run(): Promise<void> {
    if (this.context.signalingClient.ready()) {
      this.context.signalingClient.promoteToPrimaryMeeting(this.credentials);
      this.context.logger.info('Sent request to join primary meeting');
      await this.receivePrimaryMeetingJoinAck();
    } else {
      this.completionCallback(
        new MeetingSessionStatus(MeetingSessionStatusCode.SignalingRequestFailed)
      );
    }
  }

  private receivePrimaryMeetingJoinAck(): Promise<void> {
    return new Promise((resolve, _) => {
      class Interceptor implements SignalingClientObserver, TaskCanceler {
        constructor(
          private signalingClient: SignalingClient,
          private completionCallback: (status: MeetingSessionStatus) => void,
          private logger: Logger
        ) {}

        cancel(): void {
          this.signalingClient.removeObserver(this);
          // Currently only cancel would come from timeout.  Should
          // be rare enough (ignoring bugs) that we don't need to bother
          // retrying.
          this.completionCallback(
            new MeetingSessionStatus(MeetingSessionStatusCode.SignalingRequestFailed)
          );
          resolve();
        }

        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.isConnectionTerminated()) {
            this.signalingClient.removeObserver(this);
            this.logger.info('PromoteToPrimaryMeetingTask connection terminated');
            // This would happen either in happy or unhappy disconnections.  The
            // timing here is rare enough (ignoring bugs) that we don't need to bother
            // retrying the unhappy case.
            this.completionCallback(
              new MeetingSessionStatus(MeetingSessionStatusCode.SignalingRequestFailed)
            );
            resolve();
          }

          if (
            event.type === SignalingClientEventType.ReceivedSignalFrame &&
            event.message.type === SdkSignalFrame.Type.PRIMARY_MEETING_JOIN_ACK
          ) {
            this.signalingClient.removeObserver(this);
            this.logger.info('Got a primary meeting join ACK');
            this.completionCallback(MeetingSessionStatus.fromSignalFrame(event.message));
            resolve();
          }
        }
      }

      const interceptor = new Interceptor(
        this.context.signalingClient,
        this.completionCallback,
        this.context.logger
      );
      this.taskCanceler = interceptor;
      this.context.signalingClient.registerObserver(interceptor);
    });
  }
}
