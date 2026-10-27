// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';
import { stub } from 'sinon';

import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import CanvasVideoFrameBuffer from '../../src/videoframeprocessor/CanvasVideoFrameBuffer';
import DefaultVideoFrameProcessorPipeline from '../../src/videoframeprocessor/DefaultVideoFrameProcessorPipeline';
import DefaultVideoFrameProcessorTimer from '../../src/videoframeprocessor/DefaultVideoFrameProcessorTimer';
import NoOpVideoFrameProcessor from '../../src/videoframeprocessor/NoOpVideoFrameProcessor';
import VideoFrameBuffer from '../../src/videoframeprocessor/VideoFrameBuffer';
import VideoFrameProcessor from '../../src/videoframeprocessor/VideoFrameProcessor';
import VideoFrameProcessorPipelineObserver from '../../src/videoframeprocessor/VideoFrameProcessorPipelineObserver';
import VideoFrameProcessorTimer from '../../src/videoframeprocessor/VideoFrameProcessorTimer';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder, { StoppableMediaStreamTrack } from '../dommock/DOMMockBuilder';
import { createFakeTimers } from '../utils/fakeTimerHelper';

/**
 * [[MockVideoFrameProcessorTimer]] uses just `setTimeout` to avoid the complexity of
 * Workers in unit tests. We avoid trying to mock out the actual requests as that will break
 * things like the event listeners
 */
class MockVideoFrameProcessorTimer implements VideoFrameProcessorTimer {
  async start(delay: number, callback: () => void): Promise<void> {
    setTimeout(callback, delay);
  }

  async destroy(): Promise<void> {
    return;
  }
}

