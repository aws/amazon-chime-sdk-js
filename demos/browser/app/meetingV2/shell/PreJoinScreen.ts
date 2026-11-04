// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { STRINGS } from '../strings';
import { byId, isPressed, setPressed } from '../ui/dom';
import { setButtonIcon } from '../ui/icons';

export interface PreJoinCallbacks {
  onJoin: () => void;
  onBack: () => void;
  onTestSpeaker: (button: HTMLButtonElement) => void;
  onOpenSettings: () => void;
  onTestMicrophone: (button: HTMLButtonElement) => void;
  onMicToggle: (on: boolean) => void;
  onCameraToggle: (on: boolean) => void;
  /** The blocked microphone toggle was clicked: ask the browser again. */
  onRetryMicrophone: () => void;
}

/** Device check before joining: preview, level meter, device pickers, mic/camera join toggles. */
export default class PreJoinScreen {
  private readonly micToggle = byId<HTMLButtonElement>('prejoin-mic-toggle');
  private readonly cameraToggle = byId<HTMLButtonElement>('prejoin-camera-toggle');
  private readonly progress = byId('progress-join');
  private readonly warning = byId('prejoin-device-warning');
  private readonly problems = new Map<'microphone' | 'camera', string>();
  /** The user's own mic choice, restored when a microphone problem clears. */
  private mutedByUser = false;

  constructor(private readonly callbacks: PreJoinCallbacks) {
    this.micToggle.dataset.kind = 'device';
    this.cameraToggle.dataset.kind = 'device';
    byId<HTMLFormElement>('form-devices').addEventListener('submit', event => {
      event.preventDefault();
      this.callbacks.onJoin();
    });
    byId('prejoin-back').addEventListener('click', () => this.callbacks.onBack());
    byId('prejoin-settings').addEventListener('click', () => this.callbacks.onOpenSettings());
    const testSound = byId<HTMLButtonElement>('button-test-sound');
    testSound.addEventListener('click', event => {
      event.preventDefault();
      this.callbacks.onTestSpeaker(testSound);
    });
    const testMic = byId<HTMLButtonElement>('button-test-mic');
    testMic.addEventListener('click', event => {
      event.preventDefault();
      this.callbacks.onTestMicrophone(testMic);
    });
    this.micToggle.addEventListener('click', () => {
      if (this.problems.has('microphone')) {
        this.callbacks.onRetryMicrophone();
        return;
      }
      this.setMicOn(!isPressed(this.micToggle));
      this.callbacks.onMicToggle(this.micOn);
    });
    // Turning a failed camera on again is itself the retry.
    this.cameraToggle.addEventListener('click', () => {
      this.setCameraOn(!isPressed(this.cameraToggle));
      this.callbacks.onCameraToggle(this.cameraOn);
    });
  }

  /**
   * Show that the microphone or camera cannot be used, with the reason under the preview; null
   * clears it. A blocked microphone shows as off, since nobody would hear it.
   */
  setDeviceProblem(kind: 'microphone' | 'camera', reason: string | null): void {
    if (reason === null) {
      this.problems.delete(kind);
    } else {
      this.problems.set(kind, reason);
    }
    const toggle = kind === 'microphone' ? this.micToggle : this.cameraToggle;
    toggle.toggleAttribute('data-blocked', reason !== null);
    if (kind === 'microphone') {
      this.setMicOn(reason === null && !this.mutedByUser);
    } else if (reason !== null) {
      this.setCameraOn(false);
    }
    const reasons = Array.from(this.problems.values());
    this.warning.textContent = reasons.join(' ');
    this.warning.hidden = reasons.length === 0;
  }

  get micOn(): boolean {
    return isPressed(this.micToggle);
  }

  get cameraOn(): boolean {
    return isPressed(this.cameraToggle);
  }

  setMicOn(on: boolean): void {
    if (!this.problems.has('microphone')) {
      this.mutedByUser = !on;
    }
    on = on && !this.problems.has('microphone');
    setPressed(this.micToggle, on);
    setButtonIcon(this.micToggle, on ? 'mic' : 'micOff');
    this.micToggle.setAttribute(
      'aria-label',
      this.problems.has('microphone')
        ? STRINGS.microphoneBlockedLabel
        : on
          ? STRINGS.joinWithMicOn
          : STRINGS.joinWithMicMuted
    );
  }

  setCameraOn(on: boolean): void {
    setPressed(this.cameraToggle, on);
    setButtonIcon(this.cameraToggle, on ? 'video' : 'videoOff');
    this.cameraToggle.setAttribute(
      'aria-label',
      this.problems.has('camera') && !on
        ? STRINGS.cameraBlockedLabel
        : on
          ? STRINGS.joinWithCameraOn
          : STRINGS.joinWithCameraOff
    );
  }

  setMeetingInfo(meeting: string, name: string): void {
    byId('info-meeting').textContent = meeting;
    byId('info-name').textContent = name;
  }

  setBusy(busy: boolean): void {
    this.progress.hidden = !busy;
    byId<HTMLButtonElement>('joinButton').disabled = busy;
  }
}
