// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import NoOpLogger from '../../src/logger/NoOpLogger';
import DefaultVideoStreamIdSet from '../../src/videostreamidset/DefaultVideoStreamIdSet';
import DefaultVideoStreamIndex from '../../src/videostreamindex/DefaultVideoStreamIndex';
import DefaultVideoSubscribeContext from '../../src/videosubscribecontext/DefaultVideoSubscribeContext';

describe('DefaultVideoSubscribeContext', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpLogger();

  describe('constructor', () => {
    it('can be constructed', () => {
      const videoSubscribeContext = new DefaultVideoSubscribeContext();
      expect(videoSubscribeContext).to.not.equal(null);
    });
  });

  describe('videoSubscriptions', () => {
    it('returns correct array for video subscriptions', () => {
      const videoSubscribeContext = new DefaultVideoSubscribeContext();
      expect(videoSubscribeContext.videoSubscriptions()).to.deep.equal([]);

      videoSubscribeContext.updateVideoSubscriptions([1, 2, 3]);
      expect(videoSubscribeContext.videoSubscriptions()).to.deep.equal([1, 2, 3]);
    });
  });

  describe('videoStreamIndex', () => {
    it('returns correct video stream index', () => {
      const videoSubscribeContext = new DefaultVideoSubscribeContext();
      expect(videoSubscribeContext.videoStreamIndex()).to.equal(null);

      const videoStreamIndex = new DefaultVideoStreamIndex(logger);
      videoSubscribeContext.updateVideoStreamIndex(videoStreamIndex);
      expect(videoSubscribeContext.videoStreamIndexRef()).to.equal(videoStreamIndex);
    });
  });

  describe('videosToReceive', () => {
    it('returns correct VideoStreamIdSet for videos to receive', () => {
      const videoSubscribeContext = new DefaultVideoSubscribeContext();
      expect(videoSubscribeContext.videosToReceive().equal(new DefaultVideoStreamIdSet())).to.equal(
        true
      );

      const ids = new DefaultVideoStreamIdSet([1, 2, , 3]);
      videoSubscribeContext.updateVideosToReceive(ids);
      expect(videoSubscribeContext.videosToReceive().equal(ids)).to.equal(true);
    });
  });

  describe('videosPausedSet', () => {
    it('returns correct VideoStreamIdSet for paused videos', () => {
      const videoSubscribeContext = new DefaultVideoSubscribeContext();
      expect(videoSubscribeContext.videosPausedSet().equal(new DefaultVideoStreamIdSet())).to.equal(
        true
      );
      const ids = new DefaultVideoStreamIdSet([1, 2, , 3]);
      videoSubscribeContext.updateVideoPausedSet(ids);
      expect(videoSubscribeContext.videosPausedSet().equal(ids)).to.equal(true);
    });
  });
});
