// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import { SdkStreamServiceType } from '../signalingprotocol/SignalingProtocol.js';
import BaseTask from './BaseTask';

/**
 * [[ReceiveVideoInputTask]] acquires a video input from [[DeviceController]].
 */
export default class ReceiveVideoInputTask extends BaseTask {
  protected taskName = 'ReceiveVideoInputTask';

  constructor(private context: AudioVideoControllerState) {
    super(context.logger);
  }

  async run(): Promise<void> {
    // TODO: move videoDuplexMode and videoCaptureAndEncodeParameters to video tile controller
    const receiveEnabled =
      this.context.videoDuplexMode === SdkStreamServiceType.RX ||
      this.context.videoDuplexMode === SdkStreamServiceType.DUPLEX;
    if (this.context.videoTileController.hasStartedLocalVideoTile()) {
      this.context.videoDuplexMode = receiveEnabled
        ? SdkStreamServiceType.DUPLEX
        : SdkStreamServiceType.TX;
    } else {
      this.context.videoDuplexMode = receiveEnabled ? SdkStreamServiceType.RX : 0;
    }
    this.context.videoCaptureAndEncodeParameter = this.context.videoUplinkBandwidthPolicy.chooseCaptureAndEncodeParameters();

    if (!this.context.videoTileController.hasStartedLocalVideoTile()) {
      this.context.logger.info('has not started local video tile');
      if (this.context.activeVideoInput) {
        this.stopVideoInput();
      }
      return;
    }

    // TODO: bind after ICE connection started in case of a failure to resubscribe
    //       or perform error handling to unbind video stream.
    const localTile = this.context.videoTileController.getLocalVideoTile();
    let videoInput: MediaStream | null = null;
    try {
      videoInput = await this.context.mediaStreamBroker.acquireVideoInputStream();
    } catch (error) {
      this.context.logger.warn('could not acquire video input from current device');
    }
    if (this.context.enableSimulcast) {
      const encodingParams = this.context.videoUplinkBandwidthPolicy.chooseEncodingParameters();
      this.context.videoStreamIndex.integrateUplinkPolicyDecision(
        Array.from(encodingParams.values())
      );
    }

    this.context.activeVideoInput = videoInput;
    if (videoInput) {
      const videoTracks = videoInput.getVideoTracks();
      const attendeeId = this.context.meetingSessionConfiguration.credentials.attendeeId;
      const trackSettings = videoTracks[0].getSettings();
      if (this.context.enableSimulcast) {
        const constraint = this.context.videoUplinkBandwidthPolicy.chooseMediaTrackConstraints();
        this.context.logger.info(`simulcast: choose constraint ${JSON.stringify(constraint)}`);
        try {
          await videoTracks[0].applyConstraints(constraint);
        } catch (error) {
          this.context.logger.info('simulcast: pass video without more constraint');
        }
      }

      const externalUserId = this.context.audioVideoController.configuration.credentials
        .externalUserId;
      localTile.bindVideoStream(
        attendeeId,
        true,
        videoInput,
        trackSettings.width,
        trackSettings.height,
        null,
        externalUserId
      );

      for (let i = 0; i < videoTracks.length; i++) {
        const track = videoTracks[i];
        this.logger.info(`using video device label=${track.label} id=${track.id}`);
        this.context.videoDeviceInformation['current_camera_name'] = track.label;
        this.context.videoDeviceInformation['current_camera_id'] = track.id;
      }
    }
  }

  private stopVideoInput(): void {
    this.context.mediaStreamBroker.releaseMediaStream(this.context.activeVideoInput);
    this.context.activeVideoInput = null;
  }
}
