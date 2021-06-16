// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';

import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import DefaultBrowserBehavior from '../../src/browserbehavior/DefaultBrowserBehavior';
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
import EventName from '../../src/eventcontroller/EventName';
import NoOpLogger from '../../src/logger/NoOpLogger';
import MediaDeviceProxyHandler from '../../src/mediadevicefactory/MediaDeviceProxyHandler';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import NoOpVideoElementFactory from '../../src/videoelementfactory/NoOpVideoElementFactory';
import DefaultVideoTransformDevice from '../../src/videoframeprocessor/DefaultVideoTransformDevice';
import NoOpVideoFrameProcessor from '../../src/videoframeprocessor/NoOpVideoFrameProcessor';
import DefaultVideoTile from '../../src/videotile/DefaultVideoTile';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder, { StoppableMediaStreamTrack } from '../dommock/DOMMockBuilder';
import MockError from '../dommock/MockError';
import UserMediaState from '../dommock/UserMediaState';
import {
  MockNodeTransformDevice,
  MockPassthroughTransformDevice,
  MockThrowingTransformDevice,
  MutingTransformDevice,
} from '../transformdevicemock/MockTransformDevice';
import { delay } from '../utils';
import WatchingLogger from './WatchingLogger';

chai.use(chaiAsPromised);
chai.should();

