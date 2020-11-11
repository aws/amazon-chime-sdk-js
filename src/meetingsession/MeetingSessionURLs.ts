// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[MeetingSessionURLs]] contains the URLs that will be used to reach the
 * meeting service.
 */
export default class MeetingSessionURLs {
  /**
   * The audio host URL of the session
   */
  private _audioHostURL: string | null = null;

  /**
   * The screen data URL of the session
   */
  private _screenDataURL: string | null = null;

  /**
   * The screen sharing URL of the session
   */
  private _screenSharingURL: string | null = null;

  /**
   * The screen viewing URL of the session
   */
  private _screenViewingURL: string | null = null;

  /**
   * The signaling URL of the session
   */
  private _signalingURL: string | null = null;

  /**
   * The TURN control URL of the session
   */
  private _turnControlURL: string | null = null;

  /**
   * Gets the audio host URL after applying the urlRewriter function.
   */
  get audioHostURL(): string | null {
    return this.urlRewriter(this._audioHostURL);
  }

  /**
   * Sets the raw audio host URL.
   */
  set audioHostURL(value: string | null) {
    this._audioHostURL = value;
  }

  /**
   * Gets the screen data URL after applying the urlRewriter function.
   */
  get screenDataURL(): string | null {
    return this.urlRewriter(this._screenDataURL);
  }

  /**
   * Sets the raw screen data URL.
   */
  set screenDataURL(value: string | null) {
    this._screenDataURL = value;
  }

  /**
   * Gets the screen sharing URL after applying the urlRewriter function.
   */
  get screenSharingURL(): string | null {
    return this.urlRewriter(this._screenSharingURL);
  }

  /**
   * Sets the raw screen sharing URL.
   */
  set screenSharingURL(value: string | null) {
    this._screenSharingURL = value;
  }

  /**
   * Gets the screen viewing URL after applying the urlRewriter function.
   */
  get screenViewingURL(): string | null {
    return this.urlRewriter(this._screenViewingURL);
  }

  /**
   * Sets the raw screen viewing URL.
   */
  set screenViewingURL(value: string | null) {
    this._screenViewingURL = value;
  }

  /**
   * Gets the signaling URL after applying the urlRewriter function.
   */
  get signalingURL(): string | null {
    return this.urlRewriter(this._signalingURL);
  }

  /**
   * Sets the raw signaling URL.
   */
  set signalingURL(value: string | null) {
    this._signalingURL = value;
  }

  /**
   * Gets the TURN control URL after applying the urlRewriter function.
   */
  get turnControlURL(): string | null {
    return this.urlRewriter(this._turnControlURL);
  }

  /**
   * Sets the raw TURN control URL.
   */
  set turnControlURL(value: string | null) {
    this._turnControlURL = value;
  }

  /**
   * Function to transform URLs. Use this to rewrite URLs to traverse proxies.
   * The default implementation returns the original URL unchanged.
   */
  urlRewriter: (url: string | null) => string | null = (url: string | null) => {
    return url;
  };
}
