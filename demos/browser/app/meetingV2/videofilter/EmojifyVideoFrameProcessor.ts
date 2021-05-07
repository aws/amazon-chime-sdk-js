// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { VideoFrameBuffer, VideoFrameProcessor } from 'amazon-chime-sdk-js';

/**
 * [[EmojifyVideoFrameProcessor]] is an implementation of {@link VideoFrameProcessor}.
 * It draws an emoji to all the input buffers.
 */
export default class EmojifyVideoFrameProcessor implements VideoFrameProcessor {
  private x: number = Math.floor(Math.random());
  private y: number = 0;
  constructor(private emoji: string) {}

  destroy(): Promise<void> {
    return;
  }

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
        this.x = Math.min(Math.floor(Math.random() * canvas.width), canvas.width);
      } else if (this.y > canvas.height) {
        this.x = Math.min(Math.floor(Math.random() * canvas.width), canvas.width);
        this.y = 0;
      }
      this.y += 5;
      ctx.font = '50px serif';
      ctx.fillStyle = 'rgba(0, 0, 255, 0.8)';
      ctx.fillText(this.emoji, this.x, this.y);
    }

    return Promise.resolve(buffers);
  }
}
