// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import MeetingSessionStatus from '../meetingsession/MeetingSessionStatus';
import MeetingSessionStatusCode from '../meetingsession/MeetingSessionStatusCode';
import SDP from '../sdp/SDP';
import ZLIBTextCompressor from '../sdp/ZLIBTextCompressor';
import ServerSideNetworkAdaption from '../signalingclient/ServerSideNetworkAdaption';
import SignalingClient from '../signalingclient/SignalingClient';
import SignalingClientEvent from '../signalingclient/SignalingClientEvent';
import SignalingClientEventType from '../signalingclient/SignalingClientEventType';
import SignalingClientSubscribe from '../signalingclient/SignalingClientSubscribe';
import SignalingClientVideoSubscriptionConfiguration from '../signalingclient/SignalingClientVideoSubscriptionConfiguration';
import SignalingClientObserver from '../signalingclientobserver/SignalingClientObserver';
import {
  SdkSignalFrame,
  SdkStreamServiceType,
  SdkSubscribeAckFrame,
} from '../signalingprotocol/SignalingProtocol.js';
import TaskCanceler from '../taskcanceler/TaskCanceler';
import VideoPreferences from '../videodownlinkbandwidthpolicy/VideoPreferences';
import BaseTask from './BaseTask';

/**
 * [[SubscribeAndReceiveSubscribeAckTask]] sends a subscribe frame with the given settings
 * and receives SdkSubscribeAckFrame.
 */
export default class SubscribeAndReceiveSubscribeAckTask extends BaseTask {
  protected taskName = 'SubscribeAndReceiveSubscribeAckTask';

  private taskCanceler: TaskCanceler | null = null;
  private textCompressor: ZLIBTextCompressor;

  constructor(private context: AudioVideoControllerState) {
    super(context.logger);
    this.textCompressor = new ZLIBTextCompressor(context.logger);
  }

  cancel(): void {
    if (this.taskCanceler) {
      this.taskCanceler.cancel();
      this.taskCanceler = null;
    }
  }

