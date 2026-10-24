// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const PHONE = window.matchMedia('(max-width: 600px)');

/** Menus are popovers where the browser has them (ui/Menu.ts), else carry `menu-open`. */
const OPEN_OVERLAY = CSS.supports('selector(:popover-open)')
  ? '.menu:popover-open, dialog[open]'
  : '.menu.menu-open, dialog[open]';

/** How long the dock stays up after the last touch. */
const HIDE_AFTER_MS = 4000;

/**
 * Phones: the dock floats over the stage and slides away a few seconds after the last touch, as
 * in Meet and Zoom; a tap on the stage brings it back, and another tap hides it. It stays up
 * while a menu, dialog or the side panel is open, and while keyboard focus is in it. The stylesheet does
 * the hiding (`.meeting.controls-hidden`).
 */
export default class AutoHideControls {
  private timer: ReturnType<typeof setTimeout> | undefined;
  private active = false;

  constructor(
    private readonly meeting: HTMLElement,
    private readonly stage: HTMLElement,
    private readonly dock: HTMLElement,
    private readonly sidePanel: HTMLElement
  ) {
    stage.addEventListener('click', this.onStageClick);
    dock.addEventListener('pointerdown', this.onActivity);
    dock.addEventListener('focusin', this.onActivity);
    PHONE.addEventListener('change', this.onActivity);
  }

  /** In the meeting: start counting down. */
  start(): void {
    this.active = true;
    this.show();
  }

  stop(): void {
    this.active = false;
    this.show();
    clearTimeout(this.timer);
  }

  destroy(): void {
    this.stop();
    this.stage.removeEventListener('click', this.onStageClick);
    this.dock.removeEventListener('pointerdown', this.onActivity);
    this.dock.removeEventListener('focusin', this.onActivity);
    PHONE.removeEventListener('change', this.onActivity);
  }

  private get hidden(): boolean {
    return this.meeting.classList.contains('controls-hidden');
  }

  private show(): void {
    this.meeting.classList.remove('controls-hidden');
    clearTimeout(this.timer);
    if (this.active && PHONE.matches) {
      this.timer = setTimeout(() => this.hide(), HIDE_AFTER_MS);
    }
  }

  private hide(): void {
    if (!this.active || !PHONE.matches || this.busy()) {
      this.show();
      return;
    }
    this.meeting.classList.add('controls-hidden');
  }

  /** Something the dock opened, or a dialog, is up; or the user is on a dock button. */
  private busy(): boolean {
    return (
      !!document.querySelector(OPEN_OVERLAY) ||
      !this.sidePanel.hidden ||
      !!this.dock.querySelector(':focus-visible')
    );
  }

  private readonly onActivity = (): void => this.show();

  private readonly onStageClick = (event: MouseEvent): void => {
    // Taps on a tile's own controls (its menu, a pagination arrow) are not for the dock.
    if ((event.target as Element).closest('button, a, input, select, .menu')) {
      this.show();
      return;
    }
    if (this.hidden) {
      this.show();
    } else {
      clearTimeout(this.timer);
      this.hide();
    }
  };
}
