// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

//@ts-nocheck

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';

import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import DeviceChangeObserver from '../../src/devicechangeobserver/DeviceChangeObserver';
import AudioInputDevice from '../../src/devicecontroller/AudioInputDevice';
import AudioTransformDevice from '../../src/devicecontroller/AudioTransformDevice';
import DefaultDeviceController from '../../src/devicecontroller/DefaultDeviceController';
import GetUserMediaError from '../../src/devicecontroller/GetUserMediaError';
import NotFoundError from '../../src/devicecontroller/NotFoundError';
import NotReadableError from '../../src/devicecontroller/NotReadableError';
import OverconstrainedError from '../../src/devicecontroller/OverconstrainedError';
import PermissionDeniedError from '../../src/devicecontroller/PermissionDeniedError';
import TypeError from '../../src/devicecontroller/TypeError';
import VideoInputDevice from '../../src/devicecontroller/VideoInputDevice';
import EventAttributes from '../../src/eventcontroller/EventAttributes';
import EventController from '../../src/eventcontroller/EventController';
import EventName from '../../src/eventcontroller/EventName';
import NoOpLogger from '../../src/logger/NoOpLogger';
import MediaDeviceProxyHandler from '../../src/mediadevicefactory/MediaDeviceProxyHandler';
import { wait as delay } from '../../src/utils/Utils';
import NoOpVideoElementFactory from '../../src/videoelementfactory/NoOpVideoElementFactory';
import DefaultVideoTransformDevice from '../../src/videoframeprocessor/DefaultVideoTransformDevice';
import NoOpVideoFrameProcessor from '../../src/videoframeprocessor/NoOpVideoFrameProcessor';
import VideoFrameBuffer from '../../src/videoframeprocessor/VideoFrameBuffer';
import DefaultVideoTile from '../../src/videotile/DefaultVideoTile';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder, {
  MockMediaStream,
  StoppableMediaStreamTrack,
} from '../dommock/DOMMockBuilder';
import MockError from '../dommock/MockError';
import UserMediaState from '../dommock/UserMediaState';
import {
  MockNodeTransformDevice,
  MockPassthroughTransformDevice,
  MockThrowingTransformDevice,
  MutingTransformDevice,
} from '../transformdevicemock/MockTransformDevice';
import WatchingLogger from './WatchingLogger';

chai.use(chaiAsPromised);
chai.should();

