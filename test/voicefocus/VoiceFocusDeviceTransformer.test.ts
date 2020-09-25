// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import type { MockRequest } from 'fetch-mock';
import * as fetchMock from 'fetch-mock';
import { SinonStub, spy, stub } from 'sinon';

// For mocking.
import { VoiceFocusAudioWorkletNode } from '../../libs/voicefocus/types';
import { NodeArguments, VoiceFocus, VoiceFocusConfig } from '../../libs/voicefocus/voicefocus';
import { VoiceFocusTransformDeviceObserver } from '../../src';
import Device from '../../src/devicecontroller/Device';
import Logger from '../../src/logger/Logger';
import Versioning from '../../src/versioning/Versioning';
import AGCOptions from '../../src/voicefocus/AGCOptions';
import VoiceFocusDeviceTransformer from '../../src/voicefocus/VoiceFocusDeviceTransformer';
import VoiceFocusSpec from '../../src/voicefocus/VoiceFocusSpec';
import VoiceFocusTransformDevice from '../../src/voicefocus/VoiceFocusTransformDevice';
import { MockLogger } from './MockLogger';

chai.use(chaiAsPromised);
chai.should();
const expect = chai.expect;

// These will be the same for all requests, and reflect some versions.
function getQueryParams(): string {
  // E.g., '2.0'.
  const major = Versioning.sdkVersion.match(/^[1-9][0-9]*\.(?:0|[1-9][0-9]*)/)[0];

  // E.g., '2.0.3'.
  const majorMinor = Versioning.sdkVersion.match(
    /^[1-9][0-9]*\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)/
  )[0];

  // E.g., '14'.
  const nodeVersion = process.version.match(/^v([1-9][0-9]*)/)[1];

  // E.g., 'sdk-2.0'.
  const assetGroup = `sdk-${major}`;

  return `sdk=${majorMinor}&ua=node-${nodeVersion}&assetGroup=${assetGroup}`;
}

function basicFetchMock(): void {
  fetchMock.restore();
  fetchMock.get('*', (_url: string, _request: MockRequest) => {
    return {
      status: 503,
      body: {},
    };
  });
}

function mockWindow(): void {
  // Oh, Node.
  globalThis['window'] = ({
    URL: ({ createObjectURL: (url: string) => url } as unknown) as typeof URL,
  } as unknown) as Window & typeof globalThis;
}

