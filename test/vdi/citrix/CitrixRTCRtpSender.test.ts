// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import CitrixRTCRtpSender from '../../../src/vdi/citrix/CitrixRTCRtpSender';

describe('CitrixRTCRtpSender', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  it('forwards to the UCSDK sender', async () => {
    const inner = {
      dtmf: { id: 'dtmf' },
      track: { id: 'track' },
      transform: null as unknown,
      transport: { id: 'transport' },
      replaceTrack: sinon.stub().resolves(),
      getParameters: sinon.stub().returns('parameters'),
      getStats: sinon.stub().resolves('stats'),
      setParameters: sinon.stub().resolves(),
      setStreams: sinon.stub(),
    };
    const sender = new CitrixRTCRtpSender(inner as unknown as RTCRtpSender);
    expect(sender.dtmf).to.equal(inner.dtmf);
    expect(sender.track).to.equal(inner.track);
    expect(sender.transport).to.equal(inner.transport);
    const transform = {} as RTCRtpTransform;
    sender.transform = transform;
    expect(inner.transform).to.equal(transform);
    expect(sender.transform).to.equal(transform);
    const track = {} as MediaStreamTrack;
    await sender.replaceTrack(track);
    expect(inner.replaceTrack.calledOnceWith(track)).to.be.true;
    expect(sender.getParameters()).to.equal('parameters');
    expect(await sender.getStats()).to.equal('stats');
    const parameters = {} as RTCRtpSendParameters;
    const options = {} as RTCSetParameterOptions;
    await sender.setParameters(parameters, options);
    expect(inner.setParameters.calledOnceWith(parameters, options)).to.be.true;
    const stream = {} as MediaStream;
    sender.setStreams(stream);
    expect(inner.setStreams.calledOnceWith(stream)).to.be.true;
    Object.values(inner)
      .filter(value => typeof value === 'function')
      .forEach(stub => expect((stub as sinon.SinonStub).alwaysCalledOn(inner)).to.be.true);
  });
});
