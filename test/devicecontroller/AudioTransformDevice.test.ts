// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

// Test that we can import from src, too.
import { isAudioTransformDevice as isAudioTransformDeviceFromSrc } from '../../src';
import { isAudioTransformDevice } from '../../src/devicecontroller/AudioTransformDevice';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import {
  MockNodeTransformDevice,
  MockPassthroughTransformDevice,
  MockThrowingTransformDevice,
} from '../transformdevicemock/MockTransformDevice';

describe('AudioTransformDevice', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  describe('isAudioTransformDevice', () => {
    it('matches audio', () => {
      const device = new MockPassthroughTransformDevice(null);

      expect(isAudioTransformDevice(device)).to.be.true;
    });

    it('Rejects intrinsic devices', () => {
      expect(isAudioTransformDevice(null)).to.be.false;
      expect(isAudioTransformDevice('some-id')).to.be.false;
      expect(isAudioTransformDevice({ audio: true })).to.be.false;
    });

    it('Rejects arbitrary classes', () => {
      expect(isAudioTransformDevice(new NoOpDebugLogger())).to.be.false;
    });

    it('Accepts the correct interface for all of our mocks', () => {
      expect(isAudioTransformDevice(new MockThrowingTransformDevice(null))).to.be.true;
      expect(isAudioTransformDevice(new MockPassthroughTransformDevice(null))).to.be.true;
      expect(isAudioTransformDevice(new MockNodeTransformDevice(null))).to.be.true;
    });
  });

  describe('re-export', () => {
    expect(isAudioTransformDeviceFromSrc('foo')).to.be.false;
  });
});
