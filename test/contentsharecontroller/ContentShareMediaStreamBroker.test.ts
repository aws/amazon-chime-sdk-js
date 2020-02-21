// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';
import { SinonStub } from 'sinon';

import ContentShareMediaStreamBroker from '../../src/contentsharecontroller/ContentShareMediaStreamBroker';
import DefaultDeviceController from '../../src/devicecontroller/DefaultDeviceController';
import NoOpLogger from '../../src/logger/NoOpLogger';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('ContentShareMediaStreamBroker', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const behavior = new DOMMockBehavior();

  let contentShareMediaStreamBroker: ContentShareMediaStreamBroker;
  let noOpLogger: NoOpLogger;
  let domMockBuilder: DOMMockBuilder;
  let mediaStream: MediaStream;
  let mediaAudioTrack: MediaStreamTrack;

  beforeEach(() => {
    noOpLogger = new NoOpLogger();
    contentShareMediaStreamBroker = new ContentShareMediaStreamBroker(noOpLogger);
    // @ts-ignore
    domMockBuilder = new DOMMockBuilder(behavior);
    mediaStream = new MediaStream();
    // @ts-ignore
    mediaAudioTrack = new MediaStreamTrack('audio-track-id', 'audio');
  });

  afterEach(() => {
    if (domMockBuilder) {
      domMockBuilder.cleanup();
      domMockBuilder = null;
    }
  });

  it('can be constructed', () => {
    expect(contentShareMediaStreamBroker).to.exist;
  });

  it('media stream accessor', () => {
    contentShareMediaStreamBroker.mediaStream = mediaStream;
    expect(contentShareMediaStreamBroker.mediaStream).to.equal(mediaStream);
  });

  describe('acquireAudioInputStream', () => {
    let defaultAudioStream: MediaStream;
    let synthesizeAudioDevice: SinonStub;

    beforeEach(() => {
      defaultAudioStream = new MediaStream();
      synthesizeAudioDevice = sinon
        .stub(DefaultDeviceController, 'synthesizeAudioDevice')
        .callsFake(() => {
          return defaultAudioStream;
        });
    });

    afterEach(() => {
      // @ts-ignore
      DefaultDeviceController.synthesizeAudioDevice.restore();
    });

    it('Call synthesizeAudioDevice without audio tracks', async () => {
      contentShareMediaStreamBroker.mediaStream = mediaStream;
      const output = await contentShareMediaStreamBroker.acquireAudioInputStream();
      synthesizeAudioDevice.calledOnceWith(0);
      expect(output).to.equal(defaultAudioStream);
      expect(output).not.to.equal(mediaStream);
    });

    it('Do not call synthesizeAudioDevice with audio tracks', async () => {
      mediaStream.addTrack(mediaAudioTrack);
      contentShareMediaStreamBroker.mediaStream = mediaStream;
      const output = await contentShareMediaStreamBroker.acquireAudioInputStream();
      synthesizeAudioDevice.neverCalledWith(sinon.match.any);
      expect(output).to.equal(mediaStream);
    });
  });

  describe('acquireVideoInputStream', () => {
    it('Return media stream', async () => {
      contentShareMediaStreamBroker.mediaStream = mediaStream;
      const videoStream: MediaStream = await contentShareMediaStreamBroker.acquireVideoInputStream();
      expect(videoStream).to.equal(mediaStream);
    });
  });

  describe('acquireDisplayInputStream', () => {
    it('getDisplayMedia if not electron', async () => {
      // @ts-ignore
      const mediaDevices = navigator.mediaDevices;
      // @ts-ignore
      const getDisplayMediaSpy = sinon.spy(mediaDevices, 'getDisplayMedia');
      const streamConstrait: MediaStreamConstraints = { video: true };
      await contentShareMediaStreamBroker.acquireDisplayInputStream(streamConstrait);
      getDisplayMediaSpy.calledOnceWith(streamConstrait);
    });

    it('getUserMedia if electron', async () => {
      // @ts-ignore
      const mediaDevices = navigator.mediaDevices;
      // @ts-ignore
      const getUserMedia = sinon.spy(mediaDevices, 'getUserMedia');
      const streamConstrait: MediaStreamConstraints = {
        audio: false,
        video: {
          // @ts-ignore
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: 'sourceId',
            maxFrameRate: 3,
          },
        },
      };
      await contentShareMediaStreamBroker.acquireDisplayInputStream(streamConstrait);
      getUserMedia.calledOnceWith(streamConstrait);
    });
  });

  describe('acquireScreenCaptureDisplayInputStream', () => {
    it('with source Id', async () => {
      const spy = sinon.spy(contentShareMediaStreamBroker, 'acquireDisplayInputStream');
      await contentShareMediaStreamBroker.acquireScreenCaptureDisplayInputStream('sourceId');
      spy.calledOnceWith(sinon.match.any);
    });

    it('without source Id', async () => {
      const spy = sinon.spy(contentShareMediaStreamBroker, 'acquireDisplayInputStream');
      await contentShareMediaStreamBroker.acquireScreenCaptureDisplayInputStream('sourceId');
      spy.calledOnceWith(sinon.match.any);
    });
  });

  describe('toggleMediaStream', () => {
    beforeEach(() => {
      mediaStream.addTrack(new MediaStreamTrack());
    });

    it('Handle undefined media stream', () => {
      contentShareMediaStreamBroker.toggleMediaStream(true);
    });

    it('Media stream with no track', () => {
      contentShareMediaStreamBroker.mediaStream = new MediaStream();
      contentShareMediaStreamBroker.toggleMediaStream(true);
    });

    it('Enable media stream', () => {
      contentShareMediaStreamBroker.mediaStream = mediaStream;
      contentShareMediaStreamBroker.toggleMediaStream(true);
      expect(mediaStream.getTracks()[0].enabled).to.be.true;
    });

    it('Disable media stream', () => {
      contentShareMediaStreamBroker.mediaStream = mediaStream;
      contentShareMediaStreamBroker.toggleMediaStream(false);
      expect(mediaStream.getTracks()[0].enabled).to.be.false;
    });
  });

  describe('cleanup', () => {
    beforeEach(() => {
      mediaStream.addTrack(new MediaStreamTrack());
    });

    it('Handle undefined media stream', () => {
      contentShareMediaStreamBroker.cleanup();
      expect(contentShareMediaStreamBroker.mediaStream).to.be.null;
    });

    it('Media stream with track', () => {
      contentShareMediaStreamBroker.mediaStream = mediaStream;
      contentShareMediaStreamBroker.cleanup();
      expect(contentShareMediaStreamBroker.mediaStream).to.be.null;
    });
  });

  describe('releaseMediaStream', () => {
    it('Warning is logged', () => {
      const spy = sinon.spy(noOpLogger, 'warn');
      contentShareMediaStreamBroker.releaseMediaStream(null);
      spy.calledOnceWith('release media stream called');
    });
  });

  describe('bindToAudioVideoController', () => {
    it('not supported', () => {
      expect(() => {
        contentShareMediaStreamBroker.bindToAudioVideoController(null);
      }).to.throw('unsupported');
    });
  });
});
