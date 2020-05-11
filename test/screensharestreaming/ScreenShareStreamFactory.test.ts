// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Substitute } from '@fluffy-spoon/substitute';
import * as chai from 'chai';

import MediaRecording from '../../src/mediarecording/MediaRecording';
import ScreenShareStreamFactory from '../../src/screensharestreaming/ScreenShareStreamFactory';

describe('ScreenShareStreamFactory', () => {
  const subject = new ScreenShareStreamFactory();

  describe('#create', () => {
    it('exists', () => {
      chai.expect(subject.create(Substitute.for<MediaRecording>())).to.exist;
    });
  });
});
