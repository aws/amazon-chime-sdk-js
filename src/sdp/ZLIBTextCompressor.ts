// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const pako = require('pako');
import Logger from '../logger/Logger';

/**
 * [[ZLIBTextCompressor]] Performs the text compression and decompression using zlib
 */
export default class ZLIBTextCompressor {
  // The memory Level parameter specifies how much memory to use for the internal state.
  // Smaller values use less memory but are slower, while higher values use more memory
  // to gain compression speed.
  // Range is between 1 to 9
  private static Z_MEM_LEVEL: number = 9;

  // 32kB is the maximum dictionary size supported by the zlib format.
  private static MAX_DICTIONARY_SIZE: number = 31744; // 31 KB

  /**
   * Constructs an instance of [[ZLIBTextCompressor]]
   * @param logger
   */
  constructor(private logger: Logger) {}

  /**
   * Compresses the given text.
   *
   * Note: The dictionary used during compression should be the same as
   * that being used during decompression.
   *
   * @param text - the text that needs to be compressed
   * @param dictionary - that will be used to seed the compression
   *      library to improve compression's performance
   * @returns a compressed text
   */
  compress(text: string, dictionary: string): Uint8Array {
    if (dictionary.length > 0) {
      const dictionarySize = Math.min(dictionary.length, ZLIBTextCompressor.MAX_DICTIONARY_SIZE);
      dictionary = dictionary.slice(0, dictionarySize);
    }

    const options = {
      memLevel: ZLIBTextCompressor.Z_MEM_LEVEL,
      dictionary: dictionary,
    };

    const compressedText = pako.deflateRaw(text, options);
    return compressedText;
  }

  /**
   * Decompresses the given text and returns the original text.
   *
   * Note: The dictionary used during compression should be the same as
   * that being used during decompression.
   *
   * @param compressedText that will be decompressed
   * @param dictionary that will be used to seed the compression library to improve
   *      decompression's performance
   * @returns decompressed string
   */
  decompress(compressedText: Uint8Array, dictionary: string): string {
    if (dictionary.length > 0) {
      const dictionarySize = Math.min(dictionary.length, ZLIBTextCompressor.MAX_DICTIONARY_SIZE);
      dictionary = dictionary.slice(0, dictionarySize);
    }

    const options = {
      to: 'string',
      dictionary: dictionary,
      chunkSize: 4096,
    };

    let decompressedText = '';
    try {
      decompressedText = pako.inflateRaw(compressedText, options);
    } catch (ex) {
      this.logger.error(`failed to decompress the string with error: [${ex}]`);
    }
    return decompressedText;
  }
}
