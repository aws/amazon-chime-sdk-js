// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import MediaStreamBrokerObserver from '../mediastreambrokerobserver/MediaStreamBrokerObserver';

/**
 * Media controllers acquire media streams from the [[MediaStreamBroker]], which
 * fulfills the requests either through direct getUserMedia requests or a
 * higher-level intermediary such as a [[DeviceController]].
 */
export default interface MediaStreamBroker {
  /**
   * Called when the session needs to attach an audio input to the peer
   * connection.
   */
  acquireAudioInputStream(): Promise<MediaStream>;

  /**
   * Called when the session needs to attach a video input to the peer
   * connection.
   */
  acquireVideoInputStream(): Promise<MediaStream>;

  /**
   * Called when the session needs to acquire a display input device for screen sharing.
   */
  acquireDisplayInputStream(streamConstraints: MediaStreamConstraints): Promise<MediaStream>;

  /**
   * Mute the current active local audio input stream.
   */
  muteLocalAudioInputStream(): void;

  /**
   * Unmute the current active local audio input
   */
  unmuteLocalAudioInputStream(): void;

  /**
   * Add a media stream broker observer to receive events when input/output streams change
   * @param observer The observer to be added
   */
  addMediaStreamBrokerObserver(observer: MediaStreamBrokerObserver): void;

  /**
   * Remove a media stream broker observer to stop receiving events when input/output streams change
   * @param observer The observer to be removed
   */
  removeMediaStreamBrokerObserver(observer: MediaStreamBrokerObserver): void;
}
