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
   * The signaling URL of the session
   */
  private _signalingURL: string | null = null;

  /**
   * The TURN control URL of the session
   */
  private _turnControlURL: string | null = null;

  /**
   * The event ingestion URL to send the meeting events.
   */
  private _eventIngestionURL: string | null = null;

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
   *
   * This URL is currently unused by the SDK and will be removed in a later release.
   */
  get turnControlURL(): string | null {
    return this.urlRewriter(this._turnControlURL);
  }

  /**
   * This URL is currently unused by the SDK and will be removed in a later release.
   */
  set turnControlURL(value: string | null) {
    this._turnControlURL = value;
  }

  /**
   * Gets or sets the events ingestion URL with gets reflecting the result of the {@link MeetingSessionURLs.urlRewriter} function.
   */
  get eventIngestionURL(): string | null {
    return this.urlRewriter(this._eventIngestionURL);
  }

  set eventIngestionURL(value: string | null) {
    this._eventIngestionURL = value;
  }

  /**
   * Function to transform URLs. Use this to rewrite URLs to traverse proxies.
   * The default implementation returns the original URL unchanged.
   */
  urlRewriter: (url: string | null) => string | null = (url: string | null) => {
    return url;
  };

  /**
   * Optional function to transform a single URL into multiple URLs. This is currently only used for TURN URI processing.
   *
   * There is not any good reason for a typical application to implement this.
   *
   * When set, this takes precedence over {@link MeetingSessionURLs.urlRewriter} for TURN URI processing.
   * The default is null, meaning {@link MeetingSessionURLs.urlRewriter} will be used instead.
   */
  urlRewriterMulti: ((url: string | null) => string[] | null) | null = null;
}
