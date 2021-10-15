// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * An interface to define the shape of an ML model. This can be used to define the input and
 * output shape of an ML model.
 */
export default interface ModelShape {
  height: number;
  width: number;
  range: number[];
  channels: number;
}
