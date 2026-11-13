// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import StandardStrategy from '../../src/strategies/StandardStrategy';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('StandardStrategy', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  let domMockBuilder: DOMMockBuilder;
  let strategy: StandardStrategy;

  beforeEach(() => {
    domMockBuilder = new DOMMockBuilder(new DOMMockBehavior());
    strategy = new StandardStrategy();
  });

  afterEach(() => {
    domMockBuilder.cleanup();
  });

  it('creates a native peer connection', () => {
    expect(strategy.createPeerConnection({})).to.be.instanceOf(RTCPeerConnection);
  });

  it('calls the browser getUserMedia', async () => {
    const spy = sinon.spy(navigator.mediaDevices, 'getUserMedia');
    await strategy.getUserMedia({ audio: true });
    expect(spy.calledOnceWith({ audio: true })).to.be.true;
  });

  it('calls the browser enumerateDevices', async () => {
    const spy = sinon.spy(navigator.mediaDevices, 'enumerateDevices');
    await strategy.enumerateDevices();
    expect(spy.calledOnce).to.be.true;
  });
});
