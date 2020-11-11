// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// The Modality type is a backwards-compatible extension of the
// profile id (UUID string) and session token schemas (base 64 string).
// It appends #<modality> to the string, which indicates the modality
// of the participant.
export default interface Modality {
  /**
   * The participant Id
   */
  id(): string;

  /**
   * The base of the Id
   */
  base(): string;

  /**
   * The modality of the Id
   */
  modality(): string;

  /**
   * Check whether the current Id contains the input modality
   */
  hasModality(modality: string): boolean;

  /**
   * Create a new Id using the base of the current Id and the input modality
   */
  withModality(modality: string): Modality;
}
