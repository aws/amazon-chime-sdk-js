// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Substitute } from '@fluffy-spoon/substitute';
import * as chai from 'chai';

import Logger from '../../src/logger/Logger';
import LogLevel from '../../src/logger/LogLevel';
import NoOpLogger from '../../src/logger/NoOpLogger';
import ScreenViewingSession from '../../src/screenviewing/session/ScreenViewingSession';
import ScreenViewingSessionConnectionRequest from '../../src/screenviewing/session/ScreenViewingSessionConnectionRequest';
import OpenScreenViewingConnectionTask from '../../src/task/OpenScreenViewingConnectionTask';

describe('OpenScreenViewingConnectionTask', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const noOpLogger: Logger = new NoOpLogger(LogLevel.DEBUG);

  describe('constructor', () => {
    it('exists', () => {
      const task: OpenScreenViewingConnectionTask = new OpenScreenViewingConnectionTask(
        Substitute.for<ScreenViewingSession>(),
        Substitute.for<ScreenViewingSessionConnectionRequest>(),
        noOpLogger
      );

      expect(task).to.not.equal(null);
      expect(task).to.not.equal(undefined);
    });
  });

  describe('run', () => {
    it('opens a connection', (): Promise<void> =>
      new OpenScreenViewingConnectionTask(
        {
          ...Substitute.for<ScreenViewingSession>(),
          openConnection(_request: ScreenViewingSessionConnectionRequest): Promise<Event> {
            return Promise.resolve(Substitute.for());
          },
        },
        Substitute.for<ScreenViewingSessionConnectionRequest>(),
        noOpLogger
      ).run());
  });
});
