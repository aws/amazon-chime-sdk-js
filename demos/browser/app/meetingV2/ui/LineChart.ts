// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { el } from './dom';

const SVG = 'http://www.w3.org/2000/svg';
const WIDTH = 240;
const HEIGHT = 64;

/** The smallest of 1, 2, 5 x 10^n at or above `value`, so the axis reads in round numbers. */
export function niceMax(value: number, floor: number): number {
  const target = Math.max(value, floor);
  const magnitude = 10 ** Math.floor(Math.log10(target));
  for (const step of [1, 2, 5, 10]) {
    if (step * magnitude >= target) {
      return step * magnitude;
    }
  }
  return 10 * magnitude;
}

/**
 * SVG path for one series scaled into the chart box; a missing sample breaks the line, so a gap
 * in the data shows as a gap rather than a slope.
 */
export function seriesPath(values: (number | undefined)[], capacity: number, max: number): string {
  const step = WIDTH / Math.max(1, capacity - 1);
  const offset = capacity - values.length;
  let path = '';
  let drawing = false;
  values.forEach((value, index) => {
    if (value === undefined || !Number.isFinite(value)) {
      drawing = false;
      return;
    }
    const x = (offset + index) * step;
    const y = HEIGHT - (Math.min(value, max) / max) * HEIGHT;
    path += `${drawing ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
    drawing = true;
  });
  return path;
}

export interface ChartSeries {
  label: string;
}

/**
 * A small live line chart: the last `capacity` samples of a few series, an axis maximum in round
 * numbers, and a legend with the latest values. Samples are kept while hidden; drawing happens
 * only when the chart is on screen.
 */
export default class LineChart {
  readonly element: HTMLElement;
  private readonly samples: (number | undefined)[][];
  private readonly paths: SVGPathElement[];
  private readonly values: HTMLElement[];
  private readonly maxLabel = el('span', { class: 'chart-max' });
  private readonly svg: SVGSVGElement;

  constructor(
    private readonly title: string,
    private readonly unit: string,
    private readonly series: ChartSeries[],
    /** Axis maximum never drops below this, so a quiet line does not fill the chart. */
    private readonly floor: number,
    private readonly capacity = 60
  ) {
    this.samples = series.map(() => []);
    this.svg = document.createElementNS(SVG, 'svg');
    this.svg.setAttribute('viewBox', `0 0 ${WIDTH} ${HEIGHT}`);
    this.svg.setAttribute('preserveAspectRatio', 'none');
    this.svg.setAttribute('class', 'chart-plot');
    this.svg.setAttribute('role', 'img');
    for (const y of [HEIGHT / 2]) {
      const grid = document.createElementNS(SVG, 'line');
      grid.setAttribute('x1', '0');
      grid.setAttribute('x2', String(WIDTH));
      grid.setAttribute('y1', String(y));
      grid.setAttribute('y2', String(y));
      grid.setAttribute('class', 'chart-grid');
      this.svg.appendChild(grid);
    }
    this.paths = series.map((_, index) => {
      const path = document.createElementNS(SVG, 'path');
      path.setAttribute('class', `chart-line chart-series-${index}`);
      this.svg.appendChild(path);
      return path;
    });
    this.values = series.map(() => el('span', { class: 'chart-value' }));
    this.element = el(
      'figure',
      { class: 'chart' },
      el(
        'figcaption',
        { class: 'chart-header' },
        el('span', { class: 'chart-title', text: `${title} (${unit})` }),
        this.maxLabel
      ),
      el('div', { class: 'chart-body' }, this.svg),
      el(
        'div',
        { class: 'chart-legend' },
        ...series.map((entry, index) =>
          el(
            'span',
            { class: 'chart-legend-item' },
            el('span', { class: `chart-swatch chart-series-${index}`, 'aria-hidden': 'true' }),
            el('span', { text: entry.label }),
            this.values[index]
          )
        )
      )
    );
  }

  push(values: (number | undefined)[]): void {
    this.series.forEach((_, index) => {
      const samples = this.samples[index];
      samples.push(values[index]);
      if (samples.length > this.capacity) {
        samples.shift();
      }
    });
    if (this.element.isConnected && this.element.offsetParent !== null) {
      this.render();
    }
  }

  render(): void {
    const all = this.samples
      .flat()
      .filter((v): v is number => v !== undefined && Number.isFinite(v));
    const max = niceMax(all.length > 0 ? Math.max(...all) : 0, this.floor);
    this.maxLabel.textContent = `${LineChart.format(max)} max`;
    const spoken: string[] = [];
    this.series.forEach((entry, index) => {
      const samples = this.samples[index];
      this.paths[index].setAttribute('d', seriesPath(samples, this.capacity, max));
      const latest = samples[samples.length - 1];
      const text = latest === undefined ? '–' : LineChart.format(latest);
      this.values[index].textContent = text;
      spoken.push(`${entry.label} ${text}`);
    });
    this.svg.setAttribute('aria-label', `${this.title}, ${this.unit}: ${spoken.join(', ')}`);
  }

  private static format(value: number): string {
    return value >= 100 ? String(Math.round(value)) : String(Math.round(value * 10) / 10);
  }
}
