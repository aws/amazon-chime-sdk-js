// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import VideoTransformDevice from '../../src/devicecontroller/VideoTransformDevice';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import DefaultVideoTransformDevice from '../../src/videoframeprocessor/DefaultVideoTransformDevice';
import DefaultVideoTransformDeviceObserver from '../../src/videoframeprocessor/DefaultVideoTransformDeviceObserver';
import NoOpVideoFrameProcessor from '../../src/videoframeprocessor/NoOpVideoFrameProcessor';
import VideoFrameBuffer from '../../src/videoframeprocessor/VideoFrameBuffer';
import VideoFrameProcessor from '../../src/videoframeprocessor/VideoFrameProcessor';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultVideoTransformDevice', () => {
  const assert: Chai.AssertStatic = chai.assert;
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpDebugLogger();
  let domMockBehavior: DOMMockBehavior;
  let domMockBuilder: DOMMockBuilder;
  let mockVideoStream: MediaStream;
  let mockVideoTrack: MediaStreamTrack;

  class MockObserver implements DefaultVideoTransformDeviceObserver {
    processingDidStart = sinon.stub();
    processingDidStop = sinon.stub();
    processingDidFailToStart = sinon.stub();
    processingLatencyTooHigh = sinon.stub();
  }

  function timeoutPromise(timeout: number): Promise<void> {
    return new Promise((_resolve, reject) => {
      setTimeout(reject, timeout);
    });
  }

  function called(stub: sinon.SinonStub, timeout = 1000): Promise<void> {
    return Promise.race([
      new Promise<void>((resolve, _reject) => {
        stub.callsFake(resolve);
      }),
      timeoutPromise(timeout),
    ]);
  }

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
  });

  afterEach(() => {
    domMockBuilder.cleanup();
  });

  describe('construction', () => {
    it('can be constructed', () => {
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      assert.exists(device);
    });
  });

  describe('getter outputMediaStream', () => {
    it('returns dummy inactive MediaStream if device is not started', async () => {
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      const stream = device.outputMediaStream;
      expect(stream.active).to.be.false;
    });
  });

  describe('transformStream', () => {
    it('set inputMediaStream', async () => {
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      await device.transformStream(null);
      // @ts-ignore
      expect(device.inputMediaStream).to.be.null;
    });

    it('does not start if processors is null', async () => {
      const device = new DefaultVideoTransformDevice(logger, 'test', []);
      await device.transformStream(null);
    });

    it('can start device', async () => {
      const obs = new MockObserver();

      const startCallback = called(obs.processingDidStart);
      const stopCallback = called(obs.processingDidStop);

      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      device.addObserver(obs);
      domMockBehavior.createElementCaptureStream = mockVideoStream;
      await device.transformStream(mockVideoStream);
      await startCallback;

      assert.exists(device.outputMediaStream);

      await device.stop();
      await stopCallback;
      expect(device.outputMediaStream.active).to.be.false;
    });

    it('can start processing on different media stream', async () => {
      const obs = new MockObserver();
      const startCallback = called(obs.processingDidStart);
      const stopCallback = called(obs.processingDidStop);

      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      device.addObserver(obs);
      domMockBehavior.createElementCaptureStream = mockVideoStream;
      const outputStream = await device.transformStream(mockVideoStream);
      await startCallback;

      const newStream = new MediaStream();
      const outputStream2 = await device.transformStream(newStream);
      await device.stop();
      await stopCallback;
      expect(outputStream).to.deep.equal(outputStream2);
    });
  });

  describe('stop', () => {
    it('can stop device', async () => {
      const obs = new MockObserver();
      const startCallback = called(obs.processingDidStart);
      const stopCallback = called(obs.processingDidStop);
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      device.addObserver(obs);
      await device.transformStream(mockVideoStream);
      await startCallback;
      domMockBehavior.createElementCaptureStream = mockVideoStream;
      assert.exists(device.outputMediaStream);
      await device.stop();

      await stopCallback;
    });

    it('can stop device idempotently', async () => {
      const obs = new MockObserver();
      const startCallback = called(obs.processingDidStart);
      const stopCallback = called(obs.processingDidStop);

      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      device.addObserver(obs);
      domMockBehavior.createElementCaptureStream = mockVideoStream;
      await device.transformStream(mockVideoStream);

      await startCallback;
      assert.exists(device.outputMediaStream);

      await device.stop();

      await stopCallback;
      expect(device.outputMediaStream.active).to.be.false;
      await device.stop();
      expect(device.outputMediaStream.active).to.be.false;
    });
  });

  describe('getInnerDevice', () => {
    it('can get the inner device', async () => {
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      expect(device.getInnerDevice()).to.equal('test');
    });
  });

  describe('intrinsicDevice', () => {
    it('returns the intrinsicDevice', async () => {
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      expect(await device.intrinsicDevice()).to.deep.equal({ deviceId: { exact: 'test' } });
    });

    it('returns the correct intrinsicDevice', async () => {
      domMockBehavior = new DOMMockBehavior();
      domMockBehavior.isUnifiedPlanSupported = false;
      domMockBehavior.browserName = 'ios12.1';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      expect(await device.intrinsicDevice()).to.deep.equal({ deviceId: 'test' });
    });

    it('returns the correct intrinsicDevice', async () => {
      const device = new DefaultVideoTransformDevice(logger, null, []);
      expect(await device.intrinsicDevice()).to.deep.equal({});
    });

    it('returns the correct intrinsicDevice', async () => {
      const device = new DefaultVideoTransformDevice(logger, mockVideoStream, []);
      expect(await device.intrinsicDevice()).to.deep.equal(mockVideoStream);
    });

    it('returns the correct intrinsicDevice', async () => {
      const device = new DefaultVideoTransformDevice(logger, { width: 1280 }, []);
      expect(await device.intrinsicDevice()).to.deep.equal({ width: 1280 });
    });
  });

  describe('chooseNewInnerDevice', () => {
    const newInnerDeviceStr = 'newDevice';

    it('returns a new video transform device', async () => {
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      const newDevice = device.chooseNewInnerDevice(newInnerDeviceStr);
      expect(newDevice).not.equal(device);

      const newInnerDevice = newDevice.getInnerDevice();
      expect(newInnerDevice).equal(newInnerDeviceStr);
    });

    it('re-uses processors and pipe', async () => {
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      const newDevice = device.chooseNewInnerDevice(newInnerDeviceStr);
      expect(newDevice).not.equal(device);

      // @ts-ignore
      expect(device.processors.length).equal(newDevice.processors.length);
      // @ts-ignore
      expect(device.processors[0]).equal(newDevice.processors[0]);
      // @ts-ignore
      expect(device.pipe).equal(newDevice.pipe);
    });
  });

  describe('onOutputStreamDisconnect', () => {
    let transformDevice: VideoTransformDevice;
    const processor = new NoOpVideoFrameProcessor();

    beforeEach(() => {
      transformDevice = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      domMockBehavior.createElementCaptureStream = mockVideoStream;
    });

    afterEach(() => {
      transformDevice.stop();
    });

    it('will not stop the pipe if pipe does not exist', async () => {
      transformDevice.onOutputStreamDisconnect();
    });

    it('stops the processing pipeline if it exists', async () => {
      await transformDevice.transformStream(mockVideoStream);
      // @ts-ignore
      const spy = sinon.spy(transformDevice.pipe, 'stop');
      transformDevice.onOutputStreamDisconnect();
      expect(spy.called).to.be.true;
    });

    it('releases the input media stream if the provided device is not media stream', async () => {
      await transformDevice.transformStream(mockVideoStream);
      transformDevice.onOutputStreamDisconnect();
    });

    it('does not release the input media stream if the provided device is media stream', async () => {
      const fakeStreamId = '123';
      const streamAsDevice = mockVideoStream;
      // @ts-ignore
      streamAsDevice.id = fakeStreamId;
      transformDevice = new DefaultVideoTransformDevice(logger, streamAsDevice, [processor]);
      await transformDevice.transformStream(streamAsDevice);
      transformDevice.onOutputStreamDisconnect();
    });
  });

  describe('observer callback', () => {
    it('processingDidStart', async () => {
      const obs = new MockObserver();
      const startCallback = called(obs.processingDidStart);
      const stopCallback = called(obs.processingDidStop);
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      device.addObserver(obs);
      await device.transformStream(mockVideoStream);
      await startCallback;

      domMockBehavior.createElementCaptureStream = mockVideoStream;
      assert.exists(device.outputMediaStream);
      await device.stop();

      await stopCallback;
    });

    it('processingDidStart', async () => {
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      await device.transformStream(mockVideoStream);
      await device.stop();
    });

    it('processingDidFailToStart due to processor errors', async () => {
      class WrongProcessor implements VideoFrameProcessor {
        destroy(): Promise<void> {
          return;
        }
        process(_buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
          throw new Error('Method not implemented.');
        }
      }

      const obs = new MockObserver();
      const failToStartCallback = called(obs.processingDidFailToStart);

      const processor = new WrongProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      device.addObserver(obs);
      await device.transformStream(mockVideoStream);

      await failToStartCallback;
      await device.stop();
    });

    it('processingDidFailToStart with multiple observers', async () => {
      class WrongProcessor implements VideoFrameProcessor {
        destroy(): Promise<void> {
          return;
        }
        process(_buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
          throw new Error('Method not implemented.');
        }
      }

      // test observer who does not implement all methods
      class Observer implements DefaultVideoTransformDeviceObserver {
        processingDidFailToStart = sinon.stub();
      }

      // test observer who does not implement all methods
      class Observer2 implements DefaultVideoTransformDeviceObserver {
        processingDidStart = sinon.stub();
      }

      const obs = new Observer();
      const startCallback = called(obs.processingDidFailToStart);

      const processor = new WrongProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      device.addObserver(obs);
      const obs2 = new Observer2();
      device.addObserver(obs2);
      await device.transformStream(mockVideoStream);

      await startCallback;
      await device.stop();
      expect(obs2.processingDidStart.called).to.equal(false);
    });

    it('processingDidFailToStart due to error in processors', async () => {
      class WrongProcessor implements VideoFrameProcessor {
        destroy(): Promise<void> {
          return;
        }
        process(_buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
          throw new Error('Method not implemented.');
        }
      }
      const obs = new MockObserver();
      const failToStartCallback = called(obs.processingDidFailToStart);
      const processor = new WrongProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      device.addObserver(obs);
      await device.transformStream(mockVideoStream);
      await failToStartCallback;
      await device.stop();

      device.removeObserver(obs);
    });

    it('processingLatencyTooHigh', async () => {
      class Observer2 implements DefaultVideoTransformDeviceObserver {}
      const obs = new MockObserver();

      const latencyCallback = called(obs.processingLatencyTooHigh);

      class WrongProcessor extends NoOpVideoFrameProcessor {
        async process(buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
          await new Promise(resolve => setTimeout(resolve, (1000 / 15) * 3));
          return buffers;
        }
      }

      const procs = [new WrongProcessor()];
      const device = new DefaultVideoTransformDevice(logger, 'test', procs);
      device.addObserver(obs);
      device.addObserver(new Observer2());
      await device.transformStream(mockVideoStream);
      await latencyCallback;
      await device.stop();
    });
  });
});
