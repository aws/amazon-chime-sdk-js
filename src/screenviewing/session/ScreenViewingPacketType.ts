// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export enum ScreenViewingPacketType {
  SETUP = 0x01,
  DELTA = 0x02,
  SYNC = 0x03,
  ECHO_REQUEST = 0x04,
  ECHO_RESPONSE = 0x05,
  NOSCREEN = 0x07,
  ENDSCREEN = 0x08,
  JPEG_HEADER_BYTE_0 = 0xff,
  JPEG_HEADER_BYTE_1 = 0xd8,
}

export default ScreenViewingPacketType;
