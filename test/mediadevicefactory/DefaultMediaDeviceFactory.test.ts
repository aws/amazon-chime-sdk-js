// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import DefaultMediaDeviceFactory from '../../src/mediadevicefactory/DefaultMediaDeviceFactory';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultMediaDeviceFactory', () => {
  const expect = chai.expect;

  let mediaDeviceFactory: DefaultMediaDeviceFactory;
  let domMockBuilder: DOMMockBuilder;
  let domMockBehavior: DOMMockBehavior;

  afterEach(() => {
    if (domMockBuilder) {
      domMockBuilder.cleanup();
    }
  });

  describe('create', () => {
    it('can create', async () => {
      domMockBehavior = new DOMMockBehavior();
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      mediaDeviceFactory = new DefaultMediaDeviceFactory();

      expect(mediaDeviceFactory.create()).to.exist;
    });

    it('throws an error if navigator.mediaDevices does not exist', async () => {
      domMockBehavior = new DOMMockBehavior();
      domMockBehavior.mediaDevicesSupported = false;
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      mediaDeviceFactory = new DefaultMediaDeviceFactory();

      try {
        mediaDeviceFactory.create();
        throw new Error('This line should not be reached.');
      } catch (error) {}
    });
  });
});
