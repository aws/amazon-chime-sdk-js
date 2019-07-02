// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[ScreenViewingSessionConnectionRequest]] represents an connection request.
 */
export default class ScreenViewingSessionConnectionRequest {
  constructor(
    private screenViewingURLWithOptionalSessionToken: string,
    readonly screenDataURL: string,
    readonly sessionToken: string,
    readonly timeoutMs: number
  ) {}

  get screenViewingURL(): string {
    if (this.screenViewingURLWithOptionalSessionToken.includes('&session_token=')) {
      return this.screenViewingURLWithOptionalSessionToken;
    } else {
      return `${this.screenViewingURLWithOptionalSessionToken}&session_token=${this.sessionToken}`;
    }
  }

  protocols(): string[] {
    return [];
  }
}
