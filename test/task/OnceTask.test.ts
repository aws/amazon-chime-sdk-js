// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect } from 'chai';
import * as sinon from 'sinon';

import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import NoOpLogger from '../../src/logger/NoOpLogger';
import NoOpTask from '../../src/task/NoOpTask';
import OnceTask from '../../src/task/OnceTask';
import { delay } from '../utils';

describe('OnceTask', () => {
  describe('deps', () => {
    const logger = new NoOpLogger();

    it('runs dep', async () => {
      const inner = new NoOpTask();
      const dep1 = new NoOpTask();
      const dep2 = new NoOpTask();
      const once = new OnceTask(logger, inner, [dep1, undefined, dep2]);

      const innerRun = sinon.spy(inner, 'run');
      const dep1Run = sinon.spy(dep1, 'run');
      const dep2Run = sinon.spy(dep2, 'run');

      await once.run();

      expect(innerRun.calledOnce);
      expect(dep1Run.calledOnce);
      expect(dep2Run.calledOnce);
      expect(dep2Run.calledAfter(dep1Run));
      expect(innerRun.calledAfter(dep2Run));
    });
  });

  describe('no deps', () => {
    const logger = new NoOpDebugLogger();

    let inner: NoOpTask;
    let once: OnceTask;

    beforeEach(() => {
      inner = new NoOpTask();
      once = new OnceTask(logger, inner);
    });

    describe('cancel', () => {
      it('asynchronously cancels the inner task', async () => {
        const cancel = sinon.spy(inner, 'cancel');
        once.cancel();
        await delay(0);
        expect(cancel.called).to.be.true;
      });
    });

    describe('name', () => {
      it('gets inner name', () => {
        expect(once.name()).to.equal('NoOpTask (once)');
      });
    });

    describe('run', async () => {
      it('can be sidestepped', async () => {
        const run = sinon.spy(inner, 'run');
        await inner.run();
        await once.run();
        expect(run.calledTwice).to.be.true;
        await once.run();
        expect(run.calledTwice).to.be.true;
      });

      it('runs exactly once', async () => {
        const run = sinon.spy(inner, 'run');
        await once.run();
        expect(run.calledOnce).to.be.true;
        await once.run();
        expect(run.calledOnce).to.be.true;
      });
    });

    describe('setParent', () => {
      it('sets parent on inner', () => {
        const setParent = sinon.spy(inner, 'setParent');
        const arg = new NoOpTask();
        once.setParent(arg);
        expect(setParent.calledWithExactly(arg)).to.be.true;
      });
    });
  });
});
