// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { byId } from '../ui/dom';

export type PanelSection = 'participants' | 'chat' | 'captions' | 'stats';

const SECTIONS: PanelSection[] = ['participants', 'chat', 'captions', 'stats'];

/** Right-hand panel. Sections stack, except stats, which takes the panel alone. */
export default class SidePanel {
  private readonly panel = byId('side-panel');
  private readonly showing = new Set<PanelSection>();
  private readonly listeners = new Set<(showing: ReadonlySet<PanelSection>) => void>();
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
    // Focus was in a section that just closed.
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
