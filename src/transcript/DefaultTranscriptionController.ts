// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DataMessage from '../datamessage/DataMessage';
import RealtimeController from '../realtimecontroller/RealtimeController';
import TranscriptEvent from './TranscriptEvent';
import TranscriptionController from './TranscriptionController';

export const TRANSCRIPTION_DATA_MESSAGE_TOPIC = 'aws:chime:transcription';

export default class DefaultTranscriptionController implements TranscriptionController {
  private readonly transcriptEventCallbacks: Set<(transcriptEvent: TranscriptEvent) => void>;

  constructor(private realtimeController: RealtimeController) {
    this.transcriptEventCallbacks = new Set<(transcriptEvent: TranscriptEvent) => void>();
  }

  subscribeToTranscriptEvent(callback: (transcriptEvent: TranscriptEvent) => void): void {
    if (this.transcriptEventCallbacks.size === 0) {
      this.realtimeController.realtimeSubscribeToReceiveDataMessage(
        TRANSCRIPTION_DATA_MESSAGE_TOPIC,
        (dataMessage: DataMessage) => {
          for (const transcriptEvent of TranscriptEvent.from(dataMessage)) {
            for (const transcriptEventCallback of this.transcriptEventCallbacks) {
              transcriptEventCallback(transcriptEvent);
            }
          }
        }
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
    }
  }
}
