// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import BaseTask from './BaseTask';

/**
 * [[ReleaseMediaInputTask]] releases audio and video inputs.
 */
export default class ReleaseMediaInputTask extends BaseTask {
  protected taskName = 'ReleaseMediaInputTask';

  constructor(private context: AudioVideoControllerState) {
    super(context.logger);
  }

  async run(): Promise<void> {
    this.context.mediaStreamBroker.releaseMediaStream(this.context.activeAudioInput);
    this.context.activeAudioInput = null;
    this.context.mediaStreamBroker.releaseMediaStream(this.context.activeVideoInput);
    this.context.activeVideoInput = null;
    this.context.realtimeController.realtimeSetLocalAudioInput(null);
  }
}
