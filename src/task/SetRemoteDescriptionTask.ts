// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import DefaultModality from '../modality/DefaultModality';
import SDP from '../sdp/SDP';
import VideoCodecCapability from '../sdp/VideoCodecCapability';
import BaseTask from './BaseTask';

/*
 * [[SetRemoteDescriptionTask]] asynchronously calls [[setRemoteDescription]] on the
 * peer connection and then waits for the tracks to be added and for the ICE connection
 * to complete.
 */
export default class SetRemoteDescriptionTask extends BaseTask {
  protected taskName = 'SetRemoteDescriptionTask';

  // Chromium browsers only implement simulcast for these codecs.
  private static SIMULCAST_CAPABLE_CODEC_NAMES = [
    VideoCodecCapability.h264ConstrainedBaselineProfile().codecName,
    VideoCodecCapability.vp8().codecName,
  ];

  private cancelICEPromise: () => void;

  constructor(private context: AudioVideoControllerState) {
    super(context.logger);
  }

  cancel(): void {
    if (this.cancelICEPromise) {
      this.cancelICEPromise();
    }
  }

  async run(): Promise<void> {
    const peer = this.context.peer;
    if (!peer) {
      this.logAndThrow('session does not have peer connection; bypass set remote description');
    }

    let sdp = this.context.sdpAnswer;
    sdp = new SDP(sdp).withoutServerReflexiveCandidates().sdp;
    if (this.context.audioProfile) {
      sdp = new SDP(sdp).withAudioMaxAverageBitrate(this.context.audioProfile.audioBitrateBps).sdp;
      if (this.context.audioProfile.isStereo()) {
        sdp = new SDP(sdp).withStereoAudio().sdp;
      }
    }

    if (
      this.context.videoSendCodecPreferences !== undefined &&
      this.context.videoSendCodecPreferences.length > 0
    ) {
      sdp = new SDP(sdp).withVideoSendCodecPreferences(
        this.context.meetingSupportedVideoSendCodecPreferences !== undefined
          ? this.context.meetingSupportedVideoSendCodecPreferences
          : this.context.videoSendCodecPreferences
      ).sdp;
    }
    this.context.prioritizedSendVideoCodecCapabilities = new SDP(
      sdp
    ).prioritizedSendVideoCodecCapabilities();
    const previousVideoSendCodec = this.context.currentVideoSendCodec;
    this.context.currentVideoSendCodec =
      this.context.prioritizedSendVideoCodecCapabilities.length > 0
        ? this.context.prioritizedSendVideoCodecCapabilities[0]
        : undefined;

    // The negotiated codec can differ from the first configured send preference, e.g. when a
    // preference is dropped by the intersection with the meeting's supported receive codecs. If
    // it does not support simulcast, the higher simulcast layers will never transmit. Only log on
    // a codec change so renegotiations do not repeat this.
    if (
      this.context.enableSimulcast &&
      this.context.currentVideoSendCodec !== undefined &&
      !this.context.currentVideoSendCodec.equals(previousVideoSendCodec) &&
      !SetRemoteDescriptionTask.SIMULCAST_CAPABLE_CODEC_NAMES.includes(
        this.context.currentVideoSendCodec.codecName
      )
    ) {
      this.logger.warn(
        `Simulcast is enabled but the negotiated video send codec ${this.context.currentVideoSendCodec.codecName} does not support simulcast, so only the lowest layer will transmit. Prefer H.264 or VP8 to use simulcast, or use SVC instead.`
      );
    }

    const mediaStream = this.context.activeVideoInput;
    if (mediaStream !== undefined) {
      const attendeeId = this.context.audioVideoController.configuration.credentials.attendeeId;
      const isContent = new DefaultModality(attendeeId).hasModality(
        DefaultModality.MODALITY_CONTENT
      );
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (isContent) {
        if (
          this.context.currentVideoSendCodec?.codecName === VideoCodecCapability.av1Main().codecName
        ) {
          // Based on our experiments: "text" contentHint gives good coding performance for content share using AV1
          // @ts-ignore
          videoTrack.contentHint = 'text';
          this.logger.info(`Setting content hint to text for AV1, attendee: ${attendeeId}`);
        }
      }
    }

    this.logger.info(`processed remote description is >>>${sdp}<<<`);
    const remoteDescription: RTCSessionDescription = {
      type: 'answer',
      sdp: sdp,
      toJSON: null,
    };

    try {
      await this.createICEConnectionCompletedPromise(remoteDescription);
    } catch (err) {
      throw err;
    }
  }

  private createICEConnectionCompletedPromise(
    remoteDescription: RTCSessionDescription
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const checkConnectionCompleted = (): void => {
        if (
          this.context.peer.iceConnectionState === 'connected' ||
          this.context.peer.iceConnectionState === 'completed'
        ) {
          this.context.peer.removeEventListener(
            'iceconnectionstatechange',
            checkConnectionCompleted
          );
          resolve();
        }
      };

      this.cancelICEPromise = () => {
        if (this.context.peer) {
          this.context.peer.removeEventListener(
            'iceconnectionstatechange',
            checkConnectionCompleted
          );
        }
        reject(new Error(`${this.name()} got canceled while waiting for the ICE connection state`));
      };

      this.context.peer.addEventListener('iceconnectionstatechange', checkConnectionCompleted);

      try {
        await this.context.peer.setRemoteDescription(remoteDescription);
        this.context.meetingSessionTimingManager?.onSetRemoteDescription();
        this.logger.info('set remote description, waiting for ICE connection');
        checkConnectionCompleted();
      } catch (err) {
        reject(err);
      }
    });
  }
}
