// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import SignalingClient from '../signalingclient/SignalingClient';
import SignalingClientEvent from '../signalingclient/SignalingClientEvent';
import SignalingClientEventType from '../signalingclient/SignalingClientEventType';
import SignalingClientObserver from '../signalingclientobserver/SignalingClientObserver';
import TaskCanceler from '../taskcanceler/TaskCanceler';
import BaseTask from './BaseTask';

/*
 * `CleanStoppedSessionTask` permenently cleans up all components of `AudioVideoControllerState` after a stop call.
 */
export default class CleanStoppedSessionTask extends BaseTask {
  protected taskName = 'CleanStoppedSessionTask';
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
    try {
      if (this.context.signalingClient.ready()) {
        this.context.signalingClient.closeConnection();
        await this.receiveWebSocketClosedEvent();
      }
    } catch (error) {
      throw error;
    } finally {
      for (const observer of this.context.removableObservers) {
        observer.removeObserver();
      }
      this.context.resetConnectionSpecificState();

      this.context.statsCollector.stop();
      this.context.statsCollector = null;
      this.context.connectionMonitor.stop();
      this.context.connectionMonitor = null;

      if (this.context.videoUplinkBandwidthPolicy.setTransceiverController) {
        this.context.videoUplinkBandwidthPolicy.setTransceiverController(undefined);
      }
      if (this.context.videoDownlinkBandwidthPolicy.bindToTileController) {
        this.context.videoDownlinkBandwidthPolicy.bindToTileController(undefined);
      }

      // This state may be reused to join another conference, so clear out all the existing video tiles
      const tile = this.context.videoTileController.getLocalVideoTile();
      if (tile) {
        tile.bindVideoStream('', true, null, null, null, null);
      }
      this.context.videoTileController.removeAllVideoTiles();
    }
  }

  private receiveWebSocketClosedEvent(): Promise<void> {
    return new Promise((resolve, reject) => {
      class Interceptor implements SignalingClientObserver, TaskCanceler {
        constructor(private signalingClient: SignalingClient) {}

        cancel(): void {
          this.signalingClient.removeObserver(this);
          reject(
            new Error(
              `CleanStoppedSessionTask got canceled while waiting for the WebSocket closed event`
            )
          );
        }

        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketClosed) {
            this.signalingClient.removeObserver(this);
            resolve();
          }
        }
      }

      const interceptor = new Interceptor(this.context.signalingClient);
      this.taskCanceler = interceptor;
      this.context.signalingClient.registerObserver(interceptor);
    });
  }
}