describe('DefaultVideoFrameProcessorPipeline', () => {
  const assert: Chai.AssertStatic = chai.assert;
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpDebugLogger();
  const mockStreamId: string = 'test-stream';
  let pipe: DefaultVideoFrameProcessorPipeline;
  let domMockBehavior: DOMMockBehavior;
  let domMockBuilder: DOMMockBuilder;
  let mockVideoStream: MediaStream;
  let mockVideoTrack: StoppableMediaStreamTrack;
  let proc: VideoFrameProcessor;
  const mockTimer = new MockVideoFrameProcessorTimer();

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

  function deferred<T>(): {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (error: Error) => void;
  } {
    let resolve: (value: T) => void;
    let reject: (error: Error) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  }

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    domMockBehavior.createElementCaptureStream = new MediaStream();
    mockVideoStream = new MediaStream();
    // @ts-ignore
    mockVideoStream.id = mockStreamId;
    mockVideoTrack = new MediaStreamTrack(
      // @ts-ignore
      'attach-media-input-task-video-track-id',
      'video'
    ) as StoppableMediaStreamTrack;
    mockVideoStream.addTrack(mockVideoTrack);
    proc = new NoOpVideoFrameProcessor();
    pipe = new DefaultVideoFrameProcessorPipeline(logger, [proc], mockTimer);
  });

  afterEach(() => {
    pipe.stop();
    pipe.destroy();

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

    it('catches the failure if videoInput play() fails due to load() being called before play() is finished', async () => {
      domMockBehavior.videoElementShouldFail = true;
      await pipe.setInputMediaStream(mockVideoStream);
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
      const clock = createFakeTimers();
      try {
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

        const procs = [new DummyProcessor()];
        pipe.processors = procs;
        pipe.addObserver(pipeObserver);
        pipe.addObserver(pipeObserver2);

        const setInputPromise = pipe.setInputMediaStream(mockVideoStream);

        // Advance time to allow 5+ processing cycles (each ~67ms at 15fps)
        // Need enough time for the 5th frame to trigger the failure
        await clock.tickAsync(500);

        expect(pipeObserver.processingDidFailToStart.called).to.be.true;
        await setInputPromise;
      } finally {
        clock.restore();
      }
    });

    it('execute callbacks', async () => {
      await pipe.process(null);
    });
  });

  describe('processing loop', () => {
    class CountingProcessor implements VideoFrameProcessor {
      calls = 0;
      // When set, the next call waits for it, then throws if it resolves with true.
      hold: Promise<boolean> | undefined;
      async destroy(): Promise<void> {}
      async process(buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
        this.calls += 1;
        const hold = this.hold;
        this.hold = undefined;
        if (hold && (await hold)) {
          throw new Error('cannot process');
        }
        return buffers;
      }
    }

    let clock: sinon.SinonFakeTimers;
    let counter: CountingProcessor;

    beforeEach(() => {
      clock = createFakeTimers();
      counter = new CountingProcessor();
      // The default timer, which uses setTimeout when it cannot create a worker. Either way, each tick calls the
      // callback of the latest start().
      const worker = globalThis.Worker;
      globalThis.Worker = undefined;
      try {
        pipe = new DefaultVideoFrameProcessorPipeline(
          logger,
          [counter],
          new DefaultVideoFrameProcessorTimer()
        );
      } finally {
        globalThis.Worker = worker;
      }
    });

    afterEach(() => {
      clock.restore();
    });

    function newVideoStream(trackId: string): MediaStream {
      const stream = new MediaStream();
      // @ts-ignore
      stream.addTrack(new MediaStreamTrack(trackId, 'video'));
      return stream;
    }

    async function setInput(stream: MediaStream): Promise<void> {
      const setInputPromise = pipe.setInputMediaStream(stream);
      await clock.tickAsync(100);
      await setInputPromise;
    }

    async function framesInOneSecond(): Promise<number> {
      const before = counter.calls;
      await clock.tickAsync(1000);
      return counter.calls - before;
    }

    // One loop processes one frame per `1000 / framerate` ms.
    function expectOneLoop(frames: number): void {
      expect(frames).to.be.within(pipe.framerate - 1, pipe.framerate + 1);
    }

    it('keeps one loop when the input stream is replaced', async () => {
      await setInput(mockVideoStream);
      expectOneLoop(await framesInOneSecond());

      await setInput(newVideoStream('second-camera-track'));
      expectOneLoop(await framesInOneSecond());

      await setInput(newVideoStream('third-camera-track'));
      expectOneLoop(await framesInOneSecond());
    });

    it('keeps one loop when the input stream is set again right after stop', async () => {
      await setInput(mockVideoStream);
      expectOneLoop(await framesInOneSecond());

      pipe.stop();
      await setInput(newVideoStream('second-camera-track'));
      expectOneLoop(await framesInOneSecond());
    });

    it('starts a new loop when the input stream is set after the loop has ended', async () => {
      await setInput(mockVideoStream);
      expectOneLoop(await framesInOneSecond());

      pipe.stop();
      expect(await framesInOneSecond()).to.be.at.most(1);

      await setInput(newVideoStream('second-camera-track'));
      expectOneLoop(await framesInOneSecond());
    });

    for (const [ending, fails] of [
      ['resolves', false],
      ['rejects', true],
    ] as const) {
      it(`starts a loop for the next input when a frame interrupted by stop() ${ending} after it is set`, async () => {
        const obs = new MockObserver();
        pipe.addObserver(obs);
        const frame = deferred<boolean>();
        counter.hold = frame.promise;
        await setInput(mockVideoStream);
        expect(counter.calls).to.equal(1);

        pipe.stop();
        await setInput(newVideoStream('second-camera-track'));
        frame.resolve(fails);
        expectOneLoop(await framesInOneSecond());
        expect(obs.processingDidFailToStart.called).to.be.false;
      });
    }

    it('keeps one loop when a frame interrupted by stop() ends during the first frame of the next input', async () => {
      const firstFrame = deferred<boolean>();
      counter.hold = firstFrame.promise;
      await setInput(mockVideoStream);
      const nextFrame = deferred<boolean>();
      counter.hold = nextFrame.promise;
      pipe.stop();
      await setInput(newVideoStream('second-camera-track'));
      expect(counter.calls).to.equal(2);

      firstFrame.resolve(false);
      await setInput(newVideoStream('third-camera-track'));
      nextFrame.resolve(false);
      expectOneLoop(await framesInOneSecond());
    });

    it('does not pass a frame interrupted by stop() to the next processor', async () => {
      const frame = deferred<boolean>();
      counter.hold = frame.promise;
      const next = new CountingProcessor();
      pipe.processors = [counter, next];
      await setInput(mockVideoStream);
      expect(next.calls).to.equal(0);

      pipe.stop();
      frame.resolve(false);
      await clock.tickAsync(1000);
      expect(next.calls).to.equal(0);
    });

    function newCanvas(): HTMLCanvasElement {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      return canvas;
    }

    it('does not draw a frame that its processor finishes after stop', async () => {
      const obs = new MockObserver();
      pipe.addObserver(obs);
      const frame = deferred<VideoFrameBuffer[]>();
      pipe.processors = [{ destroy: async () => {}, process: () => frame.promise }];
      await setInput(mockVideoStream);

      pipe.stop();
      frame.resolve([new CanvasVideoFrameBuffer(newCanvas())]);
      await clock.tickAsync(1000);
      expect(obs.processingDidStart.called).to.be.false;
    });

    for (const [ending, fails] of [
      ['resolves', false],
      ['rejects', true],
    ] as const) {
      it(`ignores a frame interrupted by stop() whose image ${ending} after the next input is set`, async () => {
        const obs = new MockObserver();
        pipe.addObserver(obs);
        const image = deferred<CanvasImageSource>();
        const firstFrame = new CanvasVideoFrameBuffer(newCanvas());
        firstFrame.asCanvasImageSource = () => image.promise;
        // The frames of the next session have no image yet, so they report nothing.
        const nextFrame = new CanvasVideoFrameBuffer(newCanvas());
        nextFrame.asCanvasImageSource = () => new Promise(() => {});
        let frames = 0;
        pipe.processors = [
          {
            destroy: async () => {},
            process: async () => [frames++ === 0 ? firstFrame : nextFrame],
          },
        ];
        await setInput(mockVideoStream);

        pipe.stop();
        await setInput(newVideoStream('second-camera-track'));
        if (fails) {
          image.reject(new Error('cannot draw'));
        } else {
          image.resolve(newCanvas());
        }
        await clock.tickAsync(1000);
        expect(obs.processingDidStart.called).to.be.false;
        expect(obs.processingDidFailToStart.called).to.be.false;
      });
    }
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

    it('can clone audio tracks', async () => {
      const activeStream = new MediaStream();
      // @ts-ignore
      activeStream.active = true;
      domMockBehavior.createElementCaptureStream = activeStream;

      const inputStream = new MediaStream();
      const videoTrack = new MediaStreamTrack();
      // @ts-ignore
      videoTrack.kind = 'video';
      inputStream.addTrack(videoTrack);
      const audioTrack = new MediaStreamTrack();
      // @ts-ignore
      audioTrack.kind = 'audio';
      inputStream.addTrack(audioTrack);
      // @ts-ignore
      inputStream.active = true;
      await pipe.setInputMediaStream(inputStream);

      const outputStream = pipe.getActiveOutputMediaStream();
      expect(outputStream.getAudioTracks().length).to.equal(2);
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

    it('setter ignores undefined frame rate', () => {
      pipe.framerate = undefined;
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
          return Promise.resolve();
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
          return Promise.resolve();
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
      const clock = createFakeTimers();
      try {
        class PipeObserver2 implements VideoFrameProcessorPipelineObserver {
          processingDidStart = sinon.stub();
        }

        const pipeObserver = new MockObserver();
        const pipeObserver2 = new PipeObserver2();

        pipe.addObserver(pipeObserver);
        pipe.addObserver(pipeObserver2);

        const processingDelay = (1000 / 15) * 3; // ~200ms

        class WrongProcessor implements VideoFrameProcessor {
          destroy(): Promise<void> {
            return Promise.resolve();
          }
          async process(buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
            await new Promise(resolve => setTimeout(resolve, processingDelay));
            return buffers;
          }
        }
        const procs = [new WrongProcessor()];
        pipe.processors = procs;

        pipe.setInputMediaStream(mockVideoStream);

        // Advance time to trigger processing cycles and latency detection
        // Need enough cycles for latency to be detected (processing > half frame time)
        for (let i = 0; i < 10; i++) {
          await clock.tickAsync(100);
        }

        expect(pipeObserver.processingDidStart.called).to.be.true;
        expect(pipeObserver.processingLatencyTooHigh.called).to.be.true;

        pipe.setInputMediaStream(null);
      } finally {
        clock.restore();
      }
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

  describe('transformTrack', () => {
    let canvasTrack: StoppableMediaStreamTrack;

    class MockTrackProcessor extends NoOpVideoFrameProcessor {
      output = new MediaStreamTrack(
        // @ts-ignore
        `output-${Math.random()}`,
        'video'
      ) as StoppableMediaStreamTrack;
      transformTrack = sinon.stub().callsFake(async () => this.output);
      stopTransformTrack = sinon.stub().resolves();
    }

    const settle = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 5));

    function outputVideoTrack(): MediaStreamTrack {
      return pipe.outputMediaStream.getVideoTracks()[0];
    }

    function newTrack(id: string, kind: string): StoppableMediaStreamTrack {
      // @ts-ignore
      return new MediaStreamTrack(id, kind) as StoppableMediaStreamTrack;
    }

    // The DOM mock's MediaStream returns every track from getAudioTracks and getVideoTracks and never
    // becomes active. This makes one behave like the browser's, for the tests that look at audio.
    function browserLikeStream(
      stream: MediaStream,
      ...tracks: StoppableMediaStreamTrack[]
    ): MediaStream {
      for (const track of tracks) {
        stream.addTrack(track);
      }
      stream.getAudioTracks = () => stream.getTracks().filter(track => track.kind === 'audio');
      stream.getVideoTracks = () => stream.getTracks().filter(track => track.kind === 'video');
      Object.defineProperty(stream, 'active', {
        get: () => stream.getTracks().some(track => track.readyState === 'live'),
      });
      return stream;
    }

    beforeEach(() => {
      // @ts-ignore
      canvasTrack = new MediaStreamTrack('canvas-track', 'video') as StoppableMediaStreamTrack;
      domMockBehavior.createElementCaptureStream = new MediaStream();
      domMockBehavior.createElementCaptureStream.addTrack(canvasTrack);
    });

    it('chains the processors and puts the last output track in the output stream', async () => {
      const procs = [new MockTrackProcessor(), new MockTrackProcessor()];
      pipe = new DefaultVideoFrameProcessorPipeline(logger, procs, mockTimer);
      const obs = new MockObserver();
      pipe.addObserver(obs);
      pipe.addObserver({});
      const outputStream = pipe.outputMediaStream;

      await pipe.setInputMediaStream(mockVideoStream);
      await settle();

      expect(procs[0].transformTrack.calledOnceWith(mockVideoTrack)).to.be.true;
      expect(procs[1].transformTrack.calledOnceWith(procs[0].output)).to.be.true;
      expect(pipe.outputMediaStream).to.equal(outputStream);
      expect(outputStream.getVideoTracks()).to.deep.equal([procs[1].output]);
      expect(obs.processingDidStart.calledOnce).to.be.true;
      expect(await pipe.getInputMediaStream()).to.equal(mockVideoStream);

      pipe.stop();
      await settle();
      expect(obs.processingDidStop.calledOnce).to.be.true;
      expect(procs[0].stopTransformTrack.calledOnce).to.be.true;
      expect(procs[1].stopTransformTrack.calledOnce).to.be.true;
      expect(procs[1].output.readyState).to.equal('ended');
      expect(mockVideoTrack.readyState).to.equal('ended');
    });

    it('keeps the output track when the input changes', async () => {
      const proc = new MockTrackProcessor();
      pipe = new DefaultVideoFrameProcessorPipeline(logger, [proc], mockTimer);
      const obs = new MockObserver();
      pipe.addObserver(obs);
      const newStream = new MediaStream();
      // @ts-ignore
      const newTrack = new MediaStreamTrack('new-camera', 'video');
      newStream.addTrack(newTrack);

      await pipe.setInputMediaStream(mockVideoStream);
      await pipe.setInputMediaStream(newStream);
      await settle();

      expect(proc.transformTrack.secondCall.calledWith(newTrack)).to.be.true;
      expect(pipe.outputMediaStream.getVideoTracks()).to.deep.equal([proc.output]);
      expect(obs.processingDidStart.calledOnce).to.be.true;
      expect(proc.stopTransformTrack.called).to.be.false;
    });

    it('uses the canvas when there are no processors', async () => {
      pipe = new DefaultVideoFrameProcessorPipeline(logger, [], mockTimer);
      await pipe.setInputMediaStream(mockVideoStream);
      expect(pipe.getActiveOutputMediaStream().getVideoTracks()).to.deep.equal([canvasTrack]);
    });

    it('falls back to the canvas for the rest of the session when transformTrack rejects', async () => {
      const procs = [new MockTrackProcessor(), new MockTrackProcessor()];
      procs[1].transformTrack.rejects(new Error('cannot start'));
      pipe = new DefaultVideoFrameProcessorPipeline(logger, procs, mockTimer);
      const obs = new MockObserver();
      pipe.addObserver(obs);
      pipe.addObserver({});
      const outputTrackDidChange = sinon.stub();
      pipe.outputTrackDidChange = outputTrackDidChange;

      await pipe.setInputMediaStream(mockVideoStream);
      await settle();

      expect(procs[0].stopTransformTrack.calledOnce).to.be.true;
      expect(procs[1].stopTransformTrack.calledOnce).to.be.true;
      expect(obs.processingDidFailToStart.calledOnce).to.be.true;
      expect(outputVideoTrack()).to.equal(canvasTrack);
      expect(outputTrackDidChange.called).to.be.false;

      const newStream = new MediaStream();
      newStream.addTrack(newTrack('new-camera', 'video'));
      await pipe.setInputMediaStream(newStream);
      expect(procs[0].transformTrack.calledOnce).to.be.true;
      expect(procs[0].stopTransformTrack.calledOnce).to.be.true;
      expect(outputVideoTrack()).to.equal(canvasTrack);
    });

    it('tries transformTrack again after stop', async () => {
      const proc = new MockTrackProcessor();
      proc.transformTrack.onFirstCall().rejects(new Error('cannot start'));
      pipe = new DefaultVideoFrameProcessorPipeline(logger, [proc], mockTimer);
      const obs = new MockObserver();
      pipe.addObserver(obs);

      await pipe.setInputMediaStream(mockVideoStream);
      await settle();
      expect(outputVideoTrack()).to.equal(canvasTrack);
      expect(proc.stopTransformTrack.calledOnce).to.be.true;

      pipe.stop();
      const newStream = new MediaStream();
      const newCameraTrack = newTrack('new-camera', 'video');
      newStream.addTrack(newCameraTrack);
      await pipe.setInputMediaStream(newStream);
      await settle();

      expect(proc.transformTrack.calledTwice).to.be.true;
      expect(proc.transformTrack.secondCall.calledWith(newCameraTrack)).to.be.true;
      expect(outputVideoTrack()).to.equal(proc.output);
      // stop() after the fallback does not stop the processors a second time.
      expect(proc.stopTransformTrack.calledOnce).to.be.true;
      expect(obs.processingDidFailToStart.calledOnce).to.be.true;
    });

    it('ends the canvas loop of a failed session when the next one transforms tracks', async () => {
      const clock = createFakeTimers();
      try {
        const proc = new MockTrackProcessor();
        proc.transformTrack.onFirstCall().rejects(new Error('cannot start'));
        const processFrame = sinon.spy(proc, 'process');
        pipe = new DefaultVideoFrameProcessorPipeline(logger, [proc], mockTimer);
        const obs = new MockObserver();
        pipe.addObserver(obs);

        const started = pipe.setInputMediaStream(mockVideoStream);
        await clock.tickAsync(1000);
        await started;
        expect(processFrame.called).to.be.true;

        // The canvas loop still has a frame scheduled when the next session starts.
        pipe.stop();
        const newStream = new MediaStream();
        newStream.addTrack(newTrack('new-camera', 'video'));
        const restarted = pipe.setInputMediaStream(newStream);
        await clock.tickAsync(10);
        await restarted;
        expect(outputVideoTrack()).to.equal(proc.output);

        processFrame.resetHistory();
        await clock.tickAsync(1000);
        expect(processFrame.called).to.be.false;
        expect(obs.processingDidFailToStart.calledOnce).to.be.true;
      } finally {
        clock.restore();
      }
    });

    it('puts the input audio tracks in the output stream', async () => {
      const proc = new MockTrackProcessor();
      pipe = new DefaultVideoFrameProcessorPipeline(logger, [proc], mockTimer);
      browserLikeStream(pipe.outputMediaStream);
      const audioTrack = newTrack('microphone', 'audio');
      const input = browserLikeStream(new MediaStream(), newTrack('camera', 'video'), audioTrack);

      await pipe.setInputMediaStream(input);

      const output = pipe.getActiveOutputMediaStream();
      expect(output.getVideoTracks()).to.deep.equal([proc.output]);
      expect(output.getAudioTracks()).to.have.lengthOf(1);
      expect(output.getAudioTracks()[0]).to.equal(audioTrack);
    });

    it('replaces the output audio tracks with the new input ones', async () => {
      const proc = new MockTrackProcessor();
      proc.transformTrack.callsFake(async () => newTrack(`output-${Math.random()}`, 'video'));
      pipe = new DefaultVideoFrameProcessorPipeline(logger, [proc], mockTimer);
      browserLikeStream(pipe.outputMediaStream);
      const firstAudio = newTrack('first-microphone', 'audio');
      const secondAudio = newTrack('second-microphone', 'audio');
      const thirdAudio = newTrack('third-microphone', 'audio');

      await pipe.setInputMediaStream(
        browserLikeStream(new MediaStream(), newTrack('first-camera', 'video'), firstAudio)
      );
      await pipe.setInputMediaStream(
        browserLikeStream(new MediaStream(), newTrack('second-camera', 'video'), secondAudio)
      );
      expect(pipe.outputMediaStream.getAudioTracks()).to.deep.equal([secondAudio]);
      expect(pipe.outputMediaStream.getVideoTracks()).to.have.lengthOf(1);

      pipe.stop();
      await pipe.setInputMediaStream(
        browserLikeStream(new MediaStream(), newTrack('third-camera', 'video'), thirdAudio)
      );
      expect(pipe.outputMediaStream.getAudioTracks()).to.deep.equal([thirdAudio]);
      expect(pipe.outputMediaStream.getVideoTracks()).to.have.lengthOf(1);
    });

    it('puts the input audio tracks in the output stream when transformTrack fails to start', async () => {
      const proc = new MockTrackProcessor();
      proc.transformTrack.rejects(new Error('cannot start'));
      pipe = new DefaultVideoFrameProcessorPipeline(logger, [proc], mockTimer);
      browserLikeStream(pipe.outputMediaStream);
      const audioTrack = newTrack('microphone', 'audio');

      await pipe.setInputMediaStream(
        browserLikeStream(new MediaStream(), newTrack('camera', 'video'), audioTrack)
      );

      const output = pipe.getActiveOutputMediaStream();
      expect(output.getVideoTracks()).to.deep.equal([canvasTrack]);
      expect(output.getAudioTracks()).to.deep.equal([audioTrack]);
    });

    it('falls back to the canvas when transformTrack does not settle in time', async () => {
      const clock = createFakeTimers();
      try {
        const proc = new MockTrackProcessor();
        proc.transformTrack.returns(new Promise(() => {}));
        proc.stopTransformTrack.returns(new Promise(() => {}));
        pipe = new DefaultVideoFrameProcessorPipeline(logger, [proc], mockTimer);

        const started = pipe.setInputMediaStream(mockVideoStream);
        await clock.tickAsync(10000);
        await clock.tickAsync(10000);
        await started;

        expect(proc.stopTransformTrack.calledOnce).to.be.true;
        expect(outputVideoTrack()).to.equal(canvasTrack);
      } finally {
        clock.restore();
      }
    });

    it('falls back to the canvas when an output track ends, keeping the output stream', async () => {
      const procs = [new MockTrackProcessor(), new MockTrackProcessor()];
      procs[0].stopTransformTrack.rejects(new Error('stop failed'));
      // @ts-ignore
      delete procs[1].stopTransformTrack;
      pipe = new DefaultVideoFrameProcessorPipeline(logger, procs, mockTimer);
      const obs = new MockObserver();
      pipe.addObserver(obs);
      const changed = sinon.stub();
      pipe.outputTrackDidChange = changed;
      const outputStream = pipe.outputMediaStream;
      await pipe.setInputMediaStream(mockVideoStream);
      await settle();
      expect(obs.processingDidStart.calledOnce).to.be.true;

      const canvasStarted = called(obs.processingDidStart);
      procs[0].output.externalStop();
      procs[1].output.externalStop();
      await canvasStarted;

      expect(procs[0].stopTransformTrack.calledOnce).to.be.true;
      expect(obs.processingDidFailToStart.calledOnce).to.be.true;
      expect(pipe.outputMediaStream).to.equal(outputStream);
      expect(outputStream.getVideoTracks()).to.deep.equal([canvasTrack]);
      expect(changed.calledOnce).to.be.true;
    });

    it('falls back without a registered output track callback', async () => {
      const proc = new MockTrackProcessor();
      pipe = new DefaultVideoFrameProcessorPipeline(logger, [proc], mockTimer);
      await pipe.setInputMediaStream(mockVideoStream);

      proc.output.externalStop();
      await settle();

      expect(outputVideoTrack()).to.equal(canvasTrack);
    });

    it('ignores output tracks ending after stop', async () => {
      const proc = new MockTrackProcessor();
      pipe = new DefaultVideoFrameProcessorPipeline(logger, [proc], mockTimer);
      const changed = sinon.stub();
      pipe.outputTrackDidChange = changed;
      await pipe.setInputMediaStream(mockVideoStream);

      pipe.stop();
      proc.output.externalStop();
      await settle();

      expect(proc.stopTransformTrack.calledOnce).to.be.true;
      expect(changed.called).to.be.false;
    });

    it('does not start the canvas when stopped while falling back', async () => {
      const proc = new MockTrackProcessor();
      const stopping = deferred<void>();
      proc.stopTransformTrack.returns(stopping.promise);
      pipe = new DefaultVideoFrameProcessorPipeline(logger, [proc], mockTimer);
      const changed = sinon.stub();
      pipe.outputTrackDidChange = changed;
      await pipe.setInputMediaStream(mockVideoStream);

      proc.output.externalStop();
      pipe.stop();
      stopping.resolve();
      await settle();

      expect(outputVideoTrack()).to.equal(proc.output);
      expect(changed.called).to.be.false;
    });

    it('does not start the canvas when stopped while a failed start falls back', async () => {
      const proc = new MockTrackProcessor();
      const stopping = deferred<void>();
      proc.transformTrack.rejects(new Error('cannot start'));
      proc.stopTransformTrack.returns(stopping.promise);
      pipe = new DefaultVideoFrameProcessorPipeline(logger, [proc], mockTimer);

      const started = pipe.setInputMediaStream(mockVideoStream);
      await settle();
      pipe.stop();
      stopping.resolve();
      await started;

      expect(pipe.outputMediaStream.getVideoTracks()).to.deep.equal([]);
    });

    it('ignores a transformTrack that resolves after stop', async () => {
      const proc = new MockTrackProcessor();
      const transforming = deferred<MediaStreamTrack>();
      proc.transformTrack.returns(transforming.promise);
      pipe = new DefaultVideoFrameProcessorPipeline(logger, [proc], mockTimer);
      const obs = new MockObserver();
      pipe.addObserver(obs);

      const started = pipe.setInputMediaStream(mockVideoStream);
      pipe.stop();
      transforming.resolve(proc.output);
      await started;
      await settle();

      expect(pipe.outputMediaStream.getVideoTracks()).to.deep.equal([]);
      expect(obs.processingDidStart.called).to.be.false;
      expect(proc.stopTransformTrack.calledOnce).to.be.true;
    });

    function newCameraStream(id: string): MediaStream {
      const stream = new MediaStream();
      stream.addTrack(newTrack(id, 'video'));
      return stream;
    }

    // A processor that returns a new output track for every start and ends them when it is stopped.
    function processorWithNewOutputs(): {
      proc: MockTrackProcessor;
      outputs: StoppableMediaStreamTrack[];
    } {
      const proc = new MockTrackProcessor();
      const outputs: StoppableMediaStreamTrack[] = [];
      proc.transformTrack.callsFake(async () => {
        outputs.push(newTrack(`output-${outputs.length}`, 'video'));
        return outputs[outputs.length - 1];
      });
      proc.stopTransformTrack.callsFake(async () => {
        for (const output of outputs) {
          output.externalStop();
        }
      });
      return { proc, outputs };
    }

    it('ignores a start of a stopped session that fails after the next session has started', async () => {
      const { proc, outputs } = processorWithNewOutputs();
      const firstStart = deferred<MediaStreamTrack>();
      proc.transformTrack.onFirstCall().returns(firstStart.promise);
      pipe = new DefaultVideoFrameProcessorPipeline(logger, [proc], mockTimer);
      const obs = new MockObserver();
      pipe.addObserver(obs);
      const changed = sinon.stub();
      pipe.outputTrackDidChange = changed;

      const firstStarted = pipe.setInputMediaStream(mockVideoStream);
      pipe.stop();
      await pipe.setInputMediaStream(newCameraStream('new-camera'));
      expect(outputVideoTrack()).to.equal(outputs[0]);

      firstStart.reject(new Error('cannot start'));
      await firstStarted;
      await settle();
      expect(outputVideoTrack()).to.equal(outputs[0]);
      expect(outputs[0].readyState).to.equal('live');
      expect(proc.stopTransformTrack.calledOnce).to.be.true;
      expect(obs.processingDidFailToStart.called).to.be.false;

      // The current session still falls back when its output ends.
      outputs[0].externalStop();
      await settle();
      expect(outputVideoTrack()).to.equal(canvasTrack);
      expect(changed.calledOnce).to.be.true;
    });

    it('ignores the end of the output of the previous input while the next input starts', async () => {
      const { proc, outputs } = processorWithNewOutputs();
      const secondStart = deferred<MediaStreamTrack>();
      proc.transformTrack.onSecondCall().returns(secondStart.promise);
      pipe = new DefaultVideoFrameProcessorPipeline(logger, [proc], mockTimer);
      const obs = new MockObserver();
      pipe.addObserver(obs);
      await pipe.setInputMediaStream(mockVideoStream);
      expect(outputVideoTrack()).to.equal(outputs[0]);

      const secondStarted = pipe.setInputMediaStream(newCameraStream('new-camera'));
      outputs[0].externalStop();
      const secondOutput = newTrack('second-output', 'video');
      secondStart.resolve(secondOutput);
      await secondStarted;
      await settle();

      expect(outputVideoTrack()).to.equal(secondOutput);
      expect(proc.stopTransformTrack.called).to.be.false;
      expect(obs.processingDidFailToStart.called).to.be.false;
    });

    it('falls back to the canvas as soon as an output ends while a later processor starts', async () => {
      const procs = [new MockTrackProcessor(), new MockTrackProcessor()];
      const secondStart = deferred<MediaStreamTrack>();
      procs[1].transformTrack.returns(secondStart.promise);
      pipe = new DefaultVideoFrameProcessorPipeline(logger, procs, mockTimer);
      const obs = new MockObserver();
      pipe.addObserver(obs);
      const changed = sinon.stub();
      pipe.outputTrackDidChange = changed;

      const started = pipe.setInputMediaStream(mockVideoStream);
      await settle();
      expect(procs[1].transformTrack.calledOnceWith(procs[0].output)).to.be.true;
      procs[0].output.externalStop();
      await settle();
      expect(outputVideoTrack()).to.equal(canvasTrack);
      expect(procs[0].stopTransformTrack.calledOnce).to.be.true;
      expect(procs[1].stopTransformTrack.calledOnce).to.be.true;

      secondStart.resolve(procs[1].output);
      await started;
      await settle();
      expect(outputVideoTrack()).to.equal(canvasTrack);
      expect(obs.processingDidFailToStart.calledOnce).to.be.true;
      expect(changed.called).to.be.false;
    });

    it('falls back once when a second fallback of the session starts while the first stops the processors', async () => {
      const proc = new MockTrackProcessor();
      const stopping = deferred<void>();
      proc.stopTransformTrack.returns(stopping.promise);
      pipe = new DefaultVideoFrameProcessorPipeline(logger, [proc], mockTimer);
      const obs = new MockObserver();
      pipe.addObserver(obs);
      const changed = sinon.stub();
      pipe.outputTrackDidChange = changed;
      await pipe.setInputMediaStream(mockVideoStream);

      proc.output.externalStop();
      // @ts-ignore
      const secondFallback = pipe.fallBackToCanvas(pipe.session, 'a second failure');
      stopping.resolve();
      await secondFallback;
      await settle();

      expect(proc.stopTransformTrack.calledOnce).to.be.true;
      expect(obs.processingDidFailToStart.calledOnce).to.be.true;
      expect(outputVideoTrack()).to.equal(canvasTrack);
      expect(changed.calledOnce).to.be.true;
    });

    it('falls back to the canvas when a processor starts with an ended track', async () => {
      const procs = [new MockTrackProcessor(), new MockTrackProcessor()];
      procs[0].output.stop();
      pipe = new DefaultVideoFrameProcessorPipeline(logger, procs, mockTimer);
      const obs = new MockObserver();
      pipe.addObserver(obs);

      await pipe.setInputMediaStream(mockVideoStream);
      await settle();

      expect(procs[1].transformTrack.called).to.be.false;
      expect(outputVideoTrack()).to.equal(canvasTrack);
      expect(obs.processingDidFailToStart.calledOnce).to.be.true;
    });

    it('keeps the output of the next session when stopped while the canvas of a failed start loads', async () => {
      const proc = new MockTrackProcessor();
      proc.transformTrack.onFirstCall().rejects(new Error('cannot start'));
      pipe = new DefaultVideoFrameProcessorPipeline(logger, [proc], mockTimer);
      const playing = deferred<void>();
      // @ts-ignore
      sinon.stub(pipe.videoInput, 'play').returns(playing.promise);

      const firstStarted = pipe.setInputMediaStream(mockVideoStream);
      await settle();
      pipe.stop();
      await pipe.setInputMediaStream(newCameraStream('new-camera'));
      expect(outputVideoTrack()).to.equal(proc.output);

      playing.resolve();
      await firstStarted;
      expect(outputVideoTrack()).to.equal(proc.output);
    });
  });
});
