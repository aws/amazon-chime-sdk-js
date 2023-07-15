// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoFxConfig from './VideoFxConfig';

/**
 * [[VideoFxRenderer]] An interface for an object that manages Web-GL shaders in order
 * to apply a user-configured set of effects onto a video stream
 */
export interface VideoFxRenderer {
  /**
   * Configure the web-gl shaders
   * @param width Input/output stream dimension width
   * @param height Input/output stream dimension height
   * @param effectConfig Specification for effects that shaders must emulate
   */
  configure(width: number, height: number, effectConfig: VideoFxConfig): Promise<void>;

  /**
   * Process an input canvas and segmentation mask onto a transformed output canvas
   * @param inputCanvas The input video stream
   * @param segmentationMask The raw data result from the segmentation maks
   */
  render(inputCanvas: HTMLCanvasElement, segmentationMask: ImageData): Promise<void>;

  /**
   * Set the image to be inserted into the background of a video stream when background
   * replacement is enabled
   * @param backgroundReplacementCanvas the canvas holding the new image for background replacement
   */
  setBackgroundReplacementCanvas(backgroundReplacementCanvas: HTMLCanvasElement): Promise<void>;
}
