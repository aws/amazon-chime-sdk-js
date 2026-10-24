// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// @vitest-environment happy-dom
import type { AudioVideoFacade } from 'amazon-chime-sdk-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import DataMessage from '../../../../../src/datamessage/DataMessage';
import type ApiClient from '../session/ApiClient';
import type { MeetingLookup } from '../session/ApiClient';
import Recording, { RecordingOption } from './Recording';

// The SDK's CommonJS bundle does not load under vitest (an import cycle), so the module under test
// gets the SDK's own sources for the two classes it uses at runtime.
vi.mock('amazon-chime-sdk-js', async () => ({
  DataMessage: (await import('../../../../../src/datamessage/DataMessage')).default,
  DefaultModality: (await import('../../../../../src/modality/DefaultModality')).default,
}));

const LOCAL = 'local-attendee';
const STARTER = 'starter-attendee';

const flush = async (): Promise<void> => {
  for (let i = 0; i < 5; i++) {
    await new Promise(resolve => setTimeout(resolve, 0));
  }
};

interface Harness {
  recording: Recording;
  api: {
    lookupMeeting: ReturnType<typeof vi.fn>;
    startCapture: ReturnType<typeof vi.fn>;
    endCapture: ReturnType<typeof vi.fn>;
  };
  sent: { topic: string; data: unknown }[];
  deliver: (sender: string, payload: object) => void;
  presence: (attendeeId: string, present: boolean) => void;
  unsubscribed: string[];
  element: (id: string) => HTMLElement;
  option: (id: RecordingOption['id']) => RecordingOption;
}

function setUp(lookup: () => Promise<MeetingLookup | null>): Harness {
  document.body.innerHTML = `
    <div id="toast-container"></div>
    <span id="indicator" hidden><span class="recording-label">Recording</span></span>`;
  const element = (id: string): HTMLElement => document.getElementById(id)!;
  let receive: (message: DataMessage) => void = () => {};
  let onPresence: (attendeeId: string, present: boolean) => void = () => {};
  const sent: Harness['sent'] = [];
  const unsubscribed: string[] = [];
  const audioVideo = {
    realtimeSubscribeToReceiveDataMessage: (_topic: string, handler: typeof receive) => {
      receive = handler;
    },
    realtimeUnsubscribeFromReceiveDataMessage: (topic: string) => unsubscribed.push(topic),
    realtimeSubscribeToAttendeeIdPresence: (handler: typeof onPresence) => {
      onPresence = handler;
    },
    realtimeUnsubscribeToAttendeeIdPresence: (handler: typeof onPresence) => {
      if (handler === onPresence) {
        unsubscribed.push('presence');
      }
    },
    realtimeSendDataMessage: (topic: string, data: unknown) => sent.push({ topic, data }),
  } as unknown as AudioVideoFacade;
  const api = {
    lookupMeeting: vi.fn(lookup),
    startCapture: vi.fn(() => Promise.resolve()),
    endCapture: vi.fn(() => Promise.resolve()),
  };
  const recording = new Recording(audioVideo, api as unknown as ApiClient, 'meeting', LOCAL, {
    indicator: element('indicator'),
  });
  const option = (id: RecordingOption['id']): RecordingOption =>
    recording.options.find(candidate => candidate.id === id)!;
  return {
    recording,
    api,
    sent,
    deliver: (sender, payload) =>
      receive(
        new DataMessage(
          Date.now(),
          Recording.TOPIC,
          new TextEncoder().encode(JSON.stringify(payload)),
          sender,
          `${sender}#Starter`
        )
      ),
    presence: (attendeeId, present) => onPresence(attendeeId, present),
    unsubscribed,
    element,
    option,
  };
}

const lookupResult = (capturing: boolean): MeetingLookup => ({
  exists: true,
  capturing,
  broadcasting: false,
});

const toasts = (): string[] =>
  Array.from(document.querySelectorAll('.toast-message')).map(toast => toast.textContent ?? '');

