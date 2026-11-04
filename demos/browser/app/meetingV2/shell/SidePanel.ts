// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { byId } from '../ui/dom';

export type PanelSection = 'participants' | 'chat' | 'captions' | 'stats';

const SECTIONS: PanelSection[] = ['participants', 'chat', 'captions', 'stats'];

/**
 * Right-hand panel. Participants and Chat open from their dock buttons and stack, sharing the
 * height when both are open; the transcript opens from the captions and stacks with them. Media
 * metrics (More menu, developers) take the panel on their own: showing them closes the others,
 * and showing another closes them. Each section has its own close button; the panel shows while
 * any section does.
 */
export default class SidePanel {
  private readonly panel = byId('side-panel');
  private readonly showing = new Set<PanelSection>();
  private readonly listeners = new Set<(showing: ReadonlySet<PanelSection>) => void>();
  /** Where focus goes back to when the panel closes (the dock button that opened it). */
  private returnFocus: HTMLElement | null = null;

  constructor() {
    for (const section of SECTIONS) {
      byId(`panel-${section}-close`).addEventListener('click', () => this.hide(section));
    }
  }

  get isOpen(): boolean {
    return this.showing.size > 0;
  }

  onChange(listener: (showing: ReadonlySet<PanelSection>) => void): void {
    this.listeners.add(listener);
  }

  isShowing(section: PanelSection): boolean {
    return this.showing.has(section);
  }

  toggle(section: PanelSection): void {
    if (this.showing.has(section)) {
      this.hide(section);
    } else {
      this.show(section);
    }
  }

  show(section: PanelSection): void {
    const active = document.activeElement as HTMLElement | null;
    if (!this.isOpen && active && !this.panel.contains(active)) {
      this.returnFocus = active;
    }
    if (section === 'stats') {
      this.showing.clear();
    } else {
      this.showing.delete('stats');
    }
    this.showing.add(section);
    this.render();
  }

  hide(section: PanelSection): void {
    this.showing.delete(section);
    this.render();
  }

  close(): void {
    this.showing.clear();
    this.render();
  }

  private render(): void {
    const active = document.activeElement as HTMLElement | null;
    const focusedSection = SECTIONS.find(section => byId(`panel-${section}`).contains(active));
    this.panel.hidden = !this.isOpen;
    for (const section of SECTIONS) {
      byId(`panel-${section}`).hidden = !this.showing.has(section);
    }
    // Focus was in a section that just closed: move it to what is left, or back to the dock.
    if (focusedSection && !this.showing.has(focusedSection)) {
      const remaining = SECTIONS.find(section => this.showing.has(section));
      if (remaining) {
        byId(`panel-${remaining}-close`).focus();
      } else {
        (this.returnFocus?.isConnected ? this.returnFocus : byId('button-participants')).focus();
      }
    }
    for (const listener of this.listeners) {
      listener(this.showing);
    }
  }
}
