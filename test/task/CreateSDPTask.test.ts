// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import AudioProfile from '../../src/audioprofile/AudioProfile';
import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import DefaultBrowserBehavior from '../../src/browserbehavior/DefaultBrowserBehavior';
import MeetingSessionConfiguration from '../../src/meetingsession/MeetingSessionConfiguration';
import CreateSDPTask from '../../src/task/CreateSDPTask';
import Task from '../../src/task/Task';
import DefaultTransceiverController from '../../src/transceivercontroller/DefaultTransceiverController';
import DefaultVideoStreamIdSet from '../../src/videostreamidset/DefaultVideoStreamIdSet';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';
import CreateMeetingResponseMock from '../meetingsession/CreateMeetingResponseMock';

describe('CreateSDPTask', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  let context: AudioVideoControllerState;
  let domMockBuilder: DOMMockBuilder;
  let domMockBehavior: DOMMockBehavior;
  let task: Task;

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    context = new AudioVideoControllerState();
    context.browserBehavior = new DefaultBrowserBehavior();
    context.audioProfile = new AudioProfile();
    context.audioVideoController = new NoOpAudioVideoController();
    context.transceiverController = new DefaultTransceiverController(
      context.logger,
      context.browserBehavior,
      context
    );
    context.videoTileController = context.audioVideoController.videoTileController;
    context.logger = context.audioVideoController.logger;
    context.videosToReceive = new DefaultVideoStreamIdSet();
    const peer: RTCPeerConnection = new RTCPeerConnection();
    context.peer = peer;
    task = new CreateSDPTask(context);
    context.meetingSessionConfiguration = new MeetingSessionConfiguration(
      CreateMeetingResponseMock.MeetingResponseMock,
      CreateMeetingResponseMock.AttendeeResponseMock
    );
  });

  afterEach(() => {
    if (domMockBuilder) {
      domMockBuilder.cleanup();
      domMockBuilder = null;
    }
  });

  describe('construction', () => {
    it('can be constructed', () => {
      expect(task).to.not.equal(null);
    });
  });

  describe('run', () => {
    it('can be run and received parameters are correct', done => {
      class TestPeerConnectionMock extends RTCPeerConnection {
        // @ts-ignore - overriding with simplified signature for testing
        createOffer(options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit> {
          expect(options.offerToReceiveAudio).to.be.equal(true);
          expect(options.offerToReceiveVideo).to.be.equal(false);
          return new Promise<RTCSessionDescriptionInit>((resolve, _reject) => {
            resolve(undefined as RTCSessionDescriptionInit);
          });
        }
      }
      context.peer = new TestPeerConnectionMock() as unknown as RTCPeerConnection;
      task.run().then(() => done());
    });

    it('can be run without audio in peer connection', async () => {
      context.meetingSessionConfiguration.urls = null;
      class TestPeerConnectionMock extends RTCPeerConnection {
        // @ts-ignore - overriding with simplified signature for testing
        createOffer(options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit> {
          expect(options.offerToReceiveAudio).to.be.equal(false);
          expect(options.offerToReceiveVideo).to.be.equal(false);
          return new Promise<RTCSessionDescriptionInit>((resolve, _reject) => {
            resolve(undefined as RTCSessionDescriptionInit);
          });
        }
      }
      context.peer = new TestPeerConnectionMock() as unknown as RTCPeerConnection;
      await new CreateSDPTask(context).run();
      context.meetingSessionConfiguration.urls = null;
      await new CreateSDPTask(context).run();
      context.meetingSessionConfiguration = null;
      await new CreateSDPTask(context).run();
    });

    it('can be run and the created offer SDP is correct', done => {
      domMockBehavior.rtcPeerConnectionUseCustomOffer = true;
      domMockBehavior.rtcPeerConnectionCustomOffer = 'sdp-offer-audio';
      task.run().then(() => {
        expect(context.sdpOfferInit.sdp).to.be.equal('sdp-offer-audio');
        done();
      });
    });

    it('can throw error during failure to create offer', done => {
      class TestPeerConnectionMock extends RTCPeerConnection {
        // @ts-ignore - overriding with simplified signature for testing
        createOffer(options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit> {
          expect(options.offerToReceiveAudio).to.be.equal(true);
          expect(options.offerToReceiveVideo).to.be.equal(true);
          return new Promise<RTCSessionDescriptionInit>((_resolve, reject) => {
            reject();
          });
        }
      }
      context.peer = new TestPeerConnectionMock() as unknown as RTCPeerConnection;
      task.run().catch(() => done());
    });
  });

  describe('cancel', () => {
    it('cancels a task when the session is timed out', async () => {
      const clock = sinon.useFakeTimers();
      try {
        let called = false;

        domMockBehavior.asyncWaitMs = 500;

        // Schedule the cancel after 50ms
        setTimeout(() => {
          task.cancel();
        }, 50);

        const runPromise = task
          .run()
          .then(() => {
            throw new Error('This line should not be reached.');
          })
          .catch(() => {
            called = true;
          });

        // Advance time to trigger the cancel
        await clock.tickAsync(50);

        // Advance time to complete the async operation
        await clock.tickAsync(domMockBehavior.asyncWaitMs + 50);

        await runPromise;
        expect(called).to.be.true;
      } finally {
        clock.restore();
      }
    });
  });
});
