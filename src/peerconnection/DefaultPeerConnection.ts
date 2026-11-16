// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import PeerConnection from './PeerConnection';

/** Forwards every call to the wrapped `RTCPeerConnection`. */
export default class DefaultPeerConnection implements PeerConnection {
  constructor(public readonly rtcPeerConnection: RTCPeerConnection) {}

  get localDescription(): RTCSessionDescription | null {
    return this.rtcPeerConnection.localDescription;
  }

  get iceGatheringState(): RTCIceGatheringState {
    return this.rtcPeerConnection.iceGatheringState;
  }

  get iceConnectionState(): RTCIceConnectionState {
    return this.rtcPeerConnection.iceConnectionState;
  }

  get connectionState(): RTCPeerConnectionState {
    return this.rtcPeerConnection.connectionState;
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    this.rtcPeerConnection.addEventListener(type, listener);
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    this.rtcPeerConnection.removeEventListener(type, listener);
  }

  hasTransceivers(): boolean {
    return typeof this.rtcPeerConnection.getTransceivers !== 'undefined';
  }

  addTransceiver(
    trackOrKind: MediaStreamTrack | string,
    init?: RTCRtpTransceiverInit
  ): RTCRtpTransceiver {
    return this.rtcPeerConnection.addTransceiver(trackOrKind, init);
  }

  getTransceivers(): RTCRtpTransceiver[] {
    return this.rtcPeerConnection.getTransceivers();
  }

  getReceivers(): RTCRtpReceiver[] {
    return this.rtcPeerConnection.getReceivers();
  }

  createOffer(options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit> {
    return this.rtcPeerConnection.createOffer(options);
  }

  setLocalDescription(description?: RTCLocalSessionDescriptionInit): Promise<void> {
    return this.rtcPeerConnection.setLocalDescription(description);
  }

  setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    return this.rtcPeerConnection.setRemoteDescription(description);
  }

  getStats(selector?: MediaStreamTrack | null): Promise<RTCStatsReport> {
    return this.rtcPeerConnection.getStats(selector);
  }

  close(): void {
    this.rtcPeerConnection.close();
  }
}
