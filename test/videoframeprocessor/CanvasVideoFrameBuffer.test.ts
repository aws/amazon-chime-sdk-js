// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import CanvasVideoFrameBuffer from '../../src/videoframeprocessor/CanvasVideoFrameBuffer';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('CanvasVideoFrameBuffer', () => {
  const assert: Chai.AssertStatic = chai.assert;
  const expect: Chai.ExpectStatic = chai.expect;
  let domMockBehavior: DOMMockBehavior;
  let domMockBuilder: DOMMockBuilder;

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
  });

  afterEach(() => {
    if (domMockBuilder) {
      domMockBuilder.cleanup();
    }
  });

  describe('construction', () => {
    it('can be constructed', () => {
      const canvasElement = document.createElement('canvas');
      assert.exists(new CanvasVideoFrameBuffer(canvasElement));
    });
  });

  describe('asCanvasImageSource', () => {
    it('can return CanvasImageSource', async () => {
      const canvasElement = document.createElement('canvas');
      const buffer = new CanvasVideoFrameBuffer(canvasElement);
      const source = await buffer.asCanvasImageSource();
      expect(source).to.equal(canvasElement);
    });
  });

  describe('asCanvasElement', () => {
    it('can return CanvasElement', () => {
      const canvasElement = document.createElement('canvas');
      const buffer = new CanvasVideoFrameBuffer(canvasElement);
      const source = buffer.asCanvasElement();
      expect(source).to.equal(canvasElement);
    });
  });

  describe('destroy', () => {
    it('can destroy canvas', async () => {
      const canvasElement = document.createElement('canvas');
      const buffer = new CanvasVideoFrameBuffer(canvasElement);
      const source = buffer.asCanvasElement();
      expect(source).to.equal(canvasElement);

      buffer.destroy();
      expect(buffer.asCanvasElement()).to.equal(null);
      try {
        await buffer.asCanvasImageSource();
        throw Error('not reachable');
      } catch (error) {}
    });
  });
});
