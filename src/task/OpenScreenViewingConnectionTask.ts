// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import ScreenViewingSession from '../screenviewing/session/ScreenViewingSession';
import ScreenViewingSessionConnectionRequest from '../screenviewing/session/ScreenViewingSessionConnectionRequest';
import BaseTask from './BaseTask';

export default class OpenScreenViewingConnectionTask extends BaseTask {
  protected taskName = 'OpenScreenViewingConnectionTask';

  constructor(
    private client: ScreenViewingSession,
    private connectionRequest: ScreenViewingSessionConnectionRequest,
    protected logger: Logger
  ) {
    super(logger);
  }

  async run(): Promise<void> {
    this.logger.info('OpenScreenViewingConnectionTask: Opening connection');
    return this.client.openConnection(this.connectionRequest).then(() => {});
  }
}
