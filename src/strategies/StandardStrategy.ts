// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import MediaStrategy from './MediaStrategy';

/** Default strategy: calls the browser directly. */
export default class StandardStrategy implements MediaStrategy {
  createPeerConnection(configuration: RTCConfiguration): RTCPeerConnection {
    // @ts-ignore
    return new RTCPeerConnection(configuration);
  }

  getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  enumerateDevices(): Promise<MediaDeviceInfo[]> {
    return navigator.mediaDevices.enumerateDevices();
  }
}
