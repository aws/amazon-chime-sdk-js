// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import './styleV2.scss';

import {
  ApplicationMetadata,
  AsyncScheduler,
  Attendee,
  AudioInputDevice,
  AudioProfile,
  AudioVideoFacade,
  AudioVideoObserver,
  BackgroundBlurProcessor,
  BackgroundBlurVideoFrameProcessor,
  BackgroundBlurVideoFrameProcessorObserver,
  BackgroundReplacementProcessor,
  BackgroundReplacementVideoFrameProcessor,
  BackgroundReplacementVideoFrameProcessorObserver,
  BackgroundReplacementOptions,
  ClientMetricReport,
  ConsoleLogger,
  ContentShareObserver,
  DataMessage,
  DefaultActiveSpeakerPolicy,
  DefaultAudioVideoController,
  DefaultBrowserBehavior,
  DefaultDeviceController,
  DefaultMeetingEventReporter,
  DefaultMeetingSession,
  DefaultModality,
  DefaultVideoTransformDevice,
  Device,
  DeviceChangeObserver,
  EventAttributes,
  EventIngestionConfiguration,
  EventName,
  EventReporter,
  LogLevel,
  Logger,
  MeetingEventsClientConfiguration,
  MeetingSession,
  MeetingSessionConfiguration,
  MeetingSessionStatus,
  MeetingSessionStatusCode,
  VideoFxProcessor,
  MeetingSessionVideoAvailability,
  MultiLogger,
  NoOpEventReporter,
  NoOpVideoFrameProcessor,
  VideoFxConfig,
  RemovableAnalyserNode,
  SimulcastLayers,
  Transcript,
  TranscriptEvent,
  TranscriptionStatus,
  TranscriptionStatusType,
  TranscriptItemType,
  TranscriptResult,
  Versioning,
  VideoDownlinkObserver,
  VideoFrameProcessor,
  VideoInputDevice,
  VideoPriorityBasedPolicy,
  VideoQualitySettings,
  VoiceFocusDeviceTransformer,
  VoiceFocusModelComplexity,
  VoiceFocusModelName,
  VoiceFocusPaths,
  VoiceFocusSpec,
  VoiceFocusTransformDevice,
  isAudioTransformDevice,
  isDestroyable,
  BackgroundFilterSpec,
  BackgroundFilterPaths,
  ModelSpecBuilder,
  DefaultEventController,
  MeetingSessionCredentials,
  POSTLogger,
  VideoCodecCapability,
  AllHighestVideoBandwidthPolicy,
} from 'amazon-chime-sdk-js';
import { Modal } from 'bootstrap';

import TestSound from './audio/TestSound';
import MeetingToast from './util/MeetingToast'; MeetingToast; // Make sure this file is included in webpack
import VideoTileCollection from './video/VideoTileCollection'
import RemoteVideoManager from './video/RemoteVideoManager';
import CircularCut from './video/filters/CircularCut';
import EmojifyVideoFrameProcessor from './video/filters/EmojifyVideoFrameProcessor';
import SegmentationProcessor from './video/filters/SegmentationProcessor';
import ResizeProcessor from './video/filters/ResizeProcessor';
import {
  loadBodyPixDependency,
  platformCanSupportBodyPixWithoutDegradation,
} from './video/filters/SegmentationUtil';
import SyntheticVideoDeviceFactory from './video/SyntheticVideoDeviceFactory';
import { getPOSTLogger } from './util/MeetingLogger';
import Roster from './component/Roster';
import ContentShareManager from './component/ContentShareManager';
import { AudioBufferMediaStreamProvider, SynthesizedStereoMediaStreamProvider } from './util/mediastreamprovider/DemoMediaStreamProviders';
import { BackgroundImageEncoding } from './util/BackgroundImage';

let SHOULD_EARLY_CONNECT = (() => {
  return document.location.search.includes('earlyConnect=1');
})();

let SHOULD_DIE_ON_FATALS = (() => {
  const isLocal = document.location.host === '127.0.0.1:8080' || document.location.host === 'localhost:8080';
  const fatalYes = document.location.search.includes('fatal=1');
  const fatalNo = document.location.search.includes('fatal=0');
  return fatalYes || (isLocal && !fatalNo);
})();


export let fatal: (e: Error) => void;

// This shim is needed to avoid warnings when supporting Safari.
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext
  }
}

// Support a set of query parameters to allow for testing pre-release versions of
// Amazon Voice Focus. If none of these parameters are supplied, the SDK default
// values will be used.
const search = new URLSearchParams(document.location.search);
const VOICE_FOCUS_NAME = search.get('voiceFocusName') || undefined;
const VOICE_FOCUS_CDN = search.get('voiceFocusCDN') || undefined;
const VOICE_FOCUS_ASSET_GROUP = search.get('voiceFocusAssetGroup') || undefined;
const VOICE_FOCUS_REVISION_ID = search.get('voiceFocusRevisionID') || undefined;

const VOICE_FOCUS_PATHS: VoiceFocusPaths | undefined = VOICE_FOCUS_CDN && {
  processors: `${VOICE_FOCUS_CDN}processors/`,
  wasm: `${VOICE_FOCUS_CDN}wasm/`,
  workers: `${VOICE_FOCUS_CDN}workers/`,
  models: `${VOICE_FOCUS_CDN}wasm/`,
};

function voiceFocusName(name: string | undefined = VOICE_FOCUS_NAME): VoiceFocusModelName | undefined {
  if (name && ['default', 'ns_es'].includes(name)) {
    return name as VoiceFocusModelName;
  }
  return undefined;
}

const VOICE_FOCUS_SPEC = {
  name: voiceFocusName(),
  assetGroup: VOICE_FOCUS_ASSET_GROUP,
  revisionID: VOICE_FOCUS_REVISION_ID,
  paths: VOICE_FOCUS_PATHS,
};

function getVoiceFocusSpec(joinInfo: any): VoiceFocusSpec {
  const es = joinInfo.Meeting.Meeting?.MeetingFeatures?.Audio?.EchoReduction === 'AVAILABLE';
  let spec: VoiceFocusSpec = VOICE_FOCUS_SPEC;
  if (!spec.name) {
    spec.name = es ? voiceFocusName('ns_es') : voiceFocusName('default');
  }
  return spec;
};

const MAX_VOICE_FOCUS_COMPLEXITY: VoiceFocusModelComplexity | undefined = undefined;

const BACKGROUND_BLUR_CDN = search.get('blurCDN') || undefined;
const BACKGROUND_BLUR_ASSET_GROUP = search.get('blurAssetGroup') || undefined;
const BACKGROUND_BLUR_REVISION_ID = search.get('blurRevisionID') || undefined;

const BACKGROUND_BLUR_PATHS: BackgroundFilterPaths = BACKGROUND_BLUR_CDN && {
  worker: `${BACKGROUND_BLUR_CDN}/bgblur/workers/worker.js`,
  wasm: `${BACKGROUND_BLUR_CDN}/bgblur/wasm/_cwt-wasm.wasm`,
  simd: `${BACKGROUND_BLUR_CDN}/bgblur/wasm/_cwt-wasm-simd.wasm`,
};
const BACKGROUND_BLUR_MODEL = BACKGROUND_BLUR_CDN && ModelSpecBuilder.builder()
    .withSelfieSegmentationDefaults()
    .withPath(`${BACKGROUND_BLUR_CDN}/bgblur/models/selfie_segmentation_landscape.tflite`)
    .build();
const BACKGROUND_BLUR_ASSET_SPEC = (BACKGROUND_BLUR_ASSET_GROUP || BACKGROUND_BLUR_REVISION_ID) && {
  assetGroup: BACKGROUND_BLUR_ASSET_GROUP,
  revisionID: BACKGROUND_BLUR_REVISION_ID,
}

type VideoFilterName = 'Emojify' | 'NoOp' | 'Segmentation' | 'Resize (9/16)' | 'CircularCut' |
 'Background Blur 10% CPU' | 'Background Blur 20% CPU' | 'Background Blur 30% CPU' | 
 'Background Blur 40% CPU' | 'Background Replacement' | 'None' | 'Background Blur 2.0 - Low' |
 'Background Blur 2.0 - Medium' | 'Background Blur 2.0 - High' | 'Background Replacement 2.0 - (Beach)' |
 'Background Replacement 2.0 - (Blue)' | 'Background Replacement 2.0 - (Default)';

const BACKGROUND_BLUR_V1_LIST: VideoFilterName[] = [
  'Background Blur 10% CPU',
  'Background Blur 20% CPU',
  'Background Blur 30% CPU',
  'Background Blur 40% CPU',
];

const BACKGROUND_REPLACEMENT_V1_LIST: VideoFilterName[] = [
  'Background Replacement',
];


const BACKGROUND_FILTER_V2_LIST: VideoFilterName[] = [
  'Background Blur 2.0 - Low',
  'Background Blur 2.0 - Medium',
  'Background Blur 2.0 - High',
  'Background Replacement 2.0 - (Beach)',
  'Background Replacement 2.0 - (Blue)',
  'Background Replacement 2.0 - (Default)',
];


const VIDEO_FILTERS: VideoFilterName[] = ['Emojify', 'NoOp', 'Resize (9/16)', 'CircularCut'];

type ButtonState = 'on' | 'off' | 'disabled';

const SimulcastLayerMapping = {
  [SimulcastLayers.Low]: 'Low',
  [SimulcastLayers.LowAndMedium]: 'Low and Medium',
  [SimulcastLayers.LowAndHigh]: 'Low and High',
  [SimulcastLayers.Medium]: 'Medium',
  [SimulcastLayers.MediumAndHigh]: 'Medium and High',
  [SimulcastLayers.High]: 'High',
};

const LANGUAGES_NO_WORD_SEPARATOR = new Set([
  'ja-JP',
  'zh-CN',
]);

interface Toggle {
  name: string;
  oncreate: (elem: HTMLElement) => void;
  action: () => void;
}

interface TranscriptSegment {
  contentSpan: HTMLSpanElement,
  attendee: Attendee;
  startTimeMs: number;
  endTimeMs: number;
}

interface TranscriptionStreamParams {
  contentIdentificationType?: 'PII' | 'PHI';
  contentRedactionType?: 'PII';
  enablePartialResultsStability?: boolean;
  partialResultsStability?: string;
  piiEntityTypes?: string;
  languageModelName?: string;
  identifyLanguage?: boolean;
  languageOptions?: string;
  preferredLanguage?: string;
  vocabularyNames?: string;
  vocabularyFilterNames?: string;
}

