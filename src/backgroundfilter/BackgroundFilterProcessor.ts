// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { loadWorker } from '../../libs/voicefocus/loader';
import BackgroundFilterOptions from '../backgroundfilter/BackgroundFilterOptions';
import BackgroundFilterVideoFrameProcessorObserver from '../backgroundfilter/BackgroundFilterVideoFrameProcessorObserver';
import Logger from '../logger/Logger';
import CanvasVideoFrameBuffer from '../videoframeprocessor/CanvasVideoFrameBuffer';
import VideoFrameBuffer from '../videoframeprocessor/VideoFrameBuffer';
import BackgroundFilterFrameCounter from './BackgroundFilterFrameCounter';
import BackgroundFilterSpec from './BackgroundFilterSpec';
import BackgroundFilterVideoFrameProcessorDelegate from './BackgroundFilterVideoFrameProcessorDelegate';
/** @internal */
class DeferredObservable<T> {
  /** Access the last-resolved value of next()
   */
  value: T | undefined = undefined;

  private promise?: Promise<T>;
  private resolve: (value: T) => void = null;

  /** Create a promise that resolves once next() is called
   */
  whenNext(): Promise<T> {
    /* istanbul ignore else */
    if (!this.promise) {
      // externally-resolvable promise
      this.promise = new Promise(resolve => (this.resolve = resolve));
    }
    return this.promise;
  }

  /** Update the value and resolve
   */
  next(value: T): void {
    // store the value, for sync access
    this.value = value;
    // resolve the promise so anyone awaiting whenNext resolves
    this.resolve(value);
    // delete the promise so future whenNext calls get a new promise
    delete this.promise;
  }
}

/**
 * The [[BackgroundFilter]] uses WASM and TensorFlow Lite to apply changes to the
 * background image.
 */
/** @internal */
export default abstract class BackgroundFilterProcessor {
  protected targetCanvas: HTMLCanvasElement = document.createElement('canvas') as HTMLCanvasElement;
  protected canvasCtx = this.targetCanvas.getContext('2d');
  protected replacementImage: HTMLImageElement;
  protected filterType: string;

  protected canvasVideoFrameBuffer = new CanvasVideoFrameBuffer(this.targetCanvas);
  protected mask$ = new DeferredObservable<ImageData>();
  protected sourceWidth = 0;
  protected sourceHeight = 0;
  protected frameNumber = 0;
  protected videoFramesPerFilterUpdate = 1;

  protected spec: BackgroundFilterSpec;
  protected cpuMonitor: BackgroundFilterMonitor;
  protected worker: Worker;
  protected logger: Logger;
  protected delegate: BackgroundFilterVideoFrameProcessorDelegate;

  protected initWorkerPromise = BackgroundFilterProcessor.createWorkerPromise<{
    message?: string;
  }>();
  protected loadModelPromise = BackgroundFilterProcessor.createWorkerPromise<{
    message?: string;
  }>();

  protected scaledCanvas: HTMLCanvasElement;
  protected frameCounter: BackgroundFilterFrameCounter;
  protected modelInitialized = false;
  private destroyed = false;

  protected static createWorkerPromise<T>(): {
    resolve: (value: T) => void;
    reject: (value: Error) => void;
    promise: Promise<T>;
  } {
    const resolver: {
      resolve: (value: T) => void;
      reject: (value: Error) => void;
      promise: Promise<T>;
    } = { resolve: null, reject: null, promise: null };
    resolver.promise = new Promise<T>((resolve, reject) => {
      resolver.resolve = resolve;
      resolver.reject = reject;
    });
    return resolver;
  }

  /** Check if the input spec are not null
   */
  protected validateSpec(spec: BackgroundFilterSpec): void {
    if (!spec) {
      throw new Error('processor has null spec');
    }

    if (!spec.model) {
      throw new Error('processor spec has null model');
    }

    if (!spec.paths) {
      throw new Error('processor spec has null paths');
    }
  }

  protected validateOptions(options: BackgroundFilterOptions): void {
    if (!options) {
      throw new Error('processor has null options');
    }

    if (!options.logger) {
      throw new Error('processor has null options - logger');
    }

    if (!options.reportingPeriodMillis) {
      throw new Error('processor has null options - reportingPeriodMillis');
    }

    if (!options.filterCPUUtilization) {
      throw new Error('processor has null options - filterCPUUtilization');
    }
  }

  abstract initOnFirstExecution(): void;

  constructor(
    filterType: string,
    spec: BackgroundFilterSpec,
    options: BackgroundFilterOptions,
    delegate: BackgroundFilterVideoFrameProcessorDelegate
  ) {
    this.filterType = filterType;
    this.validateSpec(spec);
    this.validateOptions(options);
    this.spec = spec;
    this.logger = options.logger;
    this.delegate = delegate;
    this.initCPUMonitor(options);
  }

