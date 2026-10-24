// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import { chooseFeatured, type StageFacts, stageGrid } from './stagePolicy';

describe('stageGrid', () => {
  it('puts two tiles side by side', () => {
    expect(stageGrid(2, false, 'speaker', false)).toEqual({
      alone: false,
      pip: false,
      cols: 2,
      rows: 1,
      phoneCols: 2,
    });
  });

  it('lays out a near-square grid when nothing is featured', () => {
    expect(stageGrid(5, false, 'gallery', false)).toEqual({
      alone: false,
      pip: false,
      cols: 3,
      rows: 2,
      phoneCols: 2,
    });
    expect(stageGrid(0, false, 'speaker', false)).toEqual({
      alone: false,
      pip: false,
      cols: 1,
      rows: 1,
      phoneCols: 1,
    });
  });

  it('gives a featured tile two columns and one row per other tile', () => {
    expect(stageGrid(4, true, 'speaker', false)).toEqual({
      alone: false,
      pip: false,
      cols: 2,
      rows: 3,
      phoneCols: 2,
    });
  });

  it('shows the featured tile alone in spotlight or when it is the only tile', () => {
    expect(stageGrid(4, true, 'spotlight', false)).toEqual({
      alone: true,
      pip: false,
      cols: 1,
      rows: 1,
      phoneCols: 2,
    });
    expect(stageGrid(1, true, 'speaker', false)).toEqual({
      alone: true,
      pip: false,
      cols: 1,
      rows: 1,
      phoneCols: 1,
    });
  });

  it('falls back to a grid in spotlight when nothing is featured', () => {
    expect(stageGrid(4, false, 'spotlight', false)).toEqual({
      alone: false,
      pip: false,
      cols: 2,
      rows: 2,
      phoneCols: 2,
    });
  });

  it('floats your tile over the featured one only when it is the one other tile', () => {
    expect(stageGrid(2, true, 'speaker', true)).toEqual({
      alone: false,
      pip: true,
      cols: 2,
      rows: 1,
      phoneCols: 2,
    });
    expect(stageGrid(2, true, 'speaker', false).pip).toBe(false);
    expect(stageGrid(3, true, 'speaker', true).pip).toBe(false);
  });
});

describe('chooseFeatured', () => {
  const me = { tileId: 1, attendeeId: 'me', isContent: false };
  const alice = { tileId: 2, attendeeId: 'alice', isContent: false };
  const bob = { tileId: 3, attendeeId: 'bob', isContent: false };
  const aliceShare = { tileId: 4, attendeeId: 'alice#content', isContent: true };
  const myShare = { tileId: 5, attendeeId: 'me#content', isContent: true };

  const facts = (overrides: Partial<StageFacts>): StageFacts => ({
    tiles: [me, alice, bob],
    localAttendeeId: 'me',
    localTileId: 1,
    currentPage: ['me', 'alice', 'bob'],
    pinned: null,
    layout: 'speaker',
    present: ['me', 'alice', 'bob'],
    featuredSpeaker: 'alice',
    avatarIds: [],
    ...overrides,
  });

  it('features content share over a pin and the speaker', () => {
    expect(
      chooseFeatured(
        facts({
          tiles: [me, alice, bob, aliceShare],
          currentPage: ['me', 'alice', 'bob', 'alice#content'],
          pinned: 'bob',
        })
      )
    ).toEqual({ tileId: 4, avatarId: null });
  });

  it('features a pinned attendee over the speaker unless they have no tile', () => {
    expect(chooseFeatured(facts({ pinned: 'bob' }))).toEqual({ tileId: 3, avatarId: null });
    expect(chooseFeatured(facts({ pinned: 'carol' }))).toEqual({ tileId: 2, avatarId: null });
  });

  it('features the last speaker still present, else the first other attendee', () => {
    expect(chooseFeatured(facts({ featuredSpeaker: 'bob' }))).toEqual({
      tileId: 3,
      avatarId: null,
    });
    expect(chooseFeatured(facts({ featuredSpeaker: 'carol' }))).toEqual({
      tileId: 2,
      avatarId: null,
    });
    expect(chooseFeatured(facts({ featuredSpeaker: '' }))).toEqual({ tileId: 2, avatarId: null });
  });

  it('features no speaker in gallery, but still content and pins', () => {
    expect(chooseFeatured(facts({ layout: 'gallery' }))).toEqual({ tileId: null, avatarId: null });
    expect(chooseFeatured(facts({ layout: 'gallery', pinned: 'bob' }))).toEqual({
      tileId: 3,
      avatarId: null,
    });
    expect(
      chooseFeatured(
        facts({
          layout: 'gallery',
          tiles: [me, alice, bob, aliceShare],
          currentPage: ['me', 'alice', 'bob', 'alice#content'],
        })
      )
    ).toEqual({ tileId: 4, avatarId: null });
  });

  it('never features your own tile', () => {
    expect(chooseFeatured(facts({ pinned: 'me' }))).toEqual({ tileId: null, avatarId: null });
    expect(chooseFeatured(facts({ present: ['me', 'bob', 'alice'], featuredSpeaker: '' }))).toEqual(
      { tileId: 3, avatarId: null }
    );
    expect(
      chooseFeatured(
        facts({
          tiles: [],
          localTileId: null,
          present: ['me'],
          featuredSpeaker: '',
          avatarIds: ['me'],
        })
      )
    ).toEqual({ tileId: null, avatarId: null });
  });

  it('features a speaker without video as their name tile when nothing else is featured', () => {
    const noVideo = { tiles: [me, bob], avatarIds: ['alice'] };
    expect(chooseFeatured(facts(noVideo))).toEqual({ tileId: null, avatarId: 'alice' });
    expect(chooseFeatured(facts({ ...noVideo, layout: 'gallery' }))).toEqual({
      tileId: null,
      avatarId: null,
    });
    expect(chooseFeatured(facts({ ...noVideo, pinned: 'bob' }))).toEqual({
      tileId: 3,
      avatarId: null,
    });
    expect(
      chooseFeatured(
        facts({
          ...noVideo,
          tiles: [me, bob, aliceShare],
          currentPage: ['me', 'bob', 'alice', 'alice#content'],
        })
      )
    ).toEqual({ tileId: 4, avatarId: null });
  });

  it('decides content share by the first content tile only', () => {
    const shares = { tiles: [me, alice, bob, myShare, aliceShare] };
    expect(chooseFeatured(facts(shares))).toEqual({ tileId: 2, avatarId: null });
    expect(
      chooseFeatured(
        facts({ ...shares, currentPage: ['me', 'alice', 'bob', 'me#content', 'alice#content'] })
      )
    ).toEqual({ tileId: 5, avatarId: null });
    expect(chooseFeatured(facts({ tiles: [me, alice, bob, aliceShare, myShare] }))).toEqual({
      tileId: 4,
      avatarId: null,
    });
  });
});
