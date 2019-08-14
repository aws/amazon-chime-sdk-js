// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import MediaRecording from './MediaRecording';

export default interface MediaRecordingFactory {
  /**
   * MediaRecording factory method
   * @param {MediaRecorder} mediaRecorder
   * @returns {MediaRecording}
   */
  create(mediaStream: MediaStream): MediaRecording;
}
