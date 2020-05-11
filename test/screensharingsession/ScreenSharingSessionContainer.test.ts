// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Arg, Substitute } from '@fluffy-spoon/substitute';
import * as chai from 'chai';

import Logger from '../../src/logger/Logger';
import MediaStreamBroker from '../../src/mediastreambroker/MediaStreamBroker';
import DefaultScreenSharingSessionFactory from '../../src/screensharingsession/DefaultScreenSharingSessionFactory';
import ScreenSharingSessionContainer from '../../src/screensharingsession/ScreenSharingSessionContainer';
import ScreenSharingSessionOptions from '../../src/screensharingsession/ScreenSharingSessionOptions';

describe('ScreenSharingSessionContainer', () => {
  const logger = Substitute.for<Logger>();
  const mediaStreamBroker = Substitute.for<MediaStreamBroker>();
  mediaStreamBroker.acquireDisplayInputStream(Arg.any()).returns(Promise.resolve(Substitute.for()));

  describe('#screenSharingSessionFactory', () => {
    const subject = new ScreenSharingSessionContainer(mediaStreamBroker, logger);

    it('is ScreenSharingSessionFactory', () => {
      chai
        .expect(subject.screenSharingSessionFactory())
        .to.be.instanceOf(DefaultScreenSharingSessionFactory);
    });
  });

  describe('with MediaRecordingOptions', () => {
    const options: ScreenSharingSessionOptions = { bitRate: 384000 };
    const subject = new ScreenSharingSessionContainer(mediaStreamBroker, logger, options);

    it('is ScreenSharingSessionFactory', () => {
      chai
        .expect(subject.screenSharingSessionFactory())
        .to.be.instanceOf(DefaultScreenSharingSessionFactory);
    });
  });

  describe('with MediaRecordingOptions and sourceId', () => {
    const options: ScreenSharingSessionOptions = { bitRate: 384000 };
    const subject = new ScreenSharingSessionContainer(mediaStreamBroker, logger, options);

    it('is ScreenSharingSessionFactory', () => {
      chai.expect(subject.displayMediaConstraints('source-id')).to.exist;
    });
  });

  describe('with MediaRecordingOptions and without sourceId', () => {
    const options: ScreenSharingSessionOptions = { bitRate: 384000 };
    const subject = new ScreenSharingSessionContainer(mediaStreamBroker, logger, options);

    it('is ScreenSharingSessionFactory', () => {
      chai.expect(subject.displayMediaConstraints()).to.exist;
    });
  });
});
