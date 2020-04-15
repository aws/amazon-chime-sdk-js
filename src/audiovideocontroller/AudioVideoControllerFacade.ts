// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoObserver from '../audiovideoobserver/AudioVideoObserver';

export default interface AudioVideoControllerFacade {
  addObserver(observer: AudioVideoObserver): void;
  removeObserver(observer: AudioVideoObserver): void;
  start(): void;
  stop(): void;

  /**
   * Returns the RTCPeerConnection for this audio-video controller if there is
   * one.
   */
  readonly rtcPeerConnection: RTCPeerConnection | null;
}
