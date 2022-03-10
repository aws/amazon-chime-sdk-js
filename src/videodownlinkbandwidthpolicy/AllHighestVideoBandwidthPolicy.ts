// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ClientMetricReport from '../clientmetricreport/ClientMetricReport';
import VideoSource from '../videosource/VideoSource';
import DefaultVideoStreamIdSet from '../videostreamidset/DefaultVideoStreamIdSet';
import VideoStreamIdSet from '../videostreamidset/VideoStreamIdSet';
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

    // If video sources are not chosen, then return the default receive set.
    if (this.videoSources === undefined) {
      return receiveSet;
    }

    // Get the list of all the remote stream information
    const remoteInfos = this.videoIndex.remoteStreamDescriptions();

    const mapOfAttendeeIdToOptimalStreamId = new Map<string, number>();

    for (const info of remoteInfos) {
      if (receiveSet.contain(info.streamId)) {
        mapOfAttendeeIdToOptimalStreamId.set(info.attendeeId, info.streamId);
      }
    }

    for (const videoSource of this.videoSources) {
      const attendeeId = videoSource.attendee.attendeeId;
      if (mapOfAttendeeIdToOptimalStreamId.has(attendeeId)) {
        streamSelectionSet.add(mapOfAttendeeIdToOptimalStreamId.get(attendeeId));
      }
    }

    return streamSelectionSet;
  }
}
