// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoController from '../audiovideocontroller/AudioVideoController';
import MediaStreamBroker from './MediaStreamBroker';

/**
 * [[NoOpDeviceBroker]] rejects requests to acquire a [[MediaStream]].
 */
export default class NoOpMediaStreamBroker implements MediaStreamBroker {
  acquireAudioInputStream(): Promise<MediaStream> {
    return Promise.reject();
  }

  acquireVideoInputStream(): Promise<MediaStream> {
    return Promise.reject();
  }

  acquireDisplayInputStream(_streamConstraints: MediaStreamConstraints): Promise<MediaStream> {
    return Promise.reject();
  }

  releaseMediaStream(_mediaStreamToRelease: MediaStream): void {}

  bindToAudioVideoController(_audioVideoController: AudioVideoController): void {}
}
