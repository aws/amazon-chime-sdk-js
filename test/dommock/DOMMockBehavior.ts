// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default class DOMMockBehavior {
  asyncWaitMs: number = 10;
  getUserMediaSucceeds: boolean = true;
  getUserMediaAudioLabel: string = 'Default';
  webSocketOpenSucceeds: boolean = true;
  webSocketSendSucceeds: boolean = true;
  webSocketCloseSucceeds: boolean = true;
  webSocketSendEcho: boolean = true;
  iceConnectionStates: string[] = ['completed'];
  FakeTURNCredentialsBody: Promise<object> = new Promise((resolve, _reject) => {
    let obj: object = new Object({
      username: 'fakeUsername',
      password: 'fakeTURNCredentials',
      ttl: Infinity,
      uris: ['fakeUDPURI', 'fakeTCPURI'],
    });
    resolve(obj);
  });
  devicePixelRatio: number | null = 1;
  setLocalDescriptionSucceeds: boolean = true;
  setRemoteDescriptionStreamId: string = 'bc20510c2a134aa798f4dc9982f7c4a3adk';
  setRemoteDescriptionNumberOfTracks: number = 1;
  setRemoteDescriptionAddTrackSucceeds: boolean = true;
  mediaStreamTrackCapabilities: { width: number; height: number } = {
    width: 0,
    height: 0,
  };

  mediaStreamTrackSettings: {
    width: number;
    height: number;
    deviceId: string;
    facingMode?: string;
  } = {
    width: 0,
    height: 0,
    deviceId: 'test',
    facingMode: 'user',
  };

  deviceCounter: number = 0;
  enumerateDevicesSucceeds: boolean = true;
  enumerateDevicesSupported: boolean = true;
  enumerateAudioOutputDeviceSupported: boolean = true;
  mediaDeviceInfoSupported: boolean = true;
  rtcPeerConnectionGetStatsSucceeds: boolean = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rtcPeerConnectionGetStatsReport: { [name: string]: any } = {};
  rtcPeerConnectionCreateOfferIncludesLocalHost: boolean = false;

  rtcPeerConnectionCreateOfferWithSendingSsrcChange: boolean = false;

  rtcPeerConnectionUseCustomOffer: boolean = false;
  rtcPeerConnectionCustomOffer: string = 'sdp-offer';
  browserName: string = 'firefox';
  fetchSucceeds: boolean = true;
  responseSuccess: boolean = true;
  responseStatusCode: number = 200;
  hasInactiveTransceiver: boolean = false;
}
