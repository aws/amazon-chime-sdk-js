// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[SignalingClientSubscribe]] contains settings for the Subscribe SignalFrame.
 */
export default class SignalingClientSubscribe {
  /** Initializes a SignalingClientSubscribe with the given properties.
   *
   * @param{string} attendeeId Attendee ID of the client
   * @param{string} sdpOffer SDP offer created by WebRTC
   * @param{string} audioHost host
   * @param{boolean} audioMuted Whether audio from client is muted
   * @param{boolean} audioCheckin Whether audio is in checked-in state
   * @param{Array<number>} receiveStreamIds Which video streams to receive
   * @param{boolean} localVideoEnabled Whether to send a video stream for the local camera
   * @param{number} videoInputFrameRate Video input capture framerate; zero for no video
   * @param{number} videoInputMaxBitrateKbps Video input max bitrate; zero for no video
   * @param{boolean} connectionTypeHasVideo Whether connection type has video
   */
  constructor(
    public attendeeId: string,
    public sdpOffer: string,
    public audioHost: string,
    public audioMuted: boolean,
    public audioCheckin: boolean,
    public receiveStreamIds: number[],
    public localVideoEnabled: boolean,
    public videoInputFrameRate: number,
    public videoInputMaxBitrateKbps: number,
    public connectionTypeHasVideo: boolean
  ) {}
}
