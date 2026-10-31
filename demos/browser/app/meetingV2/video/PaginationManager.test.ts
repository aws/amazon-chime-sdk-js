// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import PaginationManager from './PaginationManager';

describe('PaginationManager', () => {
  it('pages through added items in insertion order', () => {
    const pagination = new PaginationManager<string>(2);
    ['a', 'b', 'c', 'd', 'e'].forEach(item => pagination.add(item));
    expect(pagination.currentPage()).toEqual(['a', 'b']);
    expect(pagination.hasPreviousPage()).toBe(false);
    expect(pagination.hasNextPage()).toBe(true);
    pagination.nextPage();
    expect(pagination.currentPage()).toEqual(['c', 'd']);
    pagination.nextPage();
    expect(pagination.currentPage()).toEqual(['e']);
    expect(pagination.hasNextPage()).toBe(false);
    pagination.previousPage();
    expect(pagination.currentPage()).toEqual(['c', 'd']);
  });

  it('ignores duplicates and removes by value or predicate', () => {
    const pagination = new PaginationManager<string>(10);
    pagination.add('a');
    pagination.add('a');
    pagination.add('b');
    pagination.add('c');
    expect(pagination.currentPage()).toEqual(['a', 'b', 'c']);
    pagination.remove('b');
    expect(pagination.currentPage()).toEqual(['a', 'c']);
    pagination.removeIf(value => value === 'a');
    expect(pagination.currentPage()).toEqual(['c']);
  });

  it('removes every match and steps back when the current page empties', () => {
    const pagination = new PaginationManager<string>(2);
    ['a', 'b', 'c', 'd'].forEach(item => pagination.add(item));
    pagination.nextPage();
    expect(pagination.currentPage()).toEqual(['c', 'd']);
    pagination.removeIf(value => value === 'c' || value === 'd');
    expect(pagination.currentPage()).toEqual(['a', 'b']);
    expect(pagination.hasNextPage()).toBe(false);
  });

  it('steps back when remove() empties the last page', () => {
    const pagination = new PaginationManager<string>(2);
    ['a', 'b', 'c'].forEach(item => pagination.add(item));
    pagination.nextPage();
    pagination.remove('c');
    expect(pagination.currentPage()).toEqual(['a', 'b']);
  });
});
