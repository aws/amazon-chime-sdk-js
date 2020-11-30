// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect } from 'chai';

import LoggerAdapter from '../../src/voicefocus/LoggerAdapter';
import { MockLogger } from './MockLogger';

describe('LoggerAdapter', () => {
  it('can be instantiated', () => {
    const logger = new MockLogger();
    const adapter = new LoggerAdapter(logger);
    expect(logger).to.exist;
    expect(adapter).to.exist;
  });

  it('calls through', () => {
    const logger = new MockLogger();
    const adapter = new LoggerAdapter(logger);

    expect(logger.warn.notCalled).to.be.true;
    expect(logger.debug.notCalled).to.be.true;
    expect(logger.info.notCalled).to.be.true;
    expect(logger.error.notCalled).to.be.true;

    adapter.warn('hello warn');
    expect(logger.warn.calledOnceWith('hello warn')).to.be.true;

    adapter.debug('hello debug');
    expect(logger.debug.calledOnceWith('hello debug')).to.be.true;

    adapter.info('hello info');
    expect(logger.info.calledOnceWith('hello info')).to.be.true;

    adapter.error('hello error');
    expect(logger.error.calledOnceWith('hello error')).to.be.true;

    adapter.warn('hello warn again');
    expect(logger.warn.calledTwice).to.be.true;
  });

  it('stringifies', () => {
    const logger = new MockLogger();
    const adapter = new LoggerAdapter(logger);

    adapter.warn({ foo: 5 });
    expect(logger.warn.calledOnceWith('{"foo": 5}'));
    adapter.debug({ foo: 6 });
    expect(logger.debug.calledOnceWith('{"foo": 6}'));
    adapter.info({ foo: 7 });
    expect(logger.info.calledOnceWith('{"foo": 7}'));
    adapter.error({ foo: 8 });
    expect(logger.error.calledOnceWith('{"foo": 8}'));
  });
});
