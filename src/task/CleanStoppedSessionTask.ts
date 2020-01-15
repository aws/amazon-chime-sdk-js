// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import SignalingClient from '../signalingclient/SignalingClient';
import SignalingClientEvent from '../signalingclient/SignalingClientEvent';
import SignalingClientEventType from '../signalingclient/SignalingClientEventType';
import SignalingClientObserver from '../signalingclientobserver/SignalingClientObserver';
import TaskCanceler from '../taskcanceler/TaskCanceler';
import DefaultVideoSubscribeContext from '../videosubscribecontext/DefaultVideoSubscribeContext';
import BaseTask from './BaseTask';

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
      for (let observer of this.context.removableObservers) {
        observer.removeObserver();
      }

      this.context.statsCollector.stop();
      this.context.statsCollector = null;
      this.context.connectionMonitor.stop();
      this.context.connectionMonitor = null;

      if (this.context.peer) {
        this.context.peer.close();
      }
      this.context.peer = null;
      this.context.localVideoSender = null;
      this.context.sdpAnswer = null;
      this.context.sdpOfferInit = null;
      this.context.indexFrame = null;
      this.context.iceCandidateHandler = null;
      this.context.iceCandidates = [];
      this.context.turnCredentials = null;
      this.context.videoSubscribeContext = new DefaultVideoSubscribeContext();
      this.context.transceiverController.reset();
      this.context.mediaStreamBroker.releaseMediaStream(this.context.activeAudioInput);
      this.context.activeAudioInput = null;
      this.context.mediaStreamBroker.releaseMediaStream(this.context.activeVideoInput);
      this.context.activeVideoInput = null;
      this.context.realtimeController.realtimeSetLocalAudioInput(null);

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
