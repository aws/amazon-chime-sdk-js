// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// Use "ua-parser-js" over "detect-browser" to get more detailed information.
import { UAParser } from 'ua-parser-js';

import Logger from '../logger/Logger';
import Versioning from '../versioning/Versioning';
import UserAgentParser from './UserAgentParser';

/**
 * [[DefaultUserAgentParser]] uses UAParser to parse the browser's user agent.
 * It is responsible to hold and provide browser, OS and device specific information.
 */
export default class DefaultUserAgentParser implements UserAgentParser {
  private static readonly UNAVAILABLE = 'Unavailable';
  private parserResult: UAParser.IResult;
  private browserName: string;
  private browserVersion: string;
  private deviceName: string;
  private browserMajorVersion: string;

  constructor(logger: Logger) {
    try {
      this.parserResult =
        navigator && navigator.userAgent
          ? new UAParser(navigator.userAgent).getResult()
          : undefined;
    } catch (error) {
      /* istanbul ignore next */
      logger.error(error.message);
    }

    this.browserMajorVersion =
      this.parserResult?.browser?.version?.split('.')[0] || DefaultUserAgentParser.UNAVAILABLE;
    this.browserName = this.parserResult?.browser.name || DefaultUserAgentParser.UNAVAILABLE;
    this.browserVersion = this.parserResult?.browser.version || DefaultUserAgentParser.UNAVAILABLE;
    this.deviceName =
      [this.parserResult?.device.vendor || '', this.parserResult?.device.model || '']
        .join(' ')
        .trim() || DefaultUserAgentParser.UNAVAILABLE;
  }

  getParserResult(): { [key: string]: string } {
    return {
      browserMajorVersion: this.browserMajorVersion,
      browserName: this.browserName,
      browserVersion: this.browserVersion,
      deviceName: this.deviceName,
      osName: this.parserResult?.os.name || DefaultUserAgentParser.UNAVAILABLE,
      osVersion: this.parserResult?.os.version || DefaultUserAgentParser.UNAVAILABLE,
      sdkVersion: Versioning.sdkVersion,
      sdkName: Versioning.sdkName,
    };
  }
}
