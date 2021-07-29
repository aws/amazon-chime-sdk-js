// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ContentShareConstants from '../contentsharecontroller/ContentShareConstants';
import Logger from '../logger/Logger';
import VideoStreamDescription from '../videostreamindex/VideoStreamDescription';
import VideoStreamIndex from '../videostreamindex/VideoStreamIndex';
import VideoPreference from './VideoPreference';
import { VideoPreferences } from './VideoPreferences';
import VideoPriorityBasedPolicy from './VideoPriorityBasedPolicy';

export default class VideoAdaptiveProbePolicy extends VideoPriorityBasedPolicy {
  constructor(protected logger: Logger) {
    super(logger);
    super.shouldPauseTiles = false;
    this.videoPreferences = undefined;
  }

  reset(): void {
    super.reset();
    super.shouldPauseTiles = false;
    this.videoPreferences = undefined;
  }

  updateIndex(videoIndex: VideoStreamIndex): void {
    super.updateIndex(videoIndex);

    const newPreferences = VideoPreferences.prepare();
    let containsContent = false;
    const remoteInfos: VideoStreamDescription[] = videoIndex.remoteStreamDescriptions();
    // If there is active content then set that as high priority, and the rest at lower
    for (const info of remoteInfos) {
      // I don't know why we need to do this duplicate check.
      if (!newPreferences.some(preference => preference.attendeeId === info.attendeeId)) {
        // For now always subscribe to content even if higher bandwidth then target
        if (info.attendeeId.endsWith(ContentShareConstants.Modality)) {
          newPreferences.add(new VideoPreference(info.attendeeId, 1));
          containsContent = true;
        } else {
          newPreferences.add(new VideoPreference(info.attendeeId, 2));
        }
      }
    }

    if (containsContent) {
      this.videoPreferences = newPreferences.build();
      this.videoPreferencesUpdated = true;
    }
  }

  /**
   * [[VideoAdaptiveProbePolicy]] does not allow setting video preferences and this function
   * will be a no-op.  Please use [[VideoPriorityBasedPolicy]] directly if you would like to set
   * preferences.
   */
  chooseRemoteVideoSources(_preferences: VideoPreferences): void {
    this.logger.error('chooseRemoteVideoSources should not be called by VideoAdaptiveProbePolicy');
    return;
  }
}
