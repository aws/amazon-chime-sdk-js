// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as sinon from 'sinon';

// Track the current fake timer instance globally to handle cleanup
let currentClock: sinon.SinonFakeTimers | null = null;

/**
 * Creates a sinon fake timer instance with standard configuration.
 * Fakes only the necessary timer functions: setTimeout, clearTimeout, setInterval, clearInterval, Date.
 *
 * If fake timers are already installed (from a previous test that didn't clean up),
 * this function will restore them first before creating new ones.
 *
 * @returns A sinon fake timer instance that should be restored in afterEach() via clock.restore()
 *
 * @example
 * let clock: sinon.SinonFakeTimers;
 *
 * beforeEach(() => {
 *   clock = createFakeTimers();
 * });
 *
 * afterEach(() => {
 *   if (clock) clock.restore();
 * });
 */
export function createFakeTimers(): sinon.SinonFakeTimers {
  // Clean up any lingering fake timers from previous tests
  if (currentClock) {
    try {
      currentClock.restore();
    } catch {
      // Ignore errors if already restored
    }
    currentClock = null;
  }

  currentClock = sinon.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
    shouldClearNativeTimers: true,
  });
  return currentClock;
}

/**
 * Safely restores fake timers and clears the global reference.
 * Use this in afterEach() hooks instead of clock.restore() directly.
 *
 * @param clock - The sinon fake timer instance to restore
 */
export function restoreFakeTimers(clock: sinon.SinonFakeTimers | null | undefined): void {
  if (clock) {
    try {
      clock.restore();
    } catch {
      // Ignore errors if already restored
    }
  }
  currentClock = null;
}

/**
 * Helper function for async time advancement with fake timers.
 * Uses clock.tickAsync() to properly handle Promise resolution.
 *
 * @param clock - The sinon fake timer instance
 * @param ms - Number of milliseconds to advance (default: 100)
 *
 * @example
 * // Advance time by 100ms (default)
 * await tick(clock);
 *
 * // Advance time by 1000ms
 * await tick(clock, 1000);
 */
export async function tick(clock: sinon.SinonFakeTimers, ms: number = 100): Promise<void> {
  await clock.tickAsync(ms);
}
