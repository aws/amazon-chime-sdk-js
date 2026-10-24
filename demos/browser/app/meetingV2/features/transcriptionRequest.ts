// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ConfigValues } from '../config/schema';
import { STRINGS } from '../strings';

export interface TranscriptionStreamParams {
  contentIdentificationType?: 'PII' | 'PHI';
  contentRedactionType?: 'PII';
  enablePartialResultsStability?: boolean;
  partialResultsStability?: string;
  piiEntityTypes?: string;
  languageModelName?: string;
  identifyLanguage?: boolean;
  languageOptions?: string;
  preferredLanguage?: string;
  vocabularyNames?: string;
  vocabularyFilterNames?: string;
}

export interface TranscriptionRequest {
  engine: string;
  languageCode: string;
  region: string;
  params: TranscriptionStreamParams;
}

type CaptionValues = Pick<
  ConfigValues,
  | 'transcriptionEngine'
  | 'transcriptionRegion'
  | 'captionsLanguage'
  | 'transcriptionIdentifyLanguage'
  | 'transcriptionLanguageOptions'
  | 'transcriptionPreferredLanguage'
  | 'transcriptionVocabularyNames'
  | 'transcriptionVocabularyFilterNames'
  | 'transcriptionCustomLanguageModel'
  | 'transcriptionPartialStabilization'
  | 'transcriptionStability'
  | 'transcriptionPiiIdentification'
  | 'transcriptionPiiRedaction'
  | 'transcriptionPiiEntityTypes'
>;

function csv(value: string): string[] {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(item => item !== '');
}

function assign(
  params: TranscriptionStreamParams,
  key: keyof TranscriptionStreamParams,
  value: string
): void {
  const trimmed = value.trim();
  if (trimmed) {
    (params as Record<string, unknown>)[key] = trimmed;
  }
}

/**
 * The start-transcription request for the current Captions settings. Mirrors what the server's
 * `/start_transcription` route accepts: Transcribe Medical is English only and knows PHI;
 * language identification excludes a fixed language, custom model and PII options; partial
 * results stabilization is Transcribe only.
 */
export function transcriptionRequest(values: CaptionValues): TranscriptionRequest {
  const engine = values.transcriptionEngine;
  const params: TranscriptionStreamParams = {};
  let languageCode = '';
  if (engine === 'transcribe_medical') {
    languageCode = 'en-US';
    if (values.transcriptionPiiIdentification) {
      params.contentIdentificationType = 'PHI';
    }
  } else if (values.transcriptionIdentifyLanguage) {
    const languageOptions = csv(values.transcriptionLanguageOptions);
    if (languageOptions.length < 2) {
      throw new Error(STRINGS.languageOptionsNeedTwo);
    }
    params.identifyLanguage = true;
    params.languageOptions = languageOptions.join(',');
    assign(params, 'preferredLanguage', values.transcriptionPreferredLanguage);
    assign(params, 'vocabularyNames', values.transcriptionVocabularyNames);
    assign(params, 'vocabularyFilterNames', values.transcriptionVocabularyFilterNames);
  } else {
    languageCode = values.captionsLanguage;
    if (values.transcriptionPiiIdentification) {
      params.contentIdentificationType = 'PII';
    } else if (values.transcriptionPiiRedaction) {
      params.contentRedactionType = 'PII';
    }
    if (params.contentIdentificationType || params.contentRedactionType) {
      assign(params, 'piiEntityTypes', values.transcriptionPiiEntityTypes);
    }
    assign(params, 'languageModelName', values.transcriptionCustomLanguageModel);
  }
  if (engine === 'transcribe' && values.transcriptionPartialStabilization) {
    params.enablePartialResultsStability = true;
    assign(params, 'partialResultsStability', values.transcriptionStability);
  }
  return { engine, languageCode, region: values.transcriptionRegion, params };
}
