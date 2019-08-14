// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Substitute } from '@fluffy-spoon/substitute';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

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
    it('is fulfilled', (done: Mocha.Done) => {
      const track = Substitute.for<MediaStreamTrack>();
      const mediaStream = Substitute.for<MediaStream>();
      const subject = new WebMMediaRecording(mediaStream);
      mediaStream.getTracks().returns(Array.of(track));
      chai.expect(subject.stop()).to.eventually.be.fulfilled.and.notify(done);
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
    it('is delegated', () => {
      const listener = (): void => {};
      const type = 'event';
      const mediaStream = Substitute.for<MediaStream>();
      const subject = new WebMMediaRecording(mediaStream);
      subject.removeEventListener(type, listener);
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
