// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { DefaultModality } from 'amazon-chime-sdk-js';

import { STRINGS } from '../strings';
import { hueOf, initialsOf } from '../ui/avatar';
import { el } from '../ui/dom';
import { iconElement } from '../ui/icons';

export class RosterAttendee {
  muted = false;
  // Percent, as delivered by the volume indicator after scaling; 100 means a healthy connection.
  signalStrength = 100;
  speaking = false;
  handRaised = false;
  readonly isContentAttendee: boolean;

  constructor(
    public readonly id: string,
    public readonly name: string
  ) {
    this.isContentAttendee = new DefaultModality(id).hasModality(DefaultModality.MODALITY_CONTENT);
  }
}

export interface RosterElements {
  list: HTMLUListElement;
  menuContainer: HTMLElement;
  menuInstruction: HTMLElement;
  menuNoneSelected: HTMLElement;
  menuOneAttendee: HTMLElement;
  menuAllAttendeesExcept: HTMLElement;
  menuAllAttendeesExceptLabel: HTMLElement;
}

/**
 * Participants list. Renders one `<li>` per attendee with an avatar, name and a status icon,
 * and tracks the selection used by the attendee-capabilities feature.
 */
export default class Roster {
  static readonly ATTENDEE_ELEMENT_PREFIX = 'roster-';

  readonly attendeeInfoMap = new Map<string, RosterAttendee>();
  readonly selectedAttendeeSet = new Set<RosterAttendee>();
  private readonly listeners = new Set<(count: number) => void>();
  private allowSelection = false;

  constructor(private readonly elements: RosterElements) {}

  onCountChange(listener: (count: number) => void): void {
    this.listeners.add(listener);
  }

  setAllowSelection(allow: boolean): void {
    this.allowSelection = allow;
    this.elements.menuContainer.hidden = !allow;
    for (const [attendeeId, attendee] of this.attendeeInfoMap) {
      const checkbox =
        this.itemFor(attendeeId)?.querySelector<HTMLInputElement>('.roster-checkbox');
      if (checkbox) {
        checkbox.hidden = !allow || attendee.isContentAttendee;
      }
    }
    if (!allow) {
      this.unselectAll();
    }
  }

  hasAttendee(attendeeId: string): boolean {
    return this.attendeeInfoMap.has(attendeeId);
  }

  /** Attendees excluding content-share attendees, which is what the participant count shows. */
  get participantCount(): number {
    let count = 0;
    for (const attendee of this.attendeeInfoMap.values()) {
      if (!attendee.isContentAttendee) {
        count++;
      }
    }
    return count;
  }

  addAttendee(attendeeId: string, attendeeName: string): void {
    if (this.hasAttendee(attendeeId)) {
      return;
    }
    const attendee = new RosterAttendee(attendeeId, attendeeName);
    this.attendeeInfoMap.set(attendeeId, attendee);

    const checkbox = el('input', {
      type: 'checkbox',
      class: 'roster-checkbox',
      'aria-label': STRINGS.selectAttendee(attendeeName),
      hidden: !this.allowSelection || attendee.isContentAttendee,
      onchange: () => {
        checkbox.checked
          ? this.selectedAttendeeSet.add(attendee)
          : this.selectedAttendeeSet.delete(attendee);
        this.updateRosterMenu();
      },
    });
    const avatar = el('span', {
      class: 'roster-avatar',
      'aria-hidden': 'true',
      text: initialsOf(attendeeName),
    });
    // Same colour as this attendee's tile on the stage.
    avatar.style.setProperty('--avatar-hue', String(hueOf(attendeeId)));
    const item = el(
      'li',
      {
        class: 'roster-item',
        id: Roster.ATTENDEE_ELEMENT_PREFIX + attendeeId,
        dataset: { sortKey: attendeeName.toLowerCase() },
      },
      checkbox,
      avatar,
      el('span', { class: 'roster-name', text: attendeeName }),
      el('span', { class: 'roster-hand', title: STRINGS.handRaised }, iconElement('hand')),
      el('span', { class: 'roster-status', dataset: { status: '' } })
    );
    this.elements.list.appendChild(item);
    this.sortRoster();
    this.handleRosterStatusUpdate(attendeeId);
    this.notifyCount();
  }

  private sortRoster(): void {
    const list = this.elements.list;
    Array.from(list.children)
      .sort((a, b) => {
        const aHand = a.classList.contains('hand-raised') ? 0 : 1;
        const bHand = b.classList.contains('hand-raised') ? 0 : 1;
        if (aHand !== bHand) {
          return aHand - bHand;
        }
        return (a as HTMLElement).dataset.sortKey!.localeCompare(
          (b as HTMLElement).dataset.sortKey!
        );
      })
      .forEach(child => list.appendChild(child));
  }

