// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[DeviceChangeObserver]] can be registered with a [[DeviceController]] to receive callbacks on device change events.
 */
export default interface DeviceChangeObserver {
  /**
   * Called when audio inputs are changed.
   */
  audioInputsChanged?(freshAudioInputDeviceList?: MediaDeviceInfo[]): void;

  /**
   * Called when audio outputs are changed.
   */
  audioOutputsChanged?(freshAudioOutputDeviceList?: MediaDeviceInfo[]): void;

  /**
   * Called when video inputs are changed.
   */
  videoInputsChanged?(freshVideoInputDeviceList?: MediaDeviceInfo[]): void;

  /**
   * Called when the current audio input media stream ended event triggers.
   */
  audioInputStreamEnded?(deviceId?: string): void;

  /**
   * Called when the current video input media stream ended event triggers.
   */
  videoInputStreamEnded?(deviceId?: string): void;
}
