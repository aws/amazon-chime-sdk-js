// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ModelType } from '../backgroundsegmentation/BackgroundSegmentationConstants';
import BackgroundSegmentationVideoFrameProcessor from '../backgroundsegmentation/BackgroundSegmentationVideoFrameProcessor';
import Logger from '../logger/Logger';
import { withTimeout } from '../utils/Utils';
import VideoFxProcessor from '../videofx/VideoFxProcessor';
import CanvasVideoFrameBuffer from './CanvasVideoFrameBuffer';
import DefaultVideoFrameProcessorTimer from './DefaultVideoFrameProcessorTimer';
import VideoFrameBuffer from './VideoFrameBuffer';
import VideoFrameProcessor from './VideoFrameProcessor';
import VideoFrameProcessorPipeline from './VideoFrameProcessorPipeline';
import VideoFrameProcessorPipelineObserver from './VideoFrameProcessorPipelineObserver';
import VideoFrameProcessorTimer from './VideoFrameProcessorTimer';

const DEFAULT_FRAMERATE = 15;
const TRANSFORM_TRACK_TIMEOUT_MS = 10000;

/** @internal */
interface HTMLCanvasElementWithCaptureStream extends HTMLCanvasElement {
  // Not in IE, but that's OK.
  captureStream(frameRate?: number): MediaStream;
}

/**
 * [[DefaultVideoFrameProcessorPipeline]] implements {@link VideoFrameProcessorPipeline}.
 * It constructs a buffer {@link CanvasVideoFrameBuffer} as source by default and invokes processor based on `framerate`.
 * The default output type is `MediaStream`.
 *
 * When every processor implements {@link VideoFrameProcessor.transformTrack}, it chains them
 * instead, until one fails to start or ends its output track; it then replaces the video track of
 * `outputMediaStream` with the canvas output until it is stopped, and the next input tries the
 * processors again. The metrics callback and `processingLatencyTooHigh` are only invoked for the
 * canvas.
 */
export default class DefaultVideoFrameProcessorPipeline implements VideoFrameProcessorPipeline {
  private fr: number = DEFAULT_FRAMERATE;
  // initialize with dummy inactive MediaStream to keep strict type
  outputMediaStream: MediaStream = new MediaStream();

  /**
   * @internal
   * Called after the video track of `outputMediaStream` has been replaced while in use.
   */
  outputTrackDidChange: () => void = () => {};

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
  private observers: Set<VideoFrameProcessorPipelineObserver> =
    new Set<VideoFrameProcessorPipelineObserver>();

  private hasStarted: boolean = false;
  // Incremented by stop() and by each transformTrack start. A frame, transformTrack start, fallback or output track of
  // an earlier session then ends or is ignored, without changing the current one.
  private session = 0;
  // The session of the frame being processed, if any.
  private processingSession: number | undefined;
  // Each tick of the timer calls the callback of its latest start(), so a scheduled frame cannot belong to a session.
  // At most one is scheduled, and it processes the session that is current when it runs.
  private isFrameScheduled = false;
  private timer: VideoFrameProcessorTimer;

  private transformTrackFailed = false;
  private transformTrackOutputs: { track: MediaStreamTrack; onEnded: () => void }[] = [];

  // Metrics tracking
  private processorLatencies: Map<string, number[]> = new Map();
  private lastMetricsTime: number = 0;

  // Metrics callback
  private metricsCallback?: (metrics: {
    frameRate: number;
    processors: Array<{ averageProcessLatency: number; processorName: string }>;
  }) => void;

  constructor(
    private logger: Logger,
    private stages: VideoFrameProcessor[],
    timer: VideoFrameProcessorTimer = new DefaultVideoFrameProcessorTimer(),
    metricsCallback?: (metrics: {
      frameRate: number;
      processors: Array<{ averageProcessLatency: number; processorName: string }>;
    }) => void
  ) {
    this.timer = timer;
    this.metricsCallback = metricsCallback;
    this.lastMetricsTime = performance.now();
  }

