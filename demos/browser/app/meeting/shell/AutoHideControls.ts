// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const PHONE = window.matchMedia('(max-width: 600px)');

// Menus are popovers where supported (ui/Menu.ts), else carry `menu-open`.
const OPEN_OVERLAY = CSS.supports('selector(:popover-open)')
  ? '.menu:popover-open, dialog[open]'
  : '.menu.menu-open, dialog[open]';

const HIDE_AFTER_MS = 4000;

/** Phones only: hides the dock after the last touch via `.meeting.controls-hidden`. */
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

  private busy(): boolean {
    return (
      !!document.querySelector(OPEN_OVERLAY) ||
      !this.sidePanel.hidden ||
      !!this.dock.querySelector(':focus-visible')
    );
  }

  private readonly onActivity = (): void => this.show();

  private readonly onStageClick = (event: MouseEvent): void => {
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
