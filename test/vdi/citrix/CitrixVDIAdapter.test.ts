// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';

import NoOpLogger from '../../../src/logger/NoOpLogger';
import CitrixBootstrap from '../../../src/vdi/citrix/CitrixBootstrap';
import CitrixMediaDevices from '../../../src/vdi/citrix/CitrixMediaDevices';
import CitrixRTCPeerConnection, { unwrap } from '../../../src/vdi/citrix/CitrixRTCPeerConnection';
import CitrixUCSDK from '../../../src/vdi/citrix/CitrixUCSDK';
import CitrixVDIAdapter from '../../../src/vdi/citrix/CitrixVDIAdapter';
import CitrixVMEvent from '../../../src/vdi/citrix/CitrixVMEvent';
import DOMMockBehavior from '../../dommock/DOMMockBehavior';
import DOMMockBuilder from '../../dommock/DOMMockBuilder';
import {
  browserStream,
  citrixStream,
  FakePeerConnection,
  FakeUcsdk,
  makeUcsdk,
} from './FakeCitrixUCSDK';

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

  it('creates the UCSDK peer connection, wrapped', () => {
    const configuration = { iceServers: [] as RTCIceServer[] };
    const adapter = new CitrixVDIAdapter({ ucsdk, windowHandle: '0x1f', logger: new NoOpLogger() });
    const peer = adapter.createPeerConnection(configuration);
    expect(peer).to.be.instanceOf(CitrixRTCPeerConnection);
    expect(unwrap(peer)).to.be.instanceOf(FakePeerConnection);
    expect((unwrap(peer) as unknown as FakePeerConnection).configuration).to.equal(configuration);
    expect(
      unwrap(new CitrixVDIAdapter({ ucsdk, windowHandle: '0x1f' }).createPeerConnection({}))
    ).to.be.instanceOf(FakePeerConnection);
  });

  describe('elements', () => {
    let fake: FakeUcsdk;
    let adapter: CitrixVDIAdapter;

    beforeEach(() => {
      fake = ucsdk as FakeUcsdk;
      adapter = new CitrixVDIAdapter({ ucsdk, windowHandle: '0x1f' });
    });

    describe('video elements', () => {
      let element: HTMLVideoElement;

      beforeEach(() => {
        element = document.createElement('video');
      });

      it('maps an element showing a Citrix stream once', () => {
        adapter.bindVideoElement(element, citrixStream());
        adapter.bindVideoElement(element, citrixStream());
        expect((ucsdk.mapVideoElement as sinon.SinonSpy).calledOnceWith(element, '0x1f')).to.be
          .true;
      });

      it('leaves an element showing a browser stream or no tracks alone', () => {
        adapter.bindVideoElement(element, browserStream());
        adapter.bindVideoElement(element, {
          getTracks: (): unknown[] => [],
        } as unknown as MediaStream);
        adapter.unbindVideoElement(element);
        expect((ucsdk.mapVideoElement as sinon.SinonSpy).called).to.be.false;
        expect((ucsdk.disposeVideoElement as sinon.SinonSpy).called).to.be.false;
      });

      it('disposes a mapped element with the window handle and maps it again later', () => {
        adapter.bindVideoElement(element, citrixStream());
        adapter.unbindVideoElement(element);
        adapter.bindVideoElement(element, citrixStream());
        expect((ucsdk.disposeVideoElement as sinon.SinonSpy).calledOnceWith(element, '0x1f')).to.be
          .true;
        expect((ucsdk.mapVideoElement as sinon.SinonSpy).calledTwice).to.be.true;
      });

      it('disposes a mapped element given a browser stream, which it then shows', () => {
        adapter.bindVideoElement(element, citrixStream());
        const stream = browserStream();
        adapter.bindVideoElement(element, stream);
        element.srcObject = stream;
        expect((ucsdk.disposeVideoElement as sinon.SinonSpy).calledOnceWith(element, '0x1f')).to.be
          .true;
        expect(element.srcObject).to.equal(stream);
      });

      it('maps again an element the UCSDK ignored while disconnected', () => {
        fake.disconnected = true;
        adapter.bindVideoElement(element, citrixStream());
        fake.disconnected = false;
        adapter.bindVideoElement(element, citrixStream());
        expect((ucsdk.mapVideoElement as sinon.SinonSpy).calledTwice).to.be.true;
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
        expect((ucsdk.mapAudioElement as sinon.SinonSpy).calledOnceWith(element)).to.be.true;
      });

      it('leaves an element playing a browser stream alone', () => {
        adapter.bindAudioElement(element, browserStream());
        adapter.unbindAudioElement(element);
        expect((ucsdk.mapAudioElement as sinon.SinonSpy).called).to.be.false;
        expect((ucsdk.disposeAudioElement as sinon.SinonSpy).called).to.be.false;
      });

      it('disposes a mapped element and maps it again later', () => {
        adapter.bindAudioElement(element, citrixStream());
        adapter.unbindAudioElement(element);
        adapter.bindAudioElement(element, citrixStream());
        expect((ucsdk.disposeAudioElement as sinon.SinonSpy).calledOnceWith(element)).to.be.true;
        expect((ucsdk.mapAudioElement as sinon.SinonSpy).calledTwice).to.be.true;
      });

      it('disposes a mapped element given a browser stream, which it then plays', () => {
        adapter.bindAudioElement(element, citrixStream());
        const stream = browserStream();
        adapter.bindAudioElement(element, stream);
        element.srcObject = stream;
        expect((ucsdk.disposeAudioElement as sinon.SinonSpy).calledOnceWith(element)).to.be.true;
        expect(element.srcObject).to.equal(stream);
      });

      it('restores the element after dispose', () => {
        adapter.bindAudioElement(element, citrixStream());
        adapter.unbindAudioElement(element);
        expect((): void => {
          element.srcObject = null;
        }).to.not.throw();
      });

      it('maps again an element the UCSDK ignored while disconnected', () => {
        fake.disconnected = true;
        adapter.bindAudioElement(element, citrixStream());
        fake.disconnected = false;
        adapter.bindAudioElement(element, citrixStream());
        expect((ucsdk.mapAudioElement as sinon.SinonSpy).calledTwice).to.be.true;
      });

      it('sets the default sink on the endpoint for the empty sink ID', async () => {
        adapter.bindAudioElement(element, citrixStream());
        await element.setSinkId('speaker');
        expect(element.sinkId).to.equal('speaker');
        await element.setSinkId('');
        expect(element.sinkId).to.equal('default');
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

    it('applies the timeout to each wait', async () => {
      bootstrap = makeBootstrap(new Promise(resolve => setTimeout(() => resolve('0x2a'), 30)));
      const start = Date.now();
      await expect(
        CitrixVDIAdapter.connect({ ucsdk, bootstrap, vendor: 'Vendor', timeoutMs: 50 })
      ).to.be.rejectedWith('timed out waiting for the endpoint connection');
      expect(Date.now() - start).to.be.at.least(75);
    });

    it('waits 10 s for each by default', async () => {
      const clock = sinon.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      try {
        bootstrap = makeBootstrap(new Promise<string>(() => {}));
        let rejected = false;
        const result = CitrixVDIAdapter.connect({ ucsdk, bootstrap, vendor: 'Vendor' });
        result.catch(() => (rejected = true));
        await clock.tickAsync(9999);
        expect(rejected).to.be.false;
        await clock.tickAsync(1);
        await expect(result).to.be.rejectedWith('timed out waiting for the window handle');
      } finally {
        clock.restore();
      }
    });

    it('rejects when the endpoint does not connect in time', async () => {
      bootstrap = makeBootstrap(Promise.resolve('0x2a'));
      await expect(
        CitrixVDIAdapter.connect({ ucsdk, bootstrap, vendor: 'Vendor', timeoutMs: 5 })
      ).to.be.rejectedWith('timed out waiting for the endpoint connection');
    });
  });
});
