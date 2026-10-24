// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { STRINGS } from '../strings';
import { clear, el, maybeById } from './dom';

export interface SelectChoice {
  value: string;
  label: string;
  group?: string;
}

/** One logical `<select>` rendered in several places; a change in any copy fires one handler. */
export default class LinkedSelect {
  private readonly selects: HTMLSelectElement[];
  private readonly handlers = new Set<(value: string) => void>();
  private readonly listeners: [HTMLSelectElement, () => void][] = [];

  constructor(primary: HTMLSelectElement, ...mirrorIds: string[]) {
    this.selects = [
      primary,
      ...mirrorIds
        .map(id => maybeById<HTMLSelectElement>(id))
        .filter((s): s is HTMLSelectElement => !!s),
    ];
    // Empty mirrors (the Settings dialog builds bare <select>s) copy the primary's static options.
    for (const mirror of this.selects.slice(1)) {
      if (mirror.options.length === 0) {
        for (const option of Array.from(primary.children)) {
          mirror.appendChild(option.cloneNode(true));
        }
        mirror.value = primary.value;
      }
    }
    for (const select of this.selects) {
      const listener = (): void => {
        this.value = select.value;
        for (const handler of this.handlers) {
          handler(select.value);
        }
      };
      select.addEventListener('change', listener);
      this.listeners.push([select, listener]);
    }
  }

  destroy(): void {
    for (const [select, listener] of this.listeners) {
      select.removeEventListener('change', listener);
    }
    this.listeners.length = 0;
    this.handlers.clear();
  }

  get primary(): HTMLSelectElement {
    return this.selects[0];
  }

  get value(): string {
    return this.primary.value;
  }

  set value(value: string) {
    for (const select of this.selects) {
      select.value = value;
    }
  }

  get options(): HTMLOptionElement[] {
    return Array.from(this.primary.options);
  }

  set disabled(disabled: boolean) {
    for (const select of this.selects) {
      select.disabled = disabled;
    }
  }

  hasValue(value: string): boolean {
    return this.options.some(option => option.value === value);
  }

  onChange(handler: (value: string) => void): void {
    this.handlers.add(handler);
  }

  /** Keeps the previous selection when it still exists, else tries `preferred`. */
  fill(
    choices: SelectChoice[],
    preferred: string | null = null,
    emptyLabel: string = STRINGS.selectionUnavailable
  ): void {
    const previous = this.value;
    for (const select of this.selects) {
      clear(select);
      let currentGroup: HTMLOptGroupElement | undefined;
      for (const choice of choices) {
        const option = el('option', { value: choice.value, text: choice.label });
        if (choice.group) {
          if (!currentGroup || currentGroup.label !== choice.group) {
            currentGroup = el('optgroup', { label: choice.group });
            select.appendChild(currentGroup);
          }
          currentGroup.appendChild(option);
        } else {
          currentGroup = undefined;
          select.appendChild(option);
        }
      }
      if (!select.firstElementChild) {
        select.appendChild(el('option', { text: emptyLabel, value: '' }));
      }
    }
    for (const candidate of [previous, preferred]) {
      if (candidate && this.hasValue(candidate)) {
        this.value = candidate;
        return;
      }
    }
  }

  removeOption(value: string): void {
    for (const select of this.selects) {
      Array.from(select.options)
        .find(option => option.value === value)
        ?.remove();
    }
  }
}
