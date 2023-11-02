// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import { NoOpDebugLogger } from '../../src';
import RedundantAudioEncoder from '../../src/redundantaudioencoder/RedundantAudioEncoder';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';
import { convertPacketToDataView, opusTestPackets } from './OpusTestPackets';

/**
 * Creates a RED header.
 *
 * @param isPrimary Indicates whether the header is a primary encoding header.
 * @param payloadType Payload type of the corresponding block.
 * @param timestampOffset Timestamp offset of the corresponding block.
 * @param blockLength Length of the corresponding block in bytes.
 * @returns A RED header.
 */
function createRedHeader(
  isPrimary: boolean,
  payloadType: number,
  timestampOffset: number,
  blockLength: number
): ArrayBuffer {
  let header: DataView;

  if (isPrimary) {
    header = new DataView(new ArrayBuffer(1));
    header.setUint8(0, payloadType);
  } else {
    header = new DataView(new ArrayBuffer(4));
    header.setUint8(0, 0x80 | payloadType);
    header.setUint16(1, (timestampOffset << 2) | (blockLength >> 8));
    header.setUint8(3, blockLength);
  }

  return header.buffer;
}

/**
 * Creates a RED payload.
 *
 * @param headers The headers to add to the payload.
 * @param blocks The blocks to add to the payload.
 * @returns A RED payload.
 */
function createRedPayload(headers: ArrayBuffer[], blocks: ArrayBuffer[]): ArrayBuffer {
  // Allocate enough space for the headers and blocks.
  let payloadLenBytes = 0;

  for (let i = 0; i < headers.length; ++i) {
    payloadLenBytes += headers[i].byteLength;
  }

  for (let i = 0; i < blocks.length; ++i) {
    payloadLenBytes += blocks[i].byteLength;
  }

  const payload = new ArrayBuffer(payloadLenBytes);

  // Add the headers and blocks to the payload.
  let payloadOffset = 0;
  const payloadArray = new Uint8Array(payload);

  for (let i = 0; i < headers.length; ++i) {
    payloadArray.set(new Uint8Array(headers[i]), payloadOffset);
    payloadOffset += headers[i].byteLength;
  }

  for (let i = 0; i < blocks.length; ++i) {
    payloadArray.set(new Uint8Array(blocks[i]), payloadOffset);
    payloadOffset += blocks[i].byteLength;
  }

  return payload;
}

/**
 * Helper function to iterate through all the Opus test packets and run tests on each packet.
 *
 * @param test Test to run on each packet.
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

/**
 * Convert an undelimited Opus packet into a self-delimited Opus packet.
 *
 * @param undelimitedPacket Undelimited packet to be converted.
 * @param lastFrameSize Sizes of the last Opus frame (in bytes).
 * @param payloadOffset Offset (from the start of the packet) to the first byte of the payload.
 * @param packetLenBytes Length of the packet (in bytes).
 * @param numDelimitingBytes Optional variable to style the number of delimiting bytes.
 * @returns
 */
function convertToSelfDelimited(
  undelimitedPacket: DataView,
  lastFrameSize: number,
  payloadOffset: number,
  packetLenBytes: number,
  numDelimitingBytes: [number]
): DataView {
  const headerLenBytes = payloadOffset;

  // If the length of the last frame is greater than 251, then 2 bytes are needed for delimiting, otherwise only 1 byte
  // is needed.
  const delimitingBytes = lastFrameSize > 251 ? 2 : 1;
  if (numDelimitingBytes) numDelimitingBytes[0] = delimitingBytes;

  const delimitedBuffer = new ArrayBuffer(packetLenBytes + delimitingBytes);
  const delimitedArray = new Uint8Array(delimitedBuffer);

  // Copy the header.
  delimitedArray.set(new Uint8Array(undelimitedPacket.buffer, 0, headerLenBytes));

  // Set the delimiting bytes.
  if (delimitingBytes === 2) {
    for (let firstDelimitingByte = 252; firstDelimitingByte <= 255; ++firstDelimitingByte) {
      const remainingLen = lastFrameSize - firstDelimitingByte;

      if (remainingLen % 4 === 0) {
        delimitedArray.set([firstDelimitingByte, remainingLen / 4], headerLenBytes);
        break;
      }
    }
  } else {
    delimitedArray.set([lastFrameSize], headerLenBytes);
  }

  // Copy the frames.
  const payloadSizeBytes = packetLenBytes - payloadOffset;
  delimitedArray.set(
    new Uint8Array(undelimitedPacket.buffer, payloadOffset, payloadSizeBytes),
    headerLenBytes + delimitingBytes
  );

  return new DataView(delimitedBuffer);
}

function createRTCEncodedAudioFrame(
  timestamp: number,
  payloadType: number,
  sequenceNumber: number
  // @ts-ignore
): RTCEncodedAudioFrame {
  const frame = {
    data: new ArrayBuffer(0),
    timestamp: timestamp,
    // @ts-ignore
    getMetadata: () => {
      // @ts-ignore
      return {
        payloadType: payloadType,
        sequenceNumber: sequenceNumber,
        // @ts-ignore
      } as RTCEncodedAudioFrameMetadata;
    },
  };
  return frame;
}

