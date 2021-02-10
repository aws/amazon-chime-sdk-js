// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoController from '../audiovideocontroller/AudioVideoController';
import DefaultBrowserBehavior from '../browserbehavior/DefaultBrowserBehavior';
import DeviceChangeObserver from '../devicechangeobserver/DeviceChangeObserver';
import Logger from '../logger/Logger';
import Maybe from '../maybe/Maybe';
import DefaultMediaDeviceFactory from '../mediadevicefactory/DefaultMediaDeviceFactory';
import DeviceControllerBasedMediaStreamBroker from '../mediastreambroker/DeviceControllerBasedMediaStreamBroker';
import AsyncScheduler from '../scheduler/AsyncScheduler';
import IntervalScheduler from '../scheduler/IntervalScheduler';
import DefaultVideoTile from '../videotile/DefaultVideoTile';
import AudioInputDevice from './AudioInputDevice';
import AudioNodeSubgraph from './AudioNodeSubgraph';
import AudioTransformDevice, { isAudioTransformDevice } from './AudioTransformDevice';
import Device from './Device';
import DeviceSelection from './DeviceSelection';
import GetUserMediaError from './GetUserMediaError';
import NotFoundError from './NotFoundError';
import NotReadableError from './NotReadableError';
import OverconstrainedError from './OverconstrainedError';
import PermissionDeniedError from './PermissionDeniedError';
import RemovableAnalyserNode from './RemovableAnalyserNode';
import TypeError from './TypeError';
import VideoInputDevice from './VideoInputDevice';
import VideoQualitySettings from './VideoQualitySettings';
import VideoTransformDevice, { isVideoTransformDevice } from './VideoTransformDevice';

export default class DefaultDeviceController implements DeviceControllerBasedMediaStreamBroker {
  private static permissionDeniedOriginDetectionThresholdMs = 500;
  private static defaultVideoWidth = 960;
  private static defaultVideoHeight = 540;
  private static defaultVideoFrameRate = 15;
  private static defaultVideoMaxBandwidthKbps = 1400;
  private static defaultSampleRate = 48000;
  private static defaultSampleSize = 16;
  private static defaultChannelCount = 1;
  private static audioContext: AudioContext | null = null;

  private deviceInfoCache: MediaDeviceInfo[] | null = null;

  // `activeDevices` is really a set of `DeviceSelection`s. Track the actual device here.
  private transform: { nodes: AudioNodeSubgraph | undefined; device: AudioTransformDevice };

  private activeDevices: { [kind: string]: DeviceSelection | null } = { audio: null, video: null };

  // `chosenVideoTransformDevice` is tracked and owned by device controller.
  // It is saved when `chooseVideoInputDevice` is called with VideoTransformDevice object.
  private chosenVideoTransformDevice: VideoTransformDevice | null = null;
  private audioOutputDeviceId: string | null = null;
  private deviceChangeObservers: Set<DeviceChangeObserver> = new Set<DeviceChangeObserver>();
  private boundAudioVideoController: AudioVideoController | null;
  private deviceLabelTrigger = (): Promise<MediaStream> => {
    return navigator.mediaDevices.getUserMedia({ audio: true, video: true });
  };
  private audioInputDestinationNode: MediaStreamAudioDestinationNode | null = null;
  private audioInputSourceNode: MediaStreamAudioSourceNode | null = null;
  private muteCallback: (muted: boolean) => void;

  private videoInputQualitySettings: VideoQualitySettings = null;

  private readonly useWebAudio: boolean = false;

  private inputDeviceCount: number = 0;
  private lastNoVideoInputDeviceCount: number;

  private browserBehavior: DefaultBrowserBehavior = new DefaultBrowserBehavior();

