// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { AudioVideoFacade, DefaultDeviceController, Device, Logger } from 'amazon-chime-sdk-js';

import {
  AudioBufferMediaStreamProvider,
  SynthesizedStereoMediaStreamProvider,
} from '../media/DemoMediaStreamProviders';
import SyntheticVideoDeviceFactory from '../media/SyntheticVideoDeviceFactory';

// Menu item ids are built from these names, and the integration tests click them by id.
const SYNTHETIC_AUDIO_INPUTS = [
  'None',
  '440 Hz',
  'Prerecorded Speech',
  'Prerecorded Speech Loop (Mono)',
  'Echo',
];
const SYNTHETIC_STEREO_AUDIO_INPUTS = ['L-500Hz R-1000Hz', 'Prerecorded Speech Loop (Stereo)'];
export const SYNTHETIC_VIDEO_INPUTS = ['None', 'Blue', 'SMPTE Color Bars'];

export function testAudioInputNames(options: { firefox: boolean; stereo: boolean }): string[] {
  const inputs = [...SYNTHETIC_AUDIO_INPUTS];
  if (!options.firefox) {
    // Firefox always generates (silent) audio packets, so "No Audio" cannot be emulated there.
    inputs.push('No Audio');
  }
  if (options.stereo) {
    inputs.push(...SYNTHETIC_STEREO_AUDIO_INPUTS);
  }
  return inputs;
}

export function isTestAudioInput(value: string): boolean {
  return (
    SYNTHETIC_AUDIO_INPUTS.includes(value) ||
    SYNTHETIC_STEREO_AUDIO_INPUTS.includes(value) ||
    value === 'No Audio'
  );
}

export function isTestVideoInput(value: string): boolean {
  return SYNTHETIC_VIDEO_INPUTS.includes(value);
}

/** The device for a microphone selection; a real device id is returned as it is. */
export async function testAudioDevice(
  value: string,
  audioVideo: AudioVideoFacade,
  logger: Logger
): Promise<Device | null> {
  switch (value) {
    case '440 Hz':
      return DefaultDeviceController.synthesizeAudioDevice(440);
    case 'L-500Hz R-1000Hz':
      return new SynthesizedStereoMediaStreamProvider(500, 1000).getMediaStream();
    case 'Prerecorded Speech':
      return new AudioBufferMediaStreamProvider('audio_file').getMediaStream();
    case 'Prerecorded Speech Loop (Mono)':
      return new AudioBufferMediaStreamProvider('audio_file', true).getMediaStream();
    case 'Prerecorded Speech Loop (Stereo)':
      return new AudioBufferMediaStreamProvider('stereo_audio_file', true).getMediaStream();
    case 'Echo':
      return createEchoDevice(audioVideo, logger);
    case 'No Audio':
      // An unconnected destination generates no packets; used to test sendingAudioFailed events.
      return DefaultDeviceController.getAudioContext().createMediaStreamDestination().stream;
    case 'None':
    case '':
      return null;
    default:
      return value;
  }
}

/** Feed the meeting's own audio back in at 80 % volume. */
async function createEchoDevice(
  audioVideo: AudioVideoFacade,
  logger: Logger
): Promise<Device | null> {
  try {
    const speakerStream = await audioVideo.getCurrentMeetingAudioStream();
    if (!speakerStream) {
      return null;
    }
    const audioContext = DefaultDeviceController.getAudioContext();
    const destination = audioContext.createMediaStreamDestination();
    const source = audioContext.createMediaStreamSource(speakerStream);
    const delay = audioContext.createDelay(0.05);
    const gain = audioContext.createGain();
    gain.gain.value = 0.8;
    source.connect(delay);
    delay.connect(gain);
    gain.connect(destination);
    return destination.stream;
  } catch {
    logger.error('[DEMO] Error creating Echo');
    return null;
  }
}

/** The device for a camera selection; a real device id is returned as it is. */
export function testVideoDevice(value: string): Device {
  if (value === 'Blue') {
    return SyntheticVideoDeviceFactory.create('blue') ?? value;
  }
  if (value === 'SMPTE Color Bars') {
    return SyntheticVideoDeviceFactory.create('smpte') ?? value;
  }
  return value;
}
