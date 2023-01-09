// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import MLVideoFxConfig from '../../src/mlvideofx/MLVideoFxConfig';
import MLVideoFxDriver from '../../src/mlvideofx/MLVideoFxDriver';
import MLVideoFxTransformDevice from '../../src/mlvideofx/MLVideoFxTransformDevice';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('MLVideoFxTransformDevice', () => {
  const assert: Chai.AssertStatic = chai.assert;
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpDebugLogger();
  let domMockBehavior: DOMMockBehavior;
  let domMockBuilder: DOMMockBuilder;
  let mockVideoStream: MediaStream;
  let mockVideoTrack: MediaStreamTrack;
  let device: MLVideoFxTransformDevice;
  let driver: MLVideoFxDriver;
  const config: MLVideoFxConfig = {
    blueShiftEnabled: false,
    redShiftEnabled: false,
  };

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    domMockBehavior.createElementCaptureStream = new MediaStream();
    mockVideoStream = new MediaStream();
    // @ts-ignore
    mockVideoStream.id = 'sample';
    // @ts-ignore
    mockVideoTrack = new MediaStreamTrack('test', 'video');
    mockVideoStream.addTrack(mockVideoTrack);
    // @ts-ignore
    driver = new MLVideoFxDriver(logger, config);
    device = new MLVideoFxTransformDevice(
      logger,
      'test',
      // @ts-ignore
      driver
    );
  });

  afterEach(() => {
    device.stop();
    domMockBuilder.cleanup();
  });

  describe('construction', () => {
    it('can be constructed', () => {
      const config: MLVideoFxConfig = {
        blueShiftEnabled: false,
        redShiftEnabled: false,
      };
      // @ts-ignore
      const driver_construct = new MLVideoFxDriver(logger, config);
      const device_construct = new MLVideoFxTransformDevice(
        logger,
        'test',
        // @ts-ignore
        driver
      );
      // @ts-ignore
      assert.exists(device_construct);
    });
  });

  describe('getter outputMediaStream', () => {
    it('returns dummy inactive MediaStream if device is not started', async () => {
      const stream = device.outputMediaStream;
      expect(stream.active).to.be.false;
    });
  });

  describe('transformStream', () => {
    it('set inputMediaStream to null', async () => {
      await device.transformStream(null);
      // @ts-ignore
      expect(device.inputMediaStream).to.be.null;
    });

    it('can start stream on device', async () => {
      domMockBehavior.createElementCaptureStream = mockVideoStream;
      await device.transformStream(mockVideoStream);

      assert.exists(device.outputMediaStream);

      await device.stop();
      expect(device.outputMediaStream.active).to.be.false;
    });

    it('can start processing on different media stream', async () => {
      domMockBehavior.createElementCaptureStream = mockVideoStream;
      const outputStream = await device.transformStream(mockVideoStream);

      const newStream = new MediaStream();
      const outputStream2 = await device.transformStream(newStream);
      await device.stop();
      expect(outputStream).to.deep.equal(outputStream2);
    });
  });

  describe('stop', () => {
    it('can stop device', async () => {
      await device.transformStream(mockVideoStream);
      domMockBehavior.createElementCaptureStream = mockVideoStream;
      assert.exists(device.outputMediaStream);
      await device.stop();
    });

    it('can stop device consecutively', async () => {
      domMockBehavior.createElementCaptureStream = mockVideoStream;
      await device.transformStream(mockVideoStream);

      assert.exists(device.outputMediaStream);

      await device.stop();
      expect(device.outputMediaStream.active).to.be.false;

      await device.stop();
      expect(device.outputMediaStream.active).to.be.false;
    });
  });

  describe('getInnerDevice', () => {
    it('can get the inner device', async () => {
      expect(device.getInnerDevice()).to.equal('test');
    });
  });

  describe('intrinsicDevice', () => {
    it('returns the intrinsicDevice', async () => {
      expect(await device.intrinsicDevice()).to.equal('test');
    });
  });

  describe('chooseNewInnerDevice', () => {
    const newInnerDeviceStr = 'newDevice';

    it('returns a new video transform device', async () => {
      const newDevice = device.chooseNewInnerDevice(
        newInnerDeviceStr
      );
      expect(device).not.equal(newDevice);

      const newInnerDevice = newDevice.getInnerDevice();
      expect(newInnerDevice).equal(newInnerDeviceStr);
      newDevice.stop();
    });
  });

  describe('onOutputStreamDisconnect', () => {
    beforeEach(() => {
      device = new MLVideoFxTransformDevice(
        logger,
        'test',
        // @ts-ignore
        driver
      );
      domMockBehavior.createElementCaptureStream = mockVideoStream;
    });

    afterEach(() => {
      device.stop();
    });

    it('stops the stream handler if it exists', async () => {
      await device.transformStream(mockVideoStream);
      // @ts-ignore
      const spy = sinon.spy(device.streamHandler, 'stop');
      device.onOutputStreamDisconnect();
      expect(spy.called).to.be.true;
    });

    it('releases the input media stream if current device isnt a media stream', async () => {
      device = new MLVideoFxTransformDevice(
        logger,
        null,
        // @ts-ignore\\
        driver
      );
      device.onOutputStreamDisconnect();
      expect(device.outputMediaStream.getTracks().length).to.equal(0);
    });

    it('does not release the input media stream if the provided device is media stream', async () => {
      const fakeStreamId = '123';
      const streamAsDevice = mockVideoStream;
      // @ts-ignore
      streamAsDevice.id = fakeStreamId;
      device = new MLVideoFxTransformDevice(
        logger,
        'test',
        // @ts-ignore\\
        driver
      );
      await device.transformStream(streamAsDevice);
      device.onOutputStreamDisconnect();
      expect(device.outputMediaStream.getTracks().length).to.be.greaterThan(0);
    });
  });
});
