// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import BackgroundFilterProcessor from '../backgroundfilter/BackgroundFilterProcessor';
import BackgroundFilterSpec from '../backgroundfilter/BackgroundFilterSpec';
import BackgroundBlurOptions from './BackgroundBlurOptions';
import BackgroundBlurProcessor from './BackgroundBlurProcessor';
import { BlurStrengthMapper } from './BackgroundBlurStrength';
import BackgroundBlurVideoFrameProcessorDelegate from './BackgroundBlurVideoFrameProcessorDelegate';
import BackgroundBlurVideoFrameProcessorObserver from './BackgroundBlurVideoFrameProcessorObserver';

/**
 * [[BackgroundBlurProcessorProvided]] implements [[BackgroundBlurProcessor]].
 * It's a background blur processor and input is passed into a worker that will apply a segmentation
 * to separate the foreground from the background. Then the background will have a blur applied.
 *
 * The [[BackgroundBlurProcessorProvided]] uses WASM and TensorFlow Lite to apply the blurring of the
 * background image as apposed to [[BackgroundBlurProcessorBuiltIn]] that uses the browser's built-in
 * capability to apply the blur.
 */
/** @internal */
export default class BackgroundBlurProcessorProvided
  extends BackgroundFilterProcessor
  implements BackgroundBlurProcessor {
  protected blurAmount = 0;
  protected _blurStrength: number;

  protected validateOptions(options: BackgroundBlurOptions): void {
    super.validateOptions(options);
    if (!options.blurStrength) {
      throw new Error('processor has null options - blurStrength');
    }
  }

  /**
   * A constructor that will apply default values if spec and strength are not provided.
   * If no spec is provided the selfie segmentation model is used with default paths to CDN for the
   * worker and wasm files used to process each frame.
   * @param spec The spec defines the assets that will be used for adding background blur to a frame
   * @param options How much blur to apply to a frame
   */
  constructor(spec: BackgroundFilterSpec, options: BackgroundBlurOptions) {
    super('background blur', spec, options, new BackgroundBlurVideoFrameProcessorDelegate());

    this.setBlurStrength(options.blurStrength);

    this.logger.info('BackgroundBlur processor successfully created');
    this.logger.info(`BackgroundBlur spec: ${this.stringify(this.spec)}`);
    this.logger.info(`BackgroundBlur options: ${this.stringify(options)}`);
  }

  initOnFirstExecution(): void {
    this.setBlurPixels();
  }

  drawImageWithMask(inputCanvas: HTMLCanvasElement, mask: ImageData): void {
    // Mask will not be set until the worker has completed handling the predict event. Until the first frame is processed,
    // the whole frame will be blurred.
    if (!mask) {
      mask = new ImageData(this.spec.model.input.width, this.spec.model.input.height);
    }

    const scaledCtx = this.scaledCanvas.getContext('2d');

    scaledCtx.putImageData(mask, 0, 0);

    const { canvasCtx, targetCanvas } = this;
    const { width, height } = targetCanvas;

    screen.orientation.addEventListener('change', _event => {
      console.log("Arpan");
      if (
        (screen.orientation.type.startsWith('portrait') &&
          canvasCtx.canvas.height < canvasCtx.canvas.width) ||
        (screen.orientation.type.startsWith('landscape') &&
          canvasCtx.canvas.height > canvasCtx.canvas.width)
      ) {
        console.log("Arpan 2");
        [canvasCtx.canvas.width, canvasCtx.canvas.height] = [
          canvasCtx.canvas.height,
          canvasCtx.canvas.width,
        ];
      }
    });

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
    canvasCtx.filter = `blur(${this.blurAmount}px)`;
    canvasCtx.drawImage(inputCanvas, 0, 0, targetCanvas.width, targetCanvas.height);
    canvasCtx.restore();
  }

  setBlurStrength(blurStrength: number): void {
    this._blurStrength = blurStrength;
    this.logger.info(`blur strength set to ${this._blurStrength}`);
    this.setBlurPixels();
  }

  /**
   * Calculate the blur amount based on the blur strength passed in and height of the image being blurred.
   */
  setBlurPixels(): void {
    this.blurAmount = BlurStrengthMapper.getBlurAmount(this._blurStrength, {
      height: this.sourceHeight,
    });
    this.logger.info(`background blur amount set to ${this.blurAmount}`);
  }

  addObserver(observer: BackgroundBlurVideoFrameProcessorObserver): void {
    this.delegate.addObserver(observer);
  }

  removeObserver(observer: BackgroundBlurVideoFrameProcessorObserver): void {
    this.delegate.removeObserver(observer);
  }

  static async isSupported(): Promise<boolean> {
    const canvas = document.createElement('canvas');
    const supportsBlurFilter = canvas.getContext('2d').filter !== undefined;
    canvas.remove();

    return supportsBlurFilter;
  }
}
