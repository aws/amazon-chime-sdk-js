// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import DefaultBrowserBehavior from '../browserbehavior/DefaultBrowserBehavior';
import DefaultSDP from '../sdp/DefaultSDP';
import BaseTask from './BaseTask';

/*
 * [[SetRemoteDescriptionTask]] asynchronously calls [[setRemoteDescription]] on the
 * peer connection and then waits for the tracks to be added and for the ICE connection
 * to complete.
 */
export default class SetRemoteDescriptionTask extends BaseTask {
  protected taskName = 'SetRemoteDescriptionTask';

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
    sdp = new DefaultSDP(sdp).withoutServerReflexiveCandidates().sdp;
    if (this.context.audioProfile) {
      sdp = new DefaultSDP(sdp).withAudioMaxAverageBitrate(
        this.context.audioProfile.audioBitrateBps
      ).sdp;
    }
    if (!this.context.browserBehavior.requiresUnifiedPlan()) {
      // Under Plan B if our offer has video, but we're not going to subscribe to
      // any videos, ensure that the answer has video (marked inactive). If
      // it doesn't, WebRTC will reject the SDP answer. This happens on Chrome
      // when going from receiving one video to zero videos. The server does not
      // provide a video m-line when there are no videos available under Plan B,
      // thus we need to synthesize a video m-line by copying the one from the offer.
      this.logger.info('checking for no videos (plan-b)');
      if (this.context.videosToReceive.empty() && this.context.peer.remoteDescription) {
        this.logger.info('have no videos and have remote description (plan-b)');
        const sdpInactiveVideoOffer = this.context.peer.localDescription.sdp;
        const sdpInactiveVideoAnswer = sdp;
        let updatedAnswer: string = sdpInactiveVideoAnswer;
        const offer = new DefaultSDP(sdpInactiveVideoOffer);
        if (offer.hasVideo()) {
          this.logger.info(`offer has video (plan-b): >>>${offer.sdp}<<<`);
          const answer = new DefaultSDP(sdpInactiveVideoAnswer);
          this.logger.info(`existing answer (plan-b): >>>${answer.sdp}<<<`);
          if (!answer.hasVideo()) {
            this.logger.info(
              `copying inactive video from offer into answer (plan-b); sdp answer before is >>>${sdpInactiveVideoAnswer}<<<`
            );
            updatedAnswer = answer.copyVideo(sdpInactiveVideoOffer).sdp;
          }
        }
        sdp = updatedAnswer;
      }
    }

    if (new DefaultBrowserBehavior().requiresSortCodecPreferencesForSdpAnswer()) {
      sdp = new DefaultSDP(sdp).preferH264IfExists().sdp;
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
        this.logger.info('set remote description, waiting for ICE connection');
        checkConnectionCompleted();
      } catch (err) {
        reject(err);
      }
    });
  }
}
