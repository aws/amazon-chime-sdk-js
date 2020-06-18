// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoController from '../audiovideocontroller/AudioVideoController';
import BrowserBehavior from '../browserbehavior/BrowserBehavior';
import DefaultBrowserBehavior from '../browserbehavior/DefaultBrowserBehavior';
import DeviceChangeObserver from '../devicechangeobserver/DeviceChangeObserver';
import Logger from '../logger/Logger';
import Maybe from '../maybe/Maybe';
import DefaultMediaDeviceFactory from '../mediadevicefactory/DefaultMediaDeviceFactory';
import DeviceControllerBasedMediaStreamBroker from '../mediastreambroker/DeviceControllerBasedMediaStreamBroker';
import AsyncScheduler from '../scheduler/AsyncScheduler';
import IntervalScheduler from '../scheduler/IntervalScheduler';
import DefaultVideoTile from '../videotile/DefaultVideoTile';
import Device from './Device';
import DevicePermission from './DevicePermission';
import DeviceSelection from './DeviceSelection';

export default class DefaultDeviceController implements DeviceControllerBasedMediaStreamBroker {
  private static permissionGrantedOriginDetectionThresholdMs = 1000;
  private static permissionDeniedOriginDetectionThresholdMs = 500;
  private static defaultVideoWidth = 1280;
  private static defaultVideoHeight = 720;
  private static defaultVideoFrameRate = 15;
  private static defaultVideoMaxBandwidthKbps = 1400;
  private static defaultSampleRate = 48000;
  private static defaultSampleSize = 16;
  private static defaultChannelCount = 1;
  private browserBehavior: BrowserBehavior = new DefaultBrowserBehavior();
  private deviceInfoCache: MediaDeviceInfo[] | null = null;
  private activeDevices: { [kind: string]: DeviceSelection | null } = { audio: null, video: null };
  private audioOutputDeviceId: string | null = null;
  private deviceChangeObservers: Set<DeviceChangeObserver> = new Set<DeviceChangeObserver>();
  private boundAudioVideoController: AudioVideoController | null;
  private deviceLabelTrigger = (): Promise<MediaStream> => {
    return navigator.mediaDevices.getUserMedia({ audio: true, video: true });
  };
  private audioInputContext: AudioContext | null = null;
  private audioInputDestinationNode: MediaStreamAudioDestinationNode | null = null;
  private audioInputSourceNode: MediaStreamAudioSourceNode | null = null;

  private videoWidth: number = DefaultDeviceController.defaultVideoWidth;
  private videoHeight: number = DefaultDeviceController.defaultVideoHeight;
  private videoFrameRate: number = DefaultDeviceController.defaultVideoFrameRate;
  private videoMaxBandwidthKbps: number = DefaultDeviceController.defaultVideoMaxBandwidthKbps;

  private useWebAudio: boolean = false;
  private isAndroid: boolean = false;
  private isPixel3: boolean = false;

  private inputDeviceCount: number = 0;
  private lastNoVideoInputDeviceCount: number;

  constructor(private logger: Logger) {
    this.isAndroid = /(android)/i.test(navigator.userAgent);
    this.isPixel3 = /( pixel 3)/i.test(navigator.userAgent);
    if (this.isAndroid && this.isPixel3) {
      this.videoWidth = Math.ceil(this.videoWidth / 32) * 32;
      this.videoHeight = Math.ceil(this.videoHeight / 32) * 32;
    }
    this.logger.info(
      `DefaultDeviceController video dimension ${this.videoWidth} x ${this.videoHeight}`
    );

    try {
      const mediaDeviceWrapper = new DefaultMediaDeviceFactory().create();
      mediaDeviceWrapper.addEventListener('devicechange', () => {
        this.handleDeviceChange();
      });
    } catch (error) {
      logger.error(error.message);
    }
  }

  async listAudioInputDevices(): Promise<MediaDeviceInfo[]> {
    const result = await this.listDevicesOfKind('audioinput');
    this.trace('listAudioInputDevices', null, result);
    return result;
  }

  async listVideoInputDevices(): Promise<MediaDeviceInfo[]> {
    const result = await this.listDevicesOfKind('videoinput');
    this.trace('listVideoInputDevices', null, result);
    return result;
  }

