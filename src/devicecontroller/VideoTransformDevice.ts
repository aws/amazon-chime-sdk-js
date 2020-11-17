// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Device from './Device';

/**
 * A device that applies processing to another device.
 */
export default interface VideoTransformDevice {
  /**
   * `stop` should be called  to free any resources associated with the device.
   * It must be called if `transformStream` is ever called.
   */
  stop(): Promise<void>;

  /**
   * Returns the inner {@link Device} that the device controller should select as active video device.
   */
  intrinsicDevice(): Promise<Device>;

  /**
   * Starts processing the input `MediaStream` and returns the output `MediaStream`.
   */
  transformStream(mediaStream?: MediaStream): Promise<MediaStream>;

  /**
   * `onOutputStreamDisconnect` is called when device controller disconnects the transformed video stream.
   */
  onOutputStreamDisconnect(): void;

  /**
   * `outputMediaStream` is generated after processors are applied. It will be auto-released after `stop` is called.
   */
  readonly outputMediaStream: MediaStream;
}

/**
 * `isVideoTransformDevice` is a type guard for {@link VideoTransformDevice}.
 *
 * @param device the value to check.
 */
export function isVideoTransformDevice(device: unknown): device is VideoTransformDevice {
  return (
    !!device &&
    typeof device === 'object' &&
    'transformStream' in device &&
    'stop' in device &&
    'intrinsicDevice' in device
  );
}
