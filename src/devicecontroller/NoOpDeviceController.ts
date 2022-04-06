// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DeviceChangeObserver from '../devicechangeobserver/DeviceChangeObserver';
import EventController from '../eventcontroller/EventController';
import DeviceControllerBasedMediaStreamBroker from '../mediastreambroker/DeviceControllerBasedMediaStreamBroker';
import NoOpMediaStreamBroker from '../mediastreambroker/NoOpMediaStreamBroker';
import AudioInputDevice from './AudioInputDevice';
import RemovableAnalyserNode from './RemovableAnalyserNode';
import VideoInputDevice from './VideoInputDevice';
import VideoQualitySettings from './VideoQualitySettings';

export default class NoOpDeviceController
  extends NoOpMediaStreamBroker
  implements DeviceControllerBasedMediaStreamBroker {
  destroyed = false;

  constructor(_options?: { enableWebAudio?: boolean }) {
    super();
  }

  async destroy(): Promise<void> {
    this.destroyed = true;
  }

  listAudioInputDevices(): Promise<MediaDeviceInfo[]> {
    return Promise.resolve([]);
  }

  listVideoInputDevices(): Promise<MediaDeviceInfo[]> {
    return Promise.resolve([]);
  }

  listAudioOutputDevices(): Promise<MediaDeviceInfo[]> {
    return Promise.resolve([]);
  }

  startAudioInput(_device: AudioInputDevice): Promise<MediaStream | undefined> {
    return Promise.reject();
  }

  stopAudioInput(): Promise<void> {
    return Promise.resolve();
  }

  startVideoInput(_device: VideoInputDevice): Promise<MediaStream | undefined> {
    return Promise.reject();
  }

  stopVideoInput(): Promise<void> {
    return Promise.resolve();
  }

  chooseAudioOutput(_deviceId: string | null): Promise<void> {
    return Promise.reject();
  }

  addDeviceChangeObserver(_observer: DeviceChangeObserver): void {}

  removeDeviceChangeObserver(_observer: DeviceChangeObserver): void {}

  createAnalyserNodeForAudioInput(): RemovableAnalyserNode | null {
    return null;
  }

  startVideoPreviewForVideoInput(_element: HTMLVideoElement): void {}

  stopVideoPreviewForVideoInput(_element: HTMLVideoElement): void {}

  setDeviceLabelTrigger(_trigger: () => Promise<MediaStream>): void {}

  mixIntoAudioInput(_stream: MediaStream): MediaStreamAudioSourceNode {
    return null;
  }

  chooseVideoInputQuality(_width: number, _height: number, _frameRate: number): void {}

  getVideoInputQualitySettings(): VideoQualitySettings | null {
    return null;
  }
}

export class NoOpDeviceControllerWithEventController extends NoOpDeviceController {
  eventController: EventController | undefined;
  constructor(eventController?: EventController) {
    super();
    this.eventController = eventController;
  }
}
