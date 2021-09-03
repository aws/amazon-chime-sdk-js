// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DataMessage from '../datamessage/DataMessage';
import RealtimeController from '../realtimecontroller/RealtimeController';
import Transcript from './Transcript';
import TranscriptEvent, { TranscriptEventConverter } from './TranscriptEvent';
import TranscriptionController from './TranscriptionController';

export const TRANSCRIPTION_DATA_MESSAGE_TOPIC = 'aws:chime:transcription';
export const MANUAL_TRANSCRIPTION_DATA_MESSAGE_TOPIC = 'aws:chime:manualtranscription';

export default class DefaultTranscriptionController implements TranscriptionController {
  private readonly transcriptEventCallbacks: Set<(transcriptEvent: TranscriptEvent) => void>;

  constructor(private realtimeController: RealtimeController) {
    this.transcriptEventCallbacks = new Set<(transcriptEvent: TranscriptEvent) => void>();
  }

  subscribeToTranscriptEvent(callback: (transcriptEvent: TranscriptEvent) => void): void {
    if (this.transcriptEventCallbacks.size === 0) {
      const callback = (dataMessage: DataMessage): void => {
        for (const transcriptEvent of TranscriptEventConverter.from(dataMessage)) {
          for (const transcriptEventCallback of this.transcriptEventCallbacks) {
            transcriptEventCallback(transcriptEvent);
          }
        }
      };
      this.realtimeController.realtimeSubscribeToReceiveDataMessage(
        TRANSCRIPTION_DATA_MESSAGE_TOPIC,
        callback
      );
      this.realtimeController.realtimeSubscribeToReceiveDataMessage(
        MANUAL_TRANSCRIPTION_DATA_MESSAGE_TOPIC,
        callback
      );
    }

    this.transcriptEventCallbacks.add(callback);
  }

  unsubscribeFromTranscriptEvent(callback: (transcriptEvent: TranscriptEvent) => void): void {
    this.transcriptEventCallbacks.delete(callback);

    if (this.transcriptEventCallbacks.size === 0) {
      this.realtimeController.realtimeUnsubscribeFromReceiveDataMessage(
        TRANSCRIPTION_DATA_MESSAGE_TOPIC
      );
      this.realtimeController.realtimeUnsubscribeFromReceiveDataMessage(
        MANUAL_TRANSCRIPTION_DATA_MESSAGE_TOPIC
      );
    }
  }

  sendTranscriptEvent(transcriptEvent: TranscriptEvent): void {
    if (
      transcriptEvent instanceof Transcript &&
      (!transcriptEvent.results.length || !transcriptEvent.results[0].alternatives.length)
    ) {
      throw Error('Transcript result must have at least one alternative');
    }
    const data = TranscriptEventConverter.toByteArray(transcriptEvent);
    this.realtimeController.realtimeSendDataMessage(
      MANUAL_TRANSCRIPTION_DATA_MESSAGE_TOPIC,
      data,
      0
    );
  }
}
