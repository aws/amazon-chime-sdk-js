// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';

import NoOpLogger from '../../src/logger/NoOpLogger';
import CitrixBootstrap from '../../src/vdi/CitrixBootstrap';
import CitrixMediaDevices from '../../src/vdi/CitrixMediaDevices';
import CitrixUCSDK from '../../src/vdi/CitrixUCSDK';
import CitrixVDIAdapter from '../../src/vdi/CitrixVDIAdapter';
import CitrixVMEvent from '../../src/vdi/CitrixVMEvent';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';
import { browserStream, citrixStream, FakePeerConnection, makeUcsdk } from './FakeCitrixUCSDK';

describe('CitrixVDIAdapter', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  chai.use(chaiAsPromised);
  let domMockBuilder: DOMMockBuilder;
  let ucsdk: CitrixUCSDK;

  beforeEach(() => {
    domMockBuilder = new DOMMockBuilder(new DOMMockBehavior());
    ucsdk = makeUcsdk();
  });

  afterEach(() => {
    domMockBuilder.cleanup();
  });

  it('holds the UCSDK and window handle it was given', () => {
    const adapter = new CitrixVDIAdapter({ ucsdk, windowHandle: '0x1f' });
    expect(adapter.name).to.equal('CitrixVDIAdapter');
    expect(adapter.ucsdk).to.equal(ucsdk);
    expect(adapter.windowHandle).to.equal('0x1f');
  });

  it('opens and lists devices with CitrixMediaDevices', () => {
    const adapter = new CitrixVDIAdapter({ ucsdk, windowHandle: '0x1f' });
    expect(adapter.mediaDevices).to.be.instanceOf(CitrixMediaDevices);
  });

  it('creates the UCSDK peer connection', () => {
    const configuration = { iceServers: [] as RTCIceServer[] };
    const adapter = new CitrixVDIAdapter({ ucsdk, windowHandle: '0x1f', logger: new NoOpLogger() });
    const peer = adapter.createPeerConnection(configuration);
    expect(peer).to.be.instanceOf(FakePeerConnection);
    expect((peer as unknown as FakePeerConnection).configuration).to.equal(configuration);
    expect(
      new CitrixVDIAdapter({ ucsdk, windowHandle: '0x1f' }).createPeerConnection({})
    ).to.be.instanceOf(FakePeerConnection);
  });

  describe('elements', () => {
    let adapter: CitrixVDIAdapter;

    beforeEach(() => {
      adapter = new CitrixVDIAdapter({ ucsdk, windowHandle: '0x1f' });
    });

    describe('isCitrixStream', () => {
      it('is true only when every track is a UCSDK track', () => {
        expect(CitrixVDIAdapter.isCitrixStream(citrixStream())).to.be.true;
        expect(CitrixVDIAdapter.isCitrixStream(browserStream())).to.be.false;
      });

      it('is false for an empty or missing stream', () => {
        expect(CitrixVDIAdapter.isCitrixStream(null)).to.be.false;
        expect(CitrixVDIAdapter.isCitrixStream(undefined)).to.be.false;
        expect(
          CitrixVDIAdapter.isCitrixStream({
            getTracks: (): unknown[] => [],
          } as unknown as MediaStream)
        ).to.be.false;
        expect(CitrixVDIAdapter.isCitrixStream({} as unknown as MediaStream)).to.be.false;
      });
    });

    describe('video elements', () => {
      let element: HTMLVideoElement;

      beforeEach(() => {
        element = document.createElement('video');
      });

      it('maps an element showing a Citrix stream once', () => {
        adapter.bindVideoElement(element, citrixStream());
        adapter.bindVideoElement(element, citrixStream());
        expect((ucsdk.mapVideoElement as sinon.SinonStub).calledOnceWith(element, '0x1f')).to.be
          .true;
      });

      it('leaves an element showing a browser stream alone', () => {
        adapter.bindVideoElement(element, browserStream());
        adapter.unbindVideoElement(element);
        expect((ucsdk.mapVideoElement as sinon.SinonStub).called).to.be.false;
        expect((ucsdk.disposeVideoElement as sinon.SinonStub).called).to.be.false;
      });

      it('disposes a mapped element on unbind', () => {
        adapter.bindVideoElement(element, citrixStream());
        adapter.unbindVideoElement(element);
        expect((ucsdk.disposeVideoElement as sinon.SinonStub).calledOnceWith(element)).to.be.true;
      });

      it('tolerates a UCSDK without disposeVideoElement', () => {
        delete ucsdk.disposeVideoElement;
        adapter.bindVideoElement(element, citrixStream());
        expect(() => adapter.unbindVideoElement(element)).to.not.throw();
      });
    });

    describe('audio elements', () => {
      let element: HTMLAudioElement;

      beforeEach(() => {
        element = new HTMLAudioElement();
      });

      it('maps an element playing a Citrix stream once', () => {
        adapter.bindAudioElement(element, citrixStream());
        adapter.bindAudioElement(element, citrixStream());
        expect((ucsdk.mapAudioElement as sinon.SinonStub).calledOnceWith(element)).to.be.true;
      });

      it('leaves an element playing a browser stream alone', () => {
        adapter.bindAudioElement(element, browserStream());
        adapter.unbindAudioElement(element);
        expect((ucsdk.mapAudioElement as sinon.SinonStub).called).to.be.false;
        expect((ucsdk.disposeAudioElement as sinon.SinonStub).called).to.be.false;
      });

      it('disposes a mapped element on unbind', () => {
        adapter.bindAudioElement(element, citrixStream());
        adapter.unbindAudioElement(element);
        expect((ucsdk.disposeAudioElement as sinon.SinonStub).calledOnceWith(element)).to.be.true;
      });

      it('tolerates a UCSDK without disposeAudioElement', () => {
        delete ucsdk.disposeAudioElement;
        adapter.bindAudioElement(element, citrixStream());
        expect(() => adapter.unbindAudioElement(element)).to.not.throw();
      });
    });
  });

  describe('connect', () => {
    let bootstrap: CitrixBootstrap;

    function makeBootstrap(handle: Promise<string>, initialized = false): CitrixBootstrap {
      return {
        initBootstrap: sinon.stub(),
        isBootstrapInitialized: sinon.stub().returns(initialized),
        getWindowHandle: sinon.stub().returns(handle),
      };
    }

    // Sends `events` through the callback the adapter registered, once it registers one.
    function emitOnRegister(...events: CitrixVMEvent[]): void {
      (ucsdk.setVMEventCallback as sinon.SinonStub).callsFake(
        (callback: (event: CitrixVMEvent) => void) => {
          setTimeout(() => events.forEach(event => callback(event)), 0);
        }
      );
    }

    it('initializes the Bootstrap and the UCSDK and resolves once the endpoint connects', async () => {
      bootstrap = makeBootstrap(Promise.resolve('0x2a'));
      emitOnRegister({ event: 'vdiClientDisconnected' }, { event: 'vdiClientConnected' });
      const adapter = await CitrixVDIAdapter.connect({
        ucsdk,
        bootstrap,
        vendor: 'Vendor',
        logger: new NoOpLogger(),
      });
      expect((bootstrap.initBootstrap as sinon.SinonStub).calledOnceWith('Vendor')).to.be.true;
      expect((ucsdk.initUCSDK as sinon.SinonStub).calledOnceWith('Vendor')).to.be.true;
      expect(
        (ucsdk.initUCSDK as sinon.SinonStub).calledAfter(
          ucsdk.setVMEventCallback as sinon.SinonStub
        )
      ).to.be.true;
      expect(adapter.windowHandle).to.equal('0x2a');
    });

    it('does not initialize a Bootstrap that is already initialized', async () => {
      bootstrap = makeBootstrap(Promise.resolve('0x2a'), true);
      emitOnRegister({ event: 'vdiClientConnected' });
      await CitrixVDIAdapter.connect({ ucsdk, bootstrap, vendor: 'Vendor' });
      expect((bootstrap.initBootstrap as sinon.SinonStub).called).to.be.false;
    });

    it('rejects when the endpoint cannot redirect WebRTC', async () => {
      bootstrap = makeBootstrap(Promise.resolve('0x2a'));
      (ucsdk.isFeatureOn as sinon.SinonStub).returns(false);
      emitOnRegister({ event: 'vdiClientConnected' });
      await expect(
        CitrixVDIAdapter.connect({ ucsdk, bootstrap, vendor: 'Vendor' })
      ).to.be.rejectedWith('does not support WebRTC redirection');
      expect((ucsdk.isFeatureOn as sinon.SinonStub).calledOnceWith('webrtc1.0')).to.be.true;
    });

    it('rejects when the Bootstrap returns no window handle', async () => {
      bootstrap = makeBootstrap(Promise.resolve(''));
      await expect(
        CitrixVDIAdapter.connect({ ucsdk, bootstrap, vendor: 'Vendor' })
      ).to.be.rejectedWith('no window handle');
      expect((ucsdk.initUCSDK as sinon.SinonStub).called).to.be.false;
    });

    it('rejects when the window handle does not arrive in time', async () => {
      bootstrap = makeBootstrap(new Promise<string>(() => {}));
      await expect(
        CitrixVDIAdapter.connect({ ucsdk, bootstrap, vendor: 'Vendor', timeoutMs: 5 })
      ).to.be.rejectedWith('timed out waiting for the window handle');
    });

    it('logs the VM events it receives', async () => {
      bootstrap = makeBootstrap(Promise.resolve('0x2a'));
      const logger = new NoOpLogger();
      const info = sinon.spy(logger, 'info');
      const warn = sinon.spy(logger, 'warn');
      emitOnRegister(
        { event: 'vdiClientDisconnected', reason: 7, msg: 'channel closed' },
        { event: 'vdiClientOther' },
        { event: 'vdiClientConnected', version: { receiver: '24.11' } }
      );
      await CitrixVDIAdapter.connect({ ucsdk, bootstrap, vendor: 'Vendor', logger });
      expect(warn.calledWith('CitrixVDIAdapter: endpoint disconnected, reason 7, channel closed'))
        .to.be.true;
      expect(info.calledWith('CitrixVDIAdapter: VM event vdiClientOther')).to.be.true;
      expect(info.calledWith('CitrixVDIAdapter: endpoint connected, version {"receiver":"24.11"}'))
        .to.be.true;
    });

    it('waits only for vdiClientConnected', async () => {
      bootstrap = makeBootstrap(Promise.resolve('0x2a'));
      emitOnRegister({ event: 'vdiClientDisconnected' }, { event: 'vdiClientOther' });
      await expect(
        CitrixVDIAdapter.connect({ ucsdk, bootstrap, vendor: 'Vendor', timeoutMs: 20 })
      ).to.be.rejectedWith('timed out waiting for the endpoint connection');
    });

    it('applies one deadline to the window handle and the endpoint connection', async () => {
      bootstrap = makeBootstrap(new Promise(resolve => setTimeout(() => resolve('0x2a'), 80)));
      const start = Date.now();
      await expect(
        CitrixVDIAdapter.connect({ ucsdk, bootstrap, vendor: 'Vendor', timeoutMs: 100 })
      ).to.be.rejectedWith('timed out waiting for the endpoint connection');
      expect(Date.now() - start).to.be.lessThan(150);
    });

    it('rejects when the endpoint does not connect in time', async () => {
      bootstrap = makeBootstrap(Promise.resolve('0x2a'));
      await expect(
        CitrixVDIAdapter.connect({ ucsdk, bootstrap, vendor: 'Vendor', timeoutMs: 5 })
      ).to.be.rejectedWith('timed out waiting for the endpoint connection');
    });
  });
});
