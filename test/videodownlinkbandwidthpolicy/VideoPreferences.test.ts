// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import { expect } from 'chai';

import { MutableVideoPreferences as MutableVideoPreferencesFromSrc } from '../../src';
import VideoPreference from '../../src/videodownlinkbandwidthpolicy/VideoPreference';
import {
  MutableVideoPreferences,
  VideoPreferences,
} from '../../src/videodownlinkbandwidthpolicy/VideoPreferences';

describe('VideoPreferences', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  it('can be defaulted', () => {
    const d = VideoPreferences.default();
    expect(d.isEmpty()).to.be.true;
  });

  it('can be built', () => {
    const p = VideoPreferences.prepare().build();
    expect(p.isEmpty()).to.be.true;
  });

  it('is equal to empty', () => {
    const d = VideoPreferences.default();
    const p = VideoPreferences.prepare().build();
    expect(p.isEmpty()).to.be.true;
    expect(p.equals(d)).to.be.true;
  });

  it('can be populated', () => {
    const b = VideoPreferences.prepare();
    b.add(new VideoPreference('foo', 1));
    const p = b.build();
    has(p, 'foo');
    expect(p.isEmpty()).to.be.false;
  });

  it('can have elements replaced', () => {
    const b1 = VideoPreferences.prepare();
    b1.add(new VideoPreference('foo', 1));
    b1.replaceFirst(new VideoPreference('foo', 2), (item: VideoPreference) => {
      return item.attendeeId === 'foo';
    });
    const p1 = b1.build();

    const b2 = VideoPreferences.prepare();
    b2.add(new VideoPreference('foo', 2));
    const p2 = b2.build();

    has(p1, 'foo');
    expect(p1.isEmpty()).to.be.false;
    expect(p1.equals(p2)).to.be.true;
  });

  it('can skip replace', () => {
    const b1: MutableVideoPreferences = VideoPreferences.prepare();
    b1.add(new VideoPreference('foo', 1));
    b1.replaceFirst(new VideoPreference('foo', 1), (item: VideoPreference) => {
      return item.attendeeId === 'bar';
    });
    const p1 = b1.build();

    const b2 = VideoPreferences.prepare();
    b2.add(new VideoPreference('foo', 1));
    const p2 = b2.build();

    has(p1, 'foo');
    expect(p1.isEmpty()).to.be.false;
    expect(p1.equals(p2)).to.be.true;
  });

  it('replaces only first occurance', () => {
    const b1: MutableVideoPreferences = VideoPreferences.prepare();
    b1.add(new VideoPreference('foo', 1));
    b1.add(new VideoPreference('foo', 2));
    b1.add(new VideoPreference('foo', 3));
    b1.add(new VideoPreference('foo', 4));
    b1.replaceFirst(new VideoPreference('foo', 1), (item: VideoPreference) => {
      return item.priority % 2 === 0;
    });
    const p1 = b1.build();

    const b2 = VideoPreferences.prepare();
    b2.add(new VideoPreference('foo', 1));
    b2.add(new VideoPreference('foo', 3));
    b2.add(new VideoPreference('foo', 4));
    const p2 = b2.build();

    expect(p1.equals(p2)).to.be.true;
  });

  it("replace doesn't create duplicates", () => {
    const b1: MutableVideoPreferences = VideoPreferences.prepare();
    b1.add(new VideoPreference('foo', 3));
    b1.replaceFirst(new VideoPreference('foo', 1), (item: VideoPreference) => {
      return item.priority % 2 === 0;
    });
    const p1 = b1.build();

    const b2 = VideoPreferences.prepare();
    b2.add(new VideoPreference('foo', 1));
    b2.add(new VideoPreference('foo', 3));
    const p2 = b2.build();

    expect(p1.equals(p2)).to.be.true;
  });

  it('can handle duplicates', () => {
    const b1 = VideoPreferences.prepare();
    b1.add(new VideoPreference('foo', 1));
    b1.add(new VideoPreference('foo', 1));
    const p1 = b1.build();

    const b2 = VideoPreferences.prepare();
    b2.add(new VideoPreference('foo', 1));
    const p2 = b2.build();

    expect(p1.equals(p2)).to.be.true;
  });

  it('can have preferences removed', () => {
    const b1 = VideoPreferences.prepare();
    b1.add(new VideoPreference('foo', 1));
    b1.remove(new VideoPreference('foo', 1));
    const p1 = b1.build();

    not(p1, 'foo');
    expect(p1.isEmpty()).to.be.true;
  });

  it('can return undefined from highestPriority if empty', () => {
    const b1 = VideoPreferences.prepare();
    const p1 = b1.build();

    expect(p1.highestPriority()).to.be.eq(undefined);
  });

  it('can handle removing non-existent preferences', () => {
    const b1 = VideoPreferences.prepare();
    b1.remove(new VideoPreference('foo', 1));
    const p1 = b1.build();

    not(p1, 'foo');
    expect(p1.isEmpty()).to.be.true;
  });

  it('can handle clearing when empty', () => {
    const b1 = VideoPreferences.prepare();
    b1.clear();
    const p1 = b1.build();

    expect(p1.isEmpty()).to.be.true;
  });

  it('contents are sorted by preference', () => {
    const b1 = VideoPreferences.prepare();
    b1.add(new VideoPreference('foo', 3));
    b1.add(new VideoPreference('bar', 4));
    b1.add(new VideoPreference('foo#content', 2));
    b1.add(new VideoPreference('bar#content', 1));
    const p1 = b1.build();

    const iter = p1.sorted();
    let result = iter.next();
    expect(result.value.equals(new VideoPreference('bar#content', 1))).to.be.true;
    result = iter.next();
    expect(result.value.equals(new VideoPreference('foo#content', 2))).to.be.true;
    result = iter.next();
    expect(result.value.equals(new VideoPreference('foo', 3))).to.be.true;
    result = iter.next();
    expect(result.value.equals(new VideoPreference('bar', 4))).to.be.true;
    result = iter.next();
    expect(result.done).to.be.true;
  });

  it('can be modified', () => {
    const b = VideoPreferences.prepare();
    b.add(new VideoPreference('foo', 1));
    const p1 = b.build();

    b.add(new VideoPreference('bar', 2));
    const p2 = b.build();

    has(p1, 'foo');
    has(p2, 'foo');
    has(p2, 'bar');
    not(p1, 'bar');

    expect(p1.equals(p2)).to.be.false;

    const b2 = p1.modify();
    b2.add(new VideoPreference('bar', 2));
    const p3 = b2.build();

    expect(p1.equals(p2)).to.be.false;
    expect(p1.equals(p3)).to.be.false;
    expect(p3.equals(p2)).to.be.true;
  });

  describe('re-export', () => {
    expect(MutableVideoPreferencesFromSrc);
  });
});

function has(prefs: VideoPreferences, id: string): void {
  expect(prefs.some(pref => pref.attendeeId === id)).to.be.true;
}

function not(prefs: VideoPreferences, id: string): void {
  expect(prefs.some(pref => pref.attendeeId === id)).to.be.false;
}
