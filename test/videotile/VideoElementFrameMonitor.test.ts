// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import VideoElementFrameMonitor from '../../src/videotile/VideoElementFrameMonitor';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('VideoElementFrameMonitor', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  let domMockBuilder: DOMMockBuilder;
  let clock: sinon.SinonFakeTimers;
  let monitor: VideoElementFrameMonitor;

  // Video frame callback mock helpers
  let videoFrameCallbacks: Map<number, (now: number, metadata: object) => void>;
  let videoFrameCallbackNextId: number;

  interface MockVideoElement {
    id: string;
    videoWidth: number;
    videoHeight: number;
    requestVideoFrameCallback?: (cb: (now: number, metadata: object) => void) => number;
    cancelVideoFrameCallback?: (id: number) => void;
    addEventListener: (event: string, cb: Function) => void;
    removeEventListener: (event: string, cb: Function) => void;
    _listeners?: Map<string, Function[]>;
  }

  function createVideoElement(): HTMLVideoElement {
    videoFrameCallbacks = new Map();
    videoFrameCallbackNextId = 1;
    const el: MockVideoElement = {
      id: 'test-video',
      videoWidth: 400,
      videoHeight: 300,
      requestVideoFrameCallback: (cb: (now: number, metadata: object) => void): number => {
        const id = videoFrameCallbackNextId++;
        videoFrameCallbacks.set(id, cb);
        return id;
      },
      cancelVideoFrameCallback: (id: number): void => {
        videoFrameCallbacks.delete(id);
      },
      addEventListener: (): void => {},
      removeEventListener: (): void => {},
    };
    return el as unknown as HTMLVideoElement;
  }

  function createVideoElementWithoutVideoFrameCallback(): HTMLVideoElement & {
    _listeners: Map<string, Function[]>;
  } {
    const listeners: Map<string, Function[]> = new Map();
    const el: MockVideoElement = {
      id: 'test-video-no-vfc',
      videoWidth: 400,
      videoHeight: 300,
      addEventListener: (event: string, cb: Function): void => {
        if (!listeners.has(event)) listeners.set(event, []);
        listeners.get(event).push(cb);
      },
      removeEventListener: (event: string, cb: Function): void => {
        const cbs = listeners.get(event);
        if (cbs) {
          const idx = cbs.indexOf(cb);
          if (idx >= 0) cbs.splice(idx, 1);
        }
      },
      _listeners: listeners,
    };
    return el as unknown as HTMLVideoElement & { _listeners: Map<string, Function[]> };
  }

  function fireVideoFrameCallbacks(): void {
    const cbs = new Map(videoFrameCallbacks);
    videoFrameCallbacks.clear();
    for (const [, cb] of cbs) {
      cb(performance.now(), { expectedDisplayTime: 123.456 });
    }
  }

  beforeEach(() => {
    domMockBuilder = new DOMMockBuilder(new DOMMockBehavior());
    clock = sinon.useFakeTimers({ now: 1000 });
    monitor = new VideoElementFrameMonitor();
  });

  afterEach(() => {
    monitor.stop();
    domMockBuilder.cleanup();
    clock.restore();
  });

  describe('first frame detection with requestVideoFrameCallback', () => {
    it('fires firstVideoElementFrameDidRender with metadata', () => {
      const el = createVideoElement();
      let receivedMetadata: object | undefined;
      monitor.start(el, {
        firstVideoElementFrameDidRender: metadata => {
          receivedMetadata = metadata;
        },
      });
      expect(videoFrameCallbacks.size).to.equal(1);
      fireVideoFrameCallbacks();
      expect(receivedMetadata).to.not.be.undefined;
      expect((receivedMetadata as { expectedDisplayTime: number }).expectedDisplayTime).to.equal(
        123.456
      );
    });

    it('does not fire first frame twice', () => {
      const el = createVideoElement();
      let callCount = 0;
      monitor.start(el, {
        firstVideoElementFrameDidRender: () => {
          callCount++;
        },
      });
      fireVideoFrameCallbacks();
      fireVideoFrameCallbacks(); // metrics callback, not first frame
      expect(callCount).to.equal(1);
    });

    it('cancels video frame callback on stop before callback fires', () => {
      const el = createVideoElement();
      let callCount = 0;
      monitor.start(el, {
        firstVideoElementFrameDidRender: () => {
          callCount++;
        },
      });
      monitor.stop();
      fireVideoFrameCallbacks();
      expect(callCount).to.equal(0);
    });
  });

  describe('first frame detection with resize fallback', () => {
    it('fires on resize when videoWidth > 0', () => {
      const el = createVideoElementWithoutVideoFrameCallback();
      let fired = false;
      monitor.start(el, {
        firstVideoElementFrameDidRender: () => {
          fired = true;
        },
      });
      const resizeListeners =
        (el as unknown as { _listeners: Map<string, Function[]> })._listeners.get('resize') || [];
      expect(resizeListeners.length).to.be.greaterThan(0);
      resizeListeners[0]();
      expect(fired).to.be.true;
    });

    it('does not fire if videoWidth is 0', () => {
      const el = createVideoElementWithoutVideoFrameCallback();
      Object.defineProperty(el, 'videoWidth', { value: 0, writable: true });
      Object.defineProperty(el, 'videoHeight', { value: 0, writable: true });
      let fired = false;
      monitor.start(el, {
        firstVideoElementFrameDidRender: () => {
          fired = true;
        },
      });
      const resizeListeners = el._listeners.get('resize') || [];
      resizeListeners[0]();
      expect(fired).to.be.false;
    });

    it('removes resize listener on stop', () => {
      const el = createVideoElementWithoutVideoFrameCallback();
      monitor.start(el, {});
      const before = (el._listeners.get('resize') || []).length;
      monitor.stop();
      const after = (el._listeners.get('resize') || []).length;
      expect(after).to.be.lessThan(before);
    });

    it('does not start metrics tracking without requestVideoFrameCallback', () => {
      const el = createVideoElementWithoutVideoFrameCallback();
      let metricsCount = 0;
      monitor.start(el, {
        firstVideoElementFrameDidRender: () => {},
        videoElementFrameMetricsDidReceive: () => {
          metricsCount++;
        },
      });
      const resizeListeners = el._listeners.get('resize') || [];
      resizeListeners[0]();
      clock.tick(2000);
      expect(metricsCount).to.equal(0);
    });
  });

  describe('metrics tracking', () => {
    it('reports metrics after 1 second of frames', () => {
      const el = createVideoElement();
      let reportedFps: number | undefined;
      monitor.start(el, {
        firstVideoElementFrameDidRender: () => {},
        videoElementFrameMetricsDidReceive: metrics => {
          reportedFps = metrics.fps;
        },
      });
      fireVideoFrameCallbacks(); // first frame
      for (let i = 0; i < 15; i++) {
        clock.tick(67);
        fireVideoFrameCallbacks();
      }
      expect(reportedFps).to.not.be.undefined;
      expect(reportedFps).to.be.greaterThan(0);
    });

    it('stops metrics tracking on stop', () => {
      const el = createVideoElement();
      let metricsCount = 0;
      monitor.start(el, {
        firstVideoElementFrameDidRender: () => {},
        videoElementFrameMetricsDidReceive: () => {
          metricsCount++;
        },
      });
      fireVideoFrameCallbacks(); // first frame
      monitor.stop();
      for (let i = 0; i < 30; i++) {
        clock.tick(67);
        fireVideoFrameCallbacks();
      }
      expect(metricsCount).to.equal(0);
    });
  });

  describe('start/stop lifecycle', () => {
    it('stop is safe when not started', () => {
      monitor.stop(); // should not throw
    });

    it('start replaces previous monitoring', () => {
      const el1 = createVideoElement();
      let count1 = 0;
      monitor.start(el1, {
        firstVideoElementFrameDidRender: () => {
          count1++;
        },
      });
      const el2 = createVideoElement();
      let count2 = 0;
      monitor.start(el2, {
        firstVideoElementFrameDidRender: () => {
          count2++;
        },
      });
      fireVideoFrameCallbacks();
      expect(count1).to.equal(0);
      expect(count2).to.equal(1);
    });

    it('does not crash when observer has no optional methods', () => {
      const el = createVideoElement();
      monitor.start(el, {});
      fireVideoFrameCallbacks(); // first frame — no firstVideoElementFrameDidRender
      for (let i = 0; i < 15; i++) {
        clock.tick(67);
        fireVideoFrameCallbacks(); // metrics — no videoElementFrameMetricsDidReceive
      }
      // Should not throw
    });

    it('onFirstFrame guard prevents double firing', () => {
      const el = createVideoElement();
      let count = 0;
      monitor.start(el, {
        firstVideoElementFrameDidRender: () => {
          count++;
        },
      });
      fireVideoFrameCallbacks(); // triggers onFirstFrame
      // @ts-ignore: access private method to test guard
      monitor.onFirstFrame(); // should be no-op
      expect(count).to.equal(1);
    });

    it('scheduleMetricsCallback is no-op after stop', () => {
      const el = createVideoElement();
      monitor.start(el, {});
      fireVideoFrameCallbacks(); // first frame, starts metrics
      monitor.stop();
      // @ts-ignore: access private method to test guard
      monitor.scheduleMetricsCallback(); // element is null, should be no-op
    });

    it('onFirstFrame is safe when observer is null', () => {
      const el = createVideoElement();
      monitor.start(el, {});
      monitor.stop(); // clears observer
      // @ts-ignore: access private to test null observer path
      monitor.firstFrameRendered = false;
      // @ts-ignore
      monitor.onFirstFrame(); // observer is null, should not throw
    });
  });
});
