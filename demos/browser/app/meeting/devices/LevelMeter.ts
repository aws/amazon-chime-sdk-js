// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export interface LevelSource {
  fftSize: number;
  getByteTimeDomainData(data: Uint8Array): void;
}

/** Log scale so speech fills the bar. */
export function levelPercent(data: Uint8Array): number {
  const lowest = 0.01;
  let max = lowest;
  for (const sample of data) {
    max = Math.max(max, Math.abs(sample - 128) / 128);
  }
  const normalized = (Math.log(lowest) - Math.log(max)) / Math.log(lowest);
  return Math.min(Math.max(normalized * 100, 0), 100);
}

/** One animation-frame loop at a time: attaching a new source stops the previous loop. */
export default class LevelMeter {
  private generation = 0;

  constructor(private readonly bars: () => HTMLElement[]) {}

  attach(source: LevelSource): void {
    const generation = ++this.generation;
    const data = new Uint8Array(source.fftSize);
    let frame = 0;
    const tick = (): void => {
      if (generation !== this.generation) {
        return;
      }
      // Every other frame is plenty for a level bar.
      if (frame === 0) {
        source.getByteTimeDomainData(data);
        this.set(levelPercent(data));
      }
      frame = (frame + 1) % 2;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  detach(): void {
    this.generation += 1;
    this.set(0);
  }

  private set(percent: number): void {
    for (const bar of this.bars()) {
      bar.style.width = `${percent}%`;
    }
  }
}
