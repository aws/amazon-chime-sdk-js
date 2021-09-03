// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Long = require('long');
import DataMessage from '../datamessage/DataMessage';
import {
  SdkTranscript,
  SdkTranscriptAlternative,
  SdkTranscriptEvent,
  SdkTranscriptFrame,
  SdkTranscriptionStatus,
  SdkTranscriptItem,
  SdkTranscriptResult,
} from '../signalingprotocol/SignalingProtocol';
import Transcript from './Transcript';
import TranscriptAlternative from './TranscriptAlternative';
import TranscriptionStatus from './TranscriptionStatus';
import TranscriptionStatusType from './TranscriptionStatusType';
import TranscriptItem from './TranscriptItem';
import TranscriptItemType from './TranscriptItemType';
import TranscriptResult from './TranscriptResult';

const TranscriptionStatusTypes = {
  [SdkTranscriptionStatus.Type.STARTED]: TranscriptionStatusType.STARTED,
  [SdkTranscriptionStatus.Type.INTERRUPTED]: TranscriptionStatusType.INTERRUPTED,
  [SdkTranscriptionStatus.Type.RESUMED]: TranscriptionStatusType.RESUMED,
  [SdkTranscriptionStatus.Type.STOPPED]: TranscriptionStatusType.STOPPED,
  [SdkTranscriptionStatus.Type.FAILED]: TranscriptionStatusType.FAILED,
};

const SdkTranscriptionStatusType = {
  [TranscriptionStatusType.STARTED]: SdkTranscriptionStatus.Type.STARTED,
  [TranscriptionStatusType.INTERRUPTED]: SdkTranscriptionStatus.Type.INTERRUPTED,
  [TranscriptionStatusType.RESUMED]: SdkTranscriptionStatus.Type.RESUMED,
  [TranscriptionStatusType.STOPPED]: SdkTranscriptionStatus.Type.STOPPED,
  [TranscriptionStatusType.FAILED]: SdkTranscriptionStatus.Type.FAILED,
};

type TranscriptEvent = Transcript | TranscriptionStatus;

function sdkTimeToNumber(sdkTime: number | Long): number {
  return Long.fromValue(sdkTime).toNumber();
}

export class TranscriptEventConverter {
  /**
   * Decodes a list of TranscriptEvent from a data message.
   * @param dataMessage Data message to decode from
   * @returns List of TranscriptEvent
   * @throws {Error} If the data message payload cannot be decoded
   */
  static from(dataMessage: DataMessage): TranscriptEvent[] {
    let frame;
    try {
      frame = SdkTranscriptFrame.decode(dataMessage.data);
    } catch (e) {
      throw new Error('Cannot decode transcript data message: ' + e);
    }

    const transcriptEvents: TranscriptEvent[] = [];
    for (const sdkTranscriptEvent of frame.events) {
      if (sdkTranscriptEvent.status) {
        const transcriptionStatusType = TranscriptionStatusTypes[sdkTranscriptEvent.status.type];
        if (!transcriptionStatusType) {
          continue;
        }
        const transcriptionStatus = new TranscriptionStatus();
        transcriptionStatus.type = transcriptionStatusType;
        transcriptionStatus.eventTimeMs = sdkTimeToNumber(sdkTranscriptEvent.status.eventTime);
        transcriptionStatus.transcriptionRegion = sdkTranscriptEvent.status.transcriptionRegion;
        transcriptionStatus.transcriptionConfiguration =
          sdkTranscriptEvent.status.transcriptionConfiguration;

        if (sdkTranscriptEvent.status.message) {
          transcriptionStatus.message = sdkTranscriptEvent.status.message;
        }

        transcriptEvents.push(transcriptionStatus);
      } else if (sdkTranscriptEvent.transcript) {
        const transcript = new Transcript();
        transcript.results = [];

        for (const result of sdkTranscriptEvent.transcript.results) {
          const transcriptResult: TranscriptResult = {
            channelId: result.channelId,
            isPartial: result.isPartial,
            resultId: result.resultId,
            startTimeMs: sdkTimeToNumber(result.startTime),
            endTimeMs: sdkTimeToNumber(result.endTime),
            alternatives: [],
          };

          // manually sent message
          if (dataMessage.senderAttendeeId) {
            transcriptResult.editor = {
              attendeeId: dataMessage.senderAttendeeId,
              externalUserId: dataMessage.senderExternalUserId,
            };
          }

          for (const alternative of result.alternatives) {
            const transcriptAlternative: TranscriptAlternative = {
              items: [],
              transcript: alternative.transcript,
            };

            for (const item of alternative.items) {
              const transcriptItem: TranscriptItem = {
                content: item.content,
                attendee: {
                  attendeeId: item.speakerAttendeeId,
                  externalUserId: item.speakerExternalUserId,
                },
                startTimeMs: sdkTimeToNumber(item.startTime),
                endTimeMs: sdkTimeToNumber(item.endTime),
                type: null,
              };

              if (item.vocabularyFilterMatch) {
                transcriptItem.vocabularyFilterMatch = item.vocabularyFilterMatch;
              }

              switch (item.type) {
                case SdkTranscriptItem.Type.PRONUNCIATION:
                  transcriptItem.type = TranscriptItemType.PRONUNCIATION;
                  break;
                case SdkTranscriptItem.Type.PUNCTUATION:
                  transcriptItem.type = TranscriptItemType.PUNCTUATION;
                  break;
              }

              transcriptAlternative.items.push(transcriptItem);
            }

            transcriptResult.alternatives.push(transcriptAlternative);
          }

          transcript.results.push(transcriptResult);
        }

        transcriptEvents.push(transcript);
      }
    }

    return transcriptEvents;
  }

