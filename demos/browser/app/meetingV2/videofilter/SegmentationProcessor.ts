// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line
declare var bodyPix: any;

import { CanvasVideoFrameBuffer, VideoFrameBuffer, VideoFrameProcessor } from 'amazon-chime-sdk-js';

export default class SegmentationProcessor implements VideoFrameProcessor {
  private targetCanvas: HTMLCanvasElement = document.createElement('canvas') as HTMLCanvasElement;
  private canvasVideoFrameBuffer = new CanvasVideoFrameBuffer(this.targetCanvas);
  private sourceWidth: number = 0;
  private sourceHeight: number = 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mask: any | undefined = undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private model: any | undefined = undefined;

  constructor() {}

  async process(buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
    if (!this.model) {
      this.model = await bodyPix.load();
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let predictions = await this.model.segmentPerson(inputCanvas);
    if (predictions) {
      const foregroundColor = { r: 255, g: 255, b: 255, a: 255 };
      const backgroundColor = { r: 0, g: 0, b: 0, a: 255 };
      this.mask = bodyPix.toMask(predictions, foregroundColor, backgroundColor, true);
    }

    if (this.mask) {
      bodyPix.drawMask(this.targetCanvas, inputCanvas as HTMLCanvasElement, this.mask);
      buffers[0] = this.canvasVideoFrameBuffer;
    }
    predictions = undefined;
    return buffers;
  }

  async destroy(): Promise<void> {
    if (this.model) {
      this.model.dispose();
    }
    this.model = undefined;
  }
}
