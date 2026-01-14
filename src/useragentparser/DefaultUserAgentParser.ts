// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// Use "ua-parser-js" over "detect-browser" to get more detailed information.
import { UAParser } from 'ua-parser-js';

import Logger from '../logger/Logger';
import Versioning from '../versioning/Versioning';
import UserAgentParser, { USER_AGENT_PARSER_UNAVAILABLE } from './UserAgentParser';

/**
 * [[DefaultUserAgentParser]] uses UAParser to parse the browser's user agent.
 * It is responsible to hold and provide browser, OS and device specific information.
 */
export default class DefaultUserAgentParser implements UserAgentParser {
  private parserResult: UAParser.IResult;
  private browserName: string;
  private browserVersion: string;
  private deviceName: string;
  private browserMajorVersion: string;
  private osName: string;
  private osVersion: string;
  private engineName: string;
  private engineMajorVersion: number;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
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
      this.parserResult?.browser?.version?.split('.')[0] || USER_AGENT_PARSER_UNAVAILABLE;
    this.browserName = this.parserResult?.browser.name || USER_AGENT_PARSER_UNAVAILABLE;
    this.browserVersion = this.parserResult?.browser.version || USER_AGENT_PARSER_UNAVAILABLE;
    this.deviceName =
      [this.parserResult?.device.vendor || '', this.parserResult?.device.model || '']
        .join(' ')
        .trim() || USER_AGENT_PARSER_UNAVAILABLE;
    this.osName = this.parserResult?.os.name || USER_AGENT_PARSER_UNAVAILABLE;
    this.osVersion = this.parserResult?.os.version || USER_AGENT_PARSER_UNAVAILABLE;
    this.engineName = this.parserResult?.engine?.name || '';
    this.engineMajorVersion = parseInt(this.parserResult?.engine?.version?.split('.')[0] || '0');
  }

  getParserResult(): { [key: string]: string } {
    return {
      browserMajorVersion: this.browserMajorVersion,
      browserName: this.browserName,
      browserVersion: this.browserVersion,
      deviceName: this.deviceName,
      osName: this.osName,
      osVersion: this.osVersion,
      sdkVersion: Versioning.sdkVersion,
      sdkName: Versioning.sdkName,
      engineName: this.engineName,
      engineMajorVersion: String(this.engineMajorVersion),
    };
  }

  /**
   * Returns the browser engine name (e.g., "Blink", "Gecko", "WebKit").
   */
  getEngineName(): string {
    return this.engineName;
  }

  /**
   * Returns the browser engine major version.
   */
  getEngineMajorVersion(): number {
    return this.engineMajorVersion;
  }

  /**
   * Updates internal values using the User-Agent Client Hints API.
   * If the API is not available, resolves without making changes.
   * @param alwaysOverride - If true, overrides osName, deviceName, and browserName even if already set
   * @returns Promise that resolves when update is complete
   */
  async updateWithHighEntropyValues(alwaysOverride: boolean = false): Promise<void> {
    /* istanbul ignore next */
    // @ts-ignore - navigator.userAgentData is not yet in TypeScript's lib.dom.d.ts
    if (!navigator?.userAgentData?.getHighEntropyValues) {
      this.logger?.debug('User-Agent Client Hints API not available');
      return;
    }

    try {
      // @ts-ignore - navigator.userAgentData is not yet in TypeScript's lib.dom.d.ts
      const hints = await navigator.userAgentData.getHighEntropyValues([
        'fullVersionList',
        'model',
        'platform',
        'platformVersion',
      ]);

      const shouldUpdate = (field: string): boolean =>
        alwaysOverride || field === USER_AGENT_PARSER_UNAVAILABLE;

      if (hints.platform && shouldUpdate(this.osName)) {
        this.osName = hints.platform;
      }

      if (hints.platformVersion && shouldUpdate(this.osVersion)) {
        this.osVersion = hints.platformVersion;
      }

      if (hints.model !== undefined && shouldUpdate(this.deviceName)) {
        this.deviceName = hints.model || USER_AGENT_PARSER_UNAVAILABLE;
      }

      if (hints.fullVersionList?.length) {
        const browser = this.selectPrimaryBrowser(hints.fullVersionList);
        if (browser) {
          if (shouldUpdate(this.browserName)) {
            this.browserName = browser.brand;
          }
          this.browserVersion = browser.version;
          this.browserMajorVersion = browser.version.split('.')[0];
        }
      }
    } catch (error) {
      this.logger?.error(`Failed to get high entropy values: ${error}`);
    }
  }

  /**
   * Selects the primary browser from a list of brand/version pairs.
   * Filters out placeholder brands (starting with "Not") and prefers
   * specific browser brands over generic "Chromium".
   */
  private selectPrimaryBrowser(
    brands: Array<{ brand: string; version: string }>
  ): { brand: string; version: string } | null {
    // Filter out placeholder brands (start with "Not")
    const validBrands = brands.filter(b => !b.brand.startsWith('Not'));

    // Prefer specific browsers over Chromium
    const preferredBrands = ['Google Chrome', 'Microsoft Edge', 'Opera', 'Brave', 'Vivaldi'];
    for (const preferred of preferredBrands) {
      const found = validBrands.find(b => b.brand === preferred);
      if (found) return found;
    }

    // Fall back to first non-Chromium brand, or Chromium if that's all we have
    return validBrands.find(b => b.brand !== 'Chromium') || validBrands[0] || null;
  }
}
