// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

// Test that we can import from src, too.
import { isVideoTransformDevice as isVideoTransformDeviceFromSrc } from '../../src';
import Device from '../../src/devicecontroller/Device';
import VideoTransformDevice, {
  isVideoTransformDevice,
} from '../../src/devicecontroller/VideoTransformDevice';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';

class NoOpVideoTransformDevice implements VideoTransformDevice {
  outputMediaStream: MediaStream;
  stop(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  intrinsicDevice(): Promise<Device> {
    throw new Error('Method not implemented.');
  }
  applyProcessors(_mediaStream: MediaStream): Promise<MediaStream> {
    throw new Error('Method not implemented.');
  }
}

describe('VideoTransformDevice', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  describe('isVideoTransformDevice', () => {
    it('matches video', () => {
      const device = new NoOpVideoTransformDevice();

      expect(isVideoTransformDevice(device)).to.be.true;
    });

    it('Rejects intrinsic devices', () => {
      expect(isVideoTransformDevice(null)).to.be.false;
      expect(isVideoTransformDevice('some-id')).to.be.false;
      expect(isVideoTransformDevice({ video: true })).to.be.false;
    });

    it('Rejects arbitrary classes', () => {
      expect(isVideoTransformDevice(new NoOpDebugLogger())).to.be.false;
    });
  });

  describe('re-export', () => {
    expect(isVideoTransformDeviceFromSrc('foo')).to.be.false;
  });
});
