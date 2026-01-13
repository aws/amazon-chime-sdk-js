// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';

import AudioProfile from '../../src/audioprofile/AudioProfile';
import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import EncodedTransformWorkerManager from '../../src/encodedtransformmanager/EncodedTransformWorkerManager';
import RedundantAudioEncodedTransformManager from '../../src/encodedtransformmanager/RedundantAudioEncodedTransformManager';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import StartEncodedTransformWorkerTask from '../../src/task/StartEncodedTransformWorkerTask';
import Task from '../../src/task/Task';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

chai.use(chaiAsPromised);

describe('StartEncodedTransformWorkerTask', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpDebugLogger();
  let context: AudioVideoControllerState;
  let task: Task;
  let domMockBuilder: DOMMockBuilder;
  let domMockBehavior: DOMMockBehavior;

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    domMockBehavior.browserName = 'chrome116';
    domMockBehavior.supportsAudioRedCodec = true;
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    context = new AudioVideoControllerState();
    context.audioVideoController = new NoOpAudioVideoController();
    context.logger = logger;
    context.audioProfile = new AudioProfile();
    task = new StartEncodedTransformWorkerTask(context);
  });

  afterEach(() => {
    domMockBuilder.cleanup();
  });

  describe('construction', () => {
    it('can be constructed', () => {
      expect(task).to.not.equal(null);
    });
  });

  describe('run', () => {
    it('returns early when encodedTransformWorkerManager is null', async () => {
      context.encodedTransformWorkerManager = null;
      await task.run();
      // Should complete without error
    });

    it('returns early when encodedTransformWorkerManager is not enabled', async () => {
      const mockManager: Partial<EncodedTransformWorkerManager> = {
        isEnabled: () => false,
      };
      context.encodedTransformWorkerManager = mockManager as EncodedTransformWorkerManager;
      await task.run();
      // Should complete without error
    });

    it('returns early without warning when manager not enabled and audioProfile is null', async () => {
      const warnSpy = sinon.spy(logger, 'warn');
      context.audioProfile = null;
      context.encodedTransformWorkerManager = null;

      await task.run();

      expect(warnSpy.called).to.be.false;
      warnSpy.restore();
    });

    it('logs warning when redundancy enabled but manager not enabled', async () => {
      const warnSpy = sinon.spy(logger, 'warn');
      context.audioProfile = new AudioProfile(null, true);
      context.encodedTransformWorkerManager = null;

      await task.run();

      expect(
        warnSpy.calledWith(
          'Audio redundancy requested but encoded transform worker manager not enabled'
        )
      ).to.be.true;
      warnSpy.restore();
    });

    it('calls start on the manager when enabled', async () => {
      const startSpy = sinon.stub().resolves();
      const mockManager: Partial<EncodedTransformWorkerManager> = {
        isEnabled: () => true,
        start: startSpy,
        redundantAudioEncodeTransformManager: () => null,
      };
      context.encodedTransformWorkerManager = mockManager as EncodedTransformWorkerManager;
      context.audioProfile = new AudioProfile(null, false);

      await task.run();

      expect(startSpy.calledOnce).to.be.true;
      expect(startSpy.calledWith({ redundantAudio: true })).to.be.true;
    });

    it('passes redundantAudio false when audio redundancy is enabled', async () => {
      const startSpy = sinon.stub().resolves();
      const mockManager: Partial<EncodedTransformWorkerManager> = {
        isEnabled: () => true,
        start: startSpy,
        redundantAudioEncodeTransformManager: () => null,
      };
      context.encodedTransformWorkerManager = mockManager as EncodedTransformWorkerManager;
      context.audioProfile = new AudioProfile(null, true);

      await task.run();

      expect(startSpy.calledWith({ redundantAudio: false })).to.be.true;
    });

    it('adds observer when redundancy enabled and manager returns redundantAudioEncodeTransformManager', async () => {
      const mockRedundantManager = {
        setAudioPayloadTypes: sinon.stub(),
      };
      const addObserverSpy = sinon.spy(context.audioVideoController, 'addObserver');
      const mockManager: Partial<EncodedTransformWorkerManager> = {
        isEnabled: () => true,
        start: sinon.stub().resolves(),
        redundantAudioEncodeTransformManager: () =>
          (mockRedundantManager as unknown) as RedundantAudioEncodedTransformManager,
      };
      context.encodedTransformWorkerManager = mockManager as EncodedTransformWorkerManager;
      context.audioProfile = new AudioProfile(null, true);

      await task.run();

      expect(addObserverSpy.calledOnce).to.be.true;
      addObserverSpy.restore();
    });

    it('does not add observer when redundantAudioEncodeTransformManager returns null', async () => {
      const addObserverSpy = sinon.spy(context.audioVideoController, 'addObserver');
      const mockManager: Partial<EncodedTransformWorkerManager> = {
        isEnabled: () => true,
        start: sinon.stub().resolves(),
        redundantAudioEncodeTransformManager: () => null,
      };
      context.encodedTransformWorkerManager = mockManager as EncodedTransformWorkerManager;
      context.audioProfile = new AudioProfile(null, true);

      await task.run();

      expect(addObserverSpy.called).to.be.false;
      addObserverSpy.restore();
    });

    it('does not add observer when redundancy is disabled', async () => {
      const mockRedundantManager = {};
      const addObserverSpy = sinon.spy(context.audioVideoController, 'addObserver');
      const mockManager: Partial<EncodedTransformWorkerManager> = {
        isEnabled: () => true,
        start: sinon.stub().resolves(),
        redundantAudioEncodeTransformManager: () =>
          (mockRedundantManager as unknown) as RedundantAudioEncodedTransformManager,
      };
      context.encodedTransformWorkerManager = mockManager as EncodedTransformWorkerManager;
      context.audioProfile = new AudioProfile(null, false);

      await task.run();

      expect(addObserverSpy.called).to.be.false;
      addObserverSpy.restore();
    });

    it('handles null audioProfile gracefully', async () => {
      const startSpy = sinon.stub().resolves();
      const mockManager: Partial<EncodedTransformWorkerManager> = {
        isEnabled: () => true,
        start: startSpy,
        redundantAudioEncodeTransformManager: () => null,
      };
      context.encodedTransformWorkerManager = mockManager as EncodedTransformWorkerManager;
      context.audioProfile = null;

      await task.run();

      expect(startSpy.calledWith({ redundantAudio: true })).to.be.true;
    });

    it('handles null audioVideoController gracefully when adding observer', async () => {
      const mockRedundantManager = {};
      const mockManager: Partial<EncodedTransformWorkerManager> = {
        isEnabled: () => true,
        start: sinon.stub().resolves(),
        redundantAudioEncodeTransformManager: () =>
          (mockRedundantManager as unknown) as RedundantAudioEncodedTransformManager,
      };
      context.encodedTransformWorkerManager = mockManager as EncodedTransformWorkerManager;
      context.audioProfile = new AudioProfile(null, true);
      context.audioVideoController = null;

      // Should not throw
      await task.run();
    });
  });
});
