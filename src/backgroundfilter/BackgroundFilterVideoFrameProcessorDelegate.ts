// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import BackgroundFilterVideoFrameProcessorObserver, {
  FilterCPUUtilizationHighEvent,
  FilterFrameDurationHighEvent,
} from './BackgroundFilterVideoFrameProcessorObserver';

/**
 * This class adds the functionality to allow for a set of unique observers to be added to the
 * video frame processor.
 */
/** @internal */
export default class BackgroundFilterVideoFrameProcessorDelegate {
  protected observers: Set<BackgroundFilterVideoFrameProcessorObserver> = new Set();

  /**
   * Add an observer to the unique set. If a duplicate observer cannot be added.
   * @param observer An implementation of the observer interface.
   */
  addObserver(observer: BackgroundFilterVideoFrameProcessorObserver): void {
    this.observers.add(observer);
  }

  /**
   * Remove the observer from the set of observers.
   * @param observer An implementation of the observer interface.
   */
  removeObserver(observer: BackgroundFilterVideoFrameProcessorObserver): void {
    this.observers.delete(observer);
  }

  /**
   * Call the observer method with the event information. See [[BackgroundFilterVideoFrameProcessorObserver]]
   * for detailed info on this event.
   * @param event
   */
  filterFrameDurationHigh(event: FilterFrameDurationHighEvent): void {
    for (const observer of this.observers) {
      observer.filterFrameDurationHigh?.call(observer, event);
    }
  }

  filterCPUUtilizationHigh(event: FilterCPUUtilizationHighEvent): void {
    for (const observer of this.observers) {
      observer.filterCPUUtilizationHigh?.call(observer, event);
    }
  }
}
