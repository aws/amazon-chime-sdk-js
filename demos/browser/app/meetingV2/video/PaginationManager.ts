// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default class PaginationManager<Type> {
  private currentPageStart: number = 0;

  private all = new Array<Type>();

  constructor(private pageSize: number) {}

  currentPage(): Array<Type> {
    return this.all.slice(this.currentPageStart, this.currentPageStart + this.pageSize);
  }

  add(toAdd: Type) {
    if (this.all.includes(toAdd)) {
      return;
    }
    this.all.push(toAdd);
  }

  remove(toRemove: Type) {
    if (this.all.includes(toRemove)) {
      this.all.splice(this.all.indexOf(toRemove), 1);
    }
  }

  removeIf(toRemoveFn: (value: Type) => boolean) {
    const index = this.all.findIndex(toRemoveFn);
    if (index === -1) {
      return;
    }
    this.all.splice(index, 1);
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
