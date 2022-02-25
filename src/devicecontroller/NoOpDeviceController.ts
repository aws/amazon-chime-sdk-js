// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Destroyable from '../destroyable/Destroyable';
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
  constructor(_options?: { enableWebAudio?: boolean }) {
    super();
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

  stopAudioInput(): void {
    return;
  }

  startVideoInput(_device: VideoInputDevice): Promise<MediaStream | undefined> {
    return Promise.reject();
  }

  stopVideoInput(): void {
    return;
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

export class DestroyableNoOpDeviceController extends NoOpDeviceController implements Destroyable {
  destroyed = false;
  async destroy(): Promise<void> {
    this.destroyed = true;
  }
}