  destroy(): void {
    this.stop();
    if (this.stages) {
      for (const stage of this.stages) {
        stage.destroy();
      }
    }
    this.timer.destroy();
  }
  private checkMetricsReport(): void {
    const now = performance.now();

    /* istanbul ignore next */
    if (now - this.lastMetricsTime >= 1000) {
      this.reportMetrics(now);
      this.lastMetricsTime = now;
    }
  }

  /* istanbul ignore next */
  private reportMetrics(now: number): void {
    if (this.processorLatencies.size === 0) {
      return;
    }

    const elapsedSeconds = (now - this.lastMetricsTime) / 1000;
    const frameCount = Math.max(
      ...Array.from(this.processorLatencies.values()).map(arr => arr.length)
    );
    const frameRate = elapsedSeconds > 0 ? frameCount / elapsedSeconds : 0;

    const processors = this.processors.map(processor => {
      const processorName = this.getProcessorName(processor);
      const latencies = this.processorLatencies.get(processorName) || [];
      const avgLatency =
        latencies.length > 0 ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length : 0;

      return {
        averageProcessLatency: avgLatency,
        processorName,
      };
    });

    this.logger.info(
      `Pipeline metrics - FPS: ${frameRate.toFixed(1)}, Processors: ${processors.map(p => `${p.processorName}: ${p.averageProcessLatency.toFixed(2)}ms`).join(', ')}`
    );

    if (this.metricsCallback) {
      this.metricsCallback({
        frameRate,
        processors,
      });
    }

    this.processorLatencies.clear();
  }

  get framerate(): number {
    return this.fr;
  }

  // A negative framerate will cause `captureStream` to throw `NotSupportedError`.
  // The setter prevents this by switching to the default framerate if less than 0.
  set framerate(value: number) {
    this.fr = value < 0 || value === undefined ? DEFAULT_FRAMERATE : value;
  }

