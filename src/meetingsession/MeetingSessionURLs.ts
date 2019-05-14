// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[MeetingSessionURLs]] contains the URLs that will be used to reach the
 * meeting service.
 */
export default class MeetingSessionURLs {
  /**
   * The audio host URL of the session
   */
  audioHostURL: string;

  /**
   * The screen data URL of the session
   */
  screenDataURL: string;

  /**
   * The screen sharing URL of the session
   */
  screenSharingURL: string;

  /**
   * The screen viewing URL of the session
   */
  screenViewingURL: string;

  /**
   * The signaling URL of the session
   */
  signalingURL: string;

  /**
   * The TURN control URL of the session
   */
  turnControlURL: string;
}
