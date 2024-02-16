// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';

import { AudioProfile } from '../../src';
import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import DefaultBrowserBehavior from '../../src/browserbehavior/DefaultBrowserBehavior';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import MeetingSessionTURNCredentials from '../../src/meetingsession/MeetingSessionTURNCredentials';
import StatsCollector from '../../src/statscollector/StatsCollector';
import AttachMediaInputTask from '../../src/task/AttachMediaInputTask';
import Task from '../../src/task/Task';
import DefaultTransceiverController from '../../src/transceivercontroller/DefaultTransceiverController';
import DefaultVideoStreamIdSet from '../../src/videostreamidset/DefaultVideoStreamIdSet';
import DefaultVideoStreamIndex from '../../src/videostreamindex/DefaultVideoStreamIndex';
import DefaultSimulcastUplinkPolicy from '../../src/videouplinkbandwidthpolicy/DefaultSimulcastUplinkPolicy';
import NScaleVideoUplinkBandwidthPolicy from '../../src/videouplinkbandwidthpolicy/NScaleVideoUplinkBandwidthPolicy';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

chai.use(chaiAsPromised);

describe('AttachMediaInputTask', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const assert: Chai.AssertStatic = chai.assert;

  const logger = new NoOpDebugLogger();
  let domMockBehavior: DOMMockBehavior = new DOMMockBehavior();
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
    context.audioProfile = new AudioProfile();
    context.transceiverController = new DefaultTransceiverController(
      logger,
      context.browserBehavior,
      context
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
    context.statsCollector = new StatsCollector(context.audioVideoController, logger);
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

    it('throws if setupLocalTransceivers throws', async () => {
      class TestTransceiverController extends DefaultTransceiverController {
        setupLocalTransceivers(): void {
          throw new Error('bogus setupLocalTransceivers error');
        }
      }
      context.transceiverController = new TestTransceiverController(
        logger,
        context.browserBehavior,
        context
      );
      task = new AttachMediaInputTask(context);
      await expect(task.run()).to.be.rejectedWith('bogus setupLocalTransceivers error');
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
      context.activeAudioInput = undefined;
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
      context.activeVideoInput = undefined;
      task.run().then(() => {
        const transceivers = context.peer.getTransceivers();
        expect(transceivers.length).to.equal(2);
        const videoTransceiver: RTCRtpTransceiver = context.transceiverController.localVideoTransceiver();
        expect(videoTransceiver.direction).to.equal('inactive');
        expect(videoTransceiver.sender.track).to.equal(null);
        done();
      });
    });

    it('sets the correct audio codec preference if audio redundancy is disabled', done => {
      task.run().then(() => {
        const audioTransceiver: RTCRtpTransceiver = context.transceiverController.localAudioTransceiver();
        // @ts-ignore
        const audioTransceiverCodecs: RTCRtpCodecCapability[] = audioTransceiver['codecs'];
        expect(audioTransceiverCodecs[0].mimeType).to.equal('audio/opus');
        const redCodecIndex = audioTransceiverCodecs.findIndex(c => c.mimeType === 'audio/red');
        expect(redCodecIndex).to.equal(-1);
        done();
      });
    });

    it('sets the correct audio codec preference if audio redundancy is enabled', done => {
      domMockBehavior = new DOMMockBehavior();
      domMockBehavior.browserName = 'chrome116';
      domMockBehavior.supportsAudioRedCodec = true;
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      context.audioProfile = new AudioProfile();
      task.run().then(() => {
        const audioTransceiver: RTCRtpTransceiver = context.transceiverController.localAudioTransceiver();
        // @ts-ignore
        const audioTransceiverCodecs: RTCRtpCodecCapability[] = audioTransceiver['codecs'];
        expect(audioTransceiverCodecs[0].mimeType).to.equal('audio/red');
        done();
      });
    });

    it('does not call setCodecPreferences if red codec is not supported even if audio redundancy config is enabled', done => {
      domMockBehavior = new DOMMockBehavior();
      domMockBehavior.browserName = 'chrome';
      domMockBehavior.supportsAudioRedCodec = false;
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      context.audioProfile = new AudioProfile();
      task.run().then(() => {
        const audioTransceiver: RTCRtpTransceiver = context.transceiverController.localAudioTransceiver();
        // @ts-ignore
        const audioTransceiverCodecs: RTCRtpCodecCapability[] = audioTransceiver['codecs'];
        expect(audioTransceiverCodecs.length).to.equal(0);
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
      context.browserBehavior = new DefaultBrowserBehavior();
      const spy = sinon.spy(context.transceiverController, 'setEncodingParameters');
      task.run().then(() => {
        expect(spy.calledOnce).to.equal(true);
        done();
      });
    });
  });
});
