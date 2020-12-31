// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import CanvasVideoFrameBuffer from './CanvasVideoFrameBuffer';
import VideoFrameBuffer from './VideoFrameBuffer';
import VideoFrameProcessor from './VideoFrameProcessor';
import VideoFrameProcessorPipeline from './VideoFrameProcessorPipeline';
import VideoFrameProcessorPipelineObserver from './VideoFrameProcessorPipelineObserver';

const DEFAULT_FRAMERATE = 15;

/** @internal */
interface HTMLCanvasElementWithCaptureStream extends HTMLCanvasElement {
  // Not in IE, but that's OK.
  captureStream(frameRate?: number): MediaStream;
}

/**
 * [[DefaultVideoFrameProcessorPipeline]] implements {@link VideoFrameProcessorPipeline}.
 * It constructs a buffer {@link CanvasVideoFrameBuffer} as source by default and invokes processor based on `framerate`.
 * The default output type is `MediaStream`.
 */
export default class DefaultVideoFrameProcessorPipeline implements VideoFrameProcessorPipeline {
  private fr: number = DEFAULT_FRAMERATE;
  // initialize with dummy inactive MediaStream to keep strict type
  outputMediaStream: MediaStream = new MediaStream();

  private videoInput: HTMLVideoElement = document.createElement('video') as HTMLVideoElement;

  private canvasOutput: HTMLCanvasElementWithCaptureStream = document.createElement(
    'canvas'
  ) as HTMLCanvasElementWithCaptureStream;
  private outputCtx = this.canvasOutput.getContext('2d');

  private canvasInput: HTMLCanvasElement = document.createElement('canvas');
  private inputCtx = this.canvasInput.getContext('2d');
  private inputVideoStream: MediaStream | null = null;

  private sourceBuffers: VideoFrameBuffer[] = [];
  private destBuffers: VideoFrameBuffer[] = [];
  private observers: Set<VideoFrameProcessorPipelineObserver> = new Set<
    VideoFrameProcessorPipelineObserver
  >();

  private hasStarted: boolean = false;
  private lastTimeOut: ReturnType<typeof setTimeout> | undefined;

  constructor(private logger: Logger, private stages: VideoFrameProcessor[]) {}

  destroy(): void {
    this.stop();
    if (this.stages) {
      for (const stage of this.stages) {
        stage.destroy();
      }
    }
  }

  get framerate(): number {
    return this.fr;
  }

  // A negative framerate will cause `captureStream` to throw `NotSupportedError`.
  // The setter prevents this by switching to the default framerate if less than 0.
  set framerate(value: number) {
    this.fr = value < 0 ? DEFAULT_FRAMERATE : value;
  }

  stop(): void {
    // empty stream, stop pipeline
    // null input media stream stops the pipeline.
    this.videoInput.removeEventListener('loadedmetadata', this.process);
    this.videoInput.srcObject = null;
    // clean input stream and buffers
    this.destroyInputMediaStreamAndBuffers();
    if (this.outputMediaStream) {
      for (const track of this.outputMediaStream.getVideoTracks()) {
        track.stop();
      }
    }

    // clear output stream
    this.outputMediaStream = new MediaStream();
    if (this.lastTimeOut) {
      clearTimeout(this.lastTimeOut);
      this.lastTimeOut = undefined;
    }

    if (this.hasStarted) {
      this.hasStarted = false;
      this.forEachObserver(observer => {
        if (observer.processingDidStop) {
          observer.processingDidStop();
        }
      });
    }
  }

  addObserver(observer: VideoFrameProcessorPipelineObserver): void {
    this.observers.add(observer);
  }

  removeObserver(observer: VideoFrameProcessorPipelineObserver): void {
    this.observers.delete(observer);
  }

  async getInputMediaStream(): Promise<MediaStream | null> {
    return this.inputVideoStream;
  }

  getActiveOutputMediaStream(): MediaStream {
    if (this.outputMediaStream && this.outputMediaStream.active) {
      return this.outputMediaStream;
    }

    return (this.outputMediaStream = this.canvasOutput.captureStream(this.framerate));
  }

