// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../../logger/Logger';
import VDIAdapter from '../VDIAdapter';
import CitrixMediaDevices from './CitrixMediaDevices';
import CitrixRTCPeerConnection from './CitrixRTCPeerConnection';
import CitrixUCSDK from './CitrixUCSDK';
import CitrixVDIAdapterConnectOptions from './CitrixVDIAdapterConnectOptions';
import CitrixVDIAdapterOptions from './CitrixVDIAdapterOptions';

/**
 * Citrix HDX media redirection. The SDK does not include the UCSDK; the
 * application passes in an initialized one.
 */
export default class CitrixVDIAdapter implements VDIAdapter {
  readonly name = 'CitrixVDIAdapter';
  readonly ucsdk: CitrixUCSDK;
  readonly windowHandle: string;
  readonly logger?: Logger;
  readonly mediaDevices: CitrixMediaDevices;

  constructor(options: CitrixVDIAdapterOptions) {
    this.ucsdk = options.ucsdk;
    this.windowHandle = options.windowHandle;
    this.logger = options.logger;
    this.mediaDevices = new CitrixMediaDevices(this);
  }

  createPeerConnection(configuration: RTCConfiguration): RTCPeerConnection {
    this.logger?.info('CitrixVDIAdapter: peer connection is redirected');
    return new CitrixRTCPeerConnection(new this.ucsdk.CitrixPeerConnection(configuration), this);
  }

  // The endpoint draws redirected video over the browser window and plays
  // redirected audio itself, so the UCSDK maps the elements that show its streams.
  // A mapped element keeps the mapping while its stream changes and is disposed
  // when the SDK releases it or gives it a browser stream.
  bindVideoElement(element: HTMLVideoElement, stream: MediaStream): void {
    if (!isCitrixStream(stream)) {
      this.unbindVideoElement(element);
      return;
    }
    if (isMapped(element, 'remoteVideoElement')) {
      return;
    }
    this.ucsdk.mapVideoElement(element, this.windowHandle);
  }

  unbindVideoElement(element: HTMLVideoElement): void {
    if (isMapped(element, 'remoteVideoElement')) {
      this.ucsdk.disposeVideoElement(element, this.windowHandle);
      restore(element, VIDEO_PROPERTIES);
    }
  }

  bindAudioElement(element: HTMLAudioElement, stream: MediaStream): void {
    if (!isCitrixStream(stream)) {
      this.unbindAudioElement(element);
      return;
    }
    if (isMapped(element, 'remoteAudioElement')) {
      return;
    }
    this.ucsdk.mapAudioElement(element);
    if (!isMapped(element, 'remoteAudioElement')) {
      return;
    }
    // The UCSDK rejects the empty sink ID the SDK uses for the default device.
    const setSinkId = element.setSinkId.bind(element);
    element.setSinkId = (sinkId: string): Promise<void> => setSinkId(sinkId || 'default');
  }

  unbindAudioElement(element: HTMLAudioElement): void {
    if (isMapped(element, 'remoteAudioElement')) {
      this.ucsdk.disposeAudioElement(element);
      restore(element, AUDIO_PROPERTIES);
    }
  }

  /**
   * Initializes the Bootstrap and the UCSDK, waits for the endpoint to connect, and returns
   * an adapter for it. Rejects if the window handle or the endpoint connection does not
   * arrive within `timeoutMs` each, or the endpoint cannot redirect WebRTC, so the
   * application can join without one instead.
   *
   * This registers the UCSDK VM event callback, which holds a single listener. When another
   * component on the page already initialized the UCSDK, such as a Citrix softphone,
   * construct the adapter with that component's window handle instead.
   */
  static async connect(options: CitrixVDIAdapterConnectOptions): Promise<CitrixVDIAdapter> {
    const { ucsdk, bootstrap, vendor, timeoutMs = 10000, logger } = options;
    // TODO: VDAs without Bootstrap support. connect-rtc-js checks
    // getRedirectionState() and initializes the UCSDK without the Bootstrap on -2.
    if (!bootstrap.isBootstrapInitialized()) {
      bootstrap.initBootstrap(vendor);
    }
    const windowHandle = await withTimeout(bootstrap.getWindowHandle(), timeoutMs, 'window handle');
    if (!windowHandle) {
      throw new Error('CitrixVDIAdapter: the Bootstrap returned no window handle');
    }
    // TODO: handle VDI disconnection and reconnection in a follow-up PR.
    const connected = new Promise<void>((resolve, reject) => {
      ucsdk.setVMEventCallback(event => {
        if (event.event === 'vdiClientDisconnected') {
          logger?.warn(
            `CitrixVDIAdapter: endpoint disconnected, reason ${event.reason}, ${event.msg}`
          );
          return;
        }
        if (event.event !== 'vdiClientConnected') {
          logger?.info(`CitrixVDIAdapter: VM event ${event.event}`);
          return;
        }
        logger?.info(
          `CitrixVDIAdapter: endpoint connected, version ${JSON.stringify(event.version)}`
        );
        if (ucsdk.isFeatureOn('webrtc1.0')) {
          resolve();
        } else {
          reject(new Error('CitrixVDIAdapter: the endpoint does not support WebRTC redirection'));
        }
      });
    });
    ucsdk.initUCSDK(vendor);
    await withTimeout(connected, timeoutMs, 'endpoint connection');
    return new CitrixVDIAdapter({ ucsdk, windowHandle, logger });
  }
}

/** A UCSDK proxy track exposes `object_id()`; a browser track does not. */
function isCitrixStream(stream: MediaStream): boolean {
  const tracks = stream.getTracks();
  return (
    tracks.length > 0 &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tracks.every(track => typeof (track as any).object_id === 'function')
  );
}

// The members mapVideoElement and mapAudioElement redefine on the element to forward
// to the endpoint. Dispose leaves them in place, so they are removed to restore the
// element's own.
const VIDEO_PROPERTIES = [
  'srcObject',
  'sinkId',
  'setSinkId',
  'play',
  'pause',
  'readyState',
  'videoWidth',
  'videoHeight',
];
const AUDIO_PROPERTIES = [
  'srcObject',
  'sinkId',
  'setSinkId',
  'play',
  'pause',
  'autoplay',
  'loop',
  'src',
  'error',
];

function restore(element: HTMLMediaElement, properties: string[]): void {
  for (const property of properties) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (element as any)[property];
  }
}

/** The UCSDK sets this property on an element it maps and clears it on dispose. */
function isMapped(element: HTMLMediaElement, property: string): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (element as any)[property] !== undefined;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, what: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`CitrixVDIAdapter: timed out waiting for the ${what}`)),
      timeoutMs
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
