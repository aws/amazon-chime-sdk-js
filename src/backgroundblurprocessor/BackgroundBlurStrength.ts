// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The numbers below indicate the amount of blur to apply. Larger numbers will produce
 * more blur.
 */
const BlurStrength = {
  LOW: 7,
  MEDIUM: 15,
  HIGH: 30,
};

/** @internal */
export class BlurStrengthMapper {
  private static readonly BLUR_STRENGTH_DIVISOR = 540; // use 540P as baseline blur strength
  static getBlurAmount(bstrength: number, options: { height: number }): number {
    if (bstrength <= 0) {
      throw new Error(`invalid value for blur strength: ${bstrength}`);
    }
    return Math.round((bstrength * options.height) / this.BLUR_STRENGTH_DIVISOR);
  }
}

export default BlurStrength;
