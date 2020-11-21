// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import MessagingSessionConfiguration from '../../src/messagingsession/MessagingSessionConfiguration';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('MessagingSessionConfiguration', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const domMockBehavior = new DOMMockBehavior();
  let domMockBuilder: DOMMockBuilder;

  beforeEach(() => {
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
  });

  afterEach(() => {
    if (domMockBuilder) {
      domMockBuilder.cleanup();
      domMockBuilder = null;
    }
  });

  it('Can create a configuration with sessionId', () => {
    const configuration = new MessagingSessionConfiguration(
      'userArn',
      'sessionId',
      'testUrl',
      {},
      {}
    );
    expect(configuration.messagingSessionId).to.be.eq('sessionId');
  });

  it('Generate sessionId if null is passed in', () => {
    const configuration = new MessagingSessionConfiguration('userArn', null, 'testUrl', {}, {});
    expect(configuration.messagingSessionId).to.be.not.null;
  });
});
