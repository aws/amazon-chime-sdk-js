// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import { MeetingConfig } from './MeetingConfig';
import { ConfigValues, OPTIONS, OptionSpec } from './schema';

class MemoryStorage implements Storage {
  private readonly map = new Map<string, string>();
  get length(): number {
    return this.map.size;
  }
  clear(): void {
    this.map.clear();
  }
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

const config = (query: string, storage: Storage | null = new MemoryStorage()): MeetingConfig =>
  new MeetingConfig(new URLSearchParams(query), storage);

describe('schema', () => {
  it('has unique element ids and URL parameters', () => {
    const ids = OPTIONS.map(option => option.id);
    const params = OPTIONS.map(option => option.param);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(params).size).toBe(params.length);
  });

  it('keeps the element ids the integration tests look up', () => {
    const ids = new Set(OPTIONS.map(option => option.id));
    for (const id of [
      'allow-voice-focus',
      'simulcast',
      'svc',
      'max-content-share',
      'join-view-only',
      'die',
      'background-model',
      'background-blur-strength',
      'background-color',
    ]) {
      expect(ids.has(id)).toBe(true);
    }
  });
});

describe('MeetingConfig', () => {
  it('ignores a background colour that is not a hex colour', () => {
    expect(config('background-color=%23ff8800').get('backgroundColor')).toBe('#ff8800');
    expect(config('background-color=red').get('backgroundColor')).toBe('#1d4ed8');
    expect(config('background-color=%23ff88').get('backgroundColor')).toBe('#1d4ed8');
  });

  it('keeps an uploaded background image apart from the options and tells listeners', () => {
    const storage = new MemoryStorage();
    const c = config('', storage);
    let calls = 0;
    c.onBackgroundImageChange(() => calls++);
    expect(c.backgroundImage).toBeNull();
    expect(c.setBackgroundImage('data:image/jpeg;base64,AAAA')).toBe(true);
    expect(calls).toBe(1);
    expect(config('', storage).backgroundImage).toBe('data:image/jpeg;base64,AAAA');
  });

  it('uses an image storage refused for this visit and says it was not saved', () => {
    const full = new MemoryStorage();
    full.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    const c = config('', full);
    expect(c.setBackgroundImage('data:image/jpeg;base64,BBBB')).toBe(false);
    expect(c.backgroundImage).toBe('data:image/jpeg;base64,BBBB');
  });

  it('starts from schema defaults', () => {
    const c = config('');
    expect(c.get('audioCapability')).toBe('SendReceive');
    expect(c.get('preconnect')).toBe(true);
    expect(c.get('maxAttendeeCount')).toBeNull();
    expect(c.role).toBe('attendee');
  });

  it('parses legacy and new URL parameters', () => {
    const c = config(
      'm=standup&region=eu-west-1&earlyConnect=0&fatal=1&max-content-share=true&video-codec=vp8&max-attendees=25&record=true'
    );
    expect(c.meeting).toBe('standup');
    expect(c.region).toBe('eu-west-1');
    expect(c.get('preconnect')).toBe(false);
    expect(c.get('dieOnFatal')).toBe(true);
    expect(c.get('maxContentShare')).toBe(true);
    expect(c.get('videoCodec')).toBe('vp8');
    expect(c.get('maxAttendeeCount')).toBe(25);
    expect(c.role).toBe('recorder');
  });

  it('ignores invalid select values and numbers', () => {
    const c = config('video-codec=h265&max-attendees=lots&log-level=debug');
    expect(c.get('videoCodec')).toBe('default');
    expect(c.get('maxAttendeeCount')).toBeNull();
    expect(c.get('logLevel')).toBe('debug');
    for (const raw of ['2.5', 'Infinity', '0', '251', '%20']) {
      expect(config(`max-attendees=${raw}`).get('maxAttendeeCount')).toBeNull();
    }
    expect(config('max-attendees=%2012%20').get('maxAttendeeCount')).toBe(12);
  });

  it('does not remember developer mode or other values that came from the URL', () => {
    const storage = new MemoryStorage();
    const fromLink = config('fatal=1&join-muted=1', storage);
    expect(fromLink.developerMode).toBe(true);
    fromLink.set('theme', 'dark');
    const later = config('', storage);
    expect(later.developerMode).toBe(false);
    expect(later.get('joinMuted')).toBe(false);
    expect(later.get('theme')).toBe('dark');
  });

  it('turns developer mode on when a developer parameter is in the URL', () => {
    expect(config('simulcast=1').developerMode).toBe(true);
    expect(config('join-muted=1').developerMode).toBe(false);
  });

  it('persists only options marked persist, and reloads them', () => {
    const storage = new MemoryStorage();
    const first = config('', storage);
    first.set('joinMuted', true);
    first.set('enableSimulcast', true);
    first.rememberName('Ada');
    first.rememberDevice('audioInput', 'mic-1');
    const second = config('', storage);
    expect(second.get('joinMuted')).toBe(true);
    expect(second.get('enableSimulcast')).toBe(false);
    expect(second.name).toBe('Ada');
    expect(second.rememberedDevice('audioInput')).toBe('mic-1');
  });

  it('round-trips non-default options through the share URL', () => {
    const c = config('');
    c.meeting = 'standup';
    c.region = 'us-west-2';
    c.set('videoCodec', 'vp9Profile0');
    c.set('enableSVC', true);
    c.set('maxAttendeeCount', 10);
    const url = new URL(c.toShareUrl('https://example.com/'));
    expect(url.searchParams.get('m')).toBe('standup');
    expect(url.searchParams.get('region')).toBe('us-west-2');
    expect(url.searchParams.get('video-codec')).toBe('vp9Profile0');
    expect(url.searchParams.get('svc')).toBe('1');
    expect(url.searchParams.get('max-attendees')).toBe('10');
    expect(url.searchParams.has('simulcast')).toBe(false);
    const reparsed = config(url.search.slice(1));
    expect(reparsed.get('videoCodec')).toBe('vp9Profile0');
    expect(reparsed.get('enableSVC')).toBe(true);
    expect(reparsed.get('maxAttendeeCount')).toBe(10);
  });

  it('accepts a join info override only when it is well formed', () => {
    const good = encodeURIComponent(
      JSON.stringify({ JoinInfo: { Meeting: { Meeting: {} }, Attendee: { Attendee: {} } } })
    );
    expect(config(`join-info-override=${good}`).joinInfoOverride).toBeDefined();
    expect(config('join-info-override=%7Bnot-json').joinInfoOverride).toBeUndefined();
    expect(
      config('join-info-override=%7B%22JoinInfo%22%3A%7B%7D%7D').joinInfoOverride
    ).toBeUndefined();
  });

  it('notifies listeners and tolerates a corrupt preferences blob', () => {
    const storage = new MemoryStorage();
    storage.setItem('amazon-chime-sdk-js-demo.preferences.values', '{not json');
    const c = config('', storage);
    const changed: string[] = [];
    c.onChange(key => changed.push(key));
    c.set('theme', 'dark');
    c.set('theme', 'dark');
    expect(changed).toEqual(['theme']);
  });
});

