// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import VideoFxConfig from './VideoFxConfig';
import { SEGMENTATION_MODEL } from './VideoFxConstants';
import { VideoFxStreamParameters } from './VideoFxStreamParameters';

/**
 * [[VideoFxCanvasOpsManager]] Mechanism drives the canvas based operations
 * for the VideoFxProcessor. This includes input stream resizing to segmentation model
 * dimensions and managing the canvas loading for background replacement.
 */
export class VideoFxCanvasOpsManager {
  private logger: Logger;
  private streamParameters: VideoFxStreamParameters;
  private inferenceCanvas: HTMLCanvasElement;
  private inferenceCtx: CanvasRenderingContext2D;
  private outputCanvas: HTMLCanvasElement;
  private horizontalResizeScalar: number;
  private verticalResizeScalar: number;
  private backgroundReplacementCanvas: HTMLCanvasElement;
  private backgroundReplacementImage: HTMLImageElement;

  constructor(streamParameters: VideoFxStreamParameters, outputCanvas: HTMLCanvasElement) {
    this.streamParameters = streamParameters;
    this.outputCanvas = outputCanvas;
    this.configureCanvasPipeline();
  }

  /**
   * Generate the raw image data in a format that is directly importable into
   * the segmentation model
   * @param inputCanvas
   * @returns ImageData
   */
  getInferenceInputData(inputCanvas: HTMLCanvasElement): ImageData {
    // Resize our full resolution frame into a new canvas scaled to the
    // size of our segmentation model
    this.inferenceCtx.save();
    this.inferenceCtx.scale(this.horizontalResizeScalar, this.verticalResizeScalar);
    this.inferenceCtx.drawImage(inputCanvas, 0, 0);
    this.inferenceCtx.restore();
    // Now we can directly take image data that is the desired size of
    // of our segmentation model linput
    const inferenceInputData = this.inferenceCtx.getImageData(
      0,
      0,
      SEGMENTATION_MODEL.WIDTH_IN_PIXELS,
      SEGMENTATION_MODEL.HEIGHT_IN_PIXELS
    );
    return inferenceInputData;
  }

  /**
   * Reconfigure the canvas operations/pipeline to fit the dimensions of the new
   * video stream, and resize background replacement canvas.
   * @param streamParameters an VideoFxStreamParameters object specifying stream dimensions
   */
  async configureForStreamParameters(streamParameters: VideoFxStreamParameters): Promise<void> {
    this.streamParameters = streamParameters;
    this.outputCanvas.width = this.streamParameters.width;
    this.outputCanvas.height = this.streamParameters.height;

    // Resize background replacement canvas -- if it exists
    if (this.backgroundReplacementCanvas) {
      const resizedCanvas = document.createElement('canvas');
      resizedCanvas.width = this.streamParameters.width;
      resizedCanvas.height = this.streamParameters.height;
      resizedCanvas
        .getContext('2d')
        .drawImage(
          this.backgroundReplacementCanvas,
          0,
          0,
          this.streamParameters.width,
          this.streamParameters.height
        );
      this.backgroundReplacementCanvas = resizedCanvas;
    }

    this.configureCanvasPipeline();
  }

  /**
   * Configure the inference canvas so that write operations to the canvas
   * result in an image resizing.
   */
  private configureCanvasPipeline(): void {
    // Create new inference canvas and context
    this.inferenceCanvas = document.createElement('canvas');
    this.inferenceCtx = this.inferenceCanvas.getContext('2d', {
      willReadFrequently: true,
    }) as CanvasRenderingContext2D;
    // Configure the resize operation, which will be utilized by calling scale
    // and then drawing any sized input to the canvas
    this.inferenceCanvas.width = SEGMENTATION_MODEL.WIDTH_IN_PIXELS;
    this.inferenceCanvas.height = SEGMENTATION_MODEL.HEIGHT_IN_PIXELS;
    this.horizontalResizeScalar = SEGMENTATION_MODEL.WIDTH_IN_PIXELS / this.streamParameters.width;
    this.verticalResizeScalar = SEGMENTATION_MODEL.HEIGHT_IN_PIXELS / this.streamParameters.height;
  }

  /**
   * Return the background replacement canvas
   * @returns HTMLCanvasElement
   */
  getBackgroundReplacementCanvas(): HTMLCanvasElement {
    return this.backgroundReplacementCanvas;
  }

  /**
   * Attempt to load custom replacement background image from URL, or the default background color.
   * The backgroundReplacementCanvas is then set from the loaded image.
   * @param effectConfig
   */
  async loadReplacementBackground(effectConfig: VideoFxConfig): Promise<void> {
    const imageURL = effectConfig.backgroundReplacement.backgroundImageURL;
    const defaultColor = effectConfig.backgroundReplacement.defaultColor;
    if (imageURL) {
      try {
        const backgroundImage = await this.loadImage(imageURL);
        this.backgroundReplacementImage = backgroundImage;
        this.resizeAndSetReplacementImage(this.backgroundReplacementImage);
      } catch (error) /* istanbul ignore next */ {
        // The following can only happen due to an intermittent network issue.
        this.logger.error(error);
        throw new Error('Failed to set the replacement image.');
      }
    } else {
      this.resizeAndSetReplacementColor(defaultColor);
    }
  }

  /**
   * Draw loaded image on a canvas sized to the stream parameters, which is then set to the
   * backgroundReplacementCanvas member variable.
   * @param backgroundImage
   */
  private resizeAndSetReplacementImage(backgroundImage: HTMLImageElement): void {
    const resizedCanvas = document.createElement('canvas');
    const resizedCtx = resizedCanvas.getContext('2d');
    resizedCanvas.width = this.streamParameters.width;
    resizedCanvas.height = this.streamParameters.height;
    resizedCtx.drawImage(
      backgroundImage,
      0,
      0,
      this.streamParameters.width,
      this.streamParameters.height
    );
    this.backgroundReplacementCanvas = resizedCanvas;
  }

  /**
   * Fill default color on a canvas sized to the stream parameters, which is then set to the
   * backgroundReplacementCanvas member variable.
   * @param defaultColor
   */
  private resizeAndSetReplacementColor(defaultColor: string): void {
    const resizedCanvas = document.createElement('canvas');
    const resizedCtx = resizedCanvas.getContext('2d');
    resizedCanvas.width = this.streamParameters.width;
    resizedCanvas.height = this.streamParameters.height;
    resizedCtx.fillStyle = defaultColor;
    resizedCtx.fillRect(0, 0, this.streamParameters.width, this.streamParameters.height);
    this.backgroundReplacementCanvas = resizedCanvas;
  }

  /**
   * Attempt to load background image from URL.
   * @param backgroundImageURL
   * @returns Promise<HTMLCanvasElement>
   */
  async loadImage(backgroundImageURL: string): Promise<HTMLImageElement> {
    // Attempt to fetch the image
    const image = await fetch(backgroundImageURL).catch(error => {
      this.logger.error(error.toString());
      // Error returned in unit tests from mock fetch is non-compatible
      /* istanbul ignore next */
      throw new Error('Failed to fetch image.');
    });

    // Convert successful fetch into an HTMLImageElement
    const imageBlob = await image.blob();
    const img = new Image();
    img.src = URL.createObjectURL(imageBlob);
    return new Promise((resolve, reject) => {
      img.onload = () => {
        resolve(img);
      };
      img.onerror = error => {
        reject(error);
      };
    });
  }
}
