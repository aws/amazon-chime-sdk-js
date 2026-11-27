// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type CitrixRTCPeerConnection from './CitrixRTCPeerConnection';

/**
 * @internal
 * The browser `RTCRtpTransceiver` API over a UCSDK transceiver.
 */
export default class CitrixRTCRtpTransceiver implements RTCRtpTransceiver {
  constructor(
    public readonly inner: RTCRtpTransceiver,
    private readonly peer: CitrixRTCPeerConnection
  ) {}

  get mid(): string | null {
    return this.inner.mid;
  }

  get sender(): RTCRtpSender {
    return this.peer.wrapSender(this.inner.sender);
  }

  get receiver(): RTCRtpReceiver {
    return this.peer.wrapReceiver(this.inner.receiver);
  }

  get direction(): RTCRtpTransceiverDirection {
    return this.inner.direction;
  }

  set direction(direction: RTCRtpTransceiverDirection) {
    this.inner.direction = direction;
  }

  get currentDirection(): RTCRtpTransceiverDirection | null {
    return this.inner.currentDirection;
  }

  setCodecPreferences(codecs: RTCRtpCodec[]): void {
    this.inner.setCodecPreferences(codecs);
  }

  stop(): void {
    this.inner.stop();
  }

  // The header extension methods are not in this lib.dom. The SDK feature-detects them, so their
  // absence keeps Citrix on the SDP path.
}
