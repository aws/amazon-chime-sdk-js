// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
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
    const sending = this.context.videoTileController.hasStartedLocalVideoTile();
    const receiving =
      !!this.context.videoSubscribeContext &&
      this.context.videoSubscribeContext.wantsReceiveVideo();
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
    this.logger.info(`offerOptions: ${JSON.stringify(offerOptions)}`);

    await new Promise<void>(async (resolve, reject) => {
      this.cancelPromise = (error: Error) => {
        reject(error);
      };

      try {
        this.context.sdpOfferInit = await this.context.peer.createOffer(offerOptions);
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    this.context.logger.info(`created offer ${JSON.stringify(this.context.sdpOfferInit)}`);
  }
}
