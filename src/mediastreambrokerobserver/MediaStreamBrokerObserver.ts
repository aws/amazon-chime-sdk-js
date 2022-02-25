// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[MediaStreamBrokerObserver]] can be registered with a [[MediaStreamBroker]] to receive callbacks on media stream
 * change events.
 */
export default interface MediaStreamBrokerObserver {
  /**
   * Called when video input stream are changed.
   * @param videoStream: The new video input media stream
   */
  selectedVideoInputDidChanged?(videoStream: MediaStream | undefined): void;

  /**
   * Called when audio input stream are changed.
   * @param audioStream The new audio input media stream
   */
  selectedAudioInputDidChanged?(audioStream: MediaStream | undefined): void;

  /**
   * Called when audio output are changed
   * @param device The new audio output device
   */
  selectedAudioOutputDidChanged?(device: MediaDeviceInfo | null): void;
}
