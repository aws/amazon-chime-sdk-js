// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import DefaultPeerConnection from '../../src/peerconnection/DefaultPeerConnection';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultPeerConnection', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  let domMockBuilder: DOMMockBuilder;
  let native: RTCPeerConnection;
  let peer: DefaultPeerConnection;

  beforeEach(() => {
    domMockBuilder = new DOMMockBuilder(new DOMMockBehavior());
    native = new RTCPeerConnection();
    peer = new DefaultPeerConnection(native);
  });

  afterEach(() => {
    domMockBuilder.cleanup();
  });

  it('exposes the wrapped connection and its state', () => {
    expect(peer.rtcPeerConnection).to.equal(native);
    expect(peer.localDescription).to.equal(native.localDescription);
    expect(peer.iceGatheringState).to.equal(native.iceGatheringState);
    expect(peer.iceConnectionState).to.equal(native.iceConnectionState);
    expect(peer.connectionState).to.equal(native.connectionState);
  });

  it('adds and removes listeners on the wrapped connection', () => {
    const add = sinon.spy(native, 'addEventListener');
    const remove = sinon.spy(native, 'removeEventListener');
    const listener = (): void => {};
    peer.addEventListener('track', listener);
    peer.removeEventListener('track', listener);
    expect(add.calledOnceWith('track', listener)).to.be.true;
    expect(remove.calledOnceWith('track', listener)).to.be.true;
  });

  it('reports whether the wrapped connection has getTransceivers', () => {
    expect(peer.hasTransceivers()).to.be.true;
    expect(new DefaultPeerConnection({} as RTCPeerConnection).hasTransceivers()).to.be.false;
  });

  it('forwards every call to the wrapped connection', async () => {
    const calls = [
      'addTransceiver',
      'getTransceivers',
      'getReceivers',
      'createOffer',
      'setLocalDescription',
      'setRemoteDescription',
      'getStats',
      'close',
    ] as const;
    const stubs = calls.map(() => sinon.stub().resolves());
    const fake = Object.fromEntries(calls.map((name, i) => [name, stubs[i]]));
    peer = new DefaultPeerConnection(fake as unknown as RTCPeerConnection);
    peer.addTransceiver('audio', { direction: 'inactive' });
    peer.getTransceivers();
    peer.getReceivers();
    await peer.createOffer({});
    await peer.setLocalDescription({ type: 'offer', sdp: '' });
    await peer.setRemoteDescription({ type: 'answer', sdp: '' });
    await peer.getStats(null);
    peer.close();
    stubs.forEach(stub => expect(stub.calledOnce).to.be.true);
    expect(stubs[0].firstCall.args).to.deep.equal(['audio', { direction: 'inactive' }]);
    expect(stubs[6].firstCall.args).to.deep.equal([null]);
  });
});
