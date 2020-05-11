// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default interface ScreenSignalingSession extends EventTarget {
  /**
   * Opens the screen sharing session
   */
  open(timeoutMs: number): Promise<Event>;

  /**
   * Closes the screen sharing session
   * @param {number} timeoutMs
   * @returns {Promise<Event>}
   */
  close(timeoutMs: number): Promise<Event>;
}
