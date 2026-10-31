// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  AllHighestVideoBandwidthPolicy,
  ApplicationMetadata,
  AudioProfile,
  AudioVideoFacade,
  AudioVideoObserver,
  ClientMetricReport,
  ConsoleLogger,
  ContentShareObserver,
  DefaultActiveSpeakerPolicy,
  DefaultBrowserBehavior,
  DefaultDeviceController,
  DefaultEventController,
  DefaultMeetingSession,
  DefaultModality,
  DeviceChangeObserver,
  EventAttributes,
  EventName,
  EventObserver,
  Logger,
  LogLevel,
  MeetingSession,
  MeetingSessionConfiguration,
  MeetingSessionCredentials,
  MeetingSessionStatus,
  MeetingSessionVideoAvailability,
  SimulcastLayers,
  VideoCodecCapability,
  VideoDownlinkObserver,
  VideoPriorityBasedPolicy,
  VideoQualitySettings,
} from 'amazon-chime-sdk-js';

import { MeetingConfig } from '../config/MeetingConfig';
import ApiClient, { JoinInfo, JoinRequest } from './ApiClient';
import AudioDiagnostics from './AudioDiagnostics';
import { videoCodecSupport } from './codecSupport';
import SessionLogging from './SessionLogging';
import VoiceFocus from './VoiceFocus';

const SimulcastLayerMapping: Record<number, string> = {
  [SimulcastLayers.Low]: 'Low',
  [SimulcastLayers.LowAndMedium]: 'Low and Medium',
  [SimulcastLayers.LowAndHigh]: 'Low and High',
  [SimulcastLayers.Medium]: 'Medium',
  [SimulcastLayers.MediumAndHigh]: 'Medium and High',
  [SimulcastLayers.High]: 'High',
};

/** What the UI needs to hear about; implemented by the app and fed by the SDK observers below. */
export interface SessionDelegate {
  attendeePresence(
    attendeeId: string,
    present: boolean,
    externalUserId: string,
    dropped: boolean
  ): void;
  attendeeVolume(
    attendeeId: string,
    volume: number | null,
    muted: boolean | null,
    signalStrength: number | null
  ): void;
  activeSpeakers(attendeeIds: string[]): void;
  localMuteChanged(muted: boolean): void;
  canUnmuteChanged(canUnmute: boolean): void;
  metrics(report: ClientMetricReport): void;
  sessionConnecting(reconnecting: boolean): void;
  sessionStarted(): void;
  sessionStopped(status: MeetingSessionStatus): void;
  videoAvailabilityChanged(canStartLocalVideo: boolean): void;
  videoSendUnavailable(): void;
  videoInputStreamEnded(): void;
  contentShareStateChanged(started: boolean): void;
  demotedFromPrimary(status: MeetingSessionStatus): void;
  tilePausedByPolicy(tileId: number, paused: boolean): void;
  simulcastLayersChanged(description: string): void;
  connectionQualityChanged(poor: boolean): void;
  audioInputsChanged(devices: MediaDeviceInfo[]): void;
  videoInputsChanged(): void;
  audioOutputsChanged(): void;
  needDeviceLabels(): Promise<MediaStream>;
}

export interface AuthenticateResult {
  meetingId: string;
  attendeeId: string;
  externalUserId: string;
  region: string;
  primaryExternalMeetingId: string | undefined;
  videoDisabled: boolean;
  contentDisabled: boolean;
  videoIsFHD: boolean;
}

/**
 * Owns the SDK session: creating it from the join response, wiring observers to the delegate,
 * joining, leaving and tearing down. No DOM access.
 */
