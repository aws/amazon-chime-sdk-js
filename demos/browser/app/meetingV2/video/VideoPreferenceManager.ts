// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  AudioVideoObserver,
  Logger,
  TargetDisplaySize,
  VideoPreference,
  VideoPreferences,
  VideoPriorityBasedPolicy,
  VideoSource
} from 'amazon-chime-sdk-js';

export default class VideoPreferenceManager implements AudioVideoObserver {
  static readonly DefaultVideoTilePriority: number = 5;
  static readonly DefaultVideoTileTargetDisplaySize: TargetDisplaySize = TargetDisplaySize.High;

  attendeeIdToVideoPreference = new Map<string, VideoPreference>();
  priorityBasedDownlinkPolicy: VideoPriorityBasedPolicy | null = null;

  constructor(private logger: Logger, private downlinkPolicy: VideoPriorityBasedPolicy) {}

  remoteVideoSourcesDidChange(videoSources: VideoSource[]): void {
    this.logger.info(`Available remote video sources changed: ${JSON.stringify(videoSources)}`);
    for (const source of videoSources) {
        if (!this.attendeeIdToVideoPreference.has(source.attendee.attendeeId)) {
          this.attendeeIdToVideoPreference.set(
            source.attendee.attendeeId, 
            new VideoPreference(source.attendee.attendeeId, VideoPreferenceManager.DefaultVideoTilePriority, VideoPreferenceManager.DefaultVideoTileTargetDisplaySize))
        }
    }
    this.updateDownlinkPreference();
  }

  setAttendeeTargetDisplaySize(attendeeId: string, targetDisplaySize: TargetDisplaySize) {
    if (this.attendeeIdToVideoPreference.has(attendeeId)) {
      this.attendeeIdToVideoPreference.get(attendeeId).targetSize = targetDisplaySize;
    } else {
      this.attendeeIdToVideoPreference.set(attendeeId, new VideoPreference(attendeeId, VideoPreferenceManager.DefaultVideoTilePriority, targetDisplaySize));
    }
    this.updateDownlinkPreference();
  }

  setAttendeePriority(attendeeId: string, priority: number) {
    if (this.attendeeIdToVideoPreference.has(attendeeId)) {
      this.attendeeIdToVideoPreference.get(attendeeId).priority = priority
    } else {
      this.attendeeIdToVideoPreference.set(attendeeId, new VideoPreference(attendeeId, priority, VideoPreferenceManager.DefaultVideoTileTargetDisplaySize));
    }
    this.updateDownlinkPreference();
  }

  private updateDownlinkPreference(): void {
    if (this.attendeeIdToVideoPreference.size === 0) {
      // Preserve default behavior if no preferences have been set yet
      this.logger.info('No video preferences set yet, not updating');
      return;
    }

    const videoPreferences = VideoPreferences.prepare();
    for (const preference of this.attendeeIdToVideoPreference.values()) {
      videoPreferences.add(preference);
    }
    this.downlinkPolicy.chooseRemoteVideoSources(videoPreferences.build());
  }
}