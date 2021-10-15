// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';

/**
 * A set of options that can be supplied when creating a background blur video frame processor.
 */
export default interface BackgroundBlurOptions {
  /** A {@link Logger|Logger} to which log output will be written. */
  logger?: Logger;
  /** The amount of blur that will be applied to a video stream */
  blurStrength?: number;
  /** How often the video frame processor will report observed events*/
  reportingPeriodMillis?: number;
}
