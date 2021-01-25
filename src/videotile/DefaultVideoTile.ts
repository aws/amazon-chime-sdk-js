// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DefaultBrowserBehavior from '../browserbehavior/DefaultBrowserBehavior';
import DevicePixelRatioMonitor from '../devicepixelratiomonitor/DevicePixelRatioMonitor';
import DevicePixelRatioObserver from '../devicepixelratioobserver/DevicePixelRatioObserver';
import DefaultModality from '../modality/DefaultModality';
import AsyncScheduler from '../scheduler/AsyncScheduler';
import VideoTileController from '../videotilecontroller/VideoTileController';
import VideoTile from './VideoTile';
import VideoTileState from './VideoTileState';

export default class DefaultVideoTile implements DevicePixelRatioObserver, VideoTile {
  private tileState: VideoTileState = new VideoTileState();

  static connectVideoStreamToVideoElement(
    videoStream: MediaStream,
    videoElement: HTMLVideoElement,
    localTile: boolean
  ): void {
    const transform =
      localTile && videoStream.getVideoTracks()[0].getSettings().facingMode !== 'environment'
        ? 'rotateY(180deg)'
        : '';

    DefaultVideoTile.setVideoElementFlag(videoElement, 'disablePictureInPicture', localTile);
    DefaultVideoTile.setVideoElementFlag(videoElement, 'disableRemotePlayback', localTile);

    if (videoElement.style.transform !== transform) {
      videoElement.style.transform = transform;
    }
    if (videoElement.hasAttribute('controls')) {
      videoElement.removeAttribute('controls');
    }
    if (!videoElement.hasAttribute('autoplay')) {
      videoElement.setAttribute('autoplay', 'true');
    }
    // playsinline is needed for video to play in iPhone in non-fullscreen mode.
    // See https://developer.apple.com/documentation/webkit/safari_tools_and_features/delivering_video_content_for_safari#3030250
    if (!videoElement.hasAttribute('playsinline')) {
      videoElement.setAttribute('playsinline', 'true');
    }

    // Note that setting the *attribute* 'muted' affects whether the element
    // is muted *by default* (`.defaultMuted`), not whether it is currently muted (`.muted`).
    // https://html.spec.whatwg.org/#dom-media-defaultmuted
    if (!videoElement.hasAttribute('muted')) {
      // The default value…
      videoElement.setAttribute('muted', 'true');

      // … and the value right now.
      videoElement.muted = true;
    }

    if (videoElement.srcObject !== videoStream) {
      videoElement.srcObject = videoStream;
    }

    if (new DefaultBrowserBehavior().requiresVideoElementWorkaround()) {
      new AsyncScheduler().start(async () => {
        try {
          await videoElement.play();
        } catch (error) {}
      });
    }
  }

  static disconnectVideoStreamFromVideoElement(
    videoElement: HTMLVideoElement | null,
    dueToPause: boolean
  ): void {
    if (!videoElement) {
      return;
    }

    if (dueToPause) {
      videoElement.srcObject = null;
      videoElement.style.transform = '';
    } else {
      if (!videoElement.srcObject) {
        return;
      }
      videoElement.pause();
      videoElement.style.transform = '';

      DefaultVideoTile.setVideoElementFlag(videoElement, 'disablePictureInPicture', false);
      DefaultVideoTile.setVideoElementFlag(videoElement, 'disableRemotePlayback', false);

      // We must remove all the tracks from the MediaStream before
      // clearing the `srcObject` to prevent Safari from crashing.
      const mediaStream = videoElement.srcObject as MediaStream;
      const tracks = mediaStream.getTracks();
      for (const track of tracks) {
        track.stop();
        mediaStream.removeTrack(track);
      }

      // Need to yield the message loop before clearing `srcObject` to
      // prevent Safari from crashing.
      if (new DefaultBrowserBehavior().requiresVideoElementWorkaround()) {
        new AsyncScheduler().start(() => {
          videoElement.srcObject = null;
        });
      } else {
        videoElement.srcObject = null;
      }
    }
  }

  constructor(
    tileId: number,
    localTile: boolean,
    private tileController: VideoTileController,
    private devicePixelRatioMonitor: DevicePixelRatioMonitor
  ) {
    this.tileState.tileId = tileId;
    this.tileState.localTile = localTile;
    this.devicePixelRatioMonitor.registerObserver(this);
  }

  destroy(): void {
    this.devicePixelRatioMonitor.removeObserver(this);
    if (
      this.tileState.boundVideoElement &&
      this.tileState.boundVideoElement.srcObject === this.tileState.boundVideoStream
    ) {
      DefaultVideoTile.disconnectVideoStreamFromVideoElement(
        this.tileState.boundVideoElement,
        false
      );
    }
    this.tileState = new VideoTileState();
  }

  devicePixelRatioChanged(newDevicePixelRatio: number): void {
    this.tileState.devicePixelRatio = newDevicePixelRatio;
    this.sendTileStateUpdate();
  }

  id(): number {
    return this.tileState.tileId;
  }

  state(): VideoTileState {
    return this.tileState.clone();
  }

  stateRef(): VideoTileState {
    return this.tileState;
  }

