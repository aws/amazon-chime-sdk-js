// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import MediaRecording from '../mediarecording/MediaRecording';
import ScreenShareStream from './ScreenShareStream';
import ScreenShareStreaming from './ScreenShareStreaming';
import ScreenShareStreamingFactory from './ScreenShareStreamingFactory';

export default class ScreenShareStreamFactory implements ScreenShareStreamingFactory {
  create(mediaRecording: MediaRecording): ScreenShareStreaming {
    return new ScreenShareStream(mediaRecording);
  }
}
