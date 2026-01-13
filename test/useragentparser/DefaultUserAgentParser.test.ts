// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import Logger from '../../src/logger/Logger';
import NoOpLogger from '../../src/logger/NoOpLogger';
import DefaultUserAgentParser from '../../src/useragentparser/DefaultUserAgentParser';
import UserAgentParser from '../../src/useragentparser/UserAgentParser';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultUserAgentParser', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  let domMockBuilder: DOMMockBuilder;
  let domMockBehavior: DOMMockBehavior;
  let userAgentParser: UserAgentParser;
  let userAgent: string = '';
  let logger: Logger;

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    // @ts-ignore
    userAgent = navigator.userAgent;
    logger = new NoOpLogger();
  });

  afterEach(() => {
    // Tests here modify userAgent directly so try to reset it back to avoid leaking to other tests
    // @ts-ignore
    navigator.userAgent = userAgent;
    // @ts-ignore
    delete navigator.userAgentData;
    domMockBuilder.cleanup();
  });

  describe('construction', () => {
    it('can create with the user agent', () => {
      userAgentParser = new DefaultUserAgentParser(logger);
      expect(userAgentParser).to.exist;
    });

    it('can create without the user agent', () => {
      // @ts-ignore
      delete navigator.userAgent;
      userAgentParser = new DefaultUserAgentParser(logger);
      expect(userAgentParser).to.exist;
    });

    it('can create with an empty string', () => {
      // @ts-ignore
      navigator.userAgent = '';
      userAgentParser = new DefaultUserAgentParser(logger);
      expect(userAgentParser).to.exist;
    });

    it('can create with an invalid version', () => {
      // @ts-ignore
      navigator.userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/invalid Safari/537.36';
      userAgentParser = new DefaultUserAgentParser(logger);
      expect(userAgentParser).to.exist;
    });
  });

  describe('getParserResult', () => {
    it('validate result', () => {
      // @ts-ignore
      navigator.userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3865.75 Safari/537.36';
      userAgentParser = new DefaultUserAgentParser(logger);
      const data = userAgentParser.getParserResult();
      expect(data.browserName).to.eq('Chrome');
      expect(data.browserMajorVersion).to.eq('78');
      expect(data.browserVersion).to.eq('78.0.3865.75');
      expect(data.deviceName).to.eq('Apple Macintosh');
      expect(data.osName).to.eq('Mac OS');
      expect(data.osVersion).to.eq('10.12.6');
      expect(data.sdkName).to.eq('amazon-chime-sdk-js');
    });

    it('result may have unavailable information if not found', () => {
      // @ts-ignore
      delete navigator.userAgent;
      userAgentParser = new DefaultUserAgentParser(logger);
      const data = userAgentParser.getParserResult();
      expect(data.deviceName).to.eq('Unavailable');
      expect(data.osName).to.eq('Unavailable');
      expect(data.osVersion).to.eq('Unavailable');
    });
  });

  describe('getEngineName', () => {
    it('returns engine name for Chrome', () => {
      // @ts-ignore
      navigator.userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3865.75 Safari/537.36';
      userAgentParser = new DefaultUserAgentParser(logger);
      expect((userAgentParser as DefaultUserAgentParser).getEngineName()).to.eq('Blink');
    });

    it('returns empty string when engine is not available', () => {
      // @ts-ignore
      delete navigator.userAgent;
      userAgentParser = new DefaultUserAgentParser(logger);
      expect((userAgentParser as DefaultUserAgentParser).getEngineName()).to.eq('');
    });
  });

  describe('getEngineMajorVersion', () => {
    it('returns engine major version for Chrome', () => {
      // @ts-ignore
      navigator.userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3865.75 Safari/537.36';
      userAgentParser = new DefaultUserAgentParser(logger);
      expect((userAgentParser as DefaultUserAgentParser).getEngineMajorVersion()).to.eq(78);
    });

    it('returns 0 when engine version is not available', () => {
      // @ts-ignore
      delete navigator.userAgent;
      userAgentParser = new DefaultUserAgentParser(logger);
      expect((userAgentParser as DefaultUserAgentParser).getEngineMajorVersion()).to.eq(0);
    });
  });

  describe('updateWithHighEntropyValues', () => {
    it('does nothing when userAgentData API is not available', async () => {
      userAgentParser = new DefaultUserAgentParser(logger);
      const dataBefore = userAgentParser.getParserResult();
      await (userAgentParser as DefaultUserAgentParser).updateWithHighEntropyValues();
      const dataAfter = userAgentParser.getParserResult();
      expect(dataAfter.browserName).to.eq(dataBefore.browserName);
    });

    it('does nothing when userAgentData API is not available and logger is null', async () => {
      // @ts-ignore - testing with null logger
      userAgentParser = new DefaultUserAgentParser(null);
      const dataBefore = userAgentParser.getParserResult();
      await (userAgentParser as DefaultUserAgentParser).updateWithHighEntropyValues();
      const dataAfter = userAgentParser.getParserResult();
      expect(dataAfter.browserName).to.eq(dataBefore.browserName);
    });

    it('updates values when userAgentData API returns all fields', async () => {
      // @ts-ignore
      navigator.userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3865.75 Safari/537.36';
      userAgentParser = new DefaultUserAgentParser(logger);

      // @ts-ignore
      navigator.userAgentData = {
        getHighEntropyValues: async () => ({
          platform: 'macOS',
          platformVersion: '14.0.0',
          model: 'MacBook Pro',
          fullVersionList: [
            { brand: 'Not_A Brand', version: '8.0.0.0' },
            { brand: 'Chromium', version: '120.0.6099.129' },
            { brand: 'Google Chrome', version: '120.0.6099.129' },
          ],
        }),
      };

      await (userAgentParser as DefaultUserAgentParser).updateWithHighEntropyValues();
      const data = userAgentParser.getParserResult();
      // osName, deviceName, and browserName are not updated if already set from ua-parser-js
      // osVersion is also not updated if already set (was 10.12.6 from ua-parser-js)
      expect(data.osName).to.eq('Mac OS');
      expect(data.osVersion).to.eq('10.12.6');
      expect(data.deviceName).to.eq('Apple Macintosh');
      expect(data.browserName).to.eq('Chrome');
      // browserVersion is always updated from high entropy values
      expect(data.browserVersion).to.eq('120.0.6099.129');
      expect(data.browserMajorVersion).to.eq('120');
    });

    it('updates values with Microsoft Edge as preferred browser', async () => {
      // @ts-ignore
      navigator.userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3865.75 Safari/537.36';
      userAgentParser = new DefaultUserAgentParser(logger);
      const dataBefore = userAgentParser.getParserResult();

      // @ts-ignore
      navigator.userAgentData = {
        getHighEntropyValues: async () => ({
          fullVersionList: [
            { brand: 'Not_A Brand', version: '8.0.0.0' },
            { brand: 'Chromium', version: '120.0.6099.129' },
            { brand: 'Microsoft Edge', version: '120.0.2210.91' },
          ],
        }),
      };

      await (userAgentParser as DefaultUserAgentParser).updateWithHighEntropyValues();
      const data = userAgentParser.getParserResult();
      // browserName is not updated if already set from ua-parser-js
      // but browserVersion is always updated from high entropy values
      expect(data.browserName).to.eq(dataBefore.browserName);
      expect(data.browserVersion).to.eq('120.0.2210.91');
    });

    it('falls back to Chromium when no preferred browser found', async () => {
      // @ts-ignore
      navigator.userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3865.75 Safari/537.36';
      userAgentParser = new DefaultUserAgentParser(logger);
      const dataBefore = userAgentParser.getParserResult();

      // @ts-ignore
      navigator.userAgentData = {
        getHighEntropyValues: async () => ({
          fullVersionList: [
            { brand: 'Not_A Brand', version: '8.0.0.0' },
            { brand: 'Chromium', version: '120.0.6099.129' },
          ],
        }),
      };

      await (userAgentParser as DefaultUserAgentParser).updateWithHighEntropyValues();
      const data = userAgentParser.getParserResult();
      // browserName is not updated if already set from ua-parser-js
      // but browserVersion is always updated from high entropy values
      expect(data.browserName).to.eq(dataBefore.browserName);
      expect(data.browserVersion).to.eq('120.0.6099.129');
    });

    it('handles empty fullVersionList', async () => {
      userAgentParser = new DefaultUserAgentParser(logger);
      const dataBefore = userAgentParser.getParserResult();

      // @ts-ignore
      navigator.userAgentData = {
        getHighEntropyValues: async () => ({
          fullVersionList: [] as Array<{ brand: string; version: string }>,
        }),
      };

      await (userAgentParser as DefaultUserAgentParser).updateWithHighEntropyValues();
      const dataAfter = userAgentParser.getParserResult();
      expect(dataAfter.browserName).to.eq(dataBefore.browserName);
    });

    it('handles partial response with only platform', async () => {
      userAgentParser = new DefaultUserAgentParser(logger);
      const dataBefore = userAgentParser.getParserResult();

      // @ts-ignore
      navigator.userAgentData = {
        getHighEntropyValues: async () => ({
          platform: 'Windows',
        }),
      };

      await (userAgentParser as DefaultUserAgentParser).updateWithHighEntropyValues();
      const data = userAgentParser.getParserResult();
      // osName is not updated if already set from ua-parser-js
      expect(data.osName).to.eq(dataBefore.osName);
    });

    it('sets deviceName to Unavailable when model is empty and deviceName was Unavailable', async () => {
      // @ts-ignore - delete userAgent to get Unavailable deviceName
      delete navigator.userAgent;
      userAgentParser = new DefaultUserAgentParser(logger);

      // @ts-ignore
      navigator.userAgentData = {
        getHighEntropyValues: async () => ({
          model: '',
        }),
      };

      await (userAgentParser as DefaultUserAgentParser).updateWithHighEntropyValues();
      const data = userAgentParser.getParserResult();
      expect(data.deviceName).to.eq('Unavailable');
    });

    it('updates osVersion when it was Unavailable', async () => {
      // @ts-ignore - delete userAgent to get Unavailable osVersion
      delete navigator.userAgent;
      userAgentParser = new DefaultUserAgentParser(logger);

      // @ts-ignore
      navigator.userAgentData = {
        getHighEntropyValues: async () => ({
          platformVersion: '15.0.0',
        }),
      };

      await (userAgentParser as DefaultUserAgentParser).updateWithHighEntropyValues();
      const data = userAgentParser.getParserResult();
      expect(data.osVersion).to.eq('15.0.0');
    });

    it('does not update osVersion when already set and alwaysOverride is false', async () => {
      // @ts-ignore
      navigator.userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3865.75 Safari/537.36';
      userAgentParser = new DefaultUserAgentParser(logger);

      // @ts-ignore
      navigator.userAgentData = {
        getHighEntropyValues: async () => ({
          platformVersion: '15.0.0',
        }),
      };

      await (userAgentParser as DefaultUserAgentParser).updateWithHighEntropyValues(false);
      const data = userAgentParser.getParserResult();
      expect(data.osVersion).to.eq('10.12.6');
    });

    it('handles API error gracefully', async () => {
      userAgentParser = new DefaultUserAgentParser(logger);
      const dataBefore = userAgentParser.getParserResult();

      // @ts-ignore
      navigator.userAgentData = {
        getHighEntropyValues: async () => {
          throw new Error('API error');
        },
      };

      await (userAgentParser as DefaultUserAgentParser).updateWithHighEntropyValues();
      const dataAfter = userAgentParser.getParserResult();
      expect(dataAfter.browserName).to.eq(dataBefore.browserName);
    });

    it('handles API error gracefully with null logger', async () => {
      // @ts-ignore - testing with null logger
      userAgentParser = new DefaultUserAgentParser(null);
      const dataBefore = userAgentParser.getParserResult();

      // @ts-ignore
      navigator.userAgentData = {
        getHighEntropyValues: async () => {
          throw new Error('API error');
        },
      };

      await (userAgentParser as DefaultUserAgentParser).updateWithHighEntropyValues();
      const dataAfter = userAgentParser.getParserResult();
      expect(dataAfter.browserName).to.eq(dataBefore.browserName);
    });

    it('selects non-Chromium browser when no preferred brand found', async () => {
      userAgentParser = new DefaultUserAgentParser(logger);
      const dataBefore = userAgentParser.getParserResult();

      // @ts-ignore
      navigator.userAgentData = {
        getHighEntropyValues: async () => ({
          fullVersionList: [
            { brand: 'Not_A Brand', version: '8.0.0.0' },
            { brand: 'Chromium', version: '120.0.6099.129' },
            { brand: 'SomeBrowser', version: '1.0.0' },
          ],
        }),
      };

      await (userAgentParser as DefaultUserAgentParser).updateWithHighEntropyValues();
      const data = userAgentParser.getParserResult();
      // browserName is not updated if already set from ua-parser-js
      expect(data.browserName).to.eq(dataBefore.browserName);
    });

    it('returns null when all brands are filtered out', async () => {
      userAgentParser = new DefaultUserAgentParser(logger);
      const dataBefore = userAgentParser.getParserResult();

      // @ts-ignore
      navigator.userAgentData = {
        getHighEntropyValues: async () => ({
          fullVersionList: [
            { brand: 'Not_A Brand', version: '8.0.0.0' },
            { brand: 'Not Another Brand', version: '99.0.0.0' },
          ] as Array<{ brand: string; version: string }>,
        }),
      };

      await (userAgentParser as DefaultUserAgentParser).updateWithHighEntropyValues();
      const dataAfter = userAgentParser.getParserResult();
      expect(dataAfter.browserName).to.eq(dataBefore.browserName);
    });

    it('overrides osName, deviceName, and browserName when alwaysOverride is true', async () => {
      // @ts-ignore
      navigator.userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3865.75 Safari/537.36';
      userAgentParser = new DefaultUserAgentParser(logger);

      // @ts-ignore
      navigator.userAgentData = {
        getHighEntropyValues: async () => ({
          platform: 'macOS',
          platformVersion: '14.0.0',
          model: 'MacBook Pro',
          fullVersionList: [
            { brand: 'Not_A Brand', version: '8.0.0.0' },
            { brand: 'Chromium', version: '120.0.6099.129' },
            { brand: 'Google Chrome', version: '120.0.6099.129' },
          ],
        }),
      };

      await (userAgentParser as DefaultUserAgentParser).updateWithHighEntropyValues(true);
      const data = userAgentParser.getParserResult();
      // With alwaysOverride=true, osName, deviceName, and browserName are updated
      expect(data.osName).to.eq('macOS');
      expect(data.osVersion).to.eq('14.0.0');
      expect(data.deviceName).to.eq('MacBook Pro');
      expect(data.browserName).to.eq('Google Chrome');
      expect(data.browserVersion).to.eq('120.0.6099.129');
      expect(data.browserMajorVersion).to.eq('120');
    });

    it('does not override osName, deviceName, and browserName when alwaysOverride is false', async () => {
      // @ts-ignore
      navigator.userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3865.75 Safari/537.36';
      userAgentParser = new DefaultUserAgentParser(logger);

      // @ts-ignore
      navigator.userAgentData = {
        getHighEntropyValues: async () => ({
          platform: 'macOS',
          platformVersion: '14.0.0',
          model: 'MacBook Pro',
          fullVersionList: [
            { brand: 'Not_A Brand', version: '8.0.0.0' },
            { brand: 'Chromium', version: '120.0.6099.129' },
            { brand: 'Google Chrome', version: '120.0.6099.129' },
          ],
        }),
      };

      await (userAgentParser as DefaultUserAgentParser).updateWithHighEntropyValues(false);
      const data = userAgentParser.getParserResult();
      // With alwaysOverride=false, osName, osVersion, deviceName, and browserName are NOT updated (already set)
      expect(data.osName).to.eq('Mac OS');
      expect(data.osVersion).to.eq('10.12.6');
      expect(data.deviceName).to.eq('Apple Macintosh');
      expect(data.browserName).to.eq('Chrome');
      // browserVersion is always updated
      expect(data.browserVersion).to.eq('120.0.6099.129');
      expect(data.browserMajorVersion).to.eq('120');
    });
  });
});
