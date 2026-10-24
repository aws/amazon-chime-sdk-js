// @vitest-environment happy-dom
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { afterEach, describe, expect, it, vi } from 'vitest';

import ApiClient from './ApiClient';

const respond = (status: number, body: unknown = {}): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('ApiClient', () => {
  const api = new ApiClient('https://demo.example/');

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    ['startCapture', () => api.startCapture('standup')],
    ['endCapture', () => api.endCapture('standup')],
    ['endMeeting', () => api.endMeeting('standup')],
    ['endLiveConnector', () => api.endLiveConnector('standup')],
  ])('%s rejects on a server error even though it expects no body', async (_name, call) => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => respond(500, { error: 'InternalError' }))
    );
    await expect(call()).rejects.toThrow('Server error: InternalError');
  });

  it('resolves a body-less call on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => respond(200))
    );
    await expect(api.startCapture('standup')).resolves.toBeUndefined();
  });

  it('sends a_cnt only when a maximum attendee count is set', async () => {
    const fetchMock = vi.fn(async () => respond(200, { JoinInfo: {} }));
    vi.stubGlobal('fetch', fetchMock);
    const request = {
      meeting: 'standup',
      name: 'Ada',
      region: 'us-east-1',
      echoReduction: false,
      videoMaxResolution: 'HD',
      contentMaxResolution: 'FHD',
    } as const;
    await api.join({ ...request, maxAttendeeCount: null });
    await api.join({ ...request, maxAttendeeCount: 25 });
    const sent = fetchMock.mock.calls.map(
      call => new URL(String((call as unknown[])[0])).searchParams
    );
    expect(sent[0].has('a_cnt')).toBe(false);
    expect(sent[1].get('a_cnt')).toBe('25');
  });

  it('reads the recording state from the meeting lookup and degrades to null', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => respond(200, { exists: true, mediaRegion: 'us-east-1', capturing: true }))
    );
    await expect(api.lookupMeeting('standup')).resolves.toEqual({
      exists: true,
      mediaRegion: 'us-east-1',
      capturing: true,
      broadcasting: false,
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => respond(403))
    );
    await expect(api.lookupMeeting('standup')).resolves.toBeNull();
  });
});
