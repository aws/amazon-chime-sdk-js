// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ResizeObserver } from 'resize-observer';

import ResizeObserverAdapter from './ResizeObserverAdapter';

export default class DefaultResizeObserverAdapter implements ResizeObserverAdapter {
  constructor(private resizeObserver: ResizeObserver) {}

  observe(target: Element): void {
    this.resizeObserver.observe(target);
  }

  unobserve(target: Element): void {
    this.resizeObserver.unobserve(target);
  }
}
