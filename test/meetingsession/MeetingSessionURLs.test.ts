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
      expect(urls.signalingURL).to.be.null;
      expect(urls.turnControlURL).to.be.null;
      expect(urls.eventIngestionURL).to.be.null;
      expect(urls.urlRewriter(null)).to.be.null;
      expect(urls.urlRewriter('foobar')).to.eq('foobar');
    });

    it('can use a custom URL rewriter', () => {
      const urls = new MeetingSessionURLs();
      urls.audioHostURL = 'audio-host-url';
      urls.signalingURL = 'signaling-url';
      urls.turnControlURL = 'turn-control-url';
      urls.eventIngestionURL = 'event-ingestion-url';
      urls.urlRewriter = (url: string | null) => {
        return url !== null ? url.replace('url', 'rewritten-url') : null;
      };
      expect(urls.urlRewriter(null)).to.be.null;
      expect(urls.urlRewriter('url')).to.eq('rewritten-url');
      expect(urls.audioHostURL).to.eq('audio-host-rewritten-url');
      expect(urls.signalingURL).to.eq('signaling-rewritten-url');
      expect(urls.turnControlURL).to.eq('turn-control-rewritten-url');
      expect(urls.eventIngestionURL).to.eq('event-ingestion-rewritten-url');
    });

    it('has urlRewriterMulti as null by default', () => {
      const urls = new MeetingSessionURLs();
      expect(urls.urlRewriterMulti).to.be.null;
    });

    it('can use a custom urlRewriterMulti to expand URLs', () => {
      const urls = new MeetingSessionURLs();
      urls.urlRewriterMulti = (url: string | null) => {
        if (url === null) {
          return null;
        }
        return [`${url}-1`, `${url}-2`];
      };
      expect(urls.urlRewriterMulti(null)).to.be.null;
      expect(urls.urlRewriterMulti('turn:server')).to.deep.equal([
        'turn:server-1',
        'turn:server-2',
      ]);
    });

    it('can use urlRewriterMulti to filter out URLs by returning null', () => {
      const urls = new MeetingSessionURLs();
      urls.urlRewriterMulti = (url: string | null) => {
        if (url === null || url.includes('blocked')) {
          return null;
        }
        return [url];
      };
      expect(urls.urlRewriterMulti('turn:allowed')).to.deep.equal(['turn:allowed']);
      expect(urls.urlRewriterMulti('turn:blocked')).to.be.null;
    });
  });
});
