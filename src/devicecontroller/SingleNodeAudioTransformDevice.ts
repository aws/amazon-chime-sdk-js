// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioNodeSubgraph from './AudioNodeSubgraph';
import Device from './Device';

/**
 * This class simplifies the process of defining a transform device that
 * does not modify its input device constraints, and provides only a single audio node
 * to apply transforms.
 *
 * Subclass `SingleNodeAudioTransformDevice`, implementing `createSingleAudioNode`.
 */
export default abstract class SingleNodeAudioTransformDevice<T extends AudioNode> {
  protected node: T | undefined;

  constructor(protected inner: Device) {}

  async mute(_muted: boolean): Promise<void> {}

  /**
   * `stop` should be called by the application to free any resources associated
   * with the device (e.g., workers).
   *
   * After this is called, the device should be discarded.
   */
  async stop(): Promise<void> {
    this.node?.disconnect();
  }

  /**
   * Return the inner {@link Device} that the device controller should select as part
   * of the application of this `AudioTransformDevice`.
   */
  async intrinsicDevice(): Promise<Device> {
    return this.inner;
  }

  /**
   * Optionally return a pair of `AudioNode`s that should be connected to the applied inner
   * device. The two nodes can be the same, indicating the smallest possible subgraph.
   *
   * @param context The `AudioContext` to use when instantiating the nodes.
   */
  async createAudioNode(context: AudioContext): Promise<AudioNodeSubgraph | undefined> {
    this.node?.disconnect();
    this.node = await this.createSingleAudioNode(context);
    return {
      start: this.node,
      end: this.node,
    };
  }

  // Implement this.
  abstract createSingleAudioNode(context: AudioContext): Promise<T>;
}
