// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';

import { BackgroundFilterSpec, BackgroundReplacementOptions } from '../../src';
import BackgroundFilterFrameCounter from '../../src/backgroundfilter/BackgroundFilterFrameCounter';
import { FilterFrameDurationHighEvent } from '../../src/backgroundfilter/BackgroundFilterVideoFrameProcessorObserver';
import BackgroundReplacementFilter from '../../src/backgroundreplacementprocessor/BackgroundReplacementFilter';
import BackgroundReplacementVideoFrameProcessor from '../../src/backgroundreplacementprocessor/BackgroundReplacementVideoFrameProcessor';
import BackgroundReplacementVideoFrameProcessorObserver from '../../src/backgroundreplacementprocessor/BackgroundReplacementVideoFrameProcessorObserver';
import DefaultEventController from '../../src/eventcontroller/DefaultEventController';
import EventController from '../../src/eventcontroller/EventController';
import ConsoleLogger from '../../src/logger/ConsoleLogger';
import LogLevel from '../../src/logger/LogLevel';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import MeetingSessionConfiguration from '../../src/meetingsession/MeetingSessionConfiguration';
import MeetingSessionCredentials from '../../src/meetingsession/MeetingSessionCredentials';
import MeetingSessionURLs from '../../src/meetingsession/MeetingSessionURLs';
import CanvasVideoFrameBuffer from '../../src/videoframeprocessor/CanvasVideoFrameBuffer';
import NoOpVideoFrameProcessor from '../../src/videoframeprocessor/NoOpVideoFrameProcessor';
import VideoFrameBuffer from '../../src/videoframeprocessor/VideoFrameBuffer';
import BackgroundFilterCommon from '../backgroundprocessor/BackgroundFilterCommon';
import DOMBlobMock from '../domblobmock/DOMBlobMock';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

chai.use(chaiAsPromised);
chai.should();

