// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { BrowserBehavior } from '..';

/**
 * This interface contains methods on {@link DefaultBrowserBehavior} that were
 * incorrectly omitted from {@link BrowserBehavior}, plus new methods that
 * were added since the last major version.
 *
 * Members of this interface can change without a major version bump to accommodate new browser
 * bugs and capabilities. If you extend this type, you might need to rework your code for new minor
 * versions of this library.
 */
export default interface ExtendedBrowserBehavior extends BrowserBehavior {
  requiresResolutionAlignment(width: number, height: number): [number, number];
  requiresGroupIdMediaStreamConstraints(): boolean;
  isSimulcastSupported(): boolean;
  supportsBackgroundFilter(): boolean;
  disableResolutionScaleDown(): boolean;
  requiresDisablingH264Encoding(): boolean;
  /**
   * Returns whether the browser will emit the metric 'availableIncomingBandwidth' or similar.
   *
   * This was previously meant to be used to avoid using a downlink policy dependent on that metric which may have unintended consequences,
   * however with server side network adaptation this is no longer relevant. This function is deprecated and may be removed in a later
   * release.
   *
   * @deprecated Please set `VideoPriorityBasedPolicyConfig.serverSideNetworkAdaption` to `ServerSideNetworkAdaption.BandwidthProbingAndRemoteVideoQualityAdaption`
   */
  supportDownlinkBandwidthEstimation(): boolean;
  supportsVideoLayersAllocationRtpHeaderExtension(): boolean;
  supportsDependencyDescriptorRtpHeaderExtension(): boolean;
  supportsScalableVideoCoding(): boolean;
  supportsAudioRedundancy(): boolean;
  disable480pResolutionScaleDown(): boolean;
  /**
   * Returns whether the browser requires the "playback" latency hint for Web Audio.
   */
  requiresPlaybackLatencyHintForAudioContext(): boolean;
}
