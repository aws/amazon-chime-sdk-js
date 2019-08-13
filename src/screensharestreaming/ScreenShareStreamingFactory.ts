// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import MediaRecording from '../mediarecording/MediaRecording';
import ScreenShareStreaming from './ScreenShareStreaming';

export default interface ScreenShareStreamingFactory {
  create(mediaRecorder: MediaRecording): ScreenShareStreaming;
}
