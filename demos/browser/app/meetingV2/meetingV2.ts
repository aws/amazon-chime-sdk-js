// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import './styleV2.scss';
import 'bootstrap';

import {
  AsyncScheduler,
  AudioInputDevice,
  AudioProfile,
  AudioVideoFacade,
  AudioVideoObserver,
  ClientMetricReport,
  ClientVideoStreamReceivingReport,
  ConsoleLogger,
  ContentShareObserver,
  DataMessage,
  DefaultActiveSpeakerPolicy,
  DefaultAudioMixController,
  DefaultAudioVideoController,
  DefaultBrowserBehavior,
  DefaultDeviceController,
  DefaultMeetingSession,
  DefaultModality,
  DefaultVideoTransformDevice,
  Device,
  DeviceChangeObserver,
  EventAttributes,
  EventName,
  LogLevel,
  Logger,
  MeetingSession,
  MeetingSessionConfiguration,
  MeetingSessionPOSTLogger,
  MeetingSessionStatus,
  MeetingSessionStatusCode,
  MeetingSessionVideoAvailability,
  MultiLogger,
  NoOpVideoFrameProcessor,
  RemovableAnalyserNode,
  SimulcastLayers,
  TargetDisplaySize,
  TimeoutScheduler,
  Versioning,
  VideoDownlinkObserver,
  VideoFrameProcessor,
  VideoInputDevice,
  VideoPreference,
  VideoPreferences,
  VideoPriorityBasedPolicy,
  VideoSource,
  VideoTileState,
  VoiceFocusDeviceTransformer,
  VoiceFocusPaths,
  VoiceFocusTransformDevice,
  isAudioTransformDevice,
  VideoPriorityBasedPolicyConfig,
  NoOpEventReporter,
  EventReporter,
  isDestroyable,
  MeetingEventsClientConfiguration,
  EventIngestionConfiguration,
  DefaultMeetingEventReporter
} from 'amazon-chime-sdk-js';

import CircularCut from './videofilter/CircularCut';
import EmojifyVideoFrameProcessor from './videofilter/EmojifyVideoFrameProcessor';
import SegmentationProcessor from './videofilter/SegmentationProcessor';
import {
  loadBodyPixDependency,
  platformCanSupportBodyPixWithoutDegradation,
} from './videofilter/SegmentationUtil';

let SHOULD_EARLY_CONNECT = (() => {
  return document.location.search.includes('earlyConnect=1');
})();

let SHOULD_DIE_ON_FATALS = (() => {
  const isLocal = document.location.host === '127.0.0.1:8080' || document.location.host === 'localhost:8080';
  const fatalYes = document.location.search.includes('fatal=1');
  const fatalNo = document.location.search.includes('fatal=0');
  return fatalYes || (isLocal && !fatalNo);
})();

let DEBUG_LOG_PPS = false;

let fatal: (e: Error) => void;

// This shim is needed to avoid warnings when supporting Safari.
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext
  }
}

class DemoTileOrganizer {
  // this is index instead of length
  static MAX_TILES = 17;
  tiles: { [id: number]: number } = {};
  tileStates: { [id: number]: boolean } = {};
  remoteTileCount = 0;

  acquireTileIndex(tileId: number): number {
    for (let index = 0; index <= DemoTileOrganizer.MAX_TILES; index++) {
      if (this.tiles[index] === tileId) {
        return index;
      }
    }
    for (let index = 0; index <= DemoTileOrganizer.MAX_TILES; index++) {
      if (!(index in this.tiles)) {
        this.tiles[index] = tileId;
        this.remoteTileCount++;
        return index;
      }
    }
    throw new Error('no tiles are available');
  }

  releaseTileIndex(tileId: number): number {
    for (let index = 0; index <= DemoTileOrganizer.MAX_TILES; index++) {
      if (this.tiles[index] === tileId) {
        this.remoteTileCount--;
        delete this.tiles[index];
        return index;
      }
    }
    return DemoTileOrganizer.MAX_TILES;
  }
}

// Support a set of query parameters to allow for testing pre-release versions of
// Amazon Voice Focus. If none of these parameters are supplied, the SDK default
// values will be used.
const search = new URLSearchParams(document.location.search);
const VOICE_FOCUS_CDN = search.get('voiceFocusCDN') || undefined;
const VOICE_FOCUS_ASSET_GROUP = search.get('voiceFocusAssetGroup') || undefined;
const VOICE_FOCUS_REVISION_ID = search.get('voiceFocusRevisionID') || undefined;

const VOICE_FOCUS_PATHS: VoiceFocusPaths | undefined = VOICE_FOCUS_CDN && {
  processors: `${VOICE_FOCUS_CDN}processors/`,
  wasm: `${VOICE_FOCUS_CDN}wasm/`,
  workers: `${VOICE_FOCUS_CDN}workers/`,
  models: `${VOICE_FOCUS_CDN}wasm/`,
};

const VOICE_FOCUS_SPEC = {
  assetGroup: VOICE_FOCUS_ASSET_GROUP,
  revisionID: VOICE_FOCUS_REVISION_ID,
  paths: VOICE_FOCUS_PATHS,
};

type VideoFilterName = 'Emojify' | 'CircularCut' | 'NoOp' | 'Segmentation' | 'None';

const VIDEO_FILTERS: VideoFilterName[] = ['Emojify', 'CircularCut', 'NoOp'];

class TestSound {
  static testAudioElement = new Audio();

  constructor(
    private logger: Logger,
    private sinkId: string | null,
    private frequency: number = 440,
    private durationSec: number = 1,
    private rampSec: number = 0.1,
    private maxGainValue: number = 0.1
  ) {}

  async init(): Promise<void> {
    const audioContext: AudioContext = new (window.AudioContext || window.webkitAudioContext)();
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0;
    const oscillatorNode = audioContext.createOscillator();
    oscillatorNode.frequency.value = this.frequency;
    oscillatorNode.connect(gainNode);
    const destinationStream = audioContext.createMediaStreamDestination();
    gainNode.connect(destinationStream);
    const currentTime = audioContext.currentTime;
    const startTime = currentTime + 0.1;
    gainNode.gain.linearRampToValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(this.maxGainValue, startTime + this.rampSec);
    gainNode.gain.linearRampToValueAtTime(
      this.maxGainValue,
      startTime + this.rampSec + this.durationSec
    );
    gainNode.gain.linearRampToValueAtTime(0, startTime + this.rampSec * 2 + this.durationSec);
    oscillatorNode.start();
    const audioMixController = new DefaultAudioMixController(this.logger);
    if (new DefaultBrowserBehavior().supportsSetSinkId()) {
      try {
        // @ts-ignore
        await audioMixController.bindAudioDevice({ deviceId: this.sinkId });
      } catch (e) {
        fatal(e);
        this.logger?.error(`Failed to bind audio device: ${e}`);
      }
    }
    try {
      await audioMixController.bindAudioElement(TestSound.testAudioElement);
    } catch (e) {
      fatal(e);
      this.logger?.error(`Failed to bind audio element: ${e}`);
    }
    await audioMixController.bindAudioStream(destinationStream.stream);
    new TimeoutScheduler((this.rampSec * 2 + this.durationSec + 1) * 1000).start(() => {
      audioContext.close();
    });
  }
}

export enum ContentShareType {
  ScreenCapture,
  VideoFile,
}

const SimulcastLayerMapping = {
  [SimulcastLayers.Low]: 'Low',
  [SimulcastLayers.LowAndMedium]: 'Low and Medium',
  [SimulcastLayers.LowAndHigh]: 'Low and High',
  [SimulcastLayers.Medium]: 'Medium',
  [SimulcastLayers.MediumAndHigh]: 'Medium and High',
  [SimulcastLayers.High]: 'High',
};

interface Toggle {
  name: string;
  oncreate: (elem: HTMLElement) => void;
  action: () => void;
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
  static readonly LOGGER_BATCH_SIZE: number = 85;
  static readonly LOGGER_INTERVAL_MS: number = 2_000;
  static readonly MAX_MEETING_HISTORY_MS: number = 5 * 60 * 1000;
  static readonly DATA_MESSAGE_TOPIC: string = 'chat';
  static readonly DATA_MESSAGE_LIFETIME_MS: number = 300_000;

