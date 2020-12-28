// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ActiveSpeakerPolicy from '../activespeakerpolicy/ActiveSpeakerPolicy';
import AudioMixController from '../audiomixcontroller/AudioMixController';
import AudioProfile from '../audioprofile/AudioProfile';
import AudioVideoController from '../audiovideocontroller/AudioVideoController';
import AudioVideoFacade from '../audiovideofacade/AudioVideoFacade';
import AudioVideoObserver from '../audiovideoobserver/AudioVideoObserver';
import ContentShareController from '../contentsharecontroller/ContentShareController';
import ContentShareObserver from '../contentshareobserver/ContentShareObserver';
import DataMessage from '../datamessage/DataMessage';
import DeviceChangeObserver from '../devicechangeobserver/DeviceChangeObserver';
import AudioInputDevice from '../devicecontroller/AudioInputDevice';
import DeviceController from '../devicecontroller/DeviceController';
import RemovableAnalyserNode from '../devicecontroller/RemovableAnalyserNode';
import VideoInputDevice from '../devicecontroller/VideoInputDevice';
import VideoQualitySettings from '../devicecontroller/VideoQualitySettings';
import { isVideoTransformDevice } from '../devicecontroller/VideoTransformDevice';
import RealtimeController from '../realtimecontroller/RealtimeController';
import type VolumeIndicatorCallback from '../realtimecontroller/VolumeIndicatorCallback';
import VideoSource from '../videosource/VideoSource';
import VideoTile from '../videotile/VideoTile';
import VideoTileController from '../videotilecontroller/VideoTileController';

export default class DefaultAudioVideoFacade implements AudioVideoFacade {
  constructor(
    private audioVideoController: AudioVideoController,
    private videoTileController: VideoTileController,
    private realtimeController: RealtimeController,
    private audioMixController: AudioMixController,
    private deviceController: DeviceController,
    private contentShareController: ContentShareController
  ) {}

  addObserver(observer: AudioVideoObserver): void {
    this.audioVideoController.addObserver(observer);
    this.trace('addObserver');
  }

  removeObserver(observer: AudioVideoObserver): void {
    this.audioVideoController.removeObserver(observer);
    this.trace('removeObserver');
  }

  setAudioProfile(audioProfile: AudioProfile): void {
    this.trace('setAudioProfile', audioProfile);
    this.audioVideoController.setAudioProfile(audioProfile);
  }

  start(): void {
    this.audioVideoController.start();
    this.trace('start');
  }

  stop(): void {
    this.audioVideoController.stop();
    this.trace('stop');
  }

  getRTCPeerConnectionStats(selector?: MediaStreamTrack): Promise<RTCStatsReport> {
    this.trace('getRTCPeerConnectionStats', selector ? selector.id : null);
    return this.audioVideoController.getRTCPeerConnectionStats(selector);
  }

  bindAudioElement(element: HTMLAudioElement): Promise<void> {
    const result = this.audioMixController.bindAudioElement(element);
    this.trace('bindAudioElement', element.id, result);
    return result;
  }

  unbindAudioElement(): void {
    this.audioMixController.unbindAudioElement();
    this.trace('unbindAudioElement');
  }

  bindVideoElement(tileId: number, videoElement: HTMLVideoElement): void {
    this.videoTileController.bindVideoElement(tileId, videoElement);
    this.trace('bindVideoElement', { tileId: tileId, videoElementId: videoElement.id });
  }

  unbindVideoElement(tileId: number): void {
    this.videoTileController.unbindVideoElement(tileId);
    this.trace('unbindVideoElement', tileId);
  }

  startLocalVideoTile(): number {
    const result = this.videoTileController.startLocalVideoTile();
    this.trace('startLocalVideoTile', null, result);
    return result;
  }

  stopLocalVideoTile(): void {
    this.videoTileController.stopLocalVideoTile();
    this.trace('stopLocalVideoTile');
  }

  hasStartedLocalVideoTile(): boolean {
    const result = this.videoTileController.hasStartedLocalVideoTile();
    this.trace('hasStartedLocalVideoTile', null, result);
    return result;
  }

  removeLocalVideoTile(): void {
    this.videoTileController.removeLocalVideoTile();
    this.trace('removeLocalVideoTile');
  }

  getLocalVideoTile(): VideoTile | null {
    const result = this.videoTileController.getLocalVideoTile();
    this.trace('getLocalVideoTile');
    return result;
  }

  pauseVideoTile(tileId: number): void {
    this.videoTileController.pauseVideoTile(tileId);
    this.trace('pauseVideoTile', tileId);
  }

