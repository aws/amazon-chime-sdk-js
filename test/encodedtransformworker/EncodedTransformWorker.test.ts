// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import {
  COMMON_MESSAGE_TYPES,
  TRANSFORM_NAMES,
} from '../../src/encodedtransformworker/EncodedTransform';
import EncodedTransformWorker from '../../src/encodedtransformworker/EncodedTransformWorker';

describe('EncodedTransformWorker', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  let postMessageStub: sinon.SinonStub;
  let originalSelf: typeof globalThis.self;
  // @ts-ignore
  let originalTransformStream: typeof TransformStream;

  beforeEach(() => {
    postMessageStub = sinon.stub();
    // @ts-ignore - Save original self
    originalSelf = global.self;
    // @ts-ignore - Save original TransformStream
    originalTransformStream = global.TransformStream;

    // @ts-ignore - Mock TransformStream
    global.TransformStream = class MockTransformStream {
      readable: ReadableStream;
      writable: WritableStream;
      constructor() {
        // @ts-ignore
        this.readable = {};
        // @ts-ignore
        this.writable = {};
      }
    };

    // @ts-ignore - Mock self for worker environment
    global.self = {
      postMessage: postMessageStub,
      onmessage: null,
    };
  });

  afterEach(() => {
    sinon.restore();
    // @ts-ignore - Restore original self
    global.self = originalSelf;
    // @ts-ignore - Restore original TransformStream
    global.TransformStream = originalTransformStream;
  });

  describe('initializeWorker', () => {
    it('initializes worker and sets up message handler', () => {
      EncodedTransformWorker.initializeWorker();
      // @ts-ignore
      expect(global.self.onmessage).to.not.be.null;
      expect(postMessageStub.called).to.be.true;
      const logCall = postMessageStub.firstCall.args[0];
      expect(logCall.type).to.equal(COMMON_MESSAGE_TYPES.LOG);
      expect(logCall.message.text).to.include('Initializing EncodedTransformWorker');
    });

    it('sets up RTCRtpScriptTransform handler when supported', () => {
      // @ts-ignore
      global.self.RTCRtpScriptTransformer = class {};
      EncodedTransformWorker.initializeWorker();
      // @ts-ignore
      expect(global.self.onrtctransform).to.not.be.null;
    });
  });

  describe('log', () => {
    it('posts log message to main thread', () => {
      EncodedTransformWorker.log('Test log message');
      expect(postMessageStub.calledOnce).to.be.true;
      const call = postMessageStub.firstCall.args[0];
      expect(call.type).to.equal(COMMON_MESSAGE_TYPES.LOG);
      expect(call.transformName).to.equal('EncodedTransformWorker');
      expect(call.message.text).to.equal('Test log message');
    });
  });

  describe('message handling', () => {
    beforeEach(() => {
      EncodedTransformWorker.initializeWorker();
    });

    it('handles StartEncodedTransformWorker message for legacy API', () => {
      const mockReadable = {
        pipeThrough: sinon.stub().returnsThis(),
        pipeTo: sinon.stub(),
      };
      const mockWritable = {};

      const message = {
        msgType: 'StartEncodedTransformWorker',
        audio: {
          send: { readable: mockReadable, writable: mockWritable },
        },
        options: {},
      };

      // @ts-ignore
      global.self.onmessage({ data: message });
      expect(mockReadable.pipeThrough.called).to.be.true;
    });

    it('handles StartEncodedTransformWorker without options', () => {
      const mockReadable = {
        pipeThrough: sinon.stub().returnsThis(),
        pipeTo: sinon.stub(),
      };
      const mockWritable = {};

      const message = {
        msgType: 'StartEncodedTransformWorker',
        audio: {
          send: { readable: mockReadable, writable: mockWritable },
        },
        // options is intentionally omitted to test the optional chaining
      };

      // @ts-ignore
      global.self.onmessage({ data: message });
      expect(mockReadable.pipeThrough.called).to.be.true;
    });

    it('handles StartEncodedTransformWorker with disabled redundant audio', () => {
      const mockReadable = {
        pipeThrough: sinon.stub().returnsThis(),
        pipeTo: sinon.stub(),
      };
      const mockWritable = {};

      const message = {
        msgType: 'StartEncodedTransformWorker',
        audio: {
          send: { readable: mockReadable, writable: mockWritable },
        },
        options: { disabledTransforms: { redundantAudio: true } },
      };

      // @ts-ignore
      global.self.onmessage({ data: message });
      expect(mockReadable.pipeThrough.called).to.be.true;
    });

    it('handles StartEncodedTransformWorker with audio receive', () => {
      const mockReadable = {
        pipeThrough: sinon.stub().returnsThis(),
        pipeTo: sinon.stub(),
      };
      const mockWritable = {};

      const message = {
        msgType: 'StartEncodedTransformWorker',
        audio: {
          receive: { readable: mockReadable, writable: mockWritable },
        },
        options: {},
      };

      // @ts-ignore
      global.self.onmessage({ data: message });
      expect(mockReadable.pipeThrough.called).to.be.true;
    });

    it('handles StartEncodedTransformWorker with video send', () => {
      const mockReadable = {
        pipeThrough: sinon.stub().returnsThis(),
        pipeTo: sinon.stub(),
      };
      const mockWritable = {};

      const message = {
        msgType: 'StartEncodedTransformWorker',
        video: {
          send: { readable: mockReadable, writable: mockWritable },
        },
        options: {},
      };

      // @ts-ignore
      global.self.onmessage({ data: message });
      expect(mockReadable.pipeThrough.called).to.be.true;
    });

    it('handles StartEncodedTransformWorker with video receive', () => {
      const mockReadable = {
        pipeThrough: sinon.stub().returnsThis(),
        pipeTo: sinon.stub(),
      };
      const mockWritable = {};

      const message = {
        msgType: 'StartEncodedTransformWorker',
        video: {
          receive: { readable: mockReadable, writable: mockWritable },
        },
        options: {},
      };

      // @ts-ignore
      global.self.onmessage({ data: message });
      expect(mockReadable.pipeThrough.called).to.be.true;
    });

    it('routes REDUNDANT_AUDIO messages to redundant audio transform', () => {
      const message = {
        type: 'RedPayloadType',
        transformName: TRANSFORM_NAMES.REDUNDANT_AUDIO,
        message: { payloadType: '111' },
      };

      // @ts-ignore
      global.self.onmessage({ data: message });
      // Should not throw - message is handled
    });

    it('logs unknown message types', () => {
      postMessageStub.resetHistory();
      const message = {
        type: 'UnknownType',
        transformName: 'UnknownTransform',
      };

      // @ts-ignore
      global.self.onmessage({ data: message });
      const logCalls = postMessageStub
        .getCalls()
        .filter(call => call.args[0].type === COMMON_MESSAGE_TYPES.LOG);
      const unknownMsgLog = logCalls.find(call =>
        call.args[0].message.text.includes('Unknown message type')
      );
      expect(unknownMsgLog).to.not.be.undefined;
    });
  });

  describe('RTCRtpScriptTransform handler', () => {
    beforeEach(() => {
      // @ts-ignore
      global.self.RTCRtpScriptTransformer = class {};
      EncodedTransformWorker.initializeWorker();
    });

    it('sets up audio sender pipeline', () => {
      const mockReadable = {
        pipeThrough: sinon.stub().returnsThis(),
        pipeTo: sinon.stub(),
      };
      const mockWritable = {};
      const transformer = {
        readable: mockReadable,
        writable: mockWritable,
        options: { mediaType: 'audio', operation: 'send', disabledTransforms: {} },
      };

      // @ts-ignore
      global.self.onrtctransform({ transformer });
      expect(mockReadable.pipeThrough.called).to.be.true;
    });

    it('sets up audio sender pipeline with RED disabled', () => {
      const mockReadable = {
        pipeThrough: sinon.stub().returnsThis(),
        pipeTo: sinon.stub(),
      };
      const mockWritable = {};
      const transformer = {
        readable: mockReadable,
        writable: mockWritable,
        options: {
          mediaType: 'audio',
          operation: 'send',
          disabledTransforms: { redundantAudio: true },
        },
      };

      // @ts-ignore
      global.self.onrtctransform({ transformer });
      expect(mockReadable.pipeThrough.calledOnce).to.be.true;
    });

    it('sets up audio receiver pipeline', () => {
      const mockReadable = {
        pipeThrough: sinon.stub().returnsThis(),
        pipeTo: sinon.stub(),
      };
      const mockWritable = {};
      const transformer = {
        readable: mockReadable,
        writable: mockWritable,
        options: { mediaType: 'audio', operation: 'receive', disabledTransforms: {} },
      };

      // @ts-ignore
      global.self.onrtctransform({ transformer });
      expect(mockReadable.pipeThrough.called).to.be.true;
    });

    it('sets up audio receiver pipeline with RED disabled', () => {
      const mockReadable = {
        pipeThrough: sinon.stub().returnsThis(),
        pipeTo: sinon.stub(),
      };
      const mockWritable = {};
      const transformer = {
        readable: mockReadable,
        writable: mockWritable,
        options: {
          mediaType: 'audio',
          operation: 'receive',
          disabledTransforms: { redundantAudio: true },
        },
      };

      // @ts-ignore
      global.self.onrtctransform({ transformer });
      expect(mockReadable.pipeThrough.calledOnce).to.be.true;
    });

    it('sets up video sender pipeline', () => {
      const mockReadable = {
        pipeThrough: sinon.stub().returnsThis(),
        pipeTo: sinon.stub(),
      };
      const mockWritable = {};
      const transformer = {
        readable: mockReadable,
        writable: mockWritable,
        options: { mediaType: 'video', operation: 'send' },
      };

      // @ts-ignore
      global.self.onrtctransform({ transformer });
      expect(mockReadable.pipeThrough.called).to.be.true;
    });

    it('sets up video receiver pipeline', () => {
      const mockReadable = {
        pipeThrough: sinon.stub().returnsThis(),
        pipeTo: sinon.stub(),
      };
      const mockWritable = {};
      const transformer = {
        readable: mockReadable,
        writable: mockWritable,
        options: { mediaType: 'video', operation: 'receive' },
      };

      // @ts-ignore
      global.self.onrtctransform({ transformer });
      expect(mockReadable.pipeThrough.called).to.be.true;
    });

    it('handles missing disabledTransforms option', () => {
      const mockReadable = {
        pipeThrough: sinon.stub().returnsThis(),
        pipeTo: sinon.stub(),
      };
      const mockWritable = {};
      const transformer = {
        readable: mockReadable,
        writable: mockWritable,
        options: { mediaType: 'audio', operation: 'send' },
      };

      // @ts-ignore
      global.self.onrtctransform({ transformer });
      expect(mockReadable.pipeThrough.called).to.be.true;
    });
  });
});
