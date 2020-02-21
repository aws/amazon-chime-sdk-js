// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default interface ContentShareController {
  /**
   * Start content sharing
   */
  startContentShare(stream: MediaStream): Promise<void>;

  /**
   * Start screen sharing
   */
  startContentShareFromScreenCapture(sourceId?: string): Promise<void>;

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
}
