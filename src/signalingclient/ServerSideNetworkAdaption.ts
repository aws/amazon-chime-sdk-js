// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { SdkServerSideNetworkAdaption } from '../signalingprotocol/SignalingProtocol';

/**
 * [[ServerSideNetworkAdaption]] represents additional server side features that can be enabled for network adaption.
 */
export enum ServerSideNetworkAdaption {
  /**
   * This value will currently be overwritten to `BandwidthProbingAndRemoteVideoQualityAdaption`
   */
  Default,

  /**
   * @deprecated: Please switch to 'BandwidthProbingAndRemoteVideoQualityAdaption'
   */
  None,

  /**
   * @deprecated: Please switch to 'BandwidthProbingAndRemoteVideoQualityAdaption'.
   */
  BandwidthProbing,

  /**
   * Disable internal policy behavior and proxy priorities to server to automatically
   * switch, pause, or resume streams based on server calculated network constraints. This will
   * significantly improve response times when network constraints occur. This will also support the
   * features covered in `BandwidthProbing` though possibly with different implementation details.
   *
   * End users should overall see reduced video freezes, reduced broken audio, and reduced packet loss.
   * The value impacts response to network events and may lead to remote video pauses/downgrades
   * that did not occur before.
   */
  BandwidthProbingAndRemoteVideoQualityAdaption,
}

export default ServerSideNetworkAdaption;

export function serverSideNetworkAdaptionIsNoneOrDefault(
  adaption: ServerSideNetworkAdaption
): boolean {
  return (
    adaption === ServerSideNetworkAdaption.None || adaption === ServerSideNetworkAdaption.Default
  );
}

export function convertServerSideNetworkAdaptionEnumFromSignaled(
  adaption: SdkServerSideNetworkAdaption
): ServerSideNetworkAdaption {
  switch (adaption) {
    case SdkServerSideNetworkAdaption.DEFAULT:
      return ServerSideNetworkAdaption.Default;
    case SdkServerSideNetworkAdaption.NONE:
      return ServerSideNetworkAdaption.None;
    case SdkServerSideNetworkAdaption.BANDWIDTH_PROBING:
      return ServerSideNetworkAdaption.BandwidthProbing;
    case SdkServerSideNetworkAdaption.BANDWIDTH_PROBING_AND_VIDEO_QUALITY_ADAPTION:
      return ServerSideNetworkAdaption.BandwidthProbingAndRemoteVideoQualityAdaption;
  }
}

export function convertServerSideNetworkAdaptionEnumToSignaled(
  adaption: ServerSideNetworkAdaption
): SdkServerSideNetworkAdaption {
  switch (adaption) {
    case ServerSideNetworkAdaption.Default:
      return SdkServerSideNetworkAdaption.DEFAULT;
    case ServerSideNetworkAdaption.None:
      return SdkServerSideNetworkAdaption.NONE;
    case ServerSideNetworkAdaption.BandwidthProbing:
      return SdkServerSideNetworkAdaption.BANDWIDTH_PROBING;
    case ServerSideNetworkAdaption.BandwidthProbingAndRemoteVideoQualityAdaption:
      return SdkServerSideNetworkAdaption.BANDWIDTH_PROBING_AND_VIDEO_QUALITY_ADAPTION;
  }
}
