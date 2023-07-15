// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import { CanvasVideoFrameBuffer, VideoFrameBuffer } from '../../src';
import VideoTransformDevice from '../../src/devicecontroller/VideoTransformDevice';
import DefaultEventController from '../../src/eventcontroller/DefaultEventController';
import EventController from '../../src/eventcontroller/EventController';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import MeetingSessionConfiguration from '../../src/meetingsession/MeetingSessionConfiguration';
import MeetingSessionCredentials from '../../src/meetingsession/MeetingSessionCredentials';
import MeetingSessionURLs from '../../src/meetingsession/MeetingSessionURLs';
import DefaultVideoTransformDevice from '../../src/videoframeprocessor/DefaultVideoTransformDevice';
import DefaultVideoTransformDeviceObserver from '../../src/videoframeprocessor/DefaultVideoTransformDeviceObserver';
import NoOpVideoFrameProcessor from '../../src/videoframeprocessor/NoOpVideoFrameProcessor';
import VideoFrameProcessor from '../../src/videoframeprocessor/VideoFrameProcessor';
import VideoFxConfig from '../../src/videofx/VideoFxConfig';
import { DEFAULT_STREAM_PARAMETERS, SEGMENTATION_MODEL } from '../../src/videofx/VideoFxConstants';
import VideoFxProcessor from '../../src/videofx/VideoFxProcessor';
import MockEngineWorker from '../../test/videofx/MockEngineWorker';
import MockFxLib from '../../test/videofx/MockFxLib';
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

  function makeSessionConfiguration(): MeetingSessionConfiguration {
    const configuration = new MeetingSessionConfiguration();
    configuration.meetingId = 'foo-meeting';
    configuration.urls = new MeetingSessionURLs();
    configuration.urls.audioHostURL = 'https://audiohost.test.example.com';
    configuration.urls.turnControlURL = 'https://turncontrol.test.example.com';
    configuration.urls.signalingURL = 'https://signaling.test.example.com';
    configuration.credentials = new MeetingSessionCredentials();
    configuration.credentials.attendeeId = 'foo-attendee';
    configuration.credentials.joinToken = 'foo-join-token';
    configuration.attendeePresenceTimeoutMs = 5000;
    return configuration;
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
      expect(await device.intrinsicDevice()).to.equal('test');
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

  describe('passEventControllerToProcessors', () => {
    // Set mock videofx environment
    const sandbox: sinon.SinonSandbox = sinon.createSandbox();
    const mockEngineWorker = new MockEngineWorker();
    const mockFxLib = new MockFxLib();

    let fxConfig: VideoFxConfig;
    let domMockBehaviorProcessor: DOMMockBehavior;
    let domMockBuilderProcessor: DOMMockBuilder;
    let buffers: VideoFrameBuffer[];
    let eventController: EventController;

    beforeEach(() => {
      fxConfig = {
        backgroundBlur: {
          isEnabled: false,
          strength: 'low',
        },
        backgroundReplacement: {
          isEnabled: false,
          backgroundImageURL: null,
          defaultColor: 'black',
        },
      };

      domMockBehaviorProcessor = new DOMMockBehavior();
      domMockBuilderProcessor = new DOMMockBuilder(domMockBehaviorProcessor);

      mockEngineWorker.setSandbox(sandbox);
      mockFxLib.setSandbox(sandbox);
      mockFxLib.setDomBehavior(domMockBehaviorProcessor);
      mockFxLib.stubSuccess();

      // Configure mock canvas to be processed
      const canvas = document.createElement('canvas');
      canvas.height = DEFAULT_STREAM_PARAMETERS.HEIGHT_IN_PIXEL;
      canvas.width = DEFAULT_STREAM_PARAMETERS.WIDTH_IN_PIXEL;
      buffers = [new CanvasVideoFrameBuffer(canvas)];

      // Set up eventController
      const configuration = makeSessionConfiguration();
      eventController = new DefaultEventController(configuration, logger);
    });

    afterEach(() => {
      sandbox.restore();
      domMockBuilderProcessor.cleanup();
    });

    it('setEventController validation', async () => {
      // Set up processor
      VideoFxProcessor['isSharedArrayBufferSupported'] = false;
      mockEngineWorker.stubAllAssetsLoad();
      const processor: VideoFxProcessor = await VideoFxProcessor.create(logger, fxConfig);

      // Mock segmentation successfully
      sandbox.stub(processor['segmentationRequestPromise'], 'getPromise').callsFake(
        (): Promise<ImageData> => {
          return Promise.resolve(
            new ImageData(SEGMENTATION_MODEL.WIDTH_IN_PIXELS, SEGMENTATION_MODEL.HEIGHT_IN_PIXELS)
          );
        }
      );

      // Set up video transform device
      const transformDevice = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      domMockBehavior.createElementCaptureStream = mockVideoStream;
      transformDevice.passEventControllerToProcessors(eventController);

      // Check to make sure processor is working
      const outputBuffers: VideoFrameBuffer[] = await processor.process(buffers);
      assert.exists(outputBuffers);

      // Clean up resources
      processor.destroy();
      transformDevice.stop();
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
