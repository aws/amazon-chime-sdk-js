// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  Attendee,
  AudioVideoFacade,
  Transcript,
  TranscriptEvent,
  TranscriptionStatus,
  TranscriptionStatusType,
  TranscriptItemType,
  TranscriptResult,
} from 'amazon-chime-sdk-js';

import { MeetingConfig } from '../config/MeetingConfig';
import ApiClient from '../session/ApiClient';
import { STRINGS } from '../strings';
import { displayNameOf, el } from '../ui/dom';
import Toast from '../ui/Toast';
import { transcriptionRequest } from './transcriptionRequest';

interface TranscriptSegment {
  contentSpan: HTMLSpanElement;
  attendee: Attendee;
  startTimeMs: number;
  endTimeMs: number;
  languageCode?: string;
}

const CAPTION_LINES = 3;
const CAPTION_HIDE_MS = 6000;
const SPEAKER_COLORS = 8;

/** Stable per-attendee hue so a speaker keeps one caption colour for the meeting. */
function speakerColorClass(attendeeId: string): string {
  let hash = 0;
  for (const char of attendeeId) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return `speaker-color-${hash % SPEAKER_COLORS}`;
}

type CaptionsState = 'on' | 'off' | 'starting';

const LANGUAGES_NO_WORD_SEPARATOR = new Set(['ja-JP', 'zh-CN']);

export interface TranscriptionElements {
  /** The full transcript in the side panel. */
  transcript: HTMLDivElement;
  /** The caption bar overlaying the stage. */
  captionsBar: HTMLDivElement;
}

export interface TranscriptionCallbacks {
  /** The caption bar was clicked: open the full transcript for scroll-back. */
  onOpenTranscript: () => void;
  /** The "Captions settings" button on the could-not-start toast. */
  onOpenCaptionsSettings: () => void;
}

/**
 * Live transcription: starting and stopping Amazon Transcribe for the meeting from the Settings >
 * Captions options, the full transcript panel, and the caption bar overlaying the stage.
 */
export default class Transcription {
  private readonly transcriptContainer: HTMLDivElement;
  private readonly captionsBar: HTMLDivElement;
  private captionsState: CaptionsState = 'off';
  private captionsTimer: ReturnType<typeof setTimeout> | undefined;
  private active = false;
  private noWordSeparator = false;
  private partialTranscriptDiv: HTMLDivElement | undefined;
  private readonly partialTranscriptResultTimeMap = new Map<string, number>();
  private readonly partialTranscriptResultMap = new Map<string, TranscriptResult>();
  private readonly transcriptEntitySet = new Set<string>();
  private readonly handler = (event: TranscriptEvent): void => this.onTranscriptEvent(event);
  private readonly onCaptionsClick = (): void => this.callbacks.onOpenTranscript();

  constructor(
    private readonly audioVideo: AudioVideoFacade,
    private readonly api: ApiClient,
    private readonly config: MeetingConfig,
    elements: TranscriptionElements,
    private readonly callbacks: TranscriptionCallbacks
  ) {
    this.transcriptContainer = elements.transcript;
    this.captionsBar = elements.captionsBar;
    this.audioVideo.transcriptionController?.subscribeToTranscriptEvent(this.handler);
    this.captionsBar.addEventListener('click', this.onCaptionsClick);
    this.applyCaptionSize();
    this.unsubscribeConfig = this.config.onChange(key => {
      if (key === 'captionsSize') {
        this.applyCaptionSize();
      }
    });
  }

  private readonly unsubscribeConfig: () => void;

  private applyCaptionSize(): void {
    this.captionsBar.dataset.size = this.config.get('captionsSize');
  }

  get isActive(): boolean {
    return this.active;
  }

  get captions(): CaptionsState {
    return this.captionsState;
  }

  private setCaptions(state: CaptionsState): void {
    this.captionsState = state;
    if (state === 'off') {
      this.captionsBar.hidden = true;
    }
  }

  /**
   * One click: show captions, starting live transcription for the meeting with the Settings >
   * Captions options if nobody has started it yet. Turning captions off only hides them here;
   * "Stop transcription for everyone" in the More menu stops it for the meeting.
   */
  async toggleCaptions(): Promise<void> {
    if (this.captionsState === 'starting') {
      return;
    }
    const on = this.captionsState === 'off';
    this.setCaptions(on ? 'on' : 'off');
    if (!on || this.active) {
      return;
    }
    this.setCaptions('starting');
    try {
      await this.start();
      Toast.show({ message: STRINGS.startingTranscription, durationMs: 3000 });
      this.setCaptions('on');
    } catch (error) {
      this.setCaptions('off');
      Toast.show({
        message: STRINGS.couldNotStartTranscription((error as Error).message),
        buttons: [
          { text: STRINGS.captionsSettings, onClick: this.callbacks.onOpenCaptionsSettings },
        ],
      });
    }
  }

