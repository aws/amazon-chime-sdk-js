// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ConfigValues, defaultValues, optionByKey, OPTIONS, OptionSpec } from './schema';

const STORAGE_KEY = 'amazon-chime-sdk-js-demo.preferences';

/** Per-attendee role implied by the URL; recorder/broadcaster bots join without devices. */
export type AttendeeRole = 'attendee' | 'recorder' | 'broadcaster';

export interface JoinInfoOverride {
  JoinInfo: { Meeting: unknown; Attendee: unknown };
}

/** Device and video choices remembered across sessions (outside the option schema). */
export type RememberedChoice = 'audioInput' | 'videoInput' | 'audioOutput' | 'videoQuality';

export interface VoiceFocusOverrides {
  name?: string;
  cdn?: string;
  assetGroup?: string;
  revisionID?: string;
}

/**
 * Everything the demo needs to know before and during a meeting, resolved once from
 * (lowest to highest precedence) schema defaults, persisted preferences, the URL, and the
 * join form. Reading the DOM at use time is what this replaces.
 */
export class MeetingConfig {
  readonly values: ConfigValues;

  // Join form
  meeting = '';
  name = '';
  region = '';

  // URL-only inputs
  readonly role: AttendeeRole;
  readonly voiceFocus: VoiceFocusOverrides;
  joinInfoOverride: JoinInfoOverride | undefined;

  private readonly listeners = new Set<(key: keyof ConfigValues) => void>();
  /** What the user chose and is remembered; URL values apply to this visit only. */
  private readonly stored: Partial<ConfigValues> = {};
  /** The uploaded background image; kept apart from the option values because of its size. */
  private uploadedBackgroundImage: string | null = null;
  private readonly backgroundImageListeners = new Set<() => void>();

  constructor(
    private readonly search: URLSearchParams,
    private readonly storage: Storage | null
  ) {
    this.values = defaultValues();
    this.applyPersisted();
    this.applyUrl();
    this.uploadedBackgroundImage = this.readStorage('backgroundImage');

    this.meeting = search.get('m') ?? '';
    this.name = search.get('name') ?? this.readStorage('name') ?? '';
    this.region = search.get('region') ?? '';
    this.role =
      search.get('record') === 'true'
        ? 'recorder'
        : search.get('broadcast') === 'true'
          ? 'broadcaster'
          : 'attendee';
    this.voiceFocus = {
      name: search.get('voiceFocusName') ?? undefined,
      cdn: search.get('voiceFocusCDN') ?? undefined,
      assetGroup: search.get('voiceFocusAssetGroup') ?? undefined,
      revisionID: search.get('voiceFocusRevisionID') ?? undefined,
    };
    this.joinInfoOverride = MeetingConfig.parseJoinInfoOverride(search.get('join-info-override'));
    // A URL that already sets a developer option shows the developer options.
    if (MeetingConfig.hasDeveloperParam(search) || this.joinInfoOverride) {
      this.values.developerMode = true;
    }
  }

  static fromWindow(): MeetingConfig {
    let storage: Storage | null = null;
    try {
      storage = window.localStorage;
    } catch {
      storage = null;
    }
    return new MeetingConfig(new URLSearchParams(location.search), storage);
  }

  get developerMode(): boolean {
    return this.values.developerMode;
  }

  get<K extends keyof ConfigValues>(key: K): ConfigValues[K] {
    return this.values[key];
  }

  set<K extends keyof ConfigValues>(key: K, value: ConfigValues[K]): void {
    if (this.values[key] === value) {
      return;
    }
    this.values[key] = value;
    if (optionByKey(key).persist) {
      this.stored[key] = value;
      this.persist();
    }
    this.notify(key);
  }

  /**
   * Back to schema defaults, keeping developer mode (and the remembered name and devices).
   * Returns an undo that puts back exactly what was there, remembered or not.
   */
  resetToDefaults(): () => void {
    const values = { ...this.values };
    const stored = { ...this.stored };
    for (const option of OPTIONS) {
      if (option.key !== 'developerMode') {
        this.set(option.key, option.default as never);
      }
    }
    return () => {
      for (const key of Object.keys(this.stored) as (keyof ConfigValues)[]) {
        delete this.stored[key];
      }
      Object.assign(this.stored, stored);
      this.persist();
      for (const option of OPTIONS) {
        if (this.values[option.key] !== values[option.key]) {
          (this.values as unknown as Record<string, unknown>)[option.key] = values[option.key];
          this.notify(option.key);
        }
      }
    };
  }

  private notify(key: keyof ConfigValues): void {
    for (const listener of this.listeners) {
      listener(key);
    }
  }

