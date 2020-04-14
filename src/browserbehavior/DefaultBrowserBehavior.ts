// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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
  };

  private browserName: { [id: string]: string } = {
    chrome: 'Google Chrome',
    'edge-chromium': 'Microsoft Edge',
    electron: 'Electron',
    firefox: 'Mozilla Firefox',
    ios: 'Safari iOS',
    safari: 'Safari',
    opera: 'Opera',
  };

  private chromeLike: string[] = ['chrome', 'edge-chromium', 'chromium-webview', 'opera'];
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

  screenShareSendsOnlyKeyframes(): boolean {
    return this.isFirefox();
  }

  requiresUnifiedPlan(): boolean {
    let shouldEnable = this.isSafari() || this.isFirefox();
    if (this.enableUnifiedPlanForChromiumBasedBrowsers) {
      shouldEnable = shouldEnable || this.hasChromiumWebRTC();
    }
    return shouldEnable;
  }

  requiresCheckForSdpConnectionAttributes(): boolean {
    return !this.isIOSSafari();
  }

  requiresIceCandidateGatheringTimeoutWorkaround(): boolean {
    return this.hasChromiumWebRTC();
  }

  requiresUnifiedPlanMunging(): boolean {
    let shouldRequire = this.isSafari();
    if (this.enableUnifiedPlanForChromiumBasedBrowsers) {
      shouldRequire = shouldRequire || this.hasChromiumWebRTC();
    }
    return shouldRequire;
  }

  requiresBundlePolicy(): RTCBundlePolicy {
    return 'max-bundle';
  }

  requiresPromiseBasedWebRTCGetStats(): boolean {
    return !this.hasChromiumWebRTC();
  }

  screenShareUnsupported(): boolean {
    if (this.isSafari()) {
      return true;
    }
    return false;
  }

  isSupported(): boolean {
    return this.majorVersion() >= this.browserSupport[this.browser.name];
  }

  supportString(): string {
    const s: string[] = [];
    for (const k in this.browserSupport) {
      s.push(`${this.browserName[k]} ${this.browserSupport[k]}+`);
    }
    return s.join(', ');
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
}
