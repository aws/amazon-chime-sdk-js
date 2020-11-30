// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type { VoiceFocusDelegate } from '../../libs/voicefocus/types';
import VoiceFocusTransformDevice from './VoiceFocusTransformDevice';
import VoiceFocusTransformDeviceObserver from './VoiceFocusTransformDeviceObserver';

/** @internal */
export default class VoiceFocusTransformDeviceDelegate implements VoiceFocusDelegate {
  private observers: Set<VoiceFocusTransformDeviceObserver> = new Set();

  addObserver(observer: VoiceFocusTransformDeviceObserver): void {
    this.observers.add(observer);
  }

  removeObserver(observer: VoiceFocusTransformDeviceObserver): void {
    this.observers.delete(observer);
  }

  /** @internal */
  onFallback(device: VoiceFocusTransformDevice, e: Error): void {
    for (const observer of this.observers) {
      observer.voiceFocusFellBackToInnerStream?.call(observer, device, e);
    }
  }

  onCPUWarning(): void {
    for (const observer of this.observers) {
      observer.voiceFocusInsufficientResources?.call(observer);
    }
  }
}
