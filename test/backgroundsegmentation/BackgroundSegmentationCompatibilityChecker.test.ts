// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import BackgroundSegmentationCompatibilityChecker from '../../src/backgroundsegmentation/BackgroundSegmentationCompatibilityChecker';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('BackgroundSegmentationCompatibilityChecker', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpDebugLogger();
  let domMockBehavior: DOMMockBehavior;
  let domMockBuilder: DOMMockBuilder;
  const sandbox: sinon.SinonSandbox = sinon.createSandbox();

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
  });

  afterEach(() => {
    sandbox.restore();
    domMockBuilder.cleanup();
  });

  it('returns compatible when all features are present', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).OffscreenCanvas = class {
      constructor(_w: number, _h: number) {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getContext(): any {
        return {};
      }
    };

    sandbox.stub(document, 'createElement').returns({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getContext(_id: string): any {
        return { getExtension: () => ({ loseContext: () => {} }) };
      },
    } as unknown as HTMLElement);

    const result = BackgroundSegmentationCompatibilityChecker.checkCompatibility(logger);
    expect(result.isCompatible).to.be.true;
    expect(result.missingFeatures).to.be.empty;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).OffscreenCanvas;
  });

  it('reports missing webgl2 when canvas getContext returns null', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).OffscreenCanvas = class {
      constructor(_w: number, _h: number) {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getContext(): any {
        return {};
      }
    };

    const origCreateElement = document.createElement.bind(document);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sandbox.stub(document, 'createElement').callsFake((tag: string): any => {
      const el = origCreateElement(tag);
      if (tag === 'canvas') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (el as any).getContext = (_: string): any => null;
      }
      return el;
    });

    const result = BackgroundSegmentationCompatibilityChecker.checkCompatibility(logger);
    expect(result.missingFeatures).to.include('webgl2');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).OffscreenCanvas;
  });

  it('reports missing webWorkers when Worker is undefined', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const origWorker = (globalThis as any).Worker;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).Worker;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).OffscreenCanvas = class {
      constructor(_w: number, _h: number) {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getContext(): any {
        return {};
      }
    };

    const result = BackgroundSegmentationCompatibilityChecker.checkCompatibility(logger);
    expect(result.missingFeatures).to.include('webWorkers');
    expect(result.isCompatible).to.be.false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).Worker = origWorker;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).OffscreenCanvas;
  });

  it('reports missing webAssembly when WebAssembly is undefined', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const origWebAssembly = (globalThis as any).WebAssembly;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).WebAssembly;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).OffscreenCanvas = class {
      constructor(_w: number, _h: number) {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getContext(): any {
        return {};
      }
    };

    const result = BackgroundSegmentationCompatibilityChecker.checkCompatibility(logger);
    expect(result.missingFeatures).to.include('webAssembly');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).WebAssembly = origWebAssembly;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).OffscreenCanvas;
  });

  it('reports missing offscreenCanvas when OffscreenCanvas is undefined', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).OffscreenCanvas;

    const result = BackgroundSegmentationCompatibilityChecker.checkCompatibility(logger);
    expect(result.missingFeatures).to.include('offscreenCanvas');
  });

  it('reports missing offscreenCanvas when getContext returns null', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).OffscreenCanvas = class {
      constructor(_w: number, _h: number) {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getContext(): any {
        return null;
      }
    };

    const result = BackgroundSegmentationCompatibilityChecker.checkCompatibility(logger);
    expect(result.missingFeatures).to.include('offscreenCanvas');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).OffscreenCanvas;
  });

  it('handles OffscreenCanvas instantiation error', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).OffscreenCanvas = class {
      constructor(_w: number, _h: number) {
        throw new Error('OffscreenCanvas not supported');
      }
    };

    const result = BackgroundSegmentationCompatibilityChecker.checkCompatibility(logger);
    expect(result.missingFeatures).to.include('offscreenCanvas');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).OffscreenCanvas;
  });

  it('handles WebGL2 check error', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).OffscreenCanvas = class {
      constructor(_w: number, _h: number) {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getContext(): any {
        return {};
      }
    };

    const origCreateElement = document.createElement.bind(document);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sandbox.stub(document, 'createElement').callsFake((tag: string): any => {
      if (tag === 'canvas') {
        throw new Error('canvas error');
      }
      return origCreateElement(tag);
    });

    const result = BackgroundSegmentationCompatibilityChecker.checkCompatibility(logger);
    expect(result.missingFeatures).to.include('webgl2');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).OffscreenCanvas;
  });
});
