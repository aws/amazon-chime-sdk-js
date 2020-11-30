// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/*
 * [[SignalingClientConnectionRequest]] represents an connection request.
 */
export default class SignalingClientConnectionRequest {
  /** Creates a request with the given URL, conference id, and join token.
   *
   * @param {string} signalingURL The URL of the signaling proxy.
   * @param {string} joinToken The join token that will authenticate the connection.
   */
  constructor(public signalingURL: string, public joinToken: string) {}

  /** Gets the signaling URL representing this request.*/
  url(): string {
    return (
      this.signalingURL + '?X-Chime-Control-Protocol-Version=3&X-Amzn-Chime-Send-Close-On-Error=1'
    );
  }

  /** Gets the protocols associated with this request.*/
  protocols(): string[] {
    return ['_aws_wt_session', this.joinToken];
  }
}
