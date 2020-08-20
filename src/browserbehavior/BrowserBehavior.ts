// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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
   * Returns whether the browser has a Chromium WebRTC implementation
   */
  hasChromiumWebRTC(): boolean;

  /**
   * Returns whether the browser has a Firefox WebRTC implementation
   */
  hasFirefoxWebRTC(): boolean;

  /**
   * Returns whether screen share implementation can only send keyframes
   */
  screenShareSendsOnlyKeyframes(): boolean;

  /**
   * Returns whether the browser requires the use of Unified Plan implementation
   */
  requiresUnifiedPlan(): boolean;

  /**
   * Returns whether the browser requires an ICE connection gathering timeout workaround
   */
  requiresIceCandidateGatheringTimeoutWorkaround(): boolean;

  /**
   * Returns whether the browser requires munging of Unified Plan SDP
   */
  requiresUnifiedPlanMunging(): boolean;

  /**
   * Returns whether the browser requires munging to activate simulcast
   */
  requiresSimulcastMunging(): boolean;

  /**
   * Returns the bundle policy for the browser
   */
  requiresBundlePolicy(): RTCBundlePolicy;

  /**
   * Returns whether the browser uses a promise-based WebRTC getStats API
   */
  requiresPromiseBasedWebRTCGetStats(): boolean;

  /**
   * Returns whether it is needed to check connection attributes in SDP
   */
  requiresCheckForSdpConnectionAttributes(): boolean;

  /**
   * Returns whether it is needed to sort video section codec preference
   */
  requiresSortCodecPreferencesForSdpAnswer(): boolean;

  /**
   * Returns whether the keyword "exact" should be omitted in a MediaStreamConstraints object
   */
  requiresNoExactMediaStreamConstraints(): boolean;

  /**
   * Returns whether screen share is unsupported by the browser
   */
  screenShareUnsupported(): boolean;

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
}
