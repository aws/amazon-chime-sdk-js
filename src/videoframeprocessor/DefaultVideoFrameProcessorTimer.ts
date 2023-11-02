// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoFrameProcessorTimer from './VideoFrameProcessorTimer';

export default class DefaultVideoFrameProcessorTimer implements VideoFrameProcessorTimer {
  private workerTimer: Worker | undefined = undefined;
  private lastTimeout: ReturnType<typeof setTimeout> | undefined;
  private callback: (() => void) | undefined = undefined;

  constructor() {
    this.workerTimer = this.createWorkerTimer();
  }

  // Create a timer that exists within a web worker. This timer will be used to
  // retrigger the process call whenever time expires.
  private createWorkerTimer(): Worker {
    try {
      // Blob representing a script that will start a timer for the length
      // of the message posted to it. After timer expiration, it will post
      // a message back to the main thread holding the timerID
      const timerBlob = new Blob(
        [
          `self.onmessage = async function(e){ 
            var timerID = null;
            const awaitTimeout = delay => new Promise( resolve => {
              timerID = setTimeout(resolve, delay);
            })
            await awaitTimeout(e.data);
            postMessage(timerID);
          }`,
        ],
        { type: 'application/javascript' }
      );
      // Create the worker and link our process call to execute on
      // every message it posts
      const worker = new Worker(window.URL.createObjectURL(timerBlob));
      return worker;
    } catch (error) {
      // If blob: is not passed as a worker-src to csp, then the
      // worker timer will fail... therefore no support
    }
  }

  async start(delay: number, callback: () => void): Promise<void> {
    this.callback = callback;

    if (this.workerTimer) {
      this.workerTimer.onmessage = event => {
        this.lastTimeout = event.data;
        this.callback();
      };
      this.workerTimer.postMessage(delay);
    } else {
      this.lastTimeout = setTimeout(() => {
        this.callback();
      }, delay);
    }
  }

  async destroy(): Promise<void> {
    this.callback = undefined;
    if (this.lastTimeout) {
      clearTimeout(this.lastTimeout);
      this.lastTimeout = undefined;
    }
    if (this.workerTimer) {
      this.workerTimer.terminate();
      this.workerTimer = undefined;
    }
  }
}