  async listAudioOutputDevices(): Promise<MediaDeviceInfo[]> {
    const result = await this.listDevicesOfKind('audiooutput');
    this.trace('listAudioOutputDevices', null, result);
    return result;
  }

  async chooseAudioInputDevice(device: Device): Promise<DevicePermission> {
    const result = await this.chooseInputDevice('audio', device, false);
    this.trace('chooseAudioInputDevice', device, DevicePermission[result]);
    return result;
  }

  async chooseVideoInputDevice(device: Device): Promise<DevicePermission> {
    this.updateMaxBandwidthKbps();
    const result = await this.chooseInputDevice('video', device, false);
    this.trace('chooseVideoInputDevice', device, DevicePermission[result]);
    return result;
  }

  async chooseAudioOutputDevice(deviceId: string | null): Promise<void> {
    this.audioOutputDeviceId = deviceId;
    this.bindAudioOutput();
    this.trace('chooseAudioOutputDevice', deviceId, null);
    return;
  }

  enableWebAudio(flag: boolean): void {
    this.useWebAudio = flag;
    this.trace('enableWebAudio', flag);
  }

  addDeviceChangeObserver(observer: DeviceChangeObserver): void {
    this.logger.info('adding device change observer');
    this.deviceChangeObservers.add(observer);
    this.trace('addDeviceChangeObserver');
  }

  removeDeviceChangeObserver(observer: DeviceChangeObserver): void {
    this.logger.info('removing device change observer');
    this.deviceChangeObservers.delete(observer);
    this.trace('removeDeviceChangeObserver');
  }

  createAnalyserNodeForAudioInput(): AnalyserNode | null {
    if (!this.activeDevices['audio']) {
      return null;
    }
    const audioContext = DefaultDeviceController.createAudioContext();
    const analyser = audioContext.createAnalyser();
    audioContext.createMediaStreamSource(this.activeDevices['audio'].stream).connect(analyser);
    this.trace('createAnalyserNodeForAudioInput');
    return analyser;
  }

  startVideoPreviewForVideoInput(element: HTMLVideoElement): void {
    if (!this.activeDevices['video']) {
      this.logger.warn('cannot bind video preview since video input device has not been chosen');
      this.trace('startVideoPreviewForVideoInput', element.id);
      return;
    }

    // TODO: implement MediaDestroyer to provide single release MediaStream function
    this.releaseMediaStream(element.srcObject as MediaStream);
    DefaultVideoTile.disconnectVideoStreamFromVideoElement(element, false);
    navigator.mediaDevices
      .getUserMedia(this.activeDevices['video'].constraints)
      .then(previewStream => {
        DefaultVideoTile.connectVideoStreamToVideoElement(previewStream, element, true);
      })
      .catch(error => {
        this.logger.warn(
          `Unable to reacquire video stream for preview to element ${element.id}: ${error}`
        );
      });

    this.trace('startVideoPreviewForVideoInput', element.id);
  }

  stopVideoPreviewForVideoInput(element: HTMLVideoElement): void {
    const stream: MediaStream = element.srcObject as MediaStream;
    if (stream) {
      this.releaseMediaStream(stream);
      DefaultVideoTile.disconnectVideoStreamFromVideoElement(element, false);
    }
    if (this.activeDevices['video']) {
      this.releaseMediaStream(this.activeDevices['video'].stream);
    }
    this.trace('stopVideoPreviewForVideoInput', element.id);
  }

  setDeviceLabelTrigger(trigger: () => Promise<MediaStream>): void {
    this.deviceLabelTrigger = trigger;
    this.trace('setDeviceLabelTrigger');
  }

  mixIntoAudioInput(stream: MediaStream): MediaStreamAudioSourceNode {
    let node: MediaStreamAudioSourceNode | null = null;
    if (this.useWebAudio) {
      this.ensureAudioInputContext();
      node = this.audioInputContext.createMediaStreamSource(stream);
      node.connect(this.audioInputDestinationNode);
    } else {
      this.logger.warn('WebAudio is not enabled, mixIntoAudioInput will not work');
    }

    this.trace('mixIntoAudioInput', stream.id);
    return node;
  }

