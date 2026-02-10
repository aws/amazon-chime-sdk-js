// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import { AllHighestVideoBandwidthPolicy } from '../../src';
import ApplicationMetadata from '../../src/applicationmetadata/ApplicationMetadata';
import AudioProfile from '../../src/audioprofile/AudioProfile';
import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import DefaultBrowserBehavior from '../../src/browserbehavior/DefaultBrowserBehavior';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import MeetingSessionConfiguration from '../../src/meetingsession/MeetingSessionConfiguration';
import MeetingSessionStatus from '../../src/meetingsession/MeetingSessionStatus';
import MeetingSessionStatusCode from '../../src/meetingsession/MeetingSessionStatusCode';
import MeetingSessionURLs from '../../src/meetingsession/MeetingSessionURLs';
import DefaultSignalingClient from '../../src/signalingclient/DefaultSignalingClient';
import ServerSideNetworkAdaption from '../../src/signalingclient/ServerSideNetworkAdaption';
import SignalingClientConnectionRequest from '../../src/signalingclient/SignalingClientConnectionRequest';
import {
  SdkIndexFrame,
  SdkJoinAckFrame,
  SdkServerSideNetworkAdaption,
  SdkSignalFrame,
  SdkTurnCredentials,
} from '../../src/signalingprotocol/SignalingProtocol.js';
import JoinAndReceiveIndexTask from '../../src/task/JoinAndReceiveIndexTask';
import DefaultWebSocketAdapter from '../../src/websocketadapter/DefaultWebSocketAdapter';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';
import { createFakeTimers, tick } from '../utils/fakeTimerHelper';

