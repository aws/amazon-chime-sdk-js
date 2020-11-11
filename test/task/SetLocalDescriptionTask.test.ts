// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import SetLocalDescriptionTask from '../../src/task/SetLocalDescriptionTask';
import Task from '../../src/task/Task';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('SetLocalDescriptionTask', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  let context: AudioVideoControllerState;
  let domMockBuilder: DOMMockBuilder;
  let domMockBehavior: DOMMockBehavior;
  let task: Task;
  const sdpOffer: RTCSessionDescriptionInit = { type: 'offer', sdp: 'sdp-offer' };

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    context = new AudioVideoControllerState();
    context.audioVideoController = new NoOpAudioVideoController();
    context.logger = context.audioVideoController.logger;
    const peer: RTCPeerConnection = new RTCPeerConnection();
    context.peer = peer;
    context.sdpOfferInit = sdpOffer;
    task = new SetLocalDescriptionTask(context);
  });

  afterEach(() => {
    domMockBuilder.cleanup();
  });

  describe('contruction', () => {
    it('can be constructed', () => {
      expect(task).to.not.equal(null);
    });
  });

  describe('run', () => {
    it('can be run and succeed', done => {
      task.run().then(() => {
        const peerLocalSDP = context.peer.localDescription.sdp;
        expect(peerLocalSDP).to.be.equal(sdpOffer.sdp);
        done();
      });
    });

    it('can be run and received parameters are correct', done => {
      class TestPeerConnectionMock extends RTCPeerConnection {
        setLocalDescription(description: RTCSessionDescriptionInit): Promise<void> {
          expect(description.sdp).to.be.equal(sdpOffer.sdp);
          return new Promise<void>((resolve, _reject) => {
            resolve();
          });
        }
      }
      const peer: RTCPeerConnection = new TestPeerConnectionMock();
      context.peer = peer;
      task.run().then(() => done());
    });

    it('can throw error during failure to set local description', done => {
      class TestPeerConnectionMock extends RTCPeerConnection {
        setLocalDescription(description: RTCSessionDescriptionInit): Promise<void> {
          expect(description.sdp).to.be.equal(sdpOffer.sdp);
          return new Promise<void>((_resolve, reject) => {
            reject();
          });
        }
      }
      const peer: RTCPeerConnection = new TestPeerConnectionMock();
      context.peer = peer;
      task.run().catch(() => done());
    });

    it('handles when the setLocalDescription call fails', done => {
      domMockBehavior.setLocalDescriptionSucceeds = false;
      task
        .run()
        .then(() => {
          done(new Error('This line should not be reached.'));
        })
        .catch(() => {
          done();
        });
    });
  });

  describe('cancel', () => {
    it('cancels a task when the session is timed out', done => {
      let called = false;

      domMockBehavior.asyncWaitMs = 500;
      new TimeoutScheduler(50).start(() => {
        task.cancel();
      });

      task
        .run()
        .then(() => {
          done(new Error('This line should not be reached.'));
        })
        .catch(() => {
          called = true;
        });

      new TimeoutScheduler(domMockBehavior.asyncWaitMs + 50).start(() => {
        expect(called).to.be.true;
        done();
      });
    });
  });
});
