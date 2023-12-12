// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ClientMetricReport from '../clientmetricreport/ClientMetricReport';
import VideoSource from '../videosource/VideoSource';
import DefaultVideoStreamIdSet from '../videostreamidset/DefaultVideoStreamIdSet';
import VideoStreamIdSet from '../videostreamidset/VideoStreamIdSet';
import VideoStreamDescription from '../videostreamindex/VideoStreamDescription';
import VideoStreamIndex from '../videostreamindex/VideoStreamIndex';
import VideoDownlinkBandwidthPolicy from './VideoDownlinkBandwidthPolicy';

/**
 * [[AllHighestVideoBandwidthPolicy]] implements is a rudimentary policy that simply
 * always subscribes to the highest quality video stream available
 * for all non-self participants.
 */
export default class AllHighestVideoBandwidthPolicy implements VideoDownlinkBandwidthPolicy {
  private optimalReceiveSet: VideoStreamIdSet;
  private subscribedReceiveSet: VideoStreamIdSet;
  private videoSources: VideoSource[] | undefined;
  protected videoIndex: VideoStreamIndex;

  // Cap total receive bitrate at 15000 kbps to avoid hitting per client connection limits
  private static maxReceiveBitrateKbps = 15000;

  constructor(private selfAttendeeId: string) {
    this.reset();
  }

  reset(): void {
    this.optimalReceiveSet = new DefaultVideoStreamIdSet();
    this.subscribedReceiveSet = new DefaultVideoStreamIdSet();
    this.videoSources = undefined;
  }

  updateIndex(videoIndex: VideoStreamIndex): void {
    this.videoIndex = videoIndex;
    this.optimalReceiveSet = this.calculateOptimalReceiveSet(videoIndex);
  }

  updateMetrics(_clientMetricReport: ClientMetricReport): void {}

  wantsResubscribe(): boolean {
    return !this.subscribedReceiveSet.equal(this.optimalReceiveSet);
  }

  chooseSubscriptions(): VideoStreamIdSet {
    this.subscribedReceiveSet = this.optimalReceiveSet.clone();
    return this.subscribedReceiveSet.clone();
  }

  chooseRemoteVideoSources(videoSources: VideoSource[]): void {
    this.videoSources = videoSources;
    this.optimalReceiveSet = this.calculateOptimalReceiveSet(this.videoIndex).clone();
  }

  private calculateOptimalReceiveSet(videoIndex: VideoStreamIndex): VideoStreamIdSet {
    const streamSelectionSet = new DefaultVideoStreamIdSet();

    if (!this.videoIndex || this.videoIndex.allStreams().empty()) {
      return streamSelectionSet;
    }

    const receiveSet = videoIndex.highestQualityStreamFromEachGroupExcludingSelf(
      this.selfAttendeeId
    );

    // If video sources are not chosen, then use all of them.
    const videoSources = !!this.videoSources
      ? this.videoSources
      : this.videoIndex.allVideoSendingSourcesExcludingSelf(this.selfAttendeeId);

    // Get the list of all the remote stream information
    const remoteInfos = this.videoIndex.remoteStreamDescriptions();

    const mapOfAttendeeIdToRemoteDescriptions = new Map<string, VideoStreamDescription>();

    for (const info of remoteInfos) {
      if (receiveSet.contain(info.streamId)) {
        mapOfAttendeeIdToRemoteDescriptions.set(info.attendeeId, info);
      }
    }

    let totalBitrateKbps = 0;
    for (const videoSource of videoSources) {
      const attendeeId = videoSource.attendee.attendeeId;
      if (mapOfAttendeeIdToRemoteDescriptions.has(attendeeId)) {
        const info = mapOfAttendeeIdToRemoteDescriptions.get(attendeeId);
        if (totalBitrateKbps + info.maxBitrateKbps <= AllHighestVideoBandwidthPolicy.maxReceiveBitrateKbps) {
            streamSelectionSet.add(info.streamId);
          totalBitrateKbps += info.maxBitrateKbps;
        } else {
          console.warn(
            'total bitrate ' +
              (totalBitrateKbps + info.maxBitrateKbps) +
              ' exceeds maximum limit (15000). Use chooseRemoteVideoSources to select a subset of participants to avoid this.'
          );
          // We could continue to check more sources (some of them might still fall under the limit).
          // But we stop here to limit resubscribes if we're hovering near the cap.
          break;
        }
      }
    }

    return streamSelectionSet;
  }
}
