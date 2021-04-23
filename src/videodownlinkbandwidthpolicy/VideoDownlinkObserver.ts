// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default interface VideoDownlinkObserver {
  /**
   * Called when the downlink policy wants to pause the remote video tile
   */
  tileWillBePausedByDownlinkPolicy(tileId: number): void;

  /**
   * Called when the downlink policy wants to unpause the remote video tile
   */
  tileWillBeUnpausedByDownlinkPolicy(tileId: number): void;
}
