// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import NoOpVideoElementFactory from '../../src/videoelementfactory/NoOpVideoElementFactory';
import DefaultVideoElementResolutionMonitor from '../../src/videotile/DefaultVideoElementResolutionMonitor';
import { VideoElementResolutionObserver } from '../../src/videotile/VideoElementResolutionMonitor';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultVideoElementResolutionMonitor', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  let behavior: DOMMockBehavior;
  let domMockBuilder: DOMMockBuilder;
  let monitor: DefaultVideoElementResolutionMonitor;
  let resizeCallback: (entries: ResizeObserverEntry[]) => void;
  let observeCalled = false;
  let unobserveCalled = false;
  let clock: sinon.SinonFakeTimers;

  // Track requestVideoFrameCallback registrations
  let videoFrameCallbacks: Map<number, (now: number, metadata: object) => void>;
  let videoFrameCallbackNextId: number;

  interface MockVideoElement extends HTMLVideoElement {
    _listeners?: Map<string, Function[]>;
  }

  function createVideoElement(): MockVideoElement {
    const factory = new NoOpVideoElementFactory();
    const el = factory.create() as MockVideoElement;
    videoFrameCallbacks = new Map();
    videoFrameCallbackNextId = 1;
    // Override with working requestVideoFrameCallback
    el.requestVideoFrameCallback = (
      cb: (now: number, metadata: VideoFrameCallbackMetadata) => void
    ): number => {
      const id = videoFrameCallbackNextId++;
      videoFrameCallbacks.set(id, cb as (now: number, metadata: object) => void);
      return id;
    };
    el.cancelVideoFrameCallback = (id: number): void => {
      videoFrameCallbacks.delete(id);
    };
    el.id = 'test-video';
    return el;
  }

  function createVideoElementWithoutVideoFrameCallback(): MockVideoElement {
    const factory = new NoOpVideoElementFactory();
    const el = factory.create() as MockVideoElement;
    delete (el as { requestVideoFrameCallback?: unknown }).requestVideoFrameCallback;
    delete (el as { cancelVideoFrameCallback?: unknown }).cancelVideoFrameCallback;
    el.id = 'test-video-no-vfc';
    // Track resize event listeners
    const listeners: Map<string, Function[]> = new Map();
    el.addEventListener = (event: string, cb: unknown): void => {
      if (!listeners.has(event)) listeners.set(event, []);
      listeners.get(event).push(cb as Function);
    };
    el.removeEventListener = (event: string, cb: unknown): void => {
      const cbs = listeners.get(event);
      if (cbs) {
        const idx = cbs.indexOf(cb as Function);
        if (idx >= 0) cbs.splice(idx, 1);
      }
    };
    el._listeners = listeners;
    return el;
  }

  // Fire all pending video frame callbacks
  function fireVideoFrameCallbacks(): void {
    const cbs = new Map(videoFrameCallbacks);
    videoFrameCallbacks.clear();
    for (const [, cb] of cbs) {
      cb(performance.now(), { captureTime: 100 });
    }
  }

  beforeEach(() => {
    behavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(behavior);
    clock = sinon.useFakeTimers({ now: 1000 });
    observeCalled = false;
    unobserveCalled = false;

    global.ResizeObserver = class MockResizeObserver {
      constructor(callback: (entries: ResizeObserverEntry[]) => void) {
        resizeCallback = callback;
      }
      observe(_target: Element): void {
        observeCalled = true;
      }
      unobserve(_target: Element): void {
        unobserveCalled = true;
      }
      disconnect(): void {}
    } as typeof ResizeObserver;
  });

  afterEach(() => {
    domMockBuilder.cleanup();
    clock.restore();
  });

  describe('constructor', () => {
    it('should initialize without video element', () => {
      monitor = new DefaultVideoElementResolutionMonitor();
      expect(monitor).to.not.equal(null);
    });
  });

  describe('observer management', () => {
    let mockObserver: VideoElementResolutionObserver;
    let width: number;
    let height: number;

    beforeEach(() => {
      observeCalled = false;
      unobserveCalled = false;
      monitor = new DefaultVideoElementResolutionMonitor();
      mockObserver = {
        videoElementResolutionChanged: (newWidth: number, newHeight: number): void => {
          width = newWidth;
          height = newHeight;
        },
      };
    });

    it('should register and remove an observer', () => {
      monitor.registerObserver(mockObserver);
      resizeCallback([{ contentRect: { width: 1280, height: 720 } } as ResizeObserverEntry]);
      expect(width).to.equal(1280);
      expect(height).to.equal(720);
      monitor.removeObserver(mockObserver);
    });

    it('should bind and unbind video elements', () => {
      const videoElement = createVideoElement();
      expect(() => monitor.bindVideoElement(videoElement)).to.not.throw();
      expect(observeCalled).to.be.true;
      expect(unobserveCalled).to.be.false;
      observeCalled = false;
      unobserveCalled = false;
      // Same element — no-op
      expect(() => monitor.bindVideoElement(videoElement)).to.not.throw();
      expect(observeCalled).to.be.false;
      expect(unobserveCalled).to.be.false;
      observeCalled = false;
      unobserveCalled = false;
      // Different element
      const newVideoElement = createVideoElement();
      expect(() => monitor.bindVideoElement(newVideoElement)).to.not.throw();
      expect(observeCalled).to.be.true;
      expect(unobserveCalled).to.be.true;
      observeCalled = false;
      unobserveCalled = false;
      // Null
      expect(() => monitor.bindVideoElement(null)).to.not.throw();
      expect(observeCalled).to.be.false;
      expect(unobserveCalled).to.be.true;
    });

    it('should skip unobserve if no element is being observed', () => {
      expect(() => monitor.bindVideoElement(null)).to.not.throw();
      expect(observeCalled).to.be.false;
      expect(unobserveCalled).to.be.false;
    });
  });

  describe('first frame detection with requestVideoFrameCallback', () => {
    it('fires videoElementFirstFrameDidRender on first frame', () => {
      monitor = new DefaultVideoElementResolutionMonitor();
      const el = createVideoElement();
      let renderedMetadata: object | undefined;
      monitor.registerObserver({
        videoElementResolutionChanged: () => {},
        videoElementFirstFrameDidRender: (metadata?: object) => {
          renderedMetadata = metadata;
        },
      });
      monitor.bindVideoElement(el);
      expect(videoFrameCallbacks.size).to.equal(1);
      fireVideoFrameCallbacks();
      expect(renderedMetadata).to.not.be.undefined;
    });

    it('does not fire first frame twice', () => {
      monitor = new DefaultVideoElementResolutionMonitor();
      const el = createVideoElement();
      let callCount = 0;
      monitor.registerObserver({
        videoElementResolutionChanged: () => {},
        videoElementFirstFrameDidRender: () => {
          callCount++;
        },
      });
      monitor.bindVideoElement(el);
      fireVideoFrameCallbacks(); // first frame
      // Metrics tracking registers another callback
      fireVideoFrameCallbacks(); // second frame — should not fire first frame again
      expect(callCount).to.equal(1);
    });

    it('stops first frame detection when element is unbound', () => {
      monitor = new DefaultVideoElementResolutionMonitor();
      const el = createVideoElement();
      let callCount = 0;
      monitor.registerObserver({
        videoElementResolutionChanged: () => {},
        videoElementFirstFrameDidRender: () => {
          callCount++;
        },
      });
      monitor.bindVideoElement(el);
      monitor.bindVideoElement(null); // unbind before callback fires
      fireVideoFrameCallbacks(); // should not fire
      expect(callCount).to.equal(0);
    });

    it('resets first frame detection on rebind', () => {
      monitor = new DefaultVideoElementResolutionMonitor();
      const el = createVideoElement();
      let callCount = 0;
      monitor.registerObserver({
        videoElementResolutionChanged: () => {},
        videoElementFirstFrameDidRender: () => {
          callCount++;
        },
      });
      monitor.bindVideoElement(el);
      fireVideoFrameCallbacks();
      expect(callCount).to.equal(1);
      // Rebind to new element
      const el2 = createVideoElement();
      monitor.bindVideoElement(el2);
      fireVideoFrameCallbacks();
      expect(callCount).to.equal(2);
    });
  });

  describe('first frame detection with resize fallback', () => {
    it('fires on resize when videoWidth > 0', () => {
      monitor = new DefaultVideoElementResolutionMonitor();
      const el = createVideoElementWithoutVideoFrameCallback();
      let fired = false;
      monitor.registerObserver({
        videoElementResolutionChanged: () => {},
        videoElementFirstFrameDidRender: () => {
          fired = true;
        },
      });
      monitor.bindVideoElement(el);
      const resizeListeners = el._listeners.get('resize') || [];
      expect(resizeListeners.length).to.be.greaterThan(0);
      resizeListeners[0]();
      expect(fired).to.be.true;
    });

    it('does not fire resize if videoWidth is 0', () => {
      monitor = new DefaultVideoElementResolutionMonitor();
      const el = createVideoElementWithoutVideoFrameCallback();
      Object.defineProperty(el, 'videoWidth', { value: 0, writable: true });
      Object.defineProperty(el, 'videoHeight', { value: 0, writable: true });
      let fired = false;
      monitor.registerObserver({
        videoElementResolutionChanged: () => {},
        videoElementFirstFrameDidRender: () => {
          fired = true;
        },
      });
      monitor.bindVideoElement(el);
      const resizeListeners = el._listeners.get('resize') || [];
      resizeListeners[0]();
      expect(fired).to.be.false;
    });

    it('stops resize listener on unbind', () => {
      monitor = new DefaultVideoElementResolutionMonitor();
      const el = createVideoElementWithoutVideoFrameCallback();
      monitor.registerObserver({
        videoElementResolutionChanged: () => {},
      });
      monitor.bindVideoElement(el);
      monitor.bindVideoElement(null);
      // Listener should have been removed
    });

    it('does not crash when observer lacks optional frame callbacks', async () => {
      monitor = new DefaultVideoElementResolutionMonitor();
      const el = createVideoElement();
      monitor.registerObserver({
        videoElementResolutionChanged: () => {},
      });
      monitor.bindVideoElement(el);
      // Fire first frame — observer has no videoElementFirstFrameDidRender
      fireVideoFrameCallbacks();
      // Fire metrics — observer has no videoElementMetricsDidReceive
      for (let i = 0; i < 15; i++) {
        clock.tick(67);
        fireVideoFrameCallbacks();
      }
      // Should not throw
    });
  });

  describe('metrics tracking', () => {
    it('reports metrics after 1 second of frames', () => {
      monitor = new DefaultVideoElementResolutionMonitor();
      const el = createVideoElement();
      let reportedFps: number | undefined;
      monitor.registerObserver({
        videoElementResolutionChanged: () => {},
        videoElementFirstFrameDidRender: () => {},
        videoElementMetricsDidReceive: metrics => {
          reportedFps = metrics.fps;
        },
      });
      monitor.bindVideoElement(el);
      // Fire first frame
      fireVideoFrameCallbacks();
      // Now metrics tracking is active — simulate frames over 1 second
      for (let i = 0; i < 15; i++) {
        clock.tick(67); // ~15fps
        fireVideoFrameCallbacks();
      }
      expect(reportedFps).to.not.be.undefined;
      expect(reportedFps).to.be.greaterThan(0);
    });

    it('stops metrics tracking on unbind', () => {
      monitor = new DefaultVideoElementResolutionMonitor();
      const el = createVideoElement();
      let metricsCount = 0;
      monitor.registerObserver({
        videoElementResolutionChanged: () => {},
        videoElementFirstFrameDidRender: () => {},
        videoElementMetricsDidReceive: () => {
          metricsCount++;
        },
      });
      monitor.bindVideoElement(el);
      fireVideoFrameCallbacks(); // first frame
      monitor.bindVideoElement(null); // unbind stops metrics tracking
      // No more callbacks should fire
      for (let i = 0; i < 30; i++) {
        clock.tick(67);
        fireVideoFrameCallbacks();
      }
      expect(metricsCount).to.equal(0);
    });

    it('does not start metrics tracking without requestVideoFrameCallback', () => {
      monitor = new DefaultVideoElementResolutionMonitor();
      const el = createVideoElementWithoutVideoFrameCallback();
      let metricsCount = 0;
      monitor.registerObserver({
        videoElementResolutionChanged: () => {},
        videoElementFirstFrameDidRender: () => {},
        videoElementMetricsDidReceive: () => {
          metricsCount++;
        },
      });
      monitor.bindVideoElement(el);
      // Trigger first frame via resize
      const resizeListeners = el._listeners.get('resize') || [];
      resizeListeners[0]?.();
      clock.tick(2000);
      expect(metricsCount).to.equal(0);
    });
  });
});
