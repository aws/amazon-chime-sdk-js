// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import NoOpDeviceController from '../../src/devicecontroller/NoOpDeviceController';
import NoOpLogger from '../../src/logger/NoOpLogger';
import DefaultMeetingSession from '../../src/meetingsession/DefaultMeetingSession';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultMeetingSession', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  const SAFARI_USERAGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Safari/605.1.15';

  const setUserAgent = (userAgent: string): void => {
    // @ts-ignore
    navigator.userAgent = userAgent;
  };

  describe('constructor', () => {
    it('can be constructed', () => {
      const mockBuilder = new DOMMockBuilder();
      const session = new DefaultMeetingSession(
        new NoOpAudioVideoController().configuration,
        new NoOpLogger(),
        new NoOpDeviceController()
      );
      expect(session).to.exist;
      expect(session.audioVideo).to.exist;
      expect(session.configuration).to.exist;
      expect(session.logger).to.exist;
      expect(session.screenShare).to.exist;
      expect(session.screenShareView).to.exist;
      expect(session.deviceController).to.exist;
      mockBuilder.cleanup();
    });

    it('can be constructed with an unsupported browser', () => {
      const mockBuilder = new DOMMockBuilder();
      setUserAgent(SAFARI_USERAGENT);
      const session = new DefaultMeetingSession(
        new NoOpAudioVideoController().configuration,
        new NoOpLogger(),
        new NoOpDeviceController()
      );
      expect(session).to.exist;
      mockBuilder.cleanup();
    });
  });
});
