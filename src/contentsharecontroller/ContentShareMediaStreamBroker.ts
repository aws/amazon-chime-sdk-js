// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoController from '../audiovideocontroller/AudioVideoController';
import DefaultBrowserBehavior from '../browserbehavior/DefaultBrowserBehavior';
import DefaultDeviceController from '../devicecontroller/DefaultDeviceController';
import Logger from '../logger/Logger';
import MediaStreamBroker from '../mediastreambroker/MediaStreamBroker';

export default class ContentShareMediaStreamBroker implements MediaStreamBroker {
  private static defaultFrameRate = 15;
  private _mediaStream: MediaStream;

  constructor(private logger: Logger) {}

  get mediaStream(): MediaStream {
    return this._mediaStream;
  }

  set mediaStream(mediaStream: MediaStream) {
    this._mediaStream = mediaStream;
  }

  async acquireAudioInputStream(): Promise<MediaStream> {
    if (this._mediaStream.getAudioTracks().length === 0) {
      return DefaultDeviceController.synthesizeAudioDevice(0) as MediaStream;
    }
    return this._mediaStream;
  }

  async acquireVideoInputStream(): Promise<MediaStream> {
    return this._mediaStream;
  }

  releaseMediaStream(_mediaStreamToRelease: MediaStream): void {
    this.logger.warn('release media stream called');
    return;
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

  bindToAudioVideoController(_audioVideoController: AudioVideoController): void {
    throw new Error('unsupported');
  }

  async acquireScreenCaptureDisplayInputStream(
    sourceId?: string,
    frameRate?: number
  ): Promise<MediaStream> {
    return this.acquireDisplayInputStream(
      this.screenCaptureDisplayMediaConstraints(sourceId, frameRate)
    );
  }

  private screenCaptureDisplayMediaConstraints(
    sourceId?: string,
    frameRate?: number
  ): MediaStreamConstraints {
    return {
      audio:
        !sourceId && new DefaultBrowserBehavior().getDisplayMediaAudioCaptureSupport()
          ? true
          : false,
      video: {
        ...(!sourceId && {
          frameRate: {
            max: frameRate ? frameRate : ContentShareMediaStreamBroker.defaultFrameRate,
          },
        }),
        ...(sourceId && {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId,
            maxFrameRate: frameRate ? frameRate : ContentShareMediaStreamBroker.defaultFrameRate,
          },
        }),
      },
    };
  }

  toggleMediaStream(enable: boolean): boolean {
    let changed = false;
    if (this.mediaStream) {
      for (let i = 0; i < this.mediaStream.getTracks().length; i++) {
        if (this.mediaStream.getTracks()[i].enabled !== enable) {
          this.mediaStream.getTracks()[i].enabled = enable;
          changed = true;
        }
      }
    }
    return changed;
  }

  cleanup(): void {
    if (this.mediaStream) {
      for (let i = 0; i < this.mediaStream.getTracks().length; i++) {
        this.mediaStream.getTracks()[i].stop();
      }
    }
    this.mediaStream = null;
  }
}