  unpauseVideoTile(tileId: number): void {
    this.videoTileController.unpauseVideoTile(tileId);
    this.trace('unpauseVideoTile', tileId);
  }

  getVideoTile(tileId: number): VideoTile | null {
    const result = this.videoTileController.getVideoTile(tileId);
    this.trace('getVideoTile', tileId);
    return result;
  }

  getAllRemoteVideoTiles(): VideoTile[] {
    const result = this.videoTileController.getAllRemoteVideoTiles();
    this.trace('getAllRemoteVideoTiles');
    return result;
  }

  getAllVideoTiles(): VideoTile[] {
    const result = this.videoTileController.getAllVideoTiles();
    this.trace('getAllVideoTiles');
    return result;
  }

  addVideoTile(): VideoTile {
    const result = this.videoTileController.addVideoTile();
    this.trace('addVideoTile', null, result.state());
    return result;
  }

  removeVideoTile(tileId: number): void {
    this.videoTileController.removeVideoTile(tileId);
    this.trace('removeVideoTile', tileId);
  }

  removeVideoTilesByAttendeeId(attendeeId: string): number[] {
    const result = this.videoTileController.removeVideoTilesByAttendeeId(attendeeId);
    this.trace('removeVideoTilesByAttendeeId', attendeeId, result);
    return result;
  }

  removeAllVideoTiles(): void {
    this.videoTileController.removeAllVideoTiles();
    this.trace('removeAllVideoTiles');
  }

  captureVideoTile(tileId: number): ImageData | null {
    const result = this.videoTileController.captureVideoTile(tileId);
    this.trace('captureVideoTile', tileId);
    return result;
  }

  realtimeSubscribeToAttendeeIdPresence(
    callback: (
      attendeeId: string,
      present: boolean,
      externalUserId?: string,
      dropped?: boolean
    ) => void
  ): void {
    this.realtimeController.realtimeSubscribeToAttendeeIdPresence(callback);
    this.trace('realtimeSubscribeToAttendeeIdPresence');
  }

  realtimeUnsubscribeToAttendeeIdPresence(
    callback: (
      attendeeId: string,
      present: boolean,
      externalUserId?: string,
      dropped?: boolean
    ) => void
  ): void {
    this.realtimeController.realtimeUnsubscribeToAttendeeIdPresence(callback);
    this.trace('realtimeUnsubscribeToAttendeeIdPresence');
  }

  realtimeSetCanUnmuteLocalAudio(canUnmute: boolean): void {
    this.realtimeController.realtimeSetCanUnmuteLocalAudio(canUnmute);
    this.trace('realtimeSetCanUnmuteLocalAudio', canUnmute);
  }

  realtimeSubscribeToSetCanUnmuteLocalAudio(callback: (canUnmute: boolean) => void): void {
    this.realtimeController.realtimeSubscribeToSetCanUnmuteLocalAudio(callback);
    this.trace('realtimeSubscribeToSetCanUnmuteLocalAudio');
  }

  realtimeUnsubscribeToSetCanUnmuteLocalAudio(callback: (canUnmute: boolean) => void): void {
    this.realtimeController.realtimeUnsubscribeToSetCanUnmuteLocalAudio(callback);
  }

  realtimeCanUnmuteLocalAudio(): boolean {
    const result = this.realtimeController.realtimeCanUnmuteLocalAudio();
    this.trace('realtimeCanUnmuteLocalAudio', null, result);
    return result;
  }

  realtimeMuteLocalAudio(): void {
    this.realtimeController.realtimeMuteLocalAudio();
    this.trace('realtimeMuteLocalAudio');
  }

  realtimeUnmuteLocalAudio(): boolean {
    const result = this.realtimeController.realtimeUnmuteLocalAudio();
    this.trace('realtimeUnmuteLocalAudio');
    return result;
  }

  realtimeSubscribeToMuteAndUnmuteLocalAudio(callback: (muted: boolean) => void): void {
    this.realtimeController.realtimeSubscribeToMuteAndUnmuteLocalAudio(callback);
    this.trace('realtimeSubscribeToMuteAndUnmuteLocalAudio');
  }

  realtimeUnsubscribeToMuteAndUnmuteLocalAudio(callback: (muted: boolean) => void): void {
    this.realtimeController.realtimeUnsubscribeToMuteAndUnmuteLocalAudio(callback);
  }

