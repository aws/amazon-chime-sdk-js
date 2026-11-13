// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The browser media primitives the SDK calls. [[StandardStrategy]] calls the
 * browser directly and is the default. See the Media Strategies guide.
 */
export default interface MediaStrategy {
  createPeerConnection(configuration: RTCConfiguration): RTCPeerConnection;

  getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream>;

  enumerateDevices(): Promise<MediaDeviceInfo[]>;
}
