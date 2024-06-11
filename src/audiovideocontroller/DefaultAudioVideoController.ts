// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { MeetingSessionCredentials } from '..';
import ActiveSpeakerDetector from '../activespeakerdetector/ActiveSpeakerDetector';
import DefaultActiveSpeakerDetector from '../activespeakerdetector/DefaultActiveSpeakerDetector';
import AudioMixController from '../audiomixcontroller/AudioMixController';
import DefaultAudioMixController from '../audiomixcontroller/DefaultAudioMixController';
import AudioProfile from '../audioprofile/AudioProfile';
import AudioVideoController from '../audiovideocontroller/AudioVideoController';
import AudioVideoObserver from '../audiovideoobserver/AudioVideoObserver';
import DefaultBrowserBehavior from '../browserbehavior/DefaultBrowserBehavior';
import ConnectionHealthData from '../connectionhealthpolicy/ConnectionHealthData';
import SignalingAndMetricsConnectionMonitor from '../connectionmonitor/SignalingAndMetricsConnectionMonitor';
import Destroyable from '../destroyable/Destroyable';
import VideoQualitySettings from '../devicecontroller/VideoQualitySettings';
import AudioVideoEventAttributes from '../eventcontroller/AudioVideoEventAttributes';
import EventController from '../eventcontroller/EventController';
import Logger from '../logger/Logger';
import MediaStreamBroker from '../mediastreambroker/MediaStreamBroker';
import MediaStreamBrokerObserver from '../mediastreambrokerobserver/MediaStreamBrokerObserver';
import MeetingSessionConfiguration from '../meetingsession/MeetingSessionConfiguration';
import MeetingSessionStatus from '../meetingsession/MeetingSessionStatus';
import MeetingSessionStatusCode from '../meetingsession/MeetingSessionStatusCode';
import MeetingSessionVideoAvailability from '../meetingsession/MeetingSessionVideoAvailability';
import DefaultModality from '../modality/DefaultModality';
import DefaultPingPong from '../pingpong/DefaultPingPong';
import DefaultRealtimeController from '../realtimecontroller/DefaultRealtimeController';
import RealtimeController from '../realtimecontroller/RealtimeController';
import ReconnectController from '../reconnectcontroller/ReconnectController';
import AsyncScheduler from '../scheduler/AsyncScheduler';
import VideoCodecCapability from '../sdp/VideoCodecCapability';
import DefaultSessionStateController from '../sessionstatecontroller/DefaultSessionStateController';
import SessionStateController from '../sessionstatecontroller/SessionStateController';
import SessionStateControllerAction from '../sessionstatecontroller/SessionStateControllerAction';
import SessionStateControllerState from '../sessionstatecontroller/SessionStateControllerState';
import SessionStateControllerTransitionResult from '../sessionstatecontroller/SessionStateControllerTransitionResult';
import DefaultSignalingClient from '../signalingclient/DefaultSignalingClient';
import ServerSideNetworkAdaption, {
  serverSideNetworkAdaptionIsNoneOrDefault,
} from '../signalingclient/ServerSideNetworkAdaption';
import SignalingClientEvent from '../signalingclient/SignalingClientEvent';
import SignalingClientEventType from '../signalingclient/SignalingClientEventType';
import SignalingClientVideoSubscriptionConfiguration from '../signalingclient/SignalingClientVideoSubscriptionConfiguration';
import SignalingClientObserver from '../signalingclientobserver/SignalingClientObserver';
import { SdkStreamServiceType } from '../signalingprotocol/SignalingProtocol.js';
import SimulcastLayers from '../simulcastlayers/SimulcastLayers';
import StatsCollector from '../statscollector/StatsCollector';
import AttachMediaInputTask from '../task/AttachMediaInputTask';
import CleanRestartedSessionTask from '../task/CleanRestartedSessionTask';
import CleanStoppedSessionTask from '../task/CleanStoppedSessionTask';
import CreatePeerConnectionTask from '../task/CreatePeerConnectionTask';
import CreateSDPTask from '../task/CreateSDPTask';
import FinishGatheringICECandidatesTask from '../task/FinishGatheringICECandidatesTask';
import JoinAndReceiveIndexTask from '../task/JoinAndReceiveIndexTask';
import LeaveAndReceiveLeaveAckTask from '../task/LeaveAndReceiveLeaveAckTask';
import ListenForVolumeIndicatorsTask from '../task/ListenForVolumeIndicatorsTask';
import MonitorTask from '../task/MonitorTask';
import OpenSignalingConnectionTask from '../task/OpenSignalingConnectionTask';
import ParallelGroupTask from '../task/ParallelGroupTask';
import PromoteToPrimaryMeetingTask from '../task/PromoteToPrimaryMeetingTask';
import ReceiveAudioInputTask from '../task/ReceiveAudioInputTask';
import ReceiveRemoteVideoPauseResume from '../task/ReceiveRemoteVideoPauseResumeTask';
import ReceiveVideoInputTask from '../task/ReceiveVideoInputTask';
import ReceiveVideoStreamIndexTask from '../task/ReceiveVideoStreamIndexTask';
import SendAndReceiveDataMessagesTask from '../task/SendAndReceiveDataMessagesTask';
import SerialGroupTask from '../task/SerialGroupTask';
import SetLocalDescriptionTask from '../task/SetLocalDescriptionTask';
import SetRemoteDescriptionTask from '../task/SetRemoteDescriptionTask';
import SubscribeAndReceiveSubscribeAckTask from '../task/SubscribeAndReceiveSubscribeAckTask';
import Task from '../task/Task';
import TimeoutTask from '../task/TimeoutTask';
import WaitForAttendeePresenceTask from '../task/WaitForAttendeePresenceTask';
import DefaultTransceiverController from '../transceivercontroller/DefaultTransceiverController';
import SimulcastContentShareTransceiverController from '../transceivercontroller/SimulcastContentShareTransceiverController';
import SimulcastTransceiverController from '../transceivercontroller/SimulcastTransceiverController';
import VideoOnlyTransceiverController from '../transceivercontroller/VideoOnlyTransceiverController';
import { Maybe } from '../utils/Types';
import DefaultVideoCaptureAndEncodeParameter from '../videocaptureandencodeparameter/DefaultVideoCaptureAndEncodeParameter';
import AllHighestVideoBandwidthPolicy from '../videodownlinkbandwidthpolicy/AllHighestVideoBandwidthPolicy';
import VideoAdaptiveProbePolicy from '../videodownlinkbandwidthpolicy/VideoAdaptiveProbePolicy';
import { convertVideoPreferencesToSignalingClientVideoSubscriptionConfiguration } from '../videodownlinkbandwidthpolicy/VideoPreferences';
import VideoSource from '../videosource/VideoSource';
import DefaultVideoStreamIdSet from '../videostreamidset/DefaultVideoStreamIdSet';
import DefaultVideoStreamIndex from '../videostreamindex/DefaultVideoStreamIndex';
import SimulcastVideoStreamIndex from '../videostreamindex/SimulcastVideoStreamIndex';
import DefaultVideoTileController from '../videotilecontroller/DefaultVideoTileController';
import VideoTileController from '../videotilecontroller/VideoTileController';
import DefaultVideoTileFactory from '../videotilefactory/DefaultVideoTileFactory';
import DefaultSimulcastUplinkPolicy from '../videouplinkbandwidthpolicy/DefaultSimulcastUplinkPolicy';
import NScaleVideoUplinkBandwidthPolicy from '../videouplinkbandwidthpolicy/NScaleVideoUplinkBandwidthPolicy';
import SimulcastUplinkObserver from '../videouplinkbandwidthpolicy/SimulcastUplinkObserver';
import SimulcastUplinkPolicy from '../videouplinkbandwidthpolicy/SimulcastUplinkPolicy';
import DefaultVolumeIndicatorAdapter from '../volumeindicatoradapter/DefaultVolumeIndicatorAdapter';
import WebSocketAdapter from '../websocketadapter/WebSocketAdapter';
import AudioVideoControllerState from './AudioVideoControllerState';

