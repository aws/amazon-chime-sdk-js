// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/*
 * [[SignalingClientConnectionRequest]] represents an connection request.
 */
export default class SignalingClientConnectionRequest {
  /** Creates a request with the given URL, conference id, and session token.
   *
   * @param {string} signalingURL The URL of the signaling proxy.
   * @param {string} sessionToken The session token that will auth the connection.
   */
  constructor(public signalingURL: string, public sessionToken: string) {}

  /** Gets the signaling URL representing this request.*/
  url(): string {
    return this.signalingURL + '?X-Chime-Control-Protocol-Version=3';
  }

  /** Gets the protocols associated with this request.*/
  protocols(): string[] {
    return ['_aws_wt_session', this.sessionToken];
  }
}
