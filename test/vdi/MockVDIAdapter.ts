// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VDIAdapter from '../../src/vdi/VDIAdapter';

/** Records each call with the element's `srcObject` at the time of the call. */
export default class MockVDIAdapter implements VDIAdapter {
  readonly name = 'MockVDIAdapter';
  calls: [string, HTMLMediaElement, MediaStream | null, MediaStream | null][] = [];

  bindVideoElement(element: HTMLVideoElement, stream: MediaStream): void {
    this.record('bindVideoElement', element, stream);
  }

  unbindVideoElement(element: HTMLVideoElement): void {
    this.record('unbindVideoElement', element, null);
  }

  bindAudioElement(element: HTMLAudioElement, stream: MediaStream): void {
    this.record('bindAudioElement', element, stream);
  }

  unbindAudioElement(element: HTMLAudioElement): void {
    this.record('unbindAudioElement', element, null);
  }

  callsOf(method: string): [HTMLMediaElement, MediaStream | null, MediaStream | null][] {
    return this.calls.filter(call => call[0] === method).map(call => [call[1], call[2], call[3]]);
  }

  private record(method: string, element: HTMLMediaElement, stream: MediaStream | null): void {
    this.calls.push([method, element, stream, element.srcObject as MediaStream | null]);
  }
}
