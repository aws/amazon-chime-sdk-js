// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { SdkStreamDescriptor, SdkStreamMediaType } from '../signalingprotocol/SignalingProtocol.js';

export default class VideoStreamDescription {
  attendeeId: string = '';
  groupId: number = 0;
  streamId: number = 0;
  ssrc: number = 0;
  trackLabel: string = '';
  maxBitrateKbps: number = 0;
  // average bitrate is updated every 2 seconds via bitrates messages
  avgBitrateKbps: number = 0;
  maxFrameRate: number = 0;
  timeEnabled: number = 0;
  disabledByWebRTC: boolean = false;
  disabledByUplinkPolicy: boolean = false;

  constructor(
    attendeeId?: string,
    groupId?: number,
    streamId?: number,
    maxBitrateKbps?: number,
    avgBitrateKbps?: number
  ) {
    this.attendeeId = attendeeId;
    this.groupId = groupId;
    this.streamId = streamId;
    this.maxBitrateKbps = maxBitrateKbps;
    this.avgBitrateKbps = avgBitrateKbps;
  }

  clone(): VideoStreamDescription {
    const newInfo = new VideoStreamDescription();
    newInfo.attendeeId = this.attendeeId;
    newInfo.groupId = this.groupId;
    newInfo.streamId = this.streamId;
    newInfo.ssrc = this.ssrc;
    newInfo.trackLabel = this.trackLabel;
    newInfo.maxBitrateKbps = this.maxBitrateKbps;
    newInfo.avgBitrateKbps = this.avgBitrateKbps;
    newInfo.maxFrameRate = this.maxFrameRate;
    newInfo.timeEnabled = this.timeEnabled;
    newInfo.disabledByWebRTC = this.disabledByWebRTC;
    newInfo.disabledByUplinkPolicy = this.disabledByUplinkPolicy;
    return newInfo;
  }

  toStreamDescriptor(): SdkStreamDescriptor {
    const descriptor = SdkStreamDescriptor.create();
    descriptor.mediaType = SdkStreamMediaType.VIDEO;

    descriptor.trackLabel = this.trackLabel;
    descriptor.attendeeId = this.attendeeId;
    descriptor.streamId = this.streamId;
    descriptor.groupId = this.groupId;
    descriptor.framerate = this.maxFrameRate;
    descriptor.maxBitrateKbps =
      this.disabledByUplinkPolicy || this.disabledByWebRTC ? 0 : this.maxBitrateKbps;
    descriptor.avgBitrateBps = this.avgBitrateKbps;
    return descriptor;
  }
}
