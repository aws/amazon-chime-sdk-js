// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import PromiseQueue from '../../src/utils/PromiseQueue';
import { wait as delay } from '../../src/utils/Utils';

describe('PromiseQueue', () => {
  let assert: Chai.AssertStatic;
  let expect: Chai.ExpectStatic;

  before(() => {
    assert = chai.assert;
    expect = chai.expect;
  });

  it('can be constructed', () => {
    const queue = new PromiseQueue();
    assert.exists(queue);
  });

  it('work with promise', async () => {
    const queue = new PromiseQueue();
    const result = await queue.add(() => Promise.resolve(2));
    expect(result).to.eq(2);
  });

  it('work with void promise', async () => {
    const queue = new PromiseQueue();
    const result = await queue.add(() => Promise.resolve());
    expect(result).to.be.undefined;
  });

  it('throw error if promise rejects', async () => {
    const queue = new PromiseQueue();
    try {
      await queue.add(() => Promise.reject(new Error('Failed')));
      throw new Error('This line should not be reached.');
    } catch (error) {
      expect(error.message).to.eq('Failed');
    }
  });

  it('queuing multiple promises', async () => {
    let result = 0;
    let callCount = 0;
    const func = (value: number, waitTimesMs: number): Promise<number> => {
      return new Promise(resolve => {
        setTimeout(() => {
          result = value;
          callCount++;
          resolve(value);
        }, waitTimesMs);
      });
    };
    const queue = new PromiseQueue();
    queue.add(() => func(1, 50));
    queue.add(() => func(2, 10));
    queue.add(() => func(3, 1));
    await delay(100);
    expect(result).to.eq(3);
    expect(callCount).to.eq(3);
  });

  it('still execute the next promise if the previous promise rejects', async () => {
    let result = 0;
    let resolveCount = 0;
    let rejectCount = 0;
    const func1 = (value: number, waitTimesMs: number): Promise<number> => {
      return new Promise(resolve => {
        setTimeout(() => {
          result = value;
          resolveCount++;
          resolve(value);
        }, waitTimesMs);
      });
    };
    const func2 = (waitTimesMs: number): Promise<number> => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          rejectCount++;
          reject(new Error());
        }, waitTimesMs);
      });
    };
    const queue = new PromiseQueue();
    queue.add(() => func1(1, 50));
    queue.add(() => func2(10));
    queue.add(() => func1(3, 1));
    await delay(100);
    expect(result).to.eq(3);
    expect(resolveCount).to.eq(2);
    expect(rejectCount).to.eq(1);
  });
});
