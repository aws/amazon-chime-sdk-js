// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import MLVideoFxConfig from '../../src/mlvideofx/MLVideoFxConfig';
import MLVideoFxDriver from '../../src/mlvideofx/MLVideoFxDriver';
import MLVideoFxStreamHandler from '../../src/mlvideofx/MLVideoFxStreamHandler';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('MLVideoFxStreamHandler', () => {
  const assert: Chai.AssertStatic = chai.assert;
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpDebugLogger();
  const mockStreamId: string = 'test-stream';
  let streamHandler: MLVideoFxStreamHandler;
  let driver: MLVideoFxDriver;
  const config: MLVideoFxConfig = {
    blueShiftEnabled: false,
    redShiftEnabled: false,
  };
  let domMockBehavior: DOMMockBehavior;
  let domMockBuilder: DOMMockBuilder;
  let mockVideoStream: MediaStream;
  let mockVideoTrack: MediaStreamTrack;

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    domMockBehavior.createElementCaptureStream = new MediaStream();
    mockVideoStream = new MediaStream();
    // @ts-ignore
    mockVideoStream.id = mockStreamId;
    // @ts-ignore
    mockVideoTrack = new MediaStreamTrack('attach-media-input-task-video-track-id', 'video');
    mockVideoStream.addTrack(mockVideoTrack);
    // @ts-ignore
    driver = new MLVideoFxDriver(logger, config);
    // @ts-ignore
    streamHandler = new MLVideoFxStreamHandler(logger, driver);
  });

  afterEach(() => {
    streamHandler.stop();
    domMockBuilder.cleanup();
  });

  describe('construction', () => {
    it('can be constructed', () => {
      assert.exists(streamHandler);
    });
  });

  describe('setInputMediaStream', () => {
    it('can set the input', async () => {
      await streamHandler.setInputMediaStream(mockVideoStream);
      const outputStream = await streamHandler.getInputMediaStream();
      expect(outputStream.id).to.equal(mockStreamId);
      await streamHandler.setInputMediaStream(null);
    });

    it('catches the failure if videoInput play() fails due to load() being called before play() is finished', async () => {
      domMockBehavior.videoElementShouldFail = true;
      await streamHandler.setInputMediaStream(mockVideoStream);
      await streamHandler.setInputMediaStream(null);
    });

    it('can only set MediaStream with video tracks', async () => {
      const emptyStream = new MediaStream();
      await streamHandler.setInputMediaStream(emptyStream);
      const outputStream = await streamHandler.getInputMediaStream();
      expect(outputStream).to.equal(null);
      await streamHandler.setInputMediaStream(null);
    });

    it('can set a null stream multiple times', async () => {
      await streamHandler.setInputMediaStream(null);
      const outputStream = await streamHandler.getInputMediaStream();
      expect(outputStream).to.equal(null);
      await streamHandler.setInputMediaStream(null);
    });

    it('null should invoke stop on stream handler to clean resources', async () => {
      await streamHandler.setInputMediaStream(mockVideoStream);
      const spy_stop = sinon.spy(streamHandler, 'stop');
      await streamHandler.setInputMediaStream(null);
      expect(spy_stop.called).to.be.true;
    });
  });

  describe('getInputMediaStream', () => {
    it('can get the input', async () => {
      let inputStream = await streamHandler.getInputMediaStream();
      expect(inputStream).to.be.null;

      await streamHandler.setInputMediaStream(mockVideoStream);
      inputStream = await streamHandler.getInputMediaStream();
      expect(inputStream.id).to.equal(mockStreamId);
      await streamHandler.setInputMediaStream(null);
    });
  });

  describe('getActiveOutputMediaStream', () => {
    it('can switch streams', async () => {
      const activeStream = new MediaStream();
      // @ts-ignore
      activeStream.active = true;
      domMockBehavior.createElementCaptureStream = activeStream;
      const outputStream = streamHandler.getActiveOutputMediaStream();
      expect(outputStream).to.deep.equal(activeStream);
      // disable the output stream to trigger a recapture
      // @ts-ignore
      activeStream.active = false;
      const activeStream2 = new MediaStream();
      // @ts-ignore
      activeStream2.active = true;
      domMockBehavior.createElementCaptureStream = activeStream2;
      expect(streamHandler.getActiveOutputMediaStream()).to.deep.equal(activeStream2);
    });

    it('can get the same output stream', async () => {
      const activeStream = new MediaStream();
      // @ts-ignore
      activeStream.active = true;
      domMockBehavior.createElementCaptureStream = activeStream;
      const outputStream = streamHandler.getActiveOutputMediaStream();
      const outputStream2 = streamHandler.getActiveOutputMediaStream();
      expect(outputStream2).to.deep.equal(outputStream);
    });

    it('can clone audio tracks', async () => {
      const activeStream = new MediaStream();
      // @ts-ignore
      activeStream.active = true;
      domMockBehavior.createElementCaptureStream = activeStream;

      const inputStream = new MediaStream();
      const videoTrack = new MediaStreamTrack();
      // @ts-ignore
      videoTrack.kind = 'video';
      inputStream.addTrack(videoTrack);
      const audioTrack = new MediaStreamTrack();
      // @ts-ignore
      audioTrack.kind = 'audio';
      inputStream.addTrack(audioTrack);
      // @ts-ignore
      inputStream.active = true;
      await streamHandler.setInputMediaStream(inputStream);

      const outputStream = streamHandler.getActiveOutputMediaStream();
      expect(outputStream.getAudioTracks().length).to.equal(2);
    });
  });

  describe('accessor framerate', () => {
    it('getter can return the frame rate', () => {
      expect(streamHandler.framerate).to.equal(15);
    });

    it('setter can set the frame rate', () => {
      streamHandler.framerate = 30;
      expect(streamHandler.framerate).to.equal(30);
    });

    it('setter ignores frame rate less than 0', () => {
      streamHandler.framerate = -5;
      expect(streamHandler.framerate).to.equal(15);
    });
  });
});
