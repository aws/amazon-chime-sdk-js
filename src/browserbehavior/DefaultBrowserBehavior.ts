// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { detect } from 'detect-browser';

export default class DefaultBrowserBehavior {
  private readonly browser = detect();

  version(): string {
    return this.browser.version;
  }

  majorVersion(): number {
    return parseInt(this.version().split('.')[0]);
  }

  isEdgeChromium(): boolean {
    return this.browser.name === 'edge-chromium';
  }

  isSafari(): boolean {
    return this.browser.name === 'safari' || this.browser.name === 'ios';
  }

  isChrome(): boolean {
    return this.browser.name === 'chrome';
  }

  isFirefox(): boolean {
    return this.browser.name === 'firefox';
  }

  name(): string {
    return this.browser.name;
  }

  requiresUnifiedPlan(): boolean {
    return this.isSafari() || this.isFirefox();
  }

  requiresIceCandidateGatheringTimeoutWorkaround(): boolean {
    return this.isChrome();
  }

  requiresUnifiedPlanMunging(): boolean {
    return this.isSafari();
  }

  requiresBundlePolicy(): RTCBundlePolicy {
    if (this.isSafari()) {
      return 'max-bundle';
    } else {
      return 'balanced';
    }
  }

  requiresPromiseBasedWebRTCGetStats(): boolean {
    return !this.isChrome();
  }

  isSupported(): boolean {
    if (this.isSafari()) {
      return this.majorVersion() >= 13;
    } else if (this.isChrome()) {
      return this.majorVersion() >= 78;
    } else if (this.isFirefox()) {
      return this.majorVersion() >= 60;
    } else if (this.isEdgeChromium()) {
      return this.majorVersion() >= 79;
    }
    return false;
  }

  supportString(): string {
    return 'Chromium 78+, Electron 7+, Microsoft Edge 79+, Google Chrome 78+, Mozilla Firefox 60+';
  }
}
