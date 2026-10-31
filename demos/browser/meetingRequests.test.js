// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import meetingRequests from './meetingRequests.js';

const {
  MEETING_ID_FORMAT,
  BadRequestError,
  createMeetingRequest,
  transcriptionConfiguration,
  requireCapabilities,
  liveConnectorRequest,
} = meetingRequests;

describe('MEETING_ID_FORMAT', () => {
  it('matches a whole meeting ID only', () => {
    expect(MEETING_ID_FORMAT.test('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')).toBe(true);
    expect(MEETING_ID_FORMAT.test('AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE')).toBe(true);
    expect(MEETING_ID_FORMAT.test('my meeting aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')).toBe(false);
    expect(MEETING_ID_FORMAT.test('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeeee')).toBe(false);
    expect(MEETING_ID_FORMAT.test('gaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')).toBe(false);
  });
});

describe('createMeetingRequest', () => {
  it('sets no MeetingFeatures when nothing asks for one', () => {
    expect(createMeetingRequest({ title: 'Standup', region: 'us-east-1' }, undefined, 'token')).toEqual({
      ClientRequestToken: 'token',
      MediaRegion: 'us-east-1',
      ExternalMeetingId: 'Standup',
    });
  });

  it('truncates the external meeting ID and names the primary meeting', () => {
    const primary = { Meeting: { MeetingId: 'primary-id' } };
    expect(createMeetingRequest({ title: 'x'.repeat(80), region: 'eu-west-2' }, primary, 'token')).toEqual({
      ClientRequestToken: 'token',
      MediaRegion: 'eu-west-2',
      ExternalMeetingId: 'x'.repeat(64),
      PrimaryMeetingId: 'primary-id',
    });
  });

  it('sets each requested feature', () => {
    const query = { title: 't', region: 'us-east-1', ns_es: 'true', v_rs: 'FHD', c_rs: 'UHD', a_cnt: '250' };
    expect(createMeetingRequest(query, undefined, 'token').MeetingFeatures).toEqual({
      Audio: { EchoReduction: 'AVAILABLE' },
      Video: { MaxResolution: 'FHD' },
      Content: { MaxResolution: 'UHD' },
      Attendee: { MaxCount: 250 },
    });
    const off = { title: 't', region: 'us-east-1', v_rs: 'None', c_rs: 'None', a_cnt: '2' };
    expect(createMeetingRequest(off, undefined, 'token').MeetingFeatures).toEqual({
      Video: { MaxResolution: 'None' },
      Content: { MaxResolution: 'None' },
      Attendee: { MaxCount: 2 },
    });
  });

  it('ignores default resolutions and an absent, fractional or out-of-range attendee count', () => {
    for (const extra of [
      { ns_es: 'false', v_rs: 'HD', c_rs: 'FHD' },
      {},
      { a_cnt: '' },
      { a_cnt: '1' },
      { a_cnt: '251' },
      { a_cnt: '2.5' },
      { a_cnt: '-999' },
      { a_cnt: 'many' },
    ]) {
      expect(createMeetingRequest({ title: 't', region: 'us-east-1', ...extra }, undefined, 'token')).not.toHaveProperty(
        'MeetingFeatures'
      );
    }
  });
});

