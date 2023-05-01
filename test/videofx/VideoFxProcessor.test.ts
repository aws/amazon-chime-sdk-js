// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';

import * as environmentSupport from '../../libs/voicefocus/support';
import { CanvasVideoFrameBuffer, VideoFrameBuffer } from '../../src';
import DefaultEventController from '../../src/eventcontroller/DefaultEventController';
import EventController from '../../src/eventcontroller/EventController';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import MeetingSessionConfiguration from '../../src/meetingsession/MeetingSessionConfiguration';
import MeetingSessionCredentials from '../../src/meetingsession/MeetingSessionCredentials';
import MeetingSessionURLs from '../../src/meetingsession/MeetingSessionURLs';
import VideoFxConfig from '../../src/videofx/VideoFxConfig';
import {
  DEFAULT_STREAM_PARAMETERS,
  RESOURCE_CONSTRAINTS,
  SEGMENTATION_MODEL,
} from '../../src/videofx/VideoFxConstants';
import VideoFxProcessor from '../../src/videofx/VideoFxProcessor';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';
import MockEngineWorker from './MockEngineWorker';
import MockFxLib from './MockFxLib';

chai.use(chaiAsPromised);

describe('VideoFxProcessor', () => {
  const logger: NoOpDebugLogger = new NoOpDebugLogger();
  let configuration: MeetingSessionConfiguration;
  let eventController: EventController;
  let fxProcessor: VideoFxProcessor;
  let fxConfig: VideoFxConfig;

  let domMockBuilder: DOMMockBuilder;
  let domMockBehavior: DOMMockBehavior;
  const mockEngineWorker = new MockEngineWorker();
  const mockFxLib = new MockFxLib();

  const sandbox: sinon.SinonSandbox = sinon.createSandbox();
  let expect: Chai.ExpectStatic;
  let assert: Chai.AssertStatic;

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
    // create a NoOp config
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

    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    mockEngineWorker.setSandbox(sandbox);
    mockFxLib.setSandbox(sandbox);
    mockFxLib.setDomBehavior(domMockBehavior);

    expect = chai.expect;
    assert = chai.assert;
  });

  afterEach(async () => {
    domMockBuilder.cleanup();

    sandbox.restore();
  });

  describe('construction', () => {
    beforeEach(() => {
      mockEngineWorker.stubAllAssetsLoad();
      mockFxLib.stubSuccess();
    });

    it('can construct', () => {
      fxProcessor = new VideoFxProcessor(logger);
      expect(fxProcessor).to.exist;
    });

    it('can construct with eventController', () => {
      configuration = makeSessionConfiguration();
      eventController = new DefaultEventController(configuration, logger);
      // processingBudgetPerFrame in VideoFxProcessor has default value
      fxProcessor = new VideoFxProcessor(logger, undefined, eventController);
      expect(fxProcessor).to.exist;
    });

    it('can construct using the static worker', async () => {
      try {
        fxProcessor = await VideoFxProcessor.create(logger, fxConfig);
      } catch (error) {}
      expect(fxProcessor).to.exist;
    });

    it('fails to construct with invalid processingBudgetPerFrame', async () => {
      const invalidProcessingBudgetPerFrame: number = -1;
      const expectedError: Error = new Error(
        `Cannot instantiate VideoFxProcessor due to invalid ` +
          `processingBudgetPerFrame of ${invalidProcessingBudgetPerFrame}`
      );

      let receivedError = '';
      try {
        fxProcessor = await VideoFxProcessor.create(
          logger,
          fxConfig,
          invalidProcessingBudgetPerFrame
        );
      } catch (error) {
        receivedError = error.message;
      }
      assert.equal(receivedError, expectedError.message);
    });

    it('fails to construct using the static worker with an invalid config', async () => {
      fxConfig.backgroundBlur.isEnabled = true;
      fxConfig.backgroundReplacement.isEnabled = true;
      const expectedError: Error = new Error(
        `VideoFxProcessor built with support for only NoOp processing`
      );

      let receivedError = '';
      try {
        fxProcessor = await VideoFxProcessor.create(logger, fxConfig);
      } catch (error) {
        receivedError = error.message;
      }
      assert.equal(receivedError, expectedError.message);
    });
  });

  describe('checking for browser support', () => {
    it('is supported', async () => {
      mockFxLib.stubSuccess();
      // Env supports all
      sandbox.stub(environmentSupport, 'supportsWorker').returns(true);
      sandbox.stub(environmentSupport, 'supportsWASM').returns(true);
      // Env has access to load all assets
      mockEngineWorker.stubAllAssetsLoad();
      // note: webgl2 support enabled through MockDOMBuilder

      // Check support is true
      const isSupported = await VideoFxProcessor.isSupported(logger);
      assert.equal(isSupported, true);
    });

    it('is supported with no logger provided', async () => {
      mockFxLib.stubSuccess();
      // Env supports all
      sandbox.stub(environmentSupport, 'supportsWorker').returns(true);
      sandbox.stub(environmentSupport, 'supportsWASM').returns(true);
      // Env has access to load all assets
      mockEngineWorker.stubAllAssetsLoad();
      // note: webgl2 support enabled through MockDOMBuilder

      // Check support is true
      const isSupported = await VideoFxProcessor.isSupported();
      assert.equal(isSupported, true);
    });

    it('can skip asset download in support check', async () => {
      mockFxLib.stubSuccess();
      // Env supports all
      sandbox.stub(environmentSupport, 'supportsWorker').returns(true);
      sandbox.stub(environmentSupport, 'supportsWASM').returns(true);
      // Env has access to load all assets
      mockEngineWorker.stubAllAssetsLoad();
      // note: webgl2 support enabled through MockDOMBuilder

      // Check support is true
      const isSupported = await VideoFxProcessor.isSupported(logger, false);
      assert.equal(isSupported, true);
    });

    it('is not supported without web workers', async () => {
      // Env doesn't support workers
      sandbox.stub(environmentSupport, 'supportsWorker').returns(false);
      sandbox.stub(environmentSupport, 'supportsWASM').returns(true);
      // Env has access to load all assets
      mockEngineWorker.stubAllAssetsLoad();
      // note: webgl2 support enabled through MockDOMBuilder

      // Check support is false
      const isSupported = await VideoFxProcessor.isSupported(logger);
      assert.equal(isSupported, false);
    });

    it('is not supported without wasm', async () => {
      // Env doesn't support wasm
      sandbox.stub(environmentSupport, 'supportsWorker').returns(true);
      sandbox.stub(environmentSupport, 'supportsWASM').returns(false);
      // Env has access to load all assets
      mockEngineWorker.stubAllAssetsLoad();
      // note: webgl2 support enabled through MockDOMBuilder

      // Check support is false
      const isSupported = await VideoFxProcessor.isSupported(logger);
      assert.equal(isSupported, false);
    });

    it('is not supported without webgl', async () => {
      // Env supports all
      sandbox.stub(environmentSupport, 'supportsWorker').returns(true);
      sandbox.stub(environmentSupport, 'supportsWASM').returns(true);
      // Env has access to load all assets
      mockEngineWorker.stubAllAssetsLoad();
      // Env fails to support webgl2
      const canvas = document.createElement('canvas');
      sandbox.stub(canvas, 'getContext').returns(undefined);
      sandbox.stub(document, 'createElement').returns(canvas);

      const isSupported = await VideoFxProcessor.isSupported(logger);
      assert.equal(isSupported, false);
    });

    it('is not supported without access to external assets', async () => {
      // Env supports all
      sandbox.stub(environmentSupport, 'supportsWorker').returns(true);
      sandbox.stub(environmentSupport, 'supportsWASM').returns(true);
      // Env doesn't have accesss to load all external assets
      mockEngineWorker.stubFailedBuildEngine();
      // note: webgl2 support enabled through MockDOMBuilder

      // Check support is false
      const isSupported = await VideoFxProcessor.isSupported(logger);
      assert.equal(isSupported, false);
    });
  });

  describe('asset loading', () => {
    it('can load all assets', async () => {
      mockEngineWorker.stubAllAssetsLoad();
      mockFxLib.stubSuccess();
      await expect(VideoFxProcessor.create(logger, fxConfig)).to.not.be.rejected;
    });

    it('fails with bad worker load', async () => {
      mockEngineWorker.stubFailedWorker(); // worker fails to load
      mockFxLib.stubSuccess();
      const expectedError: Error = new Error(
        `VideoFxProcessor built with support for only NoOp processing`
      );

      let receivedError = '';
      try {
        fxProcessor = await VideoFxProcessor.create(logger, fxConfig);
      } catch (error) {
        receivedError = error.message;
      }
      assert.equal(receivedError, expectedError.message);
    });

    it('fails with bad build of engine', async () => {
      mockEngineWorker.stubFailedBuildEngine();
      mockFxLib.stubSuccess();
      const expectedError: Error = new Error(
        `VideoFxProcessor built with support for only NoOp processing`
      );

      let receivedError = '';
      try {
        fxProcessor = await VideoFxProcessor.create(logger, fxConfig);
      } catch (error) {
        receivedError = error.message;
      }
      assert.equal(receivedError, expectedError.message);
    });

    it('fails with bad fxlib fetch', async () => {
      // failed model load
      mockEngineWorker.stubAllAssetsLoad();
      mockFxLib.stubFailedFetch();
      const expectedError: Error = new Error(
        `VideoFxProcessor built with support for only NoOp processing`
      );

      let receivedError = '';
      try {
        fxProcessor = await VideoFxProcessor.create(logger, fxConfig);
      } catch (error) {
        receivedError = error.message;
      }
      assert.equal(receivedError, expectedError.message);
    });
  });

  describe('config validation and setting', () => {
    // Stub a successful model worker and asset load every time as well
    // as create a videofx processor
    beforeEach(async () => {
      mockEngineWorker.stubAllAssetsLoad();
      mockFxLib.stubSuccess();
      try {
        fxProcessor = await VideoFxProcessor.create(logger, fxConfig);
      } catch (error) {}
    });

    // Destroy the processor after ever test
    afterEach(async () => {
      await fxProcessor.destroy();
    });

    describe('background blur', () => {
      it('can validate/set enable', async () => {
        fxConfig.backgroundBlur.isEnabled = true;
        await expect(fxProcessor.setEffectConfig(fxConfig)).to.not.be.rejected;
        assert.equal(fxProcessor.getEffectConfig().backgroundBlur.isEnabled, true);
      });

      it('can validate/set strength', async () => {
        fxConfig.backgroundBlur.isEnabled = true;
        fxConfig.backgroundBlur.strength = 'medium';
        await expect(fxProcessor.setEffectConfig(fxConfig)).to.not.be.rejected;
        assert.equal(
          fxProcessor.getEffectConfig().backgroundBlur.strength,
          fxConfig.backgroundBlur.strength
        );

        fxConfig.backgroundBlur.strength = 'low';
        await expect(fxProcessor.setEffectConfig(fxConfig)).to.not.be.rejected;
        assert.equal(
          fxProcessor.getEffectConfig().backgroundBlur.strength,
          fxConfig.backgroundBlur.strength
        );
      });
    });

    describe('background replacement', () => {
      it('can validate/set replacement enabled', async () => {
        fxConfig.backgroundReplacement.isEnabled = true;
        await expect(fxProcessor.setEffectConfig(fxConfig)).to.not.be.rejected;
        assert.equal(fxProcessor.getEffectConfig().backgroundReplacement.isEnabled, true);
      });

      it('can validate/set correct default color in string format', async () => {
        fxConfig.backgroundReplacement.isEnabled = true;
        fxConfig.backgroundReplacement.defaultColor = 'blue';
        await expect(fxProcessor.setEffectConfig(fxConfig)).to.not.be.rejected;
        assert.equal(fxProcessor.getEffectConfig().backgroundReplacement.defaultColor, 'blue');
        fxConfig.backgroundReplacement.defaultColor = 'green';
        await expect(fxProcessor.setEffectConfig(fxConfig)).to.not.be.rejected;
        assert.equal(fxProcessor.getEffectConfig().backgroundReplacement.defaultColor, 'green');
      });

      it('can validate/set correct default color in hex format', async () => {
        fxConfig.backgroundReplacement.isEnabled = true;
        fxConfig.backgroundReplacement.defaultColor = '#0063FD';
        await expect(fxProcessor.setEffectConfig(fxConfig)).to.not.be.rejected;
        assert.equal(fxProcessor.getEffectConfig().backgroundReplacement.defaultColor, '#0063FD');
        fxConfig.backgroundReplacement.defaultColor = '#000000';
        await expect(fxProcessor.setEffectConfig(fxConfig)).to.not.be.rejected;
        assert.equal(fxProcessor.getEffectConfig().backgroundReplacement.defaultColor, '#000000');
        fxConfig.backgroundReplacement.defaultColor = '#000';
        await expect(fxProcessor.setEffectConfig(fxConfig)).to.not.be.rejected;
        assert.equal(fxProcessor.getEffectConfig().backgroundReplacement.defaultColor, '#000');
      });

      it('can validate/set correct background image url', async () => {
        // Configure successful fetch and image load
        domMockBehavior.fetchSucceeds = true;
        domMockBehavior.imageLoads = true;

        fxConfig.backgroundReplacement.isEnabled = true;
        fxConfig.backgroundReplacement.backgroundImageURL = 'www.successurl123.com';
        fxConfig.backgroundReplacement.defaultColor = null;
        await expect(fxProcessor.setEffectConfig(fxConfig)).to.not.be.rejected;
        assert.equal(
          fxProcessor.getEffectConfig().backgroundReplacement.backgroundImageURL,
          'www.successurl123.com'
        );
      });

      it('can validate/set back and forth between url to default color', async () => {
        // Stub the load image call to successfully process
        sandbox.stub(fxProcessor['canvasOpsManager'], 'loadImage').callsFake(
          (): Promise<HTMLImageElement> => {
            const imageElement = new HTMLImageElement();
            return Promise.resolve(imageElement);
          }
        );

        // Set to green
        fxConfig.backgroundReplacement.defaultColor = 'green';
        fxConfig.backgroundReplacement.backgroundImageURL = null;
        await fxProcessor.setEffectConfig(fxConfig);
        assert.equal(fxProcessor.getEffectConfig().backgroundReplacement.defaultColor, 'green');

        // Set to url
        fxConfig.backgroundReplacement.defaultColor = null;
        fxConfig.backgroundReplacement.backgroundImageURL = 'www.successurl123.com';
        await fxProcessor.setEffectConfig(fxConfig);
        assert.equal(
          fxProcessor.getEffectConfig().backgroundReplacement.backgroundImageURL,
          'www.successurl123.com'
        );

        // Set back to green
        fxConfig.backgroundReplacement.defaultColor = 'green';
        fxConfig.backgroundReplacement.backgroundImageURL = null;
        await fxProcessor.setEffectConfig(fxConfig);
        assert.equal(fxProcessor.getEffectConfig().backgroundReplacement.defaultColor, 'green');
      });

      it('rejects null default color and null url', async () => {
        fxConfig.backgroundReplacement.isEnabled = true;
        fxConfig.backgroundReplacement.backgroundImageURL = null;
        fxConfig.backgroundReplacement.defaultColor = null;
        await expect(fxProcessor.setEffectConfig(fxConfig)).to.be.rejected;
        assert.notEqual(fxProcessor.getEffectConfig().backgroundReplacement.defaultColor, null);
      });

      it('rejects non-null background color and non-null url', async () => {
        fxConfig.backgroundReplacement.isEnabled = true;
        fxConfig.backgroundReplacement.backgroundImageURL = 'badURL';
        fxConfig.backgroundReplacement.defaultColor = 'green';
        await expect(fxProcessor.setEffectConfig(fxConfig)).to.be.rejected;
        assert.notEqual(fxProcessor.getEffectConfig().backgroundReplacement.defaultColor, 'green');
        assert.notEqual(
          fxProcessor.getEffectConfig().backgroundReplacement.backgroundImageURL,
          'badURL'
        );
      });

      it('rejects default background color using an invalid hex value', async () => {
        fxConfig.backgroundReplacement.isEnabled = true;
        fxConfig.backgroundReplacement.backgroundImageURL = null;
        fxConfig.backgroundReplacement.defaultColor = '#00invalidHEX';
        await expect(fxProcessor.setEffectConfig(fxConfig)).to.be.rejected;
        assert.notEqual(
          fxProcessor.getEffectConfig().backgroundReplacement.defaultColor,
          '#00invalidHEX'
        );
        fxConfig.backgroundReplacement.defaultColor = '#&&&&&&';
        await expect(fxProcessor.setEffectConfig(fxConfig)).to.be.rejected;
        assert.notEqual(
          fxProcessor.getEffectConfig().backgroundReplacement.defaultColor,
          '#&&&&&&'
        );
      });

      it('rejects invalid background image url', async () => {
        // Configure failed fetch
        domMockBehavior.fetchSucceeds = false;

        // Configure bg replacement
        fxConfig.backgroundReplacement.isEnabled = true;
        fxConfig.backgroundReplacement.backgroundImageURL = 'www.fakeUrl103dasd2';
        fxConfig.backgroundReplacement.defaultColor = null;
        await expect(fxProcessor.setEffectConfig(fxConfig)).to.be.rejected;
        assert.notEqual(
          fxProcessor.getEffectConfig().backgroundReplacement.backgroundImageURL,
          'www.fakeUrl103dasd2'
        );
      });

      it('rejects when background image can not instantiate after being fetched', async () => {
        // Configure successful fetch but failed image load
        domMockBehavior.fetchSucceeds = true;
        domMockBehavior.imageLoads = false;

        fxConfig.backgroundReplacement.isEnabled = true;
        fxConfig.backgroundReplacement.backgroundImageURL = 'www.fakeUrl103dasd2';
        fxConfig.backgroundReplacement.defaultColor = null;
        await expect(fxProcessor.setEffectConfig(fxConfig)).to.be.rejected;
        assert.notEqual(
          fxProcessor.getEffectConfig().backgroundReplacement.backgroundImageURL,
          'www.fakeUrl103dasd2'
        );
      });
    });

    describe('mixed effects', () => {
      it('rejects enabled blur and enabled replacement', async () => {
        fxConfig.backgroundBlur.isEnabled = true;
        fxConfig.backgroundReplacement.isEnabled = true;
        await expect(fxProcessor.setEffectConfig(fxConfig)).to.be.rejected;
      });
    });

    describe('using validations to enable publishEvent', () => {
      beforeEach(async () => {
        configuration = makeSessionConfiguration();
        eventController = new DefaultEventController(configuration, logger);
        // Sets an initial eventController every test
        fxProcessor.setEventController(eventController);
      });

      it('with changing config for publish event', async () => {
        // Changing the config to enable blur as simple case
        fxConfig.backgroundBlur.isEnabled = true;
        // Since valid eventController, publish event happens
        await fxProcessor.setEffectConfig(fxConfig);
      });

      it('with changing config for new valid eventController', async () => {
        // Change event controllers, no publish event happens since one was already instantiated
        const eventController2 = new DefaultEventController(configuration, logger);
        fxProcessor.setEventController(eventController2);
        // Changing the config to enable blur as simple case
        fxConfig.backgroundBlur.isEnabled = true;
        // Since valid eventController, publish event happens
        await fxProcessor.setEffectConfig(fxConfig);
      });
    });
  });

  describe('processing', () => {
    // Configure mock canvas to be processed
    let canvas: HTMLCanvasElement;
    let buffers: VideoFrameBuffer[];

    // SAB and non-SAB path spys
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let noSabSegmentation: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sabSegmentation: any;

    beforeEach(() => {
      // stub successful mockFxLib
      mockFxLib.stubSuccess();
      // Configure mock canvas to be processed
      canvas = document.createElement('canvas');
      canvas.height = DEFAULT_STREAM_PARAMETERS.HEIGHT_IN_PIXEL;
      canvas.width = DEFAULT_STREAM_PARAMETERS.WIDTH_IN_PIXEL;
      buffers = [new CanvasVideoFrameBuffer(canvas)];
    });

    // Makes an HTML Canvas that is smaller than the default canvas size (960x540)
    function makeSmallCanvas(): HTMLCanvasElement {
      // Configure mock canvas to be processed
      const smallCanvas = document.createElement('canvas');
      // Set canvas dimensions to arbitrary different value
      const smallStreamDimension = 300;
      smallCanvas.height = smallStreamDimension;
      smallCanvas.width = smallStreamDimension;
      return smallCanvas;
    }

    // Create a videoFxProcessor that uses a share array buffer
    async function createProcessorWithSABSupport(fxConfig: VideoFxConfig): Promise<void> {
      // Enable shared array buffer
      VideoFxProcessor['isSharedArrayBufferSupported'] = true;
      // Stub all assets loading succesfully
      mockEngineWorker.stubAllAssetsLoad();
      // create the processor
      try {
        fxProcessor = await VideoFxProcessor.create(logger, fxConfig);
      } catch (error) {}
    }

    // Create a videoFxProcessor that doesn't use the shared array buffer
    async function createProcessorWithoutSABSupport(fxConfig: VideoFxConfig): Promise<void> {
      // Enable shared array buffer
      VideoFxProcessor['isSharedArrayBufferSupported'] = false;
      // Stub all assets loading succesfully
      mockEngineWorker.stubAllAssetsLoad();
      // create the processor
      try {
        fxProcessor = await VideoFxProcessor.create(logger, fxConfig);
      } catch (error) {}
    }

    // Stub a succesful segmentation within the processor
    function stubSuccessfulSegmentation(): void {
      sandbox.stub(fxProcessor['segmentationRequestPromise'], 'getPromise').callsFake(
        (): Promise<ImageData> => {
          return Promise.resolve(
            new ImageData(SEGMENTATION_MODEL.WIDTH_IN_PIXELS, SEGMENTATION_MODEL.HEIGHT_IN_PIXELS)
          );
        }
      );
    }

    // Stub a succesful background image load within the processor
    function stubSuccessfulImageLoad(): void {
      // Stub the load image call to successfully process
      sandbox.stub(fxProcessor['canvasOpsManager'], 'loadImage').callsFake(
        (): Promise<HTMLImageElement> => {
          const imageElement = new HTMLImageElement();
          return Promise.resolve(imageElement);
        }
      );
    }

    // Set the sinon spys onto the sab and non-sab paths within the processor
    function setSabPathSpy(): void {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      noSabSegmentation = sandbox.spy(fxProcessor, <any>'settleSegmentationPromise');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sabSegmentation = sandbox.spy(fxProcessor, <any>'settleSegmentationPromiseSAB');
    }

    // Assert that the sab path was used and the non-sab path was unused
    function assertSABUsed(): void {
      expect(sabSegmentation.callCount).to.be.greaterThan(0);
      expect(noSabSegmentation.callCount).to.equal(0);
    }

    // Assert that the non-sab path was used and the sab path was unused
    function assertSABNotUsed(): void {
      expect(noSabSegmentation.callCount).to.be.greaterThan(0);
      expect(sabSegmentation.callCount).to.equal(0);
    }

    describe('no op', () => {
      it('can process if nothing is loaded', async () => {
        const buffers: VideoFrameBuffer[] = [
          new CanvasVideoFrameBuffer(document.createElement('canvas')),
        ];

        fxProcessor = new VideoFxProcessor(logger);
        const outputBuffers = await fxProcessor.process(buffers);
        assert.exists(outputBuffers);
        assert.equal(buffers, outputBuffers);
      });

      it('can process with all effects disabled', async () => {
        // Set up processor
        mockEngineWorker.stubAllAssetsLoad();
        fxProcessor = await VideoFxProcessor.create(logger, fxConfig);

        // Changing the config to enable blur as simple switch from noOp config
        fxConfig.backgroundBlur.isEnabled = true;
        await fxProcessor.setEffectConfig(fxConfig);
        // Changing the config back to noOp config to test enabling noOp process
        fxConfig.backgroundBlur.isEnabled = false;
        await fxProcessor.setEffectConfig(fxConfig);

        // Verify buffer exists
        const outputBuffers = await fxProcessor.process(buffers);
        assert.exists(outputBuffers);
        await fxProcessor.destroy();
      });
    });

    describe('background blur', () => {
      it('can process with shared array buffer', async () => {
        // Configure processor and unit test moderators
        fxConfig.backgroundBlur.isEnabled = true;
        await createProcessorWithSABSupport(fxConfig);
        setSabPathSpy();
        stubSuccessfulSegmentation();

        // Process
        const outputBuffers = await fxProcessor.process(buffers);
        assert.exists(outputBuffers);
        assertSABUsed();
        await fxProcessor.destroy();
      });

      it('can process adjusting stream dimensions with shared array buffer', async () => {
        // Configure processor and unit test moderators
        fxConfig.backgroundBlur.isEnabled = true;
        await createProcessorWithSABSupport(fxConfig);
        setSabPathSpy();
        stubSuccessfulSegmentation();

        // Process once
        let outputBuffers = await fxProcessor.process(buffers);
        assert.exists(outputBuffers);

        // Adjust stream dimensions
        const smallCanvas = makeSmallCanvas();
        const adjustedBuffer: VideoFrameBuffer[] = [new CanvasVideoFrameBuffer(smallCanvas)];

        // Process again with new stream
        outputBuffers = await fxProcessor.process(adjustedBuffer);
        assert.exists(outputBuffers);
        assertSABUsed();
        await fxProcessor.destroy();
      });

      it('can process without shared array buffer', async () => {
        // Configure processor and unit test moderators
        fxConfig.backgroundBlur.isEnabled = true;
        await createProcessorWithoutSABSupport(fxConfig);
        setSabPathSpy();
        stubSuccessfulSegmentation();

        // Process
        const outputBuffers = await fxProcessor.process(buffers);
        assert.exists(outputBuffers);
        assertSABNotUsed();
        await fxProcessor.destroy();
      });

      it('can process adjusting stream dimensions without shared array buffer', async () => {
        // Configure processor and unit test moderators
        fxConfig.backgroundBlur.isEnabled = true;
        await createProcessorWithoutSABSupport(fxConfig);
        setSabPathSpy();
        stubSuccessfulSegmentation();

        // Process once
        let outputBuffers = await fxProcessor.process(buffers);
        assert.exists(outputBuffers);

        // Adjust stream dimensions
        const smallCanvas = makeSmallCanvas();
        const adjustedBuffer: VideoFrameBuffer[] = [new CanvasVideoFrameBuffer(smallCanvas)];

        // Process again with new stream
        outputBuffers = await fxProcessor.process(adjustedBuffer);
        assertSABNotUsed();
        assert.exists(outputBuffers);
      });
    });

    describe('background replacement', () => {
      it('can process with shared array buffer', async () => {
        // Configure processor and unit test moderators
        fxConfig.backgroundReplacement.isEnabled = true;
        await createProcessorWithSABSupport(fxConfig);
        setSabPathSpy();
        stubSuccessfulSegmentation();

        // Process
        const outputBuffers = await fxProcessor.process(buffers);
        assert.exists(outputBuffers);
        assertSABUsed();
        await fxProcessor.destroy();
      });

      it('can process adjusting stream dimensions with shared array buffer', async () => {
        // Configure processor and unit test moderators
        fxConfig.backgroundReplacement.isEnabled = true;
        await createProcessorWithSABSupport(fxConfig);
        setSabPathSpy();
        stubSuccessfulSegmentation();
        stubSuccessfulImageLoad();

        // Config background replacement and url
        fxConfig.backgroundReplacement.backgroundImageURL = 'www.successurl123.com';
        fxConfig.backgroundReplacement.defaultColor = null;
        await fxProcessor.setEffectConfig(fxConfig);

        // Process once
        let outputBuffers = await fxProcessor.process(buffers);
        assert.exists(outputBuffers);

        // Adjust stream dimensions
        const smallCanvas = makeSmallCanvas();
        const adjustedBuffer: VideoFrameBuffer[] = [new CanvasVideoFrameBuffer(smallCanvas)];

        // Process again with new stream
        outputBuffers = await fxProcessor.process(adjustedBuffer);
        assert.exists(outputBuffers);
        assertSABUsed();
        await fxProcessor.destroy();
      });

      it('can process without shared array buffer', async () => {
        // Configure processor and unit test moderators
        fxConfig.backgroundReplacement.isEnabled = true;
        await createProcessorWithoutSABSupport(fxConfig);
        setSabPathSpy();
        stubSuccessfulSegmentation();
        stubSuccessfulImageLoad();

        // Process
        const outputBuffers = await fxProcessor.process(buffers);
        assert.exists(outputBuffers);
        assertSABNotUsed();
        await fxProcessor.destroy();
      });

      it('can process adjusting stream dimensions without shared array buffer', async () => {
        // Configure processor and unit test moderators
        fxConfig.backgroundReplacement.isEnabled = true;
        await createProcessorWithoutSABSupport(fxConfig);
        setSabPathSpy();
        stubSuccessfulSegmentation();
        stubSuccessfulImageLoad();

        // Config background replacement and url
        fxConfig.backgroundReplacement.backgroundImageURL = 'www.successurl123.com';
        fxConfig.backgroundReplacement.defaultColor = null;
        await fxProcessor.setEffectConfig(fxConfig);

        // Process once
        let outputBuffers = await fxProcessor.process(buffers);
        assert.exists(outputBuffers);

        // Adjust stream dimensions
        const smallCanvas = makeSmallCanvas();
        const adjustedBuffer: VideoFrameBuffer[] = [new CanvasVideoFrameBuffer(smallCanvas)];

        // Process again with new stream
        outputBuffers = await fxProcessor.process(adjustedBuffer);
        assertSABNotUsed();
        assert.exists(outputBuffers);
      });
    });

    describe('general', () => {
      it('rejects a process with a bad segmentation (shared array buffer)', async () => {
        fxConfig.backgroundReplacement.isEnabled = true;
        await createProcessorWithSABSupport(fxConfig);
        setSabPathSpy();

        // Force image data to fail to construct (bad segmentation) in shared array buffer
        sandbox.stub(window, 'ImageData').callsFake(() => {
          throw new Error('error');
        });
        sandbox
          .stub(fxProcessor['segmentationRequestPromise'], 'rejectAndReplacePromise')
          .throws(new Error('Bad Segmentation'));

        // Process
        await expect(fxProcessor.process(buffers)).to.be.rejected;
        assertSABUsed();
        await fxProcessor.destroy();
      });

      it('rejects a process with a bad segmentation (without shared array buffer)', async () => {
        // Force shared array buffer to not exist
        VideoFxProcessor['isSharedArrayBufferSupported'] = false;

        // Configure processor (successful load of assets, enable blur)
        mockEngineWorker.stubAllAssetsLoadWithFailedPredict();
        fxConfig.backgroundReplacement.isEnabled = true;
        fxProcessor = await VideoFxProcessor.create(logger, fxConfig);

        // Force processor to successfully perform the segmentation
        sandbox.stub(fxProcessor['segmentationRequestPromise'], 'getPromise').callsFake(
          (): Promise<ImageData> => {
            return Promise.reject('Bad Segmentation');
          }
        );

        // Process
        await expect(fxProcessor.process(buffers)).to.be.rejected;
        await fxProcessor.destroy();
      });
    });
  });

  describe('throttling', () => {
    let buffers: VideoFrameBuffer[];
    let segmentationMs: number = 50;
    let clock: sinon.SinonFakeTimers;

    beforeEach(async () => {
      // Configure fake clock for timing segmentations
      clock = sandbox.useFakeTimers();

      // Configure processor (successful load of assets, enable blur)
      mockEngineWorker.stubAllAssetsLoad();
      mockFxLib.stubSuccess();
      fxConfig.backgroundReplacement.isEnabled = true;
      fxProcessor = await VideoFxProcessor.create(logger, fxConfig);

      // Configure mock canvas to be processed
      const canvas = document.createElement('canvas');
      canvas.height = DEFAULT_STREAM_PARAMETERS.HEIGHT_IN_PIXEL;
      canvas.width = DEFAULT_STREAM_PARAMETERS.WIDTH_IN_PIXEL;
      buffers = [new CanvasVideoFrameBuffer(canvas)];

      // Configure the timing of the operation (start )
      sandbox.stub(fxProcessor['segmentationRequestPromise'], 'getPromise').callsFake(
        (): Promise<ImageData> => {
          clock.tick(segmentationMs);
          return Promise.resolve(
            new ImageData(SEGMENTATION_MODEL.WIDTH_IN_PIXELS, SEGMENTATION_MODEL.HEIGHT_IN_PIXELS)
          );
        }
      );
      sandbox.stub(fxProcessor['renderer'], 'render').callsFake(
        (): Promise<void> => {
          clock.tick(2); // arbitrary small amount of time in ms
          return Promise.resolve();
        }
      );
    });

    afterEach(async () => {
      await fxProcessor.destroy();
      clock.reset();
    });

    async function processOverFullSamplingPeriod(): Promise<void> {
      for (let i = 0; i < RESOURCE_CONSTRAINTS.SEGMENTATION_SAMPLING_PERIOD_FRAME_COUNT; i++) {
        await fxProcessor.process(buffers);
      }
    }

    it('can properly decrease segmentation rate', async () => {
      // We should start segmenting every frame
      assert.equal(fxProcessor['segmentationRateManager']['framesPerSegmentation'], 1);

      // Process over cycle slowly to trigger segmentation rate decrease
      await processOverFullSamplingPeriod();
      assert.equal(fxProcessor['segmentationRateManager']['framesPerSegmentation'], 2);

      // Process over another cycle slowly to trigger another segmentation rate decrease
      await processOverFullSamplingPeriod();
      assert.equal(fxProcessor['segmentationRateManager']['framesPerSegmentation'], 3);
    });

    it('can properly increase segmentation rate', async () => {
      // We should start segmenting every frame
      assert.equal(fxProcessor['segmentationRateManager']['framesPerSegmentation'], 1);

      // Process over cycle slowly to trigger segmentation rate decrease
      await processOverFullSamplingPeriod();
      assert.equal(fxProcessor['segmentationRateManager']['framesPerSegmentation'], 2);

      // Process fast over cycle to trigger a segmentation rate increase
      segmentationMs = 1; // speed up segmentation
      await processOverFullSamplingPeriod();
      assert.equal(fxProcessor['segmentationRateManager']['framesPerSegmentation'], 1);
    });

    it('cannot decrement segmentation rate when it is maxed out', async () => {
      // Confirm that we are segmenting every frame
      assert.equal(fxProcessor['segmentationRateManager']['framesPerSegmentation'], 1);

      // Process fast over cycle to trigger a segmentation rate increase
      segmentationMs = 0.5; // very fast segmentation
      await processOverFullSamplingPeriod();
      // Segmentation rate should still be once per frame (cant  go faster)
      assert.equal(fxProcessor['segmentationRateManager']['framesPerSegmentation'], 1);
    });
  });

  describe('cleanup', () => {
    it('can destroy properly', async () => {
      // Configure processor (successful load of assets, enable blur)
      mockEngineWorker.stubAllAssetsLoad();
      mockFxLib.stubSuccess();
      fxConfig.backgroundReplacement.isEnabled = true;
      fxProcessor = await VideoFxProcessor.create(logger, fxConfig);
      await fxProcessor.destroy();
      assert.equal(fxProcessor['canvasVideoFrameBuffer']['destroyed'], true);
    });

    it('can handle destroying assets that are not created yet', async () => {
      fxProcessor = new VideoFxProcessor(logger);
      mockEngineWorker.stubFailedWorker();
      mockFxLib.stubFailedInitialize();
      await fxProcessor.destroy();
      assert.equal(fxProcessor['canvasVideoFrameBuffer']['destroyed'], true);
    });
  });

  describe('unexpected events', () => {
    it('can recognize an unknown worker message', async () => {
      mockEngineWorker.stubSendInvalidMessage();
      mockFxLib.stubSuccess();
      const infoSpy = sandbox.spy(logger, 'info');
      await VideoFxProcessor.create(logger, fxConfig);
      const expectedInfo = `VideoFx worker received unknown event msg: {"msg":"invalidMessage"}`;
      expect(infoSpy.calledWith(expectedInfo)).to.be.true;
    });
  });
});
