// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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
 * [[LeaveAndReceiveLeaveAckTask]] sends a Leave frame and waits for a LeaveAck.
 */
export default class LeaveAndReceiveLeaveAckTask extends BaseTask {
  protected taskName = 'LeaveAndReceiveLeaveAckTask';
  private taskCanceler: TaskCanceler | null = null;

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
    if (this.context.signalingClient.ready()) {
      this.context.signalingClient.leave();
      this.context.logger.info('sent leave');
      await this.receiveLeaveAck();
    }
  }

  private receiveLeaveAck(): Promise<void> {
    return new Promise((resolve, reject) => {
      class Interceptor implements SignalingClientObserver, TaskCanceler {
        constructor(private signalingClient: SignalingClient, private logger: Logger) {}

        cancel(): void {
          this.signalingClient.removeObserver(this);
          reject(
            new Error(`LeaveAndReceiveLeaveAckTask got canceled while waiting for IndexFrame`)
          );
        }

        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.isConnectionTerminated()) {
            this.signalingClient.removeObserver(this);
            this.logger.info('LeaveAndReceiveLeaveAckTask connection terminated');
            // don't treat this as an error
            resolve();
            return;
          }

          if (
            event.type === SignalingClientEventType.ReceivedSignalFrame &&
            event.message.type === SdkSignalFrame.Type.LEAVE_ACK
          ) {
            this.signalingClient.removeObserver(this);
            this.logger.info('got leave ack');
            resolve();
          }
        }
      }

      const interceptor = new Interceptor(this.context.signalingClient, this.context.logger);
      this.taskCanceler = interceptor;
      this.context.signalingClient.registerObserver(interceptor);
    });
  }
}
