// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import JPEGDecoderModule from './JPEGDecoderModule';

export default class JPEGDecoder {
  private pointer = 0;
  private module: JPEGDecoderModule | null = null;

  constructor(module: JPEGDecoderModule, width: number, height: number) {
    this.module = module;
    this.pointer = this.module.wasm().jpegdecoder_new(width, height);
  }

  free(): void {
    this.module.wasm().__wbg_jpegdecoder_free(this.pointer);
    this.pointer = 0;
    this.module = null;
  }

  outputPointer(): number {
    return this.module.wasm().jpegdecoder_output_ptr(this.pointer);
  }

  decode(inputPointer: number, inputLength: number): boolean {
    return this.module.wasm().jpegdecoder_decode(this.pointer, inputPointer, inputLength) !== 0;
  }

  width(): number {
    return this.module.wasm().jpegdecoder_width(this.pointer);
  }

  height(): number {
    return this.module.wasm().jpegdecoder_height(this.pointer);
  }
}
