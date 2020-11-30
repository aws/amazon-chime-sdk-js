// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[VideoElementFactory]] provides an interface for creating a video element.
 */
export default interface VideoElementFactory {
  /**
   * Creates a video element.
   */
  create(): HTMLVideoElement;
}
