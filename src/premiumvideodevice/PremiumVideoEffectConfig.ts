// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[PremiumVideoEffectConfig]] describes the configuration of desired video effects that should be
 * applied onto a [[PremiumVideoTransformDevice]] via a [[PremiumVideoEffectEngine]]
 */
export default interface PremiumVideoEffectConfig {
    /** Dummy effect for time being -- but will shift video for blur emphasis. */
    blueShiftEnabled: boolean;
    /** Dummy effect for time being -- but will shift video for red emphasis. */
    redShiftEnabled: boolean;
}