  /**
   * Encodes a TranscriptEvent into binary encoded form.
   * @param result TranscriptEvent to encode
   * @returns Binary encoded form of SdkTranscriptFrame
   */
  static toByteArray(event: TranscriptEvent): Uint8Array {
    let sdkTranscriptEvent: SdkTranscriptEvent;

    if (event instanceof TranscriptionStatus) {
      sdkTranscriptEvent = SdkTranscriptEvent.create({
        status: {
          type: SdkTranscriptionStatusType[event.type],
          eventTime: event.eventTimeMs,
          transcriptionRegion: event.transcriptionRegion,
          transcriptionConfiguration: event.transcriptionConfiguration,
          message: event.message,
        },
      });
    } else {
      // instanceof Transcript
      const sdkResults: SdkTranscriptResult[] = [];
      for (const result of event.results) {
        const alternatives: SdkTranscriptAlternative[] = [];
        for (const alternative of result.alternatives) {
          const items: SdkTranscriptItem[] = [];
          for (const item of alternative.items) {
            let itemType: SdkTranscriptItem.Type;
            switch (item.type) {
              case TranscriptItemType.PRONUNCIATION:
                itemType = SdkTranscriptItem.Type.PRONUNCIATION;
                break;
              case TranscriptItemType.PUNCTUATION:
                itemType = SdkTranscriptItem.Type.PUNCTUATION;
                break;
            }

            items.push(
              SdkTranscriptItem.create({
                content: item.content,
                endTime: item.endTimeMs,
                startTime: item.startTimeMs,
                speakerAttendeeId: item.attendee.attendeeId,
                speakerExternalUserId: item.attendee.externalUserId,
                vocabularyFilterMatch: item.vocabularyFilterMatch,
                type: itemType,
              })
            );
          }

          alternatives.push(
            SdkTranscriptAlternative.create({
              items,
              transcript: alternative.transcript,
            })
          );
        }

        sdkResults.push(
          SdkTranscriptResult.create({
            alternatives: alternatives,
            endTime: result.endTimeMs,
            startTime: result.startTimeMs,
            isPartial: result.isPartial,
            resultId: result.resultId,
          })
        );
      }
      sdkTranscriptEvent = SdkTranscriptEvent.create({
        transcript: SdkTranscript.create({
          results: sdkResults,
        }),
      });
    }

    const frame = SdkTranscriptFrame.create({
      events: [sdkTranscriptEvent],
    });

    return SdkTranscriptFrame.encode(frame).finish();
  }
}

export default TranscriptEvent;
