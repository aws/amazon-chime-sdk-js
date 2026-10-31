// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import Menu from './Menu';

describe('Menu', () => {
  it('moves the arrow keys past items that are not shown', () => {
    document.body.innerHTML = `
      <style>.developer-only { display: none; }</style>
      <div id="menu">
        <button id="a" class="menu-item"></button>
        <button id="b" class="menu-item" hidden></button>
        <button id="c" class="menu-item developer-only"></button>
        <button id="d" class="menu-item" disabled></button>
        <button id="e" class="menu-item"></button>
      </div>`;
    const menu = Menu.byId('menu');
    const press = (key: string): string => {
      menu.element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      return document.activeElement?.id ?? '';
    };
    document.getElementById('a')!.focus();

    expect(press('ArrowDown')).toBe('e');
    expect(press('ArrowDown')).toBe('a');
    expect(press('ArrowUp')).toBe('e');
    expect(press('End')).toBe('e');
    expect(press('Home')).toBe('a');
  });
});
