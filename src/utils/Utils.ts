// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { AssetSpec } from '../../libs/voicefocus/voicefocus';
import Versioning from '../versioning/Versioning';

export function wait(waitTimeMs: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, waitTimeMs));
}

// This is impossible to adequately test in Node, so Istanbul ignore.
/* istanbul ignore next */
export function isIFramed(): boolean {
  // Same-origin iframes can check `nodeName`.
  // We can also check whether the parent window and the top window are the same.
  // Cross-origin iframes will throw on the `parent` check, so catch here.
  try {
    return window.frameElement?.nodeName === 'IFRAME' || parent !== top;
  } catch (e) {
    // Very likely to be a cross-origin iframe.
    return true;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toLowerCasePropertyNames(input: any): any {
  if (input === null) {
    return null;
  } else if (typeof input !== 'object') {
    return input;
  } else if (Array.isArray(input)) {
    return input.map(toLowerCasePropertyNames);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Object.keys(input).reduce((result: any, key: string) => {
    const value = input[key];
    const newValue = typeof value === 'object' ? toLowerCasePropertyNames(value) : value;
    result[key.toLowerCase()] = newValue;
    return result;
  }, {});
}

/**
 * Based on the SDK version, return an asset group.
 *
 * @returns the default asset spec, based on the SDK version.
 */
export function getDefaultAssetSpec(): AssetSpec {
  const version = Versioning.sdkVersionSemVer;

  return {
    assetGroup: `sdk-${version.major}.${version.minor}`,
  };
}

/**
 * Get UTC offset in (+|-)HH:mm format
 * E.g. For Asia/Calcutta timezone, +05:30 UTC offset value is returned
 */
export function getFormattedOffset(utcOffset: number): string {
  const offset = Math.abs(utcOffset);
  const offsetOperator = utcOffset <= 0 ? '+' : '-';
  const offsetHours = Math.floor(offset / 60)
    .toString()
    .padStart(2, '0');
  const offsetMinutes = Math.floor(offset % 60)
    .toString()
    .padStart(2, '0');

  return `${offsetOperator}${offsetHours}:${offsetMinutes}`;
}

export function getRandomValues(buffer: Uint32Array): void {
  try {
    // Browser environment
    window.crypto.getRandomValues(buffer);
  } catch (error) {
    // Node environment for unit test
    const view = new DataView(buffer.buffer);
    view.setUint32(0, Math.trunc(Math.random() * 2 ** 32), true);
  }
}

/**
 * Shim for SuppressedError
 * https://github.com/tc39/proposal-explicit-resource-management?tab=readme-ov-file#the-suppressederror-error
 */
export class SuppressedError extends Error {
  constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public readonly error: any,
    public readonly suppressed?: SuppressedError,
    message?: string
  ) {
    /* istanbul ignore next -- because coverage can't detect all the branches */
    super(message ?? `${error?.message ?? error}`);
  }
}

/**
 * Run a callback over the set of all values, suppress any errors, and only throw after iteration completes.
 * @param iterable - The iterable to iterate over
 * @param callback - The callback to run on each iteration
 * @throws If any of the callbacks throw an error
 */
export function iterateEvery<T>(
  iterable: Iterable<T> | undefined | null,
  callback: (value: T) => void
): void {
  if (!iterable) return;
  let suppressedError: SuppressedError | undefined;
  for (const value of iterable) {
    try {
      callback(value);
    } catch (err) {
      suppressedError = new SuppressedError(err, suppressedError);
    }
  }
  if (suppressedError) {
    throw suppressedError;
  }
}
