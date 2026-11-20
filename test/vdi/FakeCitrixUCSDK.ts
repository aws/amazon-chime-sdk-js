// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as sinon from 'sinon';

import CitrixUCSDK from '../../src/vdi/CitrixUCSDK';
import CitrixVDIAdapter from '../../src/vdi/CitrixVDIAdapter';

// A UCSDK proxy track exposes `object_id()`; a browser track does not.
export function citrixStream(): MediaStream {
  const track = { kind: 'audio', enabled: true, object_id: (): string => 'id' };
  return {
    getTracks: () => [track],
    getAudioTracks: () => [track],
  } as unknown as MediaStream;
}

export function browserStream(): MediaStream {
  const track = { kind: 'video', enabled: true };
  return {
    getTracks: () => [track],
    getAudioTracks: (): unknown[] => [],
  } as unknown as MediaStream;
}

export class FakePeerConnection {
  constructor(public configuration: RTCConfiguration) {}
}

export function makeUcsdk(devices: MediaDeviceInfo[] = []): CitrixUCSDK {
  return {
    CitrixPeerConnection: FakePeerConnection as unknown as new (
      configuration: RTCConfiguration
    ) => RTCPeerConnection,
    getUserMedia: sinon.stub().resolves(citrixStream()),
    enumerateDevices: sinon.stub().resolves(devices),
    initUCSDK: sinon.stub(),
    setVMEventCallback: sinon.stub(),
    isFeatureOn: sinon.stub().returns(true),
    mapVideoElement: sinon.stub(),
    disposeVideoElement: sinon.stub(),
    mapAudioElement: sinon.stub(),
    disposeAudioElement: sinon.stub(),
  };
}

export function makeCitrixAdapter(ucsdk: CitrixUCSDK = makeUcsdk()): CitrixVDIAdapter {
  return new CitrixVDIAdapter({ ucsdk, windowHandle: '0x1f' });
}
