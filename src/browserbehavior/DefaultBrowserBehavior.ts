// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { detect } from 'detect-browser';

import BrowserBehavior from './BrowserBehavior';
import ExtendedBrowserBehavior from './ExtendedBrowserBehavior';

export default class DefaultBrowserBehavior implements BrowserBehavior, ExtendedBrowserBehavior {
  private readonly browser = detect();

  private browserSupport: { [id: string]: number } = {
    chrome: 78,
    'edge-chromium': 79,
    electron: 7,
    firefox: 60,
    ios: 12,
    safari: 12,
    opera: 66,
    samsung: 12,
    crios: 86,
    fxios: 23,
    'ios-webview': 605,
    'chromium-webview': 92,
  };

  private browserName: { [id: string]: string } = {
    chrome: 'Google Chrome',
    'edge-chromium': 'Microsoft Edge',
    electron: 'Electron',
    firefox: 'Mozilla Firefox',
    ios: 'Safari iOS',
    safari: 'Safari',
    opera: 'Opera',
    samsung: 'Samsung Internet',
    crios: 'Chrome iOS',
    fxios: 'Firefox iOS',
    'ios-webview': 'WKWebView iOS',
    'chromium-webview': 'Chrome WebView',
  };

  private chromeLike: string[] = [
    'chrome',
    'edge-chromium',
    'chromium-webview',
    'opera',
    'samsung',
  ];

  private webkitBrowsers: string[] = ['crios', 'fxios', 'safari', 'ios', 'ios-webview'];

  private recreateAudioContextIfNeeded: boolean;

  constructor({
    // Temporarily disable this workaround while we work out the kinks.
    recreateAudioContextIfNeeded = false,
  }: {
    enableUnifiedPlanForChromiumBasedBrowsers?: boolean;
    recreateAudioContextIfNeeded?: boolean;
  } = {}) {
    this.recreateAudioContextIfNeeded = recreateAudioContextIfNeeded;
  }

  version(): string {
    return this.browser.version;
  }

  majorVersion(): number {
    return parseInt(this.version().split('.')[0]);
  }

  name(): string {
    return this.browser.name;
  }

  hasChromiumWebRTC(): boolean {
    for (const browser of this.chromeLike) {
      if (browser === this.browser.name) {
        return true;
      }
    }
    return false;
  }

  hasWebKitWebRTC(): boolean {
    for (const browser of this.webkitBrowsers) {
      if (browser === this.browser.name) {
        return true;
      }
    }
    return false;
  }

  hasFirefoxWebRTC(): boolean {
    return this.isFirefox();
  }

  supportsCanvasCapturedStreamPlayback(): boolean {
    return !this.isIOSSafari() && !this.isIOSChrome() && !this.isIOSFirefox();
  }

  supportsBackgroundFilter(): boolean {
    // disable Safari 15
    // see: https://github.com/aws/amazon-chime-sdk-js/issues/1059
    if (this.name() === 'safari' && this.majorVersion() === 15) {
      return false;
    }

    if (!this.supportsCanvasCapturedStreamPlayback()) {
      return false;
    }

    return true;
  }

  requiresUnifiedPlan(): boolean {
    return (
      this.isFirefox() ||
      this.hasChromiumWebRTC() ||
      (this.hasWebKitWebRTC() && this.isUnifiedPlanSupported())
    );
  }

  requiresResolutionAlignment(width: number, height: number): [number, number] {
    if (this.isAndroid() && this.isPixel3()) {
      return [Math.ceil(width / 64) * 64, Math.ceil(height / 64) * 64];
    }
    return [width, height];
  }

  requiresCheckForSdpConnectionAttributes(): boolean {
    return !this.isIOSSafari() && !this.isIOSChrome() && !this.isIOSFirefox();
  }

  requiresIceCandidateGatheringTimeoutWorkaround(): boolean {
    return this.hasChromiumWebRTC();
  }

  requiresUnifiedPlanMunging(): boolean {
    return this.hasChromiumWebRTC() || (this.hasWebKitWebRTC() && this.isUnifiedPlanSupported());
  }

  requiresSortCodecPreferencesForSdpAnswer(): boolean {
    return this.isFirefox() && this.majorVersion() <= 68;
  }

  requiresSimulcastMunging(): boolean {
    return this.isSafari();
  }

  requiresBundlePolicy(): RTCBundlePolicy {
    return 'max-bundle';
  }

  requiresPromiseBasedWebRTCGetStats(): boolean {
    return !this.hasChromiumWebRTC();
  }

  requiresVideoElementWorkaround(): boolean {
    return this.isSafari() && this.majorVersion() === 12;
  }

