// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import AudioProfile from '../../src/audioprofile/AudioProfile';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('AudioProfile', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  let domMockBuilder: DOMMockBuilder;

  afterEach(() => {
    domMockBuilder.cleanup();
  });

  describe('constructor', () => {
    it('can be constructed correctly in chrome 107 and later', () => {
      const domMockBehavior: DOMMockBehavior = new DOMMockBehavior();
      domMockBehavior.browserName = 'chrome116';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      expect(new AudioProfile().audioBitrateBps).to.equal(null);
      expect(new AudioProfile().hasRedundancyEnabled()).to.equal(true);

      expect(AudioProfile.fullbandSpeechMono().audioBitrateBps).to.equal(40000);
      expect(AudioProfile.fullbandSpeechMono().hasRedundancyEnabled()).to.equal(true);
      expect(AudioProfile.fullbandSpeechMono(false).hasRedundancyEnabled()).to.equal(false);

      expect(AudioProfile.fullbandMusicMono().audioBitrateBps).to.equal(64000);
      expect(AudioProfile.fullbandMusicMono().hasRedundancyEnabled()).to.equal(true);
      expect(AudioProfile.fullbandMusicMono(false).hasRedundancyEnabled()).to.equal(false);

      expect(AudioProfile.fullbandMusicStereo().audioBitrateBps).to.equal(128000);
      expect(AudioProfile.fullbandMusicStereo().hasRedundancyEnabled()).to.equal(true);
      expect(AudioProfile.fullbandMusicStereo(false).hasRedundancyEnabled()).to.equal(false);

      expect(AudioProfile.fullbandMusicStereo().isStereo()).to.equal(true);
      expect(AudioProfile.fullbandMusicMono().isStereo()).to.equal(false);
    });

    it('can be constructed correctly in firefox', () => {
      const domMockBehavior: DOMMockBehavior = new DOMMockBehavior();
      domMockBehavior.browserName = 'firefox';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      expect(new AudioProfile().audioBitrateBps).to.equal(null);
      expect(new AudioProfile().hasRedundancyEnabled()).to.equal(false);

      expect(AudioProfile.fullbandSpeechMono().audioBitrateBps).to.equal(40000);
      expect(AudioProfile.fullbandSpeechMono().hasRedundancyEnabled()).to.equal(false);
      expect(AudioProfile.fullbandSpeechMono(false).hasRedundancyEnabled()).to.equal(false);

      expect(AudioProfile.fullbandMusicMono().audioBitrateBps).to.equal(64000);
      expect(AudioProfile.fullbandMusicMono().hasRedundancyEnabled()).to.equal(false);
      expect(AudioProfile.fullbandMusicMono(false).hasRedundancyEnabled()).to.equal(false);

      expect(AudioProfile.fullbandMusicStereo().audioBitrateBps).to.equal(128000);
      expect(AudioProfile.fullbandMusicStereo().hasRedundancyEnabled()).to.equal(false);
      expect(AudioProfile.fullbandMusicStereo(false).hasRedundancyEnabled()).to.equal(false);

      expect(AudioProfile.fullbandMusicStereo().isStereo()).to.equal(true);
      expect(AudioProfile.fullbandMusicMono().isStereo()).to.equal(false);
    });

    it('can be constructed correctly in safari', () => {
      const domMockBehavior: DOMMockBehavior = new DOMMockBehavior();
      domMockBehavior.browserName = 'safari';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      expect(new AudioProfile().audioBitrateBps).to.equal(null);
      expect(new AudioProfile().hasRedundancyEnabled()).to.equal(true);

      expect(AudioProfile.fullbandSpeechMono().audioBitrateBps).to.equal(40000);
      expect(AudioProfile.fullbandSpeechMono().hasRedundancyEnabled()).to.equal(true);
      expect(AudioProfile.fullbandSpeechMono(false).hasRedundancyEnabled()).to.equal(false);

      expect(AudioProfile.fullbandMusicMono().audioBitrateBps).to.equal(64000);
      expect(AudioProfile.fullbandMusicMono().hasRedundancyEnabled()).to.equal(true);
      expect(AudioProfile.fullbandMusicMono(false).hasRedundancyEnabled()).to.equal(false);

      expect(AudioProfile.fullbandMusicStereo().audioBitrateBps).to.equal(128000);
      expect(AudioProfile.fullbandMusicStereo().hasRedundancyEnabled()).to.equal(true);
      expect(AudioProfile.fullbandMusicStereo(false).hasRedundancyEnabled()).to.equal(false);

      expect(AudioProfile.fullbandMusicStereo().isStereo()).to.equal(true);
      expect(AudioProfile.fullbandMusicMono().isStereo()).to.equal(false);
    });
  });
});
