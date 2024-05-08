// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ServerSideNetworkAdaption from '../signalingclient/ServerSideNetworkAdaption';

/** @internal */
const enum NetworkEvent {
  Stable,
  Decrease,
  Increase,
}

/**
 * [[VideoPriorityBasedPolicyConfig]] contains the network issue response delay and network issue recovery delay.
 */
export default class VideoPriorityBasedPolicyConfig {
  private static readonly MINIMUM_DELAY_MS = 2000;
  private static readonly MAXIMUM_DELAY_MS = 8000;

  static readonly Default = new VideoPriorityBasedPolicyConfig(0, 0);
  static readonly UnstableNetworkPreset = new VideoPriorityBasedPolicyConfig(0, 1);
  static readonly StableNetworkPreset = new VideoPriorityBasedPolicyConfig(1, 0);

  private currentNetworkEvent: NetworkEvent = NetworkEvent.Stable;
  private bandwidthDecreaseTimestamp: number = 0; // the last time bandwidth decreases
  private referenceBitrate: number = 0;

  /**
   * Additional server side features to be enabled for network adaption. The only currently
   * recommended value is `ServerSideNetworkAdaption.BandwidthProbingAndRemoteVideoQualityAdaption`
   */
  serverSideNetworkAdaption =
    ServerSideNetworkAdaption.BandwidthProbingAndRemoteVideoQualityAdaption;

  /** Initializes a [[VideoPriorityBasedPolicyConfig]] with the network event delays.
   *
   * @deprecated These values are not used when server side network adaptation is used, which will
   * become the default in the future. Therefore these constructors
   * will be deprecated and removed in a later releases.
   *
   * @param networkIssueResponseDelayFactor Delays before reducing subscribed video bitrate. Input should be a value between 0 and 1.
   * @param networkIssueRecoveryDelayFactor Delays before starting to increase bitrates after a network event and
   * delays between increasing video bitrates on each individual stream. Input should be a value between 0 and 1.
   */
  constructor(
    public networkIssueResponseDelayFactor: number = 0,
    public networkIssueRecoveryDelayFactor: number = 0
  ) {
    if (networkIssueResponseDelayFactor < 0) {
      networkIssueResponseDelayFactor = 0;
    } else if (networkIssueResponseDelayFactor > 1) {
      networkIssueResponseDelayFactor = 1;
    }
    this.networkIssueResponseDelayFactor = networkIssueResponseDelayFactor;

    if (networkIssueRecoveryDelayFactor < 0) {
      networkIssueRecoveryDelayFactor = 0;
    } else if (networkIssueRecoveryDelayFactor > 1) {
      networkIssueRecoveryDelayFactor = 1;
    }
    this.networkIssueRecoveryDelayFactor = networkIssueRecoveryDelayFactor;
  }

  // determine if subscribe is allowed based on network issue/recovery delays
  allowSubscribe(numberOfParticipants: number, currentEstimated: number): boolean {
    let timeBeforeAllowSubscribeMs = 0;
    const previousNetworkEvent = this.currentNetworkEvent;

    if (currentEstimated > this.referenceBitrate) {
      // if bw increases
      this.currentNetworkEvent = NetworkEvent.Increase;
      this.referenceBitrate = currentEstimated;
      return true;
    } else if (currentEstimated < this.referenceBitrate) {
      // if bw decreases, we use response delay
      this.currentNetworkEvent = NetworkEvent.Decrease;
      timeBeforeAllowSubscribeMs = this.getSubscribeDelay(
        this.currentNetworkEvent,
        numberOfParticipants
      );

      if (previousNetworkEvent !== NetworkEvent.Decrease) {
        this.bandwidthDecreaseTimestamp = Date.now();
      } else if (Date.now() - this.bandwidthDecreaseTimestamp > timeBeforeAllowSubscribeMs) {
        this.referenceBitrate = currentEstimated;
        return true;
      }
      return false;
    } else {
      this.currentNetworkEvent = NetworkEvent.Stable;
      return false;
    }
  }

  // convert network event delay factor to actual delay in ms
  private getSubscribeDelay(event: NetworkEvent, numberOfParticipants: number): number {
    // left and right boundary of the delay
    let subscribeDelay = VideoPriorityBasedPolicyConfig.MINIMUM_DELAY_MS;
    const range =
      VideoPriorityBasedPolicyConfig.MAXIMUM_DELAY_MS -
      VideoPriorityBasedPolicyConfig.MINIMUM_DELAY_MS;

    const responseFactor = this.networkIssueResponseDelayFactor;

    switch (event) {
      case NetworkEvent.Decrease:
        // we include number of participants here since bigger size of the meeting will generate higher bitrate
        subscribeDelay += range * responseFactor * (1 + numberOfParticipants / 10);
        subscribeDelay = Math.min(VideoPriorityBasedPolicyConfig.MAXIMUM_DELAY_MS, subscribeDelay);
        break;
    }

    return subscribeDelay;
  }
}
