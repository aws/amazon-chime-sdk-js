// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { DeviceElements } from '../devices/DeviceManager';
import { CapabilitiesElements } from '../features/Capabilities';
import { ChatElements } from '../features/ChatPanel';
import ContentShareManager, {
  ContentShareElements,
  SourceId,
} from '../features/ContentShareManager';
import { ReactionsElements } from '../features/Reactions';
import { RecordingElements } from '../features/Recording';
import { RosterElements } from '../features/Roster';
import { StatsElements } from '../features/StatsPanel';
import { TranscriptionElements } from '../features/Transcription';
import { byId } from '../ui/dom';
import { SessionElements } from './SessionEvents';

/**
 * The page elements each module works on, looked up once here so the modules themselves never
 * reach for global ids. The ids are part of the integration-test contract (meetingV2.html).
 */
export const pageElements = {
  devices: (): DeviceElements => ({
    audioInput: byId<HTMLSelectElement>('audio-input'),
    videoInput: byId<HTMLSelectElement>('video-input'),
    audioOutput: byId<HTMLSelectElement>('audio-output'),
    videoFilter: byId<HTMLSelectElement>('video-input-filter'),
    videoFilterContainer: byId('video-input-filter-container'),
    voiceFocusSetting: byId('voice-focus-setting'),
    voiceFocusSwitch: byId<HTMLInputElement>('add-voice-focus'),
    voiceFocusInfo: byId('add-voice-focus-info'),
    previewVideo: byId<HTMLVideoElement>('video-preview'),
    previewPlaceholder: byId('video-preview-placeholder'),
    levelBar: byId('audio-preview'),
    microphoneMenu: byId('dropdown-menu-microphone'),
    microphoneMenuButton: byId('button-microphone-drop'),
    cameraMenu: byId('dropdown-menu-camera'),
    cameraMenuButton: byId('button-camera-drop'),
    meetingAudio: byId<HTMLAudioElement>('meeting-audio'),
    contentShareVideo: byId<HTMLVideoElement>('content-share-video'),
  }),
  session: (): SessionElements => ({
    timer: byId('meeting-timer'),
    connectionIndicator: byId('connection-indicator'),
    permissionDeniedReason: byId('permission-denied-reason'),
    permissionRetry: byId('permission-retry'),
    permissionContinue: byId('permission-continue'),
  }),
  roster: (): RosterElements => ({
    list: byId<HTMLUListElement>('roster'),
    menuContainer: byId('roster-menu-container'),
    menuInstruction: byId('roster-menu-instruction'),
    menuNoneSelected: byId('roster-menu-none-selected'),
    menuOneAttendee: byId('roster-menu-one-attendee'),
    menuAllAttendeesExcept: byId('roster-menu-all-attendees-except'),
    menuAllAttendeesExceptLabel: byId('roster-menu-all-attendees-except-label'),
  }),
  contentShare: (): ContentShareElements => ({
    button: byId<HTMLButtonElement>('button-content-share'),
    menu: byId('dropdown-menu-content-share'),
    sources: Object.fromEntries(
      ContentShareManager.SourceOptionElementIds.map(id => [id, byId(id)])
    ) as Record<SourceId, HTMLElement>,
    fileInput: byId<HTMLInputElement>('content-share-item'),
    includeAudio: byId('content-share-include-audio'),
    optimizeForVideo: byId('content-share-optimize-video'),
    optionsItem: byId('dropdown-item-content-share-configuration'),
    options: {
      dialog: byId<HTMLDialogElement>('content-share-configuration-modal'),
      save: byId<HTMLButtonElement>('button-save-content-share-configs'),
      frameRate: byId<HTMLInputElement>('content-capture-frame-rate'),
      volumeReduction: byId<HTMLInputElement>('content-enable-volume-reduction'),
      simulcastSection: byId('content-simulcast-config'),
      simulcast: byId<HTMLInputElement>('content-enable-simulcast'),
      simulcastLow: {
        maxBitrateKbps: byId<HTMLInputElement>('content-simulcast-low-max-bitratekbps'),
        scaleFactor: byId<HTMLInputElement>('content-simulcast-low-scale-factor'),
        maxFramerate: byId<HTMLInputElement>('content-simulcast-low-max-framerate'),
      },
      simulcastHigh: {
        maxBitrateKbps: byId<HTMLInputElement>('content-simulcast-high-max-bitratekbps'),
        scaleFactor: byId<HTMLInputElement>('content-simulcast-high-scale-factor'),
        maxFramerate: byId<HTMLInputElement>('content-simulcast-high-max-framerate'),
      },
      svcSection: byId('content-svc-config'),
      svc: byId<HTMLInputElement>('content-enable-svc'),
    },
  }),
  chat: (): ChatElements => ({
    messages: byId('receive-message'),
    form: byId<HTMLFormElement>('form-send-message'),
    composer: byId<HTMLTextAreaElement>('send-message'),
    newMessages: byId<HTMLButtonElement>('chat-new-messages'),
  }),
  reactions: (): ReactionsElements => ({
    reactionsButton: byId('button-reactions'),
    reactionsMenu: byId('dropdown-menu-reactions'),
    overlay: byId('reactions-overlay'),
  }),
  transcription: (): TranscriptionElements => ({
    transcript: byId<HTMLDivElement>('transcript-container'),
    captionsBar: byId<HTMLDivElement>('captions-bar'),
  }),
  stats: (): StatsElements => ({
    tabs: byId('stats-tabs'),
    pages: {
      network: byId('stats-page-network'),
      audio: byId('stats-page-audio'),
      video: byId('stats-page-video'),
      background: byId('stats-page-background'),
    },
    tileStats: byId<HTMLInputElement>('stats-on-tiles'),
    uplink: byId('video-uplink-bandwidth'),
    downlink: byId('video-downlink-bandwidth'),
    redRecovery: byId('stats-red-recovery'),
    relayProtocol: byId('stats-relay-protocol'),
    simulcastLayers: byId('stats-simulcast-layers'),
    backgroundIdle: byId('stats-background-idle'),
    backgroundEffect: byId('stats-background-effect'),
    backgroundModel: byId('stats-background-model'),
    backgroundDelegate: byId('stats-background-delegate'),
    backgroundStartup: byId('stats-background-startup'),
    backgroundErrors: byId('stats-background-errors'),
  }),
  capabilities: (): CapabilitiesElements => ({
    rosterMenu: byId('roster-menu'),
    rosterMenuButton: byId('roster-menu-button'),
    dialog: byId<HTMLDialogElement>('attendee-capabilities-modal'),
    description: byId('attendee-capabilities-modal-description'),
    audio: byId<HTMLSelectElement>('attendee-capabilities-modal-audio-select'),
    video: byId<HTMLSelectElement>('attendee-capabilities-modal-video-select'),
    content: byId<HTMLSelectElement>('attendee-capabilities-modal-content-select'),
    save: byId<HTMLButtonElement>('attendee-capabilities-save-button'),
  }),
  recording: (): RecordingElements => ({
    indicator: byId('recording-indicator'),
  }),
};
