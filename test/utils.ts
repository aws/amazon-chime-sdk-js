// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export function delay(timeoutMs: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, timeoutMs));
}

/**
 * Return a promise that rejects after timeout and offers a function to resolve.
 */
export function shortcut<T>(timeoutMs: number): { done: (t: T) => void; wait: Promise<T> } {
  let done;
  const wait = Promise.race([
    new Promise<T>((resolve, _reject) => {
      done = (v: T) => {
        resolve(v);
      };
    }),
    new Promise<T>((_resolve, reject) => {
      setTimeout(() => {
        reject('timeout hit');
      }, timeoutMs);
    }),
  ]);
  return { done, wait };
}
