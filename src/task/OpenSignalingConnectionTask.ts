// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import SignalingClient from '../signalingclient/SignalingClient';
import SignalingClientConnectionRequest from '../signalingclient/SignalingClientConnectionRequest';
import SignalingClientEvent from '../signalingclient/SignalingClientEvent';
import SignalingClientEventType from '../signalingclient/SignalingClientEventType';
import SignalingClientObserver from '../signalingclientobserver/SignalingClientObserver';
import TaskCanceler from '../taskcanceler/TaskCanceler';
import BaseTask from './BaseTask';

export default class OpenSignalingConnectionTask extends BaseTask {
  protected taskName = 'OpenSignalingConnectionTask';

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
    const configuration = this.context.meetingSessionConfiguration;

    this.context.signalingClient.openConnection(
      new SignalingClientConnectionRequest(
        configuration.urls.signalingURL,
        configuration.credentials.joinToken
      )
    );
    const startTimeMs = Date.now();
    try {
      await new Promise<void>((resolve, reject) => {
        class WebSocketOpenInterceptor implements SignalingClientObserver, TaskCanceler {
          constructor(private signalingClient: SignalingClient) {}

          cancel(): void {
            this.signalingClient.removeObserver(this);
            reject(
              new Error(
                `OpenSignalingConnectionTask got canceled while waiting to open signaling connection`
              )
            );
          }

          handleSignalingClientEvent(event: SignalingClientEvent): void {
            switch (event.type) {
              case SignalingClientEventType.WebSocketOpen:
                this.signalingClient.removeObserver(this);
                resolve();
                break;
              case SignalingClientEventType.WebSocketFailed:
                this.signalingClient.removeObserver(this);
                reject(new Error('WebSocket connection failed'));
                break;
            }
          }
        }
        const interceptor = new WebSocketOpenInterceptor(this.context.signalingClient);
        this.context.signalingClient.registerObserver(interceptor);
        this.taskCanceler = interceptor;
      });
    } catch (error) {
      throw error;
    } finally {
      this.context.signalingOpenDurationMs = Math.round(Date.now() - startTimeMs);
    }
  }
}
