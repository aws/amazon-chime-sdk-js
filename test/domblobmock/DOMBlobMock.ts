// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default class DOMBlobMock implements Blob {
  get size(): number {
    return 0;
  }

  get type(): string {
    return '';
  }

  constructor(public readonly blobParts?: BlobPart[], public readonly options?: BlobPropertyBag) {}

  slice(_start?: number, _end?: number, _contentType?: string): Blob {
    return new Blob();
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    throw new Error('Unimplemented.');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stream(): ReadableStream<any> {
    throw new Error('Unimplemented.');
  }

  text(): Promise<string> {
    throw new Error('Unimplemented.');
  }
}
