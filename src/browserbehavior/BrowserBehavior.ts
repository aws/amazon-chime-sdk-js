// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default interface BrowserBehavior {
  /**
   * Returns the version string of the detected browser
   */
  version(): string;
  /**
   * Returns true if detected browser is Safari
   */
  isSafari(): boolean;

  /**
   * Returns true if detected browser is Chrome
   */
  isChrome(): boolean;

  /**
   * Returns true if detected browser is Firefox
   */
  isFirefox(): boolean;

  /**
   * Returns true if detected browser requires the use of Unified Plan implementation
   */
  requiresUnifiedPlan(): boolean;

  /**
   * Returns true if detected browser requires ice connection gathering bypass on completion
   */
  requiresIceCandidateCompletionBypass(): boolean;

  /**
   * Returns true if detected browser requires ice connection gathering timeout workaround
   */
  requiresIceCandidateGatheringTimeoutWorkaround(): boolean;

  /**
   * Returns true if detected browser requires munging of unified plan sdp
   */
  requiresUnifiedPlanMunging(): boolean;

  /**
   * returns true if detected browser requires promise-based WebRTC getStats API
   */
  requiresPromiseBasedWebRTCGetStats(): boolean;
}
