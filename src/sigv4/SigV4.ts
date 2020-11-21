// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[SigV4]] is a helper interface for sigv4 signing.
 */
export default interface SigV4 {
  /**
   * Sign a URL
   */
  signURL(
    method: string,
    scheme: string,
    serviceName: string,
    hostname: string,
    path: string,
    payload: string,
    queryParams: Map<string, string[]> | null
  ): string;
}
