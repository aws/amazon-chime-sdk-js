// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import SignalingClientVideoSubscriptionConfiguration from '../signalingclient/SignalingClientVideoSubscriptionConfiguration';
import type { Eq, PartialOrd } from '../utils/Types';
import VideoPreference from './VideoPreference';

export function convertVideoPreferencesToSignalingClientVideoSubscriptionConfiguration(
  context: AudioVideoControllerState,
  receiveGroupIds: number[],
  preferences: VideoPreferences
): SignalingClientVideoSubscriptionConfiguration[] {
  if (
    context.transceiverController.getMidForGroupId === undefined ||
    context.videoStreamIndex.attendeeIdForGroupId === undefined ||
    preferences === undefined
  ) {
    return [];
  }

  const configurations = new Array<SignalingClientVideoSubscriptionConfiguration>();
  const attendeeIdToMid = new Map<string, string>();
  const attendeeIdToGroupId = new Map<string, number>();
  for (const groupId of receiveGroupIds) {
    // The local description will have been set by the time this task is running, so all
    // of the transceivers should have `mid` set by now (see comment above `getMidForStreamId`)
    const mid = context.transceiverController.getMidForGroupId(groupId);
    if (mid === undefined) {
      continue;
    }
    const attendeeId = context.videoStreamIndex.attendeeIdForGroupId(groupId);
    attendeeIdToMid.set(attendeeId, mid);
    attendeeIdToGroupId.set(attendeeId, groupId);
  }
  for (const preference of preferences) {
    const configuration = new SignalingClientVideoSubscriptionConfiguration();
    const mid = attendeeIdToMid.get(preference.attendeeId);
    if (mid === undefined) {
      continue;
    }
    configuration.mid = mid;
    configuration.attendeeId = preference.attendeeId;
    configuration.groupId = attendeeIdToGroupId.get(preference.attendeeId);
    // The signaling protocol expects 'higher' values for 'higher' priorities
    configuration.priority = Number.MAX_SAFE_INTEGER - preference.priority;
    configuration.targetBitrateKbps = preference.targetSizeToBitrateKbps(preference.targetSize);
    configuration.qualityAdaptationPreference = preference.degradationPreference;
    configurations.push(configuration);
  }
  return configurations;
}
class ObjectSet<T extends Eq & PartialOrd> implements Iterable<T> {
  constructor(private items: T[] = []) {}

  static default(): ObjectSet<VideoPreference> {
    return new ObjectSet([]);
  }

  // Returns the items in sorted order.
  [Symbol.iterator](): Iterator<T, T, undefined> {
    let i = 0;
    const items = this.items;
    return {
      next(): IteratorResult<T> {
        if (i < items.length) {
          return {
            done: false,
            value: items[i++],
          };
        }
        return {
          done: true,
          value: null,
        };
      },
    };
  }

  first(): T | undefined {
    return this.items[0];
  }

  add(item: T): void {
    // If this is used elsewhere, there needs to be a duplicate check here
    this.items.push(item);
  }

  replaceFirst(newItem: T, f: (item: T) => boolean): void {
    const pos = this.items.findIndex(f);
    if (pos === -1) {
      // If this is used elsewhere, there needs to be a duplicate check here
      this.items.push(newItem);
    } else if (!this.has(newItem)) {
      this.items[pos] = newItem;
    } else {
      this.items.splice(pos, 1);
    }
  }

  remove(item: T): void {
    this.items = this.items.filter(a => !a.equals(item));
  }