  /** Start transcription for the meeting with the current Captions settings. */
  async start(): Promise<void> {
    const { engine, languageCode, region, params } = transcriptionRequest(this.config.values);
    await this.api.startTranscription(this.config.meeting, engine, languageCode, region, params);
  }

  async stop(): Promise<void> {
    await this.api.stopTranscription(this.config.meeting);
  }

  destroy(): void {
    this.unsubscribeConfig();
    this.audioVideo.transcriptionController?.unsubscribeFromTranscriptEvent(this.handler);
    this.captionsBar.removeEventListener('click', this.onCaptionsClick);
    clearTimeout(this.captionsTimer);
  }

  private setActive(active: boolean): void {
    if (this.active === active) {
      return;
    }
    this.active = active;
    if (active && this.captionsState !== 'on') {
      this.setCaptions('on');
    }
    if (!active) {
      this.setCaptions('off');
      Toast.show({ message: STRINGS.transcriptionStopped, durationMs: 4000 });
    }
  }

  private onTranscriptEvent(transcriptEvent: TranscriptEvent): void {
    if (transcriptEvent instanceof TranscriptionStatus) {
      this.appendStatusDiv(transcriptEvent);
      if (
        transcriptEvent.type === TranscriptionStatusType.STARTED ||
        transcriptEvent.type === TranscriptionStatusType.RESUMED
      ) {
        this.setActive(true);
      }
      if (transcriptEvent.type === TranscriptionStatusType.STARTED) {
        let languageCode: string | null = null;
        const configuration = JSON.parse(transcriptEvent.transcriptionConfiguration);
        if (configuration?.EngineTranscribeSettings) {
          languageCode = configuration.EngineTranscribeSettings.LanguageCode;
        } else if (configuration?.EngineTranscribeMedicalSettings) {
          languageCode = configuration.EngineTranscribeMedicalSettings.LanguageCode;
        }
        this.noWordSeparator = !!languageCode && LANGUAGES_NO_WORD_SEPARATOR.has(languageCode);
      } else if (
        transcriptEvent.type === TranscriptionStatusType.STOPPED ||
        transcriptEvent.type === TranscriptionStatusType.FAILED
      ) {
        this.noWordSeparator = false;
        this.partialTranscriptResultTimeMap.clear();
        this.partialTranscriptDiv = undefined;
        this.partialTranscriptResultMap.clear();
        this.setActive(false);
      }
    } else if (transcriptEvent instanceof Transcript) {
      // Transcripts mean it is running, also for someone who joined after it started.
      this.setActive(true);
      for (const result of transcriptEvent.results) {
        if (result.languageCode && LANGUAGES_NO_WORD_SEPARATOR.has(result.languageCode)) {
          this.noWordSeparator = true;
        }
        const entities = result.alternatives[0].entities;
        if (!result.isPartial && entities && entities.length > 0) {
          for (const entity of entities) {
            for (const content of entity.content.split(' ')) {
              this.transcriptEntitySet.add(content);
            }
          }
        }
        this.partialTranscriptResultMap.set(result.resultId, result);
        this.partialTranscriptResultTimeMap.set(result.resultId, result.endTimeMs);
        this.renderPartialTranscriptResults();
        if (result.isPartial) {
          continue;
        }
        // Finalize partial results older than 5 seconds so the local batch cannot grow forever.
        for (const [olderResultId, endTimeMs] of this.partialTranscriptResultTimeMap) {
          if (olderResultId === result.resultId) {
            break;
          } else if (endTimeMs < result.endTimeMs - 5000) {
            this.partialTranscriptResultTimeMap.delete(olderResultId);
          }
        }
        this.partialTranscriptResultTimeMap.delete(result.resultId);
        this.transcriptEntitySet.clear();
        if (this.partialTranscriptResultTimeMap.size === 0) {
          this.partialTranscriptDiv = undefined;
          this.partialTranscriptResultMap.clear();
        }
      }
    }
    this.transcriptContainer.scrollTop = this.transcriptContainer.scrollHeight;
  }

  private renderPartialTranscriptResults(): void {
    if (!this.partialTranscriptDiv) {
      this.partialTranscriptDiv = el('div');
      this.transcriptContainer.appendChild(this.partialTranscriptDiv);
    }
    this.partialTranscriptDiv.replaceChildren();

    const segments: TranscriptSegment[] = [];
    for (const result of this.partialTranscriptResultMap.values()) {
      this.populateSegmentsFromResult(segments, result);
    }
    segments.sort((a, b) => a.startTimeMs - b.startTimeMs);

    const speakerToSpan = new Map<string, HTMLSpanElement>();
    for (const segment of segments) {
      const speakerId = segment.attendee.attendeeId;
      if (!speakerToSpan.has(speakerId)) {
        this.appendNewSpeakerTranscriptDiv(segment, speakerToSpan);
      } else {
        const speakers = Array.from(speakerToSpan.keys());
        if (speakers.indexOf(speakerId) < speakers.length - 1) {
          // Someone else spoke in between: start a new line for this speaker.
          speakerToSpan.delete(speakerId);
          this.appendNewSpeakerTranscriptDiv(segment, speakerToSpan);
        } else {
          const span = speakerToSpan.get(speakerId)!;
          span.appendChild(Transcription.spaceSpan());
          span.appendChild(segment.contentSpan);
        }
      }
    }
    this.updateCaptions(segments);
  }

