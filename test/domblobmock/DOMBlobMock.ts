// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default class DOMBlobMock implements Blob {
  get size(): number {
    return 0;
  }

  get type(): string {
    return '';
  }

  constructor(readonly blobParts?: BlobPart[], readonly options?: BlobPropertyBag) {}

  slice(_start?: number, _end?: number, _contentType?: string): Blob {
    return new Blob();
  }
}
