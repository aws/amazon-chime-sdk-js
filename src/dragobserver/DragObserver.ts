// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DragEvent from './DragEvent';

export type DragObserverFactory = (
  window: Window,
  callback: (dragEvent: DragEvent) => void,
  element: HTMLElement
) => DragObserver;

export default interface DragObserver {
  /**
   * Removes any state associated with the observer
   */
  unobserve(): void;
}
