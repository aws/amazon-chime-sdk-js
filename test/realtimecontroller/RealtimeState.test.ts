// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import RealtimeState from '../../src/realtimecontroller/RealtimeState';

describe('RealtimeState', () => {
  let expect: Chai.ExpectStatic;

  before(() => {
    expect = chai.expect;
  });

  describe('default values for RealtimeState', () => {
    it('has the expected default values', () => {
      const state = new RealtimeState();
      expect(state.muted).to.be.false;
      expect(state.canUnmute).to.be.true;
      expect(state.audioInput).to.equal(null);
      expect(Object.keys(state.volumeIndicatorCallbacks).length).to.equal(0);
    });
  });
});
