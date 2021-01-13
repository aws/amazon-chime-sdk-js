// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  SdkAudioMetadataFrame,
  SdkAudioStreamIdInfoFrame,
} from '../signalingprotocol/SignalingProtocol.js';

/**
 * VolumeIndicatorsAdapter dispatches updates to the RealtimeController when
 * signaling frames affecting roster presence or volume indicator state are
 * received.
 */
export default interface VolumeIndicatorsAdapter {
  /**
   * Invoked during session reconnect
   * @hidden
   */
  onReconnect(): void;

  /**
   * Sends realtime updates for an incoming SdkAudioStreamIdInfoFrame. This type
   * of frame affects presence and mute state.
   * @hidden
   */
  sendRealtimeUpdatesForAudioStreamIdInfo(info: SdkAudioStreamIdInfoFrame): void;

  /**
   * Sends realtime updates for an incoming SdkAudioMetadataFrame. This type of
   * frame affects volume and signal strength state.
   * @hidden
   */
  sendRealtimeUpdatesForAudioMetadata(metadata: SdkAudioMetadataFrame): void;
}
