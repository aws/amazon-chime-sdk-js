// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import NoOpVideoElementFactory from '../../src/videoelementfactory/NoOpVideoElementFactory';

describe('NoOpVideoElementFactory', () => {
  const assert: Chai.AssertStatic = chai.assert;
  const expect: Chai.ExpectStatic = chai.expect;
  let videoElementFactory: NoOpVideoElementFactory;
  let element: HTMLVideoElement;

  beforeEach(() => {
    videoElementFactory = new NoOpVideoElementFactory();
    element = videoElementFactory.create();
  });

  describe('create', () => {
    it('creates a video element', () => {
      assert.exists(videoElementFactory);
      assert.exists(element);
    });

    it('has element properties', () => {
      assert.exists(element.clientWidth);
      assert.exists(element.clientHeight);
      assert.exists(element.width);
      assert.exists(element.height);
      assert.exists(element.style.transform);
    });

    it('has media element properties', () => {
      assert.exists(element.videoWidth);
      assert.exists(element.videoHeight);
      assert.exists(element.srcObject);
    });

    it('cannot set or remove attribute', () => {
      element.setAttribute('name', 'value');
      expect(element.hasAttribute('name')).to.not.equal(true);

      element.removeAttribute('name');
      expect(element.hasAttribute('name')).to.equal(false);
    });
  });
});
