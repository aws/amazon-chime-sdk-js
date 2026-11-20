// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import CitrixMediaDevices from './CitrixMediaDevices';
import CitrixUCSDK from './CitrixUCSDK';
import CitrixVDIAdapterConnectOptions from './CitrixVDIAdapterConnectOptions';
import CitrixVDIAdapterOptions from './CitrixVDIAdapterOptions';
import VDIAdapter from './VDIAdapter';

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
    return new this.ucsdk.CitrixPeerConnection(configuration);
  }

  /**
   * Initializes the Bootstrap and the UCSDK, waits for the endpoint to connect, and returns
   * an adapter for it. Rejects if that does not finish within `timeoutMs` or the endpoint
   * cannot redirect WebRTC, so the application can join without one instead.
   *
   * This registers the UCSDK VM event callback, which holds a single listener. When another
   * component on the page already initialized the UCSDK, such as a Citrix softphone,
   * construct the adapter with that component's window handle instead.
   */
  static async connect(options: CitrixVDIAdapterConnectOptions): Promise<CitrixVDIAdapter> {
    const { ucsdk, bootstrap, vendor, timeoutMs = 15000, logger } = options;
    const deadline = Date.now() + timeoutMs;
    // TODO: VDAs without Bootstrap support. connect-rtc-js checks
    // getRedirectionState() and initializes the UCSDK without the Bootstrap on -2.
    if (!bootstrap.isBootstrapInitialized()) {
      bootstrap.initBootstrap(vendor);
    }
    const windowHandle = await withTimeout(
      bootstrap.getWindowHandle(),
      deadline - Date.now(),
      'window handle'
    );
    if (!windowHandle) {
      throw new Error('CitrixVDIAdapter: the Bootstrap returned no window handle');
    }
    // TODO: this replaces a callback another component registered, and an already
    // connected UCSDK fires no new vdiClientConnected, so connect then times out.
    // TODO: handle vdiClientDisconnected after connect: expose the connection state and
    // decide whether createPeerConnection waits for the endpoint.
    // TODO: route the UCSDK and Bootstrap logs (initLog) to the logger.
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
    await withTimeout(connected, deadline - Date.now(), 'endpoint connection');
    return new CitrixVDIAdapter({ ucsdk, windowHandle, logger });
  }
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
