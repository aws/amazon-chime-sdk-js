// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { VideoFrameBuffer, VideoFrameProcessor } from 'amazon-chime-sdk-js';
import jsQR from 'jsqr';

/**
 * [[CircularCut]] is an implementation of {@link VideoFrameProcessor} for demonstration purpose.
 * It updates the first {@link VideoFrameBuffer} from the input array and clip the whole frame to a circle.
 */
export default class CircularCut implements VideoFrameProcessor {
  // private idSet;
  /**
   * Construct a circular cut processor
   */
  constructor() {
    // this.idSet = false;
  }

  destroy(): Promise<void> {
    return;
  }

  process(buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
    // assuming one video stream
    const canvas = buffers[0].asCanvasElement();
    const canvasCtx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;

    const frameWidth = canvas.width;
    const frameHeight = canvas.height;

    if (frameWidth === 0 || frameHeight === 0) {
      return Promise.resolve(buffers);
    }

    // read QR Code for this VideoFrameBuffer
    const imageData = canvasCtx.getImageData(0, 0, canvas.width, canvas.height).data;

    // If we've already found a QR code, then we don't need to decode anymore
    // This is a performance enhancement, because otherwise, we'd have to decode every single videoframebuffer and that adds significant latency
    // If the video processor is notified that the URL changed, or there was cross document change
    // then we reset this idSet Value and try to detect and decode a QR code on the new document
    // if (!this.idSet) {
    const code = jsQR(imageData, frameWidth, frameHeight, {
      inversionAttempts: 'dontInvert',
    });

    if (code) {
      // Get the data from the QR Code
      // If the URL is allowlisted, then do nothing.
      // If the URL is not allowlisted, apply a Black filter on top of the video stream (but don't end screenshare)
      console.log('Found QR code', code);
      // this.idSet = true;
    }
    // }

    return Promise.resolve(buffers);
  }
}
