// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Substitute } from '@fluffy-spoon/substitute';
import * as chai from 'chai';
import * as sinon from 'sinon';

import DefaultActiveSpeakerPolicy from '../../src/activespeakerpolicy/DefaultActiveSpeakerPolicy';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import AudioVideoFacade from '../../src/audiovideofacade/AudioVideoFacade';
import DefaultAudioVideoFacade from '../../src/audiovideofacade/DefaultAudioVideoFacade';
import AudioVideoObserver from '../../src/audiovideoobserver/AudioVideoObserver';
import DeviceChangeObserver from '../../src/devicechangeobserver/DeviceChangeObserver';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultAudioVideoFacade', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const assert: Chai.AssertStatic = chai.assert;
  let domMockBuilder: DOMMockBuilder;
  let controller: NoOpAudioVideoController;
  let facade: AudioVideoFacade;

  class NoOpObserver implements AudioVideoObserver {
    audioVideoDidStart(): void {}
  }

  beforeEach(() => {
    domMockBuilder = new DOMMockBuilder();
    controller = new NoOpAudioVideoController();
    facade = new DefaultAudioVideoFacade(
      controller,
      controller.videoTileController,
      controller.realtimeController,
      controller.audioMixController,
      controller.deviceController
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

    it('will call bindVideoElement', () => {
      const spy = sinon.spy(controller.videoTileController, 'bindVideoElement');
      const arg1 = 0;
      const arg2 = Substitute.for<HTMLVideoElement>();
      facade.bindVideoElement(arg1, arg2);
      assert(spy.calledOnceWith(arg1, arg2));
    });

    it('will call unbindVideoElement', () => {
      const spy = sinon.spy(controller.videoTileController, 'unbindVideoElement');
      const arg1 = 0;
      facade.unbindVideoElement(arg1);
      assert(spy.calledOnceWith(arg1));
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
      const arg2 = (
        _attendeeId: string,
        _volume: number | null,
        _muted: boolean | null,
        _signalStrength: number | null
      ): void => {};
      facade.realtimeSubscribeToVolumeIndicator(arg1, arg2);
      assert(spy.calledOnceWith(arg1, arg2));
    });

    it('will call realtimeUnsubscribeFromVolumeIndicator', () => {
      const spy = sinon.spy(
        controller.realtimeController,
        'realtimeUnsubscribeFromVolumeIndicator'
      );
      const arg1 = '';
      facade.realtimeUnsubscribeFromVolumeIndicator(arg1);
      assert(spy.calledOnceWith(arg1));
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

    it('will call listAudioInputDevices', () => {
      const spy = sinon.spy(controller.deviceController, 'listAudioInputDevices');
      facade.listAudioInputDevices();
      assert(spy.calledOnceWith());
    });

    it('will call listVideoInputDevices', () => {
      const spy = sinon.spy(controller.deviceController, 'listVideoInputDevices');
      facade.listVideoInputDevices();
      assert(spy.calledOnceWith());
    });

    it('will call listAudioOutputDevices', () => {
      const spy = sinon.spy(controller.deviceController, 'listAudioOutputDevices');
      facade.listAudioOutputDevices();
      assert(spy.calledOnceWith());
    });

    it('will call chooseAudioInputDevice', () => {
      const spy = sinon.spy(controller.deviceController, 'chooseAudioInputDevice');
      const arg1 = '';
      facade.chooseAudioInputDevice(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call chooseVideoInputDevice', () => {
      const spy = sinon.spy(controller.deviceController, 'chooseVideoInputDevice');
      const arg1 = '';
      facade.chooseVideoInputDevice(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call chooseVideoInputQuality', () => {
      const spy = sinon.spy(controller.deviceController, 'chooseVideoInputQuality');
      const arg1 = 1;
      const arg2 = 2;
      const arg3 = 3;
      const arg4 = 4;
      facade.chooseVideoInputQuality(arg1, arg2, arg3, arg4);
      assert(spy.calledOnceWith(arg1, arg2, arg3, arg4));
    });

    it('will call chooseAudioOutputDevice', () => {
      const spy = sinon.spy(controller.deviceController, 'chooseAudioOutputDevice');
      const arg1 = '';
      facade.chooseAudioOutputDevice(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call addDeviceChangeObserver', () => {
      class MockDeviceChangeObserver implements DeviceChangeObserver {}
      const spy = sinon.spy(controller.deviceController, 'addDeviceChangeObserver');
      const arg1 = new MockDeviceChangeObserver();
      facade.addDeviceChangeObserver(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call removeDeviceChangeObserver', () => {
      class MockDeviceChangeObserver implements DeviceChangeObserver {}
      const spy = sinon.spy(controller.deviceController, 'removeDeviceChangeObserver');
      const arg1 = new MockDeviceChangeObserver();
      facade.removeDeviceChangeObserver(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call createAnalyserNodeForAudioInput', () => {
      const spy = sinon.spy(controller.deviceController, 'createAnalyserNodeForAudioInput');
      facade.createAnalyserNodeForAudioInput();
      assert(spy.called);
    });

    it('will call startVideoPreviewForVideoInput', () => {
      const spy = sinon.spy(controller.deviceController, 'startVideoPreviewForVideoInput');
      const arg1 = Substitute.for<HTMLVideoElement>();
      facade.startVideoPreviewForVideoInput(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call stopVideoPreviewForVideoInput', () => {
      const spy = sinon.spy(controller.deviceController, 'stopVideoPreviewForVideoInput');
      const arg1 = Substitute.for<HTMLVideoElement>();
      facade.stopVideoPreviewForVideoInput(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call setDeviceLabelTrigger', () => {
      const spy = sinon.spy(controller.deviceController, 'setDeviceLabelTrigger');
      const arg1 = async (): Promise<MediaStream> => {
        return null;
      };
      facade.setDeviceLabelTrigger(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call mixIntoAudioInput', () => {
      const spy = sinon.spy(controller.deviceController, 'mixIntoAudioInput');
      const arg1 = new MediaStream();
      facade.mixIntoAudioInput(arg1);
      assert(spy.calledOnceWith(arg1));
    });
  });
});
