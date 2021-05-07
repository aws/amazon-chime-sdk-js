// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default interface Eq {
  /**
   * Return true if the other value is exactly equal to this value.
   *
   * @param other the value against which to compare.
   */
  equals(other: this): boolean;
}
