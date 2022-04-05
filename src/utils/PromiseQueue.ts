// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * A simple promise queue to enforce the order of async APIs for example, start/stop video/audio input.
 */
export default class PromiseQueue {
  queue = Promise.resolve();

  // eslint-disable-next-line
  add<T>(func: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue = this.queue.then(func).then(resolve).catch(reject);
    });
  }
}
