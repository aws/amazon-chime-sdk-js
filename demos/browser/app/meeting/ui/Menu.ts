// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { clear, el } from './dom';
import { iconElement, IconName } from './icons';

export interface MenuItemOptions {
  label: string;
  id?: string;
  icon?: IconName | SVGElement;
  description?: string;
  disabled?: boolean;
  checked?: boolean;
  keepOpen?: boolean;
  onSelect?: (item: HTMLButtonElement) => void;
}

const supportsPopover = typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype;

/**
 * Popover API menu (top layer, above dialogs). The popover is `manual` so invokers can decide
 * what a click does, so light dismiss and Escape are implemented here. Without `popover`
 * support, a fixed element toggled with `menu-open`.
 */
export default class Menu {
  /** `corner`: grows out of the invoker's corner and covers it. `beside`: above or below it. */
  placement: 'beside' | 'corner' = 'beside';
  private readonly openHandlers = new Set<() => void>();
  private readonly outsidePress = (event: PointerEvent): void => {
    const target = event.target as Node;
    if (!this.element.contains(target) && !this.invoker?.contains(target)) {
      this.close();
    }
  };

  constructor(
    public readonly element: HTMLElement,
    public readonly invoker?: HTMLElement,
    private readonly openOnInvokerClick = true
  ) {
    element.classList.add('menu');
    element.setAttribute('role', 'menu');
    if (supportsPopover) {
      element.setAttribute('popover', 'manual');
      element.addEventListener('beforetoggle', this.onBeforeToggle);
      element.addEventListener('toggle', this.onToggle);
    }
    element.addEventListener('keydown', this.onKeyDown);
    if (invoker) {
      invoker.setAttribute('aria-haspopup', 'menu');
      invoker.setAttribute('aria-expanded', 'false');
      if (!invoker.getAttribute('aria-controls')) {
        invoker.setAttribute('aria-controls', element.id);
      }
      if (this.openOnInvokerClick) {
        invoker.addEventListener('click', this.onInvokerClick);
      }
    }
  }

  /** Runs inside showPopover(), so the items exist by the time the menu shows. */
  private readonly onBeforeToggle = (event: Event): void => {
    if ((event as ToggleEvent).newState === 'open') {
      this.runOpenHandlers();
    }
  };

  private readonly onToggle = (event: Event): void => {
    if ((event as ToggleEvent).newState === 'open') {
      this.didOpen();
    } else {
      this.didClose();
    }
  };

  private readonly onInvokerClick = (event: Event): void => {
    event.preventDefault();
    this.toggle();
  };

  destroy(): void {
    this.close();
    this.element.removeEventListener('beforetoggle', this.onBeforeToggle);
    this.element.removeEventListener('toggle', this.onToggle);
    this.element.removeEventListener('keydown', this.onKeyDown);
    this.invoker?.removeEventListener('click', this.onInvokerClick);
    document.removeEventListener('pointerdown', this.outsidePress);
    this.openHandlers.clear();
  }

