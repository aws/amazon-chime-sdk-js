// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import {
  COMMON_MESSAGE_TYPES,
  TRANSFORM_NAMES,
} from '../../src/encodedtransformworker/EncodedTransform';
import {
  AudioReceiverMetricsTransform,
  AudioSenderMetricsTransform,
  MEDIA_METRICS_MESSAGE_TYPES,
  VideoReceiverMetricsTransform,
  VideoSenderMetricsTransform,
} from '../../src/encodedtransformworker/MediaMetricsEncodedTransform';

describe('MediaMetricsEncodedTransform', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  let postMessageStub: sinon.SinonStub;

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

  describe('MEDIA_METRICS_MESSAGE_TYPES', () => {
    it('has correct NEW_SSRC value', () => {
      expect(MEDIA_METRICS_MESSAGE_TYPES.NEW_SSRC).to.equal('NewSSRC');
    });
  });

  describe('AudioSenderMetricsTransform', () => {
    let transform: AudioSenderMetricsTransform;

    beforeEach(() => {
      transform = new AudioSenderMetricsTransform();
    });

    it('forwards frames unchanged', () => {
      const frame = {
        data: new ArrayBuffer(10),
        timestamp: 12345,
        getMetadata: () => ({ synchronizationSource: 1234567890 }),
      };
      const controller = { enqueue: sinon.stub() } as unknown as TransformStreamDefaultController<
        RTCEncodedAudioFrame | RTCEncodedVideoFrame
      >;

      transform.transform(frame as RTCEncodedAudioFrame, controller);
      expect((controller.enqueue as sinon.SinonStub).calledOnceWith(frame)).to.be.true;
    });

    it('creates metrics for new SSRC and posts NEW_SSRC message', () => {
      const frame = {
        data: new ArrayBuffer(10),
        timestamp: 12345,
        getMetadata: () => ({ synchronizationSource: 1234567890 }),
      };
      const controller = { enqueue: sinon.stub() } as unknown as TransformStreamDefaultController<
        RTCEncodedAudioFrame | RTCEncodedVideoFrame
      >;

      transform.transform(frame as RTCEncodedAudioFrame, controller);

      const newSsrcCall = postMessageStub
        .getCalls()
        .find(call => call.args[0].type === MEDIA_METRICS_MESSAGE_TYPES.NEW_SSRC);
      expect(newSsrcCall).to.not.be.undefined;
      expect(newSsrcCall.args[0].transformName).to.equal(TRANSFORM_NAMES.AUDIO_SENDER);
      expect(newSsrcCall.args[0].message.ssrc).to.equal('1234567890');
    });

    it('reports metrics after reportInterval time has passed', () => {
      const clock = sinon.useFakeTimers();
      const frame = {
        data: new ArrayBuffer(10),
        timestamp: 12345,
        getMetadata: () => ({ synchronizationSource: 1234567890 }),
      };
      const controller = { enqueue: sinon.stub() } as unknown as TransformStreamDefaultController<
        RTCEncodedAudioFrame | RTCEncodedVideoFrame
      >;

      // Process first frame - no metrics report yet
      transform.transform(frame as RTCEncodedAudioFrame, controller);

      // Advance time by 500ms and process another frame to trigger report
      clock.tick(500);
      transform.transform(frame as RTCEncodedAudioFrame, controller);

      const metricsCall = postMessageStub
        .getCalls()
        .find(call => call.args[0].type === COMMON_MESSAGE_TYPES.METRICS);
      expect(metricsCall).to.not.be.undefined;
      expect(metricsCall.args[0].transformName).to.equal(TRANSFORM_NAMES.AUDIO_SENDER);

      clock.restore();
    });

    it('handles frames without getMetadata', () => {
      const frame = {
        data: new ArrayBuffer(10),
        timestamp: 12345,
      };
      const controller = { enqueue: sinon.stub() } as unknown as TransformStreamDefaultController<
        RTCEncodedAudioFrame | RTCEncodedVideoFrame
      >;

      // @ts-ignore - testing missing getMetadata
      transform.transform(frame, controller);
      expect((controller.enqueue as sinon.SinonStub).calledOnce).to.be.true;
    });

    it('handles frames with getMetadata returning no synchronizationSource', () => {
      const frame = {
        data: new ArrayBuffer(10),
        timestamp: 12345,
        getMetadata: () => ({}),
      };
      const controller = { enqueue: sinon.stub() } as unknown as TransformStreamDefaultController<
        RTCEncodedAudioFrame | RTCEncodedVideoFrame
      >;

      transform.transform(frame as RTCEncodedAudioFrame, controller);
      expect((controller.enqueue as sinon.SinonStub).calledOnce).to.be.true;
    });

    it('tracks multiple SSRCs separately', () => {
      const frame1 = {
        data: new ArrayBuffer(10),
        timestamp: 12345,
        getMetadata: () => ({ synchronizationSource: 111 }),
      };
      const frame2 = {
        data: new ArrayBuffer(10),
        timestamp: 12346,
        getMetadata: () => ({ synchronizationSource: 222 }),
      };
      const controller = { enqueue: sinon.stub() } as unknown as TransformStreamDefaultController<
        RTCEncodedAudioFrame | RTCEncodedVideoFrame
      >;

      transform.transform(frame1 as RTCEncodedAudioFrame, controller);
      transform.transform(frame2 as RTCEncodedAudioFrame, controller);

      const newSsrcCalls = postMessageStub
        .getCalls()
        .filter(call => call.args[0].type === MEDIA_METRICS_MESSAGE_TYPES.NEW_SSRC);
      expect(newSsrcCalls.length).to.equal(2);
    });
  });

  describe('AudioReceiverMetricsTransform', () => {
    let transform: AudioReceiverMetricsTransform;

    beforeEach(() => {
      transform = new AudioReceiverMetricsTransform();
    });

    it('forwards frames unchanged', () => {
      const frame = {
        data: new ArrayBuffer(10),
        timestamp: 12345,
        getMetadata: () => ({ synchronizationSource: 1234567890 }),
      };
      const controller = { enqueue: sinon.stub() } as unknown as TransformStreamDefaultController<
        RTCEncodedAudioFrame | RTCEncodedVideoFrame
      >;

      transform.transform(frame as RTCEncodedAudioFrame, controller);
      expect((controller.enqueue as sinon.SinonStub).calledOnceWith(frame)).to.be.true;
    });

    it('uses correct transform name', () => {
      const frame = {
        data: new ArrayBuffer(10),
        timestamp: 12345,
        getMetadata: () => ({ synchronizationSource: 1234567890 }),
      };
      const controller = { enqueue: sinon.stub() } as unknown as TransformStreamDefaultController<
        RTCEncodedAudioFrame | RTCEncodedVideoFrame
      >;

      transform.transform(frame as RTCEncodedAudioFrame, controller);

      const newSsrcCall = postMessageStub
        .getCalls()
        .find(call => call.args[0].type === MEDIA_METRICS_MESSAGE_TYPES.NEW_SSRC);
      expect(newSsrcCall.args[0].transformName).to.equal(TRANSFORM_NAMES.AUDIO_RECEIVER);
    });
  });

  describe('VideoSenderMetricsTransform', () => {
    let transform: VideoSenderMetricsTransform;

    beforeEach(() => {
      transform = new VideoSenderMetricsTransform();
    });

    it('forwards frames unchanged', () => {
      const frame = {
        data: new ArrayBuffer(10),
        timestamp: 12345,
        getMetadata: () => ({ synchronizationSource: 1234567890 }),
      };
      const controller = { enqueue: sinon.stub() } as unknown as TransformStreamDefaultController<
        RTCEncodedAudioFrame | RTCEncodedVideoFrame
      >;

      transform.transform(frame as RTCEncodedVideoFrame, controller);
      expect((controller.enqueue as sinon.SinonStub).calledOnceWith(frame)).to.be.true;
    });

    it('uses correct transform name', () => {
      const frame = {
        data: new ArrayBuffer(10),
        timestamp: 12345,
        getMetadata: () => ({ synchronizationSource: 1234567890 }),
      };
      const controller = { enqueue: sinon.stub() } as unknown as TransformStreamDefaultController<
        RTCEncodedAudioFrame | RTCEncodedVideoFrame
      >;

      transform.transform(frame as RTCEncodedVideoFrame, controller);

      const newSsrcCall = postMessageStub
        .getCalls()
        .find(call => call.args[0].type === MEDIA_METRICS_MESSAGE_TYPES.NEW_SSRC);
      expect(newSsrcCall.args[0].transformName).to.equal(TRANSFORM_NAMES.VIDEO_SENDER);
    });
  });

  describe('VideoReceiverMetricsTransform', () => {
    let transform: VideoReceiverMetricsTransform;

    beforeEach(() => {
      transform = new VideoReceiverMetricsTransform();
    });

    it('forwards frames unchanged', () => {
      const frame = {
        data: new ArrayBuffer(10),
        timestamp: 12345,
        getMetadata: () => ({ synchronizationSource: 1234567890 }),
      };
      const controller = { enqueue: sinon.stub() } as unknown as TransformStreamDefaultController<
        RTCEncodedAudioFrame | RTCEncodedVideoFrame
      >;

      transform.transform(frame as RTCEncodedVideoFrame, controller);
      expect((controller.enqueue as sinon.SinonStub).calledOnceWith(frame)).to.be.true;
    });

    it('uses correct transform name', () => {
      const frame = {
        data: new ArrayBuffer(10),
        timestamp: 12345,
        getMetadata: () => ({ synchronizationSource: 1234567890 }),
      };
      const controller = { enqueue: sinon.stub() } as unknown as TransformStreamDefaultController<
        RTCEncodedAudioFrame | RTCEncodedVideoFrame
      >;

      transform.transform(frame as RTCEncodedVideoFrame, controller);

      const newSsrcCall = postMessageStub
        .getCalls()
        .find(call => call.args[0].type === MEDIA_METRICS_MESSAGE_TYPES.NEW_SSRC);
      expect(newSsrcCall.args[0].transformName).to.equal(TRANSFORM_NAMES.VIDEO_RECEIVER);
    });
  });
});
