// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Substitute } from '@fluffy-spoon/substitute';

import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import SafariSDPMock from '../sdp/SafariSDPMock';
import DOMMockBehavior from './DOMMockBehavior';

// eslint-disable-next-line
const GlobalAny = global as any;
// eslint-disable-next-line
type MockMediaStreamConstraints = any;
// eslint-disable-next-line
type MockMessageEventInit = any;
// eslint-disable-next-line
type MockCloseEventInit = any;
type MockListener = (event: Event | MessageEvent | CloseEvent) => void;
// eslint-disable-next-line
type RawMetricReport = any;

interface EventListenerObjectWrapper {
  type: string;
  listener: EventListenerOrEventListenerObject;
}
export default class DOMMockBuilder {
  constructor(mockBehavior?: DOMMockBehavior) {
    mockBehavior = mockBehavior || new DOMMockBehavior();
    const asyncWait = (func: () => void): void => {
      new TimeoutScheduler(mockBehavior.asyncWaitMs).start(func);
    };

    GlobalAny.MessageEvent = class MockMessageEvent {
      data: ArrayBuffer;

      constructor(public type: string, init: MockMessageEventInit = {}) {
        this.data = init.data;
      }
    };

    GlobalAny.CloseEvent = class MockCloseEvent {
      code: number;
      reason: string;

      constructor(public type: string, init: MockCloseEventInit = {}) {
        this.code = init.code;
        this.reason = init.reason;
      }
    };

    GlobalAny.WebSocket = class MockWebSocket {
      static readonly CONNECTING = 0;
      static readonly OPEN = 1;
      static readonly CLOSING = 2;
      static readonly CLOSED = 3;

      private listeners: { [type: string]: MockListener[] } = {};

      readyState: number = MockWebSocket.CONNECTING;

      constructor(public readonly url: string, public protocols?: string | string[]) {
        if (mockBehavior.webSocketOpenSucceeds) {
          asyncWait(() => {
            this.readyState = MockWebSocket.OPEN;
            if (this.listeners.hasOwnProperty('open')) {
              this.listeners.open.forEach((listener: MockListener) =>
                listener({
                  ...Substitute.for(),
                  type: 'open',
                })
              );
            }
          });
        } else {
          asyncWait(() => {
            if (this.listeners.hasOwnProperty('error')) {
              this.listeners.error.forEach((listener: MockListener) =>
                listener({
                  ...Substitute.for(),
                  type: 'error',
                })
              );
            }
          });
        }
      }

      send(data: ArrayBuffer): void {
        if (mockBehavior.webSocketSendSucceeds) {
          asyncWait(() => {
            if (mockBehavior.webSocketSendEcho && this.listeners.hasOwnProperty('message')) {
              this.listeners.message.forEach((listener: MockListener) =>
                listener(
                  new MessageEvent('server::message', {
                    data: data,
                    origin: this.url,
                  })
                )
              );
            }
          });
        } else {
          if (this.listeners.hasOwnProperty('error')) {
            this.listeners.error.forEach((listener: MockListener) =>
              listener({
                ...Substitute.for(),
                type: 'error',
              })
            );
          }
          throw new Error();
        }
      }

      addEventListener(type: string, listener: (event?: Event) => void): void {
        if (!this.listeners.hasOwnProperty(type)) {
          this.listeners[type] = [];
        }
        this.listeners[type].push(listener);
      }

      close(code: number = 1000, reason: string = 'normal'): void {
        this.readyState = MockWebSocket.CLOSING;
        if (mockBehavior.webSocketCloseSucceeds) {
          asyncWait(() => {
            this.readyState = MockWebSocket.CLOSED;
            if (this.listeners.hasOwnProperty('close')) {
              const event = new CloseEvent(reason, {
                code: code,
                reason: reason,
              });
              this.listeners.close.forEach((listener: MockListener) => listener(event));
            }
          });
        } else {
          asyncWait(() => {
            if (this.listeners.hasOwnProperty('error')) {
              this.listeners.error.forEach((listener: MockListener) =>
                listener({
                  ...Substitute.for(),
                  type: 'error',
                })
              );
            }
          });
        }
      }
    };
    GlobalAny.devicechange = class MockMessageEvent {
      data: ArrayBuffer;

      constructor(public type: string, init: MockMessageEventInit = {}) {
        this.data = init.data;
      }
    };

    GlobalAny.MediaStreamTrack = class MockMediaStreamTrack {
      private listeners: { [type: string]: MockListener[] } = {};
      private readyState: string = 'live';

      readonly id: string;
      readonly kind: string = '';
      readonly constraints: MockMediaStreamConstraints = {};
      readonly label: string = '';

      constructor(id: string, kind: string) {
        this.id = id;
        this.kind = kind;
      }

      stop(): void {
        if (this.readyState === 'live') {
          this.readyState = 'ended';
          if (this.listeners.hasOwnProperty('ended')) {
            this.listeners.ended.forEach((listener: MockListener) =>
              listener({
                ...Substitute.for(),
                type: 'ended',
              })
            );
          }
        }
      }

      getCapabilities(): MediaTrackCapabilities {
        return {
          width: mockBehavior.mediaStreamTrackCapabilities.width as ULongRange,
          height: mockBehavior.mediaStreamTrackCapabilities.height as ULongRange,
        };
      }

      getSettings(): MediaTrackSettings {
        return {
          width: mockBehavior.mediaStreamTrackSettings.width,
          height: mockBehavior.mediaStreamTrackSettings.height,
          deviceId: mockBehavior.mediaStreamTrackSettings.deviceId,
          facingMode: mockBehavior.mediaStreamTrackSettings.facingMode,
        };
      }

      addEventListener(type: string, listener: MockListener): void {
        if (!this.listeners.hasOwnProperty(type)) {
          this.listeners[type] = [];
        }
        this.listeners[type].push(listener);
      }

      removeEventListener(type: string, listener: MockListener): void {
        if (this.listeners.hasOwnProperty(type)) {
          this.listeners[type] = this.listeners[type].filter(
            eachListener => eachListener !== listener
          );
        }
      }

      applyConstraints(_constraints?: MediaTrackConstraints): Promise<void> {
        if (mockBehavior.applyConstraintSucceeds) {
          return;
        } else {
          throw Error('overconstrained');
        }
      }
    };

    GlobalAny.MediaStream = class MockMediaStream {
      private listeners: { [type: string]: MockListener[] } = {};

      id: string = '';
      constraints: MockMediaStreamConstraints = {};
      tracks: typeof GlobalAny.MediaStreamTrack[] = [];

      constructor(tracks: typeof GlobalAny.MediaStreamTrack[] = []) {
        this.tracks = tracks;
      }

      addTrack(track: MediaStreamTrack): void {
        this.tracks.push(track);
      }

      removeTrack(track: MediaStreamTrack): void {
        this.tracks = this.tracks.filter(eachTrack => eachTrack.id !== track.id);

        if (this.listeners.hasOwnProperty('removetrack')) {
          this.listeners.removetrack.forEach((listener: MockListener) =>
            listener({
              ...Substitute.for(),
              type: 'removetrack',
            })
          );
        }
      }

      getTracks(): typeof GlobalAny.MediaStreamTrack[] {
        return this.tracks;
      }

      getVideoTracks(): typeof GlobalAny.MediaStreamTrack[] {
        return this.tracks;
      }

      getAudioTracks(): typeof GlobalAny.MediaStreamTrack[] {
        return this.tracks;
      }

      addEventListener(type: string, listener: MockListener): void {
        if (!this.listeners.hasOwnProperty(type)) {
          this.listeners[type] = [];
        }
        this.listeners[type].push(listener);
      }

      removeEventListener(type: string, listener: MockListener): void {
        if (this.listeners.hasOwnProperty(type)) {
          this.listeners[type] = this.listeners[type].filter(
            eachListener => eachListener !== listener
          );
        }
      }
    };

    GlobalAny.MediaDeviceInfo = mockBehavior.mediaDeviceInfoSupported
      ? class MockMediaDeviceInfo {
          deviceId: string;
          groupId: string;
          kind: MediaDeviceKind;
          label: string;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          toJSON(): any {}
        }
      : null;

    GlobalAny.MediaDevices = class MockMediaDevices {
      constructor() {
        if (!mockBehavior.mediaDeviceOnDeviceChangeSupported) {
          delete this.ondevicechange;
        }
      }

      eventListeners: EventListenerObjectWrapper[] = [];
      gotLabels: boolean = false;
      // ondevicechange is set to null if supported
      ondevicechange: null = null;

      getDisplayMedia(
        _constraints: MockMediaStreamConstraints
      ): Promise<typeof GlobalAny.MediaStream> {
        const mediaStream = Substitute.for<typeof GlobalAny.MediaStream>();
        return Promise.resolve(mediaStream);
      }

      async getUserMedia(
        constraints: MockMediaStreamConstraints
      ): Promise<typeof GlobalAny.MediaStream> {
        await new Promise(resolve => setTimeout(resolve, mockBehavior.asyncWaitMs));
        return new Promise<typeof GlobalAny.MediaStream>((resolve, reject) => {
          if (constraints === null) {
            reject(
              new Error(
                `TypeError: Failed to execute 'getUserMedia' on 'MediaDevices': At least one of audio and video must be requested`
              )
            );
          }

          if (mockBehavior.getUserMediaSucceeds) {
            this.gotLabels = true;
            const mediaStreamMaker: typeof GlobalAny.MediaStream = GlobalAny.MediaStream;
            const mediaStream = new mediaStreamMaker();
            const mediaStreamTrack = new MediaStreamTrack();
            if (constraints.audio && !constraints.video) {
              // @ts-ignore
              mediaStreamTrack.kind = 'audio';
              // @ts-ignore
              mediaStreamTrack.label = mockBehavior.getUserMediaAudioLabel;
            }
            if (!constraints.audio && constraints.video) {
              // @ts-ignore
              mediaStreamTrack.kind = 'video';
            }
            mediaStream.addTrack(mediaStreamTrack);
            mediaStream.constraints = constraints;
            mediaStream.active = true;
            resolve(mediaStream);
          } else {
            reject(new Error('failed to get media device'));
          }
        });
      }

      async enumerateDevices(): Promise<typeof GlobalAny.MediaDeviceInfo[]> {
        if (!mockBehavior.enumerateDevicesSupported) {
          throw new Error('simulating enumerate devices not supported');
        }
        await new Promise(resolve => setTimeout(resolve, mockBehavior.asyncWaitMs));
        if (mockBehavior.enumerateDevicesSucceeds) {
          let deviceLists: typeof GlobalAny.MediaDeviceInfo[];
          if (mockBehavior.enumerateDeviceList) {
            deviceLists = mockBehavior.enumerateDeviceList;
          } else {
            let label = this.gotLabels ? 'fakeLabel' : '';
            deviceLists = [
              { deviceId: ++mockBehavior.deviceCounter + '', kind: 'audioinput', label: label },
              { deviceId: ++mockBehavior.deviceCounter + '', kind: 'videoinput', label: label },
              { deviceId: ++mockBehavior.deviceCounter + '', kind: 'audioinput', label: label },
              { deviceId: ++mockBehavior.deviceCounter + '', kind: 'videoinput', label: label },
            ];
            if (mockBehavior.enumerateAudioOutputDeviceSupported) {
              deviceLists.push({
                deviceId: ++mockBehavior.deviceCounter + '',
                kind: 'audiooutput',
                label: label,
              });
            }
          }
          return Promise.resolve(deviceLists);
        } else {
          return Promise.reject(new Error('failed to enumerate devices'));
        }
      }

      addEventListener(
        type: string,
        listener?: EventListenerOrEventListenerObject,
        _options?: boolean | AddEventListenerOptions
      ): void {
        this.eventListeners.push({ type: type, listener: listener });
      }

      removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
        const newEventListeners: EventListenerObjectWrapper[] = [];
        for (const eventListener of this.eventListeners) {
          if (eventListener.type === type && eventListener.listener === listener) {
            continue;
          }
          newEventListeners.push(eventListener);
        }
        this.eventListeners = newEventListeners;
      }

      async dispatchEvent(event: typeof GlobalAny.Event): Promise<boolean> {
        for (const listenerWrapper of this.eventListeners) {
          if (listenerWrapper.type === event.type) {
            const callback = listenerWrapper.listener as EventListener;
            await callback(event);
          }
        }
        return true;
      }

      getSupportedConstraints(): MediaTrackSupportedConstraints {
        if (mockBehavior.mediaDeviceHasSupportedConstraints) {
          return {
            // @ts-ignore
            sampleRate: 48000,
            // @ts-ignore
            sampleSize: 16,
            // @ts-ignore
            channelCount: 1,
          };
        } else {
          // @ts-ignore
          return {};
        }
      }
    };

