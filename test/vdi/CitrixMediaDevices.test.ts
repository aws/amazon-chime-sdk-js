// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import NoOpLogger from '../../src/logger/NoOpLogger';
import CitrixMediaDevices from '../../src/vdi/CitrixMediaDevices';
import CitrixUCSDK from '../../src/vdi/CitrixUCSDK';
import CitrixVDIAdapter from '../../src/vdi/CitrixVDIAdapter';
import { makeUcsdk } from './FakeCitrixUCSDK';

describe('CitrixMediaDevices', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  let ucsdk: CitrixUCSDK;

  beforeEach(() => {
    ucsdk = makeUcsdk();
  });

  it('opens and lists devices through the UCSDK', async () => {
    const adapter = new CitrixVDIAdapter({ ucsdk, windowHandle: '0x1f', logger: new NoOpLogger() });
    const devices = new CitrixMediaDevices(adapter);
    await devices.getUserMedia({ video: true });
    await devices.enumerateDevices();
    expect((ucsdk.getUserMedia as sinon.SinonStub).calledOnceWith({ video: true })).to.be.true;
    expect((ucsdk.enumerateDevices as sinon.SinonStub).calledOnce).to.be.true;
  });

  it('works without a logger', async () => {
    const devices = new CitrixMediaDevices(new CitrixVDIAdapter({ ucsdk, windowHandle: '0x1f' }));
    await devices.getUserMedia({ audio: true });
    expect((ucsdk.getUserMedia as sinon.SinonStub).calledOnceWith({ audio: true })).to.be.true;
  });
});
