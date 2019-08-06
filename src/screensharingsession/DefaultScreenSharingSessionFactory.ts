// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import MediaRecordingFactory from '../mediarecording/MediaRecordingFactory';
import MediaStreamBroker from '../mediastreambroker/MediaStreamBroker';
import PromisedWebSocketFactory from '../promisedwebsocket/PromisedWebSocketFactory';
import ScreenShareStreamingFactory from '../screensharestreaming/ScreenShareStreamingFactory';
import ScreenSharingMessageSerialization from '../screensharingmessageserialization/ScreenSharingMessageSerialization';
import DefaultScreenSharingSession from './DefaultScreenSharingSession';
import ScreenSharingSession from './ScreenSharingSession';
import ScreenSharingSessionFactory from './ScreenSharingSessionFactory';

export default class DefaultScreenSharingSessionFactory implements ScreenSharingSessionFactory {
  private static SessionKey = '_aws_wt_session';
  private static BinaryType: BinaryType = 'arraybuffer';
  constructor(
    private mediaConstraintsProvider: () => MediaStreamConstraints,
    private webSocketFactory: PromisedWebSocketFactory,
    private messageSerialization: ScreenSharingMessageSerialization,
    private mediaStreamBroker: MediaStreamBroker,
    private screenShareStreamFactory: ScreenShareStreamingFactory,
    private mediaRecordingFactory: MediaRecordingFactory,
    private logger: Logger,
    private timeSliceMs: number = 100
  ) {}

  create(url: string, sessionToken: string): ScreenSharingSession {
    const protocols = [DefaultScreenSharingSessionFactory.SessionKey, sessionToken];
    const webSocket = this.webSocketFactory.create(
      url,
      protocols,
      DefaultScreenSharingSessionFactory.BinaryType
    );
    return new DefaultScreenSharingSession(
      webSocket,
      this.mediaConstraintsProvider,
      this.timeSliceMs,
      this.messageSerialization,
      this.mediaStreamBroker,
      this.screenShareStreamFactory,
      this.mediaRecordingFactory,
      this.logger
    );
  }
}
