// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import DefaultBrowserBehavior from '../../src/browserbehavior/DefaultBrowserBehavior';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import MeetingSessionTURNCredentials from '../../src/meetingsession/MeetingSessionTURNCredentials';
import DefaultStatsCollector from '../../src/statscollector/DefaultStatsCollector';
import AttachMediaInputTask from '../../src/task/AttachMediaInputTask';
import Task from '../../src/task/Task';
import DefaultTransceiverController from '../../src/transceivercontroller/DefaultTransceiverController';
import DefaultVideoStreamIdSet from '../../src/videostreamidset/DefaultVideoStreamIdSet';
import DefaultVideoStreamIndex from '../../src/videostreamindex/DefaultVideoStreamIndex';
import DefaultSimulcastUplinkPolicy from '../../src/videouplinkbandwidthpolicy/DefaultSimulcastUplinkPolicy';
import NScaleVideoUplinkBandwidthPolicy from '../../src/videouplinkbandwidthpolicy/NScaleVideoUplinkBandwidthPolicy';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('AttachMediaInputTask', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const assert: Chai.AssertStatic = chai.assert;
  const logger = new NoOpDebugLogger();
  const domMockBehavior: DOMMockBehavior = new DOMMockBehavior();
  let context: AudioVideoControllerState;
  let domMockBuilder: DOMMockBuilder | null = null;
  let task: Task;

  beforeEach(() => {
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    context = new AudioVideoControllerState();
    context.audioVideoController = new NoOpAudioVideoController();
    context.logger = logger;
    context.turnCredentials = new MeetingSessionTURNCredentials();
    context.turnCredentials.username = 'fakeUsername';
    context.turnCredentials.password = 'fakeTURNCredentials';
    context.turnCredentials.ttl = Infinity;
    context.turnCredentials.uris = ['fakeUDPURI', 'fakeTCPURI'];
    const configuration: RTCConfiguration = {
      iceServers: [
        {
          urls: context.turnCredentials.uris,
          username: context.turnCredentials.username,
          credential: context.turnCredentials.password,
          credentialType: 'password',
        },
      ],
      iceTransportPolicy: 'relay',
    };
    context.peer = new RTCPeerConnection(configuration);
    context.browserBehavior = new DefaultBrowserBehavior();
    context.transceiverController = new DefaultTransceiverController(
      logger,
      context.browserBehavior
    );
    // @ts-ignore
    const audioTrack = new MediaStreamTrack('attach-media-input-task-audio-track-id', 'audio');
    // @ts-ignore
    const videoTrack = new MediaStreamTrack('attach-media-input-task-video-track-id', 'video');
    context.activeAudioInput = new MediaStream();
    context.activeAudioInput.addTrack(audioTrack);
    context.activeVideoInput = new MediaStream();
    context.activeVideoInput.addTrack(videoTrack);
    context.videoStreamIndex = new DefaultVideoStreamIndex(logger);
    context.videosToReceive = new DefaultVideoStreamIdSet();
    context.videoSubscriptions = [];
    context.statsCollector = new DefaultStatsCollector(
      context.audioVideoController,
      logger,
      context.browserBehavior
    );
    context.videoUplinkBandwidthPolicy = new NScaleVideoUplinkBandwidthPolicy('self-attendees');
    task = new AttachMediaInputTask(context);
  });

  afterEach(() => {
    domMockBuilder.cleanup();
  });

  describe('construction', () => {
    it('can be constructed', () => {
      assert.exists(task);
    });
  });

  describe('run', () => {
    it('can be run', done => {
      task.run().then(() => done());
    });

    it('attaches audio track', done => {
      task.run().then(() => {
        const transceivers = context.peer.getTransceivers();
        expect(transceivers.length).to.equal(2);
        const audioTransceiver: RTCRtpTransceiver = context.transceiverController.localAudioTransceiver();
        expect(audioTransceiver.direction).to.equal('sendrecv');
        expect(audioTransceiver.sender.track).to.equal(context.activeAudioInput.getTracks()[0]);
        done();
      });
    });

    it('attaches null audio track', done => {
      context.activeAudioInput = new MediaStream();
      task.run().then(() => {
        const transceivers = context.peer.getTransceivers();
        expect(transceivers.length).to.equal(2);
        const audioTransceiver: RTCRtpTransceiver = context.transceiverController.localAudioTransceiver();
        expect(audioTransceiver.direction).to.equal('inactive');
        expect(audioTransceiver.sender.track).to.equal(null);
        done();
      });
    });

    it('attaches video track', done => {
      task.run().then(() => {
        const transceivers = context.peer.getTransceivers();
        expect(transceivers.length).to.equal(2);
        const videoTransceiver: RTCRtpTransceiver = context.transceiverController.localVideoTransceiver();
        expect(videoTransceiver.direction).to.equal('sendrecv');
        expect(videoTransceiver.sender.track).to.equal(context.activeVideoInput.getTracks()[0]);
        done();
      });
    });

    it('attaches null video track ', done => {
      context.activeVideoInput = new MediaStream();
      task.run().then(() => {
        const transceivers = context.peer.getTransceivers();
        expect(transceivers.length).to.equal(2);
        const videoTransceiver: RTCRtpTransceiver = context.transceiverController.localVideoTransceiver();
        expect(videoTransceiver.direction).to.equal('inactive');
        expect(videoTransceiver.sender.track).to.equal(null);
        done();
      });
    });

    it('can remove audio input if audio input is null', done => {
      context.activeAudioInput = null;
      task.run().then(() => {
        const transceivers = context.peer.getTransceivers();
        expect(transceivers.length).to.equal(2);
        const audioTransceiver: RTCRtpTransceiver = context.transceiverController.localAudioTransceiver();
        expect(audioTransceiver.direction).to.equal('inactive');
        expect(audioTransceiver.sender.track).to.equal(null);
        done();
      });
    });

    it('can remove video input if video input is null ', done => {
      context.activeVideoInput = null;
      task.run().then(() => {
        const transceivers = context.peer.getTransceivers();
        expect(transceivers.length).to.equal(2);
        const videoTransceiver: RTCRtpTransceiver = context.transceiverController.localVideoTransceiver();
        expect(videoTransceiver.direction).to.equal('inactive');
        expect(videoTransceiver.sender.track).to.equal(null);
        done();
      });
    });

    it('removes a local video sender if video input is null', done => {
      context.localVideoSender = context.peer.addTrack(
        // @ts-ignore
        new MediaStreamTrack('id', 'video'),
        context.activeVideoInput
      );
      context.activeVideoInput = null;
      task.run().then(() => {
        expect(context.localVideoSender).to.equal(null);
        done();
      });
    });
  });

  describe('Simulcast', () => {
    it('could change transceiver encoding parameter', done => {
      context.enableSimulcast = true;
      context.videoUplinkBandwidthPolicy = new DefaultSimulcastUplinkPolicy(
        'self-attendee',
        logger
      );
      // @ts-ignore
      navigator.userAgent = 'Chrome/77.0.3865.75';
      context.browserBehavior = new DefaultBrowserBehavior({
        enableUnifiedPlanForChromiumBasedBrowsers: true,
      });
      const spy = sinon.spy(context.transceiverController, 'setEncodingParameters');
      task.run().then(() => {
        expect(spy.calledOnce).to.equal(true);
        done();
      });
    });
  });

  describe('Plan B', () => {
    beforeEach(() => {
      // @ts-ignore
      navigator.userAgent = 'Chrome/77.0.3865.75';
      context.browserBehavior = new DefaultBrowserBehavior();
      context.transceiverController = new DefaultTransceiverController(
        logger,
        context.browserBehavior
      );
      context.statsCollector = new DefaultStatsCollector(
        context.audioVideoController,
        logger,
        context.browserBehavior
      );
    });

    it("adds an audio track if the audio input's track ID does not have any matching sender", done => {
      // @ts-ignore
      const audioTrack = new MediaStreamTrack('audio-track-id', 'audio');
      context.activeAudioInput = new MediaStream();
      context.activeAudioInput.addTrack(audioTrack);
      const spy = sinon.spy(context.peer, 'addTrack');
      task.run().then(() => {
        expect(spy.calledWith(audioTrack, context.activeAudioInput)).to.be.true;
        done();
      });
    });

    it("does not add an audio track if the audio input's track ID has a matching sender", done => {
      const id = 'audio-track-id';

      // @ts-ignore
      context.peer.addTrack(new MediaStreamTrack(id, 'audio'), new MediaStream());

      // @ts-ignore
      const audioTrack = new MediaStreamTrack(id, 'audio');
      context.activeAudioInput = new MediaStream();
      context.activeAudioInput.addTrack(audioTrack);
      const spy = sinon.spy(context.peer, 'addTrack');
      task.run().then(() => {
        expect(spy.calledWith(audioTrack, context.activeAudioInput)).to.be.false;
        done();
      });
    });

    it("removes a local video sender and adds a new video track if the video input's track ID does not have any matching sender", done => {
      // @ts-ignore
      const videoTrack = new MediaStreamTrack('attach-media-input-task-video-track-id', 'video');
      context.activeVideoInput = new MediaStream();
      context.activeVideoInput.addTrack(videoTrack);
      context.localVideoSender = context.peer.addTrack(
        // @ts-ignore
        new MediaStreamTrack('id', 'video'),
        context.activeVideoInput
      );
      const spy = sinon.spy(context.peer, 'addTrack');
      task.run().then(() => {
        expect(spy.calledWith(videoTrack, context.activeVideoInput)).to.be.true;
        done();
      });
    });

    it("does not remove a local video sender and add a new video track if the video input's track ID has a matching sender", done => {
      const id = 'video-track-id';

      // @ts-ignore
      context.peer.addTrack(new MediaStreamTrack(id, 'video'), new MediaStream());

      // @ts-ignore
      const videoTrack = new MediaStreamTrack(id, 'video');
      context.activeVideoInput = new MediaStream();
      context.activeVideoInput.addTrack(videoTrack);
      const spy = sinon.spy(context.peer, 'addTrack');
      task.run().then(() => {
        expect(spy.calledWith(videoTrack, context.activeVideoInput)).to.be.false;
        done();
      });
    });
  });
});
