// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Substitute } from '@fluffy-spoon/substitute';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import MediaRecording from '../../src/mediarecording/MediaRecording';
import ScreenShareStream from '../../src/screensharestreaming/ScreenShareStream';
import CustomEventMock from '../customeventmock/CustomEventMock';
import MediaRecordingMock from '../mediarecordingmock/MediaRecordingMock';
import ResponseMock from '../responsemock/ResponseMock';

describe('ScreenShareStream', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const GlobalAny = global as any;

  before(() => {
    chai.use(chaiAsPromised);
    GlobalAny.Response = ResponseMock;
    GlobalAny.CustomEvent = CustomEventMock;
  });

  after(() => {
    GlobalAny.Response = undefined;
    GlobalAny.CustomEvent = undefined;
  });

  describe('#key', () => {
    it('is keyed', () => {
      const mediaRecording = Substitute.for<MediaRecording>();
      const subject = new ScreenShareStream(mediaRecording);
      subject.key();
      mediaRecording.received().key();
    });
  });

  describe('#start', () => {
    it('exists', () => {
      const recorder = Substitute.for<MediaRecording>();
      const subject = new ScreenShareStream(recorder);
      chai.expect(subject.start());
    });
  });

  describe('#stop', () => {
    it('is fulfilled', (done: Mocha.Done) => {
      const recorder = Substitute.for<MediaRecording>();
      const subject = new ScreenShareStream(recorder);
      recorder.stop().returns(Promise.resolve());
      chai.expect(subject.stop()).to.eventually.be.fulfilled.and.notify(done);
    });
  });

  describe('#addEventListener', () => {
    describe('existing', () => {
      const recorder = Substitute.for<MediaRecording>();
      const subject = new ScreenShareStream(recorder);

      before(() => {
        subject.addEventListener('message', () => {});
      });

      it('is added', () => {
        subject.addEventListener('message', () => {});
      });
    });

    describe('empty', () => {
      it('is added', () => {
        const recorder = Substitute.for<MediaRecording>();
        const subject = new ScreenShareStream(recorder);
        subject.addEventListener('message', () => {});
      });
    });
  });

  describe('#dispatchEvent', () => {
    describe('empty', () => {
      const recorder = Substitute.for<MediaRecording>();
      const subject = new ScreenShareStream(recorder);
      subject.dispatchEvent(Substitute.for<Event>());
    });

    describe('existing', () => {
      it('is invoked', (done: Mocha.Done) => {
        const recorder = Substitute.for<MediaRecording>();
        const subject = new ScreenShareStream(recorder);
        const event = Substitute.for<Event>();
        event.type.returns('test');
        subject.addEventListener('test', () => {
          done();
        });
        subject.dispatchEvent(event);
      });
    });
  });

  describe('#removeEventListener', () => {
    describe('existing', () => {
      const recorder = Substitute.for<MediaRecording>();
      const subject = new ScreenShareStream(recorder);
      const type = 'message';
      const listener = (): void => {};

      before(() => {
        subject.addEventListener(type, listener);
      });

      it('is removed', () => {
        subject.removeEventListener(type, listener);
      });
    });

    describe('empty', () => {
      const recorder = Substitute.for<MediaRecording>();
      const subject = new ScreenShareStream(recorder);
      subject.removeEventListener('message', () => {});
    });
  });

  describe('#onDataAvailable', () => {
    it('is invoked', (done: Mocha.Done) => {
      const recorder = new MediaRecordingMock();
      const subject = new ScreenShareStream(recorder);
      const event = Substitute.for<BlobEvent>();
      event.type.returns('dataavailable');
      subject.start();
      subject.addEventListener('message', () => {
        done();
      });
      recorder.dispatchEvent(event);
    });

    describe('zero sized data', () => {
      it('is not invoked', () => {
        const recorder = new MediaRecordingMock();
        const subject = new ScreenShareStream(recorder);
        const event = Substitute.for<BlobEvent>();
        const data = Substitute.for<Blob>();
        data.size.returns(0);
        event.type.returns('dataavailable');
        event.data.returns(data);
        subject.start();
        recorder.dispatchEvent(event);
      });
    });
  });

  describe('ended', () => {
    it('is dispatched', (done: Mocha.Done) => {
      const event = Substitute.for<Event>();
      const mediaRecording: MediaRecording = {
        ...Substitute.for<MediaRecording>(),
        get listeners() {
          this._listeners = this._listeners || new Map<string, Set<EventListener>>();
          return this._listeners;
        },
        start(_timeSliceMs: number): void {},
        addEventListener(type: string, listener: EventListener): void {
          if (!this.listeners.get(type)) {
            this.listeners.set(type, new Set<EventListener>());
          }
          this.listeners.get(type).add(listener);
        },
        dispatchEvent(event: Event): boolean {
          if (this.listeners.get(event.type) !== null) {
            this.listeners.get(event.type).forEach((listener: EventListener) => {
              listener(event);
            });
          }
          return event.defaultPrevented;
        },
      };
      event.type.returns('ended');
      const subject = new ScreenShareStream(mediaRecording);
      subject.start();
      subject.addEventListener('ended', () => {
        done();
      });
      mediaRecording.dispatchEvent(event);
    });
  });
});