  /**
   * `inputMediaStream` is by default used to construct one {@link CanvasVideoFrameBuffer}
   * The buffer will be fed into the first {@link VideoFrameProcessor}.
   */
  async setInputMediaStream(inputMediaStream: MediaStream | null): Promise<void> {
    if (!inputMediaStream) {
      this.stop();
      return;
    }

    if (inputMediaStream.getVideoTracks().length === 0) {
      this.logger.error('No video tracks in input media stream, ignoring');
      return;
    }

    this.inputVideoStream = inputMediaStream;
    const settings = this.inputVideoStream.getVideoTracks()[0].getSettings();
    this.logger.info(`processing pipeline input stream settings ${settings}`);
    this.canvasOutput.width = settings.width;
    this.canvasOutput.height = settings.height;
    this.videoInput.addEventListener('loadedmetadata', this.process);
    this.videoInput.srcObject = this.inputVideoStream;
    // avoid iOS safari full screen video
    this.videoInput.setAttribute('playsinline', 'true');
    // create sources
    const canvasBuffer = new CanvasVideoFrameBuffer(this.canvasInput);
    this.sourceBuffers.push(canvasBuffer);

    this.videoInput.load();
    await this.videoInput.play();
  }

  set processors(stages: VideoFrameProcessor[]) {
    this.stages = stages;
  }

  get processors(): VideoFrameProcessor[] {
    return this.stages;
  }

  process = async (_event: Event): Promise<void> => {
    if (!this.inputVideoStream) {
      return;
    }

    const processVideoStart = performance.now();

    // videoWidth is intrinsic video width
    if (this.videoInput.videoWidth) {
      if (this.canvasInput.width !== this.videoInput.videoWidth) {
        this.canvasInput.width = this.videoInput.videoWidth;
        this.canvasInput.height = this.videoInput.videoHeight;
        this.sourceBuffers[0].height = this.canvasInput.height;
        this.sourceBuffers[0].width = this.canvasInput.width;
        this.sourceBuffers[0].framerate = this.framerate;
      }

      this.inputCtx.drawImage(this.videoInput, 0, 0);
    }

    // processes input buffers
    let buffers: VideoFrameBuffer[] = [];
    buffers.push(this.sourceBuffers[0]);
    try {
      for (const proc of this.processors) {
        buffers = await proc.process(buffers);
      }
    } catch (_error) {
      this.forEachObserver(obs => {
        if (obs.processingDidFailToStart) {
          obs.processingDidFailToStart();
        }
      });
      return;
    }

    this.destBuffers = buffers;
    let imageSource: CanvasImageSource;
    try {
      imageSource = await this.destBuffers[0].asCanvasImageSource();
    } catch (error) {
      if (this.inputVideoStream) {
        this.logger.info('buffers are destroyed and pipeline could not start');
        this.forEachObserver(obs => {
          if (obs.processingDidFailToStart) {
            obs.processingDidFailToStart();
          }
        });
      }
      return;
    }

    // finally draws the image
    const frameWidth = imageSource.width as number;
    const frameHeight = imageSource.height as number;
    if (frameWidth !== 0 && frameHeight !== 0) {
      if (this.canvasOutput.width !== frameWidth && this.canvasOutput.height !== frameHeight) {
        this.canvasOutput.width = frameWidth;
        this.canvasOutput.height = frameHeight;
      }

      this.outputCtx.drawImage(
        imageSource,
        0,
        0,
        frameWidth,
        frameHeight,
        0,
        0,
        frameWidth,
        frameHeight
      );

      if (!this.hasStarted) {
        this.hasStarted = true;
        this.forEachObserver(observer => {
          if (observer.processingDidStart) {
            observer.processingDidStart();
          }
        });
      }
    }

    // measures time
    const processVideoLatency = performance.now() - processVideoStart;
    const leave = (1000 * 2) / this.framerate - processVideoLatency; // half fps
    const nextFrameDelay = Math.max(0, 1000 / this.framerate - processVideoLatency);

    if (leave <= 0) {
      this.forEachObserver(obs => {
        if (obs.processingLatencyTooHigh) {
          obs.processingLatencyTooHigh(processVideoLatency);
        }
      });
    }

    // TODO: use requestAnimationFrame which is more organic and allows browser to conserve resources by its choices.
    this.lastTimeOut = setTimeout(this.process, nextFrameDelay);
  };

  private forEachObserver(
    observerFunc: (observer: VideoFrameProcessorPipelineObserver) => void
  ): void {
    for (const observer of this.observers) {
      setTimeout(() => {
        observerFunc(observer);
      }, 0);
    }
  }

  private destroyInputMediaStreamAndBuffers(): void {
    if (this.inputVideoStream) {
      for (const track of this.inputVideoStream.getTracks()) {
        track.stop();
      }
    }
    this.inputVideoStream = null;

    for (const buffer of this.sourceBuffers) {
      buffer.destroy();
    }
    this.sourceBuffers = [];
  }
}