/** A value other than the default that the option accepts. */
function nonDefault(option: OptionSpec): ConfigValues[keyof ConfigValues] {
  switch (option.type) {
    case 'boolean':
      return !option.default;
    case 'number':
      return option.min ?? 7;
    case 'select':
      return option.choices.find(choice => choice.value !== option.default)!.value;
    case 'text':
      return 'x-value';
  }
}

describe('MeetingConfig URLs', () => {
  const shareable = OPTIONS.filter(option => !option.persist && option.key !== 'developerMode');

  it.each(shareable.map(option => [option.key, option] as const))(
    'round-trips %s through the share URL',
    (_key, option) => {
      const c = config('');
      const value = nonDefault(option);
      c.set(option.key, value as never);
      const reparsed = config(new URL(c.toShareUrl('https://example.com/')).search.slice(1));
      expect(reparsed.get(option.key)).toEqual(value);
    }
  );

  it('keeps an empty select choice that is not the default', () => {
    const option = OPTIONS.find(
      o => o.type === 'select' && o.default !== '' && o.choices.some(choice => choice.value === '')
    )!;
    const c = config('');
    c.set(option.key, '' as never);
    const reparsed = config(new URL(c.toShareUrl('https://example.com/')).search.slice(1));
    expect(reparsed.get(option.key)).toBe('');
  });

  it('adds dev=1 when the built URL has no developer parameter', () => {
    const c = config('simulcast=1');
    c.set('enableSimulcast', false);
    const url = new URL(c.toShareUrl('https://example.com/'));
    expect(url.searchParams.get('dev')).toBe('1');
  });

  it('rejoins with URL-only inputs and remembered options set from the URL', () => {
    const storage = new MemoryStorage();
    const c = config('m=standup&join-muted=1&voiceFocusName=x&simulcast=1', storage);
    c.set('enableSimulcast', false);
    const url = new URL(
      c.toRejoinUrl('https://example.com/?m=standup&join-muted=1&voiceFocusName=x&simulcast=1#h')
    );
    expect(url.searchParams.get('join-muted')).toBe('1');
    expect(url.searchParams.get('voiceFocusName')).toBe('x');
    expect(url.searchParams.has('simulcast')).toBe(false);
    expect(url.searchParams.get('dev')).toBe('1');
    expect(url.hash).toBe('');
    const back = config(url.search.slice(1), storage);
    expect(back.get('joinMuted')).toBe(true);
    expect(back.get('enableSimulcast')).toBe(false);
    expect(back.developerMode).toBe(true);
  });
});

describe('MeetingConfig.resetToDefaults', () => {
  it('returns every option to its default but keeps developer mode and remembered devices', () => {
    const storage = new MemoryStorage();
    const c = config('simulcast=1&join-muted=1', storage);
    c.set('developerMode', true);
    c.set('theme', 'dark');
    c.rememberDevice('audioInput', 'mic-1');
    c.resetToDefaults();
    expect(c.get('enableSimulcast')).toBe(false);
    expect(c.get('joinMuted')).toBe(false);
    expect(c.get('theme')).toBe('auto');
    expect(c.developerMode).toBe(true);
    expect(c.rememberedDevice('audioInput')).toBe('mic-1');
    // Persisted preferences follow the reset.
    expect(config('', storage).get('joinMuted')).toBe(false);
  });

  it('undoes a reset, restoring remembered and visit-only values as they were', () => {
    const storage = new MemoryStorage();
    const c = config('simulcast=1', storage);
    c.set('theme', 'dark');
    const changed: string[] = [];
    c.onChange(key => changed.push(key));
    const undo = c.resetToDefaults();
    expect(c.get('theme')).toBe('auto');
    undo();
    expect(c.get('theme')).toBe('dark');
    expect(c.get('enableSimulcast')).toBe(true);
    expect(changed).toContain('enableSimulcast');
    expect(config('', storage).get('theme')).toBe('dark');
    expect(config('', storage).get('enableSimulcast')).toBe(false);
  });
});
