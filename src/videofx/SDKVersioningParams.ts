// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[SDKVersioningParams]] Is an interface for the specifications
 * that define the current version of the SDK.
 */
export interface SDKVersioningParams {
  assetGroup: string;
  revisionID: string;
  // SDK Version
  sdk: string;
  // Browser setting (for example, chrome-110)
  ua: string;
}
