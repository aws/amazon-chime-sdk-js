// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioMixController from '../audiomixcontroller/AudioMixController';
import AudioProfile from '../audioprofile/AudioProfile';
import AudioVideoController from '../audiovideocontroller/AudioVideoController';
import ExtendedBrowserBehavior from '../browserbehavior/ExtendedBrowserBehavior';
import ConnectionMonitor from '../connectionmonitor/ConnectionMonitor';
import EventController from '../eventcontroller/EventController';
import Logger from '../logger/Logger';
import MediaStreamBroker from '../mediastreambroker/MediaStreamBroker';
import MeetingSessionConfiguration from '../meetingsession/MeetingSessionConfiguration';
import MeetingSessionTURNCredentials from '../meetingsession/MeetingSessionTURNCredentials';
import MeetingSessionVideoAvailability from '../meetingsession/MeetingSessionVideoAvailability';
import RealtimeController from '../realtimecontroller/RealtimeController';
import ReconnectController from '../reconnectcontroller/ReconnectController';
import RemovableObserver from '../removableobserver/RemovableObserver';
import SDP from '../sdp/SDP';
import VideoCodecCapability from '../sdp/VideoCodecCapability';
import SignalingClient from '../signalingclient/SignalingClient';
import SignalingClientVideoSubscriptionConfiguration from '../signalingclient/SignalingClientVideoSubscriptionConfiguration';
import { SdkIndexFrame, SdkStreamServiceType } from '../signalingprotocol/SignalingProtocol.js';
import StatsCollector from '../statscollector/StatsCollector';
import TransceiverController from '../transceivercontroller/TransceiverController';
import VideoCaptureAndEncodeParameter from '../videocaptureandencodeparameter/VideoCaptureAndEncodeParameter';
import VideoDownlinkBandwidthPolicy from '../videodownlinkbandwidthpolicy/VideoDownlinkBandwidthPolicy';
import VideoStreamIdSet from '../videostreamidset/VideoStreamIdSet';
import VideoStreamIndex from '../videostreamindex/VideoStreamIndex';
import VideoTileController from '../videotilecontroller/VideoTileController';
import VideoUplinkBandwidthPolicy from '../videouplinkbandwidthpolicy/VideoUplinkBandwidthPolicy';
import VolumeIndicatorAdapter from '../volumeindicatoradapter/VolumeIndicatorAdapter';

export const DEFAULT_VIDEO_SUBSCRIPTION_LIMIT = 25;

/**
 * [[AudioVideoControllerState]] includes the compute resources shared by [[DefaultAudioVideoController]] and any running [[Task]].
 *
 * **Note**: Any additions to this class need to consider whether they need to be reset in `resetConnectionSpecificState`, `CleanStoppedSessionTask`, or
 * `CleanRestartedSessionTask`, e.g. if it is relies on backend state and will go stale across reconnections.  Failing
 * to reset state may lead to unexpected behavior.
 */
export default class AudioVideoControllerState {
  logger: Logger | null = null;

  browserBehavior: ExtendedBrowserBehavior | null = null;

  meetingSessionConfiguration: MeetingSessionConfiguration | null = null;

  signalingClient: SignalingClient | null = null;

  peer: RTCPeerConnection | null = null;

  previousSdpOffer: SDP | null = null;

  sdpOfferInit: RTCSessionDescriptionInit | null = null;

  audioVideoController: AudioVideoController | null = null;

  realtimeController: RealtimeController | null = null;

  videoTileController: VideoTileController | null = null;

  mediaStreamBroker: MediaStreamBroker | null = null;

  activeAudioInput: MediaStream | undefined = undefined;

  activeVideoInput: MediaStream | undefined = undefined;

  audioMixController: AudioMixController | null = null;

  transceiverController: TransceiverController | null = null;

  indexFrame: SdkIndexFrame | null = null;

  iceCandidates: RTCIceCandidate[] = [];

