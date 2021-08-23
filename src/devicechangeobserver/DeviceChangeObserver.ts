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
   * Called when the selected input device is indicated by the browser to be muted or unmuted
   * at the operating system or hardware level, and thus the SDK will be unable to send audio
   * regardless of the application's own mute state.
   *
   * This method will always be called after a device is selected or when the mute state changes
   * after selection.
   *
   * If the selected input device is a `MediaStream`, it will be passed here as
   * the value of `device`. Otherwise, the selected device ID will be provided.
   *
   * @param deviceId the currently selected audio input device.
   * @param muteState whether the input device is known to be muted.
   */
  audioInputMuteStateChanged?(device: string | MediaStream, muteState: boolean): void;

  /**
   * Called when the current audio input media stream ended event triggers.
   */
  audioInputStreamEnded?(deviceId?: string): void;

  /**
   * Called when the current video input media stream ended event triggers.
   */
  videoInputStreamEnded?(deviceId?: string): void;
}
