// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ClientMetricReport from '../clientmetricreport/ClientMetricReport';
import ServerSideNetworkAdaption from '../signalingclient/ServerSideNetworkAdaption';
import VideoStreamIdSet from '../videostreamidset/VideoStreamIdSet';
import VideoStreamIndex from '../videostreamindex/VideoStreamIndex';
import VideoTileController from '../videotilecontroller/VideoTileController';
import VideoDownlinkObserver from './VideoDownlinkObserver';
import VideoPreferences from './VideoPreferences';

/**
 * [[VideoDownlinkBandwidthPolicy]] makes decisions about downlink
 * video bandwidth usage.
 */
export default interface VideoDownlinkBandwidthPolicy {
  /**
   * Reset back to initial state
   */
  reset(): void;

  /**
   * Potentially update the desired set of video streams to receive
   * based on the given [[VideoStreamIndex]].
   */
  updateIndex(videoIndex: VideoStreamIndex): void;

  /**
   * Update connection metrics
   */
  updateMetrics(clientMetricReport: ClientMetricReport): void;

  /**
   * Returns true if the policy has decided that a change to subscribed
   * set of video streams to receive would be beneficial.
   */
  wantsResubscribe(): boolean;

  /**
   * Updates the internal state with the set of streams we expect to be
   * subscribed to, and return the set. This value will be truncated
   * to the maximum subscription limit of the call.
   *
   * When a policy is passed into a meeting session, this will be called
   * once every second to check if the subscriptions have changed.
   */
  chooseSubscriptions(): VideoStreamIdSet;

  /**
   * (Optional) Add VideoDownlinkObserver to observer resubscribe requests
   */
  addObserver?(observer: VideoDownlinkObserver): void;

  /**
   * (Optional) Removes the VideoDownlinkObserver.
   */
  removeObserver?(observer: VideoDownlinkObserver): void;

  /**
   * (Optional) Call and observer function on all added `VideoDownlinkObserver`. Can be used to notify observers
   * of video tile pauses.
   */
  forEachObserver?(observerFunc: (observer: VideoDownlinkObserver) => void): void;

  /**
   * (Optional) Add observer that allows policy to immediately request an update based off current choices. Only
   * one observer can be set at a time.
   */
  setWantsResubscribeObserver?(observer: () => void): void;

  /**
   * (Optional) Bind the video tile controller to the policy to allow it to control the video tiles such as pause
   * and unpause.
   * The audio video controller should call this method to pass down a transceiver controller to the policy
   * when the meeting starts and set it to undefined when the meeting ends.
   * @param tileController the video tile controller
   */
  bindToTileController?(tileController: VideoTileController | undefined): void;

  /**
   * Additional server side features to be enabled for network adaption. Policy implementations
   * must abide by the restrictions in the returned `ServerSideNetworkAdaption` enum value.
   */
  getServerSideNetworkAdaption?(): ServerSideNetworkAdaption;

  /**
   * Dynamically switch any client behavior to the adaption type which this policy indicated support
   * to from `supportedServerSideNetworkAdaptions`.
   */
  setServerSideNetworkAdaption?(adaption: ServerSideNetworkAdaption): void;

  /**
   * Values which this policy supports being overriden to. The server may use this to transition
   * clients to different values of `ServerSideNetworkAdaption`. Override this function
   * to return an empty list to disable any server override attempts.
   */
  supportedServerSideNetworkAdaptions?(): ServerSideNetworkAdaption[];

  /**
   * Used in combination of `getServerSideNetworkAdaption` and `wantsResubscribe`
   * to indicate any added, updated, or removed video preferences.
   */
  getVideoPreferences?(): VideoPreferences;

  /**
   * Used to indicate that this policy can handle the increased complexity
   * required to deal with layers of different frame rates (i.e. balances
   * tradeoffs of resolution vs. frame rate, will not degrade resolution or
   * framerate during recovery, etc.)
   */
  wantsAllTemporalLayersInIndex?(): boolean;
}
