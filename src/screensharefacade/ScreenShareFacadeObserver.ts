// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default interface ScreenShareFacadeObserver {
  didOpen?(event: Event): void;
  didClose?(event: CloseEvent): void;
  didStartScreenSharing?(): void;
  didStopScreenSharing?(): void;
  didPauseScreenSharing?(): void;
  didUnpauseScreenSharing?(): void;
  willReconnect?(): void;
}
