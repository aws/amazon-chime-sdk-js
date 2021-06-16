// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0 

/**
 * [[VideoPriorityBasedPolicyConfig]] represents the minimum time interval to subscribe.
 */
export default class VideoPriorityBasedPolicyConfig {
  // presets
  static readonly Default = new VideoPriorityBasedPolicyConfig(0, 0);
  static readonly UnstableNetworkPreset = new VideoPriorityBasedPolicyConfig(0, 1);
  static readonly StableNetworkPreset = new VideoPriorityBasedPolicyConfig(1, 0);

  /** Initializes a [[PriorityBasedPolicyConfig]] with the adaption speed.
   *
   * @param networkIssueResponseDelayFactor Delays before reducing subscribed video bitrate 
   * @param networkIssueRecoveryDelayFactor Delays before starting to increase bitrates after a network event and 
   * delays between increasing video bitrates on each individual stream
   */
  constructor(public networkIssueResponseDelayFactor: number = 0,
    public networkIssueRecoveryDelayFactor: number = 0) {
      this.setNetworkIssueResponseDelayFactor(networkIssueResponseDelayFactor);
      this.setNetworkIssueRecoveryDelayFactor(networkIssueRecoveryDelayFactor);
  }

  private LEFT_BOUNDARY_MS = 2000;
  private RIGHT_BOUNDARY_MS = 8000;

  setNetworkIssueResponseDelayFactor(networkIssueResponseDelayFactor: number): void {
    // boundary check to keep factor within 0-1 range
    if (networkIssueResponseDelayFactor < 0) {
      networkIssueResponseDelayFactor = 0;
    } else if (networkIssueResponseDelayFactor > 1) {
      networkIssueResponseDelayFactor = 1;
    }
    this.networkIssueResponseDelayFactor = networkIssueResponseDelayFactor;
  }

  setNetworkIssueRecoveryDelayFactor(networkIssueRecoveryDelayFactor: number): void {
    if (networkIssueRecoveryDelayFactor < 0) {
      networkIssueRecoveryDelayFactor = 0;
    } else if (networkIssueRecoveryDelayFactor > 1) {
      networkIssueRecoveryDelayFactor = 1;
    }
    this.networkIssueRecoveryDelayFactor = networkIssueRecoveryDelayFactor;

  }

  getNetworkIssueResponseDelay(): number {
    return this.LEFT_BOUNDARY_MS + (this.RIGHT_BOUNDARY_MS - this.LEFT_BOUNDARY_MS) * this.networkIssueResponseDelayFactor;
  }

  getNetworkIssueRecoveryDelay(): number {
    return this.LEFT_BOUNDARY_MS + (this.RIGHT_BOUNDARY_MS - this.LEFT_BOUNDARY_MS) * this.networkIssueRecoveryDelayFactor;
  }
}
