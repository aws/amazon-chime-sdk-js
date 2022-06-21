// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DefaultBrowserBehavior from '../browserbehavior/DefaultBrowserBehavior';
import ExtendedBrowserBehavior from '../browserbehavior/ExtendedBrowserBehavior';
import type { Destroyable } from '../destroyable/Destroyable';
import DeviceChangeObserver from '../devicechangeobserver/DeviceChangeObserver';
import EventController from '../eventcontroller/EventController';
import Logger from '../logger/Logger';
import DefaultMediaDeviceFactory from '../mediadevicefactory/DefaultMediaDeviceFactory';
import DeviceControllerBasedMediaStreamBroker from '../mediastreambroker/DeviceControllerBasedMediaStreamBroker';
import MediaStreamBrokerObserver from '../mediastreambrokerobserver/MediaStreamBrokerObserver';
import AsyncScheduler from '../scheduler/AsyncScheduler';
import PromiseQueue from '../utils/PromiseQueue';
import { Maybe } from '../utils/Types';
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

type Thunk = () => void;

export default class DefaultDeviceController
  implements DeviceControllerBasedMediaStreamBroker, Destroyable {
  private static permissionDeniedOriginDetectionThresholdMs = 500;
  private static defaultVideoWidth = 960;
  private static defaultVideoHeight = 540;
  private static defaultVideoFrameRate = 15;
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
  private audioOutputDeviceId: string | undefined = undefined;
  private deviceChangeObservers: Set<DeviceChangeObserver> = new Set<DeviceChangeObserver>();
  private mediaStreamBrokerObservers: Set<MediaStreamBrokerObserver> = new Set<
    MediaStreamBrokerObserver
  >();
  private deviceLabelTrigger = (): Promise<MediaStream> => {
    return navigator.mediaDevices.getUserMedia({ audio: true, video: true });
  };
  private audioInputDestinationNode: MediaStreamAudioDestinationNode | null = null;
  private audioInputSourceNode: MediaStreamAudioSourceNode | null = null;

  private mediaDeviceWrapper: MediaDevices | undefined;
  private onDeviceChangeCallback?: Thunk;

  private videoInputQualitySettings: VideoQualitySettings = null;

  private readonly useWebAudio: boolean = false;
  private readonly useMediaConstraintsFallback: boolean = true;

  private audioInputTaskQueue: PromiseQueue = new PromiseQueue();
  private videoInputTaskQueue: PromiseQueue = new PromiseQueue();

  // This handles the dispatch of `mute` and `unmute` events from audio tracks.
  // There's a bit of a semantic mismatch here if input streams allow individual component tracks to be muted,
  // but addressing that gap is not feasible in our stream-oriented world.
  private mediaStreamMuteObserver = (id: string | MediaStream, muted: boolean): void => {
    for (const observer of this.deviceChangeObservers) {
      AsyncScheduler.nextTick(() => {
        /* istanbul ignore else */
        if (this.deviceChangeObservers.has(observer) && observer.audioInputMuteStateChanged) {
          observer.audioInputMuteStateChanged(id, muted);
        }
      });
    }
  };

  constructor(
    private logger: Logger,
    options?: { enableWebAudio?: boolean; useMediaConstraintsFallback?: boolean },
    private browserBehavior: ExtendedBrowserBehavior = new DefaultBrowserBehavior(),
    public eventController?: EventController
  ) {
    const { enableWebAudio = false, useMediaConstraintsFallback = true } = options || {};
    this.useWebAudio = enableWebAudio;
    this.useMediaConstraintsFallback = useMediaConstraintsFallback;

    this.videoInputQualitySettings = new VideoQualitySettings(
      DefaultDeviceController.defaultVideoWidth,
      DefaultDeviceController.defaultVideoHeight,
      DefaultDeviceController.defaultVideoFrameRate
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
      this.mediaDeviceWrapper = new DefaultMediaDeviceFactory().create();
      const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
      this.logger.info(
        `Supported Constraints in this browser ${JSON.stringify(supportedConstraints)}`
      );
    } catch (error) {
      logger.error(error.message);
    }
  }

  private isWatchingForDeviceChanges(): boolean {
    return !!this.onDeviceChangeCallback;
  }

  private ensureWatchingDeviceChanges(): void {
    if (this.isWatchingForDeviceChanges()) {
      return;
    }
    this.logger.info('Starting devicechange listener.');
    this.onDeviceChangeCallback = () => {
      this.logger.info('Device change event callback is triggered');
      this.handleDeviceChange();
    };
    this.mediaDeviceWrapper?.addEventListener('devicechange', this.onDeviceChangeCallback);
  }

  /**
   * Unsubscribe from the `devicechange` event, which allows the device controller to
   * update its device cache.
   */
  private stopWatchingDeviceChanges(): void {
    if (!this.isWatchingForDeviceChanges()) {
      return;
    }
    this.logger.info('Stopping devicechange listener.');
    this.mediaDeviceWrapper?.removeEventListener('devicechange', this.onDeviceChangeCallback);
    this.onDeviceChangeCallback = undefined;
  }

  private shouldObserveDeviceChanges(): boolean {
    if (this.deviceChangeObservers.size) {
      return true;
    }

    const hasActiveDevices =
      (this.activeDevices['audio'] && this.activeDevices['audio'].constraints !== null) ||
      (this.activeDevices['video'] && this.activeDevices['video'].constraints !== null) ||
      !!this.audioOutputDeviceId;
    return hasActiveDevices;
  }

  private watchForDeviceChangesIfNecessary(): void {
    if (this.shouldObserveDeviceChanges()) {
      this.ensureWatchingDeviceChanges();
    } else {
      this.stopWatchingDeviceChanges();
    }
  }

  async destroy(): Promise<void> {
    // Remove device change callbacks.
    this.stopWatchingDeviceChanges();

    // Deselect any audio input devices and throw away the streams.
    // Discard the current video device, if there is one.
    // Discard any audio or video transforms.
    await this.stopAudioInput();
    await this.stopVideoInput();
  }

  async listAudioInputDevices(forceUpdate: boolean = false): Promise<MediaDeviceInfo[]> {
    const result = await this.listDevicesOfKind('audioinput', forceUpdate);
    this.trace('listAudioInputDevices', forceUpdate, result);
    return result;
  }

  async listVideoInputDevices(forceUpdate: boolean = false): Promise<MediaDeviceInfo[]> {
    const result = await this.listDevicesOfKind('videoinput', forceUpdate);
    this.trace('listVideoInputDevices', forceUpdate, result);
    return result;
  }

  async listAudioOutputDevices(forceUpdate: boolean = false): Promise<MediaDeviceInfo[]> {
    const result = await this.listDevicesOfKind('audiooutput', forceUpdate);
    this.trace('listAudioOutputDevices', forceUpdate, result);
    return result;
  }

  private pushAudioMeetingStateForPermissions(audioStream: MediaStream | undefined): void {
    this.eventController?.publishEvent(
      audioStream === undefined ? 'audioInputUnselected' : 'audioInputSelected'
    );
  }

  private pushVideoMeetingStateForPermissions(videoStream: MediaStream | undefined): void {
    this.eventController?.publishEvent(
      videoStream === undefined ? 'videoInputUnselected' : 'videoInputSelected'
    );
  }

  async startAudioInput(device: AudioInputDevice): Promise<MediaStream | undefined> {
    return await this.audioInputTaskQueue.add(() => this.startAudioInputTask(device));
  }

  private async startAudioInputTask(device: AudioInputDevice): Promise<MediaStream | undefined> {
    if (device === undefined) {
      this.logger.error('Audio input device cannot be undefined');
      return undefined;
    }

    try {
      if (isAudioTransformDevice(device)) {
        // N.B., do not JSON.stringify here — for some kinds of devices this
        // will cause a cyclic object reference error.
        this.logger.info(`Choosing transform input device ${device}`);

        await this.chooseAudioTransformInputDevice(device);
      } else {
        this.logger.info(`Choosing intrinsic audio input device ${device}`);
        this.removeTransform();
        await this.chooseInputIntrinsicDevice('audio', device);
      }
      this.trace('startAudioInputDevice', device, `success`);
      // For web audio, the audio destination stream stays the same so audio input did not change
      if (this.useWebAudio) {
        this.attachAudioInputStreamToAudioContext(this.activeDevices['audio'].stream);
        this.pushAudioMeetingStateForPermissions(this.getMediaStreamDestinationNode().stream);
        return this.getMediaStreamDestinationNode().stream;
      } else {
        this.publishAudioInputDidChangeEvent(this.activeDevices['audio'].stream);
        return this.activeDevices['audio'].stream;
      }
    } catch (error) {
      throw error;
    }
  }

  async stopAudioInput(): Promise<void> {
    return this.audioInputTaskQueue.add(() => this.stopAudioInputTask());
  }

  private async stopAudioInputTask(): Promise<void> {
    try {
      if (this.useWebAudio) {
        this.releaseAudioTransformStream();
        return;
      }
      this.stopTracksAndRemoveCallbacks('audio');
    } finally {
      this.watchForDeviceChangesIfNecessary();
      this.publishAudioInputDidChangeEvent(undefined);
    }
  }

  private async chooseAudioTransformInputDevice(device: AudioTransformDevice): Promise<void> {
    if (this.transform?.device === device) {
      return;
    }

    if (!this.useWebAudio) {
      throw new Error('Cannot apply transform device without enabling Web Audio.');
    }

    const context = DefaultDeviceController.getAudioContext();

    if (context instanceof OfflineAudioContext) {
      // Nothing to do.
    } else {
      switch (context.state) {
        case 'running':
          // Nothing to do.
          break;
        case 'closed':
          // A closed context cannot be used for creating nodes, so the correct
          // thing to do is to raise a descriptive error sooner.
          throw new Error('Cannot choose a transform device with a closed audio context.');
        case 'suspended':
          // A context might be suspended after page load. We try to resume it
          // here, otherwise audio won't work.
          await context.resume();
      }
    }

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
    await this.chooseInputIntrinsicDevice('audio', inner);
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
      await this.chooseInputIntrinsicDevice('video', inner);
      this.logger.info('apply processors to transform');
      await this.chosenVideoTransformDevice.transformStream(this.activeDevices['video'].stream);
      return;
    }

    // When saved stream is reusable, only switch the saved stream to filtered stream for sending
    // but keep the saved stream intact.

    // Note: to keep the chosen media stream intact, it is important to avoid a full stop
    // because videoTileUpdate can be called when video is stopped and user might call `bindVideoElement` to disconnect the element.
    // In current implementation, disconnecting the element will `hard` stop the media stream.

    // Update device and stream
    this.chosenVideoTransformDevice = device;
    this.logger.info('video transform device uses previous stream');

    // `transformStream` will start processing.
    this.logger.info('apply processors to transform');
    await device.transformStream(this.activeDevices['video'].stream);
  }

  async startVideoInput(device: VideoInputDevice): Promise<MediaStream | undefined> {
    return await this.videoInputTaskQueue.add(() => this.startVideoInputTask(device));
  }

  private async startVideoInputTask(device: VideoInputDevice): Promise<MediaStream | undefined> {
    if (!device) {
      this.logger.error('Invalid video input device');
      return undefined;
    }

    try {
      if (isVideoTransformDevice(device)) {
        this.logger.info(`Choosing video transform device ${device}`);
        await this.chooseVideoTransformInputDevice(device);
        this.publishVideoInputDidChangeEvent(this.chosenVideoTransformDevice.outputMediaStream);
        return this.chosenVideoTransformDevice.outputMediaStream;
      }

      // handle direct switching from VideoTransformDevice to Device
      // From WebRTC point, it is a device switching.
      if (this.chosenVideoInputIsTransformDevice()) {
        // disconnect old stream
        this.chosenVideoTransformDevice.onOutputStreamDisconnect();
        this.chosenVideoTransformDevice = null;
      }
      await this.chooseInputIntrinsicDevice('video', device);

      this.trace('startVideoInputDevice', device);
      this.publishVideoInputDidChangeEvent(this.activeDevices['video'].stream);
      return this.activeDevices['video'].stream;
    } catch (error) {
      throw error;
    }
  }

  async stopVideoInput(): Promise<void> {
    return this.videoInputTaskQueue.add(() => this.stopVideoInputTask());
  }

  private async stopVideoInputTask(): Promise<void> {
    try {
      if (this.chosenVideoInputIsTransformDevice()) {
        this.releaseVideoTransformStream();
        return;
      }
      this.stopTracksAndRemoveCallbacks('video');
    } finally {
      this.watchForDeviceChangesIfNecessary();
      this.publishVideoInputDidChangeEvent(undefined);
    }
  }

  async chooseAudioOutput(deviceId: string | null): Promise<void> {
    this.audioOutputDeviceId = deviceId;
    this.watchForDeviceChangesIfNecessary();
    const deviceInfo = this.deviceInfoFromDeviceId('audiooutput', this.audioOutputDeviceId);
    this.publishAudioOutputDidChangeEvent(deviceInfo);
    this.trace('chooseAudioOutput', deviceId, null);
    return;
  }

  addDeviceChangeObserver(observer: DeviceChangeObserver): void {
    this.logger.info('adding device change observer');
    this.deviceChangeObservers.add(observer);
    this.watchForDeviceChangesIfNecessary();
    this.trace('addDeviceChangeObserver');
  }

  removeDeviceChangeObserver(observer: DeviceChangeObserver): void {
    this.logger.info('removing device change observer');
    this.deviceChangeObservers.delete(observer);
    this.watchForDeviceChangesIfNecessary();
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
    DefaultVideoTile.connectVideoStreamToVideoElement(
      this.chosenVideoTransformDevice
        ? this.chosenVideoTransformDevice.outputMediaStream
        : this.activeDevices['video'].stream,
      element,
      true
    );
    this.trace('startVideoPreviewForVideoInput', element.id);
  }

  stopVideoPreviewForVideoInput(element: HTMLVideoElement): void {
    DefaultVideoTile.disconnectVideoStreamFromVideoElement(element, false);
    this.trace('stopVideoPreviewForVideoInput', element.id);
  }

  setDeviceLabelTrigger(trigger: () => Promise<MediaStream>): void {
    // Discard the cache if it was populated with unlabeled devices.
    if (this.deviceInfoCache) {
      for (const device of this.deviceInfoCache) {
        if (!device.label) {
          this.deviceInfoCache = null;
          break;
        }
      }
    }

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

  chooseVideoInputQuality(width: number, height: number, frameRate: number): void {
    const dimension = this.browserBehavior.requiresResolutionAlignment(width, height);
    this.videoInputQualitySettings = new VideoQualitySettings(
      dimension[0],
      dimension[1],
      frameRate
    );
  }

  getVideoInputQualitySettings(): VideoQualitySettings | null {
    return this.videoInputQualitySettings;
  }

  async acquireAudioInputStream(): Promise<MediaStream> {
    if (!this.activeDevices['audio']) {
      this.logger.info(`No audio device chosen, creating empty audio device`);
      await this.startAudioInput(null);
    }

    if (this.useWebAudio) {
      const dest = this.getMediaStreamDestinationNode();
      return dest.stream;
    }
    return this.activeDevices['audio'].stream;
  }

  async acquireVideoInputStream(): Promise<MediaStream> {
    if (!this.activeDevices['video']) {
      throw new Error(`No video device chosen`);
    }
    if (this.chosenVideoInputIsTransformDevice()) {
      return this.chosenVideoTransformDevice.outputMediaStream;
    }
    return this.activeDevices['video'].stream;
  }

  async acquireDisplayInputStream(
    _streamConstraints: MediaStreamConstraints
  ): Promise<MediaStream> {
    throw new Error('unsupported');
  }

  /**
   *
   * We need to do three things to clean up audio input
   *
   * * Close the tracks of the source stream.
   * * Remove the transform.
   * * Clean up the intrinsic stream's callback -- that's the stream that's tracked in
   *   `activeDevices` and needs to have its callbacks removed.
   */
  private releaseAudioTransformStream(): void {
    this.logger.info('Stopping audio track for Web Audio graph');

    this.stopTracksAndRemoveCallbacks('audio');

    this.logger.info('Removing audio transform, if there is one.');
    this.removeTransform();

    // Remove the input and output nodes. They will be recreated later if
    // needed.
    /* istanbul ignore else */
    if (this.audioInputSourceNode) {
      this.audioInputSourceNode.disconnect();
      this.audioInputSourceNode = undefined;
    }

    /* istanbul ignore else */
    if (this.audioInputDestinationNode) {
      this.audioInputDestinationNode.disconnect();
      this.audioInputDestinationNode = undefined;
    }
  }

  /**
   *
   * We need to do three things to clean up video input
   *
   * * Close the tracks of the source stream.
   * * Remove the transform.
   * * Clean up the intrinsic stream's callback -- that's the stream that's tracked in
   *   `activeDevices` and needs to have its callbacks removed.
   */
  private releaseVideoTransformStream(): void {
    this.logger.info('Stopping video track for transform');

    this.stopTracksAndRemoveCallbacks('video');

    this.logger.info('Disconnecting video transform');
    this.chosenVideoTransformDevice.onOutputStreamDisconnect();
    this.chosenVideoTransformDevice = null;
  }

  private stopTracksAndRemoveCallbacks(kind: 'video' | 'audio'): void {
    const activeDevice = this.activeDevices[kind];

    // Just-in-case error handling.
    /* istanbul ignore if */
    if (!activeDevice) {
      return;
    }

    /* istanbul ignore next */
    const endedCallback = activeDevice.endedCallback;
    const trackMuteCallback = activeDevice.trackMuteCallback;
    const trackUnmuteCallback = activeDevice.trackUnmuteCallback;

    for (const track of activeDevice.stream.getTracks()) {
      track.stop();

      /* istanbul ignore else */
      if (endedCallback) {
        track.removeEventListener('ended', endedCallback);
      }
      /* istanbul ignore else */
      if (trackMuteCallback) {
        track.removeEventListener('mute', trackMuteCallback);
      }
      /* istanbul ignore else */
      if (trackUnmuteCallback) {
        track.removeEventListener('unmute', trackUnmuteCallback);
      }

      delete activeDevice.endedCallback;
      delete activeDevice.trackMuteCallback;
      delete activeDevice.trackUnmuteCallback;
      delete this.activeDevices[kind];
    }
  }

  private chosenVideoInputIsTransformDevice(): boolean {
    return !!this.chosenVideoTransformDevice;
  }

  muteLocalAudioInputStream(): void {
    this.toggleLocalAudioInputStream(false);
  }

  unmuteLocalAudioInputStream(): void {
    this.toggleLocalAudioInputStream(true);
  }

  private toggleLocalAudioInputStream(enabled: boolean): void {
    let audioDevice: MediaStreamAudioDestinationNode | DeviceSelection = this.activeDevices[
      'audio'
    ];
    if (this.useWebAudio) {
      audioDevice = this.getMediaStreamDestinationNode();
    }
    if (!audioDevice) {
      return;
    }
    let isChanged = false;
    for (const track of audioDevice.stream.getTracks()) {
      if (track.enabled === enabled) {
        continue;
      }
      track.enabled = enabled;
      isChanged = true;
    }
    if (isChanged) {
      this.transform?.device.mute(!enabled);
    }
  }

  static getIntrinsicDeviceId(device: Device | null): string | string[] | undefined {
    if (!device) {
      return undefined;
    }

    if (typeof device === 'string') {
      return device;
    }

    if ((device as MediaStream).id) {
      return (device as MediaStream).id;
    }

    const constraints: MediaTrackConstraints = device as MediaTrackConstraints;
    const deviceIdConstraints = constraints.deviceId;
    if (!deviceIdConstraints) {
      return undefined;
    }

    if (typeof deviceIdConstraints === 'string' || Array.isArray(deviceIdConstraints)) {
      return deviceIdConstraints;
    }

    const constraintStringParams: ConstrainDOMStringParameters = deviceIdConstraints as ConstrainDOMStringParameters;
    if (
      typeof constraintStringParams.exact === 'string' ||
      Array.isArray(constraintStringParams.exact)
    ) {
      return constraintStringParams.exact;
    }

    return undefined;
  }

  static createEmptyAudioDevice(): MediaStream {
    return DefaultDeviceController.synthesizeAudioDevice(0);
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

  private async listDevicesOfKind(
    deviceKind: string,
    forceUpdate: boolean
  ): Promise<MediaDeviceInfo[]> {
    if (forceUpdate || this.deviceInfoCache === null || !this.isWatchingForDeviceChanges()) {
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
    this.logger.debug(`Update device info cache with devices: ${JSON.stringify(devices)}`);
    this.deviceInfoCache = devices;
  }

  private listCachedDevicesOfKind(deviceKind: string): MediaDeviceInfo[] {
    const devicesOfKind: MediaDeviceInfo[] = [];
    if (this.deviceInfoCache) {
      for (const device of this.deviceInfoCache) {
        if (device.kind === deviceKind) {
          devicesOfKind.push(device);
        }
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
      AsyncScheduler.nextTick(() => {
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

  private async handleDeviceStreamEnded(kind: 'audio' | 'video', deviceId: string): Promise<void> {
    try {
      if (kind === 'audio') {
        this.logger.warn(
          `Audio input device which was active is no longer available, resetting to null device`
        );
        await this.startAudioInput(null); //Need to switch to empty audio device
      } else {
        this.logger.warn(
          `Video input device which was active is no longer available, stopping video`
        );
        await this.stopVideoInput();
      }
    } catch (e) {
      /* istanbul ignore next */
      this.logger.error('Failed to choose null device after stream ended.');
    }

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
      AsyncScheduler.nextTick(() => {
        /* istanbul ignore else */
        if (this.deviceChangeObservers.has(observer)) {
          observerFunc(observer);
        }
      });
    }
  }

  private forEachMediaStreamBrokerObserver(
    observerFunc: (obsever: MediaStreamBrokerObserver) => void
  ): void {
    for (const observer of this.mediaStreamBrokerObservers) {
      observerFunc(observer);
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

  private hasSameMediaStreamId(
    kind: string,
    selection: DeviceSelection,
    proposedConstraints: MediaStreamConstraints
  ): boolean {
    // Checking for stream using the fake constraint created in getMediaStreamConstraints
    let streamId;
    if (kind === 'audio') {
      // @ts-ignore
      streamId = proposedConstraints?.audio.streamId;
      /* istanbul ignore next */
      // @ts-ignore
      return !!streamId && streamId === selection.constraints?.audio?.streamId;
    }
    /* istanbul ignore next */
    // @ts-ignore
    streamId = proposedConstraints?.video.streamId;
    /* istanbul ignore next */
    // @ts-ignore
    return !!streamId && streamId === selection?.constraints?.video?.streamId;
  }

  private hasSameGroupId(groupId: string, kind: string, device: Device): boolean {
    if (groupId === '') {
      return true;
    }
    const deviceIds = DefaultDeviceController.getIntrinsicDeviceId(device);
    this.logger.debug(
      `Checking deviceIds ${deviceIds} of type ${typeof deviceIds} with groupId ${groupId}`
    );
    if (typeof deviceIds === 'string' && groupId === this.getGroupIdFromDeviceId(kind, deviceIds)) {
      return true;
    }
    return false;
  }

  private getGroupIdFromDeviceId(kind: string, deviceId: string): string {
    if (this.deviceInfoCache !== null) {
      const cachedDeviceInfo = this.listCachedDevicesOfKind(`${kind}input`).find(
        (cachedDevice: MediaDeviceInfo) => cachedDevice.deviceId === deviceId
      );
      if (cachedDeviceInfo && cachedDeviceInfo.groupId) {
        this.logger.debug(
          `GroupId of deviceId ${deviceId} found in cache is ${cachedDeviceInfo.groupId}`
        );
        return cachedDeviceInfo.groupId;
      }
    }
    this.logger.debug(`GroupId of deviceId ${deviceId} found in cache is empty`);
    return '';
  }

  private handleGetUserMediaError(error: Error, errorTimeMs?: number): void {
    if (!error) {
      throw new GetUserMediaError(error);
    }

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

  /**
   * Check whether a device is already selected.
   *
   * @param kind typically 'audio' or 'video'.
   * @param device the device about to be selected.
   * @param selection the existing device selection of this kind.
   * @param proposedConstraints the constraints that will be used when this device is selected.
   * @returns whether `device` matches `selection` — that is, whether this device is already selected.
   */
  private matchesDeviceSelection(
    kind: string,
    device: Device,
    selection: DeviceSelection | undefined,
    proposedConstraints: MediaStreamConstraints
  ): boolean {
    if (
      selection &&
      selection.stream.active &&
      (this.hasSameMediaStreamId(kind, selection, proposedConstraints) ||
        (selection.groupId !== null && this.hasSameGroupId(selection.groupId, kind, device)))
    ) {
      // TODO: this should be computed within this function.
      this.logger.debug(
        `Compare current device constraint ${JSON.stringify(
          selection.constraints
        )} to proposed constraints ${JSON.stringify(proposedConstraints)}`
      );
      return selection.matchesConstraints(proposedConstraints);
    }

    return false;
  }

  private async chooseInputIntrinsicDevice(
    kind: 'audio' | 'video',
    device: Device | null
  ): Promise<void> {
    // N.B.,: the input device might already have augmented constraints supplied
    // by an `AudioTransformDevice`. `getMediaStreamConstraints` will respect
    // settings supplied by the device.
    const proposedConstraints = this.getMediaStreamConstraints(kind, device);

    // TODO: `matchesConstraints` should really return compatible/incompatible/exact --
    // `applyConstraints` can be used to reuse the active device while changing the
    // requested constraints.
    if (this.matchesDeviceSelection(kind, device, this.activeDevices[kind], proposedConstraints)) {
      this.logger.info(`reusing existing ${kind} input device`);
      return;
    }
    if (this.activeDevices[kind] && this.activeDevices[kind].stream) {
      this.stopTracksAndRemoveCallbacks(kind);
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
      }
      await this.handleNewInputDevice(kind, newDevice);
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);

      if (kind === 'audio') {
        this.eventController?.publishEvent('audioInputFailed', {
          audioInputErrorMessage: errorMessage,
        });
      } else {
        this.eventController?.publishEvent('videoInputFailed', {
          videoInputErrorMessage: errorMessage,
        });
      }

      this.logger.error(
        `failed to get ${kind} device for constraints ${JSON.stringify(
          proposedConstraints
        )}: ${errorMessage}`
      );

      let hasError = true;
      // This is effectively `error instanceof OverconstrainedError` but works in Node.
      if (error && 'constraint' in error) {
        this.logger.error(`Over-constrained by constraint: ${error.constraint}`);
        // Try to reduce the constraints if over-constraints
        if (this.useMediaConstraintsFallback) {
          const fallbackConstraints = this.getMediaStreamConstraints(kind, device, true);
          const fallbackConstraintsJSON = JSON.stringify(fallbackConstraints);
          if (fallbackConstraintsJSON !== JSON.stringify(proposedConstraints)) {
            this.logger.info(
              `retry requesting new ${kind} device with minimal constraint ${fallbackConstraintsJSON}`
            );
            try {
              newDevice.stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
              newDevice.constraints = fallbackConstraints;
              await this.handleNewInputDevice(kind, newDevice);
              hasError = false;
            } catch (e) {
              this.logger.error(
                `failed to get ${kind} device for constraints ${fallbackConstraintsJSON}: ${this.getErrorMessage(
                  e
                )}`
              );
            }
          }
        }
      }

      if (hasError) {
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
            await this.handleNewInputDevice(kind, newDevice);
          } catch (error) {
            this.logger.error(
              `failed to choose null ${kind} device. ${error.name}: ${error.message}`
            );
          }
        }
        this.handleGetUserMediaError(error, Date.now() - startTimeMs);
      }
    } finally {
      this.watchForDeviceChangesIfNecessary();
    }
  }

  private getErrorMessage(error: Error): string {
    if (!error) {
      return 'UnknownError';
    }
    if (error.name && error.message) {
      return `${error.name}: ${error.message}`;
    }
    if (error.name) {
      return error.name;
    }
    if (error.message) {
      return error.message;
    }
    return 'UnknownError';
  }

  private async handleNewInputDevice(
    kind: 'audio' | 'video',
    newDevice: DeviceSelection
  ): Promise<void> {
    this.logger.info(`got ${kind} device for constraints ${JSON.stringify(newDevice.constraints)}`);
    const newDeviceId = this.getMediaTrackSettings(newDevice.stream)?.deviceId;
    newDevice.groupId = newDeviceId ? this.getGroupIdFromDeviceId(kind, newDeviceId) : '';
    this.activeDevices[kind] = newDevice;
    this.logger.debug(`Set activeDevice to ${JSON.stringify(newDevice)}`);
    this.watchForDeviceChangesIfNecessary();

    // Add event listener to detect ended event of media track
    // We only monitor the first track, and use its device ID for observer notifications.
    const track = newDevice.stream.getTracks()[0];

    if (track) {
      newDevice.endedCallback = (): void => {
        // Hard to test, but the safety check is worthwhile.
        /* istanbul ignore else */
        if (this.activeDevices[kind] && this.activeDevices[kind].stream === newDevice.stream) {
          this.handleDeviceStreamEnded(kind, newDeviceId);
          delete newDevice.endedCallback;
        }
      };
      track.addEventListener('ended', newDevice.endedCallback, { once: true });
    }

    // Add event listener to mute/unmute event for audio
    if (kind === 'audio') {
      // We only monitor the first track, and use its device ID for observer notifications.
      const track = newDevice.stream.getAudioTracks()[0];
      if (track) {
        const id = track.getSettings().deviceId || newDevice.stream;

        newDevice.trackMuteCallback = (): void => {
          this.mediaStreamMuteObserver(id, true);
        };
        newDevice.trackUnmuteCallback = (): void => {
          this.mediaStreamMuteObserver(id, false);
        };
        track.addEventListener('mute', newDevice.trackMuteCallback, { once: false });
        track.addEventListener('unmute', newDevice.trackUnmuteCallback, { once: false });

        this.logger.debug('Notifying mute state after selection');
        if (track.muted) {
          newDevice.trackMuteCallback();
        } else {
          newDevice.trackUnmuteCallback();
        }
      }
    }
  }

  private calculateMediaStreamConstraints(
    kind: string,
    deviceId: string,
    groupId: string,
    minimal: boolean
  ): MediaTrackConstraints | boolean {
    // No need for any constraints if we want minimal constraint and there is only one device
    if (minimal && this.listCachedDevicesOfKind(`${kind}input`).length === 1) {
      return true;
    }
    const trackConstraints: MediaTrackConstraints = {};
    // In Samsung Internet browser, navigator.mediaDevices.enumerateDevices()
    // returns same deviceId but different groupdId for some audioinput and videoinput devices.
    // To handle this, we select appropriate device using deviceId + groupId.
    if (this.browserBehavior.requiresNoExactMediaStreamConstraints()) {
      trackConstraints.deviceId = deviceId;
    } else {
      trackConstraints.deviceId = { exact: deviceId };
    }
    if (groupId) {
      trackConstraints.groupId = groupId;
    }

    if (minimal) {
      return trackConstraints;
    }

    // Video additional constraints
    if (kind === 'video') {
      trackConstraints.width = {
        ideal: this.videoInputQualitySettings.videoWidth,
      };
      trackConstraints.height = {
        ideal: this.videoInputQualitySettings.videoHeight,
      };
      trackConstraints.frameRate = {
        ideal: this.videoInputQualitySettings.videoFrameRate,
      };
      return trackConstraints;
    }

    // Audio additional constraints
    if (this.supportSampleRateConstraint()) {
      trackConstraints.sampleRate = { ideal: DefaultDeviceController.defaultSampleRate };
    }
    if (this.supportSampleSizeConstraint()) {
      trackConstraints.sampleSize = { ideal: DefaultDeviceController.defaultSampleSize };
    }
    if (this.supportChannelCountConstraint()) {
      trackConstraints.channelCount = { ideal: DefaultDeviceController.defaultChannelCount };
    }
    const augmented = {
      echoCancellation: true,
      googEchoCancellation: true,
      googEchoCancellation2: true,
      googAutoGainControl: true,
      googAutoGainControl2: true,
      googNoiseSuppression: true,
      googNoiseSuppression2: true,
      googHighpassFilter: true,
      ...trackConstraints,
    };
    return augmented as MediaTrackConstraints;
  }

  private getMediaStreamConstraintsFromTrackConstraints(
    kind: 'audio' | 'video',
    trackConstraints: MediaTrackConstraints | boolean
  ): MediaStreamConstraints {
    return kind === 'audio' ? { audio: trackConstraints } : { video: trackConstraints };
  }

  private getMediaStreamConstraints(
    kind: 'audio' | 'video',
    device: Device,
    minimal: boolean = false
  ): MediaStreamConstraints | null {
    let trackConstraints: MediaTrackConstraints | boolean = {};
    if (!device) {
      return null;
    }
    const stream = this.intrinsicDeviceAsMediaStream(device);
    if (stream) {
      // @ts-ignore - create a fake track constraint using the stream id
      trackConstraints.streamId = stream.id;
      return this.getMediaStreamConstraintsFromTrackConstraints(kind, trackConstraints);
    }
    if (typeof device === 'string') {
      let groupId = '';
      if (this.browserBehavior.requiresGroupIdMediaStreamConstraints()) {
        if (this.deviceInfoCache !== null) {
          groupId = this.getGroupIdFromDeviceId(kind, device);
        } else {
          this.logger.error(
            'Device cache is not populated. Please make sure to call list devices first'
          );
        }
      }
      trackConstraints = this.calculateMediaStreamConstraints(kind, device, groupId, minimal);
      return this.getMediaStreamConstraintsFromTrackConstraints(kind, trackConstraints);
    }

    if (isMediaDeviceInfo(device)) {
      trackConstraints = this.calculateMediaStreamConstraints(
        kind,
        device.deviceId,
        device.groupId,
        minimal
      );
      return this.getMediaStreamConstraintsFromTrackConstraints(kind, trackConstraints);
    }
    // Take the input set of constraints.
    // In this case, we just use the constraints as-is.
    // @ts-ignore - device is a MediaTrackConstraints
    trackConstraints = device;
    return this.getMediaStreamConstraintsFromTrackConstraints(kind, trackConstraints);
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

    const settings = this.getMediaTrackSettings(stream);
    // If a device does not specify deviceId, we have to assume the stream is not reusable.
    if (!settings.deviceId) {
      return false;
    }
    const deviceIds = DefaultDeviceController.getIntrinsicDeviceId(device);
    if (typeof deviceIds === 'string') {
      return settings.deviceId === deviceIds;
    }
    return false;
  }

  private getMediaTrackSettings(stream: MediaStream): MediaTrackSettings {
    return stream.getTracks()[0]?.getSettings();
  }

  private reconnectAudioInputs(): void {
    if (!this.audioInputSourceNode) {
      return;
    }

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
      try {
        DefaultDeviceController.audioContext.close();
      } catch (e) {
        // Nothing we can do.
      }
    }
    DefaultDeviceController.audioContext = null;
  }

  addMediaStreamBrokerObserver(observer: MediaStreamBrokerObserver): void {
    this.mediaStreamBrokerObservers.add(observer);
  }

  removeMediaStreamBrokerObserver(observer: MediaStreamBrokerObserver): void {
    this.mediaStreamBrokerObservers.delete(observer);
  }

  private publishVideoInputDidChangeEvent(videoStream: MediaStream | undefined): void {
    this.forEachMediaStreamBrokerObserver((observer: MediaStreamBrokerObserver) => {
      if (observer.videoInputDidChange) {
        observer.videoInputDidChange(videoStream);
      }
    });
    this.pushVideoMeetingStateForPermissions(videoStream);
  }

  private publishAudioInputDidChangeEvent(audioStream: MediaStream | undefined): void {
    this.forEachMediaStreamBrokerObserver((observer: MediaStreamBrokerObserver) => {
      if (observer.audioInputDidChange) {
        observer.audioInputDidChange(audioStream);
      }
    });
    this.pushAudioMeetingStateForPermissions(audioStream);
  }

  private publishAudioOutputDidChangeEvent(device: MediaDeviceInfo | null): void {
    this.forEachMediaStreamBrokerObserver((observer: MediaStreamBrokerObserver) => {
      if (observer.audioOutputDidChange) {
        observer.audioOutputDidChange(device);
      }
    });
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

function isMediaDeviceInfo(device: unknown): device is MediaDeviceInfo {
  return (
    typeof device === 'object' &&
    'deviceId' in device &&
    'groupId' in device &&
    'kind' in device &&
    'label' in device
  );
}
