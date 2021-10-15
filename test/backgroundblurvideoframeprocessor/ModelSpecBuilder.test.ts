// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import { expect } from 'chai';

import ModelSpecBuilder from '../../src/backgroundblurvideoframeprocessor/ModelSpecBuilder';
import ModelSpec from '../../src/modelspec/ModelSpec';

function expectDefaultInput(spec: ModelSpec): void {
  expect(spec.input).to.be.deep.equal({
    channels: 3,
    height: 144,
    width: 256,
    range: [0, 1],
  });
}

function expectDefaultOutput(spec: ModelSpec): void {
  expect(spec.output).to.be.deep.equal({
    channels: 1,
    height: 144,
    width: 256,
    range: [0, 1],
  });
}

function expectDefaultPath(spec: ModelSpec): void {
  expect(spec.path).to.be.equal(
    'https://static.sdkassets.chime.aws/bgblur/models/selfie_segmentation_landscape.tflite'
  );
}

describe('ModelSpecBuilder', () => {
  let expect: Chai.ExpectStatic;

  before(() => {
    expect = chai.expect;
  });

  it('build default spec', () => {
    const spec = ModelSpecBuilder.builder().withSelfieSegmentationDefaults().build();
    expectDefaultPath(spec);
    expectDefaultInput(spec);
    expectDefaultOutput(spec);
  });

  it('build spec with overridden path', () => {
    const spec = ModelSpecBuilder.builder()
      .withSelfieSegmentationDefaults()
      .withPath('some other path')
      .build();
    expect(spec.path).to.be.equal('some other path');
    expectDefaultInput(spec);
    expectDefaultOutput(spec);
  });

  it('build spec with overridden input', () => {
    const expectedInput = {
      width: 1,
      height: 2,
      range: [4, 6],
      channels: 3,
    };
    const spec = ModelSpecBuilder.builder()
      .withSelfieSegmentationDefaults()
      .withInput(expectedInput)
      .build();
    expectDefaultPath(spec);
    expectDefaultOutput(spec);
    expect(spec.input).to.deep.equal(expectedInput);
  });

  it('build spec with overridden input', () => {
    const expectedOutput = {
      width: 1,
      height: 2,
      range: [4, 6],
      channels: 3,
    };
    const spec = ModelSpecBuilder.builder()
      .withSelfieSegmentationDefaults()
      .withOutput(expectedOutput)
      .build();
    expectDefaultPath(spec);
    expectDefaultInput(spec);
    expect(spec.output).to.deep.equal(expectedOutput);
  });

  it('default model is selfie', () => {
    const defaultSpec = ModelSpecBuilder.builder().withDefaultModel().build();

    const selfieSpec = ModelSpecBuilder.builder().withDefaultModel().build();

    expect(defaultSpec).to.deep.equal(selfieSpec);
  });

  it('invalid spec', () => {
    expect(() => ModelSpecBuilder.builder().build()).to.throw('model spec path is not set');

    expect(() => ModelSpecBuilder.builder().withPath('some path').build()).to.throw(
      'model spec input is not set'
    );

    expect(() =>
      ModelSpecBuilder.builder()
        .withPath('some path')
        .withInput({
          height: 1,
          width: 1,
          range: [1, 2],
          channels: 2,
        })
        .build()
    ).to.throw('model spec output is not set');
  });
});