describe('BackgroundReplacementProcessor', () => {
  const noOpLogger: NoOpDebugLogger = new NoOpDebugLogger();
  let configuration: MeetingSessionConfiguration;
  let eventController: EventController;
  let expect: Chai.ExpectStatic;
  let domMockBuilder: DOMMockBuilder;
  let domMockBehavior: DOMMockBehavior;
  const sandbox: sinon.SinonSandbox = sinon.createSandbox();
  let clock: sinon.SinonFakeTimers;
  const backgroundFilterCommon = new BackgroundFilterCommon();

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
    expect = chai.expect;
    clock = sandbox.useFakeTimers();
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    backgroundFilterCommon.setSandbox(sandbox);
    sandbox
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .stub(BackgroundReplacementFilter as any, 'loadImageExecutor')
      .callsFake(resolve => resolve(new Image()));
  });

  afterEach(() => {
    sandbox.restore();
    domMockBuilder.cleanup();
  });

  const stubSupported = (supported: boolean): void => {
    sandbox.stub(BackgroundReplacementVideoFrameProcessor, 'isSupported').callsFake(
      (): Promise<boolean> => {
        return Promise.resolve(supported);
      }
    );
  };

  describe('BackgroundReplacementFilter', () => {
    const optionWithImagePath = { imageBlob: new DOMBlobMock() };

    it('set image blob', async () => {
      backgroundFilterCommon.stubInit({ initPayload: 2, loadModelPayload: 2 });
      stubSupported(true);
      const brprocessor = (await BackgroundReplacementVideoFrameProcessor.create()) as BackgroundReplacementFilter;
      await brprocessor.loadAssets();

      const origUrl: string = brprocessor['replacementObjectUrl'];
      await brprocessor.setImageBlob(new DOMBlobMock());
      const newUrl: string = brprocessor['replacementObjectUrl'];
      expect(newUrl).to.not.be.equal(origUrl);
    });

    describe('construction', () => {
      it('can be created when not supported', async () => {
        backgroundFilterCommon.stubInit({ initPayload: 2, loadModelPayload: 2 });
        stubSupported(false);

        const brprocessor = await BackgroundReplacementVideoFrameProcessor.create();

        //can add and remove observer
        brprocessor.addObserver({});
        brprocessor.removeObserver({});

        expect(brprocessor).to.be.instanceOf(NoOpVideoFrameProcessor);
        await brprocessor.loadAssets();
        await brprocessor.destroy();
      });

      it('can be created when supported', async () => {
        backgroundFilterCommon.stubInit({ initPayload: 2, loadModelPayload: 2 });
        stubSupported(true);

        // create processor with default
        let brprocessor = (await BackgroundReplacementVideoFrameProcessor.create()) as BackgroundReplacementFilter;
        await brprocessor.destroy();
        brprocessor = (await BackgroundReplacementVideoFrameProcessor.create(
          null,
          optionWithImagePath
        )) as BackgroundReplacementFilter;
        await brprocessor.destroy();
      });
      it('can be created with eventController', async () => {
        backgroundFilterCommon.stubInit({ initPayload: 2, loadModelPayload: 2 });
        stubSupported(true);

        // create processor with default configuration
        configuration = makeSessionConfiguration();
        eventController = new DefaultEventController(configuration, noOpLogger);
        let brprocessor = (await BackgroundReplacementVideoFrameProcessor.create()) as BackgroundReplacementFilter;
        brprocessor.setEventController(eventController);
        await brprocessor.destroy();
        brprocessor = (await BackgroundReplacementVideoFrameProcessor.create(
          null,
          optionWithImagePath
        )) as BackgroundReplacementFilter;
        await brprocessor.destroy();
      });
      it('can be created with eventController replacement', async () => {
        backgroundFilterCommon.stubInit({ initPayload: 2, loadModelPayload: 2 });
        stubSupported(true);

        // create processor with default configuration
        configuration = makeSessionConfiguration();
        eventController = new DefaultEventController(configuration, noOpLogger);
        const eventController2 = new DefaultEventController(configuration, noOpLogger);
        let brprocessor = (await BackgroundReplacementVideoFrameProcessor.create()) as BackgroundReplacementFilter;
        brprocessor.setEventController(eventController);
        brprocessor.setEventController(eventController2);
        await brprocessor.destroy();
        brprocessor = (await BackgroundReplacementVideoFrameProcessor.create(
          null,
          optionWithImagePath
        )) as BackgroundReplacementFilter;
        await brprocessor.destroy();
      });
    });

    describe('isSupported', () => {
      const logger = new ConsoleLogger('BackgroundReplacementProcessor', LogLevel.INFO);
      it('valid replacement image is provided', async () => {
        // everything is supported
        backgroundFilterCommon.stubFineGrainSupport({});
        expect(
          await BackgroundReplacementVideoFrameProcessor.isSupported(null, {
            logger,
            ...optionWithImagePath,
          })
        ).to.be.equal(true);
      });

      it('replacement image is not provided', async () => {
        backgroundFilterCommon.stubFineGrainSupport({});
        expect(
          await BackgroundReplacementVideoFrameProcessor.isSupported(null, { logger })
        ).to.be.equal(true);
      });

      it('invalid replacement image is provided', async () => {
        sandbox
          .stub(BackgroundReplacementFilter, 'loadImage')
          .returns(Promise.reject(new Error('got a problem')));
        expect(
          await BackgroundReplacementVideoFrameProcessor.isSupported(null, {
            logger,
            ...optionWithImagePath,
          })
        ).to.be.equal(false);
      });
    });

    describe('processor filter observer', async () => {
      let brprocessor: BackgroundReplacementFilter;
      let frameCounter: BackgroundFilterFrameCounter;
      let observer: BackgroundReplacementVideoFrameProcessorObserver;

      const framerate = 15;

      let observedDurationHighEvent: FilterFrameDurationHighEvent;
      let durationHighCallCount = 0;
      beforeEach(async () => {
        backgroundFilterCommon.stubInit({ initPayload: 2, loadModelPayload: 2 });
        stubSupported(true);
        clock.reset();
        observedDurationHighEvent = null;
        durationHighCallCount = 0;

        brprocessor = (await BackgroundReplacementVideoFrameProcessor.create(null, {
          filterCPUUtilization: 50,
        })) as BackgroundReplacementFilter;
        frameCounter = brprocessor['frameCounter'];

        observer = {
          filterFrameDurationHigh: event => {
            observedDurationHighEvent = event;
            durationHighCallCount++;
          },
        };
        brprocessor.addObserver(observer);
      });
      it('observer is added and removed', async () => {
        const filterDurationSpy = sandbox.spy(brprocessor['delegate'], 'filterFrameDurationHigh');

        for (let i = 0; i < framerate; i++) {
          frameCounter.filterSubmitted();
          clock.tick(1000 / framerate + 1);
          frameCounter.filterComplete();
        }
        frameCounter.frameReceived(framerate);
        expect(filterDurationSpy.calledOnce).to.be.true;
        expect(observedDurationHighEvent).to.be.not.null;
        expect(durationHighCallCount).to.be.equal(1);

        brprocessor.removeObserver(observer);
        for (let i = 0; i < framerate; i++) {
          frameCounter.filterSubmitted();
          clock.tick(1000 / framerate + 1);
          frameCounter.filterComplete();
        }
        frameCounter.frameReceived(framerate);
        expect(filterDurationSpy.calledOnce).to.be.false;
      });
    });

    describe('predict', () => {
      it('not supported is no op', async () => {
        backgroundFilterCommon.stubInit({ initPayload: 2, loadModelPayload: 2 });
        stubSupported(false);
        const processor = (await BackgroundReplacementVideoFrameProcessor.create()) as BackgroundReplacementFilter;
        expect(processor['replacementBlob']).is.undefined;

        // this is a no op call here just for coverage and making sure it does not blow up.
        await (processor as BackgroundReplacementFilter).setImageBlob(new DOMBlobMock());
      });

      it('can predict', async () => {
        backgroundFilterCommon.stubInit({ initPayload: 2, loadModelPayload: 2 });
        stubSupported(true);

        const canvas = document.createElement('canvas');
        const buffers: VideoFrameBuffer[] = [new CanvasVideoFrameBuffer(canvas)];

        canvas.height = 540;
        canvas.width = 960;

        // When replacement image is not passed
        let brprocessor = (await BackgroundReplacementVideoFrameProcessor.create()) as BackgroundReplacementFilter;
        let frameCounter = brprocessor['frameCounter'];

        let output = await brprocessor.process(buffers);
        expect(output[0]).to.equal(brprocessor['canvasVideoFrameBuffer']);
        expect(frameCounter.processingSegment).to.be.false;

        // confirm no failure when passing in null mask
        brprocessor.drawImageWithMask(document.createElement('canvas'), null);
        brprocessor.drawImageWithMask(document.createElement('canvas'), new ImageData(10, 10));

        // When replacement image is passed
        brprocessor = (await BackgroundReplacementVideoFrameProcessor.create(
          null,
          optionWithImagePath
        )) as BackgroundReplacementFilter;
        frameCounter = brprocessor['frameCounter'];
        output = await brprocessor.process(buffers);

        expect(output[0]).to.equal(brprocessor['canvasVideoFrameBuffer']);
        expect(frameCounter.processingSegment).to.be.false;

        // confirm no failure when passing in null mask
        brprocessor.drawImageWithMask(document.createElement('canvas'), null);
        brprocessor.drawImageWithMask(document.createElement('canvas'), new ImageData(10, 10));
      });

      it('can predict when input dimensions are interchanged', async () => {
        backgroundFilterCommon.stubInit({ initPayload: 2, loadModelPayload: 2 });
        stubSupported(true);

        const canvas = document.createElement('canvas');
        let buffers: VideoFrameBuffer[] = [new CanvasVideoFrameBuffer(canvas)];

        canvas.height = 540;
        canvas.width = 960;

        // When replacement image is not passed
        let brprocessor = (await BackgroundReplacementVideoFrameProcessor.create()) as BackgroundReplacementFilter;

        // When replacement image is passed
        brprocessor = (await BackgroundReplacementVideoFrameProcessor.create(
          null,
          optionWithImagePath
        )) as BackgroundReplacementFilter;
        let output = await brprocessor.process(buffers);
        expect(output[0]).to.equal(brprocessor['canvasVideoFrameBuffer']);

        canvas.height = 960;
        canvas.width = 540;
        buffers = [new CanvasVideoFrameBuffer(canvas)];
        output = await brprocessor.process(buffers);
        expect(output[0]).to.equal(brprocessor['canvasVideoFrameBuffer']);
      });
    });
  });

  describe('BackgroundReplacementVideoFrameProcessor', () => {
    let spec: BackgroundFilterSpec;
    let options: BackgroundReplacementOptions;

    beforeEach(() => {
      spec = undefined;
      options = {
        imageBlob: undefined,
      };
    });

    it('create should not change spec and options by reference', async () => {
      backgroundFilterCommon.stubInit({ initPayload: 2, loadModelPayload: 2 });
      stubSupported(true);

      // create processor
      const bbprocessor = await BackgroundReplacementVideoFrameProcessor.create(spec, options);

      // expect spec and options not changed by reference
      expect(spec).to.deep.equal(undefined);
      expect(options).to.deep.equal({ imageBlob: undefined });

      await bbprocessor.destroy();
    });

    it('isSupported should not change spec and options by reference', async () => {
      backgroundFilterCommon.stubInit({ initPayload: 2, loadModelPayload: 2 });
      stubSupported(true);

      // create processor
      await BackgroundReplacementVideoFrameProcessor.isSupported(spec, options);

      // expect spec and options not changed by reference
      expect(spec).to.deep.equal(undefined);
      expect(options).to.deep.equal({ imageBlob: undefined });
    });
  });

  describe('BackgroundReplacementVideoFrameProcessor', () => {
    let spec: BackgroundFilterSpec;
    let options: BackgroundReplacementOptions;

    beforeEach(() => {
      spec = undefined;
      options = {
        imageBlob: undefined,
      };
    });

    it('create should not change spec and options by reference', async () => {
      backgroundFilterCommon.stubInit({ initPayload: 2, loadModelPayload: 2 });
      stubSupported(true);

      // create processor
      const bbprocessor = await BackgroundReplacementVideoFrameProcessor.create(spec, options);

      // expect spec and options not changed by reference
      expect(spec).to.deep.equal(undefined);
      expect(options).to.deep.equal({ imageBlob: undefined });

      await bbprocessor.destroy();
    });

    it('isSupported should not change spec and options by reference', async () => {
      backgroundFilterCommon.stubInit({ initPayload: 2, loadModelPayload: 2 });
      stubSupported(true);

      // create processor
      await BackgroundReplacementVideoFrameProcessor.isSupported(spec, options);

      // expect spec and options not changed by reference
      expect(spec).to.deep.equal(undefined);
      expect(options).to.deep.equal({ imageBlob: undefined });
    });
  });
});
