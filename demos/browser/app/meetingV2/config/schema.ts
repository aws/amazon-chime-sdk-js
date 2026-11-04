// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Every tunable the demo exposes is declared here once. The Settings dialog renders from this
 * list, `MeetingConfig` parses URL parameters and persists preferences from it, and the
 * integration tests find each control by its `id`, so the ids are part of the test contract.
 *
 * `audience` separates what a meeting attendee expects to see ("user") from the knobs SDK
 * developers, canaries and integration tests need ("developer"). Developer options are hidden
 * unless developer mode is on; see `MeetingConfig.developerMode`.
 */

export type OptionAudience = 'user' | 'developer';

/**
 * When a change takes effect: `live` immediately, `join` on the next join (the SDK reads it when
 * the session is created), `create` only when this attendee creates the meeting.
 */
export type OptionApplies = 'live' | 'join' | 'create';

export type OptionGroup =
  | 'general'
  | 'audio'
  | 'video'
  | 'captions'
  | 'meeting'
  | 'replica'
  | 'attendee';

export interface SelectChoice {
  value: string;
  label: string;
  /** Optional element id for the `<option>`, kept where the old markup had one. */
  id?: string;
}

export interface BooleanOption {
  type: 'boolean';
  default: boolean;
}

export interface SelectOption {
  type: 'select';
  default: string;
  choices: SelectChoice[];
  /** Show the choices side by side (a segmented control) instead of a dropdown. */
  segmented?: boolean;
}

export interface NumberOption {
  type: 'number';
  default: number | null;
  min?: number;
  max?: number;
  placeholder?: string;
}

export interface TextOption {
  type: 'text';
  default: string;
  placeholder?: string;
  /** Rendered as `<input type="color">`. */
  inputType?: 'color';
  /** Values from the URL or storage that do not match are ignored. */
  pattern?: RegExp;
}

/** How an option shows in Settings; `hidden` ones are set by another control instead. */
type Presentation =
  | {
      hidden?: false;
      label: string;
      help?: string;
      group: OptionGroup;
      /** A titled section at the end of the group's tab. */
      section?: string;
      /** Rendered inside the element with this id (contributed by the tab) instead of the list. */
      slot?: string;
      /** Hide the control unless the predicate holds for the current values. */
      showIf?: (values: ConfigValues) => boolean;
    }
  | {
      /** Never rendered in Settings (a pre-join toggle, a tile menu or only the URL sets it). */
      hidden: true;
    };

export type OptionSpec = {
  /** Property name on `ConfigValues`. */
  key: keyof ConfigValues;
  /** Element id of the rendered control. Stable: integration tests look these up. */
  id: string;
  /** URL query parameter. Legacy names are kept where tests and docs already use them. */
  param: string;
  audience: OptionAudience;
  applies: OptionApplies;
  /** Remember the user's choice in localStorage across sessions. */
  persist?: boolean;
} & Presentation &
  (BooleanOption | SelectOption | NumberOption | TextOption);

/** An option Settings renders. */
export type ShownOptionSpec = OptionSpec & { hidden?: false };

export interface ConfigValues {
  // General
  logLevel: string;
  theme: string;
  developerMode: boolean;
  // Audio
  joinMuted: boolean;
  noiseSuppression: boolean;
  echoReduction: boolean;
  disableAudioRedundancy: boolean;
  audioProfile: string;
  webAudio: boolean;
  // Video
  cameraOnAtJoin: boolean;
  mirrorSelfView: boolean;
  videoOnlyStage: boolean;
  videoCodec: string;
  enableSimulcast: boolean;
  enableSVC: boolean;
  priorityDownlinkPolicy: boolean;
  // Background effect
  backgroundEffect: 'none' | 'blur' | 'color' | 'image';
  backgroundBlurStrength: string;
  backgroundColor: string;
  backgroundModel: string;
  // Content
  contentCodec: string;
  maxContentShare: boolean;
  // Meeting creation
  videoMaxResolution: string;
  contentMaxResolution: string;
  maxAttendeeCount: number | null;
  replicaMeeting: boolean;
  primaryMeetingId: string;
  audioCapability: string;
  videoCapability: string;
  contentCapability: string;
  allowAttendeeCapabilities: boolean;
  // Network / session
  preconnect: boolean;
  viewOnly: boolean;
  attendeePresenceTimeoutMs: number | null;
  // Captions (live transcription)
  captionsSize: string;
  captionsLanguage: string;
  transcriptionEngine: string;
  transcriptionRegion: string;
  transcriptionIdentifyLanguage: boolean;
  transcriptionLanguageOptions: string;
  transcriptionPreferredLanguage: string;
  transcriptionVocabularyNames: string;
  transcriptionVocabularyFilterNames: string;
  transcriptionCustomLanguageModel: string;
  transcriptionPartialStabilization: boolean;
  transcriptionStability: string;
  transcriptionPiiIdentification: boolean;
  transcriptionPiiRedaction: boolean;
  transcriptionPiiEntityTypes: string;
  // Debug
  dieOnFatal: boolean;
  abortOnReconnect: boolean;
  behaviorAfterLeave: string;
}

