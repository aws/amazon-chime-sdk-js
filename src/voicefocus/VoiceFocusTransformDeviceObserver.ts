// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VoiceFocusTransformDevice from './VoiceFocusTransformDevice';

/**
 * A device observer that is notified of lifecycle events on an Amazon Voice Focus device.
 *
 * Use {@link VoiceFocusTransformDevice.addObserver|addObserver} to register an
 * observer with a device.
 */
export default interface VoiceFocusTransformDeviceObserver {
  /**
   * Called if application of Amazon Voice Focus to an inner device failed, and
   * the {@link VoiceFocusTransformDevice|VoiceFocusTransformDevice} fell
   * back to using the inner device directly.
   *
   * @param device The device signaling the event.
   * @param e The error that triggered the fallback.
   */
  voiceFocusFellBackToInnerStream?: (device: VoiceFocusTransformDevice, e: Error) => void;

  /**
   * Called if noise suppression is unable to keep up with the audio stream. This
   * can occur if:
   *
   * * You specified a model variant that is too complex for the compute environment.
   * * The user is performing other actions on the device that are taking significant
   *   CPU.
   * * You allowed estimation-based selection of model variant, and the environment
   *   at the time was less constrained than the normal runtime environment.
   *
   * This method will be called after approximately 15ms of audio has been
   * interrupted, and will be periodically called thereafter.
   *
   * This method indicates that the user will be experiencing audio glitching, and
   * your application should take action. This might include:
   *
   * * Disabling Amazon Voice Focus.
   * * Disabling other features, e.g., limiting the number of video tiles.
   * * Notifying the user.
   */
  voiceFocusInsufficientResources?: () => void;
}
