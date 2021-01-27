// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  CanvasVideoFrameBuffer,
  VideoFrameBuffer,
  VideoFrameProcessor,
} from 'amazon-chime-sdk-js';

/**
 * [[ResizeProcessor]] updates the input {@link VideoFrameBuffer} and resize given the display aspect ratio.
 */
export default class ResizeProcessor implements VideoFrameProcessor {
  private targetCanvas: HTMLCanvasElement = document.createElement('canvas') as HTMLCanvasElement;
  private targetCanvasCtx: CanvasRenderingContext2D = this.targetCanvas.getContext(
    '2d'
  ) as CanvasRenderingContext2D;
  private canvasVideoFrameBuffer = new CanvasVideoFrameBuffer(this.targetCanvas);
  private renderWidth: number = 0;
  private renderHeight: number = 0;
  private sourceWidth: number = 0;
  private sourceHeight: number = 0;
  private dx: number = 0;

  constructor(private displayAspectRatio: number) {}

  destroy(): Promise<void> {
    this.targetCanvasCtx = null;
    this.targetCanvas = null;
    this.canvasVideoFrameBuffer.destroy();
    return;
  }

  process(buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
    // assuming one video stream
    const canvas = buffers[0].asCanvasElement();

    const frameWidth = canvas.width;
    const frameHeight = canvas.height;

    if (frameWidth === 0 || frameHeight === 0) {
      return Promise.resolve(buffers);
    }

    if (this.sourceWidth !== frameWidth || this.sourceHeight !== frameHeight) {
      this.sourceWidth = frameWidth;
      this.sourceHeight = frameHeight;
      this.renderWidth = Math.floor(this.sourceHeight * this.displayAspectRatio);
      this.renderHeight = this.sourceHeight;
      this.dx = Math.max(0, Math.floor((frameWidth - this.renderWidth) / 2));
      this.targetCanvas.width = this.renderWidth;
      this.targetCanvas.height = this.renderHeight;
    }

    this.targetCanvasCtx.drawImage(
      canvas,
      this.dx,
      0,
      this.renderWidth,
      this.renderHeight,
      0,
      0,
      this.renderWidth,
      this.renderHeight
    );

    buffers[0] = this.canvasVideoFrameBuffer;
    return Promise.resolve(buffers);
  }
}
