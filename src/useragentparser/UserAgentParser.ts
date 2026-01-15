// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Constant for unavailable values in parser results.
 */
export const USER_AGENT_PARSER_UNAVAILABLE = 'Unavailable';

/**
 * [[UserAgentParser]] is responsible to parse the browser's user agent
 * and provide the parsed result.
 */
export default interface UserAgentParser {
  /**
   * Provides resultant data after parsing browser user agent.
   */
  getParserResult(): { [key: string]: string };

  /**
   * Updates internal values using the
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/NavigatorUAData/getHighEntropyValues | User-Agent Client Hints API}.
   * If the API is not available, resolves without making changes.
   *
   * @param alwaysOverride If true, always override internal values even if already set.
   *   Examples of value changes:
   *   - osName: "Mac OS" → "macOS"
   *   - osVersion: "10.15" → "10.15.7"
   *   - browserName: "Chrome" → "Google Chrome"
   *   - browserVersion: "120" → "120.0.6099.129"
   * @returns Promise that resolves when update is complete
   */
  updateWithHighEntropyValues?(alwaysOverride: boolean): Promise<void>;
}
