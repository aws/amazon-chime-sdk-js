// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Substitute from '@fluffy-spoon/substitute';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import DefaultBrowserBehavior from '../../src/browserbehavior/DefaultBrowserBehavior';
import MediaRecordingOptions from '../../src/mediarecording/MediaRecordingOptions';
import WebMMediaRecording from '../../src/mediarecording/WebMMediaRecording';
import CustomEventMock from '../customeventmock/CustomEventMock';
import DOMMediaRecorderMock from '../dommediarecordermock/DOMMediaRecorderMock';

describe('WebMMediaRecording', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const GlobalAny = global as any;

  before(() => {
    chai.use(chaiAsPromised);
    GlobalAny.MediaRecorder = DOMMediaRecorderMock;
    GlobalAny.CustomEvent = CustomEventMock;
  });

  after(() => {
    GlobalAny.MediaRecorder = undefined;
    GlobalAny.CustomEvent = undefined;
  });

  describe('#key', () => {
    describe('with start', () => {
      it('is keyed', () => {
        const mediaStream = Substitute.for<MediaStream>();
        mediaStream.getTracks().returns(Array.of(Substitute.for<MediaStreamTrack>()));
        mediaStream.clone().returns(mediaStream);
        const subject = new WebMMediaRecording(mediaStream);
        subject.start(1000);
        subject.key();
      });
    });

    describe('without start', () => {
      it('is keyed', () => {
        new WebMMediaRecording(Substitute.for<MediaStream>()).key();
      });
    });

    describe('with Chrome', () => {
      it('is keyed', () => {
        const browser = Substitute.for<DefaultBrowserBehavior>();
        const mediaStream = Substitute.for<MediaStream>();
        const mediaTrack = Substitute.for<MediaStreamTrack>();
        mediaTrack.stop().returns();
        mediaStream.getTracks().returns(Array.of(mediaTrack));
        mediaStream.clone().returns(mediaStream);
        browser.isChrome().returns(true);
        const subject = new WebMMediaRecording(mediaStream, {}, browser);
        subject.key();
        subject.key();
        mediaTrack.received().stop();
      });
    });
  });

  describe('with MediaRecordingOptions', () => {
    it('is constructed', () => {
      const options: MediaRecordingOptions = {};
      const mediaStream = Substitute.for<MediaStream>();
      const subject = new WebMMediaRecording(mediaStream, options);
      chai.expect(subject).to.exist;
    });
  });

  describe('#start', () => {
    describe('without timeSliceMs', () => {
      it('is delegated', () => {
        const mediaStream = Substitute.for<MediaStream>();
        const subject = new WebMMediaRecording(mediaStream);
        mediaStream.getVideoTracks().returns(Array.of(Substitute.for<MediaStreamTrack>()));
        subject.start();
      });
    });

    describe('with timeSliceMs', () => {
      it('is delegated', () => {
        const timeoutSliceMs = 500;
        const mediaStream = Substitute.for<MediaStream>();
        const subject = new WebMMediaRecording(mediaStream);
        mediaStream.getVideoTracks().returns(Array.of(Substitute.for<MediaStreamTrack>()));
        subject.start(timeoutSliceMs);
      });
    });
  });

  describe('#stop', () => {
    describe('without start', () => {
      it('is rejected', (done: Mocha.Done) => {
        const track = Substitute.for<MediaStreamTrack>();
        const mediaStream = Substitute.for<MediaStream>();
        const subject = new WebMMediaRecording(mediaStream);
        mediaStream.getTracks().returns(Array.of(track));
        chai.expect(subject.stop()).to.eventually.be.rejected.and.notify(done);
      });
    });

    describe('with start', () => {
      it('is rejected', (done: Mocha.Done) => {
        const track = Substitute.for<MediaStreamTrack>();
        const mediaStream = Substitute.for<MediaStream>();
        const subject = new WebMMediaRecording(mediaStream);
        subject.start();
        mediaStream.getTracks().returns(Array.of(track));
        chai.expect(subject.stop()).to.eventually.be.fulfilled.and.notify(done);
      });
    });
  });

  describe('#addEventListener', () => {
    it('is delegated', () => {
      const listener = (): void => {};
      const type = 'event';
      const mediaStream = Substitute.for<MediaStream>();
      const subject = new WebMMediaRecording(mediaStream);
      subject.addEventListener(type, listener);
    });
  });

  describe('#removeEventListener', () => {
    describe('with listener', () => {
      it('is is successful', () => {
        const listener = (): void => {};
        const type = 'event';
        const mediaStream = Substitute.for<MediaStream>();
        const subject = new WebMMediaRecording(mediaStream);
        subject.addEventListener(type, listener);
        subject.removeEventListener(type, listener);
      });
    });

    describe('without listener', () => {
      it('is is successful', () => {
        const listener = (): void => {};
        const type = 'event';
        const mediaStream = Substitute.for<MediaStream>();
        const subject = new WebMMediaRecording(mediaStream);
        subject.removeEventListener(type, listener);
      });
    });
  });

  describe('#dispatchEvent', () => {
    it('is delegated', () => {
      const event = Substitute.for<Event>();
      const mediaStream = Substitute.for<MediaStream>();
      const subject = new WebMMediaRecording(mediaStream);
      subject.dispatchEvent(event);
    });
  });

  describe('dataavailable', () => {
    it('is dispatched', (done: Mocha.Done) => {
      const event = Substitute.for<BlobEvent>();
      const mediaStream: MediaStream = {
        get listeners(): Map<string, Set<EventListener>> {
          this._listeners = this._listeners || new Map<string, Set<EventListener>>();
          return this._listeners;
        },
        ...Substitute.for<MediaStream>(),
        addEventListener(type: string, listener: EventListener): void {
          if (!this.listeners.get(type)) {
            this.listeners.set(type, new Set<EventListener>());
          }
          this.listeners.get(type).add(listener);
        },
        dispatchEvent(event: Event): boolean {
          if (this.listeners.get(event.type) !== undefined) {
            this.listeners.get(event.type).forEach((listener: EventListener) => {
              listener(event);
            });
          }
          return event.defaultPrevented;
        },
        getTracks(): MediaStreamTrack[] {
          return new Array<MediaStreamTrack>();
        },
        clone(): MediaStream {
          return this;
        },
      };
      const subject = new WebMMediaRecording(mediaStream);
      subject.addEventListener('dataavailable', () => {
        done();
      });
      subject.start();
      event.type.returns('dataavailable');
      mediaStream.dispatchEvent(event);
    });
  });

  describe('ended', () => {
    it('is dispatched', (done: Mocha.Done) => {
      const event = Substitute.for<Event>();
      const mediaStream = Substitute.for<MediaStream>();
      const mediaStreamTrack: MediaStreamTrack = {
        get listeners() {
          this._listeners = this._listeners || new Map<string, Set<EventListener>>();
          return this._listeners;
        },
        ...Substitute.for<MediaStreamTrack>(),
        addEventListener(type: string, listener: EventListener): void {
          if (!this.listeners.get(type)) {
            this.listeners.set(type, new Set<EventListener>());
          }
          this.listeners.get(type).add(listener);
        },
        dispatchEvent(event: Event): boolean {
          if (this.listeners.get(event.type) !== undefined) {
            this.listeners.get(event.type).forEach((listener: EventListener) => {
              listener(event);
            });
          }
          return event.defaultPrevented;
        },
      };
      const tracks = [mediaStreamTrack];
      event.type.returns('ended');
      mediaStream.clone().returns(mediaStream);
      mediaStream.getTracks().returns(tracks);
      const subject = new WebMMediaRecording(mediaStream);
      subject.start();
      subject.addEventListener('ended', () => {
        done();
      });
      mediaStreamTrack.dispatchEvent(event);
    });
  });
});