  requiresNoExactMediaStreamConstraints(): boolean {
    return (
      this.isSamsungInternet() ||
      (this.isIOSSafari() && (this.version() === '12.0.0' || this.version() === '12.1.0'))
    );
  }

  requiresGroupIdMediaStreamConstraints(): boolean {
    return this.isSamsungInternet();
  }

  requiresContextRecreationForAudioWorklet(): boolean {
    if (!this.recreateAudioContextIfNeeded) {
      return false;
    }

    // Definitely not Chrome; no worries.
    if (!('chrome' in global)) {
      return false;
    }

    // Everything seems to work fine on platforms other than macOS.
    if (this.browser.os !== 'Mac OS') {
      return false;
    }

    // Electron or Chromium.
    // All other browsers are fine. But you'd have to be super weird --
    // faking global.chrome but not having a Chrome UA -- to get this far,
    // so we have some Istanbul directives on these.

    /* istanbul ignore else */
    if (this.isChrome() || this.isEdge()) {
      return true;
    }

    /* istanbul ignore next */
    return false;
  }

  getDisplayMediaAudioCaptureSupport(): boolean {
    return this.isChrome() || this.isEdge();
  }

  supportsSenderSideBandwidthEstimation(): boolean {
    return this.hasChromiumWebRTC() || this.isSafari();
  }

  // There's a issue in Chormium WebView that causes enumerate devices to return empty labels, this is a check for this issue.
  // https://bugs.chromium.org/p/chromium/issues/detail?id=669492
  doesNotSupportMediaDeviceLabels(): boolean {
    return this.browser.name === 'chromium-webview';
  }

  // TODO: Deprecated, needs to be removed
  screenShareUnsupported(): boolean {
    console.warn('This function is no longer supported.');
    if (this.isSafari()) {
      return true;
    }
    return false;
  }

  isSupported(): boolean {
    if (
      !this.browserSupport[this.browser.name] ||
      this.majorVersion() < this.browserSupport[this.browser.name]
    ) {
      return false;
    }
    if (this.browser.name === 'firefox' && this.isAndroid()) {
      return false;
    }
    return true;
  }

  isSimulcastSupported(): boolean {
    return this.hasChromiumWebRTC();
  }

  supportString(): string {
    if (this.isAndroid()) {
      return `${this.browserName['chrome']} ${this.browserSupport['chrome']}+, ${this.browserName['samsung']} ${this.browserSupport['samsung']}+`;
    }
    const s: string[] = [];
    for (const k in this.browserSupport) {
      s.push(`${this.browserName[k]} ${this.browserSupport[k]}+`);
    }
    return s.join(', ');
  }

  async supportedVideoCodecs(): Promise<string[]> {
    const pc = new RTCPeerConnection();
    pc.addTransceiver('video', { direction: 'inactive', streams: [] });
    return (await pc.createOffer({ offerToReceiveVideo: true })).sdp
      .split('\r\n')
      .filter(x => {
        return x.includes('a=rtpmap:');
      })
      .map(x => {
        return x.replace(/.* /, '').replace(/\/.*/, '');
      })
      .filter((v, i, a) => {
        return a.indexOf(v) === i;
      })
      .filter(x => {
        return x !== 'rtx' && x !== 'red' && x !== 'ulpfec';
      });
  }

  supportsSetSinkId(): boolean {
    return 'setSinkId' in HTMLAudioElement.prototype;
  }

  disableResolutionScaleDown(): boolean {
    return this.isAndroid();
  }

  // These helpers should be kept private to encourage
  // feature detection instead of browser detection.
  private isIOSSafari(): boolean {
    return this.browser.name === 'ios' || this.browser.name === 'ios-webview';
  }

  private isSafari(): boolean {
    return this.browser.name === 'safari' || this.browser.name === 'ios';
  }

  private isFirefox(): boolean {
    return this.browser.name === 'firefox';
  }

  private isIOSFirefox(): boolean {
    return this.browser.name === 'fxios';
  }

  private isIOSChrome(): boolean {
    return this.browser.name === 'crios';
  }

  private isChrome(): boolean {
    return this.browser.name === 'chrome';
  }

  private isEdge(): boolean {
    return this.browser.name === 'edge-chromium';
  }

  private isSamsungInternet(): boolean {
    return this.browser.name === 'samsung';
  }

  private isAndroid(): boolean {
    return /(android)/i.test(navigator.userAgent);
  }

  private isPixel3(): boolean {
    return /( pixel 3)/i.test(navigator.userAgent);
  }

  private isUnifiedPlanSupported(): boolean {
    return RTCRtpTransceiver.prototype.hasOwnProperty('currentDirection');
  }
}
