// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import JPEGDecoderInstance from '../instance/JPEGDecoderInstance';

/**
 * JPEGDecoderController is the main interface to the WebAssembly module.
 * Create a JPEGDecoderInstance from the the controller and use it to decode
 * a byte array of JPEG data into ImageData that can be used to draw directly
 * to canvas.
 */
export default interface JPEGDecoderController {
  /**
   * Creates a JPEG decoder instance with the given width and height.
   */
  createInstance(width: number, height: number): JPEGDecoderInstance;

  /**
   * Frees WebAssembly memory for this controller. Call this after freeing
   * any instances that were created from this controller. The controller
   * cannot be used after calling [[free]].
   */
  free(): void;
}
