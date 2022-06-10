// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import BackgroundFilterSpec from '../backgroundfilter/BackgroundFilterSpec';
import BackgroundBlurOptions from './BackgroundBlurOptions';
import BackgroundBlurProcessorProvided from './BackgroundBlurProcessorProvided';
import { BlurStrengthMapper } from './BackgroundBlurStrength';

/**
 * The [[BackgroundBlurProcessorBuiltIn]] uses the browser's built-in capability to apply blurring to
 * the background image as apposed to [[BackgroundBlurProcessorProvided]] that uses WASM and
 * TensorFlow Lite to apply the blur.
 */

/** @internal */
export default class BackgroundBlurProcessorBuiltIn extends BackgroundBlurProcessorProvided {
  private blurredImage: ImageData;
  private blurCanvas: HTMLCanvasElement = document.createElement('canvas') as HTMLCanvasElement;
  private blurCanvasCtx = this.blurCanvas.getContext('2d');

  /**
   * A constructor that will apply default values if spec and strength are not provided.
   * If no spec is provided the selfie segmentation model is used with default paths to CDN for the
   * worker and wasm files used to process each frame.
   * @param spec The spec defines the assets that will be used for adding background blur to a frame.
   * @param options How much blur to apply to a frame.
   */
  constructor(spec?: BackgroundFilterSpec, options?: BackgroundBlurOptions) {
    super(spec, options);

    this.blurCanvas.width = this.spec.model.input.width;
    this.blurCanvas.height = this.spec.model.input.height;
    this.logger.info('BackgroundBlur processor using builtin blur');
  }

  drawImageWithMask(inputCanvas: HTMLCanvasElement, mask: ImageData): void {
    // Mask will not be set until the worker has completed handling the predict event. Until the first frame is processed,
    // the whole frame will be blurred.
    const blurredImage = this.blurredImage;
    const { canvasCtx, targetCanvas } = this;
    const { width, height } = targetCanvas;

    if (!mask || !blurredImage) {
      canvasCtx.clearRect(0, 0, width, height);
      return;
    }

    const scaledCtx = this.scaledCanvas.getContext('2d');

    scaledCtx.putImageData(mask, 0, 0);
    this.blurCanvasCtx.putImageData(this.blurredImage, 0, 0);

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
    canvasCtx.drawImage(this.blurCanvas, 0, 0, width, height);
    canvasCtx.restore();
  }

  setBlurStrength(blurStrength: number): void {
    super.setBlurStrength(blurStrength);

    if (this.worker) {
      // live update
      this.modelInitialized = false;

      this.worker.postMessage({ msg: 'destroy' });

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
          blurPixels: this.blurAmount,
        },
      });
    }
  }

  setBlurPixels(): void {
    // the blurred image is sized down to 144, regardless of what the canvas size is, so
    // we use the default blur strengths (540p)
    this.blurAmount = BlurStrengthMapper.getBlurAmount(this._blurStrength, { height: 540 });
    this.logger.info(`background blur amount set to ${this.blurAmount}`);
  }

  handleInitialize(msg: { payload: number, supportsSAB: boolean }): void {
    this.logger.info(`received initialize message: ${this.stringify(msg)}`);
    if (!msg.payload) {
      this.logger.error('failed to initialize module');
      this.initWorkerPromise.reject(new Error('failed to initialize the module'));
      return;
    }

    const model = this.spec.model;
    const inputChannels = 4;
    this.initializeSharedMaskState(msg.supportsSAB, model, inputChannels);

    this.worker.postMessage({
      msg: 'loadModel',
      payload: {
        modelUrl: model.path,
        inputHeight: model.input.height,
        inputWidth: model.input.width,
        inputChannels,
        modelRangeMin: model.input.range[0],
        modelRangeMax: model.input.range[1],
        blurPixels: this.blurAmount,
      },
    });
    this.initWorkerPromise.resolve({});
  }

  handlePredict(msg: { payload: { blurOutput: ImageData; output: ImageData } }): void {
    this.blurredImage = msg.payload.blurOutput;
    super.handlePredict(msg);
  }

  handlePredictSAB(msg: { payload: { blurOutput: ImageData } }): void {
    this.blurredImage = msg.payload.blurOutput;
    super.handlePredictSAB(msg);
  }

  async destroy(): Promise<void> {
    super.destroy();
    this.blurCanvas?.remove();
    this.blurCanvas = undefined;
  }
}
