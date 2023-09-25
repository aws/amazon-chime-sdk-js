// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoCodecCapability from '../sdp/VideoCodecCapability';

export default interface SupportedCodecPreferencesObserver {
  /**
   * Called when the intersection of the client's video codec send preferences
   * and the meeting's video codec receive preferences is updated.
   * @param meetingSupportedVideoSendCodecPreferences - The intersection;
   * undefined if the intersection is empty.
   * @param videoSendCodecPreferences - The original preferences to use as a
   * fallback when the intersection is empty.
   */
  supportedCodecsDidChange(
    meetingSupportedVideoSendCodecPreferences: VideoCodecCapability[] | undefined,
    videoSendCodecPreferences: VideoCodecCapability[]
  ): void;
}
