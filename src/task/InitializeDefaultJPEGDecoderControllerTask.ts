// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DefaultJPEGDecoderController from '../jpegdecoder/controller/DefaultJPEGDecoderController';
import Logger from '../logger/Logger';
import BaseTask from './BaseTask';

export default class InitializeDefaultJPEGDecoderControllerTask extends BaseTask {
  constructor(
    private defaultJPEGDecoderController: DefaultJPEGDecoderController,
    protected logger: Logger
  ) {
    super(logger);
  }

  run(): Promise<void> {
    return this.defaultJPEGDecoderController.init();
  }
}
