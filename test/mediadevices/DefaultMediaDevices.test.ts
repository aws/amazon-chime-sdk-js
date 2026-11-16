// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import DefaultMediaDevices from '../../src/mediadevices/DefaultMediaDevices';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultMediaDevices', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  let domMockBuilder: DOMMockBuilder;

  beforeEach(() => {
    domMockBuilder = new DOMMockBuilder(new DOMMockBehavior());
  });

  afterEach(() => {
    domMockBuilder.cleanup();
  });

  it('calls the browser getUserMedia and enumerateDevices', async () => {
    const getUserMedia = sinon.spy(navigator.mediaDevices, 'getUserMedia');
    const enumerateDevices = sinon.spy(navigator.mediaDevices, 'enumerateDevices');
    const devices = new DefaultMediaDevices();
    await devices.getUserMedia({ audio: true });
    await devices.enumerateDevices();
    expect(getUserMedia.calledOnceWith({ audio: true })).to.be.true;
    expect(enumerateDevices.calledOnce).to.be.true;
  });
});
