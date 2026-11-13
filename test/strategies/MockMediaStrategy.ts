// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import MediaStrategy from '../../src/strategies/MediaStrategy';

/** Counts the calls the SDK makes, so a test can assert it went through the strategy. */
export default class MockMediaStrategy implements MediaStrategy {
  createPeerConnectionCalls = 0;
  getUserMediaCalls: MediaStreamConstraints[] = [];
  enumerateDevicesCalls = 0;

  constructor(private devices: MediaDeviceInfo[] = []) {}

  createPeerConnection(configuration: RTCConfiguration): RTCPeerConnection {
    this.createPeerConnectionCalls += 1;
    return new RTCPeerConnection(configuration);
  }

  async getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
    this.getUserMediaCalls.push(constraints);
    const stream = new MediaStream();
    stream.addTrack(new MediaStreamTrack());
    return stream;
  }

  async enumerateDevices(): Promise<MediaDeviceInfo[]> {
    this.enumerateDevicesCalls += 1;
    return this.devices;
  }
}
