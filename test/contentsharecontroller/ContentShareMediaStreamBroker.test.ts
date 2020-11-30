// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
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
  const defaultStreamConstraints: MediaStreamConstraints = {
    audio: false,
    video: {
      frameRate: {
        max: 15,
      },
    },
  };
  const defaultElectronStreamConstraints: MediaStreamConstraints = {
    audio: false,
    video: {
      // @ts-ignore
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: 'sourceId',
        maxFrameRate: 15,
      },
    },
  };

  let contentShareMediaStreamBroker: ContentShareMediaStreamBroker;
  let noOpLogger: NoOpLogger;
  let dommMockBehavior: DOMMockBehavior;
  let domMockBuilder: DOMMockBuilder;
  let mediaStream: MediaStream;
  let mediaAudioTrack: MediaStreamTrack;

  beforeEach(() => {
    noOpLogger = new NoOpLogger();
    contentShareMediaStreamBroker = new ContentShareMediaStreamBroker(noOpLogger);
    dommMockBehavior = new DOMMockBehavior();
    // @ts-ignore
    domMockBuilder = new DOMMockBuilder(dommMockBehavior);
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
      await contentShareMediaStreamBroker.acquireDisplayInputStream(defaultStreamConstraints);
      // @ts-ignore
      expect(getDisplayMediaSpy.calledWith(sinon.match(defaultStreamConstraints))).to.be.true;
    });

    it('getUserMedia if electron', async () => {
      // @ts-ignore
      const mediaDevices = navigator.mediaDevices;
      // @ts-ignore
      const getUserMedia = sinon.spy(mediaDevices, 'getUserMedia');
      await contentShareMediaStreamBroker.acquireDisplayInputStream(
        defaultElectronStreamConstraints
      );
      expect(getUserMedia.calledWith(sinon.match(defaultElectronStreamConstraints))).to.be.true;
    });
  });

  describe('acquireScreenCaptureDisplayInputStream', () => {
    it('with source Id', async () => {
      const spy = sinon.spy(contentShareMediaStreamBroker, 'acquireDisplayInputStream');
      await contentShareMediaStreamBroker.acquireScreenCaptureDisplayInputStream('sourceId');
      expect(spy.calledWith(sinon.match(defaultElectronStreamConstraints))).to.be.true;
    });

    it('without source Id', async () => {
      const spy = sinon.spy(contentShareMediaStreamBroker, 'acquireDisplayInputStream');
      await contentShareMediaStreamBroker.acquireScreenCaptureDisplayInputStream();
      expect(spy.calledWith(sinon.match(defaultStreamConstraints))).to.be.true;
    });

    it('with non-default framerate', async () => {
      const streamConstraints: MediaStreamConstraints = {
        audio: false,
        video: {
          frameRate: {
            max: 30,
          },
        },
      };
      const spy = sinon.spy(contentShareMediaStreamBroker, 'acquireDisplayInputStream');
      await contentShareMediaStreamBroker.acquireScreenCaptureDisplayInputStream(null, 30);
      expect(spy.calledWith(sinon.match(streamConstraints))).to.be.true;
    });

    it('with sourceId and non-default framerate', async () => {
      const streamConstraints: MediaStreamConstraints = {
        audio: false,
        video: {
          // @ts-ignore
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: 'sourceId',
            maxFrameRate: 30,
          },
        },
      };
      const spy = sinon.spy(contentShareMediaStreamBroker, 'acquireDisplayInputStream');
      await contentShareMediaStreamBroker.acquireScreenCaptureDisplayInputStream('sourceId', 30);
      expect(spy.calledWith(sinon.match(streamConstraints))).to.be.true;
    });

    it('allow audio in Chrome browser', async () => {
      dommMockBehavior.browserName = 'chrome';
      domMockBuilder = new DOMMockBuilder(dommMockBehavior);
      const streamConstraints: MediaStreamConstraints = {
        audio: true,
        video: {
          frameRate: {
            max: 15,
          },
        },
      };
      const spy = sinon.spy(contentShareMediaStreamBroker, 'acquireDisplayInputStream');
      await contentShareMediaStreamBroker.acquireScreenCaptureDisplayInputStream();
      expect(spy.calledWith(sinon.match(streamConstraints))).to.be.true;
    });

    it('do not allow audio in Firefox browser', async () => {
      const streamConstraints: MediaStreamConstraints = {
        audio: false,
        video: {
          frameRate: {
            max: 15,
          },
        },
      };
      const spy = sinon.spy(contentShareMediaStreamBroker, 'acquireDisplayInputStream');
      await contentShareMediaStreamBroker.acquireScreenCaptureDisplayInputStream();
      expect(spy.calledWith(sinon.match(streamConstraints))).to.be.true;
    });

    it('disable audio in Electron', async () => {
      dommMockBehavior.browserName = 'chrome';
      domMockBuilder = new DOMMockBuilder(dommMockBehavior);
      const streamConstraints: MediaStreamConstraints = {
        audio: false,
        video: {
          // @ts-ignore
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: 'sourceId',
            maxFrameRate: 15,
          },
        },
      };
      const spy = sinon.spy(contentShareMediaStreamBroker, 'acquireDisplayInputStream');
      await contentShareMediaStreamBroker.acquireScreenCaptureDisplayInputStream('sourceId');
      expect(spy.calledWith(sinon.match(streamConstraints))).to.be.true;
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
