// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import NoOpMediaStreamBroker from '../../src/mediastreambroker/NoOpMediaStreamBroker';
import ReleaseMediaInputTask from '../../src/task/ReleaseMediaInputTask';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('ReleaseMediaInputTask', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  let dommMockBehavior: DOMMockBehavior;
  let domMockBuilder: DOMMockBuilder;
  let context: AudioVideoControllerState;
  let task: ReleaseMediaInputTask;

  beforeEach(async () => {
    dommMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(dommMockBehavior);
    context = new AudioVideoControllerState();
    context.audioVideoController = new NoOpAudioVideoController();
    context.logger = context.audioVideoController.logger;
    context.realtimeController = context.audioVideoController.realtimeController;
    context.mediaStreamBroker = new NoOpMediaStreamBroker();

    // @ts-ignore
    const audioTrack = new MediaStreamTrack('audio-track-id', 'audio');
    // @ts-ignore
    const videoTrack = new MediaStreamTrack('video-track-id', 'video');
    context.activeAudioInput = new MediaStream();
    context.activeAudioInput.addTrack(audioTrack);
    context.activeVideoInput = new MediaStream();
    context.activeVideoInput.addTrack(videoTrack);

    task = new ReleaseMediaInputTask(context);
  });

  afterEach(() => {
    domMockBuilder.cleanup();
  });

  it('sets audio and video input to null', async () => {
    await task.run();
    expect(context.activeAudioInput).to.be.null;
    expect(context.activeVideoInput).to.be.null;
  });

  it('releases audio and video device', async () => {
    let called = 0;
    class MockMediaStreamBroker extends NoOpMediaStreamBroker {
      releaseMediaStream(mediaStream: MediaStream): void {
        const track = mediaStream.getTracks()[0];
        if (track.kind === 'audio' || track.kind === 'video') {
          called += 1;
        }
      }
    }
    context.mediaStreamBroker = new MockMediaStreamBroker();
    await task.run();
    expect(called).to.equal(2);
  });

  it('resets the realtime local audio', async () => {
    const { activeAudioInput } = context;

    expect(activeAudioInput.getTracks()[0].enabled).to.be.false;
    context.realtimeController.realtimeSetLocalAudioInput(activeAudioInput);
    expect(activeAudioInput.getTracks()[0].enabled).to.be.true;

    // To let the media stream broker skip releasing inputs
    context.activeAudioInput = null;
    context.activeVideoInput = null;

    await task.run();
    expect(activeAudioInput.getTracks()[0].enabled).to.be.false;
  });
});
