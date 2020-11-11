// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DefaultAudioMixController from '../../src/audiomixcontroller/DefaultAudioMixController';
import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import NoOpLogger from '../../src/logger/NoOpLogger';
import NoOpMediaStreamBroker from '../../src/mediastreambroker/NoOpMediaStreamBroker';
import DefaultRealtimeController from '../../src/realtimecontroller/DefaultRealtimeController';
import ReceiveAudioInputTask from '../../src/task/ReceiveAudioInputTask';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

interface MockMediaStreamBrokerConfigs {
  acquireAudioInputDeviceSucceeds: boolean;
}

class MockMediaStreamBroker extends NoOpMediaStreamBroker {
  constructor(private configs: MockMediaStreamBrokerConfigs) {
    super();
  }

  acquireAudioInputStream(): Promise<MediaStream> {
    if (this.configs.acquireAudioInputDeviceSucceeds) {
      const constraints: MediaStreamConstraints = { audio: true, video: false };
      return navigator.mediaDevices.getUserMedia(constraints);
    } else {
      return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
    }
  }
}

describe('ReceiveAudioInputTask', () => {
  let domMockBehavior: DOMMockBehavior;
  let domMockBuilder: DOMMockBuilder;
  let context: AudioVideoControllerState;
  const logger = new NoOpLogger();

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    context = new AudioVideoControllerState();
    context.audioVideoController = new NoOpAudioVideoController();
    context.logger = context.audioVideoController.logger;
    context.mediaStreamBroker = new MockMediaStreamBroker({
      acquireAudioInputDeviceSucceeds: true,
    });
    context.realtimeController = new DefaultRealtimeController();
    context.audioMixController = new DefaultAudioMixController(logger);
  });

  afterEach(() => {
    if (domMockBuilder) {
      domMockBuilder.cleanup();
      domMockBuilder = null;
    }
  });

  describe('run', () => {
    it('will acquire the audio input', async () => {
      const task = new ReceiveAudioInputTask(context);
      await task.run();
    });

    it('will skip if there is already an active audio input', async () => {
      context.activeAudioInput = new MediaStream();
      const task = new ReceiveAudioInputTask(context);
      await task.run();
    });

    it('will fail gracefully if an audio input is not available', async () => {
      context.mediaStreamBroker = new MockMediaStreamBroker({
        acquireAudioInputDeviceSucceeds: false,
      });
      const task = new ReceiveAudioInputTask(context);
      await task.run();
    });

    it('will acquire the audio input of the "default" label', async () => {
      domMockBehavior.getUserMediaAudioLabel = 'default';
      const task = new ReceiveAudioInputTask(context);
      await task.run();
    });

    it('will acquire the audio input of the non-default label', async () => {
      domMockBehavior.getUserMediaAudioLabel = 'test-label';
      const task = new ReceiveAudioInputTask(context);
      await task.run();
    });
  });
});
