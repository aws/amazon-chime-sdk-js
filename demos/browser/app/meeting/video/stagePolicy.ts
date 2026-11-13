// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export type StageLayout = 'speaker' | 'gallery' | 'spotlight';

export interface StageFacts {
  tiles: readonly { tileId: number | null; attendeeId: string | null; isContent: boolean }[];
  localAttendeeId: string;
  localTileId: number | null;
  currentPage: readonly string[];
  pinned: string | null;
  layout: StageLayout;
  /** Attendees, not content shares, in join order. */
  present: readonly string[];
  featuredSpeaker: string;
  avatarIds: readonly string[];
}

export function stageGrid(
  visible: number,
  featured: boolean,
  layout: StageLayout,
  onlySideTileIsYours: boolean
): { alone: boolean; pip: boolean; cols: number; rows: number; phoneCols: number } {
  const alone = featured && (layout === 'spotlight' || visible === 1);
  // Only your tile beside the featured one: it floats over the corner instead.
  const pip = featured && !alone && visible === 2 && onlySideTileIsYours;
  let cols: number;
  let rows: number;
  if (alone) {
    cols = 1;
    rows = 1;
  } else if (featured) {
    cols = 2;
    rows = visible - 1;
  } else {
    cols = Math.max(1, Math.ceil(Math.sqrt(visible)));
    rows = Math.max(1, Math.ceil(visible / cols));
  }
  return { alone, pip, cols, rows, phoneCols: Math.min(2, Math.max(1, visible)) };
}

/** Content share, then pinned, then (outside gallery) the speaker; never your own tile. */
export function chooseFeatured(facts: StageFacts): {
  tileId: number | null;
  avatarId: string | null;
} {
  const contentTileId = findContentTileId(facts);
  const pinnedTileId = facts.pinned ? tileIdForAttendeeId(facts, facts.pinned) : null;
  const speaker = speakerToFeature(facts);
  const gallery = facts.layout === 'gallery';
  const tileId =
    contentTileId ?? pinnedTileId ?? (gallery ? null : tileIdForAttendeeId(facts, speaker));
  const avatarId =
    !gallery && contentTileId === null && pinnedTileId === null && facts.avatarIds.includes(speaker)
      ? speaker
      : null;
  return { tileId: tileId === facts.localTileId ? null : tileId, avatarId };
}

function tileIdForAttendeeId(facts: StageFacts, attendeeId: string): number | null {
  for (const tile of facts.tiles) {
    if (tile.attendeeId === attendeeId) {
      return tile.tileId;
    }
  }
  return null;
}

// Your own share counts only while it is on the current page.
function findContentTileId(facts: StageFacts): number | null {
  for (const tile of facts.tiles) {
    if (tile.isContent && tile.attendeeId) {
      if (
        tile.attendeeId.startsWith(facts.localAttendeeId) &&
        !facts.currentPage.includes(tile.attendeeId)
      ) {
        return null;
      }
      return tile.tileId;
    }
  }
  return null;
}

function speakerToFeature(facts: StageFacts): string {
  if (facts.present.includes(facts.featuredSpeaker)) {
    return facts.featuredSpeaker;
  }
  for (const attendeeId of facts.present) {
    if (attendeeId !== facts.localAttendeeId) {
      return attendeeId;
    }
  }
  return '';
}
