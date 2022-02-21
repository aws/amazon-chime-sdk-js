// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import DefaultSigV4 from '../../src/sigv4/DefaultSigV4';

describe('DefaultSigV4', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  const chimeClientV2 = {
    config: {
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'accessKey',
        secretAccessKey: 'secretKey',
        sessionToken: 'sessionToken',
      },
    },
  };

  const chimeClientV3 = {
    config: {
      region: () => {
        return 'us-east-1';
      },
      credentials: () => {
        return {
          accessKeyId: 'accessKey',
          secretAccessKey: 'secretKey',
          sessionToken: 'sessionToken',
        };
      },
    },
  };

  it('can sign URL with session token', async () => {
    const queryParams = new Map<string, string[]>();
    queryParams.set('userArn', ['userArn']);
    const signedURL = await new DefaultSigV4(chimeClientV2).signURL(
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

  it('can sign URL with session token with V3 Client', async () => {
    const queryParams = new Map<string, string[]>();
    queryParams.set('userArn', ['userArn']);
    const signedURL = await new DefaultSigV4(chimeClientV3).signURL(
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

  it('can sign URL without session token', async () => {
    chimeClientV2.config.credentials.sessionToken = '';
    const signedURL = await new DefaultSigV4(chimeClientV2).signURL(
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
    chimeClientV2.config.credentials.sessionToken = 'sessionToken';
  });

  it('can sign URL with multiple query values', async () => {
    const queryParams = new Map<string, string[]>();
    queryParams.set('userArn', ['userArn1', 'userArn2']);
    const signedURL = await new DefaultSigV4(chimeClientV2).signURL(
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
