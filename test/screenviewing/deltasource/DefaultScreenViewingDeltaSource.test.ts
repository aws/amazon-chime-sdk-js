// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Substitute } from '@fluffy-spoon/substitute';

import Logger from '../../../src/logger/Logger';
import LogLevel from '../../../src/logger/LogLevel';
import NoOpLogger from '../../../src/logger/NoOpLogger';
import ScreenViewingDeltaRenderer from '../../../src/screenviewing/deltarenderer/ScreenViewingDeltaRenderer';
import DefaultScreenViewingDeltaSource from '../../../src/screenviewing/deltasource/DefaultScreenViewingDeltaSource';
import ScreenViewingImageDimensions from '../../../src/screenviewing/messagehandler/ScreenViewingImageDimensions';

describe('DefaultScreenViewingDeltaSource', () => {
  const noOpRenderer: ScreenViewingDeltaRenderer = Substitute.for<ScreenViewingDeltaRenderer>();
  const logger: Logger = new NoOpLogger(LogLevel.DEBUG);

  describe('flushSyncBuffer', () => {
    it('no-ops with no sync buffer', () => {
      const renderer: ScreenViewingDeltaRenderer = {
        ...noOpRenderer,
        syncBuffer: [[new Uint8Array(), undefined]],
        jpegDataArrays: [[]],
        hasRendered: [[]],
        imageDimensions: {
          ...Substitute.for<ScreenViewingImageDimensions>(),
          screenWidth: 2,
          screenHeight: 1,
        },
      };
      new DefaultScreenViewingDeltaSource(renderer, logger).flushSyncBuffer();
    });
  });
});
