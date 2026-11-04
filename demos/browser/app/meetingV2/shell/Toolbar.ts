// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { STRINGS } from '../strings';
import { byId, isPressed, setPressed } from '../ui/dom';
import { IconName, setButtonIcon } from '../ui/icons';

export type ButtonState = 'on' | 'off' | 'disabled';

interface ToggleSpec {
  id: string;
  kind: 'device' | 'feature';
  onIcon: IconName;
  offIcon: IconName;
  onLabel: string;
  offLabel: string;
  /**
   * Accessible name. It starts with the visible label so voice control can find the button; where
   * the label does not change, `aria-pressed` carries the state.
   */
  onAria: string;
  offAria: string;
  /** Accessible name while the device cannot be used (see `setBlocked`). */
  blockedAria?: string;
}

const TOGGLES: ToggleSpec[] = [
  {
    id: 'button-microphone',
    kind: 'device',
    onIcon: 'mic',
    offIcon: 'micOff',
    onLabel: 'Mute',
    offLabel: 'Unmute',
    onAria: 'Mute microphone',
    offAria: 'Unmute microphone',
    blockedAria: 'Microphone unavailable',
  },
  {
    id: 'button-camera',
    kind: 'device',
    onIcon: 'video',
    offIcon: 'videoOff',
    onLabel: 'Stop video',
    offLabel: 'Start video',
    onAria: 'Stop video',
    offAria: 'Start video',
    blockedAria: 'Camera unavailable',
  },
  {
    id: 'button-content-share',
    kind: 'feature',
    onIcon: 'screenShareOff',
    offIcon: 'screenShare',
    onLabel: 'Stop share',
    offLabel: 'Share',
    onAria: 'Stop share',
    offAria: 'Share',
  },
  {
    id: 'button-participants',
    kind: 'feature',
    onIcon: 'users',
    offIcon: 'users',
    onLabel: 'People',
    offLabel: 'People',
    onAria: 'People',
    offAria: 'People',
  },
  {
    id: 'button-chat',
    kind: 'feature',
    onIcon: 'messageSquare',
    offIcon: 'messageSquare',
    onLabel: 'Chat',
    offLabel: 'Chat',
    onAria: 'Chat',
    offAria: 'Chat',
  },
  {
    id: 'button-promote-to-primary',
    kind: 'feature',
    onIcon: 'crown',
    offIcon: 'crown',
    onLabel: 'Demote',
    offLabel: 'Promote',
    onAria: 'Demote from the primary meeting',
    offAria: 'Promote to the primary meeting',
  },
];

/**
 * The dock. Button state is stored once (here) and projected to `aria-pressed`, the icon and the
 * label, so what a screen reader announces always matches what is drawn.
 */
export default class Toolbar {
  private readonly states = new Map<string, ButtonState>();
  private readonly specs = new Map<string, ToggleSpec>();
  private readonly blocked = new Map<string, string>();

  constructor() {
    for (const spec of TOGGLES) {
      this.specs.set(spec.id, spec);
      const button = byId(spec.id);
      button.dataset.kind = spec.kind;
      this.states.set(spec.id, isPressed(button) ? 'on' : 'off');
      this.render(spec.id);
    }
  }

  button(id: string): HTMLButtonElement {
    return byId<HTMLButtonElement>(id);
  }

  state(id: string): ButtonState {
    return this.states.get(id) ?? 'off';
  }

  isOn(id: string): boolean {
    return this.state(id) === 'on';
  }

  set(id: string, state: ButtonState): void {
    this.states.set(id, state);
    this.render(id);
  }

  /**
   * Mark a device button as unusable (permission denied, device missing or busy) with the reason,
   * or clear it with null. It stays clickable so the click can explain and offer a retry.
   */
  setBlocked(id: string, reason: string | null): void {
    if (reason === null) {
      this.blocked.delete(id);
    } else {
      this.blocked.set(id, reason);
    }
    this.render(id);
  }

  blockedReason(id: string): string | undefined {
    return this.blocked.get(id);
  }

  /** On or off, leaving a disabled button disabled. */
  setOn(id: string, on: boolean): void {
    if (this.state(id) !== 'disabled') {
      this.set(id, on ? 'on' : 'off');
    }
  }

  toggle(id: string): ButtonState {
    const next: ButtonState = this.isOn(id) ? 'off' : 'on';
    this.set(id, next);
    return next;
  }

  setVisible(id: string, visible: boolean): void {
    byId(id).hidden = !visible;
    const drop = document.getElementById(`${id}-drop`);
    if (drop) {
      drop.hidden = !visible;
    }
  }

  setBadge(id: string, value: number | string): void {
    const badge = byId(id);
    const text = typeof value === 'number' ? (value > 0 ? String(value) : '') : value;
    badge.textContent = text;
    badge.hidden = text === '';
  }

  private render(id: string): void {
    const spec = this.specs.get(id);
    const button = this.button(id);
    const state = this.state(id);
    const blockedReason = this.blocked.get(id);
    const on = state === 'on' && blockedReason === undefined;
    if (spec) {
      setPressed(button, on);
      setButtonIcon(button, on ? spec.onIcon : spec.offIcon);
      const name =
        blockedReason !== undefined
          ? (spec.blockedAria ?? spec.offAria)
          : on
            ? spec.onAria
            : spec.offAria;
      button.setAttribute('aria-label', name);
      button.title = blockedReason ?? name;
      const label = button.querySelector('.dock-label');
      if (label) {
        label.textContent =
          blockedReason !== undefined
            ? STRINGS.deviceBlockedShort
            : on
              ? spec.onLabel
              : spec.offLabel;
      }
    }
    button.toggleAttribute('data-blocked', blockedReason !== undefined);
    button.disabled = state === 'disabled';
    const drop = document.getElementById(`${id}-drop`) as HTMLButtonElement | null;
    if (drop) {
      drop.disabled = state === 'disabled';
    }
  }
}
