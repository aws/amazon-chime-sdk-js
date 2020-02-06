// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
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
      class IndexFrameInterceptor implements SignalingClientObserver, TaskCanceler {
        constructor(private signalingClient: SignalingClient) {}

        cancel(): void {
          this.signalingClient.removeObserver(this);
          reject(new Error(`JoinAndReceiveIndexTask got canceled while waiting for SdkIndexFrame`));
        }

        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type !== SignalingClientEventType.ReceivedSignalFrame) {
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
