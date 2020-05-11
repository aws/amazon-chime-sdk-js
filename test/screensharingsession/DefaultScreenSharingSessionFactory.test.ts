// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Substitute } from '@fluffy-spoon/substitute';
import * as chai from 'chai';

import Logger from '../../src/logger/Logger';
import MediaRecordingFactory from '../../src/mediarecording/MediaRecordingFactory';
import MediaStreamBroker from '../../src/mediastreambroker/MediaStreamBroker';
import PromisedWebSocketFactory from '../../src/promisedwebsocket/PromisedWebSocketFactory';
import ScreenShareStreamingFactory from '../../src/screensharestreaming/ScreenShareStreamingFactory';
import ScreenSharingMessageSerialization from '../../src/screensharingmessageserialization/ScreenSharingMessageSerialization';
import DefaultScreenSharingSession from '../../src/screensharingsession/DefaultScreenSharingSession';
import DefaultScreenSharingSessionFactory from '../../src/screensharingsession/DefaultScreenSharingSessionFactory';

describe('DefaultScreenSharingSessionFactory', () => {
  const webSocketFactory = Substitute.for<PromisedWebSocketFactory>();
  const messageSerialization = Substitute.for<ScreenSharingMessageSerialization>();
  const mediaStreamBroker = Substitute.for<MediaStreamBroker>();
  const screenShareStreamingFactory = Substitute.for<ScreenShareStreamingFactory>();
  const mediaRecordingFactory = Substitute.for<MediaRecordingFactory>();
  const mediaStreamConstraints = (): MediaStreamConstraints => ({});

  const logging = Substitute.for<Logger>();

  describe('#create', () => {
    describe('without timeout', () => {
      it('is created', () => {
        const subject = new DefaultScreenSharingSessionFactory(
          mediaStreamConstraints,
          webSocketFactory,
          messageSerialization,
          mediaStreamBroker,
          screenShareStreamingFactory,
          mediaRecordingFactory,
          logging
        );
        chai
          .expect(subject.create('ws://foo', 'token'))
          .to.be.instanceOf(DefaultScreenSharingSession);
      });
    });

    describe('with timeout', () => {
      it('is created', () => {
        const timeSliceMs = 300;
        const subject = new DefaultScreenSharingSessionFactory(
          mediaStreamConstraints,
          webSocketFactory,
          messageSerialization,
          mediaStreamBroker,
          screenShareStreamingFactory,
          mediaRecordingFactory,
          logging,
          timeSliceMs
        );
        chai
          .expect(subject.create('ws://foo', 'token'))
          .to.be.instanceOf(DefaultScreenSharingSession);
      });
    });
  });
});
