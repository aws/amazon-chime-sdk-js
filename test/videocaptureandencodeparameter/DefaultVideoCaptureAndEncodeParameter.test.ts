// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import DefaultVideoCaptureAndEncodeParameter from '../../src/videocaptureandencodeparameter/DefaultVideoCaptureAndEncodeParameter';
import VideoCaptureAndEncodeParameter from '../../src/videocaptureandencodeparameter/VideoCaptureAndEncodeParameter';

describe('DefaultVideoCaptureAndEncodeParameter', () => {
  let expect: Chai.ExpectStatic;
  let assert: Chai.AssertStatic;
  let videoEncodeParameter: VideoCaptureAndEncodeParameter;

  beforeEach(() => {
    expect = chai.expect;
    assert = chai.assert;
    videoEncodeParameter = new DefaultVideoCaptureAndEncodeParameter(1280, 720, 30, 2400, false);
  });

  describe('construction', () => {
    it('can be constructed', () => {
      assert.exists(videoEncodeParameter);
    });
  });

  describe('equal', () => {
    it('returns true if two parameters are equal', () => {
      const otherVideoEncodeParameter = new DefaultVideoCaptureAndEncodeParameter(
        1280,
        720,
        30,
        2400,
        false
      );
      expect(videoEncodeParameter.equal(otherVideoEncodeParameter)).to.equal(true);
    });

    it('returns false if two parameters are not equal', () => {
      const otherVideoEncodeParameter = new DefaultVideoCaptureAndEncodeParameter(
        1280,
        720,
        30,
        600,
        false
      );
      expect(videoEncodeParameter.equal(otherVideoEncodeParameter)).to.equal(false);
    });

    it('returns false if two parameters are not equal', () => {
      const otherVideoEncodeParameter = new DefaultVideoCaptureAndEncodeParameter(
        640,
        360,
        30,
        600,
        false
      );
      expect(videoEncodeParameter.equal(otherVideoEncodeParameter)).to.equal(false);
    });
  });

  describe('clone', () => {
    it('returns a clone of parameter', () => {
      const otherVideoEncodeParameter = videoEncodeParameter.clone();
      expect(otherVideoEncodeParameter).to.deep.equal(videoEncodeParameter);
      expect(otherVideoEncodeParameter).to.not.equal(videoEncodeParameter);
    });
  });
});
