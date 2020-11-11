// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import SDPCandidateType from './SDPCandidateType';

/**
 * [[SDP]] manages and helps munge an SDP during negotiation.
 */
export default interface SDP {
  /**
   * Clones an SDP
   */
  clone(): SDP;

  /**
   * Splits SDP string into lines
   */
  lines(): string[];

  /**
   * Checks whether the SDP has candidates for any m-line
   */
  hasCandidates(): boolean;

  /**
   * Checks whether the SDP has candidates for all m-lines
   */
  hasCandidatesForAllMLines(): boolean;

  /**
   * Replaces group attribute `a=group:` line with `a=group:BUNDLE audio video`
   */
  withBundleAudioVideo(): SDP;

  /**
   * Copies video sections from other SDP to this SDP
   */
  copyVideo(otherSDP: string): SDP;

  /**
   * Removes candidates of a given type from SDP
   */
  withoutCandidateType(candidateTypeToExclude: SDPCandidateType): SDP;

  /**
   * Removes server reflexive candidate from SDP
   */
  withoutServerReflexiveCandidates(): SDP;

  /**
   * Inserts a parameter to the SDP local offer setting the desired average audio bitrate
   */
  withAudioMaxAverageBitrate(maxAverageBitrate: number): SDP;

  /**
   * Inserts a bandwidth limitation attribute to answer SDP for setRemoteDescription and limiting client outbound maximum bitrate
   */
  withBandwidthRestriction(maxBitrateKbps: number, isUnifiedPlan: boolean): SDP;

  /**
   * Munges Unified-Plan SDP from different browsers to conform to one format
   */
  withUnifiedPlanFormat(): SDP;

  /**
   * Extracts the ssrc for the sendrecv video media section in SDP
   */
  ssrcForVideoSendingSection(): string;

  /**
   * Returns whether the sendrecv video sections if exist have two different SSRCs in SDPs
   */
  videoSendSectionHasDifferentSSRC(previousSdp: SDP): boolean;

  /**
   * Sorts the codec preferences in video section.
   */
  preferH264IfExists(): SDP;
}
