// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DefaultBrowserBehavior from '../browserbehavior/DefaultBrowserBehavior';
import VERSION from './version';

/**
 * The components of a SemVer version, separated so they can be used individually.
 */
export interface SemVer {
  /**
   * The major version.
   */
  major: string;

  /**
   * The minor version.
   */
  minor: string;

  /**
   * The patch version.
   */
  patch: string;

  /**
   * The pre release identifier
   */
  preRelease: string;
}

export default class Versioning {
  static X_AMZN_VERSION = 'X-Amzn-Version';
  static X_AMZN_USER_AGENT = 'X-Amzn-User-Agent';

  /**
   * Return string representation of SDK name
   */
  static get sdkName(): string {
    return 'amazon-chime-sdk-js';
  }

  /**
   * Return string representation of SDK version
   */
  static get sdkVersion(): string {
    return VERSION.semverString;
  }

  /**
   * Returns the parts of the semver, so major/minor/patch can be extracted individually.
   */
  static get sdkVersionSemVer(): SemVer {
    const v = VERSION.semverString.match(
      /^(?<major>[0-9]+)\.(?<minor>[0-9]+)((?:\.(?<patch>[0-9]+))(?:-(?<preRelease>[a-zA-Z]+(\.[0-9])*))?)?/
    );

    return {
      major: v?.groups?.major,
      minor: v?.groups?.minor,
      patch: v?.groups?.patch,
      preRelease: v?.groups?.preRelease,
    };
  }
  /**
   * Return the SHA-1 of the Git commit from which this build was created.
   */
  static get buildSHA(): string {
    // Skip the leading 'g'.
    return VERSION.hash.slice(1);
  }

  /**
   * Return low-resolution string representation of SDK user agent (e.g. `chrome-78`)
   */
  static get sdkUserAgentLowResolution(): string {
    const browserBehavior = new DefaultBrowserBehavior();
    return `${browserBehavior.name()}-${browserBehavior.majorVersion()}`;
  }

  /**
   * Return URL with versioning information appended
   */
  static urlWithVersion(url: string): string {
    const urlWithVersion = new URL(url);
    urlWithVersion.searchParams.append(Versioning.X_AMZN_VERSION, Versioning.sdkVersion);
    urlWithVersion.searchParams.append(
      Versioning.X_AMZN_USER_AGENT,
      Versioning.sdkUserAgentLowResolution
    );
    return urlWithVersion.toString();
  }
}
