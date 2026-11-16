// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Opens the camera and microphone and lists devices for `DefaultDeviceController`.
 * [[DefaultMediaDevices]] uses `navigator.mediaDevices`.
 */
export default interface MediaDevices {
  getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream>;

  enumerateDevices(): Promise<MediaDeviceInfo[]>;
}