  onChange(listener: (key: keyof ConfigValues) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  rememberName(name: string): void {
    this.name = name;
    this.writeStorage('name', name);
  }

  rememberDevice(kind: RememberedChoice, deviceId: string): void {
    this.writeStorage(`device.${kind}`, deviceId);
  }

  rememberedDevice(kind: RememberedChoice): string | null {
    return this.readStorage(`device.${kind}`);
  }

  /** The uploaded background image as a data URL; null means the built-in one. */
  get backgroundImage(): string | null {
    return this.uploadedBackgroundImage;
  }

  /** False when storage refused it (too large, private mode): it then lasts this visit only. */
  setBackgroundImage(dataUrl: string): boolean {
    this.uploadedBackgroundImage = dataUrl;
    let saved = false;
    try {
      this.storage?.setItem(`${STORAGE_KEY}.backgroundImage`, dataUrl);
      saved = this.storage !== null;
    } catch {
      // Too large for the quota, or storage is unavailable.
    }
    for (const listener of this.backgroundImageListeners) {
      listener();
    }
    return saved;
  }

  onBackgroundImageChange(listener: () => void): () => void {
    this.backgroundImageListeners.add(listener);
    return () => this.backgroundImageListeners.delete(listener);
  }

  /**
   * URL that reproduces this configuration: meeting, region, and every option that differs from
   * its default. This is what "Copy join link" hands out and what tests can be pointed at.
   */
  toShareUrl(base: string = `${location.origin}${location.pathname}`): string {
    const url = new URL(base);
    if (this.meeting) {
      url.searchParams.set('m', this.meeting);
    }
    if (this.region) {
      url.searchParams.set('region', this.region);
    }
    for (const option of OPTIONS) {
      if (option.key === 'developerMode' || option.persist) {
        continue;
      }
      const value = this.values[option.key];
      if (value === option.default || value === null) {
        continue;
      }
      url.searchParams.set(option.param, MeetingConfig.serialize(option, value));
    }
    if (this.values.developerMode && !MeetingConfig.hasDeveloperParam(url.searchParams)) {
      url.searchParams.set('dev', '1');
    }
    return url.toString();
  }

  /**
   * URL that brings this attendee back with everything as it is now: the current URL's own inputs
   * (role, Voice Focus overrides, join info override) plus every option that differs from what a
   * plain reload would restore, including remembered ones that were only set from the URL.
   */
  toRejoinUrl(base: string = location.href): string {
    const url = new URL(base);
    url.hash = '';
    if (this.meeting) {
      url.searchParams.set('m', this.meeting);
    }
    if (this.region) {
      url.searchParams.set('region', this.region);
    }
    for (const option of OPTIONS) {
      if (option.key === 'developerMode') {
        continue;
      }
      const value = this.values[option.key];
      const restored =
        option.persist && option.key in this.stored ? this.stored[option.key] : option.default;
      if (value === restored || value === null) {
        url.searchParams.delete(option.param);
      } else {
        url.searchParams.set(option.param, MeetingConfig.serialize(option, value));
      }
    }
    url.searchParams.delete('dev');
    if (this.values.developerMode && !MeetingConfig.hasDeveloperParam(url.searchParams)) {
      url.searchParams.set('dev', '1');
    }
    return url.toString();
  }

  private static hasDeveloperParam(search: URLSearchParams): boolean {
    return OPTIONS.some(option => option.audience === 'developer' && search.has(option.param));
  }

  private applyPersisted(): void {
    const raw = this.readStorage('values');
    if (!raw) {
      return;
    }
    try {
      const stored = JSON.parse(raw) as Partial<ConfigValues>;
      for (const option of OPTIONS) {
        if (option.persist && option.key in stored) {
          const value = stored[option.key];
          if (MeetingConfig.isValidValue(option, value)) {
            (this.values as unknown as Record<string, unknown>)[option.key] = value;
            (this.stored as Record<string, unknown>)[option.key] = value;
          }
        }
      }
    } catch {
      // Ignore a corrupt preferences blob; defaults apply.
    }
  }

  private applyUrl(): void {
    for (const option of OPTIONS) {
      if (!this.search.has(option.param)) {
        continue;
      }
      const raw = this.search.get(option.param) ?? '';
      const parsed = MeetingConfig.parse(option, raw);
      if (parsed !== undefined) {
        (this.values as unknown as Record<string, unknown>)[option.key] = parsed;
      }
    }
  }

  private persist(): void {
    this.writeStorage('values', JSON.stringify(this.stored));
  }

  private readStorage(key: string): string | null {
    try {
      return this.storage?.getItem(`${STORAGE_KEY}.${key}`) ?? null;
    } catch {
      return null;
    }
  }

  private writeStorage(key: string, value: string): void {
    try {
      this.storage?.setItem(`${STORAGE_KEY}.${key}`, value);
    } catch {
      // Storage can be unavailable (private mode, quota); preferences simply do not persist.
    }
  }

  static parse(option: OptionSpec, raw: string): ConfigValues[keyof ConfigValues] | undefined {
    switch (option.type) {
      case 'boolean':
        if (raw === '' || raw === '1' || raw === 'true') {
          return true;
        }
        if (raw === '0' || raw === 'false') {
          return false;
        }
        return undefined;
      case 'number': {
        const trimmed = raw.trim();
        const value = Number(trimmed);
        if (trimmed === '' || !Number.isInteger(value)) {
          return undefined;
        }
        if (
          (option.min !== undefined && value < option.min) ||
          (option.max !== undefined && value > option.max)
        ) {
          return undefined;
        }
        return value;
      }
      case 'select':
        return option.choices.some(choice => choice.value === raw) ? raw : undefined;
      case 'text':
        return option.pattern && !option.pattern.test(raw) ? undefined : raw;
    }
  }

  static serialize(option: OptionSpec, value: ConfigValues[keyof ConfigValues]): string {
    if (option.type === 'boolean') {
      return value ? '1' : '0';
    }
    return String(value);
  }

  static isValidValue(option: OptionSpec, value: unknown): boolean {
    switch (option.type) {
      case 'boolean':
        return typeof value === 'boolean';
      case 'number':
        return value === null || typeof value === 'number';
      case 'select':
        return typeof value === 'string' && option.choices.some(choice => choice.value === value);
      case 'text':
        return typeof value === 'string' && (!option.pattern || option.pattern.test(value));
    }
  }

  static parseJoinInfoOverride(raw: string | null): JoinInfoOverride | undefined {
    if (!raw) {
      return undefined;
    }
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.JoinInfo?.Meeting && parsed?.JoinInfo?.Attendee) {
        return parsed as JoinInfoOverride;
      }
    } catch {
      // Fall through: a malformed override is ignored rather than killing the page.
    }
    return undefined;
  }
}
