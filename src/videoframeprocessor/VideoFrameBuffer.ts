// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[VideoFrameBuffer]] is an interface that can be used as input or output with {@link VideoFrameProcessor}.
 * It must implement the method to return buffer as `CanvasImageSource` but the internal handle to the video frame buffer can be flexible.
 */
export default interface VideoFrameBuffer {
  /**
   * The frame rate of the source in the [[VideoFrameBuffer]].
   */
  framerate: number;

  /**
   *  The width in pixels of the source in the [[VideoFrameBuffer]].
   */
  width: number;

  /**
   * The height in pixels of the source in the [[VideoFrameBuffer]].
   */
  height: number;

  /**
   * Explicitly destroys the source and intermediate buffers in [[VideoFrameBuffer]].
   * After `destroy` is called, this [[VideoFrameBuffer]] must be discarded.
   * `destroy` is typically required to be called, when `MediaStream`, `HTMLVideoElement` and `ImageData` are passed in as initialization data.
   */
  destroy(): void;

  /**
   * Returns the buffer as `CanvasImageSource` which can be drawn on HTMLCanvasElement directly.
   * If `destroy` is already called, `asCanvasImageSource` should reject.
   */
  asCanvasImageSource(): Promise<CanvasImageSource>;

  /**
   * Returns `HTMLCanvasElement` or `OffscreenCanvas` if the internal source can be transformed into one. Optional method.
   * Returns `null` if the buffer is destroyed.
   */
  asCanvasElement?(): HTMLCanvasElement | OffscreenCanvas | null;

  /**
   * Returns [[Transferable]] if the internal source can be transformed into one. Optional method.
   * If `destroy` is already called, `asTransferable` should reject.
   */
  asTransferable?(): Promise<Transferable>;
}
