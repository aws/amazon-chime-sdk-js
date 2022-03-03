// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/*
* When using automatic language identification for streaming transcription,
* Amazon Transcribe provides the language codes of the identified languages and their associated confidence scores.
* languageCode refers to one of language code from the set of languageOptions provided during start transcription call
* score refers to the confidence score is a value between zero and one; a larger value indicates a higher confidence in the identified language.
* Sample LanguageWithScore would look similar to this :
* "LanguageIdentification": [
                {
                    "LanguageCode": "en-US",
                    "Score": 0.805
                },
                {
                    "LanguageCode": "ja-JP",
                    "Score": 0.195
                }
            ]
*/
export default class TranscriptLanguageWithScore {
  languageCode: string;
  score: number;
}
