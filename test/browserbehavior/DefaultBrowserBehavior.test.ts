// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import DefaultBrowserBehavior from '../../src/browserbehavior/DefaultBrowserBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultBrowserBehavior', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  const CHROME_USERAGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3865.75 Safari/537.36';
  const FIREFOX_USERAGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:68.0) Gecko/20100101 Firefox/68.0';
  const SAFARI_USERAGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.2 Safari/605.1.15';
  const SAFARI12_USERAGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Safari/605.1.15';
  const SAFARI11_USERAGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.0 Safari/605.1.15';
  const CHROMIUM_EDGE_USERAGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3729.48 Safari/537.36 Edg/79.1.96.24';
  const OPERA_USERAGENT = 'Opera/9.80 (Windows NT 6.1; WOW64) Presto/2.12.388 Version/12.18';

  const setUserAgent = (userAgent: string): void => {
    // @ts-ignore
    navigator.userAgent = userAgent;
  };

  let mockBuilder: DOMMockBuilder | null = null;

  beforeEach(() => {
    mockBuilder = new DOMMockBuilder();
  });

  afterEach(() => {
    mockBuilder.cleanup();
  });

  describe('platforms', () => {
    it('can detect Firefox', () => {
      setUserAgent(FIREFOX_USERAGENT);
      expect(new DefaultBrowserBehavior().name()).to.eq('firefox');
      expect(new DefaultBrowserBehavior().isSupported()).to.eq(true);
      expect(new DefaultBrowserBehavior().screenShareUnsupported()).to.eq(false);
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(68);
      expect(new DefaultBrowserBehavior().requiresBundlePolicy()).to.eq('max-bundle');
      expect(new DefaultBrowserBehavior().requiresUnifiedPlan()).to.eq(true);
      expect(new DefaultBrowserBehavior().requiresUnifiedPlanMunging()).to.eq(false);
      expect(new DefaultBrowserBehavior().getDisplayMediaAudioCaptureSupport()).to.be.false;
    });

    it('can detect Chrome', () => {
      setUserAgent(CHROME_USERAGENT);
      expect(new DefaultBrowserBehavior().name()).to.eq('chrome');
      expect(new DefaultBrowserBehavior().isSupported()).to.eq(true);
      expect(new DefaultBrowserBehavior().screenShareUnsupported()).to.eq(false);
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(78);
      expect(new DefaultBrowserBehavior().requiresBundlePolicy()).to.eq('max-bundle');
      expect(new DefaultBrowserBehavior().getDisplayMediaAudioCaptureSupport()).to.be.true;
      const enableUnifiedPlan = true;
      expect(
        new DefaultBrowserBehavior({
          enableUnifiedPlanForChromiumBasedBrowsers: enableUnifiedPlan,
        }).requiresUnifiedPlan()
      ).to.eq(true);
      expect(
        new DefaultBrowserBehavior({
          enableUnifiedPlanForChromiumBasedBrowsers: enableUnifiedPlan,
        }).requiresUnifiedPlanMunging()
      ).to.eq(true);
      expect(
        new DefaultBrowserBehavior({
          enableUnifiedPlanForChromiumBasedBrowsers: !enableUnifiedPlan,
        }).requiresUnifiedPlan()
      ).to.eq(false);
      expect(
        new DefaultBrowserBehavior({
          enableUnifiedPlanForChromiumBasedBrowsers: !enableUnifiedPlan,
        }).requiresUnifiedPlanMunging()
      ).to.eq(false);
    });

    it('can detect Edge Chromium', () => {
      setUserAgent(CHROMIUM_EDGE_USERAGENT);
      expect(new DefaultBrowserBehavior().name()).to.eq('edge-chromium');
      expect(new DefaultBrowserBehavior().isSupported()).to.eq(true);
      expect(new DefaultBrowserBehavior().screenShareUnsupported()).to.eq(false);
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(79);
      expect(new DefaultBrowserBehavior().requiresBundlePolicy()).to.eq('max-bundle');
      expect(new DefaultBrowserBehavior().getDisplayMediaAudioCaptureSupport()).to.be.true;
      const enableUnifiedPlan = true;
      expect(
        new DefaultBrowserBehavior({
          enableUnifiedPlanForChromiumBasedBrowsers: enableUnifiedPlan,
        }).requiresUnifiedPlan()
      ).to.eq(true);
      expect(
        new DefaultBrowserBehavior({
          enableUnifiedPlanForChromiumBasedBrowsers: enableUnifiedPlan,
        }).requiresUnifiedPlanMunging()
      ).to.eq(true);
      expect(
        new DefaultBrowserBehavior({
          enableUnifiedPlanForChromiumBasedBrowsers: !enableUnifiedPlan,
        }).requiresUnifiedPlan()
      ).to.eq(false);
      expect(
        new DefaultBrowserBehavior({
          enableUnifiedPlanForChromiumBasedBrowsers: !enableUnifiedPlan,
        }).requiresUnifiedPlanMunging()
      ).to.eq(false);
    });

    it('can detect Safari', () => {
      setUserAgent(SAFARI_USERAGENT);
      expect(new DefaultBrowserBehavior().name()).to.eq('safari');
      expect(new DefaultBrowserBehavior().isSupported()).to.eq(true);
      expect(new DefaultBrowserBehavior().screenShareUnsupported()).to.eq(true);
      expect(new DefaultBrowserBehavior().requiresVideoElementWorkaround()).to.be.true;
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(13);
      expect(new DefaultBrowserBehavior().requiresBundlePolicy()).to.eq('max-bundle');
      expect(new DefaultBrowserBehavior().getDisplayMediaAudioCaptureSupport()).to.be.false;
      const enableUnifiedPlan = true;
      expect(
        new DefaultBrowserBehavior({
          enableUnifiedPlanForChromiumBasedBrowsers: enableUnifiedPlan,
        }).requiresUnifiedPlan()
      ).to.eq(true);
      expect(
        new DefaultBrowserBehavior({
          enableUnifiedPlanForChromiumBasedBrowsers: enableUnifiedPlan,
        }).requiresUnifiedPlanMunging()
      ).to.eq(true);
      expect(
        new DefaultBrowserBehavior({
          enableUnifiedPlanForChromiumBasedBrowsers: !enableUnifiedPlan,
        }).requiresUnifiedPlan()
      ).to.eq(true);
      expect(
        new DefaultBrowserBehavior({
          enableUnifiedPlanForChromiumBasedBrowsers: !enableUnifiedPlan,
        }).requiresUnifiedPlanMunging()
      ).to.eq(true);

      setUserAgent(SAFARI12_USERAGENT);
      expect(new DefaultBrowserBehavior().name()).to.eq('safari');
      expect(new DefaultBrowserBehavior().isSupported()).to.eq(true);
      expect(new DefaultBrowserBehavior().screenShareUnsupported()).to.eq(true);
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(12);
      expect(new DefaultBrowserBehavior().requiresBundlePolicy()).to.eq('max-bundle');

      setUserAgent(SAFARI11_USERAGENT);
      expect(new DefaultBrowserBehavior().name()).to.eq('safari');
      expect(new DefaultBrowserBehavior().isSupported()).to.eq(false);
      expect(new DefaultBrowserBehavior().screenShareUnsupported()).to.eq(true);
      expect(new DefaultBrowserBehavior().majorVersion()).to.eq(11);
      expect(new DefaultBrowserBehavior().requiresBundlePolicy()).to.eq('max-bundle');
    });

    it('can handle an unknown user agent', () => {
      setUserAgent(OPERA_USERAGENT);
      expect(new DefaultBrowserBehavior().isSupported()).to.eq(false);
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
    it('can determine if simulcast requires munging', async () => {
      setUserAgent(CHROME_USERAGENT);
      expect(new DefaultBrowserBehavior().requiresSimulcastMunging()).to.eq(false);
      setUserAgent(SAFARI_USERAGENT);
      expect(new DefaultBrowserBehavior().requiresSimulcastMunging()).to.eq(true);
    });
  });
});
