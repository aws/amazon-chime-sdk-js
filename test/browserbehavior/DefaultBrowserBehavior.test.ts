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

  const CHROME_WINDOWS_USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3865.75 Safari/537.36';
  const CHROME_MAC_USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3865.75 Safari/537.36';
  const FIREFOX_WINDOWS_USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Gecko/20100101 Firefox/68.0';
  const FIREFOX_MAC_USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:68.0) Gecko/20100101 Firefox/68.0';
  const SAFARI_USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.2 Safari/605.1.15';
  const CHROMIUM_EDGE_WINDOWS_USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3729.48 Safari/537.36 Edg/79.1.96.24';
  const CHROMIUM_EDGE_MAC_USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36 Edg/89.0.774.63';
  const OPERA_USER_AGENT = 'Opera/9.80 (Windows NT 6.1; WOW64) Presto/2.12.388 Version/12.18';
  const FIREFOX_ANDROID_USER_AGENT =
    'Mozilla/5.0 (Android 10; Mobile; rv:68.0) Gecko/68.0 Firefox/68.0';
  const SAMSUNG_INTERNET_USER_AGENT =
    'Mozilla/5.0 (Linux; Android 11; Pixel 3a XL) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/13.0 Chrome/83.0.4103.106 Mobile Safari/537.36';
  const CHROME_IOS_USER_AGENT =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/88.0.4324.152 Mobile/14E5239e Safari/602.1';
  const FIREFOX_IOS_USER_AGENT =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/29.1.0 Mobile/16B91 Safari/605.1.15';
  const ELECTRON_MAC_USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Slack/4.9.0 Chrome/85.0.4183.93 Electron/10.1.1 Safari/537.36 Sonic Slack_SSB/4.9.0';
  const ELECTRON_WINDOWS_USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0.18362; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Slack/4.9.0 Chrome/85.0.4183.93 Electron/10.1.1 Safari/537.36 Sonic Slack_SSB/4.9.0';
  const WKWEBVIEW_IOS_USER_AGENT =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';

  const setUserAgent = (userAgent: string): void => {
    // @ts-ignore
    navigator.userAgent = userAgent;
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
      expect(new DefaultBrowserBehavior().screenShareUnsupported()).to.be.false;
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(68);
      expect(new DefaultBrowserBehavior().requiresBundlePolicy()).to.eq('max-bundle');
      expect(new DefaultBrowserBehavior().requiresUnifiedPlan()).to.be.true;
      expect(new DefaultBrowserBehavior().requiresUnifiedPlanMunging()).to.be.false;
      expect(new DefaultBrowserBehavior().getDisplayMediaAudioCaptureSupport()).to.be.false;
      expect(new DefaultBrowserBehavior().requiresNoExactMediaStreamConstraints()).to.be.false;
      expect(new DefaultBrowserBehavior().supportsSenderSideBandwidthEstimation()).to.be.false;
    });

    it('can detect Firefox on Android', () => {
      setUserAgent(FIREFOX_ANDROID_USER_AGENT);
      expect(new DefaultBrowserBehavior().name()).to.eq('firefox');
      expect(new DefaultBrowserBehavior().isSupported()).to.be.false;
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(68);
      expect(new DefaultBrowserBehavior().supportString()).to.eq(
        'Google Chrome 78+, Samsung Internet 12+'
      );
    });

    it('can detect Chrome', () => {
      setUserAgent(CHROME_MAC_USER_AGENT);
      expect(new DefaultBrowserBehavior().name()).to.eq('chrome');
      expect(new DefaultBrowserBehavior().isSupported()).to.be.true;
      expect(new DefaultBrowserBehavior().screenShareUnsupported()).to.be.false;
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(78);
      expect(new DefaultBrowserBehavior().requiresBundlePolicy()).to.eq('max-bundle');
      expect(new DefaultBrowserBehavior().getDisplayMediaAudioCaptureSupport()).to.be.true;
      expect(new DefaultBrowserBehavior().requiresNoExactMediaStreamConstraints()).to.be.false;
      expect(new DefaultBrowserBehavior().supportsSenderSideBandwidthEstimation()).to.be.true;
      const enableUnifiedPlan = true;
      expect(
        new DefaultBrowserBehavior({
          enableUnifiedPlanForChromiumBasedBrowsers: enableUnifiedPlan,
        }).requiresUnifiedPlan()
      ).to.be.true;
      expect(
        new DefaultBrowserBehavior({
          enableUnifiedPlanForChromiumBasedBrowsers: enableUnifiedPlan,
        }).requiresUnifiedPlanMunging()
      ).to.be.true;
      expect(
        new DefaultBrowserBehavior({
          enableUnifiedPlanForChromiumBasedBrowsers: !enableUnifiedPlan,
        }).requiresUnifiedPlan()
      ).to.be.false;
      expect(
        new DefaultBrowserBehavior({
          enableUnifiedPlanForChromiumBasedBrowsers: !enableUnifiedPlan,
        }).requiresUnifiedPlanMunging()
      ).to.be.false;
    });

    it('can detect Edge Chromium', () => {
      function check(): void {
        expect(new DefaultBrowserBehavior().name()).to.eq('edge-chromium');
        expect(new DefaultBrowserBehavior().isSupported()).to.be.true;
        expect(new DefaultBrowserBehavior().screenShareUnsupported()).to.be.false;
        expect(new DefaultBrowserBehavior().requiresBundlePolicy()).to.eq('max-bundle');
        expect(new DefaultBrowserBehavior().getDisplayMediaAudioCaptureSupport()).to.be.true;
        expect(new DefaultBrowserBehavior().requiresNoExactMediaStreamConstraints()).to.be.false;
        expect(new DefaultBrowserBehavior().supportsSenderSideBandwidthEstimation()).to.be.true;
      }

      setUserAgent(CHROMIUM_EDGE_WINDOWS_USER_AGENT);
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(79);
      check();

      setUserAgent(CHROMIUM_EDGE_MAC_USER_AGENT);
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(89);
      check();

      setUserAgent(CHROMIUM_EDGE_WINDOWS_USER_AGENT);
      const enableUnifiedPlan = true;
      expect(
        new DefaultBrowserBehavior({
          enableUnifiedPlanForChromiumBasedBrowsers: enableUnifiedPlan,
        }).requiresUnifiedPlan()
      ).to.be.true;
      expect(
        new DefaultBrowserBehavior({
          enableUnifiedPlanForChromiumBasedBrowsers: enableUnifiedPlan,
        }).requiresUnifiedPlanMunging()
      ).to.be.true;
      expect(
        new DefaultBrowserBehavior({
          enableUnifiedPlanForChromiumBasedBrowsers: !enableUnifiedPlan,
        }).requiresUnifiedPlan()
      ).to.be.false;
      expect(
        new DefaultBrowserBehavior({
          enableUnifiedPlanForChromiumBasedBrowsers: !enableUnifiedPlan,
        }).requiresUnifiedPlanMunging()
      ).to.be.false;
    });

    it('can detect Samsung Internet', () => {
      setUserAgent(SAMSUNG_INTERNET_USER_AGENT);
      expect(new DefaultBrowserBehavior().name()).to.eq('samsung');
      expect(new DefaultBrowserBehavior().isSupported()).to.be.true;
      expect(new DefaultBrowserBehavior().screenShareUnsupported()).to.be.false;
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(13);
      expect(new DefaultBrowserBehavior().requiresBundlePolicy()).to.eq('max-bundle');
      expect(new DefaultBrowserBehavior().getDisplayMediaAudioCaptureSupport()).to.be.false;
      expect(new DefaultBrowserBehavior().requiresNoExactMediaStreamConstraints()).to.be.true;
      expect(new DefaultBrowserBehavior().requiresGroupIdMediaStreamConstraints()).to.be.true;
      expect(new DefaultBrowserBehavior().supportsSenderSideBandwidthEstimation()).to.be.true;
      expect(new DefaultBrowserBehavior().supportString()).to.eq(
        'Google Chrome 78+, Samsung Internet 12+'
      );
      const enableUnifiedPlan = true;
      expect(
        new DefaultBrowserBehavior({
          enableUnifiedPlanForChromiumBasedBrowsers: enableUnifiedPlan,
        }).requiresUnifiedPlan()
      ).to.be.true;
      expect(
        new DefaultBrowserBehavior({
          enableUnifiedPlanForChromiumBasedBrowsers: enableUnifiedPlan,
        }).requiresUnifiedPlanMunging()
      ).to.be.true;
      expect(
        new DefaultBrowserBehavior({
          enableUnifiedPlanForChromiumBasedBrowsers: !enableUnifiedPlan,
        }).requiresUnifiedPlan()
      ).to.be.false;
      expect(
        new DefaultBrowserBehavior({
          enableUnifiedPlanForChromiumBasedBrowsers: !enableUnifiedPlan,
        }).requiresUnifiedPlanMunging()
      ).to.be.false;
    });

    it('can detect Safari', () => {
      setUserAgent(SAFARI_USER_AGENT);
      expect(new DefaultBrowserBehavior().name()).to.eq('safari');
      expect(new DefaultBrowserBehavior().isSupported()).to.be.true;
      expect(new DefaultBrowserBehavior().screenShareUnsupported()).to.be.true;
      expect(new DefaultBrowserBehavior().requiresVideoElementWorkaround()).to.be.true;
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(13);
      expect(new DefaultBrowserBehavior().requiresBundlePolicy()).to.eq('max-bundle');
      expect(new DefaultBrowserBehavior().getDisplayMediaAudioCaptureSupport()).to.be.false;
      expect(new DefaultBrowserBehavior().requiresNoExactMediaStreamConstraints()).to.be.false;
      expect(new DefaultBrowserBehavior().requiresUnifiedPlan()).to.be.true;
      expect(new DefaultBrowserBehavior().requiresUnifiedPlanMunging()).to.be.true;
      expect(new DefaultBrowserBehavior().supportsSenderSideBandwidthEstimation()).to.be.true;
    });

    it('can detect iOS Chrome', () => {
      setUserAgent(ELECTRON_WINDOWS_USER_AGENT);
      expect(new DefaultBrowserBehavior().name()).to.not.eq('crios');

      setUserAgent(CHROME_IOS_USER_AGENT);
      expect(new DefaultBrowserBehavior().name()).to.eq('crios');
      expect(new DefaultBrowserBehavior().isSupported()).to.be.true;
      expect(new DefaultBrowserBehavior().requiresVideoElementWorkaround()).to.be.false;
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(88);
      expect(new DefaultBrowserBehavior().requiresBundlePolicy()).to.eq('max-bundle');
      expect(new DefaultBrowserBehavior().getDisplayMediaAudioCaptureSupport()).to.be.false;
      expect(new DefaultBrowserBehavior().requiresNoExactMediaStreamConstraints()).to.be.false;
      expect(new DefaultBrowserBehavior().requiresUnifiedPlan()).to.be.true;
      expect(new DefaultBrowserBehavior().requiresUnifiedPlanMunging()).to.be.true;
      expect(new DefaultBrowserBehavior().supportsSenderSideBandwidthEstimation()).to.be.false;
    });

    it('can detect iOS Firefox', () => {
      setUserAgent(FIREFOX_IOS_USER_AGENT);
      expect(new DefaultBrowserBehavior().name()).to.eq('fxios');
      expect(new DefaultBrowserBehavior().isSupported()).to.be.true;
      expect(new DefaultBrowserBehavior().requiresVideoElementWorkaround()).to.be.false;
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(29);
      expect(new DefaultBrowserBehavior().requiresBundlePolicy()).to.eq('max-bundle');
      expect(new DefaultBrowserBehavior().getDisplayMediaAudioCaptureSupport()).to.be.false;
      expect(new DefaultBrowserBehavior().requiresNoExactMediaStreamConstraints()).to.be.false;
      expect(new DefaultBrowserBehavior().requiresUnifiedPlan()).to.be.true;
      expect(new DefaultBrowserBehavior().requiresUnifiedPlanMunging()).to.be.true;
      expect(new DefaultBrowserBehavior().supportsSenderSideBandwidthEstimation()).to.be.false;
    });

    it('can detect iOS WKWebView', () => {
      setUserAgent(WKWEBVIEW_IOS_USER_AGENT);
      expect(new DefaultBrowserBehavior().name()).to.eq('ios-webview');
      expect(new DefaultBrowserBehavior().isSupported()).to.be.true;
      expect(new DefaultBrowserBehavior().requiresVideoElementWorkaround()).to.be.false;
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(605);
      expect(new DefaultBrowserBehavior().requiresBundlePolicy()).to.eq('max-bundle');
      expect(new DefaultBrowserBehavior().getDisplayMediaAudioCaptureSupport()).to.be.false;
      expect(new DefaultBrowserBehavior().requiresNoExactMediaStreamConstraints()).to.be.false;
      expect(new DefaultBrowserBehavior().requiresUnifiedPlan()).to.be.true;
      expect(new DefaultBrowserBehavior().requiresUnifiedPlanMunging()).to.be.true;
      expect(new DefaultBrowserBehavior().supportsSenderSideBandwidthEstimation()).to.be.false;
    });

    it('can test Safari version 12', () => {
      domMockBehavior = new DOMMockBehavior();
      domMockBehavior.isUnifiedPlanSupported = false;
      domMockBehavior.browserName = 'safari12';
      mockBuilder = new DOMMockBuilder(domMockBehavior);
      expect(new DefaultBrowserBehavior().name()).to.eq('safari');
      expect(new DefaultBrowserBehavior().isSupported()).to.be.true;
      expect(new DefaultBrowserBehavior().screenShareUnsupported()).to.be.true;
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(12);
      expect(new DefaultBrowserBehavior().requiresBundlePolicy()).to.eq('max-bundle');
      expect(new DefaultBrowserBehavior().requiresNoExactMediaStreamConstraints()).to.be.false;
      expect(new DefaultBrowserBehavior().requiresUnifiedPlan()).to.be.false;
      expect(new DefaultBrowserBehavior().requiresUnifiedPlanMunging()).to.be.false;
    });

    it('can test Safari version 11', () => {
      domMockBehavior = new DOMMockBehavior();
      domMockBehavior.isUnifiedPlanSupported = false;
      domMockBehavior.browserName = 'safari11';
      mockBuilder = new DOMMockBuilder(domMockBehavior);
      expect(new DefaultBrowserBehavior().name()).to.eq('safari');
      expect(new DefaultBrowserBehavior().isSupported()).to.be.false;
      expect(new DefaultBrowserBehavior().screenShareUnsupported()).to.be.true;
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(11);
      expect(new DefaultBrowserBehavior().requiresBundlePolicy()).to.eq('max-bundle');
      expect(new DefaultBrowserBehavior().requiresNoExactMediaStreamConstraints()).to.be.false;
      expect(new DefaultBrowserBehavior().requiresUnifiedPlan()).to.be.false;
      expect(new DefaultBrowserBehavior().requiresUnifiedPlanMunging()).to.be.false;
    });

    it('can test iOS Safari version 12.0', () => {
      domMockBehavior = new DOMMockBehavior();
      domMockBehavior.isUnifiedPlanSupported = false;
      domMockBehavior.browserName = 'ios12.0';
      mockBuilder = new DOMMockBuilder(domMockBehavior);
      expect(new DefaultBrowserBehavior().name()).to.eq('ios');
      expect(new DefaultBrowserBehavior().isSupported()).to.be.true;
      expect(new DefaultBrowserBehavior().screenShareUnsupported()).to.be.true;
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(12);
      expect(new DefaultBrowserBehavior().requiresBundlePolicy()).to.eq('max-bundle');
      expect(new DefaultBrowserBehavior().requiresNoExactMediaStreamConstraints()).to.be.true;
      expect(new DefaultBrowserBehavior().requiresUnifiedPlan()).to.be.false;
      expect(new DefaultBrowserBehavior().requiresUnifiedPlanMunging()).to.be.false;
    });

    it('can test iOS Safari version 12.1', () => {
      domMockBehavior = new DOMMockBehavior();
      domMockBehavior.isUnifiedPlanSupported = false;
      domMockBehavior.browserName = 'ios12.1';
      mockBuilder = new DOMMockBuilder(domMockBehavior);
      expect(new DefaultBrowserBehavior().name()).to.eq('ios');
      expect(new DefaultBrowserBehavior().isSupported()).to.be.true;
      expect(new DefaultBrowserBehavior().screenShareUnsupported()).to.be.true;
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(12);
      expect(new DefaultBrowserBehavior().requiresBundlePolicy()).to.eq('max-bundle');
      expect(new DefaultBrowserBehavior().requiresNoExactMediaStreamConstraints()).to.be.true;
      expect(new DefaultBrowserBehavior().requiresUnifiedPlan()).to.be.false;
      expect(new DefaultBrowserBehavior().requiresUnifiedPlanMunging()).to.be.false;
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

  describe('requiresSimulcastMunging', () => {
    it('can determine if simulcast requires munging', () => {
      setUserAgent(CHROME_WINDOWS_USER_AGENT);
      expect(new DefaultBrowserBehavior().requiresSimulcastMunging()).to.be.false;
      setUserAgent(SAFARI_USER_AGENT);
      expect(new DefaultBrowserBehavior().requiresSimulcastMunging()).to.be.true;
    });
  });

  describe('supportsCanvasCapturedStreamPlayback', () => {
    it('can determine if video processing is supported', () => {
      expect(new DefaultBrowserBehavior().supportsCanvasCapturedStreamPlayback()).to.be.true;
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

  describe('requiresContextRecreationForAudioWorklet', () => {
    const dbb = (): DefaultBrowserBehavior =>
      new DefaultBrowserBehavior({ recreateAudioContextIfNeeded: true });

    it('detects working browsers', () => {
      setHasGlobalChrome(true);
      setUserAgent(CHROME_IOS_USER_AGENT);
      expect(dbb().requiresContextRecreationForAudioWorklet()).to.be.false;

      // It's a Windows UA.
      setUserAgent(CHROMIUM_EDGE_WINDOWS_USER_AGENT);
      expect(dbb().requiresContextRecreationForAudioWorklet()).to.be.false;

      // Again, Windows.
      setUserAgent(ELECTRON_WINDOWS_USER_AGENT);
      expect(dbb().requiresContextRecreationForAudioWorklet()).to.be.false;

      setUserAgent(CHROME_WINDOWS_USER_AGENT);
      expect(dbb().requiresContextRecreationForAudioWorklet()).to.be.false;

      setHasGlobalChrome(false);

      setUserAgent(FIREFOX_ANDROID_USER_AGENT);
      expect(dbb().requiresContextRecreationForAudioWorklet()).to.be.false;

      setUserAgent(FIREFOX_WINDOWS_USER_AGENT);
      expect(dbb().requiresContextRecreationForAudioWorklet()).to.be.false;

      setUserAgent(FIREFOX_MAC_USER_AGENT);
      expect(dbb().requiresContextRecreationForAudioWorklet()).to.be.false;
    });

    it('detects broken browsers', () => {
      setHasGlobalChrome(true);
      setUserAgent(ELECTRON_MAC_USER_AGENT);
      expect(dbb().requiresContextRecreationForAudioWorklet()).to.be.true;

      setUserAgent(CHROMIUM_EDGE_MAC_USER_AGENT);
      expect(dbb().requiresContextRecreationForAudioWorklet()).to.be.true;

      setUserAgent(CHROME_MAC_USER_AGENT);
      expect(dbb().requiresContextRecreationForAudioWorklet()).to.be.true;
    });
  });
});
