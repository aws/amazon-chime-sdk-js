// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect } from 'chai';
import { stub } from 'sinon';

import VoiceFocusTransformDevice from '../../src/voicefocus/VoiceFocusTransformDevice';
import VoiceFocusTransformDeviceDelegate from '../../src/voicefocus/VoiceFocusTransformDeviceDelegate';
import VoiceFocusTransformDeviceObserver from '../../src/voicefocus/VoiceFocusTransformDeviceObserver';

class MockObserver implements VoiceFocusTransformDeviceObserver {
  voiceFocusInsufficientResources = stub();
  voiceFocusFellBackToInnerStream = stub();
}

class EmptyObserver implements VoiceFocusTransformDeviceObserver {}

describe('VoiceFocusTransformDeviceDelegate', () => {
  it('can be instantiated', () => {
    new VoiceFocusTransformDeviceDelegate();
  });

  it('is OK if the observer does not define a handler', () => {
    const delegate = new VoiceFocusTransformDeviceDelegate();
    const observer = new EmptyObserver();
    delegate.addObserver(observer);

    delegate.onCPUWarning();
    delegate.onFallback({} as VoiceFocusTransformDevice, new Error('oh no'));
  });

  it('calls CPU warning if defined', () => {
    const delegate = new VoiceFocusTransformDeviceDelegate();
    const observer = new MockObserver();
    delegate.addObserver(observer);

    delegate.onCPUWarning();
    delegate.onCPUWarning();
    expect(observer.voiceFocusInsufficientResources.calledTwice).to.be.true;

    const device = {} as VoiceFocusTransformDevice;
    const error = new Error('oh no');
    delegate.onFallback(device, error);
    expect(observer.voiceFocusFellBackToInnerStream.calledOnceWith(device, error)).to.be.true;
  });
});
