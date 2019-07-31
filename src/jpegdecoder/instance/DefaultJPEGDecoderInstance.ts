// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DefaultJPEGDecoderController from '../controller/DefaultJPEGDecoderController';
import JPEGDecoder from '../webassembly/JPEGDecoder';
import JPEGDecoderModule from '../webassembly/JPEGDecoderModule';

export default class DefaultJPEGDecoderInstance {
  private decoder: JPEGDecoder | null = null;
  private controller: DefaultJPEGDecoderController | null = null;

  constructor(
    module: JPEGDecoderModule,
    controller: DefaultJPEGDecoderController,
    width: number,
    height: number
  ) {
    this.controller = controller;
    this.decoder = new JPEGDecoder(module, width, height);
  }

  free(): void {
    this.decoder.free();
    this.decoder = null;
    this.controller = null;
  }

  decodeToImageData(inputArray: Uint8Array): ImageData {
    if (this.controller.isInputTooLarge(inputArray.length)) {
      throw new Error(
        'buffer too large for jpeg decoder input buffer: ' + inputArray.length + ' bytes'
      );
    }
    const b = this.controller.newInternalInputView();
    const d = inputArray;
    const n = d.length;
    let i = 0;
    for (i = 0; i < n; i++) {
      b[i] = d[i];
    }
    const result = this.decoder.decode(this.controller.inputPointer(), inputArray.length);
    if (!result) {
      throw new Error('jpeg decoder failed for input: ' + inputArray);
    }
    const actualWidth: number = this.decoder.width();
    const actualHeight: number = this.decoder.height();
    const actualBytes: number = actualWidth * actualHeight * 4;
    const buffer: Uint8ClampedArray = this.controller.newInternalOutputView(
      this.decoder.outputPointer(),
      actualBytes
    );
    return new ImageData(buffer, actualWidth, actualHeight);
  }
}