  initCPUMonitor(options: BackgroundFilterOptions): void {
    const CPU_MONITORING_PERIOD_MILLIS = 5000;
    const MAX_SEGMENTATION_SKIP_RATE = 10;
    const MIN_SEGMENTATION_SKIP_RATE = 1;
    this.videoFramesPerFilterUpdate = 1;
    this.frameCounter = new BackgroundFilterFrameCounter(
      this.delegate,
      options.reportingPeriodMillis,
      options.filterCPUUtilization,
      this.logger
    );
    this.cpuMonitor = new BackgroundFilterMonitor(CPU_MONITORING_PERIOD_MILLIS, {
      reduceCPUUtilization: () => {
        this.updateVideoFramesPerFilterUpdate(
          Math.min(this.videoFramesPerFilterUpdate + 1, MAX_SEGMENTATION_SKIP_RATE)
        );
      },
      increaseCPUUtilization: () => {
        this.updateVideoFramesPerFilterUpdate(
          Math.max(this.videoFramesPerFilterUpdate - 1, MIN_SEGMENTATION_SKIP_RATE)
        );
      },
    });
    this.delegate.addObserver(this.cpuMonitor);
  }
  /** Converts a value to a JSON string
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected stringify(value: any): string {
    return JSON.stringify(value, null, 2);
  }

  /**
   * Sends a message to worker and resolves promise in response to worker's initialize event
   */
  handleInitialize(msg: { payload: number }): void {
    this.logger.info(`received initialize message: ${this.stringify(msg)}`);
    if (!msg.payload) {
      this.logger.error('failed to initialize module');
      this.initWorkerPromise.reject(new Error('failed to initialize the module'));
      return;
    }
    const model = this.spec.model;
    this.worker.postMessage({
      msg: 'loadModel',
      payload: {
        modelUrl: model.path,
        inputHeight: model.input.height,
        inputWidth: model.input.width,
        inputChannels: 4,
        modelRangeMin: model.input.range[0],
        modelRangeMax: model.input.range[1],
        blurPixels: 0,
      },
    });
    this.initWorkerPromise.resolve({});
  }

  /**
   * Resolves promise in response to worker's loadModel event
   */
  handleLoadModel(msg: { payload: number }): void {
    this.logger.info(`received load model message: ${this.stringify(msg)}`);
    if (msg.payload !== 2) {
      this.logger.error('failed to load model! status: ' + msg.payload);
      /** Rejects model promise
       */
      this.loadModelPromise.reject(new Error('failed to load model! status: ' + msg.payload));
      return;
    }
    this.modelInitialized = true;
    this.loadModelPromise.resolve({});
  }

  /** Updates the payload output value in response to worker's predict event
   */
  handlePredict(msg: { payload: { output: ImageData } }): void {
    this.mask$.next(msg.payload.output as ImageData);
  }

  /**
   * This method will handle the asynchronous messaging between the main JS thread
   * and the worker thread.
   * @param evt An event that was sent from the worker to the JS thread.
   * @returns
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected handleWorkerEvent(evt: MessageEvent<any>): void {
    const msg = evt.data;
    switch (msg.msg) {
      case 'initialize':
        this.handleInitialize(msg);
        break;
      case 'loadModel':
        this.handleLoadModel(msg);
        break;
      case 'predict':
        this.handlePredict(msg);
        break;
      default:
        this.logger.info(`unexpected event msg: ${this.stringify(msg)}`);
        break;
    }
  }

  /**
   * This method initializes all of the resource necessary to processs background filter. It returns
   * a promise and resolves or rejects the promise once the initialization is complete.
   * @returns
   * @throws An error will be thrown
   */
  async loadAssets(): Promise<void> {
    this.logger.info('start initializing the processor');
    try {
      this.worker = await loadWorker(this.spec.paths.worker, 'BackgroundFilterWorker', {}, null);
      this.worker.addEventListener('message', ev => this.handleWorkerEvent(ev));

      this.worker.postMessage({
        msg: 'initialize',
        payload: {
          wasmPath: this.spec.paths.wasm,
          simdPath: this.spec.paths.simd,
        },
      });

      await this.initWorkerPromise.promise;
      this.logger.info(`successfully initialized the ${this.filterType} worker`);

      await this.loadModelPromise.promise;
      this.logger.info(`successfully loaded ${this.filterType} worker segmentation model`);
    } catch (error) {
      throw new Error(
        `could not initialize the ${this.filterType} video frame processor due to '${error.message}'`
      );
    }
    this.logger.info(`successfully initialized the ${this.filterType} processor`);
  }