  removeAttendee(attendeeId: string): boolean {
    const attendee = this.attendeeInfoMap.get(attendeeId);
    if (!attendee) {
      return false;
    }
    this.itemFor(attendeeId)?.remove();
    this.selectedAttendeeSet.delete(attendee);
    this.updateRosterMenu();
    this.attendeeInfoMap.delete(attendeeId);
    this.notifyCount();
    return true;
  }

  setMuteStatus(attendeeId: string, status: boolean): void {
    const attendee = this.attendeeInfoMap.get(attendeeId);
    if (attendee) {
      attendee.muted = status;
      this.handleRosterStatusUpdate(attendeeId);
    }
  }

  setSignalStrength(attendeeId: string, signal: number): void {
    const attendee = this.attendeeInfoMap.get(attendeeId);
    if (attendee) {
      attendee.signalStrength = signal;
      this.handleRosterStatusUpdate(attendeeId);
    }
  }

  setAttendeeSpeakingStatus(attendeeId: string, status: boolean): void {
    const attendee = this.attendeeInfoMap.get(attendeeId);
    if (attendee) {
      attendee.speaking = status;
      this.itemFor(attendeeId)?.classList.toggle('speaking', status);
      this.handleRosterStatusUpdate(attendeeId);
    }
  }

  nameOf(attendeeId: string): string | undefined {
    return this.attendeeInfoMap.get(attendeeId)?.name;
  }

  isHandRaised(attendeeId: string): boolean {
    return this.attendeeInfoMap.get(attendeeId)?.handRaised ?? false;
  }

  get raisedHandCount(): number {
    return Array.from(this.attendeeInfoMap.values()).filter(attendee => attendee.handRaised).length;
  }

  setHandRaised(attendeeId: string, raised: boolean): void {
    const attendee = this.attendeeInfoMap.get(attendeeId);
    if (attendee) {
      attendee.handRaised = raised;
      this.itemFor(attendeeId)?.classList.toggle('hand-raised', raised);
      this.sortRoster();
    }
  }

  clear(): void {
    this.elements.list.replaceChildren();
    this.attendeeInfoMap.clear();
    this.unselectAll();
    this.notifyCount();
  }

  unselectAll(): void {
    this.selectedAttendeeSet.clear();
    this.updateRosterMenu();
    this.elements.list.querySelectorAll<HTMLInputElement>('.roster-checkbox').forEach(checkbox => {
      checkbox.checked = false;
    });
  }

  private itemFor(attendeeId: string): HTMLElement | null {
    return this.elements.list.querySelector<HTMLElement>(
      `#${CSS.escape(Roster.ATTENDEE_ELEMENT_PREFIX + attendeeId)}`
    );
  }

  private notifyCount(): void {
    const count = this.participantCount;
    for (const listener of this.listeners) {
      listener(count);
    }
  }

  private handleRosterStatusUpdate(attendeeId: string): void {
    const attendee = this.attendeeInfoMap.get(attendeeId)!;
    const item = this.itemFor(attendeeId);
    if (!item) {
      return;
    }
    const status = item.querySelector<HTMLElement>('.roster-status')!;
    status.replaceChildren();
    let state = '';
    let title = '';
    // Signal strength is 0..100 (percent) from the volume indicator.
    if (attendee.signalStrength === 0) {
      state = 'lost';
      title = STRINGS.connectionLost;
      status.append(iconElement('wifiOff'));
    } else if (attendee.signalStrength < 100) {
      state = 'weak';
      title = STRINGS.weakConnectionShort;
      status.append(iconElement('wifiLow'));
    } else if (attendee.muted) {
      state = 'muted';
      title = STRINGS.muted;
      status.append(iconElement('micOff'));
    } else if (attendee.speaking) {
      state = 'speaking';
      title = STRINGS.speaking;
      status.append(iconElement('mic'));
    } else if (!attendee.isContentAttendee) {
      status.append(iconElement('mic'));
    }
    status.dataset.status = state;
    status.title = title;
    // A bare span may not carry aria-label; as an image it names the icon for screen readers.
    status.setAttribute('role', 'img');
    status.setAttribute('aria-label', title || STRINGS.microphoneOn);
  }

  private updateRosterMenu(): void {
    const {
      menuInstruction,
      menuNoneSelected,
      menuOneAttendee,
      menuAllAttendeesExcept,
      menuAllAttendeesExceptLabel,
    } = this.elements;
    const size = this.selectedAttendeeSet.size;
    if (size > 0) {
      menuInstruction.textContent = STRINGS.selected(size);
      menuNoneSelected.hidden = true;
      menuAllAttendeesExceptLabel.textContent = STRINGS.updateAllExcept(size);
      menuOneAttendee.hidden = size !== 1;
      menuAllAttendeesExcept.hidden = false;
    } else {
      menuInstruction.textContent = '';
      menuAllAttendeesExceptLabel.textContent = STRINGS.updateAll;
      menuNoneSelected.hidden = false;
      menuOneAttendee.hidden = true;
      menuAllAttendeesExcept.hidden = true;
    }
  }
}
