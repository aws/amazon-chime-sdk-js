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
   * Updates internal values using the User-Agent Client Hints API.
   * If the API is not available, resolves without making changes.
   *
   * @param alwaysOverride If true, always override internal values
   * @returns Promise that resolves when update is complete
   */
  updateWithHighEntropyValues?(alwaysOverride: boolean): Promise<void>;
}