  chooseVideoInputQuality(
    width: number,
    height: number,
    frameRate: number,
    maxBandwidthKbps: number
  ): void {
    if (this.isAndroid && this.isPixel3) {
      this.videoWidth = Math.ceil(width / 32) * 32;
      this.videoHeight = Math.ceil(height / 32) * 32;
    } else {
      this.videoWidth = width;
      this.videoHeight = height;
    }
    this.videoFrameRate = frameRate;
    this.videoMaxBandwidthKbps = maxBandwidthKbps;
    this.updateMaxBandwidthKbps();
  }

  async acquireAudioInputStream(): Promise<MediaStream> {
    return await this.acquireInputStream('audio');
  }

  async acquireVideoInputStream(): Promise<MediaStream> {
    return await this.acquireInputStream('video');
  }

  async acquireDisplayInputStream(streamConstraints: MediaStreamConstraints): Promise<MediaStream> {
    if (
      streamConstraints &&
      streamConstraints.video &&
      // @ts-ignore
      streamConstraints.video.mandatory &&
      // @ts-ignore
      streamConstraints.video.mandatory.chromeMediaSource &&
      // @ts-ignore
      streamConstraints.video.mandatory.chromeMediaSourceId
    ) {
      return navigator.mediaDevices.getUserMedia(streamConstraints);
    }
    // @ts-ignore https://github.com/microsoft/TypeScript/issues/31821
    return navigator.mediaDevices.getDisplayMedia(streamConstraints);
  }

  releaseMediaStream(mediaStreamToRelease: MediaStream | null): void {
    if (!mediaStreamToRelease) {
      return;
    }
    let tracksToStop: MediaStreamTrack[] | null = null;

    if (
      !!this.audioInputDestinationNode &&
      mediaStreamToRelease === this.audioInputDestinationNode.stream
    ) {
      // release the true audio stream if WebAudio is used.
      this.logger.info('stopping audio track');
      tracksToStop = this.audioInputSourceNode.mediaStream.getTracks();
      this.audioInputSourceNode.disconnect();
    } else {
      tracksToStop = mediaStreamToRelease.getTracks();
    }
    for (const track of tracksToStop) {
      this.logger.info(`stopping ${track.kind} track`);
      track.stop();
    }
    for (const kind in this.activeDevices) {
      if (this.activeDevices[kind] && this.activeDevices[kind].stream === mediaStreamToRelease) {
        this.activeDevices[kind] = null;
      }
    }
  }

  bindToAudioVideoController(audioVideoController: AudioVideoController): void {
    this.boundAudioVideoController = audioVideoController;
    this.bindAudioOutput();
  }

  static createEmptyAudioDevice(): Device {
    return DefaultDeviceController.synthesizeAudioDevice(0);
  }

  static createEmptyVideoDevice(): Device {
    return DefaultDeviceController.synthesizeVideoDevice('black');
  }

  static synthesizeAudioDevice(toneHz: number): Device {
    const audioContext = DefaultDeviceController.createAudioContext();
    const outputNode = audioContext.createMediaStreamDestination();
    if (!toneHz) {
      const source = audioContext.createBufferSource();
      source.buffer = audioContext.createBuffer(
        1,
        audioContext.sampleRate * 5,
        audioContext.sampleRate
      );
      // Some browsers will not play audio out the MediaStreamDestination
      // unless there is actually audio to play, so we add a small amount of
      // noise here to ensure that audio is played out.
      source.buffer.getChannelData(0)[0] = 0.0003;
      source.loop = true;
      source.connect(outputNode);
      source.start();
    } else {
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.1;
      gainNode.connect(outputNode);
      const oscillatorNode = audioContext.createOscillator();
      oscillatorNode.frequency.value = toneHz;
      oscillatorNode.connect(gainNode);
      oscillatorNode.start();
    }
    outputNode.addEventListener('ended', () => {
      audioContext.close();
    });
    return outputNode.stream;
  }

