// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import DefaultSigV4 from '../../src/sigv4/DefaultSigV4';

describe('DefaultSigV4', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  const chimeClient = {
    config: {
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'accessKey',
        secretAccessKey: 'secretKey',
        sessionToken: 'sessionToken',
      },
    },
  };
  const awsClient = {
    util: {
      crypto: {
        hmac: function (_key: string, str: string, _digest: string) {
          return str;
        },
        sha256: function (data: string, _digest: string) {
          return data;
        },
      },
    },
  };

  it('can sign URL with session token', () => {
    const queryParams = new Map<string, string[]>();
    queryParams.set('userArn', ['userArn']);
    const signedURL = new DefaultSigV4(chimeClient, awsClient).signURL(
      'GET',
      'wss',
      'disperse',
      'localhost:9999',
      '/connect',
      '',
      queryParams
    );
    expect(signedURL.startsWith('wss://localhost:9999/connect')).to.be.true;
    expect(signedURL).to.contains('userArn');
    expect(signedURL).to.contains('X-Amz-Security-Token=sessionToken');
  });

  it('can sign URL without session token', () => {
    chimeClient.config.credentials.sessionToken = '';
    const signedURL = new DefaultSigV4(chimeClient, awsClient).signURL(
      'GET',
      'wss',
      'disperse',
      'localhost:9999',
      '/connect',
      '',
      null
    );
    expect(signedURL.startsWith('wss://localhost:9999/connect')).to.be.true;
    expect(signedURL).to.not.contains('X-Amz-Security-Token');
    chimeClient.config.credentials.sessionToken = 'sessionToken';
  });

  it('can sign URL with multiple query values', () => {
    const queryParams = new Map<string, string[]>();
    queryParams.set('userArn', ['userArn1', 'userArn2']);
    const signedURL = new DefaultSigV4(chimeClient, awsClient).signURL(
      'GET',
      'wss',
      'disperse',
      'localhost:9999',
      '/connect',
      '',
      queryParams
    );
    expect(signedURL.startsWith('wss://localhost:9999/connect')).to.be.true;
    expect(signedURL).to.contains('userArn1');
    expect(signedURL).to.contains('userArn2');
  });
});
