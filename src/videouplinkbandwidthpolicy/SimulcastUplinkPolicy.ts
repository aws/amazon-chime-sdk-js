// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import SimulcastUplinkObserver from './SimulcastUplinkObserver';
import VideoUplinkBandwidthPolicy from './VideoUplinkBandwidthPolicy';

export default interface SimulcastUplinkPolicy extends VideoUplinkBandwidthPolicy {
  /**
   * Adds SimulcastUplinkObserver to observe simulcast encoding
   * resolution layer changes
   */
  addObserver(observer: SimulcastUplinkObserver): void;

  /**
   * Removes SimulcastUplinkObserver
   */
  removeObserver(observer: SimulcastUplinkObserver): void;

  /**
   * Iterates through each observer, so that their notification functions may
   * be called.
   */
  forEachObserver(observerFunc: (observer: SimulcastUplinkObserver) => void): void;
}
