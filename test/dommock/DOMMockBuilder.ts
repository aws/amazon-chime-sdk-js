// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Substitute } from '@fluffy-spoon/substitute';
// We use V1 UUIDs because V4 — random — hits the Mocha equivalent of this Jest issue.
// https://github.com/facebook/jest/issues/11275
import { v1 as uuidv1 } from 'uuid';

import GetUserMediaError from '../../src/devicecontroller/GetUserMediaError';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import DOMBlobMock from '../domblobmock/DOMBlobMock';
import SafariSDPMock from '../sdp/SafariSDPMock';
import DisplayMediaState from './DisplayMediaState';
import DOMMockBehavior from './DOMMockBehavior';
import MockError, { OverconstrainedError } from './MockError';
import UserMediaState from './UserMediaState';

export interface StoppableMediaStreamTrack extends MediaStreamTrack {
  streamDeviceID: string | undefined;

  // This stops the track _and dispatches 'ended'_.
  // https://stackoverflow.com/a/55960232
  externalStop(): void;

  // This sets muted and dispatches 'mute'.
  externalMute(): void;

  // This sets unmuted and dispatches 'unmute'.
  externalUnmute(): void;

  // Tracks know their source device ID. This lets us fake it in tests.
  setStreamDeviceID(id: string | undefined): void;
}

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
  once: boolean;
  type: string;
  listener: EventListenerOrEventListenerObject;
}

export class MockMediaStream {
  private listeners: { [type: string]: MockListener[] } = {};

  id: string = uuidv1();
  constraints: MockMediaStreamConstraints = {};
  tracks: typeof GlobalAny.MediaStreamTrack[] = [];
  active: boolean = false;

  constructor(tracks: typeof GlobalAny.MediaStreamTrack[] = []) {
    this.tracks = tracks;
  }

  clone(): typeof GlobalAny.MediaStream {
    return new MockMediaStream(this.tracks);
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
      this.listeners[type] = this.listeners[type].filter(eachListener => eachListener !== listener);
    }
  }
}

