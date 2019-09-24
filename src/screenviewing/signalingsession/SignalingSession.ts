// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ScreenObserver from '../observer/ScreenObserver';
import ScreenViewingSessionConnectionRequest from '../session/ScreenViewingSessionConnectionRequest';

export default interface SignalingSession {
  open(connectionRequest: ScreenViewingSessionConnectionRequest): Promise<void>;
  close(): Promise<void>;
  registerObserver(observer: ScreenObserver): void;
  unregisterObserver(observer: ScreenObserver): void;
}
