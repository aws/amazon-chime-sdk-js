// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[ScreenSharingMessageType]] Packet type enums
 */
export enum ScreenSharingMessageType {
  UnknownType = 'Unknown',
  HeartbeatRequestType = 'HeartbeatRequest',
  HeartbeatResponseType = 'HeartbeatResponse',
  StreamStart = 'StreamStart',
  StreamEnd = 'StreamEnd',
  StreamStop = 'StreamStop',
  StreamPause = 'StreamPause',
  StreamUnpause = 'StreamUnpause',
  WebM = 'WebM',
  PresenterSwitch = 'PresenterSwitch',
  KeyRequest = 'KeyRequest',
}

export default ScreenSharingMessageType;