  /**
   * Processes the VideoFrameBuffer by applying a segmentation mask and replacing the background.
   * @param buffers object that contains the canvas element that will be used to obtain the image data to process
   * @returns the updated buffer that contains the image with the background replaced.
   */
  async process(buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
    if (this.destroyed) {
      return buffers;
    }

    this.frameCounter.frameReceived(buffers[0].framerate);
    this.cpuMonitor.frameReceived();
    const inputCanvas = buffers[0].asCanvasElement() as HTMLCanvasElement;
    if (!inputCanvas) {
      return buffers;
    }

    if (!this.modelInitialized) {
      // return existing buffer, if any
      buffers[0] = this.canvasVideoFrameBuffer;
      return buffers;
    }

    const frameWidth = inputCanvas.width;
    const frameHeight = inputCanvas.height;
    if (frameWidth === 0 || frameHeight === 0) {
      return buffers;
    }

    // on first execution of process the source width will be zero
    if (this.sourceWidth === 0) {
      this.sourceWidth = frameWidth;
      this.sourceHeight = frameHeight;

      // update target canvas size to match the frame size
      this.targetCanvas.width = this.sourceWidth;
      this.targetCanvas.height = this.sourceHeight;

      this.logger.info(`${this.filterType} source width: ${this.sourceWidth}`);
      this.logger.info(`${this.filterType} source height: ${this.sourceHeight}`);

      this.initOnFirstExecution();
    }

    try {
      this.frameCounter.filterSubmitted();
      let mask = this.mask$.value;

      const hscale = this.spec.model.input.width / inputCanvas.width;
      const vscale = this.spec.model.input.height / inputCanvas.height;

      if (this.scaledCanvas === undefined) {
        this.scaledCanvas = document.createElement('canvas');
        this.scaledCanvas.width = this.spec.model.input.width;
        this.scaledCanvas.height = this.spec.model.input.height;
      }

      const scaledCtx = this.scaledCanvas.getContext('2d');
      scaledCtx.save();
      scaledCtx.scale(hscale, vscale);
      scaledCtx.drawImage(inputCanvas, 0, 0);
      scaledCtx.restore();

      const imageData = scaledCtx.getImageData(
        0,
        0,
        this.scaledCanvas.width,
        this.scaledCanvas.height
      );

      // update the filter mask based on the filter update rate
      if (this.frameNumber % this.videoFramesPerFilterUpdate === 0) {
        // process frame...
        const maskPromise = this.mask$.whenNext();
        this.worker.postMessage({ msg: 'predict', payload: imageData }, [imageData.data.buffer]);
        mask = await maskPromise;
      }
      // It's possible that while waiting for the predict to complete the processor was destroyed.
      // adding a destroyed check here to ensure the implementation of drawImageWithMask does not throw
      // an error due to destroyed processor.
      if (!this.destroyed) {
        this.drawImageWithMask(inputCanvas, mask);
      }
    } catch (error) {
      this.logger.error(`could not process ${this.filterType} frame buffer due to ${error}`);
      return buffers;
    } finally {
      this.frameCounter.filterComplete();
      this.frameNumber++;
    }

    buffers[0] = this.canvasVideoFrameBuffer;

    return buffers;
  }

  protected updateVideoFramesPerFilterUpdate(newRate: number): void {
    if (newRate !== this.videoFramesPerFilterUpdate) {
      this.videoFramesPerFilterUpdate = newRate;
      this.logger.info(
        `Adjusting filter rate to compensate for CPU utilization. ` +
          `Filter rate is ${this.videoFramesPerFilterUpdate} video frames per filter.`
      );
    }
  }

  /**
   * Clean up processor resources
   */
  async destroy(): Promise<void> {
    this.destroyed = true;
    this.delegate.removeObserver(this.cpuMonitor);
    this.canvasVideoFrameBuffer.destroy();
    this.worker?.postMessage({ msg: 'destroy' });
    this.worker?.postMessage({ msg: 'close' });
    this.targetCanvas?.remove();
    this.targetCanvas = undefined;
    this.scaledCanvas?.remove();
    this.scaledCanvas = undefined;
    this.logger.info(`${this.filterType} frame process destroyed`);
  }

  /**
   * Draw image with mask
   */
  abstract drawImageWithMask(inputCanvas: HTMLCanvasElement, mask: ImageData): void;
}

/** @internal */
interface MonitorCpuObserver {
  reduceCPUUtilization: () => void;
  increaseCPUUtilization: () => void;
}

/** @internal */
export class BackgroundFilterMonitor implements BackgroundFilterVideoFrameProcessorObserver {
  private lastCPUChangeTimestamp: number = 0;
  constructor(private monitoringPeriodMillis: number, private observer: MonitorCpuObserver) {}

  filterCPUUtilizationHigh(): void {
    const timestamp = Date.now();
    // Allow some time to pass before we check CPU utilization.
    if (timestamp - this.lastCPUChangeTimestamp >= this.monitoringPeriodMillis) {
      this.lastCPUChangeTimestamp = timestamp;
      this.observer.reduceCPUUtilization();
    }
  }

  frameReceived(): void {
    const timestamp = Date.now();
    // If a enough time has passed, reset the processor and continue to monitor
    if (timestamp - this.lastCPUChangeTimestamp >= this.monitoringPeriodMillis * 2) {
      this.lastCPUChangeTimestamp = timestamp;
      this.observer.increaseCPUUtilization();
    }
  }
}
