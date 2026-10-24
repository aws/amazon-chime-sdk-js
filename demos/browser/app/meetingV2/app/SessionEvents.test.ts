// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// @vitest-environment happy-dom
import type { MeetingSessionStatus } from 'amazon-chime-sdk-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import SessionEventHandler, { SessionElements, SessionUi } from './SessionEvents';

// The SDK's CommonJS bundle does not load under vitest (an import cycle), so the module under test
// gets the SDK's own sources for what it uses at runtime.
vi.mock('amazon-chime-sdk-js', async () => ({
  DefaultModality: (await import('../../../../../src/modality/DefaultModality')).default,
  MeetingSessionStatusCode: (
    await import('../../../../../src/meetingsession/MeetingSessionStatusCode')
  ).default,
}));

const SELF = 'self-attendee';

function setUp(): {
  handler: SessionEventHandler;
  speaking: Map<string, boolean>;
  featured: string[];
  elements: SessionElements;
} {
  document.body.innerHTML = '<div id="toast-container"></div>';
  const speaking = new Map<string, boolean>();
  const featured: string[] = [];
  const present = new Set<string>();
  const app = {
    config: { get: (key: string) => (key === 'behaviorAfterLeave' ? 'nothing' : false) },
    session: {
      isSelfAttendee: (id: string) => id === SELF,
      relayProtocol: () => Promise.resolve('udp'),
      logger: { info: () => {}, warn: () => {} },
    },
    roster: {
      hasAttendee: (id: string) => present.has(id),
      addAttendee: (id: string) => present.add(id),
      removeAttendee: (id: string) => present.delete(id),
      get participantCount() {
        return present.size;
      },
      setAttendeeSpeakingStatus: (id: string, on: boolean) => speaking.set(id, on),
      setMuteStatus: () => {},
      setSignalStrength: () => {},
    },
    tiles: {
      setAttendeePresent: () => {},
      setAttendeeSpeaking: () => {},
      setAttendeeMuted: () => {},
      setAttendeeSignalStrength: () => {},
      setFeaturedSpeaker: (id: string) => featured.push(id),
    },
    reactions: { rebroadcastHand: () => {} },
    recording: { rebroadcast: () => {} },
    rejoinRequested: false,
    endedByMe: false,
    rememberMediaState: () => {},
  } as unknown as SessionUi;
  const el = (): HTMLElement => document.createElement('span');
  const elements: SessionElements = {
    timer: el(),
    connectionIndicator: el(),
    permissionDeniedReason: el(),
    permissionRetry: el(),
    permissionContinue: el(),
  };
  return { handler: new SessionEventHandler(app, elements), speaking, featured, elements };
}

const stopped = { statusCode: () => 1 } as unknown as MeetingSessionStatus;
const toasts = (): string[] =>
  Array.from(document.querySelectorAll('.toast-message')).map(toast => toast.textContent ?? '');

describe('SessionEventHandler', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('rings while the volume is up and drops the ring the moment someone mutes', () => {
    const { handler, speaking } = setUp();
    handler.attendeeVolume('bob', 0.6, false, null);
    expect(speaking.get('bob')).toBe(true);

    handler.attendeeVolume('bob', null, true, null);
    expect(speaking.get('bob')).toBe(false);

    // Muted, a stray volume update does not light it again.
    handler.attendeeVolume('bob', 0.6, null, null);
    expect(speaking.get('bob')).toBe(false);
  });

  it('keeps the ring through a short pause and drops it after the hold', () => {
    const { handler, speaking } = setUp();
    handler.attendeeVolume('bob', 0.6, false, null);
    handler.attendeeVolume('bob', 0.05, null, null);
    vi.advanceTimersByTime(400);
    expect(speaking.get('bob')).toBe(true);
    vi.advanceTimersByTime(600);
    expect(speaking.get('bob')).toBe(false);
  });

  it('never features you, and features someone else at once when nobody is featured yet', () => {
    const { handler, featured } = setUp();
    handler.attendeePresence(SELF, true, 'x#Me');
    handler.attendeePresence('bob', true, 'y#Bob');
    handler.activeSpeakers([SELF, 'bob']);
    expect(featured).toEqual(['bob']);
  });

  it('restarts the clock after the session stops', () => {
    const { handler, elements } = setUp();
    handler.sessionStarted();
    vi.advanceTimersByTime(65_000);
    expect(elements.timer.textContent).toBe('1:05');

    handler.sessionStopped(stopped);
    expect(elements.timer.textContent).toBe('');
    handler.sessionStarted();
    vi.advanceTimersByTime(2_000);
    expect(elements.timer.textContent).toBe('0:02');
  });

  it('announces arrivals and departures after the people already there', () => {
    const { handler } = setUp();
    handler.sessionStarted();
    handler.attendeePresence('bob', true, 'y#Bob');
    expect(toasts()).toEqual([]);

    vi.advanceTimersByTime(6_000);
    handler.attendeePresence('carol', true, 'z#Carol');
    handler.attendeePresence('carol', false, 'z#Carol');
    expect(toasts()).toEqual(['Carol joined.', 'Carol left.']);
  });
});