  iceCandidateHandler: ((event: RTCPeerConnectionIceEvent) => void) | null = null;

  iceGatheringStateEventHandler: (() => void) | null = null;

  sdpAnswer: string | null = null;

  turnCredentials: MeetingSessionTURNCredentials | null = null;

  reconnectController: ReconnectController | null = null;

  removableObservers: RemovableObserver[] = [];

  audioProfile: AudioProfile | null = null;

  videoStreamIndex: VideoStreamIndex | null = null;

  videoDownlinkBandwidthPolicy: VideoDownlinkBandwidthPolicy | null = null;

  videoUplinkBandwidthPolicy: VideoUplinkBandwidthPolicy | null = null;

  lastKnownVideoAvailability: MeetingSessionVideoAvailability | null = null;

  videoCaptureAndEncodeParameter: VideoCaptureAndEncodeParameter | null = null;

  // An unordered list of IDs provided by the downlink policy that
  // we will eventually subscribe to.
  videosToReceive: VideoStreamIdSet | null = null;

  // The last processed set of IDs provided by the policy, so that we can
  // compare what changes were additions, stream switches, or removals.
  lastVideosToReceive: VideoStreamIdSet | null = null;

  // An ordered list corresponding to `videosToReceive` where the order
  // itself correspond to transceivers; 0 in this list corresponds to an inactive tranceiver.
  videoSubscriptions: number[] | null = null;

  // The last calculated list of subscription configuration used to send a remote video
  // update (i.e. not necessarily related to what is in subscribe). This is used to make the remote
  // video update a differential message (i.e. only sending changes)
  //
  // This is stored as a map keyed by group ID for convenience
  lastVideoSubscriptionConfiguration: Map<
    number,
    SignalingClientVideoSubscriptionConfiguration
  > = new Map();

  // The video subscription limit is set by the backend and is subject to change in future.
  // This value is set in the `JoinAndReceiveIndexTask` when we process the `SdkJoinAckFrame`
  // and is used in the `ReceiveVideoStreamIndexTask` to limit the total number of streams
  // that we include in the `videosToReceive`.
  videoSubscriptionLimit: number = DEFAULT_VIDEO_SUBSCRIPTION_LIMIT;

  // The previous SDP answer will be used as a dictionary to seed the compression library
  // during decompressing the compressed SDP answer.
  previousSdpAnswerAsString: string = '';

  // This flag indicates if the backend supports compression for the client.
  serverSupportsCompression: boolean = false;

  // Values set by `setVideoCodecSendPreferences`.
  videoSendCodecPreferences: VideoCodecCapability[] = [];

  // Calculated as the highest priority available codec set in the (possibly munged) SDP answer
  // that is provide to the peer connection, which will be what is sent.
  currentVideoSendCodec: VideoCodecCapability | undefined = undefined;

  // Intersection of `videoSendCodecPreferences` and the supported receive codecs of
  // all the other clients in the meeting.
  meetingSupportedVideoSendCodecPreferences: VideoCodecCapability[] | undefined = undefined;

  // Calculated as the list of available codec set in the (possibly munged) SDP answer
  // that is provided to the peer connection, which will be ordered by priority.
  prioritizedSendVideoCodecCapabilities: VideoCodecCapability[] = [];

  // Video codecs blocklisted to be used for sending due to encoding issues
  videoSendCodecsBlocklisted: VideoCodecCapability[] = [];

  videosPaused: VideoStreamIdSet | null = null;

  videoDuplexMode: SdkStreamServiceType | null = null;

  volumeIndicatorAdapter: VolumeIndicatorAdapter | null = null;

  statsCollector: StatsCollector | null = null;

  connectionMonitor: ConnectionMonitor | null = null;

  // This state is deprecated and unused.
  videoInputAttachedTimestampMs: number = 0;

  // This state is deprecated and unused.
  audioDeviceInformation: { [id: string]: string } = {};

