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
    if (this.context.activeAudioInput) {
      this.context.logger.info(`an active audio input exists`);
      return;
    }
    let audioInput: MediaStream | null = null;
    try {
      audioInput = await this.context.mediaStreamBroker.acquireAudioInputStream();
    } catch (error) {
      this.context.logger.warn('could not acquire audio input from current device');
    }

    if (audioInput) {
      this.context.activeAudioInput = audioInput;
      this.context.realtimeController.realtimeSetLocalAudioInput(audioInput);

      const audioTracks = audioInput.getAudioTracks();
      for (let i = 0; i < audioTracks.length; i++) {
        const track = audioTracks[i];
        this.logger.info(`using audio device label=${track.label} id=${track.id}`);
        this.context.audioDeviceInformation['current_mic_name'] = track.label;
        this.context.audioDeviceInformation['current_mic_id'] = track.id;
        this.context.audioDeviceInformation['is_default_input_device'] =
          track.label.indexOf('Default') !== -1 || track.label.indexOf('default') !== -1
            ? 'true'
            : 'false';
      }
    } else {
      this.context.logger.warn('an audio input is not available');
    }
  }
}
