// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import RemovableObserver from '../removableobserver/RemovableObserver';
import SignalingClientEvent from '../signalingclient/SignalingClientEvent';
import SignalingClientEventType from '../signalingclient/SignalingClientEventType';
import SignalingClientObserver from '../signalingclientobserver/SignalingClientObserver';
import { SdkPauseResumeFrame, SdkSignalFrame } from '../signalingprotocol/SignalingProtocol.js';
import VideoDownlinkObserver from '../videodownlinkbandwidthpolicy/VideoDownlinkObserver';
import BaseTask from './BaseTask';

/*
 * [[ReceiveRemoteVideoPauseResume]] receives [[SdkPauseFrame]] from the server side (only if
 * `VideoDownlinkBandwidthPolicy.getServerSideNetworkAdaption()` == `BandwidthProbingAndRemoteVideoQualityAdaption`)
 * which indicates remote video sources that have been paused or resumed and updates [[VideoDownlinkBandwidthPolicy]]
 * and [[VideoTileController]]
 */
export default class ReceiveRemoteVideoPauseResume
  extends BaseTask
  implements SignalingClientObserver, RemovableObserver {
  protected taskName = 'ReceiveRemoteVideoPauseResume';

  private serverPausedVideoTileIds = new Set<number>();

  constructor(private context: AudioVideoControllerState) {
    super(context.logger);
  }

  removeObserver(): void {
    this.context.signalingClient.removeObserver(this);
  }

  async run(): Promise<void> {
    this.context.signalingClient.registerObserver(this);
    this.context.removableObservers.push(this);
  }

  handleSignalingClientEvent(event: SignalingClientEvent): void {
    if (
      event.type !== SignalingClientEventType.ReceivedSignalFrame ||
      (event.message.type !== SdkSignalFrame.Type.PAUSE &&
        event.message.type !== SdkSignalFrame.Type.RESUME)
    ) {
      return;
    }

    // @ts-ignore: force cast to SdkPauseFrame
    const pauseResumeFrame: SdkPauseResumeFrame = event.message.pause;
    const messageType = event.message.type;
    this.context.logger.info(
      `received new ${
        messageType === SdkSignalFrame.Type.PAUSE ? 'pause' : 'resume'
      } frame: ${JSON.stringify(pauseResumeFrame)}`
    );

    if (
      !pauseResumeFrame ||
      this.context.videoTileController.getVideoTileForAttendeeId === undefined ||
      this.context.videoDownlinkBandwidthPolicy.forEachObserver === undefined ||
      this.context.videoStreamIndex.attendeeIdForGroupId === undefined
    ) {
      return;
    }

    const tiles = pauseResumeFrame.groupIds.map((groupId: number) => {
      const attendeeId = this.context.videoStreamIndex.attendeeIdForGroupId(groupId);
      return this.context.videoTileController.getVideoTileForAttendeeId(attendeeId);
    });

    for (const tile of tiles) {
      if (tile === undefined) {
        continue;
      }
      if (messageType === SdkSignalFrame.Type.PAUSE) {
        if (!tile.state().paused) {
          this.serverPausedVideoTileIds.add(tile.id());
          this.context.videoDownlinkBandwidthPolicy.forEachObserver(
            (observer: VideoDownlinkObserver) => {
              observer.tileWillBePausedByDownlinkPolicy(tile.id());
            }
          );
          // This circumvents the tile controller so it will not send
          // any signaling messages to server side.
          tile.pause();
        }
      } else {
        if (tile.state().paused && this.serverPausedVideoTileIds.has(tile.id())) {
          this.serverPausedVideoTileIds.delete(tile.id());
          this.context.videoDownlinkBandwidthPolicy.forEachObserver(
            (observer: VideoDownlinkObserver) => {
              observer.tileWillBeUnpausedByDownlinkPolicy(tile.id());
            }
          );
          // See comment above.
          tile.unpause();
        }
      }
    }
  }
}
