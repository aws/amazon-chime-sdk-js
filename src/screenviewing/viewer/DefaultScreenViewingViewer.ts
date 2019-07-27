// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../../logger/Logger';
import ScreenViewingDeltaRenderer from '../deltarenderer/ScreenViewingDeltaRenderer';
import ScreenViewingViewer from './ScreenViewingViewer';

export default class DefaultScreenViewingViewer implements ScreenViewingViewer {
  constructor(private deltaRenderer: ScreenViewingDeltaRenderer, private logger: Logger) {}

  start(viewport: HTMLDivElement): void {
    this.logger.info(`DefaultScreenViewingViewer: Starting`);
    this.deltaRenderer.setViewport(viewport);
  }

  stop(): void {
    this.logger.info(`DefaultScreenViewingViewer: Stopping`);
    this.deltaRenderer.close();
  }

  resizeAndSync(): void {
    this.deltaRenderer.resizeAndSync();
  }
}
