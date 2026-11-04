// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Typed element lookup. Throws when the id is missing so a renamed id fails loudly at
 * startup instead of as a null dereference later.
 */
export function byId<T extends HTMLElement = HTMLElement>(
  id: string,
  root: ParentNode = document
): T {
  const element = root.querySelector<T>(`#${CSS.escape(id)}`);
  if (!element) {
    throw new Error(`Missing element #${id}`);
  }
  return element;
}

export function maybeById<T extends HTMLElement = HTMLElement>(
  id: string,
  root: ParentNode = document
): T | null {
  return root.querySelector<T>(`#${CSS.escape(id)}`);
}

type Child = Node | string | null | undefined | false;

/**
 * Small element builder: `el('button', { class: 'btn', onclick: fn }, 'Label')`.
 * Attributes starting with `on` are listeners; `class`, `text` and `dataset`
 * are handled specially; everything else is set as an attribute.
 */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, unknown> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) {
      continue;
    }
    if (name.startsWith('on') && typeof value === 'function') {
      element.addEventListener(name.slice(2).toLowerCase(), value as EventListener);
    } else if (name === 'class') {
      element.className = String(value);
    } else if (name === 'text') {
      element.textContent = String(value);
    } else if (name === 'dataset') {
      Object.assign(element.dataset, value as Record<string, string>);
    } else if (value === true) {
      element.setAttribute(name, '');
    } else {
      element.setAttribute(name, String(value));
    }
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) {
      continue;
    }
    element.append(child);
  }
  return element;
}

export function clear(element: Element): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

export function setPressed(button: HTMLElement, pressed: boolean): void {
  button.setAttribute('aria-pressed', pressed ? 'true' : 'false');
}

export function isPressed(button: HTMLElement): boolean {
  return button.getAttribute('aria-pressed') === 'true';
}

/** The part of an ExternalUserId after the last `#` is the display name the demo server assigned. */
export function displayNameOf(externalUserId: string): string {
  return externalUserId.split('#').slice(-1)[0];
}

export function slug(text: string): string {
  return text.replace(/\s/g, '-');
}
