// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Substitute } from '@fluffy-spoon/substitute';
import * as chai from 'chai';

import MediaRecordingOptions from '../../src/mediarecording/MediaRecordingOptions';
import WebMMediaRecordingFactory from '../../src/mediarecording/WebMMediaRecordingFactory';
import DOMMediaRecorderMock from '../dommediarecordermock/DOMMediaRecorderMock';

describe('WebMMediaRecordingFactory', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const GlobalAny = global as any;

  before(() => {
    GlobalAny.MediaRecorder = DOMMediaRecorderMock;
  });

  after(() => {
    GlobalAny.MediaRecorder = undefined;
  });

  describe('#create', () => {
    it('is created', () => {
      const subject = new WebMMediaRecordingFactory();
      chai.expect(subject.create(Substitute.for<MediaStream>())).to.exist;
    });
  });

  describe('with MediaRecordingOptions', () => {
    it('is constructed', () => {
      const options: MediaRecordingOptions = {};
      const subject = new WebMMediaRecordingFactory(options);
      chai.expect(subject.create(Substitute.for<MediaStream>())).to.exist;
    });
  });
});
