// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import {
  ServerSideNetworkAdaption,
  SignalingClientVideoSubscriptionConfiguration,
} from '../../src';
import ApplicationMetadata from '../../src/applicationmetadata/ApplicationMetadata';
import LogLevel from '../../src/logger/LogLevel';
import NoOpLogger from '../../src/logger/NoOpLogger';
import MeetingSessionCredentials from '../../src/meetingsession/MeetingSessionCredentials';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import DefaultSignalingClient from '../../src/signalingclient/DefaultSignalingClient';
import {
  convertServerSideNetworkAdaptionEnumFromSignaled,
  convertServerSideNetworkAdaptionEnumToSignaled,
} from '../../src/signalingclient/ServerSideNetworkAdaption';
import SignalingClient from '../../src/signalingclient/SignalingClient';
import SignalingClientConnectionRequest from '../../src/signalingclient/SignalingClientConnectionRequest';
import SignalingClientEvent from '../../src/signalingclient/SignalingClientEvent';
import SignalingClientEventType from '../../src/signalingclient/SignalingClientEventType';
import SignalingClientJoin from '../../src/signalingclient/SignalingClientJoin';
import SignalingClientSubscribe from '../../src/signalingclient/SignalingClientSubscribe';
import SignalingClientObserver from '../../src/signalingclientobserver/SignalingClientObserver';
import {
  SdkClientMetricFrame,
  SdkDataMessageFrame,
  SdkDataMessagePayload,
  SdkJoinFlags,
  SdkPingPongFrame,
  SdkPingPongType,
  SdkServerSideNetworkAdaption,
  SdkSignalFrame,
  SdkStreamMediaType,
  SdkStreamServiceType,
} from '../../src/signalingprotocol/SignalingProtocol.js';
import { wait } from '../../src/utils/Utils';
import VideoQualityAdaptationPreference from '../../src/videodownlinkbandwidthpolicy/VideoQualityAdaptationPreference';
import VideoStreamDescription from '../../src/videostreamindex/VideoStreamDescription';
import DefaultWebSocketAdapter from '../../src/websocketadapter/DefaultWebSocketAdapter';
import WebSocketAdapter from '../../src/websocketadapter/WebSocketAdapter';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

interface TestConfigs {
  adapterSendSucceeds: boolean;
  adapterDestroySucceeds: boolean;
}

class TestWebSocketAdapter extends DefaultWebSocketAdapter {
  constructor(private testConfigs: TestConfigs) {
    super(new NoOpLogger(LogLevel.DEBUG));
  }

  send(message: Uint8Array): boolean {
    if (this.testConfigs.adapterSendSucceeds) {
      return super.send(message);
    } else {
      return false;
    }
  }

  destroy(): void {
    if (this.testConfigs.adapterDestroySucceeds) {
      super.destroy();
    }
  }
}

class TestObjects {
  static testIndex: number = 0;
  signalingClient: SignalingClient;
  request: SignalingClientConnectionRequest;
  webSocketAdapter: WebSocketAdapter;
  constructor(
    testConfigs: TestConfigs = {
      adapterSendSucceeds: true,
      adapterDestroySucceeds: true,
    }
  ) {
    this.request = new SignalingClientConnectionRequest('ws://localhost:9999/control', 'test-auth');
    this.webSocketAdapter = new TestWebSocketAdapter(testConfigs);
    this.signalingClient = new DefaultSignalingClient(
      this.webSocketAdapter,
      new NoOpLogger(LogLevel.DEBUG)
    );
    TestObjects.testIndex += 1;
  }
}

