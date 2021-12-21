// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import AudioProfile from '../../src/audioprofile/AudioProfile';

describe('AudioProfile', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  describe('constructor', () => {
    it('can be constructed with a preset', () => {
      expect(new AudioProfile().audioBitrateBps).to.equal(null);
      expect(AudioProfile.fullbandSpeechMono().audioBitrateBps).to.equal(40000);
      expect(AudioProfile.fullbandMusicMono().audioBitrateBps).to.equal(64000);
      expect(AudioProfile.fullbandMusicStereo().audioBitrateBps).to.equal(128000);
      expect(AudioProfile.fullbandMusicStereo().isStereo()).to.equal(true);
      expect(AudioProfile.fullbandMusicMono().isStereo()).to.equal(false);
    });
  });
});
