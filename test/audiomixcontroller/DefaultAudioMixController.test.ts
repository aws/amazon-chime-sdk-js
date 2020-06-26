// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import DefaultAudioMixController from '../../src/audiomixcontroller/DefaultAudioMixController';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultAudioMixController', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  let domMockBuilder: DOMMockBuilder;
  let behavior: DOMMockBehavior;
  let defaultAudioMixController: DefaultAudioMixController;
  let element: HTMLAudioElement;
  let device: MediaDeviceInfo;
  let stream: MediaStream;

  beforeEach(() => {
    behavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(behavior);
    defaultAudioMixController = new DefaultAudioMixController();
    element = new HTMLAudioElement();
    device = new MediaDeviceInfo();
    // @ts-ignore
    device.deviceId = 'device-id';
    stream = new MediaStream();
  });

  afterEach(() => {
    domMockBuilder.cleanup();
  });

  it('can be constructed', () => {
    expect(defaultAudioMixController).to.not.equal(null);
  });

  it('can bind an audio element, but not yet sink', () => {
    expect(defaultAudioMixController.bindAudioElement(element)).to.equal(true);
  });

  it('can fail to bind an audio element when element does not exist', () => {
    expect(defaultAudioMixController.bindAudioElement(null)).to.equal(false);
  });

  it('can unbind an audio element when element does not exist', () => {
    defaultAudioMixController.bindAudioDevice(device);
    defaultAudioMixController.bindAudioStream(stream);
    defaultAudioMixController.unbindAudioElement();
    expect(defaultAudioMixController.bindAudioElement(element)).to.equal(true);
    defaultAudioMixController.unbindAudioElement();
    expect(defaultAudioMixController.bindAudioStream(stream)).to.equal(false);
  });

  it('can successfully bind and sink an audio element', () => {
    defaultAudioMixController.bindAudioDevice(device);
    defaultAudioMixController.bindAudioStream(stream);
    expect(defaultAudioMixController.bindAudioElement(element)).to.equal(true);
  });

  it('can bind an audio stream, but not yet sink', () => {
    expect(defaultAudioMixController.bindAudioStream(stream)).to.equal(false);
  });

  it('can fail to bind an audio stream when stream does not exist', () => {
    expect(defaultAudioMixController.bindAudioStream(null)).to.equal(false);
  });

  it('can successfully bind and sink an audio stream', () => {
    defaultAudioMixController.bindAudioDevice(device);
    defaultAudioMixController.bindAudioElement(element);
    expect(defaultAudioMixController.bindAudioStream(stream)).to.equal(true);
  });

  it('can successfully bind and sink an audio stream in chromium based browser', () => {
    behavior.browserName = 'chrome';
    domMockBuilder = new DOMMockBuilder(behavior);
    defaultAudioMixController = new DefaultAudioMixController();
    defaultAudioMixController.bindAudioDevice(device);
    defaultAudioMixController.bindAudioElement(element);
    expect(defaultAudioMixController.bindAudioStream(stream)).to.equal(true);
  });

  it('can bind an audio device, but not yet sink', () => {
    expect(defaultAudioMixController.bindAudioDevice(device)).to.equal(false);
  });

  it('can fail to bind an audio device when device does not exist', () => {
    expect(defaultAudioMixController.bindAudioDevice(null)).to.equal(false);
  });

  it('can successfully bind and sink an audio device', () => {
    defaultAudioMixController.bindAudioStream(stream);
    defaultAudioMixController.bindAudioElement(element);
    expect(defaultAudioMixController.bindAudioDevice(device)).to.equal(true);
  });

  it('can fail to bind an audio element when sinkId does not exist', () => {
    // @ts-ignore
    element.setSinkId(undefined);
    expect(defaultAudioMixController.bindAudioElement(element)).to.equal(false);
  });
});
