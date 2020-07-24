// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import DeviceChangeObserver from '../../src/devicechangeobserver/DeviceChangeObserver';
import DefaultDeviceController from '../../src/devicecontroller/DefaultDeviceController';
import Device from '../../src/devicecontroller/Device';
import DevicePermission from '../../src/devicecontroller/DevicePermission';
import NoOpLogger from '../../src/logger/NoOpLogger';
import MediaDeviceProxyHandler from '../../src/mediadevicefactory/MediaDeviceProxyHandler';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import NoOpVideoElementFactory from '../../src/videoelementfactory/NoOpVideoElementFactory';
import DefaultVideoTile from '../../src/videotile/DefaultVideoTile';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultDeviceController', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpLogger();
  const stringDeviceId: Device = 'string-device-id';

  let deviceController: DefaultDeviceController;
  let audioVideoController: NoOpAudioVideoController;
  let domMockBuilder: DOMMockBuilder;
  let domMockBehavior: DOMMockBehavior;

  function getMediaStreamDevice(id: string): Device {
    const device: Device = new MediaStream();
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
    deviceController = new DefaultDeviceController(logger);
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const GlobalAny = global as any;
      // Deleting MediaDeviceInfo throws "ReferenceError: MediaDeviceInfo is not defined."
      // For testing, assign a boolean.
      GlobalAny['window']['MediaDeviceInfo'] = false;
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
      const constraints: Device = {};
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
      const constraints: Device = {};
      await deviceController.chooseVideoInputDevice(constraints);

      expect(JSON.stringify(constraints.width)).to.equal(JSON.stringify({ ideal: 576 }));
      expect(JSON.stringify(constraints.height)).to.equal(JSON.stringify({ ideal: 576 }));
    });
  });

  describe('chooseAudioInputDevice', () => {
    it('chooses no device', async () => {
      const device: Device = null;
      const permission = await deviceController.chooseAudioInputDevice(device);
      expect(permission).to.equal(DevicePermission.PermissionGrantedByBrowser);
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
      const permission = await deviceController.chooseAudioInputDevice(stringDeviceId);
      expect(permission).to.equal(DevicePermission.PermissionGrantedByBrowser);
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
        const permission = await deviceController.chooseAudioInputDevice(stringDeviceId);
        expect(permission).to.equal(DevicePermission.PermissionGrantedByBrowser);
        expect(called).to.be.true;
      } catch (error) {
        throw new Error('This line should not be reached.');
      }
    });

    it('attaches the audio input stream to the audio context', async () => {
      deviceController.enableWebAudio(true);
      let permission = await deviceController.chooseAudioInputDevice(stringDeviceId);
      expect(permission).to.equal(DevicePermission.PermissionGrantedByBrowser);

      // The previous audio source node will be disconneted.
      permission = await deviceController.chooseAudioInputDevice('another-device-id');
      expect(permission).to.equal(DevicePermission.PermissionGrantedByBrowser);
    });

    it('releases audio media stream when requesting default device and default is already active in chromium based browser', async () => {
      deviceController.enableWebAudio(true);
      domMockBehavior.browserName = 'chrome';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      deviceController = new DefaultDeviceController(logger);
      domMockBehavior.enumerateDeviceList = [
        getMediaDeviceInfo('default', 'audioinput', 'label', 'group-id-1'),
      ];
      await deviceController.listAudioInputDevices();
      let permission = await deviceController.chooseAudioInputDevice('default');
      expect(permission).to.equal(DevicePermission.PermissionGrantedByBrowser);
      domMockBehavior.enumerateDeviceList.pop();
      // add external default device
      domMockBehavior.enumerateDeviceList = [
        getMediaDeviceInfo('default', 'audioinput', 'default - label2', 'group-id-2'),
      ];
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      await deviceController.listAudioInputDevices();
      permission = await deviceController.chooseAudioInputDevice('default');
      expect(permission).to.equal(DevicePermission.PermissionGrantedByBrowser);
    });

    it('sets to null device when an external device disconnects', async () => {
      deviceController.enableWebAudio(true);
      let permission = await deviceController.chooseAudioInputDevice(stringDeviceId);
      expect(permission).to.equal(DevicePermission.PermissionGrantedByBrowser);

      // The previous audio source node will be disconneted.
      permission = await deviceController.chooseAudioInputDevice(null);
      expect(permission).to.equal(DevicePermission.PermissionGrantedByBrowser);
    });

    it('releases all previously-acquired audio streams', done => {
      const stringDeviceIds: Device[] = [
        'device-id-1',
        'device-id-2',
        'device-id-3',
        'device-id-4',
      ];
      let releasedDevices = new Set();

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
  });

  describe('chooseVideoInputDevice', () => {
    it('chooses no device', async () => {
      const device: Device = null;
      const permission = await deviceController.chooseVideoInputDevice(device);
      expect(permission).to.equal(DevicePermission.PermissionGrantedByBrowser);
    });

    it('chooses the device by browser', async () => {
      const permission = await deviceController.chooseVideoInputDevice(stringDeviceId);
      expect(permission).to.equal(DevicePermission.PermissionGrantedByBrowser);
    });

    it('chooses the device by user', async () => {
      domMockBehavior.asyncWaitMs = 1500;
      const permission = await deviceController.chooseVideoInputDevice(stringDeviceId);
      expect(permission).to.equal(DevicePermission.PermissionGrantedByUser);
    });

    it('chooses the device as a media stream', async () => {
      const device: Device = getMediaStreamDevice('device-id');
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
      const permission = await deviceController.chooseVideoInputDevice(stringDeviceId);
      expect(permission).to.equal(DevicePermission.PermissionDeniedByBrowser);
    });

    it('denies the permission by user', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.asyncWaitMs = 1500;
      const permission = await deviceController.chooseVideoInputDevice(stringDeviceId);
      expect(permission).to.equal(DevicePermission.PermissionDeniedByUser);
    });

    it('cannot choose the device of an empty string ID', async () => {
      const device: Device = '';
      const permission = await deviceController.chooseVideoInputDevice(device);
      expect(permission).to.equal(DevicePermission.PermissionDeniedByBrowser);
    });
  });

  describe('chooseVideoInputDevice (advanced for LED issues)', () => {
    it('releases the video input stream acquired before no device request', done => {
      const spy = sinon.spy(deviceController, 'releaseMediaStream');
      domMockBehavior.asyncWaitMs = 500;
      deviceController.chooseVideoInputDevice(stringDeviceId).then(devicePermission => {
        expect(devicePermission).to.equal(DevicePermission.PermissionGrantedByUser);
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
      deviceController.chooseVideoInputDevice(stringDeviceId).then(devicePermission => {
        expect(devicePermission).to.equal(DevicePermission.PermissionGrantedByBrowser);
        expect(spy.calledOnceWith(null)).to.be.true;
        done();
      });
    });

    it('releases 3 video input streams acquired before no device request', done => {
      const spy = sinon.spy(deviceController, 'releaseMediaStream');
      let callCount = 0;
      domMockBehavior.asyncWaitMs = 500;
      deviceController.chooseVideoInputDevice(stringDeviceId).then(devicePermission => {
        expect(devicePermission).to.equal(DevicePermission.PermissionGrantedByUser);
        callCount += 1;
      });
      new TimeoutScheduler(10).start(() => {
        deviceController.chooseVideoInputDevice(stringDeviceId).then(devicePermission => {
          expect(devicePermission).to.equal(DevicePermission.PermissionGrantedByUser);
          callCount += 1;
        });
      });
      new TimeoutScheduler(100).start(() => {
        deviceController.chooseVideoInputDevice(stringDeviceId).then(devicePermission => {
          expect(devicePermission).to.equal(DevicePermission.PermissionGrantedByUser);
          callCount += 1;
        });
      });
      new TimeoutScheduler(300).start(() => {
        deviceController.chooseVideoInputDevice(null);
      });
      new TimeoutScheduler(1000).start(() => {
        expect(callCount).to.equal(3);
        expect(spy.callCount).to.equal(3);
        done();
      });
    });

    it('releases all previously-acquired video streams', done => {
      const stringDeviceIds: Device[] = [
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

    it("disconnects the audio input source node instead of the given stream's tracks", async () => {
      deviceController.enableWebAudio(true);
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
        getMediaDeviceInfo(stringDeviceId, 'audiooutput', 'label'),
      ];
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
      const device: Device = getMediaStreamDevice('device-id');
      await deviceController.chooseAudioInputDevice(device);
      const stream = await deviceController.acquireAudioInputStream();
      expect(stream).to.equal(device);
    });

    it('acquires an non-empty stream when the web audio is enabled', async () => {
      deviceController.enableWebAudio(true);
      const stream = await deviceController.acquireAudioInputStream();
      expect(stream).to.exist;
    });

    it('cannot acquire a video input stream if the permission is denied by user', async () => {
      // Choose the video input device.
      await deviceController.chooseVideoInputDevice(stringDeviceId);
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.asyncWaitMs = 1500;
      try {
        // Make the acquired stream inactive.
        const stream = await deviceController.acquireVideoInputStream();
        // @ts-ignore
        stream.active = false;

        // SDK will fail to acquire the inactive video stream.
        await deviceController.acquireVideoInputStream();
        throw new Error('This line should not be reached.');
      } catch (error) {
        expect(error.message).includes(`unable to acquire video device`);
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

    it('can create the analyser node if no active audio exists', async () => {
      await deviceController.chooseAudioInputDevice(stringDeviceId);
      expect(deviceController.createAnalyserNodeForAudioInput()).to.exist;
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
      deviceController.enableWebAudio(true);
      let stream = new MediaStream();
      let node = deviceController.mixIntoAudioInput(stream);
      expect(node.mediaStream).to.equal(stream);

      stream = new MediaStream();
      node = deviceController.mixIntoAudioInput(stream);
      expect(node.mediaStream).to.equal(stream);
    });

    it('does not create an audio source node if the web audio is disabled', async () => {
      deviceController.enableWebAudio(false);
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
      const device: Device = DefaultDeviceController.createEmptyVideoDevice();
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
      const device: Device = DefaultDeviceController.synthesizeVideoDevice('smpte');
      await new Promise(resolve => new TimeoutScheduler(1500).start(resolve));
      expect(device).to.equal(stream);

      track.stop();
      await new Promise(resolve => new TimeoutScheduler(100).start(resolve));
    });

    it('cannot create an empty video device if the stream is not available in the canvas', () => {
      domMockBehavior.createElementCaptureStream = undefined;
      const device: Device = DefaultDeviceController.synthesizeVideoDevice('smpte');
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
});
