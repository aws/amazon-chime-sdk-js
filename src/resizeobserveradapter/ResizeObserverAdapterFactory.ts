// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ResizeObserver } from 'resize-observer';
import { ResizeObserverCallback } from 'resize-observer/lib/ResizeObserverCallback';

import DefaultResizeObserverAdapter from './DefaultResizeObserverAdapter';
import ResizeObserverAdapter from './ResizeObserverAdapter';

export default class ResizeObserverAdapterFactory {
  constructor(private provider?: () => ResizeObserverAdapter) {}

  create(callback: ResizeObserverCallback): ResizeObserverAdapter {
    if (this.provider) {
      return this.provider();
    }
    return new DefaultResizeObserverAdapter(new ResizeObserver(callback));
  }
}
