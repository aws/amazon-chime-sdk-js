// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import CitrixRTCRtpReceiver from '../../../src/vdi/citrix/CitrixRTCRtpReceiver';

describe('CitrixRTCRtpReceiver', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  it('forwards to the UCSDK receiver', async () => {
    const inner = {
      jitterBufferTarget: null as number | null,
      track: { id: 'track' },
      transform: null as unknown,
      transport: { id: 'transport' },
      getContributingSources: sinon.stub().returns('contributing'),
      getParameters: sinon.stub().returns('parameters'),
      getStats: sinon.stub().resolves('stats'),
      getSynchronizationSources: sinon.stub().returns('synchronization'),
    };
    const receiver = new CitrixRTCRtpReceiver(inner as unknown as RTCRtpReceiver);
    receiver.jitterBufferTarget = 100;
    expect(inner.jitterBufferTarget).to.equal(100);
    expect(receiver.jitterBufferTarget).to.equal(100);
    expect(receiver.track).to.equal(inner.track);
    expect(receiver.transport).to.equal(inner.transport);
    const transform = {} as RTCRtpTransform;
    receiver.transform = transform;
    expect(inner.transform).to.equal(transform);
    expect(receiver.transform).to.equal(transform);
    expect(receiver.getContributingSources()).to.equal('contributing');
    expect(receiver.getParameters()).to.equal('parameters');
    expect(await receiver.getStats()).to.equal('stats');
    expect(receiver.getSynchronizationSources()).to.equal('synchronization');
    Object.values(inner)
      .filter(value => typeof value === 'function')
      .forEach(stub => expect((stub as sinon.SinonStub).alwaysCalledOn(inner)).to.be.true);
  });
});
