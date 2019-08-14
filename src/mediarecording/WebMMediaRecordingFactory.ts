// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import MediaRecording from './MediaRecording';
import MediaRecordingFactory from './MediaRecordingFactory';
import MediaRecordingOptions from './MediaRecordingOptions';
import WebMMediaRecording from './WebMMediaRecording';

export default class WebMMediaRecordingFactory implements MediaRecordingFactory {
  constructor(private mediaRecordingOptions: MediaRecordingOptions = {}) {}

  create(mediaStream: MediaStream): MediaRecording {
    return new WebMMediaRecording(mediaStream, this.mediaRecordingOptions);
  }
}
