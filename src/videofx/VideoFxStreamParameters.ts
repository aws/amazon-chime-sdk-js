// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[VideoFxStreamParameters]] describes the configuration of the current
 * video stream passing through the [[VideoFxProcessor]]
 */
export interface VideoFxStreamParameters {
  framerate: number;
  width: number;
  height: number;
  channels: number;
}
