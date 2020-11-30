// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import RemovableObserver from '../removableobserver/RemovableObserver';
import SignalingClientEvent from '../signalingclient/SignalingClientEvent';
import SignalingClientEventType from '../signalingclient/SignalingClientEventType';
import SignalingClientObserver from '../signalingclientobserver/SignalingClientObserver';
import {
  SdkAudioMetadataFrame,
  SdkAudioStreamIdInfoFrame,
  SdkSignalFrame,
} from '../signalingprotocol/SignalingProtocol.js';
import BaseTask from './BaseTask';

export default class ListenForVolumeIndicatorsTask
  extends BaseTask
  implements RemovableObserver, SignalingClientObserver {
  protected taskName = 'ListenForVolumeIndicatorsTask';
  constructor(private context: AudioVideoControllerState) {
    super(context.logger);
  }

  async run(): Promise<void> {
    this.context.removableObservers.push(this);
    this.context.signalingClient.registerObserver(this);
    this.context.realtimeController.realtimeSubscribeToMuteAndUnmuteLocalAudio(
      this.realtimeMuteAndUnmuteHandler
    );
  }

  removeObserver(): void {
    this.context.realtimeController.realtimeUnsubscribeToMuteAndUnmuteLocalAudio(
      this.realtimeMuteAndUnmuteHandler
    );
    this.context.signalingClient.removeObserver(this);
  }

  handleSignalingClientEvent(event: SignalingClientEvent): void {
    if (event.type !== SignalingClientEventType.ReceivedSignalFrame) {
      return;
    }
    if (event.message.type === SdkSignalFrame.Type.AUDIO_STREAM_ID_INFO) {
      // @ts-ignore
      const audioStreamIdInfo: SdkAudioStreamIdInfoFrame = event.message.audioStreamIdInfo;
      this.context.volumeIndicatorAdapter.sendRealtimeUpdatesForAudioStreamIdInfo(
        audioStreamIdInfo
      );
    } else if (event.message.type === SdkSignalFrame.Type.AUDIO_METADATA) {
      // @ts-ignore
      const audioMetadata: SdkAudioMetadataFrame = event.message.audioMetadata;
      this.context.volumeIndicatorAdapter.sendRealtimeUpdatesForAudioMetadata(audioMetadata);
    }
  }

  realtimeMuteAndUnmuteHandler = (muted: boolean): void => {
    this.context.signalingClient.mute(muted);
  };
}
