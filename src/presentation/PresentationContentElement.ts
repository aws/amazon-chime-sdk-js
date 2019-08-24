// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default interface PresentationContentElement {
  getPosition(): string;

  setPosition(position: string): void;

  getTranslations(): [number, number];

  setTranslations(translations: [number, number]): void;

  getDimensions(): [number, number];

  setDimensions(dimensions: [number, number]): void;
}
