// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import ComputePressureMonitor from '../../src/statscollector/ComputePressureMonitor';

type PressureRecord = { source: 'cpu'; state: 'nominal' | 'fair' | 'serious' | 'critical' };
type PressureCallback = (records: PressureRecord[]) => void;

describe('ComputePressureMonitor', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpDebugLogger();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globalScope = globalThis as any;

  let savedPressureObserver: unknown;

  beforeEach(() => {
    savedPressureObserver = globalScope.PressureObserver;
  });

  afterEach(() => {
    if (savedPressureObserver === undefined) {
      delete globalScope.PressureObserver;
    } else {
      globalScope.PressureObserver = savedPressureObserver;
    }
  });

  function installFakeObserver(
    options: {
      observeBehavior?: 'resolve' | 'reject';
    } = {}
  ): {
    callback: () => PressureCallback;
    disconnectCount: () => number;
    disconnectThrows: (shouldThrow: boolean) => void;
  } {
    const { observeBehavior = 'resolve' } = options;
    let savedCallback: PressureCallback | undefined;
    let disconnectCount = 0;
    let disconnectShouldThrow = false;

    class FakePressureObserver {
      constructor(cb: PressureCallback) {
        savedCallback = cb;
      }
      observe(_source: string, _opts?: { sampleInterval?: number }): Promise<void> {
        if (observeBehavior === 'reject') {
          return Promise.reject(new Error('not allowed'));
        }
        return Promise.resolve();
      }
      unobserve(_source: string): void {}
      disconnect(): void {
        disconnectCount += 1;
        if (disconnectShouldThrow) {
          throw new Error('disconnect failed');
        }
      }
    }
    globalScope.PressureObserver = FakePressureObserver;
    return {
      callback: () => savedCallback,
      disconnectCount: () => disconnectCount,
      disconnectThrows: (shouldThrow: boolean) => {
        disconnectShouldThrow = shouldThrow;
      },
    };
  }

  it('reports null when PressureObserver is unavailable', async () => {
    delete globalScope.PressureObserver;
    const monitor = new ComputePressureMonitor(logger);
    await monitor.start();
    expect(monitor.currentState()).to.equal(null);
    monitor.stop();
  });

  it('returns null before any sample arrives', async () => {
    installFakeObserver();
    const monitor = new ComputePressureMonitor(logger);
    await monitor.start();
    expect(monitor.currentState()).to.equal(null);
    monitor.stop();
  });

  it('records every CPU pressure state', async () => {
    const handle = installFakeObserver();
    const monitor = new ComputePressureMonitor(logger, 250);
    await monitor.start();
    const cb = handle.callback();
    expect(cb).to.exist;

    cb([{ source: 'cpu', state: 'nominal' }]);
    expect(monitor.currentState()).to.equal('nominal');
    cb([{ source: 'cpu', state: 'fair' }]);
    expect(monitor.currentState()).to.equal('fair');
    cb([{ source: 'cpu', state: 'serious' }]);
    expect(monitor.currentState()).to.equal('serious');
    cb([{ source: 'cpu', state: 'critical' }]);
    expect(monitor.currentState()).to.equal('critical');
    monitor.stop();
  });

  it('ignores non-cpu pressure records', async () => {
    const handle = installFakeObserver();
    const monitor = new ComputePressureMonitor(logger);
    await monitor.start();
    const cb = handle.callback();
    cb([{ source: 'cpu', state: 'fair' }]);
    expect(monitor.currentState()).to.equal('fair');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cb([{ source: 'gpu' as any, state: 'critical' }]);
    expect(monitor.currentState()).to.equal('fair');
    monitor.stop();
  });

  it('is a no-op on repeated start() calls', async () => {
    const handle = installFakeObserver();
    const monitor = new ComputePressureMonitor(logger);
    await monitor.start();
    const firstCallback = handle.callback();
    await monitor.start();
    expect(handle.callback()).to.equal(firstCallback);
    monitor.stop();
  });

  it('handles observe() rejection by leaving the monitor disabled', async () => {
    installFakeObserver({ observeBehavior: 'reject' });
    const monitor = new ComputePressureMonitor(logger);
    await monitor.start();
    expect(monitor.currentState()).to.equal(null);
    monitor.stop();
  });

  it('disconnects on stop and clears state', async () => {
    const handle = installFakeObserver();
    const monitor = new ComputePressureMonitor(logger);
    await monitor.start();
    handle.callback()([{ source: 'cpu', state: 'serious' }]);
    expect(monitor.currentState()).to.equal('serious');
    monitor.stop();
    expect(handle.disconnectCount()).to.equal(1);
    expect(monitor.currentState()).to.equal(null);
  });

  it('is a no-op on repeated stop() calls', async () => {
    const handle = installFakeObserver();
    const monitor = new ComputePressureMonitor(logger);
    await monitor.start();
    monitor.stop();
    monitor.stop();
    expect(handle.disconnectCount()).to.equal(1);
  });

  it('swallows disconnect() errors', async () => {
    const handle = installFakeObserver();
    handle.disconnectThrows(true);
    const monitor = new ComputePressureMonitor(logger);
    await monitor.start();
    monitor.stop();
    expect(handle.disconnectCount()).to.equal(1);
    expect(monitor.currentState()).to.equal(null);
  });

  it('treats a non-function PressureObserver as missing', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    globalScope.PressureObserver = {} as any;
    const monitor = new ComputePressureMonitor(logger);
    await monitor.start();
    expect(monitor.currentState()).to.equal(null);
    monitor.stop();
  });
});