describe('Recording', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('does not announce or show a cloud recording the server refused', async () => {
    const { api, sent, element, option } = setUp(() => Promise.resolve(lookupResult(false)));
    api.startCapture.mockImplementation(() => Promise.reject(new Error('Server error: HTTP 500')));
    await flush();

    option('button-record-cloud').select();
    await flush();

    expect(api.startCapture).toHaveBeenCalledTimes(1);
    expect(sent).toEqual([]);
    expect(element('indicator').hidden).toBe(true);
    expect(option('button-record-cloud').checked).toBe(false);
    expect(toasts()).toEqual(['Could not change recording: Server error: HTTP 500']);
  });

  it('keeps the indicator after the starter leaves while the server still records', async () => {
    const { deliver, presence, element } = setUp(() => Promise.resolve(lookupResult(true)));
    await flush();
    deliver(STARTER, { capturing: true, broadcasting: false });
    await flush();
    expect(element('indicator').hidden).toBe(false);
    expect(element('indicator').textContent).toBe('Recording (Starter)');

    presence(STARTER, false);
    await flush();

    expect(element('indicator').hidden).toBe(false);
    expect(element('indicator').textContent).toBe('Recording');
  });

  it('shows a recording a late joiner was never told about, and stops it', async () => {
    const { api, sent, element, option } = setUp(() => Promise.resolve(lookupResult(true)));
    await flush();
    expect(element('indicator').hidden).toBe(false);
    expect(option('button-record-cloud').checked).toBe(true);

    option('button-record-cloud').select();
    await flush();

    expect(api.endCapture).toHaveBeenCalledTimes(1);
    expect(api.startCapture).not.toHaveBeenCalled();
    expect(sent).toEqual([
      {
        topic: Recording.TOPIC,
        data: { capturing: false, broadcasting: false, endedCapture: true },
      },
    ]);
    expect(element('indicator').hidden).toBe(true);
  });

  it('does not hide a live announcement when the server has not caught up', async () => {
    const { deliver, presence, element } = setUp(() => Promise.resolve(lookupResult(false)));
    await flush();
    deliver(STARTER, { capturing: true, broadcasting: false });
    presence('another-attendee', true);
    await flush();

    expect(element('indicator').hidden).toBe(false);
    expect(element('indicator').textContent).toBe('Recording (Starter)');
  });

  it('clears a recording we started when another attendee stops it', async () => {
    const { deliver, sent, element, option } = setUp(() => Promise.resolve(lookupResult(false)));
    await flush();
    option('button-record-cloud').select();
    await flush();
    expect(sent).toEqual([
      { topic: Recording.TOPIC, data: { capturing: true, broadcasting: false } },
    ]);
    expect(element('indicator').textContent).toBe('Recording (you)');

    deliver(STARTER, { capturing: false, broadcasting: false, endedCapture: true });
    await flush();

    expect(element('indicator').hidden).toBe(true);
    expect(option('button-record-cloud').checked).toBe(false);
    expect(toasts()).toContain('Starter stopped recording.');
  });

  it('falls back to the announcements when the server cannot say', async () => {
    const { deliver, presence, element } = setUp(() => Promise.resolve(null));
    await flush();
    deliver(STARTER, { capturing: true, broadcasting: false });
    await flush();
    expect(element('indicator').hidden).toBe(false);

    presence(STARTER, false);
    await flush();

    expect(element('indicator').hidden).toBe(true);
  });

  it('keeps cloud capture off in a replica', async () => {
    const { recording, option } = setUp(() => Promise.resolve(lookupResult(false)));
    recording.setReplica();
    await flush();

    expect(option('button-record-cloud').unavailable).toBe('Not available in a replica meeting');
    expect(option('button-live-connector').unavailable).toBeNull();
  });

  it('unsubscribes everything on destroy', async () => {
    const { recording, unsubscribed, api, option } = setUp(() =>
      Promise.resolve(lookupResult(false))
    );
    await flush();
    recording.destroy();

    option('button-record-cloud').select();
    await flush();

    expect(unsubscribed).toEqual([Recording.TOPIC, 'presence']);
    expect(api.startCapture).not.toHaveBeenCalled();
  });
});
