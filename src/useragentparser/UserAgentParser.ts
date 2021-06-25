// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[UserAgentParser]] is responsible to parse the browser's user agent
 * and provide the parsed result.
 */
export default interface UserAgentParser {
  /**
   * Provides resultant data after parsing browser user agent.
   */
  getParserResult(): { [key: string]: string };
}
