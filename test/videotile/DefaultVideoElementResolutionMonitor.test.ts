// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

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

  beforeEach(() => {
    behavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(behavior);

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

      // Simulate resize event
      resizeCallback([
        {
          contentRect: { width: 1280, height: 720 },
        } as ResizeObserverEntry,
      ]);

      expect(width).to.equal(1280);
      expect(height).to.equal(720);

      monitor.removeObserver(mockObserver);
    });

    it('should bind and unbind video elements', () => {
      const videoElementFactory = new NoOpVideoElementFactory();
      const videoElement = videoElementFactory.create();
      expect(() => monitor.bindVideoElement(videoElement)).to.not.throw();
      expect(observeCalled).to.be.true;
      expect(unobserveCalled).to.be.false;
      observeCalled = false;
      unobserveCalled = false;
      expect(() => monitor.bindVideoElement(videoElement)).to.not.throw();
      expect(observeCalled).to.be.false;
      expect(unobserveCalled).to.be.false;
      observeCalled = false;
      unobserveCalled = false;
      const newVideoElement = videoElementFactory.create();
      expect(() => monitor.bindVideoElement(newVideoElement)).to.not.throw();
      expect(observeCalled).to.be.true;
      expect(unobserveCalled).to.be.true;
      observeCalled = false;
      unobserveCalled = false;
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
});
