// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoController from '../audiovideocontroller/AudioVideoController';

/**
 * Media controllers acquire media streams from the [[MediaStreamBroker]], which
 * fulfills the requests either through direct getUserMedia requests or a
 * higher-level intermediary such as a [[DeviceController]]. When a media
 * controller no longer needs a media stream it calls [[releaseMediaStream]].
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
   * Called when a media stream is no longer being used and can be cleaned up
   * or cached for later used.
   */
  releaseMediaStream(mediaStreamToRelease: MediaStream): void;

  /**
   * Binds the media stream broker to the audio video controller. This is called
   * automatically by the meeting session constructor.
   */
  bindToAudioVideoController(audioVideoController: AudioVideoController): void;
}
