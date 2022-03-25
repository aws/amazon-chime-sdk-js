// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[MediaStreamBrokerObserver]] can be registered with a [[MediaStreamBroker]] to receive callbacks on media stream
 * change events.
 */
export default interface MediaStreamBrokerObserver {
  /**
   * Called when the video input stream is changed.
   * @param videoStream: The new video input media stream
   */
  videoInputDidChange?(videoStream: MediaStream | undefined): void;

  /**
   * Called when the audio input stream is changed.
   * @param audioStream The new audio input media stream
   */
  audioInputDidChange?(audioStream: MediaStream | undefined): void;

  /**
   * Called when the audio output is changed
   * @param device The new audio output device
   */
  audioOutputDidChange?(device: MediaDeviceInfo | null): void;
}
