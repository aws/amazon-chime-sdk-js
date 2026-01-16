// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import EncodedTransform, {
  COMMON_MESSAGE_TYPES,
  EncodedTransformMessage,
  TRANSFORM_NAMES,
} from '../../src/encodedtransformworker/EncodedTransform';

describe('EncodedTransform', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  let postMessageStub: sinon.SinonStub;

  // Concrete implementation for testing the abstract base class
  class TestEncodedTransform extends EncodedTransform {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transform(frame: any, controller: any): void {
      controller.enqueue(frame);
    }

    // Expose protected methods for testing
    testLog(message: string): void {
      this.log(message);
    }

    setShouldLog(value: boolean): void {
      this.shouldLog = value;
    }

    getTransformName(): string {
      return this.transformName();
    }
  }

  beforeEach(() => {
    postMessageStub = sinon.stub();
    // @ts-ignore
    global.self = { postMessage: postMessageStub };
  });

  afterEach(() => {
    sinon.restore();
    // @ts-ignore
    delete global.self;
  });

  describe('TRANSFORM_NAMES', () => {
    it('has correct REDUNDANT_AUDIO value', () => {
      expect(TRANSFORM_NAMES.REDUNDANT_AUDIO).to.equal('AudioRed');
    });

    it('has correct AUDIO_SENDER value', () => {
      expect(TRANSFORM_NAMES.AUDIO_SENDER).to.equal('AudioSender');
    });

    it('has correct AUDIO_RECEIVER value', () => {
      expect(TRANSFORM_NAMES.AUDIO_RECEIVER).to.equal('AudioReceiver');
    });

    it('has correct VIDEO_SENDER value', () => {
      expect(TRANSFORM_NAMES.VIDEO_SENDER).to.equal('VideoSender');
    });

    it('has correct VIDEO_RECEIVER value', () => {
      expect(TRANSFORM_NAMES.VIDEO_RECEIVER).to.equal('VideoReceiver');
    });
  });

  describe('COMMON_MESSAGE_TYPES', () => {
    it('has correct LOG value', () => {
      expect(COMMON_MESSAGE_TYPES.LOG).to.equal('Log');
    });

    it('has correct METRICS value', () => {
      expect(COMMON_MESSAGE_TYPES.METRICS).to.equal('Metrics');
    });
  });

  describe('EncodedTransform base class', () => {
    let transform: TestEncodedTransform;

    beforeEach(() => {
      transform = new TestEncodedTransform();
    });

    describe('transformName', () => {
      it('returns the constructor name by default', () => {
        expect(transform.getTransformName()).to.equal('TestEncodedTransform');
      });
    });

    describe('transform', () => {
      it('is abstract and must be implemented by subclass', () => {
        const frame = { data: new ArrayBuffer(10) };
        const controller = { enqueue: sinon.stub() };
        transform.transform(frame, controller);
        expect(controller.enqueue.calledOnceWith(frame)).to.be.true;
      });
    });

    describe('handleMessage', () => {
      it('is a no-op by default', () => {
        const message: EncodedTransformMessage = {
          type: 'SomeType',
          transformName: 'TestTransform',
        };
        // Should not throw
        transform.handleMessage(message);
      });
    });

    describe('log', () => {
      it('posts a log message to self when shouldLog is true', () => {
        transform.testLog('Test message');
        expect(postMessageStub.calledOnce).to.be.true;
        const call = postMessageStub.firstCall.args[0];
        expect(call.type).to.equal(COMMON_MESSAGE_TYPES.LOG);
        expect(call.transformName).to.equal('TestEncodedTransform');
        expect(call.message.text).to.equal('Test message');
      });

      it('does not post a message when shouldLog is false', () => {
        transform.setShouldLog(false);
        transform.testLog('Test message');
        expect(postMessageStub.called).to.be.false;
      });
    });
  });
});
