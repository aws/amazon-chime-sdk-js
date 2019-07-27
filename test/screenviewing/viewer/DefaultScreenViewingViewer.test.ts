// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Substitute } from '@fluffy-spoon/substitute';

import Logger from '../../../src/logger/Logger';
import LogLevel from '../../../src/logger/LogLevel';
import NoOpLogger from '../../../src/logger/NoOpLogger';
import ScreenViewingDeltaRenderer from '../../../src/screenviewing/deltarenderer/ScreenViewingDeltaRenderer';
import DefaultScreenViewingViewer from '../../../src/screenviewing/viewer/DefaultScreenViewingViewer';

describe('DefaultScreenViewingViewer', () => {
  const noOpLogger: Logger = new NoOpLogger(LogLevel.DEBUG);
  describe('start', () => {
    it('starts', (done: MochaDone) => {
      new DefaultScreenViewingViewer(
        {
          ...Substitute.for<ScreenViewingDeltaRenderer>(),
          setViewport(_container: HTMLDivElement): void {
            done();
          },
        },
        noOpLogger
      ).start(Substitute.for<HTMLDivElement>());
    });
  });

  describe('stop', () => {
    it('stops', (done: MochaDone) => {
      new DefaultScreenViewingViewer(
        {
          ...Substitute.for<ScreenViewingDeltaRenderer>(),
          close(): void {
            done();
          },
        },
        noOpLogger
      ).stop();
    });
  });

  describe('resizeAndSync', () => {
    it('', (done: MochaDone) => {
      new DefaultScreenViewingViewer(
        {
          ...Substitute.for<ScreenViewingDeltaRenderer>(),
          resizeAndSync(): void {
            done();
          },
        },
        noOpLogger
      ).resizeAndSync();
    });
  });
});
