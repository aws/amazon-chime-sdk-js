// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as bodySegmentation from '@tensorflow-models/body-segmentation';

import {
  CanvasVideoFrameBuffer,
  VideoFrameBuffer,
  VideoFrameProcessor,
} from 'amazon-chime-sdk-js';


import { BackgroundImageEncoding } from '../../util/BackgroundImage';
import { BodySegmenter } from '@tensorflow-models/body-segmentation/dist/body_segmenter';
import {
  Segmentation
} from '@tensorflow-models/body-segmentation/dist/shared/calculators/interfaces/common_interfaces';

const segmenterConfig: bodySegmentation.MediaPipeSelfieSegmentationMediaPipeModelConfig = {
  runtime: 'mediapipe', // or 'tfjs'
  solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation',
  modelType: 'general',
}

export enum SegmentationOption {
  BLUR,
  BLUE = 1,
  BEACH = 2,
}

/**
 * [[SegmentationProcessors]] loads Tensorflow Body Segmentation model to perform image segmentation.
 * Please refer to https://www.npmjs.com/package/@tensorflow-models/body-segmentation
 */
export default class MediaPipeBodySegmentationProcessor implements VideoFrameProcessor {
  private targetCanvas: HTMLCanvasElement = document.createElement('canvas') as HTMLCanvasElement;
  private canvasVideoFrameBuffer = new CanvasVideoFrameBuffer(this.targetCanvas);
  private sourceWidth: number = 0;
  private sourceHeight: number = 0;
  // The foreground color (r,g,b,a) for visualizing pixels that belong to people.
  static FOREGROUND_COLOR = { r: 0, g: 0, b: 0, a: 0 };
  // The background color (r,g,b,a) for visualizing pixels that don't belong to people.
  static BACKGROUND_COLOR = { r: 0, g: 0, b: 0, a: 255 };

  static BLUE_BACKGROUND_COLOR = { r: 0, g: 0, b: 255, a: 255 };

  private segmenter: BodySegmenter | undefined = undefined;

  private segmentationOption: SegmentationOption;

  private backgroundReplacementCanvas: HTMLCanvasElement | undefined = undefined;
  private backgroundReplacementImage: HTMLImageElement | undefined = undefined;

  private drawContour: boolean = false;
  private foregroundThreshold: number = 0.5;
  private blurAmount: number = 10;

  constructor(segmentationOption: SegmentationOption) {
    this.segmentationOption = segmentationOption;
  }


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
      this.backgroundReplacementImage =  await this.loadImage(imageURL);;
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

    const inputImageData = inputCanvas.getContext('2d').getImageData(0, 0, inputCanvas.width, inputCanvas.height);

    // @ts-ignore
    const segmentation = await this.segmenter.segmentPeople(inputCanvas);
    if (segmentation) {
      switch (this.segmentationOption) {
        case SegmentationOption.BEACH:
          await this.addBackgroundReplacement(segmentation, inputImageData, buffers);
          break;
        case SegmentationOption.BLUE:
          await this.addBlueBackground(segmentation, inputImageData, buffers);
          break;
        case SegmentationOption.BLUR:
          await this.addBlurEffect(segmentation, inputImageData, buffers);
          break;
        default:
          break;
      }
    }
    return buffers;
  }

  private async addBackgroundReplacement(segmentation: Segmentation[], inputImageData: ImageData, buffers: VideoFrameBuffer[]) {
    if (!segmentation) {
      return;
    }
    const mask = await bodySegmentation.toBinaryMask(
        segmentation, MediaPipeBodySegmentationProcessor.FOREGROUND_COLOR, MediaPipeBodySegmentationProcessor.BACKGROUND_COLOR,
        this.drawContour, this.foregroundThreshold);

    if (!mask) {
      return;
    }

    // Load and set the background image to target canvas
    if (!this.backgroundReplacementCanvas) {
      await this.loadReplacementBackground(await BackgroundImageEncoding());
    }

    this.targetCanvas.getContext('2d').drawImage(this.backgroundReplacementImage, 0, 0, this.sourceWidth, this.sourceHeight);

    // Loop through the mask and fill in person pixels from the original image
    const inputPixels = inputImageData.data;
    const targetImageData = this.targetCanvas.getContext('2d').getImageData(0, 0, this.targetCanvas.width, this.targetCanvas.height);

    for (let i = 3; i < targetImageData.data.length; i += 4) {
      if (mask.data[i] !== 255) {
        targetImageData.data[i-3] = inputPixels[i-3];
        targetImageData.data[i-2] = inputPixels[i-2];
        targetImageData.data[i-1] = inputPixels[i-1];
        targetImageData.data[i] = inputPixels[i];
      }
    }

    this.targetCanvas.getContext('2d').putImageData(targetImageData, 0, 0);

    buffers[0] = this.canvasVideoFrameBuffer;
  }

  private async addBlueBackground(segmentation: Segmentation[], inputImageData: ImageData, buffers: VideoFrameBuffer[]) {
    if (!segmentation) {
      return;
    }
    const mask = await bodySegmentation.toBinaryMask(
      segmentation, MediaPipeBodySegmentationProcessor.FOREGROUND_COLOR, MediaPipeBodySegmentationProcessor.BLUE_BACKGROUND_COLOR,
      this.drawContour, this.foregroundThreshold);

    if (!mask) {
      return;
    }

    await bodySegmentation.drawMask(this.targetCanvas, inputImageData, mask, 1);
    buffers[0] = this.canvasVideoFrameBuffer;
  }

  private async addBlurEffect(segmentation: Segmentation[], inputImageData: ImageData, buffers: VideoFrameBuffer[]) {
    if (!segmentation) {
      return;
    }
    await bodySegmentation.drawBokehEffect(this.targetCanvas, inputImageData, segmentation, this.foregroundThreshold, this.blurAmount);

    buffers[0] = this.canvasVideoFrameBuffer;
  }

  async destroy(): Promise<void> {
    if (this.segmenter) {
      this.segmenter.dispose();
    }
    this.segmenter = undefined;
  }
}
