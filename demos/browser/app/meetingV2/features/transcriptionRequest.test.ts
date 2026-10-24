// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import { MeetingConfig } from '../config/MeetingConfig';
import { transcriptionRequest } from './transcriptionRequest';

const values = (query: string): MeetingConfig['values'] =>
  new MeetingConfig(new URLSearchParams(query), null).values;

describe('transcriptionRequest', () => {
  it('defaults to Amazon Transcribe in the captions language with auto region', () => {
    expect(transcriptionRequest(values(''))).toEqual({
      engine: 'transcribe',
      languageCode: 'en-US',
      region: 'auto',
      params: {},
    });
  });

  it('sends PII identification with entity types, or redaction when identification is off', () => {
    const identify = transcriptionRequest(
      values('transcription-pii-identification=true&transcription-pii-entity-types= NAME, SSN ')
    );
    expect(identify.params).toEqual({
      contentIdentificationType: 'PII',
      piiEntityTypes: 'NAME, SSN',
    });

    const redact = transcriptionRequest(
      values('transcription-pii-redaction=true&captions-language=es-US')
    );
    expect(redact.languageCode).toBe('es-US');
    expect(redact.params).toEqual({ contentRedactionType: 'PII' });

    const both = transcriptionRequest(
      values('transcription-pii-identification=true&transcription-pii-redaction=true')
    );
    expect(both.params.contentIdentificationType).toBe('PII');
    expect(both.params.contentRedactionType).toBeUndefined();
  });

  it('switches to language identification and drops the fixed language, model and PII', () => {
    const request = transcriptionRequest(
      values(
        'transcription-identify-language=true&transcription-language-options=en-US, es-US,,fr-FR' +
          '&transcription-preferred-language=en-US&transcription-vocabulary-names=v1' +
          '&transcription-pii-identification=true&transcription-language-model=lm'
      )
    );
    expect(request.languageCode).toBe('');
    expect(request.params).toEqual({
      identifyLanguage: true,
      languageOptions: 'en-US,es-US,fr-FR',
      preferredLanguage: 'en-US',
      vocabularyNames: 'v1',
    });
  });

  it('refuses language identification with fewer than two options', () => {
    expect(() =>
      transcriptionRequest(
        values('transcription-identify-language=true&transcription-language-options=en-US')
      )
    ).toThrow(/at least two/);
  });

  it('adds partial results stabilization only for Amazon Transcribe', () => {
    const transcribe = transcriptionRequest(
      values('transcription-partial-stabilization=true&transcription-stability=low')
    );
    expect(transcribe.params).toEqual({
      enablePartialResultsStability: true,
      partialResultsStability: 'low',
    });

    const medical = transcriptionRequest(
      values(
        'transcription-engine=transcribe_medical&transcription-partial-stabilization=true' +
          '&transcription-pii-identification=true&transcription-region=us-west-2'
      )
    );
    expect(medical).toEqual({
      engine: 'transcribe_medical',
      languageCode: 'en-US',
      region: 'us-west-2',
      params: { contentIdentificationType: 'PHI' },
    });
  });
});
