// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ScreenSharingMessageType from '../screensharingmessage/ScreenSharingMessageType';

export default interface ScreenSharingSessionObserver {
  didOpen?(event: Event): void;
  didClose?(event: CloseEvent): void;
  didReceiveHeartbeatRequest?(): void;
  didSendHeartbeatResponse?(): void;
  didReceiveUnknownMessage?(): void;
  didReceiveStreamStopMessage?(): void;
  didStartScreenSharing?(): void;
  didStopScreenSharing?(): void;
  didPauseScreenSharing?(): void;
  didUnpauseScreenSharing?(): void;
  didSendScreenSharingMessage?(type: ScreenSharingMessageType): void;
  willReconnect?(): void;

  /**
   * Send failure; consumer may respond to this callback by closing the session
   * @param {Error} error
   */
  didFailSend?(error: Error): void;

  /**
   * Reconnect failure; informational
   * @param {CustomEvent<ErrorEvent>} event
   */
  didFailReconnectAttempt?(event: CustomEvent<ErrorEvent>): void;
}
