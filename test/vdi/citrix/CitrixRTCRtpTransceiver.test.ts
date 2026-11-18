// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import CitrixRTCPeerConnection from '../../../src/vdi/citrix/CitrixRTCPeerConnection';
import CitrixRTCRtpTransceiver from '../../../src/vdi/citrix/CitrixRTCRtpTransceiver';
import { makeCitrixAdapter } from './FakeCitrixUCSDK';

describe('CitrixRTCRtpTransceiver', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  it('forwards to the UCSDK transceiver', () => {
    const inner = {
      mid: '3',
      direction: 'sendrecv',
      currentDirection: 'recvonly',
      setCodecPreferences: sinon.stub(),
      stop: sinon.stub(),
    };
    const peer = new CitrixRTCPeerConnection({} as RTCPeerConnection, makeCitrixAdapter());
    const transceiver = new CitrixRTCRtpTransceiver(inner as unknown as RTCRtpTransceiver, peer);
    expect(transceiver.mid).to.equal('3');
    expect(transceiver.direction).to.equal('sendrecv');
    transceiver.direction = 'inactive';
    expect(inner.direction).to.equal('inactive');
    expect(transceiver.currentDirection).to.equal('recvonly');
    const codecs = [] as RTCRtpCodec[];
    transceiver.setCodecPreferences(codecs);
    expect(inner.setCodecPreferences.calledOnceWith(codecs)).to.be.true;
    transceiver.stop();
    expect(inner.stop.calledOnce).to.be.true;
    Object.values(inner)
      .filter(value => typeof value === 'function')
      .forEach(stub => expect((stub as sinon.SinonStub).alwaysCalledOn(inner)).to.be.true);
  });
});
