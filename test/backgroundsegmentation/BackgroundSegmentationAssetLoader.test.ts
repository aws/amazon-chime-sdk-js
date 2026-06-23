// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import BackgroundSegmentationAssetLoader from '../../src/backgroundsegmentation/BackgroundSegmentationAssetLoader';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('BackgroundSegmentationAssetLoader', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpDebugLogger();
  let domMockBehavior: DOMMockBehavior;
  let domMockBuilder: DOMMockBuilder;
  const sandbox: sinon.SinonSandbox = sinon.createSandbox();
  let appendChildStub: sinon.SinonStub;

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    appendChildStub = sandbox.stub();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (document as any).head = { appendChild: appendChildStub };
    // Stub createElement to return a script-like object with remove()
    sandbox.stub(document, 'createElement').returns({
      src: '',
      crossOrigin: '',
      onload: null,
      onerror: null,
      remove: sandbox.stub(),
    } as unknown as HTMLElement);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).BackgroundSegmentationProcessor;
  });

  afterEach(() => {
    sandbox.restore();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (document as any).head;
    } catch (e) {
      /* already cleaned */
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).BackgroundSegmentationProcessor;
    } catch (e) {
      /* already cleaned */
    }
    domMockBuilder.cleanup();
  });

  it('returns 0 immediately if processor already on window', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).BackgroundSegmentationProcessor = { create: sandbox.stub() };
    const loader = new BackgroundSegmentationAssetLoader(logger);
    const result = await loader.load();
    expect(result).to.equal(0);
    expect(appendChildStub.notCalled).to.be.true;
  });

  it('loads script and resolves with load time', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    appendChildStub.callsFake((script: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).BackgroundSegmentationProcessor = { create: sandbox.stub() };
      script.onload();
    });

    const loader = new BackgroundSegmentationAssetLoader(logger);
    const result = await loader.load();
    expect(result).to.be.a('number');
    expect(result).to.be.at.least(0);
    expect(appendChildStub.calledOnce).to.be.true;
  });

  it('rejects when script fails to load', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    appendChildStub.callsFake((script: any) => {
      script.onerror();
    });

    const loader = new BackgroundSegmentationAssetLoader(logger);
    try {
      await loader.load();
      expect.fail('should have thrown');
    } catch (err) {
      expect((err as Error).message).to.include('Failed to load processor script');
    }
  });

  it('rejects when processor not on window after script loads', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    appendChildStub.callsFake((script: any) => {
      script.onload();
    });

    const loader = new BackgroundSegmentationAssetLoader(logger);
    try {
      await loader.load();
      expect.fail('should have thrown');
    } catch (err) {
      expect((err as Error).message).to.include('not found on window');
    }
  });

  it('deduplicates concurrent load calls', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    appendChildStub.callsFake((script: any) => {
      Promise.resolve().then(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).BackgroundSegmentationProcessor = { create: sandbox.stub() };
        script.onload();
      });
    });

    const loader = new BackgroundSegmentationAssetLoader(logger);
    const [r1, r2] = await Promise.all([loader.load(), loader.load()]);
    expect(r1).to.equal(r2);
    expect(appendChildStub.calledOnce).to.be.true;
  });

  it('clears promise on failure allowing retry', async () => {
    let callCount = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    appendChildStub.callsFake((script: any) => {
      callCount++;
      if (callCount === 1) {
        script.onerror();
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).BackgroundSegmentationProcessor = { create: sandbox.stub() };
        script.onload();
      }
    });

    const loader = new BackgroundSegmentationAssetLoader(logger);
    try {
      await loader.load();
    } catch (_err) {
      // expected to throw
    }

    const result = await loader.load();
    expect(result).to.be.at.least(0);
    expect(appendChildStub.calledTwice).to.be.true;
  });
});
