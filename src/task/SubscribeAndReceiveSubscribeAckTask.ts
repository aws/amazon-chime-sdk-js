// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import DefaultSDP from '../sdp/DefaultSDP';
import SignalingClient from '../signalingclient/SignalingClient';
import SignalingClientEvent from '../signalingclient/SignalingClientEvent';
import SignalingClientEventType from '../signalingclient/SignalingClientEventType';
import SignalingClientSubscribe from '../signalingclient/SignalingClientSubscribe';
import SignalingClientObserver from '../signalingclientobserver/SignalingClientObserver';
import {
  SdkSignalFrame,
  SdkStreamServiceType,
  SdkSubscribeAckFrame,
} from '../signalingprotocol/SignalingProtocol.js';
import TaskCanceler from '../taskcanceler/TaskCanceler';
import BaseTask from './BaseTask';

/**
 * [[SubscribeAndReceiveSubscribeAckTask]] sends a subscribe frame with the given settings
 * and receives SdkSubscribeAckFrame.
 */
export default class SubscribeAndReceiveSubscribeAckTask extends BaseTask {
  protected taskName = 'SubscribeAndReceiveSubscribeAckTask';

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
    let localSdp = '';
    if (this.context.peer && this.context.peer.localDescription) {
      if (this.context.browserBehavior.requiresUnifiedPlanMunging()) {
        localSdp = new DefaultSDP(this.context.peer.localDescription.sdp).withUnifiedPlanFormat()
          .sdp;
      } else {
        localSdp = this.context.peer.localDescription.sdp;
      }
    }

    let frameRate = 0;
    let maxEncodeBitrateKbps = 0;
    if (this.context.videoCaptureAndEncodeParameter) {
      frameRate = this.context.videoCaptureAndEncodeParameter.captureFrameRate();
      maxEncodeBitrateKbps = this.context.videoCaptureAndEncodeParameter.encodeBitrates()[0];
    }

    const isSendingStreams: boolean =
      this.context.videoDuplexMode === SdkStreamServiceType.TX ||
      this.context.videoDuplexMode === SdkStreamServiceType.DUPLEX;
    const subscribe = new SignalingClientSubscribe(
      this.context.meetingSessionConfiguration.credentials.attendeeId,
      localSdp,
      this.context.meetingSessionConfiguration.urls.audioHostURL,
      this.context.realtimeController.realtimeIsLocalAudioMuted(),
      false,
      this.context.videoSubscribeContext.videoSubscriptions(),
      isSendingStreams,
      frameRate,
      maxEncodeBitrateKbps,
      // TODO: handle check-in mode, or remove this param
      true
    );
    this.context.logger.info(`sending subscribe: ${JSON.stringify(subscribe)}`);
    this.context.signalingClient.subscribe(subscribe);

    const subscribeAckFrame = await this.receiveSubscribeAck();
    this.context.logger.info(`got subscribe ack: ${JSON.stringify(subscribeAckFrame)}`);
    this.context.sdpAnswer = subscribeAckFrame.sdpAnswer;

    if (this.context.videoSubscribeContext.videoStreamIndexRef()) {
      this.context.videoSubscribeContext
        .videoStreamIndexRef()
        .integrateSubscribeAckFrame(subscribeAckFrame);
    }
  }

  private receiveSubscribeAck(): Promise<SdkSubscribeAckFrame> {
    return new Promise((resolve, reject) => {
      class Interceptor implements SignalingClientObserver, TaskCanceler {
        constructor(private signalingClient: SignalingClient) {}

        cancel(): void {
          this.signalingClient.removeObserver(this);
          reject(
            new Error(
              `SubscribeAndReceiveSubscribeAckTask got canceled while waiting for SdkSubscribeAckFrame`
            )
          );
        }

        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (
            event.type !== SignalingClientEventType.ReceivedSignalFrame ||
            event.message.type !== SdkSignalFrame.Type.SUBSCRIBE_ACK
          ) {
            return;
          }

          this.signalingClient.removeObserver(this);

          // @ts-ignore: force cast to SdkSubscribeAckFrame
          const subackFrame: SdkSubscribeAckFrame = event.message.suback;
          resolve(subackFrame);
        }
      }

      const interceptor = new Interceptor(this.context.signalingClient);
      this.context.signalingClient.registerObserver(interceptor);
      this.taskCanceler = interceptor;
    });
  }
}
