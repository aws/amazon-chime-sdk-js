// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../../logger/Logger';
import ScreenViewingDeltaRenderer from '../deltarenderer/ScreenViewingDeltaRenderer';
import ScreenViewingDeltaSource from './ScreenViewingDeltaSource';

export default class DefaultScreenViewingDeltaSource implements ScreenViewingDeltaSource {
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  public notShared: boolean;
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  public pendingDx: number;
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  public pendingDy: number;

  constructor(private deltaRenderer: ScreenViewingDeltaRenderer, private logger: Logger) {}

  flushSyncBuffer(): void {
    this.logger.debug(() => `DefaultScreenViewingDeltaSource: Flushing sync buffer`);
    for (let dy = 0; dy < this.deltaRenderer.imageDimensions.screenHeight; dy++) {
      for (let dx = 0; dx < this.deltaRenderer.imageDimensions.screenWidth; dx++) {
        if (!this.deltaRenderer.syncBuffer[dy][dx]) {
          continue;
        }
        this.deltaRenderer.jpegDataArrays[dy][dx] = this.deltaRenderer.syncBuffer[dy][dx];
        this.deltaRenderer.syncBuffer[dy][dx] = null;
        this.deltaRenderer.hasRendered[dy][dx] = false;
      }
    }
  }
}
