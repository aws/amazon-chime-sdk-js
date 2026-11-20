// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VDIAdapter from '../../src/vdi/VDIAdapter';

/** Records the elements the SDK binds and unbinds. */
export default class MockVDIAdapter implements VDIAdapter {
  readonly name = 'MockVDIAdapter';
  boundVideoElements: [HTMLVideoElement, MediaStream][] = [];
  unboundVideoElements: HTMLVideoElement[] = [];
  boundAudioElements: [HTMLAudioElement, MediaStream][] = [];
  unboundAudioElements: HTMLAudioElement[] = [];

  /** The element's `srcObject` as seen at bind time, to assert call order. */
  srcObjectAtBindTime: unknown[] = [];

  bindVideoElement(element: HTMLVideoElement, stream: MediaStream): void {
    this.srcObjectAtBindTime.push(element.srcObject);
    this.boundVideoElements.push([element, stream]);
  }

  unbindVideoElement(element: HTMLVideoElement): void {
    this.unboundVideoElements.push(element);
  }

  bindAudioElement(element: HTMLAudioElement, stream: MediaStream): void {
    this.boundAudioElements.push([element, stream]);
  }

  unbindAudioElement(element: HTMLAudioElement): void {
    this.unboundAudioElements.push(element);
  }
}
