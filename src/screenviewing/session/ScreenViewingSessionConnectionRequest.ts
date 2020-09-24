// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[ScreenViewingSessionConnectionRequest]] represents an connection request.
 */
export default class ScreenViewingSessionConnectionRequest {
  constructor(
    private screenViewingURLWithOptionalSessionToken: string,
    public readonly screenDataURL: string,
    public readonly sessionToken: string,
    public readonly timeoutMs: number
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
