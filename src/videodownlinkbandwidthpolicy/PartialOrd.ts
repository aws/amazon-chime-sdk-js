// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/** @internal */
export default interface PartialOrd {
  partialCompare(other: this): number;
}