  async run(): Promise<void> {
    let localSdp = '';
    if (this.context.peer && this.context.peer.localDescription) {
      localSdp = new SDP(this.context.peer.localDescription.sdp).withUnifiedPlanFormat().sdp;
    }

    if (!this.context.enableSimulcast) {
      // backward compatibility
      let frameRate = 0;
      let maxEncodeBitrateKbps = 0;
      if (this.context.videoCaptureAndEncodeParameter) {
        frameRate = this.context.videoCaptureAndEncodeParameter.captureFrameRate();
        maxEncodeBitrateKbps = this.context.videoCaptureAndEncodeParameter.encodeBitrates()[0];
      }
      const param: RTCRtpEncodingParameters = {
        rid: 'hi',
        maxBitrate: maxEncodeBitrateKbps * 1000,
        maxFramerate: frameRate,
        active: true,
      };

      this.context.videoStreamIndex.integrateUplinkPolicyDecision([param]);
    }

    this.context.videoStreamIndex.subscribeFrameSent();

    // See comment above `fixUpSubscriptionOrder`
    const videoSubscriptions = this.fixUpSubscriptionOrder(
      localSdp,
      this.context.videoSubscriptions
    );

    const isSendingStreams: boolean =
      this.context.videoDuplexMode === SdkStreamServiceType.TX ||
      this.context.videoDuplexMode === SdkStreamServiceType.DUPLEX;

    let compressedSDPOffer: Uint8Array | null;
    const localSdpOffer = localSdp;

    if (this.context.serverSupportsCompression) {
      // If the server supports compression, then send the compressed version of the sdp
      // and exclude the original sdp offer.
      const prevOffer = this.context.previousSdpOffer ? this.context.previousSdpOffer.sdp : '';
      compressedSDPOffer = this.textCompressor.compress(localSdpOffer, prevOffer);
      this.context.logger.info(
        `Compressed the SDP message from ${localSdpOffer.length} to ${compressedSDPOffer.length} bytes.`
      );
      localSdp = '';
    }
    this.context.previousSdpOffer = new SDP(localSdpOffer);

    const subscribe = new SignalingClientSubscribe(
      this.context.meetingSessionConfiguration.credentials.attendeeId,
      localSdp,
      this.context.meetingSessionConfiguration.urls.audioHostURL,
      this.context.realtimeController.realtimeIsLocalAudioMuted(),
      false,
      videoSubscriptions,
      isSendingStreams,
      this.context.videoStreamIndex.localStreamDescriptions(),
      // TODO: handle check-in mode, or remove this param
      true,
      compressedSDPOffer
    );

    if (
      this.context.videoDownlinkBandwidthPolicy.getServerSideNetworkAdaption !== undefined &&
      this.context.videoDownlinkBandwidthPolicy.getServerSideNetworkAdaption() !==
        ServerSideNetworkAdaption.None &&
      this.context.videoDownlinkBandwidthPolicy.getVideoPreferences !== undefined
    ) {
      // Set initial configuration for the receive streams indicated by the rest of the subscribe
      subscribe.videoSubscriptionConfiguration = this.convertVideoPreferencesToVideoSubscriptionConfiguration(
        videoSubscriptions,
        this.context.videoDownlinkBandwidthPolicy.getVideoPreferences()
      );
    }
    this.context.logger.info(`sending subscribe: ${JSON.stringify(subscribe)}`);
    this.context.signalingClient.subscribe(subscribe);

    const subscribeAckFrame = await this.receiveSubscribeAck();
    this.context.logger.info(`got subscribe ack: ${JSON.stringify(subscribeAckFrame)}`);

    let decompressedText = '';
    if (subscribeAckFrame.compressedSdpAnswer && subscribeAckFrame.compressedSdpAnswer.length) {
      decompressedText = this.textCompressor.decompress(
        subscribeAckFrame.compressedSdpAnswer,
        this.context.previousSdpAnswerAsString
      );

      if (decompressedText.length === 0) {
        this.context.sdpAnswer = '';
        this.context.previousSdpAnswerAsString = '';
        this.logAndThrow(`Error occurred while trying to decompress the SDP answer.`);
      }

      this.context.logger.info(
        `Decompressed the SDP message from ${subscribeAckFrame.compressedSdpAnswer.length} to ${decompressedText.length} bytes.`
      );
      this.context.sdpAnswer = decompressedText;
    } else {
      this.context.sdpAnswer = subscribeAckFrame.sdpAnswer;
    }
    this.context.previousSdpAnswerAsString = this.context.sdpAnswer;

    this.context.videoStreamIndex.integrateSubscribeAckFrame(subscribeAckFrame);
  }

  // Our backends currently expect the video subscriptions passed in subscribe to precisely
  // line up with the media sections, with a zero for any video send or inactive section.
  //
  // Firefox occasionally tosses stopped transceivers at the end of the SDP without reason
  // and in general we don't want to be at the mercy of SDP sections not being in the same
  // order as `getTransceivers`, so we simply recalculate the array here to enforce that
  // expected invarient until we refactor our signaling to simply take a mapping of MID to
  // subscription.
  //
  // This only works on Unified Plan SDPs
  private fixUpSubscriptionOrder(sdp: string, videoSubscriptions: number[]): number[] {
    if (this.context.transceiverController.getMidForStreamId === undefined) {
      return videoSubscriptions;
    }

    const midsToStreamIds = new Map<string, number>();
    for (const streamId of videoSubscriptions) {
      // The local description will have been set by the time this task is running, so all
      // of the transceivers should have `mid` set by now (see comment above `getMidForStreamId`)
      const mid = this.context.transceiverController.getMidForStreamId(streamId);
      if (mid === undefined) {
        if (streamId !== 0) {
          // Send section or inactive section
          this.logger.warn(`Could not find MID for stream ID: ${streamId}`);
        }
        continue;
      }
      midsToStreamIds.set(mid, streamId);
    }

    const sections = new SDP(sdp).mediaSections();
    const newSubscriptions: number[] = [];
    for (const section of sections) {
      if (section.mediaType !== 'video') {
        continue;
      }

      if (section.direction === 'recvonly') {
        const streamId = midsToStreamIds.get(section.mid);
        if (streamId === undefined) {
          this.logger.warn(`Could not find stream ID for MID: ${section.mid}`);
          continue;
        }
        newSubscriptions.push(streamId);
      } else {
        newSubscriptions.push(0);
      }
    }
    this.logger.info(
      `Fixed up ${JSON.stringify(videoSubscriptions)} to ${JSON.stringify(
        newSubscriptions
      )} (may be same))}`
    );
    return newSubscriptions;
  }