describe('JoinAndReceiveIndexTask', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const behavior = new DOMMockBehavior();
  const logger = new NoOpDebugLogger();
  const defaultVideoSubscriptionLimit = 25;
  let task: JoinAndReceiveIndexTask;
  let webSocketAdapter: DefaultWebSocketAdapter;
  let signalingClient: DefaultSignalingClient;
  let context: AudioVideoControllerState;
  let request: SignalingClientConnectionRequest;
  let domMockBuilder: DOMMockBuilder | null = null;
  let joinAckSignalBuffer: Uint8Array;
  let indexSignalBuffer: Uint8Array;
  let clock: sinon.SinonFakeTimers;

  beforeEach(async () => {
    clock = createFakeTimers();
    // use the default 10 ms async wait
    domMockBuilder = new DOMMockBuilder(behavior);
    webSocketAdapter = new DefaultWebSocketAdapter(logger);
    signalingClient = new DefaultSignalingClient(webSocketAdapter, logger);
    context = new AudioVideoControllerState();
    context.audioVideoController = new NoOpAudioVideoController();
    context.logger = logger;
    context.signalingClient = signalingClient;
    context.browserBehavior = new DefaultBrowserBehavior();
    context.audioProfile = new AudioProfile();
    context.meetingSessionConfiguration = new MeetingSessionConfiguration();
    context.meetingSessionConfiguration.urls = new MeetingSessionURLs();
    context.videoDownlinkBandwidthPolicy = new AllHighestVideoBandwidthPolicy('self');
    task = new JoinAndReceiveIndexTask(context);

    request = new SignalingClientConnectionRequest(`ws://localhost:9999/control`, 'test-auth');

    const joinAckFrame = SdkJoinAckFrame.create();
    joinAckFrame.turnCredentials = SdkTurnCredentials.create();
    joinAckFrame.turnCredentials.username = 'fake-username';
    joinAckFrame.turnCredentials.password = 'fake-password';
    joinAckFrame.turnCredentials.ttl = 300;
    joinAckFrame.turnCredentials.uris = ['fake-turn', 'fake-turns'];
    joinAckFrame.videoSubscriptionLimit = 10;

    const joinAckSignal = SdkSignalFrame.create();
    joinAckSignal.type = SdkSignalFrame.Type.JOIN_ACK;
    joinAckSignal.joinack = joinAckFrame;

    const joinAckBuffer = SdkSignalFrame.encode(joinAckSignal).finish();
    joinAckSignalBuffer = new Uint8Array(joinAckBuffer.length + 1);
    joinAckSignalBuffer[0] = 0x5;
    joinAckSignalBuffer.set(joinAckBuffer, 1);

    const indexFrame = SdkIndexFrame.create();
    const indexSignal = SdkSignalFrame.create();
    indexSignal.type = SdkSignalFrame.Type.INDEX;
    indexSignal.index = indexFrame;

    const indexBuffer = SdkSignalFrame.encode(indexSignal).finish();
    indexSignalBuffer = new Uint8Array(indexBuffer.length + 1);
    indexSignalBuffer[0] = 0x5;
    indexSignalBuffer.set(indexBuffer, 1);
    signalingClient.openConnection(request);
  });

  afterEach(() => {
    clock.restore();
    signalingClient.closeConnection();
    if (domMockBuilder) {
      domMockBuilder.cleanup();
      domMockBuilder = null;
    }
  });

  describe('run', () => {
    it('can process a websocket close indicating the meeting has ended', async () => {
      // @ts-ignore
      let receivedStatus = false;
      context.audioVideoController.handleMeetingSessionStatus = (
        status: MeetingSessionStatus,
        _error: Error
      ): boolean => {
        expect(status.statusCode()).to.equal(MeetingSessionStatusCode.MeetingEnded);
        receivedStatus = true;
        return true;
      };
      await tick(clock, behavior.asyncWaitMs + 10);
      expect(signalingClient.ready()).to.equal(true);
      // Schedule close and cancel using fake timers
      setTimeout(() => {
        webSocketAdapter.close(4410, 'meeting unavailable');
      }, 100);
      setTimeout(() => {
        // Simulate task cancellation due to close message being received
        task.cancel();
      }, 200);
      const taskPromise = task.run();
      await tick(clock, 250);
      try {
        await taskPromise;
        expect(false).to.equal(true);
      } catch {
        expect(context.indexFrame).to.equal(null);
        expect(context.turnCredentials).to.equal(null);
        expect(context.videoSubscriptionLimit).to.equal(defaultVideoSubscriptionLimit);
        expect(receivedStatus).to.equal(true);
      }
    });

    it('can process a websocket close indicating there was an internal server error', async () => {
      // @ts-ignore
      let receivedStatus = false;
      context.audioVideoController.handleMeetingSessionStatus = (
        status: MeetingSessionStatus,
        _error: Error
      ): boolean => {
        expect(status.statusCode()).to.equal(MeetingSessionStatusCode.SignalingInternalServerError);
        receivedStatus = true;
        return true;
      };
      await tick(clock, behavior.asyncWaitMs + 10);
      expect(signalingClient.ready()).to.equal(true);
      setTimeout(() => {
        webSocketAdapter.close(4500, 'service unavailable');
      }, 100);
      setTimeout(() => {
        // Simulate task cancellation due to close message being received
        task.cancel();
      }, 200);
      const taskPromise = task.run();
      await tick(clock, 250);
      try {
        await taskPromise;
        expect(false).to.equal(true);
      } catch {
        expect(context.indexFrame).to.equal(null);
        expect(context.turnCredentials).to.equal(null);
        expect(context.videoSubscriptionLimit).to.equal(defaultVideoSubscriptionLimit);
        expect(receivedStatus).to.equal(true);
      }
    });

    it('can process a websocket close indicating there was a generic bad request', async () => {
      // @ts-ignore
      let receivedStatus = false;
      context.audioVideoController.handleMeetingSessionStatus = (
        status: MeetingSessionStatus,
        _error: Error
      ): boolean => {
        expect(status.statusCode()).to.equal(MeetingSessionStatusCode.SignalingBadRequest);
        receivedStatus = true;
        return true;
      };
      await tick(clock, behavior.asyncWaitMs + 10);
      expect(signalingClient.ready()).to.equal(true);
      setTimeout(() => {
        webSocketAdapter.close(4400, 'bad request');
      }, 100);
      setTimeout(() => {
        // Simulate task cancellation due to close message being received
        task.cancel();
      }, 200);
      const taskPromise = task.run();
      await tick(clock, 250);
      try {
        await taskPromise;
        expect(false).to.equal(true);
      } catch {
        expect(context.indexFrame).to.equal(null);
        expect(context.turnCredentials).to.equal(null);
        expect(context.videoSubscriptionLimit).to.equal(defaultVideoSubscriptionLimit);
        expect(receivedStatus).to.equal(true);
      }
    });

    it('can run and receive join ack and index frame', async () => {
      await tick(clock, behavior.asyncWaitMs + 10);
      expect(signalingClient.ready()).to.equal(true);
      setTimeout(() => {
        webSocketAdapter.send(joinAckSignalBuffer);
      }, 100);
      setTimeout(() => {
        webSocketAdapter.send(indexSignalBuffer);
      }, 200);
      const taskPromise = task.run();
      await tick(clock, 250);
      await taskPromise;
      expect(context.indexFrame).to.not.equal(null);
      expect(context.turnCredentials.username).to.equal('fake-username');
      expect(context.turnCredentials.password).to.equal('fake-password');
      expect(context.turnCredentials.ttl).to.equal(300);
      expect(context.turnCredentials.uris).to.deep.equal(['fake-turn', 'fake-turns']);
      expect(context.videoSubscriptionLimit).to.equal(10);
    });

    it('can handle a joinack signal without a join ack frame', async () => {
      const joinAckSignal = SdkSignalFrame.create();
      joinAckSignal.type = SdkSignalFrame.Type.JOIN_ACK;

      const joinAckBuffer = SdkSignalFrame.encode(joinAckSignal).finish();
      joinAckSignalBuffer = new Uint8Array(joinAckBuffer.length + 1);
      joinAckSignalBuffer[0] = 0x5;
      joinAckSignalBuffer.set(joinAckBuffer, 1);

      await tick(clock, behavior.asyncWaitMs + 10);
      expect(signalingClient.ready()).to.equal(true);
      setTimeout(() => {
        webSocketAdapter.send(joinAckSignalBuffer);
      }, 100);
      setTimeout(() => {
        webSocketAdapter.send(indexSignalBuffer);
      }, 200);
      const taskPromise = task.run();
      await tick(clock, 250);
      await taskPromise;
      expect(context.indexFrame).to.not.equal(null);
      expect(context.videoSubscriptionLimit).to.equal(defaultVideoSubscriptionLimit);
    });

    it('should set video subscription limit to default value when join ack frame has empty video subscription limit', async () => {
      const joinAckFrame = SdkJoinAckFrame.create();
      joinAckFrame.videoSubscriptionLimit = 0;

      const joinAckSignal = SdkSignalFrame.create();
      joinAckSignal.type = SdkSignalFrame.Type.JOIN_ACK;
      joinAckSignal.joinack = joinAckFrame;

      const joinAckBuffer = SdkSignalFrame.encode(joinAckSignal).finish();
      joinAckSignalBuffer = new Uint8Array(joinAckBuffer.length + 1);
      joinAckSignalBuffer[0] = 0x5;
      joinAckSignalBuffer.set(joinAckBuffer, 1);

      await tick(clock, behavior.asyncWaitMs + 10);
      expect(signalingClient.ready()).to.equal(true);
      setTimeout(() => {
        webSocketAdapter.send(joinAckSignalBuffer);
      }, 100);
      setTimeout(() => {
        webSocketAdapter.send(indexSignalBuffer);
      }, 200);
      const taskPromise = task.run();
      await tick(clock, 250);
      await taskPromise;
      expect(context.indexFrame).to.not.equal(null);
      expect(context.videoSubscriptionLimit).to.equal(defaultVideoSubscriptionLimit);
    });

    it('should set the server-supports-compression value in the application context when server requests for compressed sdp', async () => {
      const joinAckFrame = SdkJoinAckFrame.create();
      joinAckFrame.wantsCompressedSdp = true;

      const joinAckSignal = SdkSignalFrame.create();
      joinAckSignal.type = SdkSignalFrame.Type.JOIN_ACK;
      joinAckSignal.joinack = joinAckFrame;

      const joinAckBuffer = SdkSignalFrame.encode(joinAckSignal).finish();
      joinAckSignalBuffer = new Uint8Array(joinAckBuffer.length + 1);
      joinAckSignalBuffer[0] = 0x5;
      joinAckSignalBuffer.set(joinAckBuffer, 1);

      await tick(clock, behavior.asyncWaitMs + 10);
      expect(signalingClient.ready()).to.equal(true);
      setTimeout(() => {
        webSocketAdapter.send(joinAckSignalBuffer);
      }, 100);
      setTimeout(() => {
        webSocketAdapter.send(indexSignalBuffer);
      }, 200);
      const taskPromise = task.run();
      await tick(clock, 250);
      await taskPromise;
      expect(context.indexFrame).to.not.equal(null);
      expect(context.serverSupportsCompression).to.equal(true);
    });

    it('can set the server side network adaption flag', async () => {
      context.videoDownlinkBandwidthPolicy.getServerSideNetworkAdaption = () => {
        return ServerSideNetworkAdaption.BandwidthProbing;
      };
      const signalingSpy = sinon.spy(context.signalingClient, 'join');
      await tick(clock, behavior.asyncWaitMs + 10);
      expect(signalingClient.ready()).to.equal(true);
      setTimeout(() => {
        webSocketAdapter.send(joinAckSignalBuffer);
      }, 100);
      setTimeout(() => {
        webSocketAdapter.send(indexSignalBuffer);
      }, 200);
      const taskPromise = task.run();
      await tick(clock, 250);
      await taskPromise;
      expect(signalingSpy.called).to.be.true;
    });

    it('can set the server side network adaption flag to None', async () => {
      context.videoDownlinkBandwidthPolicy.getServerSideNetworkAdaption = () => {
        return ServerSideNetworkAdaption.None;
      };
      const signalingSpy = sinon.spy(context.signalingClient, 'join');
      await tick(clock, behavior.asyncWaitMs + 10);
      expect(signalingClient.ready()).to.equal(true);
      setTimeout(() => {
        webSocketAdapter.send(joinAckSignalBuffer);
      }, 100);
      setTimeout(() => {
        webSocketAdapter.send(indexSignalBuffer);
      }, 200);
      const taskPromise = task.run();
      await tick(clock, 250);
      await taskPromise;
      expect(signalingSpy.called).to.be.true;
    });

    it('can have the server side network adaption overriden', async () => {
      context.videoDownlinkBandwidthPolicy.getServerSideNetworkAdaption = () => {
        return ServerSideNetworkAdaption.Default;
      };

      context.videoDownlinkBandwidthPolicy.supportedServerSideNetworkAdaptions = () => {
        return [ServerSideNetworkAdaption.BandwidthProbing];
      };

      context.videoDownlinkBandwidthPolicy.setServerSideNetworkAdaption = () => {};

      const joinAckFrame = SdkJoinAckFrame.create();
      joinAckFrame.turnCredentials = SdkTurnCredentials.create();
      joinAckFrame.turnCredentials.username = 'fake-username';
      joinAckFrame.turnCredentials.password = 'fake-password';
      joinAckFrame.turnCredentials.ttl = 300;
      joinAckFrame.turnCredentials.uris = ['fake-turn', 'fake-turns'];
      joinAckFrame.videoSubscriptionLimit = 10;
      joinAckFrame.defaultServerSideNetworkAdaption =
        SdkServerSideNetworkAdaption.BANDWIDTH_PROBING;

      const joinAckSignal = SdkSignalFrame.create();
      joinAckSignal.type = SdkSignalFrame.Type.JOIN_ACK;
      joinAckSignal.joinack = joinAckFrame;

      const joinAckBuffer = SdkSignalFrame.encode(joinAckSignal).finish();
      const altJoinAckSignalBuffer = new Uint8Array(joinAckBuffer.length + 1);
      altJoinAckSignalBuffer[0] = 0x5;
      altJoinAckSignalBuffer.set(joinAckBuffer, 1);

      const signalingSpy = sinon.spy(context.signalingClient, 'join');
      await tick(clock, behavior.asyncWaitMs + 10);
      expect(signalingClient.ready()).to.equal(true);
      setTimeout(() => {
        webSocketAdapter.send(altJoinAckSignalBuffer);
      }, 100);
      setTimeout(() => {
        webSocketAdapter.send(indexSignalBuffer);
      }, 200);
      const taskPromise = task.run();
      await tick(clock, 250);
      await taskPromise;
      expect(signalingSpy.called).to.be.true;
    });

    it('can run and send join with application metadata if valid', async () => {
      await tick(clock, behavior.asyncWaitMs + 10);
      expect(signalingClient.ready()).to.equal(true);
      setTimeout(() => {
        webSocketAdapter.send(joinAckSignalBuffer);
      }, 100);
      setTimeout(() => {
        webSocketAdapter.send(indexSignalBuffer);
      }, 200);
      context.meetingSessionConfiguration.applicationMetadata = ApplicationMetadata.create(
        'AmazonChimeJSSDKDemoApp',
        '1.0.0'
      );
      const { appName, appVersion } = context.meetingSessionConfiguration.applicationMetadata;
      const taskPromise = task.run();
      await tick(clock, 250);
      await taskPromise;
      expect(appName).to.eq('AmazonChimeJSSDKDemoApp');
      expect(appVersion).to.eq('1.0.0');
      expect(context.indexFrame).to.not.equal(null);
      expect(context.previousSdpAnswerAsString).to.equal('');
      expect(context.previousSdpOffer).to.equal(null);
      expect(context.serverSupportsCompression).to.be.false;
      expect(context.turnCredentials.username).to.equal('fake-username');
      expect(context.turnCredentials.password).to.equal('fake-password');
      expect(context.turnCredentials.ttl).to.equal(300);
      expect(context.turnCredentials.uris).to.deep.equal(['fake-turn', 'fake-turns']);
    });

    it('can run and send join with flag to disable periodic keyframe requests', async () => {
      context.meetingSessionConfiguration.disablePeriodicKeyframeRequestOnContentSender = true;

      const signalingSpy = sinon.spy(context.signalingClient, 'join');
      await tick(clock, behavior.asyncWaitMs + 10);
      expect(signalingClient.ready()).to.equal(true);
      setTimeout(() => {
        webSocketAdapter.send(joinAckSignalBuffer);
      }, 100);
      setTimeout(() => {
        webSocketAdapter.send(indexSignalBuffer);
      }, 200);
      const taskPromise = task.run();
      await tick(clock, 250);
      await taskPromise;
      expect(signalingSpy.getCall(0).args[0].disablePeriodicKeyframeRequestOnContentSender).to.be
        .true;
    });

    it('can run and only handle SdkIndexFrame', async () => {
      await tick(clock, behavior.asyncWaitMs + 10);
      expect(signalingClient.ready()).to.equal(true);
      setTimeout(() => {
        signalingClient.leave();
      }, 100);
      setTimeout(() => {
        webSocketAdapter.send(joinAckSignalBuffer);
      }, 200);
      setTimeout(() => {
        expect(context.indexFrame).to.equal(null);
        webSocketAdapter.send(indexSignalBuffer);
      }, 300);
      const taskPromise = task.run();
      await tick(clock, 350);
      await taskPromise;
      expect(context.indexFrame).to.not.equal(null);
    });

    it('uses urlRewriterMulti to expand TURN URIs when set', async () => {
      context.meetingSessionConfiguration.urls.urlRewriterMulti = (url: string | null) => {
        if (!url) return null;
        return [`${url}-expanded-1`, `${url}-expanded-2`];
      };

      await tick(clock, behavior.asyncWaitMs + 10);
      expect(signalingClient.ready()).to.equal(true);
      setTimeout(() => {
        webSocketAdapter.send(joinAckSignalBuffer);
      }, 100);
      setTimeout(() => {
        webSocketAdapter.send(indexSignalBuffer);
      }, 200);
      const taskPromise = task.run();
      await tick(clock, 250);
      await taskPromise;
      expect(context.turnCredentials.uris).to.deep.equal([
        'fake-turn-expanded-1',
        'fake-turn-expanded-2',
        'fake-turns-expanded-1',
        'fake-turns-expanded-2',
      ]);
    });

    it('uses urlRewriterMulti to filter out TURN URIs by returning null', async () => {
      context.meetingSessionConfiguration.urls.urlRewriterMulti = (url: string | null) => {
        if (!url || url.includes('turns')) return null;
        return [url];
      };

      await tick(clock, behavior.asyncWaitMs + 10);
      expect(signalingClient.ready()).to.equal(true);
      setTimeout(() => {
        webSocketAdapter.send(joinAckSignalBuffer);
      }, 100);
      setTimeout(() => {
        webSocketAdapter.send(indexSignalBuffer);
      }, 200);
      const taskPromise = task.run();
      await tick(clock, 250);
      await taskPromise;
      expect(context.turnCredentials.uris).to.deep.equal(['fake-turn']);
    });

    it('falls back to urlRewriter when urlRewriterMulti is not set', async () => {
      context.meetingSessionConfiguration.urls.urlRewriter = (url: string | null) => {
        if (!url) return null;
        return `${url}-rewritten`;
      };

      await tick(clock, behavior.asyncWaitMs + 10);
      expect(signalingClient.ready()).to.equal(true);
      setTimeout(() => {
        webSocketAdapter.send(joinAckSignalBuffer);
      }, 100);
      setTimeout(() => {
        webSocketAdapter.send(indexSignalBuffer);
      }, 200);
      const taskPromise = task.run();
      await tick(clock, 250);
      await taskPromise;
      expect(context.turnCredentials.uris).to.deep.equal([
        'fake-turn-rewritten',
        'fake-turns-rewritten',
      ]);
    });

    it('filters out TURN URIs when urlRewriter returns null', async () => {
      context.meetingSessionConfiguration.urls.urlRewriter = (url: string | null) => {
        if (!url || url.includes('turns')) return null;
        return url;
      };

      await tick(clock, behavior.asyncWaitMs + 10);
      expect(signalingClient.ready()).to.equal(true);
      setTimeout(() => {
        webSocketAdapter.send(joinAckSignalBuffer);
      }, 100);
      setTimeout(() => {
        webSocketAdapter.send(indexSignalBuffer);
      }, 200);
      const taskPromise = task.run();
      await tick(clock, 250);
      await taskPromise;
      expect(context.turnCredentials.uris).to.deep.equal(['fake-turn']);
    });
  });

  describe('cancel', () => {
    it('should cancel the task and throw the reject', async () => {
      await tick(clock, behavior.asyncWaitMs + 10);
      expect(signalingClient.ready()).to.equal(true);
      setTimeout(() => {
        task.cancel();
      }, 100);
      const taskPromise = task.run();
      await tick(clock, 150);
      try {
        await taskPromise;
      } catch (err) {
        expect(err.toString()).to.equal(
          `Error: JoinAndReceiveIndexTask got canceled while waiting for SdkIndexFrame`
        );
      }
    });

    it('should immediately throw the reject if task was canceled before running', async () => {
      await tick(clock, behavior.asyncWaitMs + 10);
      expect(signalingClient.ready()).to.equal(true);

      task.cancel();
      task.cancel();
      try {
        await task.run();
      } catch (err) {
        expect(err.toString()).to.equal(`Error: ${task.name()} was canceled before running`);
      }
    });
  });
});
