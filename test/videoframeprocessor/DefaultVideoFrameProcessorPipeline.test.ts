// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
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
    pipe = new DefaultVideoFrameProcessorPipeline(logger);
  });

  afterEach(() => {
    if (domMockBuilder) {
      domMockBuilder.cleanup();
    }
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

    it('can start the pipeline with valid stream and stop with null', done => {
      let started = 0;
      let stopped = 0;
      class PipeObserver implements VideoFrameProcessorPipelineObserver {
        processingDidStart(): void {
          started = 1;
        }

        processingDidStop(): void {
          stopped = 1;
        }
      }
      const pipeObserver = new PipeObserver();
      const procs = [new NoOpVideoFrameProcessor()];
      pipe.processors = procs;
      pipe.addObserver(pipeObserver);
      pipe.setInputMediaStream(mockVideoStream);
      new TimeoutScheduler(300).start(() => {
        expect(started).to.equal(1);
        pipe.setInputMediaStream(null);
      });

      new TimeoutScheduler(350).start(() => {
        expect(stopped).to.equal(1);
        done();
      });
    });

    it('can start the pipeline with valid stream and dumb processor and stop with null', done => {
      let started = 0;
      let stopped = 0;
      class PipeObserver implements VideoFrameProcessorPipelineObserver {
        processingDidStart(): void {
          started = 1;
        }

        processingDidStop(): void {
          stopped = 1;
        }
      }

      class DummyProcessor implements VideoFrameProcessor {
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
      const pipeObserver = new PipeObserver();
      const procs = [new DummyProcessor()];
      pipe.processors = procs;
      pipe.addObserver(pipeObserver);
      pipe.setInputMediaStream(mockVideoStream);
      new TimeoutScheduler(400).start(() => {
        expect(started).to.equal(1);
        pipe.setInputMediaStream(null);
      });

      new TimeoutScheduler(500).start(() => {
        expect(stopped).to.equal(1);
        done();
      });
    });

    it('can fail to start pipeline and fire callback if buffers are destroyed', done => {
      let started = 0;
      let notCalled = true;
      class PipeObserver implements VideoFrameProcessorPipelineObserver {
        processingDidFailToStart(): void {
          started = 1;
        }
      }

      class PipeObserver2 implements VideoFrameProcessorPipelineObserver {
        processingDidStart(): void {
          notCalled = false;
        }
      }
      class DummyProcessor implements VideoFrameProcessor {
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
      const pipeObserver = new PipeObserver();
      const procs = [new DummyProcessor()];
      pipe.processors = procs;
      pipe.addObserver(pipeObserver);
      pipe.addObserver(new PipeObserver2());
      pipe.setInputMediaStream(mockVideoStream);
      new TimeoutScheduler(300).start(() => {
        expect(started).to.equal(1);
        pipe.setInputMediaStream(null);
      });

      new TimeoutScheduler(350).start(() => {
        expect(started).to.equal(1);
        expect(notCalled).to.equal(true);
        done();
      });
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

  describe('getOutputMediaStream', () => {
    it('can get the output stream', async () => {
      const outputStream = await pipe.getOutputMediaStream();
      expect(outputStream).to.deep.equal(pipe.outputMediaStream);
      expect(await pipe.getOutputMediaStream()).to.deep.equal(outputStream);
    });

    it('can get the output stream', async () => {
      const outputStream = pipe.outputMediaStream;
      expect(pipe.outputMediaStream).to.deep.equal(outputStream);
      expect(pipe.outputMediaStream).to.deep.equal(await pipe.outputMediaStream);
    });
  });

  describe('addObserver', () => {
    it('can add observer', () => {
      class PipeObserver implements VideoFrameProcessorPipelineObserver {
        processingDidStart(): void {}
      }
      const pipeObserver = new PipeObserver();
      pipe.addObserver(pipeObserver);
    });
  });

  describe('removeObserver', () => {
    it('can remove observer', () => {
      class PipeObserver implements VideoFrameProcessorPipelineObserver {
        processingDidStart(): void {}
      }
      const pipeObserver = new PipeObserver();
      pipe.addObserver(pipeObserver);
      pipe.removeObserver(pipeObserver);
    });
  });

  describe('setter processors', () => {
    it('can set the input processors', async () => {
      class NullProcessor implements VideoFrameProcessor {
        process(_buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
          return Promise.resolve(null);
        }
      }
      const procs = [new NoOpVideoFrameProcessor(), new NullProcessor()];
      pipe.processors = procs;
    });

    it('can set the processor and fail to start due to errors', done => {
      let called = false;
      let notCalled = true;
      class PipeObserver implements VideoFrameProcessorPipelineObserver {
        processingDidFailToStart(): void {
          called = true;
        }
      }

      class PipeObserver2 implements VideoFrameProcessorPipelineObserver {
        processingDidStart(): void {
          notCalled = false;
        }
      }
      const pipeObserver = new PipeObserver();
      const pipeObserver2 = new PipeObserver2();
      pipe.addObserver(pipeObserver);
      pipe.addObserver(pipeObserver2);

      class WrongProcessor implements VideoFrameProcessor {
        process(_buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
          throw new Error('Method not implemented.');
        }
      }
      const procs = [new WrongProcessor()];
      pipe.processors = procs;
      pipe.setInputMediaStream(mockVideoStream);

      new TimeoutScheduler(200).start(() => {
        expect(called).to.equal(true);
        expect(notCalled).to.equal(true);

        pipe.setInputMediaStream(null);

        done();
      });
    });

    it('can set slow processor and fires processingLatencyTooHigh', done => {
      let called = false;
      class PipeObserver implements VideoFrameProcessorPipelineObserver {
        processingLatencyTooHigh(_latencyMs: number): void {
          called = true;
        }
      }

      class PipeObserver2 implements VideoFrameProcessorPipelineObserver {
        processingDidStart(): void {}
      }
      const pipeObserver = new PipeObserver();
      const pipeObserver2 = new PipeObserver2();
      pipe.addObserver(pipeObserver);
      pipe.addObserver(pipeObserver2);

      class WrongProcessor implements VideoFrameProcessor {
        async process(buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
          await new Promise(resolve => setTimeout(resolve, (1000 / 15) * 3));
          return buffers;
        }
      }
      const procs = [new WrongProcessor()];
      pipe.processors = procs;
      pipe.setInputMediaStream(mockVideoStream);

      // simulate high latency, has to wait long enough for the callback to be fired.
      new TimeoutScheduler(800).start(() => {
        expect(called).to.equal(true);

        pipe.setInputMediaStream(null);

        done();
      });
    });
  });

  describe('getter processors', () => {
    it('can get processors', () => {
      const procs = [new NoOpVideoFrameProcessor()];
      pipe.processors = procs;
      expect(pipe.processors).to.deep.equal(procs);
    });
  });
});
