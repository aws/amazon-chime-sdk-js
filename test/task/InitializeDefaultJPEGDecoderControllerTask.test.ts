// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import DefaultJPEGDecoderController from '../../src/jpegdecoder/controller/DefaultJPEGDecoderController';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import InitializeDefaultJPEGDecoderControllerTask from '../../src/task/InitializeDefaultJPEGDecoderControllerTask';

describe('InitializeDefaultJPEGDecoderControllerTask', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  describe('constructor', () => {
    it('exists', () => {
      const task: InitializeDefaultJPEGDecoderControllerTask = new InitializeDefaultJPEGDecoderControllerTask(
        new DefaultJPEGDecoderController(new NoOpDebugLogger(), 65536),
        new NoOpDebugLogger()
      );
      expect(task).to.exist;
    });
  });

  describe('run', () => {
    it('can run', async () => {
      const task: InitializeDefaultJPEGDecoderControllerTask = new InitializeDefaultJPEGDecoderControllerTask(
        new DefaultJPEGDecoderController(new NoOpDebugLogger(), 65536),
        new NoOpDebugLogger()
      );
      await task.run();
    });
  });
});
