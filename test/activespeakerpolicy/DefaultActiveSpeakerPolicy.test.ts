// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import DefaultActiveSpeakerPolicy from '../../src/activespeakerpolicy/DefaultActiveSpeakerPolicy';

describe('DefaultActiveSpeakerPolicy', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  describe('construction', () => {
    it('can be constructed', () => {
      const policy = new DefaultActiveSpeakerPolicy();
      expect(policy).to.not.equal(null);
    });

    it('can be constructed with different parameters', () => {
      const policy = new DefaultActiveSpeakerPolicy(0.1, 0.9);
      expect(policy).to.not.equal(null);
    });

    it('can be constructed with optional parameters', () => {
      const policy = new DefaultActiveSpeakerPolicy(0.1, 0.9, 0.5, 0.5);
      expect(policy).to.not.equal(null);
    });
  });

  describe('calculateScore', () => {
    it('can calculate active speaker score', () => {
      const policy = new DefaultActiveSpeakerPolicy();
      const attendeeId = 'foo-attendeeId';
      const activeScore = policy.calculateScore(attendeeId, 0, false);
      expect(activeScore).to.equal(0);
    });

    it('can return active speaker score if larger than threshold', () => {
      const policy = new DefaultActiveSpeakerPolicy();
      const attendeeId = 'foo-attendeeId';
      policy.calculateScore(attendeeId, 10, false);
      const activeScore = policy.calculateScore(attendeeId, 10, false);
      expect(activeScore).to.not.equal(0);
    });

    it('can set volume as 0 if muted', () => {
      const policy = new DefaultActiveSpeakerPolicy();
      const attendeeId = 'foo-attendeeId';
      const activeScore = policy.calculateScore(attendeeId, 1, true);
      expect(activeScore).to.equal(0);
    });
  });

  describe('prioritizeVideoSendBandwidthForActiveSpeaker', () => {
    it('will return true', () => {
      const policy = new DefaultActiveSpeakerPolicy();
      expect(policy.prioritizeVideoSendBandwidthForActiveSpeaker()).to.equal(true);
    });
  });
});
