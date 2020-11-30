// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import MeetingSessionStatusCode from '../meetingsession/MeetingSessionStatusCode';
import DefaultSDP from '../sdp/DefaultSDP';
import BaseTask from './BaseTask';

/*
 * [[CreateSDPTask]] asynchronously calls [[createOffer]] on peer connection.
 */
export default class CreateSDPTask extends BaseTask {
  protected taskName = 'CreateSDPTask';

  private cancelPromise: (error: Error) => void;

  constructor(private context: AudioVideoControllerState) {
    super(context.logger);
  }

  cancel(): void {
    const error = new Error(`canceling ${this.name()}`);
    this.cancelPromise && this.cancelPromise(error);
  }

  sessionUsesAudio(): boolean {
    return true;
  }

  sessionUsesVideo(): boolean {
    const enabled = true;
    let sending: boolean;
    if (this.context.transceiverController.useTransceivers()) {
      sending = this.context.transceiverController.hasVideoInput();
    } else {
      sending = this.context.videoTileController.hasStartedLocalVideoTile();
    }
    const receiving = !!this.context.videosToReceive && !this.context.videosToReceive.empty();
    const usesVideo = enabled && (sending || receiving);
    this.context.logger.info(
      `uses video: ${usesVideo} (enabled: ${enabled}, sending: ${sending}, receiving: ${receiving})`
    );
    return usesVideo;
  }

  async run(): Promise<void> {
    const offerOptions = {
      offerToReceiveAudio: this.sessionUsesAudio(),
      offerToReceiveVideo: this.sessionUsesVideo(),
    };
    this.logger.info(`peer connection offerOptions: ${JSON.stringify(offerOptions)}`);

    await new Promise<void>(async (resolve, reject) => {
      this.cancelPromise = (error: Error) => {
        reject(error);
      };

      try {
        this.context.sdpOfferInit = await this.context.peer.createOffer(offerOptions);
        this.context.logger.info('peer connection created offer');
        if (this.context.previousSdpOffer) {
          if (
            new DefaultSDP(this.context.sdpOfferInit.sdp).videoSendSectionHasDifferentSSRC(
              this.context.previousSdpOffer
            )
          ) {
            const error = new Error(
              `canceling ${this.name()} due to the meeting status code: ${
                MeetingSessionStatusCode.IncompatibleSDP
              }`
            );
            this.context.previousSdpOffer = null;
            reject(error);
          }
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
}
