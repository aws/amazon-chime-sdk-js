// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 *
 * [[ApplicationMetadata]] contains application metadata such as application name and version.
 * Amazon Chime SDK for JavaScript allows builders to provide application metadata in
 * the meeting session configuration. This field is optional. Amazon Chime uses application metadata to
 * analyze meeting health trends or identify common failures to improve your meeting experience.
 *
 * Do not pass any Personal Identifiable Information (PII).
 *
 * ```js
 * import { MeetingSessionConfiguration, ApplicationMetadata } from 'amazon-chime-sdk-js';
 *
 * const createMeetingResponse = // CreateMeeting API response.
 * const createAttendeeResponse = // CreateAttendee API response.
 * const meetingSessionConfiguration = new MeetingSessionConfiguration(
 *  createMeetingResponse,
 *  createAttendeeResponse
 * );
 *
 * meetingSessionConfiguration.applicationMetadata = ApplicationMetadata.create({
 *  appName: 'AppName',
 *  appVersion: '1.0.0'
 * });
 *
 * ```
 */
export default class ApplicationMetadata {
  private constructor(public readonly appName: string, public readonly appVersion: string) {}
  /**
   *
   * @param appName Builder's application name.
   * The app name must satisfy following regular expression:
   * `/^[a-zA-Z0-9]+[a-zA-Z0-9_-]*[a-zA-Z0-9]+$/g`
   *
   * @param appVersion Builder's application version.
   * The app version must follow the [Semantic Versioning](https://semver.org/) format.
   *
   * @returns [[ApplicationMetadata]]
   */
  static create(appName: string, appVersion: string): ApplicationMetadata {
    const APP_NAME_REGEX = /^[a-zA-Z0-9]+[a-zA-Z0-9_-]*[a-zA-Z0-9]+$/g;
    if (!appName || appName.length > 32) {
      throw new Error(`appName should be a valid string and 1 to 32 characters in length`);
    }
    if (!APP_NAME_REGEX.test(appName)) {
      throw new Error(`appName must satisfy ${APP_NAME_REGEX} regular expression`);
    }

    const APP_VERSION_REGEX = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/gm;
    if (!appVersion || appVersion.length > 32) {
      throw new Error(`appVersion should be a valid string and 1 to 32 characters in length`);
    }
    if (!APP_VERSION_REGEX.test(appVersion)) {
      throw new Error(`appVersion must satisfy Semantic Versioning format`);
    }
    return new ApplicationMetadata(appName, appVersion);
  }
}