  bindVideoStream(
    attendeeId: string,
    localTile: boolean,
    mediaStream: MediaStream | null,
    contentWidth: number | null,
    contentHeight: number | null,
    streamId: number | null,
    externalUserId?: string
  ): void {
    let tileUpdated = false;
    if (this.tileState.boundAttendeeId !== attendeeId) {
      this.tileState.boundAttendeeId = attendeeId;
      if (new DefaultModality(attendeeId).hasModality(DefaultModality.MODALITY_CONTENT)) {
        this.tileState.isContent = true;
      }
      tileUpdated = true;
    }
    if (this.tileState.boundExternalUserId !== externalUserId) {
      this.tileState.boundExternalUserId = externalUserId;
      tileUpdated = true;
    }
    if (this.tileState.localTile !== localTile) {
      this.tileState.localTile = localTile;
      tileUpdated = true;
    }
    if (this.tileState.boundVideoStream !== mediaStream) {
      this.tileState.boundVideoStream = mediaStream;
      tileUpdated = true;
    }
    if (this.tileState.videoStreamContentWidth !== contentWidth) {
      this.tileState.videoStreamContentWidth = contentWidth;
      tileUpdated = true;
    }
    if (this.tileState.videoStreamContentHeight !== contentHeight) {
      this.tileState.videoStreamContentHeight = contentHeight;
      tileUpdated = true;
    }
    if (this.tileState.streamId !== streamId) {
      this.tileState.streamId = streamId;
      tileUpdated = true;
    }
    if (tileUpdated) {
      this.sendTileStateUpdate();
    }
  }

  bindVideoElement(videoElement: HTMLVideoElement | null): void {
    let tileUpdated = false;
    if (this.tileState.boundVideoElement !== videoElement) {
      this.tileState.boundVideoElement = videoElement;
      tileUpdated = true;
    }
    if (this.tileState.boundVideoElement !== null) {
      if (this.tileState.videoElementCSSWidthPixels !== videoElement.clientWidth) {
        this.tileState.videoElementCSSWidthPixels = videoElement.clientWidth;
        tileUpdated = true;
      }
      if (this.tileState.videoElementCSSHeightPixels !== videoElement.clientHeight) {
        this.tileState.videoElementCSSHeightPixels = videoElement.clientHeight;
        tileUpdated = true;
      }
    } else {
      this.tileState.videoElementCSSWidthPixels = null;
      this.tileState.videoElementCSSHeightPixels = null;
    }
    if (tileUpdated) {
      this.sendTileStateUpdate();
    }
  }

  pause(): void {
    if (!this.tileState.paused) {
      this.tileState.paused = true;
      this.sendTileStateUpdate();
    }
  }

  unpause(): void {
    if (this.tileState.paused) {
      this.tileState.paused = false;
      this.sendTileStateUpdate();
    }
  }

  markPoorConnection(): boolean {
    if (this.tileState.poorConnection) {
      return false;
    }
    this.tileState.poorConnection = true;
    this.sendTileStateUpdate();
    return true;
  }

  unmarkPoorConnection(): boolean {
    if (!this.tileState.poorConnection) {
      return false;
    }
    this.tileState.poorConnection = false;
    this.sendTileStateUpdate();
    return true;
  }

  capture(): ImageData | null {
    if (!this.tileState.active) {
      return null;
    }
    const canvas = document.createElement('canvas') as HTMLCanvasElement;
    const video = this.tileState.boundVideoElement;
    canvas.width = video.videoWidth || video.width;
    canvas.height = video.videoHeight || video.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  private sendTileStateUpdate(): void {
    this.updateActiveState();
    this.updateVideoStreamOnVideoElement();
    this.updateVideoElementPhysicalPixels();
    this.tileController.sendTileStateUpdate(this.state());
  }

  private updateActiveState(): void {
    this.tileState.active = !!(
      !this.tileState.paused &&
      !this.tileState.poorConnection &&
      this.tileState.boundAttendeeId &&
      this.tileState.boundVideoElement &&
      this.tileState.boundVideoStream
    );
  }

  private updateVideoElementPhysicalPixels(): void {
    if (
      typeof this.tileState.videoElementCSSWidthPixels === 'number' &&
      typeof this.tileState.videoElementCSSHeightPixels === 'number'
    ) {
      this.tileState.videoElementPhysicalWidthPixels =
        this.tileState.devicePixelRatio * this.tileState.videoElementCSSWidthPixels;
      this.tileState.videoElementPhysicalHeightPixels =
        this.tileState.devicePixelRatio * this.tileState.videoElementCSSHeightPixels;
    } else {
      this.tileState.videoElementPhysicalWidthPixels = null;
      this.tileState.videoElementPhysicalHeightPixels = null;
    }
  }

  private updateVideoStreamOnVideoElement(): void {
    if (this.tileState.active) {
      DefaultVideoTile.connectVideoStreamToVideoElement(
        this.tileState.boundVideoStream,
        this.tileState.boundVideoElement,
        this.tileState.localTile
      );
    } else {
      DefaultVideoTile.disconnectVideoStreamFromVideoElement(
        this.tileState.boundVideoElement,
        this.tileState.paused
      );
    }
  }

  private static setVideoElementFlag(
    videoElement: HTMLVideoElement,
    flag: string,
    value: boolean
  ): void {
    if (flag in videoElement) {
      // @ts-ignore
      videoElement[flag] = value;
    }
  }
}