const CAPABILITY_CHOICES: SelectChoice[] = [
  { value: 'SendReceive', label: 'Send and receive' },
  { value: 'Send', label: 'Send only' },
  { value: 'Receive', label: 'Receive only' },
  { value: 'None', label: 'None' },
];

const CODEC_CHOICES = (suffix: string): SelectChoice[] => [
  { value: 'default', label: 'Meeting default' },
  { value: 'vp8', label: 'VP8' },
  { value: 'h264ConstrainedBaselineProfile', label: 'H.264 Constrained Baseline' },
  { value: 'h264BaselineProfile', label: 'H.264 Baseline' },
  { value: 'h264MainProfile', label: 'H.264 Main' },
  { value: 'h264HighProfile', label: 'H.264 High' },
  { value: 'vp9Profile0', label: 'VP9 Profile 0', id: `vp9Profile0-${suffix}-codec` },
  { value: 'av1Main', label: 'AV1 Main', id: `av1Main-${suffix}-codec` },
];

/** Phones and tablets: Web Audio stays off there by default (battery, Safari quirks). */
export const IS_MOBILE_DEVICE =
  typeof navigator !== 'undefined' &&
  ((navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData?.mobile ===
    true ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));

export const OPTIONS: OptionSpec[] = [
  {
    key: 'theme',
    applies: 'live',
    id: 'theme',
    param: 'theme',
    label: 'Appearance',
    group: 'general',
    audience: 'user',
    persist: true,
    type: 'select',
    default: 'auto',
    choices: [
      { value: 'auto', label: 'Match system' },
      { value: 'dark', label: 'Dark' },
      { value: 'light', label: 'Light' },
    ],
  },
  {
    key: 'logLevel',
    applies: 'live',
    id: 'logLevelSelect',
    param: 'log-level',
    label: 'SDK log level',
    group: 'general',
    audience: 'developer',
    type: 'select',
    default: 'debug',
    choices: [
      { value: 'debug', label: 'Debug' },
      { value: 'info', label: 'Info' },
      { value: 'warn', label: 'Warn' },
      { value: 'error', label: 'Error' },
      { value: 'off', label: 'Off' },
    ],
  },

  {
    key: 'joinMuted',
    // Set from the pre-join microphone toggle.
    hidden: true,
    applies: 'join',
    id: 'join-muted',
    param: 'join-muted',
    audience: 'user',
    persist: true,
    type: 'boolean',
    default: false,
  },
  {
    key: 'noiseSuppression',
    applies: 'live',
    id: 'allow-voice-focus',
    param: 'voice-focus',
    label: 'Noise suppression (Amazon Voice Focus)',
    help: 'Downloads the Voice Focus model on first use. Needs Web Audio.',
    group: 'audio',
    audience: 'user',
    persist: true,
    type: 'boolean',
    default: false,
  },
  {
    key: 'echoReduction',
    applies: 'create',
    id: 'echo-reduction-capability',
    param: 'echo-reduction',
    label: 'Echo reduction',
    help: 'Removes echo along with noise suppression. Set when the meeting is created.',
    group: 'audio',
    audience: 'user',
    type: 'boolean',
    default: false,
  },
  {
    key: 'audioProfile',
    applies: 'join',
    id: 'audio-profile',
    param: 'audio-profile',
    label: 'Audio profile',
    group: 'audio',
    audience: 'developer',
    type: 'select',
    default: 'default',
    choices: [
      { value: 'default', label: 'Default' },
      { value: 'fullband-speech-mono', label: 'Fullband speech (mono)' },
      { value: 'fullband-music-mono', label: 'Fullband music (mono)' },
      { value: 'fullband-music-stereo', label: 'Fullband music (stereo)' },
    ],
  },
  {
    key: 'disableAudioRedundancy',
    applies: 'join',
    id: 'disable-audio-redundancy',
    param: 'disable-audio-redundancy',
    label: 'Disable audio redundancy (RED)',
    group: 'audio',
    audience: 'developer',
    type: 'boolean',
    default: false,
  },
  {
    key: 'webAudio',
    applies: 'join',
    id: 'web-audio',
    param: 'web-audio',
    label: 'Browser audio processing',
    help: 'Needed for noise suppression. On by default on desktop browsers, off on phones and tablets.',
    group: 'audio',
    audience: 'user',
    persist: true,
    type: 'boolean',
    default: !IS_MOBILE_DEVICE,
  },

  {
    key: 'cameraOnAtJoin',
    // Set from the pre-join camera toggle. On by default, as Meet and Teams open the preview.
    hidden: true,
    applies: 'join',
    id: 'camera-on-at-join',
    param: 'camera-on',
    audience: 'user',
    persist: true,
    type: 'boolean',
    default: true,
  },
  {
    key: 'mirrorSelfView',
    // Set from the self-view tile menu.
    hidden: true,
    applies: 'live',
    id: 'mirror-self-view',
    param: 'mirror',
    audience: 'user',
    persist: true,
    type: 'boolean',
    default: true,
  },
  {
    key: 'videoOnlyStage',
    applies: 'live',
    id: 'video-only-stage',
    param: 'video-only',
    label: 'Show only people with video',
    help: 'Leave the name tiles of people with their camera off out of the stage.',
    group: 'video',
    audience: 'user',
    persist: true,
    type: 'boolean',
    default: false,
  },
  {
    key: 'videoCodec',
    applies: 'join',
    id: 'videoCodecSelect',
    param: 'video-codec',
    label: 'Preferred camera send codec',
    group: 'video',
    audience: 'developer',
    type: 'select',
    default: 'default',
    choices: CODEC_CHOICES('video'),
  },
  {
    key: 'enableSimulcast',
    applies: 'join',
    id: 'simulcast',
    param: 'simulcast',
    label: 'Enable simulcast (Chromium)',
    group: 'video',
    audience: 'developer',
    type: 'boolean',
    default: false,
  },
  {
    key: 'enableSVC',
    applies: 'join',
    id: 'svc',
    param: 'svc',
    label: 'Enable SVC (Chromium)',
    group: 'video',
    audience: 'developer',
    type: 'boolean',
    default: false,
  },
  {
    key: 'priorityDownlinkPolicy',
    applies: 'join',
    id: 'priority-downlink-policy',
    param: 'priority-downlink',
    label: 'Remote video quality adaptation (priority downlink policy)',
    group: 'video',
    audience: 'developer',
    type: 'boolean',
    default: true,
  },

  {
    key: 'backgroundEffect',
    applies: 'live',
    id: 'background-effect',
    param: 'background',
    label: 'Background',
    group: 'video',
    slot: 'settings-background',
    audience: 'user',
    persist: true,
    type: 'select',
    default: 'none',
    choices: [
      { value: 'none', label: 'None' },
      { value: 'blur', label: 'Blur' },
      { value: 'color', label: 'Color' },
      { value: 'image', label: 'Image' },
    ],
  },
  {
    key: 'backgroundBlurStrength',
    applies: 'live',
    id: 'background-blur-strength',
    param: 'background-blur',
    label: 'Blur strength',
    group: 'video',
    slot: 'settings-background',
    audience: 'user',
    persist: true,
    type: 'select',
    default: 'medium',
    choices: [
      { value: 'low', label: 'Light' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'Strong' },
    ],
    segmented: true,
    showIf: values => values.backgroundEffect === 'blur',
  },
  {
    key: 'backgroundColor',
    applies: 'live',
    id: 'background-color',
    param: 'background-color',
    label: 'Background color',
    group: 'video',
    slot: 'settings-background',
    audience: 'user',
    persist: true,
    type: 'text',
    inputType: 'color',
    pattern: /^#[0-9a-f]{6}$/i,
    default: '#1d4ed8',
    showIf: values => values.backgroundEffect === 'color',
  },
  {
    key: 'backgroundModel',
    applies: 'live',
    id: 'background-model',
    param: 'background-model',
    label: 'Segmentation model',
    group: 'video',
    slot: 'settings-background',
    audience: 'developer',
    type: 'select',
    default: 'multiclass',
    choices: [
      { value: 'multiclass', label: 'Higher complexity (multiclass)' },
      { value: 'general', label: 'Higher performance (selfie)' },
    ],
  },

  {
    key: 'contentCodec',
    applies: 'live',
    id: 'contentCodecSelect',
    param: 'content-codec',
    label: 'Preferred content send codec',
    help: 'Takes effect when content sharing is next started.',
    group: 'video',
    section: 'Content share',
    audience: 'developer',
    type: 'select',
    default: 'default',
    choices: CODEC_CHOICES('content'),
  },
  {
    key: 'maxContentShare',
    applies: 'live',
    id: 'max-content-share',
    param: 'max-content-share',
    label: 'Allow the maximum number of simultaneous content shares',
    group: 'video',
    section: 'Content share',
    audience: 'developer',
    type: 'boolean',
    default: false,
  },

  {
    key: 'captionsSize',
    applies: 'live',
    id: 'captions-size',
    param: 'captions-size',
    label: 'Caption size',
    group: 'captions',
    audience: 'user',
    persist: true,
    type: 'select',
    default: 'medium',
    choices: [
      { value: 'small', label: 'Small' },
      { value: 'medium', label: 'Medium' },
      { value: 'large', label: 'Large' },
    ],
  },
  {
    key: 'captionsLanguage',
    applies: 'live',
    id: 'transcribe-language',
    param: 'captions-language',
    label: 'Captions language',
    help: 'Used when you start captions. Applies to the next start.',
    group: 'captions',
    audience: 'user',
    persist: true,
    type: 'select',
    default: 'en-US',
    choices: [
      { value: 'en-US', label: 'US English (en-US)' },
      { value: 'en-GB', label: 'British English (en-GB)' },
      { value: 'en-AU', label: 'Australian English (en-AU)' },
      { value: 'es-US', label: 'US Spanish (es-US)' },
      { value: 'fr-CA', label: 'Canadian French (fr-CA)' },
      { value: 'fr-FR', label: 'French (fr-FR)' },
      { value: 'it-IT', label: 'Italian (it-IT)' },
      { value: 'de-DE', label: 'German (de-DE)' },
      { value: 'pt-BR', label: 'Brazilian Portuguese (pt-BR)' },
      { value: 'ja-JP', label: 'Japanese (ja-JP)' },
      { value: 'ko-KR', label: 'Korean (ko-KR)' },
      { value: 'zh-CN', label: 'Mandarin Chinese - Mainland (zh-CN)' },
      { value: 'hi-IN', label: 'Hindi, Indian (hi-IN)' },
      { value: 'th-TH', label: 'Thai (th-TH)' },
    ],
    showIf: values =>
      values.transcriptionEngine === 'transcribe' && !values.transcriptionIdentifyLanguage,
  },
  {
    key: 'transcriptionEngine',
    applies: 'live',
    id: 'transcription-engine',
    param: 'transcription-engine',
    label: 'Transcription engine',
    group: 'captions',
    audience: 'developer',
    type: 'select',
    default: 'transcribe',
    choices: [
      { value: 'transcribe', label: 'Amazon Transcribe' },
      { value: 'transcribe_medical', label: 'Amazon Transcribe Medical (en-US)' },
    ],
  },
  {
    key: 'transcriptionRegion',
    applies: 'live',
    id: 'transcribe-region',
    param: 'transcription-region',
    label: 'Transcription region',
    group: 'captions',
    audience: 'developer',
    type: 'select',
    default: 'auto',
    choices: [
      { value: 'auto', label: 'Auto' },
      { value: '', label: 'Not specified' },
      { value: 'ap-northeast-1', label: 'Japan (Tokyo)' },
      { value: 'ap-northeast-2', label: 'South Korea (Seoul)' },
      { value: 'ap-southeast-2', label: 'Australia (Sydney)' },
      { value: 'ca-central-1', label: 'Canada' },
      { value: 'eu-central-1', label: 'Germany (Frankfurt)' },
      { value: 'eu-west-1', label: 'Ireland' },
      { value: 'eu-west-2', label: 'United Kingdom (London)' },
      { value: 'sa-east-1', label: 'Brazil (São Paulo)' },
      { value: 'us-east-1', label: 'United States (N. Virginia)' },
      { value: 'us-east-2', label: 'United States (Ohio)' },
      { value: 'us-west-2', label: 'United States (Oregon)' },
      { value: 'us-gov-west-1', label: 'GovCloud (US-West)' },
    ],
  },
  {
    key: 'transcriptionIdentifyLanguage',
    applies: 'live',
    id: 'identify-language-checkbox',
    param: 'transcription-identify-language',
    label: 'Identify the spoken language automatically',
    group: 'captions',
    audience: 'developer',
    type: 'boolean',
    default: false,
    showIf: values => values.transcriptionEngine === 'transcribe',
  },
  {
    key: 'transcriptionLanguageOptions',
    applies: 'live',
    id: 'language-options',
    param: 'transcription-language-options',
    label: 'Language options',
    help: 'Comma-separated, at least two, one per language, e.g. en-US,es-US.',
    group: 'captions',
    audience: 'developer',
    type: 'text',
    default: '',
    placeholder: 'en-US,es-US',
    showIf: values =>
      values.transcriptionEngine === 'transcribe' && values.transcriptionIdentifyLanguage,
  },
  {
    key: 'transcriptionPreferredLanguage',
    applies: 'live',
    id: 'preferred-language-selection',
    param: 'transcription-preferred-language',
    label: 'Preferred language',
    group: 'captions',
    audience: 'developer',
    type: 'text',
    default: '',
    placeholder: 'en-US',
    showIf: values =>
      values.transcriptionEngine === 'transcribe' && values.transcriptionIdentifyLanguage,
  },
  {
    key: 'transcriptionVocabularyNames',
    applies: 'live',
    id: 'vocabulary-names-input-text',
    param: 'transcription-vocabulary-names',
    label: 'Vocabulary names',
    group: 'captions',
    audience: 'developer',
    type: 'text',
    default: '',
    showIf: values =>
      values.transcriptionEngine === 'transcribe' && values.transcriptionIdentifyLanguage,
  },
  {
    key: 'transcriptionVocabularyFilterNames',
    applies: 'live',
    id: 'vocabulary-filter-names-input-text',
    param: 'transcription-vocabulary-filter-names',
    label: 'Vocabulary filter names',
    group: 'captions',
    audience: 'developer',
    type: 'text',
    default: '',
    showIf: values =>
      values.transcriptionEngine === 'transcribe' && values.transcriptionIdentifyLanguage,
  },
  {
    key: 'transcriptionCustomLanguageModel',
    applies: 'live',
    id: 'language-model-input-text',
    param: 'transcription-language-model',
    label: 'Custom language model',
    group: 'captions',
    audience: 'developer',
    type: 'text',
    default: '',
    placeholder: 'Model name (optional)',
    showIf: values =>
      values.transcriptionEngine === 'transcribe' && !values.transcriptionIdentifyLanguage,
  },
  {
    key: 'transcriptionPartialStabilization',
    applies: 'live',
    id: 'partial-stabilization-checkbox',
    param: 'transcription-partial-stabilization',
    label: 'Partial results stabilization',
    group: 'captions',
    audience: 'developer',
    type: 'boolean',
    default: false,
    showIf: values => values.transcriptionEngine === 'transcribe',
  },
  {
    key: 'transcriptionStability',
    applies: 'live',
    id: 'partial-stability',
    param: 'transcription-stability',
    label: 'Stability',
    group: 'captions',
    audience: 'developer',
    type: 'select',
    default: '',
    choices: [
      { value: '', label: 'Default (high)' },
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
    ],
    showIf: values =>
      values.transcriptionEngine === 'transcribe' && values.transcriptionPartialStabilization,
  },
  {
    key: 'transcriptionPiiIdentification',
    applies: 'live',
    id: 'content-identification-checkbox',
    param: 'transcription-pii-identification',
    label: 'Identify personal information (PII, or PHI for Transcribe Medical)',
    group: 'captions',
    audience: 'developer',
    type: 'boolean',
    default: false,
    // Transcribe Medical ignores language identification and always applies PHI identification.
    showIf: values =>
      values.transcriptionEngine === 'transcribe_medical' || !values.transcriptionIdentifyLanguage,
  },
  {
    key: 'transcriptionPiiRedaction',
    applies: 'live',
    id: 'content-redaction-checkbox',
    param: 'transcription-pii-redaction',
    label: 'Redact personal information (PII)',
    group: 'captions',
    audience: 'developer',
    type: 'boolean',
    default: false,
    showIf: values =>
      values.transcriptionEngine === 'transcribe' &&
      !values.transcriptionIdentifyLanguage &&
      !values.transcriptionPiiIdentification,
  },
  {
    key: 'transcriptionPiiEntityTypes',
    applies: 'live',
    id: 'transcribe-entity',
    param: 'transcription-pii-entity-types',
    label: 'PII entity types',
    help: 'Comma-separated, e.g. NAME,PHONE,SSN. Empty means all.',
    group: 'captions',
    audience: 'developer',
    type: 'text',
    default: '',
    placeholder: 'All',
    showIf: values =>
      values.transcriptionEngine === 'transcribe' &&
      !values.transcriptionIdentifyLanguage &&
      (values.transcriptionPiiIdentification || values.transcriptionPiiRedaction),
  },

  {
    key: 'videoMaxResolution',
    applies: 'create',
    id: 'videoFeatureSelect',
    param: 'video-max-resolution',
    label: 'Meeting maximum camera resolution',
    group: 'meeting',
    audience: 'developer',
    type: 'select',
    default: 'hd',
    choices: [
      { value: 'none', label: 'Camera video disabled' },
      { value: 'hd', label: 'HD 720p' },
      { value: 'fhd', label: 'FHD 1080p (requires max attendees)' },
    ],
    showIf: values => !values.replicaMeeting,
  },
  {
    key: 'contentMaxResolution',
    applies: 'create',
    id: 'contentFeatureSelect',
    param: 'content-max-resolution',
    label: 'Meeting maximum content share resolution',
    group: 'meeting',
    audience: 'developer',
    type: 'select',
    default: 'fhd',
    choices: [
      { value: 'none', label: 'Content share disabled' },
      { value: 'fhd', label: 'FHD 1080p' },
      { value: 'uhd', label: 'UHD 2160p (requires max attendees)' },
    ],
    showIf: values => !values.replicaMeeting,
  },
  {
    key: 'maxAttendeeCount',
    applies: 'create',
    id: 'max-attendee-cnt',
    param: 'max-attendees',
    label: 'Maximum attendees (1 - 250)',
    group: 'meeting',
    audience: 'developer',
    type: 'number',
    default: null,
    min: 1,
    max: 250,
    placeholder: 'Service default',
    showIf: values => !values.replicaMeeting,
  },
  {
    key: 'replicaMeeting',
    applies: 'create',
    id: 'replica-meeting-input',
    param: 'replica',
    label: 'Create meeting as a replica',
    help: 'The meeting creation options do not apply to a replica.',
    group: 'replica',
    audience: 'developer',
    type: 'boolean',
    default: false,
  },
  {
    key: 'primaryMeetingId',
    applies: 'create',
    id: 'primary-meeting-external-id',
    param: 'primary-meeting',
    label: 'Primary meeting title or ID',
    group: 'replica',
    audience: 'developer',
    type: 'text',
    default: '',
    placeholder: 'Primary meeting title or ID',
    showIf: values => values.replicaMeeting,
  },
  {
    key: 'audioCapability',
    applies: 'join',
    id: 'audioCapabilitySelect',
    param: 'audio-capability',
    label: 'Attendee audio capability',
    group: 'attendee',
    audience: 'developer',
    type: 'select',
    default: 'SendReceive',
    choices: CAPABILITY_CHOICES,
    segmented: true,
  },
  {
    key: 'videoCapability',
    applies: 'join',
    id: 'videoCapabilitySelect',
    param: 'video-capability',
    label: 'Attendee video capability',
    group: 'attendee',
    audience: 'developer',
    type: 'select',
    default: 'SendReceive',
    choices: CAPABILITY_CHOICES,
    segmented: true,
  },
  {
    key: 'contentCapability',
    applies: 'join',
    id: 'contentCapabilitySelect',
    param: 'content-capability',
    label: 'Attendee content capability',
    group: 'attendee',
    audience: 'developer',
    type: 'select',
    default: 'SendReceive',
    choices: CAPABILITY_CHOICES,
    segmented: true,
  },
  {
    key: 'allowAttendeeCapabilities',
    applies: 'live',
    id: 'allow-attendee-capabilities',
    param: 'attendee-capabilities',
    label: 'Allow updating attendee capabilities from the roster',
    group: 'general',
    audience: 'developer',
    type: 'boolean',
    default: false,
  },

  {
    key: 'preconnect',
    applies: 'join',
    id: 'preconnect',
    param: 'earlyConnect',
    label: 'Open the signaling connection while choosing devices',
    group: 'general',
    audience: 'developer',
    type: 'boolean',
    default: true,
  },
  {
    key: 'viewOnly',
    applies: 'join',
    id: 'join-view-only',
    param: 'view-only',
    label: 'Join in view-only mode (no devices)',
    group: 'general',
    audience: 'developer',
    type: 'boolean',
    default: false,
  },
  {
    key: 'attendeePresenceTimeoutMs',
    // URL only; the integration suite passes it.
    hidden: true,
    applies: 'join',
    id: 'attendee-presence-timeout-ms',
    param: 'attendee-presence-timeout-ms',
    audience: 'developer',
    type: 'number',
    default: null,
  },

  // URL only: the integration suite passes fatal=1 and behaviorAfterLeave=nothing.
  {
    key: 'dieOnFatal',
    // Shows the red fatal screen instead of muffling unexpected errors.
    hidden: true,
    applies: 'live',
    id: 'die',
    param: 'fatal',
    audience: 'developer',
    type: 'boolean',
    default: false,
  },
  {
    key: 'abortOnReconnect',
    hidden: true,
    applies: 'live',
    id: 'abort-on-reconnect',
    param: 'abort-on-reconnect',
    audience: 'developer',
    type: 'boolean',
    default: false,
  },
  {
    key: 'behaviorAfterLeave',
    hidden: true,
    applies: 'live',
    id: 'behavior-after-leave',
    param: 'behaviorAfterLeave',
    audience: 'developer',
    type: 'select',
    default: 'reload',
    choices: [
      { value: 'reload', label: 'Return to the join screen' },
      { value: 'halt', label: 'Halt (tear down everything, for leak hunting)' },
      { value: 'nothing', label: 'Do nothing (keep the session objects alive)' },
    ],
  },
  {
    key: 'developerMode',
    applies: 'live',
    id: 'developer-mode',
    param: 'dev',
    label: 'Show developer options',
    group: 'general',
    audience: 'user',
    persist: true,
    type: 'boolean',
    default: false,
  },
];

export const GROUP_LABELS: Record<OptionGroup, string> = {
  general: 'General',
  audio: 'Audio',
  video: 'Video',
  captions: 'Captions',
  meeting: 'Meeting creation',
  replica: 'Replica meeting',
  attendee: 'Attendee creation',
};

export function optionByKey(key: keyof ConfigValues): OptionSpec {
  const spec = OPTIONS.find(option => option.key === key);
  if (!spec) {
    throw new Error(`No option spec for ${String(key)}`);
  }
  return spec;
}

export function defaultValues(): ConfigValues {
  const values: Partial<ConfigValues> = {};
  for (const option of OPTIONS) {
    (values as Record<string, unknown>)[option.key] = option.default;
  }
  return values as ConfigValues;
}
