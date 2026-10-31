// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Versioning } from 'amazon-chime-sdk-js';

import { MeetingConfig } from '../config/MeetingConfig';
import ApiClient, { MeetingLookup } from '../session/ApiClient';
import { STRINGS } from '../strings';
import Dialog from '../ui/Dialog';
import { byId } from '../ui/dom';
import Flows from './Flows';

export interface JoinScreenCallbacks {
  onContinue: () => void;
  onOpenSettings: () => void;
}

/** Join form, join-info override dialog and the SIP join variant. */
export default class JoinScreen {
  static readonly SIP_DID = '+17035550122';

  private readonly meetingInput = byId<HTMLInputElement>('inputMeeting');
  private readonly nameInput = byId<HTMLInputElement>('inputName');
  private readonly regionSelect = byId<HTMLSelectElement>('inputRegion');
  private readonly progress = byId('progress-authenticate');
  private readonly meetingStatus = byId('meeting-status');
  /** The region came from a running meeting (fixed), so the nearest-region guess must not win. */
  private regionFromMeeting = false;
  private readonly regionField = byId('region-field');
  private readonly continueButton = byId<HTMLButtonElement>('authenticate');
  /** The title the page was opened with (`?m=`), which a typo in a shared link gets wrong. */
  private readonly linkedTitle: string;
  private readonly overrideDialog: Dialog;
  private lookupTimer: ReturnType<typeof setTimeout> | undefined;
  private lookupSequence = 0;

  constructor(
    private readonly config: MeetingConfig,
    private readonly api: ApiClient,
    private readonly flows: Flows,
    private readonly callbacks: JoinScreenCallbacks
  ) {
    byId('sdk-version').textContent = `amazon-chime-sdk-js@${Versioning.sdkVersion}`;
    byId('stats-sdk-version').textContent = Versioning.sdkVersion;
    this.overrideDialog = Dialog.byId('join-info-override-modal');

    this.meetingInput.value = config.meeting;
    this.linkedTitle = config.meeting;
    this.nameInput.value = config.name;
    if (config.region) {
      this.selectRegion(config.region);
    } else {
      this.selectNearestRegion();
    }
    // Say whether this title joins an existing meeting (its region is fixed) or creates one.
    this.meetingInput.addEventListener('input', () => {
      clearTimeout(this.lookupTimer);
      this.lookupTimer = setTimeout(() => void this.lookupMeeting(), 400);
    });
    if (config.meeting) {
      void this.lookupMeeting();
    } else {
      this.showMeetingStatus('', null);
    }

    byId<HTMLFormElement>('form-authenticate').addEventListener('submit', event => {
      event.preventDefault();
      this.submit();
    });
    byId('additional-options-button').addEventListener('click', () =>
      this.callbacks.onOpenSettings()
    );
    byId('join-info-override-join-button').addEventListener('click', () => {
      if (this.readOverride() && this.config.joinInfoOverride) {
        this.overrideDialog.close();
        this.callbacks.onContinue();
      }
    });
    if (config.joinInfoOverride) {
      this.showOverrideDialog();
    }

    // SIP
    byId('to-sip-flow').addEventListener('click', event => {
      event.preventDefault();
      this.flows.show('flow-sip-authenticate');
    });
    byId('to-join-flow').addEventListener('click', event => {
      event.preventDefault();
      this.flows.show('flow-authenticate');
    });
    byId<HTMLFormElement>('form-sip-authenticate').addEventListener('submit', event => {
      event.preventDefault();
      this.joinViaSip();
    });
    byId('copy-sip-uri').addEventListener('click', async () => {
      const uri = byId<HTMLInputElement>('sip-uri');
      uri.select();
      await navigator.clipboard?.writeText(uri.value);
    });
    for (const form of ['form-failed-meeting', 'form-failed-join']) {
      byId<HTMLFormElement>(form).addEventListener('submit', event => {
        event.preventDefault();
        location.href = location.pathname;
      });
    }
  }

  focus(): void {
    (this.meetingInput.value ? this.nameInput : this.meetingInput).focus();
  }

  showOverrideDialog(): void {
    const override = this.config.joinInfoOverride;
    if (override) {
      byId<HTMLTextAreaElement>('create-attendee-override-input').value = JSON.stringify(
        override.JoinInfo.Attendee,
        null,
        2
      );
      byId<HTMLTextAreaElement>('get-meeting-override-input').value = JSON.stringify(
        override.JoinInfo.Meeting,
        null,
        2
      );
    }
    this.overrideDialog.open();
  }

  setBusy(busy: boolean): void {
    this.progress.hidden = !busy;
    byId<HTMLButtonElement>('authenticate').disabled = busy;
  }

  showFailedMeeting(error: Error): void {
    byId('failed-meeting').textContent = STRINGS.meetingLabel(this.config.meeting);
    byId('failed-meeting-error').textContent = window.isSecureContext
      ? error.message
      : STRINGS.httpNotAllowed;
    this.flows.show('flow-failed-meeting');
  }