describe('RedundantAudioEncoder', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  let encoder: RedundantAudioEncoder;
  let packetizationTime: number;

  beforeEach(() => {
    encoder = new RedundantAudioEncoder();
    packetizationTime = encoder['redPacketizationTime'];
  });

  describe('construction', () => {
    it('can be constructed', () => {
      expect(encoder).to.not.equal(null);
    });
  });

  describe('initializeWorker', () => {
    let domMockBuilder: DOMMockBuilder;
    const behavior: DOMMockBehavior = new DOMMockBehavior();

    beforeEach(() => {
      RedundantAudioEncoder.shouldLog = true;
      domMockBuilder = new DOMMockBuilder(behavior);

      // Wrap the mock worker to initialize the RED worker since the worker code at the URL is not actually executed.
      const prevWorker = global.Worker;
      global.Worker = class MockRedWorker extends prevWorker {
        constructor(stringUrl: string) {
          super(stringUrl);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          self.postMessage = (message: any): void => {
            const msgEvent = new MessageEvent('message', { data: message });
            this.onmessage(msgEvent);
          };

          RedundantAudioEncoder.initializeWorker();
        }
      };
    });

    afterEach(() => {
      RedundantAudioEncoder.shouldLog = false;
      delete self.onmessage;
      delete self.postMessage;
      // @ts-ignore
      delete self.onrtctransform;
      domMockBuilder.cleanup();
    });

    it('can initialize a worker with RTCRtpScriptTransform that can handle messages', () => {
      const audioRedWorker = new Worker('');
      expect(audioRedWorker).to.not.be.null;

      // Create a logger for the RED worker to post messages to.
      const logger = new NoOpDebugLogger();
      audioRedWorker.onmessage = (event: MessageEvent) => {
        if (event.data.type === 'REDWorkerLog') {
          logger.info(event.data.log);
        }
      };

      // Trigger the `rtctransform` events to set up the RED worker.
      // @ts-ignore
      const senderTransform = new RTCRtpScriptTransform(audioRedWorker, {
        type: 'SenderTransform',
      });
      // @ts-ignore
      const receiverTransform = new RTCRtpScriptTransform(audioRedWorker, {
        type: 'ReceiverTransform',
      });
      // @ts-ignore
      const passthroughTransform = new RTCRtpScriptTransform(audioRedWorker, {
        type: 'PassthroughTransform',
      });

      expect(senderTransform.readable.locked).to.be.true;
      expect(senderTransform.writable.locked).to.be.true;
      expect(receiverTransform.readable.locked).to.be.true;
      expect(receiverTransform.writable.locked).to.be.true;
      expect(passthroughTransform.readable.locked).to.be.true;
      expect(passthroughTransform.writable.locked).to.be.true;

      // @ts-ignore
      const invalidTransform = new RTCRtpScriptTransform(audioRedWorker, {
        type: 'InvalidTransform',
      });
      expect(invalidTransform.readable.locked).to.be.false;
      expect(invalidTransform.writable.locked).to.be.false;

      const redPayloadType = 63;
      let newRedPayloadType: number;

      const opusPayloadType = 111;
      let newOpusPayloadType: number;

      const numRedundantEncodings = 2;
      let newNumRedundantEncodings: number;

      let validMessage: boolean;

      // Wrap the RED worker's `onmessage()` callback for testing.
      const workerOnMessage = audioRedWorker.onmessage;
      audioRedWorker.onmessage = (event: MessageEvent) => {
        // @ts-ignore
        workerOnMessage(event);

        if (event.data.type === 'REDWorkerLog') {
          validMessage = true;
          if (event.data.log.includes('red payload type set to')) {
            newRedPayloadType = Number(event.data.log.match(/.*red payload type set to (\d+)/)[1]);
          } else if (event.data.log.includes('opus payload type set to')) {
            newOpusPayloadType = Number(
              event.data.log.match(/.*opus payload type set to (\d+)/)[1]
            );
          } else if (event.data.log.includes('Updated numRedundantEncodings to')) {
            newNumRedundantEncodings = Number(
              event.data.log.match(/.*Updated numRedundantEncodings to (\d+)/)[1]
            );
          }
        }
      };

      validMessage = false;
      audioRedWorker.postMessage({
        msgType: 'RedPayloadType',
        payloadType: redPayloadType,
      });
      expect(newRedPayloadType).to.equal(redPayloadType);
      expect(validMessage).to.be.true;

      validMessage = false;
      audioRedWorker.postMessage({
        msgType: 'OpusPayloadType',
        payloadType: opusPayloadType,
      });
      expect(newOpusPayloadType).to.equal(opusPayloadType);
      expect(validMessage).to.be.true;

      validMessage = false;
      audioRedWorker.postMessage({
        msgType: 'UpdateNumRedundantEncodings',
        numRedundantEncodings: numRedundantEncodings,
      });
      expect(newNumRedundantEncodings).to.equal(numRedundantEncodings);
      expect(validMessage).to.be.true;

      validMessage = false;
      audioRedWorker.postMessage({
        msgType: 'InvalidMessage',
      });
      expect(validMessage).to.be.false;
    });

    it('can initialize a worker without RTCRtpScriptTransform that can handle messages', () => {
      // @ts-ignore
      const RTCRtpScriptTransformer = window.RTCRtpScriptTransformer;
      // @ts-ignore
      const RTCTransformEvent = window.RTCTransformEvent;
      // @ts-ignore
      const RTCRtpScriptTransform = window.RTCRtpScriptTransform;
      // @ts-ignore
      delete window.RTCRtpScriptTransformer;
      // @ts-ignore
      delete window.RTCTransformEvent;
      // @ts-ignore
      delete window.RTCRtpScriptTransform;

      const audioRedWorker = new Worker('');
      expect(audioRedWorker).to.not.be.null;

      // @ts-ignore
      window.RTCRtpScriptTransformer = RTCRtpScriptTransformer;
      // @ts-ignore
      window.RTCTransformEvent = RTCTransformEvent;
      // @ts-ignore
      window.RTCRtpScriptTransform = RTCRtpScriptTransform;

      // Create a logger for the RED worker to post messages to.
      const logger = new NoOpDebugLogger();
      audioRedWorker.onmessage = (event: MessageEvent) => {
        if (event.data.type === 'REDWorkerLog') {
          logger.info(event.data.log);
        }
      };

      const sendReadable = new ReadableStream();
      const sendWritable = new WritableStream();
      const receiveReadable = new ReadableStream();
      const receiveWritable = new WritableStream();

      expect(sendReadable.locked).to.be.false;
      expect(sendWritable.locked).to.be.false;
      expect(receiveReadable.locked).to.be.false;
      expect(receiveWritable.locked).to.be.false;

      audioRedWorker.postMessage({
        msgType: 'StartRedWorker',
        send: {
          readable: sendReadable,
          writable: sendWritable,
        },
        receive: {
          readable: receiveReadable,
          writable: receiveWritable,
        },
      });

      expect(sendReadable.locked).to.be.true;
      expect(sendWritable.locked).to.be.true;
      expect(receiveReadable.locked).to.be.true;
      expect(receiveWritable.locked).to.be.true;

      const redPayloadType = 63;
      let newRedPayloadType: number;

      const opusPayloadType = 111;
      let newOpusPayloadType: number;

      const numRedundantEncodings = 2;
      let newNumRedundantEncodings: number;

      let validMessage: boolean;
      let redundancyEnabled: boolean;

      // Wrap the RED worker's `onmessage()` callback for testing.
      const workerOnMessage = audioRedWorker.onmessage;
      audioRedWorker.onmessage = (event: MessageEvent) => {
        // @ts-ignore
        workerOnMessage(event);

        if (event.data.type === 'REDWorkerLog') {
          validMessage = true;
          if (event.data.log.includes('red payload type set to')) {
            newRedPayloadType = Number(event.data.log.match(/.*red payload type set to (\d+)/)[1]);
          } else if (event.data.log.includes('opus payload type set to')) {
            newOpusPayloadType = Number(
              event.data.log.match(/.*opus payload type set to (\d+)/)[1]
            );
          } else if (event.data.log.includes('Updated numRedundantEncodings to')) {
            newNumRedundantEncodings = Number(
              event.data.log.match(/.*Updated numRedundantEncodings to (\d+)/)[1]
            );
          } else if (event.data.log.includes('redundancy disabled')) {
            redundancyEnabled = false;
          } else if (event.data.log.includes('redundancy enabled')) {
            redundancyEnabled = true;
          }
        }
      };

      validMessage = false;
      audioRedWorker.postMessage({
        msgType: 'RedPayloadType',
        payloadType: redPayloadType,
      });
      expect(newRedPayloadType).to.equal(redPayloadType);
      expect(validMessage).to.be.true;

      validMessage = false;
      audioRedWorker.postMessage({
        msgType: 'OpusPayloadType',
        payloadType: opusPayloadType,
      });
      expect(newOpusPayloadType).to.equal(opusPayloadType);
      expect(validMessage).to.be.true;

      validMessage = false;
      audioRedWorker.postMessage({
        msgType: 'UpdateNumRedundantEncodings',
        numRedundantEncodings: numRedundantEncodings,
      });
      expect(newNumRedundantEncodings).to.equal(numRedundantEncodings);
      expect(validMessage).to.be.true;

      validMessage = false;
      audioRedWorker.postMessage({
        msgType: 'Enable',
      });
      expect(redundancyEnabled).to.equal(true);
      expect(validMessage).to.be.true;

      validMessage = false;
      audioRedWorker.postMessage({
        msgType: 'Disable',
      });
      expect(redundancyEnabled).to.equal(false);
      expect(validMessage).to.be.true;

      validMessage = false;
      audioRedWorker.postMessage({
        msgType: 'InvalidMessage',
      });
      expect(validMessage).to.be.false;
    });
  });

  describe('getNumRedundantEncodingsForPacketLoss', () => {
    it('returns the expected number of redundant packets based on the packet loss', () => {
      expect(RedundantAudioEncoder.getNumRedundantEncodingsForPacketLoss(0)).to.eql([0, false]);
      expect(RedundantAudioEncoder.getNumRedundantEncodingsForPacketLoss(5)).to.eql([0, false]);
      expect(RedundantAudioEncoder.getNumRedundantEncodingsForPacketLoss(10)).to.eql([1, false]);
      expect(RedundantAudioEncoder.getNumRedundantEncodingsForPacketLoss(15)).to.eql([1, false]);
      expect(RedundantAudioEncoder.getNumRedundantEncodingsForPacketLoss(20)).to.eql([2, false]);
      expect(RedundantAudioEncoder.getNumRedundantEncodingsForPacketLoss(80)).to.eql([0, true]);
    });
  });

  describe('setupSenderTransform', () => {
    it('creates the transform pipe', () => {
      const readable: ReadableStream = new ReadableStream();
      const writable: WritableStream = new WritableStream();

      expect(readable.locked).to.be.false;
      expect(writable.locked).to.be.false;
      encoder.setupSenderTransform(readable, writable);
      expect(readable.locked).to.be.true;
      expect(writable.locked).to.be.true;
    });
  });

  describe('setupReceiverTransform', () => {
    it('creates the transform pipe', () => {
      const readable: ReadableStream = new ReadableStream();
      const writable: WritableStream = new WritableStream();

      expect(readable.locked).to.be.false;
      expect(writable.locked).to.be.false;
      encoder.setupReceiverTransform(readable, writable);
      expect(readable.locked).to.be.true;
      expect(writable.locked).to.be.true;
    });
  });

  describe('setRedPayloadType', () => {
    it('sets the expected value', () => {
      encoder.setRedPayloadType(63);
      expect(encoder['redPayloadType']).to.equal(63);
    });
  });

  describe('setOpusPayloadType', () => {
    it('sets the expected value', () => {
      encoder.setOpusPayloadType(111);
      expect(encoder['opusPayloadType']).to.equal(111);
    });
  });

  describe('setNumRedundantEncodings', () => {
    it('sets the expected values', () => {
      expect(encoder['numRedundantEncodings']).to.equal(0);
      encoder.setNumRedundantEncodings(1);
      expect(encoder['numRedundantEncodings']).to.equal(1);
      encoder.setNumRedundantEncodings(2);
      expect(encoder['numRedundantEncodings']).to.equal(2);
      encoder.setNumRedundantEncodings(3);
      expect(encoder['numRedundantEncodings']).to.equal(2);
      encoder.setNumRedundantEncodings(0);
      expect(encoder['numRedundantEncodings']).to.equal(0);
    });
  });

  describe('senderTransform', () => {
    let redPayloadType: number;
    const redundantBlock: ArrayBuffer =
      opusTestPackets['silkOnly']['narrowBand']['size10ms']['mono']['code0']['noVad'].buffer;
    const importantPayload: ArrayBuffer =
      opusTestPackets['silkOnly']['narrowBand']['size10ms']['mono']['code0']['vad'].buffer;

    // @ts-ignore
    let frame: RTCEncodedAudioFrame;
    let controller: TransformStreamDefaultController;

    beforeEach(() => {
      redPayloadType = encoder['redPayloadType'];
      frame = createRTCEncodedAudioFrame(0, redPayloadType, 0);

      controller = {
        desiredSize: 0,
        enqueue: () => {},
        error: () => {},
        terminate: () => {},
      };
    });

    it('enqueues audio payloads that are <= the size limit', () => {
      frame = createRTCEncodedAudioFrame(0, undefined, 0);
      const enqueueSpy = sinon.spy(controller, 'enqueue');

      frame.data = new ArrayBuffer(500);
      expect(enqueueSpy.calledOnce).to.be.false;
      encoder['senderTransform'](frame, controller);
      expect(enqueueSpy.calledOnce).to.be.true;
      enqueueSpy.resetHistory();

      frame.data = new ArrayBuffer(1000);
      expect(enqueueSpy.calledOnce).to.be.false;
      encoder['senderTransform'](frame, controller);
      expect(enqueueSpy.calledOnce).to.be.true;
      enqueueSpy.restore();
    });

    it('does not enqueue audio payloads that are > the size limit', () => {
      frame = createRTCEncodedAudioFrame(0, undefined, 0);
      const enqueueSpy = sinon.spy(controller, 'enqueue');

      frame.data = new ArrayBuffer(1100);
      expect(enqueueSpy.calledOnce).to.be.false;
      encoder['senderTransform'](frame, controller);
      expect(enqueueSpy.calledOnce).to.be.false;
      enqueueSpy.restore();
    });

    it('forwards non-RED frames', () => {
      const header = createRedHeader(
        true,
        encoder['opusPayloadType'],
        0,
        importantPayload.byteLength
      );
      let i = 0;
      for (; i < 2; ++i) {
        frame = createRTCEncodedAudioFrame(packetizationTime * i, redPayloadType, 0);
        frame.data = createRedPayload([header], [importantPayload]);
        encoder['senderTransform'](frame, controller);
      }

      // The next outgoing packet should not contain the previous important payloads as redundancy.
      encoder.setNumRedundantEncodings(1);
      encoder.setRedPayloadType(redPayloadType + 1);
      frame = createRTCEncodedAudioFrame(packetizationTime * i, redPayloadType, 0);
      frame.data = createRedPayload([header], [importantPayload]);
      encoder['senderTransform'](frame, controller);
      expect(frame.data.byteLength).to.equal(header.byteLength + importantPayload.byteLength);
    });

    it('forwards frames when the primary payload cannot be determined', () => {
      const header = createRedHeader(
        true,
        encoder['opusPayloadType'],
        0,
        importantPayload.byteLength
      );
      let i = 0;
      for (; i < 2; ++i) {
        frame = createRTCEncodedAudioFrame(packetizationTime * i, redPayloadType, 0);
        frame.data = createRedPayload([header], [importantPayload]);
        encoder['senderTransform'](frame, controller);
      }

      // The next outgoing packet should not contain the previous important payloads as redundancy.
      const redundantHeader = createRedHeader(
        false,
        encoder['opusPayloadType'],
        0,
        redundantBlock.byteLength
      );
      frame = createRTCEncodedAudioFrame(packetizationTime * i, redPayloadType, 0);
      frame.data = createRedPayload([redundantHeader, redundantHeader.slice(0, 3)], []);
      encoder['senderTransform'](frame, controller);
      expect(frame.data.byteLength).to.equal(
        redundantHeader.byteLength + redundantHeader.slice(0, 3).byteLength
      );
    });

    it('transforms encodable frames', () => {
      const primaryHeaderLenBytes = 1;
      const redundantHeaderLenBytes = 4;

      encoder.setNumRedundantEncodings(1);

      for (let i = 0; i < 3; ++i) {
        const header = createRedHeader(
          true,
          encoder['opusPayloadType'],
          0,
          importantPayload.byteLength
        );
        frame = createRTCEncodedAudioFrame(packetizationTime * i, redPayloadType, 0);
        frame.data = createRedPayload([header], [importantPayload]);

        encoder['senderTransform'](frame, controller);
        if (i < 2) {
          expect(frame.data.byteLength).to.equal(
            primaryHeaderLenBytes + importantPayload.byteLength
          );
        } else {
          expect(frame.data.byteLength).to.equal(
            primaryHeaderLenBytes + redundantHeaderLenBytes + importantPayload.byteLength * 2
          );
        }
      }
    });

    it('sends only primary payload if disabled', () => {
      const primaryHeaderLenBytes = 1;

      encoder.setNumRedundantEncodings(1);
      encoder.setRedundancyEnabled(false);

      for (let i = 0; i < 3; ++i) {
        const header = createRedHeader(
          true,
          encoder['opusPayloadType'],
          0,
          importantPayload.byteLength
        );
        frame = createRTCEncodedAudioFrame(packetizationTime * i, redPayloadType, 0);
        frame.data = createRedPayload([header], [importantPayload]);

        encoder['senderTransform'](frame, controller);
        expect(frame.data.byteLength).to.equal(primaryHeaderLenBytes + importantPayload.byteLength);
      }
    });
  });

  describe('receivePacketLogTransform', () => {
    let redPayloadType: number;
    let opusPayloadType: number;
    const payloadWithoutFec: ArrayBuffer =
      opusTestPackets['silkOnly']['narrowBand']['size10ms']['mono']['code0']['noVad'].buffer;
    const payloadWithFec: ArrayBuffer = opusTestPackets['withFec'].buffer;

    let controller: TransformStreamDefaultController;

    beforeEach(() => {
      encoder['initializePacketLogs']();
      encoder.setRedPayloadType(63);
      encoder.setOpusPayloadType(111);
      redPayloadType = encoder['redPayloadType'];
      opusPayloadType = encoder['opusPayloadType'];

      controller = {
        desiredSize: 0,
        enqueue: () => {},
        error: () => {},
        terminate: () => {},
      };
    });

    it('enqueues audio payloads that are <= the size limit', () => {
      const frame = createRTCEncodedAudioFrame(0, undefined, 0);
      const enqueueSpy = sinon.spy(controller, 'enqueue');

      frame.data = new ArrayBuffer(500);
      expect(enqueueSpy.calledOnce).to.be.false;
      encoder['senderTransform'](frame, controller);
      expect(enqueueSpy.calledOnce).to.be.true;
      enqueueSpy.resetHistory();

      frame.data = new ArrayBuffer(1000);
      expect(enqueueSpy.calledOnce).to.be.false;
      encoder['senderTransform'](frame, controller);
      expect(enqueueSpy.calledOnce).to.be.true;
      enqueueSpy.restore();
    });

    it('does not enqueue audio payloads that are > the size limit', () => {
      const frame = createRTCEncodedAudioFrame(0, undefined, 0);
      const enqueueSpy = sinon.spy(controller, 'enqueue');

      frame.data = new ArrayBuffer(1100);
      expect(enqueueSpy.calledOnce).to.be.false;
      encoder['senderTransform'](frame, controller);
      expect(enqueueSpy.calledOnce).to.be.false;
      enqueueSpy.restore();
    });

    it('forwards non-RED frames', () => {
      const frame = createRTCEncodedAudioFrame(960, encoder['redPayloadType'], 10);
      encoder.setRedPayloadType(redPayloadType + 1);
      encoder['receivePacketLogTransform'](frame, controller);
      expect(frame.data.byteLength).to.equal(0);
    });

    it('forwards frames when the primary payload cannot be determined', () => {
      const redundantHeader = createRedHeader(
        false,
        opusPayloadType,
        0,
        payloadWithoutFec.byteLength
      );
      const frame = createRTCEncodedAudioFrame(960, redPayloadType, 10);
      frame.data = createRedPayload([redundantHeader, redundantHeader.slice(0, 3)], []);

      encoder['receivePacketLogTransform'](frame, controller);
      expect(frame.data.byteLength).to.equal(
        redundantHeader.byteLength + redundantHeader.slice(0, 3).byteLength
      );
    });

    it('adds primary packet timestamp to primary packet log', () => {
      const primaryHeader = createRedHeader(true, opusPayloadType, 0, payloadWithFec.byteLength);
      const frame = createRTCEncodedAudioFrame(960, redPayloadType, 10);
      frame.data = createRedPayload([primaryHeader], [payloadWithFec]);

      encoder['receivePacketLogTransform'](frame, controller);
      expect(frame.data.byteLength).to.equal(primaryHeader.byteLength + payloadWithFec.byteLength);
      expect(encoder['hasTimestamp'](encoder['primaryPacketLog'], 960)).to.be.true;
      expect(encoder['totalAudioPacketsExpected']).to.equal(1);
      expect(encoder['newestSequenceNumber']).to.equal(10);
    });

    it('updates red recovered and fec recovered correctly', () => {
      const redundantHeader2 = createRedHeader(
        false,
        opusPayloadType,
        1920 * 2,
        payloadWithFec.byteLength
      );
      const redundantHeader1 = createRedHeader(
        false,
        opusPayloadType,
        1920,
        payloadWithFec.byteLength
      );
      // First packet will generally not have fec
      let primaryHeader = createRedHeader(true, opusPayloadType, 0, payloadWithoutFec.byteLength);

      // 960(P)
      let frame = createRTCEncodedAudioFrame(960, redPayloadType, 10);
      frame.data = createRedPayload([primaryHeader], [payloadWithoutFec]);
      encoder['receivePacketLogTransform'](frame, controller);
      expect(frame.data.byteLength).to.equal(
        primaryHeader.byteLength + payloadWithoutFec.byteLength
      );
      expect(encoder['hasTimestamp'](encoder['primaryPacketLog'], 960)).to.be.true;
      expect(encoder['totalAudioPacketsExpected']).to.equal(1);
      expect(encoder['totalAudioPacketsRecoveredFec']).to.equal(0);
      expect(encoder['newestSequenceNumber']).to.equal(10);

      primaryHeader = createRedHeader(true, opusPayloadType, 0, payloadWithFec.byteLength);
      // 1920(R-FEC) 2880(R) 3840(R-FEC) 4800(R) 5760(P-FEC) 6720(P)
      frame = createRTCEncodedAudioFrame(6720, redPayloadType, 16);
      frame.data = createRedPayload(
        [redundantHeader2, redundantHeader1, primaryHeader],
        [payloadWithFec, payloadWithFec, payloadWithFec]
      );
      encoder['receivePacketLogTransform'](frame, controller);
      expect(frame.data.byteLength).to.equal(
        redundantHeader2.byteLength +
          redundantHeader1.byteLength +
          primaryHeader.byteLength +
          payloadWithFec.byteLength * 3
      );
      expect(encoder['hasTimestamp'](encoder['primaryPacketLog'], 6720)).to.be.true;
      expect(encoder['totalAudioPacketsExpected']).to.equal(7);
      expect(encoder['totalAudioPacketsLost']).to.equal(5);
      expect(encoder['totalAudioPacketsRecoveredRed']).to.equal(2);
      expect(encoder['totalAudioPacketsRecoveredFec']).to.equal(3);
      expect(encoder['newestSequenceNumber']).to.equal(16);

      // Seeing payloads with already seen timestamps does not update stats.
      // 3840(R-FEC) 4800(R) 5760(P-FEC) 6720(P)
      frame = createRTCEncodedAudioFrame(6720, redPayloadType, 16);
      frame.data = createRedPayload(
        [redundantHeader1, primaryHeader],
        [payloadWithFec, payloadWithFec]
      );
      encoder['receivePacketLogTransform'](frame, controller);
      expect(encoder['totalAudioPacketsExpected']).to.equal(7);
      expect(encoder['totalAudioPacketsLost']).to.equal(5);
      expect(encoder['totalAudioPacketsRecoveredRed']).to.equal(2);
      expect(encoder['totalAudioPacketsRecoveredFec']).to.equal(3);
      expect(encoder['newestSequenceNumber']).to.equal(16);

      // Primary packet with an older timestamp within out of order window
      // decrements fecRecovered, totalAudioPacketsLost
      // 2880(R-FEC) 3840(R) 4800(P-FEC) 5760(P)
      frame = createRTCEncodedAudioFrame(5760, redPayloadType, 15);
      frame.data = createRedPayload(
        [redundantHeader1, primaryHeader],
        [payloadWithFec, payloadWithFec]
      );
      encoder['receivePacketLogTransform'](frame, controller);
      expect(encoder['totalAudioPacketsExpected']).to.equal(7);
      // totalAudioPacketsLost gets decremented as we see a primary packet with ts 5760
      expect(encoder['totalAudioPacketsLost']).to.equal(4);
      // totalAudioPacketsRecoveredRed gets incremented as ts 3840 R trumps previously seen 3840 FEC
      expect(encoder['totalAudioPacketsRecoveredRed']).to.equal(3);
      // totalAudioPacketsRecoveredFec decrements as ts 3840 and ts 5760 that initally incremented it
      // now have redundant payloads for the same timestamps.
      expect(encoder['totalAudioPacketsRecoveredFec']).to.equal(1);
      expect(encoder['newestSequenceNumber']).to.equal(16);

      // Primary packet with an older timestamp within out of order window
      // decrements fecRecovered, totalAudioPacketsLost
      // 2880(P-FEC) 3840(P)
      frame = createRTCEncodedAudioFrame(3840, redPayloadType, 13);
      frame.data = createRedPayload([primaryHeader], [payloadWithFec]);
      encoder['receivePacketLogTransform'](frame, controller);
      expect(encoder['totalAudioPacketsExpected']).to.equal(7);
      // totalAudioPacketsLost gets decremented as we see a primary packet with ts 3840
      expect(encoder['totalAudioPacketsLost']).to.equal(3);
      // totalAudioPacketsRecoveredRed gets decremented as ts 3840 P trumps previously seen 3840 R
      expect(encoder['totalAudioPacketsRecoveredRed']).to.equal(2);
      // totalAudioPacketsRecoveredFec stays the same as 1920 still contributed to this.
      expect(encoder['totalAudioPacketsRecoveredFec']).to.equal(1);
      expect(encoder['newestSequenceNumber']).to.equal(16);
    });

    it('does not update metrics if packet timestamp is outside max out of order packet window', () => {
      const redundantHeader2 = createRedHeader(
        false,
        opusPayloadType,
        1920 * 2,
        payloadWithFec.byteLength
      );
      const redundantHeader1 = createRedHeader(
        false,
        opusPayloadType,
        1920,
        payloadWithFec.byteLength
      );
      // First packet will generally not have fec
      let primaryHeader = createRedHeader(true, opusPayloadType, 0, payloadWithoutFec.byteLength);

      // 17280(P)
      let frame = createRTCEncodedAudioFrame(17280, redPayloadType, 18);
      frame.data = createRedPayload([primaryHeader], [payloadWithoutFec]);
      encoder['receivePacketLogTransform'](frame, controller);
      expect(frame.data.byteLength).to.equal(
        primaryHeader.byteLength + payloadWithoutFec.byteLength
      );
      expect(encoder['hasTimestamp'](encoder['primaryPacketLog'], 17280)).to.be.true;
      expect(encoder['totalAudioPacketsExpected']).to.equal(1);
      expect(encoder['totalAudioPacketsRecoveredFec']).to.equal(0);
      expect(encoder['newestSequenceNumber']).to.equal(18);

      primaryHeader = createRedHeader(true, opusPayloadType, 0, payloadWithFec.byteLength);
      // 18240(R-FEC) 19200(R) 20160(R-FEC) 21120(R) 22080(P-FEC) 23040(P)
      frame = createRTCEncodedAudioFrame(23040, redPayloadType, 24);
      frame.data = createRedPayload(
        [redundantHeader2, redundantHeader1, primaryHeader],
        [payloadWithFec, payloadWithFec, payloadWithFec]
      );
      encoder['receivePacketLogTransform'](frame, controller);
      expect(frame.data.byteLength).to.equal(
        redundantHeader2.byteLength +
          redundantHeader1.byteLength +
          primaryHeader.byteLength +
          payloadWithFec.byteLength * 3
      );
      expect(encoder['hasTimestamp'](encoder['primaryPacketLog'], 23040)).to.be.true;
      expect(encoder['totalAudioPacketsExpected']).to.equal(7);
      expect(encoder['totalAudioPacketsLost']).to.equal(5);
      expect(encoder['totalAudioPacketsRecoveredRed']).to.equal(2);
      expect(encoder['totalAudioPacketsRecoveredFec']).to.equal(3);
      expect(encoder['newestSequenceNumber']).to.equal(24);

      // 5760(P-FEC) 6720(P)
      frame = createRTCEncodedAudioFrame(6720, redPayloadType, 7);
      frame.data = createRedPayload([primaryHeader], [payloadWithFec]);
      encoder['receivePacketLogTransform'](frame, controller);
      expect(frame.data.byteLength).to.equal(primaryHeader.byteLength + payloadWithFec.byteLength);
      // Everything below stays the same as the timestamp is too old
      expect(encoder['hasTimestamp'](encoder['primaryPacketLog'], 6720)).to.be.false;
      expect(encoder['totalAudioPacketsExpected']).to.equal(7);
      expect(encoder['totalAudioPacketsLost']).to.equal(5);
      expect(encoder['totalAudioPacketsRecoveredRed']).to.equal(2);
      expect(encoder['totalAudioPacketsRecoveredFec']).to.equal(3);
      expect(encoder['newestSequenceNumber']).to.equal(24);
    });

    it('updates total expected and total lost correctly when sequence numbers wraps around', () => {
      // First packet will generally not have fec
      const primaryHeader = createRedHeader(true, opusPayloadType, 0, payloadWithoutFec.byteLength);

      // 1920(P)
      let frame = createRTCEncodedAudioFrame(1920, redPayloadType, 0);
      frame.data = createRedPayload([primaryHeader], [payloadWithoutFec]);
      encoder['receivePacketLogTransform'](frame, controller);
      expect(frame.data.byteLength).to.equal(
        primaryHeader.byteLength + payloadWithoutFec.byteLength
      );
      expect(encoder['hasTimestamp'](encoder['primaryPacketLog'], 1920)).to.be.true;
      expect(encoder['totalAudioPacketsExpected']).to.equal(1);
      expect(encoder['newestSequenceNumber']).to.equal(0);

      frame = createRTCEncodedAudioFrame(960, redPayloadType, 65535);
      frame.data = createRedPayload([primaryHeader], [payloadWithoutFec]);
      encoder['receivePacketLogTransform'](frame, controller);
      expect(frame.data.byteLength).to.equal(
        primaryHeader.byteLength + payloadWithoutFec.byteLength
      );
      expect(encoder['hasTimestamp'](encoder['primaryPacketLog'], 960)).to.be.true;
      expect(encoder['totalAudioPacketsExpected']).to.equal(1);
      expect(encoder['totalAudioPacketsLost']).to.equal(0);
      expect(encoder['newestSequenceNumber']).to.equal(0);
    });

    it('does not decrement metrics below 0', () => {
      encoder['addTimestamp'](encoder['redRecoveryLog'], 960);
      encoder['addTimestamp'](encoder['fecRecoveryLog'], 960);
      expect(encoder['totalAudioPacketsRecoveredRed']).to.equal(0);
      expect(encoder['totalAudioPacketsRecoveredFec']).to.equal(0);
      encoder['removeFromRecoveryWindows'](960);
      expect(encoder['totalAudioPacketsRecoveredRed']).to.equal(0);
      expect(encoder['totalAudioPacketsRecoveredFec']).to.equal(0);
    });

    it('does not add a timestamp to primary packet log more than once', () => {
      const primaryHeader = createRedHeader(true, opusPayloadType, 0, payloadWithoutFec.byteLength);
      let frame = createRTCEncodedAudioFrame(1920, redPayloadType, 2);
      frame.data = createRedPayload([primaryHeader], [payloadWithoutFec]);

      encoder['receivePacketLogTransform'](frame, controller);
      expect(frame.data.byteLength).to.equal(
        primaryHeader.byteLength + payloadWithoutFec.byteLength
      );
      expect(encoder['hasTimestamp'](encoder['primaryPacketLog'], 1920)).to.be.true;
      expect(encoder['totalAudioPacketsExpected']).to.equal(1);
      expect(encoder['totalAudioPacketsLost']).to.equal(0);
      expect(encoder['newestSequenceNumber']).to.equal(2);

      frame = createRTCEncodedAudioFrame(960, redPayloadType, 1);
      frame.data = createRedPayload([primaryHeader], [payloadWithoutFec]);
      encoder['receivePacketLogTransform'](frame, controller);
      expect(encoder['hasTimestamp'](encoder['primaryPacketLog'], 960)).to.be.true;
      expect(encoder['totalAudioPacketsExpected']).to.equal(1);
      expect(encoder['totalAudioPacketsLost']).to.equal(0);
      expect(encoder['newestSequenceNumber']).to.equal(2);

      encoder['receivePacketLogTransform'](frame, controller);
      expect(encoder['hasTimestamp'](encoder['primaryPacketLog'], 960)).to.be.true;
      expect(encoder['totalAudioPacketsExpected']).to.equal(1);
      expect(encoder['totalAudioPacketsLost']).to.equal(0);
      expect(encoder['newestSequenceNumber']).to.equal(2);
      let count = 0;
      for (let i = 0; i < encoder['primaryPacketLog'].window.length; i++) {
        if (encoder['primaryPacketLog'].window[i] === 960) count++;
      }
      expect(count).to.equal(1);
    });

    it('does not add redundant encoding to primary packet log', () => {
      const encoding = {
        timestamp: 960,
        payload: payloadWithoutFec,
        isRedundant: true,
        hasFec: false,
      };
      encoder['updateLossStats'](encoding);
      expect(encoder['totalAudioPacketsExpected']).to.equal(0);
      expect(encoder['hasTimestamp'](encoder['primaryPacketLog'], 960)).to.be.false;
    });

    it('does not add primary encoding to red recovery log', () => {
      const encoding = {
        timestamp: 960,
        payload: payloadWithoutFec,
        isRedundant: false,
        hasFec: false,
        seq: 1,
      };
      encoder['updateRedStats'](encoding);
      expect(encoder['totalAudioPacketsRecoveredRed']).to.equal(0);
    });

    it('does not add redundant encoding to red recovery log if already in primary packet log', () => {
      encoder['newestSequenceNumber'] = 1;
      const encoding = {
        timestamp: 1920,
        payload: payloadWithoutFec,
        isRedundant: true,
        hasFec: false,
      };
      encoder['addTimestamp'](encoder['primaryPacketLog'], 1920);
      encoder['updateRedStats'](encoding);
      expect(encoder['totalAudioPacketsRecoveredRed']).to.equal(0);
    });

    it('does not count recovery for primary encodings that were already received but are beyond the max out-of-order primary packet window', () => {
      let seqNum = 0;

      // Receive a first packet.
      let header = createRedHeader(true, opusPayloadType, 0, payloadWithoutFec.byteLength);
      let frame = createRTCEncodedAudioFrame(seqNum * packetizationTime, redPayloadType, seqNum);
      frame.data = createRedPayload([header], [payloadWithoutFec]);
      encoder['receivePacketLogTransform'](frame, controller);
      ++seqNum;

      // Skip some sequence numbers to lose some packets before receiving the "initial packets". The number of packets
      // lost is equal to the number of "initial packets".
      seqNum += encoder['redMaxRecoveryDistance'];

      // These "initial packets" have no FEC and no redundancy and are received in-order.
      for (let i = 0; i < encoder['redMaxRecoveryDistance']; ++i, ++seqNum) {
        header = createRedHeader(true, opusPayloadType, 0, payloadWithoutFec.byteLength);
        frame = createRTCEncodedAudioFrame(seqNum * packetizationTime, redPayloadType, seqNum);
        frame.data = createRedPayload([header], [payloadWithoutFec]);
        encoder['receivePacketLogTransform'](frame, controller);
      }
      expect(encoder['totalAudioPacketsLost']).to.equal(encoder['redMaxRecoveryDistance']);
      expect(encoder['totalAudioPacketsRecoveredRed']).to.equal(0);
      expect(encoder['totalAudioPacketsRecoveredFec']).to.equal(0);

      // The "initial packets" will all be protected by this next packet since it has maximum redundancy, but this
      // next packet will be received out-of-order.
      const outOfOrderHeaders = [
        createRedHeader(
          false,
          opusPayloadType,
          2 * encoder['redPacketDistance'] * packetizationTime,
          payloadWithFec.byteLength
        ),
        createRedHeader(
          false,
          opusPayloadType,
          encoder['redPacketDistance'] * packetizationTime,
          payloadWithFec.byteLength
        ),
        createRedHeader(true, opusPayloadType, 0, payloadWithFec.byteLength),
      ];
      const outOfOrderFrame = createRTCEncodedAudioFrame(
        seqNum * packetizationTime,
        redPayloadType,
        seqNum
      );
      outOfOrderFrame.data = createRedPayload(outOfOrderHeaders, [
        payloadWithFec,
        payloadWithFec,
        payloadWithFec,
      ]);
      ++seqNum;

      // Receive packets with no FEC and no redundancy in-order until only one of "initial packets" are within the max
      // out-of-order primary packet window.
      for (let i = 0; i < encoder['maxOutOfOrderPacketDistance'] - 1; ++i, ++seqNum) {
        header = createRedHeader(true, opusPayloadType, 0, payloadWithoutFec.byteLength);
        frame = createRTCEncodedAudioFrame(seqNum * packetizationTime, redPayloadType, seqNum);
        frame.data = createRedPayload([header], [payloadWithoutFec]);
        encoder['receivePacketLogTransform'](frame, controller);
      }
      // At this point, the single out-of-order packet is additionally considered lost.
      expect(encoder['totalAudioPacketsLost']).to.equal(encoder['redMaxRecoveryDistance'] + 1);
      expect(encoder['totalAudioPacketsRecoveredRed']).to.equal(0);
      expect(encoder['totalAudioPacketsRecoveredFec']).to.equal(0);

      // Now receive the out-of-order packet. This should make all of the "initial packets" fall outside of the max
      // out-of-order primary packet window.
      encoder['receivePacketLogTransform'](outOfOrderFrame, controller);
      expect(encoder['totalAudioPacketsLost']).to.equal(encoder['redMaxRecoveryDistance']);

      // Even though the "initial packets" are protected by the out-of-order packet, they should not count towards RED
      // or FEC recovery since they were previously received.
      expect(encoder['totalAudioPacketsRecoveredRed']).to.equal(0);
      expect(encoder['totalAudioPacketsRecoveredFec']).to.equal(0);
    });
  });

  describe('getPrimaryPayload', () => {
    const primaryBlock: ArrayBuffer =
      opusTestPackets['silkOnly']['narrowBand']['size10ms']['mono']['code0']['vad'].buffer;
    const redundantBlock: ArrayBuffer =
      opusTestPackets['silkOnly']['narrowBand']['size10ms']['mono']['code0']['noVad'].buffer;

    it('gets the last block', () => {
      const redundantHeader = createRedHeader(
        false,
        encoder['opusPayloadType'],
        0,
        redundantBlock.byteLength
      );
      const primaryHeader = createRedHeader(
        true,
        encoder['opusPayloadType'],
        0,
        primaryBlock.byteLength
      );
      const frame = createRedPayload(
        [redundantHeader, redundantHeader, primaryHeader],
        [redundantBlock, redundantBlock, primaryBlock]
      );

      const primaryPayload = new DataView(encoder['getPrimaryPayload'](0, frame));
      expect(primaryPayload.byteLength).to.equal(primaryBlock.byteLength);

      const primaryBlockView = new DataView(primaryBlock);
      for (let i = 0; i < primaryPayload.byteLength; ++i) {
        expect(primaryPayload.getUint8(i)).to.equal(primaryBlockView.getUint8(i));
      }
    });

    it('handles an incorrect primary block payload type', () => {
      const redundantHeader = createRedHeader(
        false,
        encoder['opusPayloadType'],
        0,
        redundantBlock.byteLength
      );
      const primaryHeader = createRedHeader(
        true,
        encoder['opusPayloadType'] + 1,
        0,
        primaryBlock.byteLength
      );
      const frame = createRedPayload(
        [redundantHeader, redundantHeader, primaryHeader],
        [redundantBlock, redundantBlock, primaryBlock]
      );

      expect(encoder['getPrimaryPayload'](0, frame)).to.equal(null);
    });

    it('handles block lengths that exceed the total payload length', () => {
      const redundantHeader = createRedHeader(
        false,
        encoder['opusPayloadType'],
        0,
        redundantBlock.byteLength * 3
      );
      const primaryHeader = createRedHeader(
        true,
        encoder['opusPayloadType'],
        0,
        primaryBlock.byteLength
      );
      const frame = createRedPayload(
        [redundantHeader, redundantHeader, primaryHeader],
        [redundantBlock, redundantBlock, primaryBlock]
      );

      expect(encoder['getPrimaryPayload'](0, frame)).to.equal(null);
    });

    it('handles a payload with a malformed header and no blocks', () => {
      const redundantHeader = createRedHeader(
        false,
        encoder['opusPayloadType'],
        0,
        redundantBlock.byteLength
      );
      const frame = createRedPayload([redundantHeader, redundantHeader.slice(0, 3)], []);

      expect(encoder['getPrimaryPayload'](0, frame)).to.equal(null);
    });

    it('handles a payload with no primary header', () => {
      const redundantHeader = createRedHeader(
        false,
        encoder['opusPayloadType'],
        0,
        redundantBlock.byteLength
      );
      const frame = createRedPayload([redundantHeader, redundantHeader], []);

      expect(encoder['getPrimaryPayload'](0, frame)).to.equal(null);
    });
  });

  describe('encode', () => {
    const importantPayload: ArrayBuffer =
      opusTestPackets['silkOnly']['narrowBand']['size10ms']['mono']['code0']['vad'].buffer;
    const unimportantPayload: ArrayBuffer =
      opusTestPackets['silkOnly']['narrowBand']['size10ms']['mono']['code0']['noVad'].buffer;

    beforeEach(() => {
      encoder['encodingHistory'].length = 0;
      encoder.setNumRedundantEncodings(0);
    });

    it('adds additional important redundant encodings', () => {
      let i = 0;
      for (; i < 5; ++i) {
        expect(encoder['encode'](packetizationTime * i, importantPayload).byteLength).to.equal(
          1 + importantPayload.byteLength
        );
      }

      encoder.setNumRedundantEncodings(1);
      for (; i < 10; ++i) {
        expect(encoder['encode'](packetizationTime * i, importantPayload).byteLength).to.equal(
          4 + 1 + importantPayload.byteLength * 2
        );
      }

      encoder.setNumRedundantEncodings(2);
      for (; i < 15; ++i) {
        expect(encoder['encode'](packetizationTime * i, importantPayload).byteLength).to.equal(
          4 * 2 + 1 + importantPayload.byteLength * 3
        );
      }
    });

    it('handles invalid primary payload sizes', () => {
      expect(encoder['encode'](0, new ArrayBuffer(0))).to.equal(null);
      expect(encoder['encode'](0, new ArrayBuffer(encoder['maxRedPacketSizeBytes']))).to.equal(
        null
      );
      expect(encoder['encode'](0, new ArrayBuffer(encoder['maxAudioPayloadSizeBytes']))).to.equal(
        null
      );
    });

    it('does not consider redundant encodings beyond the maximum timestamp offset', () => {
      const packetDelta = packetizationTime * encoder['redPacketDistance'];
      const maxNumRedundantPackets = Math.ceil(encoder['maxRedTimestampOffset'] / packetDelta);

      // The history will now contain encodings that have too large of a timestamp offset from the primary encoding.
      encoder['numRedundantEncodings'] = maxNumRedundantPackets;
      let i = 0;
      for (; i < maxNumRedundantPackets; ++i) {
        encoder['encodingHistory'].push({
          timestamp: packetDelta * i,
          payload: new ArrayBuffer(0),
        });
      }

      // The timestamp offset of the oldest redundant encoding should not exceed the maximum timestamp offset.
      const redPayload = new DataView(encoder['encode'](packetDelta * i, new ArrayBuffer(1)));
      expect(redPayload.getUint16(1) >> 2).to.be.lessThan(encoder['maxRedTimestampOffset']);
    });

    it('does not add unimportant payloads for redundancy', () => {
      encoder.setNumRedundantEncodings(2);
      let i = 0;
      for (; i < 5; ++i) {
        expect(encoder['encode'](packetizationTime * i, unimportantPayload).byteLength).to.equal(
          1 + unimportantPayload.byteLength
        );
      }

      // Previous payloads were unimportant, so no redundant encodings should be added.
      expect(encoder['encode'](packetizationTime * i, importantPayload).byteLength).to.equal(
        1 + importantPayload.byteLength
      );
      ++i;

      expect(encoder['encode'](packetizationTime * i, unimportantPayload).byteLength).to.equal(
        1 + unimportantPayload.byteLength
      );
      ++i;

      // An important payload was added two packets back, so the important payload should be added as redundancy.
      expect(encoder['encode'](packetizationTime * i, unimportantPayload).byteLength).to.equal(
        4 + 1 + unimportantPayload.byteLength + importantPayload.byteLength
      );
      ++i;

      // An unimportant was added two packets back, which realistically would contain FEC for the important packet that
      // was added three packets back. That important packet should be added as redundancy.
      expect(encoder['encode'](packetizationTime * i, unimportantPayload).byteLength).to.equal(
        4 + 1 + unimportantPayload.byteLength + importantPayload.byteLength
      );
    });

    it('does not add additional redundancy if there are not enough bytes available', () => {
      encoder.setNumRedundantEncodings(1);

      const largeImportantPayload: ArrayBuffer =
        opusTestPackets['celtOnly']['fullBand']['size20ms']['mono']['code3']['variableBitrate'][
          'noPad'
        ].buffer;
      encoder['encode'](0, largeImportantPayload);

      encoder['encode'](packetizationTime, unimportantPayload);

      // The RED payload should not include the previously added important payload as that would cause the packet size
      // limit to be exceeded.
      const payloadLenBytes =
        encoder['maxAudioPayloadSizeBytes'] - encoder['redLastHeaderSizeBytes'];
      expect(
        encoder['encode'](packetizationTime * 2, new ArrayBuffer(payloadLenBytes)).byteLength
      ).to.equal(encoder['redLastHeaderSizeBytes'] + payloadLenBytes);
    });
  });

  describe('updateEncodingHistory', () => {
    const importantPayload: ArrayBuffer =
      opusTestPackets['silkOnly']['narrowBand']['size10ms']['mono']['code0']['vad'].buffer;
    const unimportantPayload: ArrayBuffer =
      opusTestPackets['silkOnly']['narrowBand']['size10ms']['mono']['code0']['noVad'].buffer;

    beforeEach(() => {
      encoder['encodingHistory'].length = 0;
    });

    it('adds important encodings', () => {
      encoder['updateEncodingHistory'](0, importantPayload);
      expect(encoder['encodingHistory'].length).to.equal(1);
      expect(encoder['encodingHistory'][0].timestamp).to.equal(0);

      encoder['updateEncodingHistory'](packetizationTime, importantPayload);
      expect(encoder['encodingHistory'].length).to.equal(2);
      expect(encoder['encodingHistory'][1].timestamp).to.equal(packetizationTime);
    });

    it('does not add unimportant encodings', () => {
      encoder['updateEncodingHistory'](0, importantPayload);
      expect(encoder['encodingHistory'].length).to.equal(1);
      expect(encoder['encodingHistory'][0].timestamp).to.equal(0);

      encoder['updateEncodingHistory'](packetizationTime, importantPayload);
      expect(encoder['encodingHistory'].length).to.equal(2);
      expect(encoder['encodingHistory'][1].timestamp).to.equal(packetizationTime);

      encoder['updateEncodingHistory'](packetizationTime * 2, unimportantPayload);
      expect(encoder['encodingHistory'].length).to.equal(2);
      expect(encoder['encodingHistory'][1].timestamp).to.equal(packetizationTime);

      encoder['updateEncodingHistory'](packetizationTime * 3, importantPayload);
      expect(encoder['encodingHistory'].length).to.equal(3);
      expect(encoder['encodingHistory'][2].timestamp).to.equal(packetizationTime * 3);
    });

    it('removes encodings that are too old', () => {
      encoder['updateEncodingHistory'](0, importantPayload);
      expect(encoder['encodingHistory'].length).to.equal(1);
      expect(encoder['encodingHistory'][0].timestamp).to.equal(0);

      encoder['updateEncodingHistory'](2 ** 32, importantPayload);
      expect(encoder['encodingHistory'].length).to.equal(1);
      expect(encoder['encodingHistory'][0].timestamp).to.equal(2 ** 32);
    });

    it('clears the history when there are too many encodings', () => {
      for (let i = 0; i < encoder['maxEncodingHistorySize']; ++i) {
        encoder['updateEncodingHistory'](0, importantPayload);
        expect(encoder['encodingHistory'].length).to.equal(i + 1);
      }

      encoder['updateEncodingHistory'](0, importantPayload);
      expect(encoder['encodingHistory'].length).to.equal(1);
    });
  });

  describe('uint32WrapAround', () => {
    it('correctly wraps around when input < 0', () => {
      expect(encoder['uint32WrapAround'](960 - 1920)).to.eq(4294966336);
      expect(encoder['uint32WrapAround'](-1)).to.eq(4294967295);
    });

    it('correctly wraps around when input >= 2^32', () => {
      expect(encoder['uint32WrapAround'](4294967274 + 1920)).to.eq(1898);
      expect(encoder['uint32WrapAround'](Math.pow(2, 32))).to.eq(0);
    });

    it('does not wrap when result is within [0, 2^32 - 1]', () => {
      expect(encoder['uint32WrapAround'](2 ** 7 + 2 ** 7)).to.eq(256);
    });
  });

  describe('opusPacketIsCeltOnly', () => {
    it('identifies CELT-only packets', () => {
      iteratePacketsAndTest((keys: string[], packet: DataView) => {
        if (keys.includes('celtOnly')) {
          expect(encoder['opusPacketIsCeltOnly'](packet)).to.equal(true);
        } else {
          expect(encoder['opusPacketIsCeltOnly'](packet)).to.equal(false);
        }
      });
    });
  });

  describe('opusPacketGetSamplesPerFrame', () => {
    it('gets the number of samples per frame', () => {
      iteratePacketsAndTest((keys: string[], packet: DataView) => {
        if (keys.includes('celtOnly')) {
          if (keys.includes('size2_5ms')) {
            expect(encoder['opusPacketGetSamplesPerFrame'](packet, 48000)).to.equal(120);
          } else if (keys.includes('size5ms')) {
            expect(encoder['opusPacketGetSamplesPerFrame'](packet, 48000)).to.equal(240);
          } else if (keys.includes('size10ms')) {
            expect(encoder['opusPacketGetSamplesPerFrame'](packet, 48000)).to.equal(480);
          } else if (keys.includes('size20ms')) {
            expect(encoder['opusPacketGetSamplesPerFrame'](packet, 48000)).to.equal(960);
          }
        } else if (keys.includes('hybrid')) {
          if (keys.includes('size10ms')) {
            expect(encoder['opusPacketGetSamplesPerFrame'](packet, 48000)).to.equal(480);
          } else if (keys.includes('size20ms')) {
            expect(encoder['opusPacketGetSamplesPerFrame'](packet, 48000)).to.equal(960);
          }
        } else if (keys.includes('silkOnly')) {
          if (keys.includes('size10ms')) {
            expect(encoder['opusPacketGetSamplesPerFrame'](packet, 48000)).to.equal(480);
          } else if (keys.includes('size20ms')) {
            expect(encoder['opusPacketGetSamplesPerFrame'](packet, 48000)).to.equal(960);
          } else if (keys.includes('size40ms')) {
            expect(encoder['opusPacketGetSamplesPerFrame'](packet, 48000)).to.equal(1920);
          } else if (keys.includes('size60ms')) {
            expect(encoder['opusPacketGetSamplesPerFrame'](packet, 48000)).to.equal(2880);
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
          expect(encoder['opusNumSilkFrames'](packet)).to.equal(1);
        } else if (keys.includes('size40ms')) {
          expect(encoder['opusNumSilkFrames'](packet)).to.equal(2);
        } else if (keys.includes('size60ms')) {
          expect(encoder['opusNumSilkFrames'](packet)).to.equal(3);
        }
      });
    });
  });

  describe('opusPacketGetNumChannels', () => {
    it('gets the number of channels', () => {
      iteratePacketsAndTest((keys: string[], packet: DataView) => {
        if (keys.includes('mono')) {
          expect(encoder['opusPacketGetNumChannels'](packet)).to.equal(1);
        } else if (keys.includes('stereo')) {
          expect(encoder['opusPacketGetNumChannels'](packet)).to.equal(2);
        }
      });
    });
  });

  describe('opusParseSize', () => {
    it('gets the size of a frame in bytes and returns the number of bytes parsed', () => {
      const sizeBytes: [number] = [0];

      // Test invalid 1-byte code 2 packet.
      expect(encoder['opusParseSize'](convertPacketToDataView([0x02]), 1, 0, sizeBytes)).to.equal(
        -1
      );
      expect(sizeBytes[0]).to.equal(-1);

      // Test 1-byte size indicator.
      expect(
        encoder['opusParseSize'](convertPacketToDataView([0x02, 0x80]), 1, 1, sizeBytes)
      ).to.equal(1);
      expect(sizeBytes[0]).to.equal(128);

      // Test invalid 2-byte code 2 packet.
      expect(
        encoder['opusParseSize'](convertPacketToDataView([0x02, 0xff]), 1, 1, sizeBytes)
      ).to.equal(-1);
      expect(sizeBytes[0]).to.equal(-1);

      // Test 2-byte size indicator.
      expect(
        encoder['opusParseSize'](convertPacketToDataView([0x02, 0xff, 0x01]), 1, 2, sizeBytes)
      ).to.equal(2);
      expect(sizeBytes[0]).to.equal(259);
    });
  });

  describe('opusPacketParseImpl', () => {
    it('handles bad arguments', () => {
      // Test null storage for frame sizes.
      expect(
        encoder['opusPacketParseImpl'](
          convertPacketToDataView([0x00]),
          1,
          false,
          null,
          null,
          null,
          null,
          null
        )
      ).to.equal(encoder['OPUS_BAD_ARG']);

      // Test negative data length.
      expect(
        encoder['opusPacketParseImpl'](
          convertPacketToDataView([]),
          -1,
          false,
          null,
          null,
          [],
          null,
          null
        )
      ).to.equal(encoder['OPUS_BAD_ARG']);
    });

    it('handles invalid packets', () => {
      const frameSizes = new Array<[number]>(encoder['OPUS_MAX_OPUS_FRAMES']);
      for (let i = 0; i < encoder['OPUS_MAX_OPUS_FRAMES']; ++i) {
        frameSizes[i] = [undefined];
      }

      // Test zero length data.
      expect(
        encoder['opusPacketParseImpl'](
          convertPacketToDataView([]),
          0,
          false,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(encoder['OPUS_INVALID_PACKET']);

      // Test undelimited code 1 packet with an odd number of bytes available for the two frames.
      expect(
        encoder['opusPacketParseImpl'](
          convertPacketToDataView([0x01, 0x00]),
          2,
          false,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(encoder['OPUS_INVALID_PACKET']);

      // Test code 2 packet where the size of the first frame cannot be determined.
      expect(
        encoder['opusPacketParseImpl'](
          convertPacketToDataView([0x02]),
          1,
          false,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(encoder['OPUS_INVALID_PACKET']);

      // Test code 2 packet with not enough bytes for the first frame.
      expect(
        encoder['opusPacketParseImpl'](
          convertPacketToDataView([0x02, 0x01]),
          2,
          false,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(encoder['OPUS_INVALID_PACKET']);

      // Test code 3 packet with less than 2 bytes.
      expect(
        encoder['opusPacketParseImpl'](
          convertPacketToDataView([0x03]),
          1,
          false,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(encoder['OPUS_INVALID_PACKET']);

      // Test code 3 packet where the number of frames is 0.
      expect(
        encoder['opusPacketParseImpl'](
          convertPacketToDataView([0x03, 0x00]),
          2,
          false,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(encoder['OPUS_INVALID_PACKET']);

      // Test code 3 packet with more than 120ms of audio.
      expect(
        encoder['opusPacketParseImpl'](
          convertPacketToDataView([0x03, 0x3f]),
          2,
          false,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(encoder['OPUS_INVALID_PACKET']);

      // Test padded code 3 packet with no padding count bytes.
      expect(
        encoder['opusPacketParseImpl'](
          convertPacketToDataView([0x03, 0x41]),
          2,
          false,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(encoder['OPUS_INVALID_PACKET']);

      // Test padded code 3 packet where the size of the indicated padding is larger than the packet size.
      expect(
        encoder['opusPacketParseImpl'](
          convertPacketToDataView([0x03, 0x41, 0x01]),
          3,
          false,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(encoder['OPUS_INVALID_PACKET']);

      // Test code 3 VBR packet where the size of a frame cannot be determined.
      expect(
        encoder['opusPacketParseImpl'](
          convertPacketToDataView([0x03, 0x82]),
          2,
          false,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(encoder['OPUS_INVALID_PACKET']);

      // Test code 3 VBR packet with not enough bytes for the given frame sizes.
      expect(
        encoder['opusPacketParseImpl'](
          convertPacketToDataView([0x03, 0x82, 0x01]),
          3,
          false,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(encoder['OPUS_INVALID_PACKET']);

      // Test code 3 VBR packet where the size of the last frame is negative.
      expect(
        encoder['opusPacketParseImpl'](
          convertPacketToDataView([0x03, 0x83, 0x02, 0x01, 0x00, 0x00]),
          6,
          false,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(encoder['OPUS_INVALID_PACKET']);

      // Test undelimited code 3 CBR packet where the number of bytes available for the frames is not a non-negative
      // integer multiple of the indicated number of frames.
      expect(
        encoder['opusPacketParseImpl'](
          convertPacketToDataView([0x03, 0x02, 0x00]),
          3,
          false,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(encoder['OPUS_INVALID_PACKET']);

      // Test self-delimited packet where the delimited size cannot be determined.
      expect(
        encoder['opusPacketParseImpl'](
          convertPacketToDataView([0x00]),
          1,
          true,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(encoder['OPUS_INVALID_PACKET']);

      // Test self-delimited packet with not enough bytes for the delimited size.
      expect(
        encoder['opusPacketParseImpl'](
          convertPacketToDataView([0x00, 0x01]),
          2,
          true,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(encoder['OPUS_INVALID_PACKET']);

      // Test self-delimited CBR packet with not enough bytes for the delimited CBR sizes.
      expect(
        encoder['opusPacketParseImpl'](
          convertPacketToDataView([0x01, 0x01, 0x00]),
          3,
          true,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(encoder['OPUS_INVALID_PACKET']);

      // Test self-delimited VBR packet that fails the upper bound sanity check.
      expect(
        encoder['opusPacketParseImpl'](
          convertPacketToDataView([0x02, 0x01, 0x02, 0x00, 0x00]),
          5,
          true,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(encoder['OPUS_INVALID_PACKET']);

      // Test undelimited packet that exceeds the size limit for the last frame.
      expect(
        encoder['opusPacketParseImpl'](
          new DataView(new ArrayBuffer(encoder['OPUS_MAX_FRAME_SIZE_BYTES'] + 2)),
          encoder['OPUS_MAX_FRAME_SIZE_BYTES'] + 2,
          false,
          null,
          null,
          frameSizes,
          null,
          null
        )
      ).to.equal(encoder['OPUS_INVALID_PACKET']);
    });

    it('parses Opus packet data', () => {
      iteratePacketsAndTest((keys: string[], packet: DataView) => {
        let numFrames: number = 0;
        const tocByte: [number] = [0];
        const payloadOffset: [number] = [0];
        const packetLenBytes: [number] = [0];
        const numDelimitingBytes: [number] = [0];
        let delimitedPacket: DataView;

        const frameOffsets = new Array<[number]>(encoder['OPUS_MAX_OPUS_FRAMES']);
        const frameSizes = new Array<[number]>(encoder['OPUS_MAX_OPUS_FRAMES']);
        for (let i = 0; i < encoder['OPUS_MAX_OPUS_FRAMES']; ++i) {
          frameOffsets[i] = [undefined];
          frameSizes[i] = [undefined];
        }

        let headerLenBytes: number = 0;
        let payloadLenBytes: number = 0;

        if (keys.includes('code0')) {
          // Test undelimited packet.
          numFrames = encoder['opusPacketParseImpl'](
            packet,
            packet.byteLength,
            false,
            null,
            null,
            frameSizes,
            null,
            null
          );

          expect(numFrames).to.equal(1);

          numFrames = encoder['opusPacketParseImpl'](
            packet,
            packet.byteLength,
            false,
            tocByte,
            frameOffsets,
            frameSizes,
            payloadOffset,
            packetLenBytes
          );
          headerLenBytes = 1;
          payloadLenBytes = packet.byteLength - headerLenBytes;

          expect(numFrames).to.equal(1);
          expect(tocByte[0]).to.equal(packet.getUint8(0));
          expect(frameOffsets[0][0]).to.equal(headerLenBytes);
          expect(frameSizes[0][0]).to.equal(payloadLenBytes);
          expect(payloadOffset[0]).to.equal(headerLenBytes);
          expect(packetLenBytes[0]).to.equal(packet.byteLength);

          // Test self-delimited packet.
          delimitedPacket = convertToSelfDelimited(
            packet,
            frameSizes[numFrames - 1][0],
            payloadOffset[0],
            packetLenBytes[0],
            numDelimitingBytes
          );
          numFrames = encoder['opusPacketParseImpl'](
            delimitedPacket,
            delimitedPacket.byteLength,
            true,
            tocByte,
            frameOffsets,
            frameSizes,
            payloadOffset,
            packetLenBytes
          );
          headerLenBytes = 1 + numDelimitingBytes[0];
          payloadLenBytes = delimitedPacket.byteLength - headerLenBytes;

          expect(numFrames).to.equal(1);
          expect(tocByte[0]).to.equal(delimitedPacket.getUint8(0));
          expect(frameOffsets[0][0]).to.equal(headerLenBytes);
          expect(frameSizes[0][0]).to.equal(payloadLenBytes);
          expect(payloadOffset[0]).to.equal(headerLenBytes);
          expect(packetLenBytes[0]).to.equal(delimitedPacket.byteLength);
        } else if (keys.includes('code1')) {
          // Test undelimited packet.
          numFrames = encoder['opusPacketParseImpl'](
            packet,
            packet.byteLength,
            false,
            tocByte,
            frameOffsets,
            frameSizes,
            payloadOffset,
            packetLenBytes
          );
          headerLenBytes = 1;
          payloadLenBytes = packet.byteLength - headerLenBytes;

          expect(numFrames).to.equal(2);
          expect(tocByte[0]).to.equal(packet.getUint8(0));
          expect(frameOffsets[0][0]).to.equal(headerLenBytes);
          expect(frameOffsets[1][0]).to.equal(headerLenBytes + payloadLenBytes / 2);
          expect(frameSizes[0][0]).to.equal(payloadLenBytes / 2);
          expect(frameSizes[1][0]).to.equal(payloadLenBytes / 2);
          expect(payloadOffset[0]).to.equal(headerLenBytes);
          expect(packetLenBytes[0]).to.equal(packet.byteLength);

          // Test self-delimited packet.
          delimitedPacket = convertToSelfDelimited(
            packet,
            frameSizes[numFrames - 1][0],
            payloadOffset[0],
            packetLenBytes[0],
            numDelimitingBytes
          );
          numFrames = encoder['opusPacketParseImpl'](
            delimitedPacket,
            delimitedPacket.byteLength,
            true,
            tocByte,
            frameOffsets,
            frameSizes,
            payloadOffset,
            packetLenBytes
          );
          headerLenBytes = 1 + numDelimitingBytes[0];
          payloadLenBytes = delimitedPacket.byteLength - headerLenBytes;

          expect(numFrames).to.equal(2);
          expect(tocByte[0]).to.equal(delimitedPacket.getUint8(0));
          expect(frameOffsets[0][0]).to.equal(headerLenBytes);
          expect(frameOffsets[1][0]).to.equal(headerLenBytes + payloadLenBytes / 2);
          expect(frameSizes[0][0]).to.equal(payloadLenBytes / 2);
          expect(frameSizes[1][0]).to.equal(payloadLenBytes / 2);
          expect(payloadOffset[0]).to.equal(headerLenBytes);
          expect(packetLenBytes[0]).to.equal(delimitedPacket.byteLength);
        } else if (keys.includes('code2')) {
          numFrames = encoder['opusPacketParseImpl'](
            packet,
            packet.byteLength,
            false,
            tocByte,
            frameOffsets,
            frameSizes,
            payloadOffset,
            packetLenBytes
          );

          const firstFrameSizeBytes =
            packet.getUint8(1) > 251
              ? 4 * packet.getUint8(2) + packet.getUint8(1)
              : packet.getUint8(1);
          headerLenBytes = packet.getUint8(1) > 251 ? 1 + 2 : 1 + 1;
          payloadLenBytes = packet.byteLength - headerLenBytes;

          expect(numFrames).to.equal(2);
          expect(tocByte[0]).to.equal(packet.getUint8(0));
          expect(frameOffsets[0][0]).to.equal(headerLenBytes);
          expect(frameOffsets[1][0]).to.equal(headerLenBytes + firstFrameSizeBytes);
          expect(frameSizes[0][0]).to.equal(firstFrameSizeBytes);
          expect(frameSizes[1][0]).to.equal(payloadLenBytes - firstFrameSizeBytes);
          expect(payloadOffset[0]).to.equal(headerLenBytes);
          expect(packetLenBytes[0]).to.equal(packet.byteLength);
        } else if (keys.includes('code3')) {
          // Test undelimited packet.
          numFrames = encoder['opusPacketParseImpl'](
            packet,
            packet.byteLength,
            false,
            tocByte,
            frameOffsets,
            frameSizes,
            payloadOffset,
            packetLenBytes
          );

          // Remove padding before checking for correctness.
          headerLenBytes = 2;
          let remainingBytes = packet.byteLength - headerLenBytes;
          if (keys.includes('pad')) {
            let paddingCountByte: number;
            let numPaddingBytes: number;

            do {
              paddingCountByte = packet.getUint8(headerLenBytes++);
              --remainingBytes;

              numPaddingBytes = paddingCountByte === 255 ? 254 : paddingCountByte;
              remainingBytes -= numPaddingBytes;
            } while (paddingCountByte === 255);
          }

          if (keys.includes('variableBitrate')) {
            expect(numFrames).to.equal(packet.getUint8(1) & 0x3f);
            expect(tocByte[0]).to.equal(packet.getUint8(0));

            // Check the sizes of all frames except the last frame.
            let lastFrameSize = remainingBytes;
            for (let i = 0; i < numFrames - 1; ++i) {
              const sizeBytes: [number] = [0];
              const numBytesParsed = encoder['opusParseSize'](
                packet,
                headerLenBytes,
                remainingBytes,
                sizeBytes
              );
              expect(frameSizes[i][0]).to.equal(sizeBytes[0]);

              remainingBytes -= numBytesParsed;
              headerLenBytes += numBytesParsed;

              lastFrameSize -= numBytesParsed + frameSizes[i][0];
            }

            // Check the size of the last frame.
            expect(frameSizes[numFrames - 1][0]).to.equal(lastFrameSize);

            // Check the offsets of all the frames.
            let expectedOffset = headerLenBytes;
            for (let i = 0; i < numFrames; ) {
              expect(frameOffsets[i][0]).to.equal(expectedOffset);
              ++i;
              expectedOffset += frameSizes[i - 1][0];
            }

            expect(payloadOffset[0]).to.equal(headerLenBytes);
            expect(packetLenBytes[0]).to.equal(packet.byteLength);
          } else if (keys.includes('constantBitrate')) {
            expect(numFrames).to.equal(packet.getUint8(1) & 0x3f);
            expect(tocByte[0]).to.equal(packet.getUint8(0));

            // Check that all the frames are of equal size.
            let expectedFrameSizeBytes: [number] = [remainingBytes / numFrames];
            for (let i = 0; i < numFrames; ++i) {
              expect(frameSizes[i][0]).to.equal(expectedFrameSizeBytes[0]);
            }

            // Check the offsets of all the frames.
            let expectedOffset = headerLenBytes;
            for (let i = 0; i < numFrames; ++i) {
              expect(frameOffsets[i][0]).to.equal(expectedOffset);
              expectedOffset += expectedFrameSizeBytes[0];
            }

            expect(payloadOffset[0]).to.equal(headerLenBytes);
            expect(packetLenBytes[0]).to.equal(packet.byteLength);

            // Test self-delimited packet.
            delimitedPacket = convertToSelfDelimited(
              packet,
              frameSizes[numFrames - 1][0],
              payloadOffset[0],
              packetLenBytes[0],
              null
            );
            numFrames = encoder['opusPacketParseImpl'](
              delimitedPacket,
              delimitedPacket.byteLength,
              true,
              tocByte,
              frameOffsets,
              frameSizes,
              payloadOffset,
              packetLenBytes
            );

            // Remove padding before checking for correctness.
            headerLenBytes = 2;
            remainingBytes = delimitedPacket.byteLength - headerLenBytes;
            if (keys.includes('pad')) {
              let paddingCountByte: number;
              let numPaddingBytes: number;

              do {
                paddingCountByte = delimitedPacket.getUint8(headerLenBytes++);
                --remainingBytes;

                numPaddingBytes = paddingCountByte === 255 ? 254 : paddingCountByte;
                remainingBytes -= numPaddingBytes;
              } while (paddingCountByte === 255);
            }

            // Parse the delimiting byte(s).
            expectedFrameSizeBytes = [0];
            const numBytesParsed = encoder['opusParseSize'](
              delimitedPacket,
              headerLenBytes,
              remainingBytes,
              expectedFrameSizeBytes
            );
            headerLenBytes += numBytesParsed;

            expect(numFrames).to.equal(delimitedPacket.getUint8(1) & 0x3f);
            expect(tocByte[0]).to.equal(delimitedPacket.getUint8(0));

            // Check that all the frames are of equal size.
            for (let i = 0; i < numFrames; ++i) {
              expect(frameSizes[i][0]).to.equal(expectedFrameSizeBytes[0]);
            }

            // Check the offsets of all the frames.
            expectedOffset = headerLenBytes;
            for (let i = 0; i < numFrames; ++i) {
              expect(frameOffsets[i][0]).to.equal(expectedOffset);
              expectedOffset += expectedFrameSizeBytes[0];
            }

            expect(payloadOffset[0]).to.equal(headerLenBytes);
            expect(packetLenBytes[0]).to.equal(delimitedPacket.byteLength);
          }
        }
      });
    });
  });

  describe('opusPacketParse', () => {
    it('parses the number of frames from a single undelimited packet', () => {
      // This is a trivial test since `opusPacketParse()` is just a wrapper around `opusPacketParseImpl()` and
      // `opusPacketParseImpl()` is already fully tested.
      const frameSizes: Array<[number]> = [[undefined]];
      expect(
        encoder['opusPacketParse'](convertPacketToDataView([0x00]), 1, null, null, frameSizes, null)
      ).to.equal(1);
      expect(frameSizes[0][0]).to.equal(0);
    });
  });

  describe('opusPacketHasVoiceActivity', () => {
    it('handles packets with no VAD information', () => {
      // Test null packet.
      expect(encoder['opusPacketHasVoiceActivity'](null, 0)).to.equal(0);

      // Test 0 length packet.
      expect(encoder['opusPacketHasVoiceActivity'](convertPacketToDataView([]), 0)).to.equal(0);

      iteratePacketsAndTest((keys: string[], packet: DataView) => {
        if (keys.includes('celtOnly')) {
          expect(encoder['opusPacketHasVoiceActivity'](packet, packet.byteLength)).to.equal(-1);
        }
      });

      // Test an invalid packet. This invalid packet is a SILK-only code 3 packet with less than 2 bytes.
      expect(encoder['opusPacketHasVoiceActivity'](convertPacketToDataView([0x03]), 1)).to.equal(
        -1
      );
    });

    it('handles packets with VAD information', () => {
      iteratePacketsAndTest((keys: string[], packet: DataView) => {
        if (keys.includes('noVad')) {
          expect(encoder['opusPacketHasVoiceActivity'](packet, packet.byteLength)).to.equal(0);
        } else if (keys.includes('vad')) {
          expect(encoder['opusPacketHasVoiceActivity'](packet, packet.byteLength)).to.equal(1);
        }
      });

      // Test SILK-only packet with a 0 length frame.
      expect(encoder['opusPacketHasVoiceActivity'](convertPacketToDataView([0x00]), 1)).to.equal(0);

      // Test 10ms stereo SILK-only packet with only the side VAD bit set.
      expect(
        encoder['opusPacketHasVoiceActivity'](convertPacketToDataView([0x04, 0x20]), 2)
      ).to.equal(1);
    });
  });

  describe('opusPacketHasFec', () => {
    it('handles packets with no fec information', () => {
      // Test null packet.
      expect(encoder['opusPacketHasFec'](null, 0)).to.be.false;

      // Test 0 length packet.
      expect(encoder['opusPacketHasFec'](convertPacketToDataView([]), 0)).to.be.false;

      // Test celt only packets.
      iteratePacketsAndTest((keys: string[], packet: DataView) => {
        if (keys.includes('celtOnly')) {
          expect(encoder['opusPacketHasFec'](packet, packet.byteLength)).to.be.false;
        }
      });

      // Test packets without vad.
      iteratePacketsAndTest((keys: string[], packet: DataView) => {
        if (keys.includes('noVad')) {
          expect(encoder['opusPacketHasFec'](packet, packet.byteLength)).to.be.false;
        }
      });

      // Test an invalid packet. This invalid packet is a SILK-only code 3 packet with less than 2 bytes.
      expect(encoder['opusPacketHasFec'](convertPacketToDataView([0x03]), 1)).to.be.false;
    });

    it('handles packets with fec information', () => {
      iteratePacketsAndTest((keys: string[], packet: DataView) => {
        if (keys.includes('withFec')) {
          expect(encoder['opusPacketHasFec'](packet, packet.byteLength)).to.be.true;
          expect(encoder['opusPacketHasVoiceActivity'](packet, packet.byteLength)).to.equal(1);
        }
      });
    });
  });
});
