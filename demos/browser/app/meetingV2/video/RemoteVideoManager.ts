// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  AllHighestVideoBandwidthPolicy,
  Attendee,
  Logger,
  TargetDisplaySize,
  VideoPreference,
  VideoPreferences,
  VideoPriorityBasedPolicy,
  VideoQualityAdaptationPreference,
  VideoSource,
} from 'amazon-chime-sdk-js';

export default class RemoteVideoManager {
  static readonly DefaultVideoTilePriority: number = 5;

  private attendeeIdToVideoPreference = new Map<string, VideoPreference>();

  _visibleAttendees = new Array<string>();
  set visibleAttendees(value: Array<string>) {
    this._visibleAttendees = value;
    this.updateDownlinkPreference();
  }

  constructor(
    private logger: Logger,
    private downlinkPolicy: VideoPriorityBasedPolicy | AllHighestVideoBandwidthPolicy
  ) {
    if (this.downlinkPolicy instanceof AllHighestVideoBandwidthPolicy) {
      this.downlinkPolicy.chooseRemoteVideoSources([]);
    }
  }

  ensureDefaultPreferences(videoSources: VideoSource[]): void {
    this.logger.info(`Available remote video sources changed: ${JSON.stringify(videoSources)}`);
    for (const source of videoSources) {
      this.preferenceFor(source.attendee.attendeeId);
    }
  }

  setAttendeeTargetDisplaySize(attendeeId: string, targetDisplaySize: TargetDisplaySize): void {
    this.preferenceFor(attendeeId).targetSize = targetDisplaySize;
    this.updateDownlinkPreference();
  }

  setAttendeePriority(attendeeId: string, priority: number): void {
    this.preferenceFor(attendeeId).priority = priority;
    this.updateDownlinkPreference();
  }

  setAttendeeDegradationPreference(
    attendeeId: string,
    preference: VideoQualityAdaptationPreference
  ): void {
    this.preferenceFor(attendeeId).degradationPreference = preference;
    this.updateDownlinkPreference();
  }

  /** New preferences take the SDK defaults: Maximum target size, Balanced degradation. */
  private preferenceFor(attendeeId: string): VideoPreference {
    let preference = this.attendeeIdToVideoPreference.get(attendeeId);
    if (!preference) {
      preference = new VideoPreference(attendeeId, RemoteVideoManager.DefaultVideoTilePriority);
      this.attendeeIdToVideoPreference.set(attendeeId, preference);
    }
    return preference;
  }

  supportsRemoteVideoPreferences(): boolean {
    return this.downlinkPolicy instanceof VideoPriorityBasedPolicy;
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
    } else if (this.downlinkPolicy?.chooseRemoteVideoSources) {
      // Just convert this list to  the simpler 'VideoSource' class used by all highest policy
      const videoSources: VideoSource[] = [];
      for (const attendeeId of this.attendeeIdToVideoPreference.keys()) {
        if (!this._visibleAttendees.includes(attendeeId)) {
          continue;
        }

        const videoSource = new VideoSource();
        const attendee = new Attendee();
        attendee.attendeeId = attendeeId;
        videoSource.attendee = attendee;
        videoSources.push(videoSource);
      }
      this.downlinkPolicy.chooseRemoteVideoSources(videoSources);
    }
  }
}
