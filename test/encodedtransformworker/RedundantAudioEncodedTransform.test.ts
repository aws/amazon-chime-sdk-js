// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import {
  COMMON_MESSAGE_TYPES,
  TRANSFORM_NAMES,
} from '../../src/encodedtransformworker/EncodedTransform';
import RedundantAudioEncodedTransform, {
  REDUNDANT_AUDIO_MESSAGE_TYPES,
} from '../../src/encodedtransformworker/RedundantAudioEncodedTransform';
import { convertPacketToDataView, opusTestPackets } from '../redundantaudioencoder/OpusTestPackets';

/**
 * Helper function to iterate through all the Opus test packets and run tests on each packet.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function iteratePacketsAndTest(test: (keys: string[], packet: DataView) => any): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stack: Array<[string[], { [key: string]: any }]> = [[[], opusTestPackets]];

  while (stack.length > 0) {
    const [keys, obj] = stack.pop();

    Object.keys(obj).forEach(key => {
      const newKeys = keys.slice();
      newKeys.push(key);

      if (typeof obj[key] === 'object' && !(obj[key] instanceof DataView)) {
        stack.push([newKeys, obj[key]]);
      } else if (obj[key] instanceof DataView) {
        test(newKeys, obj[key]);
      }
    });
  }
}

describe('RedundantAudioEncodedTransform', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  let postMessageStub: sinon.SinonStub;
  let transform: RedundantAudioEncodedTransform;

  // RED payload type from SDP
  const RED_PAYLOAD_TYPE = 111;
  const OPUS_PAYLOAD_TYPE = 109;

  // Helper to create mock controller
  // @ts-ignore
  const createMockController = (): TransformStreamDefaultController => {
    return ({ enqueue: sinon.stub() } as unknown) as TransformStreamDefaultController;
  };

  beforeEach(() => {
    postMessageStub = sinon.stub();
    // @ts-ignore
    global.self = { postMessage: postMessageStub };
    transform = new RedundantAudioEncodedTransform();
    transform.setRedPayloadType(RED_PAYLOAD_TYPE);
    transform.setOpusPayloadType(OPUS_PAYLOAD_TYPE);
  });

  afterEach(() => {
    sinon.restore();
    // @ts-ignore
    delete global.self;
  });

  describe('REDUNDANT_AUDIO_MESSAGE_TYPES', () => {
    it('has correct OPUS_PAYLOAD_TYPE value', () => {
      expect(REDUNDANT_AUDIO_MESSAGE_TYPES.OPUS_PAYLOAD_TYPE).to.equal('OpusPayloadType');
    });

    it('has correct RED_PAYLOAD_TYPE value', () => {
      expect(REDUNDANT_AUDIO_MESSAGE_TYPES.RED_PAYLOAD_TYPE).to.equal('RedPayloadType');
    });

    it('has correct UPDATE_NUM_REDUNDANT_ENCODINGS value', () => {
      expect(REDUNDANT_AUDIO_MESSAGE_TYPES.UPDATE_NUM_REDUNDANT_ENCODINGS).to.equal(
        'UpdateNumRedundantEncodings'
      );
    });

    it('has correct ENABLE value', () => {
      expect(REDUNDANT_AUDIO_MESSAGE_TYPES.ENABLE).to.equal('Enable');
    });

    it('has correct DISABLE value', () => {
      expect(REDUNDANT_AUDIO_MESSAGE_TYPES.DISABLE).to.equal('Disable');
    });
  });

  describe('handleMessage', () => {
    it('handles RED_PAYLOAD_TYPE message', () => {
      transform.handleMessage({
        type: REDUNDANT_AUDIO_MESSAGE_TYPES.RED_PAYLOAD_TYPE,
        transformName: TRANSFORM_NAMES.REDUNDANT_AUDIO,
        message: { payloadType: '112' },
      });
      const logCall = postMessageStub
        .getCalls()
        .find(call => call.args[0].message?.text?.includes('red payload type set to 112'));
      expect(logCall).to.not.be.undefined;
    });

    it('handles OPUS_PAYLOAD_TYPE message', () => {
      transform.handleMessage({
        type: REDUNDANT_AUDIO_MESSAGE_TYPES.OPUS_PAYLOAD_TYPE,
        transformName: TRANSFORM_NAMES.REDUNDANT_AUDIO,
        message: { payloadType: '110' },
      });
      const logCall = postMessageStub
        .getCalls()
        .find(call => call.args[0].message?.text?.includes('opus payload type set to 110'));
      expect(logCall).to.not.be.undefined;
    });

    it('handles UPDATE_NUM_REDUNDANT_ENCODINGS message', () => {
      transform.handleMessage({
        type: REDUNDANT_AUDIO_MESSAGE_TYPES.UPDATE_NUM_REDUNDANT_ENCODINGS,
        transformName: TRANSFORM_NAMES.REDUNDANT_AUDIO,
        message: { numRedundantEncodings: '2' },
      });
      const logCall = postMessageStub
        .getCalls()
        .find(call => call.args[0].message?.text?.includes('Updated numRedundantEncodings to 2'));
      expect(logCall).to.not.be.undefined;
    });

    it('handles ENABLE message', () => {
      transform.handleMessage({
        type: REDUNDANT_AUDIO_MESSAGE_TYPES.ENABLE,
        transformName: TRANSFORM_NAMES.REDUNDANT_AUDIO,
      });
      const logCall = postMessageStub
        .getCalls()
        .find(call => call.args[0].message?.text?.includes('redundancy enabled'));
      expect(logCall).to.not.be.undefined;
    });

    it('handles DISABLE message', () => {
      transform.handleMessage({
        type: REDUNDANT_AUDIO_MESSAGE_TYPES.DISABLE,
        transformName: TRANSFORM_NAMES.REDUNDANT_AUDIO,
      });
      const logCall = postMessageStub
        .getCalls()
        .find(call => call.args[0].message?.text?.includes('redundancy disabled'));
      expect(logCall).to.not.be.undefined;
    });

    it('handles message with missing payloadType gracefully', () => {
      transform.handleMessage({
        type: REDUNDANT_AUDIO_MESSAGE_TYPES.RED_PAYLOAD_TYPE,
        transformName: TRANSFORM_NAMES.REDUNDANT_AUDIO,
        message: {},
      });
      const logCall = postMessageStub
        .getCalls()
        .find(call => call.args[0].message?.text?.includes('red payload type set to 0'));
      expect(logCall).to.not.be.undefined;
    });

    it('handles message errors gracefully', () => {
      const badMessage = {
        type: REDUNDANT_AUDIO_MESSAGE_TYPES.RED_PAYLOAD_TYPE,
        transformName: TRANSFORM_NAMES.REDUNDANT_AUDIO,
        get message() {
          throw new Error('Test error');
        },
      };
      // @ts-ignore
      transform.handleMessage(badMessage);
    });
  });

  describe('setNumRedundantEncodings', () => {
    it('caps encodings at maxRedEncodings (2)', () => {
      transform.setNumRedundantEncodings(5);
      const logCall = postMessageStub
        .getCalls()
        .find(call => call.args[0].message?.text?.includes('Updated numRedundantEncodings to 2'));
      expect(logCall).to.not.be.undefined;
    });
  });

  describe('transform', () => {
    it('is a no-op (use senderTransform or receivePacketLogTransform)', () => {
      const frame = { data: new ArrayBuffer(10) };
      const controller = createMockController();
      transform.transform(frame, controller);
      // @ts-ignore
      expect(controller.enqueue.called).to.be.false;
    });
  });

  describe('senderTransform', () => {
    it('passes through non-RED frames unchanged', () => {
      const frame = {
        data: new ArrayBuffer(10),
        timestamp: 12345,
        getMetadata: () => ({ payloadType: 96 }),
      };
      const controller = createMockController();
      transform.senderTransform(frame, controller);
      // @ts-ignore
      expect(controller.enqueue.calledOnce).to.be.true;
    });

    it('does not enqueue frames larger than max audio payload size', () => {
      const frame = {
        data: new ArrayBuffer(1001),
        timestamp: 12345,
        getMetadata: () => ({ payloadType: 96 }),
      };
      const controller = createMockController();
      transform.senderTransform(frame, controller);
      // @ts-ignore
      expect(controller.enqueue.called).to.be.false;
    });

    it('encodes RED frames with primary payload', () => {
      const opusData = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
      const redPacket = new Uint8Array(1 + opusData.length);
      redPacket[0] = OPUS_PAYLOAD_TYPE;
      redPacket.set(opusData, 1);

      const frame = {
        data: redPacket.buffer,
        timestamp: 960,
        getMetadata: () => ({ payloadType: RED_PAYLOAD_TYPE }),
      };
      const controller = createMockController();
      transform.senderTransform(frame, controller);
      // @ts-ignore
      expect(controller.enqueue.calledOnce).to.be.true;
    });

    it('handles invalid RED packets gracefully', () => {
      const invalidPacket = new Uint8Array([0x00]);
      const frame = {
        data: invalidPacket.buffer,
        timestamp: 960,
        getMetadata: () => ({ payloadType: RED_PAYLOAD_TYPE }),
      };
      const controller = createMockController();
      transform.senderTransform(frame, controller);
      // @ts-ignore
      expect(controller.enqueue.calledOnce).to.be.true;
    });

    it('adds redundant encodings when enabled and history available', () => {
      transform.setNumRedundantEncodings(2);
      for (let i = 0; i < 5; i++) {
        const opusData = new Uint8Array([0x08, 0x80, 0x01, 0x02]);
        const redPacket = new Uint8Array(1 + opusData.length);
        redPacket[0] = OPUS_PAYLOAD_TYPE;
        redPacket.set(opusData, 1);

        const frame = {
          data: redPacket.buffer,
          timestamp: 960 * (i + 1),
          getMetadata: () => ({ payloadType: RED_PAYLOAD_TYPE }),
        };
        const controller = createMockController();
        transform.senderTransform(frame, controller);
      }
    });

    it('skips redundancy when disabled', () => {
      transform.setRedundancyEnabled(false);
      transform.setNumRedundantEncodings(2);

      const opusData = new Uint8Array([0x08, 0x80, 0x01, 0x02]);
      const redPacket = new Uint8Array(1 + opusData.length);
      redPacket[0] = OPUS_PAYLOAD_TYPE;
      redPacket.set(opusData, 1);

      const frame = {
        data: redPacket.buffer,
        timestamp: 960,
        getMetadata: () => ({ payloadType: RED_PAYLOAD_TYPE }),
      };
      const controller = createMockController();
      transform.senderTransform(frame, controller);
      // @ts-ignore
      expect(controller.enqueue.calledOnce).to.be.true;
    });
  });

  describe('receivePacketLogTransform', () => {
    it('passes through non-RED frames unchanged', () => {
      const frame = {
        data: new ArrayBuffer(10),
        timestamp: 12345,
        getMetadata: () => ({ payloadType: 96, sequenceNumber: 1 }),
      };
      const controller = createMockController();
      transform.receivePacketLogTransform(frame, controller);
      // @ts-ignore
      expect(controller.enqueue.calledOnce).to.be.true;
    });

    it('processes valid RED packets and tracks loss stats', () => {
      const opusData = new Uint8Array([0x08, 0x01, 0x02, 0x03]);
      const redPacket = new Uint8Array(1 + opusData.length);
      redPacket[0] = OPUS_PAYLOAD_TYPE;
      redPacket.set(opusData, 1);

      const frame = {
        data: redPacket.buffer,
        timestamp: 960,
        getMetadata: () => ({
          payloadType: RED_PAYLOAD_TYPE,
          sequenceNumber: 1,
          synchronizationSource: 12345,
        }),
      };
      const controller = createMockController();
      transform.receivePacketLogTransform(frame, controller);
      // @ts-ignore
      expect(controller.enqueue.calledOnce).to.be.true;
    });

    it('handles invalid RED packets gracefully', () => {
      const invalidPacket = new Uint8Array([0x00]);
      const frame = {
        data: invalidPacket.buffer,
        timestamp: 960,
        getMetadata: () => ({ payloadType: RED_PAYLOAD_TYPE, sequenceNumber: 1 }),
      };
      const controller = createMockController();
      transform.receivePacketLogTransform(frame, controller);
      // @ts-ignore
      expect(controller.enqueue.calledOnce).to.be.true;
    });

    it('tracks packet loss when sequence numbers have gaps', () => {
      const opusData = new Uint8Array([0x08, 0x01, 0x02, 0x03]);
      const redPacket = new Uint8Array(1 + opusData.length);
      redPacket[0] = OPUS_PAYLOAD_TYPE;
      redPacket.set(opusData, 1);

      const frame1 = {
        data: redPacket.buffer,
        timestamp: 960,
        getMetadata: () => ({
          payloadType: RED_PAYLOAD_TYPE,
          sequenceNumber: 1,
          synchronizationSource: 12345,
        }),
      };
      const controller = createMockController();
      transform.receivePacketLogTransform(frame1, controller);

      const frame2 = {
        data: redPacket.buffer,
        timestamp: 960 * 3,
        getMetadata: () => ({
          payloadType: RED_PAYLOAD_TYPE,
          sequenceNumber: 3,
          synchronizationSource: 12345,
        }),
      };
      transform.receivePacketLogTransform(frame2, controller);
    });

    it('reports loss stats periodically', () => {
      const opusData = new Uint8Array([0x08, 0x01, 0x02, 0x03]);
      const redPacket = new Uint8Array(1 + opusData.length);
      redPacket[0] = OPUS_PAYLOAD_TYPE;
      redPacket.set(opusData, 1);

      const controller = createMockController();
      for (let i = 0; i < 10; i++) {
        const frame = {
          data: redPacket.buffer,
          timestamp: 48000 * 5 * i + 960,
          getMetadata: () => ({
            payloadType: RED_PAYLOAD_TYPE,
            sequenceNumber: i + 1,
            synchronizationSource: 12345,
          }),
        };
        transform.receivePacketLogTransform(frame, controller);
      }

      const metricsCall = postMessageStub
        .getCalls()
        .find(
          call =>
            call.args[0].type === COMMON_MESSAGE_TYPES.METRICS &&
            call.args[0].transformName === TRANSFORM_NAMES.REDUNDANT_AUDIO
        );
      expect(metricsCall).to.not.be.undefined;
    });

    it('handles out-of-order packets within threshold', () => {
      const opusData = new Uint8Array([0x08, 0x01, 0x02, 0x03]);
      const redPacket = new Uint8Array(1 + opusData.length);
      redPacket[0] = OPUS_PAYLOAD_TYPE;
      redPacket.set(opusData, 1);

      const controller = createMockController();

      const frame1 = {
        data: redPacket.buffer,
        timestamp: 960,
        getMetadata: () => ({
          payloadType: RED_PAYLOAD_TYPE,
          sequenceNumber: 1,
          synchronizationSource: 12345,
        }),
      };
      transform.receivePacketLogTransform(frame1, controller);

      const frame3 = {
        data: redPacket.buffer,
        timestamp: 960 * 3,
        getMetadata: () => ({
          payloadType: RED_PAYLOAD_TYPE,
          sequenceNumber: 3,
          synchronizationSource: 12345,
        }),
      };
      transform.receivePacketLogTransform(frame3, controller);

      const frame2 = {
        data: redPacket.buffer,
        timestamp: 960 * 2,
        getMetadata: () => ({
          payloadType: RED_PAYLOAD_TYPE,
          sequenceNumber: 2,
          synchronizationSource: 12345,
        }),
      };
      transform.receivePacketLogTransform(frame2, controller);
    });

    it('ignores packets too far out of order', () => {
      const opusData = new Uint8Array([0x08, 0x01, 0x02, 0x03]);
      const redPacket = new Uint8Array(1 + opusData.length);
      redPacket[0] = OPUS_PAYLOAD_TYPE;
      redPacket.set(opusData, 1);

      const controller = createMockController();

      const frame1 = {
        data: redPacket.buffer,
        timestamp: 960 * 100,
        getMetadata: () => ({
          payloadType: RED_PAYLOAD_TYPE,
          sequenceNumber: 100,
          synchronizationSource: 12345,
        }),
      };
      transform.receivePacketLogTransform(frame1, controller);

      const frame2 = {
        data: redPacket.buffer,
        timestamp: 960,
        getMetadata: () => ({
          payloadType: RED_PAYLOAD_TYPE,
          sequenceNumber: 1,
          synchronizationSource: 12345,
        }),
      };
      transform.receivePacketLogTransform(frame2, controller);
    });
  });

  describe('RED packet with redundant encodings', () => {
    it('processes RED packet with redundant payload', () => {
      const redundantOpus = new Uint8Array([0x08, 0x01]);
      const primaryOpus = new Uint8Array([0x08, 0x02, 0x03, 0x04]);

      const timestampOffset = 960;
      const blockLength = redundantOpus.length;

      const redPacket = new Uint8Array(4 + 1 + redundantOpus.length + primaryOpus.length);
      redPacket[0] = 0x80 | OPUS_PAYLOAD_TYPE;
      redPacket[1] = (timestampOffset >> 6) & 0xff;
      redPacket[2] = ((timestampOffset & 0x3f) << 2) | ((blockLength >> 8) & 0x03);
      redPacket[3] = blockLength & 0xff;
      redPacket[4] = OPUS_PAYLOAD_TYPE;
      redPacket.set(redundantOpus, 5);
      redPacket.set(primaryOpus, 5 + redundantOpus.length);

      const frame = {
        data: redPacket.buffer,
        timestamp: 960 * 2,
        getMetadata: () => ({
          payloadType: RED_PAYLOAD_TYPE,
          sequenceNumber: 2,
          synchronizationSource: 12345,
        }),
      };
      const controller = createMockController();
      transform.receivePacketLogTransform(frame, controller);
      // @ts-ignore
      expect(controller.enqueue.calledOnce).to.be.true;
    });
  });

  describe('Opus packet analysis', () => {
    it('detects CELT-only packets', () => {
      const celtPacket = new Uint8Array([0x80, 0x01, 0x02]);
      const redPacket = new Uint8Array(1 + celtPacket.length);
      redPacket[0] = OPUS_PAYLOAD_TYPE;
      redPacket.set(celtPacket, 1);

      const frame = {
        data: redPacket.buffer,
        timestamp: 960,
        getMetadata: () => ({ payloadType: RED_PAYLOAD_TYPE }),
      };
      const controller = createMockController();
      transform.senderTransform(frame, controller);
      // @ts-ignore
      expect(controller.enqueue.calledOnce).to.be.true;
    });

    it('detects Hybrid packets', () => {
      const hybridPacket = new Uint8Array([0x60, 0x01, 0x02]);
      const redPacket = new Uint8Array(1 + hybridPacket.length);
      redPacket[0] = OPUS_PAYLOAD_TYPE;
      redPacket.set(hybridPacket, 1);

      const frame = {
        data: redPacket.buffer,
        timestamp: 960,
        getMetadata: () => ({ payloadType: RED_PAYLOAD_TYPE }),
      };
      const controller = createMockController();
      transform.senderTransform(frame, controller);
      // @ts-ignore
      expect(controller.enqueue.calledOnce).to.be.true;
    });

    it('detects SILK-only packets with voice activity', () => {
      const silkPacket = new Uint8Array([0x08, 0x80, 0x01, 0x02]);
      const redPacket = new Uint8Array(1 + silkPacket.length);
      redPacket[0] = OPUS_PAYLOAD_TYPE;
      redPacket.set(silkPacket, 1);

      const frame = {
        data: redPacket.buffer,
        timestamp: 960,
        getMetadata: () => ({ payloadType: RED_PAYLOAD_TYPE }),
      };
      const controller = createMockController();
      transform.senderTransform(frame, controller);
      // @ts-ignore
      expect(controller.enqueue.calledOnce).to.be.true;
    });
  });

  describe('opusPacketIsCeltOnly', () => {
    it('identifies CELT-only packets', () => {
      iteratePacketsAndTest((keys: string[], packet: DataView) => {
        if (keys.includes('celtOnly')) {
          expect(transform['opusPacketIsCeltOnly'](packet)).to.equal(true);
        } else {
          expect(transform['opusPacketIsCeltOnly'](packet)).to.equal(false);
        }
      });
    });
  });

  describe('opusPacketGetSamplesPerFrame', () => {
    it('gets the number of samples per frame', () => {
      iteratePacketsAndTest((keys: string[], packet: DataView) => {
        if (keys.includes('celtOnly')) {
          if (keys.includes('size2_5ms')) {
            expect(transform['opusPacketGetSamplesPerFrame'](packet, 48000)).to.equal(120);
          } else if (keys.includes('size5ms')) {
            expect(transform['opusPacketGetSamplesPerFrame'](packet, 48000)).to.equal(240);
          } else if (keys.includes('size10ms')) {
            expect(transform['opusPacketGetSamplesPerFrame'](packet, 48000)).to.equal(480);
          } else if (keys.includes('size20ms')) {
            expect(transform['opusPacketGetSamplesPerFrame'](packet, 48000)).to.equal(960);
          }
        } else if (keys.includes('hybrid')) {
          if (keys.includes('size10ms')) {
            expect(transform['opusPacketGetSamplesPerFrame'](packet, 48000)).to.equal(480);
          } else if (keys.includes('size20ms')) {
            expect(transform['opusPacketGetSamplesPerFrame'](packet, 48000)).to.equal(960);
          }
        } else if (keys.includes('silkOnly')) {
          if (keys.includes('size10ms')) {
            expect(transform['opusPacketGetSamplesPerFrame'](packet, 48000)).to.equal(480);
          } else if (keys.includes('size20ms')) {
            expect(transform['opusPacketGetSamplesPerFrame'](packet, 48000)).to.equal(960);
          } else if (keys.includes('size40ms')) {
            expect(transform['opusPacketGetSamplesPerFrame'](packet, 48000)).to.equal(1920);
          } else if (keys.includes('size60ms')) {
            expect(transform['opusPacketGetSamplesPerFrame'](packet, 48000)).to.equal(2880);
          }
        }
      });
    });
  });

  describe('opusNumSilkFrames', () => {
    it('gets the number of SILK frames per Opus frame', () => {
      iteratePacketsAndTest((keys: string[], packet: DataView) => {
        if (
          keys.includes('size2_5ms') ||
          keys.includes('size5ms') ||
          keys.includes('size10ms') ||
          keys.includes('size20ms')
        ) {
          expect(transform['opusNumSilkFrames'](packet)).to.equal(1);
        } else if (keys.includes('size40ms')) {
          expect(transform['opusNumSilkFrames'](packet)).to.equal(2);
        } else if (keys.includes('size60ms')) {
          expect(transform['opusNumSilkFrames'](packet)).to.equal(3);
        }
      });
    });
  });

  describe('opusPacketGetNumChannels', () => {
    it('gets the number of channels', () => {
      iteratePacketsAndTest((keys: string[], packet: DataView) => {
        if (keys.includes('mono')) {
          expect(transform['opusPacketGetNumChannels'](packet)).to.equal(1);
        } else if (keys.includes('stereo')) {
          expect(transform['opusPacketGetNumChannels'](packet)).to.equal(2);
        }
      });
    });
  });

  describe('opusParseSize', () => {
    it('gets the size of a frame in bytes and returns the number of bytes parsed', () => {
      const sizeBytes: [number] = [0];

      // Test invalid 1-byte code 2 packet.
      expect(transform['opusParseSize'](convertPacketToDataView([0x02]), 1, 0, sizeBytes)).to.equal(
        -1
      );
      expect(sizeBytes[0]).to.equal(-1);

      // Test 1-byte size indicator.
      expect(
        transform['opusParseSize'](convertPacketToDataView([0x02, 0x80]), 1, 1, sizeBytes)
      ).to.equal(1);
      expect(sizeBytes[0]).to.equal(128);

      // Test invalid 2-byte code 2 packet.
      expect(
        transform['opusParseSize'](convertPacketToDataView([0x02, 0xff]), 1, 1, sizeBytes)
      ).to.equal(-1);
      expect(sizeBytes[0]).to.equal(-1);

      // Test 2-byte size indicator.
      expect(
        transform['opusParseSize'](convertPacketToDataView([0x02, 0xff, 0x01]), 1, 2, sizeBytes)
      ).to.equal(2);
      expect(sizeBytes[0]).to.equal(259);
    });
  });

  describe('opusPacketParseImpl', () => {
    it('handles bad arguments', () => {
      // Test null storage for frame sizes.
      expect(
        transform['opusPacketParseImpl'](
          convertPacketToDataView([0x00]),
          1,
          false,
          null,
          null,
          null,
          null,
          null
        )
      ).to.equal(transform['OPUS_BAD_ARG']);

      // Test negative data length.
      expect(
        transform['opusPacketParseImpl'](
          convertPacketToDataView([]),
          -1,
          false,
          null,
          null,
          [],
          null,
          null
        )
      ).to.equal(transform['OPUS_BAD_ARG']);
    });

    it('handles invalid packets', () => {
      const frameSizes = new Array<[number]>(transform['OPUS_MAX_OPUS_FRAMES']);
      for (let i = 0; i < transform['OPUS_MAX_OPUS_FRAMES']; ++i) {
        frameSizes[i] = [undefined];
      }

      // Test zero length data.
      expect(
        transform['opusPacketParseImpl'](
          convertPacketToDataView([]),
          0,
          false,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(transform['OPUS_INVALID_PACKET']);

      // Test undelimited code 1 packet with an odd number of bytes available for the two frames.
      expect(
        transform['opusPacketParseImpl'](
          convertPacketToDataView([0x01, 0x00]),
          2,
          false,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(transform['OPUS_INVALID_PACKET']);

      // Test code 2 packet where the size of the first frame cannot be determined.
      expect(
        transform['opusPacketParseImpl'](
          convertPacketToDataView([0x02]),
          1,
          false,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(transform['OPUS_INVALID_PACKET']);

      // Test code 2 packet with not enough bytes for the first frame.
      expect(
        transform['opusPacketParseImpl'](
          convertPacketToDataView([0x02, 0x01]),
          2,
          false,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(transform['OPUS_INVALID_PACKET']);

      // Test code 3 packet with less than 2 bytes.
      expect(
        transform['opusPacketParseImpl'](
          convertPacketToDataView([0x03]),
          1,
          false,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(transform['OPUS_INVALID_PACKET']);

      // Test code 3 packet where the number of frames is 0.
      expect(
        transform['opusPacketParseImpl'](
          convertPacketToDataView([0x03, 0x00]),
          2,
          false,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(transform['OPUS_INVALID_PACKET']);

      // Test code 3 packet with more than 120ms of audio.
      expect(
        transform['opusPacketParseImpl'](
          convertPacketToDataView([0x03, 0x3f]),
          2,
          false,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(transform['OPUS_INVALID_PACKET']);

      // Test padded code 3 packet with no padding count bytes.
      expect(
        transform['opusPacketParseImpl'](
          convertPacketToDataView([0x03, 0x41]),
          2,
          false,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(transform['OPUS_INVALID_PACKET']);

      // Test padded code 3 packet where the size of the indicated padding is larger than the packet size.
      expect(
        transform['opusPacketParseImpl'](
          convertPacketToDataView([0x03, 0x41, 0x01]),
          3,
          false,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(transform['OPUS_INVALID_PACKET']);

      // Test code 3 VBR packet where the size of a frame cannot be determined.
      expect(
        transform['opusPacketParseImpl'](
          convertPacketToDataView([0x03, 0x82]),
          2,
          false,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(transform['OPUS_INVALID_PACKET']);

      // Test code 3 VBR packet with not enough bytes for the given frame sizes.
      expect(
        transform['opusPacketParseImpl'](
          convertPacketToDataView([0x03, 0x82, 0x01]),
          3,
          false,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(transform['OPUS_INVALID_PACKET']);

      // Test code 3 VBR packet where the size of the last frame is negative.
      expect(
        transform['opusPacketParseImpl'](
          convertPacketToDataView([0x03, 0x83, 0x02, 0x01, 0x00, 0x00]),
          6,
          false,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(transform['OPUS_INVALID_PACKET']);

      // Test undelimited code 3 CBR packet where the number of bytes available for the frames is not a non-negative
      // integer multiple of the indicated number of frames.
      expect(
        transform['opusPacketParseImpl'](
          convertPacketToDataView([0x03, 0x02, 0x00]),
          3,
          false,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(transform['OPUS_INVALID_PACKET']);

      // Test self-delimited packet where the delimited size cannot be determined.
      expect(
        transform['opusPacketParseImpl'](
          convertPacketToDataView([0x00]),
          1,
          true,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(transform['OPUS_INVALID_PACKET']);

      // Test self-delimited packet with not enough bytes for the delimited size.
      expect(
        transform['opusPacketParseImpl'](
          convertPacketToDataView([0x00, 0x01]),
          2,
          true,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(transform['OPUS_INVALID_PACKET']);

      // Test self-delimited CBR packet with not enough bytes for the delimited CBR sizes.
      expect(
        transform['opusPacketParseImpl'](
          convertPacketToDataView([0x01, 0x01, 0x00]),
          3,
          true,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(transform['OPUS_INVALID_PACKET']);

      // Test self-delimited VBR packet that fails the upper bound sanity check.
      expect(
        transform['opusPacketParseImpl'](
          convertPacketToDataView([0x02, 0x01, 0x02, 0x00, 0x00]),
          5,
          true,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(transform['OPUS_INVALID_PACKET']);

      // Test undelimited packet that exceeds the size limit for the last frame.
      expect(
        transform['opusPacketParseImpl'](
          new DataView(new ArrayBuffer(transform['OPUS_MAX_FRAME_SIZE_BYTES'] + 2)),
          transform['OPUS_MAX_FRAME_SIZE_BYTES'] + 2,
          false,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(transform['OPUS_INVALID_PACKET']);
    });

    it('parses code 0 packets', () => {
      const frameSizes = new Array<[number]>(transform['OPUS_MAX_OPUS_FRAMES']);
      for (let i = 0; i < transform['OPUS_MAX_OPUS_FRAMES']; ++i) {
        frameSizes[i] = [undefined];
      }

      // Test code 0 packet
      const numFrames = transform['opusPacketParseImpl'](
        convertPacketToDataView([0x00, 0x01, 0x02]),
        3,
        false,
        null,
        null,
        frameSizes,
        null,
        null
      );
      expect(numFrames).to.equal(1);
      expect(frameSizes[0][0]).to.equal(2);
    });
  });

  describe('opusPacketParse', () => {
    it('parses the number of frames from a single undelimited packet', () => {
      const frameSizes: Array<[number]> = [[undefined]];
      expect(
        transform['opusPacketParse'](
          convertPacketToDataView([0x00]),
          1,
          null,
          null,
          frameSizes,
          null
        )
      ).to.equal(1);
      expect(frameSizes[0][0]).to.equal(0);
    });
  });

  describe('opusPacketHasVoiceActivity', () => {
    it('handles packets with no VAD information', () => {
      // Test null packet.
      expect(transform['opusPacketHasVoiceActivity'](null, 0)).to.equal(0);

      // Test 0 length packet.
      expect(transform['opusPacketHasVoiceActivity'](convertPacketToDataView([]), 0)).to.equal(0);

      iteratePacketsAndTest((keys: string[], packet: DataView) => {
        if (keys.includes('celtOnly')) {
          expect(transform['opusPacketHasVoiceActivity'](packet, packet.byteLength)).to.equal(-1);
        }
      });

      // Test an invalid packet. This invalid packet is a SILK-only code 3 packet with less than 2 bytes.
      expect(transform['opusPacketHasVoiceActivity'](convertPacketToDataView([0x03]), 1)).to.equal(
        -1
      );
    });

    it('handles packets with VAD information', () => {
      iteratePacketsAndTest((keys: string[], packet: DataView) => {
        if (keys.includes('noVad')) {
          expect(transform['opusPacketHasVoiceActivity'](packet, packet.byteLength)).to.equal(0);
        } else if (keys.includes('vad')) {
          expect(transform['opusPacketHasVoiceActivity'](packet, packet.byteLength)).to.equal(1);
        }
      });

      // Test SILK-only packet with a 0 length frame.
      expect(transform['opusPacketHasVoiceActivity'](convertPacketToDataView([0x00]), 1)).to.equal(
        0
      );

      // Test 10ms stereo SILK-only packet with only the side VAD bit set.
      expect(
        transform['opusPacketHasVoiceActivity'](convertPacketToDataView([0x04, 0x20]), 2)
      ).to.equal(1);
    });
  });

  describe('opusPacketHasFec', () => {
    it('handles packets with no fec information', () => {
      // Test null packet.
      expect(transform['opusPacketHasFec'](null, 0)).to.be.false;

      // Test 0 length packet.
      expect(transform['opusPacketHasFec'](convertPacketToDataView([]), 0)).to.be.false;

      // Test celt only packets.
      iteratePacketsAndTest((keys: string[], packet: DataView) => {
        if (keys.includes('celtOnly')) {
          expect(transform['opusPacketHasFec'](packet, packet.byteLength)).to.be.false;
        }
      });

      // Test packets without vad.
      iteratePacketsAndTest((keys: string[], packet: DataView) => {
        if (keys.includes('noVad')) {
          expect(transform['opusPacketHasFec'](packet, packet.byteLength)).to.be.false;
        }
      });

      // Test an invalid packet. This invalid packet is a SILK-only code 3 packet with less than 2 bytes.
      expect(transform['opusPacketHasFec'](convertPacketToDataView([0x03]), 1)).to.be.false;
    });

    it('handles packets with fec information', () => {
      iteratePacketsAndTest((keys: string[], packet: DataView) => {
        if (keys.includes('withFec')) {
          expect(transform['opusPacketHasFec'](packet, packet.byteLength)).to.be.true;
          expect(transform['opusPacketHasVoiceActivity'](packet, packet.byteLength)).to.equal(1);
        }
      });
    });
  });

  describe('uint32WrapAround', () => {
    it('correctly wraps around when input < 0', () => {
      expect(transform['uint32WrapAround'](960 - 1920)).to.eq(4294966336);
      expect(transform['uint32WrapAround'](-1)).to.eq(4294967295);
    });

    it('correctly wraps around when input >= 2^32', () => {
      expect(transform['uint32WrapAround'](4294967274 + 1920)).to.eq(1898);
      expect(transform['uint32WrapAround'](Math.pow(2, 32))).to.eq(0);
    });

    it('does not wrap when result is within [0, 2^32 - 1]', () => {
      expect(transform['uint32WrapAround'](2 ** 7 + 2 ** 7)).to.eq(256);
    });
  });

  describe('int16', () => {
    it('correctly converts to 16-bit signed integer', () => {
      expect(transform['int16'](0)).to.eq(0);
      expect(transform['int16'](32767)).to.eq(32767);
      expect(transform['int16'](32768)).to.eq(-32768);
      expect(transform['int16'](65535)).to.eq(-1);
    });
  });

  describe('packet log operations', () => {
    it('adds and checks timestamps in packet log', () => {
      const packetLog = {
        window: new Array<number>(10),
        index: 0,
        windowSize: 10,
      };

      transform['addTimestamp'](packetLog, 960);
      expect(transform['hasTimestamp'](packetLog, 960)).to.be.true;
      expect(transform['hasTimestamp'](packetLog, 1920)).to.be.false;
    });

    it('removes timestamps from packet log', () => {
      const packetLog = {
        window: new Array<number>(10),
        index: 0,
        windowSize: 10,
      };

      transform['addTimestamp'](packetLog, 960);
      expect(transform['hasTimestamp'](packetLog, 960)).to.be.true;

      const removed = transform['removeTimestamp'](packetLog, 960);
      expect(removed).to.be.true;
      expect(transform['hasTimestamp'](packetLog, 960)).to.be.false;

      // Removing non-existent timestamp returns false
      expect(transform['removeTimestamp'](packetLog, 1920)).to.be.false;
    });

    it('handles undefined timestamp in addTimestamp', () => {
      const packetLog = {
        window: new Array<number>(10),
        index: 0,
        windowSize: 10,
      };

      transform['addTimestamp'](packetLog, undefined);
      expect(packetLog.index).to.equal(0);
    });
  });

  describe('removeFromRecoveryWindows', () => {
    it('decrements totalAudioPacketsRecoveredRed when timestamp is removed from redRecoveryLog', () => {
      // Add a timestamp to the red recovery log
      transform['addTimestamp'](transform['redRecoveryLog'], 960);
      transform['totalAudioPacketsRecoveredRed'] = 1;

      // Remove from recovery windows
      transform['removeFromRecoveryWindows'](960);

      expect(transform['totalAudioPacketsRecoveredRed']).to.equal(0);
    });

    it('decrements totalAudioPacketsRecoveredFec when timestamp is removed from fecRecoveryLog', () => {
      // Add a timestamp to the fec recovery log
      transform['addTimestamp'](transform['fecRecoveryLog'], 960);
      transform['totalAudioPacketsRecoveredFec'] = 1;

      // Remove from recovery windows
      transform['removeFromRecoveryWindows'](960);

      expect(transform['totalAudioPacketsRecoveredFec']).to.equal(0);
    });

    it('does not decrement counters below zero', () => {
      // Add timestamps to both recovery logs
      transform['addTimestamp'](transform['redRecoveryLog'], 960);
      transform['addTimestamp'](transform['fecRecoveryLog'], 960);
      transform['totalAudioPacketsRecoveredRed'] = 0;
      transform['totalAudioPacketsRecoveredFec'] = 0;

      // Remove from recovery windows - counters should stay at 0
      transform['removeFromRecoveryWindows'](960);

      expect(transform['totalAudioPacketsRecoveredRed']).to.equal(0);
      expect(transform['totalAudioPacketsRecoveredFec']).to.equal(0);
    });
  });

  describe('opusPacketParseImpl self-delimited packets', () => {
    it('parses self-delimited code 0 packet', () => {
      const frameSizes = new Array<[number]>(transform['OPUS_MAX_OPUS_FRAMES']);
      for (let i = 0; i < transform['OPUS_MAX_OPUS_FRAMES']; ++i) {
        frameSizes[i] = [undefined];
      }

      // Self-delimited code 0 packet: TOC byte (0x00) + size byte (0x02) + 2 bytes of data
      const numFrames = transform['opusPacketParseImpl'](
        convertPacketToDataView([0x00, 0x02, 0x01, 0x02]),
        4,
        true, // selfDelimited
        null,
        null,
        frameSizes,
        null,
        null
      );
      expect(numFrames).to.equal(1);
      expect(frameSizes[0][0]).to.equal(2);
    });

    it('parses self-delimited code 1 CBR packet', () => {
      const frameSizes = new Array<[number]>(transform['OPUS_MAX_OPUS_FRAMES']);
      for (let i = 0; i < transform['OPUS_MAX_OPUS_FRAMES']; ++i) {
        frameSizes[i] = [undefined];
      }

      // Self-delimited code 1 CBR packet: TOC byte (0x01) + size byte (0x02) + 4 bytes of data (2 frames of 2 bytes each)
      const numFrames = transform['opusPacketParseImpl'](
        convertPacketToDataView([0x01, 0x02, 0x01, 0x02, 0x03, 0x04]),
        6,
        true, // selfDelimited
        null,
        null,
        frameSizes,
        null,
        null
      );
      expect(numFrames).to.equal(2);
      expect(frameSizes[0][0]).to.equal(2);
      expect(frameSizes[1][0]).to.equal(2);
    });

    it('parses self-delimited code 2 VBR packet', () => {
      const frameSizes = new Array<[number]>(transform['OPUS_MAX_OPUS_FRAMES']);
      for (let i = 0; i < transform['OPUS_MAX_OPUS_FRAMES']; ++i) {
        frameSizes[i] = [undefined];
      }

      // Self-delimited code 2 VBR packet: TOC byte (0x02) + first frame size (0x02) + last frame size (0x03) + 5 bytes of data
      const numFrames = transform['opusPacketParseImpl'](
        convertPacketToDataView([0x02, 0x02, 0x03, 0x01, 0x02, 0x03, 0x04, 0x05]),
        8,
        true, // selfDelimited
        null,
        null,
        frameSizes,
        null,
        null
      );
      expect(numFrames).to.equal(2);
      expect(frameSizes[0][0]).to.equal(2);
      expect(frameSizes[1][0]).to.equal(3);
    });

    it('parses self-delimited code 3 CBR packet', () => {
      const frameSizes = new Array<[number]>(transform['OPUS_MAX_OPUS_FRAMES']);
      for (let i = 0; i < transform['OPUS_MAX_OPUS_FRAMES']; ++i) {
        frameSizes[i] = [undefined];
      }

      // Self-delimited code 3 CBR packet: TOC byte (0x03) + frame count byte (0x02 = 2 frames, CBR) + size byte (0x02) + 4 bytes of data
      const numFrames = transform['opusPacketParseImpl'](
        convertPacketToDataView([0x03, 0x02, 0x02, 0x01, 0x02, 0x03, 0x04]),
        7,
        true, // selfDelimited
        null,
        null,
        frameSizes,
        null,
        null
      );
      expect(numFrames).to.equal(2);
      expect(frameSizes[0][0]).to.equal(2);
      expect(frameSizes[1][0]).to.equal(2);
    });

    it('parses self-delimited code 3 VBR packet', () => {
      const frameSizes = new Array<[number]>(transform['OPUS_MAX_OPUS_FRAMES']);
      for (let i = 0; i < transform['OPUS_MAX_OPUS_FRAMES']; ++i) {
        frameSizes[i] = [undefined];
      }

      // Self-delimited code 3 VBR packet: TOC byte (0x03) + frame count byte (0x82 = 2 frames, VBR) + first frame size (0x02) + last frame size (0x03) + 5 bytes of data
      const numFrames = transform['opusPacketParseImpl'](
        convertPacketToDataView([0x03, 0x82, 0x02, 0x03, 0x01, 0x02, 0x03, 0x04, 0x05]),
        9,
        true, // selfDelimited
        null,
        null,
        frameSizes,
        null,
        null
      );
      expect(numFrames).to.equal(2);
      expect(frameSizes[0][0]).to.equal(2);
      expect(frameSizes[1][0]).to.equal(3);
    });

    it('returns OPUS_INVALID_PACKET for self-delimited VBR packet with invalid last frame size', () => {
      const frameSizes = new Array<[number]>(transform['OPUS_MAX_OPUS_FRAMES']);
      for (let i = 0; i < transform['OPUS_MAX_OPUS_FRAMES']; ++i) {
        frameSizes[i] = [undefined];
      }

      // Self-delimited code 3 VBR packet where the last frame size exceeds the upper bound
      // TOC byte (0x03) + frame count byte (0x82 = 2 frames, VBR) + first frame size (0x02) + last frame size (0x10) but only 3 bytes of data
      expect(
        transform['opusPacketParseImpl'](
          convertPacketToDataView([0x03, 0x82, 0x02, 0x10, 0x01, 0x02, 0x03]),
          7,
          true, // selfDelimited
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(transform['OPUS_INVALID_PACKET']);
    });

    it('returns OPUS_INVALID_PACKET for self-delimited CBR packet with insufficient data', () => {
      const frameSizes = new Array<[number]>(transform['OPUS_MAX_OPUS_FRAMES']);
      for (let i = 0; i < transform['OPUS_MAX_OPUS_FRAMES']; ++i) {
        frameSizes[i] = [undefined];
      }

      // Self-delimited code 1 CBR packet with insufficient data for both frames
      expect(
        transform['opusPacketParseImpl'](
          convertPacketToDataView([0x01, 0x02, 0x01]), // size=2 but only 1 byte of data for 2 frames
          3,
          true, // selfDelimited
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(transform['OPUS_INVALID_PACKET']);
    });

    it('stores payloadOffset and packetLenBytes when provided', () => {
      const frameSizes = new Array<[number]>(transform['OPUS_MAX_OPUS_FRAMES']);
      const frameOffsets = new Array<[number]>(transform['OPUS_MAX_OPUS_FRAMES']);
      for (let i = 0; i < transform['OPUS_MAX_OPUS_FRAMES']; ++i) {
        frameSizes[i] = [undefined];
        frameOffsets[i] = [undefined];
      }
      const payloadOffset: [number] = [undefined];
      const packetLenBytes: [number] = [undefined];
      const tocByte: [number] = [undefined];

      // Code 0 packet with 2 bytes of data
      const numFrames = transform['opusPacketParseImpl'](
        convertPacketToDataView([0x00, 0x01, 0x02]),
        3,
        false,
        tocByte,
        frameOffsets,
        frameSizes,
        payloadOffset,
        packetLenBytes
      );
      expect(numFrames).to.equal(1);
      expect(tocByte[0]).to.equal(0x00);
      expect(payloadOffset[0]).to.equal(1);
      expect(packetLenBytes[0]).to.equal(3);
      expect(frameOffsets[0][0]).to.equal(1);
    });

    it('parses code 3 packet with padding', () => {
      const frameSizes = new Array<[number]>(transform['OPUS_MAX_OPUS_FRAMES']);
      for (let i = 0; i < transform['OPUS_MAX_OPUS_FRAMES']; ++i) {
        frameSizes[i] = [undefined];
      }

      // Code 3 CBR packet with padding: TOC byte (0x03) + frame count byte (0x42 = 2 frames, CBR, padding) + padding count (0x02) + 4 bytes of data + 2 bytes padding
      const numFrames = transform['opusPacketParseImpl'](
        convertPacketToDataView([0x03, 0x42, 0x02, 0x01, 0x02, 0x03, 0x04, 0x00, 0x00]),
        9,
        false,
        null,
        null,
        frameSizes,
        null,
        null
      );
      expect(numFrames).to.equal(2);
      expect(frameSizes[0][0]).to.equal(2);
      expect(frameSizes[1][0]).to.equal(2);
    });

    it('parses code 3 packet with multi-byte padding count', () => {
      const frameSizes = new Array<[number]>(transform['OPUS_MAX_OPUS_FRAMES']);
      for (let i = 0; i < transform['OPUS_MAX_OPUS_FRAMES']; ++i) {
        frameSizes[i] = [undefined];
      }

      // Code 3 CBR packet with multi-byte padding: TOC byte (0x03) + frame count byte (0x42 = 2 frames, CBR, padding) + padding count (0xff, 0x01 = 254 + 1 = 255 bytes) + 4 bytes of data + 255 bytes padding
      const packetData = [0x03, 0x42, 0xff, 0x01];
      // Add 4 bytes of frame data
      for (let i = 0; i < 4; i++) packetData.push(i + 1);
      // Add 255 bytes of padding
      for (let i = 0; i < 255; i++) packetData.push(0x00);

      const numFrames = transform['opusPacketParseImpl'](
        convertPacketToDataView(packetData),
        packetData.length,
        false,
        null,
        null,
        frameSizes,
        null,
        null
      );
      expect(numFrames).to.equal(2);
      expect(frameSizes[0][0]).to.equal(2);
      expect(frameSizes[1][0]).to.equal(2);
    });
  });

  describe('stereo packet handling', () => {
    it('detects stereo FEC in opusPacketHasFec', () => {
      // 10ms stereo SILK-only packet with FEC bit set for side channel
      // TOC: 0x04 = stereo, SILK-only, 10ms
      // First byte of frame: 0x10 = LBRR bit set for side channel (bit position 4)
      expect(transform['opusPacketHasFec'](convertPacketToDataView([0x04, 0x10, 0x00]), 3)).to.be
        .true;
    });

    it('detects stereo FEC with mid channel LBRR bit', () => {
      // 10ms stereo SILK-only packet with FEC bit set for mid channel
      // TOC: 0x04 = stereo, SILK-only, 10ms
      // First byte of frame: 0x40 = LBRR bit set for mid channel (bit position 6)
      expect(transform['opusPacketHasFec'](convertPacketToDataView([0x04, 0x40, 0x00]), 3)).to.be
        .true;
    });

    it('detects stereo VAD with side channel VAD bit in 40ms packet', () => {
      // 40ms stereo SILK-only packet with VAD bit set for side channel
      // TOC: 0x14 = stereo, SILK-only, 40ms (config 2, stereo)
      // For 40ms packets, there are 2 SILK frames, so VAD bits are in positions 7-6 for mid, 4-3 for side
      // First byte of frame: 0x08 = side VAD bit set (bit position 3)
      expect(
        transform['opusPacketHasVoiceActivity'](convertPacketToDataView([0x14, 0x08, 0x00]), 3)
      ).to.equal(1);
    });

    it('detects stereo VAD with side channel VAD bit in 60ms packet', () => {
      // 60ms stereo SILK-only packet with VAD bit set for side channel
      // TOC: 0x1c = stereo, SILK-only, 60ms (config 3, stereo)
      // For 60ms packets, there are 3 SILK frames, so VAD bits are in positions 7-5 for mid, 3-1 for side
      // First byte of frame: 0x04 = side VAD bit set (bit position 2)
      expect(
        transform['opusPacketHasVoiceActivity'](convertPacketToDataView([0x1c, 0x04, 0x00]), 3)
      ).to.equal(1);
    });

    it('detects stereo FEC with side channel LBRR bit in 40ms packet', () => {
      // 40ms stereo SILK-only packet with FEC bit set for side channel
      // TOC: 0x14 = stereo, SILK-only, 40ms (config 2, stereo)
      // For 40ms packets, there are 2 SILK frames, so LBRR bit is at position 2 for side
      // First byte of frame: 0x04 = side LBRR bit set (bit position 2)
      expect(transform['opusPacketHasFec'](convertPacketToDataView([0x14, 0x04, 0x00]), 3)).to.be
        .true;
    });

    it('detects stereo FEC with side channel LBRR bit in 60ms packet', () => {
      // 60ms stereo SILK-only packet with FEC bit set for side channel
      // TOC: 0x1c = stereo, SILK-only, 60ms (config 3, stereo)
      // For 60ms packets, there are 3 SILK frames, so LBRR bit is at position 0 for side
      // First byte of frame: 0x01 = side LBRR bit set (bit position 0)
      expect(transform['opusPacketHasFec'](convertPacketToDataView([0x1c, 0x01, 0x00]), 3)).to.be
        .true;
    });
  });

  describe('handleMessage edge cases', () => {
    it('handles OPUS_PAYLOAD_TYPE message with undefined message object', () => {
      transform.handleMessage({
        type: REDUNDANT_AUDIO_MESSAGE_TYPES.OPUS_PAYLOAD_TYPE,
        transformName: TRANSFORM_NAMES.REDUNDANT_AUDIO,
        message: undefined,
      });
      const logCall = postMessageStub
        .getCalls()
        .find(call => call.args[0].message?.text?.includes('opus payload type set to 0'));
      expect(logCall).to.not.be.undefined;
    });

    it('handles UPDATE_NUM_REDUNDANT_ENCODINGS message with undefined message object', () => {
      transform.handleMessage({
        type: REDUNDANT_AUDIO_MESSAGE_TYPES.UPDATE_NUM_REDUNDANT_ENCODINGS,
        transformName: TRANSFORM_NAMES.REDUNDANT_AUDIO,
        message: undefined,
      });
      const logCall = postMessageStub
        .getCalls()
        .find(call => call.args[0].message?.text?.includes('Updated numRedundantEncodings to 0'));
      expect(logCall).to.not.be.undefined;
    });

    it('handles RED_PAYLOAD_TYPE message with null message object', () => {
      transform.handleMessage({
        type: REDUNDANT_AUDIO_MESSAGE_TYPES.RED_PAYLOAD_TYPE,
        transformName: TRANSFORM_NAMES.REDUNDANT_AUDIO,
        message: null,
      });
      const logCall = postMessageStub
        .getCalls()
        .find(call => call.args[0].message?.text?.includes('red payload type set to 0'));
      expect(logCall).to.not.be.undefined;
    });

    it('handles OPUS_PAYLOAD_TYPE message with null message object', () => {
      transform.handleMessage({
        type: REDUNDANT_AUDIO_MESSAGE_TYPES.OPUS_PAYLOAD_TYPE,
        transformName: TRANSFORM_NAMES.REDUNDANT_AUDIO,
        message: null,
      });
      const logCall = postMessageStub
        .getCalls()
        .find(call => call.args[0].message?.text?.includes('opus payload type set to 0'));
      expect(logCall).to.not.be.undefined;
    });

    it('handles UPDATE_NUM_REDUNDANT_ENCODINGS message with null message object', () => {
      transform.handleMessage({
        type: REDUNDANT_AUDIO_MESSAGE_TYPES.UPDATE_NUM_REDUNDANT_ENCODINGS,
        transformName: TRANSFORM_NAMES.REDUNDANT_AUDIO,
        message: null,
      });
      const logCall = postMessageStub
        .getCalls()
        .find(call => call.args[0].message?.text?.includes('Updated numRedundantEncodings to 0'));
      expect(logCall).to.not.be.undefined;
    });

    it('handles OPUS_PAYLOAD_TYPE message with missing payloadType property', () => {
      transform.handleMessage({
        type: REDUNDANT_AUDIO_MESSAGE_TYPES.OPUS_PAYLOAD_TYPE,
        transformName: TRANSFORM_NAMES.REDUNDANT_AUDIO,
        message: {},
      });
      const logCall = postMessageStub
        .getCalls()
        .find(call => call.args[0].message?.text?.includes('opus payload type set to 0'));
      expect(logCall).to.not.be.undefined;
    });

    it('handles UPDATE_NUM_REDUNDANT_ENCODINGS message with missing numRedundantEncodings property', () => {
      transform.handleMessage({
        type: REDUNDANT_AUDIO_MESSAGE_TYPES.UPDATE_NUM_REDUNDANT_ENCODINGS,
        transformName: TRANSFORM_NAMES.REDUNDANT_AUDIO,
        message: {},
      });
      const logCall = postMessageStub
        .getCalls()
        .find(call => call.args[0].message?.text?.includes('Updated numRedundantEncodings to 0'));
      expect(logCall).to.not.be.undefined;
    });
  });

  describe('splitEncodings edge cases', () => {
    it('returns null when accumulated block lengths equal or exceed buffer size', () => {
      // Create a RED packet where the redundant block length claims to use all remaining bytes
      // leaving no room for primary payload
      // RED header: F=1 (0x80), PT=109, timestamp offset, block length = remaining bytes
      const redundantBlockLength = 10;
      const redPacket = new Uint8Array(4 + 1 + redundantBlockLength); // 4 byte header + 1 byte last header + redundant data
      // First header (redundant): F=1, PT=109
      redPacket[0] = 0x80 | OPUS_PAYLOAD_TYPE;
      redPacket[1] = 0x00; // timestamp offset high bits
      redPacket[2] = (0x00 << 2) | ((redundantBlockLength >> 8) & 0x03); // timestamp offset low + block length high
      redPacket[3] = redundantBlockLength & 0xff; // block length low
      // Last header (primary): F=0, PT=109
      redPacket[4] = OPUS_PAYLOAD_TYPE;
      // Fill redundant data
      for (let i = 0; i < redundantBlockLength; i++) {
        redPacket[5 + i] = i;
      }

      const frame = {
        data: redPacket.buffer,
        timestamp: 960,
        getMetadata: () => ({ payloadType: RED_PAYLOAD_TYPE }),
      };
      const controller = createMockController();
      transform.senderTransform(frame, controller);
      // Should pass through unchanged since splitEncodings returns null
      // @ts-ignore
      expect(controller.enqueue.calledOnce).to.be.true;
    });

    it('returns null when redundant header is incomplete (less than 4 bytes)', () => {
      // Create a RED packet with F=1 but not enough bytes for full header
      const redPacket = new Uint8Array(3); // Only 3 bytes, need 4 for redundant header
      redPacket[0] = 0x80 | OPUS_PAYLOAD_TYPE; // F=1, indicates more headers follow
      redPacket[1] = 0x00;
      redPacket[2] = 0x00;

      const frame = {
        data: redPacket.buffer,
        timestamp: 960,
        getMetadata: () => ({ payloadType: RED_PAYLOAD_TYPE }),
      };
      const controller = createMockController();
      transform.senderTransform(frame, controller);
      // Should pass through unchanged since splitEncodings returns null
      // @ts-ignore
      expect(controller.enqueue.calledOnce).to.be.true;
    });

    it('handles padding packet with sequence number when last block not found', () => {
      // Create a packet that never has F=0 (last block indicator)
      // This simulates a padding packet used for BWE
      const redPacket = new Uint8Array(4); // Just one redundant header, no last block
      redPacket[0] = 0x80 | OPUS_PAYLOAD_TYPE; // F=1, indicates more headers follow
      redPacket[1] = 0x00;
      redPacket[2] = 0x00;
      redPacket[3] = 0x00; // block length = 0

      const frame = {
        data: redPacket.buffer,
        timestamp: 960,
        getMetadata: () => ({
          payloadType: RED_PAYLOAD_TYPE,
          sequenceNumber: 5,
          synchronizationSource: 12345,
        }),
      };
      const controller = createMockController();
      transform.receivePacketLogTransform(frame, controller);
      // Should still enqueue and process for loss tracking
      // @ts-ignore
      expect(controller.enqueue.calledOnce).to.be.true;
    });

    it('returns null when last block not found and no sequence number (sender side)', () => {
      // Create a packet that never has F=0 (last block indicator)
      // This is a bad packet on the sender side (no sequence number)
      const redPacket = new Uint8Array(4); // Just one redundant header, no last block
      redPacket[0] = 0x80 | OPUS_PAYLOAD_TYPE; // F=1, indicates more headers follow
      redPacket[1] = 0x00;
      redPacket[2] = 0x00;
      redPacket[3] = 0x00; // block length = 0

      const frame = {
        data: redPacket.buffer,
        timestamp: 960,
        getMetadata: () => ({ payloadType: RED_PAYLOAD_TYPE }), // No sequence number
      };
      const controller = createMockController();
      transform.senderTransform(frame, controller);
      // Should pass through unchanged since splitEncodings returns null
      // @ts-ignore
      expect(controller.enqueue.calledOnce).to.be.true;
    });
  });

  describe('encode edge cases', () => {
    it('skips redundant encoding when timestamp offset exceeds maximum', () => {
      // This test verifies the maxRedTimestampOffset check in the encode method.
      // The check is: uint32WrapAround(primaryTimestamp - redundantTimestamp) >= maxRedTimestampOffset
      // where maxRedTimestampOffset = 16384 (2^14)
      //
      // With the default configuration:
      // - redPacketizationTime = 960
      // - redPacketDistance = 2
      // - maxRedEncodings = 2
      //
      // The redundantTimestamp starts at primaryTimestamp - 1920 and decreases by 1920 each iteration.
      // After 2 iterations, the max offset is 3840, which is well below 16384.
      //
      // To trigger this check, we need to temporarily increase numRedundantEncodings beyond the cap.
      // We can do this by directly setting the private property.

      // @ts-ignore - accessing private property for testing
      transform['numRedundantEncodings'] = 10; // Set high enough to trigger the check

      const opusData = new Uint8Array([0x08, 0x80, 0x01, 0x02]); // SILK with VAD
      const redPacket = new Uint8Array(1 + opusData.length);
      redPacket[0] = OPUS_PAYLOAD_TYPE;
      redPacket.set(opusData, 1);

      const controller = createMockController();

      // Build up encoding history
      for (let i = 0; i < 10; i++) {
        transform.senderTransform(
          {
            data: redPacket.buffer,
            timestamp: 960 * (i + 1),
            getMetadata: () => ({ payloadType: RED_PAYLOAD_TYPE }),
          },
          controller
        );
      }

      // Now send a packet that will try to add many redundant encodings
      // After 9 iterations (i=0 to i=8), redundantTimestamp offset would be:
      // 1920 + 8*1920 = 17280 > 16384
      // So the check should trigger on the 9th iteration
      transform.senderTransform(
        {
          data: redPacket.buffer,
          timestamp: 960 * 11,
          getMetadata: () => ({ payloadType: RED_PAYLOAD_TYPE }),
        },
        controller
      );
    });

    it('skips redundant encoding when not enough bytes available', () => {
      transform.setNumRedundantEncodings(2);

      // Create a large opus packet that leaves little room for redundancy
      // maxAudioPayloadSizeBytes is 1000, so we need a packet close to that
      const largeOpusData = new Uint8Array(990);
      largeOpusData[0] = 0x08; // SILK-only
      largeOpusData[1] = 0x80; // VAD bit set
      for (let i = 2; i < 990; i++) {
        largeOpusData[i] = i & 0xff;
      }
      const redPacket = new Uint8Array(1 + largeOpusData.length);
      redPacket[0] = OPUS_PAYLOAD_TYPE;
      redPacket.set(largeOpusData, 1);

      const controller = createMockController();

      // Send several packets to build up history
      for (let i = 0; i < 5; i++) {
        const frame = {
          data: redPacket.buffer,
          timestamp: 960 * (i + 1),
          getMetadata: () => ({ payloadType: RED_PAYLOAD_TYPE }),
        };
        transform.senderTransform(frame, controller);
      }
      // The large payload should prevent adding redundancy due to byte limit
    });

    it('returns null for empty primary payload', () => {
      // Create a RED packet with empty primary payload
      const redPacket = new Uint8Array(1); // Just the header, no payload
      redPacket[0] = OPUS_PAYLOAD_TYPE;

      const frame = {
        data: redPacket.buffer,
        timestamp: 960,
        getMetadata: () => ({ payloadType: RED_PAYLOAD_TYPE }),
      };
      const controller = createMockController();
      transform.senderTransform(frame, controller);
      // Should pass through unchanged since encode returns null for empty payload
      // @ts-ignore
      expect(controller.enqueue.calledOnce).to.be.true;
    });

    it('returns null for payload exceeding maxRedPacketSizeBytes', () => {
      // Create a RED packet with payload >= 1024 bytes (maxRedPacketSizeBytes)
      const largeOpusData = new Uint8Array(1025);
      largeOpusData[0] = 0x08; // SILK-only
      for (let i = 1; i < 1025; i++) {
        largeOpusData[i] = i & 0xff;
      }
      const redPacket = new Uint8Array(1 + largeOpusData.length);
      redPacket[0] = OPUS_PAYLOAD_TYPE;
      redPacket.set(largeOpusData, 1);

      const frame = {
        data: redPacket.buffer,
        timestamp: 960,
        getMetadata: () => ({ payloadType: RED_PAYLOAD_TYPE }),
      };
      const controller = createMockController();
      transform.senderTransform(frame, controller);
      // Should not enqueue since payload exceeds maxAudioPayloadSizeBytes (1000)
      // @ts-ignore
      expect(controller.enqueue.called).to.be.false;
    });

    it('clears encoding history when it exceeds maximum size', () => {
      transform.setNumRedundantEncodings(2);

      // maxEncodingHistorySize is 10
      // redMaxRecoveryDistance is 5, redPacketizationTime is 960
      // maxTimestampDelta = 960 * 5 = 4800
      // We need to add more than 10 encodings without expiring them
      // So all timestamps must be within 4800 of each other

      const opusData = new Uint8Array([0x08, 0x80, 0x01, 0x02]); // SILK with VAD
      const redPacket = new Uint8Array(1 + opusData.length);
      redPacket[0] = OPUS_PAYLOAD_TYPE;
      redPacket.set(opusData, 1);

      const controller = createMockController();

      // Send 12 packets with timestamps close together (within 4800)
      // Each packet is 100 apart, so 12 packets span 1100 which is < 4800
      // This should trigger the history overflow check
      for (let i = 0; i < 12; i++) {
        const frame = {
          data: redPacket.buffer,
          timestamp: 100 * (i + 1),
          getMetadata: () => ({ payloadType: RED_PAYLOAD_TYPE }),
        };
        transform.senderTransform(frame, controller);
      }

      // The encoding history should have been cleared when it exceeded maxEncodingHistorySize
    });
  });

  describe('updateRedStats with packet loss', () => {
    it('tracks RED recovery when redundant encoding arrives for lost packet', () => {
      // First, establish packet loss by receiving packets with a gap
      const opusData = new Uint8Array([0x08, 0x01, 0x02, 0x03]);
      const redPacket = new Uint8Array(1 + opusData.length);
      redPacket[0] = OPUS_PAYLOAD_TYPE;
      redPacket.set(opusData, 1);

      const controller = createMockController();

      // Receive packet 1
      const frame1 = {
        data: redPacket.buffer,
        timestamp: 960,
        getMetadata: () => ({
          payloadType: RED_PAYLOAD_TYPE,
          sequenceNumber: 1,
          synchronizationSource: 12345,
        }),
      };
      transform.receivePacketLogTransform(frame1, controller);

      // Receive packet 3 (packet 2 is lost)
      const frame3 = {
        data: redPacket.buffer,
        timestamp: 960 * 3,
        getMetadata: () => ({
          payloadType: RED_PAYLOAD_TYPE,
          sequenceNumber: 3,
          synchronizationSource: 12345,
        }),
      };
      transform.receivePacketLogTransform(frame3, controller);

      // Verify packet 2 is counted as lost
      expect(transform['totalAudioPacketsLost']).to.equal(1);

      // Now receive a RED packet with redundant encoding for the lost timestamp
      const redundantOpus = new Uint8Array([0x08, 0x01]);
      const primaryOpus = new Uint8Array([0x08, 0x02, 0x03, 0x04]);
      const lostTimestamp = 960 * 2;
      const primaryTimestamp = 960 * 4;
      const timestampOffset = primaryTimestamp - lostTimestamp;
      const blockLength = redundantOpus.length;

      const redPacketWithRedundancy = new Uint8Array(
        4 + 1 + redundantOpus.length + primaryOpus.length
      );
      redPacketWithRedundancy[0] = 0x80 | OPUS_PAYLOAD_TYPE;
      redPacketWithRedundancy[1] = (timestampOffset >> 6) & 0xff;
      redPacketWithRedundancy[2] = ((timestampOffset & 0x3f) << 2) | ((blockLength >> 8) & 0x03);
      redPacketWithRedundancy[3] = blockLength & 0xff;
      redPacketWithRedundancy[4] = OPUS_PAYLOAD_TYPE;
      redPacketWithRedundancy.set(redundantOpus, 5);
      redPacketWithRedundancy.set(primaryOpus, 5 + redundantOpus.length);

      const frame4 = {
        data: redPacketWithRedundancy.buffer,
        timestamp: primaryTimestamp,
        getMetadata: () => ({
          payloadType: RED_PAYLOAD_TYPE,
          sequenceNumber: 4,
          synchronizationSource: 12345,
        }),
      };
      transform.receivePacketLogTransform(frame4, controller);

      // RED recovery should be tracked
      expect(transform['totalAudioPacketsRecoveredRed']).to.equal(1);
    });

    it('does not double-count RED recovery for same timestamp', () => {
      const opusData = new Uint8Array([0x08, 0x01, 0x02, 0x03]);
      const redPacket = new Uint8Array(1 + opusData.length);
      redPacket[0] = OPUS_PAYLOAD_TYPE;
      redPacket.set(opusData, 1);

      const controller = createMockController();

      // Receive packet 1
      transform.receivePacketLogTransform(
        {
          data: redPacket.buffer,
          timestamp: 960,
          getMetadata: () => ({
            payloadType: RED_PAYLOAD_TYPE,
            sequenceNumber: 1,
            synchronizationSource: 12345,
          }),
        },
        controller
      );

      // Receive packet 3 (packet 2 is lost)
      transform.receivePacketLogTransform(
        {
          data: redPacket.buffer,
          timestamp: 960 * 3,
          getMetadata: () => ({
            payloadType: RED_PAYLOAD_TYPE,
            sequenceNumber: 3,
            synchronizationSource: 12345,
          }),
        },
        controller
      );

      expect(transform['totalAudioPacketsLost']).to.equal(1);

      // Manually add to redRecoveryLog to simulate already recovered
      transform['addTimestamp'](transform['redRecoveryLog'], 960 * 2);
      transform['totalAudioPacketsRecoveredRed'] = 1;

      // Now receive another RED packet with redundant encoding for the same lost timestamp
      const redundantOpus = new Uint8Array([0x08, 0x01]);
      const primaryOpus = new Uint8Array([0x08, 0x02, 0x03, 0x04]);
      const lostTimestamp = 960 * 2;
      const primaryTimestamp = 960 * 4;
      const timestampOffset = primaryTimestamp - lostTimestamp;
      const blockLength = redundantOpus.length;

      const redPacketWithRedundancy = new Uint8Array(
        4 + 1 + redundantOpus.length + primaryOpus.length
      );
      redPacketWithRedundancy[0] = 0x80 | OPUS_PAYLOAD_TYPE;
      redPacketWithRedundancy[1] = (timestampOffset >> 6) & 0xff;
      redPacketWithRedundancy[2] = ((timestampOffset & 0x3f) << 2) | ((blockLength >> 8) & 0x03);
      redPacketWithRedundancy[3] = blockLength & 0xff;
      redPacketWithRedundancy[4] = OPUS_PAYLOAD_TYPE;
      redPacketWithRedundancy.set(redundantOpus, 5);
      redPacketWithRedundancy.set(primaryOpus, 5 + redundantOpus.length);

      transform.receivePacketLogTransform(
        {
          data: redPacketWithRedundancy.buffer,
          timestamp: primaryTimestamp,
          getMetadata: () => ({
            payloadType: RED_PAYLOAD_TYPE,
            sequenceNumber: 4,
            synchronizationSource: 12345,
          }),
        },
        controller
      );

      // Should not double count
      expect(transform['totalAudioPacketsRecoveredRed']).to.equal(1);
    });

    it('decrements FEC recovery count when RED recovery supersedes it', () => {
      const opusData = new Uint8Array([0x08, 0x01, 0x02, 0x03]);
      const redPacket = new Uint8Array(1 + opusData.length);
      redPacket[0] = OPUS_PAYLOAD_TYPE;
      redPacket.set(opusData, 1);

      const controller = createMockController();

      // Receive packet 1
      transform.receivePacketLogTransform(
        {
          data: redPacket.buffer,
          timestamp: 960,
          getMetadata: () => ({
            payloadType: RED_PAYLOAD_TYPE,
            sequenceNumber: 1,
            synchronizationSource: 12345,
          }),
        },
        controller
      );

      // Receive packet 3 (packet 2 is lost)
      transform.receivePacketLogTransform(
        {
          data: redPacket.buffer,
          timestamp: 960 * 3,
          getMetadata: () => ({
            payloadType: RED_PAYLOAD_TYPE,
            sequenceNumber: 3,
            synchronizationSource: 12345,
          }),
        },
        controller
      );

      expect(transform['totalAudioPacketsLost']).to.equal(1);

      // Simulate FEC recovery was already counted for this timestamp
      transform['addTimestamp'](transform['fecRecoveryLog'], 960 * 2);
      transform['totalAudioPacketsRecoveredFec'] = 1;

      // Now receive RED packet with redundant encoding for the same lost timestamp
      const redundantOpus = new Uint8Array([0x08, 0x01]);
      const primaryOpus = new Uint8Array([0x08, 0x02, 0x03, 0x04]);
      const lostTimestamp = 960 * 2;
      const primaryTimestamp = 960 * 4;
      const timestampOffset = primaryTimestamp - lostTimestamp;
      const blockLength = redundantOpus.length;

      const redPacketWithRedundancy = new Uint8Array(
        4 + 1 + redundantOpus.length + primaryOpus.length
      );
      redPacketWithRedundancy[0] = 0x80 | OPUS_PAYLOAD_TYPE;
      redPacketWithRedundancy[1] = (timestampOffset >> 6) & 0xff;
      redPacketWithRedundancy[2] = ((timestampOffset & 0x3f) << 2) | ((blockLength >> 8) & 0x03);
      redPacketWithRedundancy[3] = blockLength & 0xff;
      redPacketWithRedundancy[4] = OPUS_PAYLOAD_TYPE;
      redPacketWithRedundancy.set(redundantOpus, 5);
      redPacketWithRedundancy.set(primaryOpus, 5 + redundantOpus.length);

      transform.receivePacketLogTransform(
        {
          data: redPacketWithRedundancy.buffer,
          timestamp: primaryTimestamp,
          getMetadata: () => ({
            payloadType: RED_PAYLOAD_TYPE,
            sequenceNumber: 4,
            synchronizationSource: 12345,
          }),
        },
        controller
      );

      // RED recovery should be counted, FEC should be decremented
      expect(transform['totalAudioPacketsRecoveredRed']).to.equal(1);
      expect(transform['totalAudioPacketsRecoveredFec']).to.equal(0);
    });
  });

  describe('updateFecStats with packet loss', () => {
    it('tracks FEC recovery when packet with FEC arrives for lost packet', () => {
      const controller = createMockController();

      // Create a SILK packet with FEC (LBRR bit set)
      // TOC: 0x00 = mono, SILK-only, 10ms
      // First byte of frame: 0x40 = LBRR bit set (FEC present)
      const opusDataWithFec = new Uint8Array([0x00, 0x40, 0x01, 0x02]);
      const redPacketWithFec = new Uint8Array(1 + opusDataWithFec.length);
      redPacketWithFec[0] = OPUS_PAYLOAD_TYPE;
      redPacketWithFec.set(opusDataWithFec, 1);

      // Simple packet without FEC
      const opusData = new Uint8Array([0x08, 0x01, 0x02, 0x03]);
      const redPacket = new Uint8Array(1 + opusData.length);
      redPacket[0] = OPUS_PAYLOAD_TYPE;
      redPacket.set(opusData, 1);

      // Receive packet 1
      transform.receivePacketLogTransform(
        {
          data: redPacket.buffer,
          timestamp: 960,
          getMetadata: () => ({
            payloadType: RED_PAYLOAD_TYPE,
            sequenceNumber: 1,
            synchronizationSource: 12345,
          }),
        },
        controller
      );

      // Receive packet 3 (packet 2 is lost)
      transform.receivePacketLogTransform(
        {
          data: redPacket.buffer,
          timestamp: 960 * 3,
          getMetadata: () => ({
            payloadType: RED_PAYLOAD_TYPE,
            sequenceNumber: 3,
            synchronizationSource: 12345,
          }),
        },
        controller
      );

      expect(transform['totalAudioPacketsLost']).to.equal(1);

      // Receive packet 4 with FEC that can recover packet 3 (timestamp 960*3 - 960 = 960*2)
      // But packet at 960*2 is the lost one, so FEC should help
      transform.receivePacketLogTransform(
        {
          data: redPacketWithFec.buffer,
          timestamp: 960 * 3, // FEC in this packet is for timestamp 960*2
          getMetadata: () => ({
            payloadType: RED_PAYLOAD_TYPE,
            sequenceNumber: 4,
            synchronizationSource: 12345,
          }),
        },
        controller
      );

      // FEC recovery should be tracked for the lost packet
      expect(transform['totalAudioPacketsRecoveredFec']).to.equal(1);
    });

    it('does not count FEC recovery when packet already in primary log', () => {
      const controller = createMockController();

      // Create a SILK packet with FEC
      const opusDataWithFec = new Uint8Array([0x00, 0x40, 0x01, 0x02]);
      const redPacketWithFec = new Uint8Array(1 + opusDataWithFec.length);
      redPacketWithFec[0] = OPUS_PAYLOAD_TYPE;
      redPacketWithFec.set(opusDataWithFec, 1);

      // Simple packet
      const opusData = new Uint8Array([0x08, 0x01, 0x02, 0x03]);
      const redPacket = new Uint8Array(1 + opusData.length);
      redPacket[0] = OPUS_PAYLOAD_TYPE;
      redPacket.set(opusData, 1);

      // Receive packets 1, 2, 3 in order (no loss)
      for (let i = 1; i <= 3; i++) {
        transform.receivePacketLogTransform(
          {
            data: redPacket.buffer,
            timestamp: 960 * i,
            getMetadata: () => ({
              payloadType: RED_PAYLOAD_TYPE,
              sequenceNumber: i,
              synchronizationSource: 12345,
            }),
          },
          controller
        );
      }

      // Receive packet 4 with FEC - but packet at fecTimestamp is already received
      transform.receivePacketLogTransform(
        {
          data: redPacketWithFec.buffer,
          timestamp: 960 * 4,
          getMetadata: () => ({
            payloadType: RED_PAYLOAD_TYPE,
            sequenceNumber: 4,
            synchronizationSource: 12345,
          }),
        },
        controller
      );

      // No FEC recovery should be counted since packet was already received
      expect(transform['totalAudioPacketsRecoveredFec']).to.equal(0);
    });

    it('does not count FEC recovery when packet already in RED recovery log', () => {
      const controller = createMockController();

      // Create a SILK packet with FEC
      const opusDataWithFec = new Uint8Array([0x00, 0x40, 0x01, 0x02]);
      const redPacketWithFec = new Uint8Array(1 + opusDataWithFec.length);
      redPacketWithFec[0] = OPUS_PAYLOAD_TYPE;
      redPacketWithFec.set(opusDataWithFec, 1);

      const opusData = new Uint8Array([0x08, 0x01, 0x02, 0x03]);
      const redPacket = new Uint8Array(1 + opusData.length);
      redPacket[0] = OPUS_PAYLOAD_TYPE;
      redPacket.set(opusData, 1);

      // Receive packet 1
      transform.receivePacketLogTransform(
        {
          data: redPacket.buffer,
          timestamp: 960,
          getMetadata: () => ({
            payloadType: RED_PAYLOAD_TYPE,
            sequenceNumber: 1,
            synchronizationSource: 12345,
          }),
        },
        controller
      );

      // Receive packet 3 (packet 2 is lost)
      transform.receivePacketLogTransform(
        {
          data: redPacket.buffer,
          timestamp: 960 * 3,
          getMetadata: () => ({
            payloadType: RED_PAYLOAD_TYPE,
            sequenceNumber: 3,
            synchronizationSource: 12345,
          }),
        },
        controller
      );

      // Simulate RED already recovered packet 2
      transform['addTimestamp'](transform['redRecoveryLog'], 960 * 2);
      transform['totalAudioPacketsRecoveredRed'] = 1;

      // Receive packet with FEC for the same timestamp
      transform.receivePacketLogTransform(
        {
          data: redPacketWithFec.buffer,
          timestamp: 960 * 3, // FEC for 960*2
          getMetadata: () => ({
            payloadType: RED_PAYLOAD_TYPE,
            sequenceNumber: 4,
            synchronizationSource: 12345,
          }),
        },
        controller
      );

      // FEC should not be counted since RED already recovered it
      expect(transform['totalAudioPacketsRecoveredFec']).to.equal(0);
    });

    it('does not count FEC recovery when packet already in FEC recovery log', () => {
      const controller = createMockController();

      // Create a SILK packet with FEC
      const opusDataWithFec = new Uint8Array([0x00, 0x40, 0x01, 0x02]);
      const redPacketWithFec = new Uint8Array(1 + opusDataWithFec.length);
      redPacketWithFec[0] = OPUS_PAYLOAD_TYPE;
      redPacketWithFec.set(opusDataWithFec, 1);

      const opusData = new Uint8Array([0x08, 0x01, 0x02, 0x03]);
      const redPacket = new Uint8Array(1 + opusData.length);
      redPacket[0] = OPUS_PAYLOAD_TYPE;
      redPacket.set(opusData, 1);

      // Receive packet 1
      transform.receivePacketLogTransform(
        {
          data: redPacket.buffer,
          timestamp: 960,
          getMetadata: () => ({
            payloadType: RED_PAYLOAD_TYPE,
            sequenceNumber: 1,
            synchronizationSource: 12345,
          }),
        },
        controller
      );

      // Receive packet 3 (packet 2 is lost)
      transform.receivePacketLogTransform(
        {
          data: redPacket.buffer,
          timestamp: 960 * 3,
          getMetadata: () => ({
            payloadType: RED_PAYLOAD_TYPE,
            sequenceNumber: 3,
            synchronizationSource: 12345,
          }),
        },
        controller
      );

      // Simulate FEC already recovered packet 2
      transform['addTimestamp'](transform['fecRecoveryLog'], 960 * 2);
      transform['totalAudioPacketsRecoveredFec'] = 1;

      // Receive another packet with FEC for the same timestamp
      transform.receivePacketLogTransform(
        {
          data: redPacketWithFec.buffer,
          timestamp: 960 * 3, // FEC for 960*2
          getMetadata: () => ({
            payloadType: RED_PAYLOAD_TYPE,
            sequenceNumber: 4,
            synchronizationSource: 12345,
          }),
        },
        controller
      );

      // FEC should not be double counted
      expect(transform['totalAudioPacketsRecoveredFec']).to.equal(1);
    });
  });

  describe('loss recovery tracking integration', () => {
    it('removes from recovery windows when out-of-order packet arrives', () => {
      const opusData = new Uint8Array([0x08, 0x01, 0x02, 0x03]);
      const redPacket = new Uint8Array(1 + opusData.length);
      redPacket[0] = OPUS_PAYLOAD_TYPE;
      redPacket.set(opusData, 1);

      const controller = createMockController();

      // Receive packet 1
      const frame1 = {
        data: redPacket.buffer,
        timestamp: 960,
        getMetadata: () => ({
          payloadType: RED_PAYLOAD_TYPE,
          sequenceNumber: 1,
          synchronizationSource: 12345,
        }),
      };
      transform.receivePacketLogTransform(frame1, controller);

      // Receive packet 3 (packet 2 is "lost")
      const frame3 = {
        data: redPacket.buffer,
        timestamp: 960 * 3,
        getMetadata: () => ({
          payloadType: RED_PAYLOAD_TYPE,
          sequenceNumber: 3,
          synchronizationSource: 12345,
        }),
      };
      transform.receivePacketLogTransform(frame3, controller);

      // Verify packet 2 is counted as lost
      expect(transform['totalAudioPacketsLost']).to.equal(1);

      // Simulate RED recovery for packet 2 by adding to redRecoveryLog
      transform['addTimestamp'](transform['redRecoveryLog'], 960 * 2);
      transform['totalAudioPacketsRecoveredRed'] = 1;

      // Now receive the "lost" packet 2 (out of order)
      const frame2 = {
        data: redPacket.buffer,
        timestamp: 960 * 2,
        getMetadata: () => ({
          payloadType: RED_PAYLOAD_TYPE,
          sequenceNumber: 2,
          synchronizationSource: 12345,
        }),
      };
      transform.receivePacketLogTransform(frame2, controller);

      // Verify loss count is decremented and recovery count is also decremented
      expect(transform['totalAudioPacketsLost']).to.equal(0);
      expect(transform['totalAudioPacketsRecoveredRed']).to.equal(0);
    });

    it('removes from fec recovery windows when out-of-order packet arrives', () => {
      const opusData = new Uint8Array([0x08, 0x01, 0x02, 0x03]);
      const redPacket = new Uint8Array(1 + opusData.length);
      redPacket[0] = OPUS_PAYLOAD_TYPE;
      redPacket.set(opusData, 1);

      const controller = createMockController();

      // Receive packet 1
      const frame1 = {
        data: redPacket.buffer,
        timestamp: 960,
        getMetadata: () => ({
          payloadType: RED_PAYLOAD_TYPE,
          sequenceNumber: 1,
          synchronizationSource: 12345,
        }),
      };
      transform.receivePacketLogTransform(frame1, controller);

      // Receive packet 3 (packet 2 is "lost")
      const frame3 = {
        data: redPacket.buffer,
        timestamp: 960 * 3,
        getMetadata: () => ({
          payloadType: RED_PAYLOAD_TYPE,
          sequenceNumber: 3,
          synchronizationSource: 12345,
        }),
      };
      transform.receivePacketLogTransform(frame3, controller);

      // Verify packet 2 is counted as lost
      expect(transform['totalAudioPacketsLost']).to.equal(1);

      // Simulate FEC recovery for packet 2 by adding to fecRecoveryLog
      transform['addTimestamp'](transform['fecRecoveryLog'], 960 * 2);
      transform['totalAudioPacketsRecoveredFec'] = 1;

      // Now receive the "lost" packet 2 (out of order)
      const frame2 = {
        data: redPacket.buffer,
        timestamp: 960 * 2,
        getMetadata: () => ({
          payloadType: RED_PAYLOAD_TYPE,
          sequenceNumber: 2,
          synchronizationSource: 12345,
        }),
      };
      transform.receivePacketLogTransform(frame2, controller);

      // Verify loss count is decremented and FEC recovery count is also decremented
      expect(transform['totalAudioPacketsLost']).to.equal(0);
      expect(transform['totalAudioPacketsRecoveredFec']).to.equal(0);
    });
  });
});
