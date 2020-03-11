// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import DefaultIdleMonitor from '../../src/idlemonitor/DefaultIdleMonitor';
import PingPong from '../../src/pingpong/PingPong';
import PingPongObserver from '../../src/pingpongobserver/PingPongObserver';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultIdleMonitor', () => {
  let expect: Chai.ExpectStatic;
  let maxIdleTimeMs: number;
  let domMockBuilder: DOMMockBuilder | null = null;

  class TestPingPong implements PingPong {
    addObserver(_observer: PingPongObserver): void {}

    removeObserver(_observer: PingPongObserver): void {}

    forEachObserver(_observerFunc: (_observer: PingPongObserver) => void): void {}

    start(): void {}

    stop(): void {}
  }

  beforeEach(() => {
    expect = chai.expect;
    domMockBuilder = new DOMMockBuilder();
    maxIdleTimeMs = 10;
  });

  after(() => {
    if (domMockBuilder) {
      domMockBuilder.cleanup();
      domMockBuilder = null;
    }
  });

  it('can be constructed', () => {
    const idleMonitor = new DefaultIdleMonitor(new TestPingPong(), maxIdleTimeMs);
    expect(idleMonitor).to.not.equal(null);
  });

  it('can add a PingPongObserver', () => {
    const idleMonitor = new DefaultIdleMonitor(new TestPingPong(), maxIdleTimeMs);
    const addPingPongObserverSpy = sinon.spy(idleMonitor, 'addToPingPongObserver');
    idleMonitor.addToPingPongObserver(new TestPingPong());
    expect(addPingPongObserverSpy.called).to.equal(true);
  });

  it('can receive a pong', () => {
    const idleMonitor = new DefaultIdleMonitor(new TestPingPong(), maxIdleTimeMs);
    const didReceivePongSpy = sinon.spy(idleMonitor, 'didReceivePong');
    idleMonitor.didReceivePong(0, 0, 0);
    expect(didReceivePongSpy.called).to.equal(true);
  });

  it('can stop a PingPong', () => {
    const idleMonitor = new DefaultIdleMonitor(new TestPingPong(), maxIdleTimeMs);
    const stopSpy = sinon.spy(idleMonitor, 'removeIdleMonitorObserver');
    idleMonitor.removeIdleMonitorObserver();
    expect(stopSpy.called).to.equal(true);
  });

  it('checks if the isIdle returns false when the canreceive is false ', () => {
    const idleMonitor = new DefaultIdleMonitor(new TestPingPong(), maxIdleTimeMs);
    //const isIdleSpy = sinon.spy(idleMonitor, 'isIdle');
    expect(idleMonitor.isIdle()).to.equal(false);
  });

  it('checks if the isIdle returns true when the canreceive is true', () => {
    const idleMonitor = new DefaultIdleMonitor(new TestPingPong(), maxIdleTimeMs);
    idleMonitor.didReceivePong(0, 0, 0);
    new TimeoutScheduler(50).start(() => {
      expect(idleMonitor.isIdle()).to.equal(true);
    });
  });
});