  static synthesizeVideoDevice(colorOrPattern: string): Device {
    const canvas = document.createElement('canvas') as HTMLCanvasElement;
    canvas.width = 480;
    canvas.height = (canvas.width / 16) * 9;
    const scheduler = new IntervalScheduler(1000);
    const context = canvas.getContext('2d');
    // @ts-ignore
    const stream: MediaStream | null = canvas.captureStream(5) || null;
    if (stream) {
      scheduler.start(() => {
        if (colorOrPattern === 'smpte') {
          DefaultDeviceController.fillSMPTEColorBars(canvas, 0);
        } else {
          context.fillStyle = colorOrPattern;
          context.fillRect(0, 0, canvas.width, canvas.height);
        }
      });
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        scheduler.stop();
      });
    }
    return stream;
  }

  private static fillSMPTEColorBars(canvas: HTMLCanvasElement, xShift: number): void {
    const w = canvas.width;
    const h = canvas.height;
    const h1 = (h * 2) / 3;
    const h2 = (h * 3) / 4;
    const h3 = h;
    const top = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
    const middle = ['#0000c0', '#000000', '#c000c0', '#000000', '#00c0c0', '#000000', '#c0c0c0'];
    const bottom = [
      '#00214c',
      '#ffffff',
      '#32006a',
      '#131313',
      '#090909',
      '#131313',
      '#1d1d1d',
      '#131313',
    ];
    const bottomX = [
      w * 0,
      ((w * 1) / 4) * (5 / 7),
      ((w * 2) / 4) * (5 / 7),
      ((w * 3) / 4) * (5 / 7),
      w * (5 / 7),
      w * (5 / 7 + 1 / 21),
      w * (5 / 7 + 2 / 21),
      w * (6 / 7),
      w * 1,
    ];
    const segmentWidth = w / top.length;
    const ctx = canvas.getContext('2d');
    for (let i = 0; i < top.length; i++) {
      ctx.fillStyle = top[i];
      ctx.fillRect(xShift + i * segmentWidth, 0, segmentWidth, h1);
      ctx.fillStyle = middle[i];
      ctx.fillRect(xShift + i * segmentWidth, h1, segmentWidth, h2 - h1);
    }
    for (let i = 0; i < bottom.length; i++) {
      ctx.fillStyle = bottom[i];
      ctx.fillRect(xShift + bottomX[i], h2, bottomX[i + 1] - bottomX[i], h3 - h2);
    }
  }

  private updateMaxBandwidthKbps(): void {
    if (this.boundAudioVideoController) {
      this.boundAudioVideoController.setVideoMaxBandwidthKbps(this.videoMaxBandwidthKbps);
    }
  }

  private async listDevicesOfKind(deviceKind: string): Promise<MediaDeviceInfo[]> {
    if (this.deviceInfoCache === null) {
      await this.updateDeviceInfoCacheFromBrowser();
    }
    return this.listCachedDevicesOfKind(deviceKind);
  }

  private async updateDeviceInfoCacheFromBrowser(): Promise<void> {
    const doesNotHaveAccessToMediaDevices = !MediaDeviceInfo;
    if (doesNotHaveAccessToMediaDevices) {
      this.deviceInfoCache = [];
      return;
    }
    let devices = await navigator.mediaDevices.enumerateDevices();
    let hasDeviceLabels = true;
    for (const device of devices) {
      if (!device.label) {
        hasDeviceLabels = false;
        break;
      }
    }
    if (!hasDeviceLabels) {
      try {
        this.logger.info('attempting to trigger media device labels since they are hidden');
        const triggerStream = await this.deviceLabelTrigger();
        devices = await navigator.mediaDevices.enumerateDevices();
        for (const track of triggerStream.getTracks()) {
          track.stop();
        }
      } catch (err) {
        this.logger.info('unable to get media device labels');
      }
    }
    this.deviceInfoCache = devices;
  }

  private listCachedDevicesOfKind(deviceKind: string): MediaDeviceInfo[] {
    const devicesOfKind: MediaDeviceInfo[] = [];
    for (const device of this.deviceInfoCache) {
      if (device.kind === deviceKind) {
        devicesOfKind.push(device);
      }
    }
    return devicesOfKind;
  }

  private alreadyHandlingDeviceChange = false;
  private async handleDeviceChange(): Promise<void> {
    if (this.deviceInfoCache === null) {
      return;
    }
    if (this.alreadyHandlingDeviceChange) {
      new AsyncScheduler().start(() => {
        this.handleDeviceChange();
      });
      return;
    }
    this.alreadyHandlingDeviceChange = true;
    const oldAudioInputDevices = this.listCachedDevicesOfKind('audioinput');
    const oldVideoInputDevices = this.listCachedDevicesOfKind('videoinput');
    const oldAudioOutputDevices = this.listCachedDevicesOfKind('audiooutput');
    await this.updateDeviceInfoCacheFromBrowser();
    const newAudioInputDevices = this.listCachedDevicesOfKind('audioinput');
    const newVideoInputDevices = this.listCachedDevicesOfKind('videoinput');
    const newAudioOutputDevices = this.listCachedDevicesOfKind('audiooutput');
    this.forEachObserver((observer: DeviceChangeObserver) => {
      if (!this.areDeviceListsEqual(oldAudioInputDevices, newAudioInputDevices)) {
        Maybe.of(observer.audioInputsChanged).map(f => f.bind(observer)(newAudioInputDevices));
      }
      if (!this.areDeviceListsEqual(oldVideoInputDevices, newVideoInputDevices)) {
        Maybe.of(observer.videoInputsChanged).map(f => f.bind(observer)(newVideoInputDevices));
      }
      if (!this.areDeviceListsEqual(oldAudioOutputDevices, newAudioOutputDevices)) {
        Maybe.of(observer.audioOutputsChanged).map(f => f.bind(observer)(newAudioOutputDevices));
      }
    });
    this.alreadyHandlingDeviceChange = false;
  }

  private forEachObserver(observerFunc: (observer: DeviceChangeObserver) => void): void {
    for (const observer of this.deviceChangeObservers) {
      new AsyncScheduler().start(() => {
        /* istanbul ignore else */
        if (this.deviceChangeObservers.has(observer)) {
          observerFunc(observer);
        }
      });
    }
  }

  private areDeviceListsEqual(a: MediaDeviceInfo[], b: MediaDeviceInfo[]): boolean {
    return (
      JSON.stringify(a.map(device => JSON.stringify(device)).sort()) ===
      JSON.stringify(b.map(device => JSON.stringify(device)).sort())
    );
  }

  private deviceAsMediaStream(device: Device): MediaStream | null {
    // @ts-ignore
    return device && device.id ? device : null;
  }

  private hasSameGroupId(groupId: string, kind: string, device: Device): boolean {
    device = this.getDeviceIdStr(device);
    if (groupId === this.getGroupIdFromDeviceId(kind, device) || groupId === '') {
      return true;
    }
    return false;
  }

  private getGroupIdFromDeviceId(kind: string, device: string): string {
    if (this.deviceInfoCache !== null) {
      const cachedDeviceInfo = this.listCachedDevicesOfKind(`${kind}input`).find(
        (cachedDevice: MediaDeviceInfo) => cachedDevice.deviceId === device
      );
      if (cachedDeviceInfo && cachedDeviceInfo.groupId) {
        return cachedDeviceInfo.groupId;
      }
    }
    return '';
  }

  private getDeviceIdStr(device: Device): string | null {
    if (typeof device === 'string') {
      return device;
    }
    if (device === null) {
      return null;
    }
    const deviceMediaTrackConstraints = device as MediaTrackConstraints;
    if ((device as MediaStream).id) {
      return (device as MediaStream).id;
    } else if (deviceMediaTrackConstraints.deviceId) {
      /* istanbul ignore else */
      if ((deviceMediaTrackConstraints.deviceId as ConstrainDOMStringParameters).exact) {
        /* istanbul ignore else */
        if (
          (deviceMediaTrackConstraints.deviceId as ConstrainDOMStringParameters).exact as string
        ) {
          return (deviceMediaTrackConstraints.deviceId as ConstrainDOMStringParameters)
            .exact as string;
        }
      }
    }
    return '';
  }

  getActiveDeviceId(kind: string): string | null {
    if (this.activeDevices[kind] && this.activeDevices[kind].constraints) {
      const activeDeviceMediaTrackConstraints =
        this.activeDevices[kind].constraints.audio || this.activeDevices[kind].constraints.video;
      const activeDeviceConstrainDOMStringParameters = (activeDeviceMediaTrackConstraints as MediaTrackConstraints)
        .deviceId;
      const activeDeviceId = (activeDeviceConstrainDOMStringParameters as ConstrainDOMStringParameters)
        .exact;
      /* istanbul ignore else */
      if (activeDeviceId as string) return activeDeviceId as string;
    }
    return null;
  }

  private async chooseInputDevice(
    kind: string,
    device: Device,
    fromAcquire: boolean
  ): Promise<DevicePermission> {
    this.inputDeviceCount += 1;
    const callCount = this.inputDeviceCount;

    if (device === null && kind === 'video') {
      this.lastNoVideoInputDeviceCount = this.inputDeviceCount;
      if (this.activeDevices[kind]) {
        this.releaseMediaStream(this.activeDevices[kind].stream);
        delete this.activeDevices[kind];
      }
      return DevicePermission.PermissionGrantedByBrowser;
    }

    const proposedConstraints: MediaStreamConstraints | null = this.calculateMediaStreamConstraints(
      kind,
      device
    );

    if (
      this.activeDevices[kind] &&
      this.activeDevices[kind].matchesConstraints(proposedConstraints) &&
      this.activeDevices[kind].stream.active &&
      this.activeDevices[kind].groupId !== null &&
      this.hasSameGroupId(this.activeDevices[kind].groupId, kind, device)
    ) {
      this.logger.info(`reusing existing ${kind} device`);
      return DevicePermission.PermissionGrantedPreviously;
    }
    const startTimeMs = Date.now();
    const newDevice: DeviceSelection = new DeviceSelection();
    try {
      this.logger.info(
        `requesting new ${kind} device with constraint ${JSON.stringify(proposedConstraints)}`
      );
      const stream = this.deviceAsMediaStream(device);
      if (kind === 'audio' && device === null) {
        newDevice.stream = DefaultDeviceController.createEmptyAudioDevice() as MediaStream;
        newDevice.constraints = null;
      } else if (stream) {
        this.logger.info(`using media stream ${stream.id} for ${kind} device`);
        newDevice.stream = stream;
        newDevice.constraints = proposedConstraints;
      } else {
        if (
          this.browserBehavior.hasChromiumWebRTC() &&
          this.getDeviceIdStr(device) === this.getActiveDeviceId(kind) &&
          this.getDeviceIdStr(device) === 'default'
        ) {
          this.releaseMediaStream(this.activeDevices[kind].stream);
        }
        newDevice.stream = await navigator.mediaDevices.getUserMedia(proposedConstraints);
        newDevice.constraints = proposedConstraints;
        if (kind === 'video' && this.lastNoVideoInputDeviceCount > callCount) {
          this.logger.warn(
            `ignored to get video device for constraints ${JSON.stringify(
              proposedConstraints
            )} as no device was requested`
          );
          this.releaseMediaStream(newDevice.stream);
          return DevicePermission.PermissionGrantedByUser;
        }

        await this.handleDeviceChange();
        newDevice.stream.getTracks()[0].addEventListener('ended', () => {
          if (this.activeDevices[kind].stream === newDevice.stream) {
            this.logger.warn(
              `${kind} input device which was active is no longer available, resetting to null device`
            );
            this.chooseInputDevice(kind, null, false);
            if (
              kind === 'video' &&
              this.boundAudioVideoController &&
              this.boundAudioVideoController.videoTileController.hasStartedLocalVideoTile()
            ) {
              this.boundAudioVideoController.videoTileController.stopLocalVideoTile();
            }
          }
        });
      }
      newDevice.groupId = this.getGroupIdFromDeviceId(kind, this.getDeviceIdStr(device));
    } catch (error) {
      this.logger.error(
        `failed to get ${kind} device for constraints ${JSON.stringify(proposedConstraints)}: ${
          error.message
        }`
      );
      return Date.now() - startTimeMs <
        DefaultDeviceController.permissionDeniedOriginDetectionThresholdMs
        ? DevicePermission.PermissionDeniedByBrowser
        : DevicePermission.PermissionDeniedByUser;
    }
    this.logger.info(`got ${kind} device for constraints ${JSON.stringify(proposedConstraints)}`);

    const oldStream: MediaStream | null = this.activeDevices[kind]
      ? this.activeDevices[kind].stream
      : null;
    this.activeDevices[kind] = newDevice;

    if (kind === 'video') {
      if (
        !fromAcquire &&
        this.boundAudioVideoController &&
        this.boundAudioVideoController.videoTileController.hasStartedLocalVideoTile()
      ) {
        this.logger.info('restarting local video to switch to new device');
        this.boundAudioVideoController.restartLocalVideo(() => {
          // TODO: implement MediaStreamDestroyer
          // tracks of oldStream should be stopped when video tile is disconnected from MediaStream
          // otherwise, camera is still being accessed and we need to stop it here.
          if (oldStream && oldStream.active) {
            this.logger.warn('previous media stream is not stopped during restart video');
            this.releaseMediaStream(oldStream);
          }
        });
      } else {
        this.releaseMediaStream(oldStream);
      }
    } else {
      this.releaseMediaStream(oldStream);

      if (this.useWebAudio) {
        this.attachAudioInputStreamToAudioContext(this.activeDevices[kind].stream);
      } else if (this.boundAudioVideoController) {
        try {
          await this.boundAudioVideoController.restartLocalAudio(() => {});
        } catch (error) {
          this.logger.info(`cannot replace audio track due to: ${error.message}`);
        }
      } else {
        this.logger.info('no audio-video controller is bound to the device controller');
      }
    }
    return Date.now() - startTimeMs <
      DefaultDeviceController.permissionGrantedOriginDetectionThresholdMs
      ? DevicePermission.PermissionGrantedByBrowser
      : DevicePermission.PermissionGrantedByUser;
  }

  private async bindAudioOutput(): Promise<void> {
    if (!this.boundAudioVideoController) {
      return;
    }
    const deviceInfo = this.deviceInfoFromDeviceId('audiooutput', this.audioOutputDeviceId);
    // TODO: fail promise if audio output device cannot be selected or setSinkId promise rejects
    this.boundAudioVideoController.audioMixController.bindAudioDevice(deviceInfo);
  }

  private calculateMediaStreamConstraints(
    kind: string,
    device: Device
  ): MediaStreamConstraints | null {
    let trackConstraints: MediaTrackConstraints = {};
    if (device === '') {
      device = null;
    }
    const stream = this.deviceAsMediaStream(device);
    if (device === null) {
      return null;
    } else if (typeof device === 'string') {
      trackConstraints.deviceId = { exact: device };
    } else if (stream) {
      // @ts-ignore - create a fake track constraint using the stream id
      trackConstraints.streamId = stream.id;
    } else {
      // @ts-ignore - device is a MediaTrackConstraints
      trackConstraints = device;
    }
    if (kind === 'video') {
      trackConstraints.width = trackConstraints.width || this.videoWidth;
      trackConstraints.height = trackConstraints.height || this.videoHeight;
      trackConstraints.frameRate = trackConstraints.frameRate || this.videoFrameRate;
      // TODO: try to replace hard-code value related to videos into quality-level presets
      // The following configs relaxes CPU overuse detection threshold to offer better encoding quality
      // @ts-ignore
      trackConstraints.googCpuOveruseDetection = true;
      // @ts-ignore
      trackConstraints.googCpuOveruseEncodeUsage = true;
      // @ts-ignore
      trackConstraints.googCpuOveruseThreshold = 85;
      // @ts-ignore
      trackConstraints.googCpuUnderuseThreshold = 55;
    }
    if (kind === 'audio' && this.supportSampleRateConstraint()) {
      trackConstraints.sampleRate = { ideal: DefaultDeviceController.defaultSampleRate };
    }
    if (kind === 'audio' && this.supportSampleSizeConstraint()) {
      trackConstraints.sampleSize = { ideal: DefaultDeviceController.defaultSampleSize };
    }
    if (kind === 'audio' && this.supportChannelCountConstraint()) {
      trackConstraints.channelCount = { ideal: DefaultDeviceController.defaultChannelCount };
    }
    if (kind === 'audio') {
      // @ts-ignore
      trackConstraints.echoCancellation = true;
      // @ts-ignore
      trackConstraints.googEchoCancellation = true;
      // @ts-ignore
      trackConstraints.googAutoGainControl = true;
      // @ts-ignore
      trackConstraints.googNoiseSuppression = true;
      // @ts-ignore
      trackConstraints.googHighpassFilter = true;
      // @ts-ignore
      trackConstraints.googNoiseSuppression2 = true;
      // @ts-ignore
      trackConstraints.googEchoCancellation2 = true;
      // @ts-ignore
      trackConstraints.googAutoGainControl2 = true;
    }
    return kind === 'audio' ? { audio: trackConstraints } : { video: trackConstraints };
  }

  private deviceInfoFromDeviceId(
    deviceKind: string,
    deviceId: string | null
  ): MediaDeviceInfo | null {
    if (this.deviceInfoCache === null) {
      return null;
    }
    for (const device of this.deviceInfoCache) {
      if (device.kind === deviceKind && device.deviceId === deviceId) {
        return device;
      }
    }
    return null;
  }

  private async acquireInputStream(kind: string): Promise<MediaStream> {
    if (kind === 'audio') {
      if (this.useWebAudio) {
        this.ensureAudioInputContext();
        return this.audioInputDestinationNode.stream;
      }
    }
    let existingConstraints: MediaTrackConstraints | null = null;
    if (!this.activeDevices[kind]) {
      if (kind === 'audio') {
        this.logger.info(`no ${kind} device chosen, creating empty ${kind} device`);
      } else {
        this.logger.error(`no ${kind} device chosen, stopping local video tile`);
        this.boundAudioVideoController.videoTileController.stopLocalVideoTile();
        throw new Error(`no ${kind} device chosen, stopping local video tile`);
      }
    } else {
      this.logger.info(`checking whether existing ${kind} device can be reused`);
      const active = this.activeDevices[kind];
      // @ts-ignore
      existingConstraints = active.constraints ? active.constraints[kind] : null;
    }
    const result = await this.chooseInputDevice(kind, existingConstraints, true);
    if (
      result === DevicePermission.PermissionDeniedByBrowser ||
      result === DevicePermission.PermissionDeniedByUser
    ) {
      this.logger.error(`unable to acquire ${kind} device`);
      throw new Error(`unable to acquire ${kind} device`);
    }
    return this.activeDevices[kind].stream;
  }

  private ensureAudioInputContext(): void {
    if (this.audioInputContext) {
      return;
    }
    this.audioInputContext = DefaultDeviceController.createAudioContext();
    this.audioInputDestinationNode = this.audioInputContext.createMediaStreamDestination();
  }

  private attachAudioInputStreamToAudioContext(stream: MediaStream): void {
    this.ensureAudioInputContext();
    if (this.audioInputSourceNode) {
      this.audioInputSourceNode.disconnect();
    }
    this.audioInputSourceNode = this.audioInputContext.createMediaStreamSource(stream);
    this.audioInputSourceNode.connect(this.audioInputDestinationNode);
  }

  static createAudioContext(): AudioContext {
    const options: AudioContextOptions = {};
    if (navigator.mediaDevices.getSupportedConstraints().sampleRate) {
      options.sampleRate = DefaultDeviceController.defaultSampleRate;
    }
    // @ts-ignore
    return new (window.AudioContext || window.webkitAudioContext)(options);
  }

  private supportSampleRateConstraint(): boolean {
    return this.useWebAudio && !!navigator.mediaDevices.getSupportedConstraints().sampleRate;
  }

  private supportSampleSizeConstraint(): boolean {
    return this.useWebAudio && !!navigator.mediaDevices.getSupportedConstraints().sampleSize;
  }

  private supportChannelCountConstraint(): boolean {
    return this.useWebAudio && !!navigator.mediaDevices.getSupportedConstraints().channelCount;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private trace(name: string, input?: any, output?: any): void {
    let s = `API/DefaultDeviceController/${name}`;
    if (typeof input !== 'undefined') {
      s += ` ${JSON.stringify(input)}`;
    }
    if (typeof output !== 'undefined') {
      s += ` -> ${JSON.stringify(output)}`;
    }
    this.logger.info(s);
  }
}
