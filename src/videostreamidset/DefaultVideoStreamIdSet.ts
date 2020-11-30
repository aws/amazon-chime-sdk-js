// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoStreamIdSet from './VideoStreamIdSet';

/**
 * [[DefaultVideoStreamIdSet]] implements [[VideoStreamIdSet]].
 */
export default class DefaultVideoStreamIdSet implements VideoStreamIdSet {
  private ids: Set<number>;

  constructor(ids?: number[]) {
    this.ids = new Set<number>(ids);
  }

  add(streamId: number): void {
    this.ids.add(streamId);
  }

  array(): number[] {
    const values = Array.from(this.ids.values());
    return values.sort((a, b) => a - b);
  }

  contain(streamId: number): boolean {
    return this.ids.has(streamId);
  }

  empty(): boolean {
    return this.ids.size === 0;
  }

  size(): number {
    return this.ids.size;
  }

  equal(other: DefaultVideoStreamIdSet): boolean {
    if (!other) {
      return this.ids.size === 0;
    }
    const x: number[] = this.array();
    const y: number[] = other.array();
    if (x.length !== y.length) {
      return false;
    }
    for (let i = 0; i < x.length; i++) {
      if (x[i] !== y[i]) {
        return false;
      }
    }
    return true;
  }

  clone(): DefaultVideoStreamIdSet {
    return new DefaultVideoStreamIdSet(this.array());
  }

  remove(streamId: number): void {
    this.ids.delete(streamId);
  }

  toJSON(): number[] {
    return this.array();
  }
}