  stop(): void {
    this.session++;
    if (this.transformsTracks()) {
      this.stopTransformTrack();
    }
    // A failure keeps only the current session on the canvas: the next one tries transformTrack again.
    this.transformTrackFailed = false;
    // empty stream, stop pipeline
    // null input media stream stops the pipeline.
    this.videoInput.removeEventListener('loadedmetadata', this.startProcessLoop);
    this.videoInput.srcObject = null;

    // Clean the input stream and buffers.
    this.destroyInputMediaStreamAndBuffers();

    // Stop all the output tracks, but don't discard the media stream,
    // because it's how other parts of the codebase recognize when
    // a selected stream is part of this transform device.
    if (this.outputMediaStream) {
      for (const track of this.outputMediaStream.getVideoTracks()) {
        track.stop();
      }
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
    if (this.isOutputMediaStreamActive()) {
      return this.outputMediaStream;
    }

    this.outputMediaStream = this.canvasOutput.captureStream(this.framerate);
    this.cloneInputAudioTracksToOutput();
    return this.outputMediaStream;
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
    if (this.transformsTracks()) {
      await this.transformTrack(inputMediaStream.getVideoTracks()[0]);
      // The output stream now holds the transformed track, or the canvas track after a failed start.
      this.cloneInputAudioTracksToOutput();
      return;
    }
    const settings = this.inputVideoStream.getVideoTracks()[0].getSettings();
    this.logger.info(`processing pipeline input stream settings ${JSON.stringify(settings)}`);
    this.framerate = settings.frameRate;
    this.canvasOutput.width = settings.width;
    this.canvasOutput.height = settings.height;
    this.videoInput.addEventListener('loadedmetadata', this.startProcessLoop);
    this.videoInput.srcObject = this.inputVideoStream;
    // avoid iOS safari full screen video
    this.videoInput.setAttribute('playsinline', 'true');
    // create sources
    const canvasBuffer = new CanvasVideoFrameBuffer(this.canvasInput);
    this.sourceBuffers.push(canvasBuffer);

    this.videoInput.load();
    try {
      await this.videoInput.play();
    } catch {
      this.logger.warn('Video element play() overrided by another load().');
    }

    this.cloneInputAudioTracksToOutput();
  }

  private transformsTracks(): boolean {
    return (
      !this.transformTrackFailed &&
      this.stages?.length > 0 &&
      this.stages.every(stage => typeof stage.transformTrack === 'function')
    );
  }

  private async transformTrack(input: MediaStreamTrack): Promise<void> {
    const session = ++this.session;
    this.unwatchTransformTrackOutputs();
    // Each output is watched as soon as its stage resolves, as it can end while a later stage starts. Its end fails the
    // start until the last stage has resolved, and falls back to the canvas after that.
    let started = false;
    let failToStart: (error: Error) => void;
    const startFailed = new Promise<never>((_resolve, reject) => (failToStart = reject));
    const onOutputEnded = async (): Promise<void> => {
      if (!started) {
        failToStart(new Error('an output track ended'));
        return;
      }
      if (await this.fallBackToCanvas(session, 'a processor output track ended')) {
        this.outputTrackDidChange();
      }
    };
    let track = input;
    try {
      for (const stage of this.stages) {
        track = await Promise.race([
          withTimeout(stage.transformTrack(track), TRANSFORM_TRACK_TIMEOUT_MS, 'transformTrack'),
          startFailed,
        ]);
        if (session !== this.session) {
          return;
        }
        // A processor can resolve with a track that has already ended, which fires no ended event.
        if (track.readyState === 'ended') {
          throw new Error('an output track ended');
        }
        track.addEventListener('ended', onOutputEnded);
        this.transformTrackOutputs.push({ track, onEnded: onOutputEnded });
      }
    } catch (error) {
      await this.fallBackToCanvas(session, `a processor failed to start: ${error}`);
      return;
    }
    started = true;
    this.setOutputTrack(track);
    if (!this.hasStarted) {
      this.hasStarted = true;
      this.forEachObserver(observer => observer.processingDidStart?.());
    }
  }

  // Returns whether it put the canvas track in the output stream.
  private async fallBackToCanvas(session: number, reason: string): Promise<boolean> {
    // A start or an output of an earlier session must not change the current one, and a session falls back once:
    // transformTrackFailed is set before the first await, and only stop() clears it, which starts a new session.
    if (session !== this.session || this.transformTrackFailed) {
      return false;
    }
    this.logger.warn(`Falling back from transformTrack to the canvas: ${reason}`);
    this.transformTrackFailed = true;
    this.hasStarted = false;
    await this.stopTransformTrack();
    this.forEachObserver(observer => observer.processingDidFailToStart?.());
    if (session !== this.session) {
      return false;
    }
    await this.setInputMediaStream(this.inputVideoStream);
    if (session !== this.session) {
      return false;
    }
    this.setOutputTrack(this.canvasOutput.captureStream(this.framerate).getVideoTracks()[0]);
    return true;
  }

  private async stopTransformTrack(): Promise<void> {
    this.unwatchTransformTrackOutputs();
    await Promise.all(
      this.stages.map(async stage => {
        try {
          await withTimeout(
            stage.stopTransformTrack(),
            TRANSFORM_TRACK_TIMEOUT_MS,
            'stopTransformTrack'
          );
        } catch (error) {
          this.logger.warn(`${error}`);
        }
      })
    );
  }

  private unwatchTransformTrackOutputs(): void {
    for (const { track, onEnded } of this.transformTrackOutputs) {
      track.removeEventListener('ended', onEnded);
    }
    this.transformTrackOutputs = [];
  }

  private setOutputTrack(track: MediaStreamTrack): void {
    const [previousTrack] = this.outputMediaStream.getVideoTracks();
    if (track !== previousTrack) {
      this.outputMediaStream.addTrack(track);
      if (previousTrack) {
        this.outputMediaStream.removeTrack(previousTrack);
      }
    }
  }

  private cloneInputAudioTracksToOutput(): void {
    if (!this.isOutputMediaStreamActive() || this.inputVideoStream === null) {
      this.logger.info('Not cloning input audio tracks to output, do not have media streams ready');
      return; // Just wait for `getActiveOutputMediaStream`
    }

    // Remove current audio tracks from output
    for (const audioTrack of this.outputMediaStream.getAudioTracks()) {
      this.logger.info(`Removing audio track ${audioTrack.id} from output stream`);
      this.outputMediaStream.removeTrack(audioTrack);
    }

    for (const audioTrack of this.inputVideoStream.getAudioTracks()) {
      this.logger.info(`Adding audio track ${audioTrack.id} to output stream`);
      this.outputMediaStream.addTrack(audioTrack);
    }
  }

  private isOutputMediaStreamActive(): boolean {
    return this.outputMediaStream && this.outputMediaStream.active;
  }

  set processors(stages: VideoFrameProcessor[]) {
    this.stages = stages;
  }

  get processors(): VideoFrameProcessor[] {
    return this.stages;
  }

  // Setting a new input stream loads metadata again. A scheduled frame, or a frame of this session that will schedule
  // the next one, picks up the new stream, so a second loop would only process the same frames concurrently.
  private startProcessLoop = async (event: Event): Promise<void> => {
    if (this.isFrameScheduled || this.processingSession === this.session) {
      return;
    }
    await this.process(event);
  };

  process = async (_event: Event): Promise<void> => {
    const session = this.session;
    this.processingSession = session;
    try {
      await this.processFrame(session);
    } finally {
      if (this.processingSession === session) {
        this.processingSession = undefined;
      }
    }
  };

  private processScheduledFrame = async (): Promise<void> => {
    this.isFrameScheduled = false;
    await this.process(undefined);
  };

  // A frame ends at its next step once its session is no longer the current one, without changing anything.
  private processFrame = async (session: number): Promise<void> => {
    // A frame scheduled before stop() ends the loop here if the next session transforms tracks: it has no source buffer.
    if (!this.inputVideoStream || this.sourceBuffers.length === 0) {
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
        const processorStart = performance.now();
        buffers = await proc.process(buffers);
        if (session !== this.session) {
          return;
        }
        const processorLatency = performance.now() - processorStart;

        const processorName = this.getProcessorName(proc);
        if (!this.processorLatencies.has(processorName)) {
          this.processorLatencies.set(processorName, []);
        }
        this.processorLatencies.get(processorName)!.push(processorLatency);
      }
      this.checkMetricsReport();
    } catch (_error) {
      if (session === this.session) {
        this.forEachObserver(obs => {
          if (obs.processingDidFailToStart) {
            obs.processingDidFailToStart();
          }
        });
      }
      return;
    }

    this.destBuffers = buffers;
    let imageSource: CanvasImageSource;
    try {
      imageSource = await this.destBuffers[0].asCanvasImageSource();
    } catch (error) {
      if (session === this.session) {
        this.logger.info('buffers are destroyed and pipeline could not start');
        this.forEachObserver(obs => {
          if (obs.processingDidFailToStart) {
            obs.processingDidFailToStart();
          }
        });
      }
      return;
    }
    if (session !== this.session) {
      return;
    }

    // finally draws the image
    const frameWidth = (imageSource as HTMLCanvasElement | HTMLVideoElement).width as number;
    const frameHeight = (imageSource as HTMLCanvasElement | HTMLVideoElement).height as number;
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

    this.isFrameScheduled = true;
    await this.timer.start(nextFrameDelay, this.processScheduledFrame);
  };

  /* istanbul ignore next */
  setMetricsCallback(
    callback: (metrics: {
      frameRate: number;
      processors: Array<{ averageProcessLatency: number; processorName: string }>;
    }) => void
  ): void {
    this.metricsCallback = callback;
  }

  /* istanbul ignore next */
  private getProcessorName(processor?: VideoFrameProcessor): string {
    if (!processor) {
      if (this.stages.length === 0) return 'None';
      processor = this.stages[0];
    }
    if (processor instanceof VideoFxProcessor) return 'VideoFxProcessor';
    if (processor instanceof BackgroundSegmentationVideoFrameProcessor) {
      const model = processor.getModelType();
      switch (model) {
        case ModelType.SELFIE_MULTICLASS:
          return 'BackgroundSegmentationVideoFrameProcessor_Multiclass';
        case ModelType.SELFIE_GENERAL:
          return 'BackgroundSegmentationVideoFrameProcessor_General';
        default:
          return 'no-op';
      }
    }
    return 'other';
  }

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
