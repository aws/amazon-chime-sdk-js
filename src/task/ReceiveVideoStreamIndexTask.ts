// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import AudioVideoObserver from '../audiovideoobserver/AudioVideoObserver';
import MeetingSessionVideoAvailability from '../meetingsession/MeetingSessionVideoAvailability';
import DefaultModality from '../modality/DefaultModality';
import RemovableObserver from '../removableobserver/RemovableObserver';
import SignalingClientEvent from '../signalingclient/SignalingClientEvent';
import SignalingClientEventType from '../signalingclient/SignalingClientEventType';
import SignalingClientObserver from '../signalingclientobserver/SignalingClientObserver';
import {
  SdkIndexFrame,
  SdkSignalFrame,
  SdkStreamServiceType,
} from '../signalingprotocol/SignalingProtocol.js';
import { Maybe } from '../utils/Types';
import VideoDownlinkBandwidthPolicy from '../videodownlinkbandwidthpolicy/VideoDownlinkBandwidthPolicy';
import VideoSource from '../videosource/VideoSource';
import VideoStreamIdSet from '../videostreamidset/VideoStreamIdSet';
import VideoUplinkBandwidthPolicy from '../videouplinkbandwidthpolicy/VideoUplinkBandwidthPolicy';
import BaseTask from './BaseTask';

/*
 * [[ReceiveVideoStreamIndexTask]] receives [[SdkIndexFrame]] and updates [[VideoUplinkBandwidthPolicy]] and [[VideoDownlinkBandwidthPolicy]].
 */