  private convertVideoPreferencesToVideoSubscriptionConfiguration(
    receiveStreamIds: number[],
    preferences: VideoPreferences
  ): SignalingClientVideoSubscriptionConfiguration[] {
    if (
      this.context.transceiverController.getMidForStreamId === undefined ||
      preferences === undefined
    ) {
      return [];
    }

    const configurations = new Array<SignalingClientVideoSubscriptionConfiguration>();
    const attendeeIdToMid = new Map<string, string>();
    const attendeeIdToGroupId = new Map<string, number>();
    for (const streamId of receiveStreamIds) {
      // The local description will have been set by the time this task is running, so all
      // of the transceivers should have `mid` set by now (see comment above `getMidForStreamId`)
      const mid = this.context.transceiverController.getMidForStreamId(streamId);
      if (mid === undefined) {
        // Likely imposible to hit the next `if` given use of `fixUpSubscriptionOrder`
        /* istanbul ignore if */
        if (streamId !== 0) {
          // Send section or inactive section
          this.context.logger.warn(`Could not find MID for stream ID: ${streamId}`);
        }
        continue;
      }
      const attendeeId = this.context.videoStreamIndex.attendeeIdForStreamId(streamId);
      attendeeIdToMid.set(attendeeId, mid);
      attendeeIdToGroupId.set(
        attendeeId,
        this.context.videoStreamIndex.groupIdForStreamId(streamId)
      );
    }
    for (const preference of preferences) {
      const configuration = new SignalingClientVideoSubscriptionConfiguration();
      const mid = attendeeIdToMid.get(preference.attendeeId);
      if (mid === undefined) {
        this.context.logger.warn(`Could not find MID for attendee ID: ${preference.attendeeId}`);
        continue;
      }
      configuration.mid = mid;
      configuration.attendeeId = preference.attendeeId;
      configuration.groupId = attendeeIdToGroupId.get(preference.attendeeId);
      // The signaling protocol expects 'higher' values for 'higher' priorities
      configuration.priority = Number.MAX_SAFE_INTEGER - preference.priority;
      configuration.targetBitrateKbps = preference.targetSizeToBitrateKbps(preference.targetSize);
      configurations.push(configuration);
    }
    return configurations;
  }

  private receiveSubscribeAck(): Promise<SdkSubscribeAckFrame> {
    return new Promise((resolve, reject) => {
      const context = this.context;
      class Interceptor implements SignalingClientObserver, TaskCanceler {
        constructor(private signalingClient: SignalingClient) {}

        cancel(): void {
          this.signalingClient.removeObserver(this);
          reject(
            new Error(
              `SubscribeAndReceiveSubscribeAckTask got canceled while waiting for SdkSubscribeAckFrame`
            )
          );
        }

        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.isConnectionTerminated()) {
            const message = `SubscribeAndReceiveSubscribeAckTask connection was terminated with code ${event.closeCode} and reason: ${event.closeReason}`;
            context.logger.warn(message);

            let statusCode: MeetingSessionStatusCode = MeetingSessionStatusCode.TaskFailed;
            if (event.closeCode >= 4500 && event.closeCode < 4600) {
              statusCode = MeetingSessionStatusCode.SignalingInternalServerError;
            }
            context.audioVideoController.handleMeetingSessionStatus(
              new MeetingSessionStatus(statusCode),
              new Error(message)
            );
            return;
          }

          if (
            event.type !== SignalingClientEventType.ReceivedSignalFrame ||
            event.message.type !== SdkSignalFrame.Type.SUBSCRIBE_ACK
          ) {
            return;
          }

          this.signalingClient.removeObserver(this);

          // @ts-ignore: force cast to SdkSubscribeAckFrame
          const subackFrame: SdkSubscribeAckFrame = event.message.suback;
          resolve(subackFrame);
        }
      }

      const interceptor = new Interceptor(this.context.signalingClient);
      this.context.signalingClient.registerObserver(interceptor);
      this.taskCanceler = interceptor;
    });
  }
}
