// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import MediaStreamBrokerObserver from '../mediastreambrokerobserver/MediaStreamBrokerObserver';
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

  muteLocalAudioInputStream(): void {}

  unmuteLocalAudioInputStream(): void {}

  addMediaStreamBrokerObserver(_observer: MediaStreamBrokerObserver): void {}

  removeMediaStreamBrokerObserver(_observer: MediaStreamBrokerObserver): void {}
}
