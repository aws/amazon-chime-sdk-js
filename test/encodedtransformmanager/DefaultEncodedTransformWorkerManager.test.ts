// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import DefaultEncodedTransformWorkerManager from '../../src/encodedtransformmanager/DefaultEncodedTransformWorkerManager';
import { EncodedTransformWorkerManagerObserver } from '../../src/encodedtransformmanager/EncodedTransformWorkerManager';
import {
  COMMON_MESSAGE_TYPES,
  TRANSFORM_NAMES,
} from '../../src/encodedtransformworker/EncodedTransform';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultEncodedTransformWorkerManager', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpDebugLogger();
  let domMockBuilder: DOMMockBuilder | null = null;
  let manager: DefaultEncodedTransformWorkerManager;

  beforeEach(() => {
    domMockBuilder = new DOMMockBuilder(new DOMMockBehavior());
    manager = new DefaultEncodedTransformWorkerManager(logger);
  });

  afterEach(async () => {
    await manager.stop();
    if (domMockBuilder) {
      domMockBuilder.cleanup();
      domMockBuilder = null;
    }
  });

  describe('constructor', () => {
    it('is enabled when RTCRtpScriptTransform is supported', () => {
      expect(manager.isEnabled()).to.be.true;
    });

    it('is enabled when insertable streams are supported but RTCRtpScriptTransform is not', () => {
      // @ts-ignore
      delete window.RTCRtpScriptTransform;
      const newManager = new DefaultEncodedTransformWorkerManager(logger);
      expect(newManager.isEnabled()).to.be.true;
    });

    it('is disabled when neither API is supported', () => {
      // @ts-ignore
      delete window.RTCRtpScriptTransform;
      // @ts-ignore
      delete RTCRtpSender.prototype.createEncodedStreams;
      const newManager = new DefaultEncodedTransformWorkerManager(logger);
      expect(newManager.isEnabled()).to.be.false;
    });
  });

  describe('isEnabled', () => {
    it('returns true when enabled', () => {
      expect(manager.isEnabled()).to.be.true;
    });
  });

  describe('start', () => {
    it('creates worker and managers', async () => {
      await manager.start();
      expect(manager.redundantAudioEncodeTransformManager()).to.not.be.undefined;
      expect(manager.metricsTransformManager()).to.not.be.undefined;
    });

    it('creates worker without redundant audio manager when disabled', async () => {
      await manager.start({ redundantAudio: true });
      expect(manager.redundantAudioEncodeTransformManager()).to.be.undefined;
      expect(manager.metricsTransformManager()).to.not.be.undefined;
    });

    it('handles worker creation error', async () => {
      const originalCreateObjectURL = URL.createObjectURL;
      // @ts-ignore
      URL.createObjectURL = () => {
        throw new Error('Failed to create blob URL');
      };

      const newManager = new DefaultEncodedTransformWorkerManager(logger);
      try {
        await newManager.start();
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e.message).to.equal('Failed to create blob URL');
      }
      // @ts-ignore
      URL.createObjectURL = originalCreateObjectURL;
    });

    it('cleans up workerURL when Worker constructor throws', async () => {
      const originalWorker = Worker;
      let urlCreated = false;
      const originalCreateObjectURL = URL.createObjectURL;
      const originalRevokeObjectURL = URL.revokeObjectURL;
      let revokedUrl: string | null = null;

      // @ts-ignore
      URL.createObjectURL = () => {
        urlCreated = true;
        return 'blob:test-url';
      };
      // @ts-ignore
      URL.revokeObjectURL = (url: string) => {
        revokedUrl = url;
      };
      // @ts-ignore
      globalThis.Worker = class {
        constructor() {
          throw new Error('Worker creation failed');
        }
      };

      const newManager = new DefaultEncodedTransformWorkerManager(logger);
      try {
        await newManager.start();
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e.message).to.equal('Worker creation failed');
        expect(urlCreated).to.be.true;
        expect(revokedUrl).to.equal('blob:test-url');
      }

      // @ts-ignore
      globalThis.Worker = originalWorker;
      // @ts-ignore
      URL.createObjectURL = originalCreateObjectURL;
      // @ts-ignore
      URL.revokeObjectURL = originalRevokeObjectURL;
    });
  });

  describe('redundantAudioEncodeTransformManager', () => {
    it('returns undefined before start', () => {
      expect(manager.redundantAudioEncodeTransformManager()).to.be.undefined;
    });

    it('returns manager after start', async () => {
      await manager.start();
      expect(manager.redundantAudioEncodeTransformManager()).to.not.be.undefined;
    });
  });

  describe('metricsTransformManager', () => {
    it('returns undefined before start', () => {
      expect(manager.metricsTransformManager()).to.be.undefined;
    });

    it('returns manager after start', async () => {
      await manager.start();
      expect(manager.metricsTransformManager()).to.not.be.undefined;
    });
  });

  describe('setupAudioSenderTransform', () => {
    it('sets up transform on sender using RTCRtpScriptTransform', async () => {
      await manager.start();
      // @ts-ignore
      const track = new MediaStreamTrack('audio-track', 'audio');
      // @ts-ignore
      const sender = new RTCRtpSender(track);
      manager.setupAudioSenderTransform(sender);
      // @ts-ignore
      expect(sender.transform).to.not.be.undefined;
    });

    it('sets up transform using insertable streams when RTCRtpScriptTransform not available', async () => {
      // @ts-ignore
      delete window.RTCRtpScriptTransform;
      const newManager = new DefaultEncodedTransformWorkerManager(logger);
      await newManager.start();
      // @ts-ignore
      const track = new MediaStreamTrack('audio-track', 'audio');
      // @ts-ignore
      const sender = new RTCRtpSender(track);
      newManager.setupAudioSenderTransform(sender);
      await newManager.stop();
    });

    it('throws when worker not initialized', () => {
      // @ts-ignore
      const track = new MediaStreamTrack('audio-track', 'audio');
      // @ts-ignore
      const sender = new RTCRtpSender(track);
      expect(() => manager.setupAudioSenderTransform(sender)).to.throw('Worker not initialized');
    });

    it('throws when passed a receiver instead of sender', async () => {
      await manager.start();
      // @ts-ignore
      const track = new MediaStreamTrack('audio-track', 'audio');
      // @ts-ignore
      const receiver = new RTCRtpReceiver(track);
      // @ts-ignore
      expect(() => manager.setupAudioSenderTransform(receiver)).to.throw(
        'Operation "send" requires an RTCRtpSender'
      );
    });
  });

  describe('setupAudioReceiverTransform', () => {
    it('sets up transform on receiver', async () => {
      await manager.start();
      // @ts-ignore
      const track = new MediaStreamTrack('audio-track', 'audio');
      // @ts-ignore
      const receiver = new RTCRtpReceiver(track);
      manager.setupAudioReceiverTransform(receiver);
      // @ts-ignore
      expect(receiver.transform).to.not.be.undefined;
    });

    it('throws when passed a sender instead of receiver', async () => {
      await manager.start();
      // @ts-ignore
      const track = new MediaStreamTrack('audio-track', 'audio');
      // @ts-ignore
      const sender = new RTCRtpSender(track);
      // @ts-ignore
      expect(() => manager.setupAudioReceiverTransform(sender)).to.throw(
        'Operation "receive" requires an RTCRtpReceiver'
      );
    });
  });

  describe('setupVideoSenderTransform', () => {
    it('sets up transform on video sender', async () => {
      await manager.start();
      // @ts-ignore
      const track = new MediaStreamTrack('video-track', 'video');
      // @ts-ignore
      const sender = new RTCRtpSender(track);
      manager.setupVideoSenderTransform(sender);
      // @ts-ignore
      expect(sender.transform).to.not.be.undefined;
    });
  });

  describe('setupVideoReceiverTransform', () => {
    it('sets up transform on video receiver', async () => {
      await manager.start();
      // @ts-ignore
      const track = new MediaStreamTrack('video-track', 'video');
      // @ts-ignore
      const receiver = new RTCRtpReceiver(track);
      manager.setupVideoReceiverTransform(receiver);
      // @ts-ignore
      expect(receiver.transform).to.not.be.undefined;
    });
  });

  describe('stop', () => {
    it('cleans up resources', async () => {
      await manager.start();
      await manager.stop();
      expect(manager.redundantAudioEncodeTransformManager()).to.be.undefined;
      expect(manager.metricsTransformManager()).to.be.undefined;
    });

    it('can be called multiple times safely', async () => {
      await manager.start();
      await manager.stop();
      await manager.stop();
    });

    it('can be called without start', async () => {
      // manager.stop() will be called in afterEach
    });
  });

  describe('stop managers', () => {
    it('stops all managers', async () => {
      await manager.start();
      const redStopSpy = sinon.spy(manager.redundantAudioEncodeTransformManager()!, 'stop');
      const metricsStopSpy = sinon.spy(manager.metricsTransformManager()!, 'stop');
      await manager.stop();
      expect(redStopSpy.calledOnce).to.be.true;
      expect(metricsStopSpy.calledOnce).to.be.true;
    });

    it('handles stop when managers are null', async () => {
      await manager.stop();
    });
  });

  describe('addObserver/removeObserver', () => {
    it('adds and removes observers', () => {
      const observer: EncodedTransformWorkerManagerObserver = {
        onEncodedTransformWorkerManagerFailed: sinon.stub(),
      };
      manager.addObserver(observer);
      manager.removeObserver(observer);
    });
  });

  describe('handleWorkerMessage', () => {
    it('routes LOG messages to logger', async () => {
      await manager.start();
      // @ts-ignore
      const worker = manager['worker'];
      worker.onmessage(
        new MessageEvent('message', {
          data: {
            type: COMMON_MESSAGE_TYPES.LOG,
            transformName: 'TestTransform',
            message: { text: 'Test log' },
          },
        })
      );
    });

    it('routes LOG messages with undefined message text', async () => {
      await manager.start();
      // @ts-ignore
      const worker = manager['worker'];
      worker.onmessage(
        new MessageEvent('message', {
          data: {
            type: COMMON_MESSAGE_TYPES.LOG,
            transformName: 'TestTransform',
            // message is undefined to test the optional chaining
          },
        })
      );
    });

    it('routes METRICS messages to metrics manager', async () => {
      await manager.start();
      const handleMessageSpy = sinon.spy(manager.metricsTransformManager()!, 'handleWorkerMessage');
      // @ts-ignore
      const worker = manager['worker'];
      worker.onmessage(
        new MessageEvent('message', {
          data: {
            type: COMMON_MESSAGE_TYPES.METRICS,
            transformName: TRANSFORM_NAMES.AUDIO_SENDER,
            message: { metrics: '{}' },
          },
        })
      );
      expect(handleMessageSpy.calledOnce).to.be.true;
    });

    it('routes REDUNDANT_AUDIO messages to red manager', async () => {
      await manager.start();
      const handleMessageSpy = sinon.spy(
        manager.redundantAudioEncodeTransformManager()!,
        'handleWorkerMessage'
      );
      // @ts-ignore
      const worker = manager['worker'];
      worker.onmessage(
        new MessageEvent('message', {
          data: {
            type: COMMON_MESSAGE_TYPES.METRICS,
            transformName: TRANSFORM_NAMES.REDUNDANT_AUDIO,
            message: { metrics: '{}', ssrc: '12345' },
          },
        })
      );
      expect(handleMessageSpy.calledOnce).to.be.true;
    });

    it('handles messages when redManager is null', async () => {
      // Start with redundantAudio disabled so redManager is null
      await manager.start({ redundantAudio: true });
      expect(manager.redundantAudioEncodeTransformManager()).to.be.undefined;

      // @ts-ignore
      const worker = manager['worker'];
      // Should not throw when redManager is null
      worker.onmessage(
        new MessageEvent('message', {
          data: {
            type: COMMON_MESSAGE_TYPES.METRICS,
            transformName: TRANSFORM_NAMES.REDUNDANT_AUDIO,
            message: { metrics: '{}' },
          },
        })
      );
    });

    it('handles messages when managers are null before start', async () => {
      // Create a new manager but don't start it
      const newManager = new DefaultEncodedTransformWorkerManager(logger);

      // Manually set up a worker to test the message handler
      // @ts-ignore - access private method
      await newManager['createWorker']();

      // @ts-ignore
      const worker = newManager['worker'];
      // Should not throw when managers are null
      worker.onmessage(
        new MessageEvent('message', {
          data: {
            type: COMMON_MESSAGE_TYPES.METRICS,
            transformName: TRANSFORM_NAMES.AUDIO_SENDER,
            message: { metrics: '{}' },
          },
        })
      );

      await newManager.stop();
    });
  });

  describe('handleWorkerError', () => {
    it('disables manager and notifies observers on error', async () => {
      await manager.start();
      const observer: EncodedTransformWorkerManagerObserver = {
        onEncodedTransformWorkerManagerFailed: sinon.stub(),
      };
      manager.addObserver(observer);
      // @ts-ignore
      manager['worker'].onerror({
        message: 'Test error',
        filename: 'test.js',
        lineno: 1,
        colno: 1,
      } as unknown as ErrorEvent);
      expect(manager.isEnabled()).to.be.false;
      expect((observer.onEncodedTransformWorkerManagerFailed as sinon.SinonStub).calledOnce).to.be
        .true;
    });

    it('handles observer errors gracefully', async () => {
      await manager.start();
      manager.addObserver({
        onEncodedTransformWorkerManagerFailed: () => {
          throw new Error('Observer error');
        },
      });
      // @ts-ignore
      manager['worker'].onerror({
        message: 'Test error',
        filename: 'test.js',
        lineno: 1,
        colno: 1,
      } as unknown as ErrorEvent);
    });
  });
});
