// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * A virtual desktop platform that runs media on the user's device instead of in
 * the browser. Supply one through `MeetingSessionConfiguration.vdiAdapter` and the
 * `vdiAdapter` option of `DefaultDeviceController`; without one the SDK uses the
 * browser. Every member but `name` is optional, and the SDK uses the browser for
 * what an adapter does not supply.
 */
export default interface VDIAdapter {
  /** Identifies the platform in logs, for example when the peer connection is created. */
  readonly name: string;

  /**
   * Creates the meeting's peer connection. Without it, `new RTCPeerConnection(configuration)`.
   * The SDK compares transceivers, senders and receivers with `===`, so the connection must return
   * the same object for the same transceiver, sender or receiver every time.
   */
  createPeerConnection?(configuration: RTCConfiguration): RTCPeerConnection;

  /** Opens and lists devices. Without it, `navigator.mediaDevices`. */
  readonly mediaDevices?: Pick<MediaDevices, 'getUserMedia' | 'enumerateDevices'>;

  /**
   * Called just before a video element's `srcObject` is set to a stream, for a
   * platform that renders the stream itself. The SDK calls it again for the same
   * element when the stream changes, and for browser streams too.
   */
  bindVideoElement?(element: HTMLVideoElement, stream: MediaStream): void;

  /**
   * Called after the SDK clears a video element's `srcObject` and stops using the
   * element. The SDK may call it for an element it never bound.
   */
  unbindVideoElement?(element: HTMLVideoElement): void;

  /**
   * Called just before an audio element's `srcObject` is set to a stream, for a
   * platform that plays the stream itself. The SDK calls it again for the same
   * element when the stream changes, and for browser streams too.
   */
  bindAudioElement?(element: HTMLAudioElement, stream: MediaStream): void;

  /**
   * Called after the SDK clears an audio element's `srcObject` and stops using the
   * element. The SDK may call it for an element it never bound.
   */
  unbindAudioElement?(element: HTMLAudioElement): void;
}
