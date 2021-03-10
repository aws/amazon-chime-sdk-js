// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import { expect } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
chai.should();

import { isDestroyable as indexImport } from '../../src';
import { Destroyable, isDestroyable } from '../../src/destroyable/Destroyable';

class NotDestroyable {}

class IsDestroyable implements Destroyable {
  wasDisposed = false;

  destroy(): Promise<void> {
    return new Promise((resolve, _reject) => {
      setTimeout(() => {
        this.wasDisposed = true;
        resolve();
      });
    });
  }
}

describe('Destroyable', () => {
  it('recognizes not destroyable', () => {
    expect(isDestroyable(new NotDestroyable())).to.be.false;
    expect(indexImport(new NotDestroyable())).to.be.false;
  });

  it('recognizes destroyable', () => {
    expect(isDestroyable(new IsDestroyable())).to.be.true;
    expect(indexImport(new IsDestroyable())).to.be.true;
  });

  it('can be disposed', async () => {
    const d = new IsDestroyable();
    expect(d.wasDisposed).to.be.false;
    await d.destroy();
    expect(d.wasDisposed).to.be.true;
  });
});
