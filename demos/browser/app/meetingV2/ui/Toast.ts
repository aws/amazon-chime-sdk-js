// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { STRINGS } from '../strings';
import { byId, el } from './dom';
import { iconElement } from './icons';

export interface ToastOptions {
  message: string;
  /** Milliseconds before the toast hides itself; 0 keeps it until dismissed. */
  durationMs?: number;
  buttons?: { text: string; onClick: () => void }[];
}

/** Stacked notifications in the `#toast-container` live region. */
export default class Toast {
  static show(options: ToastOptions): HTMLElement {
    const container = Toast.container();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const toast = el(
      'div',
      { class: 'toast', role: 'status' },
      el('div', { class: 'toast-message', text: options.message }),
      el(
        'div',
        { class: 'toast-actions' },
        ...(options.buttons ?? []).map(button =>
          el('button', {
            type: 'button',
            class: 'button button-primary button-small',
            text: button.text,
            onclick: () => {
              button.onClick();
              dismiss();
            },
          })
        ),
        el(
          'button',
          {
            type: 'button',
            class: 'icon-button toast-close',
            'aria-label': STRINGS.dismiss,
            onclick: () => dismiss(),
          },
          iconElement('x')
        )
      )
    );
    const dismiss = (): void => {
      if (timer) {
        clearTimeout(timer);
      }
      toast.classList.add('toast-leaving');
      setTimeout(() => toast.remove(), 160);
    };
    container.appendChild(toast);
    const duration = options.durationMs ?? 8000;
    if (duration > 0) {
      timer = setTimeout(dismiss, duration);
    }
    return toast;
  }

  /** Drop every toast, e.g. when a meeting ends so its notices do not follow onto the next screen. */
  static clearAll(): void {
    byId('toast-container').replaceChildren();
  }

  private static homeWatched = false;

  /**
   * The one toast stack. An open modal makes the rest of the page inert and covers it, so while
   * one is open the stack moves inside the topmost dialog, and back to the page when it closes.
   */
  private static container(): HTMLElement {
    const container = byId('toast-container');
    if (!Toast.homeWatched) {
      Toast.homeWatched = true;
      // `close` does not bubble; capture it from every dialog.
      document.addEventListener('close', () => Toast.rehome(container), true);
    }
    Toast.rehome(container);
    return container;
  }

  private static rehome(container: HTMLElement): void {
    // Every dialog here is opened with showModal().
    const modal = Array.from(document.querySelectorAll<HTMLDialogElement>('dialog[open]')).pop();
    const home = modal ?? document.body;
    if (container.parentElement !== home) {
      home.appendChild(container);
    }
  }
}
