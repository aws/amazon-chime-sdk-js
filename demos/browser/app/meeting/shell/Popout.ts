// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { STRINGS } from '../strings';
import { byId, el } from '../ui/dom';
import { iconElement } from '../ui/icons';

interface DocumentPictureInPicture {
  requestWindow(options: { width: number; height: number }): Promise<Window>;
}

declare global {
  interface Window {
    documentPictureInPicture?: DocumentPictureInPicture;
  }
}

/** Looked up once at startup, so they keep working in the other window. */
const MOVED_IDS = [
  'tile-area',
  'stage-empty',
  'video-paginate-left',
  'video-paginate-right',
  'reactions-overlay',
  'captions-bar',
];
const MIRRORED_IDS = ['button-microphone', 'button-camera'];

/** Moves the stage into a Document Picture-in-Picture window, which stays above other windows. */
export default class Popout {
  static get supported(): boolean {
    return !!window.documentPictureInPicture;
  }

  private window: Window | undefined;
  private readonly restore: (() => void)[] = [];
  private readonly placeholder = byId('popout-placeholder');

  constructor(
    private readonly onLeave: () => void,
    private readonly onAutomaticOpenFailed: (error: unknown) => void
  ) {
    byId('popout-return').addEventListener('click', () => this.close());
  }

  get isOpen(): boolean {
    return !!this.window;
  }

  async open(): Promise<void> {
    if (this.window || !window.documentPictureInPicture) {
      return;
    }
    const popout = await window.documentPictureInPicture.requestWindow({ width: 300, height: 528 });
    if (popout.closed) {
      throw new Error(STRINGS.popoutClosed);
    }
    this.window = popout;
    const doc = popout.document;
    for (const sheet of Array.from(document.styleSheets)) {
      if (sheet.ownerNode instanceof HTMLStyleElement) {
        doc.head.append(sheet.ownerNode.cloneNode(true));
      } else if (sheet.href) {
        doc.head.append(el('link', { rel: 'stylesheet', href: sheet.href }));
      }
    }
    const syncTheme = (): void => {
      doc.documentElement.dataset.theme = document.documentElement.dataset.theme;
      doc.body.className = document.body.className;
    };
    syncTheme();
    this.observe(document.documentElement, syncTheme, { attributeFilter: ['data-theme'] });
    this.observe(document.body, syncTheme, { attributeFilter: ['class'] });

    const stage = el('div', { class: 'stage' });
    for (const id of MOVED_IDS) {
      const node = byId(id);
      const parent = node.parentNode!;
      const next = node.nextSibling;
      stage.append(node);
      this.restore.push(() => parent.insertBefore(node, next));
    }
    const leave = el(
      'button',
      {
        type: 'button',
        class: 'button button-danger',
        'aria-label': STRINGS.leaveMeeting,
        onclick: () => this.onLeave(),
      },
      iconElement('logOut'),
      el('span', { text: STRINGS.leave })
    );
    const controls = el(
      'div',
      { class: 'popout-controls' },
      ...MIRRORED_IDS.map(id => this.mirror(id)),
      leave
    );
    doc.body.append(el('div', { class: 'popout' }, stage, controls));
    this.placeholder.hidden = false;

    popout.addEventListener('pagehide', () => this.restoreFrom(popout));
    // A window closed while it was being set up fires no pagehide.
    for (const ms of [100, 1000]) {
      setTimeout(() => popout.closed && this.restoreFrom(popout), ms);
    }
  }

  close(): void {
    const popout = this.window;
    if (popout) {
      this.restoreFrom(popout);
      popout.close();
    }
  }

  /** Chrome calls this when you switch tabs during a call, if the site may open picture-in-picture automatically. */
  setAutomatic(on: boolean): void {
    try {
      navigator.mediaSession?.setActionHandler(
        'enterpictureinpicture' as MediaSessionAction,
        on ? () => void this.open().catch(this.onAutomaticOpenFailed) : null
      );
    } catch {
      // Browsers without the action throw.
    }
  }

  private restoreFrom(popout: Window): void {
    if (this.window !== popout) {
      return;
    }
    this.window = undefined;
    for (const step of this.restore.reverse()) {
      step();
    }
    this.restore.length = 0;
    this.placeholder.hidden = true;
  }

  /** A copy of a dock button that clicks it and follows its state. */
  private mirror(id: string): HTMLButtonElement {
    const source = byId<HTMLButtonElement>(id);
    const copy = source.cloneNode(true) as HTMLButtonElement;
    copy.removeAttribute('id');
    copy.addEventListener('click', () => source.click());
    this.observe(
      source,
      records => {
        for (const name of copy.getAttributeNames()) {
          if (!source.hasAttribute(name)) {
            copy.removeAttribute(name);
          }
        }
        for (const name of source.getAttributeNames()) {
          if (name !== 'id') {
            copy.setAttribute(name, source.getAttribute(name)!);
          }
        }
        // The mic level changes a style property many times a second; only an icon swap rebuilds.
        if (records.some(record => record.type !== 'attributes' || record.target !== source)) {
          copy.replaceChildren(...Array.from(source.cloneNode(true).childNodes));
        }
      },
      { attributes: true, childList: true, subtree: true, characterData: true }
    );
    return copy;
  }

  private observe(
    target: Node,
    callback: (records: MutationRecord[]) => void,
    options: MutationObserverInit
  ): void {
    const observer = new MutationObserver(callback);
    observer.observe(target, options);
    this.restore.push(() => observer.disconnect());
  }
}