  static byId(id: string, invoker?: HTMLElement, openOnInvokerClick = true): Menu {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Missing menu #${id}`);
    }
    return new Menu(element, invoker, openOnInvokerClick);
  }

  get isOpen(): boolean {
    return supportsPopover
      ? this.element.matches(':popover-open')
      : this.element.classList.contains('menu-open');
  }

  open(): void {
    if (this.isOpen) {
      return;
    }
    if (supportsPopover) {
      this.element.showPopover();
      return;
    }
    this.element.classList.add('menu-open');
    this.didOpen();
  }

  close(): void {
    if (!this.isOpen) {
      return;
    }
    if (supportsPopover) {
      this.element.hidePopover();
      return;
    }
    this.element.classList.remove('menu-open');
    this.didClose();
  }

  private runOpenHandlers(): void {
    for (const handler of this.openHandlers) {
      handler();
    }
  }

  private didOpen(): void {
    // Popovers built their content in beforetoggle.
    if (!supportsPopover) {
      this.runOpenHandlers();
    }
    this.position();
    this.invoker?.setAttribute('aria-expanded', 'true');
    document.addEventListener('pointerdown', this.outsidePress);
    this.focusFirstItem();
  }

  private didClose(): void {
    this.invoker?.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', this.outsidePress);
  }

  toggle(): void {
    this.isOpen ? this.close() : this.open();
  }

  onOpen(handler: () => void): void {
    this.openHandlers.add(handler);
  }

  clear(): void {
    clear(this.element);
  }

  addItem(options: MenuItemOptions): HTMLButtonElement {
    const checkable = options.checked !== undefined;
    const check = checkable ? el('span', { class: 'menu-check' }, iconElement('check')) : null;
    const icon = options.icon
      ? el(
          'span',
          { class: 'menu-icon' },
          typeof options.icon === 'string' ? iconElement(options.icon) : options.icon
        )
      : null;
    const label = el(
      'span',
      { class: 'menu-label' },
      el('span', { text: options.label }),
      options.description
        ? el('span', { class: 'menu-description', text: options.description })
        : null
    );
    const item = el(
      'button',
      {
        type: 'button',
        class: 'menu-item',
        id: options.id,
        role: checkable ? 'menuitemcheckbox' : 'menuitem',
        'aria-checked': checkable ? String(options.checked) : undefined,
        disabled: options.disabled,
        tabindex: '-1',
      },
      ...(icon ? [icon, label, check] : [check, label])
    );
    item.addEventListener('click', () => {
      options.onSelect?.(item);
      if (!options.keepOpen) {
        this.close();
      }
    });
    this.element.appendChild(item);
    return item;
  }

  addSeparator(): void {
    this.element.appendChild(el('div', { class: 'menu-separator', role: 'separator' }));
  }

  addHeader(text: string): void {
    this.element.appendChild(el('div', { class: 'menu-header', text }));
  }

  /** Stays open by default so nearby values can be compared. */
  addRadioGroup(
    choices: {
      value: string;
      label: string;
      id?: string;
      description?: string;
      icon?: IconName;
    }[],
    current: string,
    onChange: (value: string) => void,
    { keepOpen = true }: { keepOpen?: boolean } = {}
  ): void {
    const items: HTMLButtonElement[] = [];
    for (const choice of choices) {
      const item = this.addItem({
        label: choice.label,
        id: choice.id,
        description: choice.description,
        icon: choice.icon,
        checked: choice.value === current,
        keepOpen,
        onSelect: () => {
          for (const other of items) {
            other.setAttribute('aria-checked', String(other === item));
          }
          onChange(choice.value);
        },
      });
      item.setAttribute('role', 'menuitemradio');
      items.push(item);
    }
  }

  static setChecked(item: HTMLElement, checked: boolean): void {
    item.setAttribute('aria-checked', String(checked));
  }

  private items(): HTMLElement[] {
    return Array.from(
      this.element.querySelectorAll<HTMLElement>('.menu-item:not([disabled])')
    ).filter(item => !item.hidden && getComputedStyle(item).display !== 'none');
  }

  private focusFirstItem(): void {
    const first = this.items()[0];
    first?.focus();
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const items = this.items();
    const index = items.indexOf(document.activeElement as HTMLElement);
    switch (event.key) {
      case 'ArrowDown':
        items[(index + 1) % items.length]?.focus();
        event.preventDefault();
        break;
      case 'ArrowUp':
        items[(index - 1 + items.length) % items.length]?.focus();
        event.preventDefault();
        break;
      case 'Home':
        items[0]?.focus();
        event.preventDefault();
        break;
      case 'End':
        items[items.length - 1]?.focus();
        event.preventDefault();
        break;
      case 'Escape':
        this.close();
        this.invoker?.focus();
        event.preventDefault();
        break;
      case 'Tab':
        this.close();
        break;
    }
  };

  private position(): void {
    if (!this.invoker) {
      return;
    }
    const style = this.element.style;
    if (this.placement === 'corner') {
      this.positionInCorner();
      return;
    }
    // On phones the menu is a CSS bottom sheet; clear any earlier inline placement.
    const sheet = window.matchMedia('(max-width: 600px)').matches;
    this.element.classList.toggle('menu-sheet', sheet);
    if (sheet) {
      style.cssText = '';
      return;
    }
    const margin = 6;
    // The invoker may be hidden (opened from the More menu): anchor to the nearest visible box.
    let anchorElement: Element | null = this.invoker;
    while (anchorElement && anchorElement.getClientRects().length === 0) {
      anchorElement = anchorElement.parentElement;
    }
    const anchor = (anchorElement ?? this.invoker).getBoundingClientRect();
    style.position = 'fixed';
    style.top = 'auto';
    style.bottom = 'auto';
    style.left = '0px';
    style.maxHeight = `${Math.max(160, window.innerHeight - 2 * margin - anchor.height - 2 * margin)}px`;
    const menuRect = this.element.getBoundingClientRect();
    const openUpward = anchor.top > window.innerHeight / 2;
    if (openUpward) {
      style.bottom = `${Math.max(margin, window.innerHeight - anchor.top + margin)}px`;
    } else {
      style.top = `${anchor.bottom + margin}px`;
    }
    let left = anchor.left + anchor.width / 2 - menuRect.width / 2;
    left = Math.min(Math.max(margin, left), window.innerWidth - menuRect.width - margin);
    style.left = `${left}px`;
  }

  private positionInCorner(): void {
    const style = this.element.style;
    const margin = 6;
    const anchor = this.invoker!.getBoundingClientRect();
    this.element.classList.add('menu-corner');
    style.position = 'fixed';
    style.top = 'auto';
    style.bottom = 'auto';
    style.left = '0px';
    style.maxHeight = `${window.innerHeight - 2 * margin}px`;
    // Not the bounding box, which is scaled while the open animation runs.
    const { offsetWidth: width, offsetHeight: height } = this.element;
    const down = anchor.top + height <= window.innerHeight - margin;
    this.element.classList.toggle('menu-corner-up', !down);
    if (down) {
      style.top = `${anchor.top}px`;
    } else {
      style.bottom = `${Math.max(margin, window.innerHeight - anchor.bottom)}px`;
    }
    style.left = `${Math.max(margin, anchor.right - width)}px`;
  }
}