class ContextRecreatingBrowserBehavior extends DefaultBrowserBehavior {
  requiresContextRecreationForAudioWorklet(): boolean {
    return true;
  }
}

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

  function anyDevicesAreUnlabeled(devices: MediaDeviceInfo[]): boolean {
    return devices.some(device => !device.label);
  }

  function anyDeviceHasId(devices: MediaDeviceInfo[], deviceId: string): boolean {
    return devices.some(device => device.deviceId === deviceId);
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

  describe('disposal', () => {
    it('unsubscribes from streams and global when disposed', async () => {
      const gUM = sinon.spy(navigator.mediaDevices, 'getUserMedia');

      await deviceController.listAudioInputDevices();
      await deviceController.chooseAudioInputDevice('abcdef');

      const device = await gUM.returnValues.pop();
      expect(device.getAudioTracks().length).to.equal(1);

      // @ts-ignore
      expect(device.getAudioTracks()[0].listeners['ended'].length).to.equal(1);

      await deviceController.chooseVideoInputDevice('vabcdef');

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
      await deviceController.chooseAudioInputDevice(tf);

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
      await deviceController.chooseAudioInputDevice(device);

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

      const choose = deviceController.chooseAudioInputDevice(device);
      expect(choose).to.eventually.be.rejectedWith(
        'Cannot choose a transform device with a closed audio context.'
      );
    });

    it('resumes suspended contexts', async () => {
      enableWebAudio(true);
      const device: AudioTransformDevice = new MockNodeTransformDevice(null);

      const context = DefaultDeviceController.getAudioContext();
      context.suspend();

      await deviceController.chooseAudioInputDevice(device);
      expect(context.state).to.equal('running');
    });

    it('does nothing for suspended offline contexts', async () => {
      enableWebAudio(true);
      const device: AudioTransformDevice = new MockNodeTransformDevice(null);

      // @ts-ignore
      const offline = new OfflineAudioContext();

      // @ts-ignore
      DefaultDeviceController.audioContext = offline;

      const choose = deviceController.chooseAudioInputDevice(device);
      expect(choose).to.eventually.be.rejectedWith('Error fetching device.');
    });
  });

  describe('recreates audio context if needed', async () => {
    beforeEach(() => {
      DefaultDeviceController.closeAudioContext();
    });

    class TestAudioVideoController extends NoOpAudioVideoController {
      private conn: RTCPeerConnection | null = null;
      restartLocalAudioCalled: boolean = false;

      constructor(hasConnection: boolean) {
        super();
        if (hasConnection) {
          this.conn = {} as RTCPeerConnection;
        }
      }

      get rtcPeerConnection(): RTCPeerConnection | null {
        return this.conn;
      }

      async restartLocalAudio(callback: () => void): Promise<void> {
        this.restartLocalAudioCalled = true;
        callback();
      }
    }

    it('does not so without a peer connection', async () => {
      deviceController = new DefaultDeviceController(
        logger,
        { enableWebAudio: true },
        new ContextRecreatingBrowserBehavior()
      );

      const transform = new MockNodeTransformDevice('default');

      await deviceController.chooseAudioInputDevice(transform);
      const avController = new TestAudioVideoController(false);
      deviceController.bindToAudioVideoController(avController);

      await DefaultDeviceController.getAudioContext();
      const device: AudioTransformDevice = new MockNodeTransformDevice('default');
      await deviceController.chooseAudioInputDevice(device);
      expect(avController.restartLocalAudioCalled).to.be.false;
    });

    it('does so with non-transform then transform', async () => {
      deviceController = new DefaultDeviceController(
        logger,
        { enableWebAudio: true },
        new ContextRecreatingBrowserBehavior()
      );

      const transform = new MockNodeTransformDevice('default');

      await deviceController.chooseAudioInputDevice(transform);
      const avController = new TestAudioVideoController(true);
      deviceController.bindToAudioVideoController(avController);

      const oldContext = DefaultDeviceController.getAudioContext();
      expect(avController.restartLocalAudioCalled).to.be.false;
      const device: AudioTransformDevice = new MockNodeTransformDevice('default');
      const choose = deviceController.chooseAudioInputDevice(device);

      await expect(choose).to.eventually.be.undefined;

      expect(oldContext).to.not.eq(DefaultDeviceController.getAudioContext());
      expect(avController.restartLocalAudioCalled).to.be.true;
    });

    it('does so with transform then non-transform', async () => {
      deviceController = new DefaultDeviceController(
        logger,
        { enableWebAudio: true },
        new ContextRecreatingBrowserBehavior()
      );

      const transform = new MockNodeTransformDevice('default');

      const choose = deviceController.chooseAudioInputDevice(transform);
      const avController = new TestAudioVideoController(true);
      deviceController.bindToAudioVideoController(avController);

      expect(avController.restartLocalAudioCalled).to.be.false;
      const oldContext = DefaultDeviceController.getAudioContext();

      await expect(choose).to.eventually.be.undefined;

      await deviceController.chooseAudioInputDevice('default');

      expect(oldContext).to.not.eq(DefaultDeviceController.getAudioContext());
      expect(avController.restartLocalAudioCalled).to.be.true;
    });
  });

  describe('releasing', async () => {
    it('idempotently releases transform devices', async () => {
      deviceController = new DefaultDeviceController(
        logger,
        { enableWebAudio: true },
        new ContextRecreatingBrowserBehavior()
      );

      const transform = new MockNodeTransformDevice('default');
      await deviceController.chooseAudioInputDevice(transform);
      const stream = await deviceController.acquireAudioInputStream();

      deviceController.releaseMediaStream(stream);
      deviceController.releaseMediaStream(stream);
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
        async restartLocalAudio(_callback: () => void): Promise<void> {
          called = true;
          throw new Error('something went wrong');
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
      domMockBehavior.mediaStreamTrackSettings = {
        deviceId: 'default',
        groupId: 'group-id-1',
      };
      await deviceController.listAudioInputDevices();
      try {
        await deviceController.chooseAudioInputDevice('default');
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
        await deviceController.chooseAudioInputDevice('default');
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
    });

    it('Can chooseAudioInputDevice if pass in MediaDeviceInfo', async () => {
      class TestAudioVideoController extends NoOpAudioVideoController {
        async restartLocalAudio(_callback: () => void): Promise<void> {
          await deviceController.acquireAudioInputStream();
        }
      }
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
        deviceController.bindToAudioVideoController(new TestAudioVideoController());
        await deviceController.listAudioInputDevices();
        await deviceController.chooseAudioInputDevice(mediaDeviceInfo);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
      expect(spy.calledTwice).to.be.true;
    });

    it('Can chooseAudioInputDevice if pass in media stream', async () => {
      class TestAudioVideoController extends NoOpAudioVideoController {
        async restartLocalAudio(_callback: () => void): Promise<void> {
          await deviceController.acquireAudioInputStream();
        }
      }
      const mockAudioStream = getMediaStreamDevice('sample');
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      // @ts-ignore
      const spy = sinon.spy(deviceController, 'chooseInputIntrinsicDevice');
      try {
        deviceController.bindToAudioVideoController(new TestAudioVideoController());
        await deviceController.chooseAudioInputDevice(mockAudioStream);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
      expect(spy.calledTwice).to.be.true;
    });

    it('sets to null device when an external device disconnects', async () => {
      enableWebAudio(true);
      try {
        await deviceController.chooseAudioInputDevice(stringDeviceId);
      } catch (e) {
        throw new Error('This line should not be reached.');
      }

      // The previous audio source node will be disconnected.
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
        await delay(10);
        deviceController.chooseAudioInputDevice(stringDeviceIds[2]);
        await delay(10);
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
        await delay(10);
        deviceController.chooseAudioInputDevice(stringDeviceIds[2]);
        await delay(10);
        deviceController.chooseAudioInputDevice(stringDeviceIds[3]);
      });
      new TimeoutScheduler(500).start(() => {
        expect(releasedDevices.size).to.equal(3);
        done();
      });
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
        await deviceController.chooseAudioInputDevice('deviceId1');
        await deviceController.chooseAudioInputDevice('deviceId1');
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
        await deviceController.chooseAudioInputDevice(constraints);
        await deviceController.chooseAudioInputDevice(constraints);
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
        await deviceController.chooseAudioInputDevice('deviceId1');
        await deviceController.chooseAudioInputDevice('deviceId1');
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
      const spy = sinon.spy(navigator.mediaDevices, 'getUserMedia');
      const device: VideoInputDevice = getMediaStreamDevice('device-id');
      await deviceController.chooseVideoInputDevice(device);
      const stream = await deviceController.acquireVideoInputStream();
      expect(stream).to.equal(device);
      expect(spy.notCalled).to.be.true;
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

    it('can fail to choose VideoTransformDevice when permission is denied', done => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.PermissionDeniedError;
      domMockBehavior.asyncWaitMs = 1500;
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, stringDeviceId, [processor]);
      deviceController
        .chooseVideoInputDevice(device)
        .then(() => {})
        .catch(e => {
          expect(e.message).to.include('Permission denied by user');
          done();
        });
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

      await deviceController.chooseVideoInputDevice('test-same-device');
      const device = new DefaultVideoTransformDevice(logger, 'test-same-device', [processor]);

      await deviceController.chooseVideoInputDevice(device);
      // @ts-ignore
      expect(deviceController.chosenVideoTransformDevice).to.eq(device);

      // choose the same device
      await deviceController.chooseVideoInputDevice(device);
      // @ts-ignore
      expect(deviceController.chosenVideoTransformDevice).to.eq(device);
      await deviceController.chooseVideoInputDevice(null);

      await device.stop();
    });

    it('can replace the local video for VideoTransformDevice', async () => {
      domMockBehavior.getUserMediaSucceeds = true;
      const mockVideoStream = new MediaStream();
      // @ts-ignore
      mockVideoStream.id = 'sample';
      // @ts-ignore
      mockVideoStream.active = true;
      // @ts-ignore
      const mockVideoTrack = new MediaStreamTrack('test', 'video');
      mockVideoStream.addTrack(mockVideoTrack);
      domMockBehavior.createElementCaptureStream = mockVideoStream;

      deviceController.chooseVideoInputDevice(stringDeviceId).then(() => {});
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, stringDeviceId, [processor]);
      let called = false;
      class TestAudioVideoController extends NoOpAudioVideoController {
        async replaceLocalVideo(): Promise<void> {
          called = true;
        }
      }

      audioVideoController = new TestAudioVideoController();
      deviceController.bindToAudioVideoController(audioVideoController);
      audioVideoController.videoTileController.startLocalVideoTile();

      await deviceController.chooseVideoInputDevice(device);

      const stream = await deviceController.acquireVideoInputStream();
      deviceController.releaseMediaStream(stream);
      await delay(200);
      await deviceController.chooseVideoInputDevice(null);

      expect(called).to.be.true;
      await device.stop();
    });

    it('can choose media stream as device then choose VideoTransformDevice without audio video controller', async () => {
      domMockBehavior.getUserMediaSucceeds = true;
      const mockVideoStream = new MediaStream();
      // @ts-ignore
      mockVideoStream.active = true;
      // @ts-ignore
      mockVideoStream.id = 'sample';
      // @ts-ignore
      const mockVideoTrack = new MediaStreamTrack('test', 'video');
      mockVideoStream.addTrack(mockVideoTrack);
      domMockBehavior.createElementCaptureStream = mockVideoStream;
      await deviceController.chooseVideoInputDevice(mockVideoStream);
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, mockVideoStream, [processor]);
      await deviceController.chooseVideoInputDevice(device);

      await deviceController.chooseVideoInputDevice(null);

      await device.stop();
    });

    it('can choose MediaStream as device then choose VideoTransformDevice when startLocalVideoTile is called', async () => {
      class TestAudioVideoController extends NoOpAudioVideoController {
        async replaceLocalVideo(): Promise<void> {
          return;
        }
      }
      domMockBehavior.getUserMediaSucceeds = true;
      const mockVideoStream = new MediaStream();
      // @ts-ignore
      mockVideoStream.active = true;
      // @ts-ignore
      mockVideoStream.id = 'sample';
      // @ts-ignore
      const mockVideoTrack = new MediaStreamTrack('test', 'video');
      // @ts-ignore
      mockVideoTrack.kind = 'video';
      mockVideoStream.addTrack(mockVideoTrack);
      domMockBehavior.createElementCaptureStream = mockVideoStream;
      const avController = new TestAudioVideoController();
      const spy = sinon.spy(avController, 'replaceLocalVideo');

      deviceController.bindToAudioVideoController(avController);

      avController.videoTileController.startLocalVideoTile();
      await deviceController.chooseVideoInputDevice(mockVideoStream);
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test', [processor]);
      await deviceController.chooseVideoInputDevice(device);

      await deviceController.chooseVideoInputDevice(null);
      await device.stop();
      expect(spy.called).to.equal(true);
    });

    it('can reuse stream when choosing VideoTransformDevice and do a update if replaceLocalVideo is not implemented', async () => {
      class NoReplaceImpl extends NoOpAudioVideoController {
        replaceLocalVideo: () => Promise<void> = null;
      }

      domMockBehavior.getUserMediaSucceeds = true;
      const mockVideoStream = new MediaStream();
      // @ts-ignore
      mockVideoStream.active = true;
      // @ts-ignore
      mockVideoStream.id = 'sample';
      // @ts-ignore
      const mockVideoTrack = new MediaStreamTrack('test', 'video');
      mockVideoStream.addTrack(mockVideoTrack);
      domMockBehavior.createElementCaptureStream = mockVideoStream;
      const avController = new NoReplaceImpl();
      const spy = sinon.spy(avController, 'update');
      deviceController.bindToAudioVideoController(avController);
      avController.videoTileController.startLocalVideoTile();
      await deviceController.chooseVideoInputDevice(mockVideoStream);
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, mockVideoStream, [processor]);
      await deviceController.chooseVideoInputDevice(device);

      await deviceController.chooseVideoInputDevice(null);
      await device.stop();

      expect(spy.called).to.equal(true);
    });

    it('can choose media stream as device then choose VideoTransformDevice when startLocalVideoTile is not called', async () => {
      domMockBehavior.getUserMediaSucceeds = true;
      const mockVideoStream = new MediaStream();
      // @ts-ignore
      mockVideoStream.active = true;
      // @ts-ignore
      mockVideoStream.id = 'sample';
      // @ts-ignore
      const mockVideoTrack = new MediaStreamTrack('test', 'video');
      mockVideoStream.addTrack(mockVideoTrack);
      domMockBehavior.createElementCaptureStream = mockVideoStream;
      deviceController.bindToAudioVideoController(audioVideoController);
      await deviceController.chooseVideoInputDevice(mockVideoStream);
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, mockVideoStream, [processor]);
      await deviceController.chooseVideoInputDevice(device);

      await deviceController.chooseVideoInputDevice(null);
      await device.stop();
    });

    it('can switch between VideoTransformDevice', async () => {
      domMockBehavior.mediaStreamTrackSettings = {
        width: 0,
        height: 0,
        deviceId: 'test-same-device',
        facingMode: 'user',
      };
      class TestAudioVideoController extends NoOpAudioVideoController {
        async replaceLocalVideo(): Promise<void> {
          return;
        }
      }
      const avController = new TestAudioVideoController();
      const spy = sinon.spy(avController, 'replaceLocalVideo');

      deviceController.bindToAudioVideoController(avController);
      avController.videoTileController.startLocalVideoTile();

      await deviceController.chooseVideoInputDevice('test');
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test-different-device', [processor]);

      await deviceController.chooseVideoInputDevice(device);

      avController.videoTileController.stopLocalVideoTile();
      await device.stop();
      expect(spy.called).to.equal(true);
    });

    it('can switch between VideoTransformDevice', async () => {
      domMockBehavior.mediaStreamTrackSettings = {
        width: 0,
        height: 0,
        deviceId: 'test-same-device',
        facingMode: 'user',
      };
      class TestAudioVideoController extends NoOpAudioVideoController {
        async replaceLocalVideo(): Promise<void> {
          return;
        }
      }
      const avController = new TestAudioVideoController();
      const spy = sinon.spy(avController, 'replaceLocalVideo');

      deviceController.bindToAudioVideoController(avController);
      avController.videoTileController.startLocalVideoTile();

      await deviceController.chooseVideoInputDevice('test');
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test-different-device', [processor]);

      await deviceController.chooseVideoInputDevice(device);
      const newDevice = device.chooseNewInnerDevice('fake-test');
      await deviceController.chooseVideoInputDevice(newDevice);
      avController.videoTileController.stopLocalVideoTile();
      await device.stop();
      await newDevice.stop();
      expect(spy.called).to.equal(true);
    });

    it('can fail to switch between VideoTransformDevice because track is empty', async () => {
      domMockBehavior.mediaStreamTrackSettings = {
        width: 0,
        height: 0,
        deviceId: 'test-same-device',
        facingMode: 'user',
      };
      const spy = sinon.spy(audioVideoController, 'replaceLocalVideo');

      deviceController.bindToAudioVideoController(audioVideoController);
      audioVideoController.videoTileController.startLocalVideoTile();

      await deviceController.chooseVideoInputDevice('test');
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test-different-device', [processor]);
      try {
        await deviceController.chooseVideoInputDevice(device);
        throw new Error('not reachable');
      } catch (error) {}

      audioVideoController.videoTileController.stopLocalVideoTile();
      await device.stop();
      expect(spy.called).to.equal(true);
    });

    it('can reuse the same stream for VideoTransformDevice', async () => {
      domMockBehavior.mediaStreamTrackSettings = {
        width: 0,
        height: 0,
        deviceId: 'test-same-device',
        facingMode: 'user',
      };
      class TestAudioVideoController extends NoOpAudioVideoController {
        async replaceLocalVideo(): Promise<void> {
          return;
        }
      }
      const avController = new TestAudioVideoController();
      const spy = sinon.spy(navigator.mediaDevices, 'getUserMedia');

      deviceController.bindToAudioVideoController(avController);
      avController.videoTileController.startLocalVideoTile();

      await deviceController.chooseVideoInputDevice('test-same-device');
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test-same-device', [processor]);

      await deviceController.chooseVideoInputDevice(device);

      avController.videoTileController.stopLocalVideoTile();
      await device.stop();
      expect(spy.calledOnce).to.equal(true);
    });

    it('fail to reuse the same stream for VideoTransformDevice if deviceId is not available ', async () => {
      domMockBehavior.mediaStreamTrackSettings = {
        width: 0,
        height: 0,
        deviceId: '',
        facingMode: 'user',
      };
      class TestAudioVideoController extends NoOpAudioVideoController {
        async replaceLocalVideo(): Promise<void> {
          return;
        }
      }
      const avController = new TestAudioVideoController();
      const spy = sinon.spy(navigator.mediaDevices, 'getUserMedia');

      deviceController.bindToAudioVideoController(avController);
      avController.videoTileController.startLocalVideoTile();

      await deviceController.chooseVideoInputDevice('test-same-device');
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, 'test-same-device', [processor]);

      await deviceController.chooseVideoInputDevice(device);

      avController.videoTileController.stopLocalVideoTile();
      await device.stop();
      expect(spy.calledTwice).to.equal(true);
    });

    it('do not reuse the same stream for VideoTransformDevice if multiple device constraints', async () => {
      domMockBehavior.mediaStreamTrackSettings = {
        width: 0,
        height: 0,
        deviceId: 'device-id-1',
        facingMode: 'user',
      };
      class TestAudioVideoController extends NoOpAudioVideoController {
        async replaceLocalVideo(): Promise<void> {
          return;
        }
      }
      const avController = new TestAudioVideoController();
      const spy = sinon.spy(navigator.mediaDevices, 'getUserMedia');

      deviceController.bindToAudioVideoController(avController);
      avController.videoTileController.startLocalVideoTile();

      const constraints: MediaTrackConstraints = {
        deviceId: ['device-id-1', 'device-id-2'],
        sampleRate: 44100,
      };
      await deviceController.chooseVideoInputDevice(constraints);
      const processor = new NoOpVideoFrameProcessor();
      const device = new DefaultVideoTransformDevice(logger, constraints, [processor]);

      await deviceController.chooseVideoInputDevice(device);

      avController.videoTileController.stopLocalVideoTile();
      await device.stop();
      expect(spy.calledTwice).to.equal(true);
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
        await deviceController.chooseAudioInputDevice('1234');
        await deviceController.chooseVideoInputDevice('1234');
      } catch (e) {
        throw new Error('This line should not be reached.');
      }
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

    it('does not release the video input stream acquired after no device request', async () => {
      // @ts-ignore
      const spyRAD = sinon.spy(deviceController, 'releaseActiveDevice');
      const spyRMS = sinon.spy(deviceController, 'releaseMediaStream');
      domMockBehavior.asyncWaitMs = 500;
      await deviceController.chooseVideoInputDevice(null);
      expect(spyRAD.notCalled).to.be.true;
      await deviceController.chooseVideoInputDevice(stringDeviceId);
      // @ts-ignore
      expect(spyRAD.calledOnceWith(null)).to.be.true;
      expect(spyRMS.notCalled).to.be.true;
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
        await delay(10);
        deviceController.chooseVideoInputDevice(stringDeviceIds[2]);
        await delay(10);
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

    it("disconnects the audio input source node, not the given stream's tracks", async () => {
      enableWebAudio(true);
      await deviceController.chooseAudioInputDevice(stringDeviceId);
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
      await delay(100);
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
      await delay(100);
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
      const spy1 = sinon.spy(DefaultVideoTile, 'disconnectVideoStreamFromVideoElement');
      const spy2 = sinon.spy(DefaultVideoTile, 'connectVideoStreamToVideoElement');
      const gUM = sinon.spy(navigator.mediaDevices, 'getUserMedia');
      await deviceController.chooseVideoInputDevice(stringDeviceId);
      deviceController.startVideoPreviewForVideoInput(element);
      expect(spy1.calledOnce).to.be.true;
      expect(spy2.calledOnce).to.be.true;
      expect(gUM.calledOnce).to.be.true;
      spy1.restore();
      spy2.restore();
      gUM.restore();
    });

    it('does not disconnect or connect the video stream for preview if no active video exists', () => {
      const spy1 = sinon.spy(DefaultVideoTile, 'disconnectVideoStreamFromVideoElement');
      const spy2 = sinon.spy(DefaultVideoTile, 'connectVideoStreamToVideoElement');
      const gUM = sinon.spy(navigator.mediaDevices, 'getUserMedia');
      deviceController.startVideoPreviewForVideoInput(element);
      expect(spy1.called).to.be.false;
      expect(spy2.called).to.be.false;
      expect(gUM.calledOnce).to.be.false;
      spy1.restore();
      spy2.restore();
      gUM.restore();
    });

    it('disconnects the video stream of the given element', async () => {
      const spy = sinon.spy(DefaultVideoTile, 'disconnectVideoStreamFromVideoElement');
      await deviceController.chooseVideoInputDevice(stringDeviceId);
      const stream = await deviceController.acquireVideoInputStream();
      // @ts-ignore
      element.srcObject = stream;
      deviceController.stopVideoPreviewForVideoInput(element);
      await delay(100);
      expect(spy.calledOnceWith(element, false)).to.be.true;
    });

    it('releases the video stream of the active video input', async () => {
      deviceController.bindToAudioVideoController(audioVideoController);
      await deviceController.chooseVideoInputDevice(stringDeviceId);
      deviceController.stopVideoPreviewForVideoInput(element);
      await delay(100);

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
    it('can create a black video device', async () => {
      const stream = new MediaStream();
      const track = new MediaStreamTrack();
      stream.addTrack(track);

      domMockBehavior.createElementCaptureStream = stream;
      const device: VideoInputDevice = DefaultDeviceController.createEmptyVideoDevice();
      expect(device).to.equal(stream);
      await delay(1500);

      (track as StoppableMediaStreamTrack).externalStop();
      await delay(100);
    });

    it('can create a smpte video device', async () => {
      const stream = new MediaStream();
      const track = new MediaStreamTrack();
      stream.addTrack(track);

      domMockBehavior.createElementCaptureStream = stream;
      const device: VideoInputDevice = DefaultDeviceController.synthesizeVideoDevice('smpte');
      await delay(1500);
      expect(device).to.equal(stream);

      (track as StoppableMediaStreamTrack).externalStop();
      await delay(100);
    });

    it('cannot create an empty video device if the stream is not available in the canvas', () => {
      domMockBehavior.createElementCaptureStream = undefined;
      const device: VideoInputDevice = DefaultDeviceController.synthesizeVideoDevice('smpte');
      expect(device).to.equal(null);
    });

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
      const observer: DeviceChangeObserver = {
        audioInputStreamEnded: (_deviceId: string): void => {
          audioInputStreamEndedCallCount += 1;
        },
      };
      deviceController.addDeviceChangeObserver(observer);
      await deviceController.chooseAudioInputDevice(stringDeviceId);
      const stream = await deviceController.acquireAudioInputStream();
      (stream.getAudioTracks()[0] as StoppableMediaStreamTrack).externalStop();
      await delay(100);
      expect(audioInputStreamEndedCallCount).to.equal(1);
    });

    it('calls ended for constraints', async () => {
      let audioInputStreamEndedCallCount = 0;
      const observer: DeviceChangeObserver = {
        audioInputStreamEnded: (_deviceId: string): void => {
          audioInputStreamEndedCallCount += 1;
        },
      };
      deviceController.addDeviceChangeObserver(observer);
      await deviceController.chooseAudioInputDevice({ deviceId: stringDeviceId });
      const stream = await deviceController.acquireAudioInputStream();
      (stream.getAudioTracks()[0] as StoppableMediaStreamTrack).externalStop();
      await delay(100);
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
      (stream.getVideoTracks()[0] as StoppableMediaStreamTrack).externalStop();
      await delay(100);
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
      (stream.getVideoTracks()[0] as StoppableMediaStreamTrack).externalStop();
      await delay(100);
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
      expect(deviceController.chooseAudioInputDevice(stringDeviceId)).to.eventually.be.rejectedWith(
        'Error fetching device.'
      );
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
      expect(deviceController.chooseAudioInputDevice(stringDeviceId)).to.eventually.be.rejectedWith(
        'Permission denied by browser'
      );
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
      expect(deviceController.chooseAudioInputDevice(stringDeviceId)).to.eventually.be.rejectedWith(
        'Permission denied by browser'
      );
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
      expect(deviceController.chooseAudioInputDevice(stringDeviceId)).to.eventually.be.rejectedWith(
        'Error fetching device'
      );
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
