// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  Logger,
  TargetDisplaySize,
  VideoPreference,
  VideoPreferences,
  VideoQualityAdaptationPreference,
  VideoPriorityBasedPolicy,
  VideoSource,
  AllHighestVideoBandwidthPolicy,
  Attendee
} from 'amazon-chime-sdk-js';

export default class RemoteVideoManager {
  static readonly DefaultVideoTilePriority: number = 5;
  static readonly DefaultVideoTileTargetDisplaySize: TargetDisplaySize = TargetDisplaySize.Maximum;

  private attendeeIdToVideoPreference = new Map<string, VideoPreference>();

  _visibleAttendees = new Array<string>();
  public set visibleAttendees(value: Array<string>) {
      this._visibleAttendees = value;
      this.updateDownlinkPreference();
  }

  constructor(private logger: Logger, private downlinkPolicy: VideoPriorityBasedPolicy | AllHighestVideoBandwidthPolicy) {
    if (this.downlinkPolicy instanceof AllHighestVideoBandwidthPolicy) {
        this.downlinkPolicy.chooseRemoteVideoSources([]);
    }
  }

  ensureDefaultPreferences(videoSources: VideoSource[]): void {
    this.logger.info(`Available remote video sources changed: ${JSON.stringify(videoSources)}`);
    for (const source of videoSources) {
        if (!this.attendeeIdToVideoPreference.has(source.attendee.attendeeId)) {
          this.attendeeIdToVideoPreference.set(
            source.attendee.attendeeId, 
            new VideoPreference(source.attendee.attendeeId, RemoteVideoManager.DefaultVideoTilePriority, RemoteVideoManager.DefaultVideoTileTargetDisplaySize))
        }
    }
  }

  setAttendeeTargetDisplaySize(attendeeId: string, targetDisplaySize: TargetDisplaySize) {
    if (this.attendeeIdToVideoPreference.has(attendeeId)) {
      this.attendeeIdToVideoPreference.get(attendeeId).targetSize = targetDisplaySize;
    } else {
      this.attendeeIdToVideoPreference.set(attendeeId, new VideoPreference(attendeeId, RemoteVideoManager.DefaultVideoTilePriority, targetDisplaySize));
    }
    this.updateDownlinkPreference();
  }

  setAttendeePriority(attendeeId: string, priority: number) {
    if (this.attendeeIdToVideoPreference.has(attendeeId)) {
      this.attendeeIdToVideoPreference.get(attendeeId).priority = priority
    } else {
      this.attendeeIdToVideoPreference.set(attendeeId, new VideoPreference(attendeeId, priority, RemoteVideoManager.DefaultVideoTileTargetDisplaySize));
    }
    this.updateDownlinkPreference();
  }

  setAttendeeDegradationPreference(attendeeId: string, preference: VideoQualityAdaptationPreference) {
    if (this.attendeeIdToVideoPreference.has(attendeeId)) {
      this.attendeeIdToVideoPreference.get(attendeeId).degradationPreference = preference
    } else {
      this.attendeeIdToVideoPreference.set(attendeeId, new VideoPreference(
        attendeeId, RemoteVideoManager.DefaultVideoTilePriority, RemoteVideoManager.DefaultVideoTileTargetDisplaySize, preference));
    }
    this.updateDownlinkPreference();
  }

  supportsRemoteVideoPreferences(): boolean {
    return (this.downlinkPolicy instanceof VideoPriorityBasedPolicy);
  }

  private updateDownlinkPreference(): void {
    if (this.attendeeIdToVideoPreference.size === 0) {
      // Preserve default behavior if no preferences have been set yet
      this.logger.info('No video preferences set yet, not updating');
      return;
    }

    if (this.downlinkPolicy instanceof VideoPriorityBasedPolicy) {
        const videoPreferences = VideoPreferences.prepare();
        for (const [attendeeId, preference] of this.attendeeIdToVideoPreference.entries()) {
            if (this._visibleAttendees.includes(attendeeId)) {
                videoPreferences.add(preference);
            }
        }
        this.downlinkPolicy.chooseRemoteVideoSources(videoPreferences.build());
    } else {
        // Just convert this list to  the simpler 'VideoSource' class used by all highest policy
        let videoSources: VideoSource[] = [];
        for (const attendeeId of this.attendeeIdToVideoPreference.keys()) {
            if (!this._visibleAttendees.includes(attendeeId)) {
                continue;
            }

            let videoSource = new VideoSource();
            let attendee = new Attendee();
            attendee.attendeeId = attendeeId;
            videoSource.attendee = attendee;
            videoSources.push(videoSource);
        }
        this.downlinkPolicy.chooseRemoteVideoSources(videoSources);
    }
  }
}