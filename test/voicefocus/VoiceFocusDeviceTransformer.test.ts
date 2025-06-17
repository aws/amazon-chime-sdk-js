// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import type { MockRequest } from 'fetch-mock';
import fetchMock from 'fetch-mock';
import { SinonStub, spy, stub } from 'sinon';

// For mocking.
import { VoiceFocusAudioWorkletNode } from '../../libs/voicefocus/types';
import { VoiceFocusNodeOptions } from '../../libs/voicefocus/types';
import { NodeArguments, VoiceFocus, VoiceFocusConfig } from '../../libs/voicefocus/voicefocus';
import { ConsoleLogger, LogLevel, VoiceFocusTransformDeviceObserver } from '../../src';
import AudioMixObserver from '../../src/audiomixobserver/AudioMixObserver';
import AudioVideoFacade from '../../src/audiovideofacade/AudioVideoFacade';
import DefaultDeviceController from '../../src/devicecontroller/DefaultDeviceController';
import Device from '../../src/devicecontroller/Device';
import Logger from '../../src/logger/Logger';
import { wait as delay } from '../../src/utils/Utils';
import Versioning from '../../src/versioning/Versioning';
import AGCOptions from '../../src/voicefocus/AGCOptions';
import VoiceFocusDeviceTransformer from '../../src/voicefocus/VoiceFocusDeviceTransformer';
import VoiceFocusSpec from '../../src/voicefocus/VoiceFocusSpec';
import VoiceFocusTransformDevice from '../../src/voicefocus/VoiceFocusTransformDevice';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';
import { MockLogger } from './MockLogger';

chai.use(chaiAsPromised);
chai.should();
const expect = chai.expect;

// This is the mock User-Agent we'll plug in to `window.navigator` and `globalThis.navigator`.
const MOCK_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:86.0) Gecko/20100101 Firefox/86.0';

// This must agree with `MOCK_UA`.
const MOCK_UA_PARAM = 'firefox-86';

// Change the `LogLevel` here to make it easier to figure out what's going wrong.
// You will also need to pass this via `{ logger: DEFAULT_LOGGER }` when creating a transformer.
const DEFAULT_LOGGER: Logger | undefined = new ConsoleLogger('tests', LogLevel.OFF);

// These will be the same for all requests, and reflect some versions.
function getQueryParams(): string {
  // E.g., '2.0'.
  const major = Versioning.sdkVersion.match(/^[1-9][0-9]*\.(?:0|[1-9][0-9]*)/)[0];

  // E.g., '2.0.3'.
  const majorMinor = Versioning.sdkVersion.match(
    /^[1-9][0-9]*\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)/
  )[0];

  // E.g., 'sdk-2.0'.
  const assetGroup = `sdk-${major}`;

  return `sdk=${majorMinor}&ua=${MOCK_UA_PARAM}&assetGroup=${assetGroup}`;
}

function mockWindowAndNavigator(): void {
  const navigator: Navigator = ({
    userAgent: MOCK_UA,
  } as unknown) as Navigator;

  globalThis.navigator = navigator;

  // Oh, Node.
  globalThis.window = ({
    URL: ({ createObjectURL: (url: string) => url } as unknown) as typeof URL,
    navigator,
  } as unknown) as Window & typeof globalThis;
}

function resetWindowAndNavigator(): void {
  delete globalThis['window'];
  delete globalThis['navigator'];
}