export default class DOMMockBuilder {
  constructor(mockBehavior?: DOMMockBehavior) {
    mockBehavior = mockBehavior || new DOMMockBehavior();
    const asyncWait = (func: () => void): void => {
      new TimeoutScheduler(mockBehavior.asyncWaitMs).start(func);
    };

    GlobalAny.window = GlobalAny;

    GlobalAny.self = GlobalAny.window;

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

    GlobalAny.Blob = DOMBlobMock;

    GlobalAny.Worker = class DOMWorkerMock {
      url: string;

      constructor(stringUrl: string) {
        this.url = stringUrl;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
      onmessage(event: MessageEvent): any {}

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      postMessage(message: any): void {
        const msgEvent = new MessageEvent('message', { data: message });
        if (self.onmessage) self.onmessage(msgEvent);
      }

      dispatchEvent(event: Event): boolean {
        if (event.type === 'rtctransform') {
          // @ts-ignore
          if (self.onrtctransform) self.onrtctransform(<RTCTransformEvent>event);
        }

        return true;
      }

      terminate(): void {}
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

      send(data: ArrayBuffer | string): void {
        if (mockBehavior.webSocketSendSucceeds) {
          // Create the event in advance so that when the `asyncWait` below runs
          // after test cleanup, we don't die with
          //      Uncaught ReferenceError: MessageEvent is not defined
          const event = new MessageEvent('server::message', {
            data: data,
            origin: this.url,
          });
          asyncWait(() => {
            if (mockBehavior.webSocketSendEcho && this.listeners.hasOwnProperty('message')) {
              for (const listener of this.listeners.message) {
                listener(event);
              }
            }
          });
        } else {
          if (this.listeners.hasOwnProperty('error')) {
            for (const listener of this.listeners.error) {
              listener({
                ...Substitute.for(),
                type: 'error',
              });
            }
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

      removeEventListener(type: string, listener: (event?: Event) => void): void {
        if (this.listeners.hasOwnProperty(type)) {
          this.listeners[type] = this.listeners[type].filter(l => l !== listener);
        }
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

    GlobalAny.MediaStreamTrack = class MockMediaStreamTrack implements StoppableMediaStreamTrack {
      listeners: { [type: string]: { once: boolean; listener: MockListener }[] } = {};
      readyState: MediaStreamTrackState = 'live';

      streamDeviceID = mockBehavior.mediaStreamTrackSettings?.deviceId || uuidv1();

      readonly id: string;
      readonly kind: string = '';
      readonly constraints: MockMediaStreamConstraints = {};
      readonly label: string = '';

      constructor(id: string, kind: string) {
        this.id = id;
        this.kind = kind;
      }

      enabled: boolean = true;
      isolated: boolean = false;
      muted: boolean = false;

      // @ts-ignore
      onended: (this: MediaStreamTrack, ev: Event) => void = () => {};

      // These are not implemented.
      onisolationchange: (this: MediaStreamTrack, ev: Event) => void = () => {};
      // @ts-ignore
      onmute: (this: MediaStreamTrack, ev: Event) => void = () => {};
      // @ts-ignore
      onunmute: (this: MediaStreamTrack, ev: Event) => void = () => {};

      clone(): MediaStreamTrack {
        throw new Error('Method not implemented.');
      }

      getConstraints(): MediaTrackConstraints {
        throw new Error('Method not implemented.');
      }

      dispatchEvent(event: Event): boolean {
        if (!event.type || !this.listeners.hasOwnProperty(event.type)) {
          return;
        }

        const listeners = this.listeners[event.type];
        if (!listeners || !listeners.length) {
          return;
        }

        const toRemove = new Set();
        for (const obj of listeners) {
          const { once, listener } = obj;
          if (once) {
            toRemove.add(obj);
          }
          listener(event);
        }

        if (toRemove) {
          this.listeners[event.type] = this.listeners[event.type].filter(v => !toRemove.has(v));
        }

        if (event.type === 'ended' && this.onended) {
          this.onended(event);
        }

        return !event.cancelable || event.defaultPrevented;
      }

      externalUnmute(): void {
        this.muted = false;
        this.dispatchEvent({ ...Substitute.for(), type: 'unmute' });
      }

      externalMute(): void {
        this.muted = true;
        this.dispatchEvent({ ...Substitute.for(), type: 'mute' });
      }

      setStreamDeviceID(id: string | undefined): void {
        this.streamDeviceID = id;
      }

      // This stops the track _and dispatches 'ended'_.
      // https://stackoverflow.com/a/55960232
      externalStop(): void {
        if (this.readyState === 'live') {
          this.readyState = 'ended';
          this.dispatchEvent({ ...Substitute.for(), type: 'ended' });
        }
      }

      stop(): void {
        if (this.readyState === 'live') {
          this.readyState = 'ended';
          // This stops the track _but does not dispatch 'ended'_.
          // https://stackoverflow.com/a/55960232
        }
      }

      getCapabilities(): MediaTrackCapabilities {
        return {
          width: mockBehavior.mediaStreamTrackCapabilities.width as ULongRange,
          height: mockBehavior.mediaStreamTrackCapabilities.height as ULongRange,
        };
      }

      getSettings(): MediaTrackSettings {
        const deviceId = this.streamDeviceID;

        return {
          deviceId,
          width: mockBehavior.mediaStreamTrackSettings.width,
          height: mockBehavior.mediaStreamTrackSettings.height,
          facingMode: mockBehavior.mediaStreamTrackSettings.facingMode,
          groupId: mockBehavior.mediaStreamTrackSettings.groupId,
        };
      }

      addEventListener(
        type: string,
        listener: MockListener,
        options?: boolean | AddEventListenerOptions
      ): void {
        const once = options && typeof options === 'object' && options.once;
        if (!this.listeners.hasOwnProperty(type)) {
          this.listeners[type] = [];
        }
        this.listeners[type].push({ once, listener });
      }

      removeEventListener(type: string, listener: MockListener): void {
        if (this.listeners.hasOwnProperty(type)) {
          this.listeners[type] = this.listeners[type].filter(
            eachListener => eachListener.listener !== listener
          );
        }
      }

      applyConstraints(_constraints?: MediaTrackConstraints): Promise<void> {
        if (mockBehavior.applyConstraintSucceeds) {
          return;
        }
        throw Error('overconstrained');
      }
    };

    GlobalAny.MediaStream = MockMediaStream;

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
        if (mockBehavior.getDisplayMediaResult === DisplayMediaState.Success) {
          const mediaStreamMaker: typeof GlobalAny.MediaStream = GlobalAny.MediaStream;
          const mediaStream = new mediaStreamMaker();
          return Promise.resolve(mediaStream);
        } else if (mockBehavior.getDisplayMediaResult === DisplayMediaState.PermissionDenied) {
          return Promise.reject(new MockError('NotAllowedError', 'Permission denied'));
        } else {
          return Promise.reject(new Error('failed to get display media'));
        }
      }

      async getUserMedia(
        constraints: MockMediaStreamConstraints
      ): Promise<typeof GlobalAny.MediaStream> {
        await new Promise(resolve => setTimeout(resolve, mockBehavior.asyncWaitMs));
        return new Promise<typeof GlobalAny.MediaStream>((resolve, reject) => {
          if (constraints === null) {
            reject(
              new MockError(
                'TypeError',
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
            mediaStreamTrack;
            mediaStream.addTrack(mediaStreamTrack);
            mediaStream.constraints = constraints;
            mediaStream.active = true;
            resolve(mediaStream);
          } else {
            if (
              mockBehavior.getUserMediaSucceedsOnlyWithConstraints &&
              JSON.stringify(constraints) ===
                JSON.stringify(mockBehavior.getUserMediaSucceedsOnlyWithConstraints)
            ) {
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
              mediaStreamTrack;
              mediaStream.addTrack(mediaStreamTrack);
              mediaStream.constraints = constraints;
              mediaStream.active = true;
              resolve(mediaStream);
            }

            if (typeof mockBehavior.getUserMediaError !== 'undefined') {
              reject(mockBehavior.getUserMediaError);
              return;
            }

            if (
              mockBehavior.getUserMediaResult &&
              mockBehavior.getUserMediaResult !== UserMediaState.Failure
            ) {
              if (mockBehavior.getUserMediaResult === UserMediaState.GetUserMediaError) {
                reject(new GetUserMediaError(null, null));
              }

              if (mockBehavior.getUserMediaResult !== UserMediaState.OverconstrainedError) {
                const errorName = UserMediaState[mockBehavior.getUserMediaResult];
                reject(new MockError(errorName));
              } else {
                reject(new OverconstrainedError('OverconstrainedError', 'testconstraint'));
              }
            }
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
            const label = this.gotLabels ? 'fakeLabel' : '';
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
        options?: boolean | AddEventListenerOptions
      ): void {
        const once = options && typeof options === 'object' && options.once;
        this.eventListeners.push({ type: type, listener: listener, once });
      }

      removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
        this.eventListeners = this.eventListeners.filter(
          e => e.type !== type || e.listener !== listener
        );
      }

      async dispatchEvent(event: typeof GlobalAny.Event): Promise<boolean> {
        for (const { type, once, listener } of this.eventListeners) {
          if (type === event.type) {
            const callback = listener as EventListener;
            if (once) {
              this.removeEventListener(type, listener);
            }
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
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3865.75 Safari/537.36';
    const FIREFOX_USERAGENT =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:68.0) Gecko/20100101 Firefox/75.0';
    const SAFARI_USERAGENT =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.2 Safari/605.1.15';
    const SAFARI12_USERAGENT =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Safari/605.1.15';
    const SAFARI15_USERAGENT =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Safari/605.1.15';
    const IOS_SAFARI12_0_USERAGENT =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1';
    const IOS_SAFARI12_1_USERAGENT =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1 Mobile/15E148 Safari/604.1';
    const IOS_SAFARI15_1_USERAGENT =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 15_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Mobile/15E148 Safari/604.1';
    const SAMSUNG_INTERNET_USERAGENT =
      'Mozilla/5.0 (Linux; Android 11; Pixel 3a XL) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/13.0 Chrome/83.0.4103.106 Mobile Safari/537.36';
    const CHROME_116_MAC_USER_AGENT =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36';

    const USER_AGENTS = new Map<string, string>();
    USER_AGENTS.set('chrome', CHROME_USERAGENT);
    USER_AGENTS.set('chrome116', CHROME_116_MAC_USER_AGENT);
    USER_AGENTS.set('firefox', FIREFOX_USERAGENT);
    USER_AGENTS.set('safari', SAFARI_USERAGENT);
    USER_AGENTS.set('safari12', SAFARI12_USERAGENT);
    USER_AGENTS.set('safari15', SAFARI15_USERAGENT);
    USER_AGENTS.set('ios12.0', IOS_SAFARI12_0_USERAGENT);
    USER_AGENTS.set('ios12.1', IOS_SAFARI12_1_USERAGENT);
    USER_AGENTS.set('ios15.1', IOS_SAFARI15_1_USERAGENT);
    USER_AGENTS.set('samsung', SAMSUNG_INTERNET_USERAGENT);

    GlobalAny.navigator = {
      product: mockBehavior.navigatorProduct,
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
        return mockBehavior.beaconQueuedSuccess;
      },
    };

    GlobalAny.Audio = class MockAudio {
      constructor(public src?: string) {}
    };

    GlobalAny.Event = class MockEvent {
      track: typeof GlobalAny.MediaStreamTrack;
      streams: typeof GlobalAny.MediaStream[] = [];
      constructor(public type: string, _eventInitDict?: EventInit) {}
    };

    GlobalAny.ReadableStream = class MockReadableStream {
      private _locked: boolean = false;

      get locked(): boolean {
        return this._locked;
      }

      pipeThrough(transformStream: TransformStream): ReadableStream {
        this._locked = true;
        return transformStream.readable;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pipeTo(destination: WritableStream): Promise<any> {
        this._locked = true;
        // @ts-ignore
        destination['_locked'] = true;
        return new Promise(() => {});
      }
    };

    GlobalAny.WritableStream = class MockWritableStream {
      private _locked: boolean = false;

      get locked(): boolean {
        return this._locked;
      }
    };

    GlobalAny.TransformStream = class MockTransformStream {
      readonly readable: ReadableStream;
      readonly writable: WritableStream;

      constructor() {
        this.readable = new ReadableStream();
        this.writable = new WritableStream();
      }
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
        options?: boolean | AddEventListenerOptions
      ): void {
        const once = options && typeof options === 'object' && options.once;
        this.eventListeners.push({ type: type, listener: listener, once });
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

      getStats(): Promise<RawMetricReport[]> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const reports: { [name: string]: any }[] = [{}];
        mockBehavior.rtcPeerConnectionGetStatsReports.forEach(
          (rtcPeerConnectionGetStatsReport, index) => {
            reports.push({
              names: (): string[] => ['stat' + index],
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              stat: (_name: string): any => 'stat' + index + '-value',
              id: 'RTCInboundRTPAudioStream',
              ssrc: 1,
              timestamp: 1,
              type: 'inbound-rtp',
              kind: 'video',
              ...rtcPeerConnectionGetStatsReport,
            });
          }
        );

        const error = new Error('Failed to getStats()');

        return new Promise((resolve, reject) => {
          if (mockBehavior.rtcPeerConnectionGetStatsSucceeds) {
            resolve(reports);
          } else {
            reject(error);
          }
        });
      }

      getSenders(): RTCRtpSender[] {
        return this.senders;
      }
    };

    GlobalAny.RTCRtpScriptTransformer = class MockRTCRtpScriptTransformer {
      readonly readable: ReadableStream;
      readonly writable: WritableStream;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      readonly options: any;
    };

    GlobalAny.RTCTransformEvent = class MockRTCTransformEvent extends Event {
      // @ts-ignore
      constructor(type: string, public readonly transformer: RTCRtpScriptTransformer) {
        super(type);
      }
    };

    // This mock is based on the specification at https://www.w3.org/TR/webrtc-encoded-transform/.
    GlobalAny.RTCRtpScriptTransform = class MockRTCRtpScriptTransform
      // @ts-ignore
      implements RTCRtpScriptTransformer {
      readonly readable: ReadableStream;
      readonly writable: WritableStream;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      readonly options: any;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructor(worker: Worker, options?: any) {
        const writeTransform = new TransformStream();
        const readTransform = new TransformStream();
        this.writable = writeTransform.writable;
        this.readable = readTransform.readable;
        this.options = options;

        // @ts-ignore
        const transformEvent = new RTCTransformEvent('rtctransform', this);
        worker.dispatchEvent(transformEvent);
      }
    };

    GlobalAny.RTCRtpTransceiver = class MockRTCRtpTransceiver {
      readonly direction: RTCRtpTransceiverDirection;
      readonly receiver: RTCRtpReceiver;
      readonly sender: RTCRtpSender;
      readonly mid: string;
      currentDirection: string;
      codecs: RTCRtpCodecCapability[] = [];

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

      setCodecPreferences(codecs: RTCRtpCodecCapability[]): void {
        this.codecs = codecs;
      }
    };

    GlobalAny.RTCRtpReceiver = class MockRTCRtpReceiver {
      readonly track: MediaStreamTrack;
      // @ts-ignore
      transform?: RTCRtpScriptTransform;

      constructor(track: MediaStreamTrack) {
        this.track = track;
      }

      createEncodedStreams(): TransformStream {
        return new TransformStream();
      }
    };

    GlobalAny.RTCRtpSender = class MockRTCRtpSender {
      track: MediaStreamTrack;
      parameter: RTCRtpSendParameters;
      // @ts-ignore
      transform?: RTCRtpScriptTransform;

      constructor(track: MediaStreamTrack) {
        this.track = track;
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

      createEncodedStreams(): TransformStream {
        return new TransformStream();
      }

      static getCapabilities(kind: string): RTCRtpCapabilities | null {
        if (kind === 'video') {
          return null;
        }
        // @ts-ignore
        const codecs = [
          {
            channels: 2,
            clockRate: 48000,
            mimeType: 'audio/opus',
            sdpFmtpLine: 'minptime=10;useinbandfec=1',
          },
          {
            channels: 1,
            clockRate: 8000,
            mimeType: 'audio/G722',
          },
          {
            channels: 1,
            clockRate: 8000,
            mimeType: 'audio/PCMU',
          },
          {
            channels: 1,
            clockRate: 8000,
            mimeType: 'audio/PCMA',
          },
          {
            channels: 1,
            clockRate: 8000,
            mimeType: 'audio/CN',
          },
          {
            channels: 1,
            clockRate: 48000,
            mimeType: 'audio/telephone-event',
          },
          {
            channels: 1,
            clockRate: 8000,
            mimeType: 'audio/telephone-event',
          },
        ] as RTCRtpCodecCapability;
        if (mockBehavior?.supportsAudioRedCodec) {
          const redCodec = {
            channels: 2,
            clockRate: 48000,
            mimeType: 'audio/red',
            sdpFmtpLine: '111/111',
          };
          // @ts-ignore
          codecs.splice(1, 0, redCodec);
        }
        // @ts-ignore
        const capabilities = {
          codecs: codecs,
        } as RTCRtpCapabilities;
        return capabilities;
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
      async blob(): Promise<DOMBlobMock> {
        return new DOMBlobMock();
      }

      // eslint-disable-next-line
      json(): Promise<any> {
        return mockBehavior.FakeTURNCredentialsBody;
      }
      get status(): number {
        return mockBehavior.responseStatusCode;
      }
      get ok(): boolean {
        const { responseStatusCode } = mockBehavior;
        return responseStatusCode >= 200 && responseStatusCode <= 299;
      }
    };

    GlobalAny.fetch = function fetch(_input: RequestInfo, _init?: RequestInit): Promise<Response> {
      return new Promise<Response>(function (resolve, reject) {
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

      removeEventListener(_type: string, _listener: () => void): void {}

      removeListener(_listener: () => void): void {}

      addEventListener(_type: string, listener: () => void): void {
        asyncWait(() => {
          listener();
        });
      }

      addListener(listener: () => void): void {
        asyncWait(() => {
          listener();
        });
      }
    };

    GlobalAny.Blob = DOMBlobMock;
    GlobalAny.matchMedia = function mockMatchMedia(_query: string): MediaQueryList {
      return new GlobalAny.MediaQueryList();
    };

    GlobalAny.HTMLAudioElement = class MockHTMLAudioElement {
      sinkId = 'fakeSinkId';
      async setSinkId(deviceId: string): Promise<void> {
        if (mockBehavior.setSinkIdSucceeds) {
          this.sinkId = deviceId;
          await new Promise(resolve => setTimeout(resolve, mockBehavior.asyncWaitMs * 10));
          return undefined;
        } else {
          throw new Error('Failed to set sinkId');
        }
      }
    };
    if (!mockBehavior.setSinkIdSupported) {
      delete GlobalAny.HTMLAudioElement.prototype.setSinkId;
    }

    if (mockBehavior.undefinedDocument) {
      GlobalAny.document = undefined;
    } else {
      GlobalAny.document = {
        createElement(_tagName: string): HTMLElement {
          switch (_tagName) {
            case 'video': {
              return new GlobalAny.HTMLVideoElement();
            }
            case 'canvas': {
              return new GlobalAny.HTMLCanvasElement();
            }
            case 'script': {
              return new GlobalAny.HTMLScriptElement();
            }
          }
        },
        visibilityState: mockBehavior.documentVisibilityState,
      };
    }

    GlobalAny.ImageData = class MockImageData {
      constructor(public data: Uint8ClampedArray, public width: number, public height: number) {}
    };

    GlobalAny.Image = class MockImage {
      private listeners: { [type: string]: MockListener[] } = {};
      onload(): void {}
      onerror(): void {}

      constructor(public width?: number, public height?: number) {
        asyncWait(() => {
          if (this.listeners.hasOwnProperty('load')) {
            this.listeners.load.forEach((listener: MockListener) =>
              listener({
                ...Substitute.for(),
                type: 'load',
              })
            );
          }
        });

        setTimeout(() => {
          if (mockBehavior.imageLoads) {
            this.onload(); // simulate success
          } else {
            this.onerror();
          }
        }, 5);
      }

      addEventListener(type: string, listener: MockListener): void {
        if (!this.listeners.hasOwnProperty(type)) {
          this.listeners[type] = [];
        }
        this.listeners[type].push(listener);
      }
    };

    GlobalAny.URL = class MockURL extends URL {
      static createObjectURL(url: string): string {
        return url;
      }
      static revokeObjectURL(): void {}
    };

    GlobalAny.requestAnimationFrame = function mockRequestAnimationFrame(callback: () => void) {
      setTimeout(callback);
    };

    GlobalAny.AudioContext = class MockAudioContext {
      sampleRate: number = 48000;
      state: 'running' | 'suspended' | 'closed' = 'running';

      constructor(contextOptions?: AudioContextOptions) {
        if (contextOptions && contextOptions.sampleRate) {
          this.sampleRate = contextOptions.sampleRate;
        } else {
          this.sampleRate = mockBehavior.audioContextDefaultSampleRate;
        }
      }

      createMediaStreamDestination(): MediaStreamAudioDestinationNode {
        return mockBehavior.createMediaStreamDestinationSuccess
          ? new GlobalAny.MediaStreamAudioDestinationNode()
          : null;
      }

      createMediaStreamSource(mediaStream: MediaStream): MediaStreamAudioSourceNode {
        return new GlobalAny.MediaStreamAudioSourceNode(this, {
          mediaStream,
        });
      }

      createAnalyser(): AnalyserNode {
        // @ts-ignore
        return {
          context: (this as unknown) as BaseAudioContext,
        };
      }

      createBufferSource(): AudioBufferSourceNode {
        return new GlobalAny.AudioBufferSourceNode();
      }

      createGain(): GainNode {
        // @ts-ignore
        return {
          context: (this as unknown) as BaseAudioContext,
          // @ts-ignore
          connect(_destinationParam: AudioParam, _output?: number): void {},
          // @ts-ignore
          disconnect(_destinationParam: AudioParam): void {},
          // @ts-ignore
          gain: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            linearRampToValueAtTime(value: number, endTime: number): AudioParam {
              // @ts-ignore
              return {};
            },
          },
        };
      }

      createOscillator(): OscillatorNode {
        // @ts-ignore
        return {
          context: (this as unknown) as BaseAudioContext,
          // @ts-ignore
          start(_when?: number): void {},
          stop(): void {},
          // @ts-ignore
          connect(destinationNode: AudioNode, _output?: number, _input?: number): AudioNode {
            return destinationNode;
          },
          // @ts-ignore
          disconnect(_destinationNode: AudioNode): void {},
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

      resume(): Promise<void> {
        if (this.state === 'closed') {
          return Promise.reject('Already closed.');
        }
        this.state = 'running';
        return Promise.resolve();
      }

      suspend(): Promise<void> {
        if (this.state === 'closed') {
          return Promise.reject('Already closed.');
        }
        this.state = 'suspended';
        return Promise.resolve();
      }

      close(): Promise<void> {
        this.state = 'closed';
        return Promise.resolve();
      }
    };

    GlobalAny.OfflineAudioContext = class OfflineAudioContext {
      state: 'running' | 'suspended' | 'closed' = 'running';

      suspend(): Promise<void> {
        return Promise.reject('INVALID_STATE_ERR: cannot suspend an offline context');
      }

      close(): Promise<void> {
        return Promise.reject('INVALID_STATE_ERR: cannot close an offline context');
      }

      resume(): Promise<void> {
        return Promise.reject('INVALID_STATE_ERR: cannot resume an offline context');
      }

      createGain(): GainNode {
        // @ts-ignore
        return {
          context: (this as unknown) as BaseAudioContext,
          // @ts-ignore
          connect(_destinationParam: AudioParam, _output?: number): void {},
          // @ts-ignore
          disconnect(_destinationParam: AudioParam): void {},
          // @ts-ignore
          gain: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            linearRampToValueAtTime(value: number, endTime: number): AudioParam {
              // @ts-ignore
              return {};
            },
          },
        };
      }
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
        this.stream.id = 'destination-stream-id';
        this.stream.addTrack(new MediaStreamTrack());

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

      disconnect(): void {}
    };

    GlobalAny.MediaStreamAudioSourceNode = class MockMediaStreamAudioSourceNode {
      mediaStream: typeof GlobalAny.MediaStream;

      constructor(_context: AudioContext, options: MediaStreamAudioSourceOptions) {
        this.mediaStream = options.mediaStream;
      }

      connect(_destinationParam: AudioParam, _output?: number): void {}

      disconnect(): void {}
    };

    GlobalAny.HTMLVideoElement = class MockHTMLVideoElement {
      refSrcObject: MediaStream;
      width: number;
      height: number;

      poster: string;
      videoHeight: number;
      videoWidth: number;
      private listeners: { [type: string]: MockListener[] } = {};
      style: { [key: string]: string } = {
        transform: '',
      };
      paused: boolean;

      private clearAttribute(): void {
        this.videoHeight = 0;
        this.videoWidth = 0;
        this.width = 0;
        this.height = 0;
      }

      set srcObject(stream: MediaStream | null) {
        if (stream === null) {
          this.clearAttribute();
        }
        this.refSrcObject = stream;
      }

      get srcObject(): MediaStream {
        return this.refSrcObject;
      }

      addEventListener(type: string, listener: (event?: Event) => void): void {
        if (!this.listeners.hasOwnProperty(type)) {
          this.listeners[type] = [];
        }
        this.listeners[type].push(listener);
      }

      pause(): void {
        this.paused = true;
      }

      play(): Promise<void> {
        this.paused = false;
        if (mockBehavior.videoElementShouldFail) {
          if (['ios15.1', 'safari15'].includes(mockBehavior.browserName)) {
            return Promise.reject(new MockError('AbortError', 'The operation was aborted'));
          } else {
            return Promise.reject();
          }
        }
        if (this.refSrcObject) {
          new TimeoutScheduler(mockBehavior.videoElementStartPlayDelay).start(() => {
            this.dispatchEvent(new Event('timeupdate'));
          });

          new TimeoutScheduler(mockBehavior.videoElementSetWidthHeightAttributeDelay).start(() => {
            this.videoWidth = 1280;
            this.videoHeight = 720;
          });
        }
        return Promise.resolve();
      }
      fired = false;
      load(): void {
        if (this.refSrcObject) {
          if (!this.fired) {
            this.fired = true;
            new TimeoutScheduler(mockBehavior.videoElementStartPlayDelay).start(() => {
              this.dispatchEvent(new Event('loadedmetadata'));
            });
          }
        }
      }

      removeEventListener(type: string, listener: MockListener): void {
        if (this.listeners.hasOwnProperty(type)) {
          this.listeners[type] = this.listeners[type].filter(
            eachListener => eachListener !== listener
          );
        }
      }

      attributes: { [index: string]: string } = {};
      setAttribute(qualifiedName: string, value: string): void {
        this.attributes[qualifiedName] = value;
      }

      hasAttribute(qualifiedName: string): boolean {
        return this.attributes[qualifiedName] === 'true';
      }

      dispatchEvent(event: typeof GlobalAny.Event): boolean {
        const eventType: string = event.type;
        if (this.listeners.hasOwnProperty(eventType)) {
          this.listeners[eventType].forEach((listener: MockListener) => {
            listener(event);
          });
        }
        return true;
      }
    };

    GlobalAny.HTMLScriptElement = class MockHTMLScriptElement {
      parentNode: Node;
      constructor() {
        if (mockBehavior.scriptHasParent) {
          this.parentNode = new Node();
        }
      }
      setAttribute(_attribute: string, _value: string): void {}
      addEventListener(type: string, listener: () => void): void {
        if (type === 'load' && mockBehavior.scriptHasLoaded) {
          listener();
        } else if (type === 'error' && !mockBehavior.scriptHasLoaded) {
          listener();
        }
      }
    };

    GlobalAny.Node = class MockNode {
      removeChild(_child: HTMLElement): void {}
    };

    GlobalAny.HTMLCanvasElement = class MockHTMLCanvasElement {
      getContext(_contextId: string): CanvasRenderingContext2D | WebGL2RenderingContext {
        if (_contextId === '2d') {
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
                data: new Uint8ClampedArray(),
              };
            },
            fillRect(_x: number, _y: number, _w: number, _h: number): void {},
            save(): void {},
            scale(): void {},
            restore(): void {},
            putImageData(): void {},
            clearRect(): void {},
          };
          // @ts-ignore
          return context;
        } else {
          const context = {
            canvas: new HTMLCanvasElement(),
            createTexture(): WebGLTexture {
              return new WebGLTexture();
            },
            createShader(_type: number): WebGLShader {
              return new WebGLShader();
            },
            bindTexture(_target: number, _texture: WebGLTexture): void {},
            texParameteri(_target: number, _pname: number, _param: number): void {},
            clearColor(_red: number, _green: number, _blue: number, _alpha: number): void {},
            viewport(_x: number, _y: number, _width: number, _height: number): void {},
            clear(_mask: number): void {},
            createVertexArray(): WebGLVertexArrayObject {
              return new WebGLVertexArrayObject();
            },
            bindVertexArray(_array: WebGLVertexArrayObject): void {},
            createBuffer(): WebGLBuffer {
              return new WebGLBuffer();
            },
            bindBuffer(_target: number, _buffer: WebGLBuffer): void {},
            bufferData(_target: number, _srcData: BufferSource, _usage: number): void {},
            useProgram(_program: WebGLProgram): void {},
            uniform1i(_location: WebGLUniformLocation, _x: number): void {},
            activeTexture(_texture: number): void {},
            bindFramebuffer(_target: number, _framebuffer: WebGLFramebuffer): void {},
            drawArrays(_mode: number, _first: number, _count: number): void {},
            getUniformLocation(_program: WebGLProgram, _name: string): WebGLUniformLocation {
              return new WebGLUniformLocation();
            },
            uniform2f(_location: WebGLUniformLocation, _x: number, _y: number): void {},
            shaderSource(_shader: WebGLShader, _source: string): void {},
            compileShader(_shader: WebGLShader): void {},
            getShaderParameter(_shader: WebGLShader, _pname: number): boolean {
              return true;
            },
            createFramebuffer(): WebGLFramebuffer {
              return new WebGLFramebuffer();
            },
            texImage2D(
              _target: number,
              _level: number,
              _internalformat: number,
              _width: number,
              _height: number,
              _border: number,
              _format: number,
              _type: number,
              _pixels: ArrayBufferView
            ): void {},
            framebufferTexture2D(
              _target: number,
              _attachment: number,
              _textarget: number,
              _texture: WebGLTexture,
              _level: number
            ): void {},
            createProgram(
              _gl: WebGL2RenderingContext,
              _vertexShader: WebGLShader,
              _fragmentShader: WebGLShader
            ): WebGLProgram {
              return new WebGLProgram();
            },
            attachShader(_program: WebGLProgram, _shader: WebGLShader): void {},
            linkProgram(_program: WebGLProgram): void {},
            getProgramParameter(_program: WebGLProgram, _pname: number): boolean {
              return true;
            },
            getAttribLocation(_program: WebGLProgram, _name: string): number {
              return 1;
            },
            enableVertexAttribArray(_index: number): void {},
            vertexAttribPointer(
              _index: number,
              _size: number,
              _type: number,
              _normalized: boolean,
              _stride: number,
              _offset: number
            ): void {},
          };
          // @ts-ignore
          return context;
        }
      }

      captureStream(_frameRate: number): MediaStream {
        return mockBehavior.createElementCaptureStream;
      }

      toBlob(callback: BlobCallback): void {
        callback(new DOMBlobMock());
      }

      remove(): void {}
    };

    GlobalAny.WebGLVertexArrayObject = class MockWebGLVertexArrayObject {};
    GlobalAny.WebGLBuffer = class MockWebGLBuffer {};
    GlobalAny.WebGLTexture = class MockWebGLTexture {};
    GlobalAny.WebGLShader = class MockWebGLShader {};
    GlobalAny.WebGLFramebuffer = class MockWebGLFramebuffer {};
    GlobalAny.WebGLProgram = class MockWebGLProgram {};
    GlobalAny.WebGLUniformLocation = class MockWebGLUniformLocation {};
    GlobalAny.HTMLImageElement = class MockImageElement {
      constructor(public width: number, public height: number) {}
    };
    GlobalAny.performance = Date;
  }

  cleanup(): void {
    // This is a bit of an awful hack. Some of our tests end up adding listeners that
    // subsequently cause uncaught exceptions because they rely on `WebSocket`
    // and other classes being defined.
    //
    // Almost every test cleans up these mocks in `after` or `afterEach`, and so random
    // tests will fail at the end of a test suite due to these asynchronous listeners.
    //
    // This is bad: our tests should not have these side-effect listeners.
    // However, fixing them is tricky, so we instead do a small hack: don't undefine `WebSocket`.
    //
    //
    /*
    delete GlobalAny.WebSocket;
    delete GlobalAny.fetch;
    delete GlobalAny.Response;
    delete GlobalAny.navigator;
     */
    delete GlobalAny.window;
    delete GlobalAny.self;
    delete GlobalAny.RTCPeerConnectionIceEvent;
    delete GlobalAny.RTCIceCandidate;
    delete GlobalAny.RTCPeerConnection;
    delete GlobalAny.RTCRtpScriptTransformer;
    delete GlobalAny.RTCTransformEvent;
    delete GlobalAny.RTCRtpScriptTransform;
    delete GlobalAny.RTCRtpTransceiver;
    delete GlobalAny.RTCRtpReceiver;
    delete GlobalAny.RTCRtpSender;
    delete GlobalAny.MessageEvent;
    delete GlobalAny.MediaStreamTrack;
    delete GlobalAny.MediaStream;
    delete GlobalAny.MediaDevices;
    delete GlobalAny.devicePixelRatio;
    delete GlobalAny.MediaQueryList;
    delete GlobalAny.matchMedia;
    delete GlobalAny.document;
    delete GlobalAny.requestAnimationFrame;
    delete GlobalAny.Audio;
    delete GlobalAny.AudioContext;
    delete GlobalAny.OfflineAudioContext;
    delete GlobalAny.AudioBufferSourceNode;
    delete GlobalAny.AudioBuffer;
    delete GlobalAny.MediaStreamAudioDestinationNode;
    delete GlobalAny.MediaStreamAudioSourceNode;
  }
}
