// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import DeviceChangeObserver from '../../src/devicechangeobserver/DeviceChangeObserver';
import AudioInputDevice from '../../src/devicecontroller/AudioInputDevice';
import AudioTransformDevice from '../../src/devicecontroller/AudioTransformDevice';
import DefaultDeviceController from '../../src/devicecontroller/DefaultDeviceController';
import Device from '../../src/devicecontroller/Device';
import GetUserMediaError from '../../src/devicecontroller/GetUserMediaError';
import NotFoundError from '../../src/devicecontroller/NotFoundError';
import NotReadableError from '../../src/devicecontroller/NotReadableError';
import OverconstrainedError from '../../src/devicecontroller/OverconstrainedError';
import PermissionDeniedError from '../../src/devicecontroller/PermissionDeniedError';
import TypeError from '../../src/devicecontroller/TypeError';
import VideoInputDevice from '../../src/devicecontroller/VideoInputDevice';
import VideoTransformDevice from '../../src/devicecontroller/VideoTransformDevice';
import EventAttributes from '../../src/eventcontroller/EventAttributes';
import EventName from '../../src/eventcontroller/EventName';
import NoOpLogger from '../../src/logger/NoOpLogger';
import MediaDeviceProxyHandler from '../../src/mediadevicefactory/MediaDeviceProxyHandler';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import NoOpVideoElementFactory from '../../src/videoelementfactory/NoOpVideoElementFactory';
import DefaultVideoTile from '../../src/videotile/DefaultVideoTile';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';
import MockError from '../dommock/MockError';
import UserMediaState from '../dommock/UserMediaState';
import {
  MockNodeTransformDevice,
  MockPassthroughTransformDevice,
  MockThrowingTransformDevice,
  MutingTransformDevice,
} from '../transformdevicemock/MockTransformDevice';
import WatchingLogger from './WatchingLogger';