  // This state is deprecated and unused.
  videoDeviceInformation: { [id: string]: string } = {};

  enableSimulcast: boolean = false;

  // If set to true, the client will actively try to use Scalable Video Coding (SVC) features
  // if possible. The availability of these features depends dynamically on the video codec used;
  // static browser availability and any competing features (e.g. simulcast) should
  // have already been checked before this is set to true.
  enableSVC: boolean = false;

  eventController: EventController | null = null;

  signalingOpenDurationMs: number | null = null;

  iceGatheringDurationMs: number | null = null;

  startAudioVideoTimestamp: number | null = null;

  attendeePresenceDurationMs: number | null = null;

  meetingStartDurationMs: number | null = null;

  poorConnectionCount: number = 0;

  maxVideoTileCount: number = 0;

  startTimeMs: number | null = null;

  /*
   * Reset state corresponding to state that is dependent on a individual connection
   * and may not be valid for others, e.g. on a reconnection.
   */
  resetConnectionSpecificState(): void {
    // For auditing reasons, we will comment on the state that we do not touch here. Note that `DefaultAudioVideoController.actionConnect`
    // also resets certain state, some to cached members:
    // Reset to empty/null/new state: `browserBehavior`, `transceiverController`, `volumeIndicatorAdapter`, `enableSimulcast`
    //                                `signalingOpenDurationMs`, `iceGatheringDurationMs`, `startAudioVideoTimestamp`, `attendeePresenceDurationMs`
    //                                `meetingStartDurationMs`, `startTimeMs`, `lastKnownVideoAvailability`, `videoCaptureAndEncodeParameter`, `videosToReceive`
    //                                `videosPaused`, `videoStreamIndex`, `statsCollector`, `connectionMonitor`
    // Reset to existing/cached values: `logger`, `meetingSessionConfiguration`, `realtimeController`, `mediaStreamBroker`,
    //                                  `audioMixController`, `reconnectController, `audioProfile`, `eventController`

    // `signalingClient` can be reused from a failed/disconnected state.

    if (this.peer) {
      this.peer.close();
    }
    this.peer = null;
    this.previousSdpOffer = null;
    this.sdpOfferInit = null;

    // `audioVideoController` members should either be reusable, or moved to `AudioVideoControllerState` and
    // cleaned up here.

    // We don't want to mutate `videoTileController` as most video tiles will still be there on reconnect. We can remove tiles on the
    // first index we receive if they no longer exist

    // `mediaStreamBroker`, `activeAudioInput`, and `activeVideoInput` are cleaned up seperately in `DefaultAudioVideoController.cleanUpMediaStreamsAfterStop`
    // but only on `stop` or non-reconnectable failures. They are also set to cached `DefaultAudioVideoController` members on restart.

    if (this.transceiverController !== undefined) {
      this.transceiverController.reset();
    }
    this.indexFrame = null;
    this.iceCandidates = [];
    this.iceCandidateHandler = null;
    this.sdpAnswer = null;
    this.turnCredentials = null;

    this.videoDownlinkBandwidthPolicy.reset();
    if (this.videoUplinkBandwidthPolicy.reset) {
      this.videoUplinkBandwidthPolicy.reset();
    }

    this.lastVideosToReceive = null;
    this.lastVideoSubscriptionConfiguration = new Map();
    this.videoSubscriptions = null;
    this.videoSubscriptionLimit = DEFAULT_VIDEO_SUBSCRIPTION_LIMIT;
    this.previousSdpAnswerAsString = '';
    this.serverSupportsCompression = false;

    // `videoSendCodecPreferences` is set by builder and needs to stay consistent.

    this.currentVideoSendCodec = undefined;
    this.meetingSupportedVideoSendCodecPreferences = undefined;
    this.videoDuplexMode = null;

    // `poorConnectionCount`and `maxVideoTileCount` is intentionally not set to 0 across reconnections.
  }
}
