// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import ScreenShareStreamingContainer from '../../src/screensharestreaming/ScreenShareStreamingContainer';

describe('ScreenShareStreamingContainer', () => {
  const subject = new ScreenShareStreamingContainer();

  describe('@#screenShareStreamingFactory', () => {
    it('exists', () => {
      chai.expect(subject.screenShareStreamingFactory()).to.exist;
    });
  });
});
