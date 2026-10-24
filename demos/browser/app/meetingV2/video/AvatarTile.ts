// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { STRINGS } from '../strings';
import { hueOf, initialsOf } from '../ui/avatar';
import { el } from '../ui/dom';
import { iconElement } from '../ui/icons';

/**
 * Stage tile for someone whose camera is off: initials, name, mute and raised-hand badges, and a
 * speaking ring, so the stage shows everyone in the meeting as Teams and Zoom do.
 */
export default class AvatarTile {
  readonly element: HTMLElement;
  private readonly initialsEl = el('div', { class: 'avatar-initials', 'aria-hidden': 'true' });
  private readonly nameplateEl = el('div', { class: 'video-tile-nameplate' });
  private readonly statusEl = el('span', { class: 'video-tile-status' });
  private readonly reactionEl = el('div', { class: 'video-tile-reaction', 'aria-hidden': 'true' });
  private muted = false;
  private handRaised = false;

  constructor(
    public readonly attendeeId: string,
    name: string,
    private readonly isYou = false
  ) {
    this.element = el(
      'div',
      { class: 'avatar-tile', role: 'group' },
      el('div', { class: 'avatar-circle' }, this.initialsEl),
      el(
        'div',
        { class: 'video-tile-overlay' },
        el('div', { class: 'video-tile-footer' }, this.nameplateEl, this.statusEl)
      ),
      this.reactionEl
    );
    this.element.dataset.attendeeId = attendeeId;
    this.element.style.setProperty('--avatar-hue', String(hueOf(attendeeId)));
    this.setName(name);
  }

  setName(name: string): void {
    const label = this.isYou ? name + STRINGS.youSuffix : name;
    this.initialsEl.textContent = initialsOf(name);
    this.nameplateEl.textContent = label;
    this.nameplateEl.title = label;
    this.element.setAttribute('aria-label', STRINGS.cameraOffTile(name));
  }

  get featured(): boolean {
    return this.element.classList.contains('featured');
  }

  set featured(featured: boolean) {
    this.element.classList.toggle('featured', featured);
  }

  set speaking(speaking: boolean) {
    this.element.classList.toggle('speaking', speaking);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.renderStatus();
  }

  setHandRaised(raised: boolean): void {
    this.handRaised = raised;
    this.renderStatus();
  }

  set reaction(emoji: string) {
    this.reactionEl.textContent = emoji;
  }

  private renderStatus(): void {
    this.statusEl.replaceChildren();
    if (this.muted) {
      this.statusEl.append(iconElement('micOff'));
    }
    if (this.handRaised) {
      this.statusEl.append(iconElement('hand'));
    }
  }
}