  clear(): void {
    this.items = [];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  equals(other: this): boolean {
    if (other === this) {
      return true;
    }

    if (other.items.length !== this.items.length) {
      return false;
    }

    // TODO: if we keep the arrays sorted correctly, not just by priority, then
    // we don't need to do this painstaking O(n^2) work.
    for (const item of this.items) {
      if (!other.items.some(a => a.equals(item))) {
        return false;
      }
    }
    return true;
  }

  has(item: T): boolean {
    return this.items.some(a => a.equals(item));
  }

  some(f: (item: T) => boolean): boolean {
    return this.items.some(f);
  }

  clone(): ObjectSet<T> {
    return new ObjectSet([...this.items]);
  }

  sort(): void {
    this.items.sort((a, b) => a.partialCompare(b));
  }

  modify(): SetBuilder<T> {
    // COW.
    return new SetBuilder(this);
  }
}

class SetBuilder<T extends Eq & PartialOrd> {
  private copied = false;

  constructor(private items: ObjectSet<T> = new ObjectSet()) {}

  private cow(): void {
    if (this.copied) {
      return;
    }
    this.items = this.items.clone();
    this.copied = true;
  }

  add(item: T): void {
    // Don't actually need to COW unless the item is there to add.
    if (this.items.has(item)) {
      return;
    }
    this.cow();
    this.items.add(item);
  }

  replaceFirst(newItem: T, f: (item: T) => boolean): void {
    // Don't actually need to COW unless the item is already there
    // and there are no items to replace
    if (this.items.has(newItem) && !this.items.some(f)) {
      return;
    }
    this.cow();
    this.items.replaceFirst(newItem, f);
  }

  remove(item: T): void {
    // Don't actually need to COW unless the item is there to remove.
    if (!this.items.has(item)) {
      return;
    }
    this.cow();
    this.items.remove(item);
  }

  some(f: (preference: T) => boolean): boolean {
    return this.items.some(f);
  }

  clear(): void {
    if (this.items.isEmpty()) {
      return;
    }
    this.cow();
    this.items.clear();
  }

  build(): ObjectSet<T> {
    // Immutable sets are always kept sorted!
    if (this.copied) {
      this.items.sort();
    }
    this.copied = false;
    return this.items;
  }
}

export class MutableVideoPreferences {
  constructor(private builder: SetBuilder<VideoPreference>) {}

  add(pref: VideoPreference): void {
    this.builder.add(pref);
  }

  replaceFirst(newPref: VideoPreference, f: (pref: VideoPreference) => boolean): void {
    this.builder.replaceFirst(newPref, f);
  }

  remove(pref: VideoPreference): void {
    this.builder.remove(pref);
  }

  some(f: (preference: VideoPreference) => boolean): boolean {
    return this.builder.some(f);
  }

  clear(): void {
    this.builder.clear();
  }

  build(): VideoPreferences {
    return new VideoPreferences(this.builder.build());
  }
}

export class VideoPreferences implements Iterable<VideoPreference>, Eq {
  static prepare(): MutableVideoPreferences {
    return new MutableVideoPreferences(new SetBuilder<VideoPreference>());
  }

  static default(): VideoPreferences {
    return new VideoPreferences(ObjectSet.default());
  }

  /** @internal */
  constructor(private items: ObjectSet<VideoPreference>) {}

  [Symbol.iterator](): Iterator<VideoPreference, VideoPreference, undefined> {
    return this.items[Symbol.iterator]();
  }

  highestPriority(): number | undefined {
    return this.items.first()?.priority;
  }

  // Our items happen to always be sorted!
  sorted(): Iterator<VideoPreference, VideoPreference, undefined> {
    return this.items[Symbol.iterator]();
  }

  equals(other: this): boolean {
    return other === this || this.items.equals(other.items);
  }

  modify(): MutableVideoPreferences {
    return new MutableVideoPreferences(this.items.modify());
  }

  some(f: (pref: VideoPreference) => boolean): boolean {
    return this.items.some(f);
  }

  isEmpty(): boolean {
    return this.items.isEmpty();
  }

  clone(): VideoPreferences {
    const videoPreferences = VideoPreferences.prepare();
    for (const preference of this.items) {
      videoPreferences.add(preference.clone());
    }
    return videoPreferences.build();
  }
}

export default VideoPreferences;
