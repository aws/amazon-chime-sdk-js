// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import DeviceChangeObserver from '../../src/devicechangeobserver/DeviceChangeObserver';
import NoOpDeviceController from '../../src/devicecontroller/NoOpDeviceController';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';
import { MockPassthroughTransformDevice } from '../transformdevicemock/MockTransformDevice';

describe('NoOpDeviceController', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const assert: Chai.AssertStatic = chai.assert;
  let deviceController: NoOpDeviceController;
  let domMockBuilder: DOMMockBuilder;
  let behavior: DOMMockBehavior;

  beforeEach(() => {
    behavior = new DOMMockBehavior();
    behavior.deviceCounter = 0;
    domMockBuilder = new DOMMockBuilder(behavior);
    deviceController = new NoOpDeviceController();
  });

  afterEach(() => {
    domMockBuilder.cleanup();
  });

  describe('constructor', () => {
    it('can be constructed', () => {
      expect(deviceController).to.exist;
    });
  });

  describe('listAudioInputDevices', () => {
    it('returns empty list', async () => {
      const devices = await deviceController.listAudioInputDevices();
      expect(devices.length).to.equal(0);
    });
  });

  describe('listAudioOutputDevices', () => {
    it('returns empty list', async () => {
      const devices = await deviceController.listAudioOutputDevices();
      expect(devices.length).to.equal(0);
    });
  });

  describe('listVideoInputDevices', () => {
    it('returns empty list', async () => {
      const devices = await deviceController.listVideoInputDevices();
      expect(devices.length).to.equal(0);
    });
  });

  describe('startAudioInput', () => {
    it('fails for intrinsic devices', async () => {
      await deviceController
        .startAudioInput('')
        .then(() => {
          assert.fail();
        })
        .catch(() => {});
    });

    it('fails for transform devices', async () => {
      await deviceController
        .startAudioInput(new MockPassthroughTransformDevice(''))
        .then(() => {
          assert.fail();
        })
        .catch(() => {});
    });
  });

  describe('stopAudioInput', () => {
    it('can be called', () => {
      deviceController.stopAudioInput();
    });
  });

  describe('startVideoInput', () => {
    it('fails', async () => {
      await deviceController
        .startVideoInput('')
        .then(() => {
          assert.fail();
        })
        .catch(() => {});
    });
  });

  describe('stopVideoInput', () => {
    it('can be called', () => {
      deviceController.stopVideoInput();
    });
  });

  describe('chooseAudioOutputDevice', () => {
    it('fails', async () => {
      await deviceController
        .chooseAudioOutput('')
        .then(() => {
          assert.fail();
        })
        .catch(() => {});
    });
  });

  describe('addObserver', () => {
    it('can be called', () => {
      class MockDeviceChangeObserver implements DeviceChangeObserver {
        audioInputsChanged(): void {}
        audioOutputsChanged(): void {}
        videoInputsChanged(): void {}
        displayInputsChanged(): void {}
      }
      deviceController.addDeviceChangeObserver(new MockDeviceChangeObserver());
    });
  });

  describe('removeObserver', () => {
    it('can be called', () => {
      class MockDeviceChangeObserver implements DeviceChangeObserver {
        audioInputsChanged(): void {}
        audioOutputsChanged(): void {}
        videoInputsChanged(): void {}
        displayInputsChanged(): void {}
      }
      const observer = new MockDeviceChangeObserver();
      deviceController.addDeviceChangeObserver(observer);
      deviceController.removeDeviceChangeObserver(observer);
    });
  });
});
