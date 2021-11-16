// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import AudioMixObserver from '../audiomixobserver/AudioMixObserver';

export default interface AudioMixControllerFacade {
  bindAudioElement(element: HTMLAudioElement): Promise<void>;
  unbindAudioElement(): void;
  getCurrentMeetingAudioStream(): Promise<MediaStream | null>;
  addAudioMixObserver(observer: AudioMixObserver): void;
  removeAudioMixObserver(observer: AudioMixObserver): void;
}
