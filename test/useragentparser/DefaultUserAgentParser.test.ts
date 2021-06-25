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
  let logger: Logger;

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    logger = new NoOpLogger();
  });

  afterEach(() => {
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
      expect(data.deviceName).to.eq('Unavailable');
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
});
