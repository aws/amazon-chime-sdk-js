// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[MLVideoFxConfig]] describes the configuration of desired video effects that should be
 * applied onto a [[MLVideoFxTransformDevice]] via a [[MLVideoFxEffectEngine]]
 */
export default interface MLVideoFxConfig {
  /** Dummy effect for time being -- but will shift video for blur emphasis. */
  // TODO(hunnorth): This is a developmental feature and will be moved before merging into prod
  blueShiftEnabled: boolean;
  /** Dummy effect for time being -- but will shift video for red emphasis. */
  // TODO(hunnorth): This is a developmental feature and will be moved before merging into prod
  redShiftEnabled: boolean;
}
