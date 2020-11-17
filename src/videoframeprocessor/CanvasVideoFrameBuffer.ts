// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoFrameBuffer from './VideoFrameBuffer';

/**
 * [[CanvasVideoFrameBuffer]] implements [[VideoFrameBuffer]]. It internally holds an `HTMLCanvasElement`.
 */
export default class CanvasVideoFrameBuffer implements VideoFrameBuffer {
  private destroyed: boolean = false;
  framerate: number;
  width: number;
  height: number;

  constructor(private canvas: HTMLCanvasElement) {}

  destroy(): void {
    this.canvas = null;
    this.destroyed = true;
  }

  asCanvasImageSource(): Promise<CanvasImageSource> {
    if (this.destroyed) {
      throw Error('canvas buffer is destroyed');
    }
    return Promise.resolve(this.canvas);
  }

  asCanvasElement(): HTMLCanvasElement | null {
    return this.canvas;
  }
}
