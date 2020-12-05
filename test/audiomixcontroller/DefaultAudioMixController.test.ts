// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import { DefaultBrowserBehavior } from '../../src';
import DefaultAudioMixController from '../../src/audiomixcontroller/DefaultAudioMixController';
import NoOpLogger from '../../src/logger/NoOpLogger';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultAudioMixController', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpLogger();
  let domMockBuilder: DOMMockBuilder;
  let behavior: DOMMockBehavior;
  let defaultAudioMixController: DefaultAudioMixController;
  let element: HTMLAudioElement;
  let device: MediaDeviceInfo;
  let stream: MediaStream;

  beforeEach(() => {
    behavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(behavior);
    defaultAudioMixController = new DefaultAudioMixController(logger);
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

  it('can bind an audio element, but not yet sink', async () => {
    // expect(await defaultAudioMixController.bindAudioElement(element)).to.equal(true);
    element.autoplay = false;
    try {
      await defaultAudioMixController.bindAudioElement(element);
    } catch (e) {
      throw new Error('This line should not be reached.');
    }
    expect(element.autoplay).to.equal(true);
  });

  it('can fail to bind an audio element when element does not exist', async () => {
    try {
      await defaultAudioMixController.bindAudioElement(null);
      throw new Error('This line should not be reached.');
    } catch (e) {
      expect(e.message).include('Cannot bind audio element');
    }
  });

  it('can unbind an audio element when element does not exist', async () => {
    await defaultAudioMixController.bindAudioDevice(device);
    await defaultAudioMixController.bindAudioStream(stream);
    defaultAudioMixController.unbindAudioElement();
    try {
      await defaultAudioMixController.bindAudioElement(element);
    } catch (e) {
      throw new Error('This line should not be reached.');
    }
    defaultAudioMixController.unbindAudioElement();
    try {
      await defaultAudioMixController.bindAudioStream(stream);
    } catch (e) {
      expect(e.messaage).to.include('bla');
    }
  });

  it('can successfully bind and sink an audio element', async () => {
    //@ts-ignore
    await element.setSinkId('anything');
    //@ts-ignore
    expect(element.sinkId).to.equal('anything');
    await defaultAudioMixController.bindAudioDevice(device);
    await defaultAudioMixController.bindAudioStream(stream);
    element.autoplay = false;
    try {
      await defaultAudioMixController.bindAudioElement(element);
    } catch (e) {
      throw new Error('This line should not be reached.');
    }
    expect(element.autoplay).to.equal(true);
    // @ts-ignore
    expect(element.sinkId).to.equal('device-id');
  });

  it('Does not throw error on failure to bindAudioStream. Just logs error. (with logger)', async () => {
    behavior.setSinkIdSupported = false;
    domMockBuilder = new DOMMockBuilder(behavior);
    defaultAudioMixController = new DefaultAudioMixController(logger);
    await defaultAudioMixController.bindAudioElement(element);
    //@ts-ignore
    await element.setSinkId(undefined);
    try {
      await defaultAudioMixController.bindAudioStream(stream);
    } catch (e) {
      throw new Error('This line should not be reached.');
    }

    defaultAudioMixController = new DefaultAudioMixController(logger);
    try {
      await defaultAudioMixController.bindAudioStream(stream);
    } catch (e) {
      throw new Error('This line should not be reached.');
    }

    defaultAudioMixController = new DefaultAudioMixController();
    //@ts-ignore
    await element.setSinkId('sink-id');
    await defaultAudioMixController.bindAudioElement(element);
    //@ts-ignore
    await element.setSinkId(undefined);
    try {
      await defaultAudioMixController.bindAudioStream(stream);
    } catch (e) {
      throw new Error('This line should not be reached.');
    }
  });

  it('does nothing when trying to bind an audio stream and the stream does not exist', async () => {
    try {
      await defaultAudioMixController.bindAudioStream(null);
    } catch (e) {
      throw new Error('This line should not be reached.');
    }
  });

  it('can successfully bind and sink an audio stream', async () => {
    try {
      await defaultAudioMixController.bindAudioDevice(device);
      await defaultAudioMixController.bindAudioElement(element);
      await defaultAudioMixController.bindAudioStream(stream);
    } catch (e) {
      throw new Error('This line should not be reached.');
    }
  });

  it('throws an error if browser does not support setSinkId', async () => {
    behavior.setSinkIdSupported = false;
    domMockBuilder = new DOMMockBuilder(behavior);

    expect(new DefaultBrowserBehavior().supportsSetSinkId()).to.be.false;

    defaultAudioMixController = new DefaultAudioMixController(logger);

    // First we need an element to bind to.
    await defaultAudioMixController.bindAudioElement(element);
    try {
      await defaultAudioMixController.bindAudioDevice(device);
      throw new Error('This line should not be reached.');
    } catch (e) {
      expect(e.message).include(
        'Cannot select audio output device. This browser does not support setSinkId.'
      );
    }
  });

  it('can successfully bind and sink an audio stream in Chromium based browser', async () => {
    behavior.browserName = 'chrome';
    domMockBuilder = new DOMMockBuilder(behavior);
    defaultAudioMixController = new DefaultAudioMixController(logger);
    try {
      await defaultAudioMixController.bindAudioDevice(device);
      await defaultAudioMixController.bindAudioElement(element);
      await defaultAudioMixController.bindAudioStream(stream);
    } catch (e) {
      throw new Error('This line should not be reached.');
    }
    expect(element.srcObject).to.equal(stream);
  });

  it('can bind an audio device, but not yet sink', async () => {
    // @ts-ignore
    await element.setSinkId('random-id');
    await defaultAudioMixController.bindAudioElement(element);
    await defaultAudioMixController.bindAudioDevice(device);
    // @ts-ignore
    expect(element.sinkId).to.equal('device-id');

    // @ts-ignore
    await element.setSinkId('random-id');
    behavior.setSinkIdSucceeds = false;
    domMockBuilder = new DOMMockBuilder(behavior);
    defaultAudioMixController = new DefaultAudioMixController(logger);
    try {
      await defaultAudioMixController.bindAudioDevice(device);
    } catch (e) {
      throw new Error('This line should not be reached.');
    }
    // @ts-ignore
    expect(element.sinkId).to.not.equal('device-id');
    // @ts-ignore
    expect(element.sinkId).to.equal('random-id');
  });

  it('does nothing if we try to bind an audio device when device does not exist', async () => {
    try {
      await defaultAudioMixController.bindAudioDevice(null);
    } catch (e) {
      throw new Error('This line should not be reached.');
    }
  });

  it('can successfully bind and sink an audio device', async () => {
    try {
      await defaultAudioMixController.bindAudioStream(stream);
      await defaultAudioMixController.bindAudioElement(element);
      await defaultAudioMixController.bindAudioDevice(device);
    } catch (e) {
      throw new Error('This line should not be reached.');
    }
  });

  it('can successfully set audio element and unbind element', async () => {
    behavior.browserName = 'chrome';
    domMockBuilder = new DOMMockBuilder(behavior);
    defaultAudioMixController = new DefaultAudioMixController(logger);
    await defaultAudioMixController.bindAudioElement(element);
    defaultAudioMixController.unbindAudioElement();
    expect(element.srcObject).to.equal(null);
  });

  it('can switch between audio elements and streams', async () => {
    behavior.browserName = 'chrome';
    domMockBuilder = new DOMMockBuilder(behavior);
    defaultAudioMixController = new DefaultAudioMixController(logger);
    const element2 = new HTMLAudioElement();
    const stream2 = new MediaStream();
    await defaultAudioMixController.bindAudioElement(element);
    await defaultAudioMixController.bindAudioStream(stream);
    await defaultAudioMixController.bindAudioElement(element2);
    await defaultAudioMixController.bindAudioStream(stream2);
    expect(element.srcObject).to.equal(stream);
    expect(element2.srcObject).to.equal(stream2);
  });

  it('can bind and unbind between various audio elements and streams', async () => {
    behavior.browserName = 'chrome';
    domMockBuilder = new DOMMockBuilder(behavior);
    defaultAudioMixController = new DefaultAudioMixController(logger);
    const element2 = new HTMLAudioElement();
    const stream2 = new MediaStream();
    await defaultAudioMixController.bindAudioElement(element);
    await defaultAudioMixController.bindAudioStream(stream);
    defaultAudioMixController.unbindAudioElement();
    await defaultAudioMixController.bindAudioElement(element2);
    await defaultAudioMixController.bindAudioStream(stream2);
    expect(element.srcObject).to.equal(null);
    expect(element2.srcObject).to.equal(stream2);
  });

  it('can execute calls to the 3 bind methods consecutively in Chromium based browser', async () => {
    behavior.browserName = 'chrome';
    domMockBuilder = new DOMMockBuilder(behavior);
    defaultAudioMixController = new DefaultAudioMixController(logger);
    await defaultAudioMixController.bindAudioDevice(device);
    await defaultAudioMixController.bindAudioElement(element);
    await defaultAudioMixController.bindAudioStream(stream);
    expect(element.srcObject).to.equal(stream);
  });

  it('can execute 3 bind and unbind methods consecutively in Chromium based browser', async () => {
    behavior.browserName = 'chrome';
    domMockBuilder = new DOMMockBuilder(behavior);
    defaultAudioMixController = new DefaultAudioMixController(logger);
    await defaultAudioMixController.bindAudioDevice(device);
    await defaultAudioMixController.bindAudioElement(element);
    await defaultAudioMixController.bindAudioStream(stream);
    defaultAudioMixController.unbindAudioElement();
    expect(element.srcObject).to.equal(null);
  });

  it('can bind an audio element when sinkId does not exist but we do not try to set one', async () => {
    // @ts-ignore
    await element.setSinkId(undefined);
    await defaultAudioMixController.bindAudioElement(element);
  });

  it('can fail to bind an audio element when sinkId does not exist but our device has an ID', async () => {
    // @ts-ignore
    await element.setSinkId(undefined);
    await defaultAudioMixController.bindAudioDevice(device);
    try {
      await defaultAudioMixController.bindAudioElement(element);
      throw new Error('This line should not be reached.');
    } catch (e) {
      expect(e.message).to.include(
        'Cannot select audio output device. This browser does not support setSinkId.'
      );
    }
  });

  it('throws an error when setSinkId call errors out existingAudioElement', async () => {
    behavior.setSinkIdSucceeds = false;
    behavior.browserName = 'chrome';
    domMockBuilder = new DOMMockBuilder(behavior);
    defaultAudioMixController = new DefaultAudioMixController(logger);
    try {
      await defaultAudioMixController.bindAudioElement(element);
      throw new Error('This line should not be reached.');
    } catch (e) {
      expect(e.message).to.include('Failed to set sinkId');
    }

    defaultAudioMixController = new DefaultAudioMixController();
    try {
      await defaultAudioMixController.bindAudioElement(element);
      throw new Error('This line should not be reached.');
    } catch (e) {
      expect(e.message).to.include('Failed to set sinkId');
    }
  });

  it('throws an error when setSinkId call errors out for current audioElement', async () => {
    behavior.setSinkIdSucceeds = false;
    behavior.browserName = 'firefox';
    domMockBuilder = new DOMMockBuilder(behavior);
    defaultAudioMixController = new DefaultAudioMixController(logger);
    try {
      await defaultAudioMixController.bindAudioElement(element);
      throw new Error('This line should not be reached.');
    } catch (e) {
      expect(e.message).to.include('Failed to set sinkId');
    }

    defaultAudioMixController = new DefaultAudioMixController();
    try {
      await defaultAudioMixController.bindAudioElement(element);
      throw new Error('This line should not be reached.');
    } catch (e) {
      expect(e.message).to.include('Failed to set sinkId');
    }
  });
});
