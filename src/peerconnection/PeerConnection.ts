// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The meeting's peer connection, as the SDK uses it. [[DefaultPeerConnection]]
 * wraps a browser `RTCPeerConnection`.
 */
export default interface PeerConnection {
  /** The wrapped connection, for `AudioVideoController.rtcPeerConnection`. */
  readonly rtcPeerConnection: RTCPeerConnection;

  readonly localDescription: RTCSessionDescription | null;
  readonly iceGatheringState: RTCIceGatheringState;
  readonly iceConnectionState: RTCIceConnectionState;
  readonly connectionState: RTCPeerConnectionState;

  addEventListener<K extends keyof RTCPeerConnectionEventMap>(
    type: K,
    listener: (this: RTCPeerConnection, event: RTCPeerConnectionEventMap[K]) => void
  ): void;
  removeEventListener<K extends keyof RTCPeerConnectionEventMap>(
    type: K,
    listener: (this: RTCPeerConnection, event: RTCPeerConnectionEventMap[K]) => void
  ): void;

  /** Whether the connection supports `getTransceivers`. */
  hasTransceivers(): boolean;
  addTransceiver(
    trackOrKind: MediaStreamTrack | string,
    init?: RTCRtpTransceiverInit
  ): RTCRtpTransceiver;
  getTransceivers(): RTCRtpTransceiver[];
  getReceivers(): RTCRtpReceiver[];

  createOffer(options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit>;
  setLocalDescription(description?: RTCLocalSessionDescriptionInit): Promise<void>;
  setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void>;

  getStats(selector?: MediaStreamTrack | null): Promise<RTCStatsReport>;
  close(): void;
}
