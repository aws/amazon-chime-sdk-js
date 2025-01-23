// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import DefaultVideoElementResolutionMonitor from '../../src/videotile/DefaultVideoElementResolutionMonitor';
import { VideoElementResolutionObserver } from '../../src/videotile/VideoElementResolutionMonitor';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultVideoElementResolutionMonitor', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  let behavior: DOMMockBehavior;
  let domMockBuilder: DOMMockBuilder;
  let monitor: DefaultVideoElementResolutionMonitor;
  let mockVideoElement: HTMLVideoElement;
  let resizeCallback: (entries: ResizeObserverEntry[]) => void;

  beforeEach(() => {
    behavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(behavior);

    global.ResizeObserver = class MockResizeObserver {
      constructor(callback: (entries: ResizeObserverEntry[]) => void) {
        resizeCallback = callback;
      }
      observe(_target: Element): void {}
      unobserve(_target: Element): void {}
      disconnect(): void {}
    } as typeof ResizeObserver;

    // Mock HTMLVideoElement
    mockVideoElement = document.createElement('video') as HTMLVideoElement;
  });

  afterEach(() => {
    domMockBuilder.cleanup();
  });

  describe('constructor', () => {
    it('should initialize without video element', () => {
      monitor = new DefaultVideoElementResolutionMonitor();
      expect(monitor).to.not.equal(null);
    });

    it('should initialize with video element', () => {
      monitor = new DefaultVideoElementResolutionMonitor(mockVideoElement);
      expect(monitor).to.not.equal(null);
    });
  });

  describe('observer management', () => {
    let mockObserver: VideoElementResolutionObserver;
    let width: number;
    let height: number;

    beforeEach(() => {
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
  });
});
