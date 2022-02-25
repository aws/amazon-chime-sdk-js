// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { IntervalScheduler } from 'amazon-chime-sdk-js';

function fillSMPTEColorBars(canvas: HTMLCanvasElement, xShift: number): void {
  const w = canvas.width;
  const h = canvas.height;
  const h1 = (h * 2) / 3;
  const h2 = (h * 3) / 4;
  const h3 = h;
  const top = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
  const middle = ['#0000c0', '#000000', '#c000c0', '#000000', '#00c0c0', '#000000', '#c0c0c0'];
  const bottom = [
    '#00214c',
    '#ffffff',
    '#32006a',
    '#131313',
    '#090909',
    '#131313',
    '#1d1d1d',
    '#131313',
  ];
  const bottomX = [
    w * 0,
    ((w * 1) / 4) * (5 / 7),
    ((w * 2) / 4) * (5 / 7),
    ((w * 3) / 4) * (5 / 7),
    w * (5 / 7),
    w * (5 / 7 + 1 / 21),
    w * (5 / 7 + 2 / 21),
    w * (6 / 7),
    w * 1,
  ];
  const segmentWidth = w / top.length;
  const ctx = canvas.getContext('2d');
  for (let i = 0; i < top.length; i++) {
    ctx.fillStyle = top[i];
    ctx.fillRect(xShift + i * segmentWidth, 0, segmentWidth, h1);
    ctx.fillStyle = middle[i];
    ctx.fillRect(xShift + i * segmentWidth, h1, segmentWidth, h2 - h1);
  }
  for (let i = 0; i < bottom.length; i++) {
    ctx.fillStyle = bottom[i];
    ctx.fillRect(xShift + bottomX[i], h2, bottomX[i + 1] - bottomX[i], h3 - h2);
  }
}

// This is a top-level function so that its captured environment is as small as possible,
// minimizing leaks -- the interval scheduler will cause everything here to be retained
// until it is stopped.
function makeColorBars(
  canvas: HTMLCanvasElement,
  colorOrPattern: string
): undefined | { listener: () => void; scheduler: IntervalScheduler; stream: MediaStream } {
  const scheduler = new IntervalScheduler(1000);
  const context = canvas.getContext('2d');

  // @ts-ignore
  const stream: MediaStream | null = canvas.captureStream(5) || null;
  if (!stream) {
    return undefined;
  }

  const onTick = (): void => {
    if (colorOrPattern === 'smpte') {
      fillSMPTEColorBars(canvas, 0);
    } else {
      context.fillStyle = colorOrPattern;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  scheduler.start(onTick);

  const listener = (): void => {
    scheduler.stop();
  };

  // This event listener will leak unless you remove it.
  stream.getVideoTracks()[0].addEventListener('ended', listener);

  return { listener, scheduler, stream };
}

export default class VideoHelper {
  static synthesizeVideoDevice(colorOrPattern: string): MediaStream | null {
    const canvas = document.createElement('canvas') as HTMLCanvasElement;
    canvas.width = 480;
    canvas.height = (canvas.width / 16) * 9;

    const colorBars = makeColorBars(canvas, colorOrPattern);

    if (!colorBars) {
      return null;
    }

    // `scheduler` and `listener` will leak.
    const { stream } = colorBars;

    return stream;
  }
}