// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import ScreenViewingSessionConnectionRequest from '../../../src/screenviewing/session/ScreenViewingSessionConnectionRequest';

describe('ScreenViewingSessionConnectionRequest', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  const screenViewingURL = 'screen-viewing-url';
  const screenDataURL = 'screen-data-url';
  const sessionToken = 'session-token';
  const timeoutMs = 5000;
  describe('url', () => {
    it('returns the url', () => {
      const connectionRequest: ScreenViewingSessionConnectionRequest = new ScreenViewingSessionConnectionRequest(
        screenViewingURL,
        screenDataURL,
        sessionToken,
        timeoutMs
      );
      expect(connectionRequest.screenViewingURL).to.eql(
        'screen-viewing-url&session_token=session-token'
      );
    });

    it('returns the same url if session token is already provided', () => {
      const connectionRequest: ScreenViewingSessionConnectionRequest = new ScreenViewingSessionConnectionRequest(
        screenViewingURL + '&session_token=session-token',
        screenDataURL,
        sessionToken,
        timeoutMs
      );
      expect(connectionRequest.screenViewingURL).to.eql(
        'screen-viewing-url&session_token=session-token'
      );
    });
  });

  describe('protocols', () => {
    it('returns the empty list', () => {
      const connectionRequest: ScreenViewingSessionConnectionRequest = new ScreenViewingSessionConnectionRequest(
        screenViewingURL,
        screenDataURL,
        sessionToken,
        timeoutMs
      );
      expect(connectionRequest.protocols()).to.eql([]);
    });
  });

  describe('getTimeoutMs', () => {
    it('returns the timeout', () => {
      const connectionRequest: ScreenViewingSessionConnectionRequest = new ScreenViewingSessionConnectionRequest(
        screenViewingURL,
        screenDataURL,
        sessionToken,
        timeoutMs
      );
      expect(connectionRequest.timeoutMs).to.eql(timeoutMs);
    });
  });
});
