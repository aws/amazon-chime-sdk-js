// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { VideoFrameBuffer, VideoFrameProcessor } from '../../../../../src/index';

/**
 * [[EmojifyVideoFrameProcessor]] is an implementation of {@link VideoFrameProcessor}.
 * It draws an emoji to all the input buffers.
 */
export default class EmojifyVideoFrameProcessor implements VideoFrameProcessor {
  private x: number = Math.floor(Math.random());
  private y: number = 0;

  constructor(private emoji: string) {}

  process(buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
    for (const buffer of buffers) {
      if (!buffer) {
        continue;
      }

      // drawing on the buffer directly
      const canvas = buffer.asCanvasElement();
      if (!canvas) {
        continue;
      }

      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
      if (this.x > canvas.width) {
        this.x = Math.floor(Math.random() * canvas.width);
      } else if (this.y > canvas.height) {
        this.x = Math.floor(Math.random() * canvas.width);
        this.y = 0;
      }
      this.y += 5;

      ctx.font = '50px serif';
      ctx.fillText(this.emoji, this.x, this.y);
    }

    return Promise.resolve(buffers);
  }
}
