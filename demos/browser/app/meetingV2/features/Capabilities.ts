// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ApiClient from '../session/ApiClient';
import { STRINGS } from '../strings';
import Dialog from '../ui/Dialog';
import { el } from '../ui/dom';
import Menu from '../ui/Menu';
import Toast from '../ui/Toast';
import Roster from './Roster';

type UpdateType = 'one-attendee' | 'all-attendees-except';

export interface CapabilitiesElements {
  /** Roster menu holding the `[data-capabilities-type]` items, and the button that opens it. */
  rosterMenu: HTMLElement;
  rosterMenuButton: HTMLElement;
  dialog: HTMLDialogElement;
  description: HTMLElement;
  audio: HTMLSelectElement;
  video: HTMLSelectElement;
  content: HTMLSelectElement;
  save: HTMLButtonElement;
}

/**
 * Updating attendee capabilities from the roster: select attendees, then update the one selected
 * or everyone except the selection via the demo server.
 */
export default class Capabilities {
  private readonly dialog: Dialog;
  private readonly menu: Menu;
  private type: UpdateType = 'one-attendee';
  private selection: { id: string; name: string }[] = [];
  /** Bumped on every open, so a slow load for an earlier selection cannot overwrite a later one. */
  private openCount = 0;
  private readonly listeners: [EventTarget, string, EventListener][] = [];

  constructor(
    private readonly api: ApiClient,
    private readonly meeting: string,
    private readonly roster: Roster,
    private readonly elements: CapabilitiesElements
  ) {
    this.dialog = new Dialog(elements.dialog);
    this.menu = new Menu(elements.rosterMenu, elements.rosterMenuButton);
    for (const item of Array.from(
      elements.rosterMenu.querySelectorAll<HTMLButtonElement>('[data-capabilities-type]')
    )) {
      this.listen(item, 'click', () => {
        this.menu.close();
        void this.openFor(item.dataset.capabilitiesType as UpdateType);
      });
    }
    this.listen(elements.save, 'click', () => void this.save());
  }

  destroy(): void {
    for (const [target, type, listener] of this.listeners) {
      target.removeEventListener(type, listener);
    }
    this.listeners.length = 0;
    this.menu.destroy();
    this.dialog.destroy();
  }

  private listen(target: EventTarget, type: string, listener: EventListener): void {
    target.addEventListener(type, listener);
    this.listeners.push([target, type, listener]);
  }

  private setEditable(editable: boolean): void {
    const { audio, video, content, save } = this.elements;
    for (const control of [audio, video, content, save]) {
      control.disabled = !editable;
    }
  }

  private async openFor(type: UpdateType): Promise<void> {
    const openCount = ++this.openCount;
    this.type = type;
    // Snapshot the selection: it can change while the dialog is open.
    this.selection = Array.from(this.roster.selectedAttendeeSet).map(attendee => ({
      id: attendee.id,
      name: attendee.name,
    }));
    const { description, audio, video, content } = this.elements;
    // Nothing can be saved until the values shown are the attendee's current ones.
    this.setEditable(false);
    this.dialog.open();

    if (type === 'one-attendee' && this.selection.length === 1) {
      const [attendee] = this.selection;
      description.replaceChildren(
        el('span', { text: STRINGS.updatePrefix }),
        el('b', { text: attendee.name }),
        el('span', { text: STRINGS.capabilitiesSuffix })
      );
      try {
        const { Attendee } = await this.api.getAttendee(this.meeting, attendee.id);
        if (openCount !== this.openCount) {
          return;
        }
        audio.value = Attendee.Capabilities.Audio;
        video.value = Attendee.Capabilities.Video;
        content.value = Attendee.Capabilities.Content;
      } catch (error) {
        if (openCount === this.openCount) {
          // The selects would show another attendee's values; leave Save disabled.
          Toast.show({
            message: STRINGS.couldNotLoadCapabilities((error as Error).message),
          });
        }
        return;
      }
    } else {
      if (this.selection.length === 0) {
        description.textContent = STRINGS.updateCapabilitiesOfAll;
      } else {
        description.replaceChildren(
          el('span', { text: STRINGS.updateCapabilitiesOfAllExcluding }),
          el(
            'ul',
            {},
            ...this.selection.map(attendee => el('li', {}, el('b', { text: attendee.name })))
          )
        );
      }
      audio.value = video.value = content.value = 'SendReceive';
    }
    this.setEditable(true);
  }

  private async save(): Promise<void> {
    const { audio, video, content } = this.elements;
    this.dialog.close();
    this.roster.unselectAll();
    try {
      if (this.type === 'one-attendee') {
        await this.api.updateAttendeeCapabilities(
          this.meeting,
          this.selection[0].id,
          audio.value,
          video.value,
          content.value
        );
      } else {
        await this.api.updateAttendeeCapabilitiesExcept(
          this.meeting,
          this.selection.map(attendee => attendee.id),
          audio.value,
          video.value,
          content.value
        );
      }
    } catch (error) {
      console.error(error);
      Toast.show({ message: STRINGS.couldNotUpdateCapabilities, durationMs: 0 });
    }
  }
}