export default class MeetingSessionController
  implements AudioVideoObserver, VideoDownlinkObserver, EventObserver
{
  readonly browser = new DefaultBrowserBehavior();
  readonly voiceFocus: VoiceFocus;
  logger: Logger;
  private deviceChangeObserver: DeviceChangeObserver | undefined;
  private contentShareObserver: ContentShareObserver | undefined;
  meetingSession: MeetingSession | undefined;
  audioVideo: AudioVideoFacade | undefined;
  deviceController: DefaultDeviceController | undefined;
  webAudioEnabled = false;
  joinInfo: JoinInfo;
  primaryExternalMeetingId: string | undefined;
  appliedVideoMaxResolution = VideoQualitySettings.VideoResolutionHD;
  appliedContentMaxResolution = VideoQualitySettings.VideoResolutionFHD;
  readonly usingStereoProfile: boolean;

  private priorityBasedDownlinkPolicy: VideoPriorityBasedPolicy | undefined;
  private allHighestDownlinkPolicy: AllHighestVideoBandwidthPolicy | undefined;
  private readonly logging: SessionLogging;
  private primaryMeetingSessionCredentials: MeetingSessionCredentials | undefined;
  private canStartLocalVideo = true;

  private attendeeIdPresenceHandler:
    | ((attendeeId: string, present: boolean, externalUserId: string, dropped: boolean) => void)
    | undefined;
  private volumeHandlers = new Map<
    string,
    (
      attendeeId: string,
      volume: number | null,
      muted: boolean | null,
      signalStrength: number | null
    ) => void
  >();
  private activeSpeakerHandler: ((attendeeIds: string[]) => void) | undefined;
  private muteHandler: ((muted: boolean) => void) | undefined;
  private canUnmuteHandler: ((canUnmute: boolean) => void) | undefined;
  private audioDiagnostics = new AudioDiagnostics();

  constructor(
    private readonly config: MeetingConfig,
    private readonly api: ApiClient,
    private readonly delegate: SessionDelegate
  ) {
    this.logger = new ConsoleLogger('SDK', this.logLevel);
    this.logging = new SessionLogging(api, () => this.logLevel);
    this.voiceFocus = new VoiceFocus(config.voiceFocus, this.logLevel);
    this.usingStereoProfile = config.get('audioProfile') === 'fullband-music-stereo';
  }

  get logLevel(): LogLevel {
    switch (this.config.get('logLevel')) {
      case 'info':
        return LogLevel.INFO;
      case 'debug':
        return LogLevel.DEBUG;
      case 'warn':
        return LogLevel.WARN;
      case 'error':
        return LogLevel.ERROR;
      default:
        return LogLevel.OFF;
    }
  }

  get lastRedRecoveryDescription(): string {
    return this.audioDiagnostics.redRecoveryDescription;
  }

  get credentials(): MeetingSessionCredentials {
    return this.meetingSession!.configuration.credentials!;
  }

  get localAttendeeId(): string {
    return this.credentials.attendeeId!;
  }

  isSelfAttendee(attendeeId: string): boolean {
    const base = new DefaultModality(attendeeId).base();
    return (
      base === this.localAttendeeId || base === this.primaryMeetingSessionCredentials?.attendeeId
    );
  }

  private joinRequest(meeting: string, name: string): JoinRequest {
    const resolution = (value: string, map: Record<string, string>, fallback: string): string =>
      map[value] ?? fallback;
    return {
      meeting,
      name,
      region: this.config.region,
      primaryExternalMeetingId: this.config.get('replicaMeeting')
        ? this.config.get('primaryMeetingId') || undefined
        : undefined,
      audioCapability: this.config.get('audioCapability'),
      videoCapability: this.config.get('videoCapability'),
      contentCapability: this.config.get('contentCapability'),
      echoReduction: this.config.get('echoReduction'),
      videoMaxResolution: resolution(
        this.config.get('videoMaxResolution'),
        { fhd: 'FHD', none: 'None' },
        'HD'
      ) as JoinRequest['videoMaxResolution'],
      contentMaxResolution: resolution(
        this.config.get('contentMaxResolution'),
        { uhd: 'UHD', none: 'None' },
        'FHD'
      ) as JoinRequest['contentMaxResolution'],
      maxAttendeeCount: this.config.get('maxAttendeeCount'),
    };
  }

  async authenticate(): Promise<AuthenticateResult> {
    const override = this.config.joinInfoOverride;
    this.joinInfo = override
      ? override.JoinInfo
      : (await this.api.join(this.joinRequest(this.config.meeting, this.config.name))).JoinInfo;
    const configuration = new MeetingSessionConfiguration(
      this.joinInfo.Meeting,
      this.joinInfo.Attendee
    );
    this.config.region = this.joinInfo.Meeting.Meeting.MediaRegion;

    // Off by default: the model download happens when the user switches noise suppression on.
    if (this.config.get('noiseSuppression')) {
      await this.voiceFocus.checkSupport(this.joinInfo);
    }

    await this.initializeMeetingSession(configuration);
    this.primaryExternalMeetingId = this.joinInfo.PrimaryExternalMeetingId;

    const features = this.joinInfo.Meeting.Meeting.MeetingFeatures;
    switch (features?.Video?.MaxResolution) {
      case 'FHD':
        this.appliedVideoMaxResolution = VideoQualitySettings.VideoResolutionFHD;
        break;
      case 'None':
        this.appliedVideoMaxResolution = VideoQualitySettings.VideoDisabled;
        break;
      default:
        this.appliedVideoMaxResolution = VideoQualitySettings.VideoResolutionHD;
    }
    switch (features?.Content?.MaxResolution) {
      case 'UHD':
        this.appliedContentMaxResolution = VideoQualitySettings.VideoResolutionUHD;
        break;
      case 'None':
        this.appliedContentMaxResolution = VideoQualitySettings.VideoDisabled;
        break;
      default:
        this.appliedContentMaxResolution = VideoQualitySettings.VideoResolutionFHD;
    }

    return {
      meetingId: configuration.meetingId!,
      attendeeId: this.localAttendeeId,
      externalUserId: this.credentials.externalUserId!,
      region: this.config.region,
      primaryExternalMeetingId: this.primaryExternalMeetingId,
      videoDisabled: this.appliedVideoMaxResolution === VideoQualitySettings.VideoDisabled,
      contentDisabled: this.appliedContentMaxResolution === VideoQualitySettings.VideoDisabled,
      videoIsFHD: this.appliedVideoMaxResolution === VideoQualitySettings.VideoResolutionFHD,
    };
  }

  private async initializeMeetingSession(
    configuration: MeetingSessionConfiguration
  ): Promise<void> {
    this.logger = await this.logging.createLogger(configuration);
    const eventReporter = await this.logging.createEventReporter(configuration);

    this.webAudioEnabled =
      this.config.get('webAudio') ||
      (this.config.get('noiseSuppression') && this.voiceFocus.supported);
    this.deviceController = new DefaultDeviceController(this.logger, {
      enableWebAudio: this.webAudioEnabled,
    });

    const presenceTimeout = this.config.get('attendeePresenceTimeoutMs');
    if (presenceTimeout !== null) {
      configuration.attendeePresenceTimeoutMs = presenceTimeout;
    }
    configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = this.effectiveSimulcast;
    configuration.enableSVC = this.effectiveSVC;
    if (this.config.get('enableSimulcast') && !this.effectiveSimulcast) {
      this.logger.warn(
        `[DEMO] Simulcast requested but not available with ${this.config.get('videoCodec')} here`
      );
    }
    if (this.config.get('enableSVC') && !this.effectiveSVC) {
      this.logger.warn(
        `[DEMO] SVC requested but not available with ${this.config.get('videoCodec')} here`
      );
    }
    if (this.config.get('priorityDownlinkPolicy')) {
      this.priorityBasedDownlinkPolicy = new VideoPriorityBasedPolicy(this.logger);
      configuration.videoDownlinkBandwidthPolicy = this.priorityBasedDownlinkPolicy;
      this.priorityBasedDownlinkPolicy.addObserver(this);
    } else {
      this.allHighestDownlinkPolicy = new AllHighestVideoBandwidthPolicy(
        configuration.credentials!.attendeeId!
      );
      configuration.videoDownlinkBandwidthPolicy = this.allHighestDownlinkPolicy;
    }
    configuration.applicationMetadata = ApplicationMetadata.create(
      'amazon-chime-sdk-js-demo',
      '3.0.0'
    );
    configuration.keepLastFrameWhenPaused = true;

    const eventController = new DefaultEventController(configuration, this.logger, eventReporter);
    if (window.pendingEventObserver) {
      eventController.addObserver(window.pendingEventObserver);
    }
    this.meetingSession = new DefaultMeetingSession(
      configuration,
      this.logger,
      this.deviceController,
      eventController
    );

    const redundancy = !this.config.get('disableAudioRedundancy');
    let audioProfile = new AudioProfile(null, redundancy);
    switch (this.config.get('audioProfile')) {
      case 'fullband-speech-mono':
        audioProfile = AudioProfile.fullbandSpeechMono(redundancy);
        break;
      case 'fullband-music-mono':
        audioProfile = AudioProfile.fullbandMusicMono(redundancy);
        break;
      case 'fullband-music-stereo':
        audioProfile = AudioProfile.fullbandMusicStereo(redundancy);
        break;
    }
    this.logger.info(
      `[DEMO] Audio profile ${this.config.get('audioProfile')}, redundancy ${audioProfile.hasRedundancyEnabled()}`
    );
    this.meetingSession.audioVideo.setAudioProfile(audioProfile);
    this.meetingSession.audioVideo.setContentAudioProfile(audioProfile);

    this.audioVideo = this.meetingSession.audioVideo;
    this.deviceChangeObserver = {
      audioInputsChanged: devices => this.delegate.audioInputsChanged(devices ?? []),
      videoInputsChanged: () => this.delegate.videoInputsChanged(),
      audioOutputsChanged: () => this.delegate.audioOutputsChanged(),
      audioInputMuteStateChanged: (device, muted) =>
        this.logger.info(`[DEMO] Mute state: ${device} ${muted ? 'is muted' : 'is not muted'}`),
      audioInputStreamEnded: deviceId =>
        this.logger.info(`[DEMO] Audio input stream from ${deviceId} ended.`),
      videoInputStreamEnded: deviceId => {
        this.logger.info(`[DEMO] Video input stream from ${deviceId} ended.`);
        this.delegate.videoInputStreamEnded();
      },
    };
    this.audioVideo.addDeviceChangeObserver(this.deviceChangeObserver);
    this.setupDeviceLabelTrigger();
    this.setupRealtimeSubscriptions();
    this.audioVideo.addObserver(this);
    this.meetingSession.eventController?.addObserver(this);
    this.contentShareObserver = {
      contentShareDidStart: () => this.delegate.contentShareStateChanged(true),
      contentShareDidStop: () => this.delegate.contentShareStateChanged(false),
    };
    this.audioVideo.addContentShareObserver(this.contentShareObserver);

    const videoCodecs = MeetingSessionController.codecPreferences(this.config.get('videoCodec'));
    const contentCodecs = MeetingSessionController.codecPreferences(
      this.config.get('contentCodec')
    );
    if (videoCodecs.length > 0) {
      this.audioVideo.setVideoCodecSendPreferences?.(videoCodecs);
      this.audioVideo.setContentShareVideoCodecPreferences?.(videoCodecs);
    }
    if (contentCodecs.length > 0) {
      this.audioVideo.setContentShareVideoCodecPreferences?.(contentCodecs);
    }
  }

  /** Simulcast is Chromium-only and incompatible with VP9/AV1 and with SVC. */
  get effectiveSimulcast(): boolean {
    return (
      this.config.get('enableSimulcast') &&
      videoCodecSupport(this.browser, this.config.get('videoCodec')).simulcast
    );
  }

  get effectiveSVC(): boolean {
    return (
      this.config.get('enableSVC') &&
      !this.effectiveSimulcast &&
      videoCodecSupport(this.browser, this.config.get('videoCodec')).svc
    );
  }

  get downlinkPolicy(): VideoPriorityBasedPolicy | AllHighestVideoBandwidthPolicy {
    return this.priorityBasedDownlinkPolicy ?? this.allHighestDownlinkPolicy!;
  }

  static codecPreferences(chosen: string): VideoCodecCapability[] {
    // Always fall back to widely available codecs (H.264 CBP, VP8) behind the preferred one.
    switch (chosen) {
      case 'vp8':
        return [VideoCodecCapability.vp8()];
      case 'h264ConstrainedBaselineProfile':
        return [VideoCodecCapability.h264ConstrainedBaselineProfile(), VideoCodecCapability.vp8()];
      case 'h264BaselineProfile':
        return [
          VideoCodecCapability.h264BaselineProfile(),
          VideoCodecCapability.h264ConstrainedBaselineProfile(),
          VideoCodecCapability.vp8(),
        ];
      case 'h264MainProfile':
        return [
          VideoCodecCapability.h264MainProfile(),
          VideoCodecCapability.h264ConstrainedBaselineProfile(),
          VideoCodecCapability.vp8(),
        ];
      case 'h264HighProfile':
        return [
          VideoCodecCapability.h264HighProfile(),
          VideoCodecCapability.h264ConstrainedHighProfile(),
          VideoCodecCapability.h264ConstrainedBaselineProfile(),
          VideoCodecCapability.vp8(),
        ];
      case 'av1Main':
        return [
          VideoCodecCapability.av1Main(),
          VideoCodecCapability.h264ConstrainedBaselineProfile(),
          VideoCodecCapability.vp8(),
        ];
      case 'vp9Profile0':
        return [
          VideoCodecCapability.vp9Profile0(),
          VideoCodecCapability.h264ConstrainedBaselineProfile(),
          VideoCodecCapability.vp8(),
        ];
      default:
        return [];
    }
  }

  private setupDeviceLabelTrigger(): void {
    // Device labels are privileged; the SDK asks us for a stream to unlock them. Show the
    // permission card while the browser prompt is up.
    if (this.browser.doesNotSupportMediaDeviceLabels()) {
      return;
    }
    this.audioVideo!.setDeviceLabelTrigger(async (): Promise<MediaStream> => {
      if (this.config.role !== 'attendee' || this.config.get('viewOnly')) {
        throw new Error('Recorder or Broadcaster does not need device labels');
      }
      return this.delegate.needDeviceLabels();
    });
  }

  private setupRealtimeSubscriptions(): void {
    const audioVideo = this.audioVideo!;
    this.muteHandler = muted => this.delegate.localMuteChanged(muted);
    audioVideo.realtimeSubscribeToMuteAndUnmuteLocalAudio(this.muteHandler);
    this.canUnmuteHandler = canUnmute => this.delegate.canUnmuteChanged(canUnmute);
    audioVideo.realtimeSubscribeToSetCanUnmuteLocalAudio(this.canUnmuteHandler);

    this.attendeeIdPresenceHandler = (attendeeId, present, externalUserId, dropped) => {
      this.logger.info(
        `[DEMO] ${attendeeId} present = ${present} (${externalUserId}) dropped = ${dropped}`
      );
      if (!present) {
        const handler = this.volumeHandlers.get(attendeeId);
        if (handler) {
          audioVideo.realtimeUnsubscribeFromVolumeIndicator(attendeeId, handler);
          this.volumeHandlers.delete(attendeeId);
        }
      } else if (!this.volumeHandlers.has(attendeeId)) {
        const handler = (
          id: string,
          volume: number | null,
          muted: boolean | null,
          signalStrength: number | null
        ): void => {
          this.delegate.attendeeVolume(
            id,
            volume,
            muted,
            signalStrength === null ? null : Math.round(signalStrength * 100)
          );
        };
        this.volumeHandlers.set(attendeeId, handler);
        audioVideo.realtimeSubscribeToVolumeIndicator(attendeeId, handler);
      }
      this.delegate.attendeePresence(attendeeId, present, externalUserId, dropped);
    };
    audioVideo.realtimeSubscribeToAttendeeIdPresence(this.attendeeIdPresenceHandler);

    this.activeSpeakerHandler = attendeeIds => this.delegate.activeSpeakers(attendeeIds);
    audioVideo.subscribeToActiveSpeakerDetector(
      new DefaultActiveSpeakerPolicy(),
      this.activeSpeakerHandler
    );
  }

  async join(): Promise<void> {
    if (this.config.get('joinMuted') || this.config.get('viewOnly')) {
      this.audioVideo!.realtimeMuteLocalAudio();
    }
    this.audioVideo!.start();
  }

  startSignalingOnly(): void {
    if (this.config.get('joinMuted')) {
      this.audioVideo!.realtimeMuteLocalAudio();
    }
    this.audioVideo!.start({ signalingOnly: true });
  }

  async leave(): Promise<void> {
    this.audioVideo?.stop();
  }

  async endMeeting(): Promise<void> {
    await this.api.endMeeting(this.config.meeting);
    await this.leave();
  }

  async promoteToPrimaryMeeting(): Promise<MeetingSessionStatus> {
    this.logger.info('[DEMO] Attempting to promote self to primary meeting from replica');
    if (!this.primaryMeetingSessionCredentials) {
      const joinInfo = (
        await this.api.join(
          this.joinRequest(this.primaryExternalMeetingId!, `promoted-${this.config.name}`)
        )
      ).JoinInfo;
      // Reuse MeetingSessionConfiguration to parse the CreateAttendee response into credentials.
      this.primaryMeetingSessionCredentials = new MeetingSessionConfiguration(
        joinInfo.Meeting,
        joinInfo.Attendee
      ).credentials!;
    }
    return this.audioVideo!.promoteToPrimaryMeeting(this.primaryMeetingSessionCredentials);
  }

  async demoteFromPrimaryMeeting(): Promise<void> {
    this.logger.info('[DEMO] Demoting from primary meeting');
    this.audioVideo!.demoteFromPrimaryMeeting();
  }

  audioVideoDidStartConnecting(reconnecting: boolean): void {
    this.logger.info(`[DEMO] session connecting. reconnecting: ${reconnecting}`);
    this.delegate.sessionConnecting(reconnecting);
  }

  audioVideoDidStart(): void {
    this.logger.info('[DEMO] session started');
    this.delegate.sessionStarted();
  }

  audioVideoDidStop(sessionStatus: MeetingSessionStatus): void {
    this.logger.info(`[DEMO] session stopped from ${JSON.stringify(sessionStatus)}`);
    this.delegate.sessionStopped(sessionStatus);
  }

  audioVideoWasDemotedFromPrimaryMeeting(status: MeetingSessionStatus): void {
    this.delegate.demotedFromPrimary(status);
  }

  videoAvailabilityDidChange(availability: MeetingSessionVideoAvailability): void {
    const changed = this.canStartLocalVideo !== availability.canStartLocalVideo;
    this.canStartLocalVideo = availability.canStartLocalVideo;
    this.logger.info(
      `[DEMO] video availability changed: canStartLocalVideo ${availability.canStartLocalVideo}`
    );
    if (changed && !this.audioVideo!.hasStartedLocalVideoTile()) {
      this.delegate.videoAvailabilityChanged(this.canStartLocalVideo);
    }
  }

  get canStartVideo(): boolean {
    return this.canStartLocalVideo;
  }

  videoSendDidBecomeUnavailable(): void {
    this.logger.info('[DEMO] sending video is not available');
    this.delegate.videoSendUnavailable();
  }

  connectionDidBecomePoor(): void {
    this.logger.info('[DEMO] connection is poor');
    this.delegate.connectionQualityChanged(true);
  }

  connectionDidSuggestStopVideo(): void {
    this.logger.info('[DEMO] suggest turning the video off');
  }

  connectionDidBecomeGood(): void {
    this.logger.info('[DEMO] connection is good now');
    this.delegate.connectionQualityChanged(false);
  }

  encodingSimulcastLayersDidChange(simulcastLayers: SimulcastLayers): void {
    const description = SimulcastLayerMapping[simulcastLayers];
    this.logger.info(`[DEMO] current active simulcast layers changed to: ${description}`);
    this.delegate.simulcastLayersChanged(description);
  }

  tileWillBePausedByDownlinkPolicy(tileId: number): void {
    this.logger.info(`[DEMO] Tile ${tileId} will be paused due to insufficient bandwidth`);
    this.delegate.tilePausedByPolicy(tileId, true);
  }

  tileWillBeUnpausedByDownlinkPolicy(tileId: number): void {
    this.logger.info(`[DEMO] Tile ${tileId} will be resumed due to sufficient bandwidth`);
    this.delegate.tilePausedByPolicy(tileId, false);
  }

  metricsDidReceive(clientMetricReport: ClientMetricReport): void {
    this.audioDiagnostics.observe(clientMetricReport);
    this.delegate.metrics(clientMetricReport);
  }

  eventDidReceive(name: EventName, attributes: EventAttributes): void {
    this.logger.info(`[DEMO] Received an event: ${JSON.stringify({ name, attributes })}`);
    this.logging.logEvent(name, attributes);
  }

  async relayProtocol(): Promise<string> {
    const rawStats = await this.audioVideo?.getRTCPeerConnectionStats();
    let result = 'unknown';
    rawStats?.forEach(report => {
      if (report.type === 'local-candidate' && typeof report.relayProtocol === 'string') {
        result = report.relayProtocol.toUpperCase();
      }
    });
    return result;
  }

  /** Inverse of initialization; only needed because the page keeps living after the meeting. */
  async cleanUp(): Promise<void> {
    const audioVideo = this.audioVideo;
    if (!audioVideo) {
      return;
    }
    if (this.activeSpeakerHandler) {
      audioVideo.unsubscribeFromActiveSpeakerDetector(this.activeSpeakerHandler);
    }
    if (this.attendeeIdPresenceHandler) {
      audioVideo.realtimeUnsubscribeToAttendeeIdPresence(this.attendeeIdPresenceHandler);
    }
    for (const [attendeeId, handler] of this.volumeHandlers) {
      audioVideo.realtimeUnsubscribeFromVolumeIndicator(attendeeId, handler);
    }
    this.volumeHandlers.clear();
    if (this.muteHandler) {
      audioVideo.realtimeUnsubscribeToMuteAndUnmuteLocalAudio(this.muteHandler);
    }
    if (this.canUnmuteHandler) {
      audioVideo.realtimeUnsubscribeToSetCanUnmuteLocalAudio(this.canUnmuteHandler);
    }
    audioVideo.removeObserver(this);
    if (this.deviceChangeObserver) {
      audioVideo.removeDeviceChangeObserver(this.deviceChangeObserver);
    }
    if (this.contentShareObserver) {
      audioVideo.removeContentShareObserver(this.contentShareObserver);
    }
    this.meetingSession?.eventController?.removeObserver(this);
    audioVideo.stopLocalVideoTile();
    audioVideo.unbindAudioElement();
    await this.deviceController?.destroy();
    this.logging.teardown();
    this.audioVideo = undefined;
    this.meetingSession = undefined;
    // Per-session state, so a rejoin in the same page starts from scratch.
    this.priorityBasedDownlinkPolicy = undefined;
    this.allHighestDownlinkPolicy = undefined;
    this.primaryMeetingSessionCredentials = undefined;
    this.primaryExternalMeetingId = undefined;
    this.deviceChangeObserver = undefined;
    this.contentShareObserver = undefined;
    this.canStartLocalVideo = true;
    this.audioDiagnostics = new AudioDiagnostics();
  }
}
