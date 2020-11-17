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
      if (this.context.browserBehavior.requiresUnifiedPlan()) {
        this.context.logger.info('attaching audio track to peer connection (unified-plan)');
        await transceiverController.setAudioInput(audioTracks.length ? audioTracks[0] : null);
      } else {
        this.context.logger.info('attaching audio track to peer connection (plan-b)');
        // @ts-ignore
        const senders = this.context.peer.getSenders();
        audioInput.getAudioTracks().forEach((track: MediaStreamTrack) => {
          if (
            !senders.find((sender: RTCRtpSender) => {
              return sender.track.id === track.id;
            })
          ) {
            // unclear why this does not deal with the case of removing
            // an existing track as we do in attachVideoInput
            // @ts-ignore
            this.context.localAudioSender = this.context.peer.addTrack(track, audioInput);
          }
        });
      }
    } else {
      await transceiverController.setAudioInput(null);
      this.context.logger.warn('no audio track');
    }

    const videoInput = this.context.activeVideoInput;
    if (videoInput) {
      const videoTracks = videoInput.getVideoTracks();
      const videoTrack: MediaStreamTrack | null = videoTracks.length ? videoTracks[0] : null;
      if (this.context.browserBehavior.requiresUnifiedPlan()) {
        this.context.logger.info('attaching video track to peer connection (unified-plan)');
        await transceiverController.setVideoInput(videoTrack);
        if (this.context.enableSimulcast && this.context.videoUplinkBandwidthPolicy) {
          const encodingParam = this.context.videoUplinkBandwidthPolicy.chooseEncodingParameters();
          transceiverController.setEncodingParameters(encodingParam);
        }
      } else {
        this.context.logger.info('attaching video track to peer connection (plan-b)');
        // @ts-ignore
        const senders = this.context.peer.getSenders();
        if (
          !senders.find((sender: RTCRtpSender) => {
            return sender.track && sender.track.id === videoTracks[0].id;
          })
        ) {
          if (this.context.localVideoSender) {
            // @ts-ignore
            this.context.peer.removeTrack(this.context.localVideoSender);
            this.context.localVideoSender = null;
          }
          this.context.localVideoSender = this.context.peer.addTrack(videoTracks[0], videoInput);
        }
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
      if (this.context.localVideoSender) {
        this.context.logger.info('removing track from peer');
        // @ts-ignore
        this.context.peer.removeTrack(this.context.localVideoSender);
        this.context.localVideoSender = null;
      }
    }

    this.context.videoSubscriptions = transceiverController.updateVideoTransceivers(
      this.context.videoStreamIndex,
      this.context.videosToReceive
    );
  }
}
