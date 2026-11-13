// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default class PaginationManager<Type> {
  private currentPageStart: number = 0;

  private all = new Array<Type>();

  constructor(private readonly pageSize: number) {}

  currentPage(): Array<Type> {
    return this.all.slice(this.currentPageStart, this.currentPageStart + this.pageSize);
  }

  add(toAdd: Type): void {
    if (this.all.includes(toAdd)) {
      return;
    }
    this.all.push(toAdd);
  }

  remove(toRemove: Type): void {
    this.removeIf(value => value === toRemove);
  }

  removeIf(toRemoveFn: (value: Type) => boolean): void {
    this.all = this.all.filter(value => !toRemoveFn(value));
    while (this.currentPageStart > 0 && this.currentPageStart >= this.all.length) {
      this.currentPageStart -= this.pageSize;
    }
  }

  hasNextPage(): boolean {
    return this.currentPageStart + this.pageSize < this.all.length;
  }

  nextPage(): void {
    if (!this.hasNextPage()) {
      return;
    }
    this.currentPageStart += this.pageSize;
  }

  hasPreviousPage(): boolean {
    return this.currentPageStart - this.pageSize >= 0;
  }

  previousPage(): void {
    if (this.hasPreviousPage()) {
      this.currentPageStart -= this.pageSize;
    }
  }
}