  realtimeIsLocalAudioMuted(): boolean {
    const result = this.realtimeController.realtimeIsLocalAudioMuted();
    this.trace('realtimeIsLocalAudioMuted');
    return result;
  }

  realtimeSubscribeToVolumeIndicator(attendeeId: string, callback: VolumeIndicatorCallback): void {
    this.realtimeController.realtimeSubscribeToVolumeIndicator(attendeeId, callback);
    this.trace('realtimeSubscribeToVolumeIndicator', attendeeId);
  }

  realtimeUnsubscribeFromVolumeIndicator(
    attendeeId: string,
    callback?: VolumeIndicatorCallback
  ): void {
    this.realtimeController.realtimeUnsubscribeFromVolumeIndicator(attendeeId, callback);
    this.trace('realtimeUnsubscribeFromVolumeIndicator', attendeeId, callback);
  }

  realtimeSubscribeToLocalSignalStrengthChange(callback: (signalStrength: number) => void): void {
    this.realtimeController.realtimeSubscribeToLocalSignalStrengthChange(callback);
    this.trace('realtimeSubscribeToLocalSignalStrengthChange');
  }

  realtimeUnsubscribeToLocalSignalStrengthChange(callback: (signalStrength: number) => void): void {
    this.realtimeController.realtimeUnsubscribeToLocalSignalStrengthChange(callback);
    this.trace('realtimeUnsubscribeToLocalSignalStrengthChange');
  }

  realtimeSendDataMessage(
    topic: string, // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Uint8Array | string | any,
    lifetimeMs?: number
  ): void {
    this.realtimeController.realtimeSendDataMessage(topic, data, lifetimeMs);
    this.trace('realtimeSendDataMessage');
  }

  realtimeSubscribeToReceiveDataMessage(
    topic: string,
    callback: (dataMessage: DataMessage) => void
  ): void {
    this.realtimeController.realtimeSubscribeToReceiveDataMessage(topic, callback);
    this.trace('realtimeSubscribeToReceiveDataMessage');
  }

  realtimeUnsubscribeFromReceiveDataMessage(topic: string): void {
    this.realtimeController.realtimeUnsubscribeFromReceiveDataMessage(topic);
    this.trace('realtimeUnsubscribeFromReceiveDataMessage');
  }

  realtimeSubscribeToFatalError(callback: (error: Error) => void): void {
    this.realtimeController.realtimeSubscribeToFatalError(callback);
  }

  realtimeUnsubscribeToFatalError(callback: (error: Error) => void): void {
    this.realtimeController.realtimeUnsubscribeToFatalError(callback);
  }

  subscribeToActiveSpeakerDetector(
    policy: ActiveSpeakerPolicy,
    callback: (activeSpeakers: string[]) => void,
    scoresCallback?: (scores: { [attendeeId: string]: number }) => void,
    scoresCallbackIntervalMs?: number
  ): void {
    this.audioVideoController.activeSpeakerDetector.subscribe(
      policy,
      callback,
      scoresCallback,
      scoresCallbackIntervalMs
    );
    this.trace('subscribeToActiveSpeakerDetector');
  }

  unsubscribeFromActiveSpeakerDetector(callback: (activeSpeakers: string[]) => void): void {
    this.audioVideoController.activeSpeakerDetector.unsubscribe(callback);
    this.trace('unsubscribeFromActiveSpeakerDetector');
  }

  async listAudioInputDevices(): Promise<MediaDeviceInfo[]> {
    const result = await this.deviceController.listAudioInputDevices();
    this.trace('listAudioInputDevices', null, result);
    return result;
  }

  async listVideoInputDevices(): Promise<MediaDeviceInfo[]> {
    const result = await this.deviceController.listVideoInputDevices();
    this.trace('listVideoInputDevices', null, result);
    return result;
  }

  async listAudioOutputDevices(): Promise<MediaDeviceInfo[]> {
    const result = await this.deviceController.listAudioOutputDevices();
    this.trace('listAudioOutputDevices', null, result);
    return result;
  }

  chooseAudioInputDevice(device: AudioInputDevice): Promise<void> {
    this.trace('chooseAudioInputDevice', device);
    return this.deviceController.chooseAudioInputDevice(device);
  }

  chooseVideoInputDevice(device: VideoInputDevice): Promise<void> {
    if (isVideoTransformDevice(device)) {
      // Don't stringify the device to avoid failures when cyclic object references are present.
      this.trace('chooseVideoInputDevice with transform device');
    } else {
      this.trace('chooseVideoInputDevice', device);
    }
    return this.deviceController.chooseVideoInputDevice(device);
  }

