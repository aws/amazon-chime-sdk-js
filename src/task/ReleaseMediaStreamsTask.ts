// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import BaseTask from './BaseTask';

export default class ReleaseMediaStreamsTask extends BaseTask {
  protected taskName = 'ReleaseMediaStreamsTask';

  constructor(private context: AudioVideoControllerState) {
    super(context.logger);
  }

  async run(): Promise<void> {
    if (!this.context.mediaStreamBroker) {
      return;
    }

    // This should really be a _device deselection_ operation,
    // allowing the device controller to clean up any selected transform
    // device or other resources.
    //
    // We can't fix it within the current API because CSST only knows about
    // `MediaStreamBroker`, not about `DeviceController` — it only knows how
    // to release media streams that are tracked in the
    // `AudioVideoControllerState`, not how to unselect a device.
    //
    // The issue here is that we now work with much more than streams, and
    // this API hasn't kept pace with the complexity of the rest of the SDK.
    //
    // It's currently up to the developer's application to manage which device
    // is currently selected and `DDC` has to figure out from the stream
    // passed here which device to clean up.
    //
    // This can be addressed in a future v3.0.

    try {
      this.context.mediaStreamBroker.releaseMediaStream(this.context.activeAudioInput);
      this.context.activeAudioInput = null;
      this.context.mediaStreamBroker.releaseMediaStream(this.context.activeVideoInput);
      this.context.activeVideoInput = null;
      this.context.realtimeController.realtimeSetLocalAudioInput(null);
    } catch (e) {
      this.context.logger.error(`Failed to release media streams: ${e}`);
    }
  }
}
