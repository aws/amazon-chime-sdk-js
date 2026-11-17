// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import CitrixVMEvent from './CitrixVMEvent';

/** The Citrix UCSDK (`CitrixWebRTC`) calls used here. The application supplies the object. */
export default interface CitrixUCSDK {
  initUCSDK(vendor: string): void;
  setVMEventCallback(callback: (event: CitrixVMEvent) => void): void;
  isFeatureOn(feature: string): boolean;
  CitrixPeerConnection: new (configuration: RTCConfiguration) => RTCPeerConnection;
  getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream>;
  enumerateDevices(): Promise<MediaDeviceInfo[]>;
  mapVideoElement(element: HTMLVideoElement, windowHandle: string): void;
  disposeVideoElement?(element: HTMLVideoElement): void;
  mapAudioElement(element: HTMLAudioElement): void;
  disposeAudioElement?(element: HTMLAudioElement): void;
}