describe('DefaultSignalingClient', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const activeTestObjects: TestObjects[] = [];
  const _messageType = 5;
  const _streamId = 1;
  const _groupId = 1;
  const _attendeeId = 'some-attendee-id';
  const _sdpOffer = 'some-sdp-offer';
  const _compressedSdpOffer = new Uint8Array([10, 20, 30, 40, 50]);
  const _audioHost = 'some-audio-host';
  let domMockBuilder: DOMMockBuilder | null = null;

  const createTestObjects = function (testConfigs?: TestConfigs): TestObjects {
    const testObjects: TestObjects = new TestObjects(testConfigs);
    activeTestObjects.push(testObjects);
    return testObjects;
  };

  beforeEach(() => {
    domMockBuilder = new DOMMockBuilder();
  });

  afterEach(() => {
    if (domMockBuilder) {
      domMockBuilder.cleanup();
      domMockBuilder = null;
    }
  });

  describe('construction', () => {
    it('can be constructed', () => {
      const testObjects = createTestObjects();
      expect(testObjects.signalingClient).to.not.equal(null);
    });
  });

  describe('registerObserver', () => {
    it('will register an observer', done => {
      const testObjects = createTestObjects();
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketOpen) {
            done();
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
    });

    it('will send observers notification in insertion order', done => {
      const testObjects = createTestObjects();
      const received: SignalingClientEventType[] = [];
      const checkConditionAndResolve = (): void => {
        if (received.length === 2) {
          if (JSON.stringify(received) === JSON.stringify([1, 2])) {
            done();
          }
        }
      };
      class TestObserver1 implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketConnecting) {
            received.push(1);
            checkConditionAndResolve();
          }
        }
      }
      class TestObserver2 implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketConnecting) {
            received.push(2);
            checkConditionAndResolve();
          }
        }
      }
      const observer1 = new TestObserver1();
      const observer2 = new TestObserver2();
      testObjects.signalingClient.registerObserver(observer1);
      testObjects.signalingClient.registerObserver(observer2);
      testObjects.signalingClient.openConnection(testObjects.request);
    });
  });

  describe('removeObserver', () => {
    it('will remove an observer', done => {
      const testObjects = createTestObjects();
      class TestObserver1 implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketConnecting) {
            done(new Error('TestObserver1 should not be called.'));
          }
        }
      }
      class TestObserver2 implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketOpen) {
            done();
          }
        }
      }
      const observer1 = new TestObserver1();
      const observer2 = new TestObserver2();
      testObjects.signalingClient.registerObserver(observer1);
      testObjects.signalingClient.registerObserver(observer2);
      testObjects.signalingClient.removeObserver(observer1);
      testObjects.signalingClient.openConnection(testObjects.request);
    });
  });

  describe('openConnection', () => {
    it('will open a connection', done => {
      const testObjects = createTestObjects();
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketOpen) {
            done();
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
    });

    it('will close an existing connection before opening a new one', done => {
      const testObjects = createTestObjects();
      let connectionCount = 0;
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketOpen) {
            connectionCount += 1;
            if (connectionCount === 1) {
              event.client.openConnection(testObjects.request);
            }
          } else if (event.type === SignalingClientEventType.WebSocketClosed) {
            done();
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
    });
  });

  describe('pingPong', () => {
    it('will send ping', done => {
      const testObjects = createTestObjects();
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketOpen) {
            testObjects.webSocketAdapter.addEventListener('message', (event: MessageEvent) => {
              const buffer = new Uint8Array(event.data);
              const frame = SdkSignalFrame.decode(buffer.slice(1));
              expect(buffer[0]).to.equal(_messageType);
              expect(frame.type).to.equal(SdkSignalFrame.Type.PING_PONG);
              expect(frame.pingPong.type).to.equal(SdkPingPongType.PING);
              expect(frame.pingPong.pingId).to.equal(1 & 0xffffffff);
              done();
            });
            const ping = SdkPingPongFrame.create();
            ping.pingId = 1 & 0xffffffff;
            ping.type = SdkPingPongType.PING;
            event.client.pingPong(ping);
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
    });
  });

  describe('server side network adaption enum', () => {
    it('will convert between enum and signaling', () => {
      expect(
        convertServerSideNetworkAdaptionEnumFromSignaled(SdkServerSideNetworkAdaption.DEFAULT)
      ).to.equal(ServerSideNetworkAdaption.Default);
      expect(
        convertServerSideNetworkAdaptionEnumFromSignaled(SdkServerSideNetworkAdaption.NONE)
      ).to.equal(ServerSideNetworkAdaption.None);
      expect(
        convertServerSideNetworkAdaptionEnumFromSignaled(
          SdkServerSideNetworkAdaption.BANDWIDTH_PROBING
        )
      ).to.equal(ServerSideNetworkAdaption.BandwidthProbing);
      expect(
        convertServerSideNetworkAdaptionEnumFromSignaled(
          SdkServerSideNetworkAdaption.BANDWIDTH_PROBING_AND_VIDEO_QUALITY_ADAPTION
        )
      ).to.equal(ServerSideNetworkAdaption.BandwidthProbingAndRemoteVideoQualityAdaption);
      expect(
        convertServerSideNetworkAdaptionEnumToSignaled(ServerSideNetworkAdaption.Default)
      ).to.equal(SdkServerSideNetworkAdaption.DEFAULT);
      expect(
        convertServerSideNetworkAdaptionEnumToSignaled(ServerSideNetworkAdaption.None)
      ).to.equal(SdkServerSideNetworkAdaption.NONE);
      expect(
        convertServerSideNetworkAdaptionEnumToSignaled(ServerSideNetworkAdaption.BandwidthProbing)
      ).to.equal(SdkServerSideNetworkAdaption.BANDWIDTH_PROBING);
      expect(
        convertServerSideNetworkAdaptionEnumToSignaled(
          ServerSideNetworkAdaption.BandwidthProbingAndRemoteVideoQualityAdaption
        )
      ).to.equal(SdkServerSideNetworkAdaption.BANDWIDTH_PROBING_AND_VIDEO_QUALITY_ADAPTION);
    });
  });

  describe('join', () => {
    it('will send a join', done => {
      const testObjects = createTestObjects();
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketOpen) {
            testObjects.webSocketAdapter.addEventListener('message', (event: MessageEvent) => {
              const buffer = new Uint8Array(event.data);
              const frame = SdkSignalFrame.decode(buffer.slice(1));
              expect(buffer[0]).to.equal(_messageType);
              expect(frame.type).to.equal(SdkSignalFrame.Type.JOIN);
              expect(frame.join.maxNumOfVideos).to.equal(0);
              expect(frame.join.protocolVersion).to.equal(2);
              expect(frame.join.flags).to.equal(SdkJoinFlags.HAS_STREAM_UPDATE);
              expect(frame.join.serverSideNetworkAdaption).to.eq(
                SdkServerSideNetworkAdaption.DEFAULT
              );
              done();
            });
            event.client.join(new SignalingClientJoin());
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
    });

    it('will send a join with application metadata if provided', done => {
      const testObjects = createTestObjects();
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketOpen) {
            testObjects.webSocketAdapter.addEventListener('message', (event: MessageEvent) => {
              const buffer = new Uint8Array(event.data);
              const frame = SdkSignalFrame.decode(buffer.slice(1));
              expect(buffer[0]).to.equal(_messageType);
              expect(frame.type).to.equal(SdkSignalFrame.Type.JOIN);
              expect(frame.join.maxNumOfVideos).to.equal(0);
              expect(frame.join.protocolVersion).to.equal(2);
              expect(frame.join.flags).to.equal(SdkJoinFlags.HAS_STREAM_UPDATE);
              expect(frame.join.clientDetails.appName).to.eq('AmazonChimeJSSDKDemoApp');
              expect(frame.join.clientDetails.appVersion).to.eq('1.0.0');
              done();
            });
            const applicationMetadata = ApplicationMetadata.create(
              'AmazonChimeJSSDKDemoApp',
              '1.0.0'
            );
            const signalingClientJoin = new SignalingClientJoin(applicationMetadata);
            event.client.join(signalingClientJoin);
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
    });

    it('will send a join with server side network adaption disabled if provided', done => {
      const testObjects = createTestObjects();
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketOpen) {
            testObjects.webSocketAdapter.addEventListener('message', (event: MessageEvent) => {
              const buffer = new Uint8Array(event.data);
              const frame = SdkSignalFrame.decode(buffer.slice(1));
              expect(buffer[0]).to.equal(_messageType);
              expect(frame.type).to.equal(SdkSignalFrame.Type.JOIN);
              expect(frame.join.maxNumOfVideos).to.equal(0);
              expect(frame.join.protocolVersion).to.equal(2);
              expect(frame.join.flags).to.equal(SdkJoinFlags.HAS_STREAM_UPDATE);
              expect(frame.join.serverSideNetworkAdaption).to.eq(SdkServerSideNetworkAdaption.NONE);
              done();
            });
            const signalingClientJoin = new SignalingClientJoin();
            signalingClientJoin.serverSideNetworkAdaption = ServerSideNetworkAdaption.None;
            event.client.join(signalingClientJoin);
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
    });

    it('will send a join with server side network adaption bandwidth probing if provided', done => {
      const testObjects = createTestObjects();
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketOpen) {
            testObjects.webSocketAdapter.addEventListener('message', (event: MessageEvent) => {
              const buffer = new Uint8Array(event.data);
              const frame = SdkSignalFrame.decode(buffer.slice(1));
              expect(buffer[0]).to.equal(_messageType);
              expect(frame.type).to.equal(SdkSignalFrame.Type.JOIN);
              expect(frame.join.maxNumOfVideos).to.equal(0);
              expect(frame.join.protocolVersion).to.equal(2);
              expect(frame.join.flags).to.equal(SdkJoinFlags.HAS_STREAM_UPDATE);
              expect(frame.join.serverSideNetworkAdaption).to.eq(
                SdkServerSideNetworkAdaption.BANDWIDTH_PROBING
              );
              done();
            });
            const signalingClientJoin = new SignalingClientJoin();
            signalingClientJoin.serverSideNetworkAdaption =
              ServerSideNetworkAdaption.BandwidthProbing;
            event.client.join(signalingClientJoin);
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
    });
  });

  describe('subscribe', () => {
    it('will send a subscribe', done => {
      const testObjects = createTestObjects();
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketOpen) {
            testObjects.webSocketAdapter.addEventListener('message', (event: MessageEvent) => {
              const buffer = new Uint8Array(event.data);
              const frame = SdkSignalFrame.decode(buffer.slice(1));
              expect(buffer[0]).to.equal(_messageType);
              expect(frame.type).to.equal(SdkSignalFrame.Type.SUBSCRIBE);
              expect(frame.sub.sendStreams.length).to.equal(1);
              expect(frame.sub.sendStreams[0].attendeeId).to.equal(_attendeeId);
              expect(frame.sub.sendStreams[0].streamId).to.equal(_streamId);
              expect(frame.sub.sendStreams[0].groupId).to.equal(_groupId);
              expect(frame.sub.duplex).to.equal(SdkStreamServiceType.RX);
              expect(frame.sub.sdpOffer).to.equal(_sdpOffer);
              expect(frame.sub.audioHost).to.equal(_audioHost);
              done();
            });
            event.client.subscribe(
              new SignalingClientSubscribe(
                _attendeeId,
                _sdpOffer,
                _audioHost,
                false,
                false,
                [],
                false,
                [new VideoStreamDescription()],
                false,
                new Uint8Array()
              )
            );
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
    });

    it('will send a subscribe without audio properties if audio host is empty', done => {
      const testObjects = createTestObjects();
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketOpen) {
            testObjects.webSocketAdapter.addEventListener('message', (event: MessageEvent) => {
              const buffer = new Uint8Array(event.data);
              const frame = SdkSignalFrame.decode(buffer.slice(1));
              expect(buffer[0]).to.equal(_messageType);
              expect(frame.type).to.equal(SdkSignalFrame.Type.SUBSCRIBE);
              expect(frame.sub.sendStreams.length).to.equal(0);
              expect(frame.sub.duplex).to.equal(SdkStreamServiceType.RX);
              expect(frame.sub.sdpOffer).to.equal(_sdpOffer);
              expect(frame.sub.audioHost).to.eql('');
              expect(frame.sub.compressedSdpOffer).to.eql(_compressedSdpOffer);
              done();
            });
            event.client.subscribe(
              new SignalingClientSubscribe(
                _attendeeId,
                _sdpOffer,
                '',
                false,
                false,
                [],
                false,
                [new VideoStreamDescription()],
                false,
                _compressedSdpOffer
              )
            );
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
    });

    it('will send a subscribe with video only properties if audio host is empty', done => {
      const testObjects = createTestObjects();
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketOpen) {
            testObjects.webSocketAdapter.addEventListener('message', (event: MessageEvent) => {
              const buffer = new Uint8Array(event.data);
              const frame = SdkSignalFrame.decode(buffer.slice(1));
              expect(buffer[0]).to.equal(_messageType);
              expect(frame.type).to.equal(SdkSignalFrame.Type.SUBSCRIBE);
              expect(frame.sub.sendStreams.length).to.equal(1);
              expect(frame.sub.sendStreams[0].attendeeId).to.equal(_attendeeId);
              expect(frame.sub.sendStreams[0].mediaType).to.equal(SdkStreamMediaType.VIDEO);
              expect(frame.sub.duplex).to.equal(SdkStreamServiceType.DUPLEX);
              expect(frame.sub.sdpOffer).to.equal(_sdpOffer);
              expect(frame.sub.audioHost).to.equal('');
              expect(frame.sub.compressedSdpOffer).to.eql(_compressedSdpOffer);
              done();
            });
            event.client.subscribe(
              new SignalingClientSubscribe(
                _attendeeId,
                _sdpOffer,
                '',
                false,
                true,
                [0],
                true,
                [new VideoStreamDescription()],
                true,
                _compressedSdpOffer
              )
            );
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
    });

    it('will send a subscribe with video properties', done => {
      const testObjects = createTestObjects();
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketOpen) {
            testObjects.webSocketAdapter.addEventListener('message', (event: MessageEvent) => {
              const buffer = new Uint8Array(event.data);
              const frame = SdkSignalFrame.decode(buffer.slice(1));
              expect(buffer[0]).to.equal(_messageType);
              expect(frame.type).to.equal(SdkSignalFrame.Type.SUBSCRIBE);
              expect(frame.sub.sendStreams.length).to.equal(1);
              expect(frame.sub.sendStreams[0].attendeeId).to.equal(_attendeeId);
              expect(frame.sub.sendStreams[0].mediaType).to.equal(SdkStreamMediaType.VIDEO);
              expect(frame.sub.duplex).to.equal(SdkStreamServiceType.DUPLEX);
              expect(frame.sub.sdpOffer).to.equal(_sdpOffer);
              expect(frame.sub.audioHost).to.equal(_audioHost);
              expect(frame.sub.compressedSdpOffer).to.eql(_compressedSdpOffer);
              done();
            });
            event.client.subscribe(
              new SignalingClientSubscribe(
                _attendeeId,
                _sdpOffer,
                _audioHost,
                false,
                true,
                [0],
                true,
                [new VideoStreamDescription()],
                true,
                _compressedSdpOffer
              )
            );
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
    });
  });

  describe('remoteVideoUpdate', () => {
    it('will send a remoteVideoUpdate frame', done => {
      const testObjects = createTestObjects();
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketOpen) {
            testObjects.webSocketAdapter.addEventListener('message', (event: MessageEvent) => {
              const buffer = new Uint8Array(event.data);
              const frame = SdkSignalFrame.decode(buffer.slice(1));
              expect(buffer[0]).to.equal(_messageType);
              expect(frame.type).to.equal(SdkSignalFrame.Type.REMOTE_VIDEO_UPDATE);
              expect(frame.remoteVideoUpdate.addedOrUpdatedVideoSubscriptions[0].streamId).to.equal(
                1
              );
              expect(
                frame.remoteVideoUpdate.addedOrUpdatedVideoSubscriptions[0].attendeeId
              ).to.equal('attendeeId');
              expect(frame.remoteVideoUpdate.addedOrUpdatedVideoSubscriptions[0].mid).to.equal(
                'midToAdd'
              );
              expect(frame.remoteVideoUpdate.removedVideoSubscriptionMids[0]).to.equal(
                'midToRemove'
              );
              done();
            });
            const addedConfig = new SignalingClientVideoSubscriptionConfiguration();
            addedConfig.mid = 'midToAdd';
            addedConfig.attendeeId = 'attendeeId';
            addedConfig.streamId = 1;
            event.client.remoteVideoUpdate([addedConfig], ['midToRemove']);
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
    });

    it('will send a remoteVideoUpdate frame with maintain framerate adaption preferences', done => {
      const testObjects = createTestObjects();
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketOpen) {
            testObjects.webSocketAdapter.addEventListener('message', (event: MessageEvent) => {
              const buffer = new Uint8Array(event.data);
              const frame = SdkSignalFrame.decode(buffer.slice(1));
              expect(buffer[0]).to.equal(_messageType);
              expect(frame.type).to.equal(SdkSignalFrame.Type.REMOTE_VIDEO_UPDATE);
              expect(frame.remoteVideoUpdate.addedOrUpdatedVideoSubscriptions[0].streamId).to.equal(
                1
              );
              expect(
                frame.remoteVideoUpdate.addedOrUpdatedVideoSubscriptions[0].attendeeId
              ).to.equal('attendeeId');
              expect(frame.remoteVideoUpdate.addedOrUpdatedVideoSubscriptions[0].mid).to.equal(
                'midToAdd'
              );
              expect(frame.remoteVideoUpdate.removedVideoSubscriptionMids[0]).to.equal(
                'midToRemove'
              );
              done();
            });
            const addedConfig = new SignalingClientVideoSubscriptionConfiguration();
            addedConfig.mid = 'midToAdd';
            addedConfig.attendeeId = 'attendeeId';
            addedConfig.streamId = 1;
            addedConfig.qualityAdaptationPreference =
              VideoQualityAdaptationPreference.MaintainFramerate;
            event.client.remoteVideoUpdate([addedConfig], ['midToRemove']);
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
    });

    it('will send a remoteVideoUpdate frame with maintain resolution adaption preferences', done => {
      const testObjects = createTestObjects();
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketOpen) {
            testObjects.webSocketAdapter.addEventListener('message', (event: MessageEvent) => {
              const buffer = new Uint8Array(event.data);
              const frame = SdkSignalFrame.decode(buffer.slice(1));
              expect(buffer[0]).to.equal(_messageType);
              expect(frame.type).to.equal(SdkSignalFrame.Type.REMOTE_VIDEO_UPDATE);
              expect(frame.remoteVideoUpdate.addedOrUpdatedVideoSubscriptions[0].streamId).to.equal(
                1
              );
              expect(
                frame.remoteVideoUpdate.addedOrUpdatedVideoSubscriptions[0].attendeeId
              ).to.equal('attendeeId');
              expect(frame.remoteVideoUpdate.addedOrUpdatedVideoSubscriptions[0].mid).to.equal(
                'midToAdd'
              );
              expect(frame.remoteVideoUpdate.removedVideoSubscriptionMids[0]).to.equal(
                'midToRemove'
              );
              done();
            });
            const addedConfig = new SignalingClientVideoSubscriptionConfiguration();
            addedConfig.mid = 'midToAdd';
            addedConfig.attendeeId = 'attendeeId';
            addedConfig.streamId = 1;
            addedConfig.qualityAdaptationPreference =
              VideoQualityAdaptationPreference.MaintainResolution;
            event.client.remoteVideoUpdate([addedConfig], ['midToRemove']);
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
    });
  });

  describe('leave', () => {
    it('will send a leave frame', done => {
      const testObjects = createTestObjects();
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketOpen) {
            testObjects.webSocketAdapter.addEventListener('message', (event: MessageEvent) => {
              const buffer = new Uint8Array(event.data);
              const frame = SdkSignalFrame.decode(buffer.slice(1));
              expect(buffer[0]).to.equal(_messageType);
              expect(frame.type).to.equal(SdkSignalFrame.Type.LEAVE);
              done();
            });
            event.client.leave();
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
    });

    it('will send a leave when unloading the page', done => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const GlobalAny = global as any;
      let added = false;
      let removed = false;
      let callbackToCall = (): void => {};
      GlobalAny['window']['addEventListener'] = (type: string, callback: () => void) => {
        expect(type).to.equal('unload');
        added = true;
        callbackToCall = callback;
      };
      GlobalAny['window']['removeEventListener'] = (type: string) => {
        expect(type).to.equal('unload');
        removed = true;
      };
      const testObjects = createTestObjects();
      new TimeoutScheduler(200).start(() => {
        testObjects.signalingClient.openConnection(testObjects.request);
      });
      new TimeoutScheduler(400).start(() => {
        testObjects.signalingClient.closeConnection();
      });
      new TimeoutScheduler(600).start(() => {
        callbackToCall();
      });
      new TimeoutScheduler(800).start(() => {
        expect(added).to.be.true;
        expect(removed).to.be.true;
        delete GlobalAny['window']['addEventListener'];
        delete GlobalAny['window']['removeEventListener'];
        done();
      });
    });
  });

  describe('sendClientMetrics', () => {
    it('will send client metrics', done => {
      const testObjects = createTestObjects();
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketOpen) {
            testObjects.webSocketAdapter.addEventListener('message', (event: MessageEvent) => {
              const buffer = new Uint8Array(event.data);
              const frame = SdkSignalFrame.decode(buffer.slice(1));
              expect(buffer[0]).to.equal(_messageType);
              expect(frame.type).to.equal(SdkSignalFrame.Type.CLIENT_METRIC);
              done();
            });
            event.client.sendClientMetrics(SdkClientMetricFrame.create());
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
    });
  });

  describe('primary meeting join and leave', () => {
    it('will send a primary meeting join frame', done => {
      const testObjects = createTestObjects();
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketOpen) {
            testObjects.webSocketAdapter.addEventListener('message', (event: MessageEvent) => {
              const buffer = new Uint8Array(event.data);
              const frame = SdkSignalFrame.decode(buffer.slice(1));
              expect(buffer[0]).to.equal(_messageType);
              expect(frame.type).to.equal(SdkSignalFrame.Type.PRIMARY_MEETING_JOIN);
              done();
            });
            event.client.promoteToPrimaryMeeting(new MeetingSessionCredentials());
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
    });

    it('will send a primary meeting leave frame', done => {
      const testObjects = createTestObjects();
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketOpen) {
            testObjects.webSocketAdapter.addEventListener('message', (event: MessageEvent) => {
              const buffer = new Uint8Array(event.data);
              const frame = SdkSignalFrame.decode(buffer.slice(1));
              expect(buffer[0]).to.equal(_messageType);
              expect(frame.type).to.equal(SdkSignalFrame.Type.PRIMARY_MEETING_LEAVE);
              done();
            });
            event.client.demoteFromPrimaryMeeting();
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
    });
  });

  describe('sendDataMessage', () => {
    it('will send data message', done => {
      const testObjects = createTestObjects();
      const dataMessageFrame = SdkDataMessageFrame.create();
      const dataMessage = SdkDataMessagePayload.create();
      dataMessageFrame.messages = [dataMessage];

      dataMessage.topic = 'topic';
      dataMessage.data = new TextEncoder().encode('Test message');
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketOpen) {
            testObjects.webSocketAdapter.addEventListener('message', (event: MessageEvent) => {
              const buffer = new Uint8Array(event.data);
              const frame = SdkSignalFrame.decode(buffer.slice(1));
              expect(buffer[0]).to.equal(_messageType);
              expect(frame.type).to.equal(SdkSignalFrame.Type.DATA_MESSAGE);
              expect(frame.dataMessage.messages[0]).to.be.eql(dataMessage);
              done();
            });
            event.client.sendDataMessage(dataMessageFrame);
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
    });
  });

  describe('closeConnection', () => {
    it('will close a connection after opening', done => {
      const testObjects = createTestObjects();
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketOpen) {
            event.client.closeConnection();
          } else if (event.type === SignalingClientEventType.WebSocketClosed) {
            done();
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
    });

    it('does not do anything when closeConnection on an already-closed connection', async () => {
      let called = false;
      const testObjects = createTestObjects();
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (
            event.type === SignalingClientEventType.WebSocketClosed ||
            event.type === SignalingClientEventType.WebSocketClosing
          ) {
            called = true;
          }
        }
      }

      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.closeConnection();
      await wait(10);
      expect(called).to.be.false;
    });

    it('continues closing the connection even when WebSocket does not receive the "close" event', function (done) {
      this.timeout(5000);
      const behavior = new DOMMockBehavior();
      behavior.webSocketCloseSucceeds = false;
      domMockBuilder = new DOMMockBuilder(behavior);

      const testObjects = createTestObjects();
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketOpen) {
            event.client.closeConnection();
          } else if (event.type === SignalingClientEventType.WebSocketClosed) {
            done();
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
    });

    it('closes the connection when WebSocket receives the "close" event, e.g., from media backend', done => {
      const testObjects = createTestObjects();
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketOpen) {
            testObjects.webSocketAdapter.close();
          } else if (event.type === SignalingClientEventType.WebSocketClosed) {
            done();
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
    });

    it('opens a new connection after closing the first one', done => {
      let callCount = 0;
      const testObjects = createTestObjects();
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketOpen) {
            callCount += 1;
            if (callCount === 2) {
              event.client.closeConnection();
            }
          } else if (event.type === SignalingClientEventType.WebSocketClosed) {
            if (callCount === 2) {
              done();
            }
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
      testObjects.signalingClient.openConnection(testObjects.request);
    });
  });

  describe('mute', () => {
    it('will mute', done => {
      const testObjects = createTestObjects();
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketOpen) {
            testObjects.webSocketAdapter.addEventListener('message', (event: MessageEvent) => {
              const buffer = new Uint8Array(event.data);
              const frame = SdkSignalFrame.decode(buffer.slice(1));
              expect(buffer[0]).to.equal(_messageType);
              expect(frame.type).to.equal(SdkSignalFrame.Type.AUDIO_CONTROL);
              expect(frame.audioControl.muted).to.equal(true);
              done();
            });
            event.client.mute(true);
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
    });
  });

  describe('pause', () => {
    it('will pause', done => {
      const testObjects = createTestObjects();
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketOpen) {
            testObjects.webSocketAdapter.addEventListener('message', (event: MessageEvent) => {
              const buffer = new Uint8Array(event.data);
              const frame = SdkSignalFrame.decode(buffer.slice(1));
              expect(buffer[0]).to.equal(_messageType);
              expect(frame.type).to.equal(SdkSignalFrame.Type.PAUSE);
              expect(frame.pause.streamIds).to.deep.equal([0]);
              done();
            });
            event.client.pause([0]);
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
    });
  });

  describe('resume', () => {
    it('will resume', done => {
      const testObjects = createTestObjects();
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketOpen) {
            testObjects.webSocketAdapter.addEventListener('message', (event: MessageEvent) => {
              const buffer = new Uint8Array(event.data);
              const frame = SdkSignalFrame.decode(buffer.slice(1));
              expect(buffer[0]).to.equal(_messageType);
              expect(frame.type).to.equal(SdkSignalFrame.Type.RESUME);
              expect(frame.pause.streamIds).to.deep.equal([0]);
              done();
            });
            event.client.resume([0]);
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
    });
  });

  describe('sendMessage', () => {
    it('will skip a message if the signaling client is not ready', done => {
      const testObjects = createTestObjects();
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketConnecting) {
            event.client.mute(true);
          } else if (event.type === SignalingClientEventType.WebSocketSkippedMessage) {
            done();
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
    });

    it('will fail to send a message if data is invalid', done => {
      const testConfigs: TestConfigs = {
        adapterSendSucceeds: false,
        adapterDestroySucceeds: true,
      };
      const testObjects = createTestObjects(testConfigs);
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketOpen) {
            event.client.mute(true);
          } else if (event.type === SignalingClientEventType.WebSocketSendMessageFailure) {
            done();
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
    });
  });

  describe('receiveMessage', () => {
    it('will failed to decode a message if an invalid buffer is sent', done => {
      const testObjects = createTestObjects();
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketOpen) {
            const invalidBuffer = new Uint8Array(
              SdkSignalFrame.encode(SdkSignalFrame.create()).finish()
            );
            testObjects.webSocketAdapter.send(invalidBuffer);
          } else if (event.type === SignalingClientEventType.ProtocolDecodeFailure) {
            done();
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
    });

    it('will skip a message if the socket is closed', done => {
      const testObjects = createTestObjects();
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketOpen) {
            event.client.mute(true);
            testObjects.signalingClient.closeConnection();
          } else if (event.type === SignalingClientEventType.ReceivedSignalFrame) {
            done(new Error('ReceivedSignalFrame should not be received.'));
          } else if (event.type === SignalingClientEventType.WebSocketClosed) {
            done();
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
    });
  });

  describe('errors', () => {
    beforeEach(() => {
      if (domMockBuilder) {
        domMockBuilder.cleanup();
        domMockBuilder = null;
      }

      const behavior = new DOMMockBehavior();
      behavior.webSocketSendSucceeds = false;
      domMockBuilder = new DOMMockBuilder(behavior);
    });

    it('will send WebSocketError', done => {
      const testObjects = createTestObjects();
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketOpen) {
            testObjects.webSocketAdapter.send(new Uint8Array([0]));
          } else if (event.type === SignalingClientEventType.WebSocketError) {
            done();
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
    });

    it('will send WebSocketFailed if the socket is closed', done => {
      const testObjects = createTestObjects();
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketConnecting) {
            testObjects.webSocketAdapter.send(new Uint8Array([0]));
          } else if (event.type === SignalingClientEventType.WebSocketFailed) {
            done();
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
    });

    it('will not send WebSocketError and WebSocketFailed if an error occurs during the closing state', done => {
      const testConfigs: TestConfigs = {
        adapterSendSucceeds: true,
        adapterDestroySucceeds: false,
      };
      const testObjects = createTestObjects(testConfigs);
      class TestObserver implements SignalingClientObserver {
        handleSignalingClientEvent(event: SignalingClientEvent): void {
          if (event.type === SignalingClientEventType.WebSocketOpen) {
            testObjects.signalingClient.closeConnection();
          } else if (event.type === SignalingClientEventType.WebSocketClosed) {
            testObjects.webSocketAdapter.send(new Uint8Array([0]));
            new TimeoutScheduler(10).start(done);
          } else if (
            event.type === SignalingClientEventType.WebSocketError ||
            event.type === SignalingClientEventType.WebSocketFailed
          ) {
            done(new Error('WebSocketError or WebSocketFailed should not be sent.'));
          }
        }
      }
      testObjects.signalingClient.registerObserver(new TestObserver());
      testObjects.signalingClient.openConnection(testObjects.request);
    });
  });

  describe('generateNewAudioSessionId', () => {
    it('will generate a random audio session id', done => {
      const randomNumSet = new Set();
      let average = 0;
      const iterations = 1000;
      const testObjects = createTestObjects();

      for (let i = 0; i < iterations; i++) {
        // @ts-ignore
        const id = testObjects.signalingClient.generateNewAudioSessionId();

        if (randomNumSet.has(id)) {
          expect.fail('audioSessionId was not unique');
        }
        randomNumSet.add(id);
        const roundedRemainder = Math.round((id % iterations) / iterations);
        average = average + (id / iterations + roundedRemainder);
      }
      // average should be near the midpoint of the 32-bit range
      const passed = average > parseInt('0x70000000') && average < parseInt('0x90000000');
      expect(passed).to.be.true;
      done();
    });
  });
});
