// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import BaseTask from './BaseTask';

/**
 * [[ReceiveAudioInputTask]] acquires an audio input.
 */
export default class ReceiveAudioInputTask extends BaseTask {
  protected taskName = 'ReceiveAudioInputTask';

  constructor(private context: AudioVideoControllerState) {
    super(context.logger);
  }

  async run(): Promise<void> {
    if (!this.context.meetingSessionConfiguration?.urls?.audioHostURL) {
      this.context.logger.info('No audio connection: not acquiring audio input');
      return;
    }

    if (this.context.activeAudioInput) {
      this.context.logger.info('an active audio input exists');
      return;
    }
    let audioInput: MediaStream | undefined;
    try {
      audioInput = await this.context.mediaStreamBroker.acquireAudioInputStream();
    } catch (error) {
      this.context.logger.warn('could not acquire audio input from current device');
    }

    if (audioInput) {
      this.context.activeAudioInput = audioInput;
      this.context.realtimeController.realtimeSetLocalAudioInput(audioInput);
    } else {
      this.context.logger.warn('an audio input is not available');
    }
  }
}
