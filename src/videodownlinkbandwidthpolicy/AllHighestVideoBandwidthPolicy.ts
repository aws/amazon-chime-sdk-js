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
  private areVideoSourcesChosen: boolean;
  private videoSources: VideoSource[];
  protected videoIndex: VideoStreamIndex;

  constructor(private selfAttendeeId: string) {
    this.reset();
  }

  reset(): void {
    this.optimalReceiveSet = new DefaultVideoStreamIdSet();
    this.subscribedReceiveSet = new DefaultVideoStreamIdSet();
    this.videoSources = [];
    this.areVideoSourcesChosen = false;
  }

  updateIndex(videoIndex: VideoStreamIndex): void {
    this.videoIndex = videoIndex;
    if (!this.areVideoSourcesChosen) {
      this.optimalReceiveSet = this.calculateOptimalReceiveSet(videoIndex);
    } else {
      this.chooseRemoteVideoSources(this.videoSources);
    }
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
    if (!this.videoIndex || this.videoIndex.allStreams().empty()) {
      return;
    }

    this.videoSources = videoSources;

    // Get the list of all the remote stream information
    const remoteInfos = this.videoIndex.remoteStreamDescriptions();

    // calculate the optimal set for the given index
    const receiveSet = this.calculateOptimalReceiveSet(this.videoIndex);

    const mapOfAttendeeIdToOptimalStreamId = new Map<string, number>();

    for (const info of remoteInfos) {
      if (receiveSet.contain(info.streamId)) {
        mapOfAttendeeIdToOptimalStreamId.set(info.attendeeId, info.streamId);
      }
    }

    const streamSelectionSet = new DefaultVideoStreamIdSet();
    for (const videoSource of videoSources) {
      const attendeeId = videoSource.attendee.attendeeId;
      if (mapOfAttendeeIdToOptimalStreamId.has(attendeeId)) {
        streamSelectionSet.add(mapOfAttendeeIdToOptimalStreamId.get(attendeeId));
      }
    }

    this.areVideoSourcesChosen = true;
    this.optimalReceiveSet = streamSelectionSet.clone();
  }

  private calculateOptimalReceiveSet(videoIndex: VideoStreamIndex): VideoStreamIdSet {
    return videoIndex.highestQualityStreamFromEachGroupExcludingSelf(this.selfAttendeeId);
  }
}
