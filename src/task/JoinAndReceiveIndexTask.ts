// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import MeetingSessionStatus from '../meetingsession/MeetingSessionStatus';
import MeetingSessionStatusCode from '../meetingsession/MeetingSessionStatusCode';
import MeetingSessionTURNCredentials from '../meetingsession/MeetingSessionTURNCredentials';
import ServerSideNetworkAdaption, {
  convertServerSideNetworkAdaptionEnumFromSignaled,
} from '../signalingclient/ServerSideNetworkAdaption';
import SignalingClient from '../signalingclient/SignalingClient';
import SignalingClientEvent from '../signalingclient/SignalingClientEvent';
import SignalingClientEventType from '../signalingclient/SignalingClientEventType';
import SignalingClientJoin from '../signalingclient/SignalingClientJoin';
import SignalingClientObserver from '../signalingclientobserver/SignalingClientObserver';
import {
  SdkIndexFrame,
  SdkServerSideNetworkAdaption,
  SdkSignalFrame,
} from '../signalingprotocol/SignalingProtocol.js';
import TaskCanceler from '../taskcanceler/TaskCanceler';
import BaseTask from './BaseTask';

/*
 * [[JoinAndReceiveIndexTask]] sends the JoinFrame and asynchronously waits for the server to send the [[SdkIndexFrame]].
 * It should run with the [[TimeoutTask]] as the subtask so it can get canceled after timeout.
 */
export default class JoinAndReceiveIndexTask extends BaseTask {
  protected taskName = 'JoinAndReceiveIndexTask';
  private taskCanceler: TaskCanceler | null = null;

  constructor(private context: AudioVideoControllerState) {
    super(context.logger);
  }

  cancel(): void {
    if (this.taskCanceler) {
      this.taskCanceler.cancel();
      this.taskCanceler = null;
    }
  }

  async run(): Promise<void> {
    const indexFrame = await new Promise<SdkIndexFrame>((resolve, reject) => {
      const context = this.context;
      context.turnCredentials = null;
      class IndexFrameInterceptor implements SignalingClientObserver, TaskCanceler {
        constructor(private signalingClient: SignalingClient) {}

        cancel(): void {
          this.signalingClient.removeObserver(this);
          reject(new Error(`JoinAndReceiveIndexTask got canceled while waiting for SdkIndexFrame`));
        }

        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketClosed) {
            let message = `The signaling connection was closed with code ${event.closeCode} and reason: ${event.closeReason}`;
            context.logger.warn(message);

            let statusCode: MeetingSessionStatusCode = MeetingSessionStatusCode.SignalingBadRequest;
            if (event.closeCode === 4410) {
              message = 'The meeting already ended.';
              context.logger.warn(message);
              statusCode = MeetingSessionStatusCode.MeetingEnded;
            } else if (event.closeCode >= 4500 && event.closeCode < 4600) {
              statusCode = MeetingSessionStatusCode.SignalingInternalServerError;
            }
            context.audioVideoController.handleMeetingSessionStatus(
              new MeetingSessionStatus(statusCode),
              new Error(message)
            );
            return;
          }
          if (event.type !== SignalingClientEventType.ReceivedSignalFrame) {
            return;
          }
          if (event.message.type === SdkSignalFrame.Type.JOIN_ACK) {
            // @ts-ignore: force cast to SdkJoinAckFrame
            const joinAckFrame: SdkJoinAckFrame = event.message.joinack;
            if (!joinAckFrame) {
              // This should realistically never happen
              context.audioVideoController.handleMeetingSessionStatus(
                new MeetingSessionStatus(MeetingSessionStatusCode.SignalingRequestFailed),
                new Error(`Join ACK message did not include expected frame`)
              );
              return;
            }
            if (joinAckFrame.videoSubscriptionLimit) {
              context.videoSubscriptionLimit = joinAckFrame.videoSubscriptionLimit;
            }

            context.serverSupportsCompression = joinAckFrame.wantsCompressedSdp;
            if (
              joinAckFrame.defaultServerSideNetworkAdaption !== undefined &&
              joinAckFrame.defaultServerSideNetworkAdaption !== ServerSideNetworkAdaption.Default &&
              context.videoDownlinkBandwidthPolicy.setServerSideNetworkAdaption !== undefined
            ) {
              const defaultServerSideNetworkAdaption: SdkServerSideNetworkAdaption =
                joinAckFrame.defaultServerSideNetworkAdaption;
              context.logger.info(
                `Overriding server side network adaption value to ${defaultServerSideNetworkAdaption}`
              );
              context.videoDownlinkBandwidthPolicy.setServerSideNetworkAdaption(
                convertServerSideNetworkAdaptionEnumFromSignaled(defaultServerSideNetworkAdaption)
              );
            }
            if (joinAckFrame && joinAckFrame.turnCredentials) {
              context.turnCredentials = new MeetingSessionTURNCredentials();
              context.turnCredentials.username = joinAckFrame.turnCredentials.username;
              context.turnCredentials.password = joinAckFrame.turnCredentials.password;
              context.turnCredentials.ttl = joinAckFrame.turnCredentials.ttl;
              context.turnCredentials.uris = joinAckFrame.turnCredentials.uris
                .map((uri: string): string => {
                  return context.meetingSessionConfiguration.urls.urlRewriter(uri);
                })
                .filter((uri: string) => {
                  return !!uri;
                });
            } else {
              context.logger.error('missing TURN credentials in JoinAckFrame');
            }
            return;
          }
          if (event.message.type !== SdkSignalFrame.Type.INDEX) {
            return;
          }
          this.signalingClient.removeObserver(this);
          // @ts-ignore: force cast to SdkIndexFrame
          const indexFrame: SdkIndexFrame = event.message.index;
          resolve(indexFrame);
        }
      }
      const interceptor = new IndexFrameInterceptor(this.context.signalingClient);
      this.context.signalingClient.registerObserver(interceptor);
      this.taskCanceler = interceptor;

      // reset SDP compression state
      this.context.previousSdpAnswerAsString = '';
      this.context.previousSdpOffer = null;
      this.context.serverSupportsCompression = false;

      const join = new SignalingClientJoin(
        this.context.meetingSessionConfiguration.applicationMetadata
      );
      if (
        this.context.videoDownlinkBandwidthPolicy.getServerSideNetworkAdaption !== undefined &&
        this.context.videoDownlinkBandwidthPolicy.supportedServerSideNetworkAdaptions !== undefined
      ) {
        join.serverSideNetworkAdaption = this.context.videoDownlinkBandwidthPolicy.getServerSideNetworkAdaption();
        join.supportedServerSideNetworkAdaptions = this.context.videoDownlinkBandwidthPolicy.supportedServerSideNetworkAdaptions();
      }
      if (this.context.videoDownlinkBandwidthPolicy.wantsAllTemporalLayersInIndex !== undefined) {
        join.wantsAllTemporalLayersInIndex = this.context.videoDownlinkBandwidthPolicy.wantsAllTemporalLayersInIndex();
      }
      join.disablePeriodicKeyframeRequestOnContentSender = this.context.meetingSessionConfiguration.disablePeriodicKeyframeRequestOnContentSender;
      this.context.signalingClient.join(join);
    });
    this.context.logger.info(`received first index ${JSON.stringify(indexFrame)}`);
    // We currently don't bother ingesting this into the same places as `ReceiveVideoStreamIndexTask` as we synchronously attempt a first subscribe
    // after this task completes and the state isn't quite in the right place to make it work without some refactoring. However that
    // means that we will always have an initial subscribe without any received videos.
    this.context.indexFrame = indexFrame;
  }
}
