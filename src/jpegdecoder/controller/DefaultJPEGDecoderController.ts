// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../../logger/Logger';
import DefaultJPEGDecoderInstance from '../instance/DefaultJPEGDecoderInstance';
import JPEGDecoderInstance from '../instance/JPEGDecoderInstance';
import JPEGDecoderInput from '../webassembly/JPEGDecoderInput';
import JPEGDecoderModule from '../webassembly/JPEGDecoderModule';
import JPEGDecoderController from './JPEGDecoderController';

export default class DefaultJPEGDecoderController implements JPEGDecoderController {
  private decoderInput: JPEGDecoderInput | null = null;
  private jpegDecoderModule: JPEGDecoderModule | null = null;

  constructor(private logger: Logger, private maxInputSize: number) {}

  async init(): Promise<void> {
    this.logger.info('loading JPEGDecoder WebAssembly module');
    this.jpegDecoderModule = new JPEGDecoderModule(this.logger);
    await this.jpegDecoderModule.init();
    this.logger.info('loaded JPEGDecoder WebAssembly module');
    this.decoderInput = new JPEGDecoderInput(this.jpegDecoderModule, this.maxInputSize);
  }

  free(): void {
    this.decoderInput.free();
    this.jpegDecoderModule.free();
    this.decoderInput = null;
    this.jpegDecoderModule = null;
  }

  createInstance(width: number, height: number): JPEGDecoderInstance {
    return new DefaultJPEGDecoderInstance(this.jpegDecoderModule, this, width, height);
  }

  newInternalInputView(): Uint8Array {
    return new Uint8Array(
      this.jpegDecoderModule.wasm().memory.buffer,
      this.decoderInput.inputPointer(),
      this.maxInputSize
    );
  }

  newInternalOutputView(pointer: number, length: number): Uint8ClampedArray {
    return new Uint8ClampedArray(this.jpegDecoderModule.wasm().memory.buffer, pointer, length);
  }

  inputPointer(): number {
    return this.decoderInput.inputPointer();
  }

  isInputTooLarge(inputLength: number): boolean {
    return inputLength > this.maxInputSize;
  }
}
