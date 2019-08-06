// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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
  didSendScreenSharingMessage?(type: ScreenSharingMessageType): void;
  willReconnect?(): void;
}
