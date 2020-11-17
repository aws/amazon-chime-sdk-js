// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioMixControllerFacade from './AudioMixControllerFacade';

/**
 * An instance of [[AudioMixController]] is provided when constructing a
 * [[MeetingClient]] to allow for binding audio output.
 */
export default interface AudioMixController extends AudioMixControllerFacade {
  /**
   * Called when the audio mix element can be bound to a device and stream. Returns true on success.
   */
  bindAudioElement(element: HTMLAudioElement): Promise<void>;

  /**
   * Called to unbind the audio element so that the audio output stream does not have a sink.
   */
  unbindAudioElement(): void;

  /**
   * Called when the audio mix stream can be bound to a device and element. Returns true on success.
   */
  bindAudioStream(stream: MediaStream): Promise<void>;

  /**
   * Called when the audio mix device can be bound to an element and stream. Returns true on success.
   */
  bindAudioDevice(device: MediaDeviceInfo | null): Promise<void>;
}
