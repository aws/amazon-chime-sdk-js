// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import SignalingClientConnectionRequest from '../../src/signalingclient/SignalingClientConnectionRequest';

describe('SignalingClientConnectionRequest', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const fullSignalingURL = 'signalingurl/control/conferenceid?X-Chime-Control-Protocol-Version=3';
  describe('url', () => {
    it('use the url as given if it is already fully constructed', () => {
      const request = new SignalingClientConnectionRequest(
        'signalingurl/control/conferenceid',
        'sessiontoken'
      );
      expect(request.url()).to.equal(fullSignalingURL);
    });
  });
});
