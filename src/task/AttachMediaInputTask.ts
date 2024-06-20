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

    this.setAudioCodecPreferences();

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
      }
    } else {
      await transceiverController.setVideoInput(null);
      this.context.logger.info('no video track');
    }

    this.context.videoSubscriptions = transceiverController.updateVideoTransceivers(
      this.context.videoStreamIndex,
      this.context.videosToReceive
    );
    // This will cache the current index so that we maintain the values over the course of the subscribe.
    this.context.videoStreamIndex.subscribeFrameSent();
  }

  private setAudioCodecPreferences(): void {
    const supportsSetCodecPreferences =
      window.RTCRtpTransceiver && 'setCodecPreferences' in window.RTCRtpTransceiver.prototype;
    const enableAudioRedundancy = this.context.audioProfile.hasRedundancyEnabled();
    /* istanbul ignore if */
    if (!supportsSetCodecPreferences) {
      this.context.logger.warn(`Setting codec preferences not supported`);
      return;
    }
    const audioTransceiver = this.context.transceiverController.localAudioTransceiver();
    const { codecs } = RTCRtpSender.getCapabilities('audio');
    this.context.logger.debug(`Available audio codecs ${JSON.stringify(codecs, null, 4)}`);
    const redCodecIndex = codecs.findIndex(c => c.mimeType === 'audio/red');
    /* istanbul ignore if */
    if (!audioTransceiver) {
      this.context.logger.error(`audio transceiver is null`);
      return;
    }
    if (redCodecIndex >= 0) {
      const redCodec = codecs[redCodecIndex];
      codecs.splice(redCodecIndex, 1);
      if (enableAudioRedundancy) {
        // Add to the beginning of the codec list to
        // signify that this is the preferred codec.
        // Media backend enables RED only if the preference
        // for RED is highest.
        codecs.unshift(redCodec);
        this.context.logger.info('audio/red set as preferred codec');
      } else {
        this.context.logger.info('audio/red removed from preferred codec');
      }
      audioTransceiver.setCodecPreferences(codecs);
      return;
    }
    this.context.logger.info('audio/red codec not supported');
  }
}