  // Ideally we don't need to change this. Keep this configurable in case users have a super slow network.
  loadingBodyPixDependencyTimeoutMs: number = 10_000;
  loadingBodyPixDependencyPromise: undefined | Promise<void>;

  attendeeIdPresenceHandler: (undefined | ((attendeeId: string, present: boolean, externalUserId: string, dropped: boolean) => void)) = undefined;
  activeSpeakerHandler: (undefined | ((attendeeIds: string[]) => void)) = undefined;

  showActiveSpeakerScores = false;
  activeSpeakerLayout = true;
  meeting: string | null = null;
  name: string | null = null;
  voiceConnectorId: string | null = null;
  sipURI: string | null = null;
  region: string | null = null;
  meetingSession: MeetingSession | null = null;
  priorityBasedDownlinkPolicy: VideoPriorityBasedPolicy | null = null;
  audioVideo: AudioVideoFacade | null = null;
  tileOrganizer: DemoTileOrganizer = new DemoTileOrganizer();
  canStartLocalVideo: boolean = true;
  defaultBrowserBehaviour: DefaultBrowserBehavior = new DefaultBrowserBehavior();

  // eslint-disable-next-line
  roster: any = {};
  tileIndexToTileId: { [id: number]: number } = {};
  tileIdToTileIndex: { [id: number]: number } = {};
  tileIndexToPauseEventListener: { [id: number]: (event: Event) => void } = {};
  tileIndexToPinEventListener: { [id: number]: (event: Event) => void } = {};
  tileArea = document.getElementById('tile-area') as HTMLDivElement;

  cameraDeviceIds: string[] = [];
  microphoneDeviceIds: string[] = [];
  currentAudioInputDevice: AudioInputDevice | undefined;

  buttonStates: { [key: string]: boolean } = {
    'button-microphone': true,
    'button-camera': false,
    'button-speaker': true,
    'button-content-share': false,
    'button-pause-content-share': false,
    'button-video-stats': false,
    'button-video-filter': false,
    'button-record-self': false,
  };

  contentShareType: ContentShareType = ContentShareType.ScreenCapture;

  // feature flags
  enableWebAudio = false;
  enableUnifiedPlanForChromiumBasedBrowsers = true;
  enableSimulcast = false;
  usePriorityBasedDownlinkPolicy = false;
  videoPriorityBasedPolicyConfig = VideoPriorityBasedPolicyConfig.Default;

  supportsVoiceFocus = false;
  enableVoiceFocus = false;
  voiceFocusIsActive = false;

  markdown = require('markdown-it')({ linkify: true });
  lastMessageSender: string | null = null;
  lastReceivedMessageTimestamp = 0;
  meetingSessionPOSTLogger: MeetingSessionPOSTLogger;
  meetingEventPOSTLogger: MeetingSessionPOSTLogger;

  hasChromiumWebRTC: boolean = this.defaultBrowserBehaviour.hasChromiumWebRTC();

  voiceFocusTransformer: VoiceFocusDeviceTransformer | undefined;
  voiceFocusDevice: VoiceFocusTransformDevice | undefined;

  // This is an extremely minimal reactive programming approach: these elements
  // will be updated when the Amazon Voice Focus display state changes.
  voiceFocusDisplayables: HTMLElement[] = [];
  analyserNode: RemovableAnalyserNode;

  chosenVideoTransformDevice: DefaultVideoTransformDevice;
  chosenVideoFilter: VideoFilterName = 'None';
  selectedVideoFilterItem: VideoFilterName = 'None';

  meetingLogger: Logger | undefined = undefined;

  // If you want to make this a repeatable SPA, change this to 'spa'
  // and fix some state (e.g., video buttons).
  // Holding Shift while hitting the Leave button is handled by setting
  // this to `halt`, which allows us to stop and measure memory leaks.
  behaviorAfterLeave: 'spa' | 'reload' | 'halt' = 'reload';

  videoUpstreamMetricsKeyStats: { [key: string]: string } = {
    videoUpstreamGoogFrameHeight: 'Frame Height',
    videoUpstreamGoogFrameWidth: 'Frame Width',
    videoUpstreamFrameHeight: 'Frame Height',
    videoUpstreamFrameWidth: 'Frame Width',
    videoUpstreamBitrate: 'Bitrate (bps)',
    videoUpstreamPacketsSent: 'Packets Sent',
    videoUpstreamPacketLossPercent: 'Packet Loss (%)',
    videoUpstreamFramesEncodedPerSecond: 'Frame Rate',
  };

  videoDownstreamMetricsKeyStats: { [key: string]: string } = {
    videoDownstreamGoogFrameHeight: 'Frame Height',
    videoDownstreamGoogFrameWidth: 'Frame Width',
    videoDownstreamFrameHeight: 'Frame Height',
    videoDownstreamFrameWidth: 'Frame Width',
    videoDownstreamBitrate: 'Bitrate (bps)',
    videoDownstreamPacketLossPercent: 'Packet Loss (%)',
    videoDownstreamPacketsReceived: 'Packet Received',
    videoDownstreamFramesDecodedPerSecond: 'Frame Rate',
  };

  videoMetricReport: { [id: string]: { [id: string]: {} } } = {};

  removeFatalHandlers: () => void;

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
    this.setUpVideoTileElementResizer();
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

