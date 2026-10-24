// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { STRINGS } from '../strings';
import { byId, el } from './dom';
import { iconElement } from './icons';

export interface ToastOptions {
  message: string;
  /** 0 keeps the toast until dismissed. */
  durationMs?: number;
  buttons?: { text: string; onClick: () => void }[];
}

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

  static clearAll(): void {
    byId('toast-container').replaceChildren();
  }

  private static homeWatched = false;

  // An open modal makes the page inert, so the stack moves inside the topmost dialog.
  private static container(): HTMLElement {
    const container = byId('toast-container');
    if (!Toast.homeWatched) {
      Toast.homeWatched = true;
      // `close` does not bubble.
      document.addEventListener('close', () => Toast.rehome(container), true);
    }
    Toast.rehome(container);
    return container;
  }

  private static rehome(container: HTMLElement): void {
    const modal = Array.from(document.querySelectorAll<HTMLDialogElement>('dialog[open]')).pop();
    const home = modal ?? document.body;
    if (container.parentElement !== home) {
      home.appendChild(container);
    }
  }
}
