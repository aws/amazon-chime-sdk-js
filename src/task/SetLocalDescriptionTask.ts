// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import BaseTask from './BaseTask';

/*
 * [[SetLocalDescriptionTask]] asynchronously calls [[setLocalDescription]] on peer connection.
 */
export default class SetLocalDescriptionTask extends BaseTask {
  protected taskName = 'SetLocalDescriptionTask';

  private cancelPromise: (error: Error) => void;

  constructor(private context: AudioVideoControllerState) {
    super(context.logger);
  }

  cancel(): void {
    const error = new Error(`canceling ${this.name()}`);
    this.cancelPromise && this.cancelPromise(error);
  }

  async run(): Promise<void> {
    const peer = this.context.peer;
    const sdpOffer = this.context.sdpOfferInit;
    this.logger.debug(() => {
      return `local description is >>>${sdpOffer.sdp}<<<`;
    });

    await new Promise<void>(async (resolve, reject) => {
      this.cancelPromise = (error: Error) => {
        reject(error);
      };

      try {
        await peer.setLocalDescription(sdpOffer);
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    this.context.logger.info('set local description');
  }
}
