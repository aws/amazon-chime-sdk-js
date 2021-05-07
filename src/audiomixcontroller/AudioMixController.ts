// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioMixControllerFacade from './AudioMixControllerFacade';

/**
 * An instance of [[AudioMixController]] is provided when constructing a
 * [[MeetingClient]] to allow for binding audio output.
 */
export default interface AudioMixController extends AudioMixControllerFacade {
  /**
   * Called when the audio mix element can be bound to a device and stream.
   */
  bindAudioElement(element: HTMLAudioElement): Promise<void>;

  /**
   * Called to unbind the audio element so that the audio output stream does not have a sink.
   */
  unbindAudioElement(): void;

  /**
   * Called when the audio mix stream can be bound to a device and element.
   *
   * This method rejects if you specify a device and the browser does not support `setSinkId`;
   * use {@link BrowserBehavior.supportsSetSinkId} to check before calling this method.
   */
  bindAudioStream(stream: MediaStream): Promise<void>;

  /**
   * Called when the audio mix device can be bound to an element and stream.
   *
   * This method rejects if you specify a device and the browser does not support `setSinkId`;
   * use {@link BrowserBehavior.supportsSetSinkId} to check before calling this method.
   */
  bindAudioDevice(device: MediaDeviceInfo | null): Promise<void>;
}
