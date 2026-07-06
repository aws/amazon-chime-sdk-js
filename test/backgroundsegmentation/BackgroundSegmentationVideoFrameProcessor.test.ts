// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import {
  BackgroundSegmentationBlurStrength,
  BackgroundSegmentationInitializationStatus,
  ModelType as ModelTypeFromSrc,
  ProcessorEffect as ProcessorEffectFromSrc,
} from '../../src';
import BackgroundSegmentationCompatibilityChecker from '../../src/backgroundsegmentation/BackgroundSegmentationCompatibilityChecker';
import {
  BlurStrength,
  ModelType,
  ProcessorEffect,
} from '../../src/backgroundsegmentation/BackgroundSegmentationConstants';
import BackgroundSegmentationVideoFrameProcessor from '../../src/backgroundsegmentation/BackgroundSegmentationVideoFrameProcessor';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import VideoFrameBuffer from '../../src/videoframeprocessor/VideoFrameBuffer';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('BackgroundSegmentationVideoFrameProcessor', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpDebugLogger();
  let domMockBehavior: DOMMockBehavior;
  let domMockBuilder: DOMMockBuilder;
  const sandbox: sinon.SinonSandbox = sinon.createSandbox();

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (document as any).head = { appendChild: sandbox.stub() };
  });

  afterEach(() => {
    sandbox.restore();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).BackgroundSegmentationProcessor;
    } catch (e) {
      /* */
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (document as any).head;
    } catch (e) {
      /* */
    }
    domMockBuilder.cleanup();
  });

  describe('barrel exports', () => {
    it('exports named values through index', () => {
      expect(ModelTypeFromSrc).to.equal(ModelType);
      expect(ProcessorEffectFromSrc).to.equal(ProcessorEffect);
      expect(BackgroundSegmentationBlurStrength).to.equal(BlurStrength);
    });
  });

  describe('create', () => {
    it('returns no-op processor when browser is not compatible', async () => {
      sandbox.stub(BackgroundSegmentationCompatibilityChecker, 'checkCompatibility').returns({
        isCompatible: false,
        missingFeatures: ['webgl2'],
      });

      const processor = await BackgroundSegmentationVideoFrameProcessor.create(logger, {
        type: ProcessorEffect.BLUR,
      });
      expect(processor).to.not.be.undefined;

      const buffers = [{} as VideoFrameBuffer];
      const result = await processor.process(buffers);
      expect(result).to.equal(buffers);
    });

    it('handles publishEvent rejection gracefully on compatibility failure', async () => {
      sandbox.stub(BackgroundSegmentationCompatibilityChecker, 'checkCompatibility').returns({
        isCompatible: false,
        missingFeatures: ['webgl2'],
      });

      const eventController = {
        publishEvent: sandbox.stub().rejects(new Error('publish error')),
      };
      const processor = await BackgroundSegmentationVideoFrameProcessor.create(
        logger,
        { type: ProcessorEffect.BLUR },
        ModelType.SELFIE_GENERAL,
        undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        eventController as any
      );
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(processor).to.not.be.undefined;
    });

    it('returns no-op processor when CDN asset loading fails', async () => {
      sandbox.stub(BackgroundSegmentationCompatibilityChecker, 'checkCompatibility').returns({
        isCompatible: true,
        missingFeatures: [],
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document as any).head.appendChild.callsFake((script: any) => {
        script.onerror();
      });

      const processor = await BackgroundSegmentationVideoFrameProcessor.create(logger, {
        type: ProcessorEffect.BLUR,
      });

      const buffers = [{} as VideoFrameBuffer];
      const result = await processor.process(buffers);
      expect(result).to.equal(buffers);
    });

    it('returns no-op processor when ProcessorClass not on window after load', async () => {
      sandbox.stub(BackgroundSegmentationCompatibilityChecker, 'checkCompatibility').returns({
        isCompatible: true,
        missingFeatures: [],
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document as any).head.appendChild.callsFake((script: any) => {
        script.onload();
      });

      const processor = await BackgroundSegmentationVideoFrameProcessor.create(logger, {
        type: ProcessorEffect.BLUR,
      });

      const buffers = [{} as VideoFrameBuffer];
      const result = await processor.process(buffers);
      expect(result).to.equal(buffers);
    });

    it('creates processor successfully when compatible and CDN loads', async () => {
      sandbox.stub(BackgroundSegmentationCompatibilityChecker, 'checkCompatibility').returns({
        isCompatible: true,
        missingFeatures: [],
      });

      const mockCdnProcessor = {
        process: sandbox.stub().resolves([]),
        destroy: sandbox.stub().resolves(),
        getConfig: sandbox
          .stub()
          .returns({ type: ProcessorEffect.BLUR, blurStrength: BlurStrength.MEDIUM }),
        setConfig: sandbox.stub(),
        getModelType: sandbox.stub().returns(ModelType.SELFIE_GENERAL),
        setModelType: sandbox.stub(),
        getMaxCPUUsagePercentage: sandbox.stub().returns(50),
        setMaxCPUUsagePercentage: sandbox.stub(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document as any).head.appendChild.callsFake((script: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).BackgroundSegmentationProcessor = {
          create: sandbox.stub().resolves(mockCdnProcessor),
        };
        script.onload();
      });

      const processor = await BackgroundSegmentationVideoFrameProcessor.create(
        logger,
        { type: ProcessorEffect.BLUR },
        ModelType.SELFIE_GENERAL
      );

      expect(processor).to.not.be.undefined;
    });

    it('creates processor with event controller and publishes started event', async () => {
      sandbox.stub(BackgroundSegmentationCompatibilityChecker, 'checkCompatibility').returns({
        isCompatible: true,
        missingFeatures: [],
      });

      const mockCdnProcessor = {
        process: sandbox.stub().resolves([]),
        destroy: sandbox.stub().resolves(),
        getConfig: sandbox
          .stub()
          .returns({ type: ProcessorEffect.BLUR, blurStrength: BlurStrength.HIGH }),
        setConfig: sandbox.stub(),
        getModelType: sandbox.stub().returns(ModelType.SELFIE_GENERAL),
        setModelType: sandbox.stub(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document as any).head.appendChild.callsFake((script: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).BackgroundSegmentationProcessor = {
          create: sandbox.stub().resolves(mockCdnProcessor),
        };
        script.onload();
      });

      const eventController = {
        publishEvent: sandbox.stub().resolves(),
      };

      const processor = await BackgroundSegmentationVideoFrameProcessor.create(
        logger,
        { type: ProcessorEffect.BLUR },
        ModelType.SELFIE_GENERAL,
        undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        eventController as any
      );
      expect(processor).to.not.be.undefined;
      expect(eventController.publishEvent.called).to.be.true;
    });

    it('returns no-op when ProcessorClass.create throws', async () => {
      sandbox.stub(BackgroundSegmentationCompatibilityChecker, 'checkCompatibility').returns({
        isCompatible: true,
        missingFeatures: [],
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document as any).head.appendChild.callsFake((script: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).BackgroundSegmentationProcessor = {
          create: sandbox.stub().rejects(new Error('create failed')),
        };
        script.onload();
      });

      const processor = await BackgroundSegmentationVideoFrameProcessor.create(logger, {
        type: ProcessorEffect.BLUR,
      });

      const buffers = [{} as VideoFrameBuffer];
      const result = await processor.process(buffers);
      expect(result).to.equal(buffers);
    });

    it('handles publishEvent rejection on processor creation failure', async () => {
      sandbox.stub(BackgroundSegmentationCompatibilityChecker, 'checkCompatibility').returns({
        isCompatible: true,
        missingFeatures: [],
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document as any).head.appendChild.callsFake((script: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).BackgroundSegmentationProcessor = {
          create: sandbox.stub().rejects(new Error('create failed')),
        };
        script.onload();
      });

      const eventController = {
        publishEvent: sandbox.stub().rejects(new Error('publish error')),
      };
      const processor = await BackgroundSegmentationVideoFrameProcessor.create(
        logger,
        { type: ProcessorEffect.BLUR },
        ModelType.SELFIE_GENERAL,
        undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        eventController as any
      );
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(processor).to.not.be.undefined;
    });

    it('publishes filter failed event on incompatibility', async () => {
      sandbox.stub(BackgroundSegmentationCompatibilityChecker, 'checkCompatibility').returns({
        isCompatible: false,
        missingFeatures: ['webgl2'],
      });

      const eventController = {
        publishEvent: sandbox.stub().resolves(),
      };

      await BackgroundSegmentationVideoFrameProcessor.create(
        logger,
        { type: ProcessorEffect.BLUR },
        ModelType.SELFIE_GENERAL,
        undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        eventController as any
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(eventController.publishEvent.calledWith('backgroundFilterFailed', sinon.match.any)).to
        .be.true;
    });

    it('handles script loaded but ProcessorClass not found on window', async () => {
      sandbox.stub(BackgroundSegmentationCompatibilityChecker, 'checkCompatibility').returns({
        isCompatible: true,
        missingFeatures: [],
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document as any).head.appendChild.callsFake((script: any) => {
        // Do NOT set window.BackgroundSegmentationProcessor
        script.onload();
      });

      const processor = await BackgroundSegmentationVideoFrameProcessor.create(logger, {
        type: ProcessorEffect.BLUR,
      });
      // Processor is created but cdnProcessor is null due to the error
      expect(processor).to.not.be.undefined;
    });
  });

  describe('process', () => {
    it('delegates to cdnProcessor when available', async () => {
      sandbox.stub(BackgroundSegmentationCompatibilityChecker, 'checkCompatibility').returns({
        isCompatible: true,
        missingFeatures: [],
      });

      const processedBuffers = [{} as VideoFrameBuffer];
      const mockCdnProcessor = {
        process: sandbox.stub().resolves(processedBuffers),
        destroy: sandbox.stub().resolves(),
        getConfig: sandbox.stub().returns({ type: ProcessorEffect.BLUR }),
        setConfig: sandbox.stub(),
        getModelType: sandbox.stub().returns(ModelType.SELFIE_GENERAL),
        setModelType: sandbox.stub(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document as any).head.appendChild.callsFake((script: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).BackgroundSegmentationProcessor = {
          create: sandbox.stub().resolves(mockCdnProcessor),
        };
        script.onload();
      });

      const processor = await BackgroundSegmentationVideoFrameProcessor.create(logger, {
        type: ProcessorEffect.BLUR,
      });

      const buffers = [{} as VideoFrameBuffer];
      const result = await processor.process(buffers);
      expect(result).to.equal(processedBuffers);
    });

    it('returns buffers and reports error when cdnProcessor.process throws', async () => {
      sandbox.stub(BackgroundSegmentationCompatibilityChecker, 'checkCompatibility').returns({
        isCompatible: true,
        missingFeatures: [],
      });

      const mockCdnProcessor = {
        process: sandbox.stub().rejects(new Error('process failed')),
        destroy: sandbox.stub().resolves(),
        getConfig: sandbox.stub().returns({ type: ProcessorEffect.BLUR }),
        setConfig: sandbox.stub(),
        getModelType: sandbox.stub().returns(ModelType.SELFIE_GENERAL),
        setModelType: sandbox.stub(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document as any).head.appendChild.callsFake((script: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).BackgroundSegmentationProcessor = {
          create: sandbox.stub().resolves(mockCdnProcessor),
        };
        script.onload();
      });

      const processor = await BackgroundSegmentationVideoFrameProcessor.create(logger, {
        type: ProcessorEffect.BLUR,
      });

      const buffers = [{} as VideoFrameBuffer];
      const result = await processor.process(buffers);
      expect(result).to.equal(buffers);
    });
  });

  describe('destroy', () => {
    it('does nothing when cdnProcessor is null', async () => {
      sandbox.stub(BackgroundSegmentationCompatibilityChecker, 'checkCompatibility').returns({
        isCompatible: false,
        missingFeatures: ['webgl2'],
      });

      const processor = await BackgroundSegmentationVideoFrameProcessor.create(logger, {
        type: ProcessorEffect.BLUR,
      });
      await processor.destroy(); // should not throw
    });

    it('calls destroy on cdnProcessor', async () => {
      sandbox.stub(BackgroundSegmentationCompatibilityChecker, 'checkCompatibility').returns({
        isCompatible: true,
        missingFeatures: [],
      });

      const mockCdnProcessor = {
        process: sandbox.stub().resolves([]),
        destroy: sandbox.stub().resolves(),
        getConfig: sandbox.stub().returns({ type: ProcessorEffect.BLUR }),
        setConfig: sandbox.stub(),
        getModelType: sandbox.stub().returns(ModelType.SELFIE_GENERAL),
        setModelType: sandbox.stub(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document as any).head.appendChild.callsFake((script: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).BackgroundSegmentationProcessor = {
          create: sandbox.stub().resolves(mockCdnProcessor),
        };
        script.onload();
      });

      const processor = await BackgroundSegmentationVideoFrameProcessor.create(logger, {
        type: ProcessorEffect.BLUR,
      });
      await processor.destroy();
      expect(mockCdnProcessor.destroy.calledOnce).to.be.true;

      const buffers = [{} as VideoFrameBuffer];
      const result = await processor.process(buffers);
      expect(result).to.equal(buffers);
    });

    it('nulls cdnProcessor even when destroy throws', async () => {
      sandbox.stub(BackgroundSegmentationCompatibilityChecker, 'checkCompatibility').returns({
        isCompatible: true,
        missingFeatures: [],
      });

      const mockCdnProcessor = {
        process: sandbox.stub().resolves([]),
        destroy: sandbox.stub().rejects(new Error('destroy error')),
        getConfig: sandbox.stub().returns({ type: ProcessorEffect.BLUR }),
        setConfig: sandbox.stub(),
        getModelType: sandbox.stub().returns(ModelType.SELFIE_GENERAL),
        setModelType: sandbox.stub(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document as any).head.appendChild.callsFake((script: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).BackgroundSegmentationProcessor = {
          create: sandbox.stub().resolves(mockCdnProcessor),
        };
        script.onload();
      });

      const processor = await BackgroundSegmentationVideoFrameProcessor.create(logger, {
        type: ProcessorEffect.BLUR,
      });

      try {
        await processor.destroy();
      } catch (_e) {
        // expected
      }

      const buffers = [{} as VideoFrameBuffer];
      const result = await processor.process(buffers);
      expect(result).to.equal(buffers);
    });
  });

  describe('config and model methods', () => {
    let processor: BackgroundSegmentationVideoFrameProcessor;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockCdnProcessor: any;

    beforeEach(async () => {
      sandbox.stub(BackgroundSegmentationCompatibilityChecker, 'checkCompatibility').returns({
        isCompatible: true,
        missingFeatures: [],
      });

      mockCdnProcessor = {
        process: sandbox.stub().resolves([]),
        destroy: sandbox.stub().resolves(),
        getConfig: sandbox
          .stub()
          .returns({ type: ProcessorEffect.BLUR, blurStrength: BlurStrength.HIGH }),
        setConfig: sandbox.stub(),
        getModelType: sandbox.stub().returns(ModelType.SELFIE_GENERAL),
        setModelType: sandbox.stub(),
        getMaxCPUUsagePercentage: sandbox.stub().returns(70),
        setMaxCPUUsagePercentage: sandbox.stub(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document as any).head.appendChild.callsFake((script: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).BackgroundSegmentationProcessor = {
          create: sandbox.stub().resolves(mockCdnProcessor),
        };
        script.onload();
      });

      processor = await BackgroundSegmentationVideoFrameProcessor.create(logger, {
        type: ProcessorEffect.BLUR,
      });
    });

    it('getConfig delegates to cdnProcessor', () => {
      const config = processor.getConfig();
      expect(config).to.deep.equal({ type: ProcessorEffect.BLUR, blurStrength: BlurStrength.HIGH });
    });

    it('setConfig delegates to cdnProcessor', () => {
      const newConfig = { type: ProcessorEffect.BLUR as const, blurStrength: BlurStrength.LOW };
      processor.setConfig(newConfig);
      expect(mockCdnProcessor.setConfig.calledWith(newConfig)).to.be.true;
    });

    it('setConfig publishes config event when eventController is set', async () => {
      const eventController = { publishEvent: sandbox.stub().resolves() };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      processor.setEventController(eventController as any);
      const newConfig = { type: ProcessorEffect.BLUR as const, blurStrength: BlurStrength.LOW };
      processor.setConfig(newConfig);
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(eventController.publishEvent.called).to.be.true;
    });

    it('setConfig handles error from cdnProcessor', () => {
      mockCdnProcessor.setConfig.throws(new Error('setConfig error'));
      // Should not throw
      processor.setConfig({ type: ProcessorEffect.BLUR });
    });

    it('setConfig handles publishEvent rejection gracefully', async () => {
      const eventController = {
        publishEvent: sandbox.stub().rejects(new Error('publish failed')),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      processor.setEventController(eventController as any);
      processor.setConfig({ type: ProcessorEffect.BLUR, blurStrength: BlurStrength.LOW });
      await new Promise(resolve => setTimeout(resolve, 10));
      // Should not throw
    });

    it('getModelType delegates to cdnProcessor', () => {
      expect(processor.getModelType()).to.equal(ModelType.SELFIE_GENERAL);
    });

    it('setModelType delegates to cdnProcessor', () => {
      processor.setModelType(ModelType.SELFIE_MULTICLASS);
      expect(mockCdnProcessor.setModelType.calledWith(ModelType.SELFIE_MULTICLASS)).to.be.true;
    });

    it('getMaxCPUUsagePercentage delegates to cdnProcessor', () => {
      expect(processor.getMaxCPUUsagePercentage()).to.equal(70);
    });

    it('setMaxCPUUsagePercentage delegates to cdnProcessor', () => {
      processor.setMaxCPUUsagePercentage(80);
      expect(mockCdnProcessor.setMaxCPUUsagePercentage.calledWith(80)).to.be.true;
    });
  });

  describe('no-op config and model methods', () => {
    let processor: BackgroundSegmentationVideoFrameProcessor;

    beforeEach(async () => {
      sandbox.stub(BackgroundSegmentationCompatibilityChecker, 'checkCompatibility').returns({
        isCompatible: false,
        missingFeatures: ['webgl2'],
      });

      processor = await BackgroundSegmentationVideoFrameProcessor.create(logger, {
        type: ProcessorEffect.BLUR,
      });
    });

    it('getConfig returns undefined when no cdnProcessor', () => {
      expect(processor.getConfig()).to.be.undefined;
    });

    it('setConfig does nothing when no cdnProcessor', () => {
      processor.setConfig({ type: ProcessorEffect.BLUR }); // should not throw
    });

    it('getModelType returns undefined when no cdnProcessor', () => {
      expect(processor.getModelType()).to.be.undefined;
    });

    it('setModelType does nothing when no cdnProcessor', () => {
      processor.setModelType(ModelType.SELFIE_MULTICLASS); // should not throw
    });

    it('getMaxCPUUsagePercentage returns undefined when no cdnProcessor', () => {
      expect(processor.getMaxCPUUsagePercentage()).to.be.undefined;
    });

    it('setMaxCPUUsagePercentage does nothing when no cdnProcessor', () => {
      processor.setMaxCPUUsagePercentage(50); // should not throw
    });
  });

  describe('setEventController', () => {
    it('publishes started event when cdnProcessor and config are available', async () => {
      sandbox.stub(BackgroundSegmentationCompatibilityChecker, 'checkCompatibility').returns({
        isCompatible: true,
        missingFeatures: [],
      });

      const mockCdnProcessor = {
        process: sandbox.stub().resolves([]),
        destroy: sandbox.stub().resolves(),
        getConfig: sandbox
          .stub()
          .returns({ type: ProcessorEffect.BLUR, blurStrength: BlurStrength.MEDIUM }),
        setConfig: sandbox.stub(),
        getModelType: sandbox.stub().returns(ModelType.SELFIE_GENERAL),
        setModelType: sandbox.stub(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document as any).head.appendChild.callsFake((script: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).BackgroundSegmentationProcessor = {
          create: sandbox.stub().resolves(mockCdnProcessor),
        };
        script.onload();
      });

      const processor = await BackgroundSegmentationVideoFrameProcessor.create(logger, {
        type: ProcessorEffect.BLUR,
      });

      const eventController = { publishEvent: sandbox.stub().resolves() };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      processor.setEventController(eventController as any);
      await new Promise(resolve => setTimeout(resolve, 10));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(eventController.publishEvent.calledWith('backgroundFilterStarted', sinon.match.any)).to
        .be.true;
    });

    it('does not publish event when cdnProcessor is null', async () => {
      sandbox.stub(BackgroundSegmentationCompatibilityChecker, 'checkCompatibility').returns({
        isCompatible: false,
        missingFeatures: ['webgl2'],
      });

      const processor = await BackgroundSegmentationVideoFrameProcessor.create(logger, {
        type: ProcessorEffect.BLUR,
      });

      const eventController = { publishEvent: sandbox.stub().resolves() };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      processor.setEventController(eventController as any);
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(eventController.publishEvent.called).to.be.false;
    });

    it('handles publishEvent rejection gracefully in setEventController', async () => {
      sandbox.stub(BackgroundSegmentationCompatibilityChecker, 'checkCompatibility').returns({
        isCompatible: true,
        missingFeatures: [],
      });

      const mockCdnProcessor = {
        process: sandbox.stub().resolves([]),
        destroy: sandbox.stub().resolves(),
        getConfig: sandbox
          .stub()
          .returns({ type: ProcessorEffect.BLUR, blurStrength: BlurStrength.MEDIUM }),
        setConfig: sandbox.stub(),
        getModelType: sandbox.stub().returns(ModelType.SELFIE_GENERAL),
        setModelType: sandbox.stub(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document as any).head.appendChild.callsFake((script: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).BackgroundSegmentationProcessor = {
          create: sandbox.stub().resolves(mockCdnProcessor),
        };
        script.onload();
      });

      const processor = await BackgroundSegmentationVideoFrameProcessor.create(logger, {
        type: ProcessorEffect.BLUR,
      });

      const eventController = {
        publishEvent: sandbox.stub().rejects(new Error('publish failed')),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      processor.setEventController(eventController as any);
      await new Promise(resolve => setTimeout(resolve, 10));
      // Should not throw — error is caught and logged
    });
  });

  describe('setMetricsCollector', () => {
    it('passes metrics collector to internal metrics', async () => {
      sandbox.stub(BackgroundSegmentationCompatibilityChecker, 'checkCompatibility').returns({
        isCompatible: false,
        missingFeatures: ['webgl2'],
      });

      const processor = await BackgroundSegmentationVideoFrameProcessor.create(logger, {
        type: ProcessorEffect.BLUR,
      });

      const collector = {
        backgroundSegmentationInitializationMetricsDidReceive: sandbox.stub(),
        backgroundSegmentationProcessorMetricsDidReceive: sandbox.stub(),
      };
      processor.setMetricsCollector(collector);

      expect(collector.backgroundSegmentationInitializationMetricsDidReceive.called).to.be.true;
      const report =
        collector.backgroundSegmentationInitializationMetricsDidReceive.firstCall.args[0];
      expect(report.initializationStatus).to.equal(
        BackgroundSegmentationInitializationStatus.COMPATIBILITY_FAILURE
      );
    });
  });

  describe('event publishing with image replacement config', () => {
    it('publishes correct attributes for image replacement', async () => {
      sandbox.stub(BackgroundSegmentationCompatibilityChecker, 'checkCompatibility').returns({
        isCompatible: true,
        missingFeatures: [],
      });

      const config = {
        type: ProcessorEffect.IMAGE_REPLACEMENT as const,
        replacementImageURL: 'http://test.png',
      };
      const mockCdnProcessor = {
        process: sandbox.stub().resolves([]),
        destroy: sandbox.stub().resolves(),
        getConfig: sandbox.stub().returns(config),
        setConfig: sandbox.stub(),
        getModelType: sandbox.stub().returns(ModelType.SELFIE_GENERAL),
        setModelType: sandbox.stub(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document as any).head.appendChild.callsFake((script: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).BackgroundSegmentationProcessor = {
          create: sandbox.stub().resolves(mockCdnProcessor),
        };
        script.onload();
      });

      const eventController = { publishEvent: sandbox.stub().resolves() };
      await BackgroundSegmentationVideoFrameProcessor.create(
        logger,
        config,
        ModelType.SELFIE_GENERAL,
        undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        eventController as any
      );
      expect(eventController.publishEvent.called).to.be.true;
    });
  });

  describe('publishFilterFailedEvent with failing eventController', () => {
    it('handles publishEvent rejection gracefully on CDN load failure', async () => {
      sandbox.stub(BackgroundSegmentationCompatibilityChecker, 'checkCompatibility').returns({
        isCompatible: true,
        missingFeatures: [],
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document as any).head.appendChild.callsFake((script: any) => {
        script.onerror();
      });

      const eventController = { publishEvent: sandbox.stub().rejects(new Error('publish error')) };
      const processor = await BackgroundSegmentationVideoFrameProcessor.create(
        logger,
        { type: ProcessorEffect.BLUR },
        ModelType.SELFIE_GENERAL,
        undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        eventController as any
      );
      expect(processor).to.not.be.undefined;
    });
  });
});
