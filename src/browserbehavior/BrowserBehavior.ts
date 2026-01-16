// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default interface BrowserBehavior {
  /**
   * Returns the version string of the detected browser
   */
  version(): string;

  /**
   * Returns the major version of the detected browser
   */
  majorVersion(): number;

  /**
   * Returns the browser name
   */
  name(): string;

  /**
   * Returns the device name/model. Returns empty string if not available.
   */
  deviceName?(): string;

  /**
   * Returns the operating system name. Returns empty string if not available.
   */
  osName?(): string;

  /**
   * Returns the operating system version. Returns empty string if not available.
   */
  osVersion?(): string;

  /**
   * Returns whether the browser has a Chromium WebRTC implementation
   */
  hasChromiumWebRTC(): boolean;

  /**
   * Returns whether the browser has a Firefox WebRTC implementation
   */
  hasFirefoxWebRTC(): boolean;

  /**
   * Returns whether the browser requires an ICE connection gathering timeout workaround
   */
  requiresIceCandidateGatheringTimeoutWorkaround(): boolean;

  /**
   * Returns the bundle policy for the browser
   */
  requiresBundlePolicy(): RTCBundlePolicy;

  /**
   * Returns whether it is needed to check connection attributes in SDP
   */
  requiresCheckForSdpConnectionAttributes(): boolean;

  /**
   * Returns whether the keyword "exact" should be omitted in a MediaStreamConstraints object
   */
  requiresNoExactMediaStreamConstraints(): boolean;

  /**
   * Returns whether the browser is supported
   */
  isSupported(): boolean;

  /**
   * Returns the browser support string
   */
  supportString(): string;

  /**
   * Returns the supported codecs
   */
  supportedVideoCodecs(): Promise<string[]>;

  /**
   * Returns whether browser supports setSinkId operation
   */
  supportsSetSinkId(): boolean;

  /**
   * Returns whether browser supports the playback of canvas-captured stream.
   */
  supportsCanvasCapturedStreamPlayback(): boolean;

  /**
   * Updates internal values using the
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/NavigatorUAData/getHighEntropyValues | User-Agent Client Hints API}.
   * If the API is not available, resolves without making changes.
   *
   * @param alwaysOverride indicates if the values should be updated even if they were already set.
   *   Examples of value changes:
   *   - osName: "Mac OS" → "macOS"
   *   - osVersion: "10.15" → "15.7.1"
   *   - browserName: "Chrome" → "Google Chrome"
   *   - browserVersion: "120.0.0.0" → "120.0.6099.129"
   * @returns Promise that resolves when update is complete
   */
  updateWithHighEntropyValues?(alwaysOverride: true): Promise<void>;
}
