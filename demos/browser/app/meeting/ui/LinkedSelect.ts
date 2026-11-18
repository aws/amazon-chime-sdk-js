// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { STRINGS } from '../strings';
import { clear, el } from './dom';

export interface SelectChoice {
  value: string;
  label: string;
  group?: string;
}

/**
 * A `<select>` that other views (`SelectMenu`) show too: they redraw from `onUpdate` and choose
 * with `pick`, and a choice made in any of them fires one handler.
 */
export default class LinkedSelect {
  private readonly handlers = new Set<(value: string) => void>();
  private readonly updateHandlers = new Set<() => void>();
  private readonly onSelectChange = (): void => this.pick(this.element.value);

  constructor(public readonly element: HTMLSelectElement) {
    element.addEventListener('change', this.onSelectChange);
  }

  destroy(): void {
    this.element.removeEventListener('change', this.onSelectChange);
    this.handlers.clear();
    this.updateHandlers.clear();
  }

  get value(): string {
    return this.element.value;
  }

  set value(value: string) {
    this.element.value = value;
    this.notifyUpdate();
  }

  get options(): HTMLOptionElement[] {
    return Array.from(this.element.options);
  }

  set disabled(disabled: boolean) {
    this.element.disabled = disabled;
  }

  hasValue(value: string): boolean {
    return this.options.some(option => option.value === value);
  }

  onChange(handler: (value: string) => void): void {
    this.handlers.add(handler);
  }

  onUpdate(handler: () => void): void {
    this.updateHandlers.add(handler);
  }

  /** As if the user chose `value` in the select. */
  pick(value: string): void {
    this.value = value;
    for (const handler of this.handlers) {
      handler(value);
    }
  }

  private notifyUpdate(): void {
    for (const handler of this.updateHandlers) {
      handler();
    }
  }

  /** Keeps the previous selection when it still exists, else tries `preferred`. */
  fill(
    choices: SelectChoice[],
    preferred: string | null = null,
    emptyLabel: string = STRINGS.selectionUnavailable
  ): void {
    const previous = this.value;
    const select = this.element;
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
    for (const candidate of [previous, preferred]) {
      if (candidate && this.hasValue(candidate)) {
        this.value = candidate;
        return;
      }
    }
    this.notifyUpdate();
  }

  removeOption(value: string): void {
    this.options.find(option => option.value === value)?.remove();
    this.notifyUpdate();
  }
}
