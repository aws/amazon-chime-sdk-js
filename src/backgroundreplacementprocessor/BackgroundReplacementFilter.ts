// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import BackgroundFilterProcessor from '../backgroundfilter/BackgroundFilterProcessor';
import BackgroundFilterSpec from '../backgroundfilter/BackgroundFilterSpec';
import BackgroundReplacementOptions from './BackgroundReplacementOptions';
import BackgroundReplacementProcessor from './BackgroundReplacementProcessor';
import BackgroundReplacementVideoFrameProcessorDelegate from './BackgroundReplacementVideoFrameProcessorDelegate';
import BackgroundReplacementVideoFrameProcessorObserver from './BackgroundReplacementVideoFrameProcessorObserver';

/**
 * [[BackgroundReplacementFilter]] implements [[BackgroundReplacementProcessor]].
 * It's a background replacement processor and input is passed into a worker that will apply a segmentation
 * to separate the foreground from the background. Then the background will have a replacement applied.
 *
 * The [[BackgroundReplacementProcessorProvided]] uses WASM and TensorFlow Lite to apply replacement of the
 * background image.
 */
/** @internal */
export default class BackgroundReplacementFilter
  extends BackgroundFilterProcessor
  implements BackgroundReplacementProcessor {
  private replacementBlob?: Blob;
  private replacementObjectUrl?: string;
  /**
   * A constructor that will apply default values if spec and strength are not provided.
   * If no spec is provided the selfie segmentation model is used with default paths to CDN for the
   * worker and wasm files used to process each frame.
   * @param spec The spec defines the assets that will be used for adding background filter to a frame
   * @param options The background replacement image path
   */
  constructor(spec: BackgroundFilterSpec, options: BackgroundReplacementOptions) {
    super(
      'background replacement',
      spec,
      options,
      new BackgroundReplacementVideoFrameProcessorDelegate()
    );

    this.replacementBlob = options.imageBlob;

    this.logger.info('BackgroundReplacement processor successfully created');
    this.logger.info(`BackgroundReplacement spec: ${this.stringify(this.spec)}`);
    this.logger.info(`BackgroundReplacement options: ${this.stringify(options)}`);

    // Exchange the height and width of the canvas context if there is a mismatch with the orientation
    screen.orientation.addEventListener('change', _event => {
      if (
        (screen.orientation.type.startsWith('portrait') &&
          this.canvasCtx.canvas.height < this.canvasCtx.canvas.width) ||
        (screen.orientation.type.startsWith('landscape') &&
          this.canvasCtx.canvas.height > this.canvasCtx.canvas.width)
      ) {
        [this.canvasCtx.canvas.width, this.canvasCtx.canvas.height] = [
          this.canvasCtx.canvas.height,
          this.canvasCtx.canvas.width,
        ];
      }
    });
  }

  async setImageBlob(blob: Blob): Promise<void> {
    this.replacementBlob = blob;
    this.replacementImage = await BackgroundReplacementFilter.loadImage(
      this.createReplacementObjectUrl()
    );
  }

  initOnFirstExecution(): void {}

  drawImageWithMask(inputCanvas: HTMLCanvasElement, mask: ImageData): void {
    // Mask will not be set until the worker has completed handling the predict event. Until the first frame is processed,
    // the whole frame will be replaced.
    if (!mask) {
      mask = new ImageData(this.spec.model.input.width, this.spec.model.input.height);
    }

    const scaledCtx = this.scaledCanvas.getContext('2d');

    scaledCtx.putImageData(mask, 0, 0);

    const { canvasCtx, targetCanvas } = this;
    const { width, height } = targetCanvas;

    // draw the mask
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, width, height);
    canvasCtx.drawImage(this.scaledCanvas, 0, 0, width, height);

    // Only overwrite existing pixels.
    canvasCtx.globalCompositeOperation = 'source-in';
    // draw image over mask...
    canvasCtx.drawImage(inputCanvas, 0, 0, width, height);

    // draw under person
    canvasCtx.globalCompositeOperation = 'destination-over';

    canvasCtx.drawImage(this.replacementImage, 0, 0, targetCanvas.width, targetCanvas.height);
    canvasCtx.restore();
  }

  /* istanbul ignore next */
  private static loadImageExecutor(
    resolve: (image: HTMLImageElement) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reject: (reason?: any) => void,
    imageUrl: string
  ): void {
    const image = new Image();
    image.crossOrigin = 'Anonymous';
    image.addEventListener(
      'load',
      () => {
        resolve(image);
      },
      false
    );
    image.addEventListener(
      'error',
      error => {
        reject(new Error(`Could not load replacement image ${image.src}: ${error.message}`));
      },
      false
    );
    image.src = imageUrl;
  }

  /** @internal */
  static async loadImage(imageUrl: string): Promise<HTMLImageElement> {
    return new Promise<HTMLImageElement>((resolve, reject) =>
      this.loadImageExecutor(resolve, reject, imageUrl)
    );
  }

  private revokeReplacementObjectUrl(): void {
    if (this.replacementObjectUrl) {
      URL.revokeObjectURL(this.replacementObjectUrl);
    }
  }

  private createReplacementObjectUrl(): string {
    this.revokeReplacementObjectUrl();
    this.replacementObjectUrl = URL.createObjectURL(this.replacementBlob);
    return this.replacementObjectUrl;
  }

  /**
   * This method initializes all of the resource necessary to process background replacement. It returns
   * a promise and resolves or rejects the promise once the initialization is complete.
   * @returns
   * @throws An error will be thrown
   */
  async loadAssets(): Promise<void> {
    this.replacementImage = await BackgroundReplacementFilter.loadImage(
      this.createReplacementObjectUrl()
    );
    super.loadAssets();
    return;
  }

  addObserver(observer: BackgroundReplacementVideoFrameProcessorObserver): void {
    this.delegate.addObserver(observer);
  }

  removeObserver(observer: BackgroundReplacementVideoFrameProcessorObserver): void {
    this.delegate.removeObserver(observer);
  }

  async destroy(): Promise<void> {
    super.destroy();
    this.revokeReplacementObjectUrl();
  }
}
