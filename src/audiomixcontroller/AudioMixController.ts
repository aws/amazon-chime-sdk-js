// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioMixObserver from '../audiomixobserver/AudioMixObserver';
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

  /**
   * Returns the meeting audio stream currently bound to a HTMLAudioElement, or `null` if
   * there is no current audio stream. This method will typically never reject.
   */
  getCurrentMeetingAudioStream(): Promise<MediaStream | null>;

  /**
   * Add an observer to listen for changes to the current meeting audio stream. The observer
   * will be notified when a stream is bound or unbound from an audio element in the page.
   */
  addAudioMixObserver(observer: AudioMixObserver): void;

  /**
   * Remove an observer to stop listening for changes to the current meeting audio stream.
   */
  removeAudioMixObserver(observer: AudioMixObserver): void;
}
