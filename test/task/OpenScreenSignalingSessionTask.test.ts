// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Substitute } from '@fluffy-spoon/substitute';

import Logger from '../../src/logger/Logger';
import LogLevel from '../../src/logger/LogLevel';
import NoOpLogger from '../../src/logger/NoOpLogger';
import ScreenViewingSessionConnectionRequest from '../../src/screenviewing/session/ScreenViewingSessionConnectionRequest';
import SignalingSession from '../../src/screenviewing/signalingsession/SignalingSession';
import OpenScreenSignalingSessionTask from '../../src/task/OpenScreenSignalingSessionTask';

describe('OpenScreenSignalingSessionTask', () => {
  const noOpLogger: Logger = new NoOpLogger(LogLevel.DEBUG);

  describe('run', () => {
    it('opens a connection', (done: MochaDone): Promise<void> =>
      new OpenScreenSignalingSessionTask(
        {
          ...Substitute.for<SignalingSession>(),
          open(_request: ScreenViewingSessionConnectionRequest): Promise<void> {
            done();
            return Promise.resolve();
          },
        },
        Substitute.for<ScreenViewingSessionConnectionRequest>(),
        noOpLogger
      ).run());
  });
});
