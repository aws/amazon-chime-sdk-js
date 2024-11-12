// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { detect } from 'detect-browser';
import { UAParser } from 'ua-parser-js';

import BrowserBehavior from './BrowserBehavior';
import ExtendedBrowserBehavior from './ExtendedBrowserBehavior';

export default class DefaultBrowserBehavior implements BrowserBehavior, ExtendedBrowserBehavior {
  private readonly FALLBACK_BROWSER = {
    type: 'browser',
    name: 'unknown',
    version: 'unknown',
    os: 'unknown',
  };
  private readonly browser = detect() || this.FALLBACK_BROWSER;
  private readonly uaParserResult =
    navigator && navigator.userAgent ? new UAParser(navigator.userAgent).getResult() : null;

  private browserSupport: { [id: string]: number } = {
    chrome: 78,
    'edge-chromium': 79,
    electron: 7,
    firefox: 75,
    ios: 13,
    safari: 13,
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

  private webkitBrowsers: string[] = ['crios', 'fxios', 'safari', 'ios', 'ios-webview', 'edge-ios'];
  private static MIN_IOS_SUPPORT_CANVAS_STREAM_PLAYBACK = 16;
  private static MIN_IOS_NON_SAFARI_SUPPORT_CANVAS_STREAM_PLAYBACK = 106;

  version(): string {
    return this.browser.version;
  }

  majorVersion(): number {
    return this.version() !== null ? parseInt(this.version().split('.')[0]) : -1;
  }

  osMajorVersion(): number {
    return parseInt(this.uaParserResult.os.version.split('.')[0]);
  }

  private engine(): string {
    return this.uaParserResult.engine.name;
  }

  private engineMajorVersion(): number {
    return parseInt(this.uaParserResult.engine.version.split('.')[0]);
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

  requiresPlaybackLatencyHintForAudioContext(): boolean {
    return navigator.userAgent.indexOf('Windows') !== -1;
  }

  supportsCanvasCapturedStreamPlayback(): boolean {
    return (
      // Desktop browser
      (!this.isIOSSafari() && !this.isIOSChrome() && !this.isIOSFirefox() && !this.isIOSEdge()) ||
      // iOS Safari (Firefox on iOS with desktop view will be identified as iOS Safari
      (this.isIOSSafari() &&
        this.majorVersion() >= DefaultBrowserBehavior.MIN_IOS_SUPPORT_CANVAS_STREAM_PLAYBACK) ||
      // Chrome, Edge, or Firefox (mobile view) on iOS
      this.majorVersion() >=
        DefaultBrowserBehavior.MIN_IOS_NON_SAFARI_SUPPORT_CANVAS_STREAM_PLAYBACK
    );
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

  supportsVideoLayersAllocationRtpHeaderExtension(): boolean {
    return this.hasChromiumWebRTC();
  }

  supportsDependencyDescriptorRtpHeaderExtension(): boolean {
    return this.hasChromiumWebRTC();
  }

  supportsScalableVideoCoding(): boolean {
    return (
      // Currently `this.hasChromiumWebRTC() && this.engine() === 'Blink'` completely
      // overlaps but we keep both just in case that changes in the future.
      this.hasChromiumWebRTC() && this.engine() === 'Blink' && this.engineMajorVersion() >= 111
    );
  }

  supportsAudioRedundancy(): boolean {
    if (this.hasChromiumWebRTC()) {
      // Audio redundancy may cause video decoding failure for Chromium version 106 and
      // earlier. Marking such Chromium versions as not supporting audio redundancy.
      return this.engineMajorVersion() >= 107;
    }
    return !this.hasFirefoxWebRTC();
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

  requiresBundlePolicy(): RTCBundlePolicy {
    return 'max-bundle';
  }

  requiresNoExactMediaStreamConstraints(): boolean {
    return this.isSamsungInternet();
  }

  requiresGroupIdMediaStreamConstraints(): boolean {
    return this.isSamsungInternet();
  }

  getDisplayMediaAudioCaptureSupport(): boolean {
    return this.isChrome() || this.isEdge();
  }

  // There's a issue in Chormium WebView that causes enumerate devices to return empty labels, this is a check for this issue.
  // https://bugs.chromium.org/p/chromium/issues/detail?id=669492
  doesNotSupportMediaDeviceLabels(): boolean {
    return this.browser.name === 'chromium-webview';
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

  supportDownlinkBandwidthEstimation(): boolean {
    return !this.isFirefox();
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

  disable480pResolutionScaleDown(): boolean {
    return /( Chrome\/98\.)/i.test(navigator.userAgent) && this.browser.os.startsWith('Windows');
  }

  requiresDisablingH264Encoding(): boolean {
    return this.isIOS() && (this.version() === '15.1.0' || /( OS 15_1)/i.test(navigator.userAgent));
  }

  // In Safari, a hidden video element can show a black screen.
  // See https://bugs.webkit.org/show_bug.cgi?id=241152 for more information.
  requiresVideoPlayWorkaround(): boolean {
    return this.isSafari();
  }

  requiresAudioContextResetOnDeviceFailureForWebAudio(): boolean {
    // In iOS Safari, when an audio media stream fails (i.e. in the case of being
    // unplugged), the audio context becomes broken, and e.g. stops transmitting
    // audio. This can be mitigated by suspending and resuming the context.
    //
    // The WebKit bug is https://bugs.webkit.org/show_bug.cgi?id=232640
    return this.isIOS();
  }

  /**
   * Check if the current browser supports the [[VideoFxProcessor]].
   * @returns boolean representing if browser supports [[VideoFxProcessor]].
   */
  isVideoFxSupportedBrowser(): boolean {
    // Not supported on safari 15 and on environments without canvas capture playback
    return this.supportsBackgroundFilter();
  }

  // These helpers should be kept private to encourage
  // feature detection instead of browser detection.
  private isIOSSafari(): boolean {
    return (
      this.browser.name === 'ios' ||
      this.browser.name === 'ios-webview' ||
      (this.browser.name === 'safari' &&
        /( Mac )/i.test(navigator.userAgent) &&
        navigator.maxTouchPoints > 1) //Ipad
    );
  }

  private isSafari(): boolean {
    return this.browser.name === 'safari' || this.isIOSSafari();
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

  private isIOSEdge(): boolean {
    return this.browser.name === 'edge-ios';
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

  private isIOS(): boolean {
    // Is one of the supported iOS browsers
    return this.isIOSSafari() || this.isIOSChrome() || this.isIOSFirefox();
  }
}
