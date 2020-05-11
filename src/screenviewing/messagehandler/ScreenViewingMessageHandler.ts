// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default interface ScreenViewingMessageHandler {
  /**
   * Handles a screen viewing echo request message.
   * @param dataView
   */
  handleEchoRequest(dataView: DataView): void;

  /**
   * Handles a screen viewing setup message.
   */
  handleSetup(dataView: DataView): void;

  /**
   * Handles a screen viewing delta message.
   */
  handleDelta(dataView: DataView): void;

  /**
   * Handles a screen viewing sync message.
   */
  handleSync(dataView: DataView): void;

  /**
   * Handles a screen viewing no-screen message.
   */
  handleNoScreen(dataView: DataView): void;

  /**
   * Handles a screen viewing end-screen message.
   */
  handleEndScreen(dataView: DataView): void;

  /**
   * Handles a screen viewing default message.
   */
  handleDefault(dataView: DataView): void;
}
