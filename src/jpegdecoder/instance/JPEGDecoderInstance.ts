// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * An instance of the JPEG decoder managed by its parent controller.
 */
export default interface JPEGDecoderInstance {
  /**
   * Decodes the input byte array of JPEG data into an ImageData which can then
   * be used to draw directly to a canvas.
   */
  decodeToImageData(inputArray: Uint8Array): ImageData;

  /**
   * Frees WebAssembly memory for this instance. Call this before freeing
   * the controller that created this instance. The instance cannot be used
   * after calling [[free]].
   */
  free(): void;
}
