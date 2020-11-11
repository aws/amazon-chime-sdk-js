// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import MeetingSessionURLs from '../../src/meetingsession/MeetingSessionURLs';

describe('MeetingSessionURLs', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  describe('constructor', () => {
    it('can be constructed', () => {
      const urls = new MeetingSessionURLs();
      expect(urls.audioHostURL).to.be.null;
      expect(urls.screenDataURL).to.be.null;
      expect(urls.screenSharingURL).to.be.null;
      expect(urls.screenViewingURL).to.be.null;
      expect(urls.signalingURL).to.be.null;
      expect(urls.turnControlURL).to.be.null;
      expect(urls.urlRewriter(null)).to.be.null;
      expect(urls.urlRewriter('foobar')).to.eq('foobar');
    });

    it('can use a custom URL rewriter', () => {
      const urls = new MeetingSessionURLs();
      urls.audioHostURL = 'audio-host-url';
      urls.screenDataURL = 'screen-data-url';
      urls.screenSharingURL = 'screen-sharing-url';
      urls.screenViewingURL = 'screen-viewing-url';
      urls.signalingURL = 'signaling-url';
      urls.turnControlURL = 'turn-control-url';
      urls.urlRewriter = (url: string | null) => {
        return url !== null ? url.replace('url', 'rewritten-url') : null;
      };
      expect(urls.urlRewriter(null)).to.be.null;
      expect(urls.urlRewriter('url')).to.eq('rewritten-url');
      expect(urls.audioHostURL).to.eq('audio-host-rewritten-url');
      expect(urls.screenDataURL).to.eq('screen-data-rewritten-url');
      expect(urls.screenSharingURL).to.eq('screen-sharing-rewritten-url');
      expect(urls.screenViewingURL).to.eq('screen-viewing-rewritten-url');
      expect(urls.signalingURL).to.eq('signaling-rewritten-url');
      expect(urls.turnControlURL).to.eq('turn-control-rewritten-url');
    });
  });
});
