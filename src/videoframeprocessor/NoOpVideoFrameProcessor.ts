// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoFrameBuffer from './VideoFrameBuffer';
import VideoFrameProcessor from './VideoFrameProcessor';

/**
 * [[NoOpVideoFrameProcessor]] implements [[VideoFrameProcessor]].
 * It's a no-op processor and input is passed to output directly.
 */
export default class NoOpVideoFrameProcessor implements VideoFrameProcessor {
  async process(buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
    return buffers;
  }

  async destroy(): Promise<void> {
    return;
  }
}
