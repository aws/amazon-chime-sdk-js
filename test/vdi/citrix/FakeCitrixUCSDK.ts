// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as sinon from 'sinon';

import CitrixUCSDK from '../../../src/vdi/citrix/CitrixUCSDK';
import CitrixVDIAdapter from '../../../src/vdi/citrix/CitrixVDIAdapter';

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

export type FakeUcsdk = CitrixUCSDK & { disconnected: boolean };

/* eslint-disable @typescript-eslint/no-explicit-any */
// Like the UCSDK: map ignores the call while the endpoint is disconnected,
// redefines srcObject and setSinkId to forward to a remote element, and dispose
// removes the remote element without restoring them.
function mapElement(ucsdk: FakeUcsdk, element: any, property: string): void {
  if (ucsdk.disconnected || element[property] !== undefined) {
    return;
  }
  const remote = {
    srcObject: null as MediaStream | null,
    sinkId: '',
    setSinkId(sinkId: string): Promise<void> {
      if (sinkId === '') {
        return Promise.reject(new DOMException('Invalid sink id', 'NotFoundError'));
      }
      remote.sinkId = sinkId;
      return Promise.resolve();
    },
  };
  element[property] = remote;
  Object.defineProperty(element, 'srcObject', {
    configurable: true,
    get: () => element[property]?.srcObject,
    set: (stream: MediaStream | null) => {
      element[property].srcObject = stream;
    },
  });
  Object.defineProperty(element, 'sinkId', {
    configurable: true,
    get: () => element[property]?.sinkId,
  });
  element.setSinkId = (sinkId: string): Promise<void> => element[property].setSinkId(sinkId);
}

function disposeElement(element: any, property: string): void {
  element[property] = undefined;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function makeUcsdk(devices: MediaDeviceInfo[] = []): FakeUcsdk {
  const ucsdk: FakeUcsdk = {
    disconnected: false,
    CitrixPeerConnection: FakePeerConnection as unknown as new (
      configuration: RTCConfiguration
    ) => RTCPeerConnection,
    getUserMedia: sinon.stub().resolves(citrixStream()),
    enumerateDevices: sinon.stub().resolves(devices),
    initUCSDK: sinon.stub(),
    setVMEventCallback: sinon.stub(),
    isFeatureOn: sinon.stub().returns(true),
    mapVideoElement: sinon.spy((element: HTMLVideoElement) =>
      mapElement(ucsdk, element, 'remoteVideoElement')
    ),
    disposeVideoElement: sinon.spy((element: HTMLVideoElement) =>
      disposeElement(element, 'remoteVideoElement')
    ),
    mapAudioElement: sinon.spy((element: HTMLAudioElement) =>
      mapElement(ucsdk, element, 'remoteAudioElement')
    ),
    disposeAudioElement: sinon.spy((element: HTMLAudioElement) =>
      disposeElement(element, 'remoteAudioElement')
    ),
  };
  return ucsdk;
}

export function makeCitrixAdapter(ucsdk: CitrixUCSDK = makeUcsdk()): CitrixVDIAdapter {
  return new CitrixVDIAdapter({ ucsdk, windowHandle: '0x1f' });
}
