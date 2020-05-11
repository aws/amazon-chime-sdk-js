// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ScreenShareStreamFactory from './ScreenShareStreamFactory';
import ScreenShareStreamingFactory from './ScreenShareStreamingFactory';

export default class ScreenShareStreamingContainer {
  private memo: ScreenShareStreamingFactory | null = null;

  screenShareStreamingFactory(): ScreenShareStreamingFactory {
    this.memo = this.memo || new ScreenShareStreamFactory();
    return this.memo;
  }
}
