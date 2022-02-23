// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import LogLevel from '../../src/logger/LogLevel';
import NoOpLogger from '../../src/logger/NoOpLogger';
import ZLIBTextCompressor from '../../src/sdp/ZLIBTextCompressor';

describe('ZLIBTextCompressor', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const originalText =
    'v=0\r\no=mozilla-chrome 6732224067497618380 v=0\r\no=mozilla-chrome 673222406749761211';
  const dictionary = 'v=0\r\no=mozilla-chrome 6732224067497618380';

  let text_compressor: ZLIBTextCompressor;

  beforeEach(() => {
    text_compressor = new ZLIBTextCompressor(new NoOpLogger(LogLevel.DEBUG));
  });

  it('the compressed text should be less than the original string', () => {
    const compressedText = text_compressor.compress(originalText, dictionary);
    expect(compressedText.length).to.be.lessThan(originalText.length);
  });

  it('compression is performed with empty dictionary', () => {
    const emptyDictionary = '';
    const compressedText = text_compressor.compress(originalText, emptyDictionary);
    expect(compressedText.length).to.be.lessThan(originalText.length);
  });

  it('the decompressed string is same as the original string', () => {
    const compressedText = text_compressor.compress(originalText, dictionary);
    expect(compressedText.length).to.be.lessThan(originalText.length);

    const decompressedText = text_compressor.decompress(compressedText, dictionary);
    expect(decompressedText).to.be.equal(originalText);
  });

  it('compression/decompression of data which is greater than 32KB ', () => {
    const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const dataSize = 40000; // 40 KB
    let data = '';
    let dict = '';

    for (let i = 0; i < dataSize; i++) {
      data += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
      dict += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    }

    const compressedText = text_compressor.compress(data, dict);
    expect(compressedText.length).to.be.lessThan(data.length);

    const decompressedText = text_compressor.decompress(compressedText, dict);
    expect(decompressedText).to.be.equal(data);
  });

  it('the decompressed string can be obtained from an empty dictionary', () => {
    const emptyDictionary = '';
    const compressedText = text_compressor.compress(originalText, emptyDictionary);
    expect(compressedText.length).to.be.lessThan(originalText.length);

    const decompressedText = text_compressor.decompress(compressedText, emptyDictionary);
    expect(decompressedText).to.be.equal(originalText);
  });

  it('the decompressed string is different when a random dictionary is used', () => {
    const compressedText = text_compressor.compress(originalText, dictionary);
    expect(compressedText.length).to.be.lessThan(originalText.length);

    const randomDictionary = 'random';
    const decompressedText = text_compressor.decompress(compressedText, randomDictionary);
    expect(decompressedText).to.be.not.equal(originalText);
  });
});
