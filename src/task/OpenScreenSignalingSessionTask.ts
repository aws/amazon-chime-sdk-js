// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import ScreenViewingSessionConnectionRequest from '../screenviewing/session/ScreenViewingSessionConnectionRequest';
import SignalingSession from '../screenviewing/signalingsession/SignalingSession';
import BaseTask from './BaseTask';

export default class OpenScreenSignalingSessionTask extends BaseTask {
  protected taskName = 'OpenScreenSignalingSessionTask';

  constructor(
    private signalingSession: SignalingSession,
    private connectionRequest: ScreenViewingSessionConnectionRequest,
    protected logger: Logger
  ) {
    super(logger);
  }

  async run(): Promise<void> {
    this.logger.info('OpenScreenSignalingSessionTask: Opening connection');
    return this.signalingSession.open(this.connectionRequest).then(() => {});
  }
}
