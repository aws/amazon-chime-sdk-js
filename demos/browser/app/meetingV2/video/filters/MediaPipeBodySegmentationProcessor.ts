// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line
declare var bodyPix: any;

// eslint-disable-next-line
declare var bodySegmentation: any;

import {
  CanvasVideoFrameBuffer,
  VideoFrameBuffer,
  VideoFrameProcessor,
} from 'amazon-chime-sdk-js';


import { BackgroundImageEncoding } from '../../util/BackgroundImage';

const segmenterConfig = {
  runtime: 'mediapipe', // or 'tfjs'
  solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation',
  modelType: 'general',
  segmentBodyParts: true,
}

/**
 * [[SegmentationProcessors]] loads Tensorflow BodyPix model to perform image segmentation.
 * Please refer to https://www.npmjs.com/package/@tensorflow-models/body-pix/v/2.0.5.
 */
export default class MediaPipeBodySegmentationProcessor implements VideoFrameProcessor {
  private targetCanvas: HTMLCanvasElement = document.createElement('canvas') as HTMLCanvasElement;
  private canvasVideoFrameBuffer = new CanvasVideoFrameBuffer(this.targetCanvas);
  private sourceWidth: number = 0;
  private sourceHeight: number = 0;
  static FOREGROUND_COLOR = { r: 0, g: 0, b: 0, a: 0 };
  static BACKGROUND_COLOR = { r: 0, g: 0, b: 0, a: 255 };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mask: any | undefined = undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private model: any | undefined = undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private segmenter: any | undefined = undefined;

  private backgroundReplacementCanvas: HTMLCanvasElement | undefined = undefined;
  private backgroundReplacementImage: HTMLImageElement | undefined = undefined;

  constructor() {}


  /**
   * Draw loaded image on a canvas sized to the stream parameters, which is then set to the
   * backgroundReplacementCanvas member variable.
   * @param backgroundImage
   */
  private resizeAndSetReplacementImage(backgroundImage: HTMLImageElement): void {
    const resizedCanvas = document.createElement('canvas');
    const resizedCtx = resizedCanvas.getContext('2d');
    resizedCanvas.width = this.sourceWidth;
    resizedCanvas.height = this.sourceHeight;
    resizedCtx.drawImage(
      backgroundImage,
      0,
      0,
      this.sourceWidth,
      this.sourceHeight
    );
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
      // Error returned in unit tests from mock fetch is non-compatible
      /* istanbul ignore next */
      throw new Error(`Failed to fetch image. error - ${error}`);
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

  /**
   * Attempt to load custom replacement background image from URL, or the default background color.
   * The backgroundReplacementCanvas is then set from the loaded image.
   * @param effectConfig
   */
  async loadReplacementBackground(imageURL: string): Promise<void> {
    try {
      const backgroundImage = await this.loadImage(imageURL);
      this.backgroundReplacementImage = backgroundImage;
      this.resizeAndSetReplacementImage(this.backgroundReplacementImage);
    } catch (error) /* istanbul ignore next */ {
      // The following can only happen due to an intermittent network issue.
      throw new Error(`Failed to set the replacement image. error - ${error}`);
    }
  }

  async process(buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
    if (!this.segmenter) {
      this.segmenter = await bodySegmentation.createSegmenter(bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation, segmenterConfig);
    }

    const inputCanvas = buffers[0].asCanvasElement();
    if (!inputCanvas) {
      throw new Error('buffer is already destroyed');
    }

    const frameWidth = inputCanvas.width;
    const frameHeight = inputCanvas.height;
    if (frameWidth === 0 || frameHeight === 0) {
      return buffers;
    }

    if (this.sourceWidth !== frameWidth || this.sourceHeight !== frameHeight) {
      this.sourceWidth = frameWidth;
      this.sourceHeight = frameHeight;

      // update target canvas size to match the frame size
      this.targetCanvas.width = this.sourceWidth;
      this.targetCanvas.height = this.sourceHeight;
    }

    if (!this.backgroundReplacementCanvas) {
      await this.loadReplacementBackground(await BackgroundImageEncoding());
    }

    this.targetCanvas.getContext('2d').drawImage(this.backgroundReplacementImage, 0, 0, this.sourceWidth, this.sourceHeight);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const segmentation = await this.segmenter.segmentPeople(inputCanvas);
    if (segmentation) {
      const drawContour = true;
      const foregroundThreshold = 0.2;
      this.mask = await bodySegmentation.toBinaryMask(
        segmentation, MediaPipeBodySegmentationProcessor.FOREGROUND_COLOR, MediaPipeBodySegmentationProcessor.BACKGROUND_COLOR, drawContour, foregroundThreshold);
    }

    if (this.mask) {
      const inputImageData = inputCanvas.getContext('2d').getImageData(0, 0, inputCanvas.width, inputCanvas.height);
      const inputPixels = inputImageData.data;

      const targetImageData = this.targetCanvas.getContext('2d').getImageData(0, 0, this.targetCanvas.width, this.targetCanvas.height);
  
      for (let i = 3; i < targetImageData.data.length; i += 4) {
        if (this.mask.data[i] !== 255) {
          targetImageData.data[i-3] = inputPixels[i-3];
          targetImageData.data[i-2] = inputPixels[i-2];
          targetImageData.data[i-1] = inputPixels[i-1];
          targetImageData.data[i] = inputPixels[i];
        }
      }

      this.targetCanvas.getContext('2d').putImageData(targetImageData, 0, 0);

      buffers[0] = this.canvasVideoFrameBuffer;
    }

    return buffers;
  }

  async destroy(): Promise<void> {
    if (this.model) {
      this.model.dispose();
    }
    this.model = undefined;
  }
}
