// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { detect } from 'detect-browser';

import BrowserBehavior from './BrowserBehavior';

export default class DefaultBrowserBehavior implements BrowserBehavior {
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
  };

  private chromeLike: string[] = [
    'chrome',
    'edge-chromium',
    'chromium-webview',
    'opera',
    'samsung',
  ];
  private enableUnifiedPlanForChromiumBasedBrowsers: boolean;

  constructor({
    enableUnifiedPlanForChromiumBasedBrowsers = false,
  }: { enableUnifiedPlanForChromiumBasedBrowsers?: boolean } = {}) {
    this.enableUnifiedPlanForChromiumBasedBrowsers = enableUnifiedPlanForChromiumBasedBrowsers;
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

  hasFirefoxWebRTC(): boolean {
    return this.isFirefox();
  }

  supportsCanvasCapturedStreamPlayback(): boolean {
    return !this.isIOSSafari();
  }

  requiresUnifiedPlan(): boolean {
    let shouldEnable = (this.isSafari() && this.isUnifiedPlanSupported()) || this.isFirefox();
    if (this.enableUnifiedPlanForChromiumBasedBrowsers) {
      shouldEnable = shouldEnable || this.hasChromiumWebRTC();
    }
    return shouldEnable;
  }

  requiresResolutionAlignment(width: number, height: number): [number, number] {
    if (this.isAndroid() && this.isPixel3()) {
      return [Math.ceil(width / 64) * 64, Math.ceil(height / 64) * 64];
    }
    return [width, height];
  }

  requiresCheckForSdpConnectionAttributes(): boolean {
    return !this.isIOSSafari();
  }

  requiresIceCandidateGatheringTimeoutWorkaround(): boolean {
    return this.hasChromiumWebRTC();
  }

  requiresUnifiedPlanMunging(): boolean {
    let shouldRequire = this.isSafari() && this.isUnifiedPlanSupported();
    if (this.enableUnifiedPlanForChromiumBasedBrowsers) {
      shouldRequire = shouldRequire || this.hasChromiumWebRTC();
    }
    return shouldRequire;
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
    return this.isSafari();
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

  getDisplayMediaAudioCaptureSupport(): boolean {
    return this.isChrome() || this.isEdge();
  }

  screenShareUnsupported(): boolean {
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

  // These helpers should be kept private to encourage
  // feature detection instead of browser detection.
  private isIOSSafari(): boolean {
    return this.browser.name === 'ios';
  }

  private isSafari(): boolean {
    return this.browser.name === 'safari' || this.browser.name === 'ios';
  }

  private isFirefox(): boolean {
    return this.browser.name === 'firefox';
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
