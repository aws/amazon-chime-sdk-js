// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Substitute } from '@fluffy-spoon/substitute';
import * as chai from 'chai';
import * as sinon from 'sinon';

import { VideoCodecCapability } from '../../src';
import DefaultActiveSpeakerPolicy from '../../src/activespeakerpolicy/DefaultActiveSpeakerPolicy';
import AudioMixObserver from '../../src/audiomixobserver/AudioMixObserver';
import AudioProfile from '../../src/audioprofile/AudioProfile';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import DefaultAudioVideoFacade from '../../src/audiovideofacade/DefaultAudioVideoFacade';
import AudioVideoObserver from '../../src/audiovideoobserver/AudioVideoObserver';
import ContentShareController from '../../src/contentsharecontroller/ContentShareController';
import ContentShareObserver from '../../src/contentshareobserver/ContentShareObserver';
import DataMessage from '../../src/datamessage/DataMessage';
import DeviceChangeObserver from '../../src/devicechangeobserver/DeviceChangeObserver';
import NoOpDeviceController from '../../src/devicecontroller/NoOpDeviceController';
import MeetingSessionCredentials from '../../src/meetingsession/MeetingSessionCredentials';
import MeetingSessionStatus from '../../src/meetingsession/MeetingSessionStatus';
import MeetingSessionStatusCode from '../../src/meetingsession/MeetingSessionStatusCode';
import type VolumeIndicatorCallback from '../../src/realtimecontroller/VolumeIndicatorCallback';
import DefaultVideoTransformDevice from '../../src/videoframeprocessor/DefaultVideoTransformDevice';
import ContentShareSimulcastEncodingParameters from '../../src/videouplinkbandwidthpolicy/ContentShareSimulcastEncodingParameters';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultAudioVideoFacade', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const assert: Chai.AssertStatic = chai.assert;
  let domMockBuilder: DOMMockBuilder;
  let controller: NoOpAudioVideoController;
  let facade: DefaultAudioVideoFacade;
  let deviceController: NoOpDeviceController;
  let contentShareController: ContentShareController;

  class NoOpObserver implements AudioVideoObserver {
    audioVideoDidStart(): void {}
  }

  class NoOpContentShareController implements ContentShareController {
    enableSimulcastForContentShare(
      _enable: boolean,
      _encodingParams?: ContentShareSimulcastEncodingParameters
    ): void {}

    async startContentShare(_stream: MediaStream): Promise<void> {}

    async startContentShareFromScreenCapture(_sourceId?: string): Promise<MediaStream> {
      return new MediaStream();
    }

    setContentAudioProfile(_audioProfile: AudioProfile): void {}

    setContentShareVideoCodecPreferences(_preferences: VideoCodecCapability[]): void {}

    pauseContentShare(): void {}

    unpauseContentShare(): void {}

    stopContentShare(): void {}

    addContentShareObserver(_observer: ContentShareObserver): void {}

    removeContentShareObserver(_observer: ContentShareObserver): void {}

    forEachContentShareObserver(_observerFunc: (observer: ContentShareObserver) => void): void {}

    enableSVCForContentShare(_enable: boolean): void {}
  }

  class NoOpContentShareObserver implements ContentShareObserver {
    contentShareDidStop(): void {}
  }

  class MockAudioMixObserver implements AudioMixObserver {
    meetingAudioStreamBecameActive(_stream: MediaStream): void {}
    meetingAudioStreamBecameInactive(_stream: MediaStream): void {}
  }

  function enableWebAudio(enabled = true): void {
    deviceController = new NoOpDeviceController({ enableWebAudio: enabled });
    facade = new DefaultAudioVideoFacade(
      controller,
      controller.videoTileController,
      controller.realtimeController,
      controller.audioMixController,
      deviceController,
      contentShareController
    );
  }

  beforeEach(() => {
    domMockBuilder = new DOMMockBuilder();
    controller = new NoOpAudioVideoController();
    contentShareController = new NoOpContentShareController();
    enableWebAudio(false);
  });

  afterEach(() => {
    if (domMockBuilder) {
      domMockBuilder.cleanup();
      domMockBuilder = null;
    }
  });

  describe('construction', () => {
    it('can be constructed', () => {
      expect(facade).to.exist;
    });
  });

  describe('facade', () => {
    it('will call addObserver', () => {
      const spy = sinon.spy(controller, 'addObserver');
      const arg1 = new NoOpObserver();
      facade.addObserver(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call removeObserver', () => {
      const spy = sinon.spy(controller, 'removeObserver');
      const arg1 = new NoOpObserver();
      facade.removeObserver(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call setAudioProfile', () => {
      const spy = sinon.spy(controller, 'setAudioProfile');
      const profile = new AudioProfile();
      facade.setAudioProfile(profile);
      assert(spy.calledOnceWith(profile));
    });

    it('will call start', () => {
      const spy = sinon.spy(controller, 'start');
      facade.start();
      assert(spy.calledOnceWith());
    });

    it('will call stop', () => {
      const spy = sinon.spy(controller, 'stop');
      facade.stop();
      assert(spy.calledOnceWith());
    });

    it('will call setVideoMaxBandwidthKbps', () => {
      const spy = sinon.spy(controller, 'setVideoMaxBandwidthKbps');
      facade.setVideoMaxBandwidthKbps(100);
      assert(spy.calledOnce);
    });

    it('will call setVideoCodecSendPreferences', () => {
      const spy = sinon.spy(controller, 'setVideoCodecSendPreferences');
      facade.setVideoCodecSendPreferences([]);
      assert(spy.calledOnce);
    });

    it('will call getRTCPeerConnectionStats', async () => {
      const spy = sinon.spy(controller, 'getRTCPeerConnectionStats');
      await facade.getRTCPeerConnectionStats();
      assert(spy.calledOnceWith());
    });

    it('will call getRTCPeerConnectionStats with media stream track', async () => {
      const spy = sinon.spy(controller, 'getRTCPeerConnectionStats');
      const track = new MediaStreamTrack();
      await facade.getRTCPeerConnectionStats(track);
      assert(spy.calledOnceWith(track));
    });

    it('will call bindVideoElement', () => {
      const spy = sinon.spy(controller.videoTileController, 'bindVideoElement');
      const arg1 = 0;
      const arg2 = Substitute.for<HTMLVideoElement>();
      facade.bindVideoElement(arg1, arg2);
      assert(spy.calledOnceWith(arg1, arg2));
    });

    it('will call unbindVideoElement with cleanUpVideoElement defaulting to true', () => {
      const spy = sinon.spy(controller.videoTileController, 'unbindVideoElement');
      const arg1 = 0;
      facade.unbindVideoElement(arg1);
      assert(spy.calledOnceWith(arg1, true));
    });

    it('will call unbindVideoElement with cleanUpVideoElement as false', () => {
      const spy = sinon.spy(controller.videoTileController, 'unbindVideoElement');
      const arg1 = 0;
      facade.unbindVideoElement(arg1, false);
      assert(spy.calledOnceWith(arg1, false));
    });

    it('will call startLocalVideoTile', () => {
      const spy = sinon.spy(controller.videoTileController, 'startLocalVideoTile');
      facade.startLocalVideoTile();
      assert(spy.calledOnceWith());
    });

    it('will call stopLocalVideoTile', () => {
      const spy = sinon.spy(controller.videoTileController, 'stopLocalVideoTile');
      facade.stopLocalVideoTile();
      assert(spy.calledOnceWith());
    });

    it('will call hasStartedLocalVideoTile', () => {
      const spy = sinon.spy(controller.videoTileController, 'hasStartedLocalVideoTile');
      facade.hasStartedLocalVideoTile();
      assert(spy.calledOnceWith());
    });

    it('will call removeLocalVideoTile', () => {
      const spy = sinon.spy(controller.videoTileController, 'removeLocalVideoTile');
      facade.removeLocalVideoTile();
      assert(spy.calledOnceWith());
    });

    it('will call getLocalVideoTile', () => {
      const spy = sinon.spy(controller.videoTileController, 'getLocalVideoTile');
      facade.getLocalVideoTile();
      assert(spy.calledOnceWith());
    });

    it('will call pauseVideoTile', () => {
      const spy = sinon.spy(controller.videoTileController, 'pauseVideoTile');
      const arg1 = 0;
      facade.pauseVideoTile(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call unpauseVideoTile', () => {
      const spy = sinon.spy(controller.videoTileController, 'unpauseVideoTile');
      const arg1 = 0;
      facade.unpauseVideoTile(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call getVideoTile', () => {
      const spy = sinon.spy(controller.videoTileController, 'getVideoTile');
      const arg1 = 0;
      facade.getVideoTile(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call getAllRemoteVideoTiles', () => {
      const spy = sinon.spy(controller.videoTileController, 'getAllRemoteVideoTiles');
      facade.getAllRemoteVideoTiles();
      assert(spy.calledOnceWith());
    });

    it('will call getAllVideoTiles', () => {
      const spy = sinon.spy(controller.videoTileController, 'getAllVideoTiles');
      facade.getAllVideoTiles();
      assert(spy.calledOnceWith());
    });

    it('will call addVideoTile', () => {
      const spy = sinon.spy(controller.videoTileController, 'addVideoTile');
      facade.addVideoTile();
      assert(spy.calledOnceWith());
    });

    it('will call removeVideoTile', () => {
      const spy = sinon.spy(controller.videoTileController, 'removeVideoTile');
      const arg1 = 0;
      facade.removeVideoTile(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call bindAudioElement', () => {
      const spy = sinon.spy(controller.audioMixController, 'bindAudioElement');
      const arg1 = Substitute.for<HTMLAudioElement>();
      facade.bindAudioElement(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call unbindAudioElement', () => {
      const spy = sinon.spy(controller.audioMixController, 'unbindAudioElement');
      facade.unbindAudioElement();
      assert(spy.calledOnceWith());
    });

    it('will call getCurrentConferenceStream', () => {
      const spy = sinon.spy(controller.audioMixController, 'getCurrentMeetingAudioStream');
      facade.getCurrentMeetingAudioStream();
      assert(spy.calledOnceWith());
    });

    it('will call addAudioMixObserver', () => {
      const spy = sinon.spy(controller.audioMixController, 'addAudioMixObserver');
      const arg1 = new MockAudioMixObserver();
      facade.addAudioMixObserver(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call removeAudioMixObserver', () => {
      const spy = sinon.spy(controller.audioMixController, 'removeAudioMixObserver');
      const arg1 = new MockAudioMixObserver();
      facade.removeAudioMixObserver(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call removeVideoTilesByAttendeeId', () => {
      const spy = sinon.spy(controller.videoTileController, 'removeVideoTilesByAttendeeId');
      const arg1 = '';
      facade.removeVideoTilesByAttendeeId(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call removeAllVideoTiles', () => {
      const spy = sinon.spy(controller.videoTileController, 'removeAllVideoTiles');
      facade.removeAllVideoTiles();
      assert(spy.calledOnceWith());
    });

    it('will call captureVideoTile', () => {
      const spy = sinon.spy(controller.videoTileController, 'captureVideoTile');
      const arg1 = 0;
      facade.captureVideoTile(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call realtimeSubscribeToAttendeeIdPresence', () => {
      const spy = sinon.spy(controller.realtimeController, 'realtimeSubscribeToAttendeeIdPresence');
      const arg1 = (_attendeeId: string, _present: boolean): void => {};
      facade.realtimeSubscribeToAttendeeIdPresence(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call realtimeUnsubscribeToAttendeeIdPresence', () => {
      const spy = sinon.spy(
        controller.realtimeController,
        'realtimeUnsubscribeToAttendeeIdPresence'
      );
      const arg1 = (_attendeeId: string, _present: boolean): void => {};
      facade.realtimeUnsubscribeToAttendeeIdPresence(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call realtimeSetCanUnmuteLocalAudio', () => {
      const spy = sinon.spy(controller.realtimeController, 'realtimeSetCanUnmuteLocalAudio');
      const arg1 = false;
      facade.realtimeSetCanUnmuteLocalAudio(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call realtimeSubscribeToSetCanUnmuteLocalAudio', () => {
      const spy = sinon.spy(
        controller.realtimeController,
        'realtimeSubscribeToSetCanUnmuteLocalAudio'
      );
      const arg1 = (_canUnmute: boolean): void => {};
      facade.realtimeSubscribeToSetCanUnmuteLocalAudio(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call realtimeUnsubscribeToSetCanUnmuteLocalAudio', () => {
      const spy = sinon.spy(
        controller.realtimeController,
        'realtimeUnsubscribeToSetCanUnmuteLocalAudio'
      );
      const arg1 = (_canUnmute: boolean): void => {};
      facade.realtimeUnsubscribeToSetCanUnmuteLocalAudio(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call realtimeCanUnmuteLocalAudio', () => {
      const spy = sinon.spy(controller.realtimeController, 'realtimeCanUnmuteLocalAudio');
      facade.realtimeCanUnmuteLocalAudio();
      assert(spy.calledOnceWith());
    });

    it('will call realtimeMuteLocalAudio', () => {
      const spy = sinon.spy(controller.realtimeController, 'realtimeMuteLocalAudio');
      facade.realtimeMuteLocalAudio();
      assert(spy.calledOnceWith());
    });

    it('will call realtimeUnmuteLocalAudio', () => {
      const spy = sinon.spy(controller.realtimeController, 'realtimeUnmuteLocalAudio');
      facade.realtimeUnmuteLocalAudio();
      assert(spy.calledOnceWith());
    });

    it('will call realtimeSubscribeToMuteAndUnmuteLocalAudio', () => {
      const spy = sinon.spy(
        controller.realtimeController,
        'realtimeSubscribeToMuteAndUnmuteLocalAudio'
      );
      const arg1 = (_muted: boolean): void => {};
      facade.realtimeSubscribeToMuteAndUnmuteLocalAudio(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call realtimeUnsubscribeToMuteAndUnmuteLocalAudio', () => {
      const spy = sinon.spy(
        controller.realtimeController,
        'realtimeUnsubscribeToMuteAndUnmuteLocalAudio'
      );
      const arg1 = (_muted: boolean): void => {};
      facade.realtimeUnsubscribeToMuteAndUnmuteLocalAudio(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call realtimeIsLocalAudioMuted', () => {
      const spy = sinon.spy(controller.realtimeController, 'realtimeIsLocalAudioMuted');
      facade.realtimeIsLocalAudioMuted();
      assert(spy.calledOnceWith());
    });

    it('will call realtimeSubscribeToVolumeIndicator', () => {
      const spy = sinon.spy(controller.realtimeController, 'realtimeSubscribeToVolumeIndicator');
      const arg1 = '';
      const arg2: VolumeIndicatorCallback = (
        _attendeeId: string,
        _volume: number | null,
        _muted: boolean | null,
        _signalStrength: number | null
      ): void => {};
      facade.realtimeSubscribeToVolumeIndicator(arg1, arg2);
      assert(spy.calledOnceWith(arg1, arg2));
    });

    it('will call realtimeUnsubscribeFromVolumeIndicator with 1 argument', () => {
      const spy = sinon.spy(
        controller.realtimeController,
        'realtimeUnsubscribeFromVolumeIndicator'
      );
      const arg1 = '';
      facade.realtimeUnsubscribeFromVolumeIndicator(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call realtimeUnsubscribeFromVolumeIndicator with 2 arguments', () => {
      const spy = sinon.spy(
        controller.realtimeController,
        'realtimeUnsubscribeFromVolumeIndicator'
      );
      const arg1 = '';
      const arg2: VolumeIndicatorCallback = (
        _attendeeId,
        _volume,
        _muted,
        _signalStrength
      ): void => {};
      facade.realtimeUnsubscribeFromVolumeIndicator(arg1, arg2);
      assert(spy.calledOnceWith(arg1, arg2));
    });

    it('will call realtimeSubscribeToLocalSignalStrengthChange', () => {
      const spy = sinon.spy(
        controller.realtimeController,
        'realtimeSubscribeToLocalSignalStrengthChange'
      );
      const arg1 = (_signalStrength: number): void => {};
      facade.realtimeSubscribeToLocalSignalStrengthChange(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call realtimeUnsubscribeToLocalSignalStrengthChange', () => {
      const spy = sinon.spy(
        controller.realtimeController,
        'realtimeUnsubscribeToLocalSignalStrengthChange'
      );
      const arg1 = (_signalStrength: number): void => {};
      facade.realtimeUnsubscribeToLocalSignalStrengthChange(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('realtimeSendDataMessage', () => {
      const spy = sinon.spy(controller.realtimeController, 'realtimeSendDataMessage');
      facade.realtimeSendDataMessage('topic', 'test message', 100);
      assert(spy.calledOnceWithExactly('topic', 'test message', 100));
    });

    it('realtimeSubscribeToReceiveDataMessage', () => {
      const spy = sinon.spy(controller.realtimeController, 'realtimeSubscribeToReceiveDataMessage');
      const callback = (_dataMessage: DataMessage): void => {};
      facade.realtimeSubscribeToReceiveDataMessage('topic', callback);
      assert(spy.calledOnceWithExactly('topic', callback));
    });

    it('realtimeUnsubscribeFromReceiveDataMessage', () => {
      const spy = sinon.spy(
        controller.realtimeController,
        'realtimeUnsubscribeFromReceiveDataMessage'
      );
      facade.realtimeUnsubscribeFromReceiveDataMessage('topic');
      assert(spy.calledOnceWithExactly('topic'));
    });

    it('will call realtimeSubscribeToFatalError', () => {
      const spy = sinon.spy(controller.realtimeController, 'realtimeSubscribeToFatalError');
      const arg1 = (_error: Error): void => {};
      facade.realtimeSubscribeToFatalError(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call realtimeUnsubscribeToFatalError', () => {
      const spy = sinon.spy(controller.realtimeController, 'realtimeUnsubscribeToFatalError');
      const arg1 = (_error: Error): void => {};
      facade.realtimeUnsubscribeToFatalError(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call subscribeToActiveSpeakerDetector', () => {
      const spy = sinon.spy(controller.activeSpeakerDetector, 'subscribe');
      const arg1 = new DefaultActiveSpeakerPolicy();
      const arg2 = (_activeSpeakers: string[]): void => {};
      facade.subscribeToActiveSpeakerDetector(arg1, arg2);
      facade.unsubscribeFromActiveSpeakerDetector(arg2);
      assert(spy.calledOnceWith(arg1, arg2));
    });

    it('will call unsubscribeFromActiveSpeakerDetector', () => {
      const spy = sinon.spy(controller.activeSpeakerDetector, 'unsubscribe');
      const arg1 = new DefaultActiveSpeakerPolicy();
      const arg2 = (_activeSpeakers: string[]): void => {};
      facade.subscribeToActiveSpeakerDetector(arg1, arg2);
      facade.unsubscribeFromActiveSpeakerDetector(arg2);
      assert(spy.calledOnceWith(arg2));
    });

    it('will call listAudioInputDevices', async () => {
      const spy = sinon.spy(deviceController, 'listAudioInputDevices');
      await facade.listAudioInputDevices();
      assert(spy.calledOnceWith());
    });

    it('will call listVideoInputDevices', async () => {
      const spy = sinon.spy(deviceController, 'listVideoInputDevices');
      await facade.listVideoInputDevices();
      assert(spy.calledOnceWith());
    });

    it('will call listAudioOutputDevices', async () => {
      const spy = sinon.spy(deviceController, 'listAudioOutputDevices');
      await facade.listAudioOutputDevices();
      assert(spy.calledOnceWith());
    });

    it('will call startAudioInput', async () => {
      const spy = sinon.spy(deviceController, 'startAudioInput');
      const arg1 = '';
      try {
        await facade.startAudioInput(arg1);
      } catch (e) {}
      assert(spy.calledOnceWith(arg1));
    });

    it('will call stopAudioInput', async () => {
      const spy = sinon.spy(deviceController, 'stopAudioInput');
      try {
        await facade.stopAudioInput();
      } catch (e) {}
      assert(spy.calledOnce);
    });

    it('will call startVideoInput', async () => {
      const spy = sinon.spy(deviceController, 'startVideoInput');
      const arg1 = '';
      try {
        await facade.startVideoInput(arg1);
      } catch (e) {}
      assert(spy.calledOnceWith(arg1));

      const arg2 = new DefaultVideoTransformDevice(null, '', []);
      try {
        await facade.startVideoInput(arg2);
      } catch (e) {}
      assert(spy.calledWith(arg2));
    });

    it('will call stopVideoInput', async () => {
      const spy = sinon.spy(deviceController, 'stopVideoInput');
      try {
        await facade.stopVideoInput();
      } catch (e) {}
      assert(spy.calledOnce);
    });

    it('will call chooseVideoInputQuality', () => {
      const spy = sinon.spy(deviceController, 'chooseVideoInputQuality');
      const arg1 = 1;
      const arg2 = 2;
      const arg3 = 3;
      facade.chooseVideoInputQuality(arg1, arg2, arg3);
      assert(spy.calledOnceWith(arg1, arg2, arg3));
    });

    it('will call getVideoInputQualitySettings', () => {
      const spy = sinon.spy(deviceController, 'getVideoInputQualitySettings');
      facade.getVideoInputQualitySettings();
      assert(spy.calledOnce);
    });

    it('will call chooseAudioOutputDevice', async () => {
      const spy = sinon.spy(deviceController, 'chooseAudioOutput');
      const arg1 = '';
      try {
        await facade.chooseAudioOutput(arg1);
      } catch (e) {}
      assert(spy.calledOnceWith(arg1));
    });

    it('will call addDeviceChangeObserver', () => {
      class MockDeviceChangeObserver implements DeviceChangeObserver {}
      const spy = sinon.spy(deviceController, 'addDeviceChangeObserver');
      const arg1 = new MockDeviceChangeObserver();
      facade.addDeviceChangeObserver(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call removeDeviceChangeObserver', () => {
      class MockDeviceChangeObserver implements DeviceChangeObserver {}
      const spy = sinon.spy(deviceController, 'removeDeviceChangeObserver');
      const arg1 = new MockDeviceChangeObserver();
      facade.removeDeviceChangeObserver(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call createAnalyserNodeForAudioInput', () => {
      const spy = sinon.spy(deviceController, 'createAnalyserNodeForAudioInput');
      facade.createAnalyserNodeForAudioInput();
      assert(spy.called);
    });

    it('will call startVideoPreviewForVideoInput', () => {
      const spy = sinon.spy(deviceController, 'startVideoPreviewForVideoInput');
      const arg1 = Substitute.for<HTMLVideoElement>();
      facade.startVideoPreviewForVideoInput(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call stopVideoPreviewForVideoInput', () => {
      const spy = sinon.spy(deviceController, 'stopVideoPreviewForVideoInput');
      const arg1 = Substitute.for<HTMLVideoElement>();
      facade.stopVideoPreviewForVideoInput(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call setDeviceLabelTrigger', () => {
      const spy = sinon.spy(deviceController, 'setDeviceLabelTrigger');
      const arg1 = async (): Promise<MediaStream> => {
        return null;
      };
      facade.setDeviceLabelTrigger(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call mixIntoAudioInput if WebAudio feature is enabled', () => {
      enableWebAudio(true);
      const spy = sinon.spy(deviceController, 'mixIntoAudioInput');
      const arg1 = new MediaStream();
      facade.mixIntoAudioInput(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call setContentAudioProfile', () => {
      const spy = sinon.spy(contentShareController, 'setContentAudioProfile');
      const profile = new AudioProfile();
      facade.setContentAudioProfile(profile);
      assert(spy.calledOnceWith(profile));
    });

    it('will call enableSimulcastForContentShare', () => {
      const spy = sinon.spy(contentShareController, 'enableSimulcastForContentShare');
      facade.enableSimulcastForContentShare(true);
      spy.calledOnceWith(true);
    });

    it('will call enableSVCForContentShare', () => {
      const spy = sinon.spy(contentShareController, 'enableSVCForContentShare');
      facade.enableSVCForContentShare(true);
      spy.calledOnceWith(true);
    });

    it('will call startContentShare', async () => {
      const spy = sinon.spy(contentShareController, 'startContentShare');
      const mediaStream = new MediaStream();
      await facade.startContentShare(mediaStream);
      spy.calledOnceWith(mediaStream);
    });

    it('will call startContentShareFromScreenCapture', async () => {
      const spy = sinon.spy(contentShareController, 'startContentShareFromScreenCapture');
      await facade.startContentShareFromScreenCapture();
      expect(spy.calledOnce).to.be.true;
    });

    it('will call setContentShareVideoCodecPreferences', async () => {
      const spy = sinon.spy(contentShareController, 'setContentShareVideoCodecPreferences');
      facade.setContentShareVideoCodecPreferences([]);
      expect(spy.calledOnce).to.be.true;
    });

    it('pauseContentShare', () => {
      const spy = sinon.spy(contentShareController, 'pauseContentShare');
      facade.pauseContentShare();
      expect(spy.calledOnce).to.be.true;
    });

    it('unpauseContentShare', () => {
      const spy = sinon.spy(contentShareController, 'unpauseContentShare');
      facade.unpauseContentShare();
      expect(spy.calledOnce).to.be.true;
    });

    it('stopContentShare', () => {
      const spy = sinon.spy(contentShareController, 'stopContentShare');
      facade.stopContentShare();
      expect(spy.calledOnce).to.be.true;
    });

    it('addContentShareObserver', () => {
      const spy = sinon.spy(contentShareController, 'addContentShareObserver');
      const observer = new NoOpContentShareObserver();
      facade.addContentShareObserver(observer);
      expect(spy.withArgs(observer).calledOnce).to.be.true;
    });

    it('removeContentShareObserver', () => {
      const spy = sinon.spy(contentShareController, 'removeContentShareObserver');
      const observer = new NoOpContentShareObserver();
      facade.removeContentShareObserver(observer);
      expect(spy.withArgs(observer).calledOnce).to.be.true;
    });

    it('will call getRemoteVideoSources', () => {
      const spy = sinon.spy(controller, 'getRemoteVideoSources');
      facade.getRemoteVideoSources();
      assert(spy.calledOnceWith());
    });

    it('will return transcription controller ', () => {
      expect(facade.transcriptionController).to.not.equal(null);
    });

    it('will call promoteToPrimaryMeeting', () => {
      const spy = sinon.spy(controller, 'promoteToPrimaryMeeting');
      const credentials = new MeetingSessionCredentials();
      facade.promoteToPrimaryMeeting(credentials);
      expect(spy.withArgs(credentials).calledOnce).to.be.true;
    });

    it('will call demoteFromPrimaryMeeting', () => {
      const spy = sinon.spy(controller, 'demoteFromPrimaryMeeting');
      facade.demoteFromPrimaryMeeting();
      assert(spy.calledOnceWith());
    });

    it('AudioVideoWasDemotedFromPrimaryMeeting will stop content share', () => {
      const spy = sinon.spy(contentShareController, 'stopContentShare');
      facade.audioVideoWasDemotedFromPrimaryMeeting(
        new MeetingSessionStatus(MeetingSessionStatusCode.OK)
      );
      expect(spy.withArgs().calledOnce).to.be.true;
    });
  });
});
