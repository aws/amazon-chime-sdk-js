// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import VideoLogEvent from '../statscollector/VideoLogEvent';
import BaseTask from './BaseTask';

/*
 * [[AttachMediaInputTask]] adds audio and video input to peer connection.
 */
export default class AttachMediaInputTask extends BaseTask {
  protected taskName = 'AttachMediaInputTask';

  constructor(private context: AudioVideoControllerState) {
    super(context.logger);
  }

  async run(): Promise<void> {
    const transceiverController = this.context.transceiverController;
    transceiverController.setPeer(this.context.peer);
    transceiverController.setupLocalTransceivers();

    const audioInput = this.context.activeAudioInput;

    if (audioInput) {
      const audioTracks = audioInput.getAudioTracks();
      this.context.logger.info('attaching audio track to peer connection');
      await transceiverController.setAudioInput(audioTracks.length ? audioTracks[0] : null);
    } else {
      await transceiverController.setAudioInput(null);
      this.context.logger.info('no audio track');
    }

    const videoInput = this.context.activeVideoInput;
    if (videoInput) {
      const videoTracks = videoInput.getVideoTracks();
      const videoTrack: MediaStreamTrack | null = videoTracks.length ? videoTracks[0] : null;
      this.context.logger.info('attaching video track to peer connection');
      await transceiverController.setVideoInput(videoTrack);
      if (this.context.enableSimulcast && this.context.videoUplinkBandwidthPolicy) {
        const encodingParam = this.context.videoUplinkBandwidthPolicy.chooseEncodingParameters();
        transceiverController.setEncodingParameters(encodingParam);
      }
      if (videoTrack) {
        this.context.statsCollector.logVideoEvent(
          VideoLogEvent.InputAttached,
          this.context.videoDeviceInformation
        );
        this.context.videoInputAttachedTimestampMs = Date.now();
      }
    } else {
      await transceiverController.setVideoInput(null);
      this.context.logger.info('no video track');
    }

    this.context.videoSubscriptions = transceiverController.updateVideoTransceivers(
      this.context.videoStreamIndex,
      this.context.videosToReceive
    );
  }
}
