// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import { hueOf, initialsOf } from './avatar';

describe('initialsOf', () => {
  it('takes the first and last word', () => {
    expect(initialsOf('Ada King Lovelace')).toBe('AL');
    expect(initialsOf('  grace   hopper ')).toBe('GH');
    expect(initialsOf('Linus')).toBe('L');
  });

  it('keeps whole characters outside the basic plane and falls back for empty names', () => {
    expect(initialsOf('😀 Smile')).toBe('😀S');
    expect(initialsOf('   ')).toBe('?');
  });
});

describe('hueOf', () => {
  it('is stable per attendee and within the colour wheel', () => {
    expect(hueOf('attendee-1')).toBe(hueOf('attendee-1'));
    expect(hueOf('attendee-1')).toBeGreaterThanOrEqual(0);
    expect(hueOf('attendee-1')).toBeLessThan(360);
  });
});