describe('VoiceFocusDeviceTransformer', () => {
  beforeEach(() => {
    mockWindowAndNavigator();
  });

  afterEach(() => {
    resetWindowAndNavigator();
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
      beforeEach(() => {
        fetchMock
          .get(/\/worker-v1\.js/, (_url: string, _request: MockRequest) => {
            return {
              status: 200,
              'content-type': 'application/javascript',
              body: 'function(){}',
            };
          })
          .get(/\/estimator-v1.js/, (_url: string, _request: MockRequest) => {
            return {
              status: 200,
              'content-type': 'application/javascript',
              body: 'function(){}',
            };
          });
      });

      afterEach(() => {
        fetchMock.restore();
      });

      it('is supported if the appropriate mocks exist', async () => {
        expect(await VoiceFocusDeviceTransformer.isSupported({}, {})).to.be.true;
      });

      describe('with configuration', () => {
        afterEach(() => {
          fetchMock.restore();
        });

        const goodConfig: VoiceFocusConfig = {
          fetchConfig: {
            paths: {
              processors: 'https://somewhere.chime.aws/processors/',
              workers: 'https://somewhere.chime.aws/workers/',
              wasm: 'https://somewhere.chime.aws/wasm/',
              models: 'https://somewhere.chime.aws/wasm/',
            },
            escapedQueryString: 'sdk=2.5.0&ua=firefox-86&assetGroup=stable-v1',
          },
          model: {
            category: 'voicefocus',
            name: 'default',
            variant: 'c20',
            simd: false,
          },
          processor: 'voicefocus-inline-processor',
          executionQuanta: 3,
          supported: true,
        };

        const goodEsConfig: VoiceFocusConfig = {
          fetchConfig: {
            paths: {
              processors: 'https://somewhere.chime.aws/processors/',
              workers: 'https://somewhere.chime.aws/workers/',
              wasm: 'https://somewhere.chime.aws/wasm/',
              models: 'https://somewhere.chime.aws/wasm/',
            },
            escapedQueryString: 'sdk=2.5.0&ua=firefox-86&assetGroup=stable-v1',
          },
          model: {
            category: 'voicefocus',
            name: 'ns_es',
            variant: 'c20',
            simd: false,
          },
          processor: 'voicefocus-inline-processor',
          executionQuanta: 3,
          supported: true,
        };

        const configWithURL: VoiceFocusConfig = {
          fetchConfig: {
            paths: {
              processors: 'https://static.sdkassets.chime.aws/processors/',
              workers: 'https://static.sdkassets.chime.aws/workers/',
              wasm: 'https://static.sdkassets.chime.aws/wasm/',
              models: 'https://static.sdkassets.chime.aws/wasm/',
            },
            escapedQueryString: 'sdk=2.5.0&ua=firefox-87&assetGroup=sdk-2.5',
          },
          model: {
            category: 'voicefocus',
            name: 'default',
            variant: 'c100',
            simd: true,
            url:
              'https://static.sdkassets.chime.aws/static/voicefocus-default-c100-v1_simd-e7bad7b961a128cf.wasm',
          },
          processor: 'voicefocus-inline-processor',
          executionQuanta: 3,
          supported: true,
        };

        it('can be constructed with a config with URL, and no fetch to the non-explicit URL occurs', async () => {
          const assetFilter = 'https://static.sdkassets.chime.aws/wasm/.*';
          fetchMock
            .get(assetFilter, () => {
              return {
                status: 400,
              };
            })
            .get(/\/worker-v1\.js/, (_url: string, _request: MockRequest) => {
              return {
                status: 200,
                'content-type': 'application/javascript',
                body: 'function(){}',
              };
            });

          const logger = new MockLogger();
          const spec: VoiceFocusSpec = {
            variant: 'c10',
            simd: 'force',
          };
          const transformer = await VoiceFocusDeviceTransformer.create(
            spec,
            {
              preload: false,
              logger,
            },
            configWithURL
          );
          expect(transformer).to.not.be.undefined;
          expect(transformer.isSupported()).to.be.true;
          expect(transformer.getConfiguration()).to.eventually.deep.equal(configWithURL);

          await transformer.createTransformDevice('default');
          expect(fetchMock.called(assetFilter)).to.be.false;
        });

        it('can be constructed with an unsupported config', async () => {
          const logger = new MockLogger();
          const spec: VoiceFocusSpec = {
            variant: 'c10',
            simd: 'force',
          };
          const config: VoiceFocusConfig = {
            supported: false,
            reason: 'testing',
          };
          const transformer = await VoiceFocusDeviceTransformer.create(
            spec,
            {
              preload: false,
              logger,
            },
            config
          );
          expect(transformer).to.not.be.undefined;
          expect(transformer.isSupported()).to.be.false;
        });

        it('can be constructed with a config with a fixed spec with logger and no asset group, and the config wins', async () => {
          const logger = new MockLogger();
          const spec: VoiceFocusSpec = {
            variant: 'c10',
            simd: 'force',
          };
          const transformer = await VoiceFocusDeviceTransformer.create(
            spec,
            {
              preload: false,
              logger,
            },
            goodConfig
          );
          expect(transformer).to.not.be.undefined;
          expect(transformer.isSupported()).to.be.true;
          expect(transformer.getConfiguration()).to.eventually.deep.equal(goodConfig);
          const theConfig = await transformer.getConfiguration();
          if (!theConfig.supported) {
            return;
          }
          expect(theConfig.model.simd).to.be.false;
          expect(theConfig.model.variant).to.equal('c20');
        });

        it('runs through the error case if the JoinInfo allows echo suppression but the spec is default', async () => {
          const logger = new MockLogger();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const joinInfo: any = {
            Meeting: {
              Meeting: {
                MeetingFeatures: {
                  Audio: {
                    EchoReduction: 'AVAILABLE',
                  },
                },
              },
            },
            Attendee: { Attendee: {} },
          };
          VoiceFocusDeviceTransformer.create({ name: 'default' }, {}, goodEsConfig, joinInfo);
          expect(logger.error.calledWith('Echo Reduction requested but not enabled.'));
        });

        it('runs through the error case if the JoinInfo.Meeting allows echo suppression but the spec is default', async () => {
          const logger = new MockLogger();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const joinInfo: any = {
            Meeting: {
              Meeting: {
                MeetingFeatures: {
                  Audio: {
                    EchoReduction: 'AVAILABLE',
                  },
                },
              },
            },
            Attendee: { Attendee: {} },
          };
          VoiceFocusDeviceTransformer.create(
            { name: 'default' },
            {},
            goodEsConfig,
            joinInfo.Meeting
          );
          expect(logger.error.calledWith('Echo Reduction requested but not enabled.'));
        });

        it('runs through the error case if the spec allows echo suppression but the CCP flag is UNAVAILABLE', async () => {
          const logger = new MockLogger();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const joinInfo: any = {
            Meeting: {
              MeetingFeatures: {
                Audio: {
                  EchoReduction: 'UNAVAILABLE',
                },
              },
            },
            Attendee: { Attendee: {} },
          };
          VoiceFocusDeviceTransformer.create({ name: 'ns_es' }, {}, goodConfig, joinInfo);
          expect(logger.error.calledWith('Echo Reduction requested but not enabled.'));
        });
      });

      describe('configure', () => {
        before(() => {
          fetchMock
            .head(/https:\/\/static\.somewhere\.chime\.aws\/wasm\/12345.wasm\??.*/, () => {
              return {
                status: 200,
                'content-type': 'application/wasm',
              };
            })
            .head(
              /https:\/\/somewhere\.chime\.aws\/wasm\/voicefocus-default-c10-v1_simd.wasm\?.*/,
              () => {
                return {
                  status: 302,
                  redirectUrl: 'https://static.somewhere.chime.aws/wasm/12345.wasm',
                };
              }
            );
        });

        afterEach(() => {
          fetchMock.resetHistory();
        });

        after(() => {
          fetchMock.restore();
        });

        it('provides a static method to create a config', async () => {
          expect(fetchMock.called()).to.be.false;
          const config = await VoiceFocusDeviceTransformer.configure(
            {
              variant: 'c10',
              simd: 'force',
              paths: {
                models: 'https://somewhere.chime.aws/wasm/',
                processors: 'https://somewhere.chime.aws/processors/',
                workers: 'https://somewhere.chime.aws/processors/',
                wasm: 'https://somewhere.chime.aws/wasm/',
              },
            },
            {}
          );

          expect(config.supported).to.be.true;
          if (!config.supported) {
            return;
          }

          expect(config.model.variant).to.equal('c10');
          expect(config.model.simd).to.be.true;
          expect(config.model.category).to.equal('voicefocus');
          expect(config.model.name).to.equal('default');
          expect(config.processor).to.equal('voicefocus-inline-processor');
          expect(config.executionQuanta).to.eql(3);
          expect(config.model.url).to.equal('https://static.somewhere.chime.aws/wasm/12345.wasm');

          expect(fetchMock.called()).to.be.true;
        });
      });

      it('allows calling without options or spec', async () => {
        const configPromise1 = VoiceFocusDeviceTransformer.configure();
        expect(configPromise1).to.eventually.be.rejectedWith(
          'Could not load Voice Focus estimator.'
        );
        const configPromise2 = VoiceFocusDeviceTransformer.configure({});
        expect(configPromise2).to.eventually.be.rejectedWith(
          'Could not load Voice Focus estimator.'
        );
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
      before(() => {
        fetchMock.get('*', (_url: string, _request: MockRequest) => {
          return {
            status: 503,
            body: {},
          };
        });
      });

      afterEach(() => {
        fetchMock.resetHistory();
      });

      after(() => {
        fetchMock.restore();
      });

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

      it('fetches the estimator first, with the right URL', async () => {
        const validSpec = {};
        try {
          await VoiceFocusDeviceTransformer.create(validSpec, { logger: DEFAULT_LOGGER });
        } catch (e) {
          // Doesn't matter.
        }

        const estimatorBase = 'https://static.sdkassets.chime.aws/workers/estimator-v1.js';
        const estimatorQuery = getQueryParams();
        const estimatorURL = `${estimatorBase}?${estimatorQuery}`;

        expect(fetchMock.lastCall(undefined, 'GET')[0]).to.equal(estimatorURL);
      });
    });
  });

  it('rejects for invalid spec', () => {
    const invalidSpec = ({ category: 'ayyyno' } as unknown) as VoiceFocusSpec;
    const promise = VoiceFocusDeviceTransformer.create(invalidSpec, {});
    return expect(promise).to.eventually.be.rejectedWith('Unrecognized category ayyyno');
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

    it('transformer can be destroyed', async () => {
      const vf = new MockVoiceFocus();
      init.callsFake(async () => vf);
      configure.callsFake(async () => supportedConfig);
      const transformer = await VoiceFocusDeviceTransformer.create({}, {});
      await VoiceFocusDeviceTransformer.destroyVoiceFocus(transformer);
      expect(vf.destroy.calledOnce).to.be.true;
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

    async function getSupportedEsTransformer(): Promise<VoiceFocusDeviceTransformer> {
      const vfEs = new MockVoiceFocus();
      vfEs.nodeOptions = {
        numberOfInputs: 2,
        worker: undefined,
        processor: undefined,
        audioBufferURL: '',
        resamplerURL: '',
        modelURL: '',
      };

      init.callsFake(async () => vfEs);
      isSupported.callsFake(async () => true);
      configure.callsFake(async () => supportedConfig);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const joinInfo: any = {
        Meeting: {
          Meeting: {
            MeetingFeatures: {
              Audio: {
                EchoReduction: 'AVAILABLE',
              },
            },
          },
        },
        Attendee: { Attendee: {} },
      };

      const transformer = await VoiceFocusDeviceTransformer.create(
        { name: 'ns_es' },
        {},
        undefined,
        joinInfo
      );
      return transformer;
    }

    function getSupportedButFailingTransformer(): Promise<VoiceFocusDeviceTransformer> {
      const badVF = new MockVoiceFocus();
      badVF.throwInCreateNode = true;

      return getSupportedTransformer(badVF);
    }

    async function getDevice(
      inner: Device,
      options?: NodeArguments,
      es = false
    ): Promise<VoiceFocusTransformDevice> {
      const transformer = es ? await getSupportedEsTransformer() : await getSupportedTransformer();
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

      // If you do it a weird way, we will not figure out the equality, but that's OK.
      const constraints = { deviceId: 'bar' } as MediaTrackConstraints;
      const sixth = await fifth.chooseNewInnerDevice(constraints);
      expect(sixth).to.not.eq(fifth);
      const seventh = await sixth.chooseNewInnerDevice(constraints);
      expect(sixth).to.eq(seventh);

      // If you pass default twice, you get two different devices,
      // for each of the three ways to express 'default'.
      const literalDefault = 'default';
      const streamDefault = { id: 'default' } as MediaStream;
      const constraintsDefault = { deviceId: 'default' } as MediaTrackConstraints;

      const firstDefault = await fifth.chooseNewInnerDevice(literalDefault);
      const secondDefault = await firstDefault.chooseNewInnerDevice(literalDefault);
      expect(firstDefault).to.not.eq(secondDefault);

      const thirdDefault = await secondDefault.chooseNewInnerDevice(streamDefault);
      const fourthDefault = await thirdDefault.chooseNewInnerDevice(streamDefault);
      expect(thirdDefault).to.not.eq(fourthDefault);

      const fifthDefault = await fourthDefault.chooseNewInnerDevice(constraintsDefault);
      const sixthDefault = await fifthDefault.chooseNewInnerDevice(constraintsDefault);
      expect(fifthDefault).to.not.eq(sixthDefault);
    });

    it('observe and unobserve MeetingAudio', async () => {
      const options = { agc: { useVoiceFocusAGC: false, useBuiltInAGC: true } as AGCOptions };
      const streamDefault = { id: 'default' } as MediaStream;
      const audioVideo = ({
        getCurrentMeetingAudioStream() {
          return streamDefault;
        },
        addAudioMixObserver(_observer: AudioMixObserver) {
          return;
        },
        removeAudioMixObserver(_observer: AudioMixObserver) {
          return;
        },
      } as unknown) as AudioVideoFacade;
      const device = await getDevice('foo', options, true);
      await device.observeMeetingAudio(audioVideo);
      await device.unObserveMeetingAudio(audioVideo);

      const audioVideo2 = ({
        getCurrentMeetingAudioStream() {
          return null as unknown;
        },
        addAudioMixObserver(_observer: AudioMixObserver) {
          return;
        },
        removeAudioMixObserver(_observer: AudioMixObserver) {
          return;
        },
      } as unknown) as AudioVideoFacade;

      await device.observeMeetingAudio(audioVideo2);
      await device.unObserveMeetingAudio(audioVideo2);

      const device2 = await getDevice('foo', options);
      await device2.observeMeetingAudio(audioVideo);
      await device2.unObserveMeetingAudio(audioVideo);
    });

    it('reuses nodes if the context is reused', async () => {
      const device = await getDevice('foo');

      expect(device).to.not.be.undefined;

      const contextA = ({ foo: 1 } as unknown) as AudioContext;
      const contextC = ({ foo: 2 } as unknown) as AudioContext;

      const { start: startA, end: endA } = await device.createAudioNode(contextA);

      // If you call again with the same context, you get the same node.

      const { start: startB, end: endB } = await device.createAudioNode(contextA);

      expect(startA).to.eq(endA);
      expect(startA).to.eq(startB);
      expect(endA).to.eq(endB);

      // Different context, different nodes.
      const { start: startC, end: endC } = await device.createAudioNode(contextC);

      expect(startA).to.not.eq(startC);
      expect(endA).to.not.eq(endC);

      await device.meetingAudioStreamBecameActive(undefined);
      await device.stop();
    });

    it('gives a node via its inner VoiceFocus instance', async () => {
      const device = await getDevice('foo');

      const context = ({} as unknown) as AudioContext;

      const { start, end } = await device.createAudioNode(context);

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

    it('gives you augumented constraints as Echo Suppression intrinsic device if it is constraints', async () => {
      const stream = { video: true } as MediaTrackConstraints;
      const device = await getDevice(stream, undefined, true);

      const inner = await device.intrinsicDevice();

      expect(inner).to.deep.equal({
        autoGainControl: true,
        echoCancellation: false,
        googAutoGainControl: true,
        googAutoGainControl2: true,
        googEchoCancellation: false,
        googEchoCancellation2: false,
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

    it('gives you an Echo Suppression intrinsic device with no built-in AGC', async () => {
      const options = { agc: { useVoiceFocusAGC: false, useBuiltInAGC: false } as AGCOptions };
      const device = await getDevice('foo', options, true);

      const inner = await device.intrinsicDevice();

      expect(inner).to.deep.equal({
        deviceId: {
          exact: 'foo',
        },
        autoGainControl: false,
        echoCancellation: false,
        googAutoGainControl: false,
        googAutoGainControl2: false,
        googEchoCancellation: false,
        googEchoCancellation2: false,
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

    it('gives you an Echo Suppression intrinsic device with built-in AGC', async () => {
      const options = { agc: { useVoiceFocusAGC: false, useBuiltInAGC: true } as AGCOptions };
      const device = await getDevice('foo', options, true);

      const inner = await device.intrinsicDevice();

      expect(inner).to.deep.equal({
        deviceId: {
          exact: 'foo',
        },
        autoGainControl: true,
        echoCancellation: false,
        googAutoGainControl: true,
        googAutoGainControl2: true,
        googEchoCancellation: false,
        googEchoCancellation2: false,
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

    it('gives you an Echo Suppression intrinsic device with no options', async () => {
      const device = await getDevice('foo', undefined, true);

      const inner = await device.intrinsicDevice();

      expect(inner).to.deep.equal({
        deviceId: {
          exact: 'foo',
        },
        autoGainControl: true,
        echoCancellation: false,
        googAutoGainControl: true,
        googAutoGainControl2: true,
        googEchoCancellation: false,
        googEchoCancellation2: false,
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

    it('gives you an Echo Suppression intrinsic device for null', async () => {
      const options = { agc: { useVoiceFocusAGC: false, useBuiltInAGC: true } as AGCOptions };
      const device = await getDevice(null, options, true);
      const inner = await device.intrinsicDevice();

      expect(inner).to.deep.equal({
        autoGainControl: true,
        echoCancellation: false,
        googAutoGainControl: true,
        googAutoGainControl2: true,
        googEchoCancellation: false,
        googEchoCancellation2: false,
        googHighpassFilter: false,
        googNoiseSuppression: false,
        googNoiseSuppression2: false,
        noiseSuppression: false,
      });
    });

    it('adds and remove far-end stream before createAudioNode for an Echo Suppression device', async () => {
      const domMockBehavior = new DOMMockBehavior();
      const domMockBuilder = new DOMMockBuilder(domMockBehavior);

      const options = { agc: { useVoiceFocusAGC: false, useBuiltInAGC: true } as AGCOptions };
      const streamDefault = { id: 'default' } as MediaStream;
      const streamDefault2 = { id: 'default2' } as MediaStream;
      const context = ({
        createMediaStreamDestination() {
          return new MockMediaStreamNode();
        },
        createMediaStreamSource(_stream: MediaStream) {
          return new MockMediaStreamNode();
        },
      } as unknown) as AudioContext;
      const device = await getDevice('foo', options, true);
      await device.meetingAudioStreamBecameActive(streamDefault);
      await device.meetingAudioStreamBecameActive(undefined);
      await device.createAudioNode(context);
      await delay(100);
      await device.meetingAudioStreamBecameInactive(streamDefault2);
      await device.meetingAudioStreamBecameInactive(streamDefault);

      DefaultDeviceController.closeAudioContext();
      if (domMockBuilder) {
        domMockBuilder.cleanup();
      }
    });

    it('adds and remove far-end stream after createAudioNode for an Echo Suppression device', async () => {
      const domMockBehavior = new DOMMockBehavior();
      const domMockBuilder = new DOMMockBuilder(domMockBehavior);

      const options = { agc: { useVoiceFocusAGC: false, useBuiltInAGC: true } as AGCOptions };
      const streamDefault = { id: 'default' } as MediaStream;
      const context = ({
        createMediaStreamDestination() {
          return new MockMediaStreamNode();
        },
        createMediaStreamSource(_stream: MediaStream) {
          return new MockMediaStreamNode();
        },
      } as unknown) as AudioContext;
      const device = await getDevice('foo', options, true);
      await device.createAudioNode(context);

      await device.meetingAudioStreamBecameActive(streamDefault);
      await delay(100);
      await device.meetingAudioStreamBecameInactive(streamDefault);
      DefaultDeviceController.closeAudioContext();
      if (domMockBuilder) {
        domMockBuilder.cleanup();
      }
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
  nodeOptions: VoiceFocusNodeOptions;

  async createNode(
    context: AudioContext,
    _options?: NodeArguments
  ): Promise<VoiceFocusAudioWorkletNode> {
    if (this.throwInCreateNode) {
      throw new Error('Oh no');
    }
    return (new MockVoiceFocusNode(context) as unknown) as VoiceFocusAudioWorkletNode;
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

  destroy = spy();
}

class MockVoiceFocusNode {
  constructor(public context: AudioContext) {}

  // VF.
  enable = spy();
  disable = spy();
  stop = spy();

  // AudioNode.
  disconnect = spy();
}

class MockMediaStreamNode {
  stream: MediaStream;

  connect = spy();
  disconnect = spy();
}
