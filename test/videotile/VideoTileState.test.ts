// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import VideoTileState from '../../src/videotile/VideoTileState';

describe('VideoTileState', () => {
  let assert: Chai.AssertStatic;
  let expect: Chai.ExpectStatic;

  before(() => {
    assert = chai.assert;
    expect = chai.expect;
  });

  describe('construction', () => {
    it('can be constructed', () => {
      assert.exists(new VideoTileState());
    });
  });

  describe('clone', () => {
    it('returns a copy', () => {
      const state = new VideoTileState();
      state.streamId = 255;
      const copy = state.clone();
      expect(copy).be.deep.equal(state);
      state.tileId = 5;
      expect(copy).not.deep.equal(state);
    });
  });
});
