// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[VideoElementObjectFit]] is the computed CSS `object-fit` of a video element, as reported in the
 * `VIDEO_RENDER_OBJECT_FIT` client metric.
 */
export enum VideoElementObjectFit {
  Fill = 0,
  Contain = 1,
  Cover = 2,
  None = 3,
  ScaleDown = 4,
}

export default VideoElementObjectFit;
