// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import { TranscriptEvent } from '../../src';
import DataMessage from '../../src/datamessage/DataMessage';
import {
  SdkTranscriptEvent,
  SdkTranscriptFrame,
  SdkTranscriptionStatus,
} from '../../src/signalingprotocol/SignalingProtocol';
import { TRANSCRIPTION_DATA_MESSAGE_TOPIC } from '../../src/transcript/DefaultTranscriptionController';
import TranscriptionStatusType from '../../src/transcript/TranscriptionStatusType';
import TranscriptItemType from '../../src/transcript/TranscriptItemType';
import {
  logBase64FromUint8Array,
  makeSdkTranscript,
  makeSdkTranscriptFrame,
  makeSdkTranscriptionStatus,
  TRANSCRIPT_EVENT_TEST_VECTORS,
} from './TranscriptEventTestDataHelper';

describe('TranscriptEvent', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  function makeTranscriptDataMessageFrom(data: Uint8Array): DataMessage {
    return new DataMessage(10000, TRANSCRIPTION_DATA_MESSAGE_TOPIC, data, '', '');
  }

  beforeEach(async () => {});

  afterEach(() => {});

  it('handles one transcript event of status type', async () => {
    const events = [makeSdkTranscriptionStatus(SdkTranscriptionStatus.Type.STARTED)];
    const data = SdkTranscriptFrame.encode(makeSdkTranscriptFrame(events)).finish();
    logBase64FromUint8Array(data);

    // The steps above generates data below passed directly as test input
    const dataMessage = makeTranscriptDataMessageFrom(
      TRANSCRIPT_EVENT_TEST_VECTORS.TRANSCRIPTION_STATUS_STARTED
    );
    const actualEvents = TranscriptEvent.from(dataMessage);

    expect(actualEvents.length).to.equal(1);
    expect(actualEvents[0].status.type).to.eql(TranscriptionStatusType.STARTED);
    expect(actualEvents[0].status.transcriptionRegion).to.eql('test-region');
    expect(actualEvents[0].status.transcriptionConfiguration).to.eql('test-configuration');
  });

  it('handles status events with detail message', async () => {
    const events = [
      makeSdkTranscriptionStatus(SdkTranscriptionStatus.Type.STARTED, 'detail message'),
    ];
    const data = SdkTranscriptFrame.encode(makeSdkTranscriptFrame(events)).finish();
    logBase64FromUint8Array(data);

    // The steps above generates data below passed directly as test input
    const dataMessage = makeTranscriptDataMessageFrom(
      TRANSCRIPT_EVENT_TEST_VECTORS.TRANSCRIPTION_STATUS_STARTED_WITH_MESSAGE
    );
    const actualEvents = TranscriptEvent.from(dataMessage);

    expect(actualEvents.length).to.equal(1);
    expect(actualEvents[0].status.message).to.eql('detail message');
  });

  it('handles one transcript event with invalid status type', async () => {
    const events = [makeSdkTranscriptionStatus(0)];
    const data = SdkTranscriptFrame.encode(makeSdkTranscriptFrame(events)).finish();
    logBase64FromUint8Array(data);

    // The steps above generates data below passed directly as test input
    const dataMessage = makeTranscriptDataMessageFrom(
      TRANSCRIPT_EVENT_TEST_VECTORS.TRANSCRIPTION_STATUS_INVALID
    );
    const actualEvents = TranscriptEvent.from(dataMessage);

    expect(actualEvents.length).to.equal(0);
  });

  it('handles multiple transcript event of event type', async () => {
    const events = [
      makeSdkTranscriptionStatus(SdkTranscriptionStatus.Type.STARTED),
      makeSdkTranscriptionStatus(SdkTranscriptionStatus.Type.INTERRUPTED),
      makeSdkTranscriptionStatus(SdkTranscriptionStatus.Type.RESUMED),
      makeSdkTranscriptionStatus(SdkTranscriptionStatus.Type.STOPPED),
      makeSdkTranscriptionStatus(SdkTranscriptionStatus.Type.FAILED),
    ];
    const data = SdkTranscriptFrame.encode(makeSdkTranscriptFrame(events)).finish();
    logBase64FromUint8Array(data);

    // The steps above generates data below passed directly as test input
    const dataMessage = makeTranscriptDataMessageFrom(
      TRANSCRIPT_EVENT_TEST_VECTORS.TRANSCRIPTION_STATUS_ALL
    );
    const actualEvents = TranscriptEvent.from(dataMessage);

    expect(actualEvents.length).to.equal(5);
    expect(actualEvents[0].status.type).to.eql(TranscriptionStatusType.STARTED);
    expect(actualEvents[1].status.type).to.eql(TranscriptionStatusType.INTERRUPTED);
    expect(actualEvents[2].status.type).to.eql(TranscriptionStatusType.RESUMED);
    expect(actualEvents[3].status.type).to.eql(TranscriptionStatusType.STOPPED);
    expect(actualEvents[4].status.type).to.eql(TranscriptionStatusType.FAILED);
  });

  it('handles one transcript event of transcript type', async () => {
    const event = makeSdkTranscript();
    const data = SdkTranscriptFrame.encode(makeSdkTranscriptFrame([event])).finish();
    logBase64FromUint8Array(data);

    // The steps above generates data below passed directly as test input
    const dataMessage = makeTranscriptDataMessageFrom(
      TRANSCRIPT_EVENT_TEST_VECTORS.TRANSCRIPT_SINGLE
    );
    const actualEvents = TranscriptEvent.from(dataMessage);

    expect(actualEvents.length).to.equal(1);
    expect(actualEvents[0].transcript.results.length).to.equal(1);
    expect(actualEvents[0].transcript.results[0].alternatives.length).to.equal(1);
    expect(actualEvents[0].transcript.results[0].alternatives[0].transcript).to.eql('Test.');
    expect(actualEvents[0].transcript.results[0].alternatives[0].items.length).to.eql(2);
    expect(actualEvents[0].transcript.results[0].alternatives[0].items[0].content).to.eql('Test');
    expect(actualEvents[0].transcript.results[0].alternatives[0].items[0].type).to.eql(
      TranscriptItemType.PRONUNCIATION
    );
    expect(
      actualEvents[0].transcript.results[0].alternatives[0].items[0].attendee.attendeeId
    ).to.eql('speaker-attendee-id');
    expect(
      actualEvents[0].transcript.results[0].alternatives[0].items[0].attendee.externalUserId
    ).to.eql('speaker-external-user-id');
    expect(
      actualEvents[0].transcript.results[0].alternatives[0].items[0].vocabularyFilterMatch
    ).to.eql(true);
    expect(actualEvents[0].transcript.results[0].alternatives[0].items[1].content).to.eql('.');
    expect(actualEvents[0].transcript.results[0].alternatives[0].items[1].type).to.eql(
      TranscriptItemType.PUNCTUATION
    );
    expect(
      actualEvents[0].transcript.results[0].alternatives[0].items[1].attendee.attendeeId
    ).to.eql('speaker-attendee-id');
    expect(
      actualEvents[0].transcript.results[0].alternatives[0].items[1].attendee.externalUserId
    ).to.eql('speaker-external-user-id');
    expect(actualEvents[0].transcript.results[0].alternatives[0].items[1].vocabularyFilterMatch).to
      .be.undefined;
  });

  it('handles multiple transcript event of mixed type', async () => {
    const event1 = makeSdkTranscriptionStatus(SdkTranscriptionStatus.Type.STARTED);
    const event2 = makeSdkTranscript();
    const data = SdkTranscriptFrame.encode(makeSdkTranscriptFrame([event1, event2])).finish();
    logBase64FromUint8Array(data);

    // The steps above generates data below passed directly as test input
    const dataMessage = makeTranscriptDataMessageFrom(
      TRANSCRIPT_EVENT_TEST_VECTORS.TRANSCRIPT_MIXED
    );
    const actualEvents = TranscriptEvent.from(dataMessage);

    expect(actualEvents.length).to.equal(2);
    expect(actualEvents[0].status.type).to.equal(TranscriptionStatusType.STARTED);
    expect(actualEvents[1].transcript.results[0].alternatives[0].transcript).to.be.equal('Test.');
  });

  it('handles malformed data message', async () => {
    const dataMessage = new DataMessage(
      10000,
      TRANSCRIPTION_DATA_MESSAGE_TOPIC,
      new Uint8Array([1, 2, 3, 4, 5]),
      '',
      ''
    );

    expect(() => TranscriptEvent.from(dataMessage)).to.throw(Error, 'decode');
  });

  it('handles event with no status or transcript', async () => {
    const frame = SdkTranscriptFrame.create();
    frame.events = [SdkTranscriptEvent.create()];
    const dataMessage = new DataMessage(
      10000,
      TRANSCRIPTION_DATA_MESSAGE_TOPIC,
      SdkTranscriptFrame.encode(frame).finish(),
      '',
      ''
    );

    const actualEvents = TranscriptEvent.from(dataMessage);

    expect(actualEvents.length).to.equal(0);
  });
});