describe('VoiceFocusDeviceTransformer', () => {
  before(() => {
    basicFetchMock();
  });

  afterEach(() => {
    fetchMock.resetHistory();
  });

  after(() => {
    fetchMock.restore();
  });

  it('is not supported in Node', async () => {
    // No AudioWorklet etc. in Node. This will fail before making any network requests,
    // so an invalid spec is fine.
    const invalidSpec = ({ category: 'ayyyno' } as unknown) as VoiceFocusSpec;

    expect(await VoiceFocusDeviceTransformer.isSupported(invalidSpec, undefined)).to.be.false;

    expect(await VoiceFocusDeviceTransformer.isSupported(invalidSpec, {})).to.be.false;

    // And we can do it with a falsy logger.
    expect(await VoiceFocusDeviceTransformer.isSupported(invalidSpec, { logger: null })).to.be
      .false;

    // … or a real logger.
    const logger = new MockLogger();
    expect(await VoiceFocusDeviceTransformer.isSupported(invalidSpec, { logger })).to.be.false;

    // The first check failed, so nothing is logged.
    expect(logger.info.notCalled).to.be.true;
  });

  describe('mocked', () => {
    const wa = globalThis.WebAssembly;
    const aw = globalThis.AudioWorklet;
    const awn = globalThis.AudioWorkletNode;
    const worker = globalThis.Worker;

    before(() => {
      globalThis.WebAssembly = ({
        compile: () => {},
        compileStreaming: () => {},
      } as unknown) as typeof WebAssembly;

      globalThis.AudioWorklet = ({} as unknown) as typeof AudioWorklet;
      globalThis.AudioWorkletNode = ({} as unknown) as typeof AudioWorkletNode;
      globalThis.Worker = (class MockWorker {
        constructor(_thing: unknown) {}

        terminate(): void {}
      } as unknown) as typeof Worker;
    });

    after(() => {
      globalThis.WebAssembly = wa;
      globalThis.AudioWorklet = aw;
      globalThis.AudioWorkletNode = awn;
      globalThis.Worker = worker;
    });

    describe('with working worker', () => {
      before(() => {
        fetchMock.restore();
        fetchMock.get(/\/worker-v1\.js/, (_url: string, _request: MockRequest) => {
          return {
            status: 200,
            'content-type': 'application/javascript',
            body: 'function(){}',
          };
        });

        mockWindow();
      });

      after(() => {
        basicFetchMock();
        delete globalThis['window'];
      });

      it('is supported if the appropriate mocks exist', async () => {
        expect(await VoiceFocusDeviceTransformer.isSupported({}, {})).to.be.true;
      });

      it('can be constructed with a fixed spec with logger and no asset group', async () => {
        const logger = new MockLogger();
        const spec: VoiceFocusSpec = {
          variant: 'c10',
          simd: 'force',
        };
        const transformer = await VoiceFocusDeviceTransformer.create(spec, {
          preload: false,
          logger,
        });
        expect(transformer).to.not.be.undefined;
        expect(transformer.isSupported()).to.be.true;
      });

      it('can be constructed with a fixed spec with no logger or asset group', async () => {
        const spec: VoiceFocusSpec = {
          variant: 'c10',
          simd: 'force',
        };
        const transformer = await VoiceFocusDeviceTransformer.create(spec, { preload: false });
        expect(transformer).to.not.be.undefined;
        expect(transformer.isSupported()).to.be.true;
      });

      it('can be constructed with a fixed spec with no logger but asset group', async () => {
        const spec: VoiceFocusSpec = {
          variant: 'c10',
          simd: 'force',
          assetGroup: 'stable-v1',
        };
        const transformer = await VoiceFocusDeviceTransformer.create(spec, { preload: false });
        expect(transformer).to.not.be.undefined;
        expect(transformer.isSupported()).to.be.true;
      });

      it('can be constructed with a fixed spec with logger and asset group', async () => {
        const logger = new MockLogger();
        const spec: VoiceFocusSpec = {
          variant: 'c10',
          simd: 'force',
          assetGroup: 'stable-v1',
        };
        const transformer = await VoiceFocusDeviceTransformer.create(spec, {
          preload: false,
          logger,
        });
        expect(transformer).to.not.be.undefined;
        expect(transformer.isSupported()).to.be.true;
      });

      it('can create a device', async () => {
        const spec: VoiceFocusSpec = {
          variant: 'c10',
          simd: 'force',
          assetGroup: 'stable-v1',
        };
        const transformer = await VoiceFocusDeviceTransformer.create(spec, { preload: false });
        const device = await transformer.createTransformDevice('foo');

        expect(device).to.not.be.undefined;
        expect(device.stop());
      });
    });

    describe('with failing network', () => {
      it('makes a network request if the appropriate mocks exist', async () => {
        const logger = new MockLogger();
        expect(await VoiceFocusDeviceTransformer.isSupported({}, { logger })).to.be.false;

        const workerBase = 'https://static.sdkassets.chime.aws/workers/worker-v1.js';
        const workerQuery = getQueryParams();
        const workerURL = `${workerBase}?${workerQuery}`;
        expect(fetchMock.lastCall(undefined, 'GET')[0]).to.equal(workerURL);

        expect(
          logger.debug.calledOnceWith(
            'Loading VoiceFocusTestWorker worker from https://static.sdkassets.chime.aws/workers/worker-v1.js.'
          )
        ).to.be.true;

        // Because we don't have `self.origin`.
        expect(logger.error.calledWith('Could not compare origins. {}')).to.be.true;

        // Because the fetch returned a 503.
        expect(logger.info.calledWith('Failed to fetch and instantiate test worker {}')).to.be.true;
      });
    });
  });

  it('rejects for invalid spec', () => {
    const invalidSpec = ({ category: 'ayyyno' } as unknown) as VoiceFocusSpec;
    const promise = VoiceFocusDeviceTransformer.create(invalidSpec, {});
    return expect(promise).to.eventually.be.rejectedWith('Unrecognized category ayyyno');
  });

  it('fetches the estimator first, with the right URL', async () => {
    const validSpec = {};
    try {
      await VoiceFocusDeviceTransformer.create(validSpec, {});
    } catch (e) {
      // Doesn't matter.
    }

    const estimatorBase = 'https://static.sdkassets.chime.aws/workers/estimator-v1.js';
    const estimatorQuery = getQueryParams();
    const estimatorURL = `${estimatorBase}?${estimatorQuery}`;

    expect(fetchMock.lastCall(undefined, 'GET')[0]).to.equal(estimatorURL);
  });

  it('accepts a valid spec, fetches the estimator, and rejects if we get a 503', async () => {
    const promise = VoiceFocusDeviceTransformer.create(undefined, undefined);
    return expect(promise).to.eventually.be.rejectedWith('Could not load Voice Focus estimator.');
  });

  describe('with mocked VoiceFocus', () => {
    let configure: SinonStub;
    let init: SinonStub;
    let isSupported: SinonStub;

    const supportedConfig: VoiceFocusConfig = {
      fetchConfig: undefined,
      model: {
        category: 'voicefocus',
        name: 'default',
        variant: 'c50',
        simd: true,
      },
      processor: 'n/a',
      supported: true,
    };

    const unsupportedConfig: VoiceFocusConfig = {
      supported: false,
      reason: 'mocked',
    };

    before(() => {
      configure = stub(VoiceFocus, 'configure');
      init = stub(VoiceFocus, 'init');
      isSupported = stub(VoiceFocus, 'isSupported');
    });

    afterEach(() => {
      configure.reset();
      init.reset();
      isSupported.reset();
    });

    after(() => {
      // @ts-ignore
      VoiceFocus.configure.restore();

      // @ts-ignore
      VoiceFocus.init.restore();

      // @ts-ignore
      VoiceFocus.isSupported.restore();
    });

    it('create can be called even without checking isSupported', async () => {
      isSupported.callsFake(async () => {
        throw new Error('oh no');
      });
      configure.callsFake(async () => unsupportedConfig);
      const result = await VoiceFocusDeviceTransformer.create({}, {});
      expect(isSupported.notCalled).to.be.true;
      expect(configure.calledOnce).to.be.true;
      expect(result.isSupported()).to.be.false;
    });

    it('is not supported if createVoiceFocus fails, even if the config is valid', async () => {
      init.callsFake(async () => {
        throw new Error('mocked');
      });

      configure.callsFake(async () => supportedConfig);

      const result = await VoiceFocusDeviceTransformer.create(
        {},
        { logger: (console as unknown) as Logger }
      );
      expect(configure.calledOnce).to.be.true;
      expect(init.calledOnce).to.be.true;
      expect(result.isSupported()).to.be.false;
    });

    it('returns undefined when trying to create a device when unsupported', async () => {
      init.callsFake(async () => {});
      isSupported.callsFake(async () => false);
      configure.callsFake(async () => unsupportedConfig);

      const transformer = await VoiceFocusDeviceTransformer.create({}, {});
      expect(transformer.isSupported()).to.be.false;

      expect(await transformer.createTransformDevice('foo')).to.be.undefined;
    });

    it('returns undefined when init fails', async () => {
      init.callsFake(async () => {
        throw new Error('mocked');
      });
      isSupported.callsFake(async () => true);
      configure.callsFake(async () => supportedConfig);

      const transformer = await VoiceFocusDeviceTransformer.create({}, {});

      // Because the creation failed.
      expect(transformer.isSupported()).to.be.false;

      expect(await transformer.createTransformDevice('foo')).to.be.undefined;
    });

    async function getSupportedTransformer(
      vf = new MockVoiceFocus()
    ): Promise<VoiceFocusDeviceTransformer> {
      init.callsFake(async () => vf);
      isSupported.callsFake(async () => true);
      configure.callsFake(async () => supportedConfig);

      const transformer = await VoiceFocusDeviceTransformer.create({}, {});
      return transformer;
    }

    function getSupportedButFailingTransformer(): Promise<VoiceFocusDeviceTransformer> {
      const badVF = new MockVoiceFocus();
      badVF.throwInCreateNode = true;

      return getSupportedTransformer(badVF);
    }

    async function getDevice(
      inner: Device,
      options?: NodeArguments
    ): Promise<VoiceFocusTransformDevice> {
      const transformer = await getSupportedTransformer();
      return await transformer.createTransformDevice(inner, options);
    }

    it('returns supported when Voice Focus init succeeds', async () => {
      const transformer = await getSupportedTransformer();
      expect(transformer.isSupported()).to.be.true;
    });

    it('returns a device from a supported transformer', async () => {
      const device = await getDevice('foo');

      expect(device).to.not.be.undefined;
      expect(device).to.be.instanceof(VoiceFocusTransformDevice);
      expect(device.getInnerDevice()).to.equal('foo');
    });

    it('allows you to get multiple devices from a transformer', async () => {
      const transformer = await getSupportedTransformer();
      // And you can do it again.
      const firstDevice = await transformer.createTransformDevice('foo');
      const secondDevice = await transformer.createTransformDevice(null);

      expect(secondDevice).to.not.be.undefined;
      expect(secondDevice).to.be.instanceof(VoiceFocusTransformDevice);

      expect(firstDevice.getInnerDevice()).to.equal('foo');
      expect(secondDevice.getInnerDevice()).to.be.null;

      expect(secondDevice).to.not.eq(firstDevice);
    });

    it('lets you switch out the inner device, creating a new device each time', async () => {
      const first = await getDevice('foo');
      expect(first.getInnerDevice()).to.equal('foo');
      const second = await first.chooseNewInnerDevice(null);

      // Unchanged.
      expect(first.getInnerDevice()).to.equal('foo');
      expect(second.getInnerDevice()).to.be.null;
      expect(second).to.not.equal(first);

      const third = await second.chooseNewInnerDevice('bar');
      expect(third.getInnerDevice()).to.equal('bar');

      const fourth = await first.chooseNewInnerDevice('bar');
      expect(third.getInnerDevice()).to.equal(fourth.getInnerDevice());
      expect(third).to.not.equal(fourth);

      // The same: returns self.
      const fifth = await fourth.chooseNewInnerDevice('bar');
      expect(fifth).to.eq(fourth);
    });

    it('gives a node via its inner VoiceFocus instance', async () => {
      const device = await getDevice('foo');

      const { start, end } = await device.createAudioNode(({} as unknown) as AudioContext);

      // Because we created it with a MockVoiceFocus.
      expect(start).to.be.instanceof(MockVoiceFocusNode);

      // Our subgraph is unit.
      expect(start).to.eq(end);

      const node: MockVoiceFocusNode = (start as unknown) as MockVoiceFocusNode;

      // The node can be muted. When it is, `disable` will be called.
      expect(node.disable.notCalled).to.be.true;
      expect(node.enable.notCalled).to.be.true;
      await device.mute(false);
      expect(node.disable.notCalled).to.be.true;
      expect(node.enable.calledOnce).to.be.true;
      await device.mute(true);
      expect(node.disable.calledOnce).to.be.true;
      expect(node.enable.calledOnce).to.be.true;
      await device.mute(false);
      expect(node.disable.calledOnce).to.be.true;
      expect(node.enable.calledTwice).to.be.true;

      await device.stop();
      expect(node.disconnect.calledOnce).to.be.true;
      expect(node.stop.calledOnce).to.be.true;
    });

    it('can mute and stop even when failed', async () => {
      const transformer = await getSupportedButFailingTransformer();
      const device = await transformer.createTransformDevice('foo');

      try {
        await device.createAudioNode(({} as unknown) as AudioContext);
      } catch (e) {}

      // Nothing happens, of course.
      await device.mute(true);
      await device.stop();
    });

    it('gives you augumented constraints as intrinsic device if it is constraints', async () => {
      const stream = { video: true } as MediaTrackConstraints;
      const device = await getDevice(stream);

      const inner = await device.intrinsicDevice();

      expect(inner).to.deep.equal({
        autoGainControl: true,
        echoCancellation: true,
        googAutoGainControl: true,
        googAutoGainControl2: true,
        googEchoCancellation: true,
        googEchoCancellation2: true,
        googHighpassFilter: false,
        googNoiseSuppression: false,
        googNoiseSuppression2: false,
        noiseSuppression: false,
        video: true,
      });
    });

    it('gives you the inner device as intrinsic device if it is a stream', async () => {
      const stream = { id: 'i-am-a-stream' } as MediaStream;
      const device = await getDevice(stream);

      const inner = await device.intrinsicDevice();

      expect(inner).to.eq(stream);
    });

    it('gives you the inner device as intrinsic device if failed', async () => {
      const options = { agc: { useVoiceFocusAGC: false, useBuiltInAGC: false } as AGCOptions };
      const device = await getDevice('foo', options);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((device as unknown) as any).failed = true;

      const inner = await device.intrinsicDevice();

      expect(inner).to.equal('foo');
    });

    it('gives you an intrinsic device with no built-in AGC', async () => {
      const options = { agc: { useVoiceFocusAGC: false, useBuiltInAGC: false } as AGCOptions };
      const device = await getDevice('foo', options);

      const inner = await device.intrinsicDevice();

      expect(inner).to.deep.equal({
        deviceId: {
          exact: 'foo',
        },
        autoGainControl: false,
        echoCancellation: true,
        googAutoGainControl: false,
        googAutoGainControl2: false,
        googEchoCancellation: true,
        googEchoCancellation2: true,
        googHighpassFilter: false,
        googNoiseSuppression: false,
        googNoiseSuppression2: false,
        noiseSuppression: false,
      });
    });

    it('gives you an intrinsic device with built-in AGC', async () => {
      const options = { agc: { useVoiceFocusAGC: false, useBuiltInAGC: true } as AGCOptions };
      const device = await getDevice('foo', options);

      const inner = await device.intrinsicDevice();

      expect(inner).to.deep.equal({
        deviceId: {
          exact: 'foo',
        },
        autoGainControl: true,
        echoCancellation: true,
        googAutoGainControl: true,
        googAutoGainControl2: true,
        googEchoCancellation: true,
        googEchoCancellation2: true,
        googHighpassFilter: false,
        googNoiseSuppression: false,
        googNoiseSuppression2: false,
        noiseSuppression: false,
      });
    });

    it('gives you an intrinsic device with no options', async () => {
      const device = await getDevice('foo');

      const inner = await device.intrinsicDevice();

      expect(inner).to.deep.equal({
        deviceId: {
          exact: 'foo',
        },
        autoGainControl: true,
        echoCancellation: true,
        googAutoGainControl: true,
        googAutoGainControl2: true,
        googEchoCancellation: true,
        googEchoCancellation2: true,
        googHighpassFilter: false,
        googNoiseSuppression: false,
        googNoiseSuppression2: false,
        noiseSuppression: false,
      });
    });

    it('gives you an intrinsic device for null', async () => {
      const options = { agc: { useVoiceFocusAGC: false, useBuiltInAGC: true } as AGCOptions };
      const device = await getDevice(null, options);

      const inner = await device.intrinsicDevice();

      expect(inner).to.deep.equal({
        autoGainControl: true,
        echoCancellation: true,
        googAutoGainControl: true,
        googAutoGainControl2: true,
        googEchoCancellation: true,
        googEchoCancellation2: true,
        googHighpassFilter: false,
        googNoiseSuppression: false,
        googNoiseSuppression2: false,
        noiseSuppression: false,
      });
    });

    it('runs through the error case if createAudioNode failed', async () => {
      const transformer = await getSupportedButFailingTransformer();

      const observer: VoiceFocusTransformDeviceObserver = {
        voiceFocusFellBackToInnerStream: stub(),
      };

      const device = await transformer.createTransformDevice('foo');
      device.addObserver(observer);

      const nodeCreation = device.createAudioNode({} as AudioContext);
      await expect(nodeCreation).to.eventually.be.rejectedWith('');
      expect((observer.voiceFocusFellBackToInnerStream as SinonStub).calledOnce).to.be.true;
      expect(await device.intrinsicDevice()).to.equal('foo');
    });

    it('lets you add and remove observers', async () => {
      const transformer = await getSupportedButFailingTransformer();

      const observerA: VoiceFocusTransformDeviceObserver = {
        voiceFocusFellBackToInnerStream: stub(),
      };
      const observerB: VoiceFocusTransformDeviceObserver = {
        voiceFocusFellBackToInnerStream: stub(),
      };
      const observerC: VoiceFocusTransformDeviceObserver = {
        voiceFocusFellBackToInnerStream: stub(),
      };

      const device = await transformer.createTransformDevice('foo');
      device.addObserver(observerA);

      try {
        await device.createAudioNode({} as AudioContext);
      } catch (e) {}

      expect((observerA.voiceFocusFellBackToInnerStream as SinonStub).callCount).to.eq(1);
      expect((observerB.voiceFocusFellBackToInnerStream as SinonStub).callCount).to.eq(0);
      expect((observerC.voiceFocusFellBackToInnerStream as SinonStub).callCount).to.eq(0);

      device.addObserver(observerB);

      try {
        await device.createAudioNode({} as AudioContext);
      } catch (e) {}

      expect((observerA.voiceFocusFellBackToInnerStream as SinonStub).callCount).to.eq(2);
      expect((observerB.voiceFocusFellBackToInnerStream as SinonStub).callCount).to.eq(1);
      expect((observerC.voiceFocusFellBackToInnerStream as SinonStub).callCount).to.eq(0);

      device.addObserver(observerC);
      device.removeObserver(observerB);

      try {
        await device.createAudioNode({} as AudioContext);
      } catch (e) {}

      expect((observerA.voiceFocusFellBackToInnerStream as SinonStub).callCount).to.eq(3);
      expect((observerB.voiceFocusFellBackToInnerStream as SinonStub).callCount).to.eq(1);
      expect((observerC.voiceFocusFellBackToInnerStream as SinonStub).callCount).to.eq(1);
    });
  });
});

class MockVoiceFocus {
  throwInCreateNode: boolean = false;

  async createNode(
    _context: AudioContext,
    _options?: NodeArguments
  ): Promise<VoiceFocusAudioWorkletNode> {
    if (this.throwInCreateNode) {
      throw new Error('Oh no');
    }
    return (new MockVoiceFocusNode() as unknown) as VoiceFocusAudioWorkletNode;
  }

  async applyToStream(
    _stream: MediaStream,
    _context: AudioContext,
    _options?: NodeArguments
  ): Promise<{
    node: VoiceFocusAudioWorkletNode;
    source: MediaStreamAudioSourceNode;
    destination: MediaStreamAudioDestinationNode;
    stream: MediaStream;
  }> {
    throw new Error('Method not implemented.');
  }

  applyToSourceNode(
    _source: MediaStreamAudioSourceNode,
    _context: AudioContext,
    _options?: NodeArguments
  ): Promise<VoiceFocusAudioWorkletNode> {
    throw new Error('Method not implemented.');
  }
}

class MockVoiceFocusNode {
  // VF.
  enable = spy();
  disable = spy();
  stop = spy();

  // AudioNode.
  disconnect = spy();
}
