// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import BaseTask from './BaseTask';

/*
 * [[CreateSDPTask]] asynchronously calls [[createOffer]] on peer connection.
 */
export default class CreateSDPTask extends BaseTask {
  protected taskName = 'CreateSDPTask';

  constructor(private context: AudioVideoControllerState) {
    super(context.logger);
  }

  sessionUsesAudio(): boolean {
    return true;
  }

  sessionUsesVideo(): boolean {
    const enabled = true;
    const sending = this.context.videoTileController.hasStartedLocalVideoTile();
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
    this.logger.info(`offerOptions: ${JSON.stringify(offerOptions)}`);
    this.context.sdpOfferInit = await this.context.peer.createOffer(offerOptions);
    this.context.logger.info(`created offer ${JSON.stringify(this.context.sdpOfferInit)}`);
  }
}
