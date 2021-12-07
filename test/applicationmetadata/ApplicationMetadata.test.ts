// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import ApplicationMetadata from '../../src/applicationmetadata/ApplicationMetadata';

describe('ApplicationMetadata', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  it('creates when a valid application name and version is provided', () => {
    const applicationMetadata = ApplicationMetadata.create('AmazonChimeSDKJSDemoApp', '1.0.0');
    expect(applicationMetadata.appName).to.eq('AmazonChimeSDKJSDemoApp');
    expect(applicationMetadata.appVersion).to.eq('1.0.0');
  });

  it('throws error when an invalid application name but a valid version is provided', () => {
    let success = false;
    try {
      ApplicationMetadata.create('*AmazonChimeSDKJSDemoApp/', '1.0.0');
      success = true;
    } catch (err) {}
    expect(success).to.be.false;
  });

  it('throws error when a valid application name but an invalid version is provided', () => {
    let success = false;
    try {
      ApplicationMetadata.create('AmazonChimeSDKJSDemoApp', '1.0.0-alpha..1');
      success = true;
    } catch (err) {
      expect(err.message).to.eq('appVersion must satisfy Semantic Versioning format');
    }
    expect(success).to.be.false;
  });

  it('throws error when an application version is greater than required length of 32 characters', () => {
    let success = false;
    try {
      ApplicationMetadata.create(
        'AmazonChimeSDKJSDemoApp',
        '5000000000.99999999999999999999999999.66666666'
      );
      success = true;
    } catch (err) {
      expect(err.message).to.eq(
        'appVersion should be a valid string and 1 to 32 characters in length'
      );
    }
    expect(success).to.be.false;
  });

  it('throws error when an application name is greater than required length of 32 characters', () => {
    let success = false;
    try {
      ApplicationMetadata.create(
        'AmazonChimeSDKJSDemoAppAmazonChimeSDKJSDemoAppAmazonChimeSDKJSDemoAppAmazonChimeSDKJSDemoApp',
        '5000000000.99999999999999999999999999.66666666'
      );
      success = true;
    } catch (err) {
      expect(err.message).to.eq(
        'appName should be a valid string and 1 to 32 characters in length'
      );
    }
    expect(success).to.be.false;
  });

  it('throws error when an application name is empty', () => {
    let success = false;
    try {
      ApplicationMetadata.create('', '1.0.0');
      success = true;
    } catch (err) {
      expect(err.message).to.eq(
        'appName should be a valid string and 1 to 32 characters in length'
      );
    }
    expect(success).to.be.false;
  });

  it('throws error when an application version is empty', () => {
    let success = false;
    try {
      ApplicationMetadata.create('AmazonChimeSDKJSDemo', '');
      success = true;
    } catch (err) {
      expect(err.message).to.eq(
        'appVersion should be a valid string and 1 to 32 characters in length'
      );
    }
    expect(success).to.be.false;
  });
});
