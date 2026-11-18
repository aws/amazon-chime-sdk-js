// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * @internal
 * The browser `RTCRtpReceiver` API over a UCSDK receiver.
 */
export default class CitrixRTCRtpReceiver implements RTCRtpReceiver {
  constructor(public readonly inner: RTCRtpReceiver) {}

  get jitterBufferTarget(): DOMHighResTimeStamp | null {
    return this.inner.jitterBufferTarget;
  }

  set jitterBufferTarget(target: DOMHighResTimeStamp | null) {
    this.inner.jitterBufferTarget = target;
  }

  get track(): MediaStreamTrack {
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

  getContributingSources(): RTCRtpContributingSource[] {
    return this.inner.getContributingSources();
  }

  getParameters(): RTCRtpReceiveParameters {
    return this.inner.getParameters();
  }

  getStats(): Promise<RTCStatsReport> {
    return this.inner.getStats();
  }

  getSynchronizationSources(): RTCRtpSynchronizationSource[] {
    return this.inner.getSynchronizationSources();
  }
}
