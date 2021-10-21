// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import * as loader from '../../libs/voicefocus/loader';
import * as support from '../../libs/voicefocus/support';
import BackgroundBlurOptions from '../../src/backgroundblurprocessor/BackgroundBlurOptions';
import BackgroundBlurProcessorBuiltIn from '../../src/backgroundblurprocessor/BackgroundBlurProcessorBuiltIn';
import BackgroundBlurProcessorProvided from '../../src/backgroundblurprocessor/BackgroundBlurProcessorProvided';
import BlurStrength from '../../src/backgroundblurprocessor/BackgroundBlurStrength';
import BackgroundBlurVideoFrameProcessor from '../../src/backgroundblurprocessor/BackgroundBlurVideoFrameProcessor';
import BackgroundBlurVideoFrameProcessorObserver from '../../src/backgroundblurprocessor/BackgroundBlurVideoFrameProcessorObserver';
import BackgroundFilterFrameCounter from '../../src/backgroundblurprocessor/BackgroundFilterFrameCounter';
import ModelSpecBuilder from '../../src/backgroundblurprocessor/ModelSpecBuilder';
import ConsoleLogger from '../../src/logger/ConsoleLogger';
import LogLevel from '../../src/logger/LogLevel';
import CanvasVideoFrameBuffer from '../../src/videoframeprocessor/CanvasVideoFrameBuffer';
import NoOpVideoFrameProcessor from '../../src/videoframeprocessor/NoOpVideoFrameProcessor';
import VideoFrameBuffer from '../../src/videoframeprocessor/VideoFrameBuffer';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('BackgroundBlurProcessor', () => {
  let expect: Chai.ExpectStatic;
  let domMockBuilder: DOMMockBuilder;
  let domMockBehavior: DOMMockBehavior;
  const sandbox: sinon.SinonSandbox = sinon.createSandbox();
  let clock: sinon.SinonFakeTimers;

  beforeEach(() => {
    expect = chai.expect;
    clock = sandbox.useFakeTimers();
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
  });

  afterEach(() => {
    sandbox.restore();
    domMockBuilder.cleanup();
  });

  const stubInit = (
    options: {
      initPayload?: number;
      loadModelPayload?: number;
      predictPayload?: ImageData;
      callInvalidMessage?: boolean;
    } = {
      initPayload: 1,
      loadModelPayload: 1,
      predictPayload: null,
      callInvalidMessage: false,
    }
  ): void => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let eventListener: (evt: MessageEvent<any>) => any = () => {
      console.error('eventListener is not set');
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function handlePostMessage(evt: any): void {
      switch (evt.msg) {
        case 'initialize':
          eventListener(
            new MessageEvent('message', {
              data: {
                msg: 'initialize',
                payload: options.initPayload,
              },
            })
          );
          break;
        case 'loadModel':
          eventListener(
            new MessageEvent('message', {
              data: {
                msg: 'loadModel',
                payload: options.loadModelPayload,
              },
            })
          );
          // send an invalid event to listener after the processor is fully inited in order to test an invalid message
          // being sent back from the worker.
          if (options.callInvalidMessage) {
            eventListener(
              new MessageEvent('message', {
                data: {
                  msg: 'invalidMessage',
                },
              })
            );
          }
          break;
        case 'predict':
          const predictEvent = new MessageEvent('message', {
            data: {
              msg: 'predict',
              payload: options.predictPayload ?? evt.payload,
            },
          });
          eventListener(predictEvent);
          break;
      }
    }

    const workerPromise = new Promise<Worker>(resolve => {
      resolve({
        postMessage: handlePostMessage,
        onmessage: () => {},
        onmessageerror: () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        addEventListener: (type: string, listener: (evt: MessageEvent<any>) => any) => {
          eventListener = listener;
        },
        removeEventListener: () => {},
        terminate: () => {},
        dispatchEvent: () => true,
        onerror: () => {},
      });
    });

    sandbox.stub(loader, 'loadWorker').returns(workerPromise);
  };

  const stubSupported = (supported: boolean, providedSupported: boolean = true): void => {
    sandbox.stub(BackgroundBlurVideoFrameProcessor, 'isSupported').callsFake(
      (): Promise<boolean> => {
        return Promise.resolve(supported);
      }
    );
    sandbox.stub(BackgroundBlurProcessorProvided, 'isSupported').callsFake(
      (): Promise<boolean> => {
        return Promise.resolve(providedSupported);
      }
    );
  };

  const stubFineGrainSupport = (options: {
    supportsWorker?: boolean;
    supportsWASM?: boolean;
    loadWorkerRejects?: boolean;
    workerTerminateThrows?: boolean;
  }): void => {
    const supportsWorker = options.supportsWorker ?? true;
    const supportsWASM = options.supportsWASM ?? true;
    const loadWorkerRejects = options.loadWorkerRejects ?? false;
    const workerTerminateThrows = options.workerTerminateThrows ?? false;

    const terminate = workerTerminateThrows
      ? () => {
          throw new Error('terminate throws');
        }
      : () => {};

    const workerPromise = new Promise<Worker>(resolve => {
      resolve({
        postMessage: () => {},
        onmessage: () => {},
        onmessageerror: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        terminate: terminate,
        dispatchEvent: () => true,
        onerror: () => {},
      });
    });

    if (loadWorkerRejects) {
      sandbox.stub(loader, 'loadWorker').throws('worker threw');
    } else {
      sandbox.stub(loader, 'loadWorker').returns(workerPromise);
    }

    sandbox.stub(support, 'supportsWorker').returns(supportsWorker);
    sandbox.stub(support, 'supportsWASM').returns(supportsWASM);
  };

  describe('BackgroundBlurProcessorProvided', () => {
    describe('construction', () => {
      it('can be created when not supported', async () => {
        stubInit({ initPayload: 2, loadModelPayload: 2 });
        stubSupported(false);

        const bbprocessor = await BackgroundBlurVideoFrameProcessor.create();

        //can add and remove observer
        bbprocessor.addObserver({});
        bbprocessor.removeObserver({});

        expect(bbprocessor).to.be.instanceOf(NoOpVideoFrameProcessor);
        bbprocessor.setBlurStrength(1);
        await bbprocessor.loadAssets();
        await bbprocessor.destroy();
      });

      it('provided cannot be created with invalid inputs', async () => {
        const validSpec = {
          paths: {
            worker: 'worker',
            wasm: 'wasm',
            simd: 'wasm-simd',
          },
          model: ModelSpecBuilder.builder().withSelfieSegmentationDefaults().build(),
        };
        const validOptions: BackgroundBlurOptions = {
          logger: new ConsoleLogger('test', LogLevel.INFO),
          reportingPeriodMillis: 1000,
          blurStrength: 10,
        };

        expect(() => new BackgroundBlurProcessorProvided(null, validOptions)).to.throw(
          'processor has null spec'
        );
        expect(
          () => new BackgroundBlurProcessorProvided({ ...validSpec, paths: null }, validOptions)
        ).to.throw('processor spec has null paths');
        expect(
          () => new BackgroundBlurProcessorProvided({ ...validSpec, model: null }, validOptions)
        ).to.throw('processor spec has null model');

        expect(() => new BackgroundBlurProcessorProvided(validSpec, null)).to.throw(
          'processor has null options'
        );
        expect(
          () => new BackgroundBlurProcessorProvided(validSpec, { ...validOptions, logger: null })
        ).to.throw('processor has null options - logger');
        expect(
          () =>
            new BackgroundBlurProcessorProvided(validSpec, {
              ...validOptions,
              reportingPeriodMillis: null,
            })
        ).to.throw('processor has null options - reportingPeriodMillis');
        expect(
          () =>
            new BackgroundBlurProcessorProvided(validSpec, { ...validOptions, blurStrength: null })
        ).to.throw('processor has null options - blurStrength');
      });

      it('can be destroyed when items are null', async () => {
        stubInit({ initPayload: 2, loadModelPayload: 2 });
        stubSupported(true);

        let bbprocessor = (await BackgroundBlurVideoFrameProcessor.create()) as BackgroundBlurProcessorProvided;
        bbprocessor['worker'] = null;
        bbprocessor['targetCanvas'] = null;
        bbprocessor['scaledCanvas'] = null;
        await bbprocessor.destroy();

        bbprocessor = (await BackgroundBlurVideoFrameProcessor.create()) as BackgroundBlurProcessorProvided;
        (bbprocessor['worker'] = await loader.loadWorker(null, null, null)),
          (bbprocessor['targetCanvas'] = document.createElement('canvas'));
        bbprocessor['scaledCanvas'] = document.createElement('canvas');
        await bbprocessor.destroy();
      });

      it('default event handled', async () => {
        stubInit({ initPayload: 2, loadModelPayload: 2, callInvalidMessage: true });
        stubSupported(true);

        const logger = new ConsoleLogger('BackgroundBlurProcessor', LogLevel.INFO);
        const infoSpy = sandbox.spy(logger, 'info');
        await BackgroundBlurVideoFrameProcessor.create(null, { logger });

        const expectedMsg = JSON.stringify({ msg: 'invalidMessage' }, null, 2);
        expect(infoSpy.calledWith(`unexpected event msg: ${expectedMsg}`)).to.be.true;
      });

      it('can be created with custom logger', async () => {
        stubInit({ initPayload: 2, loadModelPayload: 2 });
        stubSupported(true);

        const logger = {
          debug: () => {},
          info: () => {},
          warn: () => {},
          error: () => {},
          setLogLevel: () => {},
          getLogLevel: () => {
            return LogLevel.DEBUG;
          },
        };
        const bbprocessor = (await BackgroundBlurVideoFrameProcessor.create(null, {
          logger: logger,
        })) as BackgroundBlurProcessorProvided;
        expect(bbprocessor['logger']).to.be.equal(logger);
      });

      it('can be created when supported', async () => {
        stubInit({ initPayload: 2, loadModelPayload: 2 });
        stubSupported(true);

        const expectProcessorResults = async (
          bbprocessor: BackgroundBlurProcessorProvided,
          options: {
            blurStrength: number;
            supported: boolean;
            modelPath: string;
            workerPath: string;
            wasmPath: string;
            simdPath: string;
          }
        ): Promise<void> => {
          await bbprocessor.destroy();
          expect(bbprocessor).to.not.equal(null);
          expect(bbprocessor['_blurStrength']).to.be.equal(options.blurStrength);
          expect(bbprocessor['spec']?.model?.path).to.be.satisfy((msg: string) =>
            msg.startsWith(options.modelPath)
          );
          expect(bbprocessor['spec']?.paths?.worker).to.be.satisfy((msg: string) =>
            msg.startsWith(options.workerPath)
          );
          expect(bbprocessor['spec']?.paths?.wasm).to.be.satisfy((msg: string) =>
            msg.startsWith(options.wasmPath)
          );
          expect(bbprocessor['spec']?.paths?.simd).to.be.satisfy((msg: string) =>
            msg.startsWith(options.simdPath)
          );
        };

        const expectedResults = {
          supported: true,
          blurStrength: BlurStrength.MEDIUM,
          modelPath:
            'https://static.sdkassets.chime.aws/bgblur/models/selfie_segmentation_landscape.tflite',
          workerPath: 'https://static.sdkassets.chime.aws/bgblur/workers/worker.js',
          wasmPath: 'https://static.sdkassets.chime.aws/bgblur/wasm/_cwt-wasm.wasm',
          simdPath: 'https://static.sdkassets.chime.aws/bgblur/wasm/_cwt-wasm-simd.wasm',
        };

        // create processor with defaults
        let bbprocessor = (await BackgroundBlurVideoFrameProcessor.create()) as BackgroundBlurProcessorProvided;
        await bbprocessor.destroy();
        await expectProcessorResults(bbprocessor, {
          ...expectedResults,
        });

        // create processor with paths only
        bbprocessor = (await BackgroundBlurVideoFrameProcessor.create({
          paths: {
            worker: 'http://worker',
            wasm: 'http://wasm',
            simd: 'http://simd',
          },
        })) as BackgroundBlurProcessorProvided;
        await bbprocessor.destroy();
        await expectProcessorResults(bbprocessor, {
          ...expectedResults,
          workerPath: 'http://worker',
          wasmPath: 'http://wasm',
          simdPath: 'http://simd',
        });

        // create processor with model and paths defined
        bbprocessor = (await BackgroundBlurVideoFrameProcessor.create({
          paths: {
            worker: 'http://worker',
            wasm: 'http://wasm',
            simd: 'http://simd',
          },
          model: {
            path: 'http://model',
            input: { height: 1, width: 1, channels: 3, range: [0, 1] },
            output: { height: 1, width: 1, channels: 3, range: [0, 1] },
          },
        })) as BackgroundBlurProcessorProvided;
        await bbprocessor.destroy();
        await expectProcessorResults(bbprocessor, {
          ...expectedResults,
          modelPath: 'http://model',
          workerPath: 'http://worker',
          wasmPath: 'http://wasm',
          simdPath: 'http://simd',
        });

        // create processor with model only
        bbprocessor = (await BackgroundBlurVideoFrameProcessor.create({
          model: {
            path: 'http://model',
            input: { height: 1, width: 1, channels: 3, range: [0, 1] },
            output: { height: 1, width: 1, channels: 3, range: [0, 1] },
          },
        })) as BackgroundBlurProcessorProvided;
        await bbprocessor.destroy();
        await expectProcessorResults(bbprocessor, {
          ...expectedResults,
          modelPath: 'http://model',
        });

        // create processor with asset group
        bbprocessor = (await BackgroundBlurVideoFrameProcessor.create({
          paths: {
            worker: 'http://worker',
            wasm: 'http://wasm',
            simd: 'http://simd',
          },
          model: {
            path: 'http://model',
            input: { height: 1, width: 1, channels: 3, range: [0, 1] },
            output: { height: 1, width: 1, channels: 3, range: [0, 1] },
          },
          assetGroup: 'asset_group',
        })) as BackgroundBlurProcessorProvided;
        await bbprocessor.destroy();
        await expectProcessorResults(bbprocessor, {
          ...expectedResults,
          modelPath: 'http://model/?assetGroup=asset_group',
          workerPath: 'http://worker/?assetGroup=asset_group',
          wasmPath: 'http://wasm/?assetGroup=asset_group',
          simdPath: 'http://simd/?assetGroup=asset_group',
        });

        // create processor with asset group & rev id
        bbprocessor = (await BackgroundBlurVideoFrameProcessor.create({
          paths: {
            worker: 'http://worker',
            wasm: 'http://wasm',
            simd: 'http://simd',
          },
          model: {
            path: 'http://model',
            input: { height: 1, width: 1, channels: 3, range: [0, 1] },
            output: { height: 1, width: 1, channels: 3, range: [0, 1] },
          },
          assetGroup: 'asset_group',
          revisionID: 'rev_id',
        })) as BackgroundBlurProcessorProvided;
        await bbprocessor.destroy();
        await expectProcessorResults(bbprocessor, {
          ...expectedResults,
          modelPath: 'http://model/?assetGroup=asset_group&revisionID=rev_id',
          workerPath: 'http://worker/?assetGroup=asset_group&revisionID=rev_id',
          wasmPath: 'http://wasm/?assetGroup=asset_group&revisionID=rev_id',
          simdPath: 'http://simd/?assetGroup=asset_group&revisionID=rev_id',
        });

        //invalid blur strength
        await expect(
          BackgroundBlurVideoFrameProcessor.create(null, {
            blurStrength: -1,
          })
        ).to.be.rejectedWith('invalid value for blur strength: -1');
      });

      it('init module fails', async () => {
        stubInit({ initPayload: null, loadModelPayload: 2 });
        stubSupported(true);

        await expect(BackgroundBlurVideoFrameProcessor.create()).to.be.rejectedWith(
          "could not initialize the background blur video frame processor due to 'failed to initialize the module'"
        );
      });

      it('init load model fails', async () => {
        stubInit({ initPayload: 2, loadModelPayload: null });
        stubSupported(true);

        await expect(BackgroundBlurVideoFrameProcessor.create()).to.be.rejectedWith(
          "could not initialize the background blur video frame processor due to 'failed to load model! status: null'"
        );
      });

      it('provided is not supported', async () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.filter = undefined;
        sandbox.stub(canvas, 'getContext').returns(context);
        sandbox.stub(document, 'createElement').returns(canvas);
        expect(await BackgroundBlurProcessorProvided.isSupported()).to.be.false;
      });

      it('provided is supported', async () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.filter = 'test';
        sandbox.stub(canvas, 'getContext').returns(context);
        sandbox.stub(document, 'createElement').returns(canvas);
        expect(await BackgroundBlurProcessorProvided.isSupported()).to.be.true;
      });
    });

    describe('predict', () => {
      it('not supported is no op', async () => {
        stubInit({ initPayload: 2, loadModelPayload: 2 });
        stubSupported(false);

        const buffers: VideoFrameBuffer[] = [
          new CanvasVideoFrameBuffer(document.createElement('canvas')),
        ];

        const bbprocessor = await BackgroundBlurVideoFrameProcessor.create();
        const output = await bbprocessor.process(buffers);
        expect(output).to.equal(buffers);
      });

      it('no canvas is no op', async () => {
        stubInit({ initPayload: 2, loadModelPayload: 2 });
        stubSupported(true);

        const buffers: VideoFrameBuffer[] = [new CanvasVideoFrameBuffer(null)];
        const bbprocessor = await BackgroundBlurVideoFrameProcessor.create();
        const output = await bbprocessor.process(buffers);
        expect(output).to.equal(buffers);
      });

      it('canvas height or width is 0', async () => {
        stubInit({ initPayload: 2, loadModelPayload: 2 });
        stubSupported(true);

        const canvas = document.createElement('canvas');
        const buffers: VideoFrameBuffer[] = [new CanvasVideoFrameBuffer(canvas)];

        const bbprocessor = await BackgroundBlurVideoFrameProcessor.create();

        canvas.height = 0;
        let output = await bbprocessor.process(buffers);
        expect(output).to.equal(buffers);

        canvas.width = 0;
        output = await bbprocessor.process(buffers);
        expect(output).to.equal(buffers);
      });

      it('can predict', async () => {
        stubInit({ initPayload: 2, loadModelPayload: 2 });
        stubSupported(true);

        const canvas = document.createElement('canvas');
        const buffers: VideoFrameBuffer[] = [new CanvasVideoFrameBuffer(canvas)];

        canvas.height = 540;
        canvas.width = 960;

        const bbprocessor = (await BackgroundBlurVideoFrameProcessor.create(null, {
          reportingPeriodMillis: 1,
        })) as BackgroundBlurProcessorProvided;
        const frameCounter = bbprocessor['frameCounter'];

        await bbprocessor.process(buffers);
        const output = await bbprocessor.process(buffers);
        expect(output[0]).to.equal(bbprocessor['canvasVideoFrameBuffer']);
        expect(frameCounter.processingSegment).to.be.false;

        // confirm no failure when passing in null mask
        bbprocessor.drawImageWithMask(document.createElement('canvas'), null);
        bbprocessor.drawImageWithMask(document.createElement('canvas'), new ImageData(10, 10));
      });

      it('predict handles failures', async () => {
        stubInit({ initPayload: 2, loadModelPayload: 2 });
        stubSupported(true);

        const canvas = document.createElement('canvas');
        const buffers: VideoFrameBuffer[] = [new CanvasVideoFrameBuffer(canvas)];

        canvas.height = 540;
        canvas.width = 960;

        const bbprocessor = (await BackgroundBlurVideoFrameProcessor.create(null, {
          reportingPeriodMillis: 1,
        })) as BackgroundBlurProcessorProvided;
        sandbox.stub(bbprocessor, 'drawImageWithMask').throws('draw failed');
        clock.tick(10);
        const output = await bbprocessor.process(buffers);

        expect(output[0]).to.be.deep.equal(buffers[0]);
      });

      it('can predict when model not initialized', async () => {
        stubInit({ initPayload: 2, loadModelPayload: 2 });
        stubSupported(true);

        const canvas = document.createElement('canvas');
        const buffers: VideoFrameBuffer[] = [new CanvasVideoFrameBuffer(canvas)];

        canvas.height = 540;
        canvas.width = 960;

        const bbprocessor = (await BackgroundBlurVideoFrameProcessor.create(null, {
          reportingPeriodMillis: 1,
        })) as BackgroundBlurProcessorProvided;
        bbprocessor['modelInitialized'] = false;
        const output = await bbprocessor.process(buffers);
        expect(output[0]).to.be.equal(buffers[0]);
      });
    });

    it('is supported', async () => {
      const logger = new ConsoleLogger('BackgroundBlurProcessor', LogLevel.INFO);
      const supportedCheck = async (expected: boolean): Promise<void> => {
        expect(await BackgroundBlurVideoFrameProcessor.isSupported(null, { logger })).to.be.equal(
          expected
        );
        sandbox.restore();
      };

      // everything is supported
      stubFineGrainSupport({});
      await supportedCheck(true);

      // worker terminate is swallowed and is still supported
      stubFineGrainSupport({ workerTerminateThrows: true });
      await supportedCheck(true);

      // browser does not support worker
      stubFineGrainSupport({ supportsWorker: false });
      await supportedCheck(false);

      // browser does not support WASM
      stubFineGrainSupport({ supportsWASM: false });
      await supportedCheck(false);

      // browser does not support loading worker
      stubFineGrainSupport({ loadWorkerRejects: true });
      await supportedCheck(false);
    });

    describe('browser support', () => {
      const setUserAgent = (userAgent: string): void => {
        // @ts-ignore
        navigator.userAgent = userAgent;
      };

      it('is browser supported', async () => {
        stubFineGrainSupport({});
        const logger = new ConsoleLogger('BackgroundBlurProcessor', LogLevel.INFO);

        setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3865.75 Safari/537.36'
        );
        await expect(
          await BackgroundBlurVideoFrameProcessor.isSupported(null, { logger })
        ).to.be.equal(true);

        setUserAgent(
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Safari/605.1.15'
        );
        await expect(
          await BackgroundBlurVideoFrameProcessor.isSupported(null, { logger })
        ).to.be.equal(true);

        setUserAgent(
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1.2 Safari/605.1.15'
        );
        await expect(
          await BackgroundBlurVideoFrameProcessor.isSupported(null, { logger })
        ).to.be.equal(false);
      });
    });

    describe('processor filter duration observer', async () => {
      let bbprocessor: BackgroundBlurProcessorProvided;
      let frameCounter: BackgroundFilterFrameCounter;
      let observer: BackgroundBlurVideoFrameProcessorObserver;

      const framerate = 15;

      let observedEvent: {
        framesDropped: number;
        avgFilterDurationMillis: number;
        framerate: number;
        periodMillis: number;
      } = null;
      let callCount = 0;

      const expectSegmentCount = (): Chai.Assertion => {
        return expect(frameCounter['filterCount']);
      };

      const expectSegmentTotalMillis = (): Chai.Assertion => {
        return expect(frameCounter['filterTotalMillis']);
      };

      beforeEach(async () => {
        stubInit({ initPayload: 2, loadModelPayload: 2 });
        stubSupported(true);

        clock.reset();
        observedEvent = null;
        callCount = 0;

        bbprocessor = (await BackgroundBlurVideoFrameProcessor.create()) as BackgroundBlurProcessorProvided;
        frameCounter = bbprocessor['frameCounter'];

        observer = {
          filterFrameDurationHigh: event => {
            observedEvent = event;
            callCount++;
          },
        };
        bbprocessor.addObserver(observer);
      });

      it('observer is called when filtering duration high', async () => {
        for (let i = 0; i < framerate - 1; i++) {
          frameCounter.filterSubmitted();
          clock.tick(1000 / framerate + 10);
          frameCounter.filterComplete();
          frameCounter.frameReceived(framerate);
        }
        frameCounter.frameReceived(framerate);
        frameCounter.frameReceived(framerate);
        expect(observedEvent).to.be.deep.equal({
          framesDropped: 2,
          avgFilterDurationMillis: 77,
          framerate: 15,
          periodMillis: 1073,
        });
        expect(callCount).to.be.equal(1);
        expectSegmentCount().to.be.equal(0);
        expectSegmentTotalMillis().to.be.equal(0);
      });

      it('observer is not called when filtering duration is low', async () => {
        for (let i = 0; i < 16; i++) {
          frameCounter.filterSubmitted();
          frameCounter.filterComplete();
        }
        clock.tick(1001);
        frameCounter.frameReceived(framerate);
        expect(observedEvent).to.be.null;
        expect(callCount).to.be.equal(0);
        expectSegmentCount().to.be.equal(0);
        expectSegmentTotalMillis().to.be.equal(0);
      });

      it('observer is not called when removed filter duration is high', async () => {
        const filterDurationSpy = sandbox.spy(bbprocessor['delegate'], 'filterFrameDurationHigh');

        bbprocessor.removeObserver(observer);
        bbprocessor.addObserver({});
        for (let i = 0; i < framerate; i++) {
          frameCounter.filterSubmitted();
          clock.tick(1000 / framerate + 1);
          frameCounter.filterComplete();
        }
        frameCounter.frameReceived(framerate);
        expect(filterDurationSpy.calledOnce).to.be.true;
        expect(observedEvent).to.be.null;
        expect(callCount).to.be.equal(0);
        expectSegmentCount().to.be.equal(0);
        expectSegmentTotalMillis().to.be.equal(0);
      });
    });

    it('observer is called without functions defined', async () => {
      stubInit({ initPayload: 2, loadModelPayload: 2 });
      stubSupported(true);

      const bbprocessor = (await BackgroundBlurVideoFrameProcessor.create()) as BackgroundBlurProcessorProvided;
      bbprocessor.addObserver({});
      const frameCounter = bbprocessor['frameCounter'];
      const framerate = 15;

      frameCounter['lastReportedEventTimestamp'] = Date.now();
      frameCounter.frameReceived(framerate);
      frameCounter['lastReportedEventTimestamp'] = 0;
      frameCounter.frameReceived(framerate);
    });
  });

  describe('BackgroundBlurProcessorBuiltIn', () => {
    it('can predict', async () => {
      stubInit({ initPayload: 2, loadModelPayload: 2 });
      stubSupported(true, false);

      const canvas = document.createElement('canvas');
      const buffers: VideoFrameBuffer[] = [new CanvasVideoFrameBuffer(canvas)];

      canvas.height = 540;
      canvas.width = 960;

      const bbprocessor = (await BackgroundBlurVideoFrameProcessor.create()) as BackgroundBlurProcessorBuiltIn;
      const output = await bbprocessor.process(buffers);
      expect(output[0]).to.equal(bbprocessor['canvasVideoFrameBuffer']);

      // confirm no failure when passing in null mask
      bbprocessor['blurredImage'] = new ImageData(10, 10);
      bbprocessor.drawImageWithMask(document.createElement('canvas'), null);
      bbprocessor.drawImageWithMask(document.createElement('canvas'), new ImageData(10, 10));

      await bbprocessor.destroy();
      expect(bbprocessor).to.be.instanceOf(BackgroundBlurProcessorBuiltIn);
    });

    it('set blur strength', async () => {
      stubInit({ initPayload: 2, loadModelPayload: 2 });
      stubSupported(true, false);

      const canvas = document.createElement('canvas');
      const buffers: VideoFrameBuffer[] = [new CanvasVideoFrameBuffer(canvas)];

      const bbprocessor = (await BackgroundBlurVideoFrameProcessor.create()) as BackgroundBlurProcessorBuiltIn;
      await bbprocessor.process(buffers);
      expect(bbprocessor['_blurStrength']).to.be.equal(BlurStrength.MEDIUM);
      expect(bbprocessor['modelInitialized']).to.be.true;

      // disable post message so load is not immediately handled
      bbprocessor['worker'].postMessage = () => {};

      bbprocessor.setBlurStrength(123);
      expect(bbprocessor['_blurStrength']).to.be.equal(123);
      expect(bbprocessor['modelInitialized']).to.be.false;

      await bbprocessor.handleLoadModel({ payload: 2 });
      expect(bbprocessor['modelInitialized']).to.be.true;
      await bbprocessor.destroy();
    });

    it('can destroy', async () => {
      stubInit({ initPayload: 2, loadModelPayload: 2 });
      stubSupported(true, false);

      let bbprocessor = (await BackgroundBlurVideoFrameProcessor.create()) as BackgroundBlurProcessorBuiltIn;
      bbprocessor['blurCanvas'] = null;
      await bbprocessor.destroy();

      bbprocessor = (await BackgroundBlurVideoFrameProcessor.create()) as BackgroundBlurProcessorBuiltIn;
      bbprocessor['blurCanvas'] = document.createElement('canvas');
      await bbprocessor.destroy();
    });

    it('initialize handles errors', async () => {
      stubInit({ initPayload: null, loadModelPayload: 2 });
      stubSupported(true, false);

      await expect(BackgroundBlurVideoFrameProcessor.create()).to.be.rejectedWith(
        "could not initialize the background blur video frame processor due to 'failed to initialize the module'"
      );
    });
  });
});
