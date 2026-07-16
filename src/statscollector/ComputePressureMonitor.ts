// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';

// The Compute Pressure API
// (https://developer.mozilla.org/en-US/docs/Web/API/Compute_Pressure_API) is not
// yet in lib.dom.d.ts, so the browser PressureObserver is accessed untyped.
export type PressureState = 'nominal' | 'fair' | 'serious' | 'critical';

/**
 * Wraps the browser Compute Pressure API to expose the latest CPU pressure
 * state. Returns `null` from {@link currentState} when the API is unavailable
 * or no sample has been received yet. Callers are responsible for any encoding
 * (e.g. into a metric value).
 */
export default class ComputePressureMonitor {
  private static readonly DEFAULT_SAMPLE_INTERVAL_MS = 1000;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private observer: any = null;
  private latestState: PressureState | null = null;

  constructor(
    private logger: Logger,
    private sampleIntervalMs: number = ComputePressureMonitor.DEFAULT_SAMPLE_INTERVAL_MS
  ) {}

  /**
   * Begins observing CPU pressure. Safe to call when the API is unavailable;
   * in that case it logs a debug message and does nothing.
   */
  async start(): Promise<void> {
    if (this.observer) {
      return;
    }
    const ctor = this.getPressureObserverCtor();
    if (!ctor) {
      this.logger.debug(() => 'PressureObserver is not available; CPU pressure metric disabled');
      return;
    }
    if (!this.isComputePressureAllowed()) {
      this.logger.debug(
        () => 'compute-pressure is not allowed in this document; CPU pressure metric disabled'
      );
      return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.observer = new ctor((records: any[]) => {
        for (const record of records) {
          // The Compute Pressure spec only defines 'cpu' today; ignore any
          // other source so we never mislabel it as CPU pressure.
          if (record.source === 'cpu') {
            this.latestState = record.state as PressureState;
          }
        }
      });
      await this.observer.observe('cpu', { sampleInterval: this.sampleIntervalMs });
    } catch (e) {
      this.logger.warn(`Failed to observe CPU pressure: ${e && (e as Error).message}`);
      this.observer = null;
    }
  }

  stop(): void {
    if (!this.observer) {
      return;
    }
    try {
      this.observer.disconnect();
    } catch (e) {
      this.logger.warn(`PressureObserver disconnect failed: ${e && (e as Error).message}`);
    }
    this.observer = null;
    this.latestState = null;
  }

  /**
   * Returns the latest observed CPU pressure state, or `null` if no sample has
   * been observed yet.
   */
  currentState(): PressureState | null {
    return this.latestState;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getPressureObserverCtor(): any {
    /* istanbul ignore next */
    if (typeof globalThis === 'undefined') {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctor = (globalThis as any).PressureObserver;
    return typeof ctor === 'function' ? ctor : null;
  }

  private isComputePressureAllowed(): boolean {
    /* istanbul ignore next */
    if (typeof document === 'undefined') {
      return true;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const featurePolicy = (document as any).featurePolicy;
    if (featurePolicy && typeof featurePolicy.allowsFeature === 'function') {
      return featurePolicy.allowsFeature('compute-pressure');
    }
    return true;
  }
}
