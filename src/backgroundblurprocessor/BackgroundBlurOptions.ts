// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import BackgroundFilterOptions from '../backgroundfilter/BackgroundFilterOptions';

/**
 * A set of options that can be supplied when creating a background blur video frame processor.
 */
export default interface BackgroundBlurOptions extends BackgroundFilterOptions {
  /** The amount of blur that will be applied to a video stream. */
  blurStrength?: number;
}
