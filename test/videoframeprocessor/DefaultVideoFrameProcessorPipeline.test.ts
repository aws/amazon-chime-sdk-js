// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';
import { stub } from 'sinon';

import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import CanvasVideoFrameBuffer from '../../src/videoframeprocessor/CanvasVideoFrameBuffer';
import DefaultVideoFrameProcessorPipeline from '../../src/videoframeprocessor/DefaultVideoFrameProcessorPipeline';
import NoOpVideoFrameProcessor from '../../src/videoframeprocessor/NoOpVideoFrameProcessor';
import VideoFrameBuffer from '../../src/videoframeprocessor/VideoFrameBuffer';
import VideoFrameProcessor from '../../src/videoframeprocessor/VideoFrameProcessor';
import VideoFrameProcessorPipelineObserver from '../../src/videoframeprocessor/VideoFrameProcessorPipelineObserver';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultVideoFrameProcessorPipeline', () => {
  const assert: Chai.AssertStatic = chai.assert;
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpDebugLogger();
  const mockStreamId: string = 'test-stream';
  let pipe: DefaultVideoFrameProcessorPipeline;
  let domMockBehavior: DOMMockBehavior;
  let domMockBuilder: DOMMockBuilder;
  let mockVideoStream: MediaStream;
  let mockVideoTrack: MediaStreamTrack;
  let proc: VideoFrameProcessor;

  class MockObserver implements VideoFrameProcessorPipelineObserver {
    processingDidFailToStart = sinon.stub();
    processingDidStop = sinon.stub();
    processingLatencyTooHigh = sinon.stub();
    processingDidStart = sinon.stub();
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
    mockVideoStream.id = mockStreamId;
    // @ts-ignore
    mockVideoTrack = new MediaStreamTrack('attach-media-input-task-video-track-id', 'video');
    mockVideoStream.addTrack(mockVideoTrack);
    proc = new NoOpVideoFrameProcessor();
    pipe = new DefaultVideoFrameProcessorPipeline(logger, [proc]);
  });

  afterEach(() => {
    domMockBuilder.cleanup();
  });

  describe('construction', () => {
    it('can be constructed', () => {
      assert.exists(pipe);
    });
  });

  describe('setInputMediaStream', () => {
    it('can set the input', async () => {
      await pipe.setInputMediaStream(mockVideoStream);
      const outputStream = await pipe.getInputMediaStream();
      expect(outputStream.id).to.equal(mockStreamId);
      await pipe.setInputMediaStream(null);
    });

    it('can only set MediaStream with video tracks', async () => {
      const emptyStream = new MediaStream();
      await pipe.setInputMediaStream(emptyStream);
      const outputStream = await pipe.getInputMediaStream();
      expect(outputStream).to.equal(null);
      await pipe.setInputMediaStream(null);
    });

    it('can stop the pipeline multiple times', async () => {
      await pipe.setInputMediaStream(null);
      const outputStream = await pipe.getInputMediaStream();
      expect(outputStream).to.equal(null);
      await pipe.setInputMediaStream(null);
    });

    it('can start the pipeline with valid stream and stop with null', async () => {
      await pipe.setInputMediaStream(mockVideoStream);
      await pipe.setInputMediaStream(null);
    });

    it('can start the pipeline with valid stream and stop with null', async () => {
      const pipeObserver = new MockObserver();
      pipe.addObserver(pipeObserver);

      const startCallback = called(pipeObserver.processingDidStart);
      const stopCallback = called(pipeObserver.processingDidStop);
      await pipe.setInputMediaStream(mockVideoStream);
      await startCallback;

      await pipe.setInputMediaStream(null);
      await stopCallback;
    });

    it('can start the pipeline with valid stream and dumb processor and stop with null', async () => {
      class DummyProcessor extends NoOpVideoFrameProcessor {
        width = 0;
        height = 0;
        canvas = document.createElement('canvas');
        process(_buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
          this.canvas.width = this.width;
          this.canvas.height = this.height;
          this.width += 1;
          this.height += 1;
          return Promise.resolve([new CanvasVideoFrameBuffer(this.canvas)]);
        }
      }
      const pipeObserver = new MockObserver();

      const startCallback = called(pipeObserver.processingDidStart);
      const stopCallback = called(pipeObserver.processingDidStop);

      const procs = [new DummyProcessor()];
      pipe.processors = procs;
      pipe.addObserver(pipeObserver);
      await pipe.setInputMediaStream(mockVideoStream);
      await startCallback;
      await pipe.setInputMediaStream(null);
      await stopCallback;
    });

    it('can fail to start pipeline and fire callback if buffers are destroyed', async () => {
      class DummyProcessor implements VideoFrameProcessor {
        destroy(): Promise<void> {
          return;
        }
        width = 0;
        height = 0;
        canvas = document.createElement('canvas');
        process(_buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
          this.canvas.width = this.width;
          this.canvas.height = this.height;
          this.width += 1;
          this.height += 1;
          const buffer = new CanvasVideoFrameBuffer(this.canvas);
          buffer.destroy();
          return Promise.resolve([buffer]);
        }
      }

      class EmptyMockObserver implements VideoFrameProcessorPipelineObserver {}
      const pipeObserver = new MockObserver();
      const pipeObserver2 = new EmptyMockObserver();

      const failToStartCallback = called(pipeObserver.processingDidFailToStart);

      const procs = [new DummyProcessor()];
      pipe.processors = procs;
      pipe.addObserver(pipeObserver);
      pipe.addObserver(pipeObserver2);
      await pipe.setInputMediaStream(mockVideoStream);
      await failToStartCallback;
    });

    it('can fail to start pipeline and fire callback if buffers are destroyed', async () => {
      class DummyProcessor implements VideoFrameProcessor {
        destroy(): Promise<void> {
          return;
        }
        width = 1280;
        height = 720;
        count = 0;
        canvas = document.createElement('canvas');
        process(_buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
          this.canvas.width = this.width;
          this.canvas.height = this.height;
          this.count += 1;
          const buffer = new CanvasVideoFrameBuffer(this.canvas);
          if (this.count === 5) {
            buffer.destroy();
          }
          return Promise.resolve([buffer]);
        }
      }

      class EmptyMockObserver implements VideoFrameProcessorPipelineObserver {}
      const pipeObserver = new MockObserver();
      const pipeObserver2 = new EmptyMockObserver();

      const failToStartCallback = called(pipeObserver.processingDidFailToStart);

      const procs = [new DummyProcessor()];
      pipe.processors = procs;
      pipe.addObserver(pipeObserver);
      pipe.addObserver(pipeObserver2);
      await pipe.setInputMediaStream(mockVideoStream);
      await failToStartCallback;
    });

    it('execute callbacks', async () => {
      await pipe.process(null);
    });
  });

  describe('getInputMediaStream', () => {
    it('can get the input', async () => {
      let inputStream = await pipe.getInputMediaStream();
      expect(inputStream).to.be.null;

      await pipe.setInputMediaStream(mockVideoStream);
      inputStream = await pipe.getInputMediaStream();
      expect(inputStream.id).to.equal(mockStreamId);
      await pipe.setInputMediaStream(null);
    });
  });

  describe('getActiveOutputMediaStream', () => {
    it('can get an active output stream', async () => {
      const activeStream = new MediaStream();
      // @ts-ignore
      activeStream.active = true;
      domMockBehavior.createElementCaptureStream = activeStream;
      const outputStream = pipe.getActiveOutputMediaStream();
      expect(outputStream).to.deep.equal(activeStream);
      // disable the output stream to trigger a recapture
      // @ts-ignore
      activeStream.active = false;
      const activeStream2 = new MediaStream();
      // @ts-ignore
      activeStream2.active = true;
      domMockBehavior.createElementCaptureStream = activeStream2;
      expect(pipe.getActiveOutputMediaStream()).to.deep.equal(activeStream2);
    });

    it('can get the same output stream', async () => {
      const activeStream = new MediaStream();
      // @ts-ignore
      activeStream.active = true;
      domMockBehavior.createElementCaptureStream = activeStream;
      const outputStream = pipe.getActiveOutputMediaStream();
      const outputStream2 = pipe.getActiveOutputMediaStream();
      expect(outputStream2).to.deep.equal(outputStream);
    });
  });

  describe('getter outputMediaStream', () => {
    it('can get current output stream', async () => {
      const activeStream = new MediaStream();
      // @ts-ignore
      activeStream.active = true;
      domMockBehavior.createElementCaptureStream = activeStream;
      const outputStream = pipe.getActiveOutputMediaStream();
      expect(outputStream).to.deep.equal(activeStream);
    });
  });

  describe('accessor framerate', () => {
    it('getter can return the frame rate', () => {
      expect(pipe.framerate).to.equal(15);
      pipe.framerate = 30;
      expect(pipe.framerate).to.equal(30);
    });

    it('setter can set the frame rate', () => {
      pipe.framerate = 30;
      expect(pipe.framerate).to.equal(30);
    });

    it('setter ignores frame rate less than 0', () => {
      pipe.framerate = -5;
      expect(pipe.framerate).to.equal(15);
    });
  });

  describe('addObserver', () => {
    it('can add observer', () => {
      const pipeObserver = new MockObserver();
      pipe.addObserver(pipeObserver);
    });
  });

  describe('removeObserver', () => {
    it('can remove observer', () => {
      const pipeObserver = new MockObserver();
      pipe.addObserver(pipeObserver);
      pipe.removeObserver(pipeObserver);
    });
  });

  describe('setter processors', () => {
    it('can set the input processors', async () => {
      class NullProcessor implements VideoFrameProcessor {
        destroy(): Promise<void> {
          throw new Error('Method not implemented.');
        }
        process(_buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
          return Promise.resolve(null);
        }
      }
      const procs = [new NoOpVideoFrameProcessor(), new NullProcessor()];
      pipe.processors = procs;
    });

    it('can set the processor and fail to start due to errors', async () => {
      class PipeObserver implements VideoFrameProcessorPipelineObserver {
        processingDidFailToStart = stub();
      }

      class PipeObserver2 implements VideoFrameProcessorPipelineObserver {
        processingDidStart = stub();
      }
      const pipeObserver = new PipeObserver();
      const pipeObserver2 = new PipeObserver2();

      pipe.addObserver(pipeObserver);
      pipe.addObserver(pipeObserver2);

      class WrongProcessor implements VideoFrameProcessor {
        destroy(): Promise<void> {
          throw new Error('Method not implemented.');
        }
        process(_buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
          throw new Error('Method not implemented.');
        }
      }
      const failToStartCallback = called(pipeObserver.processingDidFailToStart);

      const procs = [new WrongProcessor()];
      pipe.processors = procs;
      await pipe.setInputMediaStream(mockVideoStream);
      await failToStartCallback;
    });

    it('can set slow processor and fires processingLatencyTooHigh', async () => {
      class PipeObserver2 implements VideoFrameProcessorPipelineObserver {
        processingDidStart = sinon.stub();
      }

      const pipeObserver = new MockObserver();
      const pipeObserver2 = new PipeObserver2();

      const latencyCallback = called(pipeObserver.processingLatencyTooHigh);
      const startCallback = called(pipeObserver.processingDidStart);

      pipe.addObserver(pipeObserver);
      pipe.addObserver(pipeObserver2);

      class WrongProcessor implements VideoFrameProcessor {
        destroy(): Promise<void> {
          throw new Error('Method not implemented.');
        }
        async process(buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
          await new Promise(resolve => setTimeout(resolve, (1000 / 15) * 3));
          return buffers;
        }
      }
      const procs = [new WrongProcessor()];
      pipe.processors = procs;

      await pipe.setInputMediaStream(mockVideoStream);
      await Promise.all([startCallback, latencyCallback]);

      await pipe.setInputMediaStream(null);
    });
  });

  describe('getter processors', () => {
    it('can get processors', () => {
      const procs = [new NoOpVideoFrameProcessor()];
      pipe.processors = procs;
      expect(pipe.processors).to.deep.equal(procs);
    });
  });

  describe('stop', () => {
    it('can stop the processing', async () => {
      const obs = new MockObserver();
      const startCallback = called(obs.processingDidStart);
      const stopCallback = called(obs.processingDidStop);

      const procs = [new NoOpVideoFrameProcessor()];
      pipe.processors = procs;
      pipe.addObserver(obs);
      await pipe.setInputMediaStream(mockVideoStream);

      await startCallback;
      pipe.stop();
      await stopCallback;
    });
  });

  describe('destroy', () => {
    it('can stop the processing', async () => {
      const obs = new MockObserver();

      const startCallback = called(obs.processingDidStart);
      const stopCallback = called(obs.processingDidStop);

      const procs = [new NoOpVideoFrameProcessor()];
      pipe.processors = procs;
      pipe.addObserver(obs);
      await pipe.setInputMediaStream(mockVideoStream);
      await startCallback;
      pipe.destroy();
      await stopCallback;
    });

    it('can destroy processors if they exist', async () => {
      // clean up processor as well
      pipe.processors = null;
      pipe.destroy();

      class MockProcessor extends NoOpVideoFrameProcessor {
        destroy = stub();
      }

      // setting up
      const obs = new MockObserver();
      const startCallback = called(obs.processingDidStart);
      const stopCallback = called(obs.processingDidStop);

      const procs = [new MockProcessor()];
      pipe.processors = procs;
      pipe.addObserver(obs);
      await pipe.setInputMediaStream(mockVideoStream);

      await startCallback;

      pipe.destroy();
      await stopCallback;
      expect(procs[0].destroy.called).to.equal(true);
    });
  });
});
