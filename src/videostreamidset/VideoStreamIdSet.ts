// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[VideoStreamIdSet]] holds the set of video streams by stream id.
 */
export default interface VideoStreamIdSet {
  /**
   * Adds stream id to the set
   */
  add(streamId: number): void;

  /**
   * Returns the sorted array representation of [[VideoStreamIdSet]]
   */
  array(): number[];

  /**
   * Checks whether the current set contains a stream id
   */
  contain(streamId: number): boolean;

  /**
   * Checks whether the current set is empty
   */
  empty(): boolean;

  /**
   * Returns the size of the current set
   */
  size(): number;

  /**
   * Checks whether two sets are equivalent
   */
  equal(other: VideoStreamIdSet): boolean;

  /**
   * Returns a copy of the current set
   */
  clone(): VideoStreamIdSet;

  /**
   * Removes a stream id
   */
  remove(streamId: number): void;

  /**
   * Converts [[VideoStreamIdSet]] to JSON format
   */
  toJSON(): number[];
}
