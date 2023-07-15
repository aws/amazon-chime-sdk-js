// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import BaseTask from './BaseTask';

export default class CleanRestartedSessionTask extends BaseTask {
  protected taskName = 'CleanRestartedSessionTask';

  constructor(private context: AudioVideoControllerState) {
    super(context.logger);
  }

  async run(): Promise<void> {
    this.context.resetConnectionSpecificState();
  }
}
