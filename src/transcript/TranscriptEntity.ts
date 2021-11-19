// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/*
* When redacting personally identifiable information (PII) from a streaming transcription, Amazon Transcribe replaces each identified instance of PII with [PII] in your transcript.
* An additional option available for streaming audio is PII identification. 
* When you activate PII Identification, Amazon Transcribe labels the PII in your transcription results under an Entities object. 
* PII identification and redaction for streaming jobs is performed only upon complete transcription of the audio segments.
* category refers to whether the entity is a PII or PHI data.
* confidence refers to the confidence that the speech it flagged for redaction/identification is truly PII. Confidence value ranges from 0 to 1 inclusive.
* type refers to the type of PII/PHI data that is identified. The current supported type values are: BANK_ACCOUNT_NUMBER, BANK_ROUTING, CREDIT_DEBIT_NUMBER, CREDIT_DEBIT_CVV, CREDIT_DEBIT_EXPIRY, PIN, EMAIL, ADDRESS, NAME, PHONE, SSN.
* type is only available in case of engine transcribe and not in medical transcribe
* type can be expected to change and grow as Transcribe evolves
* endTimeMs and startTimeMs are epoch timestamps in milliseconds
* Sample Redacted PII Data would look similar to this :
* "Entities": [
                {
                    "Content": "[NAME]",
                    "Category": "PII",
                    "Type": "NAME",
                    "StartTime" : 1636493289421,
                    "EndTime" : 1636493290016,
                    "Confidence": 0.9989 
                }
            ]
* Sample PII Identified data would look similar to this :
* "Entities": [
                {
                    "Content": "janet smithy",
                    "Category": "PII",
                    "Type": "NAME",
                    "StartTime" : 1636493289421,
                    "EndTime" : 1636493290016,
                    "Confidence": 0.9989
                }
              ]
*/
export default class TranscriptEntity {
  category: string;
  confidence: number;
  content: string;
  endTimeMs: number;
  startTimeMs: number;
  type?: string;
}
