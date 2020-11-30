// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[SignalingClientJoin]] contains settings for the Join SignalFrame.
 */
export default class SignalingClientJoin {
  /** Initializes a SignalingClientJoin with the given properties.
   *
   * @param {number} maxVideos The maximum number of video tiles to send.
   * @param {boolean} sendBitrates Whether the server should send Bitrates messages.
   */
  constructor(public maxVideos: number, public sendBitrates: boolean) {}
}