  /** The last few segments as caption lines, speaker-coloured; the transcript panel is the scroll-back. */
  private updateCaptions(segments: TranscriptSegment[]): void {
    if (this.captionsState === 'off' || segments.length === 0) {
      return;
    }
    const showLanguage = this.config.get('transcriptionIdentifyLanguage');
    this.captionsBar.replaceChildren(
      ...segments.slice(-CAPTION_LINES).map(segment =>
        el(
          'div',
          { class: `caption-line ${speakerColorClass(segment.attendee.attendeeId)}` },
          el('span', {
            class: 'caption-speaker',
            text: STRINGS.speakerPrefix(displayNameOf(segment.attendee.externalUserId)),
          }),
          el('span', { text: segment.contentSpan.textContent ?? '' }),
          showLanguage && segment.languageCode
            ? el('span', { class: 'caption-language', text: segment.languageCode })
            : null
        )
      )
    );
    this.captionsBar.hidden = false;
    clearTimeout(this.captionsTimer);
    this.captionsTimer = setTimeout(() => {
      this.captionsBar.hidden = true;
    }, CAPTION_HIDE_MS);
  }

  private populateSegmentsFromResult(
    segments: TranscriptSegment[],
    result: TranscriptResult
  ): void {
    let startTimeMs: number | null = null;
    let attendee: Attendee | null = null;
    let contentSpan: HTMLSpanElement | undefined;
    for (const item of result.alternatives[0].items) {
      const itemSpan = el('span', { text: item.content });
      // Underline low-confidence words; redacted words come through as "[Name]" with confidence 0.
      if (item.confidence !== undefined && !item.content.startsWith('[') && item.confidence < 0.3) {
        itemSpan.classList.add('confidence-style');
      }
      if (this.transcriptEntitySet.size > 0 && this.transcriptEntitySet.has(item.content)) {
        itemSpan.classList.add('entity-color');
      }
      if (!startTimeMs) {
        contentSpan = el('span', {}, itemSpan);
        attendee = item.attendee;
        startTimeMs = item.startTimeMs;
      } else if (item.type === TranscriptItemType.PUNCTUATION) {
        contentSpan!.appendChild(itemSpan);
        segments.push({
          contentSpan: contentSpan!,
          attendee: attendee!,
          startTimeMs,
          endTimeMs: item.endTimeMs,
          languageCode: result.languageCode,
        });
        startTimeMs = null;
        attendee = null;
      } else {
        if (!this.noWordSeparator) {
          contentSpan!.appendChild(Transcription.spaceSpan());
        }
        contentSpan!.appendChild(itemSpan);
      }
    }
    if (startTimeMs) {
      segments.push({
        contentSpan: contentSpan!,
        attendee: attendee!,
        startTimeMs,
        endTimeMs: result.endTimeMs,
        languageCode: result.languageCode,
      });
    }
  }

  /** A breaking space, so a long line wraps at word boundaries in the transcript panel. */
  private static spaceSpan(): HTMLSpanElement {
    return el('span', { text: ' ' });
  }

  private appendNewSpeakerTranscriptDiv(
    segment: TranscriptSegment,
    speakerToSpan: Map<string, HTMLSpanElement>
  ): void {
    this.partialTranscriptDiv!.appendChild(
      el(
        'div',
        {},
        el('span', {
          class: 'transcript-speaker',
          text: STRINGS.speakerPrefix(displayNameOf(segment.attendee.externalUserId)),
        }),
        segment.contentSpan
      )
    );
    speakerToSpan.set(segment.attendee.attendeeId, segment.contentSpan);
  }

  /** The full region and configuration are for developers; everyone else gets the language. */
  private appendStatusDiv(status: TranscriptionStatus): void {
    const time = new Date(status.eventTimeMs).toLocaleTimeString();
    this.transcriptContainer.appendChild(
      el('div', {
        class: 'transcript-status',
        text: this.config.developerMode
          ? STRINGS.transcriptionStatus(
              status.type,
              time,
              status.transcriptionRegion,
              status.transcriptionConfiguration,
              status.message
            )
          : STRINGS.transcriptionStatusBrief(
              status.type,
              time,
              Transcription.languageOf(status.transcriptionConfiguration),
              status.message
            ),
      })
    );
  }

  private static languageOf(configuration: string | undefined): string | undefined {
    try {
      const parsed = JSON.parse(configuration ?? '');
      return (
        parsed?.EngineTranscribeSettings?.LanguageCode ??
        parsed?.EngineTranscribeMedicalSettings?.LanguageCode
      );
    } catch {
      return undefined;
    }
  }
}
