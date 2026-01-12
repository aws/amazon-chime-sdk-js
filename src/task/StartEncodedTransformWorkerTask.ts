// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import BaseTask from './BaseTask';

/**
 * [[StartEncodedTransformWorkerTask]] starts the encoded transform worker manager.
 */
export default class StartEncodedTransformWorkerTask extends BaseTask {
  protected taskName = 'StartEncodedTransformWorkerTask';

  constructor(private context: AudioVideoControllerState) {
    super(context.logger);
  }

  async run(): Promise<void> {
    if (!this.context.encodedTransformWorkerManager?.isEnabled()) {
      if (this.context.audioProfile?.hasRedundancyEnabled()) {
        this.logger.warn(
          'Audio redundancy requested but encoded transform worker manager not enabled'
        );
      }
      return;
    }

    // If this fails the manager should disable itself, so that when a reconnect is triggered
    // by the exception, it will disable redundancy
    await this.context.encodedTransformWorkerManager.start({
      redundantAudio: !this.context.audioProfile?.hasRedundancyEnabled(),
    });

    if (this.context.audioProfile?.hasRedundancyEnabled()) {
      const redundantAudioEncodeTransformManager = this.context.encodedTransformWorkerManager.redundantAudioEncodeTransformManager();
      if (redundantAudioEncodeTransformManager) {
        this.context.audioVideoController?.addObserver(redundantAudioEncodeTransformManager);
      }
    }
  }
}