export default class ReceiveVideoStreamIndexTask
  extends BaseTask
  implements SignalingClientObserver, RemovableObserver {
  protected taskName = 'ReceiveVideoStreamIndexTask';

  // See comment above invocation of `pauseIngestion` in `DefaultAudioVideoController`
  // for explanation.
  private isIngestionPaused: boolean = false;
  private pendingIndex: SdkIndexFrame | null = null;

  constructor(private context: AudioVideoControllerState) {
    super(context.logger);
  }

  removeObserver(): void {
    this.context.signalingClient.removeObserver(this);
  }

  async run(): Promise<void> {
    this.handleIndexFrame(this.context.indexFrame);
    this.context.signalingClient.registerObserver(this);
    this.context.removableObservers.push(this);
  }

  handleSignalingClientEvent(event: SignalingClientEvent): void {
    if (
      event.type !== SignalingClientEventType.ReceivedSignalFrame ||
      event.message.type !== SdkSignalFrame.Type.INDEX
    ) {
      return;
    }
    // @ts-ignore: force cast to SdkIndexFrame
    const indexFrame: SdkIndexFrame = event.message.index;
    this.context.logger.info(`received new index ${JSON.stringify(indexFrame)}`);
    this.handleIndexFrame(indexFrame);
  }

  pauseIngestion(): void {
    this.isIngestionPaused = true;
  }

  resumeIngestion(): void {
    if (!this.isIngestionPaused) {
      // Do not recheck subcribe if it wasn't paused to begin with.
      return;
    }
    this.isIngestionPaused = false;
    if (this.pendingIndex) {
      this.context.logger.info('Resuming index ingestion with pending index');
      this.handleIndexFrame(this.pendingIndex);
    }
  }

  private handleIndexFrame(indexFrame: SdkIndexFrame | null): void {
    if (!indexFrame) {
      return;
    }

    if (this.isIngestionPaused) {
      this.context.logger.info(`Index ingestion is paused, setting most recent index as pending`);
      this.pendingIndex = indexFrame;
      return;
    } else {
      this.pendingIndex = null;
    }

    // Filter out self content share video
    const selfAttendeeId = this.context.audioVideoController.configuration.credentials.attendeeId;
    indexFrame.sources = indexFrame.sources.filter(source => {
      const modality = new DefaultModality(source.attendeeId);
      return !(
        modality.base() === selfAttendeeId && modality.hasModality(DefaultModality.MODALITY_CONTENT)
      );
    });

    const {
      videoStreamIndex,
      videoDownlinkBandwidthPolicy,
      videoUplinkBandwidthPolicy,
    } = this.context;

    const oldVideoSources = videoStreamIndex.allVideoSendingSourcesExcludingSelf(selfAttendeeId);
    videoStreamIndex.integrateIndexFrame(indexFrame);
    videoDownlinkBandwidthPolicy.updateIndex(videoStreamIndex);
    videoUplinkBandwidthPolicy.updateIndex(videoStreamIndex);

    this.resubscribe(videoDownlinkBandwidthPolicy, videoUplinkBandwidthPolicy);
    this.updateVideoAvailability(indexFrame);
    this.handleIndexVideosPausedAtSource();
    // `forEachObserver`is asynchronous anyways so it doesn't matter (for better or worse) whether we
    // trigger it before or after the policy update + possible resubscribe kickoff
    const newVideoSources = videoStreamIndex.allVideoSendingSourcesExcludingSelf(selfAttendeeId);
    if (!this.areVideoSourcesEqual(oldVideoSources, newVideoSources)) {
      this.context.audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
        Maybe.of(observer.remoteVideoSourcesDidChange).map(f => f.bind(observer)(newVideoSources));
      });
    }
  }

  private areVideoSourcesEqual(
    oldVideoSources: VideoSource[],
    newVideoSources: VideoSource[]
  ): boolean {
    if (oldVideoSources.length !== newVideoSources.length) {
      return false;
    }
    const compare = (videoSourceA: VideoSource, videoSourceB: VideoSource): number =>
      videoSourceA.attendee.attendeeId.localeCompare(videoSourceB.attendee.attendeeId);

    const sortedOldVideoSources = [...oldVideoSources].sort(compare);
    const sortedNewVideoSources = [...newVideoSources].sort(compare);

    for (let i = 0; i < sortedOldVideoSources.length; i++) {
      if (
        sortedOldVideoSources[i].attendee.attendeeId !==
        sortedNewVideoSources[i].attendee.attendeeId
      ) {
        return false;
      }
    }
    return true;
  }

  private resubscribe(
    videoDownlinkBandwidthPolicy: VideoDownlinkBandwidthPolicy,
    videoUplinkBandwidthPolicy: VideoUplinkBandwidthPolicy
  ): void {
    const resubscribeForDownlink: boolean = videoDownlinkBandwidthPolicy.wantsResubscribe();
    const resubscribeForUplink: boolean =
      (this.context.videoDuplexMode === SdkStreamServiceType.TX ||
        this.context.videoDuplexMode === SdkStreamServiceType.DUPLEX) &&
      videoUplinkBandwidthPolicy.wantsResubscribe();
    const shouldResubscribe = resubscribeForDownlink || resubscribeForUplink;
    this.logger.info(
      `should resubscribe: ${shouldResubscribe} (downlink: ${resubscribeForDownlink} uplink: ${resubscribeForUplink})`
    );
    if (!shouldResubscribe) {
      return;
    }

    const videoSubscriptionIdSet = videoDownlinkBandwidthPolicy.chooseSubscriptions();
    this.context.videosToReceive = videoSubscriptionIdSet.truncate(
      this.context.videoSubscriptionLimit
    );

    if (videoSubscriptionIdSet.size() > this.context.videosToReceive.size()) {
      this.logger.warn(`video receive limit exceeded. Limiting the videos to ${this.context.videosToReceive.size()}`);
    }

    this.context.videoCaptureAndEncodeParameter = videoUplinkBandwidthPolicy.chooseCaptureAndEncodeParameters();
    this.logger.info(
      `trigger resubscribe for up=${resubscribeForUplink} down=${resubscribeForDownlink}; videosToReceive=[${this.context.videosToReceive.array()}] captureParams=${JSON.stringify(
        this.context.videoCaptureAndEncodeParameter
      )}`
    );
    this.context.audioVideoController.update({ needsRenegotiation: false });
  }

  private updateVideoAvailability(indexFrame: SdkIndexFrame): void {
    if (!this.context.videosToReceive) {
      this.logger.error('videosToReceive must be set in the meeting context.');
      return;
    }

    const videoAvailability = new MeetingSessionVideoAvailability();
    videoAvailability.remoteVideoAvailable = !this.context.videosToReceive.empty();
    videoAvailability.canStartLocalVideo = !indexFrame.atCapacity;
    if (
      !this.context.lastKnownVideoAvailability ||
      !this.context.lastKnownVideoAvailability.equal(videoAvailability)
    ) {
      this.context.lastKnownVideoAvailability = videoAvailability.clone();
      this.context.audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
        Maybe.of(observer.videoAvailabilityDidChange).map(f =>
          f.bind(observer)(videoAvailability.clone())
        );
      });
    }
  }

  private handleIndexVideosPausedAtSource(): void {
    const streamsPausedAtSource: VideoStreamIdSet = this.context.videoStreamIndex.streamsPausedAtSource();
    for (const tile of this.context.videoTileController.getAllVideoTiles()) {
      const tileState = tile.state();
      if (streamsPausedAtSource.contain(tileState.streamId)) {
        if (tile.markPoorConnection()) {
          this.logger.info(`marks the tile ${tileState.tileId} as having a poor connection`);
        }
      } else {
        if (tile.unmarkPoorConnection()) {
          this.logger.info(`unmarks the tile ${tileState.tileId} as having a poor connection`);
        }
      }
    }
  }
}