describe('DefaultDeviceController', () => {
  const assert: Chai.AssertStatic = chai.assert;
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpLogger();
  const stringDeviceId = 'string-device-id';

  let deviceController: DefaultDeviceController;
  let audioVideoController: NoOpAudioVideoController;
  let domMockBuilder: DOMMockBuilder;
  let domMockBehavior: DOMMockBehavior;
  let eventController: EventController;

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

  function anyDevicesAreUnlabeled(devices: MediaDeviceInfo[]): boolean {
    return devices.some(device => !device.label);
  }

  function anyDeviceHasId(devices: MediaDeviceInfo[], deviceId: string): boolean {
    return devices.some(device => device.deviceId === deviceId);
  }

  function setupMockCaptureStream(): void {
    const mediaStream = new MediaStream();
    mediaStream.addTrack(new MediaStreamTrack());
    domMockBehavior.createElementCaptureStream = mediaStream;
  }

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    deviceController = new DefaultDeviceController(logger, { enableWebAudio: false });
    audioVideoController = new NoOpAudioVideoController();
    deviceController.eventController = audioVideoController.eventController;
    eventController = deviceController.eventController;
  });

  afterEach(() => {
    DefaultDeviceController.closeAudioContext();
    if (domMockBuilder) {
      domMockBuilder.cleanup();
    }
  });

  describe('broken', () => {
    it('does not break things when failing to init.', async () => {
      domMockBehavior = new DOMMockBehavior();
      domMockBehavior.mediaDevicesSupported = false;
      domMockBuilder = new DOMMockBuilder(domMockBehavior);

      const ddc = new DefaultDeviceController(logger);

      const obs: DeviceChangeObserver = {};
      ddc.addDeviceChangeObserver(obs);
      ddc.removeDeviceChangeObserver(obs);

      await ddc.destroy();
    });
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

  describe('disposal', () => {
    it('unsubscribes from streams and global when disposed', async () => {
      const gUM = sinon.spy(navigator.mediaDevices, 'getUserMedia');

      await deviceController.listAudioInputDevices();
      await deviceController.startAudioInput('abcdef');

      const device = await gUM.returnValues.pop();
      expect(device.getAudioTracks().length).to.equal(1);

      // @ts-ignore
      expect(device.getAudioTracks()[0].listeners['ended'].length).to.equal(1);

      await deviceController.startVideoInput('vabcdef');

      await deviceController.destroy();

      await delay(1);

      // @ts-ignore
      expect(device.getAudioTracks()[0].listeners['ended'].length).to.equal(0);

      // Calling it again is safe.
      await deviceController.destroy();
    });

    it('unsubscribes from transform devices and global when disposed', async () => {
      enableWebAudio(true);

      const gUM = sinon.spy(navigator.mediaDevices, 'getUserMedia');

      const tf = new MockNodeTransformDevice('abdef', 1);
      await deviceController.startAudioInput(tf);

      // @ts-ignore
      expect(deviceController.audioInputSourceNode).to.not.be.undefined;

      const device = await gUM.returnValues.pop();
      expect(device.getAudioTracks().length).to.equal(1);

      // @ts-ignore
      expect(device.getAudioTracks()[0].listeners['ended'].length).to.equal(1);

      await deviceController.destroy();

      await delay(1);

      // @ts-ignore
      expect(deviceController.audioInputSourceNode).to.be.undefined;

      // @ts-ignore
      expect(device.getAudioTracks()[0].listeners['ended'].length).to.equal(0);

      // Calling it again is safe.
      await deviceController.destroy();
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

    it('lists devices after observers exist', async () => {
      const obs: DeviceChangeObserver = {};
      await deviceController.addDeviceChangeObserver(obs);

      // @ts-ignore
      const spy = sinon.spy(deviceController, 'updateDeviceInfoCacheFromBrowser');

      expect(spy.called).to.be.false;

      // This will establish the cache.
      await deviceController.listVideoInputDevices();

      // @ts-ignore
      expect(deviceController.deviceInfoCache).to.not.be.null;
      expect(spy.calledOnce).to.be.true;

      // This will use it.
      const devices = await deviceController.listAudioInputDevices();
      expect(spy.calledOnce).to.be.true;

      expect(devices.length).to.equal(2);
      for (const device of devices) {
        expect(device.kind).to.equal('audioinput');
      }
    });

    it('updates cache after cache established only with forceUpdate set to true', async () => {
      deviceController.setDeviceLabelTrigger(async () => {
        called = true;
        return new MediaStream();
      });

      domMockBehavior.enumerateDeviceList = [
        getMediaDeviceInfo('deviceId1', 'audioinput', '', 'group-id-1'),
      ];

      // This will establish the cache with empty label.
      let devices: MediaDeviceInfo[] = await deviceController.listAudioInputDevices();

      // @ts-ignore
      expect(deviceController.deviceInfoCache).to.not.be.null;
      expect(anyDevicesAreUnlabeled(devices)).to.be.true;

      // @ts-ignore
      expect(deviceController.isWatchingForDeviceChanges()).to.be.false;

      // This will set `isWatchingForDeviceChanges` to be true to avoid undesired `deviceLabelTrigger` call.
      const device: AudioInputDevice = { deviceId: 'deviceId1' };
      await deviceController.startAudioInput(device);

      let called = false;

      // @ts-ignore
      expect(deviceController.isWatchingForDeviceChanges()).to.be.true;

      // Update the mocked list to check the `enumerateDevices` call later.
      domMockBehavior.enumerateDeviceList = [
        getMediaDeviceInfo('deviceId2', 'audioinput', '', 'group-id-2'),
      ];

      devices = await deviceController.listAudioInputDevices(false);
      expect(anyDeviceHasId(devices, 'deviceId2')).to.be.false;
      expect(called).to.be.equal(false);

      devices = await deviceController.listAudioInputDevices(true);
      expect(anyDeviceHasId(devices, 'deviceId2')).to.be.true;
      expect(called).to.be.equal(true);
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
      const width = 640;
      const height = 360;
      const frameRate = 15;
      deviceController.chooseVideoInputQuality(width, height, frameRate);

      // @ts-ignore
      const constraints: MediaTrackConstraints = {};
      await deviceController.startVideoInput(constraints);

      expect(JSON.stringify(constraints.width)).to.equal(JSON.stringify({ ideal: width }));
      expect(JSON.stringify(constraints.height)).to.equal(JSON.stringify({ ideal: height }));
      expect(JSON.stringify(constraints.frameRate)).to.equal(JSON.stringify({ ideal: frameRate }));
    });

    it('adjusts width and height if required', async () => {
      // @ts-ignore
      navigator.userAgent = 'android pixel 3';
      deviceController = new DefaultDeviceController(logger);

      const width = 540;
      const height = 540;
      deviceController.chooseVideoInputQuality(width, height, 15);

      // @ts-ignore
      const constraints: MediaTrackConstraints = {};
      await deviceController.startVideoInput(constraints);

      expect(JSON.stringify(constraints.width)).to.equal(JSON.stringify({ ideal: 576 }));
      expect(JSON.stringify(constraints.height)).to.equal(JSON.stringify({ ideal: 576 }));
    });
  });

  describe('getVideoInputQuality', () => {
    it('get video input quality settings', async () => {
      const width = 640;
      const height = 360;
      const frameRate = 15;
      deviceController.chooseVideoInputQuality(width, height, frameRate);

      const videoInputQualitySettings = deviceController.getVideoInputQualitySettings();
      expect(videoInputQualitySettings.videoWidth).to.equal(width);
      expect(videoInputQualitySettings.videoHeight).to.equal(height);
      expect(videoInputQualitySettings.videoFrameRate).to.equal(frameRate);
    });

    it('get default video input quality settings', async () => {
      const videoInputQualitySettings = deviceController.getVideoInputQualitySettings();
      expect(videoInputQualitySettings.videoWidth).to.equal(960);
      expect(videoInputQualitySettings.videoHeight).to.equal(540);
      expect(videoInputQualitySettings.videoFrameRate).to.equal(15);
    });
  });

  describe('transform mute subscription', () => {
    it('No error if audio transform device is undefined', async () => {
      enableWebAudio(true);
      await deviceController.startAudioInput('foobar');

      deviceController.muteLocalAudioInputStream();
      deviceController.muteLocalAudioInputStream();
      deviceController.unmuteLocalAudioInputStream();
    });

    it('subscribes to mute', async () => {
      enableWebAudio(true);
      const device = new MutingTransformDevice('foo');
      await deviceController.startAudioInput(device);

      deviceController.muteLocalAudioInputStream();
      deviceController.muteLocalAudioInputStream();
      deviceController.unmuteLocalAudioInputStream();
      deviceController.unmuteLocalAudioInputStream();
      deviceController.muteLocalAudioInputStream();
      deviceController.muteLocalAudioInputStream();

      expect(device.muted).to.deep.equal([true, false, true]);
    });
  });

  describe('startAudioInput transform device permissions', () => {
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
        await deviceController.startAudioInput(device);
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
        await deviceController.startAudioInput(device);
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

  describe('handling broken audio contexts', async () => {
    afterEach(() => {
      // @ts-ignore
      // Singletons are painful.
      DefaultDeviceController.audioContext = undefined;
    });

    it('throws for stopped contexts', async () => {
      enableWebAudio(true);
      const device: AudioTransformDevice = new MockNodeTransformDevice(null);

      const context = DefaultDeviceController.getAudioContext();
      context.close();

      const choose = deviceController.startAudioInput(device);
      expect(choose).to.eventually.be.rejectedWith(
        'Cannot choose a transform device with a closed audio context.'
      );
    });

    it('resumes suspended contexts', async () => {
      enableWebAudio(true);
      const device: AudioTransformDevice = new MockNodeTransformDevice(null);

      const context = DefaultDeviceController.getAudioContext();
      context.suspend();

      await deviceController.startAudioInput(device);
      expect(context.state).to.equal('running');
    });

    it('does nothing for suspended offline contexts', async () => {
      enableWebAudio(true);
      const device: AudioTransformDevice = new MockNodeTransformDevice(null);

      // @ts-ignore
      const offline = new OfflineAudioContext();

      // @ts-ignore
      DefaultDeviceController.audioContext = offline;

      const choose = deviceController.startAudioInput(device);
      expect(choose).to.eventually.be.rejectedWith('Error fetching device.');
    });
  });

  describe('releasing', async () => {
    it('idempotently releases transform devices', async () => {
      deviceController = new DefaultDeviceController(logger, { enableWebAudio: true });

      const transform = new MockNodeTransformDevice('default');
      await deviceController.startAudioInput(transform);

      deviceController.stopAudioInput();
      deviceController.stopAudioInput();
    });
  });

  describe('startAudioInput handling an OverconstrainedError', () => {
    it('logs appropriately', async () => {
      const watcher = new WatchingLogger('Over-constrained by constraint: testconstraint');
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.OverconstrainedError;
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      deviceController = new DefaultDeviceController(watcher);

      try {
        await deviceController.startAudioInput('whatever');
        throw new Error('This line should not be reached');
      } catch (e) {
        expect(e.message).to.not.equal('This line should not be reached');
      }
      expect(watcher.matches.length).to.equal(1);
    });
  });

  describe('startAudioInput with transform', () => {
    it('rejects a transform device with Web Audio disabled', async () => {
      enableWebAudio(false);
      const device: AudioTransformDevice = new MockPassthroughTransformDevice(null);
      try {
        await deviceController.startAudioInput(device);
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
        await deviceController.startAudioInput(device);
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
        await deviceController.startAudioInput(device);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
      expect(deviceController.hasAppliedTransform()).to.be.true;
    });

    it('chooses a transform device that does return a node', async () => {
      enableWebAudio(true);
      const device: AudioTransformDevice = new MockNodeTransformDevice(null);
      try {
        await deviceController.startAudioInput(device);
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
        await deviceController.startAudioInput(device);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
      try {
        await deviceController.startAudioInput(device);
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
        deviceController.startAudioInput(first).catch(e => e),
        deviceController.startAudioInput(second).catch(e => e),
      ]);

      expect(results.length).to.equal(2);

      const errors = results.filter(val => val instanceof Error);

      expect(errors.length).to.equal(0);

      expect(deviceController.hasAppliedTransform()).to.be.true;
    });
  });

  describe('startAudioInput twice', () => {
    it('allows replacement no-node -> node', async () => {
      enableWebAudio(true);

      expect(deviceController.hasAppliedTransform()).to.be.false;
      const passthrough: AudioTransformDevice = new MockPassthroughTransformDevice('passthrough');
      const stopSpy = sinon.spy(passthrough, 'stop');

      try {
        await deviceController.startAudioInput(passthrough);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
      expect(stopSpy.notCalled).to.be.true;
      expect(deviceController.hasAppliedTransform()).to.be.true;

      const noded: AudioTransformDevice = new MockNodeTransformDevice('noded');
      try {
        await deviceController.startAudioInput(noded);
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
        await deviceController.startAudioInput(device);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
      expect(stopSpy.notCalled).to.be.true;
      expect(deviceController.hasAppliedTransform()).to.be.true;

      const noded: AudioTransformDevice = new MockNodeTransformDevice('noded');
      try {
        deviceController.startAudioInput(noded);
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
        await deviceController.startAudioInput(device);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
      expect(stopSpy.notCalled).to.be.true;
      expect(deviceController.hasAppliedTransform()).to.be.true;

      try {
        await deviceController.startAudioInput('simple');
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
        await deviceController.startAudioInput(device);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
      expect(stopSpy.notCalled).to.be.true;
      expect(deviceController.hasAppliedTransform()).to.be.true;

      try {
        await deviceController.startAudioInput('simple');
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
      expect(stopSpy.notCalled).to.be.true;
      expect(deviceController.hasAppliedTransform()).to.be.false;
    });
  });

  describe('startAudioInput', () => {
    it('chooses no device', async () => {
      const device: AudioInputDevice = null;
      try {
        await deviceController.startAudioInput(device);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
    });

    it('pass undefined device', async () => {
      try {
        const logSpy = sinon.spy(logger, 'error');
        await deviceController.startAudioInput(undefined);
        expect(logSpy.calledOnce);
        logSpy.restore();
      } catch (e) {
        throw new Error('This line should not be reached');
      }
    });

    it('chooses an audio device', async () => {
      const device: AudioInputDevice = { deviceId: 'string-device-id' };
      try {
        await deviceController.startAudioInput(device);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
    });

    it('when denied permission by browser, it defaults to null device', async () => {
      let device: AudioInputDevice = { deviceId: 'string-device-id-1' };
      try {
        await deviceController.startAudioInput(device);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
      const audioStream1 = await deviceController.acquireAudioInputStream();
      expect(audioStream1.id).to.not.equal('destination-stream-id');

      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.PermissionDeniedError;
      device = { deviceId: 'string-device-id-2' };
      try {
        await deviceController.startAudioInput(device);
      } catch (e) {
        expect(e).to.be.instanceOf(PermissionDeniedError);
      }
      const audioStream2 = await deviceController.acquireAudioInputStream();
      expect(audioStream2.id).to.equal('destination-stream-id');
    });

    it('Send audio input changed event', async () => {
      let callbackAudioStream = undefined;

      const observer = {
        selectedAudioInputDidChanged(audioStream: MediaStream | undefined): void {
          callbackAudioStream = audioStream;
        },
      };

      deviceController.addMediaStreamBrokerObserver(observer);
      try {
        const audioStream = await deviceController.startAudioInput(stringDeviceId);
        expect(callbackAudioStream).to.deep.equal(audioStream);
      } catch (e) {
        throw new Error('This line should not be reached.');
      } finally {
        deviceController.removeDeviceChangeObserver(observer);
      }
    });

    it('attaches the audio input stream to the audio context', async () => {
      enableWebAudio(true);
      try {
        await deviceController.startAudioInput(stringDeviceId);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }

      // The previous audio source node will be disconneted.
      try {
        await deviceController.startAudioInput('another-device-id');
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
    });

    it('Do not log error if choose null device with no device cache', () => {
      const e = sinon.spy(logger, 'error');
      const i = sinon.spy(logger, 'info');
      const w = sinon.spy(logger, 'warn');

      deviceController.startAudioInput(null);

      expect(e.notCalled).to.be.true;
      expect(i.called).to.be.true;
      expect(w.notCalled).to.be.true;

      e.restore();
      i.restore();
      w.restore();
    });

    it('Do not log error if choose a media stream without device Id with no device cache', () => {
      const e = sinon.spy(logger, 'error');
      const i = sinon.spy(logger, 'info');
      const w = sinon.spy(logger, 'warn');

      deviceController.startAudioInput(new MediaStream());

      expect(e.notCalled).to.be.true;
      expect(i.called).to.be.true;
      expect(w.notCalled).to.be.true;

      e.restore();
      i.restore();
      w.restore();
    });

    it('Use groupdId from device cache', async () => {
      // In rare case (e.g., Edge browser), the media stream setting can return different groupId than enumerateDevices
      // Thus, we will try to set groupId from the device cache using the deviceId from the media stream.
      domMockBehavior.mediaStreamTrackSettings = {
        deviceId: 'device-Id',
        groupId: 'group-Id2',
      };

      const mediaDeviceInfo = Object.create(
        getMediaDeviceInfo('device-Id', 'audioinput', 'label', 'group-Id1')
      );
      domMockBehavior.enumerateDeviceList = [mediaDeviceInfo];
      domMockBuilder = new DOMMockBuilder(domMockBehavior);

      // @ts-ignore
      const spy = sinon.spy(deviceController, 'chooseInputIntrinsicDevice');
      const gUM = sinon.spy(navigator.mediaDevices, 'getUserMedia');
      try {
        await deviceController.listAudioInputDevices();
        await deviceController.startAudioInput(mediaDeviceInfo);
        // This should reselect the previous selected audio
        await deviceController.startAudioInput(mediaDeviceInfo);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
      expect(gUM.calledOnce).to.be.true;
      expect(spy.calledTwice).to.be.true;
      gUM.restore();
      spy.restore();
    });

    it('releases audio media stream when requesting default device and default is already active in chromium based browser', async () => {
      enableWebAudio(true);
      domMockBehavior.browserName = 'chrome';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      deviceController = new DefaultDeviceController(logger);
      domMockBehavior.enumerateDeviceList = [
        getMediaDeviceInfo('default', 'audioinput', 'label', 'group-id-1'),
      ];
      domMockBehavior.mediaStreamTrackSettings = {
        deviceId: 'default',
        groupId: 'group-id-1',
      };
      await deviceController.listAudioInputDevices();
      try {
        await deviceController.startAudioInput('default');
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
      domMockBehavior.enumerateDeviceList.pop();
      // add external default device
      domMockBehavior.enumerateDeviceList.push(
        getMediaDeviceInfo('default', 'audioinput', 'default - label2', 'group-id-2')
      );
      domMockBehavior.mediaStreamTrackSettings = {
        deviceId: 'default',
        groupId: 'group-id-2',
      };
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      try {
        await deviceController.startAudioInput('default');
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
    });

    it('Can startAudioInput if pass in MediaDeviceInfo', async () => {
      domMockBehavior.mediaStreamTrackSettings = {
        deviceId: 'device-Id',
        groupId: 'group-Id',
      };
      const mediaDeviceInfo = Object.create(
        getMediaDeviceInfo('device-Id', 'audioinput', 'label', 'group-Id')
      );
      domMockBehavior.enumerateDeviceList = [mediaDeviceInfo];
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      // @ts-ignore
      const spy = sinon.spy(deviceController, 'chooseInputIntrinsicDevice');
      try {
        await deviceController.listAudioInputDevices();
        await deviceController.startAudioInput(mediaDeviceInfo);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
      expect(spy.calledOnce).to.be.true;
    });

    it('Can startAudioInput if pass in media stream', async () => {
      const mockAudioStream = getMediaStreamDevice('sample');
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      // @ts-ignore
      const spy = sinon.spy(deviceController, 'chooseInputIntrinsicDevice');
      try {
        await deviceController.startAudioInput(mockAudioStream);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
      expect(spy.calledOnce).to.be.true;
    });

    it('sets to null device when an external device disconnects', async () => {
      enableWebAudio(true);
      try {
        await deviceController.startAudioInput(stringDeviceId);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }

      // The previous audio source node will be disconnected.
      try {
        await deviceController.startAudioInput(null);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
    });

    it('releases all previously-acquired audio streams', async () => {
      const stringDeviceIds: AudioInputDevice[] = [
        'device-id-1',
        'device-id-2',
        'device-id-3',
        'device-id-4',
      ];

      // @ts-ignore
      const spy = sinon.spy(deviceController, 'stopTracksAndRemoveCallbacks');
      await deviceController.startAudioInput(stringDeviceIds[0]);
      await deviceController.startAudioInput(stringDeviceIds[1]);
      await deviceController.startAudioInput(stringDeviceIds[2]);
      await deviceController.startAudioInput(stringDeviceIds[3]);

      expect(spy.callCount).to.equal(3);
    });

    it('reuse existing device if passing in the same device id', async () => {
      domMockBehavior.enumerateDeviceList = [
        getMediaDeviceInfo('deviceId1', 'audioinput', 'label', 'group-id-1'),
        getMediaDeviceInfo('deviceId2', 'audioinput', 'label', 'group-id-2'),
      ];
      domMockBehavior.mediaStreamTrackSettings = {
        deviceId: 'deviceId1',
        groupId: 'group-id-1',
      };
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      deviceController = new DefaultDeviceController(logger);
      await deviceController.listAudioInputDevices();
      const spy = sinon.spy(navigator.mediaDevices, 'getUserMedia');
      try {
        await deviceController.startAudioInput('deviceId1');
        await deviceController.startAudioInput('deviceId1');
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
      expect(spy.calledOnce).to.be.true;
    });

    it('do not reuse existing device if passing in the same device constraint', async () => {
      domMockBehavior.enumerateDeviceList = [
        getMediaDeviceInfo('deviceId1', 'audioinput', 'label', 'group-id-1'),
        getMediaDeviceInfo('deviceId12', 'audioinput', 'label', 'group-id-2'),
      ];
      domMockBehavior.mediaStreamTrackSettings = {
        deviceId: 'deviceId1',
        groupId: 'group-id-1',
      };
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      deviceController = new DefaultDeviceController(logger);
      await deviceController.listAudioInputDevices();
      const spy = sinon.spy(navigator.mediaDevices, 'getUserMedia');
      const constraints: MediaTrackConstraints = {
        deviceId: ['deviceId1', 'deviceId2'],
        sampleRate: 44100,
      };
      try {
        await deviceController.startAudioInput(constraints);
        await deviceController.startAudioInput(constraints);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
      expect(spy.calledTwice).to.be.true;
    });

    it('reuse existing device if groupId is not available', async () => {
      domMockBehavior.browserName = 'samsung';
      domMockBehavior.enumerateDeviceList = [
        getMediaDeviceInfo('deviceId1', 'audioinput', 'label', ''),
        getMediaDeviceInfo('deviceId12', 'audioinput', 'label', ''),
      ];
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      deviceController = new DefaultDeviceController(logger);
      await deviceController.listAudioInputDevices();
      const spy = sinon.spy(navigator.mediaDevices, 'getUserMedia');
      try {
        await deviceController.startAudioInput('deviceId1');
        await deviceController.startAudioInput('deviceId1');
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
      expect(spy.calledOnce).to.be.true;
    });
  });

  describe('handleGetUserMediaError', () => {
    it('NotReadableError', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.NotReadableError;

      try {
        await deviceController.startVideoInput(stringDeviceId);
        throw new Error('This line should not be reached');
      } catch (e) {
        expect(e).to.be.instanceof(NotReadableError);
        expect(e.name).to.be.equal('NotReadableError');
      }
    });

    it('TrackStartError', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.TrackStartError;

      try {
        await deviceController.startVideoInput(stringDeviceId);
        throw new Error('This line should not be reached');
      } catch (e) {
        expect(e).to.be.instanceof(NotReadableError);
        expect(e.name).to.be.equal('NotReadableError');
      }
    });

    it('NotFoundError', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.NotFoundError;

      try {
        await deviceController.startVideoInput(stringDeviceId);
        throw new Error('This line should not be reached');
      } catch (e) {
        expect(e).to.be.instanceof(NotFoundError);
        expect(e.name).to.be.equal('NotFoundError');
        expect(e.message).to.not.equal('This line should not be reached');
      }
    });

    it('DevicesNotFoundError', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.DevicesNotFoundError;

      try {
        await deviceController.startVideoInput(stringDeviceId);
        throw new Error('This line should not be reached');
      } catch (e) {
        expect(e).to.be.instanceof(NotFoundError);
        expect(e.name).to.be.equal('NotFoundError');
        expect(e.message).to.not.equal('This line should not be reached');
      }
    });

    it('NotAllowedError', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.TrackStartError;

      try {
        await deviceController.startVideoInput(stringDeviceId);
        throw new Error('This line should not be reached');
      } catch (e) {
        expect(e).to.be.instanceof(NotReadableError);
        expect(e.name).to.be.equal('NotReadableError');
        expect(e.message).to.not.equal('This line should not be reached');
      }
    });

    it('OverconstrainedError', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.OverconstrainedError;

      try {
        await deviceController.startVideoInput(stringDeviceId);
        throw new Error('This line should not be reached');
      } catch (e) {
        expect(e).to.be.instanceof(OverconstrainedError);
        expect(e.name).to.be.equal('OverconstrainedError');
        expect(e.message).to.not.equal('This line should not be reached');
      }
    });

    it('ConstraintNotSatisfiedError', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.ConstraintNotSatisfiedError;

      try {
        await deviceController.startVideoInput(stringDeviceId);
        throw new Error('This line should not be reached');
      } catch (e) {
        expect(e).to.be.instanceof(OverconstrainedError);
        expect(e.name).to.be.equal('OverconstrainedError');
        expect(e.message).to.not.equal('This line should not be reached');
      }
    });

    it('TypeError', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.TypeError;

      try {
        await deviceController.startVideoInput(stringDeviceId);
        throw new Error('This line should not be reached');
      } catch (e) {
        expect(e).to.be.instanceof(TypeError);
        expect(e.name).to.be.equal('TypeError');
        expect(e.message).to.not.equal('This line should not be reached');
      }
    });

    it('AbortError', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.AbortError;

      try {
        await deviceController.startVideoInput(stringDeviceId);
        throw new Error('This line should not be reached');
      } catch (e) {
        expect(e).to.be.instanceof(GetUserMediaError);
        expect(e.name).to.be.equal('GetUserMediaError');
        expect(e.message).to.not.equal('This line should not be reached');
      }
    });

    it('SomeOtherError', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.Failure;
      try {
        await deviceController.startVideoInput(stringDeviceId);
        throw new Error('This line should not be reached');
      } catch (e) {
        expect(e).to.be.instanceof(GetUserMediaError);
        expect(e.name).to.be.equal('GetUserMediaError');
        expect(e.message).to.not.equal('This line should not be reached');
      }
    });

    it('GetUserMediaError', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.GetUserMediaError;
      try {
        await deviceController.startVideoInput(stringDeviceId);
        throw new Error('This line should not be reached');
      } catch (e) {
        expect(e).to.be.instanceof(GetUserMediaError);
        expect(e.name).to.be.equal('GetUserMediaError');
        expect(e.message).to.include('Error fetching device.');
      }
    });
  });

  describe('startVideoInput', () => {
    it('chooses no device', async () => {
      const device: VideoInputDevice = null;
      try {
        await deviceController.startVideoInput(device);
      } catch (e) {
        throw new Error('This line should not be reached');
      }
    });

    it('pass undefined device', async () => {
      try {
        const logSpy = sinon.spy(logger, 'error');
        await deviceController.startVideoInput(undefined);
        expect(logSpy.calledOnce);
        logSpy.restore();
      } catch (e) {
        throw new Error('This line should not be reached');
      }
    });

    it('chooses the device by browser', async () => {
      try {
        await deviceController.startVideoInput(stringDeviceId);
      } catch (e) {
        throw new Error('This line should not be reached');
      }
    });

    it('chooses the device by user', async () => {
      domMockBehavior.asyncWaitMs = 1500;
      try {
        await deviceController.startVideoInput(stringDeviceId);
      } catch (e) {
        throw new Error('This line should not be reached');
      }
    });

    it('chooses the device as a media stream', async () => {
      const spy = sinon.spy(navigator.mediaDevices, 'getUserMedia');
      const device: VideoInputDevice = getMediaStreamDevice('device-id');
      await deviceController.startVideoInput(device);
      const stream = await deviceController.acquireVideoInputStream();
      expect(stream).to.equal(device);
      expect(spy.notCalled).to.be.true;
    });

    it('releases an old stream video tracks', async () => {
      const firstStream = await deviceController.startVideoInput(stringDeviceId);
      await deviceController.startVideoInput('new-device-id');
      expect(firstStream.getVideoTracks()[0].readyState).to.equal('ended');
    });

    it('Send selected video input change event', async () => {
      let callbackVideoStream = undefined;
      const observer = {
        selectedVideoInputDidChanged(videoStream: MediaStream | undefined): void {
          callbackVideoStream = videoStream;
        },
      };
      deviceController.addMediaStreamBrokerObserver(observer);
      const stream1 = await deviceController.startVideoInput(stringDeviceId);
      expect(callbackVideoStream).to.deep.equal(stream1);
      const stream2 = await deviceController.startVideoInput('new-device-id');
      expect(callbackVideoStream).to.not.deep.equal(stream1);
      expect(callbackVideoStream).to.deep.equal(stream2);
      deviceController.removeDeviceChangeObserver(observer);
    });

    it('denies the permission by browser', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.PermissionDeniedError;
      const handleEventSpy = sinon.spy(deviceController.eventController, 'publishEvent');
      try {
        await deviceController.startVideoInput(stringDeviceId);
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
      const handleEventSpy = sinon.spy(deviceController.eventController, 'publishEvent');
      try {
        await deviceController.startVideoInput(stringDeviceId);
        throw new Error('This line should not be reached');
      } catch (e) {
        expect(e.message).to.include('Permission denied by user');
      }
      expect(handleEventSpy.called).to.be.true;
    });

    it('can fail to choose VideoTransformDevice when permission is denied', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.PermissionDeniedError;
      domMockBehavior.asyncWaitMs = 1500;
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, stringDeviceId, [processor]);
      try {
        await deviceController.startVideoInput(device);
        throw new Error('This line should not be reached');
      } catch (e) {
        expect(e.message).to.include('Permission denied by user');
      }
    });

    it('can choose same VideoTransformDevice twice', async () => {
      domMockBehavior.getUserMediaSucceeds = true;
      const mockVideoStream = new MediaStream();
      // @ts-ignore
      mockVideoStream.id = 'sample';
      // @ts-ignore
      const mockVideoTrack = new MediaStreamTrack('test', 'video');
      mockVideoStream.addTrack(mockVideoTrack);
      domMockBehavior.createElementCaptureStream = mockVideoStream;
      domMockBehavior.mediaStreamTrackSettings = {
        width: 0,
        height: 0,
        deviceId: 'test-same-device',
        facingMode: 'user',
      };
      const processor = new NoOpVideoFrameProcessor();

      let callbackVideoStream = undefined;
      const observer = {
        selectedVideoInputDidChanged(videoStream: MediaStream | undefined): void {
          callbackVideoStream = videoStream;
        },
      };
      deviceController.addMediaStreamBrokerObserver(observer);

      const stream1 = await deviceController.startVideoInput('test-same-device');
      expect(callbackVideoStream).to.deep.equal(stream1);

      const device = new DefaultVideoTransformDevice(logger, 'test-same-device', [processor]);
      const stream2 = await deviceController.startVideoInput(device);

      expect(callbackVideoStream).to.deep.equal(stream2);
      expect(stream1).to.not.deep.equal(stream2);
      // @ts-ignore
      expect(deviceController.chosenVideoTransformDevice).to.eq(device);

      // choose the same device
      const stream3 = await deviceController.startVideoInput(device);
      expect(callbackVideoStream).to.deep.equal(stream3);
      expect(stream2).to.deep.equal(stream3);
      // @ts-ignore
      expect(deviceController.chosenVideoTransformDevice).to.eq(device);
      await deviceController.stopVideoInput();
      expect(callbackVideoStream).to.be.undefined;
      await device.stop();

      deviceController.removeDeviceChangeObserver(observer);
    });

    it('does not reuse existing stream if two video streams without IDs are selected within a video transform', async () => {
      const t1 = new MediaStreamTrack() as StoppableMediaStreamTrack;
      const t2 = new MediaStreamTrack() as StoppableMediaStreamTrack;

      // Make them synthetic streams with no device ID.
      t1.setStreamDeviceID(undefined);
      t2.setStreamDeviceID(undefined);

      const s1 = new MockMediaStream([t1]);
      const s2 = new MockMediaStream([t2]);

      // Otherwise the media stream will be ignored.
      s1.active = true;
      s2.active = true;

      const processor1 = new NoOpVideoFrameProcessor();
      const processor2 = new NoOpVideoFrameProcessor();
      const transform1 = new DefaultVideoTransformDevice(logger, (s1 as unknown) as MediaStream, [
        processor1,
      ]);
      const transform2 = new DefaultVideoTransformDevice(logger, 'default', [processor2]);

      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      deviceController = new DefaultDeviceController(logger);
      const spy = sinon.spy(navigator.mediaDevices, 'getUserMedia');
      try {
        await deviceController.startVideoInput(transform1);
        await deviceController.startVideoInput(transform2);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
      expect(spy.calledOnce).to.be.true;
      expect(s1.getTracks()[0].readyState).to.equal('ended');
      expect(s2.getTracks()[0].readyState).to.equal('live');

      await transform1.stop();
      await transform2.stop();
    });

    it('can replace the local video for VideoTransformDevice', async () => {
      setupMockCaptureStream();

      let callbackVideoStream = undefined;
      const observer = {
        selectedVideoInputDidChanged(videoStream: MediaStream | undefined): void {
          callbackVideoStream = videoStream;
        },
      };
      deviceController.addMediaStreamBrokerObserver(observer);

      const stream1 = await deviceController.startVideoInput(stringDeviceId);
      expect(callbackVideoStream).to.deep.equal(stream1);

      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, stringDeviceId, [processor]);

      const stream2 = await deviceController.startVideoInput(device);
      expect(callbackVideoStream).to.deep.equal(stream2);
      expect(stream2).to.not.be.undefined;
      expect(stream2).to.not.deep.equal(stream1);

      await deviceController.stopVideoInput();
      await device.stop();
      deviceController.removeMediaStreamBrokerObserver(observer);
    });

    it('can switch between VideoTransformDevice', async () => {
      domMockBehavior.mediaStreamTrackSettings = {
        width: 0,
        height: 0,
        deviceId: 'test-same-device',
        facingMode: 'user',
      };
      setupMockCaptureStream();

      let callbackVideoStream = undefined;
      const observer = {
        selectedVideoInputDidChanged(videoStream: MediaStream | undefined): void {
          callbackVideoStream = videoStream;
        },
      };
      deviceController.addMediaStreamBrokerObserver(observer);

      const stream1 = await deviceController.startVideoInput('test');
      expect(callbackVideoStream).to.deep.equal(stream1);

      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test-different-device', [processor]);
      const stream2 = await deviceController.startVideoInput(device);
      expect(callbackVideoStream).to.deep.equal(stream2);
      expect(stream2).to.not.be.undefined;
      expect(stream2).to.not.deep.equal(stream1);

      await device.stop();
      deviceController.removeMediaStreamBrokerObserver(observer);
    });

    it('can reuse the same stream for VideoTransformDevice', async () => {
      domMockBehavior.mediaStreamTrackSettings = {
        width: 0,
        height: 0,
        deviceId: 'test-same-device',
        facingMode: 'user',
      };
      setupMockCaptureStream();
      const spy = sinon.spy(navigator.mediaDevices, 'getUserMedia');

      let callbackVideoStream = undefined;
      const observer = {
        selectedVideoInputDidChanged(videoStream: MediaStream | undefined): void {
          callbackVideoStream = videoStream;
        },
      };
      deviceController.addMediaStreamBrokerObserver(observer);

      const stream1 = await deviceController.startVideoInput('test-same-device');
      expect(callbackVideoStream).to.deep.equal(stream1);

      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test-same-device', [processor]);
      const stream2 = await deviceController.startVideoInput(device);
      expect(callbackVideoStream).to.deep.equal(stream2);
      expect(stream2).to.not.be.undefined;
      expect(stream2).to.not.deep.equal(stream1);

      await device.stop();
      expect(spy.calledOnce).to.equal(true);
      deviceController.removeMediaStreamBrokerObserver(observer);
    });

    it('fail to reuse the same stream for VideoTransformDevice if deviceId is not available ', async () => {
      domMockBehavior.mediaStreamTrackSettings = {
        width: 0,
        height: 0,
        deviceId: '',
        facingMode: 'user',
      };
      setupMockCaptureStream();
      const spy = sinon.spy(navigator.mediaDevices, 'getUserMedia');

      let callbackVideoStream = undefined;
      const observer = {
        selectedVideoInputDidChanged(videoStream: MediaStream | undefined): void {
          callbackVideoStream = videoStream;
        },
      };
      deviceController.addMediaStreamBrokerObserver(observer);

      const stream1 = await deviceController.startVideoInput('test-same-device');
      expect(callbackVideoStream).to.deep.equal(stream1);

      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test-same-device', [processor]);
      const stream2 = await deviceController.startVideoInput(device);
      expect(callbackVideoStream).to.deep.equal(stream2);
      expect(stream2).to.not.be.undefined;
      expect(stream2).to.not.deep.equal(stream1);

      await device.stop();
      expect(spy.calledTwice).to.equal(true);
      deviceController.removeMediaStreamBrokerObserver(observer);
    });

    it('do not reuse the same stream for VideoTransformDevice if multiple device constraints', async () => {
      domMockBehavior.mediaStreamTrackSettings = {
        width: 0,
        height: 0,
        deviceId: 'device-id-1',
        facingMode: 'user',
      };
      setupMockCaptureStream();
      const spy = sinon.spy(navigator.mediaDevices, 'getUserMedia');

      let callbackVideoStream = undefined;
      const observer = {
        selectedVideoInputDidChanged(videoStream: MediaStream | undefined): void {
          callbackVideoStream = videoStream;
        },
      };
      deviceController.addMediaStreamBrokerObserver(observer);

      const constraints: MediaTrackConstraints = {
        deviceId: ['device-id-1', 'device-id-2'],
        sampleRate: 44100,
      };
      const stream1 = await deviceController.startVideoInput(constraints);
      expect(callbackVideoStream).to.deep.equal(stream1);

      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, constraints, [processor]);
      const stream2 = await deviceController.startVideoInput(device);
      expect(callbackVideoStream).to.deep.equal(stream2);
      expect(stream2).to.not.be.undefined;
      expect(stream2).to.not.deep.equal(stream1);

      await device.stop();
      expect(spy.calledTwice).to.equal(true);
      deviceController.removeMediaStreamBrokerObserver(observer);
    });
  });

  describe('Samsung Internet browser', () => {
    it('chooses audio and video devices without error', async () => {
      domMockBehavior.browserName = 'samsung';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      deviceController = new DefaultDeviceController(logger);
      domMockBehavior.enumerateDeviceList = [
        getMediaDeviceInfo('1234', 'videoinput', 'label', 'group-id-1'),
        getMediaDeviceInfo('1234', 'audioinput', 'label', 'group-id-2'),
      ];
      try {
        await deviceController.startAudioInput('1234');
        await deviceController.startVideoInput('1234');
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
    });
  });

  describe('chooseVideoInputDevice (advanced for LED issues)', () => {
    // it('releases the video input stream acquired before no device request', done => {
    //   // const spy = sinon.spy(deviceController, 'releaseMediaStream');
    //   domMockBehavior.asyncWaitMs = 1500;
    //   await deviceController.startVideoInput(stringDeviceId).then(() => {
    //     // expect(spy.callCount).to.equal(1);
    //     // expect(spy.calledOnceWith(null)).to.be.false;
    //     done();
    //   });
    //   deviceController.stopVideoInput();
    // });
    //
    // it('does not release the video input stream acquired after no device request', async () => {
    //   // @ts-ignore
    //   const spyRAD = sinon.spy(deviceController, 'releaseActiveDevice');
    //   const spyRMS = sinon.spy(deviceController, 'releaseMediaStream');
    //   domMockBehavior.asyncWaitMs = 500;
    //   await deviceController.startVideoInput(null);
    //   await deviceController.startVideoInput(stringDeviceId);
    //   // @ts-ignore
    //   expect(spyRAD.notCalled).to.be.true;
    //   expect(spyRMS.notCalled).to.be.true;
    // });
    //
    // it('releases all previously-acquired video streams', async () => {
    //   const stringDeviceIds: VideoInputDevice[] = [
    //     'device-id-1',
    //     'device-id-2',
    //     'device-id-3',
    //     'device-id-4',
    //   ];
    //   const firstStream = await deviceController.startVideoInput(stringDeviceIds[0]);
    //   const secondStream = await deviceController.startVideoInput(stringDeviceIds[1]);
    //   const thirdStream = await deviceController.startVideoInput(stringDeviceIds[2]);
    //   const fourthStream = await deviceController.startVideoInput(stringDeviceIds[3]);
    //   expect(firstStream.getVideoTracks()[0].readyState).to.equal('ended');
    //   expect(secondStream.getVideoTracks()[0].readyState).to.equal('ended');
    //   expect(thirdStream.getVideoTracks()[0].readyState).to.equal('ended');
    //   expect(fourthStream.getVideoTracks()[0].readyState).to.not.equal('ended');
    //   await deviceController.stopVideoInput();
    //   expect(fourthStream.getVideoTracks()[0].readyState).to.equal('ended');
    // });
  });

  describe('StopVideoInput', () => {
    it('Sending selectedVideoInputDidChanged with undefined if calling stopVideoInput', () => {
      let callbackVideoStream;
      const observer = {
        selectedVideoInputDidChanged(videoStream: MediaStream | undefined): void {
          callbackVideoStream = videoStream;
        },
      };
      deviceController.addMediaStreamBrokerObserver(observer);
      deviceController.stopVideoInput();
      expect(callbackVideoStream).to.be.undefined;
      deviceController.removeMediaStreamBrokerObserver(observer);
    });

    it('Sending selectedVideoInputDidChanged with undefined if call after a local video is enabled', async () => {
      let callbackVideoStream;
      const observer = {
        selectedVideoInputDidChanged(videoStream: MediaStream | undefined): void {
          callbackVideoStream = videoStream;
        },
      };
      deviceController.addMediaStreamBrokerObserver(observer);
      const videoStream = await deviceController.startVideoInput(stringDeviceId);
      const spy = sinon.spy(videoStream.getVideoTracks()[0], 'stop');
      expect(callbackVideoStream).to.deep.equal(videoStream);
      deviceController.stopVideoInput();
      expect(spy.calledOnce).to.be.true;
      expect(callbackVideoStream).to.be.undefined;
      deviceController.removeMediaStreamBrokerObserver(observer);
    });

    it('Sending selectedVideoInputDidChanged with undefined if call after a local video is enabled', async () => {
      let callbackVideoStream;
      const observer = {
        selectedVideoInputDidChanged(videoStream: MediaStream | undefined): void {
          callbackVideoStream = videoStream;
        },
      };
      deviceController.addMediaStreamBrokerObserver(observer);
      const videoStream = await deviceController.startVideoInput(stringDeviceId);
      const spy = sinon.spy(videoStream.getVideoTracks()[0], 'stop');
      expect(callbackVideoStream).to.deep.equal(videoStream);
      deviceController.stopVideoInput();
      expect(spy.calledOnce).to.be.true;
      expect(callbackVideoStream).to.be.undefined;
      deviceController.removeMediaStreamBrokerObserver(observer);
    });

    it('Sending selectedVideoInputDidChanged with undefined if call after a local video is enabled', async () => {
      let callbackVideoStream;
      const observer = {
        selectedVideoInputDidChanged(videoStream: MediaStream | undefined): void {
          callbackVideoStream = videoStream;
        },
      };
      deviceController.addMediaStreamBrokerObserver(observer);
      const videoStream = await deviceController.startVideoInput(stringDeviceId);
      const spy = sinon.spy(videoStream.getVideoTracks()[0], 'stop');
      expect(callbackVideoStream).to.deep.equal(videoStream);
      deviceController.stopVideoInput();
      expect(spy.calledOnce).to.be.true;
      expect(callbackVideoStream).to.be.undefined;
      deviceController.removeMediaStreamBrokerObserver(observer);
    });
  });

  describe('stopAudioInput', () => {
    it("disconnects the audio input source node, not the given stream's tracks", async () => {
      enableWebAudio(true);
      await deviceController.startAudioInput(stringDeviceId);
      const stream = await deviceController.acquireAudioInputStream();

      // If the web audio is disabled, it stops only the input tracks --
      // the output comes from a MediaStreamDestinationNode.

      // @ts-ignore
      const getInputTracks = sinon.spy(deviceController.activeDevices['audio'].stream, 'getTracks');
      const getOutputTracks = sinon.spy(stream, 'getTracks');

      deviceController.releaseMediaStream(stream);
      expect(getOutputTracks.called).to.be.false;
      expect(getInputTracks.called).to.be.true;
    });
  });

  describe('chooseAudioOutputDevice', () => {
    it('does not bind the audio device if no audio-video is bound', async () => {
      const spy = sinon.spy(audioVideoController.audioMixController, 'bindAudioDevice');
      await deviceController.chooseAudioOutput(stringDeviceId);
      expect(spy.called).to.be.false;
    });

    it('publish selectedAudioOutputDidChanged', async () => {
      domMockBehavior.enumerateDeviceList = [
        getMediaDeviceInfo(stringDeviceId, null, 'label'),
        getMediaDeviceInfo(stringDeviceId, 'audiooutput', 'label'),
      ];
      let callbackDevice;
      const observer = {
        selectedAudioOutputDidChanged(device: MediaDeviceInfo | undefined): void {
          callbackDevice = device;
        },
      };
      deviceController.addMediaStreamBrokerObserver(observer);
      await deviceController.listAudioOutputDevices();
      await deviceController.chooseAudioOutput(stringDeviceId);
      expect(callbackDevice.deviceId).to.equal(stringDeviceId);
      deviceController.removeMediaStreamBrokerObserver(observer);
    });

    it('publish selectedAudioOutputDidChanged for null device', async () => {
      // domMockBehavior.enumerateDeviceList = [getMediaDeviceInfo(stringDeviceId, null, 'label')];
      let callbackDevice;
      const observer = {
        selectedAudioOutputDidChanged(device: MediaDeviceInfo | undefined): void {
          callbackDevice = device;
        },
      };
      deviceController.addMediaStreamBrokerObserver(observer);
      await deviceController.listAudioOutputDevices();
      await deviceController.chooseAudioOutput(null);
      expect(callbackDevice).to.be.null;
      deviceController.removeMediaStreamBrokerObserver(observer);
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
      await deviceController.startAudioInput(device);
      const stream = await deviceController.acquireAudioInputStream();
      expect(stream).to.equal(device);
    });

    it('acquires an non-empty stream when the web audio is enabled', async () => {
      enableWebAudio(true);
      const stream = await deviceController.acquireAudioInputStream();
      expect(stream).to.exist;
    });

    it('cannot acquire a video input stream if no video input chosen yet', async () => {
      try {
        await deviceController.acquireVideoInputStream();
        throw new Error('This line should not be reached.');
      } catch (e) {
        expect(e.message).includes(`no video device chosen`);
      }
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

      expect(audioInputsChangedCallCount).to.equal(0);

      navigator.mediaDevices.dispatchEvent(new Event('devicechange'));
      await navigator.mediaDevices.dispatchEvent(new Event('devicechange'));
      await delay(100);

      deviceController.removeDeviceChangeObserver(observer);
      await navigator.mediaDevices.dispatchEvent(new Event('devicechange'));
      await delay(100);

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
      await delay(100);

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
      await delay(100);
      expect(callCount).to.equal(0);
    });

    it('gets a non-mute callback when a device is chosen', async () => {
      const output = new Promise((resolve, _reject) => {
        const observer: DeviceChangeObserver = {
          audioInputMuteStateChanged: (device, muted): void => {
            resolve([device, muted]);
          },
        };

        deviceController.addDeviceChangeObserver(observer);
        deviceController.startAudioInput('default');
      });

      // In real code, `test` will actually be `default` -- our mocks aren't great.
      expect(await output).to.deep.equal(['test', false]);
    });

    it('has working mocks', () => {
      const fakeStream = new MediaStream();
      const track = new MediaStreamTrack() as StoppableMediaStreamTrack;
      track.setStreamDeviceID('foobar');
      track.externalMute();
      expect(track.muted).to.be.true;
      expect(track.getSettings().deviceId).to.equal('foobar');

      fakeStream.addTrack(track);
      expect(fakeStream.getAudioTracks()[0].muted).to.be.true;
      expect(fakeStream.getAudioTracks()[0].getSettings().deviceId).to.equal('foobar');
    });

    it('gets a mute callback when the stream is muted', async () => {
      const fakeStream = new MediaStream();
      const track = new MediaStreamTrack() as StoppableMediaStreamTrack;
      track.setStreamDeviceID('foobar');
      track.externalMute();
      fakeStream.addTrack(track);
      expect(!!fakeStream.id).to.be.true;

      const output = new Promise((resolve, _reject) => {
        const observer: DeviceChangeObserver = {
          audioInputMuteStateChanged: (device, muted): void => {
            resolve([device, muted]);
          },
        };

        deviceController.addDeviceChangeObserver(observer);
        deviceController.startAudioInput(fakeStream);
      });

      // If only choosing returned a promise!
      await delay(100);
      expect(await output).to.deep.equal(['foobar', true]);
    });

    it('gets a mute callback when the stream is muted after selection', async () => {
      const track = new MediaStreamTrack() as StoppableMediaStreamTrack;

      // Make it a synthetic stream with no device ID.
      track.setStreamDeviceID(undefined);
      const fakeStream = new MediaStream([track]);
      track.externalMute();

      const output = new Promise((resolve, _reject) => {
        const observer: DeviceChangeObserver = {
          audioInputMuteStateChanged: (device, muted): void => {
            if (!muted) {
              resolve([device, muted]);
            }
          },
        };

        deviceController.addDeviceChangeObserver(observer);
        deviceController.startAudioInput(fakeStream);
      });

      // If only choosing returned a promise!
      await delay(100);
      track.externalUnmute();

      // This will return the whole stream, because there's no device ID.
      expect(await output).to.deep.equal([fakeStream, false]);

      // Deselect so we release the stream.
      deviceController.startAudioInput('default');
      await delay(100);
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
      await deviceController.startAudioInput(stringDeviceId);
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
      await deviceController.startAudioInput(stringDeviceId);
      const node = deviceController.createAnalyserNodeForRawAudioInput();
      expect(node).to.exist;

      // Now clean up.
      node.removeOriginalInputs();
    });

    it('can create the analyser node if Web Audio is enabled', async () => {
      enableWebAudio(true);
      await deviceController.startAudioInput(stringDeviceId);
      const node = deviceController.createAnalyserNodeForAudioInput();
      expect(node).to.exist;

      // Now clean up.
      node.removeOriginalInputs();
    });

    it('can create the analyser node for the end of a transform', async () => {
      enableWebAudio(true);
      const transform = new MockNodeTransformDevice(stringDeviceId, 1);
      await deviceController.startAudioInput(transform);
      const node = deviceController.createAnalyserNodeForAudioInput();
      expect(node).to.exist;

      // Now clean up.
      node.removeOriginalInputs();
    });

    it('can create an audio context without sampleRate', async () => {
      await deviceController.startAudioInput(stringDeviceId);
      domMockBehavior.mediaDeviceHasSupportedConstraints = false;
      expect(deviceController.createAnalyserNodeForAudioInput()).to.exist;
    });

    it('can create an audio stream using webkitAudioContext', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const GlobalAny = global as any;
      GlobalAny['window']['webkitAudioContext'] = GlobalAny['window']['AudioContext'];
      delete GlobalAny['window']['AudioContext'];
      await deviceController.startAudioInput(stringDeviceId);
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
    let disconnectVideoStreamSpy: sinon.SinonSpy;
    let connectVideoStreamSpy: sinon.SinonSpy;

    beforeEach(() => {
      const videoElementFactory = new NoOpVideoElementFactory();
      element = videoElementFactory.create();
      disconnectVideoStreamSpy = sinon.spy(
        DefaultVideoTile,
        'disconnectVideoStreamFromVideoElement'
      );
      connectVideoStreamSpy = sinon.spy(DefaultVideoTile, 'connectVideoStreamToVideoElement');
    });

    afterEach(() => {
      disconnectVideoStreamSpy.restore();
      connectVideoStreamSpy.restore();
    });

    it('noop if no active video input', () => {
      const watcher = new WatchingLogger(
        'cannot bind video preview since video input device has not been chosen'
      );
      deviceController = new DefaultDeviceController(watcher);
      deviceController.startVideoPreviewForVideoInput(element);

      expect(disconnectVideoStreamSpy.called).to.be.false;
      expect(connectVideoStreamSpy.called).to.be.false;
      expect(watcher.matches.length).to.equal(1);
    });

    it('connects the video intrinsic device with the video element', async () => {
      await deviceController.startVideoInput(stringDeviceId);
      deviceController.startVideoPreviewForVideoInput(element);
      expect(disconnectVideoStreamSpy.called).to.be.false;
      expect(connectVideoStreamSpy.calledOnce).to.be.true;
    });

    it('connects the transform video stream to the video element', async () => {
      // It is important that the domMockBehavior setup is before the original video stream generation to mock browser behavior.
      setupMockCaptureStream();
      domMockBehavior.mediaStreamTrackSettings.deviceId = stringDeviceId;
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, stringDeviceId, [processor]);
      // Connect the transform video stream
      await deviceController.startVideoInput(device);
      deviceController.startVideoPreviewForVideoInput(element);

      expect(device.getInnerDevice() === stringDeviceId);
      expect(disconnectVideoStreamSpy.called).to.be.false;
      expect(connectVideoStreamSpy.calledOnce).to.be.true;
      await device.stop();
    });

    it('disconnects the video stream from the video element', async () => {
      await deviceController.startVideoInput(stringDeviceId);
      deviceController.startVideoPreviewForVideoInput(element);
      deviceController.stopVideoPreviewForVideoInput(element);

      expect(connectVideoStreamSpy.calledOnce).to.be.true;
      expect(disconnectVideoStreamSpy.calledOnce).to.be.true;
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
      await delay(100);
      expect(called).to.be.true;
    });

    it('clears the cache if it has empty label when setting new device trigger', async () => {
      deviceController.setDeviceLabelTrigger(async () => new MediaStream());

      // This will establish the cache
      const devices: MediaDeviceInfo[] = await deviceController.listAudioInputDevices();

      // @ts-ignore
      expect(deviceController.deviceInfoCache).to.not.be.null;
      expect(anyDevicesAreUnlabeled(devices)).to.be.true;

      deviceController.setDeviceLabelTrigger(async () => new MediaStream());

      // @ts-ignore
      expect(deviceController.deviceInfoCache).to.be.null;
    });

    it('keeps current cache if it has no empty label when setting new device trigger', async () => {
      // This will establish the cache.
      const devices: MediaDeviceInfo[] = await deviceController.listAudioInputDevices();

      // @ts-ignore
      expect(deviceController.deviceInfoCache).to.not.be.null;
      expect(anyDevicesAreUnlabeled(devices)).to.be.false;

      deviceController.setDeviceLabelTrigger(async () => new MediaStream());

      // @ts-ignore
      expect(deviceController.deviceInfoCache).to.not.be.null;
    });
  });

  describe('synthesize devices', () => {
    it('synthesizes the audio device', async () => {
      DefaultDeviceController.synthesizeAudioDevice(100);
      await delay(100);
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
    it('calls ended for string device ID', async () => {
      let audioInputStreamEndedCallCount = 0;
      const observer1: DeviceChangeObserver = {
        audioInputStreamEnded: (_deviceId: string): void => {
          audioInputStreamEndedCallCount += 1;
        },
      };
      deviceController.addDeviceChangeObserver(observer1);
      let callbackAudioStream;
      const observer2 = {
        selectedAudioInputDidChanged(audioStream: MediaStream | undefined): void {
          callbackAudioStream = audioStream;
        },
      };
      deviceController.addMediaStreamBrokerObserver(observer2);

      const stream = await deviceController.startAudioInput(stringDeviceId);
      expect(callbackAudioStream).to.deep.equal(stream);
      (stream.getAudioTracks()[0] as StoppableMediaStreamTrack).externalStop();
      await delay(100);
      expect(audioInputStreamEndedCallCount).to.equal(1);
      expect(callbackAudioStream).to.not.deep.equal(stream);
      deviceController.removeDeviceChangeObserver(observer1);
      deviceController.removeMediaStreamBrokerObserver(observer2);
    });

    it('calls ended for constraints', async () => {
      let audioInputStreamEndedCallCount = 0;
      const observer: DeviceChangeObserver = {
        audioInputStreamEnded: (_deviceId: string): void => {
          audioInputStreamEndedCallCount += 1;
        },
      };
      deviceController.addDeviceChangeObserver(observer);
      await deviceController.startAudioInput({ deviceId: stringDeviceId });
      const stream = await deviceController.acquireAudioInputStream();
      (stream.getAudioTracks()[0] as StoppableMediaStreamTrack).externalStop();
      await delay(100);
      expect(audioInputStreamEndedCallCount).to.equal(1);
    });

    it('video input stream ended and stop local video if it started', async () => {
      let videoInputStreamEndedCallCount = 0;
      const observer1: DeviceChangeObserver = {
        videoInputStreamEnded: (_deviceId: string): void => {
          videoInputStreamEndedCallCount += 1;
        },
      };
      deviceController.addDeviceChangeObserver(observer1);
      let callbackVideoStream;
      const observer2 = {
        selectedVideoInputDidChanged(audioStream: MediaStream | undefined): void {
          callbackVideoStream = audioStream;
        },
      };
      deviceController.addMediaStreamBrokerObserver(observer2);
      const stream = await deviceController.startVideoInput(stringDeviceId);
      expect(callbackVideoStream).to.deep.equal(stream);
      (stream.getVideoTracks()[0] as StoppableMediaStreamTrack).externalStop();
      await delay(100);
      expect(videoInputStreamEndedCallCount).to.equal(1);
      expect(callbackVideoStream).to.be.undefined;
    });
  });

  describe('getUserMedia failures', () => {
    it('receives the unknown error message if the error does not exist', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaError = null;
      let callbackCount = 0;
      // So if we fail to select an audio device, we will try to select a null device
      // That leads to 2 events to be fired `audioInputFailed` then `audioInputSelected` for null device.
      eventController.addObserver({
        eventDidReceive(name: EventName, attributes: EventAttributes): void {
          callbackCount++;
          if (callbackCount === 1) {
            expect(name).to.equal('audioInputFailed');
            expect(attributes.audioInputErrorMessage).includes('UnknownError');
          } else if (callbackCount === 2) {
            expect(name).to.equal('audioInputSelected');
          }
        },
      });
      try {
        await deviceController.startAudioInput(stringDeviceId);
      } catch (e) {
        expect(e.message).to.equal('Error fetching device.');
      }
      await delay(1);
      expect(callbackCount).to.equal(2);
    });

    it('receives the error name and the message', async () => {
      const errorMessage = 'Permission denied';
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaError = new MockError('NotAllowedError', errorMessage);
      let callbackCount = 0;
      // So if we fail to select an audio device, we will try to select a null device
      // That leads to 2 events to be fired `audioInputFailed` then `audioInputSelected` for null device.
      eventController.addObserver({
        eventDidReceive(name: EventName, attributes: EventAttributes): void {
          callbackCount++;
          if (callbackCount === 1) {
            expect(name).to.equal('audioInputFailed');
            expect(attributes.audioInputErrorMessage).includes('NotAllowedError');
          } else if (callbackCount === 2) {
            expect(name).to.equal('audioInputSelected');
          }
        },
      });
      try {
        await deviceController.startAudioInput(stringDeviceId);
      } catch (e) {
        expect(e.message).to.equal('Permission denied by browser');
      }
      await delay(1);
      expect(callbackCount).to.equal(2);
    });

    it('receives the error name only if the message is empty', async () => {
      const errorMessage = '';
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaError = new MockError('NotAllowedError', errorMessage);
      let callbackCount = 0;
      // So if we fail to select an audio device, we will try to select a null device
      // That leads to 2 events to be fired `audioInputFailed` then `audioInputSelected` for null device.
      eventController.addObserver({
        eventDidReceive(name: EventName, attributes: EventAttributes): void {
          callbackCount++;
          if (callbackCount === 1) {
            expect(name).to.equal('audioInputFailed');
            expect(attributes.audioInputErrorMessage).includes('NotAllowedError');
          } else if (callbackCount === 2) {
            expect(name).to.equal('audioInputSelected');
          }
        },
      });
      try {
        await deviceController.startAudioInput(stringDeviceId);
      } catch (e) {
        expect(e.message).to.equal('Permission denied by browser');
      }
      await delay(1);
      expect(callbackCount).to.equal(2);
    });

    it('receives the error message only if the error name is empty', async () => {
      const errorMessage = 'Permission denied';
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaError = new MockError('NotAllowedError', errorMessage);
      let callbackCount = 0;
      // So if we fail to select an audio device, we will try to select a null device
      // That leads to 2 events to be fired `audioInputFailed` then `audioInputSelected` for null device.
      eventController.addObserver({
        eventDidReceive(name: EventName, attributes: EventAttributes): void {
          callbackCount++;
          if (callbackCount === 1) {
            expect(name).to.equal('audioInputFailed');
            expect(attributes.audioInputErrorMessage).to.equal(`NotAllowedError: ${errorMessage}`);
          } else if (callbackCount === 2) {
            expect(name).to.equal('audioInputSelected');
          }
        },
      });
      try {
        await deviceController.startAudioInput(stringDeviceId);
      } catch (e) {
        expect(e.message).to.equal('Permission denied by browser');
      }
      await delay(1);
      expect(callbackCount).to.equal(2);
    });
  });

  describe('getIntrinsicDeviceId', () => {
    it('Return undefined if the input device is undefined', () => {
      expect(DefaultDeviceController.getIntrinsicDeviceId(undefined)).to.be.undefined;
    });

    it('Return null if the input device is null', () => {
      expect(DefaultDeviceController.getIntrinsicDeviceId(null)).to.be.null;
    });

    it('Return empty string if the input device is an empty string', () => {
      expect(DefaultDeviceController.getIntrinsicDeviceId('')).to.equal('');
    });

    it('Return default if the input device is default string', () => {
      expect(DefaultDeviceController.getIntrinsicDeviceId('default')).to.equal('default');
    });

    it('Return device id if the input device is string deviceId', () => {
      expect(DefaultDeviceController.getIntrinsicDeviceId('deviceId')).to.equal('deviceId');
    });

    it('Return stream id if the input device is a media stream', () => {
      expect(
        DefaultDeviceController.getIntrinsicDeviceId(getMediaStreamDevice('deviceId'))
      ).to.equal('deviceId');
    });

    it('Return undefined if the input constraint deviceId is undefined', () => {
      const constraints: MediaTrackConstraints = {};
      expect(DefaultDeviceController.getIntrinsicDeviceId(constraints)).to.be.undefined;
    });

    it('Return null if the input constraint deviceId is null', () => {
      const constraints: MediaTrackConstraints = { deviceId: null };
      expect(DefaultDeviceController.getIntrinsicDeviceId(constraints)).to.be.null;
    });

    it('Return string if the input constraint deviceId is of type string', () => {
      const constraints: MediaTrackConstraints = { deviceId: 'deviceId' };
      expect(DefaultDeviceController.getIntrinsicDeviceId(constraints)).to.equal('deviceId');
    });

    it('Return a string array if the input constraint deviceId is of type string array', () => {
      const constraints: MediaTrackConstraints = {
        deviceId: ['deviceId1', 'deviceId2'],
        sampleRate: 44100,
      };
      expect(DefaultDeviceController.getIntrinsicDeviceId(constraints)).to.eql([
        'deviceId1',
        'deviceId2',
      ]);
    });

    it('Return string if the input constraint deviceId is of type ConstrainDOMStringParameters', () => {
      const constraints: MediaTrackConstraints = { deviceId: { exact: 'device1' } };
      expect(DefaultDeviceController.getIntrinsicDeviceId(constraints)).to.equal('device1');
    });

    it(
      'Return a string array if the input constraint deviceId is of type ConstrainDOMStringParameters with string' +
        ' array',
      () => {
        const constraints: MediaTrackConstraints = {
          deviceId: { exact: ['deviceId1', 'deviceId2'] },
          sampleRate: 44100,
        };
        expect(DefaultDeviceController.getIntrinsicDeviceId(constraints)).to.eql([
          'deviceId1',
          'deviceId2',
        ]);
      }
    );

    it('Return undefined if the input constraint deviceId is of ideal', () => {
      const constraints: MediaTrackConstraints = { deviceId: { ideal: 'device1' } };
      expect(DefaultDeviceController.getIntrinsicDeviceId(constraints)).to.be.undefined;
    });
  });
});
