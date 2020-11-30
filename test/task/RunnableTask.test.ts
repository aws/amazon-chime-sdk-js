// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Substitute } from '@fluffy-spoon/substitute';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import Logger from '../../src/logger/Logger';
import RunnableTask from '../../src/task/RunnableTask';
import Task from '../../src/task/Task';

describe('RunnableTask', () => {
  const logger = Substitute.for<Logger>();

  before(() => {
    chai.use(chaiAsPromised);
  });

  describe('#run', () => {
    const subject = new RunnableTask<void>(
      logger,
      (): Promise<void> => {
        return Promise.resolve();
      }
    );

    it('is fulfilled', (done: Mocha.Done) => {
      chai.expect(subject.run()).to.eventually.be.fulfilled.and.notify(done);
    });
  });

  describe('#setParent', () => {
    const subject = new RunnableTask<void>(
      logger,
      (): Promise<void> => {
        return Promise.resolve();
      }
    );

    it('sets', () => {
      subject.setParent(Substitute.for<Task>());
    });
  });

  describe('#name', () => {
    describe('without parent', () => {
      describe('with constructor param', () => {
        it('is formatted', () => {
          const subject = new RunnableTask<void>(
            logger,
            (): Promise<void> => {
              return Promise.resolve();
            },
            'value'
          );
          chai.expect(subject.name()).to.eq('value');
        });
      });

      describe('without constructor param', () => {
        it('is formatted', () => {
          const subject = new RunnableTask<void>(
            logger,
            (): Promise<void> => {
              return Promise.resolve();
            }
          );
          chai.expect(subject.name()).to.eq('RunnableTask');
        });
      });
    });

    describe('with parent', () => {
      it('is formatted', () => {
        const parent = Substitute.for<Task>();
        const subject = new RunnableTask<void>(
          logger,
          (): Promise<void> => {
            return Promise.resolve();
          }
        );
        parent.name().returns('value');
        subject.setParent(parent);
        chai.expect(subject.name()).to.eq('value/RunnableTask');
      });
    });
  });

  describe('#cancel', () => {
    describe('without parent', () => {
      it('cancels', () => {
        const subject = new RunnableTask<void>(
          logger,
          (): Promise<void> => {
            return Promise.resolve();
          }
        );
        subject.cancel();
      });
    });
  });
});
