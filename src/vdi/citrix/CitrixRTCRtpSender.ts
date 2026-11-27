// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * @internal
 * The browser `RTCRtpSender` API over a UCSDK sender.
 */
export default class CitrixRTCRtpSender implements RTCRtpSender {
  constructor(public readonly inner: RTCRtpSender) {}

  replaceTrack(track: MediaStreamTrack | null): Promise<void> {
    return this.inner.replaceTrack(track);
  }

  get dtmf(): RTCDTMFSender | null {
    return this.inner.dtmf;
  }

  get track(): MediaStreamTrack | null {
    return this.inner.track;
  }

  get transform(): RTCRtpTransform | null {
    return this.inner.transform;
  }

  set transform(transform: RTCRtpTransform | null) {
    this.inner.transform = transform;
  }

  get transport(): RTCDtlsTransport | null {
    return this.inner.transport;
  }

  getParameters(): RTCRtpSendParameters {
    return this.inner.getParameters();
  }

  getStats(): Promise<RTCStatsReport> {
    return this.inner.getStats();
  }

  setParameters(parameters: RTCRtpSendParameters, options?: RTCSetParameterOptions): Promise<void> {
    return this.inner.setParameters(parameters, options);
  }

  setStreams(...streams: MediaStream[]): void {
    this.inner.setStreams(...streams);
  }
}