    const mediaDevicesMaker: typeof GlobalAny.MediaDevices = GlobalAny.MediaDevices;

    const CHROME_USERAGENT =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.75 Safari/537.36';
    const FIREFOX_USERAGENT =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:68.0) Gecko/20100101 Firefox/68.0';
    const SAFARI_USERAGENT =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.2 Safari/605.1.15';

    const USER_AGENTS = new Map<string, string>();
    USER_AGENTS.set('chrome', CHROME_USERAGENT);
    USER_AGENTS.set('firefox', FIREFOX_USERAGENT);
    USER_AGENTS.set('safari', SAFARI_USERAGENT);

    GlobalAny.navigator = {
      mediaDevices: mockBehavior.mediaDevicesSupported ? new mediaDevicesMaker() : undefined,
      userAgent: USER_AGENTS.get(mockBehavior.browserName),
      sendBeacon(
        _url: string,
        _data?:
          | Blob
          | Int8Array
          | Int16Array
          | Int32Array
          | Uint8Array
          | Uint16Array
          | Uint32Array
          | Uint8ClampedArray
          | Float32Array
          | Float64Array
          | DataView
          | ArrayBuffer
          | FormData
          | string
          | null
      ): boolean {
        return true;
      },
    };

    GlobalAny.window = GlobalAny;

    GlobalAny.Event = class MockEvent {
      track: typeof GlobalAny.MediaStreamTrack;
      streams: typeof GlobalAny.MediaStream[] = [];
      constructor(public type: string, _eventInitDict?: EventInit) {}
    };

    GlobalAny.RTCSessionDescription = class MockSessionDescription {
      sdp: string;
      type: RTCSdpType;

      constructor(descriptionInit: RTCSessionDescriptionInit) {
        this.type = descriptionInit.type;
        this.sdp = descriptionInit.sdp;
      }
    };

    GlobalAny.RTCPeerConnection = class MockPeerConnection {
      private senders: RTCRtpSender[] = [];
      localDescription: RTCSessionDescription;
      eventListeners: EventListenerObjectWrapper[] = [];
      connectionState: string = 'new';
      iceGatheringState: string = 'new';
      iceConnectionState: string = 'new';
      remoteDescription: RTCSessionDescription;
      currentRemoteDescription: RTCSessionDescription;
      currentTracks: MediaStreamTrack[] = [];
      currentStreams: MediaStream[] = [];
      transceiverMap = new Map<string, RTCRtpTransceiver[]>();
      constructor(private configuration: RTCConfiguration) {
        this.transceiverMap.set('video', []);
        this.transceiverMap.set('audio', []);
      }

      getConfiguration(): RTCConfiguration {
        return this.configuration;
      }

      close(): void {
        asyncWait(() => {
          this.connectionState = 'closed';
        });
      }

      createOffer(options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit> {
        let sdpString: string;
        if (mockBehavior.rtcPeerConnectionUseCustomOffer) {
          sdpString = mockBehavior.rtcPeerConnectionCustomOffer;
        } else {
          if (options) {
            if (options.offerToReceiveVideo) {
              sdpString = SafariSDPMock.SAFARI_AUDIO_VIDEO_SENDING_RECEIVING;
            } else {
              sdpString = SafariSDPMock.IOS_SAFARI_AUDIO_SENDRECV_VIDEO_INACTIVE;
            }
          }
        }
        return new Promise<RTCSessionDescriptionInit>((resolve, _reject) => {
          asyncWait(() => {
            resolve({ type: 'offer', sdp: sdpString });
          });
        });
      }

      setRemoteDescription(description: RTCSessionDescription): Promise<void> {
        this.remoteDescription = description;
        this.currentRemoteDescription = description;
        return new Promise<void>((resolve, _reject) => {
          asyncWait(() => {
            const eventMaker: typeof GlobalAny.Event = GlobalAny.Event;

            for (let i = 0; i < mockBehavior.setRemoteDescriptionNumberOfTracks; i++) {
              const addTrackEvent = new eventMaker();
              addTrackEvent.type = 'track';
              const mediaStreamTrackMaker: typeof GlobalAny.MediaStreamTrack =
                GlobalAny.MediaStreamTrack;
              const mediaStreamTrack = new mediaStreamTrackMaker();
              mediaStreamTrack.id = `${i}`;
              mediaStreamTrack.kind =
                /^m=video/gm.exec(description.sdp) !== null ? 'video' : 'audio';
              addTrackEvent.track = mediaStreamTrack;
              if (mockBehavior.hasInactiveTransceiver) {
                addTrackEvent.transceiver = { currentDirection: 'inactive' };
              }
              if (mockBehavior.hasStreamForTrack) {
                const mediaStreamMaker: typeof GlobalAny.MediaStream = GlobalAny.MediaStream;
                const mediaStream = new mediaStreamMaker();
                mediaStream.id = mockBehavior.setRemoteDescriptionStreamId;
                if (mockBehavior.setRemoteDescriptionAddTrackSucceeds) {
                  mediaStream.addTrack(mediaStreamTrack);
                }
                addTrackEvent.streams = [mediaStream];
              }
              this.dispatchEvent(addTrackEvent);
            }

            for (const state of mockBehavior.iceConnectionStates) {
              const iceConnectionStateChangeEvent = new eventMaker();
              iceConnectionStateChangeEvent.type = 'iceconnectionstatechange';
              this.iceConnectionState = state;
              this.dispatchEvent(iceConnectionStateChangeEvent);
            }

            resolve();
          });
        });
      }

      setLocalDescription(description: RTCSessionDescriptionInit): Promise<void> {
        this.localDescription = {
          type: description.type,
          sdp: description.sdp,
          toJSON: null,
        };
        return new Promise<void>((resolve, reject) => {
          asyncWait(() => {
            if (mockBehavior.setLocalDescriptionSucceeds) {
              resolve();
            } else {
              reject(new Error());
            }
          });
        });
      }

      addEventListener(
        type: string,
        listener?: EventListenerOrEventListenerObject,
        _options?: boolean | AddEventListenerOptions
      ): void {
        this.eventListeners.push({ type: type, listener: listener });
      }

      removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
        const newEventListeners: EventListenerObjectWrapper[] = [];
        for (const eventListener of this.eventListeners) {
          if (eventListener.type === type && eventListener.listener === listener) {
            continue;
          }
          newEventListeners.push(eventListener);
        }
        this.eventListeners = newEventListeners;
      }

      dispatchEvent(event: typeof GlobalAny.Event): boolean {
        if (event.type === 'icecandidate') {
          if (this.iceGatheringState === 'new') {
            this.iceGatheringState = 'gathering';
          } else if (this.iceGatheringState === 'gathering') {
            this.iceGatheringState = 'complete';
          }
        }
        for (const listenerWrapper of this.eventListeners) {
          if (listenerWrapper.type === event.type) {
            const callback = listenerWrapper.listener as EventListener;
            callback(event);
          }
        }
        return true;
      }

      addTrack(track: MediaStreamTrack, stream: MediaStream): RTCRtpSender {
        this.currentTracks.push(track);
        this.currentStreams.push(stream);

        const sender = new GlobalAny.RTCRtpSender(track);
        this.senders.push(sender);
        return sender;
      }

      removeTrack(sender: RTCRtpSender): void {
        this.senders = this.senders.filter(eachSender => eachSender.track.id !== sender.track.id);
      }

      private transceivers: RTCRtpTransceiver[] = [];

      getTransceivers(): RTCRtpTransceiver[] {
        return this.transceivers;
      }

      addTransceiver(
        trackOrKind: MediaStreamTrack | string,
        init?: RTCRtpTransceiverInit
      ): RTCRtpTransceiver {
        const transceiver: RTCRtpTransceiver = new GlobalAny.RTCRtpTransceiver(trackOrKind, init);
        let kind: string;
        if (typeof trackOrKind === typeof MediaStreamTrack) {
          // @ts-ignore
          kind = trackOrKind.kind;
        } else {
          // @ts-ignore
          kind = trackOrKind;
        }
        this.transceiverMap.get(kind).push(transceiver);
        this.transceivers.push(transceiver);
        return transceiver;
      }

      getStats(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        successCallback?: (res: any) => void,
        failureCallback?: (error: Error) => void
      ): Promise<RawMetricReport[]> {
        const isChrome = !!(successCallback && failureCallback);
        const reports = [
          {
            names: (): string[] => ['stat1'],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            stat: (_name: string): any => 'stat1-value',
            id: 'send',
            type: isChrome ? 'ssrc' : 'inbound-rtp',
            ssrc: 1,
            timestamp: 1,
            mediaType: 'video',
            ...mockBehavior.rtcPeerConnectionGetStatsReport,
          },
        ];
        const error = new Error('Failed to getStats()');

        if (isChrome) {
          if (mockBehavior.rtcPeerConnectionGetStatsSucceeds) {
            successCallback({
              result: () => reports,
            });
          } else {
            failureCallback(error);
          }
          return null;
        } else {
          return new Promise((resolve, reject) => {
            if (mockBehavior.rtcPeerConnectionGetStatsSucceeds) {
              resolve(reports);
            } else {
              reject(error);
            }
          });
        }
      }

      getSenders(): RTCRtpSender[] {
        return this.senders;
      }
    };

    GlobalAny.RTCRtpTransceiver = class MockRTCRtpTransceiver {
      readonly direction: RTCRtpTransceiverDirection;
      readonly receiver: RTCRtpReceiver;
      readonly sender: RTCRtpSender;
      readonly mid: string;

      constructor(trackOrKind: MediaStreamTrack | string, init?: RTCRtpTransceiverInit) {
        this.direction = init.direction;
        const sendEncodings = init.sendEncodings;
        this.receiver = new GlobalAny.RTCRtpReceiver(
          new GlobalAny.MediaStreamTrack('mock-track-id', trackOrKind)
        );
        this.sender = new GlobalAny.RTCRtpSender(
          new GlobalAny.MediaStreamTrack('mock-track-id', trackOrKind)
        );
        if (!!sendEncodings) {
          this.sender.setParameters({
            transactionId: undefined,
            codecs: undefined,
            rtcp: undefined,
            headerExtensions: undefined,
            encodings: sendEncodings,
          });
        }
        this.mid = 'mock-mid-id';
      }
    };

    GlobalAny.RTCRtpReceiver = class MockRTCRtpReceiver {
      readonly track: MediaStreamTrack;

      constructor(track: MediaStreamTrack) {
        this.track = track;
      }
    };

    GlobalAny.RTCRtpSender = class MockRTCRtpSender {
      track: MediaStreamTrack;
      parameter: RTCRtpSendParameters;
      constructor(track: MediaStreamTrack) {
        this.track = track;
        // eslint-disable-next-line @typescript-eslint/no-object-literal-type-assertion
        this.parameter = {
          degradationPreference: null,
          encodings: [],
          transactionId: '',
        } as RTCRtpSendParameters;
      }

      async replaceTrack(track?: MediaStreamTrack): Promise<void> {
        return new Promise(resolve => {
          asyncWait(() => {
            this.track = track;
            resolve();
          });
        });
      }

      getParameters(): RTCRtpSendParameters {
        return this.parameter;
      }

      setParameters(param: RTCRtpSendParameters): Promise<void> {
        this.parameter = param;
        return;
      }
    };

    GlobalAny.RTCIceCandidate = class MockRTCIceCandidate {
      candidate: string;
      component: RTCIceComponent | null;
      foundation: string | null;
      ip: string | null;
      port: number | null;
      priority: number | null;
      protocol: RTCIceProtocol | null;
      relatedAddress: string | null;
      relatedPort: number | null;
      sdpMLineIndex: number | null;
      sdpMid: string | null;
      tcpType: RTCIceTcpCandidateType | null;
      type: RTCIceCandidateType | null;
      usernameFragment: string | null;
      toJSON(): null;

      toJSON(): void {}
    };

    GlobalAny.RTCPeerConnectionIceEvent = class MockRTCPeerConnectionIceEvent {
      candidate: RTCIceCandidate | null;
      url: string | null;
      type: string | null;

      constructor(eventType: string, candidate?: RTCPeerConnectionIceEventInit) {
        this.type = eventType;
        this.candidate = candidate ? candidate.candidate : null;
      }
    };

    GlobalAny.Response = class Response {
      // eslint-disable-next-line
      json(): Promise<any> {
        return mockBehavior.FakeTURNCredentialsBody;
      }
      get status(): number {
        return mockBehavior.responseStatusCode;
      }
    };

    GlobalAny.fetch = function fetch(_input: RequestInfo, _init?: RequestInit): Promise<Response> {
      return new Promise<Response>(function(resolve, reject) {
        asyncWait(() => {
          if (mockBehavior.fetchSucceeds) {
            resolve(new Response());
          } else {
            reject(new Error());
          }
        });
      });
    };

    if (mockBehavior.devicePixelRatio) {
      GlobalAny.devicePixelRatio = mockBehavior.devicePixelRatio;
    }

    GlobalAny.MediaQueryList = class MockMediaQueryList {
      constructor() {}

      addEventListener(_type: string, listener: () => {}): void {
        asyncWait(() => {
          listener();
        });
      }

      addListener(listener: () => {}): void {
        asyncWait(() => {
          listener();
        });
      }
    };

    GlobalAny.matchMedia = function mockMatchMedia(_query: string): MediaQueryList {
      return new GlobalAny.MediaQueryList();
    };

    GlobalAny.HTMLAudioElement = class MockHTMLAudioElement {
      sinkId = 'fakeSinkId';
      async setSinkId(deviceId: string): Promise<undefined> {
        this.sinkId = deviceId;
        await new Promise(resolve => setTimeout(resolve, mockBehavior.asyncWaitMs * 10));
        return undefined;
      }
    };

    GlobalAny.document = {
      createElement(_tagName: string): HTMLElement {
        const element = {
          getContext(_contextId: string): CanvasRenderingContext2D {
            const context = {
              drawImage(
                _image: CanvasImageSource,
                _dx: number,
                _dy: number,
                _dw: number,
                _dh: number
              ): void {},
              getImageData(_sx: number, _sy: number, sw: number, sh: number): ImageData {
                // @ts-ignore
                return {
                  width: sw,
                  height: sh,
                };
              },
              fillRect(_x: number, _y: number, _w: number, _h: number): void {},
            };
            // @ts-ignore
            return context;
          },
          captureStream(_frameRate: number): MediaStream {
            return mockBehavior.createElementCaptureStream;
          },
        };
        // @ts-ignore
        return element;
      },
    };

    GlobalAny.ImageData = class MockImageData {
      constructor(public data: Uint8ClampedArray, public width: number, public height: number) {}
    };

    GlobalAny.requestAnimationFrame = function mockRequestAnimationFrame(callback: () => void) {
      setTimeout(callback);
    };

    GlobalAny.AudioContext = class MockAudioContext {
      sampleRate: number = 48000;

      constructor(contextOptions?: AudioContextOptions) {
        if (contextOptions && contextOptions.sampleRate) {
          this.sampleRate = contextOptions.sampleRate;
        } else {
          this.sampleRate = mockBehavior.audioContextDefaultSampleRate;
        }
      }

      createMediaStreamDestination(): MediaStreamAudioDestinationNode {
        return new GlobalAny.MediaStreamAudioDestinationNode();
      }

      createMediaStreamSource(mediaStream: MediaStream): MediaStreamAudioSourceNode {
        return new GlobalAny.MediaStreamAudioSourceNode(this, {
          mediaStream,
        });
      }

      createAnalyser(): AnalyserNode {
        // @ts-ignore
        return {};
      }

      createBufferSource(): AudioBufferSourceNode {
        return new GlobalAny.AudioBufferSourceNode();
      }

      createGain(): GainNode {
        // @ts-ignore
        return {
          // @ts-ignore
          connect(_destinationParam: AudioParam, _output?: number): void {},
          // @ts-ignore
          gain: {},
        };
      }

      createOscillator(): OscillatorNode {
        // @ts-ignore
        return {
          // @ts-ignore
          start(_when?: number): void {},
          // @ts-ignore
          connect(destinationNode: AudioNode, _output?: number, _input?: number): AudioNode {
            return destinationNode;
          },
          // @ts-ignore
          frequency: {},
        };
      }

      createBuffer(_numberOfChannels: number, _length: number, sampleRate: number): AudioBuffer {
        if (!mockBehavior.audioContextCreateBufferSucceeds) {
          throw new Error('Unknown error');
        }

        if (sampleRate < 8000 || sampleRate > 96000) {
          const error = new Error('The operation is not supported');
          error.name = 'NotSupportedError';
          throw error;
        }

        return new GlobalAny.AudioBuffer();
      }

      close(): void {}
    };

    GlobalAny.AudioBufferSourceNode = class MockAudioBufferSourceNode {
      start(_when?: number, _offset?: number, _duration?: number): void {}

      connect(_destinationParam: AudioParam, _output?: number): void {}
    };

    GlobalAny.AudioBuffer = class MockAudioBuffer {
      getChannelData(_channel: number): Float32Array {
        return new Float32Array(1);
      }
    };

    GlobalAny.MediaStreamAudioDestinationNode = class MockMediaStreamAudioDestinationNode {
      stream: typeof GlobalAny.MediaStream;

      constructor() {
        this.stream = new GlobalAny.MediaStream();

        // For testing the "ended" event handler, dispatch the "ended" event right after
        // initialization.
        asyncWait(() => {
          if (this.listeners.hasOwnProperty('ended')) {
            this.listeners.ended.forEach((listener: MockListener) =>
              listener({
                ...Substitute.for(),
                type: 'ended',
              })
            );
          }
        });
      }

      private listeners: { [type: string]: MockListener[] } = {};

      addEventListener(type: string, listener: MockListener): void {
        if (!this.listeners.hasOwnProperty(type)) {
          this.listeners[type] = [];
        }
        this.listeners[type].push(listener);
      }
    };

    GlobalAny.MediaStreamAudioSourceNode = class MockMediaStreamAudioSourceNode {
      mediaStream: typeof GlobalAny.MediaStream;

      constructor(_context: AudioContext, options: MediaStreamAudioSourceOptions) {
        this.mediaStream = options.mediaStream;
      }

      connect(_destinationParam: AudioParam, _output?: number): void {}

      disconnect(): void {}
    };
  }

  cleanup(): void {
    delete GlobalAny.fetch;
    delete GlobalAny.Response;
    delete GlobalAny.RTCPeerConnectionIceEvent;
    delete GlobalAny.RTCIceCandidate;
    delete GlobalAny.RTCPeerConnection;
    delete GlobalAny.RTCRtpTransceiver;
    delete GlobalAny.RTCRtpReceiver;
    delete GlobalAny.RTCRtpSender;
    delete GlobalAny.MessageEvent;
    delete GlobalAny.WebSocket;
    delete GlobalAny.MediaStreamTrack;
    delete GlobalAny.MediaStream;
    delete GlobalAny.MediaDevices;
    delete GlobalAny.navigator;
    delete GlobalAny.window;
    delete GlobalAny.devicePixelRatio;
    delete GlobalAny.MediaQueryList;
    delete GlobalAny.matchMedia;
    delete GlobalAny.document;
    delete GlobalAny.requestAnimationFrame;
    delete GlobalAny.AudioContext;
    delete GlobalAny.AudioBufferSourceNode;
    delete GlobalAny.AudioBuffer;
    delete GlobalAny.MediaStreamAudioDestinationNode;
    delete GlobalAny.MediaStreamAudioSourceNode;
  }
}
