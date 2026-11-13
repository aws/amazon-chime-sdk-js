// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import VideoElementDisplay from '../../src/videotile/VideoElementDisplay';
import VideoElementObjectFit from '../../src/videotile/VideoElementObjectFit';

describe('VideoElementDisplay', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  const display = (
    boundingWidth: number,
    boundingHeight: number,
    isRendered: () => boolean,
    devicePixelRatio: () => number
  ): VideoElementDisplay =>
    new VideoElementDisplay({
      contentWidth: 640,
      contentHeight: 360,
      boundingWidth,
      boundingHeight,
      intersectionPercent: 60,
      objectFit: VideoElementObjectFit.Cover,
      intrinsicLayout: true,
      isRendered,
      devicePixelRatio,
    });

  it('keeps the values it is given', () => {
    const d = display(
      320,
      180,
      () => true,
      () => 1
    );
    expect(d).to.deep.include({
      contentWidth: 640,
      contentHeight: 360,
      boundingWidth: 320,
      boundingHeight: 180,
      intersectionPercent: 60,
      objectFit: VideoElementObjectFit.Cover,
      intrinsicLayout: true,
    });
  });

  it('reports the size in device pixels, rounded, with the ratio read on each call', () => {
    let ratio = 1.25;
    const d = display(
      640,
      360.4,
      () => true,
      () => ratio
    );
    expect([d.devicePixelWidth(), d.devicePixelHeight()]).to.deep.equal([800, 451]);
    ratio = 2;
    expect([d.devicePixelWidth(), d.devicePixelHeight()]).to.deep.equal([1280, 721]);
  });

  it('reports no size in device pixels for an empty box', () => {
    for (const [width, height] of [
      [0, 0],
      [0, 360],
      [640, 0],
    ]) {
      const d = display(
        width,
        height,
        () => true,
        () => 2
      );
      expect([d.devicePixelWidth(), d.devicePixelHeight()], `${width}x${height}`).to.deep.equal([
        undefined,
        undefined,
      ]);
    }
  });

  it('reports the intersection percent as visible only while the element is rendered, read on each call', () => {
    let rendered = true;
    const d = display(
      640,
      360,
      () => rendered,
      () => 1
    );
    expect(d.visiblePercent()).to.equal(60);
    rendered = false;
    expect(d.visiblePercent()).to.equal(0);
  });
});
