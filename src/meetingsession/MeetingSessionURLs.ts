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
   * Gets or sets the audio host URL with gets reflecting the result of the {@link MeetingSessionURLs.urlRewriter} function.
   */
  get audioHostURL(): string | null {
    return this.urlRewriter(this._audioHostURL);
  }

  set audioHostURL(value: string | null) {
    this._audioHostURL = value;
  }

  /**
   * Gets or sets the screen data URL with gets reflecting the result of the {@link MeetingSessionURLs.urlRewriter} function.
   */
  get screenDataURL(): string | null {
    return this.urlRewriter(this._screenDataURL);
  }

  set screenDataURL(value: string | null) {
    this._screenDataURL = value;
  }

  /**
   * Gets or sets the screen sharing URL with gets reflecting the result of the {@link MeetingSessionURLs.urlRewriter} function.
   */
  get screenSharingURL(): string | null {
    return this.urlRewriter(this._screenSharingURL);
  }

  set screenSharingURL(value: string | null) {
    this._screenSharingURL = value;
  }

  /**
   * Gets or sets the screen viewing URL with gets reflecting the result of the {@link MeetingSessionURLs.urlRewriter} function.
   */
  get screenViewingURL(): string | null {
    return this.urlRewriter(this._screenViewingURL);
  }

  set screenViewingURL(value: string | null) {
    this._screenViewingURL = value;
  }

  /**
   * Gets or sets the signaling URL with gets reflecting the result of the {@link MeetingSessionURLs.urlRewriter} function.
   */
  get signalingURL(): string | null {
    return this.urlRewriter(this._signalingURL);
  }

  set signalingURL(value: string | null) {
    this._signalingURL = value;
  }

  /**
   * Gets or sets the TURN control URL with gets reflecting the result of the {@link MeetingSessionURLs.urlRewriter} function.
   */
  get turnControlURL(): string | null {
    return this.urlRewriter(this._turnControlURL);
  }

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
