// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import NoOpLogger from '../../../src/logger/NoOpLogger';
import CitrixRTCPeerConnection, { unwrap } from '../../../src/vdi/citrix/CitrixRTCPeerConnection';
import CitrixRTCRtpReceiver from '../../../src/vdi/citrix/CitrixRTCRtpReceiver';
import CitrixRTCRtpSender from '../../../src/vdi/citrix/CitrixRTCRtpSender';
import CitrixRTCRtpTransceiver from '../../../src/vdi/citrix/CitrixRTCRtpTransceiver';
import CitrixUCSDK from '../../../src/vdi/citrix/CitrixUCSDK';
import CitrixVDIAdapter from '../../../src/vdi/citrix/CitrixVDIAdapter';
import { makeUcsdk } from './FakeCitrixUCSDK';

// A UCSDK transceiver with its own sender and receiver.
class FakeTransceiver {
  sender = { kind: 'sender' };
  receiver = { kind: 'receiver' };

  constructor(public reported: string | null = null) {}

  get mid(): string | null {
    return this.reported;
  }
}

describe('CitrixRTCPeerConnection', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  let ucsdk: CitrixUCSDK;
  let adapter: CitrixVDIAdapter;

  beforeEach(() => {
    ucsdk = makeUcsdk();
    adapter = new CitrixVDIAdapter({ ucsdk, windowHandle: '0x1f', logger: new NoOpLogger() });
  });

  // A UCSDK connection whose getTransceivers() returns `listed`; addTransceiver returns `added`.
  function peerWith(listed: object[], added: object = new FakeTransceiver()): RTCPeerConnection {
    ucsdk.CitrixPeerConnection = class {
      addTransceiver(): object {
        return added;
      }
      getTransceivers(): object[] {
        return listed;
      }
    } as unknown as CitrixUCSDK['CitrixPeerConnection'];
    return adapter.createPeerConnection({});
  }

  it('wraps the UCSDK peer connection', () => {
    const peer = peerWith([]);
    expect(peer).to.be.instanceOf(CitrixRTCPeerConnection);
    expect(unwrap(peer)).to.be.instanceOf(ucsdk.CitrixPeerConnection);
    const plain = {};
    expect(unwrap(plain)).to.equal(plain);
  });

  describe('identity', () => {
    it('hands out one wrapper per UCSDK transceiver, sender and receiver', () => {
      const transceiver = new FakeTransceiver('0');
      const peer = peerWith([transceiver], transceiver);
      const wrapped = peer.getTransceivers()[0];
      expect(wrapped).to.be.instanceOf(CitrixRTCRtpTransceiver);
      expect(peer.getTransceivers()[0]).to.equal(wrapped);
      expect(peer.addTransceiver('audio')).to.equal(wrapped);
      expect(wrapped.sender).to.be.instanceOf(CitrixRTCRtpSender);
      expect(wrapped.sender).to.equal(wrapped.sender);
      expect(wrapped.receiver).to.be.instanceOf(CitrixRTCRtpReceiver);
      expect(wrapped.receiver).to.equal(wrapped.receiver);
    });

    it('wraps getSenders, getReceivers and addTrack, and unwraps removeTrack', () => {
      const sender = { kind: 'sender' };
      const receiver = { kind: 'receiver' };
      const inner = {
        getSenders: (): object[] => [sender],
        getReceivers: (): object[] => [receiver],
        addTrack: sinon.stub().returns(sender),
        removeTrack: sinon.stub(),
      };
      const peer = new CitrixRTCPeerConnection(inner as unknown as RTCPeerConnection, adapter);
      const track = {} as MediaStreamTrack;
      const stream = {} as MediaStream;
      const added = peer.addTrack(track, stream);
      expect(inner.addTrack.calledWith(track, stream)).to.be.true;
      expect(added).to.be.instanceOf(CitrixRTCRtpSender);
      expect(peer.getSenders()).to.deep.equal([added]);
      expect(peer.getSenders()[0]).to.equal(added);
      expect(peer.getReceivers()[0]).to.be.instanceOf(CitrixRTCRtpReceiver);
      peer.removeTrack(added);
      expect(inner.removeTrack.calledWith(sender)).to.be.true;
    });
  });

  describe('track event', () => {
    let target: EventTarget & { ontrack?: (event: RTCTrackEvent) => void };
    let peer: CitrixRTCPeerConnection;
    const transceiver = new FakeTransceiver('1');
    const event = {
      type: 'track',
      track: { id: 't' },
      streams: [{ id: 's' }],
      receiver: transceiver.receiver,
      transceiver,
    };

    beforeEach(() => {
      const listeners = new Map<string, Set<EventListener>>();
      target = {
        addEventListener: (type: string, l: EventListener) => {
          listeners.set(type, (listeners.get(type) ?? new Set()).add(l));
        },
        removeEventListener: (type: string, l: EventListener) => listeners.get(type)?.delete(l),
        dispatchEvent: (e: Event) => {
          listeners.get(e.type)?.forEach(l => l(e));
          return true;
        },
      };
      peer = new CitrixRTCPeerConnection(target as unknown as RTCPeerConnection, adapter);
    });

    it('hands track listeners the wrapped transceiver and receiver', () => {
      const received: RTCTrackEvent[] = [];
      peer.addEventListener('track', (e: RTCTrackEvent) => received.push(e));
      target.dispatchEvent(event as unknown as Event);
      expect(received[0].transceiver).to.equal(
        peer.wrapTransceiver(transceiver as unknown as RTCRtpTransceiver)
      );
      expect(received[0].receiver).to.equal(
        peer.wrapReceiver(transceiver.receiver as unknown as RTCRtpReceiver)
      );
      expect(received[0].track).to.equal(event.track);
      expect(received[0].streams).to.equal(event.streams);
      expect(received[0].type).to.equal('track');
    });

    it('passes a track event without a transceiver through', () => {
      const received: RTCTrackEvent[] = [];
      peer.addEventListener('track', (e: RTCTrackEvent) => received.push(e));
      target.dispatchEvent({ ...event, transceiver: undefined } as unknown as Event);
      expect(received[0].transceiver).to.be.undefined;
    });

    it('adds a track listener once however often it is added', () => {
      const listener = sinon.stub();
      peer.addEventListener('track', listener);
      peer.addEventListener('track', listener);
      target.dispatchEvent(event as unknown as Event);
      expect(listener.calledOnce).to.be.true;
      peer.removeEventListener('track', listener);
      target.dispatchEvent(event as unknown as Event);
      expect(listener.calledOnce).to.be.true;
    });

    it('ignores a null track listener', () => {
      peer.addEventListener('track', null);
      expect(() => target.dispatchEvent(event as unknown as Event)).to.not.throw();
    });

    it('supports listener objects', () => {
      const handleEvent = sinon.stub();
      peer.addEventListener('track', { handleEvent });
      target.dispatchEvent(event as unknown as Event);
      expect(handleEvent.calledOnce).to.be.true;
    });

    it('removes a track listener', () => {
      const listener = sinon.stub();
      peer.addEventListener('track', listener);
      peer.removeEventListener('track', listener);
      target.dispatchEvent(event as unknown as Event);
      expect(listener.called).to.be.false;
    });

    it('forwards other listeners unchanged', () => {
      const listener = sinon.stub();
      peer.addEventListener('icecandidate', listener);
      target.dispatchEvent({ type: 'icecandidate' } as Event);
      peer.removeEventListener('icecandidate', listener);
      target.dispatchEvent({ type: 'icecandidate' } as Event);
      expect(listener.calledOnce).to.be.true;
    });

    it('wraps the event for ontrack', () => {
      const handler = sinon.stub();
      peer.ontrack = handler;
      expect(peer.ontrack).to.equal(handler);
      target.ontrack(event as unknown as RTCTrackEvent);
      expect(handler.firstCall.thisValue).to.equal(peer);
      expect(handler.firstCall.args[0].transceiver).to.be.instanceOf(CitrixRTCRtpTransceiver);
      peer.ontrack = null;
      expect(target.ontrack).to.equal(null);
    });
  });

  describe('forwards', () => {
    const getters = [
      'canTrickleIceCandidates',
      'connectionState',
      'currentLocalDescription',
      'currentRemoteDescription',
      'iceConnectionState',
      'iceGatheringState',
      'localDescription',
      'pendingLocalDescription',
      'pendingRemoteDescription',
      'remoteDescription',
      'sctp',
      'signalingState',
    ];
    const handlers = [
      'onconnectionstatechange',
      'ondatachannel',
      'onicecandidate',
      'onicecandidateerror',
      'oniceconnectionstatechange',
      'onicegatheringstatechange',
      'onnegotiationneeded',
      'onsignalingstatechange',
    ];
    // Each method and the arguments it passes on when called with ('a', 'b').
    const methods: Record<string, string[]> = {
      close: [],
      createDataChannel: ['a', 'b'],
      dispatchEvent: ['a'],
      getConfiguration: [],
      getStats: ['a'],
      restartIce: [],
      setConfiguration: ['a'],
      addIceCandidate: ['a', 'b'],
      createAnswer: ['a', 'b'],
      createOffer: ['a', 'b'],
      setLocalDescription: ['a', 'b'],
      setRemoteDescription: ['a', 'b'],
    };

    it('reads properties from the UCSDK connection', () => {
      const inner: Record<string, unknown> = {};
      getters.forEach(name => (inner[name] = { name }));
      const peer = new CitrixRTCPeerConnection(inner as unknown as RTCPeerConnection, adapter);
      getters.forEach(name =>
        expect((peer as unknown as Record<string, unknown>)[name], name).to.equal(inner[name])
      );
    });

    it('returns the signaling state handler the UCSDK cannot read back', () => {
      const set = sinon.stub();
      const inner = {};
      Object.defineProperty(inner, 'onsignalingstatechange', { set });
      const peer = new CitrixRTCPeerConnection(inner as unknown as RTCPeerConnection, adapter);
      const handler = (): void => {};
      peer.onsignalingstatechange = handler;
      expect(set.calledOnceWith(handler)).to.be.true;
      expect(peer.onsignalingstatechange).to.equal(handler);
    });

    it('logs a rejected restartIce or setConfiguration', async () => {
      const warn = sinon.stub(adapter.logger, 'warn');
      const inner = {
        restartIce: (): Promise<void> => Promise.reject(new Error('restart')),
        setConfiguration: (): Promise<void> => Promise.reject(new Error('configuration')),
      };
      const peer = new CitrixRTCPeerConnection(inner as unknown as RTCPeerConnection, adapter);
      peer.restartIce();
      peer.setConfiguration({});
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(warn.args.map(args => args[0])).to.deep.equal([
        'CitrixVDIAdapter: restartIce failed: Error: restart',
        'CitrixVDIAdapter: setConfiguration failed: Error: configuration',
      ]);
    });

    it('works without a logger', async () => {
      const inner = { restartIce: (): Promise<void> => Promise.reject(new Error('restart')) };
      const peer = new CitrixRTCPeerConnection(
        inner as unknown as RTCPeerConnection,
        new CitrixVDIAdapter({ ucsdk, windowHandle: '0x1f' })
      );
      peer.restartIce();
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    it('reads and sets event handlers on the UCSDK connection', () => {
      const inner: Record<string, unknown> = {};
      const peer = new CitrixRTCPeerConnection(inner as unknown as RTCPeerConnection, adapter);
      const view = peer as unknown as Record<string, unknown>;
      handlers.forEach(name => {
        const handler = (): void => {};
        view[name] = handler;
        expect(inner[name], name).to.equal(handler);
        expect(view[name], name).to.equal(handler);
      });
    });

    it('calls methods on the UCSDK connection with the same arguments', () => {
      const inner: Record<string, sinon.SinonStub> = {};
      Object.keys(methods).forEach(name => (inner[name] = sinon.stub().returns(name)));
      const peer = new CitrixRTCPeerConnection(inner as unknown as RTCPeerConnection, adapter);
      const view = peer as unknown as Record<string, (...args: unknown[]) => unknown>;
      Object.entries(methods).forEach(([name, args]) => {
        const result = view[name]('a', 'b');
        expect(inner[name].calledOnce, name).to.be.true;
        expect(inner[name].firstCall.args, name).to.deep.equal(args);
        expect(inner[name].firstCall.thisValue, name).to.equal(inner);
        if (!['close', 'restartIce', 'setConfiguration'].includes(name)) {
          expect(result, name).to.equal(name);
        }
      });
    });
  });
});
