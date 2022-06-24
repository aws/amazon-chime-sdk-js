// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import DefaultBrowserBehavior from '../../src/browserbehavior/DefaultBrowserBehavior';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

interface LimitedWindow {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chrome?: any;
  navigator: {
    userAgent: string;
  };
}

describe('DefaultBrowserBehavior', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  const CHROME_MAC_USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3865.75 Safari/537.36';
  const FIREFOX_MAC_USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:68.0) Gecko/20100101 Firefox/75.0';
  const SAFARI_USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.2 Safari/605.1.15';
  const CHROMIUM_EDGE_WINDOWS_USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3729.48 Safari/537.36 Edg/79.1.96.24';
  const CHROMIUM_EDGE_WINDOWS_USER_AGENT_98 =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.80 Safari/537.36 Edg/98.0.4758.80';
  const CHROMIUM_EDGE_MAC_USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36 Edg/89.0.774.63';
  const OPERA_USER_AGENT = 'Opera/9.80 (Windows NT 6.1; WOW64) Presto/2.12.388 Version/12.18';
  const FIREFOX_ANDROID_USER_AGENT =
    'Mozilla/5.0 (Android 10; Mobile; rv:68.0) Gecko/75.0 Firefox/75.0';
  const SAMSUNG_INTERNET_USER_AGENT =
    'Mozilla/5.0 (Linux; Android 11; Pixel 3a XL) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/13.0 Chrome/83.0.4103.106 Mobile Safari/537.36';
  const CHROME_IOS_USER_AGENT =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 15_1 like Mac OS X) AppleWebKit/605.1.50 (KHTML, like Gecko) CriOS/95.0.4638.50 Mobile/14E5239e Safari/604.1';
  const FIREFOX_IOS_USER_AGENT =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 15_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/29.1.0 Mobile/16B91 Safari/605.1.15';
  const ELECTRON_WINDOWS_USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0.18362; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Slack/4.9.0 Chrome/85.0.4183.93 Electron/10.1.1 Safari/537.36 Sonic Slack_SSB/4.9.0';
  const WKWEBVIEW_IOS_USER_AGENT =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
  const CHROMIUM_WEBVIEW_USER_AGENT =
    'Mozilla/5.0 (Linux; Android 10; LM-G710 Build/QKQ1.191222.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/92.0.4515.115 Mobile Safari/537.36';
  const IPAD_SAFARI_USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15';

  const setUserAgent = (userAgent: string): void => {
    // @ts-ignore
    navigator.userAgent = userAgent;
  };

  const setMaxTouchPoint = (n: number): void => {
    // @ts-ignore
    navigator.maxTouchPoints = n;
  };

  const setHasGlobalChrome = (yes: boolean): void => {
    const window = (global as unknown) as LimitedWindow;
    if (yes) {
      window.chrome = { foo: 1 };
    } else {
      delete window.chrome;
    }
  };

  let mockBuilder: DOMMockBuilder | null = null;
  let domMockBehavior: DOMMockBehavior;

  beforeEach(() => {
    mockBuilder = new DOMMockBuilder();
  });

  afterEach(() => {
    mockBuilder.cleanup();
  });

  describe('platforms', () => {
    it('can detect Firefox', () => {
      setUserAgent(FIREFOX_MAC_USER_AGENT);
      expect(new DefaultBrowserBehavior().name()).to.eq('firefox');
      expect(new DefaultBrowserBehavior().isSupported()).to.be.true;
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(75);
      expect(new DefaultBrowserBehavior().requiresBundlePolicy()).to.eq('max-bundle');
      expect(new DefaultBrowserBehavior().getDisplayMediaAudioCaptureSupport()).to.be.false;
      expect(new DefaultBrowserBehavior().requiresNoExactMediaStreamConstraints()).to.be.false;
      expect(new DefaultBrowserBehavior().supportDownlinkBandwidthEstimation()).to.be.false;
      expect(new DefaultBrowserBehavior().supportsVideoLayersAllocationRtpHeaderExtension()).to.be
        .false;
    });

    it('can detect Firefox on Android', () => {
      setUserAgent(FIREFOX_ANDROID_USER_AGENT);
      expect(new DefaultBrowserBehavior().name()).to.eq('firefox');
      expect(new DefaultBrowserBehavior().isSupported()).to.be.false;
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(75);
      expect(new DefaultBrowserBehavior().supportString()).to.eq(
        'Google Chrome 78+, Samsung Internet 12+'
      );
    });

    it('can detect Chrome', () => {
      setUserAgent(CHROME_MAC_USER_AGENT);
      expect(new DefaultBrowserBehavior().name()).to.eq('chrome');
      expect(new DefaultBrowserBehavior().isSupported()).to.be.true;
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(78);
      expect(new DefaultBrowserBehavior().requiresBundlePolicy()).to.eq('max-bundle');
      expect(new DefaultBrowserBehavior().getDisplayMediaAudioCaptureSupport()).to.be.true;
      expect(new DefaultBrowserBehavior().requiresNoExactMediaStreamConstraints()).to.be.false;
      expect(new DefaultBrowserBehavior().supportDownlinkBandwidthEstimation()).to.be.true;
      expect(new DefaultBrowserBehavior().supportsVideoLayersAllocationRtpHeaderExtension()).to.be
        .true;
    });

    it('can detect Edge Chromium', () => {
      function check(): void {
        expect(new DefaultBrowserBehavior().name()).to.eq('edge-chromium');
        expect(new DefaultBrowserBehavior().isSupported()).to.be.true;
        expect(new DefaultBrowserBehavior().hasWebKitWebRTC()).to.be.false;
        expect(new DefaultBrowserBehavior().requiresBundlePolicy()).to.eq('max-bundle');
        expect(new DefaultBrowserBehavior().getDisplayMediaAudioCaptureSupport()).to.be.true;
        expect(new DefaultBrowserBehavior().requiresNoExactMediaStreamConstraints()).to.be.false;
      }

      setUserAgent(CHROMIUM_EDGE_WINDOWS_USER_AGENT);
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(79);
      check();

      setUserAgent(CHROMIUM_EDGE_MAC_USER_AGENT);
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(89);
      check();

      setUserAgent(CHROMIUM_EDGE_WINDOWS_USER_AGENT);
    });

    it('can detect Samsung Internet', () => {
      setUserAgent(SAMSUNG_INTERNET_USER_AGENT);
      expect(new DefaultBrowserBehavior().name()).to.eq('samsung');
      expect(new DefaultBrowserBehavior().isSupported()).to.be.true;
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(13);
      expect(new DefaultBrowserBehavior().requiresBundlePolicy()).to.eq('max-bundle');
      expect(new DefaultBrowserBehavior().getDisplayMediaAudioCaptureSupport()).to.be.false;
      expect(new DefaultBrowserBehavior().requiresNoExactMediaStreamConstraints()).to.be.true;
      expect(new DefaultBrowserBehavior().requiresGroupIdMediaStreamConstraints()).to.be.true;
      expect(new DefaultBrowserBehavior().supportString()).to.eq(
        'Google Chrome 78+, Samsung Internet 12+'
      );
    });

    it('can detect Safari', () => {
      setUserAgent(SAFARI_USER_AGENT);
      expect(new DefaultBrowserBehavior().name()).to.eq('safari');
      expect(new DefaultBrowserBehavior().isSupported()).to.be.true;
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(13);
      expect(new DefaultBrowserBehavior().hasWebKitWebRTC()).to.be.true;
      expect(new DefaultBrowserBehavior().requiresBundlePolicy()).to.eq('max-bundle');
      expect(new DefaultBrowserBehavior().getDisplayMediaAudioCaptureSupport()).to.be.false;
      expect(new DefaultBrowserBehavior().requiresNoExactMediaStreamConstraints()).to.be.false;
      expect(new DefaultBrowserBehavior().supportDownlinkBandwidthEstimation()).to.be.true;
    });

    it('can detect Ipad Safari', () => {
      setUserAgent(IPAD_SAFARI_USER_AGENT);
      setMaxTouchPoint(5);
      expect(new DefaultBrowserBehavior().name()).to.eq('safari');
      expect(new DefaultBrowserBehavior().isSupported()).to.be.true;
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(15);
      expect(new DefaultBrowserBehavior().requiresDisablingH264Encoding()).to.be.true;
      expect(new DefaultBrowserBehavior().requiresBundlePolicy()).to.eq('max-bundle');
      expect(new DefaultBrowserBehavior().getDisplayMediaAudioCaptureSupport()).to.be.false;
      expect(new DefaultBrowserBehavior().requiresNoExactMediaStreamConstraints()).to.be.false;
    });

    it('can detect iOS Chrome', () => {
      setUserAgent(ELECTRON_WINDOWS_USER_AGENT);
      expect(new DefaultBrowserBehavior().name()).to.not.eq('crios');
      setUserAgent(CHROME_IOS_USER_AGENT);
      expect(new DefaultBrowserBehavior().name()).to.eq('crios');
      expect(new DefaultBrowserBehavior().isSupported()).to.be.true;
      expect(new DefaultBrowserBehavior().hasWebKitWebRTC()).to.be.true;
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(95);
      expect(new DefaultBrowserBehavior().requiresDisablingH264Encoding()).to.be.true;
      expect(new DefaultBrowserBehavior().requiresBundlePolicy()).to.eq('max-bundle');
      expect(new DefaultBrowserBehavior().getDisplayMediaAudioCaptureSupport()).to.be.false;
      expect(new DefaultBrowserBehavior().requiresNoExactMediaStreamConstraints()).to.be.false;
    });

    it('can detect iOS Firefox', () => {
      setUserAgent(FIREFOX_IOS_USER_AGENT);
      expect(new DefaultBrowserBehavior().name()).to.eq('fxios');
      expect(new DefaultBrowserBehavior().isSupported()).to.be.true;
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(29);
      expect(new DefaultBrowserBehavior().requiresBundlePolicy()).to.eq('max-bundle');
      expect(new DefaultBrowserBehavior().getDisplayMediaAudioCaptureSupport()).to.be.false;
      expect(new DefaultBrowserBehavior().requiresNoExactMediaStreamConstraints()).to.be.false;
    });

    it('can detect iOS WKWebView', () => {
      setUserAgent(WKWEBVIEW_IOS_USER_AGENT);
      expect(new DefaultBrowserBehavior().name()).to.eq('ios-webview');
      expect(new DefaultBrowserBehavior().isSupported()).to.be.true;
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(605);
      expect(new DefaultBrowserBehavior().requiresBundlePolicy()).to.eq('max-bundle');
      expect(new DefaultBrowserBehavior().getDisplayMediaAudioCaptureSupport()).to.be.false;
      expect(new DefaultBrowserBehavior().requiresNoExactMediaStreamConstraints()).to.be.false;
    });

    it('can detect Chromium Webview', () => {
      setUserAgent(CHROMIUM_WEBVIEW_USER_AGENT);
      expect(new DefaultBrowserBehavior().name()).to.eq('chromium-webview');
      expect(new DefaultBrowserBehavior().isSupported()).to.be.true;
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(92);
      expect(new DefaultBrowserBehavior().requiresBundlePolicy()).to.eq('max-bundle');
      expect(new DefaultBrowserBehavior().getDisplayMediaAudioCaptureSupport()).to.be.false;
      expect(new DefaultBrowserBehavior().requiresNoExactMediaStreamConstraints()).to.be.false;
      expect(new DefaultBrowserBehavior().doesNotSupportMediaDeviceLabels()).to.be.true;
    });

    it('can test Safari version 12', () => {
      domMockBehavior = new DOMMockBehavior();
      domMockBehavior.browserName = 'safari12';
      mockBuilder = new DOMMockBuilder(domMockBehavior);
      expect(new DefaultBrowserBehavior().name()).to.eq('safari');
      expect(new DefaultBrowserBehavior().isSupported()).to.be.false;
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(12);
      expect(new DefaultBrowserBehavior().requiresBundlePolicy()).to.eq('max-bundle');
      expect(new DefaultBrowserBehavior().requiresNoExactMediaStreamConstraints()).to.be.false;
    });

    it('can test Safari version 11', () => {
      domMockBehavior = new DOMMockBehavior();
      domMockBehavior.browserName = 'safari11';
      mockBuilder = new DOMMockBuilder(domMockBehavior);
      expect(new DefaultBrowserBehavior().name()).to.eq('safari');
      expect(new DefaultBrowserBehavior().isSupported()).to.be.false;
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(11);
      expect(new DefaultBrowserBehavior().requiresBundlePolicy()).to.eq('max-bundle');
      expect(new DefaultBrowserBehavior().requiresNoExactMediaStreamConstraints()).to.be.false;
    });

    it('can handle an unknown user agent', () => {
      setUserAgent(OPERA_USER_AGENT);
      expect(new DefaultBrowserBehavior().isSupported()).to.be.false;
    });
  });

  describe('supportedVideoCodecs', () => {
    it('can determine the available video codecs from a test SDP', async () => {
      const codecs = await new DefaultBrowserBehavior().supportedVideoCodecs();
      expect(codecs.includes('H264')).to.equal(true);
      expect(codecs.includes('VP8')).to.equal(true);
    });
  });

  describe('supportsCanvasCapturedStreamPlayback', () => {
    it('can determine if video processing is supported', () => {
      expect(new DefaultBrowserBehavior().supportsCanvasCapturedStreamPlayback()).to.be.true;
    });
  });

  describe('disable480pResolutionScaleDown', () => {
    it('Return true for Edge 98 Windows', () => {
      setUserAgent(CHROMIUM_EDGE_WINDOWS_USER_AGENT_98);
      expect(new DefaultBrowserBehavior().disable480pResolutionScaleDown()).to.be.true;
    });

    it('Return false for non Edge 98 Windows', () => {
      setUserAgent(CHROMIUM_EDGE_WINDOWS_USER_AGENT);
      expect(new DefaultBrowserBehavior().disable480pResolutionScaleDown()).to.be.false;
      setUserAgent(CHROME_MAC_USER_AGENT);
      expect(new DefaultBrowserBehavior().disable480pResolutionScaleDown()).to.be.false;
    });
  });

  describe('edge', () => {
    it('is not Chrome', () => {
      setHasGlobalChrome(true);
      setUserAgent(CHROMIUM_EDGE_WINDOWS_USER_AGENT);
      // @ts-ignore
      expect(new DefaultBrowserBehavior().isChrome()).to.be.false;
      // @ts-ignore
      expect(new DefaultBrowserBehavior().isEdge()).to.be.true;
    });
  });

  describe('support Simulcast', () => {
    it('Supports for Chrome and unified plan (always enabled and not configurable)', () => {
      setUserAgent(CHROME_MAC_USER_AGENT);
      expect(new DefaultBrowserBehavior().isSimulcastSupported()).to.be.true;
    });

    it('Does not support for non-Chrome browsers', () => {
      setUserAgent(FIREFOX_MAC_USER_AGENT);
      expect(new DefaultBrowserBehavior().isSimulcastSupported()).to.be.false;
    });
  });
});