    try {
      this.supportsVoiceFocus = await VoiceFocusDeviceTransformer.isSupported(VOICE_FOCUS_SPEC, {
        logger,
      });
      if (this.supportsVoiceFocus) {
        this.voiceFocusTransformer = await this.getVoiceFocusDeviceTransformer();
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

  private async onVoiceFocusSettingChanged(): Promise<void> {
    this.log('[DEMO] Amazon Voice Focus setting toggled to', this.enableVoiceFocus);
    this.openAudioInputFromSelectionAndPreview();
  }

  initEventListeners(): void {
    if (!this.defaultBrowserBehaviour.hasChromiumWebRTC()) {
      (document.getElementById('simulcast') as HTMLInputElement).disabled = true;
      (document.getElementById('planB') as HTMLInputElement).disabled = true;
    }

    document.getElementById('priority-downlink-policy').addEventListener('change', e => {
      this.usePriorityBasedDownlinkPolicy = (document.getElementById('priority-downlink-policy') as HTMLInputElement).checked;

      const priorityBasedDownlinkPolicyConfig = document.getElementById(
        'priority-downlink-policy-preset'
      ) as HTMLSelectElement;

      if (this.usePriorityBasedDownlinkPolicy) {
        priorityBasedDownlinkPolicyConfig.style.display = 'block';
      } else {
        priorityBasedDownlinkPolicyConfig.style.display = 'none';
      }
    });

    const presetDropDown = document.getElementById('priority-downlink-policy-preset') as HTMLSelectElement;
    presetDropDown.addEventListener('change', async e => {
      switch (presetDropDown.value) {
        case 'stable':
          this.videoPriorityBasedPolicyConfig = VideoPriorityBasedPolicyConfig.StableNetworkPreset;
          break;
        case 'unstable':
          this.videoPriorityBasedPolicyConfig = VideoPriorityBasedPolicyConfig.UnstableNetworkPreset;
          break;
        case 'default':
          this.videoPriorityBasedPolicyConfig = VideoPriorityBasedPolicyConfig.Default;
          break;
      }
      this.log('priority-downlink-policy-preset is changed: ' + presetDropDown.value);
    });

    document.getElementById('form-authenticate').addEventListener('submit', e => {
      e.preventDefault();
      this.meeting = (document.getElementById('inputMeeting') as HTMLInputElement).value;
      this.name = (document.getElementById('inputName') as HTMLInputElement).value;
      this.region = (document.getElementById('inputRegion') as HTMLInputElement).value;
      this.enableSimulcast = (document.getElementById('simulcast') as HTMLInputElement).checked;
      this.enableEventReporting = (document.getElementById('event-reporting') as HTMLInputElement).checked;
      if (this.enableSimulcast) {
        const videoInputQuality = document.getElementById(
          'video-input-quality'
        ) as HTMLSelectElement;
        videoInputQuality.value = '720p';
      }
      this.enableWebAudio = (document.getElementById('webaudio') as HTMLInputElement).checked;
      // js sdk default to enable unified plan, equivalent to "Disable Unified Plan" default unchecked
      this.enableUnifiedPlanForChromiumBasedBrowsers = !(document.getElementById(
        'planB'
      ) as HTMLInputElement).checked;

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

          await this.initVoiceFocus();
          await this.populateAllDeviceLists();
          await this.populateVideoFilterInputList();

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
            this.audioVideo.start({ signalingOnly: true });
          }
        }
      );
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
    speechMonoCheckbox.addEventListener('change', _e => {
      if (speechMonoCheckbox.checked) {
        musicMonoCheckbox.checked = false;
      }
    });
    musicMonoCheckbox.addEventListener('change', _e => {
      if (musicMonoCheckbox.checked) {
        speechMonoCheckbox.checked = false;
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
          this.audioVideo.chooseVideoInputQuality(640, 360, 15, 600);
          break;
        case '540p':
          this.audioVideo.chooseVideoInputQuality(960, 540, 15, 1400);
          break;
        case '720p':
          this.audioVideo.chooseVideoInputQuality(1280, 720, 15, 1400);
          break;
      }
      try {
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
          this.audioVideo.stopVideoPreviewForVideoInput(
            document.getElementById('video-preview') as HTMLVideoElement
          );
          await this.join();
          this.audioVideo.chooseVideoInputDevice(null);
          this.hideProgress('progress-join');
          this.displayButtonStates();
          this.switchToFlow('flow-meeting');

          if (DEBUG_LOG_PPS) {
            this.logPPS();
            DEBUG_LOG_PPS = false;   // Only do this once.
          }
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
    buttonMute.addEventListener('mousedown', _e => {
      if (this.toggleButton('button-microphone')) {
        this.audioVideo.realtimeUnmuteLocalAudio();
      } else {
        this.audioVideo.realtimeMuteLocalAudio();
      }
    });

    const buttonRecordSelf = document.getElementById('button-record-self');
    let recorder: MediaRecorder;
    buttonRecordSelf.addEventListener('click', _e => {
      const chunks: Blob[] = [];
      AsyncScheduler.nextTick(async () => {
        if (!this.toggleButton('button-record-self')) {
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
        if (this.toggleButton('button-camera') && this.canStartLocalVideo) {
          try {
            let camera: string = videoInput.value;
            if (videoInput.value === 'None') {
              camera = this.cameraDeviceIds.length ? this.cameraDeviceIds[0] : 'None';
            }
            await this.openVideoInputFromSelection(camera, false);
            this.audioVideo.startLocalVideoTile();
          } catch (err) {
            fatal(err);
          }
        } else {
          this.audioVideo.stopLocalVideoTile();
          this.hideTile(DemoTileOrganizer.MAX_TILES);
        }
      });
    });

    const buttonPauseContentShare = document.getElementById('button-pause-content-share');
    buttonPauseContentShare.addEventListener('click', _e => {
      if (!this.isButtonOn('button-content-share')) {
        return;
      }
      AsyncScheduler.nextTick(async () => {
        if (this.toggleButton('button-pause-content-share')) {
          this.audioVideo.pauseContentShare();
          if (this.contentShareType === ContentShareType.VideoFile) {
            const videoFile = document.getElementById('content-share-video') as HTMLVideoElement;
            videoFile.pause();
          }
        } else {
          this.audioVideo.unpauseContentShare();
          if (this.contentShareType === ContentShareType.VideoFile) {
            const videoFile = document.getElementById('content-share-video') as HTMLVideoElement;
            await videoFile.play();
          }
        }
      });
    });

    const buttonContentShare = document.getElementById('button-content-share');
    buttonContentShare.addEventListener('click', _e => {
      AsyncScheduler.nextTick(() => {
        if (!this.isButtonOn('button-content-share')) {
          this.contentShareStart();
        } else {
          this.contentShareStop();
        }
      });
    });

    const buttonSpeaker = document.getElementById('button-speaker');
    buttonSpeaker.addEventListener('click', _e => {
      AsyncScheduler.nextTick(async () => {
        if (this.toggleButton('button-speaker')) {
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

    const buttonVideoStats = document.getElementById('button-video-stats');
    buttonVideoStats.addEventListener('click', () => {
      if (this.isButtonOn('button-video-stats')) {
        document.querySelectorAll('.stats-info').forEach(e => e.remove());
      } else {
        this.getRelayProtocol();
      }
      this.toggleButton('button-video-stats');
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

  logPPS() {
    let start = 0;
    let packets = 0;
    setInterval(async () => {
      if (!this.audioVideo) {
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stats = await this.audioVideo.getRTCPeerConnectionStats() as RTCStatsReport & RTCStats & Map<string, any>;

      if (!stats) {
        return;
      }

      if (!start) {
        start = Date.now();
        return;
      }

      for (const [_, entry] of stats.entries()) {
        if (entry.type === 'outbound-rtp') {
          const now = Date.now();
          const deltat = now - start;
          const deltap = entry.packetsSent - packets;
          console.info('PPS:', (1000 * deltap) / deltat);
          start = now;
          packets = entry.packetsSent;
          return;
        }
      }
    }, 1_000);
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



  toggleButton(button: string, state?: 'on' | 'off'): boolean {
    if (state === 'on') {
      this.buttonStates[button] = true;
    } else if (state === 'off') {
      this.buttonStates[button] = false;
    } else {
      this.buttonStates[button] = !this.buttonStates[button];
    }
    this.displayButtonStates();
    return this.buttonStates[button];
  }

  isButtonOn(button: string): boolean {
    return this.buttonStates[button];
  }

  displayButtonStates(): void {
    for (const button in this.buttonStates) {
      const element = document.getElementById(button);
      const drop = document.getElementById(`${button}-drop`);
      const on = this.buttonStates[button];
      element.classList.add(on ? 'btn-success' : 'btn-outline-secondary');
      element.classList.remove(on ? 'btn-outline-secondary' : 'btn-success');
      (element.firstElementChild as SVGElement).classList.add(on ? 'svg-active' : 'svg-inactive');
      (element.firstElementChild as SVGElement).classList.remove(
        on ? 'svg-inactive' : 'svg-active'
      );
      if (drop) {
        drop.classList.add(on ? 'btn-success' : 'btn-outline-secondary');
        drop.classList.remove(on ? 'btn-outline-secondary' : 'btn-success');
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
  }

  estimatedDownlinkBandwidthLessThanRequired(
    estimatedDownlinkBandwidthKbps: number,
    requiredVideoDownlinkBandwidthKbps: number
  ): void {
    this.log(
      `Estimated downlink bandwidth is ${estimatedDownlinkBandwidthKbps} is less than required bandwidth for video ${requiredVideoDownlinkBandwidthKbps}`
    );
  }

  videoNotReceivingEnoughData(videoReceivingReports: ClientVideoStreamReceivingReport[]): void {
    this.log(
      `One or more video streams are not receiving expected amounts of data ${JSON.stringify(
        videoReceivingReports
      )}`
    );
  }

  metricsDidReceive(clientMetricReport: ClientMetricReport): void {
    const metricReport = clientMetricReport.getObservableMetrics();
    this.videoMetricReport = clientMetricReport.getObservableVideoMetrics();
    if (
      typeof metricReport.availableSendBandwidth === 'number' &&
      !isNaN(metricReport.availableSendBandwidth)
    ) {
      (document.getElementById('video-uplink-bandwidth') as HTMLSpanElement).innerText =
        'Available Uplink Bandwidth: ' +
        String(metricReport.availableSendBandwidth / 1000) +
        ' Kbps';
    } else if (
      typeof metricReport.availableOutgoingBitrate === 'number' &&
      !isNaN(metricReport.availableOutgoingBitrate)
    ) {
      (document.getElementById('video-uplink-bandwidth') as HTMLSpanElement).innerText =
        'Available Uplink Bandwidth: ' +
        String(metricReport.availableOutgoingBitrate / 1000) +
        ' Kbps';
    } else {
      (document.getElementById('video-uplink-bandwidth') as HTMLSpanElement).innerText =
        'Available Uplink Bandwidth: Unknown';
    }

    if (
      typeof metricReport.availableReceiveBandwidth === 'number' &&
      !isNaN(metricReport.availableReceiveBandwidth)
    ) {
      (document.getElementById('video-downlink-bandwidth') as HTMLSpanElement).innerText =
        'Available Downlink Bandwidth: ' +
        String(metricReport.availableReceiveBandwidth / 1000) +
        ' Kbps';
    } else if (
      typeof metricReport.availableIncomingBitrate === 'number' &&
      !isNaN(metricReport.availableIncomingBitrate)
    ) {
      (document.getElementById('video-downlink-bandwidth') as HTMLSpanElement).innerText =
        'Available Downlink Bandwidth: ' +
        String(metricReport.availableIncomingBitrate / 1000) +
        ' Kbps';
    } else {
      (document.getElementById('video-downlink-bandwidth') as HTMLSpanElement).innerText =
        'Available Downlink Bandwidth: Unknown';
    }

    this.isButtonOn('button-video-stats') && this.showVideoWebRTCStats(this.videoMetricReport);
  }

  showVideoWebRTCStats(videoMetricReport: { [id: string]: { [id: string]: {} } }): void {
    const videoTiles = this.audioVideo.getAllVideoTiles();
    if (videoTiles.length === 0) {
      return;
    }
    for (const videoTile of videoTiles) {
      const tileState = videoTile.state();
      if (tileState.paused || tileState.isContent) {
        continue;
      }
      const tileId = videoTile.id();
      const tileIndex = this.tileIdToTileIndex[tileId];
      if (tileState.localTile) {
        this.showVideoStats(tileIndex, this.videoUpstreamMetricsKeyStats, videoMetricReport[tileState.boundAttendeeId], 'Upstream');
      } else {
        this.showVideoStats(tileIndex, this.videoDownstreamMetricsKeyStats, videoMetricReport[tileState.boundAttendeeId], 'Downstream');
      }
    }
  }

  showVideoStats = (
    tileIndex: number,
    keyStatstoShow: { [key: string]: string },
    metricsData: { [id: string]: {[key: string]: number} },
    streamDirection: string,
  ): void => {
    const streams = metricsData ? Object.keys(metricsData) : [];
    if (streams.length === 0) {
      return;
    }

    let statsInfo: HTMLDivElement = document.getElementById(
      `stats-info-${tileIndex}`
    ) as HTMLDivElement;
    if (!statsInfo) {
      statsInfo = document.createElement('div');
      statsInfo.setAttribute('id', `stats-info-${tileIndex}`);
      statsInfo.setAttribute('class', `stats-info`);
    }

    const statsInfoTableId = `stats-table-${tileIndex}`;
    let statsInfoTable = document.getElementById(statsInfoTableId) as HTMLTableElement;
    if (statsInfoTable) {
      statsInfo.removeChild(statsInfoTable);
    }
    statsInfoTable = document.createElement('table') as HTMLTableElement;
    statsInfoTable.setAttribute('id', statsInfoTableId);
    statsInfoTable.setAttribute('class', 'stats-table');
    statsInfo.appendChild(statsInfoTable);

    const videoEl = document.getElementById(`video-${tileIndex}`) as HTMLVideoElement;
    videoEl.insertAdjacentElement('afterend', statsInfo);
    const header = statsInfoTable.insertRow(-1);
    let cell = header.insertCell(-1);
    cell.innerHTML = 'Video statistics';
    for (let cnt = 0; cnt < streams.length; cnt++) {
      cell = header.insertCell(-1);
      cell.innerHTML = `${streamDirection} ${cnt + 1}`;
    }

    for (const ssrc of streams) {
      for (const [metricName, value] of Object.entries(metricsData[ssrc])) {
        if (keyStatstoShow[metricName]) {
          const rowElement = document.getElementById(
            `${metricName}-${tileIndex}`
          ) as HTMLTableRowElement;
          const row = rowElement ? rowElement : statsInfoTable.insertRow(-1);
          if (!rowElement) {
            row.setAttribute('id', `${metricName}-${tileIndex}`);
            cell = row.insertCell(-1);
            cell.innerHTML = keyStatstoShow[metricName];
          }
            cell = row.insertCell(-1);
            cell.innerHTML = `${value}`;
        }
      }
    }
  };

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
      case 'attendeePresenceReceived': {
        // Exclude the "meetingHistory" attribute for successful events.
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
    const logLevel = LogLevel.INFO;
    const consoleLogger = (this.meetingLogger = new ConsoleLogger('SDK', logLevel));
    if (this.isLocalHost()) {
      this.meetingLogger = consoleLogger;
    } else {
      await Promise.all([
        this.createLogStream(configuration, 'create_log_stream'),
        this.createLogStream(configuration, 'create_browser_event_log_stream'),
      ]);
      this.meetingSessionPOSTLogger = new MeetingSessionPOSTLogger(
        'SDK',
        configuration,
        DemoMeetingApp.LOGGER_BATCH_SIZE,
        DemoMeetingApp.LOGGER_INTERVAL_MS,
        `${DemoMeetingApp.BASE_URL}logs`,
        logLevel
      );
      this.meetingLogger = new MultiLogger(
        consoleLogger,
        this.meetingSessionPOSTLogger,
      );
      this.meetingEventPOSTLogger = new MeetingSessionPOSTLogger(
        'SDKEvent',
        configuration,
        DemoMeetingApp.LOGGER_BATCH_SIZE,
        DemoMeetingApp.LOGGER_INTERVAL_MS,
        `${DemoMeetingApp.BASE_URL}log_meeting_event`,
        logLevel
      );
    }
    this.eventReporter = await this.setupEventReporter(configuration);
    const deviceController = new DefaultDeviceController(this.meetingLogger, {
      enableWebAudio: this.enableWebAudio,
    });
    configuration.enableUnifiedPlanForChromiumBasedBrowsers = this.enableUnifiedPlanForChromiumBasedBrowsers;
    const urlParameters = new URL(window.location.href).searchParams;
    const timeoutMs = Number(urlParameters.get('attendee-presence-timeout-ms'));
    if (!isNaN(timeoutMs)) {
      configuration.attendeePresenceTimeoutMs = Number(timeoutMs);
    }
    configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = this.enableSimulcast;
    if (this.usePriorityBasedDownlinkPolicy) {
      this.priorityBasedDownlinkPolicy = new VideoPriorityBasedPolicy(this.meetingLogger);
      configuration.videoDownlinkBandwidthPolicy = this.priorityBasedDownlinkPolicy;
      this.priorityBasedDownlinkPolicy.addObserver(this);
    }

    this.meetingSession = new DefaultMeetingSession(
      configuration,
      this.meetingLogger,
      deviceController,
      this.eventReporter
    );
    if (this.usePriorityBasedDownlinkPolicy) {
      this.priorityBasedDownlinkPolicy = new VideoPriorityBasedPolicy(this.meetingLogger, this.videoPriorityBasedPolicyConfig);
      configuration.videoDownlinkBandwidthPolicy = this.priorityBasedDownlinkPolicy;
    }

    if ((document.getElementById('fullband-speech-mono-quality') as HTMLInputElement).checked) {
      this.meetingSession.audioVideo.setAudioProfile(AudioProfile.fullbandSpeechMono());
      this.meetingSession.audioVideo.setContentAudioProfile(AudioProfile.fullbandSpeechMono());
    } else if (
      (document.getElementById('fullband-music-mono-quality') as HTMLInputElement).checked
    ) {
      this.meetingSession.audioVideo.setAudioProfile(AudioProfile.fullbandMusicMono());
      this.meetingSession.audioVideo.setContentAudioProfile(AudioProfile.fullbandMusicMono());
    }
    this.audioVideo = this.meetingSession.audioVideo;
    if (this.enableSimulcast) {
      this.audioVideo.chooseVideoInputQuality(1280, 720, 15, 1400);
    }
    this.audioVideo.addDeviceChangeObserver(this);
    this.setupDeviceLabelTrigger();
    this.setupMuteHandler();
    this.setupCanUnmuteHandler();
    this.setupSubscribeToAttendeeIdPresenceHandler();
    this.setupDataMessage();
    this.audioVideo.addObserver(this);
    this.audioVideo.addContentShareObserver(this);
    this.initContentShareDropDownItems();
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
      const eventReportingPOSTLogger = new MeetingSessionPOSTLogger(
        'SDKEventIngestion',
        configuration,
        DemoMeetingApp.LOGGER_BATCH_SIZE,
        DemoMeetingApp.LOGGER_INTERVAL_MS,
        `${DemoMeetingApp.BASE_URL}log_event_ingestion`,
        LogLevel.DEBUG
      );
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

    this.audioVideo.start();
  }

  async leave(): Promise<void> {
    this.resetStats();
    this.audioVideo.stop();
    await this.voiceFocusDevice?.stop();
    this.voiceFocusDevice = undefined;

    await this.chosenVideoTransformDevice?.stop();
    this.chosenVideoTransformDevice = undefined;
    this.roster = {};
  }

  setupMuteHandler(): void {
    const handler = (isMuted: boolean): void => {
      this.log(`muted = ${isMuted}`);
    };
    this.audioVideo.realtimeSubscribeToMuteAndUnmuteLocalAudio(handler);
    const isMuted = this.audioVideo.realtimeIsLocalAudioMuted();
    handler(isMuted);
  }

  setupCanUnmuteHandler(): void {
    const handler = (canUnmute: boolean): void => {
      this.log(`canUnmute = ${canUnmute}`);
    };
    this.audioVideo.realtimeSubscribeToSetCanUnmuteLocalAudio(handler);
    handler(this.audioVideo.realtimeCanUnmuteLocalAudio());
  }

  updateRoster(): void {
    const roster = document.getElementById('roster');
    const newRosterCount = Object.keys(this.roster).length;
    while (roster.getElementsByTagName('li').length < newRosterCount) {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.appendChild(document.createElement('span'));
      li.appendChild(document.createElement('span'));
      roster.appendChild(li);
    }
    while (roster.getElementsByTagName('li').length > newRosterCount) {
      roster.removeChild(roster.getElementsByTagName('li')[0]);
    }
    const entries = roster.getElementsByTagName('li');
    let i = 0;
    for (const attendeeId in this.roster) {
      const spanName = entries[i].getElementsByTagName('span')[0];
      const spanStatus = entries[i].getElementsByTagName('span')[1];
      let statusClass = 'badge badge-pill ';
      let statusText = '\xa0'; // &nbsp
      if (this.roster[attendeeId].signalStrength < 1) {
        statusClass += 'badge-warning';
      } else if (this.roster[attendeeId].signalStrength === 0) {
        statusClass += 'badge-danger';
      } else if (this.roster[attendeeId].muted) {
        statusText = 'MUTED';
        statusClass += 'badge-secondary';
      } else if (this.roster[attendeeId].active) {
        statusText = 'SPEAKING';
        statusClass += 'badge-success';
      }
      this.updateProperty(spanName, 'innerText', this.roster[attendeeId].name);
      this.updateProperty(spanStatus, 'innerText', statusText);
      this.updateProperty(spanStatus, 'className', statusClass);
      i++;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateProperty(obj: any, key: string, value: string): void {
    if (value !== undefined && obj[key] !== value) {
      obj[key] = value;
    }
  }

  setupSubscribeToAttendeeIdPresenceHandler(): void {
    const handler = (
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
        new DefaultModality(attendeeId).base() ===
        this.meetingSession.configuration.credentials.attendeeId;
      if (!present) {
        delete this.roster[attendeeId];
        this.updateRoster();
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
        this.contentShareStop();
      }
      if (!this.roster[attendeeId] || !this.roster[attendeeId].name) {
        this.roster[attendeeId] = {
          ...this.roster[attendeeId],
          ... {name: externalUserId.split('#').slice(-1)[0] + (isContentAttendee ? ' «Content»' : '')}
        };
      }
      this.audioVideo.realtimeSubscribeToVolumeIndicator(
        attendeeId,
        async (
          attendeeId: string,
          volume: number | null,
          muted: boolean | null,
          signalStrength: number | null
        ) => {
          if (!this.roster[attendeeId]) {
            return;
          }
          if (volume !== null) {
            this.roster[attendeeId].volume = Math.round(volume * 100);
          }
          if (muted !== null) {
            this.roster[attendeeId].muted = muted;
          }
          if (signalStrength !== null) {
            this.roster[attendeeId].signalStrength = Math.round(signalStrength * 100);
          }
          this.updateRoster();
        }
      );
    };

    this.attendeeIdPresenceHandler = handler;
    this.audioVideo.realtimeSubscribeToAttendeeIdPresence(handler);

    // Hang on to this so we can unsubscribe later.
    this.activeSpeakerHandler = (attendeeIds: string[]): void => {
      for (const attendeeId in this.roster) {
        this.roster[attendeeId].active = false;
      }
      for (const attendeeId of attendeeIds) {
        if (this.roster[attendeeId]) {
          this.roster[attendeeId].active = true;
          break; // only show the most active speaker
        }
      }
      this.layoutFeaturedTile();
    };

    const scoreHandler = (scores: { [attendeeId: string]: number }) => {
      for (const attendeeId in scores) {
        if (this.roster[attendeeId]) {
          this.roster[attendeeId].score = scores[attendeeId];
        }
      }
      this.updateRoster();
    };

    this.audioVideo.subscribeToActiveSpeakerDetector(
      new DefaultActiveSpeakerPolicy(),
      this.activeSpeakerHandler,
      scoreHandler,
      this.showActiveSpeakerScores ? 100 : 0
    );
  }

  async getStatsForOutbound(id: string): Promise<void> {
    const videoElement = document.getElementById(id) as HTMLVideoElement;
    const stream = videoElement.srcObject as MediaStream;
    const track = stream.getVideoTracks()[0];
    const basicReports: { [id: string]: number } = {};

    const reports = await this.audioVideo.getRTCPeerConnectionStats(track);
    let duration: number;

    reports.forEach(report => {
      if (report.type === 'outbound-rtp') {
        // remained to be calculated
        this.log(`${id} is bound to ssrc ${report.ssrc}`);
        basicReports['bitrate'] = report.bytesSent;
        basicReports['width'] = report.frameWidth;
        basicReports['height'] = report.frameHeight;
        basicReports['fps'] = report.framesEncoded;
        duration = report.timestamp;
      }
    });

    await new TimeoutScheduler(1000).start(() => {
      this.audioVideo.getRTCPeerConnectionStats(track).then(reports => {
        reports.forEach(report => {
          if (report.type === 'outbound-rtp') {
            duration = report.timestamp - duration;
            duration = duration / 1000;
            // remained to be calculated
            basicReports['bitrate'] = Math.trunc(
              ((report.bytesSent - basicReports['bitrate']) * 8) / duration
            );
            basicReports['width'] = report.frameWidth;
            basicReports['height'] = report.frameHeight;
            basicReports['fps'] = Math.trunc(
              (report.framesEncoded - basicReports['fps']) / duration
            );
            this.log(JSON.stringify(basicReports));
          }
        });
      });
    });
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

  // eslint-disable-next-line
  async joinMeeting(): Promise<any> {
    const response = await fetch(
      `${DemoMeetingApp.BASE_URL}join?title=${encodeURIComponent(
        this.meeting
      )}&name=${encodeURIComponent(this.name)}&region=${encodeURIComponent(this.region)}`,
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async endMeeting(): Promise<any> {
    await fetch(`${DemoMeetingApp.BASE_URL}end?title=${encodeURIComponent(this.meeting)}`, {
      method: 'POST',
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getAttendee(attendeeId: string): Promise<any> {
    const response = await fetch(
      `${DemoMeetingApp.BASE_URL}attendee?title=${encodeURIComponent(
        this.meeting
      )}&attendee=${encodeURIComponent(attendeeId)}`
    );
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
    this.audioVideo.setDeviceLabelTrigger(
      async (): Promise<MediaStream> => {
        if (this.isRecorder() || this.isBroadcaster()) {
          throw new Error('Recorder or Broadcaster does not need device labels');
        }
        this.switchToFlow('flow-need-permission');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        this.switchToFlow('flow-devices');
        return stream;
      }
    );
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
      option.value = devices[i].deviceId;
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
      this.createDropdownMenuItem(menu, '──────────', () => {}).classList.add('text-center');
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
      this.createDropdownMenuItem(menu, '──────────', () => {}).classList.add('text-center');
      for (const { name, oncreate, action } of additionalToggles) {
        const id = `toggle-${elementId}-${name.replace(/\s/g, '-')}`;
        const elem = this.createDropdownMenuItem(menu, name, action, id);
        oncreate(elem);
      }
    }
    if (!menu.firstElementChild) {
      this.createDropdownMenuItem(menu, 'Device selection unavailable', () => {});
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

  private async populateVideoFilterInputList(): Promise<void> {
    const genericName = 'Filter';
    let filters: VideoFilterName[] = ['None'];

    if (
      this.defaultBrowserBehaviour.supportsCanvasCapturedStreamPlayback() &&
      this.enableUnifiedPlanForChromiumBasedBrowsers
    ) {
      filters = filters.concat(VIDEO_FILTERS);
      if (platformCanSupportBodyPixWithoutDegradation()) {
        if (!this.loadingBodyPixDependencyPromise) {
          this.loadingBodyPixDependencyPromise = loadBodyPixDependency(this.loadingBodyPixDependencyTimeoutMs);
        }
        // do not use `await` to avoid blocking page loading
        this.loadingBodyPixDependencyPromise.then(() => {
          filters.push('Segmentation');
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
        }).catch(err => {
          this.log('Could not load BodyPix dependency', err);
        });
      }
    }

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

  async populateAudioInputList(): Promise<void> {
    const genericName = 'Microphone';
    const additionalDevices = ['None', '440 Hz'];
    const additionalToggles = [];

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

    this.populateDeviceList(
      'audio-input',
      genericName,
      await this.audioVideo.listAudioInputDevices(),
      additionalDevices
    );

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
          await this.openVideoInputFromSelection(name, false);
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
    const supportsChoosing = this.defaultBrowserBehaviour.supportsSetSinkId();
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
          await this.chooseAudioOutputDevice(name);
        } catch (e) {
          fatal(e);
          this.log('Failed to chooseAudioOutputDevice', e);
        }
      }
    );
  }

  private async chooseAudioOutputDevice(device: string): Promise<void> {
    // Set it for the content share stream if we can.
    const videoElem = document.getElementById('content-share-video') as HTMLVideoElement;
    if (this.defaultBrowserBehaviour.supportsSetSinkId()) {
      // @ts-ignore
      videoElem.setSinkId(device);
    }

    await this.audioVideo.chooseAudioOutputDevice(device);
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
      await this.audioVideo.chooseAudioInputDevice(device);
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
    if (this.defaultBrowserBehaviour.supportsSetSinkId()) {
      try {
        const audioOutput = document.getElementById('audio-output') as HTMLSelectElement;
        await this.chooseAudioOutputDevice(audioOutput.value);
      } catch (e) {
        fatal(e);
        this.log('failed to chooseAudioOutputDevice', e);
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
    if (selection) {
      this.selectedVideoInput = selection;
    }
    this.log(`Switching to: ${this.selectedVideoInput}`);
    const device = await this.videoInputSelectionToDevice(this.selectedVideoInput);
    if (device === null) {
      if (showPreview) {
        this.audioVideo.stopVideoPreviewForVideoInput(
          document.getElementById('video-preview') as HTMLVideoElement
        );
      }
      this.audioVideo.stopLocalVideoTile();
      this.toggleButton('button-camera', 'off');
      // choose video input null is redundant since we expect stopLocalVideoTile to clean up
      try {
        await this.audioVideo.chooseVideoInputDevice(device);
      } catch (e) {
        fatal(e);
        this.log(`failed to chooseVideoInputDevice ${device}`, e);
      }
      this.log('no video device selected');
    }
    try {
      await this.audioVideo.chooseVideoInputDevice(device);
    } catch (e) {
      fatal(e);
      this.log(`failed to chooseVideoInputDevice ${device}`, e);
    }

    if (showPreview) {
      this.audioVideo.startVideoPreviewForVideoInput(
        document.getElementById('video-preview') as HTMLVideoElement
      );
    }
  }

  private async audioInputSelectionToIntrinsicDevice(value: string): Promise<Device> {
    if (this.isRecorder() || this.isBroadcaster()) {
      return null;
    }

    if (value === '440 Hz') {
      return DefaultDeviceController.synthesizeAudioDevice(440);
    }

    if (value === 'None') {
      return null;
    }

    return value;
  }

  private async getVoiceFocusDeviceTransformer(): Promise<VoiceFocusDeviceTransformer> {
    if (this.voiceFocusTransformer) {
      return this.voiceFocusTransformer;
    }
    const logger = new ConsoleLogger('SDK', LogLevel.DEBUG);
    const transformer = await VoiceFocusDeviceTransformer.create(VOICE_FOCUS_SPEC, { logger });
    this.voiceFocusTransformer = transformer;
    return transformer;
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
      const transformer = await this.getVoiceFocusDeviceTransformer();
      const vf: VoiceFocusTransformDevice = await transformer.createTransformDevice(inner);
      if (vf) {
        return (this.voiceFocusDevice = vf);
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
      return DefaultDeviceController.synthesizeVideoDevice('blue');
    }

    if (value === 'SMPTE Color Bars') {
      return DefaultDeviceController.synthesizeVideoDevice('smpte');
    }

    return value;
  }

  private videoFilterToProcessor(videoFilter: VideoFilterName): VideoFrameProcessor | null {
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

    return null;
  }

  private async videoInputSelectionWithOptionalFilter(
    innerDevice: Device
  ): Promise<VideoInputDevice> {
    if (this.selectedVideoFilterItem === 'None') {
      return innerDevice;
    }

    if (
      this.chosenVideoTransformDevice &&
      this.selectedVideoFilterItem === this.chosenVideoFilter
    ) {
      if (this.chosenVideoTransformDevice.getInnerDevice() !== innerDevice) {
        // switching device
        this.chosenVideoTransformDevice = this.chosenVideoTransformDevice.chooseNewInnerDevice(
          innerDevice
        );
      }
      return this.chosenVideoTransformDevice;
    }

    // A different processor is selected then we need to discard old one and recreate
    if (this.chosenVideoTransformDevice) {
      await this.chosenVideoTransformDevice.stop();
    }

    const proc = this.videoFilterToProcessor(this.selectedVideoFilterItem);
    this.chosenVideoFilter = this.selectedVideoFilterItem;
    this.chosenVideoTransformDevice = new DefaultVideoTransformDevice(
      this.meetingLogger,
      innerDevice,
      [proc]
    );
    return this.chosenVideoTransformDevice;
  }

  private async videoInputSelectionToDevice(value: string): Promise<VideoInputDevice> {
    if (this.isRecorder() || this.isBroadcaster() || value === 'None') {
      return null;
    }
    const intrinsicDevice = this.videoInputSelectionToIntrinsicDevice(value);
    return await this.videoInputSelectionWithOptionalFilter(intrinsicDevice);
  }

  private initContentShareDropDownItems(): void {
    let item = document.getElementById('dropdown-item-content-share-screen-capture');
    item.addEventListener('click', () => {
      this.contentShareType = ContentShareType.ScreenCapture;
      this.contentShareStart();
    });

    item = document.getElementById('dropdown-item-content-share-screen-test-video');
    item.addEventListener('click', () => {
      this.contentShareType = ContentShareType.VideoFile;
      this.contentShareStart(DemoMeetingApp.testVideo);
    });

    document.getElementById('content-share-item').addEventListener('change', () => {
      const fileList = document.getElementById('content-share-item') as HTMLInputElement;
      const file = fileList.files[0];
      if (!file) {
        this.log('no content share selected');
        return;
      }
      const url = URL.createObjectURL(file);
      this.log(`content share selected: ${url}`);
      this.contentShareType = ContentShareType.VideoFile;
      this.contentShareStart(url);
      fileList.value = '';
      (document.getElementById('dropdown-item-content-share-file-item') as HTMLDivElement).click();
    });

    document.getElementById('dropdown-item-content-share-stop').addEventListener('click', () => {
      this.contentShareStop();
    });
  }

  private async playToStream(videoFile: HTMLVideoElement): Promise<MediaStream> {
    await videoFile.play();

    if (this.defaultBrowserBehaviour.hasFirefoxWebRTC()) {
      // @ts-ignore
      return videoFile.mozCaptureStream();
    }

    // @ts-ignore
    return videoFile.captureStream();
  }

  private async contentShareStart(videoUrl?: string): Promise<void> {
    switch (this.contentShareType) {
      case ContentShareType.ScreenCapture: {
        try {
          await this.audioVideo.startContentShareFromScreenCapture();
        } catch (e) {
          this.meetingLogger?.error(`Could not start content share: ${e}`);
          return;
        }
        break;
      }
      case ContentShareType.VideoFile: {
        const videoFile = document.getElementById('content-share-video') as HTMLVideoElement;
        if (videoUrl) {
          videoFile.src = videoUrl;
        }

        const mediaStream = await this.playToStream(videoFile);
        try {
          // getDisplayMedia can throw.
          await this.audioVideo.startContentShare(mediaStream);
        } catch (e) {
          this.meetingLogger?.error(`Could not start content share: ${e}`);
          return;
        }
        break;
      }
    }

    this.toggleButton('button-content-share', 'on');
    this.updateContentShareDropdown(true);
  }

  private async contentShareStop(): Promise<void> {
    this.audioVideo.stopContentShare();
    this.toggleButton('button-pause-content-share', 'off');
    this.toggleButton('button-content-share', 'off');
    this.updateContentShareDropdown(false);

    if (this.contentShareType === ContentShareType.VideoFile) {
      const videoFile = document.getElementById('content-share-video') as HTMLVideoElement;
      videoFile.pause();
      videoFile.style.display = 'none';
    }
  }

  private updateContentShareDropdown(enabled: boolean): void {
    document.getElementById('dropdown-item-content-share-screen-capture').style.display = enabled ? 'none' : 'block';
    document.getElementById('dropdown-item-content-share-screen-test-video').style.display = enabled ? 'none' : 'block';
    document.getElementById('dropdown-item-content-share-file-item').style.display = enabled ? 'none' : 'block';
    document.getElementById('dropdown-item-content-share-stop').style.display = enabled ? 'block' : 'none';
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
    const joinInfo = (await this.joinMeeting()).JoinInfo;
    const configuration = new MeetingSessionConfiguration(joinInfo.Meeting, joinInfo.Attendee);
    await this.initializeMeetingSession(configuration);
    const url = new URL(window.location.href);
    url.searchParams.set('m', this.meeting);
    history.replaceState({}, `${this.meeting}`, url.toString());
    return configuration.meetingId;
  }

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

      // Stop watching device changes in the UI.
      this.audioVideo.removeDeviceChangeObserver(this);

      // Stop content share and local video.
      await this.audioVideo.stopLocalVideoTile();
      await this.audioVideo.stopContentShare();

      // Drop the audio output.
      await this.audioVideo.chooseAudioOutputDevice(null);
      this.audioVideo.unbindAudioElement();

      // Stop any video processor.
      await this.chosenVideoTransformDevice?.stop();

      // Stop Voice Focus.
      await this.voiceFocusDevice?.stop();

      // If you joined and left the meeting, `CleanStoppedSessionTask` will have deselected
      // any input streams. If you didn't, you need to call `chooseAudioInputDevice` here.

      // Clean up the loggers so they don't keep their `onload` listeners around.
      setTimeout(async () => {
        await this.meetingEventPOSTLogger?.destroy();
        await this.meetingSessionPOSTLogger?.destroy();
      }, 500);

      if (isDestroyable(this.eventReporter)) {
        this.eventReporter?.destroy();
      }

      this.audioVideo = undefined;
      this.voiceFocusDevice = undefined;
      this.meetingSession = undefined;
      this.activeSpeakerHandler = undefined;
      this.currentAudioInputDevice = undefined;
      this.eventReporter = undefined;
    };

    const onLeftMeeting = async () => {
      await cleanUpResources();
      returnToStart();
    };

    if (sessionStatus.statusCode() === MeetingSessionStatusCode.AudioCallEnded) {
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

  createPauseResumeListener(tileState: VideoTileState): (event: Event) => void {
      return (event: Event): void => {
        if (!tileState.paused) {
            this.audioVideo.pauseVideoTile(tileState.tileId);
            (event.target as HTMLButtonElement).innerText = 'Resume';
          } else {
            this.audioVideo.unpauseVideoTile(tileState.tileId);
            (event.target as HTMLButtonElement).innerText = 'Pause';
          }
        }
  }

  createPinUnpinListener(tileState: VideoTileState): (event: Event) => void {
    return (event: Event): void => {
      const attendeeId = tileState.boundAttendeeId;
        if (this.roster[attendeeId].pinned ) {
          (event.target as HTMLButtonElement).innerText = 'Pin';
          this.roster[attendeeId].pinned = false;
        } else {
          (event.target as HTMLButtonElement).innerText = 'Unpin';
          this.roster[attendeeId].pinned = true;
        }
        this.updateDownlinkPreference();
      }
  }

  updateDownlinkPreference(): void {
    const videoPreferences = VideoPreferences.prepare();
    for (const attendeeId in this.roster) {
      if (this.roster[attendeeId].hasVideo) {
        if (this.roster[attendeeId].pinned) {
          videoPreferences.add(new VideoPreference(attendeeId, 1, TargetDisplaySize.High));
          this.log(`Pinned video: bwe: new preferences: ${JSON.stringify(videoPreferences)}`);
        }
        else {
          videoPreferences.add(new VideoPreference(attendeeId, 2, TargetDisplaySize.Low));
          this.log(`Unpinned: bwe: new preferences: ${JSON.stringify(videoPreferences)}`);
        }
      }
    }
    this.priorityBasedDownlinkPolicy.chooseRemoteVideoSources(videoPreferences.build());
  }

  isContentTile(tileIndex: number): boolean {
    const tileId = this.tileIndexToTileId[tileIndex];
    if (!tileId) {
      return false;
    }
    const tile = this.audioVideo.getVideoTile(tileId);
    if (!tile) {
      return false;
    }
    return tile.state().isContent;
  }

  videoTileDidUpdate(tileState: VideoTileState): void {
    this.log(`video tile updated: ${JSON.stringify(tileState, null, '  ')}`);
    if (!tileState.boundAttendeeId) {
      return;
    }
    const tileIndex = tileState.localTile
      ? 16
      : this.tileOrganizer.acquireTileIndex(tileState.tileId);
    const tileElement = document.getElementById(`tile-${tileIndex}`) as HTMLDivElement;
    const videoElement = document.getElementById(`video-${tileIndex}`) as HTMLVideoElement;
    const nameplateElement = document.getElementById(`nameplate-${tileIndex}`) as HTMLDivElement;
    const pauseStateElement = document.getElementById(`pause-state-${tileIndex}`) as HTMLDivElement;
    const attendeeIdElement = document.getElementById(`attendeeid-${tileIndex}`) as HTMLDivElement;
    const pauseButtonElement = document.getElementById(
      `video-pause-${tileIndex}`
    ) as HTMLButtonElement;
    const pinButtonElement = document.getElementById(
      `video-pin-${tileIndex}`
    ) as HTMLButtonElement;


    pauseButtonElement.removeEventListener('click', this.tileIndexToPauseEventListener[tileIndex]);
    this.tileIndexToPauseEventListener[tileIndex] = this.createPauseResumeListener(tileState);
    pauseButtonElement.addEventListener('click', this.tileIndexToPauseEventListener[tileIndex]);
    if (this.usePriorityBasedDownlinkPolicy) {
      this.log('pinButtonElement addEventListener for tileIndex ' + tileIndex);
      pinButtonElement.removeEventListener('click', this.tileIndexToPinEventListener[tileIndex]);
      this.tileIndexToPinEventListener[tileIndex] = this.createPinUnpinListener(tileState);
      pinButtonElement.addEventListener('click', this.tileIndexToPinEventListener[tileIndex]);
    }
    this.log(`binding video tile ${tileState.tileId} to ${videoElement.id}`);
    this.audioVideo.bindVideoElement(tileState.tileId, videoElement);
    this.tileIndexToTileId[tileIndex] = tileState.tileId;
    this.tileIdToTileIndex[tileState.tileId] = tileIndex;
    this.updateProperty(nameplateElement, 'innerText', tileState.boundExternalUserId.split('#')[1]);
    this.updateProperty(attendeeIdElement, 'innerText', tileState.boundAttendeeId);
    if (tileState.paused && this.roster[tileState.boundAttendeeId].bandwidthConstrained) {
      this.updateProperty(pauseStateElement, 'innerText', '⚡');
    } else {
      this.updateProperty(pauseStateElement, 'innerText', '');
    }
    this.showTile(tileElement, tileState);
    this.updateGridClasses();
    this.layoutFeaturedTile();
  }

  videoTileWasRemoved(tileId: number): void {
    const tileIndex = this.tileOrganizer.releaseTileIndex(tileId);
    this.log(`video tileId removed: ${tileId} from tile-${tileIndex}`);
    if (this.usePriorityBasedDownlinkPolicy) {
      const pinButtonElement = document.getElementById(`video-pin-${tileIndex}`) as HTMLButtonElement;
      pinButtonElement.removeEventListener('click', this.tileIndexToPinEventListener[tileIndex]);
    }
    this.hideTile(tileIndex);
    this.updateGridClasses();
  }

  videoAvailabilityDidChange(availability: MeetingSessionVideoAvailability): void {
    this.canStartLocalVideo = availability.canStartLocalVideo;
    this.log(`video availability changed: canStartLocalVideo  ${availability.canStartLocalVideo}`);
  }

  showTile(tileElement: HTMLDivElement, tileState: VideoTileState): void {
    tileElement.classList.add(`active`);

    if (tileState.isContent) {
      tileElement.classList.add('content');
    }
  }

  hideTile(tileIndex: number): void {
    const tileElement = document.getElementById(`tile-${tileIndex}`) as HTMLDivElement;
    tileElement.classList.remove('active', 'featured', 'content');
  }

  tileIdForAttendeeId(attendeeId: string): number | null {
    for (const tile of this.audioVideo.getAllVideoTiles()) {
      const state = tile.state();
      if (state.boundAttendeeId === attendeeId) {
        return state.tileId;
      }
    }
    return null;
  }

  findContentTileId(): number | null {
    for (const tile of this.audioVideo.getAllVideoTiles()) {
      const state = tile.state();
      if (state.isContent) {
        return state.tileId;
      }
    }
    return null;
  }

  activeTileId(): number | null {
    let contentTileId = this.findContentTileId();
    if (contentTileId !== null) {
      return contentTileId;
    }
    for (const attendeeId in this.roster) {
      if (this.roster[attendeeId].active) {
        return this.tileIdForAttendeeId(attendeeId);
      }
    }
    return null;
  }

  layoutFeaturedTile(): void {
    if (!this.meetingSession) {
      return;
    }
    const tilesIndices = this.visibleTileIndices();
    const localTileId = this.localTileId();
    const activeTile = this.activeTileId();

    for (let i = 0; i < tilesIndices.length; i++) {
      const tileIndex = tilesIndices[i];
      const tileElement = document.getElementById(`tile-${tileIndex}`) as HTMLDivElement;
      const tileId = this.tileIndexToTileId[tileIndex];

      if (tileId === activeTile && tileId !== localTileId) {
        tileElement.classList.add('featured');
      } else {
        tileElement.classList.remove('featured');
      }
    }

    this.updateGridClasses();
  }

  updateGridClasses(): void {
    const localTileId = this.localTileId();
    const activeTile = this.activeTileId();

    this.tileArea.className = `v-grid size-${this.availablelTileSize()}`;

    if (activeTile && activeTile !== localTileId) {
      this.tileArea.classList.add('featured');
    } else {
      this.tileArea.classList.remove('featured');
    }
  }

  availablelTileSize(): number {
    return (
      this.tileOrganizer.remoteTileCount + (this.audioVideo.hasStartedLocalVideoTile() ? 1 : 0)
    );
  }

  localTileId(): number | null {
    return this.audioVideo.hasStartedLocalVideoTile()
      ? this.audioVideo.getLocalVideoTile().state().tileId
      : null;
  }

  visibleTileIndices(): number[] {
    const tileKeys = Object.keys(this.tileOrganizer.tiles);
    const tiles = tileKeys.map(tileId => parseInt(tileId));
    return tiles;
  }

  setUpVideoTileElementResizer(): void {
    for (let i = 0; i <= DemoTileOrganizer.MAX_TILES; i++) {
      const videoElem = document.getElementById(`video-${i}`) as HTMLVideoElement;
      videoElem.onresize = () => {
        if (videoElem.videoHeight > videoElem.videoWidth) {
          // portrait mode
          videoElem.style.objectFit = 'contain';
          this.log(
            `video-${i} changed to portrait mode resolution ${videoElem.videoWidth}x${videoElem.videoHeight}`
          );
        } else {
          videoElem.style.objectFit = 'cover';
        }
      };
    }
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
  }

  contentShareDidStart(): void {
    this.log('content share started.');
  }

  contentShareDidStop(): void {
    this.log('content share stopped.');
    if (this.isButtonOn('button-content-share')) {
      this.buttonStates['button-content-share'] = false;
      this.buttonStates['button-pause-content-share'] = false;
      this.displayButtonStates();
      this.updateContentShareDropdown(false);
    }
  }

  contentShareDidPause(): void {
    this.log('content share paused.');
  }

  contentShareDidUnpause(): void {
    this.log(`content share unpaused.`);
  }

  encodingSimulcastLayersDidChange(simulcastLayers: SimulcastLayers): void {
    this.log(
      `current active simulcast layers changed to: ${SimulcastLayerMapping[simulcastLayers]}`
    );
  }

  remoteVideoSourcesDidChange(videoSources: VideoSource[]): void {
    this.log(`available remote video sources changed: ${JSON.stringify(videoSources)}`);
    if (!this.usePriorityBasedDownlinkPolicy) {
      return;
    }
    for (const attendeeId in this.roster) {
      this.roster[attendeeId].hasVideo = false;
    }
    for (const source of videoSources) {
      if (!(this.roster.hasOwnProperty(source.attendee.attendeeId))) {
        this.roster[source.attendee.attendeeId] = {
          hasVideo: true
        };
      }
      else {
        this.roster[source.attendee.attendeeId].hasVideo = true;
      }
    }
    this.updateDownlinkPreference();
  }

  tileWillBePausedByDownlinkPolicy(tileId: number): void {
    this.log(`Tile ${tileId} will be paused due to insufficient bandwidth`);
    const attendeeId = this.audioVideo.getVideoTile(tileId)?.state().boundAttendeeId;
    this.roster[attendeeId].bandwidthConstrained = true;
  }

  tileWillBeUnpausedByDownlinkPolicy(tileId: number): void {
    this.log(`Tile ${tileId} will be resumed due to sufficient bandwidth`);
    const attendeeId = this.audioVideo.getVideoTile(tileId)?.state().boundAttendeeId;
    this.roster[attendeeId].bandwidthConstrained = false;
  }
}

window.addEventListener('load', () => {
  new DemoMeetingApp();
});
