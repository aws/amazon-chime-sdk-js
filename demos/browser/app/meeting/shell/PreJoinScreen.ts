// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { BackgroundEffectKind, backgroundEffectLabel } from '../devices/BackgroundEffect';
import { ConnectionCheckResult } from '../session/ConnectionCheck';
import { STRINGS } from '../strings';
import { byId, isPressed, setPressed } from '../ui/dom';
import { iconElement, setButtonIcon } from '../ui/icons';

export interface PreJoinCallbacks {
  onJoin: () => void;
  onBack: () => void;
  onTestSpeaker: (button: HTMLButtonElement, label: HTMLElement) => void;
  onTestMicrophone: (button: HTMLButtonElement, label: HTMLElement) => void;
  onMicToggle: (on: boolean) => void;
  onCameraToggle: (on: boolean) => void;
  onBackgroundToggle: (on: boolean) => void;
  onOpenBackgroundSettings: () => void;
  onRetryMicrophone: () => void;
}

export default class PreJoinScreen {
  private readonly micToggle = byId<HTMLButtonElement>('prejoin-mic-toggle');
  private readonly cameraToggle = byId<HTMLButtonElement>('prejoin-camera-toggle');
  private readonly backgroundToggle = byId<HTMLButtonElement>('prejoin-background-toggle');
  private readonly progress = byId('progress-join');
  private readonly warning = byId('prejoin-device-warning');
  private readonly problems = new Map<'microphone' | 'camera', string>();
  /** The user's own choice, restored when a microphone problem clears. */
  private mutedByUser = false;
  private readonly connectionStatus = byId('connection-status');

  constructor(private readonly callbacks: PreJoinCallbacks) {
    this.micToggle.dataset.kind = 'device';
    this.cameraToggle.dataset.kind = 'device';
    byId<HTMLFormElement>('form-devices').addEventListener('submit', event => {
      event.preventDefault();
      this.callbacks.onJoin();
    });
    byId('prejoin-back').addEventListener('click', () => this.callbacks.onBack());
    const footerAction = (
      id: string,
      action: (button: HTMLButtonElement, label: HTMLElement) => void
    ): void => {
      const button = byId<HTMLButtonElement>(id);
      const label = button.querySelector<HTMLElement>('.menu-label > span')!;
      button.addEventListener('click', () => action(button, label));
    };
    footerAction('button-test-sound', (button, label) =>
      this.callbacks.onTestSpeaker(button, label)
    );
    footerAction('button-test-mic', (button, label) =>
      this.callbacks.onTestMicrophone(button, label)
    );
    this.backgroundToggle.addEventListener('click', () =>
      this.callbacks.onBackgroundToggle(!isPressed(this.backgroundToggle))
    );
    byId('prejoin-background').addEventListener('click', () =>
      this.callbacks.onOpenBackgroundSettings()
    );
    this.micToggle.addEventListener('click', () => {
      if (this.problems.has('microphone')) {
        this.callbacks.onRetryMicrophone();
        return;
      }
      this.setMicOn(!isPressed(this.micToggle));
      this.callbacks.onMicToggle(this.micOn);
    });
    this.cameraToggle.addEventListener('click', () => {
      this.setCameraOn(!isPressed(this.cameraToggle));
      this.callbacks.onCameraToggle(this.cameraOn);
    });
    // The preview takes the camera's aspect ratio (portrait on phones held upright).
    const preview = byId<HTMLVideoElement>('video-preview');
    const fitPreview = (): void => {
      if (preview.videoWidth && preview.videoHeight) {
        preview.parentElement!.style.setProperty(
          '--preview-ratio',
          (preview.videoWidth / preview.videoHeight).toFixed(4)
        );
      }
    };
    preview.addEventListener('loadedmetadata', fitPreview);
    preview.addEventListener('resize', fitPreview);
  }

  showConnectionChecking(): void {
    this.setConnectionStatus('checking', STRINGS.connectionChecking);
  }

  showConnectionResult(result: ConnectionCheckResult): void {
    if (!result.reached) {
      this.setConnectionStatus('warning', STRINGS.connectionNoSignaling(result.error));
    } else if (result.transports.udp?.works) {
      this.setConnectionStatus('ready', STRINGS.connectionReady);
    } else if (result.transports.tcp?.works) {
      this.setConnectionStatus('warning', STRINGS.connectionTcpOnly);
    } else {
      this.setConnectionStatus('warning', STRINGS.connectionBlockedAll);
    }
  }

  hideConnectionStatus(): void {
    this.connectionStatus.hidden = true;
  }

  private setConnectionStatus(state: 'checking' | 'ready' | 'warning', text: string): void {
    this.connectionStatus.dataset.state = state;
    this.connectionStatus.replaceChildren(text);
    if (state !== 'checking') {
      this.connectionStatus.prepend(iconElement(state === 'ready' ? 'check' : 'triangleAlert'));
    }
    this.connectionStatus.hidden = false;
  }

  /** null clears the problem. A blocked microphone shows as off. */
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
    PreJoinScreen.setLabel(
      this.micToggle,
      this.problems.has('microphone')
        ? STRINGS.microphoneBlockedLabel
        : on
          ? STRINGS.joinWithMicOn
          : STRINGS.joinWithMicMuted
    );
  }

  setCameraAvailable(available: boolean): void {
    this.cameraToggle.disabled = !available;
    if (!available) {
      this.setCameraOn(false);
    }
  }

  setCameraOn(on: boolean): void {
    setPressed(this.cameraToggle, on);
    setButtonIcon(this.cameraToggle, on ? 'video' : 'videoOff');
    PreJoinScreen.setLabel(
      this.cameraToggle,
      this.problems.has('camera') && !on
        ? STRINGS.cameraBlockedLabel
        : on
          ? STRINGS.joinWithCameraOn
          : STRINGS.joinWithCameraOff
    );
  }

  /** `whenOn` is the effect the toggle turns on while the effect is off. */
  setBackgroundEffect(effect: BackgroundEffectKind, whenOn: BackgroundEffectKind): void {
    const on = effect !== 'none';
    setPressed(this.backgroundToggle, on);
    PreJoinScreen.setLabel(
      this.backgroundToggle,
      STRINGS.backgroundToggle(backgroundEffectLabel(on ? effect : whenOn))
    );
    byId('prejoin-background-value').textContent = backgroundEffectLabel(effect);
  }

  private static setLabel(button: HTMLElement, label: string): void {
    button.setAttribute('aria-label', label);
    button.title = label;
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