  chooseAudioOutputDevice(deviceId: string | null): Promise<void> {
    const result = this.deviceController.chooseAudioOutputDevice(deviceId);
    this.trace('chooseAudioOutputDevice', deviceId);
    return result;
  }

  addDeviceChangeObserver(observer: DeviceChangeObserver): void {
    this.deviceController.addDeviceChangeObserver(observer);
    this.trace('addDeviceChangeObserver');
  }

  removeDeviceChangeObserver(observer: DeviceChangeObserver): void {
    this.deviceController.removeDeviceChangeObserver(observer);
    this.trace('removeDeviceChangeObserver');
  }

  createAnalyserNodeForAudioInput(): RemovableAnalyserNode | null {
    const result = this.deviceController.createAnalyserNodeForAudioInput();
    this.trace('createAnalyserNodeForAudioInput');
    return result;
  }

  startVideoPreviewForVideoInput(element: HTMLVideoElement): void {
    this.deviceController.startVideoPreviewForVideoInput(element);
    this.trace('startVideoPreviewForVideoInput', element.id);
  }

  stopVideoPreviewForVideoInput(element: HTMLVideoElement): void {
    this.deviceController.stopVideoPreviewForVideoInput(element);
    this.trace('stopVideoPreviewForVideoInput', element.id);
  }

  setDeviceLabelTrigger(trigger: () => Promise<MediaStream>): void {
    this.deviceController.setDeviceLabelTrigger(trigger);
    this.trace('setDeviceLabelTrigger');
  }

  mixIntoAudioInput(stream: MediaStream): MediaStreamAudioSourceNode {
    const result = this.deviceController.mixIntoAudioInput(stream);
    this.trace('mixIntoAudioInput', stream.id);
    return result;
  }

  chooseVideoInputQuality(
    width: number,
    height: number,
    frameRate: number,
    maxBandwidthKbps: number
  ): void {
    this.deviceController.chooseVideoInputQuality(width, height, frameRate, maxBandwidthKbps);
    this.trace('chooseVideoInputQuality', {
      width: width,
      height: height,
      frameRate: frameRate,
      maxBandwidthKbps: maxBandwidthKbps,
    });
  }

  getVideoInputQualitySettings(): VideoQualitySettings | null {
    const result = this.deviceController.getVideoInputQualitySettings();
    this.trace('getVideoInputQualitySettings');
    return result;
  }

  setContentAudioProfile(audioProfile: AudioProfile): void {
    this.trace('setContentAudioProfile', audioProfile);
    this.contentShareController.setContentAudioProfile(audioProfile);
  }

  startContentShare(stream: MediaStream): Promise<void> {
    const result = this.contentShareController.startContentShare(stream);
    this.trace('startContentShare');
    return result;
  }

  startContentShareFromScreenCapture(sourceId?: string, frameRate?: number): Promise<MediaStream> {
    const result = this.contentShareController.startContentShareFromScreenCapture(
      sourceId,
      frameRate
    );
    this.trace('startContentShareFromScreenCapture');
    return result;
  }

  pauseContentShare(): void {
    this.contentShareController.pauseContentShare();
    this.trace('pauseContentShare');
  }

  unpauseContentShare(): void {
    this.contentShareController.unpauseContentShare();
    this.trace('unpauseContentShare');
  }

  stopContentShare(): void {
    this.contentShareController.stopContentShare();
    this.trace('stopContentShare');
  }

  addContentShareObserver(observer: ContentShareObserver): void {
    this.contentShareController.addContentShareObserver(observer);
    this.trace('addContentShareObserver');
  }

  removeContentShareObserver(observer: ContentShareObserver): void {
    this.contentShareController.removeContentShareObserver(observer);
    this.trace('removeContentShareObserver');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private trace(name: string, input?: any, output?: any): void {
    const meetingId = this.audioVideoController.configuration.meetingId;
    const attendeeId = this.audioVideoController.configuration.credentials.attendeeId;
    let s = `API/DefaultAudioVideoFacade/${meetingId}/${attendeeId}/${name}`;
    if (typeof input !== 'undefined') {
      s += ` ${JSON.stringify(input)}`;
    }
    if (typeof output !== 'undefined') {
      s += ` -> ${JSON.stringify(output)}`;
    }
    this.audioVideoController.logger.info(s);
  }

  getRemoteVideoSources(): VideoSource[] {
    const result = this.audioVideoController.getRemoteVideoSources();
    this.trace('getRemoteVideoSources', null, result);
    return result;
  }
}
