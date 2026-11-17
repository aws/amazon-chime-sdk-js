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

  /** Creates the meeting's peer connection. Without it, `new RTCPeerConnection(configuration)`. */
  createPeerConnection?(configuration: RTCConfiguration): RTCPeerConnection;

  /** Opens and lists devices. Without it, `navigator.mediaDevices`. */
  readonly mediaDevices?: Pick<MediaDevices, 'getUserMedia' | 'enumerateDevices'>;
}