describe('DefaultDeviceController', () => {
  const assert: Chai.AssertStatic = chai.assert;
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpLogger();
  const stringDeviceId = 'string-device-id';

  let deviceController: DefaultDeviceController;
  let audioVideoController: NoOpAudioVideoController;
  let domMockBuilder: DOMMockBuilder;
  let domMockBehavior: DOMMockBehavior;

  function enableWebAudio(enabled = true): void {
    deviceController = new DefaultDeviceController(logger, { enableWebAudio: enabled });
  }

  function getMediaStreamDevice(id: string): MediaStream {
    const device = new MediaStream();
    // @ts-ignore
    device.id = id;
    // @ts-ignore
    device.active = true;
    return device;
  }

  function getMediaDeviceInfo(
    deviceId: string,
    kind: MediaDeviceKind,
    label: string,
    groupId?: string
  ): MediaDeviceInfo {
    // @ts-ignore
    return {
      deviceId,
      kind,
      label,
      groupId,
    };
  }

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    deviceController = new DefaultDeviceController(logger, { enableWebAudio: false });
    audioVideoController = new NoOpAudioVideoController();
  });

  afterEach(() => {
    DefaultDeviceController.closeAudioContext();
    if (domMockBuilder) {
      domMockBuilder.cleanup();
    }
  });

  describe('constructor', () => {
    it('can be constructed without navigator.mediaDevices', () => {
      domMockBehavior = new DOMMockBehavior();
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      const mediaDeviceWrapper = new Proxy<MediaDevices>(
        navigator.mediaDevices,
        new MediaDeviceProxyHandler()
      );
      expect(mediaDeviceWrapper.getSupportedConstraints).to.exist;
      domMockBehavior.mediaDevicesSupported = false;
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      deviceController = new DefaultDeviceController(logger);
      expect(deviceController).to.exist;
    });
  });

  describe('list devices', () => {
    it('lists audio input devices', async () => {
      const devices: MediaDeviceInfo[] = await deviceController.listAudioInputDevices();
      expect(devices.length).to.equal(2);
      for (const device of devices) {
        expect(device.kind).to.equal('audioinput');
      }
    });

    it('lists video input devices', async () => {
      const devices: MediaDeviceInfo[] = await deviceController.listVideoInputDevices();
      expect(devices.length).to.equal(2);
      for (const device of devices) {
        expect(device.kind).to.equal('videoinput');
      }
    });

    it('lists audio output devices', async () => {
      const devices: MediaDeviceInfo[] = await deviceController.listAudioOutputDevices();
      expect(devices.length).to.equal(1);
      for (const device of devices) {
        expect(device.kind).to.equal('audiooutput');
      }
    });

    it('returns an empty list if MediaDeviceInfo API does not exist', async () => {
      MediaDeviceInfo = undefined;
      const devices: MediaDeviceInfo[] = await deviceController.listAudioInputDevices();
      expect(devices.length).to.equal(0);
    });

    it('does not fail even when the custom label device trigger throws an error', async () => {
      let called = false;
      deviceController.setDeviceLabelTrigger(async () => {
        called = true;
        throw new Error('Something went wrong');
        return new MediaStream();
      });
      // Simulate the device list when no permission is granted.
      domMockBehavior.enumerateDeviceList = [getMediaDeviceInfo('', 'audioinput', '', '')];
      try {
        await deviceController.listAudioInputDevices();
        expect(called).to.be.true;
      } catch (error) {
        throw new Error('This line should not be reached.');
      }
    });
  });

  describe('chooseVideoInputQuality', () => {
    it('chooses video input quality', async () => {
      deviceController.bindToAudioVideoController(audioVideoController);
      const spy = sinon.spy(audioVideoController, 'setVideoMaxBandwidthKbps');

      const width = 640;
      const height = 360;
      const frameRate = 15;
      const maxBandwidthKbps = 600;
      deviceController.chooseVideoInputQuality(width, height, frameRate, maxBandwidthKbps);

      // @ts-ignore
      const constraints: MediaTrackConstraints = {};
      await deviceController.chooseVideoInputDevice(constraints);

      expect(JSON.stringify(constraints.width)).to.equal(JSON.stringify({ ideal: width }));
      expect(JSON.stringify(constraints.height)).to.equal(JSON.stringify({ ideal: height }));
      expect(JSON.stringify(constraints.frameRate)).to.equal(JSON.stringify({ ideal: frameRate }));
      expect(spy.calledWith(maxBandwidthKbps)).to.be.true;
    });

    it('adjusts width and height if required', async () => {
      // @ts-ignore
      navigator.userAgent = 'android pixel 3';
      deviceController = new DefaultDeviceController(logger);

      deviceController.bindToAudioVideoController(audioVideoController);

      const width = 540;
      const height = 540;
      deviceController.chooseVideoInputQuality(width, height, 15, 600);

      // @ts-ignore
      const constraints: MediaTrackConstraints = {};
      await deviceController.chooseVideoInputDevice(constraints);

      expect(JSON.stringify(constraints.width)).to.equal(JSON.stringify({ ideal: 576 }));
      expect(JSON.stringify(constraints.height)).to.equal(JSON.stringify({ ideal: 576 }));
    });
  });

  describe('getVideoInputQuality', () => {
    it('get video input quality settings', async () => {
      const width = 640;
      const height = 360;
      const frameRate = 15;
      const maxBandwidthKbps = 600;
      deviceController.chooseVideoInputQuality(width, height, frameRate, maxBandwidthKbps);

      const videoInputQualitySettings = deviceController.getVideoInputQualitySettings();
      expect(videoInputQualitySettings.videoWidth).to.equal(width);
      expect(videoInputQualitySettings.videoHeight).to.equal(height);
      expect(videoInputQualitySettings.videoFrameRate).to.equal(frameRate);
      expect(videoInputQualitySettings.videoMaxBandwidthKbps).to.equal(maxBandwidthKbps);
    });

    it('get default video input quality settings', async () => {
      const videoInputQualitySettings = deviceController.getVideoInputQualitySettings();
      expect(videoInputQualitySettings.videoWidth).to.equal(960);
      expect(videoInputQualitySettings.videoHeight).to.equal(540);
      expect(videoInputQualitySettings.videoFrameRate).to.equal(15);
      expect(videoInputQualitySettings.videoMaxBandwidthKbps).to.equal(1400);
    });
  });

  describe('transform mute subscription', () => {
    it('does nothing if there is no device', async () => {
      enableWebAudio(true);

      class TestAudioVideoController extends NoOpAudioVideoController {
        mute(): void {
          this.realtimeController.realtimeMuteLocalAudio();
        }

        unmute(): void {
          this.realtimeController.realtimeUnmuteLocalAudio();
        }
      }

      const av = new TestAudioVideoController();
      deviceController.bindToAudioVideoController(av);

      await deviceController.chooseAudioInputDevice('foobar');

      av.mute();
      av.mute();
      av.unmute();
    });

    it('works if there is no bound AV controller', async () => {
      deviceController.bindToAudioVideoController(undefined);
      deviceController.bindToAudioVideoController(undefined);
    });

    it('subscribes to mute', async () => {
      enableWebAudio(true);

      const device = new MutingTransformDevice('foo');

      class TestAudioVideoController extends NoOpAudioVideoController {
        mute(): void {
          this.realtimeController.realtimeMuteLocalAudio();
        }

        unmute(): void {
          this.realtimeController.realtimeUnmuteLocalAudio();
        }
      }

      const av = new TestAudioVideoController();
      const unsub = sinon.spy(
        av.realtimeController,
        'realtimeUnsubscribeToMuteAndUnmuteLocalAudio'
      );

      deviceController.bindToAudioVideoController(av);

      expect(unsub.notCalled).to.be.true;

      await deviceController.chooseAudioInputDevice(device);

      av.mute();
      av.mute();
      av.unmute();

      expect(device.muted).to.deep.equal([true, false]);

      // Binding again is OK.
      const av2 = new TestAudioVideoController();

      deviceController.bindToAudioVideoController(av2);

      expect(unsub.calledOnce).to.be.true;

      av2.mute();
      av2.unmute();

      expect(device.muted).to.deep.equal([true, false, true, false]);
    });
  });

  describe('chooseAudioInputDevice transform device permissions', () => {
    it('handles user permission errors', async () => {
      enableWebAudio(true);

      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.PermissionDeniedError;
      domMockBehavior.asyncWaitMs = 1500;
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      const device = new MockNodeTransformDevice('user-permission-id-foo');

      const createAudioNodeSpy = sinon.spy(device, 'createAudioNode');
      const intrinsicDeviceSpy = sinon.spy(device, 'intrinsicDevice');
      const stopSpy = sinon.spy(device, 'stop');

      try {
        await deviceController.chooseAudioInputDevice(device);
        throw new Error('This line should not be reached');
      } catch (e) {
        expect(e.message).to.include('Permission denied by user');
        expect(deviceController.hasAppliedTransform()).to.be.false;
      }

      expect(createAudioNodeSpy.calledOnce).to.be.true;
      expect(intrinsicDeviceSpy.calledOnce).to.be.true;
      expect(stopSpy.notCalled).to.be.true;
    });

    it('handles browser permission errors', async () => {
      enableWebAudio(true);

      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.PermissionDeniedError;
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      const device = new MockNodeTransformDevice('user-permission-id-bar');

      const createAudioNodeSpy = sinon.spy(device, 'createAudioNode');
      const intrinsicDeviceSpy = sinon.spy(device, 'intrinsicDevice');
      const stopSpy = sinon.spy(device, 'stop');

      try {
        await deviceController.chooseAudioInputDevice(device);
        throw new Error('This line should not be reached');
      } catch (e) {
        expect(e.message).to.include('Permission denied by browser');
        expect(deviceController.hasAppliedTransform()).to.be.false;
      }
      expect(createAudioNodeSpy.calledOnce).to.be.true;
      expect(intrinsicDeviceSpy.calledOnce).to.be.true;
      expect(stopSpy.notCalled).to.be.true;
    });
  });

  describe('chooseAudioInputDevice handling an OverconstrainedError', () => {
    it('logs appropriately', async () => {
      const watcher = new WatchingLogger('Over-constrained by constraint: testconstraint');
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.OverconstrainedError;
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      deviceController = new DefaultDeviceController(watcher);

      try {
        await deviceController.chooseAudioInputDevice('whatever');
        throw new Error('This line should not be reached');
      } catch (e) {
        expect(e.message).to.not.equal('This line should not be reached');
      }
      expect(watcher.matches.length).to.equal(1);
    });
  });

  describe('chooseAudioInputDevice with transform', () => {
    it('rejects a transform device with Web Audio disabled', async () => {
      enableWebAudio(false);
      const device: AudioTransformDevice = new MockPassthroughTransformDevice(null);
      try {
        await deviceController.chooseAudioInputDevice(device);
        assert.fail();
      } catch (e) {
        expect(e.message).to.equal('Cannot apply transform device without enabling Web Audio.');
        expect(deviceController.hasAppliedTransform()).to.be.false;
      }
    });

    it('passes through the thrown exception if the transform device cannot instantiate a node', async () => {
      enableWebAudio(true);
      const device: AudioTransformDevice = new MockThrowingTransformDevice(null);
      const createAudioNodeSpy = sinon.spy(device, 'createAudioNode');
      const intrinsicDeviceSpy = sinon.spy(device, 'intrinsicDevice');
      const stopSpy = sinon.spy(device, 'stop');

      try {
        await deviceController.chooseAudioInputDevice(device);
        assert.fail();
      } catch (e) {
        expect(e.message).to.equal('Cannot create audio node.');
      }
      expect(deviceController.hasAppliedTransform()).to.be.false;
      expect(createAudioNodeSpy.calledOnce).to.be.true;
      expect(intrinsicDeviceSpy.notCalled).to.be.true;
      expect(stopSpy.notCalled).to.be.true;
    });

    it('chooses a transform device that does not return a node', async () => {
      enableWebAudio(true);
      const device: AudioTransformDevice = new MockPassthroughTransformDevice(null);
      try {
        await deviceController.chooseAudioInputDevice(device);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
      expect(deviceController.hasAppliedTransform()).to.be.true;
    });

    it('chooses a transform device that does return a node', async () => {
      enableWebAudio(true);
      const device: AudioTransformDevice = new MockNodeTransformDevice(null);
      try {
        await deviceController.chooseAudioInputDevice(device);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
      expect(deviceController.hasAppliedTransform()).to.be.true;
    });

    it('does nothing on re-selection', async () => {
      enableWebAudio(true);
      const device: AudioTransformDevice = new MockNodeTransformDevice(null);
      const createAudioNodeSpy = sinon.spy(device, 'createAudioNode');
      const intrinsicDeviceSpy = sinon.spy(device, 'intrinsicDevice');
      const stopSpy = sinon.spy(device, 'stop');

      try {
        await deviceController.chooseAudioInputDevice(device);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
      try {
        await deviceController.chooseAudioInputDevice(device);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
      expect(deviceController.hasAppliedTransform()).to.be.true;

      expect(createAudioNodeSpy.calledOnce).to.be.true;
      expect(intrinsicDeviceSpy.calledOnce).to.be.true;
      expect(stopSpy.notCalled).to.be.true;
    });

    it('applying two transform devices simultaneously will not fail', async () => {
      enableWebAudio(true);

      // Try some async trickery to get these two to collide.
      // `first` will win because everything will apply after 200ms.
      const first = new MockNodeTransformDevice('first', 200);
      const second = new MockNodeTransformDevice('second', 0);
      const results = await Promise.all([
        deviceController.chooseAudioInputDevice(first).catch(e => e),
        deviceController.chooseAudioInputDevice(second).catch(e => e),
      ]);

      expect(results.length).to.equal(2);

      const errors = results.filter(val => val instanceof Error);

      expect(errors.length).to.equal(0);

      expect(deviceController.hasAppliedTransform()).to.be.true;
    });
  });

  describe('chooseAudioInputDevice twice', () => {
    it('allows replacement no-node -> node', async () => {
      enableWebAudio(true);

      expect(deviceController.hasAppliedTransform()).to.be.false;
      const passthrough: AudioTransformDevice = new MockPassthroughTransformDevice('passthrough');
      const stopSpy = sinon.spy(passthrough, 'stop');

      try {
        await deviceController.chooseAudioInputDevice(passthrough);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
      expect(stopSpy.notCalled).to.be.true;
      expect(deviceController.hasAppliedTransform()).to.be.true;

      const noded: AudioTransformDevice = new MockNodeTransformDevice('noded');
      try {
        await deviceController.chooseAudioInputDevice(noded);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
      expect(stopSpy.notCalled).to.be.true;
      expect(deviceController.hasAppliedTransform()).to.be.true;
    });

    it('allows replacement node -> node', async () => {
      enableWebAudio(true);

      expect(deviceController.hasAppliedTransform()).to.be.false;
      const device: AudioTransformDevice = new MockNodeTransformDevice('foo');
      const stopSpy = sinon.spy(device, 'stop');

      try {
        await deviceController.chooseAudioInputDevice(device);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
      expect(stopSpy.notCalled).to.be.true;
      expect(deviceController.hasAppliedTransform()).to.be.true;

      const noded: AudioTransformDevice = new MockNodeTransformDevice('noded');
      try {
        deviceController.chooseAudioInputDevice(noded);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
      expect(stopSpy.notCalled).to.be.true;
      expect(deviceController.hasAppliedTransform()).to.be.true;
    });

    it('allows replacement no-node -> non-transform', async () => {
      enableWebAudio(true);

      expect(deviceController.hasAppliedTransform()).to.be.false;
      const device: AudioTransformDevice = new MockPassthroughTransformDevice('foo');
      const stopSpy = sinon.spy(device, 'stop');

      try {
        await deviceController.chooseAudioInputDevice(device);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
      expect(stopSpy.notCalled).to.be.true;
      expect(deviceController.hasAppliedTransform()).to.be.true;

      try {
        await deviceController.chooseAudioInputDevice('simple');
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
      expect(stopSpy.notCalled).to.be.true;
      expect(deviceController.hasAppliedTransform()).to.be.false;
    });

    it('allows replacement node -> non-transform', async () => {
      enableWebAudio(true);

      expect(deviceController.hasAppliedTransform()).to.be.false;
      const device: AudioTransformDevice = new MockNodeTransformDevice('foo');
      const stopSpy = sinon.spy(device, 'stop');

      try {
        await deviceController.chooseAudioInputDevice(device);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
      expect(stopSpy.notCalled).to.be.true;
      expect(deviceController.hasAppliedTransform()).to.be.true;

      try {
        await deviceController.chooseAudioInputDevice('simple');
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
      expect(stopSpy.notCalled).to.be.true;
      expect(deviceController.hasAppliedTransform()).to.be.false;
    });
  });

  describe('chooseAudioInputDevice', () => {
    it('chooses no device', async () => {
      const device: AudioInputDevice = null;
      try {
        await deviceController.chooseAudioInputDevice(device);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
    });

    it('pass undefined device', async () => {
      try {
        const logSpy = sinon.spy(logger, 'error');
        await deviceController.chooseAudioInputDevice(undefined);
        expect(logSpy.calledOnce);
        logSpy.restore();
      } catch (e) {
        throw new Error('This line should not be reached');
      }
    });

    it('chooses an audio device', async () => {
      const device: AudioInputDevice = { deviceId: 'string-device-id' };
      try {
        await deviceController.chooseAudioInputDevice(device);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
    });

    it('when denied permission by browser, it defaults to null device', async () => {
      let device: AudioInputDevice = { deviceId: 'string-device-id-1' };
      try {
        await deviceController.chooseAudioInputDevice(device);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
      const audioStream1 = await deviceController.acquireAudioInputStream();
      expect(audioStream1.id).to.not.equal('destination-stream-id');

      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.PermissionDeniedError;
      device = { deviceId: 'string-device-id-2' };
      try {
        await deviceController.chooseAudioInputDevice(device);
      } catch (e) {
        expect(e).to.be.instanceOf(PermissionDeniedError);
      }
      const audioStream2 = await deviceController.acquireAudioInputStream();
      expect(audioStream2.id).to.equal('destination-stream-id');
    });

    it('restarts the local audio if the audio-video controller is bound', async () => {
      let called = false;

      class TestAudioVideoController extends NoOpAudioVideoController {
        async restartLocalAudio(callback: () => void): Promise<void> {
          called = true;
          callback();
        }
      }

      audioVideoController = new TestAudioVideoController();
      deviceController.bindToAudioVideoController(audioVideoController);
      try {
        await deviceController.chooseAudioInputDevice(stringDeviceId);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
      expect(called).to.be.true;
    });

    it('catches an error from restarting the local audio', async () => {
      let called = false;

      class TestAudioVideoController extends NoOpAudioVideoController {
        async restartLocalAudio(callback: () => void): Promise<void> {
          called = true;
          throw new Error('something went wrong');
          callback();
        }
      }

      audioVideoController = new TestAudioVideoController();
      deviceController.bindToAudioVideoController(audioVideoController);

      try {
        await deviceController.chooseAudioInputDevice(stringDeviceId);
        expect(called).to.be.true;
      } catch (error) {
        throw new Error('This line should not be reached.');
      }
    });

    it('attaches the audio input stream to the audio context', async () => {
      enableWebAudio(true);
      try {
        await deviceController.chooseAudioInputDevice(stringDeviceId);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }

      // The previous audio source node will be disconneted.
      try {
        await deviceController.chooseAudioInputDevice('another-device-id');
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
    });

    it('releases audio media stream when requesting default device and default is already active in chromium based browser', async () => {
      enableWebAudio(true);
      domMockBehavior.browserName = 'chrome';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      deviceController = new DefaultDeviceController(logger);
      domMockBehavior.enumerateDeviceList = [
        getMediaDeviceInfo('default', 'audioinput', 'label', 'group-id-1'),
      ];
      await deviceController.listAudioInputDevices();
      try {
        await deviceController.chooseAudioInputDevice('default');
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
      domMockBehavior.enumerateDeviceList.pop();
      // add external default device
      domMockBehavior.enumerateDeviceList = [
        getMediaDeviceInfo('default', 'audioinput', 'default - label2', 'group-id-2'),
      ];
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      await deviceController.listAudioInputDevices();
      try {
        await deviceController.chooseAudioInputDevice('default');
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
    });

    it('sets to null device when an external device disconnects', async () => {
      enableWebAudio(true);
      try {
        await deviceController.chooseAudioInputDevice(stringDeviceId);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }

      // The previous audio source node will be disconneted.
      try {
        await deviceController.chooseAudioInputDevice(null);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
    });

    it('releases all previously-acquired audio streams', done => {
      const stringDeviceIds: AudioInputDevice[] = [
        'device-id-1',
        'device-id-2',
        'device-id-3',
        'device-id-4',
      ];
      const releasedDevices = new Set();

      class TestDeviceController extends DefaultDeviceController {
        releaseMediaStream(mediaStreamToRelease: MediaStream | null): void {
          super.releaseMediaStream(mediaStreamToRelease);

          if (!mediaStreamToRelease) {
            return;
          }
          // @ts-ignore
          if (mediaStreamToRelease.constraints && mediaStreamToRelease.constraints.audio) {
            // @ts-ignore
            releasedDevices.add(mediaStreamToRelease.constraints.audio.deviceId.exact);
          }
        }
      }

      deviceController = new TestDeviceController(logger);
      domMockBehavior.asyncWaitMs = 100;
      deviceController.chooseAudioInputDevice(stringDeviceIds[0]).then(async () => {
        deviceController.chooseAudioInputDevice(stringDeviceIds[1]);
        await new Promise(resolve => new TimeoutScheduler(10).start(resolve));
        deviceController.chooseAudioInputDevice(stringDeviceIds[2]);
        await new Promise(resolve => new TimeoutScheduler(10).start(resolve));
        deviceController.chooseAudioInputDevice(stringDeviceIds[3]);
      });
      new TimeoutScheduler(500).start(() => {
        expect(releasedDevices.size).to.equal(3);
        done();
      });
    });

    it('releases all previously-acquired audio streams with iOS 12', done => {
      domMockBehavior = new DOMMockBehavior();
      domMockBehavior.browserName = 'ios12.0';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      const stringDeviceIds: AudioInputDevice[] = [
        'device-id-1',
        'device-id-2',
        'device-id-3',
        'device-id-4',
      ];
      const releasedDevices = new Set();
      class TestDeviceControllerWithIOSSafari12 extends DefaultDeviceController {
        releaseMediaStream(mediaStreamToRelease: MediaStream | null): void {
          super.releaseMediaStream(mediaStreamToRelease);

          if (!mediaStreamToRelease) {
            return;
          }
          // @ts-ignore
          if (mediaStreamToRelease.constraints && mediaStreamToRelease.constraints.audio) {
            // @ts-ignore
            releasedDevices.add(mediaStreamToRelease.constraints.audio.deviceId);
          }
        }
      }
      deviceController = new TestDeviceControllerWithIOSSafari12(logger);
      deviceController.chooseAudioInputDevice(stringDeviceIds[0]).then(async () => {
        deviceController.chooseAudioInputDevice(stringDeviceIds[1]);
        await new Promise(resolve => new TimeoutScheduler(10).start(resolve));
        deviceController.chooseAudioInputDevice(stringDeviceIds[2]);
        await new Promise(resolve => new TimeoutScheduler(10).start(resolve));
        deviceController.chooseAudioInputDevice(stringDeviceIds[3]);
      });
      new TimeoutScheduler(500).start(() => {
        expect(releasedDevices.size).to.equal(3);
        done();
      });
    });
  });

  describe('handleGetUserMediaError', () => {
    it('NotReadableError', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.NotReadableError;

      try {
        await deviceController.chooseVideoInputDevice(stringDeviceId);
        throw new Error('This line should not be reached');
      } catch (e) {
        expect(e).to.be.instanceof(NotReadableError);
      }
    });

    it('TrackStartError', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.TrackStartError;

      try {
        await deviceController.chooseVideoInputDevice(stringDeviceId);
        throw new Error('This line should not be reached');
      } catch (e) {
        expect(e).to.be.instanceof(NotReadableError);
      }
    });

    it('NotFoundError', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.NotFoundError;

      try {
        await deviceController.chooseVideoInputDevice(stringDeviceId);
        throw new Error('This line should not be reached');
      } catch (e) {
        expect(e).to.be.instanceof(NotFoundError);
        expect(e.message).to.not.equal('This line should not be reached');
      }
    });

    it('DevicesNotFoundError', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.DevicesNotFoundError;

      try {
        await deviceController.chooseVideoInputDevice(stringDeviceId);
        throw new Error('This line should not be reached');
      } catch (e) {
        expect(e).to.be.instanceof(NotFoundError);
        expect(e.message).to.not.equal('This line should not be reached');
      }
    });

    it('NotAllowedError', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.TrackStartError;

      try {
        await deviceController.chooseVideoInputDevice(stringDeviceId);
        throw new Error('This line should not be reached');
      } catch (e) {
        expect(e).to.be.instanceof(NotReadableError);
        expect(e.message).to.not.equal('This line should not be reached');
      }
    });

    it('OverconstrainedError', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.OverconstrainedError;

      try {
        await deviceController.chooseVideoInputDevice(stringDeviceId);
        throw new Error('This line should not be reached');
      } catch (e) {
        expect(e).to.be.instanceof(OverconstrainedError);
        expect(e.message).to.not.equal('This line should not be reached');
      }
    });

    it('ConstraintNotSatisfiedError', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.ConstraintNotSatisfiedError;

      try {
        await deviceController.chooseVideoInputDevice(stringDeviceId);
        throw new Error('This line should not be reached');
      } catch (e) {
        expect(e).to.be.instanceof(OverconstrainedError);
        expect(e.message).to.not.equal('This line should not be reached');
      }
    });

    it('TypeError', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.TypeError;

      try {
        await deviceController.chooseVideoInputDevice(stringDeviceId);
        throw new Error('This line should not be reached');
      } catch (e) {
        expect(e).to.be.instanceof(TypeError);
        expect(e.message).to.not.equal('This line should not be reached');
      }
    });

    it('AbortError', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.AbortError;

      try {
        await deviceController.chooseVideoInputDevice(stringDeviceId);
        throw new Error('This line should not be reached');
      } catch (e) {
        expect(e).to.be.instanceof(GetUserMediaError);
        expect(e.message).to.not.equal('This line should not be reached');
      }
    });

    it('SomeOtherError', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.Failure;
      try {
        await deviceController.chooseVideoInputDevice(stringDeviceId);
        throw new Error('This line should not be reached');
      } catch (e) {
        expect(e).to.be.instanceof(GetUserMediaError);
        expect(e.message).to.not.equal('This line should not be reached');
      }
    });

    it('GetUserMediaError', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.GetUserMediaError;
      try {
        await deviceController.chooseVideoInputDevice(stringDeviceId);
        throw new Error('This line should not be reached');
      } catch (e) {
        expect(e).to.be.instanceof(GetUserMediaError);
        expect(e.message).to.include('Error fetching device.');
      }
    });
  });

  describe('chooseVideoInputDevice', () => {
    it('chooses no device', async () => {
      const device: VideoInputDevice = null;
      try {
        await deviceController.chooseVideoInputDevice(device);
      } catch (e) {
        throw new Error('This line should not be reached');
      }
    });

    it('pass undefined device', async () => {
      try {
        const logSpy = sinon.spy(logger, 'error');
        await deviceController.chooseVideoInputDevice(undefined);
        expect(logSpy.calledOnce);
        logSpy.restore();
      } catch (e) {
        throw new Error('This line should not be reached');
      }
    });

    it('chooses the device by browser', async () => {
      try {
        await deviceController.chooseVideoInputDevice(stringDeviceId);
      } catch (e) {
        throw new Error('This line should not be reached');
      }
    });

    it('chooses the device by user', async () => {
      domMockBehavior.asyncWaitMs = 1500;
      try {
        await deviceController.chooseVideoInputDevice(stringDeviceId);
      } catch (e) {
        throw new Error('This line should not be reached');
      }
    });

    it('chooses the device as a media stream', async () => {
      const device: VideoInputDevice = getMediaStreamDevice('device-id');
      await deviceController.chooseVideoInputDevice(device);
      const stream = await deviceController.acquireVideoInputStream();
      expect(stream).to.equal(device);
    });

    it('releases an old stream', async () => {
      deviceController.bindToAudioVideoController(audioVideoController);
      await deviceController.chooseVideoInputDevice(stringDeviceId);
      const stream = await deviceController.acquireVideoInputStream();
      const spy = sinon.spy(deviceController, 'releaseMediaStream');
      await deviceController.chooseVideoInputDevice('new-device-id');
      expect(spy.calledOnceWith(stream)).to.be.true;
    });

    it('restarts the local video if enabled', async () => {
      class TestAudioVideoController extends NoOpAudioVideoController {
        restartLocalVideo(callback: () => void): boolean {
          callback();
          return true;
        }
      }

      audioVideoController = new TestAudioVideoController();
      deviceController.bindToAudioVideoController(audioVideoController);
      audioVideoController.videoTileController.startLocalVideoTile();

      await deviceController.chooseVideoInputDevice(stringDeviceId);
      const stream = await deviceController.acquireVideoInputStream();
      const spy = sinon.spy(deviceController, 'releaseMediaStream');
      await deviceController.chooseVideoInputDevice('new-device-id');
      expect(spy.calledOnceWith(stream)).to.be.true;
    });

    it('denies the permission by browser', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.PermissionDeniedError;
      deviceController.bindToAudioVideoController(audioVideoController);
      const handleEventSpy = sinon.spy(audioVideoController.eventController, 'publishEvent');
      try {
        await deviceController.chooseVideoInputDevice(stringDeviceId);
        throw new Error('This line should not be reached');
      } catch (e) {
        expect(e.message).to.include('Permission denied by browser');
      }
      expect(handleEventSpy.called).to.be.true;
    });

    it('denies the permission by user', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.PermissionDeniedError;
      domMockBehavior.asyncWaitMs = 1500;
      deviceController.bindToAudioVideoController(audioVideoController);
      const handleEventSpy = sinon.spy(audioVideoController.eventController, 'publishEvent');
      try {
        await deviceController.chooseVideoInputDevice(stringDeviceId);
        throw new Error('This line should not be reached');
      } catch (e) {
        expect(e.message).to.include('Permission denied by user');
      }
      expect(handleEventSpy.called).to.be.true;
    });

    it('cannot choose the device of an empty string ID', async () => {
      const device: VideoInputDevice = '';
      deviceController.bindToAudioVideoController(audioVideoController);
      const handleEventSpy = sinon.spy(audioVideoController.eventController, 'publishEvent');
      try {
        await deviceController.chooseVideoInputDevice(device);
        throw new Error('This line should not be reached');
      } catch (e) {
        expect(e).to.be.instanceof(TypeError);
      }
      expect(handleEventSpy.called).to.be.true;
    });

    it('throws error when choosing VideoTransformDevice', async () => {
      class NoOpVideoTransformDevice implements VideoTransformDevice {
        stop(): Promise<void> {
          throw new Error('Method not implemented.');
        }
        intrinsicDevice(): Promise<Device> {
          throw new Error('Method not implemented.');
        }
        applyProcessors(_mediaStream?: MediaStream): Promise<MediaStream> {
          throw new Error('Method not implemented.');
        }
        outputMediaStream: MediaStream;
      }
      const device = new NoOpVideoTransformDevice();

      try {
        await deviceController.chooseVideoInputDevice(device);
        throw new Error('Not reachable');
      } catch (error) {}
    });
  });

  describe('chooseVideoInputDevice (advanced for LED issues)', () => {
    it('releases the video input stream acquired before no device request', done => {
      const spy = sinon.spy(deviceController, 'releaseMediaStream');
      domMockBehavior.asyncWaitMs = 1500;
      deviceController.chooseVideoInputDevice(stringDeviceId).then(() => {
        expect(spy.callCount).to.equal(1);
        expect(spy.calledOnceWith(null)).to.be.false;
        done();
      });
      deviceController.chooseVideoInputDevice(null);
    });

    it('does not release the video input stream acquired after no device request', done => {
      const spy = sinon.spy(deviceController, 'releaseMediaStream');
      domMockBehavior.asyncWaitMs = 500;
      deviceController.chooseVideoInputDevice(null);
      deviceController.chooseVideoInputDevice(stringDeviceId).then(() => {
        expect(spy.calledOnceWith(null)).to.be.true;
        done();
      });
    });

    it('releases 3 video input streams acquired before no device request', done => {
      const spy = sinon.spy(deviceController, 'releaseMediaStream');
      let callCount = 0;
      domMockBehavior.asyncWaitMs = 1000;
      deviceController.chooseVideoInputDevice(stringDeviceId).then(() => {
        callCount += 1;
      });
      new TimeoutScheduler(100).start(() => {
        deviceController.chooseVideoInputDevice(stringDeviceId).then(() => {
          callCount += 1;
        });
      });
      new TimeoutScheduler(300).start(() => {
        deviceController.chooseVideoInputDevice(stringDeviceId).then(() => {
          callCount += 1;
        });
      });
      new TimeoutScheduler(500).start(() => {
        deviceController.chooseVideoInputDevice(null);
      });
      new TimeoutScheduler(1500).start(() => {
        expect(callCount).to.equal(3);
        expect(spy.callCount).to.equal(3);
        done();
      });
    });

    it('releases all previously-acquired video streams', done => {
      const stringDeviceIds: VideoInputDevice[] = [
        'device-id-1',
        'device-id-2',
        'device-id-3',
        'device-id-4',
      ];
      let index = 0;

      class TestDeviceController extends DefaultDeviceController {
        releaseMediaStream(mediaStreamToRelease: MediaStream | null): void {
          super.releaseMediaStream(mediaStreamToRelease);

          if (mediaStreamToRelease) {
            // @ts-ignore
            expect(mediaStreamToRelease.constraints.video.deviceId.exact).to.equal(
              stringDeviceIds[index]
            );
            index += 1;
          }
        }
      }

      deviceController = new TestDeviceController(logger);
      domMockBehavior.asyncWaitMs = 100;
      deviceController.chooseVideoInputDevice(stringDeviceIds[0]).then(async () => {
        deviceController.chooseVideoInputDevice(stringDeviceIds[1]);
        await new Promise(resolve => new TimeoutScheduler(10).start(resolve));
        deviceController.chooseVideoInputDevice(stringDeviceIds[2]);
        await new Promise(resolve => new TimeoutScheduler(10).start(resolve));
        deviceController.chooseVideoInputDevice(stringDeviceIds[3]);
      });
      new TimeoutScheduler(500).start(() => {
        expect(index).to.equal(3);
        done();
      });
    });
  });

  describe('releaseMediaStream', () => {
    it('stops the local video if enabled', async () => {
      const spy = sinon.spy(audioVideoController.videoTileController, 'stopLocalVideoTile');
      deviceController.bindToAudioVideoController(audioVideoController);
      audioVideoController.videoTileController.startLocalVideoTile();
      await deviceController.chooseVideoInputDevice(stringDeviceId);
      const stream = await deviceController.acquireVideoInputStream();
      const spy2 = sinon.spy(stream, 'getTracks');
      deviceController.releaseMediaStream(stream);
      expect(spy.called).to.be.true;
      expect(spy2.called).to.be.true;
    });

    it('does not need to stop the local video if disabled', async () => {
      const spy = sinon.spy(audioVideoController.videoTileController, 'stopLocalVideoTile');
      deviceController.bindToAudioVideoController(audioVideoController);
      await deviceController.chooseVideoInputDevice(stringDeviceId);
      const stream = await deviceController.acquireVideoInputStream();
      deviceController.releaseMediaStream(stream);
      expect(spy.called).to.be.false;
    });

    it('does not need to stop the local video if no valid device is choosen', async () => {
      const spy = sinon.spy(audioVideoController.videoTileController, 'stopLocalVideoTile');
      deviceController.bindToAudioVideoController(audioVideoController);
      const device: VideoInputDevice = {
        deviceId: { exact: null },
      };
      await deviceController.chooseVideoInputDevice(device);
      const stream = await deviceController.acquireVideoInputStream();
      deviceController.releaseMediaStream(stream);
      expect(spy.called).to.be.false;
    });

    it("disconnects the audio input source node instead of the given stream's tracks", async () => {
      enableWebAudio(true);
      await deviceController.chooseAudioInputDevice(stringDeviceId);
      const stream = await deviceController.acquireAudioInputStream();

      // If the web audio is disabled, it stops the given stream's tracks.
      const spy = sinon.spy(stream, 'getTracks');
      deviceController.releaseMediaStream(stream);
      expect(spy.called).to.be.false;
    });
  });

  describe('chooseAudioOutputDevice', () => {
    it('does not bind the audio device if no audio-video is bound', async () => {
      const spy = sinon.spy(audioVideoController.audioMixController, 'bindAudioDevice');
      await deviceController.chooseAudioOutputDevice(stringDeviceId);
      expect(spy.called).to.be.false;
    });

    it('binds the audio device if the audio-video is bound', async () => {
      domMockBehavior.enumerateDeviceList = [
        getMediaDeviceInfo(stringDeviceId, null, 'label'),
        getMediaDeviceInfo(stringDeviceId, 'audiooutput', 'label'),
      ];
      await deviceController.listAudioOutputDevices();
      const spy = sinon.spy(audioVideoController.audioMixController, 'bindAudioDevice');
      deviceController.bindToAudioVideoController(audioVideoController);
      await deviceController.chooseAudioOutputDevice(stringDeviceId);
      expect(spy.called).to.be.true;
    });

    it('binds the null device if the audio-video is bound', async () => {
      domMockBehavior.enumerateDeviceList = [getMediaDeviceInfo(stringDeviceId, null, 'label')];
      await deviceController.listAudioOutputDevices();
      const spy = sinon.spy(audioVideoController.audioMixController, 'bindAudioDevice');
      deviceController.bindToAudioVideoController(audioVideoController);
      await deviceController.chooseAudioOutputDevice(stringDeviceId);
      expect(spy.called).to.be.true;
    });
  });

  describe('acquire input streams', () => {
    it('acquires a stream if no active audio input exists', async () => {
      // Creates an empty audio device with null constraints
      let stream = await deviceController.acquireAudioInputStream();
      expect(stream).to.exist;

      // Creates an empty audio device again as the previously-acquired device has null constraints
      stream = await deviceController.acquireAudioInputStream();
      expect(stream).to.exist;
    });

    it('acquires the existing audio input stream', async () => {
      const device: AudioInputDevice = getMediaStreamDevice('device-id');
      await deviceController.chooseAudioInputDevice(device);
      const stream = await deviceController.acquireAudioInputStream();
      expect(stream).to.equal(device);
    });

    it('acquires an non-empty stream when the web audio is enabled', async () => {
      enableWebAudio(true);
      const stream = await deviceController.acquireAudioInputStream();
      expect(stream).to.exist;
    });

    it('cannot acquire a video input stream if the permission is denied by user', async () => {
      // Choose the video input device.
      await deviceController.chooseVideoInputDevice(stringDeviceId);
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.NotAllowedError;
      domMockBehavior.asyncWaitMs = 1500;
      try {
        // Make the acquired stream inactive.
        const stream = await deviceController.acquireVideoInputStream();
        // @ts-ignore
        stream.active = false;

        // SDK will fail to acquire the inactive video stream.
        await deviceController.acquireVideoInputStream();
        throw new Error('This line should not be reached.');
      } catch (e) {
        expect(e).to.be.instanceof(PermissionDeniedError);
        expect(e.message).includes(`Permission denied by user`);
      }
    });

    it('cannot acquire a video input stream if some failure happens', async () => {
      // Choose the video input device.
      await deviceController.chooseVideoInputDevice(stringDeviceId);
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.AbortError;
      domMockBehavior.asyncWaitMs = 1500;
      try {
        // Make the acquired stream inactive.
        const stream = await deviceController.acquireVideoInputStream();
        // @ts-ignore
        stream.active = false;

        // SDK will fail to acquire the inactive video stream.
        await deviceController.acquireVideoInputStream();
        throw new Error('This line should not be reached.');
      } catch (e) {
        expect(e).to.be.instanceof(GetUserMediaError);
        expect(e.message).includes(`unable to acquire video device`);
      }
    });

    it('acquires the display input stream using getUserMedia API if the given constraint is satisfied', async () => {
      const spy = sinon.spy(navigator.mediaDevices, 'getUserMedia');
      const constraints = {
        video: {
          mandatory: {
            chromeMediaSource: {},
            chromeMediaSourceId: 'source-id',
          },
        },
      };
      // @ts-ignore
      await deviceController.acquireDisplayInputStream(constraints as MediaStreamConstraints);
      await new Promise(resolve => new TimeoutScheduler(100).start(resolve));
      expect(spy.calledOnceWith(constraints as MediaStreamConstraints)).to.be.true;
    });

    it('acquires the display input stream using getDisplayMedia API if the given constraint is not satisfied', async () => {
      // @ts-ignore
      const spy = sinon.spy(navigator.mediaDevices, 'getDisplayMedia');
      const constraints = {
        video: {
          mandatory: {},
        },
      };
      // @ts-ignore
      await deviceController.acquireDisplayInputStream(constraints as MediaStreamConstraints);
      await new Promise(resolve => new TimeoutScheduler(100).start(resolve));
      // @ts-ignore
      expect(spy.calledOnceWith(constraints as MediaStreamConstraints)).to.be.true;
    });
  });

  describe('device changes', () => {
    it('listens to device changes', async () => {
      await deviceController.listAudioInputDevices();
      await deviceController.listVideoInputDevices();
      await deviceController.listAudioOutputDevices();

      let audioInputsChangedCallCount = 0;
      let audioOutputsChangedCallCount = 0;
      let videoInputsChangedCallCount = 0;
      const observer: DeviceChangeObserver = {
        audioInputsChanged: (_freshAudioInputDeviceList?: MediaDeviceInfo[]): void => {
          audioInputsChangedCallCount += 1;
        },
        audioOutputsChanged: (_freshAudioOutputDeviceList?: MediaDeviceInfo[]): void => {
          audioOutputsChangedCallCount += 1;
        },
        videoInputsChanged: (_freshVideoInputDeviceList?: MediaDeviceInfo[]): void => {
          videoInputsChangedCallCount += 1;
        },
      };
      deviceController.addDeviceChangeObserver(observer);

      navigator.mediaDevices.dispatchEvent(new Event('devicechange'));
      await navigator.mediaDevices.dispatchEvent(new Event('devicechange'));
      await new Promise(resolve => new TimeoutScheduler(100).start(resolve));

      deviceController.removeDeviceChangeObserver(observer);
      await navigator.mediaDevices.dispatchEvent(new Event('devicechange'));
      await new Promise(resolve => new TimeoutScheduler(100).start(resolve));

      // Dispatched "devicechange" three times before removing observers.
      expect(audioInputsChangedCallCount).to.equal(2);
      expect(audioOutputsChangedCallCount).to.equal(2);
      expect(videoInputsChangedCallCount).to.equal(2);
    });

    it('does not receive observer methods if the enumerateDevices API returns the same device list', async () => {
      domMockBehavior.deviceCounter = 1;
      domMockBehavior.enumerateDeviceList = [
        getMediaDeviceInfo('1', 'audioinput', 'label'),
        getMediaDeviceInfo('2', 'videoinput', 'label'),
        getMediaDeviceInfo('3', 'audiooutput', 'label'),
      ];

      await deviceController.listAudioInputDevices();
      await deviceController.listVideoInputDevices();
      await deviceController.listAudioOutputDevices();

      let audioInputsChangedCallCount = 0;
      let audioOutputsChangedCallCount = 0;
      let videoInputsChangedCallCount = 0;
      const observer: DeviceChangeObserver = {
        audioInputsChanged: (_freshAudioInputDeviceList?: MediaDeviceInfo[]): void => {
          audioInputsChangedCallCount += 1;
        },
        audioOutputsChanged: (_freshAudioOutputDeviceList?: MediaDeviceInfo[]): void => {
          audioOutputsChangedCallCount += 1;
        },
        videoInputsChanged: (_freshVideoInputDeviceList?: MediaDeviceInfo[]): void => {
          videoInputsChangedCallCount += 1;
        },
      };
      deviceController.addDeviceChangeObserver(observer);

      await navigator.mediaDevices.dispatchEvent(new Event('devicechange'));
      await new Promise(resolve => new TimeoutScheduler(100).start(resolve));

      expect(audioInputsChangedCallCount).to.equal(0);
      expect(audioOutputsChangedCallCount).to.equal(0);
      expect(videoInputsChangedCallCount).to.equal(0);
    });

    it('does not throw an error even when the observer is removed during execution', async () => {
      let callCount = 0;
      await deviceController.listAudioInputDevices();
      const observer: DeviceChangeObserver = {
        audioInputsChanged: (_freshAudioInputDeviceList?: MediaDeviceInfo[]): void => {
          callCount += 1;
        },
      };
      deviceController.addDeviceChangeObserver(observer);
      // The device controller calls observer methods in the next event cycle.
      await navigator.mediaDevices.dispatchEvent(new Event('devicechange'));
      // Right before calling observer methods, remove observers.
      deviceController.removeDeviceChangeObserver(observer);
      await new Promise(resolve => new TimeoutScheduler(100).start(resolve));
      expect(callCount).to.equal(0);
    });
  });

  describe('audio context and web audio', () => {
    it('cannot create the analyser node if no active audio exists', async () => {
      expect(deviceController.createAnalyserNodeForAudioInput()).to.equal(null);
    });

    it('cannot create the raw input analyser node if no active audio exists', async () => {
      expect(deviceController.createAnalyserNodeForRawAudioInput()).to.equal(null);
    });

    it('can create the analyser node if active audio exists', async () => {
      await deviceController.chooseAudioInputDevice(stringDeviceId);
      const node = deviceController.createAnalyserNodeForAudioInput();
      expect(node).to.exist;

      // We would like to do this, but we can't, because our audio nodes aren't real.
      // expect(node.numberOfInputs).to.eq(1);

      // Now clean up.
      node.removeOriginalInputs();

      // Similarly.
      // expect(node.numberOfInputs).to.eq(0);
    });

    it('can create the analyser node for raw input if Web Audio is enabled', async () => {
      enableWebAudio(true);
      await deviceController.chooseAudioInputDevice(stringDeviceId);
      const node = deviceController.createAnalyserNodeForRawAudioInput();
      expect(node).to.exist;

      // Now clean up.
      node.removeOriginalInputs();
    });

    it('can create the analyser node if Web Audio is enabled', async () => {
      enableWebAudio(true);
      await deviceController.chooseAudioInputDevice(stringDeviceId);
      const node = deviceController.createAnalyserNodeForAudioInput();
      expect(node).to.exist;

      // Now clean up.
      node.removeOriginalInputs();
    });

    it('can create the analyser node for the end of a transform', async () => {
      enableWebAudio(true);
      const transform = new MockNodeTransformDevice(stringDeviceId, 1);
      await deviceController.chooseAudioInputDevice(transform);
      const node = deviceController.createAnalyserNodeForAudioInput();
      expect(node).to.exist;

      // Now clean up.
      node.removeOriginalInputs();
    });

    it('can create an audio context without sampleRate', async () => {
      await deviceController.chooseAudioInputDevice(stringDeviceId);
      domMockBehavior.mediaDeviceHasSupportedConstraints = false;
      expect(deviceController.createAnalyserNodeForAudioInput()).to.exist;
    });

    it('can create an audio stream using webkitAudioContext', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const GlobalAny = global as any;
      GlobalAny['window']['webkitAudioContext'] = GlobalAny['window']['AudioContext'];
      delete GlobalAny['window']['AudioContext'];
      await deviceController.chooseAudioInputDevice(stringDeviceId);
      expect(deviceController.createAnalyserNodeForAudioInput()).to.exist;
    });

    it('mixes the audio stream into the audio input when the web audio is enabled', async () => {
      enableWebAudio(true);
      let stream = new MediaStream();
      let node = deviceController.mixIntoAudioInput(stream);
      expect(node.mediaStream).to.equal(stream);

      stream = new MediaStream();
      node = deviceController.mixIntoAudioInput(stream);
      expect(node.mediaStream).to.equal(stream);
    });

    it('does not create an audio source node if the web audio is disabled', async () => {
      enableWebAudio(false);
      const stream = new MediaStream();
      const node = deviceController.mixIntoAudioInput(stream);
      expect(node).to.equal(null);
    });

    it('uses a single instance of AudioContext', () => {
      const audioContext = DefaultDeviceController.getAudioContext();
      const audioContext2 = DefaultDeviceController.getAudioContext();
      expect(audioContext).to.equal(audioContext2);
    });

    it('closes an AudioContext instance and creates a new object', () => {
      const audioContext = DefaultDeviceController.getAudioContext();
      DefaultDeviceController.closeAudioContext();
      const audioContext2 = DefaultDeviceController.getAudioContext();
      expect(audioContext).to.not.equal(audioContext2);
    });
  });

  describe('preview', () => {
    let element: HTMLVideoElement;

    beforeEach(() => {
      const videoElementFactory = new NoOpVideoElementFactory();
      element = videoElementFactory.create();
    });

    it('connects the video stream to the video element', async () => {
      const spy = sinon.spy(DefaultVideoTile, 'connectVideoStreamToVideoElement');
      await deviceController.chooseVideoInputDevice(stringDeviceId);
      deviceController.startVideoPreviewForVideoInput(element);
      await new Promise(resolve => new TimeoutScheduler(100).start(resolve));
      expect(spy.calledOnce).to.be.true;
      spy.restore();
    });

    it('cannot connect the video stream to the video element if getUserMedia API fails', async () => {
      const spy = sinon.spy(DefaultVideoTile, 'connectVideoStreamToVideoElement');
      await deviceController.chooseVideoInputDevice(stringDeviceId);
      domMockBehavior.getUserMediaSucceeds = false;
      deviceController.startVideoPreviewForVideoInput(element);
      await new Promise(resolve => new TimeoutScheduler(100).start(resolve));
      expect(spy.called).to.be.false;
      spy.restore();
    });

    it('does not disconnect or connect the video stream for preview if no active video exsits', async () => {
      const spy1 = sinon.spy(DefaultVideoTile, 'disconnectVideoStreamFromVideoElement');
      const spy2 = sinon.spy(DefaultVideoTile, 'connectVideoStreamToVideoElement');
      deviceController.startVideoPreviewForVideoInput(element);
      await new Promise(resolve => new TimeoutScheduler(100).start(resolve));
      expect(spy1.called).to.be.false;
      expect(spy2.called).to.be.false;
      spy1.restore();
      spy2.restore();
    });

    it('disconnects the video stream of the given element', async () => {
      const spy = sinon.spy(DefaultVideoTile, 'disconnectVideoStreamFromVideoElement');
      await deviceController.chooseVideoInputDevice(stringDeviceId);
      const stream = await deviceController.acquireVideoInputStream();
      // @ts-ignore
      element.srcObject = stream;
      deviceController.stopVideoPreviewForVideoInput(element);
      await new Promise(resolve => new TimeoutScheduler(100).start(resolve));
      expect(spy.calledOnceWith(element, false)).to.be.true;
    });

    it('releases the video stream of the active video input', async () => {
      deviceController.bindToAudioVideoController(audioVideoController);
      await deviceController.chooseVideoInputDevice(stringDeviceId);
      deviceController.stopVideoPreviewForVideoInput(element);
      await new Promise(resolve => new TimeoutScheduler(100).start(resolve));

      try {
        await deviceController.acquireVideoInputStream();
        throw new Error('This line should not be reached.');
      } catch (error) {
        expect(error.message).includes(`no video device chosen, stopping local video tile`);
      }
    });
  });

  describe('device trigger', () => {
    it('sets the device trigger', async () => {
      let called = false;
      deviceController.setDeviceLabelTrigger(async () => {
        called = true;
        return new MediaStream();
      });
      await deviceController.listAudioInputDevices();
      await new Promise(resolve => new TimeoutScheduler(100).start(resolve));
      expect(called).to.be.true;
    });
  });

  describe('synthesize devices', () => {
    it('can create a black video device', async () => {
      const stream = new MediaStream();
      const track = new MediaStreamTrack();
      stream.addTrack(track);

      domMockBehavior.createElementCaptureStream = stream;
      const device: VideoInputDevice = DefaultDeviceController.createEmptyVideoDevice();
      expect(device).to.equal(stream);
      await new Promise(resolve => new TimeoutScheduler(1500).start(resolve));

      track.stop();
      await new Promise(resolve => new TimeoutScheduler(100).start(resolve));
    });

    it('can create a smpte video device', async () => {
      const stream = new MediaStream();
      const track = new MediaStreamTrack();
      stream.addTrack(track);

      domMockBehavior.createElementCaptureStream = stream;
      const device: VideoInputDevice = DefaultDeviceController.synthesizeVideoDevice('smpte');
      await new Promise(resolve => new TimeoutScheduler(1500).start(resolve));
      expect(device).to.equal(stream);

      track.stop();
      await new Promise(resolve => new TimeoutScheduler(100).start(resolve));
    });

    it('cannot create an empty video device if the stream is not available in the canvas', () => {
      domMockBehavior.createElementCaptureStream = undefined;
      const device: VideoInputDevice = DefaultDeviceController.synthesizeVideoDevice('smpte');
      expect(device).to.equal(null);
    });

    it('synthesizes the audio device', async () => {
      DefaultDeviceController.synthesizeAudioDevice(100);
      await new Promise(resolve => new TimeoutScheduler(100).start(resolve));
    });

    it('succeeds even when using the sample rate outside the supported range', async () => {
      domMockBehavior.mediaDeviceHasSupportedConstraints = false;
      domMockBehavior.audioContextDefaultSampleRate = Infinity;
      try {
        DefaultDeviceController.synthesizeAudioDevice(0);
      } catch (error) {
        throw new Error('This line should not be reached.');
      }
    });

    it('fails if the create buffer throws a non-NotSupportedError error', async () => {
      domMockBehavior.audioContextCreateBufferSucceeds = false;
      try {
        DefaultDeviceController.synthesizeAudioDevice(0);
        throw new Error('This line should not be reached.');
      } catch (error) {
        expect(error.name).to.not.equal('NotSupportedError');
      }
    });
  });

  describe('input stream ended event', () => {
    it('audio input stream ended', async () => {
      let audioInputStreamEndedCallCount = 0;
      const observer: DeviceChangeObserver = {
        audioInputStreamEnded: (_deviceId: string): void => {
          audioInputStreamEndedCallCount += 1;
        },
      };
      deviceController.addDeviceChangeObserver(observer);
      await deviceController.chooseAudioInputDevice(stringDeviceId);
      const stream = await deviceController.acquireAudioInputStream();
      stream.getAudioTracks()[0].stop();
      await new Promise(resolve => new TimeoutScheduler(100).start(resolve));
      expect(audioInputStreamEndedCallCount).to.equal(1);
    });

    it('video input stream ended and stop local video if it started', async () => {
      let videoInputStreamEndedCallCount = 0;
      const observer: DeviceChangeObserver = {
        videoInputStreamEnded: (_deviceId: string): void => {
          videoInputStreamEndedCallCount += 1;
        },
      };
      deviceController.addDeviceChangeObserver(observer);
      const spy = sinon.spy(audioVideoController.videoTileController, 'stopLocalVideoTile');
      deviceController.bindToAudioVideoController(audioVideoController);
      await deviceController.chooseVideoInputDevice(stringDeviceId);
      audioVideoController.videoTileController.startLocalVideoTile();
      const stream = await deviceController.acquireVideoInputStream();
      stream.getVideoTracks()[0].stop();
      await new Promise(resolve => new TimeoutScheduler(100).start(resolve));
      expect(videoInputStreamEndedCallCount).to.equal(1);
      expect(spy.called).to.be.true;
    });

    it('video input stream ended but do not need to stop local video if it did not start', async () => {
      let videoInputStreamEndedCallCount = 0;
      const observer: DeviceChangeObserver = {
        videoInputStreamEnded: (_deviceId: string): void => {
          videoInputStreamEndedCallCount += 1;
        },
      };
      deviceController.addDeviceChangeObserver(observer);
      const spy = sinon.spy(audioVideoController.videoTileController, 'stopLocalVideoTile');
      deviceController.bindToAudioVideoController(audioVideoController);
      await deviceController.chooseVideoInputDevice(stringDeviceId);
      const stream = await deviceController.acquireVideoInputStream();
      stream.getVideoTracks()[0].stop();
      await new Promise(resolve => new TimeoutScheduler(100).start(resolve));
      expect(videoInputStreamEndedCallCount).to.equal(1);
      expect(spy.called).to.be.false;
    });
  });

  describe('getUserMedia failures', () => {
    it('receives the unknown error message if the error does not exist', done => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaError = null;
      audioVideoController.addObserver({
        eventDidReceive(name: EventName, attributes: EventAttributes): void {
          expect(name).to.equal('audioInputFailed');
          expect(attributes.audioInputErrorMessage).includes('UnknownError');
          done();
        },
      });
      deviceController.bindToAudioVideoController(audioVideoController);
      deviceController.chooseAudioInputDevice(stringDeviceId);
    });

    it('receives the error name and the message', done => {
      const errorMessage = 'Permission denied';
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaError = new MockError('NotAllowedError', errorMessage);
      audioVideoController.addObserver({
        eventDidReceive(name: EventName, attributes: EventAttributes): void {
          expect(name).to.equal('audioInputFailed');
          expect(attributes.audioInputErrorMessage).includes(errorMessage);
          expect(attributes.audioInputErrorMessage).includes('NotAllowedError');
          done();
        },
      });
      deviceController.bindToAudioVideoController(audioVideoController);
      deviceController.chooseAudioInputDevice(stringDeviceId);
    });

    it('receives the error name only if the message is empty', done => {
      const errorMessage = '';
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaError = new MockError('NotAllowedError', errorMessage);
      audioVideoController.addObserver({
        eventDidReceive(name: EventName, attributes: EventAttributes): void {
          expect(name).to.equal('audioInputFailed');
          expect(attributes.audioInputErrorMessage).to.equal('NotAllowedError');
          done();
        },
      });
      deviceController.bindToAudioVideoController(audioVideoController);
      deviceController.chooseAudioInputDevice(stringDeviceId);
    });

    it('receives the error message only if the error name is empty', done => {
      const errorMessage = 'Permission denied';
      const error = new MockError('NotAllowedError', errorMessage);
      error.name = '';
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaError = error;
      audioVideoController.addObserver({
        eventDidReceive(name: EventName, attributes: EventAttributes): void {
          expect(name).to.equal('audioInputFailed');
          expect(attributes.audioInputErrorMessage).includes(errorMessage);
          done();
        },
      });
      deviceController.bindToAudioVideoController(audioVideoController);
      deviceController.chooseAudioInputDevice(stringDeviceId);
    });
  });
});
