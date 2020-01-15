// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioMixController from '../audiomixcontroller/AudioMixController';
import AudioVideoController from '../audiovideocontroller/AudioVideoController';
import BrowserBehavior from '../browserbehavior/BrowserBehavior';
import ConnectionMonitor from '../connectionmonitor/ConnectionMonitor';
import DeviceController from '../devicecontroller/DeviceController';
import Logger from '../logger/Logger';
import MediaStreamBroker from '../mediastreambroker/MediaStreamBroker';
import MeetingSessionConfiguration from '../meetingsession/MeetingSessionConfiguration';
import MeetingSessionTURNCredentials from '../meetingsession/MeetingSessionTURNCredentials';
import MeetingSessionVideoAvailability from '../meetingsession/MeetingSessionVideoAvailability';
import RealtimeController from '../realtimecontroller/RealtimeController';
import ReconnectController from '../reconnectcontroller/ReconnectController';
import RemovableObserver from '../removableobserver/RemovableObserver';
import ScreenSharingSession from '../screensharingsession/ScreenSharingSession';
import SignalingClient from '../signalingclient/SignalingClient';
import { SdkIndexFrame, SdkStreamServiceType } from '../signalingprotocol/SignalingProtocol.js';
import StatsCollector from '../statscollector/StatsCollector';
import TransceiverController from '../transceivercontroller/TransceiverController';
import VideoCaptureAndEncodeParameter from '../videocaptureandencodeparameter/VideoCaptureAndEncodeParameter';
import VideoDownlinkBandwidthPolicy from '../videodownlinkbandwidthpolicy/VideoDownlinkBandwidthPolicy';
import VideoSubscribeContext from '../videosubscribecontext/VideoSubscribeContext';
import VideoTileController from '../videotilecontroller/VideoTileController';
import VideoUplinkBandwidthPolicy from '../videouplinkbandwidthpolicy/VideoUplinkBandwidthPolicy';
import VolumeIndicatorAdapter from '../volumeindicatoradapter/VolumeIndicatorAdapter';

/**
 * [[AudioVideoControllerState]] includes the compute resources shared by [[Task]].
 */
export default class AudioVideoControllerState {
  logger: Logger | null = null;

  browserBehavior: BrowserBehavior | null = null;

  signalingClient: SignalingClient | null = null;

  meetingSessionConfiguration: MeetingSessionConfiguration | null = null;

  peer: RTCPeerConnection | null = null;

  sdpOfferInit: RTCSessionDescriptionInit | null = null;

  audioVideoController: AudioVideoController | null = null;

  realtimeController: RealtimeController | null = null;

  videoTileController: VideoTileController | null = null;

  mediaStreamBroker: MediaStreamBroker | null = null;

  deviceController: DeviceController | null = null;

  audioMixController: AudioMixController | null = null;

  activeAudioInput: MediaStream | null = null;

  activeVideoInput: MediaStream | null = null;

  transceiverController: TransceiverController | null = null;

  indexFrame: SdkIndexFrame | null = null;

  iceCandidates: RTCIceCandidate[] = [];

  iceCandidateHandler: (event: RTCPeerConnectionIceEvent) => void | null = null;

  screenSharingSession: ScreenSharingSession | null = null;

  sdpAnswer: string | null = null;

  turnCredentials: MeetingSessionTURNCredentials | null = null;

  reconnectController: ReconnectController | null = null;

  removableObservers: RemovableObserver[] = [];

  videoDownlinkBandwidthPolicy: VideoDownlinkBandwidthPolicy | null = null;

  videoUplinkBandwidthPolicy: VideoUplinkBandwidthPolicy | null = null;

  lastKnownVideoAvailability: MeetingSessionVideoAvailability | null = null;

  localVideoSender: RTCRtpSender | null = null;

  localAudioSender: RTCRtpSender | null = null;

  videoCaptureAndEncodeParameter: VideoCaptureAndEncodeParameter | null = null;

  videoSubscribeContext: VideoSubscribeContext;

  nextVideoSubscribeContext: VideoSubscribeContext;

  videoDuplexMode: SdkStreamServiceType | null = null;

  volumeIndicatorAdapter: VolumeIndicatorAdapter | null = null;

  statsCollector: StatsCollector | null = null;

  connectionMonitor: ConnectionMonitor | null = null;

  videoInputAttachedTimestampMs: number = 0;

  audioDeviceInformation: { [id: string]: string } = {};

  videoDeviceInformation: { [id: string]: string } = {};
}
