// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import JPEGDecoderModule from './JPEGDecoderModule';

export default class JPEGDecoderInput {
  private pointer = 0;
  private module: JPEGDecoderModule | null = null;

  constructor(module: JPEGDecoderModule, maxBytes: number) {
    this.module = module;
    this.pointer = this.module.wasm().jpegdecoderinput_new(maxBytes);
  }

  free(): void {
    this.module.wasm().__wbg_jpegdecoderinput_free(this.pointer);
    this.pointer = 0;
    this.module = null;
  }

  inputPointer(): number {
    return this.module.wasm().jpegdecoderinput_input_ptr(this.pointer);
  }
}
