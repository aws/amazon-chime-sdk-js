// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ContentShareObserver from '../contentshareobserver/ContentShareObserver';

export default interface ContentShareControllerFacade {
  /**
   * Start content sharing
   */
  startContentShare(stream: MediaStream): Promise<void>;

  /**
   * Start screen sharing
   */
  startContentShareFromScreenCapture(sourceId?: string, frameRate?: number): Promise<MediaStream>;

  /**
   * Pause content sharing
   */
  pauseContentShare(): void;

  /**
   * Unpause content sharing
   */
  unpauseContentShare(): void;

  /**
   * Stop content sharing
   */
  stopContentShare(): void;

  /**
   * Add an observer
   */
  addContentShareObserver(observer: ContentShareObserver): void;

  /**
   * Remove an observer
   */
  removeContentShareObserver(observer: ContentShareObserver): void;
}
