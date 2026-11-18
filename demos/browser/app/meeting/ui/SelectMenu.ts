// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import LinkedSelect from './LinkedSelect';
import Menu from './Menu';

/**
 * A button that shows a `LinkedSelect`'s choice and opens a `Menu` of its choices. The menu
 * element's own children become a footer under the choices.
 */
export default class SelectMenu {
  private readonly menu: Menu;
  private readonly footer: Element[];
  private readonly value: HTMLElement;

  constructor(
    private readonly button: HTMLButtonElement,
    menuElement: HTMLElement,
    private readonly select: LinkedSelect,
    private readonly title: string
  ) {
    this.footer = Array.from(menuElement.children);
    this.value = button.querySelector<HTMLElement>('.select-button-value') ?? button;
    this.menu = new Menu(menuElement, button);
    this.menu.initialFocus = 'checked';
    this.menu.onOpen(() => {
      menuElement.style.minWidth = `${button.offsetWidth}px`;
      this.render();
    });
    select.onUpdate(() => this.update());
    button.addEventListener('keydown', this.onButtonKey);
    menuElement.addEventListener('keydown', this.onMenuKey);
    this.update();
  }

  private readonly onButtonKey = (event: KeyboardEvent): void => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.menu.open();
    }
  };

  private readonly onMenuKey = (event: KeyboardEvent): void => {
    if (event.key === 'Tab') {
      this.button.focus();
    }
  };

  onOpenChange(handler: (open: boolean) => void): void {
    this.menu.onOpen(() => handler(true));
    this.menu.onClose(() => handler(false));
  }

  close(): void {
    this.menu.close();
  }

  destroy(): void {
    this.menu.destroy();
    this.button.removeEventListener('keydown', this.onButtonKey);
    this.menu.element.removeEventListener('keydown', this.onMenuKey);
    this.menu.element.replaceChildren(...this.footer);
  }

  private update(): void {
    const selected = this.select.element.selectedOptions[0];
    this.value.textContent = selected?.text ?? '';
    if (this.menu.isOpen) {
      this.render();
      this.menu.element.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
    }
  }

  private render(): void {
    const menu = this.menu;
    const selectedIndex = this.select.element.selectedIndex;
    menu.clear();
    menu.addHeader(this.title);
    let group: string | undefined;
    for (const option of this.select.options) {
      const optionGroup =
        option.parentElement instanceof HTMLOptGroupElement
          ? option.parentElement.label
          : undefined;
      if (optionGroup && optionGroup !== group) {
        menu.addSeparator();
        menu.addHeader(optionGroup);
      }
      group = optionGroup;
      const item = menu.addItem({
        label: option.text,
        checked: option.index === selectedIndex,
        disabled: option.disabled,
        onSelect: () => {
          this.button.focus();
          this.menu.close();
          if (option.index !== this.select.element.selectedIndex) {
            this.select.pick(option.value);
          }
        },
      });
      item.setAttribute('role', 'menuitemradio');
    }
    if (this.footer.length > 0) {
      menu.addSeparator();
      menu.element.append(...this.footer);
    }
  }
}