  private submit(): void {
    this.config.meeting = this.meetingInput.value.trim();
    this.config.rememberName(this.nameInput.value.trim());
    this.config.region = this.regionSelect.value;
    if (this.readOverride()) {
      this.callbacks.onContinue();
    }
  }

  /** Joining failed after the device check: name the meeting and the error. */
  showFailedJoin(error: Error): void {
    byId('failed-join').textContent = STRINGS.meetingLabel(this.config.meeting);
    byId('failed-join-error').textContent = STRINGS.errorLabel(error.message);
    this.flows.show('flow-failed-join');
  }

  /**
   * The override dialog's textareas win over the form when both are filled. False when they
   * were filled but did not parse; the failure screen is showing then.
   */
  private readOverride(): boolean {
    const attendee = byId<HTMLTextAreaElement>('create-attendee-override-input').value.trim();
    const meeting = byId<HTMLTextAreaElement>('get-meeting-override-input').value.trim();
    if (!attendee || !meeting) {
      return true;
    }
    try {
      const override = {
        JoinInfo: { Meeting: JSON.parse(meeting), Attendee: JSON.parse(attendee) },
      };
      this.config.joinInfoOverride = override;
      this.config.meeting = override.JoinInfo.Meeting.Meeting.ExternalMeetingId;
      this.config.name = override.JoinInfo.Attendee.Attendee.ExternalUserId;
      this.config.region = override.JoinInfo.Meeting.Meeting.MediaRegion;
      return true;
    } catch (error) {
      byId('failed-meeting-error').textContent = STRINGS.invalidJoinInfoOverride(
        (error as Error).message
      );
      this.flows.show('flow-failed-meeting');
      return false;
    }
  }

  private async lookupMeeting(): Promise<void> {
    const title = this.meetingInput.value.trim();
    const sequence = ++this.lookupSequence;
    const result = title ? await this.api.lookupMeeting(title) : null;
    if (sequence !== this.lookupSequence) {
      return; // superseded by a newer keystroke
    }
    this.showMeetingStatus(title, result);
  }

  /**
   * Whether this title joins an existing meeting or starts one. The region picker shows only
   * when the meeting would be created (or the server cannot say), and a link to a meeting that
   * is not running says so plainly, since that is usually a typo.
   */
  private showMeetingStatus(title: string, result: MeetingLookup | null): void {
    const known = !!title && result !== null;
    const exists = known && result!.exists;
    const fromLink = !!title && title === this.linkedTitle;
    this.meetingStatus.hidden = !known;
    this.meetingStatus.classList.toggle('meeting-status-warning', known && !exists && fromLink);
    this.meetingStatus.classList.toggle('meeting-status-live', exists);
    this.meetingStatus.textContent = !known
      ? ''
      : exists
        ? STRINGS.meetingExists(this.regionName(result!.mediaRegion))
        : fromLink
          ? STRINGS.meetingNotRunning
          : STRINGS.meetingNew;
    const showRegion = !!title && !exists;
    this.regionField.classList.toggle('reveal-open', showRegion);
    this.regionField.inert = !showRegion;
    this.continueButton.textContent = known && !exists ? STRINGS.startMeeting : STRINGS.continue;
    if (exists && result?.mediaRegion) {
      this.regionFromMeeting = true;
      this.selectRegion(result.mediaRegion);
    }
  }

  /** The region picker's name for a region code ("United States (Oregon)"), else the code. */
  regionName(region: string | undefined): string {
    if (!region) {
      return '';
    }
    const option = Array.from(this.regionSelect.options).find(
      candidate => candidate.value === region
    );
    return option ? option.text : region;
  }

  private selectRegion(region: string): void {
    if (!Array.from(this.regionSelect.options).some(option => option.value === region)) {
      const option = document.createElement('option');
      option.value = region;
      option.text = region;
      this.regionSelect.add(option);
    }
    this.regionSelect.value = region;
  }

  private async selectNearestRegion(): Promise<void> {
    try {
      const response = await fetch('https://nearest-media-region.l.chime.aws');
      const { region } = await response.json();
      if (region && !this.regionFromMeeting) {
        this.selectRegion(region);
      }
    } catch (error) {
      console.log(`[DEMO] Default media region selected: ${(error as Error).message}`);
    }
  }

  private async joinViaSip(): Promise<void> {
    const meeting = byId<HTMLInputElement>('sip-inputMeeting').value;
    const voiceConnectorId = byId<HTMLInputElement>('voiceConnectorId').value;
    this.config.meeting = meeting;
    try {
      const response = await this.api.join({
        meeting,
        name: JoinScreen.SIP_DID,
        region: this.regionSelect.value || 'us-east-1',
        echoReduction: false,
        videoMaxResolution: 'HD',
        contentMaxResolution: 'FHD',
        maxAttendeeCount: null,
      });
      const joinToken = response.JoinInfo.Attendee.Attendee.JoinToken;
      byId<HTMLInputElement>('sip-uri').value =
        `sip:${JoinScreen.SIP_DID}@${voiceConnectorId};transport=tls;X-joinToken=${joinToken}`;
      this.flows.show('flow-sip-uri');
    } catch (error) {
      this.showFailedMeeting(error as Error);
    }
  }
}
