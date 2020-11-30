// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioNodeSubgraph from './AudioNodeSubgraph';
import Device from './Device';

/**
 * A device that applies some transform to another device, returning a device and optional
 * `AudioNode` for use by the device controller.
 *
 * The results are applied by the device controller in two stages:
 *
 * 1. The transform device is used to retrieve the constraints that identify an inner media stream.
 *    This will be managed by the controller.
 * 2. The transform device provides a Web Audio node that will be connected between the input and
 *    the output of the device controller's audio graph. This is returned as a pair, `(start, end)`,
 *    to allow an arbitrary subgraph of nodes to be returned.
 *
 * The application should call `stop` when the device will no longer be used. This method is
 * defined on this interface to establish that convention.
 */
export default interface AudioTransformDevice {
  /**
   * Called when `realtimeMuteLocalAudio` is called on the `RealtimeController`. Implement this
   * callback to avoid doing expensive processing when the audio output is disabled.
   */
  mute(muted: boolean): Promise<void>;

  /**
   * `stop` should be called by the application to free any resources associated
   * with the device (e.g., workers).
   *
   * After this is called, the device should be discarded.
   */
  stop(): Promise<void>;

  /**
   * Return the inner {@link Device} that the device controller should select as part
   * of the application of this `AudioTransformDevice`.
   */
  intrinsicDevice(): Promise<Device>;

  /**
   * Optionally return a pair of `AudioNode`s that should be connected to the applied inner
   * device. The two nodes can be the same, indicating the smallest possible subgraph.
   *
   * @param context The `AudioContext` to use when instantiating the nodes.
   */
  createAudioNode?(context: AudioContext): Promise<AudioNodeSubgraph | undefined>;
}

/**
 * `isAudioTransformDevice` is a type guard for {@link AudioTransformDevice}.
 *
 * @param device the value to check.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
export function isAudioTransformDevice(device: any): device is AudioTransformDevice {
  return (
    !!device &&
    typeof device === 'object' &&
    'mute' in device &&
    'stop' in device &&
    'intrinsicDevice' in device
  );
}