describe('transcriptionConfiguration', () => {
  it('maps every Transcribe stream parameter', () => {
    const transcriptionStreamParams = JSON.stringify({
      contentIdentificationType: 'PII',
      contentRedactionType: 'PII',
      enablePartialResultsStability: true,
      partialResultsStability: 'high',
      piiEntityTypes: 'NAME,ADDRESS',
      languageModelName: 'model',
      identifyLanguage: true,
      languageOptions: 'en-US,fr-FR',
      preferredLanguage: 'en-US',
      vocabularyNames: 'vocab',
      vocabularyFilterNames: 'filter',
      unknownParam: 'dropped',
    });
    expect(
      transcriptionConfiguration({ engine: 'transcribe', language: 'en-US', region: 'us-east-1', transcriptionStreamParams })
    ).toEqual({
      EngineTranscribeSettings: {
        LanguageCode: 'en-US',
        Region: 'us-east-1',
        ContentIdentificationType: 'PII',
        ContentRedactionType: 'PII',
        EnablePartialResultsStabilization: true,
        PartialResultsStability: 'high',
        PiiEntityTypes: 'NAME,ADDRESS',
        LanguageModelName: 'model',
        IdentifyLanguage: true,
        LanguageOptions: 'en-US,fr-FR',
        PreferredLanguage: 'en-US',
        VocabularyNames: 'vocab',
        VocabularyFilterNames: 'filter',
      },
    });
    expect(transcriptionConfiguration({ engine: 'transcribe' })).toEqual({ EngineTranscribeSettings: {} });
  });

  it('builds Transcribe Medical settings with only content identification from the stream parameters', () => {
    const transcriptionStreamParams = JSON.stringify({ contentIdentificationType: 'PHI', contentRedactionType: 'PII' });
    expect(
      transcriptionConfiguration({ engine: 'transcribe_medical', language: 'en-US', region: 'auto', transcriptionStreamParams })
    ).toEqual({
      EngineTranscribeMedicalSettings: {
        LanguageCode: 'en-US',
        Specialty: 'PRIMARYCARE',
        Type: 'CONVERSATION',
        Region: 'auto',
        ContentIdentificationType: 'PHI',
      },
    });
    expect(transcriptionConfiguration({ engine: 'transcribe_medical' })).toEqual({
      EngineTranscribeMedicalSettings: { LanguageCode: undefined, Specialty: 'PRIMARYCARE', Type: 'CONVERSATION' },
    });
  });

  it('returns undefined for an unknown engine', () => {
    expect(transcriptionConfiguration({ engine: 'whisper' })).toBeUndefined();
    expect(transcriptionConfiguration({})).toBeUndefined();
  });

  it('rejects stream parameters that are not JSON', () => {
    expect(() => transcriptionConfiguration({ engine: 'transcribe', transcriptionStreamParams: '{bad' })).toThrow(
      new BadRequestError('transcriptionStreamParams is not valid JSON')
    );
    expect(() => transcriptionConfiguration({ engine: 'transcribe', transcriptionStreamParams: '{bad' })).toThrow(
      BadRequestError
    );
  });
});

describe('requireCapabilities', () => {
  it('returns the three capabilities', () => {
    expect(requireCapabilities({ audioCapability: 'SendReceive', videoCapability: 'Send', contentCapability: 'None' })).toEqual({
      Audio: 'SendReceive',
      Video: 'Send',
      Content: 'None',
    });
    expect(requireCapabilities({ audioCapability: 'Receive', videoCapability: 'Receive', contentCapability: 'Receive' })).toEqual({
      Audio: 'Receive',
      Video: 'Receive',
      Content: 'Receive',
    });
  });

  it('rejects an unknown or missing capability', () => {
    expect(() => requireCapabilities({ audioCapability: 'Send', videoCapability: 'All', contentCapability: 'None' })).toThrow(
      new BadRequestError('Invalid capability: All')
    );
    expect(() => requireCapabilities({ audioCapability: 'Send', videoCapability: 'Send' })).toThrow(
      new BadRequestError('Invalid capability: undefined')
    );
    expect(() => requireCapabilities({ audioCapability: 'send', videoCapability: 'Send', contentCapability: 'Send' })).toThrow(
      BadRequestError
    );
  });
});

describe('liveConnectorRequest', () => {
  it('streams the composited meeting to the RTMP URL', () => {
    expect(liveConnectorRequest('123456789012', 'meeting-id', 'rtmps://ingest:443/app/key')).toEqual({
      Sinks: [
        {
          RTMPConfiguration: { AudioChannels: 'Stereo', AudioSampleRate: '48000', Url: 'rtmps://ingest:443/app/key' },
          SinkType: 'RTMP',
        },
      ],
      Sources: [
        {
          ChimeSdkMeetingLiveConnectorConfiguration: {
            Arn: 'arn:aws:chime::123456789012:meeting:meeting-id',
            CompositedVideo: {
              GridViewConfiguration: { ContentShareLayout: 'Vertical' },
              Layout: 'GridView',
              Resolution: 'FHD',
            },
            MuxType: 'AudioWithCompositedVideo',
          },
          SourceType: 'ChimeSdkMeeting',
        },
      ],
    });
  });
});
