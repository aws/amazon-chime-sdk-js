// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import DefaultJPEGDecoderController from './controller/DefaultJPEGDecoderController';
import JPEGDecoderController from './controller/JPEGDecoderController';
import JPEGDecoderComponentFactory from './JPEGDecoderComponentFactory';

/** @internal */
export default class DefaultJPEGDecoderComponentFactory implements JPEGDecoderComponentFactory {
  constructor(private logger: Logger, private maxInputBytes: number) {}

  async newController(): Promise<JPEGDecoderController> {
    const controller = new DefaultJPEGDecoderController(this.logger, this.maxInputBytes);
    await controller.init();
    return controller;
  }
}
