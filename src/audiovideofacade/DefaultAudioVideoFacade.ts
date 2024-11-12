// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { MeetingSessionCredentials, MeetingSessionStatus } from '..';
import ActiveSpeakerPolicy from '../activespeakerpolicy/ActiveSpeakerPolicy';
import AudioMixController from '../audiomixcontroller/AudioMixController';
import AudioMixObserver from '../audiomixobserver/AudioMixObserver';
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
import VideoCodecCapability from '../sdp/VideoCodecCapability';
import TranscriptionController from '../transcript/TranscriptionController';
import VideoSource from '../videosource/VideoSource';
import VideoTile from '../videotile/VideoTile';
import VideoTileController from '../videotilecontroller/VideoTileController';
import ContentShareSimulcastEncodingParameters from '../videouplinkbandwidthpolicy/ContentShareSimulcastEncodingParameters';

export default class DefaultAudioVideoFacade implements AudioVideoFacade, AudioVideoObserver {
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

  start(options?: { signalingOnly?: boolean }): void {
    this.audioVideoController.start(options);
    this.trace('start');
  }

  stop(): void {
    this.audioVideoController.stop();
    this.trace('stop');
  }

  /**
   * This API will be deprecated in favor of `ClientMetricReport.getRTCStatsReport()`.
   *
   * It makes an additional call to the `getStats` API and therefore may cause slight performance degradation.
   *
   * Please subscribe to `metricsDidReceive(clientMetricReport: ClientMetricReport)` callback,
   * and get the raw `RTCStatsReport` via `clientMetricReport.getRTCStatsReport()`.
   */
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

  getCurrentMeetingAudioStream(): Promise<MediaStream | null> {
    this.trace('getCurrentConferenceStream');
    return this.audioMixController.getCurrentMeetingAudioStream();
  }

  addAudioMixObserver(observer: AudioMixObserver): void {
    this.trace('addAudioMixObserver');
    this.audioMixController.addAudioMixObserver(observer);
  }

  removeAudioMixObserver(observer: AudioMixObserver): void {
    this.trace('removeAudioMixObserver');
    this.audioMixController.removeAudioMixObserver(observer);
  }

  bindVideoElement(tileId: number, videoElement: HTMLVideoElement): void {
    this.videoTileController.bindVideoElement(tileId, videoElement);
    this.trace('bindVideoElement', { tileId: tileId, videoElementId: videoElement.id });
  }

  unbindVideoElement(tileId: number, cleanUpVideoElement: boolean = true): void {
    this.videoTileController.unbindVideoElement(tileId, cleanUpVideoElement);
    this.trace('unbindVideoElement', { tileId: tileId, cleanUpVideoElement: cleanUpVideoElement });
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
    this.trace('realtimeUnsubscribeToSetCanUnmuteLocalAudio');
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
    this.trace('realtimeUnsubscribeToMuteAndUnmuteLocalAudio');
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
    this.trace('realtimeSubscribeToFatalError');
  }

  realtimeUnsubscribeToFatalError(callback: (error: Error) => void): void {
    this.realtimeController.realtimeUnsubscribeToFatalError(callback);
    this.trace('realtimeUnsubscribeToFatalError');
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

  async listAudioInputDevices(forceUpdate: boolean = false): Promise<MediaDeviceInfo[]> {
    const result = await this.deviceController.listAudioInputDevices(forceUpdate);
    this.trace('listAudioInputDevices', forceUpdate, result);
    return result;
  }

  async listVideoInputDevices(forceUpdate: boolean = false): Promise<MediaDeviceInfo[]> {
    const result = await this.deviceController.listVideoInputDevices(forceUpdate);
    this.trace('listVideoInputDevices', forceUpdate, result);
    return result;
  }

  async listAudioOutputDevices(forceUpdate: boolean = false): Promise<MediaDeviceInfo[]> {
    const result = await this.deviceController.listAudioOutputDevices(forceUpdate);
    this.trace('listAudioOutputDevices', forceUpdate, result);
    return result;
  }

  async startAudioInput(device: AudioInputDevice): Promise<MediaStream | undefined> {
    this.trace('startAudioInput', device);
    return this.deviceController.startAudioInput(device);
  }

  async stopAudioInput(): Promise<void> {
    this.trace('stopAudioInput');
    return this.deviceController.stopAudioInput();
  }

  async startVideoInput(device: VideoInputDevice): Promise<MediaStream | undefined> {
    if (isVideoTransformDevice(device)) {
      // Don't stringify the device to avoid failures when cyclic object references are present.
      this.trace('startVideoInput with transform device');
    } else {
      this.trace('startVideoInput', device);
    }
    return this.deviceController.startVideoInput(device);
  }

  async stopVideoInput(): Promise<void> {
    this.trace('stopVideoInput');
    return this.deviceController.stopVideoInput();
  }

  chooseAudioOutput(deviceId: string | null): Promise<void> {
    const result = this.deviceController.chooseAudioOutput(deviceId);
    this.trace('chooseAudioOutput', deviceId);
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

  chooseVideoInputQuality(width: number, height: number, frameRate: number): void {
    this.deviceController.chooseVideoInputQuality(width, height, frameRate);
    this.trace('chooseVideoInputQuality', {
      width: width,
      height: height,
      frameRate: frameRate,
    });
  }

  setVideoMaxBandwidthKbps(maxBandwidthKbps: number): void {
    this.audioVideoController.setVideoMaxBandwidthKbps(maxBandwidthKbps);
    this.trace('setVideoMaxBandwidthKbps', maxBandwidthKbps);
  }

  setVideoCodecSendPreferences(preferences: VideoCodecCapability[]): void {
    this.audioVideoController.setVideoCodecSendPreferences(preferences);
    this.trace('setVideoCodecSendPreferences', preferences);
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

  enableSimulcastForContentShare(
    enable: boolean,
    encodingParams?: ContentShareSimulcastEncodingParameters
  ): void {
    this.trace('enableSimulcastForContentShare');
    this.contentShareController.enableSimulcastForContentShare(enable, encodingParams);
  }

  enableSVCForContentShare(enable: boolean): void {
    this.trace('enableSVCForContentShare');
    this.contentShareController.enableSVCForContentShare(enable);
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

  setContentShareVideoCodecPreferences(preferences: VideoCodecCapability[]): void {
    this.contentShareController.setContentShareVideoCodecPreferences(preferences);
    this.trace('setContentShareVideoCodecPreferences');
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

  get transcriptionController(): TranscriptionController {
    return this.realtimeController.transcriptionController;
  }

  promoteToPrimaryMeeting(credentials: MeetingSessionCredentials): Promise<MeetingSessionStatus> {
    this.audioVideoController.removeObserver(this); // Avoid adding multiple times
    this.audioVideoController.addObserver(this); // See note in `audioVideoWasDemotedFromPrimaryMeeting`
    const result = this.audioVideoController.promoteToPrimaryMeeting(credentials);
    this.trace('promoteToPrimaryMeeting', null, result); // Don't trace credentials
    return result;
  }

  demoteFromPrimaryMeeting(): void {
    this.trace('demoteFromPrimaryMeeting');
    this.audioVideoController.demoteFromPrimaryMeeting();
  }

  audioVideoWasDemotedFromPrimaryMeeting(_: MeetingSessionStatus): void {
    // `DefaultContentShareController` currently does not respond to the connection ending
    // so `contentShareDidStop` will not be called even if backend cleans up the connection.
    // Thus we try to pre-emptively clean up on client side.
    this.contentShareController.stopContentShare();
    this.audioVideoController.removeObserver(this);
  }
}