export class DemoMeetingApp
    implements AudioVideoObserver, DeviceChangeObserver, ContentShareObserver, VideoDownlinkObserver {
  static readonly DID: string = '+17035550122';
  static readonly BASE_URL: string = [
    location.protocol,
    '//',
    location.host,
    location.pathname.replace(/\/*$/, '/').replace('/v2', ''),
  ].join('');
  static testVideo: string =
      'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c0/Big_Buck_Bunny_4K.webm/Big_Buck_Bunny_4K.webm.360p.vp9.webm';
  static readonly MAX_MEETING_HISTORY_MS: number = 5 * 60 * 1000;
  static readonly DATA_MESSAGE_TOPIC: string = 'chat';
  static readonly DATA_MESSAGE_LIFETIME_MS: number = 300_000;

  // Ideally we don't need to change this. Keep this configurable in case users have a super slow network.
  loadingBodyPixDependencyTimeoutMs: number = 10_000;
  loadingBodyPixDependencyPromise: undefined | Promise<void>;

  attendeeIdPresenceHandler: (undefined | ((attendeeId: string, present: boolean, externalUserId: string, dropped: boolean) => void)) = undefined;
  activeSpeakerHandler: (undefined | ((attendeeIds: string[]) => void)) = undefined;
  volumeIndicatorHandler:  (undefined | ((attendeeId: string, volume: number, muted: boolean, signalStrength: number) => void)) = undefined;
  canUnmuteLocalAudioHandler: (undefined | ((canUnmute: boolean) => void)) = undefined;
  muteAndUnmuteLocalAudioHandler: (undefined | ((muted: boolean) => void)) = undefined;
  blurObserver: (undefined | BackgroundBlurVideoFrameProcessorObserver) = undefined;
  replacementObserver: (undefined | BackgroundReplacementVideoFrameProcessorObserver) = undefined;

  showActiveSpeakerScores = false;
  meeting: string | null = null;
  name: string | null = null;
  voiceConnectorId: string | null = null;
  sipURI: string | null = null;
  region: string | null = null;
  primaryExternalMeetingId: string | undefined = undefined;
  // We cache these so we can avoid having to create new attendees for promotion retries
  // and so the local UX on attendee IDs matches the remote experience
  primaryMeetingSessionCredentials: MeetingSessionCredentials | undefined = undefined;
  meetingSession: MeetingSession | null = null;
  priorityBasedDownlinkPolicy: VideoPriorityBasedPolicy | null = null;
  allHighestDownlinkPolicy: AllHighestVideoBandwidthPolicy | null = null;
  audioVideo: AudioVideoFacade | null = null;
  deviceController: DefaultDeviceController | undefined = undefined;
  canStartLocalVideo: boolean = true;
  defaultBrowserBehavior: DefaultBrowserBehavior = new DefaultBrowserBehavior();
  videoTileCollection: VideoTileCollection | undefined = undefined;

  // eslint-disable-next-line
  roster: Roster = new Roster();

  contentShare: ContentShareManager | undefined = undefined;

  cameraDeviceIds: string[] = [];
  microphoneDeviceIds: string[] = [];
  currentAudioInputDevice: AudioInputDevice | undefined;

  buttonStates: { [key: string]: ButtonState } = {
    'button-microphone': 'on',
    'button-camera': 'off',
    'button-speaker': 'on',
    'button-content-share': 'off',
    'button-live-transcription': 'off',
    'button-video-stats': 'off',
    'button-promote-to-primary': 'off',
    'button-video-filter': 'off',
    'button-video-recording-drop' : 'off',
    'button-record-self': 'off',
    'button-record-cloud': 'off',
    'button-live-connector': 'off',
  };

  isViewOnly = false;

  // feature flags
  maxAttendeeCount = -999;
  requestedVideoMaxResolution = VideoQualitySettings.VideoResolutionHD;
  requestedContentMaxResolution = VideoQualitySettings.VideoResolutionFHD;
  appliedVideoMaxResolution = VideoQualitySettings.VideoResolutionHD;
  appliedContentMaxResolution = VideoQualitySettings.VideoResolutionFHD;
  maxBitrateKbps: number = 1400; // Default to 540p
  enableWebAudio = false;
  logLevel = LogLevel.INFO;
  videoCodecPreferences: VideoCodecCapability[] | undefined = undefined;
  contentCodecPreferences: VideoCodecCapability[] | undefined = undefined;

  audioCapability: string;
  videoCapability: string;
  contentCapability: string;

  enableSimulcast = false;
  enableSVC = false;
  usePriorityBasedDownlinkPolicy = false;
  enablePin = false;
  echoReductionCapability = false;
  usingStereoMusicAudioProfile = false;

  supportsVoiceFocus = false;
  enableVoiceFocus = false;
  joinMuted = false;
  voiceFocusIsActive = false;

  supportsBackgroundBlur = false;
  supportsBackgroundReplacement = false;
  supportsVideoFx = false;

  enableLiveTranscription = false;
  noWordSeparatorForTranscription = false;

  markdown = require('markdown-it')({ linkify: true });
  lastMessageSender: string | null = null;
  lastReceivedMessageTimestamp = 0;
  lastPacketsSent = 0;
  lastTotalAudioPacketsExpected = 0;
  lastTotalAudioPacketsLost = 0;
  lastTotalAudioPacketsRecoveredRed = 0;
  lastTotalAudioPacketsRecoveredFec = 0;
  lastRedRecoveryMetricsReceived = 0;
  meetingSessionPOSTLogger: POSTLogger;
  meetingEventPOSTLogger: POSTLogger;

  hasChromiumWebRTC: boolean = this.defaultBrowserBehavior.hasChromiumWebRTC();

  voiceFocusTransformer: VoiceFocusDeviceTransformer | undefined;
  voiceFocusDevice: VoiceFocusTransformDevice | undefined;
  joinInfo: any | undefined;
  deleteOwnAttendeeToLeave = false;
  disablePeriodicKeyframeRequestOnContentSender = false;
  allowAttendeeCapabilities = false;

  blurProcessor: BackgroundBlurProcessor | undefined;
  replacementProcessor: BackgroundReplacementProcessor | undefined;
  replacementOptions: BackgroundReplacementOptions | undefined;

  // This is an extremely minimal reactive programming approach: these elements
  // will be updated when the Amazon Voice Focus display state changes.
  voiceFocusDisplayables: HTMLElement[] = [];
  analyserNode: RemovableAnalyserNode;

  liveTranscriptionDisplayables: HTMLElement[] = [];

  chosenVideoTransformDevice: DefaultVideoTransformDevice;
  chosenVideoFilter: VideoFilterName = 'None';
  selectedVideoFilterItem: VideoFilterName = 'None';

  DEFAULT_VIDEO_FX_CONFIG: VideoFxConfig = {
    backgroundBlur: {
      isEnabled: true,
      strength: 'high',
    },
    backgroundReplacement: {
      isEnabled: false,
      backgroundImageURL: null,
      defaultColor: 'black',
    }
  }
  videoFxProcessor: VideoFxProcessor | undefined;
  videoFxConfig: VideoFxConfig = this.DEFAULT_VIDEO_FX_CONFIG;

  meetingLogger: Logger | undefined = undefined;

  // If you want to make this a repeatable SPA, change this to 'spa'
  // and fix some state (e.g., video buttons).
  // Holding Shift while hitting the Leave button is handled by setting
  // this to `halt`, which allows us to stop and measure memory leaks.
  // The `nothing` option can be used to stop cleanup from happening allowing
  // `audioVideo` to be reused without stopping the meeting.
  behaviorAfterLeave: 'spa' | 'reload' | 'halt' | 'nothing' = 'reload';

  videoMetricReport: { [id: string]: { [id: string]: {} } } = {};

  removeFatalHandlers: () => void;

  transcriptContainerDiv = document.getElementById('transcript-container') as HTMLDivElement;
  partialTranscriptDiv: HTMLDivElement | undefined;
  partialTranscriptResultTimeMap = new Map<string, number>();
  partialTranscriptResultMap = new Map<string, TranscriptResult>();
  transcriptEntitySet = new Set<string>();

  addFatalHandlers(): void {
    fatal = this.fatal.bind(this);

    const onEvent = (event: ErrorEvent): void => {
      // In Safari there's only a message.
      fatal(event.error || event.message);
    };

    // Listen for unhandled errors, too.
    window.addEventListener('error', onEvent);

    window.onunhandledrejection = (event: PromiseRejectionEvent) => {
      fatal(event.reason);
    };

    this.removeFatalHandlers = () => {
      window.onunhandledrejection = undefined;
      window.removeEventListener('error', onEvent);
      fatal = undefined;
      this.removeFatalHandlers = undefined;
    }
  }

  eventReporter: EventReporter | undefined = undefined;
  enableEventReporting = false;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).app = this;

    this.addFatalHandlers();

    if (document.location.search.includes('testfatal=1')) {
      this.fatal(new Error('Testing fatal.'));
      return;
    }

    (document.getElementById('sdk-version') as HTMLSpanElement).innerText =
      'amazon-chime-sdk-js@' + Versioning.sdkVersion;
    this.initEventListeners();
    this.initParameters();
    this.setMediaRegion();
    if (this.isRecorder() || this.isBroadcaster()) {
      AsyncScheduler.nextTick(async () => {
        this.meeting = new URL(window.location.href).searchParams.get('m');
        this.name = this.isRecorder() ? '«Meeting Recorder»' : '«Meeting Broadcaster»';
        await this.authenticate();
        await this.openAudioOutputFromSelection();
        await this.join();
        this.displayButtonStates();
        this.switchToFlow('flow-meeting');
      });
    } else {
      this.switchToFlow('flow-authenticate');
    }
  }

  /**
   * We want to make it abundantly clear at development and testing time
   * when an unexpected error occurs.
   * If we're running locally, or we passed a `fatal=1` query parameter, fail hard.
   */
  fatal(e: Error | string): void {
    // Muffle mode: let the `try-catch` do its job.
    if (!SHOULD_DIE_ON_FATALS) {
      console.info('Ignoring fatal', e);
      return;
    }

    console.error('Fatal error: this was going to be caught, but should not have been thrown.', e);

    if (e && e instanceof Error) {
      document.getElementById('stack').innerText = e.message + '\n' + e.stack?.toString();
    } else {
      document.getElementById('stack').innerText = '' + e;
    }

    this.switchToFlow('flow-fatal');
  }

  initParameters(): void {
    const meeting = new URL(window.location.href).searchParams.get('m');
    if (meeting) {
      (document.getElementById('inputMeeting') as HTMLInputElement).value = meeting;
      (document.getElementById('inputName') as HTMLInputElement).focus();
    } else {
      (document.getElementById('inputMeeting') as HTMLInputElement).focus();
    }
  }

  async initVoiceFocus(): Promise<void> {
    const logger = new ConsoleLogger('SDK', LogLevel.DEBUG);
    if (!this.enableWebAudio) {
      logger.info('[DEMO] Web Audio not enabled. Not checking for Amazon Voice Focus support.');
      return;
    }

    const spec: VoiceFocusSpec = getVoiceFocusSpec(this.joinInfo);

    try {
      this.supportsVoiceFocus = await VoiceFocusDeviceTransformer.isSupported(spec, {
        logger,
      });
      if (this.supportsVoiceFocus) {
        this.voiceFocusTransformer = await this.getVoiceFocusDeviceTransformer(MAX_VOICE_FOCUS_COMPLEXITY);
        this.supportsVoiceFocus =
            this.voiceFocusTransformer && this.voiceFocusTransformer.isSupported();
        if (this.supportsVoiceFocus) {
          logger.info('[DEMO] Amazon Voice Focus is supported.');
          document.getElementById('voice-focus-setting').classList.remove('hidden');
          return;
        }
      }
    } catch (e) {
      // Fall through.
      logger.warn(`[DEMO] Does not support Amazon Voice Focus: ${e.message}`);
    }
    logger.warn('[DEMO] Does not support Amazon Voice Focus.');
    this.supportsVoiceFocus = false;
    document.getElementById('voice-focus-setting').classList.toggle('hidden', true);
  }

  async initBackgroundBlur(): Promise<void> {
    try {
      this.supportsBackgroundBlur = await BackgroundBlurVideoFrameProcessor.isSupported(this.getBackgroundBlurSpec());
    }
    catch (e) {
      this.log(`[DEMO] Does not support background blur: ${e.message}`);
      this.supportsBackgroundBlur = false;
    }
  }
  
  /**
   * Determine if the videoFxProcessor is supported in current environment
   */
  async resolveSupportsVideoFX(): Promise<void> {
    const logger = new ConsoleLogger('SDK', LogLevel.DEBUG);
    try {
      this.supportsVideoFx = await VideoFxProcessor.isSupported(logger)
    } catch (e) {
      this.log(`[DEMO] Does not support background blur/background replacement v2: ${e.message}`);
      this.supportsVideoFx = false;
    }
  }

  async createReplacementImageBlob(startColor: string, endColor: string): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    const grd = ctx.createLinearGradient(0, 0, 250, 0);
    grd.addColorStop(0, startColor);
    grd.addColorStop(1, endColor);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 500, 500);
    const blob = await new Promise<Blob>(resolve => {
      canvas.toBlob(resolve);
    });
    return blob;
  }

  /**
   * The image blob in this demo is created by generating an image
   * from a canvas, but another common scenario would be to provide
   * an image blob from fetching a URL.
   *   const image = await fetch('https://someimage.jpeg');
   *   const imageBlob = await image.blob();
   */
  async getBackgroundReplacementOptions(): Promise<BackgroundReplacementOptions> {
    if (!this.replacementOptions) {
      const imageBlob = await this.createReplacementImageBlob('#000428', '#004e92');
      this.replacementOptions = { imageBlob };
    }
    return this.replacementOptions;
  }

  async initBackgroundReplacement(): Promise<void> {
    try {
      this.supportsBackgroundReplacement = await BackgroundReplacementVideoFrameProcessor.isSupported(this.getBackgroundBlurSpec(), await this.getBackgroundReplacementOptions());
    }
    catch (e) {
      this.log(`[DEMO] Does not support background replacement: ${e.message}`);
      this.supportsBackgroundReplacement = false;
    }
  }

  private async onVoiceFocusSettingChanged(): Promise<void> {
    this.log('[DEMO] Amazon Voice Focus setting toggled to', this.enableVoiceFocus);
    this.openAudioInputFromSelectionAndPreview();
  }

  initEventListeners(): void {
    (document.getElementById('join-muted') as HTMLInputElement).addEventListener(
      'change',
      e => {
        this.joinMuted = (e.target as HTMLInputElement).checked;
        if (this.joinMuted) {
          this.buttonStates['button-microphone'] = 'off';
        } else {
          this.buttonStates['button-microphone'] = 'on';
        }
      }
    );

    if (!this.defaultBrowserBehavior.supportsAudioRedundancy()) {
      // Firefox currently does not support audio redundancy through insertable streams or
      // script transform so disable the redundancy checkbox
      (document.getElementById('disable-audio-redundancy') as HTMLInputElement).disabled = true;
      (document.getElementById('disable-audio-redundancy-checkbox') as HTMLElement).style.display = 'none';
    }
    if (!this.defaultBrowserBehavior.hasChromiumWebRTC()) {
      (document.getElementById('simulcast') as HTMLInputElement).disabled = true;
      (document.getElementById('content-simulcast-config')).style.display = 'none';
      (document.getElementById('av1Main-video-codec') as HTMLInputElement).remove();
      (document.getElementById('av1Main-content-codec') as HTMLInputElement).remove();
    }

    for (let id of ['videoCodecSelect', 'simulcast', 'svc']) {
      document.getElementById(id).addEventListener('change', () => {
        this.setSimulcastAndSVC();
      });
    }
    this.setSimulcastAndSVC();

    document.getElementById('join-view-only').addEventListener('change', () => {
      this.isViewOnly = (document.getElementById('join-view-only') as HTMLInputElement).checked;
    });

    document.getElementById('priority-downlink-policy').addEventListener('change', e => {
      this.usePriorityBasedDownlinkPolicy = (document.getElementById('priority-downlink-policy') as HTMLInputElement).checked;
    });

    const echoReductionCheckbox = (document.getElementById('echo-reduction-checkbox') as HTMLInputElement);
    (document.getElementById('webaudio') as HTMLInputElement).addEventListener('change', e => {
      this.enableWebAudio = (document.getElementById('webaudio') as HTMLInputElement).checked;
      if (this.enableWebAudio) {
        echoReductionCheckbox.style.display = 'block';
      } else {
        echoReductionCheckbox.style.display = 'none';
      }
    });

    const replicaMeetingInput = document.getElementById('replica-meeting-input');
    replicaMeetingInput.addEventListener('change', async _e => {
      (document.getElementById('primary-meeting-external-id') as HTMLInputElement).value = "";
      (document.getElementById('videoFeatureSelect') as HTMLInputElement).value = "hd";
      (document.getElementById('contentFeatureSelect') as HTMLInputElement).value = "fhd";
      (document.getElementById('max-attendee-cnt') as HTMLInputElement).value = "";
      if ((replicaMeetingInput as HTMLInputElement).checked) {
        // Replica follows meeting feature of primary meeting and does not support feature selection
        (document.getElementById('videoFeatureSelect') as HTMLInputElement).style.display = 'none';
        (document.getElementById('videoFeatureTitle') as HTMLInputElement).style.display = 'none';
        (document.getElementById('contentFeatureSelect') as HTMLInputElement).style.display = 'none';
        (document.getElementById('contentFeatureTitle') as HTMLInputElement).style.display = 'none';
        (document.getElementById('max-attendee-cnt') as HTMLInputElement).style.display = 'none';
      } else {
        (document.getElementById('videoFeatureSelect') as HTMLInputElement).style.display = 'block';
        (document.getElementById('videoFeatureTitle') as HTMLInputElement).style.display = 'block';
        (document.getElementById('contentFeatureSelect') as HTMLInputElement).style.display = 'block';
        (document.getElementById('contentFeatureTitle') as HTMLInputElement).style.display = 'block';
        (document.getElementById('max-attendee-cnt') as HTMLInputElement).style.display = 'block';
      }
    });

    document.getElementById('quick-join').addEventListener('click', e => {
      e.preventDefault();
      this.redirectFromAuthentication(true);
    });

    document.getElementById('form-authenticate').addEventListener('submit', e => {
      e.preventDefault();
      this.redirectFromAuthentication();
    });

    const earlyConnectCheckbox = document.getElementById('preconnect') as HTMLInputElement;
    earlyConnectCheckbox.checked = SHOULD_EARLY_CONNECT;
    earlyConnectCheckbox.onchange = () => {
      SHOULD_EARLY_CONNECT = !!earlyConnectCheckbox.checked;
    }

    const dieCheckbox = document.getElementById('die') as HTMLInputElement;
    dieCheckbox.checked = SHOULD_DIE_ON_FATALS;
    dieCheckbox.onchange = () => {
      SHOULD_DIE_ON_FATALS = !!dieCheckbox.checked;
    }

    const speechMonoCheckbox = document.getElementById(
        'fullband-speech-mono-quality'
    ) as HTMLInputElement;
    const musicMonoCheckbox = document.getElementById(
        'fullband-music-mono-quality'
    ) as HTMLInputElement;
    const musicStereoCheckbox = document.getElementById(
        'fullband-music-stereo-quality'
    ) as HTMLInputElement;
    speechMonoCheckbox.addEventListener('change', _e => {
      if (speechMonoCheckbox.checked) {
        musicMonoCheckbox.checked = false;
        musicStereoCheckbox.checked = false;
      }
    });
    musicMonoCheckbox.addEventListener('change', _e => {
      if (musicMonoCheckbox.checked) {
        speechMonoCheckbox.checked = false;
        musicStereoCheckbox.checked = false;
      }
    });
    musicStereoCheckbox.addEventListener('change', _e => {
      if (musicStereoCheckbox.checked) {
        speechMonoCheckbox.checked = false;
        musicMonoCheckbox.checked = false;
        this.usingStereoMusicAudioProfile = true;
      } else {
        this.usingStereoMusicAudioProfile = false;
      }
    });

    document.getElementById('to-sip-flow').addEventListener('click', e => {
      e.preventDefault();
      this.switchToFlow('flow-sip-authenticate');
    });

    document.getElementById('form-sip-authenticate').addEventListener('submit', e => {
      e.preventDefault();
      this.meeting = (document.getElementById('sip-inputMeeting') as HTMLInputElement).value;
      this.voiceConnectorId = (document.getElementById(
          'voiceConnectorId'
      ) as HTMLInputElement).value;

      AsyncScheduler.nextTick(
          async (): Promise<void> => {
            this.showProgress('progress-authenticate');
            const region = this.region || 'us-east-1';
            try {
              const response = await fetch(
                  `${DemoMeetingApp.BASE_URL}join?title=${encodeURIComponent(
                      this.meeting
                  )}&name=${encodeURIComponent(DemoMeetingApp.DID)}&region=${encodeURIComponent(
                      region
                  )}`,
                  {
                    method: 'POST',
                  }
              );
              const json = await response.json();
              const joinToken = json.JoinInfo.Attendee.Attendee.JoinToken;
              this.sipURI = `sip:${DemoMeetingApp.DID}@${this.voiceConnectorId};transport=tls;X-joinToken=${joinToken}`;
              this.switchToFlow('flow-sip-uri');
            } catch (error) {
              (document.getElementById(
                  'failed-meeting'
              ) as HTMLDivElement).innerText = `Meeting ID: ${this.meeting}`;
              (document.getElementById('failed-meeting-error') as HTMLDivElement).innerText =
                  error.message;
              this.switchToFlow('flow-failed-meeting');
              return;
            }
            const sipUriElement = document.getElementById('sip-uri') as HTMLInputElement;
            sipUriElement.value = this.sipURI;
            this.hideProgress('progress-authenticate');
          }
      );
    });

    if (!this.areVideoFiltersSupported()) {
      document.getElementById('video-input-filter-container').style.display = 'none';
    }

    let videoInputFilter = document.getElementById('video-input-filter') as HTMLInputElement;
    videoInputFilter.addEventListener('change', async () => {
      this.selectedVideoFilterItem = <VideoFilterName>videoInputFilter.value;
      this.log(`Clicking video filter: ${this.selectedVideoFilterItem}`);
      await this.openVideoInputFromSelection(this.selectedVideoInput, true)
    });

    document.getElementById('copy-sip-uri').addEventListener('click', () => {
      const sipUriElement = document.getElementById('sip-uri') as HTMLInputElement;
      sipUriElement.select();
      document.execCommand('copy');
    });

    const audioInput = document.getElementById('audio-input') as HTMLSelectElement;
    audioInput.addEventListener('change', async (_ev: Event) => {
      this.log('audio input device is changed');
      await this.openAudioInputFromSelectionAndPreview();
    });

    const videoInput = document.getElementById('video-input') as HTMLSelectElement;
    videoInput.addEventListener('change', async (_ev: Event) => {
      this.log('video input device is changed');
      try {
        await this.openVideoInputFromSelection(videoInput.value, true);
      } catch (err) {
        fatal(err);
      }
    });

    const videoInputQuality = document.getElementById('video-input-quality') as HTMLSelectElement;
    videoInputQuality.addEventListener('change', async (_ev: Event) => {
      this.log('Video input quality is changed');
      switch (videoInputQuality.value) {
        case '360p':
          this.audioVideo.chooseVideoInputQuality(640, 360, 15);
          this.maxBitrateKbps = 600;
          break;
        case '540p':
          this.audioVideo.chooseVideoInputQuality(960, 540, 15);
          this.maxBitrateKbps = 1400;
          break;
        case '720p':
          this.audioVideo.chooseVideoInputQuality(1280, 720, 15);
          this.maxBitrateKbps = 1500;
          break;
        case '1080p':
          // The 1080p dropdown will be removed if we haven't selected FHD meeting feature
          this.maxBitrateKbps = 2500;
          this.audioVideo.chooseVideoInputQuality(1920, 1080, 15);
          break;
      }
      this.audioVideo.setVideoMaxBandwidthKbps(this.maxBitrateKbps);
      this.log(`API Setting: videoInputQuality change: ${videoInputQuality.value}, maxbitrateKbps: ${this.maxBitrateKbps}`);
      try {
        if (this.chosenVideoTransformDevice) {
          await this.chosenVideoTransformDevice.stop();
          this.chosenVideoTransformDevice = null;
        }
        await this.openVideoInputFromSelection(videoInput.value, true);
      } catch (err) {
        fatal(err);
      }
    });

    const audioOutput = document.getElementById('audio-output') as HTMLSelectElement;
    audioOutput.addEventListener('change', async (_ev: Event) => {
      this.log('audio output device is changed');
      await this.openAudioOutputFromSelection();
    });

    document.getElementById('button-test-sound').addEventListener('click', async e => {
      e.preventDefault();
      const audioOutput = document.getElementById('audio-output') as HTMLSelectElement;
      const testSound = new TestSound(this.meetingEventPOSTLogger, audioOutput.value);
      await testSound.init();
    });

    document.getElementById('form-devices').addEventListener('submit', e => {
      e.preventDefault();
      AsyncScheduler.nextTick(async () => {
        try {
          this.showProgress('progress-join');
          await this.stopAudioPreview();
          await this.openVideoInputFromSelection(null, true);
          // stopVideoProcessor should be called before join; it ensures that state variables and video processor stream are cleaned / removed before joining the meeting.
          // If stopVideoProcessor is not called then the state from preview screen will be carried into the in meeting experience and it will cause undesired side effects.
          await this.stopVideoProcessor();
          await this.join();
          this.hideProgress('progress-join');
          this.displayButtonStates();
          this.switchToFlow('flow-meeting');

        } catch (error) {
          document.getElementById('failed-join').innerText = `Meeting ID: ${this.meeting}`;
          document.getElementById('failed-join-error').innerText = `Error: ${error.message}`;
        }
      });
    });

    (document.getElementById('add-voice-focus') as HTMLInputElement).addEventListener(
        'change',
        e => {
          this.enableVoiceFocus = (e.target as HTMLInputElement).checked;
          this.onVoiceFocusSettingChanged();
        }
    );

    const buttonMute = document.getElementById('button-microphone');
    buttonMute.addEventListener('click', _e => {
      this.toggleButton('button-microphone');
      if (this.isButtonOn('button-microphone')) {
        this.audioVideo.realtimeUnmuteLocalAudio();
      } else {
        this.audioVideo.realtimeMuteLocalAudio();
      }
    });

    const buttonCloudCapture = document.getElementById('button-record-cloud') as HTMLButtonElement;
    buttonCloudCapture.addEventListener('click', _e => {
      this.toggleButton('button-record-cloud');
      this.updateButtonVideoRecordingDrop()
      if (this.isButtonOn('button-record-cloud')) {
        AsyncScheduler.nextTick(async () => {
          buttonCloudCapture.disabled = true;
          await this.startMediaCapture();
          buttonCloudCapture.disabled = false;
        });
      } else {
        AsyncScheduler.nextTick(async () => {
          buttonCloudCapture.disabled = true;
          await this.stopMediaCapture();
          buttonCloudCapture.disabled = false;
        });
      }
    });

    const buttonLiveConnector = document.getElementById('button-live-connector') as HTMLButtonElement;
    buttonLiveConnector.addEventListener('click', _e => {
      this.toggleButton('button-live-connector');
      this.updateButtonVideoRecordingDrop()
      if (this.isButtonOn('button-live-connector')) {
        AsyncScheduler.nextTick(async () => {
          buttonLiveConnector.disabled = true;
          const response = await this.startLiveConnector();
          const toastContainer = document.getElementById('toast-container');
          const toast = document.createElement('meeting-toast') as MeetingToast
          toastContainer.appendChild(toast);
          toast.message = "Playback URL: " + response.playBackUrl;
          toast.delay = "50000"
          toast.show();
          buttonLiveConnector.disabled = false;
        });
      } else {
        AsyncScheduler.nextTick(async () => {
          buttonLiveConnector.disabled = true;
          await this.stopLiveConnector();
          buttonLiveConnector.disabled = false;
        });
      }
    });

    const buttonRecordSelf = document.getElementById('button-record-self');
    let recorder: MediaRecorder;
    buttonRecordSelf.addEventListener('click', _e => {
      const chunks: Blob[] = [];
      AsyncScheduler.nextTick(async () => {
        this.toggleButton('button-record-self');
        this.updateButtonVideoRecordingDrop()
        if (!this.isButtonOn('button-record-self')) {
          console.info('Stopping recorder ', recorder);
          recorder.stop();
          recorder = undefined;
          return;
        }

        // Combine the audio and video streams.
        const mixed = new MediaStream();

        const localTile = this.audioVideo.getLocalVideoTile();
        if (localTile) {
          mixed.addTrack(localTile.state().boundVideoStream.getVideoTracks()[0]);
        }

        // We need to get access to the media stream broker, which requires knowing
        // the exact implementation. Sorry!
        /* @ts-ignore */
        const av: DefaultAudioVideoController = this.audioVideo.audioVideoController;
        const input = await av.mediaStreamBroker.acquireAudioInputStream();
        mixed.addTrack(input.getAudioTracks()[0]);

        recorder = new MediaRecorder(mixed, { mimeType: 'video/webm; codecs=vp9' });
        console.info('Setting recorder to', recorder);
        recorder.ondataavailable = (event) => {
          if (event.data.size) {
            chunks.push(event.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, {
            type: 'video/webm',
          });
          chunks.length = 0;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          document.body.appendChild(a);
          /* @ts-ignore */
          a.style = 'display: none';
          a.href = url;
          a.download = 'recording.webm';
          a.click();
          window.URL.revokeObjectURL(url);
        };

        recorder.start();
      });
    });

    const buttonVideo = document.getElementById('button-camera');
    buttonVideo.addEventListener('click', _e => {
      AsyncScheduler.nextTick(async () => {
        if (this.toggleButton('button-camera') === 'on' && this.canStartLocalVideo) {
          try {
            let camera: string | null = this.selectedVideoInput;
            if (camera === null || camera === 'None') {
              camera = this.cameraDeviceIds.length ? this.cameraDeviceIds[0] : 'None';
            }
            await this.openVideoInputFromSelection(camera, false);
            this.audioVideo.startLocalVideoTile();
          } catch (err) {
            this.toggleButton('button-camera', 'off')
            fatal(err);
          }
        } else {
          await this.audioVideo.stopVideoInput();
          this.toggleButton('button-camera', 'off');
        }
      });
    });

    const buttonSpeaker = document.getElementById('button-speaker');
    buttonSpeaker.addEventListener('click', _e => {
      AsyncScheduler.nextTick(async () => {
        this.toggleButton('button-speaker');
        if (this.isButtonOn('button-speaker')) {
          try {
            await this.audioVideo.bindAudioElement(
                document.getElementById('meeting-audio') as HTMLAudioElement
            );
          } catch (e) {
            fatal(e);
            this.log('Failed to bindAudioElement', e);
          }
        } else {
          this.audioVideo.unbindAudioElement();
        }
      });
    });

    const buttonLiveTranscription = document.getElementById('button-live-transcription');
    buttonLiveTranscription.addEventListener('click', () => {
      this.transcriptContainerDiv.style.display = this.isButtonOn('button-live-transcription') ? 'none' : 'block';
      this.toggleButton('button-live-transcription');
    });

    const buttonLiveTranscriptionModal = document.getElementById('button-live-transcription-modal-close');
    buttonLiveTranscriptionModal.addEventListener('click', () => {
      document.getElementById('live-transcription-modal').style.display = 'none';
    });

    // show only languages available to selected transcription engine
    document.getElementsByName('transcription-engine').forEach(e => {
      e.addEventListener('change', () => {
        const engineTranscribeChecked = (document.getElementById('engine-transcribe') as HTMLInputElement).checked;
        const contentIdentificationChecked = (document.getElementById('content-identification-checkbox') as HTMLInputElement).checked;
        const contentRedactionChecked = (document.getElementById('content-redaction-checkbox') as HTMLInputElement).checked;
        document.getElementById('engine-transcribe-language').classList.toggle('hidden', !engineTranscribeChecked);
        document.getElementById('engine-transcribe-medical-language').classList.toggle('hidden', engineTranscribeChecked);
        document.getElementById('engine-transcribe-region').classList.toggle('hidden', !engineTranscribeChecked);
        document.getElementById('engine-transcribe-medical-region').classList.toggle('hidden', engineTranscribeChecked);
        document.getElementById('engine-transcribe-medical-content-identification').classList.toggle('hidden', engineTranscribeChecked);
        document.getElementById('engine-transcribe-language-identification').classList.toggle('hidden', !engineTranscribeChecked);
        document.getElementById('engine-transcribe-content-identification').classList.toggle('hidden', !engineTranscribeChecked);
        document.getElementById('engine-transcribe-redaction').classList.toggle('hidden', !engineTranscribeChecked);
        document.getElementById('engine-transcribe-partial-stabilization').classList.toggle('hidden', !engineTranscribeChecked);
        document.getElementById('engine-transcribe-custom-language-model').classList.toggle('hidden', !engineTranscribeChecked);
        if (!engineTranscribeChecked) {
          document.getElementById('transcribe-entity-types').classList.toggle('hidden', true);
        } else if (engineTranscribeChecked && (contentIdentificationChecked || contentRedactionChecked)) {
          document.getElementById('transcribe-entity-types').classList.toggle('hidden', false);
        }
      });
    });

    const languageIdentificationCb = document.getElementById('identify-language-checkbox') as HTMLInputElement;
    languageIdentificationCb.addEventListener('click', () => {
      (document.getElementById('button-start-transcription') as HTMLInputElement).disabled = languageIdentificationCb.checked;
      (document.getElementById('language-options').classList.toggle('hidden', !languageIdentificationCb.checked));
      (document.getElementById('preferred-language').classList.toggle('hidden', !languageIdentificationCb.checked));
      (document.getElementById('vocabulary-names').classList.toggle('hidden', !languageIdentificationCb.checked));
      (document.getElementById('vocabulary-filter-names').classList.toggle('hidden', !languageIdentificationCb.checked));
      (document.getElementById('transcribe-language') as HTMLInputElement).disabled = languageIdentificationCb.checked;
      (document.getElementById('content-identification-checkbox') as HTMLInputElement).disabled = languageIdentificationCb.checked;
      (document.getElementById('content-redaction-checkbox') as HTMLInputElement).disabled = languageIdentificationCb.checked;
      (document.getElementById('custom-language-model-checkbox') as HTMLInputElement).disabled = languageIdentificationCb.checked;
      (document.getElementById('transcribe-entity') as HTMLInputElement).disabled = languageIdentificationCb.checked;
      (document.getElementById('language-model-input-text') as HTMLInputElement).disabled = languageIdentificationCb.checked;
    });

    const languageOptionsDropDown = document.getElementById('language-options') as HTMLInputElement;
    languageOptionsDropDown.addEventListener('change', (event => languageOptionsDropDownClickHandler(event)));

    const contentIdentificationCb = document.getElementById('content-identification-checkbox') as HTMLInputElement;
    contentIdentificationCb.addEventListener('click', () => {
      (document.getElementById('content-redaction-checkbox') as HTMLInputElement).disabled = contentIdentificationCb.checked;
      (document.getElementById('transcribe-entity-types') as HTMLInputElement).classList.toggle('hidden', !contentIdentificationCb.checked);
    });

    const contentRedactionCb = document.getElementById('content-redaction-checkbox') as HTMLInputElement;
    contentRedactionCb.addEventListener('click', () => {
      (document.getElementById('content-identification-checkbox') as HTMLInputElement).disabled = contentRedactionCb.checked;
      (document.getElementById('transcribe-entity-types') as HTMLInputElement).classList.toggle('hidden', !contentRedactionCb.checked);
    });

    const partialResultsStabilityCb = document.getElementById('partial-stabilization-checkbox') as HTMLInputElement;
    partialResultsStabilityCb.addEventListener('click', () => {
      (document.getElementById('transcribe-partial-stability').classList.toggle('hidden', !partialResultsStabilityCb.checked));
    });

    const languageModelCb = document.getElementById('custom-language-model-checkbox') as HTMLInputElement;
    languageModelCb.addEventListener('click', () => {
      (document.getElementById('language-model').classList.toggle('hidden', !languageModelCb.checked));
    });

    const buttonStartTranscription = document.getElementById('button-start-transcription');
    buttonStartTranscription.addEventListener('click', async () => {
      let engine = '';
      let languageCode = '';
      let region = '';
      const transcriptionStreamParams: TranscriptionStreamParams = {};
      if ((document.getElementById('engine-transcribe') as HTMLInputElement).checked) {
        engine = 'transcribe';
        region = (document.getElementById('transcribe-region') as HTMLInputElement).value;

        if (!isChecked('identify-language-checkbox')) {
          languageCode = (document.getElementById('transcribe-language') as HTMLInputElement).value;

          if (isChecked('content-identification-checkbox')) {
            transcriptionStreamParams.contentIdentificationType = 'PII';
          }

          if (isChecked('content-redaction-checkbox')) {
            transcriptionStreamParams.contentRedactionType = 'PII';
          }

          if (isChecked('content-identification-checkbox') || isChecked('content-redaction-checkbox')) {
            let piiEntityTypes = getSelectedValues('#transcribe-entity');
            if (piiEntityTypes !== '') {
              transcriptionStreamParams.piiEntityTypes = piiEntityTypes;
            }
          }

          if (isChecked('custom-language-model-checkbox')) {
            let languageModelName = (document.getElementById('language-model-input-text') as HTMLInputElement).value;
            if (languageModelName) {
              transcriptionStreamParams.languageModelName = languageModelName;
            }
          }
        }

        if (isChecked('identify-language-checkbox')) {
          transcriptionStreamParams.identifyLanguage = true;
          const languageOptionsSelected = getSelectedValues('#language-options');
          if (languageOptionsSelected !== '') {
            transcriptionStreamParams.languageOptions = languageOptionsSelected;
          }

          const preferredLanguageSelected = (document.getElementById('preferred-language-selection') as HTMLInputElement).value;
          if (preferredLanguageSelected) {
            transcriptionStreamParams.preferredLanguage = preferredLanguageSelected;
          }

          const vocabularyNames = (document.getElementById('vocabulary-names-input-text') as HTMLInputElement).value;
          if (vocabularyNames) {
            transcriptionStreamParams.vocabularyNames = vocabularyNames;
          }

          const vocabularyFilterNames = (document.getElementById('vocabulary-filter-names-input-text') as HTMLInputElement).value;
          if (vocabularyFilterNames) {
            transcriptionStreamParams.vocabularyFilterNames = vocabularyFilterNames;
          }
        }

        if (isChecked('partial-stabilization-checkbox')) {
          transcriptionStreamParams.enablePartialResultsStability = true;
        }

        let partialResultsStability = (document.getElementById('partial-stability') as HTMLInputElement).value;
        if (partialResultsStability) {
          transcriptionStreamParams.partialResultsStability = partialResultsStability;
        }
      } else if ((document.getElementById('engine-transcribe-medical') as HTMLInputElement).checked) {
        engine = 'transcribe_medical';
        languageCode = (document.getElementById('transcribe-medical-language') as HTMLInputElement).value;
        region = (document.getElementById('transcribe-medical-region') as HTMLInputElement).value;
        if (isChecked('medical-content-identification-checkbox')) {
          transcriptionStreamParams.contentIdentificationType = 'PHI';
        }
      } else {
        throw new Error('Unknown transcription engine');
      }
      await startLiveTranscription(engine, languageCode, region, transcriptionStreamParams);
    });

    function isChecked(id: string): boolean {
      return (document.getElementById(id) as HTMLInputElement).checked;
    }

    // fetches checked values of the list from given selector id
    function getSelectedValues(id: string): string {
      let selectors = id + ' ' + 'option:checked';
      const selectedValues = document.querySelectorAll(selectors);
      let values = '';
      if (selectedValues.length > 0) {
        values = Array.from(selectedValues).filter(node => (node as HTMLInputElement).value !== '').map(el => (el as HTMLInputElement).value).join(',');
      }
      return values;
    }

    function createErrorSpan(message: string): void {
      let languageOptionsErrorSpan = document.createElement('span');
      languageOptionsErrorSpan.innerText = message;
      languageOptionsErrorSpan.classList.add('error-message-color');
      document.getElementById('language-options-error-message').appendChild(languageOptionsErrorSpan);
      (document.getElementById('button-start-transcription') as HTMLInputElement).disabled = true;
    }

    // callback to restrict users from selecting multiple language variant (locale) per language code
    // e.g. en-US and en-AU as language options cannot be selected for the same transcription
    // Details in https://docs.aws.amazon.com/transcribe/latest/dg/lang-id-stream.html
    function languageOptionsDropDownClickHandler(event: Event): boolean {
      let languageGroupSet = new Set();
      document.getElementById('language-options-error-message').innerHTML = '';
      const languageOptionsSelected = document.querySelectorAll('#language-options option:checked');

      const languageOptionsPreviewSpan = document.getElementById("language-options-selected-options");
      const languageString = languageOptionsSelected.length === 0 ? "None" : Array.from(languageOptionsSelected).map((node: HTMLSelectElement) => node.value).join(",").trim();
      languageOptionsPreviewSpan.innerText = languageString;

      let preferredLanguageDropDown = document.getElementById('preferred-language-selection');
      if (preferredLanguageDropDown.hasChildNodes) {
        let options = (preferredLanguageDropDown as HTMLSelectElement).options;
        for (let i = options.length - 1; i >= 0; i--) {
          if (options[i].value.length > 0) {
            preferredLanguageDropDown.removeChild(options[i]);
          }
        }
      }

      for (let i = languageOptionsSelected.length - 1; i >= 0; i--) {
        let currentItem = languageOptionsSelected.item(i) as HTMLSelectElement;
        if (languageGroupSet.has(currentItem.parentElement.id)) {
          createErrorSpan('Please select one language per group');
          return false;
        }
        languageGroupSet.add(currentItem.parentElement.id);
        let selectedValue = currentItem.value;
        let option = document.createElement('option');
        option.value = selectedValue;
        option.text = currentItem.innerText;
        document.getElementById('preferred-language-selection').appendChild(option);
      }

      if (languageOptionsSelected.length < 2) {
        createErrorSpan('Please select at least 2 language options');
        return false;
      } else if (languageOptionsSelected.length >= 2) {
        (document.getElementById('button-start-transcription') as HTMLInputElement).disabled = false;
      }
    }
    const startLiveTranscription = async (engine: string, languageCode: string, region: string, transcriptionStreamParams: TranscriptionStreamParams) => {
      const transcriptionAdditionalParams = JSON.stringify(transcriptionStreamParams);
      const response = await fetch(`${DemoMeetingApp.BASE_URL}start_transcription?title=${encodeURIComponent(this.meeting)}&engine=${encodeURIComponent(engine)}&language=${encodeURIComponent(languageCode)}&region=${encodeURIComponent(region)}&transcriptionStreamParams=${encodeURIComponent(transcriptionAdditionalParams)}`, {
        method: 'POST',
      });
      const json = await response.json();
      if (json.error) {
        throw new Error(`Server error: ${json.error}`);
      }
      document.getElementById('live-transcription-modal').style.display = 'none';
    };

    const buttonVideoStats = document.getElementById('button-video-stats');
    buttonVideoStats.addEventListener('click', () => {
      if (this.isButtonOn('button-video-stats')) {
        document.querySelectorAll('.stats-info').forEach(e => e.remove());
      } else {
        this.getRelayProtocol();
      }
      this.toggleButton('button-video-stats');
    });

    const buttonPromoteToPrimary = document.getElementById('button-promote-to-primary');
    buttonPromoteToPrimary.addEventListener('click', async () => {
      if (!this.isButtonOn('button-promote-to-primary')) {
        await this.promoteToPrimaryMeeting();
      } else {
        this.meetingLogger.info("Demoting from primary meeting");
        if (this.deleteOwnAttendeeToLeave) {
          this.deleteAttendee(this.primaryExternalMeetingId, this.primaryMeetingSessionCredentials?.attendeeId);
        } else {
          this.audioVideo.demoteFromPrimaryMeeting()
        }
        // `audioVideoWasDemotedFromPrimaryMeeting` will adjust UX
      }
    });

    const sendMessage = (): void => {
      AsyncScheduler.nextTick(() => {
        const textArea = document.getElementById('send-message') as HTMLTextAreaElement;
        const textToSend = textArea.value.trim();
        if (!textToSend) {
          return;
        }
        textArea.value = '';
        this.audioVideo.realtimeSendDataMessage(
            DemoMeetingApp.DATA_MESSAGE_TOPIC,
            textToSend,
            DemoMeetingApp.DATA_MESSAGE_LIFETIME_MS
        );
        // echo the message to the handler
        this.dataMessageHandler(
            new DataMessage(
                Date.now(),
                DemoMeetingApp.DATA_MESSAGE_TOPIC,
                new TextEncoder().encode(textToSend),
                this.meetingSession.configuration.credentials.attendeeId,
                this.meetingSession.configuration.credentials.externalUserId
            )
        );
      });
    };

    const textAreaSendMessage = document.getElementById('send-message') as HTMLTextAreaElement;
    textAreaSendMessage.addEventListener('keydown', e => {
      if (e.keyCode === 13) {
        if (e.shiftKey) {
          textAreaSendMessage.rows++;
        } else {
          e.preventDefault();
          sendMessage();
          textAreaSendMessage.rows = 1;
        }
      }
    });

    const buttonMeetingEnd = document.getElementById('button-meeting-end');
    buttonMeetingEnd.addEventListener('click', _e => {
      const confirmEnd = new URL(window.location.href).searchParams.get('confirm-end') === 'true';
      const prompt =
          'Are you sure you want to end the meeting for everyone? The meeting cannot be used after ending it.';
      if (confirmEnd && !window.confirm(prompt)) {
        return;
      }
      AsyncScheduler.nextTick(async () => {
        (buttonMeetingEnd as HTMLButtonElement).disabled = true;
        await this.endMeeting();
        await this.leave();
        (buttonMeetingEnd as HTMLButtonElement).disabled = false;
      });
    });

    const buttonMeetingLeave = document.getElementById('button-meeting-leave');
    buttonMeetingLeave.addEventListener('click', e => {
      if (e.shiftKey) {
        this.behaviorAfterLeave = 'halt';
      };
      AsyncScheduler.nextTick(async () => {
        (buttonMeetingLeave as HTMLButtonElement).disabled = true;
        await this.leave();
        (buttonMeetingLeave as HTMLButtonElement).disabled = false;
      });
    });
  }

  logAudioStreamPPS(clientMetricReport: ClientMetricReport) {
    const { currentTimestampMs, previousTimestampMs } = clientMetricReport;
    const deltaTime = currentTimestampMs - previousTimestampMs;
    const rtcStatsReport = clientMetricReport.getRTCStatsReport();

    rtcStatsReport.forEach(report => {
      if (report.type === 'outbound-rtp' && report.kind === 'audio') {
        // Skip initial metric.
        if (report.packetsSent === 0 && previousTimestampMs === 0) return;

        const deltaPackets = report.packetsSent - this.lastPacketsSent;
        const pps = (1000 * deltaPackets) / deltaTime;

        let overage = 0;
        if ((pps > 52) || (pps < 47)) {
          console.error('PPS:', pps, `(${++overage})`);
        } else {
          overage = 0;
          console.debug('PPS:', pps);
        }
        this.lastPacketsSent = report.packetsSent;
      }
    });
  }

  logRedRecoveryPercent(clientMetricReport: ClientMetricReport) {
    const customStatsReports = clientMetricReport.customStatsReports;

    // @ts-ignore
    customStatsReports.forEach(report => {
      if (report.type === 'inbound-rtp-red' && report.kind === 'audio') {

        const deltaExpected = report.totalAudioPacketsExpected - this.lastTotalAudioPacketsExpected;
        const deltaLost = report.totalAudioPacketsLost - this.lastTotalAudioPacketsLost;
        const deltaRedRecovered = report.totalAudioPacketsRecoveredRed - this.lastTotalAudioPacketsRecoveredRed;
        const deltaFecRecovered = report.totalAudioPacketsRecoveredFec - this.lastTotalAudioPacketsRecoveredFec;
        if (this.lastRedRecoveryMetricsReceived === 0) this.lastRedRecoveryMetricsReceived = report.timestamp;
        const deltaTime = report.timestamp - this.lastRedRecoveryMetricsReceived;
        this.lastRedRecoveryMetricsReceived = report.timestamp;
        this.lastTotalAudioPacketsExpected = report.totalAudioPacketsExpected;
        this.lastTotalAudioPacketsLost = report.totalAudioPacketsLost;
        this.lastTotalAudioPacketsRecoveredRed = report.totalAudioPacketsRecoveredRed;
        this.lastTotalAudioPacketsRecoveredFec = report.totalAudioPacketsRecoveredFec;

        let lossPercent = 0;
        if (deltaExpected > 0) {
          lossPercent = 100 * (deltaLost / deltaExpected);
        }
        let redRecoveryPercent = 0;
        let fecRecoveryPercent = 0;
        if (deltaLost > 0) {
          redRecoveryPercent = 100 * (deltaRedRecovered / deltaLost);
          fecRecoveryPercent = 100 * (deltaFecRecovered / deltaLost);
        }
        console.debug(`[AudioRed] time since last report = ${deltaTime/1000}s, loss % = ${lossPercent}, red recovery % = ${redRecoveryPercent}, fec recovery % = ${fecRecoveryPercent}, total expected = ${report.totalAudioPacketsExpected}, total lost = ${report.totalAudioPacketsLost}, total red recovered  = ${report.totalAudioPacketsRecoveredRed}, total fec recovered = ${report.totalAudioPacketsRecoveredFec}`);
      }
    });
  }

  getSupportedMediaRegions(): string[] {
    const supportedMediaRegions: string[] = [];
    const mediaRegion = document.getElementById('inputRegion') as HTMLSelectElement;
    for (let i = 0; i < mediaRegion.length; i++) {
      supportedMediaRegions.push(mediaRegion.value);
    }
    return supportedMediaRegions;
  }

  async getNearestMediaRegion(): Promise<string> {
    const nearestMediaRegionResponse = await fetch(`https://nearest-media-region.l.chime.aws`, {
      method: 'GET',
    });
    const nearestMediaRegionJSON = await nearestMediaRegionResponse.json();
    const nearestMediaRegion = nearestMediaRegionJSON.region;
    return nearestMediaRegion;
  }

  setMediaRegion(): void {
    AsyncScheduler.nextTick(
        async (): Promise<void> => {
          try {
            const query = new URLSearchParams(document.location.search);
            const region = query.get('region');
            const nearestMediaRegion = region ? region : await this.getNearestMediaRegion();
            if (nearestMediaRegion === '' || nearestMediaRegion === null) {
              throw new Error('Nearest Media Region cannot be null or empty');
            }
            const supportedMediaRegions: string[] = this.getSupportedMediaRegions();
            if (supportedMediaRegions.indexOf(nearestMediaRegion) === -1) {
              supportedMediaRegions.push(nearestMediaRegion);
              const mediaRegionElement = document.getElementById('inputRegion') as HTMLSelectElement;
              const newMediaRegionOption = document.createElement('option');
              newMediaRegionOption.value = nearestMediaRegion;
              newMediaRegionOption.text = nearestMediaRegion + ' (' + nearestMediaRegion + ')';
              mediaRegionElement.add(newMediaRegionOption, null);
            }
            (document.getElementById('inputRegion') as HTMLInputElement).value = nearestMediaRegion;
          } catch (error) {
            fatal(error);
            this.log('Default media region selected: ' + error.message);
          }
        }
    );
  }

  async promoteToPrimaryMeeting() {
    this.meetingLogger.info("Attempting to promote self to primary meeting from replica");

    if (this.primaryMeetingSessionCredentials === undefined) {
      this.primaryMeetingSessionCredentials = await this.getPrimaryMeetingCredentials();
    }
    await this.audioVideo.promoteToPrimaryMeeting(this.primaryMeetingSessionCredentials)
        .then((status) => {
          const toastContainer = document.getElementById('toast-container');
          const toast = document.createElement('meeting-toast') as MeetingToast
          toastContainer.appendChild(toast);
          if (status.isFailure()) {
            toast.message = ` Failed to promote to primary meeting due to error: ${status.toString()}`;
            toast.addButton('Retry', () => { this.promoteToPrimaryMeeting() });
          } else {
            toast.message = `Successfully promoted to primary meeting`;
            this.updateUXForReplicaMeetingPromotionState('promoted');
          }
          toast.show();
        })
  }

  private async getPrimaryMeetingCredentials(): Promise<MeetingSessionCredentials> {
    // Use the same join endpoint, but point it to the provided primary meeting title and give us an arbitrarily different user name
    const joinInfo = (await this.sendJoinRequest(
      this.primaryExternalMeetingId,
      `promoted-${this.name}`,
      this.region,
      undefined,
      this.audioCapability,
      this.videoCapability,
      this.contentCapability,
    )).JoinInfo;
    // To avoid duplicating code we reuse the constructor for `MeetingSessionConfiguration` which contains `MeetingSessionCredentials`
    // within it and properly does the parsing of the `chime::CreateAttendee` response
    const configuration = new MeetingSessionConfiguration(joinInfo.Meeting, joinInfo.Attendee);
    return configuration.credentials;
  }

  updateUXForViewOnlyMode() {
    for (const button in this.buttonStates) {
      if (button === 'button-speaker' || button === 'button-video-stats' || button === 'button-live-transcription') {
        continue;
      }
      this.toggleButton(button, 'disabled');
    }

    // Mute since we use dummy audio
    this.audioVideo.realtimeMuteLocalAudio();
  }

  updateUXForReplicaMeetingPromotionState(promotedState: 'promoted' | 'demoted') {
    const isPromoted = promotedState === 'promoted'

    // Enable/disable buttons as appropriate
    for (const button in this.buttonStates) {
      if (button === 'button-speaker' || button === 'button-video-stats' || button === 'button-live-transcription') {
        continue;
      }

      if (button === 'button-promote-to-primary') {
        // Don't disable promotion button
        this.meetingLogger.info(`promote button ${isPromoted ? 'on' : 'off'}`)
        this.toggleButton(button, isPromoted ? 'on' : 'off');
        continue;
      }

      this.toggleButton(button, isPromoted ? 'off' : 'disabled');
    }

    // Additionally mute audio and stop local video so it's not in an unexpected state when demoted
    if (!isPromoted) {
      this.audioVideo.realtimeMuteLocalAudio();
      this.audioVideo.stopLocalVideoTile();
    }
  }

  setButtonVisibility(button: string, visible: boolean, state?: ButtonState) {
    const element = document.getElementById(button);
    element.style.display = visible ? 'inline-block' : 'none';
    this.toggleButton(button, state);
  }

  toggleButton(button: string, state?: ButtonState): ButtonState {
    if (state) {
      this.buttonStates[button] = state;
    } else if (this.buttonStates[button] === 'on') {
      this.buttonStates[button] = 'off';
    } else {
      this.buttonStates[button] = 'on';
    }
    this.displayButtonStates();
    return this.buttonStates[button];
  }

  isButtonOn(button: string): boolean {
    return this.buttonStates[button] === 'on';
  }

  updateButtonVideoRecordingDrop(): void {
    if (this.buttonStates['button-record-self'] === 'on' || this.buttonStates['button-record-cloud'] === 'on'  || this.buttonStates['button-live-connector'] === 'on') {
      this.buttonStates['button-video-recording-drop'] = 'on';
    } else if (this.buttonStates['button-record-self'] === 'off' && this.buttonStates['button-record-cloud'] === 'off' && this.buttonStates['button-live-connector'] === 'off') {
      this.buttonStates['button-video-recording-drop'] = 'off';
    }
    this.displayButtonStates()
  }

  displayButtonStates(): void {
    for (const button in this.buttonStates) {
      const element = document.getElementById(button);
      const drop = document.getElementById(`${button}-drop`);
      const on = this.isButtonOn(button);
      element.classList.add(on ? 'btn-success' : 'btn-outline-secondary');
      element.classList.remove(on ? 'btn-outline-secondary' : 'btn-success');
      (element.firstElementChild as SVGElement).classList.add(on ? 'svg-active' : 'svg-inactive');
      (element.firstElementChild as SVGElement).classList.remove(
          on ? 'svg-inactive' : 'svg-active'
      );
      if (this.buttonStates[button] === 'disabled') {
        element.setAttribute('disabled', '');
      } else {
        element.removeAttribute('disabled');
      }
      if (drop) {
        drop.classList.add(on ? 'btn-success' : 'btn-outline-secondary');
        drop.classList.remove(on ? 'btn-outline-secondary' : 'btn-success');
        if (this.buttonStates[button] === 'disabled') {
          drop.setAttribute('disabled', '');
        } else {
          drop.removeAttribute('disabled');
        }
      }
    }
  }

  showProgress(id: string): void {
    (document.getElementById(id) as HTMLDivElement).style.visibility = 'visible';
  }

  hideProgress(id: string): void {
    (document.getElementById(id) as HTMLDivElement).style.visibility = 'hidden';
  }

  switchToFlow(flow: string): void {
    Array.from(document.getElementsByClassName('flow')).map(
        e => ((e as HTMLDivElement).style.display = 'none')
    );
    (document.getElementById(flow) as HTMLDivElement).style.display = 'block';
  }

  async onAudioInputsChanged(freshDevices: MediaDeviceInfo[]): Promise<void> {
    await this.populateAudioInputList();

    if (!this.currentAudioInputDevice) {
      return;
    }

    if (this.currentAudioInputDevice === 'default') {
      // The default device might actually have changed. Go ahead and trigger a
      // reselection.
      this.log('Reselecting default device.');
      await this.selectAudioInputDevice(this.currentAudioInputDevice);
      return;
    }

    const freshDeviceWithSameID = freshDevices.find(
        device => device.deviceId === this.currentAudioInputDevice
    );

    if (freshDeviceWithSameID === undefined) {
      this.log('Existing device disappeared. Selecting a new one.');

      // Select a new device.
      await this.openAudioInputFromSelectionAndPreview();
    }
  }

  audioInputMuteStateChanged(device: string | MediaStream, muted: boolean): void {
    this.log('Mute state: device', device, muted ? 'is muted' : 'is not muted');
  }

  audioInputsChanged(freshAudioInputDeviceList: MediaDeviceInfo[]): void {
    this.onAudioInputsChanged(freshAudioInputDeviceList);
  }

  videoInputsChanged(_freshVideoInputDeviceList: MediaDeviceInfo[]): void {
    this.populateVideoInputList();
  }

  audioOutputsChanged(_freshAudioOutputDeviceList: MediaDeviceInfo[]): void {
    this.populateAudioOutputList();
  }

  audioInputStreamEnded(deviceId: string): void {
    this.log(`Current audio input stream from device id ${deviceId} ended.`);
  }

  videoInputStreamEnded(deviceId: string): void {
    this.log(`Current video input stream from device id ${deviceId} ended.`);
    if (this.buttonStates['button-camera'] === 'on') { // Video input is ended, update button state
      this.buttonStates['button-camera'] = 'off';
      this.displayButtonStates();
    }
  }

  metricsDidReceive(clientMetricReport: ClientMetricReport): void {
    this.logAudioStreamPPS(clientMetricReport);
    this.logRedRecoveryPercent(clientMetricReport);
    const metricReport = clientMetricReport.getObservableMetrics();
    this.videoMetricReport = clientMetricReport.getObservableVideoMetrics();
    this.displayEstimatedUplinkBandwidth(metricReport.availableOutgoingBitrate);
    this.displayEstimatedDownlinkBandwidth(metricReport.availableIncomingBitrate);

    this.isButtonOn('button-video-stats') && this.videoTileCollection.showVideoWebRTCStats(this.videoMetricReport);
    this.videoTileCollection.collectVideoWebRTCStats(this.videoMetricReport);
  }

  displayEstimatedUplinkBandwidth(bitrate: number) {
    const value = `Available Uplink Bandwidth: ${bitrate ? bitrate / 1000 : 'Unknown'} Kbps`;
    (document.getElementById('video-uplink-bandwidth') as HTMLSpanElement).innerText = value;
    (document.getElementById('mobile-video-uplink-bandwidth') as HTMLSpanElement).innerText = value;
  }

  displayEstimatedDownlinkBandwidth(bitrate: number) {
    const value = `Available Downlink Bandwidth: ${bitrate ? bitrate / 1000 : 'Unknown'} Kbps`;
    (document.getElementById('video-downlink-bandwidth') as HTMLSpanElement).innerText = value;
    (document.getElementById('mobile-video-downlink-bandwidth') as HTMLSpanElement).innerText = value;
  }

  resetStats = (): void => {
    this.videoMetricReport = {};
  };

  async getRelayProtocol(): Promise<void> {
    const rawStats = await this.audioVideo.getRTCPeerConnectionStats();
    if (rawStats) {
      rawStats.forEach(report => {
        if (report.type === 'local-candidate') {
          this.log(`Local WebRTC Ice Candidate stats: ${JSON.stringify(report)}`);
          const relayProtocol = report.relayProtocol;
          if (typeof relayProtocol === 'string') {
            if (relayProtocol === 'udp') {
              this.log(`Connection using ${relayProtocol.toUpperCase()} protocol`);
            } else {
              this.log(`Connection fell back to ${relayProtocol.toUpperCase()} protocol`);
            }
          }
        }
      });
    }
  }

  async createLogStream(
      configuration: MeetingSessionConfiguration,
      pathname: string
  ): Promise<void> {
    const body = JSON.stringify({
      meetingId: configuration.meetingId,
      attendeeId: configuration.credentials.attendeeId,
    });
    try {
      const response = await fetch(`${DemoMeetingApp.BASE_URL}${pathname}`, {
        method: 'POST',
        body,
      });
      if (response.status === 200) {
        console.log('[DEMO] log stream created');
      }
    } catch (error) {
      fatal(error);
      this.log(error.message);
    }
  }

  eventDidReceive(name: EventName, attributes: EventAttributes): void {
    this.log(`Received an event: ${JSON.stringify({ name, attributes })}`);
    const { meetingHistory, ...otherAttributes } = attributes;
    switch (name) {
      case 'meetingStartRequested':
      case 'meetingStartSucceeded':
      case 'meetingEnded':
      case 'audioInputSelected':
      case 'videoInputSelected':
      case 'audioInputUnselected':
      case 'videoInputUnselected':
      case 'meetingReconnected':
      case 'receivingAudioDropped':
      case 'signalingDropped':
      case 'sendingAudioFailed':
      case 'sendingAudioRecovered':
      case 'attendeePresenceReceived': {
        // Exclude the "meetingHistory" attribute for successful -> published events.
        this.meetingEventPOSTLogger?.info(
            JSON.stringify({
              name,
              attributes: otherAttributes,
            })
        );
        break;
      }
      case 'audioInputFailed':
      case 'videoInputFailed':
      case 'deviceLabelTriggerFailed':
      case 'meetingStartFailed':
      case 'meetingFailed': {
        // Send the last 5 minutes of events.
        this.meetingEventPOSTLogger?.info(
            JSON.stringify({
              name,
              attributes: {
                ...otherAttributes,
                meetingHistory: meetingHistory.filter(({ timestampMs }) => {
                  return Date.now() - timestampMs < DemoMeetingApp.MAX_MEETING_HISTORY_MS;
                }),
              },
            })
        );
        break;
      }
    }
  }

  async initializeMeetingSession(configuration: MeetingSessionConfiguration): Promise<void> {
    const consoleLogger = (this.meetingLogger = new ConsoleLogger('SDK', this.logLevel));
    if (this.isLocalHost()) {
      this.meetingLogger = consoleLogger;
    } else {
      await Promise.all([
        this.createLogStream(configuration, 'create_log_stream'),
        this.createLogStream(configuration, 'create_browser_event_log_stream'),
      ]);

      this.meetingSessionPOSTLogger = getPOSTLogger(configuration, 'SDK', `${DemoMeetingApp.BASE_URL}logs`, this.logLevel);
      this.meetingLogger = new MultiLogger(
          consoleLogger,
          this.meetingSessionPOSTLogger,
      );
      this.meetingEventPOSTLogger = getPOSTLogger(configuration, 'SDKEvent', `${DemoMeetingApp.BASE_URL}log_meeting_event`, this.logLevel);
    }
    this.eventReporter = await this.setupEventReporter(configuration);
    this.deviceController = new DefaultDeviceController(this.meetingLogger, {
      enableWebAudio: this.enableWebAudio,
    });
    const urlParameters = new URL(window.location.href).searchParams;
    const timeoutMs = Number(urlParameters.get('attendee-presence-timeout-ms'));
    if (!isNaN(timeoutMs)) {
      configuration.attendeePresenceTimeoutMs = Number(timeoutMs);
    }
    configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = this.enableSimulcast;
    configuration.enableSVC = this.enableSVC;
    if (this.usePriorityBasedDownlinkPolicy) {
        this.priorityBasedDownlinkPolicy = new VideoPriorityBasedPolicy(this.meetingLogger);
      configuration.videoDownlinkBandwidthPolicy = this.priorityBasedDownlinkPolicy;
      this.priorityBasedDownlinkPolicy.addObserver(this);
    } else {
        this.allHighestDownlinkPolicy = new AllHighestVideoBandwidthPolicy(configuration.credentials.attendeeId);
        configuration.videoDownlinkBandwidthPolicy = this.allHighestDownlinkPolicy;
    }
    configuration.disablePeriodicKeyframeRequestOnContentSender = this.disablePeriodicKeyframeRequestOnContentSender;

    configuration.applicationMetadata = ApplicationMetadata.create('amazon-chime-sdk-js-demo', '2.0.0');

    if ((document.getElementById('pause-last-frame') as HTMLInputElement).checked) {
      configuration.keepLastFrameWhenPaused = true;
    }

    this.meetingSession = new DefaultMeetingSession(
        configuration,
        this.meetingLogger,
        this.deviceController,
        new DefaultEventController(configuration, this.meetingLogger, this.eventReporter)
    );

    const enableAudioRedundancy = !((document.getElementById('disable-audio-redundancy') as HTMLInputElement).checked);
    let audioProfile: AudioProfile = new AudioProfile(null, enableAudioRedundancy);
    if ((document.getElementById('fullband-speech-mono-quality') as HTMLInputElement).checked) {
      audioProfile = AudioProfile.fullbandSpeechMono(enableAudioRedundancy);
      this.log('Using audio profile fullband-speech-mono-quality');
    } else if (
        (document.getElementById('fullband-music-mono-quality') as HTMLInputElement).checked
    ) {
      audioProfile = AudioProfile.fullbandMusicMono(enableAudioRedundancy);
      this.log('Using audio profile fullband-music-mono-quality');
    } else if (
        (document.getElementById('fullband-music-stereo-quality') as HTMLInputElement).checked
    ) {
      audioProfile = AudioProfile.fullbandMusicStereo(enableAudioRedundancy);
      this.log('Using audio profile fullband-music-stereo-quality');
    }
    this.log(`Audio Redundancy Enabled = ${audioProfile.hasRedundancyEnabled()}`);
    this.meetingSession.audioVideo.setAudioProfile(audioProfile);
    this.meetingSession.audioVideo.setContentAudioProfile(audioProfile);
    this.audioVideo = this.meetingSession.audioVideo;
    this.audioVideo.addDeviceChangeObserver(this);
    this.setupDeviceLabelTrigger();
    this.setupMuteHandler();
    this.setupCanUnmuteHandler();
    this.setupSubscribeToAttendeeIdPresenceHandler();
    this.setupDataMessage();
    this.setupLiveTranscription();
    this.audioVideo.addObserver(this);
    this.meetingSession.eventController.addObserver(this);
    this.audioVideo.addContentShareObserver(this);
    if (this.videoCodecPreferences !== undefined && this.videoCodecPreferences.length > 0) {
      this.audioVideo.setVideoCodecSendPreferences(this.videoCodecPreferences);
      this.audioVideo.setContentShareVideoCodecPreferences(this.videoCodecPreferences);
    }
    if (this.contentCodecPreferences !== undefined && this.contentCodecPreferences.length > 0) {
      this.audioVideo.setContentShareVideoCodecPreferences(this.contentCodecPreferences);
    }
    this.audioVideo.setVideoMaxBandwidthKbps(this.maxBitrateKbps);

    // The default pagination size is 25.
    let paginationPageSize = parseInt((document.getElementById('pagination-page-size') as HTMLSelectElement).value)
    this.videoTileCollection = new VideoTileCollection(this.audioVideo,
        this.meetingLogger,
        new RemoteVideoManager(this.meetingLogger, this.usePriorityBasedDownlinkPolicy  ? this.priorityBasedDownlinkPolicy : this.allHighestDownlinkPolicy),
        paginationPageSize,
        this.meetingSession.configuration.credentials.attendeeId)
    this.audioVideo.addObserver(this.videoTileCollection);

    this.contentShare = new ContentShareManager(this.meetingLogger, this.audioVideo, this.usingStereoMusicAudioProfile);
  }

  async setupEventReporter(configuration: MeetingSessionConfiguration): Promise<EventReporter> {
    let eventReporter: EventReporter;
    const ingestionURL = configuration.urls.eventIngestionURL;
    if (!ingestionURL) {
      return eventReporter;
    }
    if (!this.enableEventReporting) {
      return new NoOpEventReporter();
    }
    const eventReportingLogger = new ConsoleLogger('SDKEventIngestion', LogLevel.INFO);
    const meetingEventClientConfig = new MeetingEventsClientConfiguration(
        configuration.meetingId,
        configuration.credentials.attendeeId,
        configuration.credentials.joinToken
    );
    const eventIngestionConfiguration = new EventIngestionConfiguration(
        meetingEventClientConfig,
        ingestionURL
    );
    if (this.isLocalHost()) {
      eventReporter = new DefaultMeetingEventReporter(eventIngestionConfiguration, eventReportingLogger);
    } else {
      await this.createLogStream(configuration, 'create_browser_event_ingestion_log_stream');
      const eventReportingPOSTLogger = getPOSTLogger(configuration, 'SDKEventIngestion', `${DemoMeetingApp.BASE_URL}log_event_ingestion`, LogLevel.DEBUG);
      const multiEventReportingLogger = new MultiLogger(
          eventReportingLogger,
          eventReportingPOSTLogger,
      );
      eventReporter = new DefaultMeetingEventReporter(eventIngestionConfiguration, multiEventReportingLogger);
    }
    return eventReporter;
  }

  private isLocalHost(): boolean {
    return document.location.host === '127.0.0.1:8080' || document.location.host === 'localhost:8080';
  }

  async join(): Promise<void> {
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      this.log(event.reason);
    });
    if (this.joinMuted) {
      this.audioVideo.realtimeMuteLocalAudio();
    }
    this.audioVideo.start();
  }

  async leave(): Promise<void> {
    if (this.deleteOwnAttendeeToLeave) {
      await this.deleteAttendee(this.meeting, this.meetingSession.configuration.credentials.attendeeId);
      return;
    }
    this.resetStats();
    this.audioVideo.stop();
    await this.voiceFocusDevice?.stop();
    this.voiceFocusDevice = undefined;

    await this.chosenVideoTransformDevice?.stop();
    this.chosenVideoTransformDevice = undefined;
    this.roster.clear();
  }

  setupMuteHandler(): void {
    this.muteAndUnmuteLocalAudioHandler = (isMuted: boolean): void => {
      this.log(`muted = ${isMuted}`);
    };
    this.audioVideo.realtimeSubscribeToMuteAndUnmuteLocalAudio(this.muteAndUnmuteLocalAudioHandler);
    const isMuted = this.audioVideo.realtimeIsLocalAudioMuted();
    this.muteAndUnmuteLocalAudioHandler(isMuted);
  }

  setupCanUnmuteHandler(): void {
    this.canUnmuteLocalAudioHandler = (canUnmute: boolean): void => {
      this.log(`canUnmute = ${canUnmute}`);
    };
    this.audioVideo.realtimeSubscribeToSetCanUnmuteLocalAudio(this.canUnmuteLocalAudioHandler);
    this.canUnmuteLocalAudioHandler(this.audioVideo.realtimeCanUnmuteLocalAudio());
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateProperty(obj: any, key: string, value: string): void {
    if (value !== undefined && obj[key] !== value) {
      obj[key] = value;
    }
  }

  setupSubscribeToAttendeeIdPresenceHandler(): void {
    this.attendeeIdPresenceHandler = (
        attendeeId: string,
        present: boolean,
        externalUserId: string,
        dropped: boolean
    ): void => {
      this.log(`${attendeeId} present = ${present} (${externalUserId})`);
      const isContentAttendee = new DefaultModality(attendeeId).hasModality(
          DefaultModality.MODALITY_CONTENT
      );
      const isSelfAttendee =
          new DefaultModality(attendeeId).base() === this.meetingSession.configuration.credentials.attendeeId
          || new DefaultModality(attendeeId).base() === this.primaryMeetingSessionCredentials?.attendeeId
      if (!present) {
        this.roster.removeAttendee(attendeeId);
        this.audioVideo.realtimeUnsubscribeFromVolumeIndicator(attendeeId, this.volumeIndicatorHandler);
        this.log(`${attendeeId} dropped = ${dropped} (${externalUserId})`);
        return;
      }
      //If someone else share content, stop the current content share
      if (
          !this.allowMaxContentShare() &&
          !isSelfAttendee &&
          isContentAttendee &&
          this.isButtonOn('button-content-share')
      ) {
        this.contentShare.stop();
      }
      const attendeeName =  externalUserId.split('#').slice(-1)[0] + (isContentAttendee ? ' «Content»' : '');
      this.roster.addAttendee(attendeeId, attendeeName, this.allowAttendeeCapabilities);

      this.volumeIndicatorHandler = async (
          attendeeId: string,
          volume: number | null,
          muted: boolean | null,
          signalStrength: number | null
      ) => {
        if (muted !== null) {
          this.roster.setMuteStatus(attendeeId, muted);
        }
        if (signalStrength !== null) {
          this.roster.setSignalStrength(attendeeId, Math.round(signalStrength * 100));
        }
      };

      this.audioVideo.realtimeSubscribeToVolumeIndicator(attendeeId, this.volumeIndicatorHandler);
    };

    this.audioVideo.realtimeSubscribeToAttendeeIdPresence(this.attendeeIdPresenceHandler);

    // Hang on to this so we can unsubscribe later.
    this.activeSpeakerHandler = (attendeeIds: string[]): void => {
      // First reset all roster active speaker information
      for (const id of this.roster.getAllAttendeeIds()) {
        this.roster.setAttendeeSpeakingStatus(id, false);
      }

      // Then re-update roster and tile collection with latest information
      //
      // This will leave featured tiles up since this detector doesn't seem to clear
      // the list.
      for (const attendeeId of attendeeIds) {
        if (this.roster.hasAttendee(attendeeId)) {
          this.roster.setAttendeeSpeakingStatus(attendeeId, true);
          this.videoTileCollection.activeSpeakerAttendeeId = attendeeId
          break; // Only show the most active speaker
        }
      }
    };

    const scoreHandler = (scores: { [attendeeId: string]: number }) => {};

    this.audioVideo.subscribeToActiveSpeakerDetector(
        new DefaultActiveSpeakerPolicy(),
        this.activeSpeakerHandler,
        scoreHandler,
        this.showActiveSpeakerScores ? 100 : 0
    );
  }

  dataMessageHandler(dataMessage: DataMessage): void {
    if (!dataMessage.throttled) {
      const isSelf =
          dataMessage.senderAttendeeId === this.meetingSession.configuration.credentials.attendeeId;
      if (dataMessage.timestampMs <= this.lastReceivedMessageTimestamp) {
        return;
      }
      this.lastReceivedMessageTimestamp = dataMessage.timestampMs;
      const messageDiv = document.getElementById('receive-message') as HTMLDivElement;
      const messageNameSpan = document.createElement('div') as HTMLDivElement;
      messageNameSpan.classList.add('message-bubble-sender');
      messageNameSpan.innerText = dataMessage.senderExternalUserId.split('#').slice(-1)[0];
      const messageTextSpan = document.createElement('div') as HTMLDivElement;
      messageTextSpan.classList.add(isSelf ? 'message-bubble-self' : 'message-bubble-other');
      messageTextSpan.innerHTML = this.markdown
          .render(dataMessage.text())
          .replace(/[<]a /g, '<a target="_blank" ');
      const appendClass = (element: HTMLElement, className: string): void => {
        for (let i = 0; i < element.children.length; i++) {
          const child = element.children[i] as HTMLElement;
          child.classList.add(className);
          appendClass(child, className);
        }
      };
      appendClass(messageTextSpan, 'markdown');
      if (this.lastMessageSender !== dataMessage.senderAttendeeId) {
        messageDiv.appendChild(messageNameSpan);
      }
      this.lastMessageSender = dataMessage.senderAttendeeId;
      messageDiv.appendChild(messageTextSpan);
      messageDiv.scrollTop = messageDiv.scrollHeight;
    } else {
      this.log('Message is throttled. Please resend');
    }
  }

  setupDataMessage(): void {
    this.audioVideo.realtimeSubscribeToReceiveDataMessage(
        DemoMeetingApp.DATA_MESSAGE_TOPIC,
        (dataMessage: DataMessage) => {
          this.dataMessageHandler(dataMessage);
        }
    );
  }

  transcriptEventHandler = (transcriptEvent: TranscriptEvent): void => {
    if (!this.enableLiveTranscription) {
      // Toggle disabled 'Live Transcription' button to enabled when we receive any transcript event
      this.enableLiveTranscription = true;
      this.updateLiveTranscriptionDisplayState();

      // Transcripts view and the button to show and hide it are initially hidden
      // Show them when when live transcription gets enabled, and do not hide afterwards
      this.setButtonVisibility('button-live-transcription', true, 'on');
      this.transcriptContainerDiv.style.display = 'block';
    }

    if (transcriptEvent instanceof TranscriptionStatus) {
      this.appendStatusDiv(transcriptEvent);
      if (transcriptEvent.type === TranscriptionStatusType.STARTED) {
        // Determine word separator based on language code
        let languageCode = null;
        const transcriptionConfiguration = JSON.parse(transcriptEvent.transcriptionConfiguration);
        if (transcriptionConfiguration) {
          if (transcriptionConfiguration.EngineTranscribeSettings) {
            languageCode = transcriptionConfiguration.EngineTranscribeSettings.LanguageCode;
          } else if (transcriptionConfiguration.EngineTranscribeMedicalSettings) {
            languageCode = transcriptionConfiguration.EngineTranscribeMedicalSettings.languageCode;
          }
        }

        if (languageCode && LANGUAGES_NO_WORD_SEPARATOR.has(languageCode)) {
          this.noWordSeparatorForTranscription = true;
        }
      } else if ((transcriptEvent.type === TranscriptionStatusType.STOPPED || transcriptEvent.type === TranscriptionStatusType.FAILED) && this.enableLiveTranscription) {
        // When we receive a STOPPED status event:
        // 1. toggle enabled 'Live Transcription' button to disabled
        this.enableLiveTranscription = false;
        this.noWordSeparatorForTranscription = false;
        this.updateLiveTranscriptionDisplayState();

        // 2. force finalize all partial results
        this.partialTranscriptResultTimeMap.clear();
        this.partialTranscriptDiv = null;
        this.partialTranscriptResultMap.clear();
      }
    } else if (transcriptEvent instanceof Transcript) {
      for (const result of transcriptEvent.results) {
        const resultId = result.resultId;
        const isPartial = result.isPartial;
        const languageCode = result.languageCode;
        if (languageCode && LANGUAGES_NO_WORD_SEPARATOR.has(languageCode)) {
          this.noWordSeparatorForTranscription = true;
        }
        if (!isPartial) {
          if (result.alternatives[0].entities?.length > 0) {
            for (const entity of result.alternatives[0].entities) {
              //split the entity based on space
              let contentArray = entity.content.split(' ');
              for (const content of contentArray) {
                this.transcriptEntitySet.add(content);
              }
            }
          }
        }
        this.partialTranscriptResultMap.set(resultId, result);
        this.partialTranscriptResultTimeMap.set(resultId, result.endTimeMs);
        this.renderPartialTranscriptResults();
        if (isPartial) {
          continue;
        }

        // Force finalizing partial results that's 5 seconds older than the latest one,
        // to prevent local partial results from indefinitely growing
        for (const [olderResultId, endTimeMs] of this.partialTranscriptResultTimeMap) {
          if (olderResultId === resultId) {
            break;
          } else if (endTimeMs < result.endTimeMs - 5000) {
            this.partialTranscriptResultTimeMap.delete(olderResultId);
          }
        }

        this.partialTranscriptResultTimeMap.delete(resultId);
        this.transcriptEntitySet.clear();

        if (this.partialTranscriptResultTimeMap.size === 0) {
          // No more partial results in current batch, reset current batch
          this.partialTranscriptDiv = null;
          this.partialTranscriptResultMap.clear();
        }
      }
    }

    this.transcriptContainerDiv.scrollTop = this.transcriptContainerDiv.scrollHeight;
  };

  renderPartialTranscriptResults = () => {
    if (this.partialTranscriptDiv) {
      // Keep updating existing partial result div
      this.updatePartialTranscriptDiv();
    } else {
      // All previous results were finalized. Create a new div for new results, update, then add it to DOM
      this.partialTranscriptDiv = document.createElement('div') as HTMLDivElement;
      this.updatePartialTranscriptDiv();
      this.transcriptContainerDiv.appendChild(this.partialTranscriptDiv);
    }
  };

  updatePartialTranscriptDiv = () => {
    this.partialTranscriptDiv.innerHTML = '';

    const partialTranscriptSegments: TranscriptSegment[] = [];
    for (const result of this.partialTranscriptResultMap.values()) {
      this.populatePartialTranscriptSegmentsFromResult(partialTranscriptSegments, result);
    }
    partialTranscriptSegments.sort((a, b) => a.startTimeMs - b.startTimeMs);

    const speakerToTranscriptSpanMap = new Map<string, HTMLSpanElement>();
    for (const segment of partialTranscriptSegments) {
      const newSpeakerId = segment.attendee.attendeeId;
      if (!speakerToTranscriptSpanMap.has(newSpeakerId)) {
        this.appendNewSpeakerTranscriptDiv(segment, speakerToTranscriptSpanMap);
      } else {
        const partialResultSpeakers: string[] = Array.from(speakerToTranscriptSpanMap.keys());
        if (partialResultSpeakers.indexOf(newSpeakerId) < partialResultSpeakers.length - 1) {
          // Not the latest speaker and we reach the end of a sentence, clear the speaker to Span mapping to break line
          speakerToTranscriptSpanMap.delete(newSpeakerId);
          this.appendNewSpeakerTranscriptDiv(segment, speakerToTranscriptSpanMap);
        } else {
          const transcriptSpan = speakerToTranscriptSpanMap.get(newSpeakerId);
          transcriptSpan.appendChild(this.createSpaceSpan());
          transcriptSpan.appendChild(segment.contentSpan);
        }
      }
    }
  };

  populatePartialTranscriptSegmentsFromResult = (segments: TranscriptSegment[], result: TranscriptResult) => {
    let startTimeMs: number = null;
    let attendee: Attendee = null;
    let contentSpan;
    for (const item of result.alternatives[0].items) {
      const itemContentSpan = document.createElement('span') as HTMLSpanElement;
      itemContentSpan.innerText = item.content;
      itemContentSpan.classList.add('transcript-content');
      // underline the word with red to show confidence level of predicted word being less than 0.3
      // for redaction, words are represented as '[Name]' and has a confidence of 0. Redacted words are only shown with highlighting.
      if (item.hasOwnProperty('confidence') && !item.content.startsWith("[") && item.confidence < 0.3) {
        itemContentSpan.classList.add('confidence-style');
      }

      // highlight the word in green to show the predicted word is a PII/PHI entity
      if (this.transcriptEntitySet.size > 0 && this.transcriptEntitySet.has(item.content)) {
        itemContentSpan.classList.add('entity-color');
      }

      if (!startTimeMs) {
        contentSpan = document.createElement('span') as HTMLSpanElement;
        contentSpan.appendChild(itemContentSpan);
        attendee = item.attendee;
        startTimeMs = item.startTimeMs;
      } else if (item.type === TranscriptItemType.PUNCTUATION) {
        contentSpan.appendChild(itemContentSpan);
        segments.push({
          contentSpan,
          attendee: attendee,
          startTimeMs: startTimeMs,
          endTimeMs: item.endTimeMs
        });
        startTimeMs = null;
        attendee = null;
      } else {
        if (this.noWordSeparatorForTranscription) {
          contentSpan.appendChild(itemContentSpan);
        } else {
          contentSpan.appendChild(this.createSpaceSpan());
          contentSpan.appendChild(itemContentSpan);
        }
      }
    }

    // Reached end of the result but there is no closing punctuation
    if (startTimeMs) {
      segments.push({
        contentSpan: contentSpan,
        attendee: attendee,
        startTimeMs: startTimeMs,
        endTimeMs: result.endTimeMs,
      });
    }
  };

  createSpaceSpan(): HTMLSpanElement {
    const spaceSpan = document.createElement('span') as HTMLSpanElement;
    spaceSpan.classList.add('transcript-content');
    spaceSpan.innerText = '\u00a0';
    return spaceSpan;
  };

  appendNewSpeakerTranscriptDiv = (
      segment: TranscriptSegment,
      speakerToTranscriptSpanMap: Map<string, HTMLSpanElement>) => {
    const speakerTranscriptDiv = document.createElement('div') as HTMLDivElement;
    speakerTranscriptDiv.classList.add('transcript');

    const speakerSpan = document.createElement('span') as HTMLSpanElement;
    speakerSpan.classList.add('transcript-speaker');
    speakerSpan.innerText = segment.attendee.externalUserId.split('#').slice(-1)[0] + ': ';
    speakerTranscriptDiv.appendChild(speakerSpan);

    speakerTranscriptDiv.appendChild(segment.contentSpan);

    this.partialTranscriptDiv.appendChild(speakerTranscriptDiv);

    speakerToTranscriptSpanMap.set(segment.attendee.attendeeId, segment.contentSpan);
  };

  appendStatusDiv = (status: TranscriptionStatus) => {
    const statusDiv = document.createElement('div') as HTMLDivElement;
    statusDiv.innerText = '(Live Transcription ' + status.type + ' at '
        + new Date(status.eventTimeMs).toLocaleTimeString() + ' in ' + status.transcriptionRegion
        + ' with configuration: ' + status.transcriptionConfiguration
        + (status.message ? ' due to "' + status.message + '".': '') + ')';
    this.transcriptContainerDiv.appendChild(statusDiv);
  };

  setupLiveTranscription = () => {
    this.audioVideo.transcriptionController?.subscribeToTranscriptEvent(this.transcriptEventHandler);
  };

  // eslint-disable-next-line
  async sendJoinRequest(
      meeting: string,
      name: string,
      region: string,
      primaryExternalMeetingId?: string,
      audioCapability?: string,
      videoCapability?: string,
      contentCapability?: string,
    ): Promise<any> {
    let videoMaxResolutionStr = 'HD';
    let contentMaxResolutionStr = 'FHD';
    switch (this.requestedVideoMaxResolution) {
      case VideoQualitySettings.VideoResolutionFHD:
        videoMaxResolutionStr = 'FHD';
        break;
      case VideoQualitySettings.VideoDisabled:
        videoMaxResolutionStr = 'None';
        break;
      default:
        videoMaxResolutionStr = 'HD';
    }
    switch (this.requestedContentMaxResolution) {
      case VideoQualitySettings.VideoResolutionUHD:
        contentMaxResolutionStr = 'UHD';
        break;
      case VideoQualitySettings.VideoDisabled:
        contentMaxResolutionStr = 'None';
        break;
      default:
        contentMaxResolutionStr = 'FHD';
    }
    let uri = `${DemoMeetingApp.BASE_URL}join?title=${encodeURIComponent(
        meeting
    )}&name=${encodeURIComponent(name)}&region=${encodeURIComponent(region)}`
    if (primaryExternalMeetingId) {
      uri += `&primaryExternalMeetingId=${primaryExternalMeetingId}`;
    }
    if (audioCapability) {
      uri += `&attendeeAudioCapability=${audioCapability}`;
    }
    if (videoCapability) {
      uri += `&attendeeVideoCapability=${videoCapability}`;
    }
    if (contentCapability) {
      uri += `&attendeeContentCapability=${contentCapability}`;
    }
    uri += `&ns_es=${this.echoReductionCapability}`
    uri += `&v_rs=${videoMaxResolutionStr}`
    uri += `&c_rs=${contentMaxResolutionStr}`
    uri += `&a_cnt=${isNaN(this.maxAttendeeCount) ? -999 : Number(this.maxAttendeeCount)}`
    const response = await fetch(uri,
        {
          method: 'POST',
        }
    );
    const json = await response.json();
    if (json.error) {
      throw new Error(`Server error: ${json.error}`);
    }
    return json;
  }

  async deleteAttendee(meeting: string, attendeeId: string): Promise<void> {
    let uri = `${DemoMeetingApp.BASE_URL}deleteAttendee?title=${encodeURIComponent(meeting)}&attendeeId=${encodeURIComponent(attendeeId)}`
    const response = await fetch(uri,
        {
          method: 'POST',
        }
    );
    const json = await response.json();
    this.meetingLogger.info(`Delete attendee response: ${JSON.stringify(json)}`)
  }

  async startMediaCapture(): Promise<any> {
    await fetch(
        `${DemoMeetingApp.BASE_URL}startCapture?title=${encodeURIComponent(this.meeting)}`, {
          method: 'POST',
        });
  }

  async stopMediaCapture(): Promise<any> {
    await fetch(
        `${DemoMeetingApp.BASE_URL}endCapture?title=${encodeURIComponent(this.meeting)}`, {
          method: 'POST',
        });
  }

  async startLiveConnector(): Promise<any> {
    const liveConnectorresponse = await fetch(
        `${DemoMeetingApp.BASE_URL}startLiveConnector?title=${encodeURIComponent(this.meeting)}`, {
          method: 'POST',
        });
    const json = await liveConnectorresponse.json();
    if (json.error) {
      throw new Error(`Server error: ${json.error}`);
    }
    return json;
  }

  async stopLiveConnector(): Promise<any> {
    await fetch(
        `${DemoMeetingApp.BASE_URL}endLiveConnector?title=${encodeURIComponent(this.meeting)}`, {
          method: 'POST',
        });
  }


  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async endMeeting(): Promise<any> {
    await fetch(`${DemoMeetingApp.BASE_URL}end?title=${encodeURIComponent(this.meeting)}`, {
      method: 'POST',
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getAttendee(attendeeId: string): Promise<any> {
    const response = await fetch(
        `${DemoMeetingApp.BASE_URL}get_attendee?title=${encodeURIComponent(
            this.meeting
        )}&id=${encodeURIComponent(attendeeId)}`,
        {
          method: 'GET',
        }
    );
    const json = await response.json();
    if (json.error) {
      throw new Error(`Server error: ${json.error}`);
    }
    return json;
  }

  async updateAttendeeCapabilities(
    attendeeId: string,
    audioCapability: string,
    videoCapability: string,
    contentCapability: string
  ): Promise<void> {
    const uri = `${DemoMeetingApp.BASE_URL}update_attendee_capabilities?title=${encodeURIComponent(
      this.meeting
    )}&attendeeId=${encodeURIComponent(attendeeId)}&audioCapability=${encodeURIComponent(
      audioCapability
    )}&videoCapability=${encodeURIComponent(videoCapability)}&contentCapability=${encodeURIComponent(
      contentCapability
    )}`;
    const response = await fetch(uri, {
      method: 'POST',
    });
    const json = await response.json();
    if (json.error) {
      throw new Error(`Server error: ${json.error}`);
    }
    return json;
  }

  async updateAttendeeCapabilitiesExcept(
    attendees: string[],
    audioCapability: string,
    videoCapability: string,
    contentCapability: string
  ): Promise<void> {
    const uri = `${DemoMeetingApp.BASE_URL}batch_update_attendee_capabilities_except?title=${encodeURIComponent(
      this.meeting
    )}&attendeeIds=${encodeURIComponent(attendees.join(','))}&audioCapability=${encodeURIComponent(
      audioCapability
    )}&videoCapability=${encodeURIComponent(videoCapability)}&contentCapability=${encodeURIComponent(
      contentCapability
    )}`;
    const response = await fetch(uri, { method: 'POST' });
    const json = await response.json();
    if (json.error) {
      throw new Error(`Server error: ${json.error}`);
    }
    return json;
  }

  setupDeviceLabelTrigger(): void {
    // Note that device labels are privileged since they add to the
    // fingerprinting surface area of the browser session. In Chrome private
    // tabs and in all Firefox tabs, the labels can only be read once a
    // MediaStream is active. How to deal with this restriction depends on the
    // desired UX. The device controller includes an injectable device label
    // trigger which allows you to perform custom behavior in case there are no
    // labels, such as creating a temporary audio/video stream to unlock the
    // device names, which is the default behavior. Here we override the
    // trigger to also show an alert to let the user know that we are asking for
    // mic/camera permission.
    //
    // Also note that Firefox has its own device picker, which may be useful
    // for the first device selection. Subsequent device selections could use
    // a custom UX with a specific device id.
    if (!this.defaultBrowserBehavior.doesNotSupportMediaDeviceLabels()) {
      this.audioVideo.setDeviceLabelTrigger(
          async (): Promise<MediaStream> => {
            if (this.isRecorder() || this.isBroadcaster() || this.isViewOnly) {
              throw new Error('Recorder or Broadcaster does not need device labels');
            }
            this.switchToFlow('flow-need-permission');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            this.switchToFlow('flow-devices');
            return stream;
          }
      );
    }
  }

  populateDeviceList(
      elementId: string,
      genericName: string,
      devices: MediaDeviceInfo[],
      additionalOptions: string[]
  ): void {
    const list = document.getElementById(elementId) as HTMLSelectElement;
    while (list.firstElementChild) {
      list.removeChild(list.firstElementChild);
    }
    for (let i = 0; i < devices.length; i++) {
      const option = document.createElement('option');
      list.appendChild(option);
      option.text = devices[i].label || `${genericName} ${i + 1}`;
      option.value = devices[i].label ? devices[i].deviceId : '';
    }
    if (additionalOptions.length > 0) {
      const separator = document.createElement('option');
      separator.disabled = true;
      separator.text = '──────────';
      list.appendChild(separator);
      for (const additionalOption of additionalOptions) {
        const option = document.createElement('option');
        list.appendChild(option);
        option.text = additionalOption;
        option.value = additionalOption;
      }
    }
    if (!list.firstElementChild) {
      const option = document.createElement('option');
      option.text = 'Device selection unavailable';
      list.appendChild(option);
    }
  }

  populateVideoPreviewFilterList(
      elementId: string,
      genericName: string,
      filters: VideoFilterName[]
  ): void {
    const list = document.getElementById(elementId) as HTMLSelectElement;
    while (list.firstElementChild) {
      list.removeChild(list.firstElementChild);
    }
    for (let i = 0; i < filters.length; i++) {
      const option = document.createElement('option');
      list.appendChild(option);
      option.text = filters[i] || `${genericName} ${i + 1}`;
      option.value = filters[i];
    }

    if (!list.firstElementChild) {
      const option = document.createElement('option');
      option.text = 'Filter selection unavailable';
      list.appendChild(option);
    }
  }

  populateInMeetingDeviceList(
      elementId: string,
      genericName: string,
      devices: MediaDeviceInfo[],
      additionalOptions: string[],
      additionalToggles: Toggle[] | undefined,
      callback: (name: string) => void
  ): void {
    const menu = document.getElementById(elementId) as HTMLDivElement;
    while (menu.firstElementChild) {
      menu.removeChild(menu.firstElementChild);
    }
    for (let i = 0; i < devices.length; i++) {
      this.createDropdownMenuItem(menu, devices[i].label || `${genericName} ${i + 1}`, () => {
        callback(devices[i].deviceId);
      });
    }
    if (additionalOptions.length) {
      this.createDropdownMenuItem(menu, '──────────', () => { }).classList.add('text-center');
      for (const additionalOption of additionalOptions) {
        this.createDropdownMenuItem(
            menu,
            additionalOption,
            () => {
              callback(additionalOption);
            },
            `${elementId}-${additionalOption.replace(/\s/g, '-')}`
        );
      }
    }
    if (additionalToggles?.length) {
      this.createDropdownMenuItem(menu, '──────────', () => { }).classList.add('text-center');
      for (const { name, oncreate, action } of additionalToggles) {
        const id = `toggle-${elementId}-${name.replace(/\s/g, '-')}`;
        const elem = this.createDropdownMenuItem(menu, name, action, id);
        oncreate(elem);
      }
    }
    if (!menu.firstElementChild) {
      this.createDropdownMenuItem(menu, 'Device selection unavailable', () => { });
    }
  }

  createDropdownMenuItem(
      menu: HTMLDivElement,
      title: string,
      clickHandler: () => void,
      id?: string
  ): HTMLButtonElement {
    const button = document.createElement('button') as HTMLButtonElement;
    menu.appendChild(button);
    button.innerText = title;
    button.classList.add('dropdown-item');
    this.updateProperty(button, 'id', id);
    button.addEventListener('click', () => {
      clickHandler();
    });
    return button;
  }

  async populateAllDeviceLists(): Promise<void> {
    await this.populateAudioInputList();
    await this.populateVideoInputList();
    await this.populateAudioOutputList();
  }

  private async selectVideoFilterByName(name: VideoFilterName): Promise<void> {
    this.selectedVideoFilterItem = name;
    this.log(`clicking video filter ${this.selectedVideoFilterItem}`);
    this.toggleButton(
        'button-video-filter',
        this.selectedVideoFilterItem === 'None' ? 'off' : 'on'
    );
    if (this.isButtonOn('button-camera')) {
      try {
        await this.openVideoInputFromSelection(this.selectedVideoInput, false);
      } catch (err) {
        fatal(err);
        this.log('Failed to choose VideoTransformDevice', err);
      }
    }
  }

  private async stopVideoProcessor(): Promise<void> {
    this.log('Clearing filter variables and stopping the video transform device');
    this.chosenVideoFilter = 'None';
    this.selectedVideoFilterItem = 'None';
    this.chosenVideoTransformDevice?.stop();
  }

  private getBackgroundBlurSpec(): BackgroundFilterSpec {
    return {
      paths: BACKGROUND_BLUR_PATHS,
      model: BACKGROUND_BLUR_MODEL,
      ...BACKGROUND_BLUR_ASSET_SPEC
    };
  }

  private async populateVideoFilterInputList(isPreviewWindow: boolean): Promise<void> {
    const genericName = 'Filter';
    let filters: VideoFilterName[] = ['None'];

    if (this.areVideoFiltersSupported()) {
      filters = filters.concat(VIDEO_FILTERS);
      if (platformCanSupportBodyPixWithoutDegradation()) {
        if (!this.loadingBodyPixDependencyPromise) {
          this.loadingBodyPixDependencyPromise = loadBodyPixDependency(this.loadingBodyPixDependencyTimeoutMs);
        }
        // do not use `await` to avoid blocking page loading
        this.loadingBodyPixDependencyPromise.then(() => {
          filters.push('Segmentation');
          this.populateFilterList(isPreviewWindow, genericName, filters);
        }).catch(err => {
          this.log('Could not load BodyPix dependency', err);
        });
      }

      if (this.supportsBackgroundBlur) {
        filters.push('Background Blur 10% CPU');
        filters.push('Background Blur 20% CPU');
        filters.push('Background Blur 30% CPU');
        filters.push('Background Blur 40% CPU');
      }

      if (this.supportsBackgroundReplacement) {
        filters.push('Background Replacement');
      }

      // Add VideoFx functionality/options if the processor is supported
      if (this.supportsVideoFx) {
        BACKGROUND_FILTER_V2_LIST.map(effectName => filters.push(effectName));
      }
    }

    this.populateFilterList(isPreviewWindow, genericName, filters);
  }

  private async populateFilterList(isPreviewWindow: boolean, genericName: string, filters: VideoFilterName[]): Promise<void> {
    if (isPreviewWindow) {
      this.populateVideoPreviewFilterList(
          'video-input-filter',
          genericName,
          filters
      );
    }
    else {
      this.populateInMeetingDeviceList(
          'dropdown-menu-filter',
          genericName,
          [],
          filters,
          undefined,
          async (name: VideoFilterName) => {
            await this.selectVideoFilterByName(name);
          }
      );
    }
  }

  async populateAudioInputList(): Promise<void> {
    const genericName = 'Microphone';
    let additionalDevices = ['None', '440 Hz', 'Prerecorded Speech', 'Prerecorded Speech Loop (Mono)', 'Echo'];
    const additionalStereoTestDevices = ['L-500Hz R-1000Hz', 'Prerecorded Speech Loop (Stereo)'];
    const additionalToggles = [];

    if (!this.defaultBrowserBehavior.hasFirefoxWebRTC()) {
      // We don't add this in Firefox because there is no known mechanism, using MediaStream or WebAudio APIs,
      // to *not* generate audio in Firefox. By default, everything generates silent audio packets in Firefox.
      additionalDevices.push('No Audio');
    }

    // This can't work unless Web Audio is enabled.
    if (this.enableWebAudio && this.supportsVoiceFocus) {
      additionalToggles.push({
        name: 'Amazon Voice Focus',
        oncreate: (elem: HTMLElement) => {
          this.voiceFocusDisplayables.push(elem);
        },
        action: () => this.toggleVoiceFocusInMeeting(),
      });
    }

    // Don't allow replica meeting attendees to enable transcription even when promoted
    if (this.primaryExternalMeetingId === undefined || this.primaryExternalMeetingId.length === 0) {
      additionalToggles.push({
        name: 'Live Transcription',
        oncreate: (elem: HTMLElement) => {
          this.liveTranscriptionDisplayables.push(elem);
        },
        action: () => this.toggleLiveTranscription(),
      });
    }

    this.populateDeviceList(
        'audio-input',
        genericName,
        await this.audioVideo.listAudioInputDevices(),
        additionalDevices
    );

    if (this.usingStereoMusicAudioProfile) {
      additionalDevices = additionalDevices.concat(additionalStereoTestDevices);
    }

    this.populateInMeetingDeviceList(
        'dropdown-menu-microphone',
        genericName,
        await this.audioVideo.listAudioInputDevices(),
        additionalDevices,
        additionalToggles,
        async (name: string) => {
          await this.selectAudioInputDeviceByName(name);
        }
    );
  }

  private areVideoFiltersSupported(): boolean {
    return this.defaultBrowserBehavior.supportsCanvasCapturedStreamPlayback();
  }

  private isVoiceFocusActive(): boolean {
    return this.currentAudioInputDevice instanceof VoiceFocusTransformDevice;
  }

  private updateVoiceFocusDisplayState(): void {
    const active = this.isVoiceFocusActive();
    this.log('Updating Amazon Voice Focus display state:', active);
    for (const elem of this.voiceFocusDisplayables) {
      elem.classList.toggle('vf-active', active);
    }
  }

  private isVoiceFocusEnabled(): boolean {
    this.log('VF supported:', this.supportsVoiceFocus);
    this.log('VF enabled:', this.enableVoiceFocus);
    return this.supportsVoiceFocus && this.enableVoiceFocus;
  }

  private async reselectAudioInputDevice(): Promise<void> {
    const current = this.currentAudioInputDevice;

    if (current instanceof VoiceFocusTransformDevice) {
      // Unwrap and rewrap if Amazon Voice Focus is selected.
      const intrinsic = current.getInnerDevice();
      const device = await this.audioInputSelectionWithOptionalVoiceFocus(intrinsic);
      return this.selectAudioInputDevice(device);
    }

    // If it's another kind of transform device, just reselect it.
    if (isAudioTransformDevice(current)) {
      return this.selectAudioInputDevice(current);
    }

    // Otherwise, apply Amazon Voice Focus if needed.
    const device = await this.audioInputSelectionWithOptionalVoiceFocus(current);
    return this.selectAudioInputDevice(device);
  }

  private async toggleVoiceFocusInMeeting(): Promise<void> {
    const elem = document.getElementById('add-voice-focus') as HTMLInputElement;
    this.enableVoiceFocus = this.supportsVoiceFocus && !this.enableVoiceFocus;
    elem.checked = this.enableVoiceFocus;
    this.log('Amazon Voice Focus toggle is now', elem.checked);

    await this.reselectAudioInputDevice();
  }

  private updateLiveTranscriptionDisplayState() {
    this.log('Updating live transcription display state to:', this.enableLiveTranscription);
    for (const elem of this.liveTranscriptionDisplayables) {
      elem.classList.toggle('live-transcription-active', this.enableLiveTranscription);
    }
  }

  private async toggleLiveTranscription(): Promise<void> {
    this.log('live transcription were previously set to ' + this.enableLiveTranscription + '; attempting to toggle');

    if (this.enableLiveTranscription) {
      const response = await fetch(`${DemoMeetingApp.BASE_URL}${encodeURIComponent('stop_transcription')}?title=${encodeURIComponent(this.meeting)}`, {
        method: 'POST',
      });
      const json = await response.json();
      if (json.error) {
        throw new Error(`Server error: ${json.error}`);
      }
    } else {
      const liveTranscriptionModal = document.getElementById(`live-transcription-modal`);
      liveTranscriptionModal.style.display = "block";
    }
  }

  async populateVideoInputList(): Promise<void> {
    const genericName = 'Camera';
    const additionalDevices = ['None', 'Blue', 'SMPTE Color Bars'];
    this.populateDeviceList(
        'video-input',
        genericName,
        await this.audioVideo.listVideoInputDevices(),
        additionalDevices
    );
    this.populateInMeetingDeviceList(
        'dropdown-menu-camera',
        genericName,
        await this.audioVideo.listVideoInputDevices(),
        additionalDevices,
        undefined,
        async (name: string) => {
          try {
            // If video is already started sending or the video button is enabled, then reselect a new stream
            // Otherwise, just update the device.
            if (this.meetingSession.audioVideo.hasStartedLocalVideoTile()) {
              await this.openVideoInputFromSelection(name, false);
            } else {
              this.selectedVideoInput = name;
            }
          } catch (err) {
            fatal(err);
          }
        }
    );
    const cameras = await this.audioVideo.listVideoInputDevices();
    this.cameraDeviceIds = cameras.map(deviceInfo => {
      return deviceInfo.deviceId;
    });
  }

  async populateAudioOutputList(): Promise<void> {
    const supportsChoosing = this.defaultBrowserBehavior.supportsSetSinkId();
    const genericName = 'Speaker';
    const additionalDevices: string[] = [];
    const devices = supportsChoosing ? await this.audioVideo.listAudioOutputDevices() : [];
    this.populateDeviceList('audio-output', genericName, devices, additionalDevices);
    this.populateInMeetingDeviceList(
        'dropdown-menu-speaker',
        genericName,
        devices,
        additionalDevices,
        undefined,
        async (name: string) => {
          if (!supportsChoosing) {
            return;
          }
          try {
            await this.chooseAudioOutput(name);
          } catch (e) {
            fatal(e);
            this.log('Failed to chooseAudioOutput', e);
          }
        }
    );
  }

  private async chooseAudioOutput(device: string): Promise<void> {
    // Set it for the content share stream if we can.
    const videoElem = document.getElementById('content-share-video') as HTMLVideoElement;
    if (this.defaultBrowserBehavior.supportsSetSinkId()) {
      try {
        // @ts-ignore
        await videoElem.setSinkId(device);
      } catch (e) {
        this.log('Failed to set audio output', e);
      }
    }

    await this.audioVideo.chooseAudioOutput(device);
  }

  private analyserNodeCallback: undefined | (() => void);

  async selectedAudioInput(): Promise<AudioInputDevice> {
    const audioInput = document.getElementById('audio-input') as HTMLSelectElement;
    const device = await this.audioInputSelectionToDevice(audioInput.value);
    return device;
  }

  async selectAudioInputDevice(device: AudioInputDevice): Promise<void> {
    this.currentAudioInputDevice = device;
    this.log('Selecting audio input', device);
    try {
      await this.audioVideo.startAudioInput(device);
    } catch (e) {
      fatal(e);
      this.log(`failed to choose audio input device ${device}`, e);
    }
    this.updateVoiceFocusDisplayState();
  }

  async selectAudioInputDeviceByName(name: string): Promise<void> {
    this.log('Selecting audio input device by name:', name);
    const device = await this.audioInputSelectionToDevice(name);
    return this.selectAudioInputDevice(device);
  }

  async openAudioInputFromSelection(): Promise<void> {
    const device = await this.selectedAudioInput();
    await this.selectAudioInputDevice(device);
  }

  async openAudioInputFromSelectionAndPreview(): Promise<void> {
    await this.stopAudioPreview();
    await this.openAudioInputFromSelection();
    this.log('Starting audio preview.');
    await this.startAudioPreview();
  }

  setAudioPreviewPercent(percent: number): void {
    const audioPreview = document.getElementById('audio-preview');
    if (!audioPreview) {
      return;
    }
    this.updateProperty(audioPreview.style, 'transitionDuration', '33ms');
    this.updateProperty(audioPreview.style, 'width', `${percent}%`);
    if (audioPreview.getAttribute('aria-valuenow') !== `${percent}`) {
      audioPreview.setAttribute('aria-valuenow', `${percent}`);
    }
  }

  async stopAudioPreview(): Promise<void> {
    if (!this.analyserNode) {
      return;
    }

    this.analyserNodeCallback = undefined;

    // Disconnect the analyser node from its inputs and outputs.
    this.analyserNode.disconnect();
    this.analyserNode.removeOriginalInputs();

    this.analyserNode = undefined;
  }

  startAudioPreview(): void {
    this.setAudioPreviewPercent(0);

    // Recreate.
    if (this.analyserNode) {
      // Disconnect the analyser node from its inputs and outputs.
      this.analyserNode.disconnect();
      this.analyserNode.removeOriginalInputs();

      this.analyserNode = undefined;
    }

    const analyserNode = this.audioVideo.createAnalyserNodeForAudioInput();

    if (!analyserNode) {
      return;
    }

    if (!analyserNode.getByteTimeDomainData) {
      document.getElementById('audio-preview').parentElement.style.visibility = 'hidden';
      return;
    }

    this.analyserNode = analyserNode;
    const data = new Uint8Array(analyserNode.fftSize);
    let frameIndex = 0;
    this.analyserNodeCallback = () => {
      if (frameIndex === 0) {
        analyserNode.getByteTimeDomainData(data);
        const lowest = 0.01;
        let max = lowest;
        for (const f of data) {
          max = Math.max(max, (f - 128) / 128);
        }
        let normalized = (Math.log(lowest) - Math.log(max)) / Math.log(lowest);
        let percent = Math.min(Math.max(normalized * 100, 0), 100);
        this.setAudioPreviewPercent(percent);
      }
      frameIndex = (frameIndex + 1) % 2;
      if (this.analyserNodeCallback) {
        requestAnimationFrame(this.analyserNodeCallback);
      }
    };
    requestAnimationFrame(this.analyserNodeCallback);
  }

  async openAudioOutputFromSelection(): Promise<void> {
    if (this.defaultBrowserBehavior.supportsSetSinkId()) {
      try {
        const audioOutput = document.getElementById('audio-output') as HTMLSelectElement;
        await this.chooseAudioOutput(audioOutput.value);
      } catch (e) {
        fatal(e);
        this.log('failed to chooseAudioOutput', e);
      }
    }
    const audioMix = document.getElementById('meeting-audio') as HTMLAudioElement;
    try {
      await this.audioVideo.bindAudioElement(audioMix);
    } catch (e) {
      fatal(e);
      this.log('failed to bindAudioElement', e);
    }
  }

  private selectedVideoInput: string | null = null;
  async openVideoInputFromSelection(selection: string | null, showPreview: boolean): Promise<void> {
    this.selectedVideoInput = selection;
    this.log(`Switching to: ${this.selectedVideoInput}`);
    const device = await this.videoInputSelectionToDevice(this.selectedVideoInput);
    if (device === null) {
      try {
        await this.audioVideo.stopVideoInput();
      } catch (e) {
        fatal(e);
        this.log(`failed to stop video input`, e);
      }
      this.log('no video device selected');
      if (showPreview) {
        const videoPreviewEl = document.getElementById('video-preview') as HTMLVideoElement;
        await this.audioVideo.stopVideoPreviewForVideoInput(videoPreviewEl);
      }
    } else {
      try {
        await this.audioVideo.startVideoInput(device);
      } catch (e) {
        fatal(e);
        this.log(`failed to start video input ${device}`, e);
      }
      if (showPreview) {
        const videoPreviewEl = document.getElementById('video-preview') as HTMLVideoElement;
        this.audioVideo.startVideoPreviewForVideoInput(videoPreviewEl);
      }
    }
  }

  private async audioInputSelectionToIntrinsicDevice(value: string): Promise<Device> {
    if (this.isRecorder() || this.isBroadcaster()) {
      return null;
    }

    if (value === '440 Hz') {
      return DefaultDeviceController.synthesizeAudioDevice(440);
    }

    if (value === 'L-500Hz R-1000Hz') {
      return new SynthesizedStereoMediaStreamProvider(500, 1000).getMediaStream();
    }

    if (value === 'Prerecorded Speech') {
      return new AudioBufferMediaStreamProvider('audio_file').getMediaStream();
    }

    if (value === 'Prerecorded Speech Loop (Mono)') {
      return new AudioBufferMediaStreamProvider('audio_file', /*shouldLoop*/ true).getMediaStream();
    }

    if (value === 'Prerecorded Speech Loop (Stereo)') {
      return new AudioBufferMediaStreamProvider('stereo_audio_file', true).getMediaStream();
    }

    // use the speaker output MediaStream with a 50ms delay and a 20% volume reduction as audio input
    if (value === 'Echo') {
      try {
        const speakerStream = await this.audioVideo.getCurrentMeetingAudioStream();

        const audioContext = DefaultDeviceController.getAudioContext();
        const streamDestination = audioContext.createMediaStreamDestination();
        const audioSourceNode = audioContext.createMediaStreamSource(speakerStream);
        const delayNode = audioContext.createDelay(0.05);
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.8;

        // connect the AudioSourceNode, DelayNode and GainNode to the same output destination
        audioSourceNode.connect(delayNode);
        delayNode.connect(gainNode);
        gainNode.connect(streamDestination);

        return streamDestination.stream;
      } catch (e) {
        this.log(`Error creating Echo`);
        return null;
      }
    }

    if (value === 'No Audio') {
      // An empty media stream destination without any source connected to it, so it doesn't generate any audio.
      // This is currently only used for integration testing of 'sendingAudioFailed' and 'sendingAudioRecovered' events.
      // Note: It's currently not possible to emulate 'No Audio' in Firefox, so we don't provide it
      // as an option in the audio inputs list.
      return DefaultDeviceController.getAudioContext().createMediaStreamDestination().stream;
    }

    if (value === 'None' || value === '') {
      // When the device is passed in as null, the SDK will synthesize an empty audio device that generates silence.
      return null;
    }

    return value;
  }

  private async getVoiceFocusDeviceTransformer(maxComplexity?: VoiceFocusModelComplexity): Promise<VoiceFocusDeviceTransformer> {
    if (this.voiceFocusTransformer) {
      return this.voiceFocusTransformer;
    }

    function exceeds(configured: VoiceFocusModelComplexity): boolean {
      const max = Number.parseInt(maxComplexity.substring(1), 10);
      const complexity = Number.parseInt(configured.substring(1), 10);
      return complexity > max;
    }

    const logger = new ConsoleLogger('SDK', LogLevel.DEBUG);

    // Find out what it will actually execute, and cap it if needed.
    const spec: VoiceFocusSpec = getVoiceFocusSpec(this.joinInfo);
    const config = await VoiceFocusDeviceTransformer.configure(spec, { logger });

    let transformer;
    if (maxComplexity && config.supported && exceeds(config.model.variant)) {
      logger.info(`Downgrading VF to ${maxComplexity}`);
      spec.variant = maxComplexity;
      transformer = VoiceFocusDeviceTransformer.create(spec, { logger }, undefined, this.joinInfo);
    } else {
      transformer = VoiceFocusDeviceTransformer.create(spec, { logger }, config, this.joinInfo);
    }

    return this.voiceFocusTransformer = await transformer;
  }

  private async createVoiceFocusDevice(inner: Device): Promise<VoiceFocusTransformDevice | Device> {
    if (!this.supportsVoiceFocus) {
      return inner;
    }

    if (this.voiceFocusDevice) {
      // Dismantle the old one.
      return (this.voiceFocusDevice = await this.voiceFocusDevice.chooseNewInnerDevice(inner));
    }

    try {
      const transformer = await this.getVoiceFocusDeviceTransformer(MAX_VOICE_FOCUS_COMPLEXITY);
      const vf: VoiceFocusTransformDevice = await transformer.createTransformDevice(inner);
      if (vf) {
        await vf.observeMeetingAudio(this.audioVideo);
        return this.voiceFocusDevice = vf;
      }
    } catch (e) {
      // Fall through.
    }
    return inner;
  }

  private async audioInputSelectionWithOptionalVoiceFocus(
      device: Device
  ): Promise<Device | VoiceFocusTransformDevice> {
    if (this.isVoiceFocusEnabled()) {
      if (!this.voiceFocusDevice) {
        return this.createVoiceFocusDevice(device);
      }

      // Switch out the inner if needed.
      // The reuse of the Voice Focus device is more efficient, particularly if
      // reselecting the same inner -- no need to modify the Web Audio graph.
      // Allowing the Voice Focus device to manage toggling Voice Focus on and off
      // also
      return (this.voiceFocusDevice = await this.voiceFocusDevice.chooseNewInnerDevice(device));
    }

    return device;
  }

  private async audioInputSelectionToDevice(
      value: string
  ): Promise<Device | VoiceFocusTransformDevice> {
    const inner = await this.audioInputSelectionToIntrinsicDevice(value);
    return this.audioInputSelectionWithOptionalVoiceFocus(inner);
  }

  private videoInputSelectionToIntrinsicDevice(value: string): Device {
    if (value === 'Blue') {
      return SyntheticVideoDeviceFactory.create('blue');
    }

    if (value === 'SMPTE Color Bars') {
      return SyntheticVideoDeviceFactory.create('smpte');
    }

    return value;
  }

  private async videoFilterToProcessor(videoFilter: string): Promise<VideoFrameProcessor | null> {
    this.log(`Choosing video filter ${videoFilter}`);

    if (videoFilter === 'Emojify') {
      return new EmojifyVideoFrameProcessor('🚀');
    }

    if (videoFilter === 'CircularCut') {
      return new CircularCut();
    }

    if (videoFilter === 'NoOp') {
      return new NoOpVideoFrameProcessor();
    }

    if (videoFilter === 'Segmentation') {
      return new SegmentationProcessor();
    }

    if (videoFilter === 'Resize (9/16)') {
      return new ResizeProcessor(0.5625);  // 16/9 Aspect Ratio
    }

    if (BACKGROUND_BLUR_V1_LIST.includes(videoFilter as VideoFilterName)) {
      // In the event that frames start being dropped we should take some action to remove the background blur.
      this.blurObserver = {
        filterFrameDurationHigh: (event) => {
          this.log(`background filter duration high: framed dropped - ${event.framesDropped}, avg - ${event.avgFilterDurationMillis} ms, frame rate - ${event.framerate}, period - ${event.periodMillis} ms`);
        },
        filterCPUUtilizationHigh: (event) => {
          this.log(`background filter CPU utilization high: ${event.cpuUtilization}%`);
        }
      };

      const cpuUtilization: number = Number(videoFilter.match(/([0-9]{2})%/)[1]);
      this.blurProcessor = await BackgroundBlurVideoFrameProcessor.create(this.getBackgroundBlurSpec(), { filterCPUUtilization: cpuUtilization });
      this.blurProcessor.addObserver(this.blurObserver);
      return this.blurProcessor;
    }

    if (BACKGROUND_REPLACEMENT_V1_LIST.includes(videoFilter as VideoFilterName)) {
      // In the event that frames start being dropped we should take some action to remove the background replacement.
      this.replacementObserver = {
        filterFrameDurationHigh: (event) => {
          this.log(`background filter duration high: framed dropped - ${event.framesDropped}, avg - ${event.avgFilterDurationMillis} ms, frame rate - ${event.framerate}, period - ${event.periodMillis} ms`);
        }
      };

      this.replacementProcessor = await BackgroundReplacementVideoFrameProcessor.create(this.getBackgroundBlurSpec(), await this.getBackgroundReplacementOptions());
      this.replacementProcessor.addObserver(this.replacementObserver);
      return this.replacementProcessor;
    }
    
    // Create a VideoFxProcessor
    if (BACKGROUND_FILTER_V2_LIST.includes(videoFilter as VideoFilterName)) {
      const defaultBudgetPerFrame: number = 50;
      this.updateFxConfig(videoFilter);
      try {
        this.videoFxProcessor = await VideoFxProcessor.create(this.meetingLogger, this.videoFxConfig, defaultBudgetPerFrame);
        return this.videoFxProcessor;
      } catch (error) {
        this.meetingLogger.warn(error.toString());
        return new NoOpVideoFrameProcessor();
      }
    }
    return null;
  }

  /**
   * Update this.videoFxConfig to match the corresponding configuration specified by the videoFilter.
   * @param videoFilter 
   */
  private updateFxConfig(videoFilter: string): void {
    this.videoFxConfig.backgroundBlur.isEnabled = (
      videoFilter === 'Background Blur 2.0 - Low' ||
      videoFilter === 'Background Blur 2.0 - Medium' ||
      videoFilter === 'Background Blur 2.0 - High'
    )

    this.videoFxConfig.backgroundReplacement.isEnabled = (
      videoFilter === 'Background Replacement 2.0 - (Beach)' ||
      videoFilter === 'Background Replacement 2.0 - (Default)' ||
      videoFilter === 'Background Replacement 2.0 - (Blue)'
    )
    
    switch(videoFilter) {
      case 'Background Blur 2.0 - Low':
        this.videoFxConfig.backgroundBlur.strength = 'low';
        break;
      case 'Background Blur 2.0 - Medium':
        this.videoFxConfig.backgroundBlur.strength = 'medium';
        break;
      case 'Background Blur 2.0 - High':
        this.videoFxConfig.backgroundBlur.strength = 'high';
        break;
      case 'Background Replacement 2.0 - (Beach)':
        this.videoFxConfig.backgroundReplacement.backgroundImageURL = BackgroundImageEncoding();
        this.videoFxConfig.backgroundReplacement.defaultColor = null;
        break;
      case 'Background Replacement 2.0 - (Default)':
        this.videoFxConfig.backgroundReplacement.backgroundImageURL = null;
        this.videoFxConfig.backgroundReplacement.defaultColor = '#000000';
        break;
      case 'Background Replacement 2.0 - (Blue)':
        this.videoFxConfig.backgroundReplacement.backgroundImageURL = null;
        this.videoFxConfig.backgroundReplacement.defaultColor = '#26A4FF';
        break;
    }
  }

  private async videoInputSelectionWithOptionalFilter(
      innerDevice: Device
  ): Promise<VideoInputDevice> {
    if (this.selectedVideoFilterItem === 'None') {
      return innerDevice;
    }
    // We have reselected our filter, don't need to make a new processor
    if (this.chosenVideoTransformDevice &&
        this.selectedVideoFilterItem === this.chosenVideoFilter) {
      // Our input device has changed, so swap it out for the new one
      if (this.chosenVideoTransformDevice.getInnerDevice() !== innerDevice) {
        this.chosenVideoTransformDevice = this.chosenVideoTransformDevice.chooseNewInnerDevice(
          innerDevice
        );
      }
      return this.chosenVideoTransformDevice;
    }

    // A different filter is selected so we must modify our processor
    if (this.chosenVideoTransformDevice) {
      await this.chosenVideoTransformDevice.stop();
    }
    const proc = await this.videoFilterToProcessor(this.selectedVideoFilterItem);
    this.chosenVideoFilter = this.selectedVideoFilterItem;
    this.chosenVideoTransformDevice = new DefaultVideoTransformDevice(
        this.meetingLogger,
        innerDevice,
        [proc]
    );
    return this.chosenVideoTransformDevice;
  }

  private async videoInputSelectionToDevice(value: string | null): Promise<VideoInputDevice> {
    if (this.isRecorder() || this.isBroadcaster() || value === 'None' || value === null) {
      return null;
    }
    const intrinsicDevice = this.videoInputSelectionToIntrinsicDevice(value);
    return await this.videoInputSelectionWithOptionalFilter(intrinsicDevice);
  }

  isRecorder(): boolean {
    return new URL(window.location.href).searchParams.get('record') === 'true';
  }

  isBroadcaster(): boolean {
    return new URL(window.location.href).searchParams.get('broadcast') === 'true';
  }

  isAbortingOnReconnect(): boolean {
    return new URL(window.location.href).searchParams.get('abort-on-reconnect') === 'true';
  }

  async authenticate(): Promise<string> {
    this.joinInfo = (await this.sendJoinRequest(
      this.meeting,
      this.name,
      this.region,
      this.primaryExternalMeetingId,
      this.audioCapability,
      this.videoCapability,
      this.contentCapability,
    )).JoinInfo;
    this.region = this.joinInfo.Meeting.Meeting.MediaRegion;
    const configuration = new MeetingSessionConfiguration(this.joinInfo.Meeting, this.joinInfo.Attendee);
    await this.initializeMeetingSession(configuration);
    this.primaryExternalMeetingId = this.joinInfo.PrimaryExternalMeetingId
    const url = new URL(window.location.href);
    url.searchParams.set('m', this.meeting);
    history.replaceState({}, `${this.meeting}`, url.toString());

    if (this.joinInfo.Meeting.Meeting.MeetingFeatures === undefined) {
      this.appliedVideoMaxResolution = VideoQualitySettings.VideoResolutionHD;
      this.appliedContentMaxResolution = VideoQualitySettings.VideoResolutionFHD;
    } else {
      switch (this.joinInfo.Meeting.Meeting.MeetingFeatures.Video?.MaxResolution) {
        case "FHD":
          this.appliedVideoMaxResolution = VideoQualitySettings.VideoResolutionFHD;
          break;
        case "None":
          this.appliedVideoMaxResolution = VideoQualitySettings.VideoDisabled;
          break;
        default:
          this.appliedVideoMaxResolution = VideoQualitySettings.VideoResolutionHD;
      }
      switch (this.joinInfo.Meeting.Meeting.MeetingFeatures.Content?.MaxResolution) {
        case "UHD":
          this.appliedContentMaxResolution = VideoQualitySettings.VideoResolutionUHD;
          break;
        case "None":
          this.appliedContentMaxResolution = VideoQualitySettings.VideoDisabled;
          break;
        default:
          this.appliedContentMaxResolution = VideoQualitySettings.VideoResolutionFHD;
      }
    }

    if (this.appliedVideoMaxResolution === VideoQualitySettings.VideoDisabled) {
      this.toggleButton('button-camera', 'disabled');
    }
    if (this.appliedContentMaxResolution === VideoQualitySettings.VideoDisabled) {
      this.toggleButton('button-content-share', 'disabled');
    }

    if (this.appliedVideoMaxResolution !== VideoQualitySettings.VideoResolutionFHD) {
      (document.getElementById('1080p') as HTMLInputElement).remove(); // we do not allow 1080p camera resolution without FHD video enabled
    }
    
    return configuration.meetingId;
  }

  async initAttendeeCapabilityFeature(): Promise<void> {
    const rosterMenuContainer = document.getElementById('roster-menu-container');
    if (this.allowAttendeeCapabilities) {
      rosterMenuContainer.classList.remove('hidden');
      rosterMenuContainer.classList.add('d-flex');

      const attendeeCapabilitiesModal = document.getElementById('attendee-capabilities-modal');
      attendeeCapabilitiesModal.addEventListener('show.bs.modal', async (event: any) => {
        const button = event.relatedTarget;
        const type = button.getAttribute('data-bs-type');
        const descriptionElement = document.getElementById('attendee-capabilities-modal-description');
  
        const audioSelectElement = document.getElementById('attendee-capabilities-modal-audio-select') as HTMLSelectElement;
        const videoSelectElement = document.getElementById('attendee-capabilities-modal-video-select') as HTMLSelectElement;
        const contentSelectElement = document.getElementById('attendee-capabilities-modal-content-select') as HTMLSelectElement;
  
        audioSelectElement.value = '';
        videoSelectElement.value = '';
        contentSelectElement.value = '';
  
        audioSelectElement.disabled = true;
        videoSelectElement.disabled = true;
        contentSelectElement.disabled = true;
  
        // Clone the `selectedAttendeeSet` upon selecting the menu option to open a modal. 
        // Note that the `selectedAttendeeSet` may change when API calls are made.
        const selectedAttendeeSet = new Set(this.roster.selectedAttendeeSet);
        
        if (type === 'one-attendee') {
          const [selectedAttendee] = selectedAttendeeSet;
          descriptionElement.innerHTML = `Update <b>${selectedAttendee.name}</b>'s attendee capabilities.`;
  
          // Load the selected attendee's capabilities.
          const { Attendee } = await this.getAttendee(selectedAttendee.id);
          audioSelectElement.value = Attendee.Capabilities.Audio;
          videoSelectElement.value = Attendee.Capabilities.Video;
          contentSelectElement.value = Attendee.Capabilities.Content;
        } else {
          if (this.roster.selectedAttendeeSet.size === 0)  {
            descriptionElement.innerHTML = `Update the capabilities of all attendees.`;
          } else {
            descriptionElement.innerHTML = `Update the capabilities of all attendees, excluding:<ul> ${
              [...selectedAttendeeSet].map(attendee => `<li><b>${attendee.name}</b></li>`).join('')
            }</ul>`;
          }
  
          audioSelectElement.value = 'SendReceive';
          videoSelectElement.value = 'SendReceive';
          contentSelectElement.value = 'SendReceive';
        }
  
        audioSelectElement.disabled = false;
        videoSelectElement.disabled = false;
        contentSelectElement.disabled = false;
      
        const saveButton = document.getElementById('attendee-capabilities-save-button') as HTMLButtonElement;
        const onClickSaveButton = async () => {
          saveButton.removeEventListener('click', onClickSaveButton);
          Modal.getInstance(attendeeCapabilitiesModal).hide();
          this.roster.unselectAll();
  
          try {
            if (type === 'one-attendee') {
              const [selectedAttendee] = selectedAttendeeSet;
              await this.updateAttendeeCapabilities(
                selectedAttendee.id,
                audioSelectElement.value,
                videoSelectElement.value,
                contentSelectElement.value
              );
            } else {
              await this.updateAttendeeCapabilitiesExcept(
                [...selectedAttendeeSet].map(attendee => attendee.id),
                audioSelectElement.value,
                videoSelectElement.value,
                contentSelectElement.value
              );
            }
          } catch (error) {
            console.error(error);
            const toastContainer = document.getElementById('toast-container');
            const toast = document.createElement('meeting-toast') as MeetingToast;
            toastContainer.appendChild(toast);
            toast.message = `Failed to update attendee capabilities. Please be aware that you can't set content capabilities to "SendReceive" or "Receive" unless you set video capabilities to "SendReceive" or "Receive". Refer to the Amazon Chime SDK guide and the console for additional information.`;
            toast.delay = '15000';
            toast.show();
            const onHidden = () => {
              toast.removeEventListener('hidden.bs.toast', onHidden);
              toastContainer.removeChild(toast);
            };
            toast.addEventListener('hidden.bs.toast', onHidden);
          }
        };
        saveButton.addEventListener('click', onClickSaveButton);
  
        attendeeCapabilitiesModal.addEventListener('hide.bs.modal', async () => {
          saveButton.removeEventListener('click', onClickSaveButton);
        });
      }); 
    } else {
      rosterMenuContainer.classList.add('hidden');
      rosterMenuContainer.classList.remove('d-flex');
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log(str: string, ...args: any[]): void {
    console.log.apply(console, [`[DEMO] ${str}`, ...args]);
  }

  audioVideoDidStartConnecting(reconnecting: boolean): void {
    this.log(`session connecting. reconnecting: ${reconnecting}`);
    if (reconnecting && this.isAbortingOnReconnect()) {
      fatal(Error('reconnect occured with abort-on-reconnect set to true'));
    }
  }

  audioVideoDidStart(): void {
    this.log('session started');
  }

  audioVideoDidStop(sessionStatus: MeetingSessionStatus): void {
    this.log(`session stopped from ${JSON.stringify(sessionStatus)}`);
    if(this.behaviorAfterLeave === 'nothing') {
      return;
    }
    this.log(`resetting stats`);
    this.resetStats();

    const returnToStart = () => {
      switch (this.behaviorAfterLeave) {
        case 'spa':
          this.switchToFlow('flow-authenticate');
          break;
        case 'reload':
          window.location.href = window.location.pathname;
          break;
          // This is useful for testing memory leaks.
        case 'halt': {
          // Wait a moment to make sure cleanup is done.
          setTimeout(() => {
            // Kill all references to code and content.
            // @ts-ignore
            window.app = undefined;
            // @ts-ignore
            window.app_meetingV2 = undefined;
            // @ts-ignore
            window.webpackHotUpdateapp_meetingV2 = undefined;
            document.getElementsByTagName('body')[0].innerHTML = '<b>Gone</b>';
            this.removeFatalHandlers();
          }, 2000);
          break;
        }
      }
    };

    /**
     * This is approximately the inverse of the initialization method above.
     * This work only needs to be done if you want to continue using the page; if
     * your app navigates away or closes the tab when done, you can let the browser
     * clean up.
     */
    const cleanUpResources = async () => {
      // Clean up the timers for this.
      this.audioVideo.unsubscribeFromActiveSpeakerDetector(this.activeSpeakerHandler);

      // Stop listening to attendee presence.
      this.audioVideo.realtimeUnsubscribeToAttendeeIdPresence(this.attendeeIdPresenceHandler);

      // Stop listening to transcript events.
      this.audioVideo.transcriptionController?.unsubscribeFromTranscriptEvent(this.transcriptEventHandler);

      this.audioVideo.realtimeUnsubscribeToMuteAndUnmuteLocalAudio(this.muteAndUnmuteLocalAudioHandler);
      this.audioVideo.realtimeUnsubscribeToSetCanUnmuteLocalAudio(this.canUnmuteLocalAudioHandler);
      this.audioVideo.realtimeUnsubscribeFromReceiveDataMessage(DemoMeetingApp.DATA_MESSAGE_TOPIC);

      // Stop watching device changes in the UI.
      this.audioVideo.removeDeviceChangeObserver(this);

      // Stop content share and local video.
      this.audioVideo.stopLocalVideoTile();
      await this.contentShare.stop();

      // Drop the audio output.
      this.audioVideo.unbindAudioElement();
      await this.deviceController.destroy();

      // remove blur event observer
      this.blurProcessor?.removeObserver(this.blurObserver);

      // remove replacement event observer
      this.replacementProcessor?.removeObserver(this.replacementObserver);

      // Stop any video processor.
      await this.chosenVideoTransformDevice?.stop();

      // Stop Voice Focus.
      await this.voiceFocusDevice?.stop();

      // Clean up the loggers so they don't keep their `onload` listeners around.
      setTimeout(async () => {
        await this.meetingEventPOSTLogger?.destroy();
        await this.meetingSessionPOSTLogger?.destroy();
      }, 500);

      if (isDestroyable(this.eventReporter)) {
        this.eventReporter?.destroy();
      }

      await this.blurProcessor?.destroy();
      await this.replacementProcessor?.destroy();

      this.audioVideo = undefined;
      this.voiceFocusDevice = undefined;
      this.meetingSession = undefined;
      this.activeSpeakerHandler = undefined;
      this.currentAudioInputDevice = undefined;
      this.eventReporter = undefined;
      this.blurProcessor = undefined;
      this.replacementProcessor = undefined;

      // Cleanup VideoFxProcessor
      this.videoFxProcessor?.destroy();
      this.videoFxProcessor = undefined;
    };

    const onLeftMeeting = async () => {
      await cleanUpResources();
      returnToStart();
    };

    if (sessionStatus.statusCode() === MeetingSessionStatusCode.MeetingEnded) {
      this.log(`meeting ended`);
      onLeftMeeting();
      return;
    }

    if (sessionStatus.statusCode() === MeetingSessionStatusCode.Left) {
      this.log('left meeting');
      onLeftMeeting();
      return;
    }
  }

  audioVideoWasDemotedFromPrimaryMeeting(status: any): void {
    const message = `Was demoted from primary meeting with status ${status.toString()}`
    this.log(message);
    this.updateUXForReplicaMeetingPromotionState('demoted');
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('meeting-toast') as MeetingToast
    toastContainer.appendChild(toast);
    toast.message = message;
    toast.addButton('Retry Promotion', () => { this.promoteToPrimaryMeeting() });
    toast.show();
  }

  videoAvailabilityDidChange(availability: MeetingSessionVideoAvailability): void {
    const didChange = this.canStartLocalVideo !== availability.canStartLocalVideo;
    this.canStartLocalVideo = availability.canStartLocalVideo;
    this.log(`video availability changed: canStartLocalVideo  ${availability.canStartLocalVideo}`);
    if (didChange && !this.meetingSession.audioVideo.hasStartedLocalVideoTile()) {
      if (!this.canStartLocalVideo) {
        this.enableLocalVideoButton(false, 'Can no longer enable local video in conference.');
      } else {
        // Enable ability to press button again
        this.enableLocalVideoButton(true, 'You can now enable local video in conference.');
      }
    }
  }

  private enableLocalVideoButton(enabled: boolean, warningMessage: string = ''): void {
    this.toggleButton('button-camera', enabled ? 'off' : 'disabled');

    if (warningMessage) {
      const toastContainer = document.getElementById('toast-container');
      const toast = document.createElement('meeting-toast') as MeetingToast
      toastContainer.appendChild(toast);
      toast.message = warningMessage;
      toast.show();
    }
  }

  private setSimulcastAndSVC(): void {
    const chosenVideoSendCodec = (document.getElementById('videoCodecSelect') as HTMLSelectElement).value;
    const chosenContentSendCodec = (document.getElementById('contentCodecSelect') as HTMLSelectElement).value;
    const enableSimulcastConfig = this.defaultBrowserBehavior.hasChromiumWebRTC()
      && !(chosenVideoSendCodec === 'av1Main' || chosenVideoSendCodec === 'vp9Profile0');

    if (enableSimulcastConfig) {
      (document.getElementById('simulcast') as HTMLInputElement).disabled = false;
      (document.getElementById('content-simulcast-config') as HTMLInputElement).style.display = 'block';
    } else {
      (document.getElementById('simulcast') as HTMLInputElement).checked = false;
      (document.getElementById('simulcast') as HTMLInputElement).disabled = true;
      (document.getElementById('content-simulcast-config') as HTMLInputElement).style.display = 'none';
    }

    const enableSimulcast = (document.getElementById('simulcast') as HTMLInputElement).checked;

    const enableVideoSVCConfig = this.defaultBrowserBehavior.supportsScalableVideoCoding()
      && (chosenVideoSendCodec === 'av1Main' || chosenVideoSendCodec === 'vp9Profile0');
    const enableContentSVCConfig = this.defaultBrowserBehavior.supportsScalableVideoCoding()
      && (chosenContentSendCodec === 'av1Main' || chosenContentSendCodec === 'vp9Profile0');

    if (enableContentSVCConfig) {
      (document.getElementById('content-svc-config')).style.display = 'block';
    } else {
      (document.getElementById('content-svc-config')).style.display = 'none';
    }

    if (enableSimulcast) {
      (document.getElementById('svc') as HTMLInputElement).disabled = true;
      (document.getElementById('svc') as HTMLInputElement).checked = false;
      return;
    }

    if (enableVideoSVCConfig) {
      (document.getElementById('svc') as HTMLInputElement).disabled = false;
    } else {
      (document.getElementById('svc') as HTMLInputElement).disabled = true;
      (document.getElementById('svc') as HTMLInputElement).checked = false;
    }

    const enableSVC = (document.getElementById('svc') as HTMLInputElement).checked;
    if (enableSVC) {
      (document.getElementById('simulcast') as HTMLInputElement).checked = false;
      (document.getElementById('simulcast') as HTMLInputElement).disabled = true;
    }
  }

  private redirectFromAuthentication(quickjoin: boolean = false): void {
    this.meeting = (document.getElementById('inputMeeting') as HTMLInputElement).value;
    this.name = (document.getElementById('inputName') as HTMLInputElement).value;
    this.region = (document.getElementById('inputRegion') as HTMLInputElement).value;
    this.enableSimulcast = (document.getElementById('simulcast') as HTMLInputElement).checked;
    if (!this.enableSimulcast) {
      this.enableSVC = (document.getElementById('svc') as HTMLInputElement).checked;
    }
    this.maxAttendeeCount = parseInt((document.getElementById('max-attendee-cnt') as HTMLSelectElement).value);
    this.enableEventReporting = (document.getElementById('event-reporting') as HTMLInputElement).checked;
    this.deleteOwnAttendeeToLeave = (document.getElementById('delete-attendee') as HTMLInputElement).checked;
    this.disablePeriodicKeyframeRequestOnContentSender = (document.getElementById('disable-content-keyframe') as HTMLInputElement).checked;
    this.allowAttendeeCapabilities = (document.getElementById('allow-attendee-capabilities') as HTMLInputElement).checked;
    this.enableWebAudio = (document.getElementById('webaudio') as HTMLInputElement).checked;
    this.usePriorityBasedDownlinkPolicy = (document.getElementById('priority-downlink-policy') as HTMLInputElement).checked;
    this.echoReductionCapability = (document.getElementById('echo-reduction-capability') as HTMLInputElement).checked;
    this.primaryExternalMeetingId = (document.getElementById('primary-meeting-external-id') as HTMLInputElement).value;

    const chosenLogLevel = (document.getElementById('logLevelSelect') as HTMLSelectElement).value;
    switch (chosenLogLevel) {
      case 'info':
        this.logLevel = LogLevel.INFO;
        break;
      case 'debug':
        this.logLevel = LogLevel.DEBUG;
        break;
      case 'warn':
        this.logLevel = LogLevel.WARN;
        break;
      case 'error':
        this.logLevel = LogLevel.ERROR;
        break;
      default:
        this.logLevel = LogLevel.OFF;
        break;
    }

    const chosenMaxVideoResolution = (document.getElementById('videoFeatureSelect') as HTMLSelectElement).value;
    const chosenMaxContentResolution = (document.getElementById('contentFeatureSelect') as HTMLSelectElement).value;
    switch (chosenMaxVideoResolution) {
      case 'fhd':
        this.requestedVideoMaxResolution = VideoQualitySettings.VideoResolutionFHD;
        break;
      case 'none':
        this.requestedVideoMaxResolution = VideoQualitySettings.VideoDisabled;
        break;
      default:
        this.requestedVideoMaxResolution = VideoQualitySettings.VideoResolutionHD;
    }
    switch (chosenMaxContentResolution) {
      case 'uhd':
        this.requestedContentMaxResolution = VideoQualitySettings.VideoResolutionUHD;
        break;
      case 'none':
        this.requestedContentMaxResolution = VideoQualitySettings.VideoDisabled;
        break;
      default:
        this.requestedContentMaxResolution = VideoQualitySettings.VideoResolutionFHD;
    }

    const getCodecPreferences = (chosenCodec: string) => {
      // We will always include H.264 CBP and VP8 and fallbacks when those are not the codecs selected, so that
      // we always have a widely available codec in use.
      switch (chosenCodec) {
        case 'vp8':
          return [VideoCodecCapability.vp8()];
        case 'h264ConstrainedBaselineProfile':
          return [VideoCodecCapability.h264ConstrainedBaselineProfile(), VideoCodecCapability.vp8()];
        case 'h264BaselineProfile':
          return [VideoCodecCapability.h264BaselineProfile(), VideoCodecCapability.h264ConstrainedBaselineProfile(), VideoCodecCapability.vp8()];
        case 'h264MainProfile':
          return [VideoCodecCapability.h264MainProfile(), VideoCodecCapability.h264ConstrainedBaselineProfile(), VideoCodecCapability.vp8()];
        case 'h264HighProfile':
          // Include both Constrained High (typically offered on Safari) and High
          return [VideoCodecCapability.h264HighProfile(), VideoCodecCapability.h264ConstrainedHighProfile(), VideoCodecCapability.h264ConstrainedBaselineProfile(), VideoCodecCapability.vp8()];
        case 'av1Main':
          return [VideoCodecCapability.av1Main(), VideoCodecCapability.h264ConstrainedBaselineProfile(), VideoCodecCapability.vp8()];
        case 'vp9Profile0':
          return [VideoCodecCapability.vp9Profile0(), VideoCodecCapability.h264ConstrainedBaselineProfile(), VideoCodecCapability.vp8()];
        default:
          // If left on 'Meeting Default', use the existing behavior when `setVideoCodecSendPreferences` is not called
          // which should be equivalent to `this.videoCodecPreferences = [VideoCodecCapability.h264ConstrainedBaselineProfile()]`
          return [];
      }
    }

    const chosenVideoSendCodec = (document.getElementById('videoCodecSelect') as HTMLSelectElement).value;
    this.videoCodecPreferences = getCodecPreferences(chosenVideoSendCodec);
    if (['av1Main', 'vp9Profile0'].includes(chosenVideoSendCodec)) {
      // Attempting to use simulcast with VP9 or AV1 will lead to unexpected behavior (e.g. SVC instead)
      this.enableSimulcast = false;
    }

    const chosenContentSendCodec = (document.getElementById('contentCodecSelect') as HTMLSelectElement).value;
    this.contentCodecPreferences = getCodecPreferences(chosenContentSendCodec);
  
    this.audioCapability = (document.getElementById('audioCapabilitySelect') as HTMLSelectElement).value;
    this.videoCapability = (document.getElementById('videoCapabilitySelect') as HTMLSelectElement).value;
    this.contentCapability = (document.getElementById('contentCapabilitySelect') as HTMLSelectElement).value;

    AsyncScheduler.nextTick(
        async (): Promise<void> => {
          let chimeMeetingId: string = '';
          this.showProgress('progress-authenticate');
          try {
            chimeMeetingId = await this.authenticate();
          } catch (error) {
            console.error(error);
            const httpErrorMessage =
                'UserMedia is not allowed in HTTP sites. Either use HTTPS or enable media capture on insecure sites.';
            (document.getElementById(
                'failed-meeting'
            ) as HTMLDivElement).innerText = `Meeting ID: ${this.meeting}`;
            (document.getElementById('failed-meeting-error') as HTMLDivElement).innerText =
                window.location.protocol === 'http:' ? httpErrorMessage : error.message;
            this.switchToFlow('flow-failed-meeting');
            return;
          }
          (document.getElementById(
              'meeting-id'
          ) as HTMLSpanElement).innerText = `${this.meeting} (${this.region})`;
          (document.getElementById(
              'chime-meeting-id'
          ) as HTMLSpanElement).innerText = `Meeting ID: ${chimeMeetingId}`;
          (document.getElementById(
              'mobile-chime-meeting-id'
          ) as HTMLSpanElement).innerText = `Meeting ID: ${chimeMeetingId}`;
          (document.getElementById(
              'mobile-attendee-id'
          ) as HTMLSpanElement).innerText = `Attendee ID: ${this.meetingSession.configuration.credentials.attendeeId}`;
          (document.getElementById(
              'desktop-attendee-id'
          ) as HTMLSpanElement).innerText = `Attendee ID: ${this.meetingSession.configuration.credentials.attendeeId}`;
          (document.getElementById('info-meeting') as HTMLSpanElement).innerText = this.meeting;
          (document.getElementById('info-name') as HTMLSpanElement).innerText = this.name;

          if (this.isViewOnly) {
            this.updateUXForViewOnlyMode();
            await this.skipDeviceSelection(false);
            return;
          }
          await this.initVoiceFocus();
          await this.initBackgroundBlur();
          await this.initBackgroundReplacement();
          await this.initAttendeeCapabilityFeature();
          await this.resolveSupportsVideoFX();
          await this.populateAllDeviceLists();
          await this.populateVideoFilterInputList(false);
          await this.populateVideoFilterInputList(true);
          if (this.enableSimulcast) {
            const videoInputQuality = document.getElementById(
                'video-input-quality'
            ) as HTMLSelectElement;
            if (this.appliedVideoMaxResolution === VideoQualitySettings.VideoResolutionFHD) {
              videoInputQuality.value = '1080p';
              this.maxBitrateKbps = 2500;
              this.audioVideo.chooseVideoInputQuality(1920, 1080, 15);
            } else {
              videoInputQuality.value = '720p';
              this.maxBitrateKbps = 1500;
              this.audioVideo.chooseVideoInputQuality(1280, 720, 15);
            }
            videoInputQuality.disabled = true;
          } else if (this.appliedVideoMaxResolution === VideoQualitySettings.VideoResolutionFHD) {
            const videoInputQuality = document.getElementById(
                'video-input-quality'
            ) as HTMLSelectElement;
            videoInputQuality.value = '1080p';
            this.audioVideo.chooseVideoInputQuality(1920, 1080, 15);
            this.maxBitrateKbps = 2500;
          }
          this.audioVideo.setVideoMaxBandwidthKbps(this.maxBitrateKbps);

          // `this.primaryExternalMeetingId` may by the join request
          const buttonPromoteToPrimary = document.getElementById('button-promote-to-primary');
          if (!this.primaryExternalMeetingId) {
            buttonPromoteToPrimary.style.display = 'none';
          } else {
            this.setButtonVisibility('button-record-cloud', false);
            this.updateUXForReplicaMeetingPromotionState('demoted');
          }

          if (quickjoin) {
            await this.skipDeviceSelection();
            this.displayButtonStates();
            return;
          }
          this.switchToFlow('flow-devices');
          await this.openAudioInputFromSelectionAndPreview();
          try {
            await this.openVideoInputFromSelection(
                (document.getElementById('video-input') as HTMLSelectElement).value,
                true
            );
          } catch (err) {
            fatal(err);
          }
          await this.openAudioOutputFromSelection();
          this.hideProgress('progress-authenticate');

          // Open the signaling connection while the user is checking their input devices.
          const preconnect = document.getElementById('preconnect') as HTMLInputElement;
          if (preconnect.checked) {
            if (this.joinMuted) {
              this.audioVideo.realtimeMuteLocalAudio();
            }
            this.audioVideo.start({ signalingOnly: true });
          }
        }
    );
  }

  // to call from form-authenticate form
  private async skipDeviceSelection(autoSelectAudioInput: boolean = true): Promise<void> {
    if (autoSelectAudioInput) {
      await this.openAudioInputFromSelection();
    }
    await this.openAudioOutputFromSelection();
    await this.join();
    this.switchToFlow('flow-meeting');
    this.hideProgress('progress-authenticate');
  }

  allowMaxContentShare(): boolean {
    const allowed = new URL(window.location.href).searchParams.get('max-content-share') === 'true';
    if (allowed) {
      return true;
    }
    return false;
  }

  connectionDidBecomePoor(): void {
    this.log('connection is poor');
  }

  connectionDidSuggestStopVideo(): void {
    this.log('suggest turning the video off');
  }

  connectionDidBecomeGood(): void {
    this.log('connection is good now');
  }

  videoSendDidBecomeUnavailable(): void {
    this.log('sending video is not available');
    this.enableLocalVideoButton(false, 'Cannot enable local video due to call being at capacity');
  }

  contentShareDidStart(): void {
    this.toggleButton('button-content-share', 'on')
  }

  contentShareDidStop(): void {
    this.toggleButton('button-content-share', 'off')
  }

  encodingSimulcastLayersDidChange(simulcastLayers: SimulcastLayers): void {
    this.log(
        `current active simulcast layers changed to: ${SimulcastLayerMapping[simulcastLayers]}`
    );
  }

  tileWillBePausedByDownlinkPolicy(tileId: number): void {
    this.log(`Tile ${tileId} will be paused due to insufficient bandwidth`);
    this.videoTileCollection.bandwidthConstrainedTiles.add(tileId);
  }

  tileWillBeUnpausedByDownlinkPolicy(tileId: number): void {
    this.log(`Tile ${tileId} will be resumed due to sufficient bandwidth`);
    this.videoTileCollection.bandwidthConstrainedTiles.delete(tileId);
  }
}

window.addEventListener('load', () => {
  new DemoMeetingApp();
});

window.addEventListener('click', event => {
  const liveTranscriptionModal = document.getElementById('live-transcription-modal');
  if (event.target === liveTranscriptionModal) {
    liveTranscriptionModal.style.display = 'none';
  }
});
