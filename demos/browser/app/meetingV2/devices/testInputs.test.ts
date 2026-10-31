// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from 'vitest';

import {
  isTestAudioInput,
  isTestVideoInput,
  SYNTHETIC_VIDEO_INPUTS,
  testAudioInputNames,
} from './testInputs';

// The device factories import the SDK, whose CommonJS bundle does not load under vitest; the
// names and predicates use none of it.
vi.mock('amazon-chime-sdk-js', () => ({}));

describe('testAudioInputNames', () => {
  it('offers No Audio except on Firefox, and the stereo inputs only with the stereo profile', () => {
    expect(testAudioInputNames({ firefox: false, stereo: false })).toEqual([
      'None',
      '440 Hz',
      'Prerecorded Speech',
      'Prerecorded Speech Loop (Mono)',
      'Echo',
      'No Audio',
    ]);
    expect(testAudioInputNames({ firefox: true, stereo: false })).toEqual([
      'None',
      '440 Hz',
      'Prerecorded Speech',
      'Prerecorded Speech Loop (Mono)',
      'Echo',
    ]);
    expect(testAudioInputNames({ firefox: false, stereo: true })).toEqual([
      'None',
      '440 Hz',
      'Prerecorded Speech',
      'Prerecorded Speech Loop (Mono)',
      'Echo',
      'No Audio',
      'L-500Hz R-1000Hz',
      'Prerecorded Speech Loop (Stereo)',
    ]);
  });
});

describe('isTestAudioInput', () => {
  it('matches every test input, including No Audio and the stereo ones, and no device id', () => {
    for (const name of testAudioInputNames({ firefox: false, stereo: true })) {
      expect(isTestAudioInput(name)).toBe(true);
    }
    expect(isTestAudioInput('default')).toBe(false);
    expect(isTestAudioInput('5f2c0a')).toBe(false);
    expect(isTestAudioInput('')).toBe(false);
  });
});

describe('test video inputs', () => {
  it('lists the synthetic cameras and recognises only them', () => {
    expect(SYNTHETIC_VIDEO_INPUTS).toEqual(['None', 'Blue', 'SMPTE Color Bars']);
    expect(isTestVideoInput('Blue')).toBe(true);
    expect(isTestVideoInput('SMPTE Color Bars')).toBe(true);
    expect(isTestVideoInput('None')).toBe(true);
    expect(isTestVideoInput('5f2c0a')).toBe(false);
  });
});