export default class DefaultAudioVideoController
  implements AudioVideoController, SimulcastUplinkObserver, MediaStreamBrokerObserver, Destroyable {
  private _logger: Logger;
  private _configuration: MeetingSessionConfiguration;
  private _webSocketAdapter: WebSocketAdapter;
  private _realtimeController: RealtimeController;
  private _activeSpeakerDetector: ActiveSpeakerDetector;
  private _videoTileController: VideoTileController;
  private _mediaStreamBroker: MediaStreamBroker;
  private _reconnectController: ReconnectController;
  private _audioMixController: DefaultAudioMixController;
  private _eventController: EventController;
  private _audioProfile: AudioProfile = new AudioProfile();

  private connectionHealthData = new ConnectionHealthData();
  private observerQueue: Set<AudioVideoObserver> = new Set<AudioVideoObserver>();
  private meetingSessionContext = new AudioVideoControllerState();
  private sessionStateController: SessionStateController;

  private static MIN_VOLUME_DECIBELS = -42;
  private static MAX_VOLUME_DECIBELS = -14;
  private static PING_PONG_INTERVAL_MS = 10000;

  private enableSimulcast: boolean = false;
  private enableSVC: boolean = false;
  private useUpdateTransceiverControllerForUplink: boolean = false;
  private totalRetryCount = 0;
  private startAudioVideoTimestamp: number = 0;
  private signalingTask: Task;
  private preStartObserver: SignalingClientObserver | undefined;
  private mayNeedRenegotiationForSimulcastLayerChange: boolean = false;
  private maxUplinkBandwidthKbps: number;
  private videoSendCodecPreferences: VideoCodecCapability[];
  // Stored solely to trigger demotion callback on disconnection (expected behavior).
  //
  // We otherwise intentionally do not use this for any other behavior to avoid the complexity
  // of the added state.
  private promotedToPrimaryMeeting: boolean = false;
  private hasGetRTCPeerConnectionStatsDeprecationMessageBeenSent: boolean = false;

  // `connectWithPromises`, and `actionUpdateWithRenegotiation` all
  // contains a significant portion of asynchronous tasks, so we need to explicitly defer
  // any task operation which may be performed on the event queue that may modify
  // mutable state in `MeetingSessionContext`, as this mutable state needs to be consistent over the course of the update.
  //
  // Currently this includes
  // * `ReceiveVideoStreamIndexTask` which updates `videosToReceive` and `videoCaptureAndEncodeParameter`
  // * `MonitorTask` which updates `videosToReceive`
  private receiveIndexTask: ReceiveVideoStreamIndexTask | undefined = undefined;
  private monitorTask: MonitorTask | undefined = undefined;

  destroyed = false;

  constructor(
    configuration: MeetingSessionConfiguration,
    logger: Logger,
    webSocketAdapter: WebSocketAdapter,
    mediaStreamBroker: MediaStreamBroker,
    reconnectController: ReconnectController,
    eventController?: EventController
  ) {
    this._logger = logger;
    this.sessionStateController = new DefaultSessionStateController(this._logger);
    this._configuration = configuration;

    this._webSocketAdapter = webSocketAdapter;
    this._realtimeController = new DefaultRealtimeController(mediaStreamBroker);
    this._realtimeController.realtimeSetLocalAttendeeId(
      configuration.credentials.attendeeId,
      configuration.credentials.externalUserId
    );

    this._mediaStreamBroker = mediaStreamBroker;
    this._reconnectController = reconnectController;
    this._videoTileController = new DefaultVideoTileController(
      new DefaultVideoTileFactory(),
      this,
      this._logger
    );
    this._audioMixController = new DefaultAudioMixController(this._logger);
    this._mediaStreamBroker.addMediaStreamBrokerObserver(this._audioMixController);
    this.meetingSessionContext.logger = this._logger;
    this._eventController = eventController;
  }

  async destroy(): Promise<void> {
    this.observerQueue.clear();
    this._mediaStreamBroker.removeMediaStreamBrokerObserver(this._audioMixController);
    this.destroyed = true;
  }

  get configuration(): MeetingSessionConfiguration {
    return this._configuration;
  }

  get realtimeController(): RealtimeController {
    return this._realtimeController;
  }

  get activeSpeakerDetector(): ActiveSpeakerDetector {
    // Lazy init.
    if (!this._activeSpeakerDetector) {
      this._activeSpeakerDetector = new DefaultActiveSpeakerDetector(
        this._realtimeController,
        this._configuration.credentials.attendeeId,
        this.handleHasBandwidthPriority.bind(this)
      );
    }
    return this._activeSpeakerDetector;
  }

  get videoTileController(): VideoTileController {
    return this._videoTileController;
  }

  get audioMixController(): AudioMixController {
    return this._audioMixController;
  }

  get logger(): Logger {
    return this._logger;
  }

  get rtcPeerConnection(): RTCPeerConnection | null {
    return (this.meetingSessionContext && this.meetingSessionContext.peer) || null;
  }

  get mediaStreamBroker(): MediaStreamBroker {
    return this._mediaStreamBroker;
  }

  get eventController(): EventController | undefined {
    return this._eventController;
  }

  /**
   * This API will be deprecated in favor of `ClientMetricReport.getRTCStatsReport()`.
   *
   * It makes an additional call to the `getStats` API and therefore may cause slight performance degradation.
   *
   * Please subscribe to `metricsDidReceive(clientMetricReport: ClientMetricReport)` callback,
   * and get the raw `RTCStatsReport` via `clientMetricReport.getRTCStatsReport()`.
   */
  getRTCPeerConnectionStats(selector?: MediaStreamTrack): Promise<RTCStatsReport> {
    /* istanbul ignore else */
    if (!this.hasGetRTCPeerConnectionStatsDeprecationMessageBeenSent) {
      this.logger.warn(
        'The `getRTCPeerConnectionStats()` is on its way to be deprecated. It makes an additional call to the `getStats` API and therefore may cause slight performance degradation. Please use the new API `clientMetricReport.getRTCStatsReport()` returned by `metricsDidReceive(clientMetricReport)` callback instead.'
      );
      this.hasGetRTCPeerConnectionStatsDeprecationMessageBeenSent = true;
    }

    if (!this.rtcPeerConnection) {
      return null;
    }
    return this.rtcPeerConnection.getStats(selector);
  }

  setAudioProfile(audioProfile: AudioProfile): void {
    this._audioProfile = audioProfile;
  }

  addObserver(observer: AudioVideoObserver): void {
    this.logger.info('adding meeting observer');
    this.observerQueue.add(observer);
  }

  removeObserver(observer: AudioVideoObserver): void {
    this.logger.info('removing meeting observer');
    this.observerQueue.delete(observer);
  }

  forEachObserver(observerFunc: (observer: AudioVideoObserver) => void): void {
    for (const observer of this.observerQueue) {
      AsyncScheduler.nextTick(() => {
        if (this.observerQueue.has(observer)) {
          observerFunc(observer);
        }
      });
    }
  }

  private initSignalingClient(): void {
    this.connectionHealthData.reset();
    if (this.meetingSessionContext.signalingClient) {
      return;
    }

    this.meetingSessionContext = new AudioVideoControllerState();
    this.meetingSessionContext.logger = this.logger;
    this.meetingSessionContext.eventController = this.eventController;
    this.meetingSessionContext.browserBehavior = new DefaultBrowserBehavior();
    this.meetingSessionContext.videoSendCodecPreferences = this.videoSendCodecPreferences;
    this.meetingSessionContext.audioProfile = this._audioProfile;

    this.meetingSessionContext.meetingSessionConfiguration = this.configuration;
    this.meetingSessionContext.signalingClient = new DefaultSignalingClient(
      this._webSocketAdapter,
      this.logger
    );
  }

  private uninstallPreStartObserver(): void {
    this.meetingSessionContext.signalingClient.removeObserver(this.preStartObserver);
    this.preStartObserver = undefined;
  }

  private prestart(): Promise<void> {
    this.logger.info('Pre-connecting signaling connection.');
    return this.createOrReuseSignalingTask()
      .run()
      .then(() => {
        const handleClosed = async (): Promise<void> => {
          this.logger.info('Early connection closed; discarding signaling task.');
          this.signalingTask = undefined;
          this.uninstallPreStartObserver();
        };

        this.preStartObserver = {
          handleSignalingClientEvent(event: SignalingClientEvent): void {
            if (event.type === SignalingClientEventType.WebSocketClosed) {
              handleClosed();
            }
          },
        };

        this.meetingSessionContext.signalingClient.registerObserver(this.preStartObserver);
      })
      .catch(e => {
        this.logger.error(`Signaling task pre-start failed: ${e}`);

        // Clean up just in case a subsequent attempt will succeed.
        this.signalingTask = undefined;
      });
  }

  start(options?: { signalingOnly?: boolean }): void {
    this.startReturningPromise(options)
      .then(() => {
        this.logger.info('start completed');
      })
      // Just-in-case error handling.
      .catch(
        /* istanbul ignore next */
        e => {
          this.logger.error(`start failed: ${e}`);
        }
      );
  }

  // This is public (albeit marked internal) for tests only.
  /* @internal */
  startReturningPromise(options?: { signalingOnly?: boolean }): Promise<void> {
    if (options?.signalingOnly === true) {
      return this.prestart();
    }

    // For side-effects: lazy getter.
    this.activeSpeakerDetector;

    return new Promise((resolve, reject) => {
      this.sessionStateController.perform(SessionStateControllerAction.Connect, () => {
        this.actionConnect(false).then(resolve).catch(reject);
      });
    });
  }

  // @ts-ignore
  private connectWithPromises(needsToWaitForAttendeePresence: boolean): Task {
    const context = this.meetingSessionContext;

    // Syntactic sugar.
    const timeout = (timeoutMs: number, task: Task): TimeoutTask => {
      return new TimeoutTask(this.logger, task, timeoutMs);
    };

    // First layer.
    this.monitorTask = new MonitorTask(
      context,
      this.configuration.connectionHealthPolicyConfiguration,
      this.connectionHealthData
    );
    const monitor = this.monitorTask.once();

    // Second layer.
    const receiveAudioInput = new ReceiveAudioInputTask(context).once();
    this.receiveIndexTask = new ReceiveVideoStreamIndexTask(context);
    // See declaration (unpaused in actionFinishConnecting)
    this.monitorTask.pauseResubscribeCheck();
    this.receiveIndexTask.pauseIngestion();
    const signaling = new SerialGroupTask(this.logger, 'Signaling', [
      // If pre-connecting, this will be an existing task that has already been run.
      this.createOrReuseSignalingTask(),
      new ListenForVolumeIndicatorsTask(context),
      new SendAndReceiveDataMessagesTask(context),
      new JoinAndReceiveIndexTask(context),
      this.receiveIndexTask,
    ]).once();

    // Third layer.
    const createPeerConnection = new CreatePeerConnectionTask(context).once(signaling);
    const attachMediaInput = new AttachMediaInputTask(context).once(
      createPeerConnection,
      receiveAudioInput
    );

    // Mostly serial section -- kept as promises to allow for finer-grained breakdown.
    const createSDP = new CreateSDPTask(context).once(attachMediaInput);
    const setLocalDescription = new SetLocalDescriptionTask(context).once(createSDP);
    const ice = new FinishGatheringICECandidatesTask(context).once(setLocalDescription);
    const subscribeAck = new SubscribeAndReceiveSubscribeAckTask(context).once(ice);
    const receivePauseResume = new ReceiveRemoteVideoPauseResume(context).once(subscribeAck);

    // The ending is a delicate time: we need the connection as a whole to have a timeout,
    // and for the attendee presence timer to not start ticking until after the subscribe/ack.
    return new SerialGroupTask(this.logger, this.wrapTaskName('AudioVideoStart'), [
      monitor,
      timeout(
        this.configuration.connectionTimeoutMs,
        new SerialGroupTask(this.logger, 'Peer', [
          // The order of these two matters. If canceled, the first one that's still running
          // will contribute any special rejection, and we don't want that to be "attendee not found"!
          subscribeAck,
          receivePauseResume,
          needsToWaitForAttendeePresence
            ? new TimeoutTask(
                this.logger,
                new ParallelGroupTask(this.logger, 'FinalizeConnection', [
                  new WaitForAttendeePresenceTask(context),
                  new SetRemoteDescriptionTask(context),
                ]),
                this.meetingSessionContext.meetingSessionConfiguration.attendeePresenceTimeoutMs
              )
            : /* istanbul ignore next */ new SetRemoteDescriptionTask(context),
        ])
      ),
    ]);
  }

  private async actionConnect(reconnecting: boolean): Promise<void> {
    this.initSignalingClient();

    // We no longer need to watch for the early connection dropping; we're back where
    // we otherwise would have been had we not pre-started.
    this.uninstallPreStartObserver();

    // Note that some of the assignments in this function exist to clean up previous connections.
    // All future 'clean up' assignments should go in `AudioVideoControllerState.resetConnectionSpecificState`
    // for consolidation purposes.

    this.meetingSessionContext.mediaStreamBroker = this._mediaStreamBroker;
    this.meetingSessionContext.realtimeController = this._realtimeController;
    this.meetingSessionContext.audioMixController = this._audioMixController;
    this.meetingSessionContext.audioVideoController = this;

    this.enableSimulcast =
      this.configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers &&
      new DefaultBrowserBehavior().hasChromiumWebRTC();

    if (this.enableSimulcast && this.configuration.enableSVC) {
      this.logger.warn(
        'SVC cannot be enabled at the same time as simulcast. Disabling SVC, using simulcast.'
      );
    }
    this.enableSVC =
      !this.enableSimulcast &&
      this.configuration.enableSVC &&
      new DefaultBrowserBehavior().supportsScalableVideoCoding();

    const useAudioConnection: boolean = !!this.configuration.urls.audioHostURL;

    if (!useAudioConnection) {
      this.logger.info(`Using video only transceiver controller`);
      this.meetingSessionContext.transceiverController = new VideoOnlyTransceiverController(
        this.logger,
        this.meetingSessionContext.browserBehavior,
        this.meetingSessionContext
      );
    } else if (this.enableSimulcast) {
      this.logger.info(`Using transceiver controller with simulcast support`);
      if (
        new DefaultModality(this.configuration.credentials.attendeeId).hasModality(
          DefaultModality.MODALITY_CONTENT
        )
      ) {
        this.meetingSessionContext.transceiverController = new SimulcastContentShareTransceiverController(
          this.logger,
          this.meetingSessionContext.browserBehavior,
          this.meetingSessionContext
        );
      } else {
        this.meetingSessionContext.transceiverController = new SimulcastTransceiverController(
          this.logger,
          this.meetingSessionContext.browserBehavior,
          this.meetingSessionContext
        );
      }
    } else {
      this.logger.info(`Using default transceiver controller`);
      this.meetingSessionContext.transceiverController = new DefaultTransceiverController(
        this.logger,
        this.meetingSessionContext.browserBehavior,
        this.meetingSessionContext
      );
    }

    this.meetingSessionContext.volumeIndicatorAdapter = new DefaultVolumeIndicatorAdapter(
      this.logger,
      this._realtimeController,
      DefaultAudioVideoController.MIN_VOLUME_DECIBELS,
      DefaultAudioVideoController.MAX_VOLUME_DECIBELS,
      this.configuration.credentials.attendeeId
    );
    this.meetingSessionContext.videoTileController = this._videoTileController;
    this.meetingSessionContext.videoDownlinkBandwidthPolicy = this.configuration.videoDownlinkBandwidthPolicy;
    this.meetingSessionContext.videoUplinkBandwidthPolicy = this.configuration.videoUplinkBandwidthPolicy;
    this.meetingSessionContext.enableSimulcast = this.enableSimulcast;
    this.meetingSessionContext.enableSVC = this.enableSVC;

    if (this.enableSimulcast) {
      let simulcastPolicy = this.meetingSessionContext
        .videoUplinkBandwidthPolicy as SimulcastUplinkPolicy;
      if (!simulcastPolicy) {
        simulcastPolicy = new DefaultSimulcastUplinkPolicy(
          this.configuration.credentials.attendeeId,
          this.meetingSessionContext.logger
        );
        this.meetingSessionContext.videoUplinkBandwidthPolicy = simulcastPolicy;
      }

      simulcastPolicy.addObserver(this);

      if (!this.meetingSessionContext.videoDownlinkBandwidthPolicy) {
        this.meetingSessionContext.videoDownlinkBandwidthPolicy = new VideoAdaptiveProbePolicy(
          this.meetingSessionContext.logger
        );
      }

      this.meetingSessionContext.videoStreamIndex = new SimulcastVideoStreamIndex(this.logger);
    } else {
      this.meetingSessionContext.enableSimulcast = false;
      this.meetingSessionContext.videoStreamIndex = new DefaultVideoStreamIndex(this.logger);

      if (!this.meetingSessionContext.videoUplinkBandwidthPolicy) {
        this.meetingSessionContext.videoUplinkBandwidthPolicy = new NScaleVideoUplinkBandwidthPolicy(
          this.configuration.credentials.attendeeId,
          !this.meetingSessionContext.browserBehavior.disableResolutionScaleDown(),
          this.meetingSessionContext.logger,
          this.meetingSessionContext.browserBehavior
        );
        this.meetingSessionContext.videoUplinkBandwidthPolicy.setSVCEnabled(this.enableSVC);
      }
      if (!this.meetingSessionContext.videoDownlinkBandwidthPolicy) {
        this.meetingSessionContext.videoDownlinkBandwidthPolicy = new AllHighestVideoBandwidthPolicy(
          this.configuration.credentials.attendeeId
        );
      }

      if (
        this.meetingSessionContext.videoUplinkBandwidthPolicy.setTransceiverController &&
        this.meetingSessionContext.videoUplinkBandwidthPolicy.updateTransceiverController
      ) {
        this.useUpdateTransceiverControllerForUplink = true;
        this.meetingSessionContext.videoUplinkBandwidthPolicy.setTransceiverController(
          this.meetingSessionContext.transceiverController
        );
      }
      this.meetingSessionContext.audioProfile = this._audioProfile;
    }

    if (
      new DefaultModality(this.configuration.credentials.attendeeId).hasModality(
        DefaultModality.MODALITY_CONTENT
      )
    ) {
      const enableUhdContent =
        this.configuration.meetingFeatures.contentMaxResolution ===
        VideoQualitySettings.VideoResolutionUHD;
      if (enableUhdContent) {
        // Increase default bandwidth for content share since this is not yet configuration that can be exposed
        // without using simulcast
        this.setVideoMaxBandwidthKbps(2500);
      }
      this.meetingSessionContext.videoUplinkBandwidthPolicy.setHighResolutionFeatureEnabled(
        enableUhdContent
      );
    } else {
      const enableFhdVideo =
        this.configuration.meetingFeatures.videoMaxResolution ===
        VideoQualitySettings.VideoResolutionFHD;
      this.meetingSessionContext.videoUplinkBandwidthPolicy.setHighResolutionFeatureEnabled(
        enableFhdVideo
      );
    }

    if (this.meetingSessionContext.videoUplinkBandwidthPolicy && this.maxUplinkBandwidthKbps) {
      this.meetingSessionContext.videoUplinkBandwidthPolicy.setIdealMaxBandwidthKbps(
        this.maxUplinkBandwidthKbps
      );
    }

    if (this.meetingSessionContext.videoDownlinkBandwidthPolicy.bindToTileController) {
      this.meetingSessionContext.videoDownlinkBandwidthPolicy.bindToTileController(
        this._videoTileController
      );
    }

    if (this.meetingSessionContext.videoDownlinkBandwidthPolicy.setWantsResubscribeObserver) {
      this.meetingSessionContext.videoDownlinkBandwidthPolicy.setWantsResubscribeObserver(() =>
        this.update({ needsRenegotiation: false })
      );
    }

    this.meetingSessionContext.lastKnownVideoAvailability = new MeetingSessionVideoAvailability();
    this.meetingSessionContext.videoCaptureAndEncodeParameter = new DefaultVideoCaptureAndEncodeParameter(
      0,
      0,
      0,
      0,
      false
    );
    this.meetingSessionContext.videosToReceive = new DefaultVideoStreamIdSet();
    this.meetingSessionContext.videosPaused = new DefaultVideoStreamIdSet();
    this.meetingSessionContext.statsCollector = new StatsCollector(this, this.logger);
    this.meetingSessionContext.connectionMonitor = new SignalingAndMetricsConnectionMonitor(
      this,
      this._realtimeController,
      this.connectionHealthData,
      new DefaultPingPong(
        this.meetingSessionContext.signalingClient,
        DefaultAudioVideoController.PING_PONG_INTERVAL_MS,
        this.logger
      ),
      this.meetingSessionContext.statsCollector
    );
    this.meetingSessionContext.reconnectController = this._reconnectController;
    this.meetingSessionContext.videoDeviceInformation = {};

    if (!reconnecting) {
      this.totalRetryCount = 0;
      this._reconnectController.reset();
      this.startAudioVideoTimestamp = Date.now();
      this.forEachObserver(observer => {
        Maybe.of(observer.audioVideoDidStartConnecting).map(f => f.bind(observer)(false));
      });
      this.eventController?.publishEvent('meetingStartRequested');
    }

    this.meetingSessionContext.startAudioVideoTimestamp = this.startAudioVideoTimestamp;
    if (this._reconnectController.hasStartedConnectionAttempt()) {
      // This does not reset the reconnect deadline, but declare it's not the first connection.
      this._reconnectController.startedConnectionAttempt(false);
    } else {
      this._reconnectController.startedConnectionAttempt(true);
    }

    // No attendee presence event will be triggered if there is no audio connection.
    // Waiting for attendee presence is explicitly executed
    // if `attendeePresenceTimeoutMs` is configured to larger than 0.
    const needsToWaitForAttendeePresence =
      useAudioConnection &&
      this.meetingSessionContext.meetingSessionConfiguration.attendeePresenceTimeoutMs > 0;

    this.logger.info('Needs to wait for attendee presence? ' + needsToWaitForAttendeePresence);

    const connect = this.connectWithPromises(needsToWaitForAttendeePresence);

    // The rest.
    try {
      await connect.run();

      this.connectionHealthData.setConnectionStartTime();
      this._mediaStreamBroker.addMediaStreamBrokerObserver(this);
      this.sessionStateController.perform(SessionStateControllerAction.FinishConnecting, () => {
        /* istanbul ignore else */
        if (this.eventController) {
          this.meetingSessionContext.meetingStartDurationMs =
            Date.now() - this.startAudioVideoTimestamp;
          this.eventController.publishEvent('meetingStartSucceeded', {
            maxVideoTileCount: this.meetingSessionContext.maxVideoTileCount,
            poorConnectionCount: this.meetingSessionContext.poorConnectionCount,
            retryCount: this.totalRetryCount,
            signalingOpenDurationMs: this.meetingSessionContext.signalingOpenDurationMs,
            iceGatheringDurationMs: this.meetingSessionContext.iceGatheringDurationMs,
            meetingStartDurationMs: this.meetingSessionContext.meetingStartDurationMs,
          });
        }
        this.meetingSessionContext.startTimeMs = Date.now();
        this.actionFinishConnecting();
      });
    } catch (error) {
      this.signalingTask = undefined;
      const status = new MeetingSessionStatus(
        this.getMeetingStatusCode(error) || MeetingSessionStatusCode.TaskFailed
      );
      this.logger.info(`Start failed: ${status} due to error ${error}.`);

      // I am not able to successfully reach this state in the test suite with mock
      // websockets -- it always ends up in 'Disconnecting' instead. As such, this
      // has to be marked for Istanbul.
      /* istanbul ignore if */
      if (this.sessionStateController.state() === SessionStateControllerState.NotConnected) {
        // There's no point trying to 'disconnect', because we're not connected.
        // The session state controller will bail.
        this.logger.info('Start failed and not connected. Not cleaning up.');
        return;
      }

      this.sessionStateController.perform(SessionStateControllerAction.Fail, async () => {
        await this.actionDisconnect(status, true, error);
        if (!this.handleMeetingSessionStatus(status, error)) {
          this.notifyStop(status, error);
        }
      });
    }
  }

  private createOrReuseSignalingTask(): Task {
    if (!this.signalingTask) {
      this.initSignalingClient();
      this.signalingTask = new TimeoutTask(
        this.logger,
        new OpenSignalingConnectionTask(this.meetingSessionContext),
        this.configuration.connectionTimeoutMs
      ).once();
    }

    return this.signalingTask;
  }

  private actionFinishConnecting(): void {
    this.signalingTask = undefined;
    this.meetingSessionContext.videoDuplexMode = SdkStreamServiceType.RX;
    if (!this.meetingSessionContext.enableSimulcast) {
      if (this.useUpdateTransceiverControllerForUplink) {
        this.meetingSessionContext.videoUplinkBandwidthPolicy.updateTransceiverController();
      } else {
        this.enforceBandwidthLimitationForSender(
          this.meetingSessionContext.videoCaptureAndEncodeParameter.encodeBitrates()[0]
        );
      }
    }
    this.forEachObserver(observer => {
      Maybe.of(observer.audioVideoDidStart).map(f => f.bind(observer)());
    });
    this._reconnectController.reset();

    // `receiveIndexTask` needs to be resumed first so it can set `remoteStreamDescriptions`
    this.receiveIndexTask.resumeIngestion();
    this.monitorTask.resumeResubscribeCheck();
  }

  /* @internal */
  stopReturningPromise(): Promise<void> {
    // In order to avoid breaking backward compatibility, when only the
    // signaling connection is established we appear to not be connected.
    // We handle this by simply disconnecting the websocket directly.
    if (this.sessionStateController.state() === SessionStateControllerState.NotConnected) {
      // Unfortunately, this does not return a promise.
      this.meetingSessionContext.signalingClient?.closeConnection();
      this.cleanUpMediaStreamsAfterStop();
      return Promise.resolve();
    }

    /*
      Stops the current audio video meeting session.
      The stop method execution is deferred and executed after
      the current reconnection attempt completes.
      It disables any further reconnection attempts.
      Upon completion, AudioVideoObserver's `audioVideoDidStop`
      callback function is called with `MeetingSessionStatusCode.Left`.
    */
    return new Promise((resolve, reject) => {
      this.sessionStateController.perform(SessionStateControllerAction.Disconnect, () => {
        this._reconnectController.disableReconnect();
        this.logger.info('attendee left meeting, session will not be reconnected');
        this.actionDisconnect(new MeetingSessionStatus(MeetingSessionStatusCode.Left), false, null)
          .then(resolve)
          .catch(reject);
      });
    });
  }

  stop(): void {
    this.stopReturningPromise();
  }

  private async actionDisconnect(
    status: MeetingSessionStatus,
    reconnecting: boolean,
    error: Error | null
  ): Promise<void> {
    try {
      await new SerialGroupTask(this.logger, this.wrapTaskName('AudioVideoStop'), [
        new TimeoutTask(
          this.logger,
          new LeaveAndReceiveLeaveAckTask(this.meetingSessionContext),
          this.configuration.connectionTimeoutMs
        ),
      ]).run();
    } catch (stopError) {
      this.logger.info('fail to stop');
    }

    try {
      const subtasks: Task[] = [
        new TimeoutTask(
          this.logger,
          new CleanStoppedSessionTask(this.meetingSessionContext),
          this.configuration.connectionTimeoutMs
        ),
      ];
      this.cleanUpMediaStreamsAfterStop();
      await new SerialGroupTask(this.logger, this.wrapTaskName('AudioVideoClean'), subtasks).run();
    } catch (cleanError) {
      /* istanbul ignore next */
      this.logger.info('fail to clean');
    }
    this.sessionStateController.perform(SessionStateControllerAction.FinishDisconnecting, () => {
      if (!reconnecting) {
        this.notifyStop(status, error);
      }
    });
  }

  update(options: { needsRenegotiation: boolean } = { needsRenegotiation: true }): boolean {
    let needsRenegotiation = options.needsRenegotiation;

    // Check in case this function has been called before peer connection is set up
    // since that is necessary to try to update remote videos without the full resubscribe path
    needsRenegotiation ||= this.meetingSessionContext.peer === undefined;
    needsRenegotiation ||= !this.updateRemoteVideosFromPolicy();
    needsRenegotiation ||= !this.updateLocalVideoFromPolicy();
    // `MeetingSessionContext.lastVideosToReceive` needs to be updated regardless
    this.meetingSessionContext.lastVideosToReceive = this.meetingSessionContext.videosToReceive;
    if (!needsRenegotiation) {
      this.logger.info('Update request does not require resubscribe');
      // Call `actionFinishUpdating` to apply the new encoding parameters that may have been set in `updateLocalVideoFromPolicy`.
      this.actionFinishUpdating();
      return true; // Skip the subscribe!
    }
    this.logger.info('Update request requires resubscribe');

    const result = this.sessionStateController.perform(SessionStateControllerAction.Update, () => {
      this.actionUpdateWithRenegotiation(true);
    });
    return (
      result === SessionStateControllerTransitionResult.Transitioned ||
      result === SessionStateControllerTransitionResult.DeferredTransition
    );
  }

  // Depending on if using server-side bandwidth probing and if using server-side quality adaption,
  // decide if needs to send necessary updates, and if send through full renegotiaton.
  // It returns true if downlink policy took care of everything and no renegotiation needed.
  private updateRemoteVideosFromPolicy(): boolean {
    if (
      this.meetingSessionContext.videoDownlinkBandwidthPolicy &&
      this.meetingSessionContext.videoDownlinkBandwidthPolicy.getVideoPreferences !== undefined &&
      this.meetingSessionContext.videoDownlinkBandwidthPolicy.getServerSideNetworkAdaption !==
        undefined &&
      !serverSideNetworkAdaptionIsNoneOrDefault(
        this.meetingSessionContext.videoDownlinkBandwidthPolicy.getServerSideNetworkAdaption()
      )
    ) {
      // Send up-to-date video preferences to server. This is fine if it includes remote sources/MIDs we need a full renegotiation for (i.e.
      // ones that were added or removed). We will re-include these updates in the subscribe.
      /* istanbul ignore if: Extremely unlikely that `videosToReceive` is null */
      if (!this.sendRemoteVideoUpdate()) {
        return false;
      }

      if (
        this.meetingSessionContext.videoDownlinkBandwidthPolicy.getServerSideNetworkAdaption() ===
        ServerSideNetworkAdaption.BandwidthProbingAndRemoteVideoQualityAdaption
      ) {
        // If using server side remote video quality adaption (i.e. server is picking the encoding to send), we don't need
        // to do anything after sending the update, as long as we are not adding or removing streams, in which case
        // we need to complete a full renegotiation.
        return this.isNotAddingOrRemovingStreams();
      }
    }
    // If using client-side network adaptation, try skipping renegotitaiton if only simulcast stream swicth.
    return this.updateRemoteVideosIfNotAddingOrRemovingStreams();
  }

  // When `ServerSideNetworkAdaption.BandwidthProbingAndRemoteVideoQualityAdaption` has been signalled,
  // trigger server side video quality adaption logic through `SignalingClient.remoteVideoUpdate` and skip full subscribe.
  //
  // This function also tries to use the diff between `this.meetingSessionContext.lastVideosToReceive`
  // and `this.meetingSessionContext.videosToReceive` to determine if update is only simulcast stream switch,
  // which is accomplished through `SignalingClient.remoteVideoUpdate` rather than the full subscribe.
  //
  // It requires the caller to manage `this.meetingSessionContext.lastVideosToReceive`
  // and `this.meetingSessionContext.videosToReceive` so that `this.meetingSessionContext.lastVideosToReceive`
  // contains the stream IDs from either last time a subscribe was set, or last time this function was set.
  //
  // It will return true if successful, if false the caller must fall back to a full renegotiation
  private updateRemoteVideosIfNotAddingOrRemovingStreams(): boolean {
    const streamChanges = this.detectChangesInVideosToReceive();
    /* istanbul ignore if: Extremely unlikely that `videosToReceive` is null or missing requisite functions and made it this far */
    if (streamChanges === undefined) {
      return false;
    }

    const added: number[] = streamChanges.added;
    const simulcastStreamUpdates: Map<number, number> = streamChanges.simulcastStreamUpdates;
    const removed: number[] = streamChanges.removed;

    const context = this.meetingSessionContext;
    const updatedVideoSubscriptionConfigurations: SignalingClientVideoSubscriptionConfiguration[] = [];
    for (const [previousId, currentId] of simulcastStreamUpdates.entries()) {
      const updatedConfig = new SignalingClientVideoSubscriptionConfiguration();
      updatedConfig.streamId = currentId;
      updatedConfig.attendeeId = context.videoStreamIndex.attendeeIdForStreamId(currentId);
      updatedConfig.mid = context.transceiverController.getMidForStreamId(previousId);
      if (updatedConfig.mid === undefined) {
        this.logger.info(
          `No MID found for stream ID ${previousId}, cannot update stream without renegotiation`
        );
        return false;
      }
      updatedVideoSubscriptionConfigurations.push(updatedConfig);
      // We need to override some other components dependent on the subscribe paths for certain functionality
      context.transceiverController.setStreamIdForMid(updatedConfig.mid, currentId);
      context.videoStreamIndex.overrideStreamIdMappings(previousId, currentId);
      if (context.videoTileController.haveVideoTileForAttendeeId(updatedConfig.attendeeId)) {
        const tile = context.videoTileController.getVideoTileForAttendeeId(
          updatedConfig.attendeeId
        );
        if (!tile.setStreamId) {
          // Required function
          return false;
        }
        tile.setStreamId(currentId);
      }
    }
    // accomplish simulcast stream switches by sending removeVideoUpdate signaling frame instead of full renegotiation
    if (updatedVideoSubscriptionConfigurations.length !== 0) {
      context.signalingClient.remoteVideoUpdate(updatedVideoSubscriptionConfigurations, []);
    }

    // but cannot skip renegotiation if there are more changes than simulcast stream switch (i.e. add/remove/source switches)
    if (added.length !== 0 || removed.length !== 0) {
      return false;
    }
    // `updateRemoteVideosFromLastVideosToReceive` does not actually send a subscribe but it uses
    // `subscribeFrameSent` to cache the previous index so that we are able to do switches (not add/removes)
    // for simulcast stream layer changes. See `subscribeFrameSent` for more details.
    context.videoStreamIndex.remoteVideoUpdateSent();
    return true;
  }

  private detectChangesInVideosToReceive():
    | {
        added: number[];
        removed: number[];
        simulcastStreamUpdates: Map<number, number>;
      }
    | undefined {
    const context = this.meetingSessionContext;
    /* istanbul ignore next: Extremely unlikely that `videosToReceive` is null */
    if (context.videosToReceive === null) {
      return undefined;
    }

    // Check existence of all required dependencies and requisite functions
    if (
      !context.transceiverController ||
      !context.transceiverController.getMidForStreamId ||
      !context.transceiverController.setStreamIdForMid ||
      !context.videosToReceive.forEach ||
      !context.signalingClient.remoteVideoUpdate ||
      !context.videoStreamIndex.overrideStreamIdMappings
    ) {
      return undefined;
    }

    let added: number[] = [];
    const simulcastStreamUpdates: Map<number, number> = new Map();
    let removed: number[] = [];

    if (context.lastVideosToReceive === null) {
      added = context.videosToReceive.array();
    } else {
      const index = context.videoStreamIndex;
      context.videosToReceive.forEach((currentId: number) => {
        if (context.lastVideosToReceive.contain(currentId)) {
          return;
        }

        // Check if group ID exists in previous set (i.e. simulcast stream switch)
        let foundUpdatedPreviousStreamId = false;
        context.lastVideosToReceive.forEach((previousId: number) => {
          if (foundUpdatedPreviousStreamId) {
            return; // Short circuit since we have already found it
          }
          if (index.StreamIdsInSameGroup(previousId, currentId)) {
            simulcastStreamUpdates.set(previousId, currentId);
            foundUpdatedPreviousStreamId = true;
          }
        });
        if (!foundUpdatedPreviousStreamId) {
          // Otherwise this must be a new stream
          added.push(currentId);
        }
      });
      removed = context.lastVideosToReceive.array().filter(idFromPrevious => {
        const stillReceiving = context.videosToReceive.contain(idFromPrevious);
        const isUpdated = simulcastStreamUpdates.has(idFromPrevious);
        return !stillReceiving && !isUpdated;
      });
    }
    this.logger.info(
      `Request to update remote videos with added: [${added}], updated: [${Array.from(
        simulcastStreamUpdates.entries()
      )
        .map(([key, value]) => `${key}->${value}`)
        .join(',')}], removed: [${removed}]`
    );

    return {
      added,
      removed,
      simulcastStreamUpdates,
    };
  }

  private isNotAddingOrRemovingStreams(): boolean {
    const streamChanges = this.detectChangesInVideosToReceive();
    /* istanbul ignore if: Extremely unlikely that `videosToReceive` is null or missing requisite functions and made it this far */
    if (streamChanges === undefined) {
      return false;
    }
    const added: number[] = streamChanges.added;
    const removed: number[] = streamChanges.removed;
    // but cannot skip renegotiation if there are more changes than simulcast stream switch (i.e. add/remove/source switches)
    if (added.length !== 0 || removed.length !== 0) {
      return false;
    }

    // Similar to `updateRemoteVideosFromLastVideosToReceive`, we use `subscribeFrameSent` to cache the previous
    // index so that we don't incorrectly mark a simulcast stream change (e.g. a sender switching from publishing [1, 3] to [2] to [1, 3])
    // as the add or removal of a source
    this.meetingSessionContext.videoStreamIndex.remoteVideoUpdateSent();
    return true;
  }

  // This funtion should be called only when any server side network adaption feature is enabled.
  // It sends `RemoteVideoUpdate` frame to server to update remote video preferences, which is needed for server side bandwidth probing.
  // The `RemoteVideoUpdate` signaling frame maybe also trigger server side video quality adaption if such feature has been signalled.
  //
  // It requires the caller to manage `this.meetingSessionContext.lastVideosToReceive`
  // and `this.meetingSessionContext.videosToReceive` so that `this.meetingSessionContext.lastVideosToReceive`
  // contains the stream IDs from either last time a subscribe was set, or last time this function was set.
  //
  // It will return false if not receiving any remote videos or found new video sources with MID not set yet.
  // It will return true if sent current preferences to server. It maybe also triggered server side quality adaption..
  private sendRemoteVideoUpdate(): boolean {
    const context = this.meetingSessionContext;
    /* istanbul ignore next: Extremely unlikely that `videosToReceive` is null */
    if (context.videosToReceive === null) {
      return false;
    }

    const groupIdsToReceive = context.videosToReceive.array().map((streamId: number) => {
      return context.videoStreamIndex.groupIdForStreamId(streamId);
    });

    const currentConfigs = convertVideoPreferencesToSignalingClientVideoSubscriptionConfiguration(
      context,
      groupIdsToReceive,
      context.videoDownlinkBandwidthPolicy.getVideoPreferences()
    );

    const newVideoSubscriptionConfigurationsMap: Map<
      number,
      SignalingClientVideoSubscriptionConfiguration
    > = new Map();
    const addedOrUpdated: SignalingClientVideoSubscriptionConfiguration[] = [];
    for (const config of currentConfigs) {
      let shouldIncludeInUpdate = false;
      if (!context.lastVideoSubscriptionConfiguration.has(config.groupId)) {
        shouldIncludeInUpdate = true;
      } else {
        const lastConfig = context.lastVideoSubscriptionConfiguration.get(config.groupId);
        if (!config.equals(lastConfig)) {
          this.logger.debug(
            `${JSON.stringify(config)} does not equal ${JSON.stringify(lastConfig)}, sending update`
          );
          shouldIncludeInUpdate = true;
        }
      }

      newVideoSubscriptionConfigurationsMap.set(config.groupId, config);
      if (shouldIncludeInUpdate) {
        addedOrUpdated.push(config);
      }
    }
    context.lastVideoSubscriptionConfiguration = newVideoSubscriptionConfigurationsMap;

    const removedMids: string[] = [];
    if (context.lastVideosToReceive !== null) {
      const groupIdsToReceiveSet = new Set(groupIdsToReceive);
      for (const streamId of context.lastVideosToReceive.array()) {
        const groupId = context.videoStreamIndex.groupIdForStreamId(streamId);
        if (!groupIdsToReceiveSet.has(groupId)) {
          const mid = context.transceiverController.getMidForGroupId(groupId);
          if (mid === undefined) {
            context.logger.warn(`Could not find MID for group ID to remove: ${groupId}`);
            continue;
          }
          removedMids.push(mid);
        }
      }
    }

    // pass updated preference configurations to server for server-side bandwdith padding/probing
    // additionally, trigger server-side video quality adaption if enabed
    if (addedOrUpdated.length !== 0 || removedMids.length !== 0) {
      context.signalingClient.remoteVideoUpdate(addedOrUpdated, removedMids);
    }

    return true;
  }

  updateLocalVideoFromPolicy(): boolean {
    // Try updating parameters without renegotiation
    if (this.meetingSessionContext.enableSimulcast) {
      // The following may result in `this.mayNeedRenegotiationForSimulcastLayerChange` being switched on
      const encodingParam = this.meetingSessionContext.videoUplinkBandwidthPolicy.chooseEncodingParameters();
      if (
        this.mayNeedRenegotiationForSimulcastLayerChange &&
        this.meetingSessionContext.transceiverController.hasVideoInput() &&
        !this.negotiatedBitrateLayersAllocationRtpHeaderExtension()
      ) {
        this.logger.info('Needs regenotiation for local video simulcast layer change');
        this.mayNeedRenegotiationForSimulcastLayerChange = false;
        return false;
      }
      this.meetingSessionContext.transceiverController.setEncodingParameters(encodingParam);
    } else {
      this.meetingSessionContext.videoCaptureAndEncodeParameter = this.meetingSessionContext.videoUplinkBandwidthPolicy.chooseCaptureAndEncodeParameters();
      // Bitrate will be set in `actionFinishUpdating`. This should never need a resubscribe.
    }

    this.logger.info('Updated local video from policy without renegotiation');
    return true;
  }

  private negotiatedBitrateLayersAllocationRtpHeaderExtension(): boolean {
    if (!this.meetingSessionContext.transceiverController.localVideoTransceiver()) {
      return false;
    }
    const parameters = this.meetingSessionContext.transceiverController
      .localVideoTransceiver()
      .sender.getParameters();
    if (!parameters || !parameters.headerExtensions) {
      return false;
    }
    return parameters.headerExtensions.some(
      extension =>
        extension.uri === 'http://www.webrtc.org/experiments/rtp-hdrext/video-layers-allocation00'
    );
  }

  restartLocalVideo(callback: () => void): boolean {
    const restartVideo = async (): Promise<void> => {
      if (this._videoTileController.hasStartedLocalVideoTile()) {
        this.logger.info('stopping local video tile prior to local video restart');
        this._videoTileController.stopLocalVideoTile();
        this.logger.info('preparing local video restart update');
        await this.actionUpdateWithRenegotiation(false);
        this.logger.info('starting local video tile for local video restart');
        this._videoTileController.startLocalVideoTile();
      }
      this.logger.info('finalizing local video restart update');
      await this.actionUpdateWithRenegotiation(true);
      callback();
    };
    const result = this.sessionStateController.perform(SessionStateControllerAction.Update, () => {
      restartVideo();
    });
    return (
      result === SessionStateControllerTransitionResult.Transitioned ||
      result === SessionStateControllerTransitionResult.DeferredTransition
    );
  }

  async replaceLocalVideo(videoStream: MediaStream): Promise<void> {
    if (!videoStream || videoStream.getVideoTracks().length < 1) {
      throw new Error('could not acquire video track');
    }
    if (!this.meetingSessionContext || !this.meetingSessionContext.peer) {
      throw new Error('no active meeting and peer connection');
    }

    // if there is a local tile, a video tile update event should be fired.
    const localTile = this.meetingSessionContext.videoTileController.getLocalVideoTile();
    if (localTile) {
      const state = localTile.state();
      const settings = videoStream.getVideoTracks()[0].getSettings();
      // so tile update wil be fired.
      localTile.bindVideoStream(
        state.boundAttendeeId,
        true,
        videoStream,
        settings.width,
        settings.height,
        state.streamId,
        state.boundExternalUserId
      );
    }

    await this.meetingSessionContext.transceiverController.setVideoInput(
      videoStream.getVideoTracks()[0]
    );
    // Update the active video input on subscription context to match what we just changed
    // so that subsequent meeting actions can reuse and destroy it.
    this.meetingSessionContext.activeVideoInput = videoStream;

    this.logger.info('Local video input is updated');
  }

  async replaceLocalAudio(audioStream: MediaStream): Promise<void> {
    if (!audioStream || audioStream.getAudioTracks().length < 1) {
      throw new Error('could not acquire audio track');
    }
    if (!this.meetingSessionContext || !this.meetingSessionContext.peer) {
      throw new Error('no active meeting and peer connection');
    }
    this.connectionHealthData.reset();
    this.connectionHealthData.setConnectionStartTime();

    const replaceTrackSuccess = await this.meetingSessionContext.transceiverController.replaceAudioTrack(
      audioStream.getAudioTracks()[0]
    );
    if (!replaceTrackSuccess) {
      throw new Error('Failed to replace audio track');
    }
    this.meetingSessionContext.activeAudioInput = audioStream;
    this.logger.info('Local audio input is updated');
  }

  private async actionUpdateWithRenegotiation(notify: boolean): Promise<void> {
    // See declaration (unpaused in actionFinishUpdating)
    // The operations in `update` do not need this protection because they are synchronous.
    this.monitorTask.pauseResubscribeCheck();
    this.receiveIndexTask.pauseIngestion();

    // TODO: do not block other updates while waiting for video input
    try {
      await new SerialGroupTask(this.logger, this.wrapTaskName('AudioVideoUpdate'), [
        new ReceiveVideoInputTask(this.meetingSessionContext),
        new TimeoutTask(
          this.logger,
          new SerialGroupTask(this.logger, 'UpdateSession', [
            new AttachMediaInputTask(this.meetingSessionContext),
            new CreateSDPTask(this.meetingSessionContext),
            new SetLocalDescriptionTask(this.meetingSessionContext),
            new FinishGatheringICECandidatesTask(this.meetingSessionContext),
            new SubscribeAndReceiveSubscribeAckTask(this.meetingSessionContext),
            new SetRemoteDescriptionTask(this.meetingSessionContext),
          ]),
          this.configuration.connectionTimeoutMs
        ),
      ]).run();
      if (notify) {
        this.sessionStateController.perform(SessionStateControllerAction.FinishUpdating, () => {
          this.actionFinishUpdating();
        });
      }
    } catch (error) {
      this.sessionStateController.perform(SessionStateControllerAction.FinishUpdating, () => {
        const status = new MeetingSessionStatus(
          this.getMeetingStatusCode(error) || MeetingSessionStatusCode.TaskFailed
        );
        if (status.statusCode() !== MeetingSessionStatusCode.IncompatibleSDP) {
          this.logger.info('failed to update audio-video session');
        }
        this.handleMeetingSessionStatus(status, error);
      });
    }
  }

  private notifyStop(status: MeetingSessionStatus, error: Error | null): void {
    this.forEachObserver(observer => {
      Maybe.of(observer.audioVideoDidStop).map(f => f.bind(observer)(status));
    });

    /* istanbul ignore else */
    if (this.eventController) {
      const {
        signalingOpenDurationMs,
        poorConnectionCount,
        startTimeMs,
        iceGatheringDurationMs,
        attendeePresenceDurationMs,
        meetingStartDurationMs,
      } = this.meetingSessionContext;
      const attributes: AudioVideoEventAttributes = {
        maxVideoTileCount: this.meetingSessionContext.maxVideoTileCount,
        meetingDurationMs: startTimeMs === null ? 0 : Math.round(Date.now() - startTimeMs),
        meetingStatus: MeetingSessionStatusCode[status.statusCode()],
        signalingOpenDurationMs,
        iceGatheringDurationMs,
        attendeePresenceDurationMs,
        poorConnectionCount,
        meetingStartDurationMs,
        retryCount: this.totalRetryCount,
      };

      /* istanbul ignore next: toString is optional */
      const meetingErrorMessage = (error && error.message) || status.toString?.() || '';
      if (attributes.meetingDurationMs === 0) {
        attributes.meetingErrorMessage = meetingErrorMessage;
        delete attributes.meetingDurationMs;
        delete attributes.attendeePresenceDurationMs;
        delete attributes.meetingStartDurationMs;
        this.eventController.publishEvent('meetingStartFailed', attributes);
      } else if (status.isFailure() || status.isAudioConnectionFailure()) {
        attributes.meetingErrorMessage = meetingErrorMessage;
        this.eventController.publishEvent('meetingFailed', attributes);
      } else {
        this.eventController.publishEvent('meetingEnded', attributes);
      }
    }
  }

  private actionFinishUpdating(): void {
    // we do not update parameter for simulcast since they are updated in AttachMediaInputTask
    if (!this.meetingSessionContext.enableSimulcast) {
      if (this.useUpdateTransceiverControllerForUplink) {
        this.meetingSessionContext.videoUplinkBandwidthPolicy.updateTransceiverController();
      } else {
        const maxBitrateKbps = this.meetingSessionContext.videoCaptureAndEncodeParameter.encodeBitrates()[0];
        this.enforceBandwidthLimitationForSender(maxBitrateKbps);
      }
    }

    this.monitorTask.resumeResubscribeCheck();
    this.receiveIndexTask.resumeIngestion();

    this.logger.info('updated audio-video session');
  }

  reconnect(status: MeetingSessionStatus, error: Error | null): boolean {
    if (this.promotedToPrimaryMeeting) {
      // If the client was promoted, we 'demote' them so that we don't get in any
      // unusual or unexpected state on reconnect
      this.promotedToPrimaryMeeting = false;
      this.forEachObserver(observer => {
        Maybe.of(observer.audioVideoWasDemotedFromPrimaryMeeting).map(f =>
          f.bind(observer)(
            new MeetingSessionStatus(MeetingSessionStatusCode.AudioVideoDisconnectedWhilePromoted)
          )
        );
      });
    }

    const willRetry = this._reconnectController.retryWithBackoff(
      async () => {
        if (this.sessionStateController.state() === SessionStateControllerState.NotConnected) {
          this.sessionStateController.perform(SessionStateControllerAction.Connect, () => {
            this.actionConnect(true);
          });
        } else {
          this.sessionStateController.perform(SessionStateControllerAction.Reconnect, () => {
            this.actionReconnect(status);
          });
        }
        this.totalRetryCount += 1;
      },
      () => {
        this.logger.info('canceled retry');
      }
    );
    if (!willRetry) {
      this.sessionStateController.perform(SessionStateControllerAction.Fail, () => {
        this.actionDisconnect(status, false, error);
      });
    }

    return willRetry;
  }

  private async actionReconnect(status: MeetingSessionStatus): Promise<void> {
    if (!this._reconnectController.hasStartedConnectionAttempt()) {
      this._reconnectController.startedConnectionAttempt(false);
      this.forEachObserver(observer => {
        Maybe.of(observer.audioVideoDidStartConnecting).map(f => f.bind(observer)(true));
      });
    }

    this.meetingSessionContext.volumeIndicatorAdapter.onReconnect();
    this.connectionHealthData.reset();
    try {
      await new SerialGroupTask(this.logger, this.wrapTaskName('AudioVideoReconnect'), [
        new TimeoutTask(
          this.logger,
          new SerialGroupTask(this.logger, 'Media', [
            new CleanRestartedSessionTask(this.meetingSessionContext),
            new SerialGroupTask(this.logger, 'Signaling', [
              new OpenSignalingConnectionTask(this.meetingSessionContext),
              new JoinAndReceiveIndexTask(this.meetingSessionContext),
            ]),
            new CreatePeerConnectionTask(this.meetingSessionContext),
          ]),
          this.configuration.connectionTimeoutMs
        ),
        // TODO: Do we need ReceiveVideoInputTask in the reconnect operation?
        new ReceiveVideoInputTask(this.meetingSessionContext),
        new TimeoutTask(
          this.logger,
          new SerialGroupTask(this.logger, 'UpdateSession', [
            new AttachMediaInputTask(this.meetingSessionContext),
            new CreateSDPTask(this.meetingSessionContext),
            new SetLocalDescriptionTask(this.meetingSessionContext),
            new FinishGatheringICECandidatesTask(this.meetingSessionContext),
            new SubscribeAndReceiveSubscribeAckTask(this.meetingSessionContext),
            new SetRemoteDescriptionTask(this.meetingSessionContext),
          ]),
          this.configuration.connectionTimeoutMs
        ),
      ]).run();

      this.sessionStateController.perform(SessionStateControllerAction.FinishConnecting, () => {
        /* istanbul ignore else */
        if (this.eventController) {
          const {
            signalingOpenDurationMs,
            poorConnectionCount,
            startTimeMs,
            iceGatheringDurationMs,
            attendeePresenceDurationMs,
            meetingStartDurationMs,
          } = this.meetingSessionContext;
          const attributes: AudioVideoEventAttributes = {
            maxVideoTileCount: this.meetingSessionContext.maxVideoTileCount,
            meetingDurationMs: Math.round(Date.now() - startTimeMs),
            meetingStatus: MeetingSessionStatusCode[status.statusCode()],
            signalingOpenDurationMs,
            iceGatheringDurationMs,
            attendeePresenceDurationMs,
            poorConnectionCount,
            meetingStartDurationMs,
            retryCount: this.totalRetryCount,
          };
          this.eventController.publishEvent('meetingReconnected', attributes);
        }
        this.actionFinishConnecting();
      });
    } catch (error) {
      // To perform the "Reconnect" action again, the session should be in the "Connected" state.
      this.sessionStateController.perform(SessionStateControllerAction.FinishConnecting, () => {
        this.logger.info('failed to reconnect audio-video session');
        const status = new MeetingSessionStatus(
          this.getMeetingStatusCode(error) || MeetingSessionStatusCode.TaskFailed
        );
        this.handleMeetingSessionStatus(status, error);
      });
    }
    this.connectionHealthData.setConnectionStartTime();
  }

  private wrapTaskName(taskName: string): string {
    return `${taskName}/${this.configuration.meetingId}/${this.configuration.credentials.attendeeId}`;
  }

  private cleanUpMediaStreamsAfterStop(): void {
    this._mediaStreamBroker.removeMediaStreamBrokerObserver(this);
    this.meetingSessionContext.activeAudioInput = undefined;
    this.meetingSessionContext.activeVideoInput = undefined;
  }

  // Extract the meeting status from `Error.message`, relying on specific phrasing
  // 'the meeting status code ${CODE}`.
  //
  // e.g. reject(new Error(
  //        `canceling ${this.name()} due to the meeting status code: ${MeetingSessionStatusCode.MeetingEnded}`));
  private getMeetingStatusCode(error: Error): MeetingSessionStatusCode | null {
    const matched = /the meeting status code: (\d+)/.exec(error && error.message);
    if (matched && matched.length > 1) {
      return Number.parseInt(matched[1], 10);
    }
    return null;
  }

  private async enforceBandwidthLimitationForSender(maxBitrateKbps: number): Promise<void> {
    await this.meetingSessionContext.transceiverController.setVideoSendingBitrateKbps(
      maxBitrateKbps
    );
  }

  handleMeetingSessionStatus(status: MeetingSessionStatus, error: Error | null): boolean {
    this.logger.info(`handling status: ${MeetingSessionStatusCode[status.statusCode()]}`);
    if (!status.isTerminal()) {
      if (this.meetingSessionContext.statsCollector) {
        this.meetingSessionContext.statsCollector.logMeetingSessionStatus(status);
      }
    }
    if (status.statusCode() === MeetingSessionStatusCode.IncompatibleSDP) {
      this.restartLocalVideo(() => {
        this.logger.info('handled incompatible SDP by attempting to restart video');
      });
      return true;
    }
    if (status.statusCode() === MeetingSessionStatusCode.VideoCallSwitchToViewOnly) {
      this._videoTileController.removeLocalVideoTile();
      this.forEachObserver((observer: AudioVideoObserver) => {
        Maybe.of(observer.videoSendDidBecomeUnavailable).map(f => f.bind(observer)());
      });
      return false;
    }
    if (status.statusCode() === MeetingSessionStatusCode.AudioVideoWasRemovedFromPrimaryMeeting) {
      this.forEachObserver((observer: AudioVideoObserver) => {
        Maybe.of(observer.audioVideoWasDemotedFromPrimaryMeeting).map(f =>
          f.bind(observer)(status)
        );
      });
      return false;
    }
    if (status.isTerminal()) {
      this.logger.error('session will not be reconnected');
      if (this.meetingSessionContext.reconnectController) {
        this.meetingSessionContext.reconnectController.disableReconnect();
      }
    }
    if (status.isFailure() || status.isTerminal()) {
      if (this.meetingSessionContext.reconnectController) {
        const willRetry = this.reconnect(status, error);
        if (willRetry) {
          this.logger.warn(
            `will retry due to status code ${MeetingSessionStatusCode[status.statusCode()]}${
              error ? ` and error: ${error.message}` : ``
            }`
          );
        } else {
          this.logger.error(
            `failed with status code ${MeetingSessionStatusCode[status.statusCode()]}${
              error ? ` and error: ${error.message}` : ``
            }`
          );
        }
        return willRetry;
      }
    }
    return false;
  }

  setVideoMaxBandwidthKbps(maxBandwidthKbps: number): void {
    if (maxBandwidthKbps <= 0) {
      throw new Error('Max bandwidth kbps has to be greater than 0');
    }

    if (this.meetingSessionContext && this.meetingSessionContext.videoUplinkBandwidthPolicy) {
      this.logger.info(`video send has ideal max bandwidth ${maxBandwidthKbps} kbps`);
      this.meetingSessionContext.videoUplinkBandwidthPolicy.setIdealMaxBandwidthKbps(
        maxBandwidthKbps
      );
    }

    this.maxUplinkBandwidthKbps = maxBandwidthKbps;
  }

  async handleHasBandwidthPriority(hasBandwidthPriority: boolean): Promise<void> {
    if (
      this.meetingSessionContext &&
      this.meetingSessionContext.videoUplinkBandwidthPolicy &&
      !this.meetingSessionContext.enableSimulcast
    ) {
      if (this.useUpdateTransceiverControllerForUplink) {
        this.meetingSessionContext.videoUplinkBandwidthPolicy.setHasBandwidthPriority(
          hasBandwidthPriority
        );
        await this.meetingSessionContext.videoUplinkBandwidthPolicy.updateTransceiverController();
        return;
      }
      const oldMaxBandwidth = this.meetingSessionContext.videoUplinkBandwidthPolicy.maxBandwidthKbps();

      this.meetingSessionContext.videoUplinkBandwidthPolicy.setHasBandwidthPriority(
        hasBandwidthPriority
      );
      const newMaxBandwidth = this.meetingSessionContext.videoUplinkBandwidthPolicy.maxBandwidthKbps();

      if (oldMaxBandwidth !== newMaxBandwidth) {
        this.logger.info(
          `video send bandwidth priority ${hasBandwidthPriority} max has changed from ${oldMaxBandwidth} kbps to ${newMaxBandwidth} kbps`
        );
        await this.enforceBandwidthLimitationForSender(newMaxBandwidth);
      }
    }
  }

  pauseReceivingStream(streamId: number): void {
    if (!!this.meetingSessionContext && this.meetingSessionContext.signalingClient) {
      this.meetingSessionContext.signalingClient.pause([streamId]);
    }
  }

  resumeReceivingStream(streamId: number): void {
    if (!!this.meetingSessionContext && this.meetingSessionContext.signalingClient) {
      this.meetingSessionContext.signalingClient.resume([streamId]);
    }
  }

  setVideoCodecSendPreferences(preferences: VideoCodecCapability[]): void {
    this.videoSendCodecPreferences = preferences; // In case we haven't called `initSignalingClient` yet
    this.meetingSessionContext.videoSendCodecPreferences = preferences;
    if (this.sessionStateController.state() !== SessionStateControllerState.NotConnected) {
      this.update({ needsRenegotiation: true });
    }
  }

  getRemoteVideoSources(): VideoSource[] {
    const { videoStreamIndex } = this.meetingSessionContext;
    if (!videoStreamIndex) {
      this.logger.info('meeting has not started');
      return [];
    }
    const selfAttendeeId = this.configuration.credentials.attendeeId;
    return videoStreamIndex.allVideoSendingSourcesExcludingSelf(selfAttendeeId);
  }

  encodingSimulcastLayersDidChange(simulcastLayers: SimulcastLayers): void {
    this.mayNeedRenegotiationForSimulcastLayerChange = true;
    this.forEachObserver(observer => {
      Maybe.of(observer.encodingSimulcastLayersDidChange).map(f =>
        f.bind(observer)(simulcastLayers)
      );
    });
  }

  promoteToPrimaryMeeting(credentials: MeetingSessionCredentials): Promise<MeetingSessionStatus> {
    return this.actionPromoteToPrimaryMeeting(credentials);
  }

  private async actionPromoteToPrimaryMeeting(
    credentials: MeetingSessionCredentials
  ): Promise<MeetingSessionStatus> {
    let resultingStatus = new MeetingSessionStatus(MeetingSessionStatusCode.SignalingRequestFailed);
    await new SerialGroupTask(this.logger, this.wrapTaskName('PromoteToPrimaryMeeting'), [
      new TimeoutTask(
        this.logger,
        new PromoteToPrimaryMeetingTask(
          this.meetingSessionContext,
          credentials,
          (status: MeetingSessionStatus) => {
            resultingStatus = status;
          }
        ),
        this.configuration.connectionTimeoutMs
      ),
    ]).run();
    this.promotedToPrimaryMeeting = resultingStatus.statusCode() === MeetingSessionStatusCode.OK;
    return resultingStatus;
  }

  demoteFromPrimaryMeeting(): void {
    this.meetingSessionContext.signalingClient.demoteFromPrimaryMeeting();
    this.forEachObserver(observer => {
      Maybe.of(observer.audioVideoWasDemotedFromPrimaryMeeting).map(f =>
        f.bind(observer)(new MeetingSessionStatus(MeetingSessionStatusCode.OK))
      );
    });
  }

  async videoInputDidChange(videoStream: MediaStream | undefined): Promise<void> {
    this.logger.info('Receive a video input change event');
    // No active meeting, there is nothing to do
    if (!this.meetingSessionContext || !this.meetingSessionContext.peer) {
      this.logger.info(
        'Skip updating video input because there is no active meeting and peer connection'
      );
      return;
    }
    if (this._videoTileController.hasStartedLocalVideoTile()) {
      if (videoStream) {
        await this.replaceLocalVideo(videoStream);
      } else {
        this._videoTileController.stopLocalVideoTile();
      }
    }
  }

  async audioInputDidChange(audioStream: MediaStream | undefined): Promise<void> {
    this.logger.info('Receive an audio input change event');
    // No active meeting, there is nothing to do
    if (!this.meetingSessionContext || !this.meetingSessionContext.peer) {
      this.logger.info(
        'Skip updating audio input because there is no active meeting and peer connection'
      );
      return;
    }
    if (!audioStream) {
      // If audio input stream stopped, try to get empty audio device from media stream broker
      try {
        audioStream = await this.mediaStreamBroker.acquireAudioInputStream();
      } catch (error) {
        this.logger.error('Could not acquire audio track from mediaStreamBroker');
        return;
      }
    }
    await this.replaceLocalAudio(audioStream);
  }
}