  constructor(private logger: Logger, options?: { enableWebAudio?: boolean }) {
    const { enableWebAudio = false } = options || {};
    this.useWebAudio = enableWebAudio;

    this.muteCallback = (muted: boolean) => {
      this.transform?.device.mute(muted);
    };

    this.videoInputQualitySettings = new VideoQualitySettings(
      DefaultDeviceController.defaultVideoWidth,
      DefaultDeviceController.defaultVideoHeight,
      DefaultDeviceController.defaultVideoFrameRate,
      DefaultDeviceController.defaultVideoMaxBandwidthKbps
    );

    const dimension = this.browserBehavior.requiresResolutionAlignment(
      this.videoInputQualitySettings.videoWidth,
      this.videoInputQualitySettings.videoHeight
    );
    this.videoInputQualitySettings.videoWidth = dimension[0];
    this.videoInputQualitySettings.videoHeight = dimension[1];
    this.logger.info(
      `DefaultDeviceController video dimension ${this.videoInputQualitySettings.videoWidth} x ${this.videoInputQualitySettings.videoHeight}`
    );

    try {
      const mediaDeviceWrapper = new DefaultMediaDeviceFactory().create();
      mediaDeviceWrapper.addEventListener('devicechange', () => {
        this.handleDeviceChange();
      });
      const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
      this.logger.info(
        `Supported Constraints in this browser ${JSON.stringify(supportedConstraints)}`
      );
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

  private pushAudioMeetingStateForPermissions(device: AudioInputDevice): void {
    this.boundAudioVideoController?.eventController?.publishEvent(
      device === null ? 'audioInputUnselected' : 'audioInputSelected'
    );
  }

  private pushVideoMeetingStateForPermissions(device: VideoInputDevice): void {
    this.boundAudioVideoController?.eventController?.publishEvent(
      device === null ? 'videoInputUnselected' : 'videoInputSelected'
    );
  }

  async chooseAudioInputDevice(device: AudioInputDevice): Promise<void> {
    if (device === undefined) {
      this.logger.error('Audio input device cannot be undefined');
      return;
    }
    if (isAudioTransformDevice(device)) {
      // N.B., do not JSON.stringify here — for some kinds of devices this
      // will cause a cyclic object reference error.
      this.logger.info(`Choosing transform input device ${device}`);
      await this.chooseAudioTransformInputDevice(device);
      return this.pushAudioMeetingStateForPermissions(device);
    }

    this.removeTransform();
    await this.chooseInputIntrinsicDevice('audio', device, false);
    this.trace('chooseAudioInputDevice', device, `success`);
    this.pushAudioMeetingStateForPermissions(device);
  }

  private async chooseAudioTransformInputDevice(device: AudioTransformDevice): Promise<void> {
    if (this.transform?.device === device) {
      return;
    }

    if (!this.useWebAudio) {
      throw new Error('Cannot apply transform device without enabling Web Audio.');
    }

    const context = DefaultDeviceController.getAudioContext();
    let nodes;
    try {
      nodes = await device.createAudioNode(context);
    } catch (e) {
      this.logger.error(`Unable to create transform device node: ${e}.`);
      throw e;
    }

    // Pick the plain ol' inner device as the source. It will be
    // connected to the node.
    const inner = await device.intrinsicDevice();
    await this.chooseInputIntrinsicDevice('audio', inner, false);
    this.logger.debug(`Got inner stream: ${inner}.`);
    // Otherwise, continue: hook up the new node.
    this.setTransform(device, nodes);
  }

  private async chooseVideoTransformInputDevice(device: VideoTransformDevice): Promise<void> {
    if (device === this.chosenVideoTransformDevice) {
      this.logger.info('Reselecting same VideoTransformDevice');
      return;
    }

    const prevVideoTransformDevice = this.chosenVideoTransformDevice;
    if (prevVideoTransformDevice) {
      this.logger.info('Switched from previous VideoTransformDevice');
    }
    const wasUsingTransformDevice = !!prevVideoTransformDevice;
    const inner = await device.intrinsicDevice();
    const canReuseMediaStream = this.isMediaStreamReusableByDeviceId(
      this.activeDevices['video']?.stream,
      inner
    );
    if (!canReuseMediaStream) {
      this.logger.info('video transform device needs new intrinsic device');
      if (wasUsingTransformDevice) {
        // detach input media stream - turn off the camera or leave it be if inner is media stream
        prevVideoTransformDevice.onOutputStreamDisconnect();
      }
      this.chosenVideoTransformDevice = device;
      // VideoTransformDevice owns input MediaStream
      this.activeDevices['video'] = null;
      await this.chooseInputIntrinsicDevice('video', inner, false, true);
      return;
    }

    // When saved stream is reusable, only switch the saved stream to filtered stream for sending
    // but keep the saved stream intact.

    // Note: to keep the chosen media stream intact, it is important to avoid a full stop
    // because videoTileUpdate can be called when video is stopped and user might call `bindVideoElement` to disconnect the element.
    // In current implementation, disconnecting the element will `hard` stop the media stream.

    // Update device and stream
    this.chosenVideoTransformDevice = device;
    const newMediaStream = this.activeDevices['video'].stream;
    this.logger.info('video transform device uses previous stream');

    // Input is not a MediaStream. Update constraints
    if (!(inner as MediaStream).id) {
      const constraint = inner as MediaTrackConstraints;
      constraint.width = constraint.width || this.videoInputQualitySettings.videoWidth;
      constraint.height = constraint.height || this.videoInputQualitySettings.videoHeight;
      constraint.frameRate = constraint.frameRate || this.videoInputQualitySettings.videoFrameRate;
      await newMediaStream.getVideoTracks()[0].applyConstraints(constraint);
    }

    // `transformStream` will start processing.
    await device.transformStream(this.activeDevices['video'].stream);

    // Replace video to send
    if (this.boundAudioVideoController?.videoTileController.hasStartedLocalVideoTile()) {
      // optimized method exists, a negotiation can be avoided
      if (this.boundAudioVideoController.replaceLocalVideo) {
        this.restartLocalVideoAfterSelection(null, false, true);
      } else {
        // non-optimized path, a negotiation is coming
        await this.boundAudioVideoController.update();
      }
    }
  }

  async chooseVideoInputDevice(device: VideoInputDevice): Promise<void> {
    if (device === undefined) {
      this.logger.error('Video input device cannot be undefined');
      return;
    }
    if (isVideoTransformDevice(device)) {
      this.logger.info(`Choosing video transform device ${device}`);
      return this.chooseVideoTransformInputDevice(device);
    }

    this.updateMaxBandwidthKbps();

    // handle direct switching from VideoTransformDevice to Device
    // From WebRTC point, it is a device switching.
    if (this.chosenVideoInputIsTransformDevice()) {
      // disconnect old stream
      this.chosenVideoTransformDevice.onOutputStreamDisconnect();
      this.chosenVideoTransformDevice = null;
    }

    await this.chooseInputIntrinsicDevice('video', device, false);
    this.trace('chooseVideoInputDevice', device);
    this.pushVideoMeetingStateForPermissions(device);
  }

  async chooseAudioOutputDevice(deviceId: string | null): Promise<void> {
    this.audioOutputDeviceId = deviceId;
    await this.bindAudioOutput();
    this.trace('chooseAudioOutputDevice', deviceId, null);
    return;
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

  createAnalyserNodeForAudioInput(): RemovableAnalyserNode | null {
    if (!this.activeDevices['audio']) {
      return null;
    }

    // If there is a WebAudio node in the graph, we use that as the source instead of the stream.
    const node = this.transform?.nodes?.end;
    if (node) {
      const analyser = node.context.createAnalyser() as RemovableAnalyserNode;

      analyser.removeOriginalInputs = () => {
        try {
          node.disconnect(analyser);
        } catch (e) {
          // This can fail in some unusual cases, but this is best-effort.
        }
      };

      node.connect(analyser);
      return analyser;
    }

    return this.createAnalyserNodeForRawAudioInput();
  }

  //
  // N.B., this bypasses any applied transform node.
  //
  createAnalyserNodeForRawAudioInput(): RemovableAnalyserNode | null {
    if (!this.activeDevices['audio']) {
      return null;
    }
    return this.createAnalyserNodeForStream(this.activeDevices['audio'].stream);
  }

  private createAnalyserNodeForStream(stream: MediaStream): RemovableAnalyserNode {
    const audioContext = DefaultDeviceController.getAudioContext();
    const analyser = audioContext.createAnalyser() as RemovableAnalyserNode;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    this.trace('createAnalyserNodeForAudioInput');

    analyser.removeOriginalInputs = () => {
      try {
        source.disconnect(analyser);
      } catch (e) {
        // This can fail in some unusual cases, but this is best-effort.
      }
    };

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
      node = DefaultDeviceController.getAudioContext().createMediaStreamSource(stream);
      node.connect(this.getMediaStreamOutputNode());
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
    const dimension = this.browserBehavior.requiresResolutionAlignment(width, height);
    this.videoInputQualitySettings = new VideoQualitySettings(
      dimension[0],
      dimension[1],
      frameRate,
      maxBandwidthKbps
    );
    this.updateMaxBandwidthKbps();
  }

  getVideoInputQualitySettings(): VideoQualitySettings | null {
    return this.videoInputQualitySettings;
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

    // similar to WebAudio's stream, we need to release the actual input stream to really stop it.
    // looks like switching VideoTransformDevice, the original device is closed because oldStream is the actual stream
    if (mediaStreamToRelease === this.chosenVideoTransformDevice?.outputMediaStream) {
      this.chosenVideoTransformDevice.onOutputStreamDisconnect();
      this.chosenVideoTransformDevice = null;
      tracksToStop = [];
    }

    for (const track of tracksToStop) {
      this.logger.info(`stopping ${track.kind} track`);
      track.stop();
    }

    for (const kind in this.activeDevices) {
      if (this.activeDevices[kind] && this.activeDevices[kind].stream === mediaStreamToRelease) {
        this.activeDevices[kind] = null;
        if (
          kind === 'video' &&
          this.boundAudioVideoController &&
          this.boundAudioVideoController.videoTileController.hasStartedLocalVideoTile()
        ) {
          this.boundAudioVideoController.videoTileController.stopLocalVideoTile();
        }
      }
    }
  }

  private chosenVideoInputIsTransformDevice(): boolean {
    return !!this.chosenVideoTransformDevice;
  }

  bindToAudioVideoController(audioVideoController: AudioVideoController): void {
    if (this.boundAudioVideoController) {
      this.unsubscribeFromMuteAndUnmuteLocalAudio();
    }
    this.boundAudioVideoController = audioVideoController;
    this.subscribeToMuteAndUnmuteLocalAudio();
    if (this.browserBehavior.supportsSetSinkId()) {
      new AsyncScheduler().start(() => {
        this.bindAudioOutput();
      });
    }
  }

  private subscribeToMuteAndUnmuteLocalAudio(): void {
    if (!this.boundAudioVideoController) {
      return;
    }

    // Safety that's hard to test.
    /* istanbul ignore next */
    if (!this.boundAudioVideoController.realtimeController) {
      return;
    }

    this.boundAudioVideoController.realtimeController.realtimeSubscribeToMuteAndUnmuteLocalAudio(
      this.muteCallback
    );
  }

  private unsubscribeFromMuteAndUnmuteLocalAudio(): void {
    // Safety that's hard to test.
    /* istanbul ignore next */
    if (!this.boundAudioVideoController.realtimeController) {
      return;
    }

    this.boundAudioVideoController.realtimeController.realtimeUnsubscribeToMuteAndUnmuteLocalAudio(
      this.muteCallback
    );
  }

  static createEmptyAudioDevice(): MediaStream {
    return DefaultDeviceController.synthesizeAudioDevice(0);
  }

  static createEmptyVideoDevice(): MediaStream | null {
    return DefaultDeviceController.synthesizeVideoDevice('black');
  }

  static synthesizeAudioDevice(toneHz: number): MediaStream {
    const audioContext = DefaultDeviceController.getAudioContext();
    const outputNode = audioContext.createMediaStreamDestination();
    if (!toneHz) {
      const source = audioContext.createBufferSource();

      // The AudioContext object uses the sample rate of the default output device
      // if not specified. Creating an AudioBuffer object with the output device's
      // sample rate fails in some browsers, e.g. Safari with a Bluetooth headphone.
      try {
        source.buffer = audioContext.createBuffer(
          1,
          audioContext.sampleRate * 5,
          audioContext.sampleRate
        );
      } catch (error) {
        if (error && error.name === 'NotSupportedError') {
          source.buffer = audioContext.createBuffer(
            1,
            DefaultDeviceController.defaultSampleRate * 5,
            DefaultDeviceController.defaultSampleRate
          );
        } else {
          throw error;
        }
      }

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
    return outputNode.stream;
  }

  static synthesizeVideoDevice(colorOrPattern: string): MediaStream | null {
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
      this.boundAudioVideoController.setVideoMaxBandwidthKbps(
        this.videoInputQualitySettings.videoMaxBandwidthKbps
      );
    }
  }

  private async listDevicesOfKind(deviceKind: string): Promise<MediaDeviceInfo[]> {
    if (this.deviceInfoCache === null) {
      await this.updateDeviceInfoCacheFromBrowser();
    }
    return this.listCachedDevicesOfKind(deviceKind);
  }

  private async updateDeviceInfoCacheFromBrowser(): Promise<void> {
    const doesNotHaveAccessToMediaDevices = typeof MediaDeviceInfo === 'undefined';
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

  private async handleDeviceStreamEnded(kind: string, deviceId: string): Promise<void> {
    await this.chooseInputIntrinsicDevice(kind, null, false);
    if (kind === 'audio') {
      this.forEachObserver((observer: DeviceChangeObserver) => {
        Maybe.of(observer.audioInputStreamEnded).map(f => f.bind(observer)(deviceId));
      });
    } else {
      this.forEachObserver((observer: DeviceChangeObserver) => {
        Maybe.of(observer.videoInputStreamEnded).map(f => f.bind(observer)(deviceId));
      });
    }
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

  private intrinsicDeviceAsMediaStream(device: Device): MediaStream | null {
    // @ts-ignore
    return device && device.id ? device : null;
  }

  private hasSameGroupId(groupId: string, kind: string, device: Device): boolean {
    device = this.getIntrinsicDeviceIdStr(device);
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

  private getIntrinsicDeviceIdStr(device: Device): string | null {
    if (device === null) {
      return null;
    }
    if (typeof device === 'string') {
      return device;
    }
    if ((device as MediaStream).id) {
      return (device as MediaStream).id;
    }

    const constraints: MediaTrackConstraints = device as MediaTrackConstraints;
    if (!constraints.deviceId) {
      return '';
    }
    if (typeof constraints.deviceId === 'string') {
      return constraints.deviceId;
    }

    const deviceIdConstraint: ConstrainDOMStringParameters = constraints.deviceId as ConstrainDOMStringParameters;
    if (typeof deviceIdConstraint.exact === 'string') {
      return deviceIdConstraint.exact;
    }

    return '';
  }

  private getActiveDeviceId(kind: string): string | null {
    /* istanbul ignore else */
    if (this.activeDevices[kind] && this.activeDevices[kind].constraints) {
      const activeDeviceMediaTrackConstraints =
        this.activeDevices[kind].constraints.audio || this.activeDevices[kind].constraints.video;
      const activeDeviceConstrainDOMStringParameters = (activeDeviceMediaTrackConstraints as MediaTrackConstraints)
        .deviceId;

      let activeDeviceId: string;
      if (typeof activeDeviceConstrainDOMStringParameters === 'string') {
        activeDeviceId = activeDeviceConstrainDOMStringParameters as string;
      } else {
        activeDeviceId = (activeDeviceConstrainDOMStringParameters as ConstrainDOMStringParameters)
          .exact as string;
      }
      return activeDeviceId;
    }
    /* istanbul ignore next */
    return null;
  }

  private async restartLocalVideoAfterSelection(
    oldStream: MediaStream,
    fromAcquire: boolean,
    fromVideoTransformDevice: boolean
  ): Promise<void> {
    if (
      !fromAcquire &&
      this.boundAudioVideoController &&
      this.boundAudioVideoController.videoTileController.hasStartedLocalVideoTile()
    ) {
      if (fromVideoTransformDevice) {
        // similar to `useWebaudio`, either Device or VideoTransformDevice, `this.activeDevices['video']` tracks the supplied inner Device.
        // Upon in-meeting switching to VideoTransformDevice, device controller releases old "supplied" stream and
        // calls replaceLocalVideo to avoid a full stop-start update.
        await this.boundAudioVideoController.replaceLocalVideo();
        this.logger.info('successfully replaced video track');
        if (oldStream && oldStream.active) {
          this.logger.warn('previous media stream is not stopped during restart video');
          this.releaseMediaStream(oldStream);
        }
      } else {
        // not from VideoTransformDevice, usual behavior.
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
      }
    } else {
      this.releaseMediaStream(oldStream);
    }
  }

  private handleGetUserMediaError(error: Error, errorTimeMs?: number): void {
    switch (error.name) {
      case 'NotReadableError':
      case 'TrackStartError':
        throw new NotReadableError(error);
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        throw new NotFoundError(error);
      case 'NotAllowedError':
      case 'PermissionDeniedError':
      case 'SecurityError':
        if (
          errorTimeMs &&
          errorTimeMs < DefaultDeviceController.permissionDeniedOriginDetectionThresholdMs
        ) {
          throw new PermissionDeniedError(error, 'Permission denied by browser');
        } else {
          throw new PermissionDeniedError(error, 'Permission denied by user');
        }
      case 'OverconstrainedError':
      case 'ConstraintNotSatisfiedError':
        throw new OverconstrainedError(error);
      case 'TypeError':
        throw new TypeError(error);
      case 'AbortError':
      default:
        throw new GetUserMediaError(error);
    }
  }

  private async chooseInputIntrinsicDevice(
    kind: string,
    device: Device,
    fromAcquire: boolean,
    fromVideoTransformDevice: boolean = false
  ): Promise<void> {
    this.inputDeviceCount += 1;
    const callCount = this.inputDeviceCount;

    if (device === null && kind === 'video') {
      this.lastNoVideoInputDeviceCount = this.inputDeviceCount;
      if (this.activeDevices[kind]) {
        this.releaseMediaStream(this.activeDevices[kind].stream);
        delete this.activeDevices[kind];
      }
      return;
    }

    // N.B.,: the input device might already have augmented constraints supplied
    // by an `AudioTransformDevice`. `calculateMediaStreamConstraints` will respect
    // settings supplied by the device.
    const proposedConstraints: MediaStreamConstraints | null = this.calculateMediaStreamConstraints(
      kind,
      device
    );

    // TODO: `matchesConstraints` should really return compatible/incompatible/exact --
    // `applyConstraints` can be used to reuse the active device while changing the
    // requested constraints.
    if (
      this.activeDevices[kind] &&
      this.activeDevices[kind].matchesConstraints(proposedConstraints) &&
      this.activeDevices[kind].stream.active &&
      this.activeDevices[kind].groupId !== null &&
      this.hasSameGroupId(this.activeDevices[kind].groupId, kind, device)
    ) {
      this.logger.info(`reusing existing ${kind} device`);
      return;
    }
    if (kind === 'audio' && this.activeDevices[kind] && this.activeDevices[kind].stream) {
      this.releaseMediaStream(this.activeDevices[kind].stream);
    }
    const startTimeMs = Date.now();
    const newDevice: DeviceSelection = new DeviceSelection();
    try {
      this.logger.info(
        `requesting new ${kind} device with constraint ${JSON.stringify(proposedConstraints)}`
      );
      const stream = this.intrinsicDeviceAsMediaStream(device);
      if (kind === 'audio' && device === null) {
        newDevice.stream = DefaultDeviceController.createEmptyAudioDevice() as MediaStream;
        newDevice.constraints = null;
      } else if (stream) {
        this.logger.info(`using media stream ${stream.id} for ${kind} device`);
        newDevice.stream = stream;
        newDevice.constraints = proposedConstraints;
      } else {
        newDevice.stream = await navigator.mediaDevices.getUserMedia(proposedConstraints);
        newDevice.constraints = proposedConstraints;
        if (kind === 'video' && this.lastNoVideoInputDeviceCount > callCount) {
          this.logger.warn(
            `ignored to get video device for constraints ${JSON.stringify(
              proposedConstraints
            )} as no device was requested`
          );
          this.releaseMediaStream(newDevice.stream);
          return;
        }

        await this.handleDeviceChange();
        newDevice.stream.getTracks()[0].addEventListener('ended', () => {
          if (this.activeDevices[kind] && this.activeDevices[kind].stream === newDevice.stream) {
            this.logger.warn(
              `${kind} input device which was active is no longer available, resetting to null device`
            );
            this.handleDeviceStreamEnded(kind, this.getActiveDeviceId(kind));
          }
        });
      }
      newDevice.groupId = this.getGroupIdFromDeviceId(kind, this.getIntrinsicDeviceIdStr(device));
    } catch (error) {
      let errorMessage: string;
      if (error?.name && error.message) {
        errorMessage = `${error.name}: ${error.message}`;
      } else if (error?.name) {
        errorMessage = error.name;
      } else if (error?.message) {
        errorMessage = error.message;
      } else {
        errorMessage = 'UnknownError';
      }

      if (kind === 'audio') {
        this.boundAudioVideoController?.eventController?.publishEvent('audioInputFailed', {
          audioInputErrorMessage: errorMessage,
        });
      } else {
        this.boundAudioVideoController?.eventController?.publishEvent('videoInputFailed', {
          videoInputErrorMessage: errorMessage,
        });
      }

      this.logger.error(
        `failed to get ${kind} device for constraints ${JSON.stringify(
          proposedConstraints
        )}: ${errorMessage}`
      );

      // This is effectively `error instanceof OverconstrainedError` but works in Node.
      if ('constraint' in error) {
        this.logger.error(`Over-constrained by constraint: ${error.constraint}`);
      }

      /*
       * If there is any error while acquiring the audio device, we fall back to null device.
       * Reason: If device selection fails (e.g. NotReadableError), the peer connection is left hanging
       * with no active audio track since we release the previously attached track.
       * If no audio packet has yet been sent to the server, the server will not emit the joined event.
       */
      if (kind === 'audio') {
        this.logger.info(`choosing null ${kind} device instead`);
        try {
          newDevice.stream = DefaultDeviceController.createEmptyAudioDevice() as MediaStream;
          newDevice.constraints = null;
          await this.handleNewInputDevice(kind, newDevice, fromAcquire);
        } catch (error) {
          this.logger.error(
            `failed to choose null ${kind} device. ${error.name}: ${error.message}`
          );
        }
      }

      this.handleGetUserMediaError(error, Date.now() - startTimeMs);
    }

    this.logger.info(`got ${kind} device for constraints ${JSON.stringify(proposedConstraints)}`);
    await this.handleNewInputDevice(kind, newDevice, fromAcquire, fromVideoTransformDevice);
    return;
  }

  private async handleNewInputDevice(
    kind: string,
    newDevice: DeviceSelection,
    fromAcquire: boolean,
    fromVideoTransformDevice: boolean = false
  ): Promise<void> {
    const oldStream: MediaStream | null = this.activeDevices[kind]
      ? this.activeDevices[kind].stream
      : null;

    this.activeDevices[kind] = newDevice;

    if (kind === 'video') {
      // attempts to mirror `this.useWebAudio`. The difference is that audio destination stream stays the same
      // but video sending needs to switch streams.
      if (this.chosenVideoInputIsTransformDevice()) {
        this.logger.info('apply processors to transform');
        await this.chosenVideoTransformDevice.transformStream(this.activeDevices['video'].stream);
      }
      await this.restartLocalVideoAfterSelection(oldStream, fromAcquire, fromVideoTransformDevice);
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
  }

  private async bindAudioOutput(): Promise<void> {
    if (!this.boundAudioVideoController) {
      return;
    }
    const deviceInfo = this.deviceInfoFromDeviceId('audiooutput', this.audioOutputDeviceId);
    await this.boundAudioVideoController.audioMixController.bindAudioDevice(deviceInfo);
  }

  private calculateMediaStreamConstraints(
    kind: string,
    device: Device
  ): MediaStreamConstraints | null {
    let trackConstraints: MediaTrackConstraints = {};
    if (device === '') {
      device = null;
    }
    const stream = this.intrinsicDeviceAsMediaStream(device);
    if (device === null) {
      return null;
    } else if (typeof device === 'string') {
      if (
        this.browserBehavior.requiresNoExactMediaStreamConstraints() &&
        this.browserBehavior.requiresGroupIdMediaStreamConstraints()
      ) {
        // In Samsung Internet browser, navigator.mediaDevices.enumerateDevices()
        // returns same deviceId but different groupdId for some audioinput and videoinput devices.
        // To handle this, we select appropriate device using deviceId + groupId.
        trackConstraints.deviceId = device;
        trackConstraints.groupId = this.getGroupIdFromDeviceId(kind, device);
      } else if (this.browserBehavior.requiresNoExactMediaStreamConstraints()) {
        trackConstraints.deviceId = device;
      } else {
        trackConstraints.deviceId = { exact: device };
      }
    } else if (stream) {
      // @ts-ignore - create a fake track constraint using the stream id
      trackConstraints.streamId = stream.id;
    } else {
      // Take the input set of constraints. Note that this allows
      // the builder to specify overrides for properties like `autoGainControl`.
      // @ts-ignore - device is a MediaTrackConstraints
      trackConstraints = device;
    }
    if (kind === 'video') {
      trackConstraints.width = trackConstraints.width || {
        ideal: this.videoInputQualitySettings.videoWidth,
      };
      trackConstraints.height = trackConstraints.height || {
        ideal: this.videoInputQualitySettings.videoHeight,
      };
      trackConstraints.frameRate = trackConstraints.frameRate || {
        ideal: this.videoInputQualitySettings.videoFrameRate,
      };
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
      const augmented = {
        echoCancellation: true,
        googEchoCancellation: true,
        googEchoCancellation2: true,
        googAutoGainControl: true,
        googAutoGainControl2: true,
        googNoiseSuppression: true,
        googNoiseSuppression2: true,
        googHighpassFilter: true,

        // We allow the provided constraints to override these sensible defaults.
        ...trackConstraints,
      };
      trackConstraints = augmented as MediaTrackConstraints;
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
        const dest = this.getMediaStreamDestinationNode();
        return dest.stream;
      }
    }

    // mirrors `this.useWebAudio`
    if (kind === 'video') {
      if (this.chosenVideoInputIsTransformDevice()) {
        return this.chosenVideoTransformDevice.outputMediaStream;
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
    try {
      await this.chooseInputIntrinsicDevice(kind, existingConstraints, true);
    } catch (e) {
      this.logger.error(`unable to acquire ${kind} device`);
      if (e instanceof PermissionDeniedError) {
        throw e;
      }
      throw new GetUserMediaError(e, `unable to acquire ${kind} device`);
    }
    return this.activeDevices[kind].stream;
  }

  hasAppliedTransform(): boolean {
    return !!this.transform;
  }

  private isMediaStreamReusableByDeviceId(stream: MediaStream, device: Device): boolean {
    // for null device, assume the stream is not reusable
    if (!stream || !stream.active || !device) {
      return false;
    }

    if ((device as MediaStream).id) {
      return stream.id === (device as MediaStream).id;
    }

    const settings = stream.getTracks()[0].getSettings();
    // If a device does not specify deviceId, we have to assume the stream is not reusable.
    return settings.deviceId === this.getIntrinsicDeviceIdStr(device);
  }

  private reconnectAudioInputs(): void {
    // It is never possible to get here without first establishing `audioInputSourceNode` via
    // choosing an inner stream, so we do not check for undefined here in order to avoid
    // creating an un-testable branch!
    this.audioInputSourceNode.disconnect();

    const output = this.getMediaStreamOutputNode();
    this.audioInputSourceNode.connect(output);
  }

  private setTransform(device: AudioTransformDevice, nodes: AudioNodeSubgraph | undefined): void {
    this.transform?.nodes?.end.disconnect();
    this.transform = { nodes, device };

    const proc = nodes?.end;
    const dest = this.getMediaStreamDestinationNode();

    this.logger.debug(`Connecting transform node ${proc} to destination ${dest}.`);
    proc?.connect(dest);
    this.reconnectAudioInputs();
  }

  private removeTransform():
    | { device: AudioTransformDevice; nodes: AudioNodeSubgraph | undefined }
    | undefined {
    const previous = this.transform;
    if (!previous) {
      return undefined;
    }

    this.transform.nodes?.end.disconnect();
    this.transform = undefined;

    this.reconnectAudioInputs();

    return previous;
  }

  private attachAudioInputStreamToAudioContext(stream: MediaStream): void {
    this.audioInputSourceNode?.disconnect();
    this.audioInputSourceNode = DefaultDeviceController.getAudioContext().createMediaStreamSource(
      stream
    );
    const output = this.getMediaStreamOutputNode();
    this.audioInputSourceNode.connect(output);
  }

  /**
   * Return the end of the Web Audio graph: post-transform audio.
   */
  private getMediaStreamDestinationNode(): MediaStreamAudioDestinationNode {
    if (!this.audioInputDestinationNode) {
      this.audioInputDestinationNode = DefaultDeviceController.getAudioContext().createMediaStreamDestination();
    }
    return this.audioInputDestinationNode;
  }

  /**
   * Return the start of the Web Audio graph: pre-transform audio.
   * If there's no transform node, this is the destination node.
   */
  private getMediaStreamOutputNode(): AudioNode {
    return this.transform?.nodes?.start || this.getMediaStreamDestinationNode();
  }

  static getAudioContext(): AudioContext {
    if (!DefaultDeviceController.audioContext) {
      const options: AudioContextOptions = {};
      if (navigator.mediaDevices.getSupportedConstraints().sampleRate) {
        options.sampleRate = DefaultDeviceController.defaultSampleRate;
      }
      // @ts-ignore
      DefaultDeviceController.audioContext = new (window.AudioContext || window.webkitAudioContext)(
        options
      );
    }
    return DefaultDeviceController.audioContext;
  }

  static closeAudioContext(): void {
    if (DefaultDeviceController.audioContext) {
      DefaultDeviceController.audioContext.close();
    }
    DefaultDeviceController.audioContext = null;
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
