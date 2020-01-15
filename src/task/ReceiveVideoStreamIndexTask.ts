// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import AudioVideoObserver from '../audiovideoobserver/AudioVideoObserver';
import Maybe from '../maybe/Maybe';
import MeetingSessionVideoAvailability from '../meetingsession/MeetingSessionVideoAvailability';
import RemovableObserver from '../removableobserver/RemovableObserver';
import SignalingClientEvent from '../signalingclient/SignalingClientEvent';
import SignalingClientEventType from '../signalingclient/SignalingClientEventType';
import SignalingClientObserver from '../signalingclientobserver/SignalingClientObserver';
import {
  SdkIndexFrame,
  SdkSignalFrame,
  SdkStreamServiceType,
} from '../signalingprotocol/SignalingProtocol.js';
import VideoDownlinkBandwidthPolicy from '../videodownlinkbandwidthpolicy/VideoDownlinkBandwidthPolicy';
import VideoStreamIdSet from '../videostreamidset/VideoStreamIdSet';
import DefaultVideoStreamIndex from '../videostreamindex/DefaultVideoStreamIndex';
import VideoStreamIndex from '../videostreamindex/VideoStreamIndex';
import DefaultVideoSubscribeContext from '../videosubscribecontext/DefaultVideoSubscribeContext';
import VideoUplinkBandwidthPolicy from '../videouplinkbandwidthpolicy/VideoUplinkBandwidthPolicy';
import BaseTask from './BaseTask';

/*
 * [[ReceiveVideoStreamIndexTask]] receives [[SdkIndexFrame]] and updates [[VideoUplinkBandwidthPolicy]] and [[VideoDownlinkBandwidthPolicy]].
 */
export default class ReceiveVideoStreamIndexTask extends BaseTask
  implements SignalingClientObserver, RemovableObserver {
  protected taskName = 'ReceiveVideoStreamIndexTask';

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

  private handleIndexFrame(indexFrame: SdkIndexFrame | null): void {
    if (!indexFrame) {
      return;
    }
    const { videoDownlinkBandwidthPolicy, videoUplinkBandwidthPolicy } = this.context;

    const nextVideoStreamIndex = new DefaultVideoStreamIndex(this.context.logger);
    nextVideoStreamIndex.integrateIndexFrame(indexFrame);
    videoDownlinkBandwidthPolicy.updateIndex(nextVideoStreamIndex);
    videoUplinkBandwidthPolicy.updateIndex(nextVideoStreamIndex);

    this.resubscribe(
      videoDownlinkBandwidthPolicy,
      videoUplinkBandwidthPolicy,
      nextVideoStreamIndex
    );
    this.updateVideoAvailability(indexFrame);
    this.handleIndexVideosPausedAtSource(nextVideoStreamIndex.streamsPausedAtSource());
  }

  private resubscribe(
    videoDownlinkBandwidthPolicy: VideoDownlinkBandwidthPolicy,
    videoUplinkBandwidthPolicy: VideoUplinkBandwidthPolicy,
    newVideoStreamIndex: VideoStreamIndex
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

    const nextVideosToReceive = videoDownlinkBandwidthPolicy.chooseSubscriptions();
    this.context.nextVideoSubscribeContext = new DefaultVideoSubscribeContext();
    this.context.nextVideoSubscribeContext.updateVideoStreamIndex(newVideoStreamIndex);
    this.context.nextVideoSubscribeContext.updateVideosToReceive(nextVideosToReceive);
    this.context.nextVideoSubscribeContext.updateVideoPausedSet(
      newVideoStreamIndex.streamsPausedAtSource()
    );
    this.context.videoCaptureAndEncodeParameter = videoUplinkBandwidthPolicy.chooseCaptureAndEncodeParameters();
    this.logger.info(
      `trigger resubscribe for up=${resubscribeForUplink} down=${resubscribeForDownlink}; nextVideosToReceive=[${this.context.nextVideoSubscribeContext
        .videosToReceive()
        .array()}] captureParams=${JSON.stringify(this.context.videoCaptureAndEncodeParameter)};
              videoPausedSet=${this.context.nextVideoSubscribeContext.videosPausedSet().array()}`
    );
    this.context.audioVideoController.update(this.context.nextVideoSubscribeContext);
  }

  private updateVideoAvailability(indexFrame: SdkIndexFrame): void {
    if (!this.context.nextVideoSubscribeContext) {
      this.logger.info('no video subscriptions, so no availability change');
      return;
    }
    const nextVideosToReceive = this.context.nextVideoSubscribeContext.videosToReceive();
    const videoAvailability = new MeetingSessionVideoAvailability();
    videoAvailability.remoteVideoAvailable = !nextVideosToReceive.empty();
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

  private handleIndexVideosPausedAtSource(streamsPausedAtSource: VideoStreamIdSet): void {
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
