// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import DataMessage from '../datamessage/DataMessage';
import RemovableObserver from '../removableobserver/RemovableObserver';
import SignalingClientEvent from '../signalingclient/SignalingClientEvent';
import SignalingClientEventType from '../signalingclient/SignalingClientEventType';
import SignalingClientObserver from '../signalingclientobserver/SignalingClientObserver';
import {
  SdkDataMessageFrame,
  SdkDataMessagePayload,
  SdkSignalFrame,
} from '../signalingprotocol/SignalingProtocol.js';
import BaseTask from './BaseTask';

export default class SendAndReceiveDataMessagesTask
  extends BaseTask
  implements RemovableObserver, SignalingClientObserver {
  protected taskName = 'SendAndReceiveDataMessagesTask';

  private static TOPIC_REGEX = new RegExp(/^[a-zA-Z0-9_-]{1,36}$/);
  private static DATA_SIZE = 2048;

  constructor(private context: AudioVideoControllerState) {
    super(context.logger);
  }

  async run(): Promise<void> {
    this.context.removableObservers.push(this);
    this.context.signalingClient.registerObserver(this);
    this.context.realtimeController.realtimeSubscribeToSendDataMessage(this.sendDataMessageHandler);
  }

  removeObserver(): void {
    this.context.realtimeController.realtimeUnsubscribeFromSendDataMessage(
      this.sendDataMessageHandler
    );
    this.context.signalingClient.removeObserver(this);
  }

  handleSignalingClientEvent(event: SignalingClientEvent): void {
    if (
      event.type === SignalingClientEventType.ReceivedSignalFrame &&
      event.message.type === SdkSignalFrame.Type.DATA_MESSAGE
    ) {
      for (const message of event.message.dataMessage.messages) {
        const dataMessage = new DataMessage(
          (message.ingestTimeNs as number) / 1000000,
          message.topic,
          message.data,
          message.senderAttendeeId,
          message.senderExternalUserId,
          (message.ingestTimeNs as number) === 0
        );
        this.context.realtimeController.realtimeReceiveDataMessage(dataMessage);
      }
    }
  }

  sendDataMessageHandler = (
    topic: string,
    data: Uint8Array | string | any, // eslint-disable-line @typescript-eslint/no-explicit-any
    lifetimeMs?: number
  ): void => {
    if (this.context.signalingClient.ready()) {
      let uint8Data;
      if (data instanceof Uint8Array) {
        uint8Data = data;
      } else if (typeof data === 'string') {
        uint8Data = new TextEncoder().encode(data);
      } else {
        uint8Data = new TextEncoder().encode(JSON.stringify(data));
      }
      this.validateDataMessage(topic, uint8Data, lifetimeMs);
      const message = SdkDataMessagePayload.create();
      message.topic = topic;
      message.lifetimeMs = lifetimeMs;
      message.data = uint8Data;
      const messageFrame = SdkDataMessageFrame.create();
      messageFrame.messages = [message];
      this.context.signalingClient.sendDataMessage(messageFrame);
    } else {
      throw new Error('Signaling client is not ready');
    }
  };

  private validateDataMessage(topic: string, data: Uint8Array, lifetimeMs?: number): void {
    if (!SendAndReceiveDataMessagesTask.TOPIC_REGEX.test(topic)) {
      throw new Error('Invalid topic');
    }

    if (data.length > SendAndReceiveDataMessagesTask.DATA_SIZE) {
      throw new Error('Data size has to be less than 2048 bytes');
    }

    if (lifetimeMs && lifetimeMs < 0) {
      throw new Error('The life time of the message has to be non negative');
    }
  }
}
