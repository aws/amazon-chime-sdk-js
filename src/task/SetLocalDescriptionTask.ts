// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import DefaultBrowserBehavior from '../browserbehavior/DefaultBrowserBehavior';
import SDP from '../sdp/SDP';
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

    if (this.context.browserBehavior.supportsVideoLayersAllocationRtpHeaderExtension()) {
      // This will be negotiatiated with backend, and we will only use it to skip resubscribes
      // if we confirm support/negotiation via `RTCRtpTranceiver.sender.getParams`
      sdp = new SDP(sdp).withVideoLayersAllocationRtpHeaderExtension(this.context.previousSdpOffer)
        .sdp;
    }
    // We will remove the dependency descriptor RTP header extension after set if this branch is not hit, as
    // browsers will not remove it from the send section. We don't do it here, so that we don't lose track of
    // the header extension IDs being used when we store `this.context.previousSdpOffer`.
    if (
      this.context.browserBehavior.supportsDependencyDescriptorRtpHeaderExtension() &&
      this.context.videoUplinkBandwidthPolicy.wantsVideoDependencyDescriptorRtpHeaderExtension !==
        undefined &&
      this.context.videoUplinkBandwidthPolicy.wantsVideoDependencyDescriptorRtpHeaderExtension()
    ) {
      sdp = new SDP(sdp).withDependencyDescriptorRtpHeaderExtension(this.context.previousSdpOffer)
        .sdp;
    }
    if (new DefaultBrowserBehavior().requiresDisablingH264Encoding()) {
      sdp = new SDP(sdp).removeH264SupportFromSendSection().sdp;
    }

    // The default start bitrate is 300kbps. While this is a reasonable starting point with respect
    // to network adaptation, the encoding bitrate does not adjust as quickly as the estimate, which
    // can quickly max out on a clear network after a few seconds. Thus it will often take 10-25 seconds
    // for the encode bitrate/resolution to reach the intended value. The network adaptation detects issues quick enough
    // that raising it to 1000kbps is not much concern, on most networks the congestion controller
    // will react to network restrictions before the first keyframe is even generated!
    //
    // Note that this is also important with regards to content share with SVC enabled,
    // as we set content hint to `motion` as a workaround for the issue that Chrome cannot enable temporal
    // scalability for screen share https://bugs.chromium.org/p/chromium/issues/detail?id=1433486
    // As a side effect, content share may start at a low resolution and take a long time to adapt,
    // especially when there is limited motion on screen, if we do not set this slightly higher starting
    // bitrate.
    sdp = new SDP(sdp).withStartingVideoSendBitrate(1000).sdp;

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

    if (this.context.audioProfile) {
      sdp = new SDP(sdp).withAudioMaxAverageBitrate(this.context.audioProfile.audioBitrateBps).sdp;
      if (this.context.audioProfile.isStereo()) {
        sdp = new SDP(sdp).withStereoAudio().sdp;
      }

      if (this.context.audioProfile.hasRedundancyEnabled()) {
        const audioPayloadMap = new SDP(sdp).getAudioPayloadTypes();
        /* istanbul ignore else */
        if (
          this.context.transceiverController &&
          this.context.transceiverController.setAudioPayloadTypes
        ) {
          this.context.transceiverController.setAudioPayloadTypes(audioPayloadMap);
        }
      }
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
