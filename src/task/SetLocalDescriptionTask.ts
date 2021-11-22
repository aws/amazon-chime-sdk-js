// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import DefaultBrowserBehavior from '../browserbehavior/DefaultBrowserBehavior';
import DefaultSDP from '../sdp/DefaultSDP';
import BaseTask from './BaseTask';

/*
 * [[SetLocalDescriptionTask]] asynchronously calls [[setLocalDescription]] on peer connection.
 */
export default class SetLocalDescriptionTask extends BaseTask {
  protected taskName = 'SetLocalDescriptionTask';

  private cancelPromise: undefined | ((error: Error) => void);

  constructor(private context: AudioVideoControllerState) {
    super(context.logger);
  }

  cancel(): void {
    // Just in case. The baseCancel behavior should prevent this.
    /* istanbul ignore else */
    if (this.cancelPromise) {
      const error = new Error(`canceling ${this.name()}`);
      this.cancelPromise(error);
      delete this.cancelPromise;
    }
  }

  async run(): Promise<void> {
    const peer = this.context.peer;
    const sdpOfferInit = this.context.sdpOfferInit;
    let sdp = sdpOfferInit.sdp;

    if (this.context.browserBehavior.hasChromiumWebRTC()) {
      // This will be negotiatiated with backend, and we will only use it to skip resubscribes
      // if we confirm support/negotiation via `RTCRtpTranceiver.sender.getParams`
      sdp = new DefaultSDP(sdp).withVideoLayersAllocationRtpHeaderExtension().sdp;
    }
    if (new DefaultBrowserBehavior().requiresDisablingH264Encoding()) {
      sdp = new DefaultSDP(sdp).removeH264SupportFromSendSection().sdp;
    }

    this.logger.debug(() => {
      return `local description is >>>${sdp}<<<`;
    });

    const sdpOffer: RTCSessionDescription = {
      type: 'offer',
      sdp: sdp,
      toJSON: null,
    };

    await new Promise<void>(async (resolve, reject) => {
      this.cancelPromise = (error: Error) => {
        reject(error);
      };

      try {
        await peer.setLocalDescription(sdpOffer);
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        delete this.cancelPromise;
      }
    });

    this.context.logger.info('set local description');
  }
}
