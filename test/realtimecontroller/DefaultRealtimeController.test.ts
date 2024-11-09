// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import { RealtimeState } from '../../src';
import DataMessage from '../../src/datamessage/DataMessage';
import DeviceSelection from '../../src/devicecontroller/DeviceSelection';
import NoOpMediaStreamBroker from '../../src/mediastreambroker/NoOpMediaStreamBroker';
import DefaultRealtimeController from '../../src/realtimecontroller/DefaultRealtimeController';
import RealtimeAttendeePositionInFrame from '../../src/realtimecontroller/RealtimeAttendeePositionInFrame';
import RealtimeController from '../../src/realtimecontroller/RealtimeController';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultRealtimeController', () => {
  let expect: Chai.ExpectStatic;
  let rt: RealtimeController;
  let streamBroker: TestMediaStreamBroker;
  let domMockBuilder: DOMMockBuilder | null = null;
  let muteSpy: sinon.SinonSpy;
  let unmuteSpy: sinon.SinonSpy;

  class TestMediaStreamBroker extends NoOpMediaStreamBroker {
    activeDevices: { [kind: string]: DeviceSelection | null } = { audio: null, video: null };

    setTestAudioInput(): void {
      const audioDevice = new DeviceSelection();
      audioDevice.stream = new MediaStream();
      this.activeDevices['audio'] = audioDevice;
    }
  }

  before(() => {
    expect = chai.expect;
  });

  beforeEach(() => {
    domMockBuilder = new DOMMockBuilder(new DOMMockBehavior());
    streamBroker = new TestMediaStreamBroker();
    rt = new DefaultRealtimeController(streamBroker);
    muteSpy = sinon.spy(streamBroker, 'muteLocalAudioInputStream');
    unmuteSpy = sinon.spy(streamBroker, 'unmuteLocalAudioInputStream');
  });

  afterEach(() => {
    muteSpy.restore();
    unmuteSpy.restore();
    domMockBuilder.cleanup();
  });

  describe('construction', () => {
    it('can be constructed', () => {
      expect(rt).to.not.equal(null);
    });
  });

  describe('error handling', () => {
    it('does not call an event if one is not assigned', () => {
      rt.realtimeMuteLocalAudio();
    });

    it('calls the event function', () => {
      let eventFired = false;
      rt.realtimeSubscribeToMuteAndUnmuteLocalAudio((muted: boolean) => {
        eventFired = true;
        expect(muted).to.equal(true);
      });
      rt.realtimeMuteLocalAudio();
      expect(eventFired).to.be.true;
    });

    it('calls fatal error callback if there is an error', () => {
      let fatalErrorOccurred = false;
      const errMsg = 'this is a test';
      rt.realtimeSubscribeToMuteAndUnmuteLocalAudio((muted: boolean) => {
        expect(muted).to.equal(true);
        throw new Error(errMsg);
      });
      rt.realtimeSubscribeToFatalError((error: Error) => {
        fatalErrorOccurred = true;
        expect(error.message).to.equal(errMsg);
      });
      rt.realtimeMuteLocalAudio();
      expect(fatalErrorOccurred).to.be.true;
    });

    it('recovers if fatal error callback also throws an error', () => {
      let fatalErrorOccurred = false;
      let fatalErrorObject = null;
      const errMsg = 'this is a test';
      const oldConsoleError = console.error;
      console.error = (object: Error) => {
        fatalErrorObject = object;
      };
      rt.realtimeSubscribeToMuteAndUnmuteLocalAudio((muted: boolean) => {
        expect(muted).to.equal(true);
        throw new Error(errMsg);
      });
      rt.realtimeSubscribeToFatalError((error: Error) => {
        fatalErrorOccurred = true;
        expect(error.message).to.equal(errMsg);
        throw error;
      });
      rt.realtimeMuteLocalAudio();
      console.error = oldConsoleError;
      expect(fatalErrorOccurred).to.be.true;
      expect(fatalErrorObject).to.not.be.null;
    });

    it('recovers if console.error also throws an error', () => {
      let fatalErrorOccurred = false;
      const errMsg = 'this is a test';
      rt.realtimeSubscribeToMuteAndUnmuteLocalAudio((muted: boolean) => {
        expect(muted).to.equal(true);
        throw new Error(errMsg);
      });
      rt.realtimeSubscribeToFatalError((error: Error) => {
        fatalErrorOccurred = true;
        expect(error.message).to.equal(errMsg);
        throw error;
      });
      const oldConsoleError = console.error;
      console.error = null;
      rt.realtimeMuteLocalAudio();
      console.error = oldConsoleError;
      expect(fatalErrorOccurred).to.be.true;
    });

    it('has the correct this object for events', () => {
      const errMsg = 'this is a test';
      let muteFired = false;
      let unmuteFired = false;
      let setCanUnmuteFired = false;
      let fatalErrorFired = false;
      rt.realtimeSubscribeToMuteAndUnmuteLocalAudio((muted: boolean) => {
        if (muted) {
          muteFired = true;
        } else {
          unmuteFired = true;
        }
      });
      rt.realtimeSubscribeToSetCanUnmuteLocalAudio((canUnmute: boolean) => {
        setCanUnmuteFired = true;
        expect(canUnmute).to.equal(false);
        throw new Error(errMsg);
      });
      rt.realtimeSubscribeToFatalError((error: Error) => {
        expect(error.message).to.equal(errMsg);
        fatalErrorFired = true;
      });
      rt.realtimeMuteLocalAudio();
      rt.realtimeUnmuteLocalAudio();
      rt.realtimeSetCanUnmuteLocalAudio(false);
      expect(muteFired).to.be.true;
      expect(unmuteFired).to.be.true;
      expect(setCanUnmuteFired).to.be.true;
      expect(fatalErrorFired).to.be.true;
    });

    it('safely handles unsubscribe without subscribe', () => {
      const stub = sinon.stub();
      rt.realtimeUnsubscribeToAttendeeIdPresence(stub);
      rt.realtimeUnsubscribeToFatalError(stub);
      rt.realtimeUnsubscribeToLocalSignalStrengthChange(stub);
      rt.realtimeUnsubscribeToMuteAndUnmuteLocalAudio(stub);
      rt.realtimeUnsubscribeToSetCanUnmuteLocalAudio(stub);
      rt.realtimeUnsubscribeFromSendDataMessage(stub);
    });
  });

  describe('muting', () => {
    it('can toggle can-unmute on and off', () => {
      expect(rt.realtimeCanUnmuteLocalAudio()).to.be.true;
      rt.realtimeSetCanUnmuteLocalAudio(false);
      expect(rt.realtimeCanUnmuteLocalAudio()).to.be.false;
      rt.realtimeSetCanUnmuteLocalAudio(false);
      expect(rt.realtimeCanUnmuteLocalAudio()).to.be.false;
      rt.realtimeSetCanUnmuteLocalAudio(true);
      expect(rt.realtimeCanUnmuteLocalAudio()).to.be.true;
      rt.realtimeSetCanUnmuteLocalAudio(true);
      expect(rt.realtimeCanUnmuteLocalAudio()).to.be.true;
    });

    it('only triggers the event if can-unmute changes', () => {
      let changedToCanUnmute = false;
      let changedToCannotUnmute = false;

      const cb = (canUnmute: boolean): void => {
        if (canUnmute) {
          changedToCanUnmute = true;
        } else {
          changedToCannotUnmute = true;
        }
      };
      rt.realtimeSubscribeToSetCanUnmuteLocalAudio(cb);
      expect(rt.realtimeCanUnmuteLocalAudio()).to.be.true;
      rt.realtimeSetCanUnmuteLocalAudio(true);
      expect(rt.realtimeCanUnmuteLocalAudio()).to.be.true;
      expect(changedToCanUnmute).to.be.false;
      expect(changedToCannotUnmute).to.be.false;
      rt.realtimeSetCanUnmuteLocalAudio(false);
      expect(rt.realtimeCanUnmuteLocalAudio()).to.be.false;
      expect(changedToCanUnmute).to.be.false;
      expect(changedToCannotUnmute).to.be.true;
      changedToCannotUnmute = false;
      changedToCanUnmute = false;
      rt.realtimeSetCanUnmuteLocalAudio(false);
      expect(rt.realtimeCanUnmuteLocalAudio()).to.be.false;
      expect(changedToCanUnmute).to.be.false;
      expect(changedToCannotUnmute).to.be.false;
      rt.realtimeSetCanUnmuteLocalAudio(true);
      expect(rt.realtimeCanUnmuteLocalAudio()).to.be.true;
      expect(changedToCanUnmute).to.be.true;
      expect(changedToCannotUnmute).to.be.false;
      rt.realtimeUnsubscribeToSetCanUnmuteLocalAudio(cb);
    });

    it('disables the media stream if mute is called', () => {
      expect(rt.realtimeIsLocalAudioMuted()).to.be.false;
      expect(muteSpy.notCalled).to.be.true;
      rt.realtimeMuteLocalAudio();
      expect(rt.realtimeIsLocalAudioMuted()).to.be.true;
      expect(muteSpy.calledOnce).to.be.true;
    });

    it('enables the media stream if unmute is called', () => {
      rt.realtimeMuteLocalAudio();
      expect(rt.realtimeIsLocalAudioMuted()).to.be.true;
      expect(muteSpy.calledOnce).to.be.true;
      expect(unmuteSpy.notCalled).to.be.true;
      expect(rt.realtimeUnmuteLocalAudio()).to.be.true;
      expect(rt.realtimeIsLocalAudioMuted()).to.be.false;
      expect(muteSpy.calledOnce).to.be.true;
      expect(unmuteSpy.calledOnce).to.be.true;
    });

    it('does nothing if mute is called when already muted', () => {
      let eventFired = false;
      rt.realtimeSubscribeToMuteAndUnmuteLocalAudio((muted: boolean) => {
        expect(muted).to.equal(true);
        eventFired = true;
      });
      expect(rt.realtimeIsLocalAudioMuted()).to.be.false;
      expect(muteSpy.notCalled).to.be.true;
      rt.realtimeMuteLocalAudio();
      expect(eventFired).to.be.true;
      expect(rt.realtimeIsLocalAudioMuted()).to.be.true;
      expect(muteSpy.calledOnce).to.be.true;
      eventFired = false;
      rt.realtimeMuteLocalAudio();
      expect(eventFired).to.be.false;
      expect(rt.realtimeIsLocalAudioMuted()).to.be.true;
      expect(muteSpy.calledOnce).to.be.true;
    });

    it('does nothing if unmute is called when already unmuted', () => {
      let muteFired = false;
      let unmuteFired = false;
      rt.realtimeSubscribeToMuteAndUnmuteLocalAudio((muted: boolean) => {
        if (muted) {
          muteFired = true;
        } else {
          unmuteFired = true;
        }
      });
      rt.realtimeMuteLocalAudio();
      expect(muteSpy.calledOnce).to.be.true;
      expect(unmuteSpy.notCalled).to.be.true;
      expect(muteFired).to.equal(true);
      expect(unmuteFired).to.equal(false);
      muteFired = false;
      unmuteFired = false;
      expect(rt.realtimeIsLocalAudioMuted()).to.be.true;
      expect(rt.realtimeUnmuteLocalAudio()).to.be.true;
      expect(muteSpy.calledOnce).to.be.true;
      expect(unmuteSpy.calledOnce).to.be.true;
      expect(muteFired).to.equal(false);
      expect(unmuteFired).to.equal(true);
      muteFired = false;
      unmuteFired = false;
      expect(rt.realtimeIsLocalAudioMuted()).to.be.false;
      expect(rt.realtimeUnmuteLocalAudio()).to.be.true;
      expect(muteFired).to.equal(false);
      expect(unmuteFired).to.equal(false);
      expect(rt.realtimeIsLocalAudioMuted()).to.be.false;
      expect(muteSpy.calledOnce).to.be.true;
      expect(unmuteSpy.calledOnce).to.be.true;
    });

    it('does not unmute if can-unmute is disabled', () => {
      let muteFired = false;
      let unmuteFired = false;
      rt.realtimeSubscribeToMuteAndUnmuteLocalAudio((muted: boolean) => {
        if (muted) {
          muteFired = true;
        } else {
          unmuteFired = true;
        }
      });
      expect(rt.realtimeIsLocalAudioMuted()).to.be.false;
      expect(muteSpy.notCalled).to.be.true;
      expect(unmuteSpy.notCalled).to.be.true;
      rt.realtimeMuteLocalAudio();
      expect(muteFired).to.equal(true);
      expect(unmuteFired).to.equal(false);
      expect(muteSpy.calledOnce).to.be.true;
      expect(unmuteSpy.notCalled).to.be.true;
      muteFired = false;
      unmuteFired = false;
      expect(rt.realtimeIsLocalAudioMuted()).to.be.true;
      rt.realtimeSetCanUnmuteLocalAudio(true);
      expect(rt.realtimeIsLocalAudioMuted()).to.be.true;
      expect(rt.realtimeUnmuteLocalAudio()).to.be.true;
      expect(muteFired).to.equal(false);
      expect(unmuteFired).to.equal(true);
      expect(muteSpy.calledOnce).to.be.true;
      expect(unmuteSpy.calledOnce).to.be.true;
      muteFired = false;
      unmuteFired = false;
      expect(rt.realtimeIsLocalAudioMuted()).to.be.false;
      rt.realtimeSetCanUnmuteLocalAudio(false);
      expect(rt.realtimeIsLocalAudioMuted()).to.be.false;
      rt.realtimeMuteLocalAudio();
      expect(muteFired).to.equal(true);
      expect(unmuteFired).to.equal(false);
      expect(muteSpy.calledTwice).to.be.true;
      expect(unmuteSpy.calledOnce).to.be.true;
      muteFired = false;
      unmuteFired = false;
      expect(rt.realtimeIsLocalAudioMuted()).to.be.true;
      expect(rt.realtimeUnmuteLocalAudio()).to.be.false;
      expect(muteFired).to.equal(false);
      expect(unmuteFired).to.equal(false);
      expect(muteSpy.calledTwice).to.be.true;
      expect(unmuteSpy.calledOnce).to.be.true;
      expect(rt.realtimeIsLocalAudioMuted()).to.be.true;
    });
  });

  describe('volume indicators', () => {
    it('will send volume indicator callbacks to subscribers', () => {
      const sentAttendeeId = 'foo-attendee';
      const sentVolume = 0.5;
      const sentMuted = false;
      const sentSignalStrength = 1;
      const sentExternalUserId = 'foo-external';
      let callbackFired = false;
      rt.realtimeSubscribeToVolumeIndicator(
        sentAttendeeId,
        (
          attendeeId: string,
          volume: number | null,
          muted: boolean | null,
          signalStrength: number | null,
          externalUserId: string | null
        ) => {
          callbackFired = true;
          expect(attendeeId).to.equal(sentAttendeeId);
          expect(volume).to.equal(sentVolume);
          expect(muted).to.equal(sentMuted);
          expect(signalStrength).to.equal(sentSignalStrength);
          expect(externalUserId).to.equal(sentExternalUserId);
        }
      );
      rt.realtimeUpdateVolumeIndicator(
        sentAttendeeId,
        sentVolume,
        sentMuted,
        sentSignalStrength,
        sentExternalUserId
      );
      expect(callbackFired).to.be.true;
    });

    it('will send all volume indicator callbacks to subscribers', () => {
      const sentAttendeeId = 'foo-attendee';
      const sentVolume = 0.5;
      const sentMuted = false;
      const sentSignalStrength = 1;
      let callbackFired = false;
      let callbackFired2 = false;
      rt.realtimeSubscribeToVolumeIndicator(
        sentAttendeeId,
        (
          attendeeId: string,
          volume: number | null,
          muted: boolean | null,
          signalStrength: number | null
        ) => {
          callbackFired = true;
          expect(attendeeId).to.equal(sentAttendeeId);
          expect(volume).to.equal(sentVolume);
          expect(muted).to.equal(sentMuted);
          expect(signalStrength).to.equal(sentSignalStrength);
        }
      );
      rt.realtimeSubscribeToVolumeIndicator(
        sentAttendeeId,
        (
          attendeeId: string,
          volume: number | null,
          muted: boolean | null,
          signalStrength: number | null
        ) => {
          callbackFired2 = true;
          expect(attendeeId).to.equal(sentAttendeeId);
          expect(volume).to.equal(sentVolume);
          expect(muted).to.equal(sentMuted);
          expect(signalStrength).to.equal(sentSignalStrength);
        }
      );
      rt.realtimeUpdateVolumeIndicator(
        sentAttendeeId,
        sentVolume,
        sentMuted,
        sentSignalStrength,
        null
      );
      expect(callbackFired).to.be.true;
      expect(callbackFired2).to.be.true;
    });

    it('will not send volume callbacks to unsubscribed attendees', () => {
      const sentAttendeeId = 'foo-attendee';
      const sentVolume = 0.5;
      const sentMuted = false;
      const sentSignalStrength = 1;
      let callbackFired = false;
      rt.realtimeSubscribeToVolumeIndicator(
        sentAttendeeId,
        (
          attendeeId: string,
          volume: number | null,
          muted: boolean | null,
          signalStrength: number | null
        ) => {
          callbackFired = true;
          expect(attendeeId).to.equal(sentAttendeeId);
          expect(volume).to.equal(sentVolume);
          expect(muted).to.equal(sentMuted);
          expect(signalStrength).to.equal(sentSignalStrength);
        }
      );
      rt.realtimeUpdateVolumeIndicator(
        sentAttendeeId,
        sentVolume,
        sentMuted,
        sentSignalStrength,
        null
      );
      expect(callbackFired).to.be.true;
      callbackFired = false;
      rt.realtimeUpdateVolumeIndicator(
        'an-unsubscribed-attendee',
        sentVolume,
        sentMuted,
        sentSignalStrength,
        null
      );
      expect(callbackFired).to.be.false;
      callbackFired = false;
      const callback = (
        _attendeeId: string,
        _volume: number | null,
        _muted: boolean | null,
        _signalStrength: number | null
      ): void => {};
      rt.realtimeUnsubscribeFromVolumeIndicator(sentAttendeeId, callback);
      expect(callbackFired).to.be.false;
    });

    it('will send the current volume indicator state when subscribing', () => {
      const sentAttendeeId = 'foo-attendee';
      const sentVolume = 0.5;
      const sentMuted = false;
      const sentSignalStrength = 1;
      let callbackFired = false;
      rt.realtimeUpdateVolumeIndicator(
        sentAttendeeId,
        sentVolume,
        sentMuted,
        sentSignalStrength,
        null
      );
      rt.realtimeSubscribeToVolumeIndicator(
        sentAttendeeId,
        (
          attendeeId: string,
          volume: number | null,
          muted: boolean | null,
          signalStrength: number | null
        ) => {
          callbackFired = true;
          expect(attendeeId).to.equal(sentAttendeeId);
          expect(volume).to.equal(sentVolume);
          expect(muted).to.equal(sentMuted);
          expect(signalStrength).to.equal(sentSignalStrength);
        }
      );
      expect(callbackFired).to.be.true;
    });

    it('will unsubscribe from a given callback if provided', () => {
      const fooAttendeeId = 'foo-attendee';
      const sentVolume = 0.5;
      const sentMuted = false;
      const sentSignalStrength = 1;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const state: RealtimeState = ((rt as unknown) as any).state as RealtimeState;
      state.volumeIndicatorCallbacks = {};
      const callback1 = (
        attendeeId: string,
        volume: number | null,
        muted: boolean | null,
        signalStrength: number | null
      ): void => {
        expect(attendeeId).to.equal(fooAttendeeId);
        expect(volume).to.equal(sentVolume);
        expect(muted).to.equal(sentMuted);
        expect(signalStrength).to.equal(sentSignalStrength);
      };
      const callback2 = (
        attendeeId: string,
        volume: number | null,
        muted: boolean | null,
        signalStrength: number | null
      ): void => {
        expect(attendeeId).to.equal(fooAttendeeId);
        expect(volume).to.not.equal('');
        expect(muted).to.not.equal('');
        expect(signalStrength).to.not.equal('');
      };
      rt.realtimeSubscribeToVolumeIndicator(fooAttendeeId, callback1);
      rt.realtimeSubscribeToVolumeIndicator(fooAttendeeId, callback2);
      rt.realtimeUnsubscribeFromVolumeIndicator(fooAttendeeId, callback2);
      expect(state.volumeIndicatorCallbacks[fooAttendeeId].indexOf(callback1)).to.equal(0);
      expect(state.volumeIndicatorCallbacks[fooAttendeeId].indexOf(callback2)).to.equal(-1);
    });

    it('will not error if unsubscribed from a missing callback', () => {
      const fooAttendeeId = 'foo-attendee';
      const sentVolume = 0.5;
      const sentMuted = false;
      const sentSignalStrength = 1;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const state: RealtimeState = ((rt as unknown) as any).state as RealtimeState;
      state.volumeIndicatorCallbacks = {};
      const callback = (
        attendeeId: string,
        volume: number | null,
        muted: boolean | null,
        signalStrength: number | null
      ): void => {
        expect(attendeeId).to.equal(fooAttendeeId);
        expect(volume).to.equal(sentVolume);
        expect(muted).to.equal(sentMuted);
        expect(signalStrength).to.equal(sentSignalStrength);
      };
      rt.realtimeSubscribeToVolumeIndicator(fooAttendeeId, callback);
      rt.realtimeUnsubscribeFromVolumeIndicator(fooAttendeeId, callback);
      const expectedResult = state.volumeIndicatorCallbacks;
      rt.realtimeUnsubscribeFromVolumeIndicator(fooAttendeeId, callback);
      expect(state.volumeIndicatorCallbacks).to.equal(expectedResult);
    });

    it('will not error if unsubscribed from a non-exist attendeeId', () => {
      const callback = (
        _attendeeId: string,
        _volume: number | null,
        _muted: boolean | null,
        _signalStrength: number | null
      ): void => {};
      rt.realtimeUnsubscribeFromVolumeIndicator('bar-attendee', callback);
    });

    it('will tolerate an exception thrown in a volume indicator callback', () => {
      const sentAttendeeId = 'foo-attendee';
      const sentVolume = 0.5;
      const sentMuted = false;
      const sentSignalStrength = 1;
      let callbackFired = false;
      rt.realtimeUpdateVolumeIndicator(
        sentAttendeeId,
        sentVolume,
        sentMuted,
        sentSignalStrength,
        null
      );
      rt.realtimeSubscribeToVolumeIndicator(
        sentAttendeeId,
        (
          attendeeId: string,
          volume: number | null,
          muted: boolean | null,
          signalStrength: number | null
        ) => {
          callbackFired = true;
          expect(attendeeId).to.equal(sentAttendeeId);
          expect(volume).to.equal(sentVolume);
          expect(muted).to.equal(sentMuted);
          expect(signalStrength).to.equal(sentSignalStrength);
          throw new Error('this is a test');
        }
      );
      expect(callbackFired).to.be.true;
    });

    it('will not send a volume update if no data has changed', () => {
      const sentAttendeeId = 'foo-attendee';
      const sentVolume = 0.5;
      const sentMuted = false;
      const sentSignalStrength = 1;
      let callbackFired = false;
      rt.realtimeUpdateVolumeIndicator(
        sentAttendeeId,
        sentVolume,
        sentMuted,
        sentSignalStrength,
        null
      );
      rt.realtimeSubscribeToVolumeIndicator(
        sentAttendeeId,
        (
          attendeeId: string,
          volume: number | null,
          muted: boolean | null,
          signalStrength: number | null
        ) => {
          callbackFired = true;
          expect(attendeeId).to.equal(sentAttendeeId);
          expect(volume).to.equal(sentVolume);
          expect(muted).to.equal(sentMuted);
          expect(signalStrength).to.equal(sentSignalStrength);
        }
      );
      expect(callbackFired).to.be.true;
      callbackFired = false;
      rt.realtimeUpdateVolumeIndicator(
        sentAttendeeId,
        sentVolume,
        sentMuted,
        sentSignalStrength,
        null
      );
      expect(callbackFired).to.be.false;
    });

    it('will set volume to zero if muted even if volume was non-zero', () => {
      const sentAttendeeId = 'foo-attendee';
      const sentVolume = 0.5;
      const sentMuted = true;
      const sentSignalStrength = 1;
      let callbackFired = false;
      rt.realtimeSubscribeToVolumeIndicator(
        sentAttendeeId,
        (
          attendeeId: string,
          volume: number | null,
          muted: boolean | null,
          signalStrength: number | null
        ) => {
          callbackFired = true;
          expect(attendeeId).to.equal(sentAttendeeId);
          expect(volume).to.equal(0.0);
          expect(muted).to.equal(sentMuted);
          expect(signalStrength).to.equal(sentSignalStrength);
        }
      );
      expect(callbackFired).to.be.false;
      rt.realtimeUpdateVolumeIndicator(
        sentAttendeeId,
        sentVolume,
        sentMuted,
        sentSignalStrength,
        null
      );
      expect(callbackFired).to.be.true;
    });

    it('will send volume update when unmuted only if volume changed', () => {
      const sentAttendeeId = 'foo-attendee';
      let callbackIndex = 0;
      rt.realtimeSubscribeToVolumeIndicator(
        sentAttendeeId,
        (
          attendeeId: string,
          volume: number | null,
          muted: boolean | null,
          signalStrength: number | null
        ) => {
          if (callbackIndex === 0) {
            expect(attendeeId).to.equal(sentAttendeeId);
            expect(volume).to.equal(0.0);
            expect(muted).to.equal(true);
            expect(signalStrength).to.equal(null);
          } else if (callbackIndex === 1) {
            expect(attendeeId).to.equal(sentAttendeeId);
            expect(volume).to.equal(1.0);
            expect(muted).to.equal(false);
            expect(signalStrength).to.equal(null);
          }
          if (callbackIndex === 2) {
            expect(attendeeId).to.equal(sentAttendeeId);
            expect(volume).to.equal(0.0);
            expect(muted).to.equal(true);
            expect(signalStrength).to.equal(null);
          } else if (callbackIndex === 3) {
            expect(attendeeId).to.equal(sentAttendeeId);
            expect(volume).to.equal(null);
            expect(muted).to.equal(false);
            expect(signalStrength).to.equal(null);
          }
          callbackIndex += 1;
        }
      );
      rt.realtimeUpdateVolumeIndicator(sentAttendeeId, null, true, null, null);
      expect(callbackIndex).to.equal(1);
      rt.realtimeUpdateVolumeIndicator(sentAttendeeId, 1.0, false, null, null);
      expect(callbackIndex).to.equal(2);
      rt.realtimeUpdateVolumeIndicator(sentAttendeeId, null, true, null, null);
      expect(callbackIndex).to.equal(3);
      rt.realtimeUpdateVolumeIndicator(sentAttendeeId, null, false, null, null);
      expect(callbackIndex).to.equal(4);
      rt.realtimeUpdateVolumeIndicator(sentAttendeeId, null, null, null, null);
      expect(callbackIndex).to.equal(4);
    });

    it('will send mute state if no mute state set and a volume is sent', () => {
      const sentAttendeeId = 'foo-attendee';
      let callbackIndex = 0;
      rt.realtimeSubscribeToVolumeIndicator(
        sentAttendeeId,
        (
          attendeeId: string,
          volume: number | null,
          muted: boolean | null,
          signalStrength: number | null
        ) => {
          expect(attendeeId).to.equal(sentAttendeeId);
          expect(volume).to.equal(0.0);
          expect(muted).to.equal(false);
          expect(signalStrength).to.equal(null);
          callbackIndex += 1;
        }
      );
      expect(callbackIndex).to.equal(0);
      rt.realtimeUpdateVolumeIndicator(sentAttendeeId, 0.0, null, null, null);
      expect(callbackIndex).to.equal(1);
    });

    it('will send a volume update when muted with audio input', () => {
      streamBroker.setTestAudioInput();
      const sentAttendeeId = 'foo-attendee';
      let callbackFired = false;
      rt.realtimeSetLocalAttendeeId(sentAttendeeId, null);
      rt.realtimeSubscribeToVolumeIndicator(
        sentAttendeeId,
        (
          attendeeId: string,
          volume: number | null,
          muted: boolean | null,
          signalStrength: number | null
        ) => {
          callbackFired = true;
          expect(attendeeId).to.equal(sentAttendeeId);
          expect(volume).to.equal(0.0);
          expect(muted).to.equal(true);
          expect(signalStrength).to.equal(null);
        }
      );
      rt.realtimeMuteLocalAudio();
      expect(callbackFired).to.equal(true);
    });

    it('will send a volume update when unmuted with audio input', () => {
      streamBroker.setTestAudioInput();
      const sentAttendeeId = 'foo-attendee';
      let callbackFired = false;
      rt.realtimeSetLocalAttendeeId(sentAttendeeId, null);
      // rt.realtimeSetLocalAudioInput(getPseudoMediaStream());
      rt.realtimeMuteLocalAudio();
      rt.realtimeSubscribeToVolumeIndicator(
        sentAttendeeId,
        (
          attendeeId: string,
          volume: number | null,
          muted: boolean | null,
          signalStrength: number | null
        ) => {
          callbackFired = true;
          expect(attendeeId).to.equal(sentAttendeeId);
          expect(volume).to.equal(0.0);
          expect(muted).to.equal(false);
          expect(signalStrength).to.equal(null);
        }
      );
      rt.realtimeUnmuteLocalAudio();
      expect(callbackFired).to.equal(true);
    });

    it('will not send a volume update when muted without audio input', () => {
      const sentAttendeeId = 'foo-attendee';
      let callbackFired = false;
      rt.realtimeSetLocalAttendeeId(sentAttendeeId, null);
      rt.realtimeSubscribeToVolumeIndicator(
        sentAttendeeId,
        (
          _attendeeId: string,
          _volume: number | null,
          _muted: boolean | null,
          _signalStrength: number | null
        ) => {
          callbackFired = true;
        }
      );
      rt.realtimeMuteLocalAudio();
      expect(callbackFired).to.equal(false);
    });

    it('will not send a volume update when unmuted without audio input', () => {
      const sentAttendeeId = 'foo-attendee';
      let callbackFired = false;
      rt.realtimeSetLocalAttendeeId(sentAttendeeId, null);
      rt.realtimeMuteLocalAudio();
      rt.realtimeSubscribeToVolumeIndicator(
        sentAttendeeId,
        (
          _attendeeId: string,
          _volume: number | null,
          _muted: boolean | null,
          _signalStrength: number | null
        ) => {
          callbackFired = true;
        }
      );
      rt.realtimeUnmuteLocalAudio();
      expect(callbackFired).to.equal(false);
    });

    it('will send a signal strength change when it changes', () => {
      let callbackIndex = 0;
      rt.realtimeSubscribeToLocalSignalStrengthChange((signalStrength: number) => {
        if (callbackIndex === 0) {
          expect(signalStrength).to.equal(0);
        } else if (callbackIndex === 1) {
          expect(signalStrength).to.equal(0.5);
        } else if (callbackIndex === 2) {
          expect(signalStrength).to.equal(1);
        }
        callbackIndex += 1;
      });
      const sentAttendeeId = 'foo-attendee';
      rt.realtimeSetLocalAttendeeId(sentAttendeeId, null);
      rt.realtimeUpdateVolumeIndicator(sentAttendeeId, null, null, 0, null);
      expect(callbackIndex).to.equal(1);
      rt.realtimeUpdateVolumeIndicator(sentAttendeeId, null, null, 0.5, null);
      expect(callbackIndex).to.equal(2);
      rt.realtimeUpdateVolumeIndicator(sentAttendeeId, null, null, 1, null);
      expect(callbackIndex).to.equal(3);
    });

    it('will send an initial signal strength upon subscribing', () => {
      let callbackIndex = 0;
      const sentAttendeeId = 'foo-attendee';
      rt.realtimeSetLocalAttendeeId(sentAttendeeId, null);
      rt.realtimeUpdateVolumeIndicator(sentAttendeeId, null, null, 0, null);
      expect(callbackIndex).to.equal(0);
      rt.realtimeSubscribeToLocalSignalStrengthChange((signalStrength: number) => {
        if (callbackIndex === 0) {
          expect(signalStrength).to.equal(0);
        }
        callbackIndex += 1;
      });
      expect(callbackIndex).to.equal(1);
    });
  });

  describe('attendee ids', () => {
    it('will send attendee id change callbacks', () => {
      let callbackIndex = 0;
      const fooAttendee = 'foo-attendee';
      rt.realtimeSubscribeToAttendeeIdPresence((attendeeId: string, present: boolean) => {
        if (callbackIndex === 0) {
          expect(attendeeId).to.equal(fooAttendee);
          expect(present).to.be.true;
        } else if (callbackIndex === 1) {
          expect(attendeeId).to.equal(fooAttendee);
          expect(present).to.be.false;
        }
        callbackIndex += 1;
      });
      expect(callbackIndex).to.equal(0);
      rt.realtimeSetAttendeeIdPresence(fooAttendee, true, null, false, null);
      expect(callbackIndex).to.equal(1);
      rt.realtimeSetAttendeeIdPresence(fooAttendee, false, null, false, null);
      expect(callbackIndex).to.equal(2);
    });
  });

  describe('data message', () => {
    it('will trigger send message callbacks if subscribed', () => {
      let callbackIndex = 0;
      let resultTopic, resultData, resultLifetimeMs;
      const callback = (
        topic: string,
        data: Uint8Array | string | any, // eslint-disable-line @typescript-eslint/no-explicit-any
        lifetimeMs?: number
      ): void => {
        callbackIndex++;
        resultTopic = topic;
        resultData = data;
        resultLifetimeMs = lifetimeMs;
      };
      rt.realtimeSubscribeToSendDataMessage(callback);
      rt.realtimeSendDataMessage('topic1', 'text1', 100);
      expect(callbackIndex).to.eq(1);
      expect(resultTopic).to.eq('topic1');
      expect(resultData).to.eq('text1');
      expect(resultLifetimeMs).to.eq(100);
      rt.realtimeSendDataMessage('topic2', 'text2');
      expect(callbackIndex).to.eq(2);
      expect(resultTopic).to.eq('topic2');
      expect(resultData).to.eq('text2');
      expect(resultLifetimeMs).to.be.undefined;
    });

    it('will not trigger send message callbacks if unsubscribed', () => {
      let callbackIndex = 0;
      let resultTopic, resultData, resultLifetimeMs;
      const callback = (
        topic: string,
        data: Uint8Array | string | any, // eslint-disable-line @typescript-eslint/no-explicit-any
        lifetimeMs?: number
      ): void => {
        callbackIndex++;
        resultTopic = topic;
        resultData = data;
        resultLifetimeMs = lifetimeMs;
      };
      rt.realtimeSubscribeToSendDataMessage(callback);
      rt.realtimeSendDataMessage('topic1', 'text1', 100);
      expect(callbackIndex).to.eq(1);
      expect(resultTopic).to.eq('topic1');
      expect(resultData).to.eq('text1');
      expect(resultLifetimeMs).to.eq(100);
      rt.realtimeUnsubscribeFromSendDataMessage(callback);
      rt.realtimeSendDataMessage('topic2', 'text2');
      expect(callbackIndex).to.eq(1);
      expect(resultTopic).to.eq('topic1');
      expect(resultData).to.eq('text1');
      expect(resultLifetimeMs).to.eq(100);
    });

    it('will trigger receive message callbacks if subscribed and match topic', () => {
      let callbackIndex = 0;
      let resultDataMessage: DataMessage = null;
      const callback = (dataMessage: DataMessage): void => {
        callbackIndex++;
        resultDataMessage = dataMessage;
      };
      const topic = 'topic';
      rt.realtimeSubscribeToReceiveDataMessage(topic, callback);
      let dataMessage = new DataMessage(
        10000,
        topic,
        new TextEncoder().encode('text1'),
        'sender1',
        'senderExtId1'
      );
      rt.realtimeReceiveDataMessage(dataMessage);
      expect(callbackIndex).to.eq(1);
      expect(resultDataMessage.timestampMs).to.eq(10000);
      expect(resultDataMessage.topic).to.eq(topic);
      expect(resultDataMessage.text()).to.eq('text1');
      expect(resultDataMessage.senderAttendeeId).to.eq('sender1');
      expect(resultDataMessage.senderExternalUserId).to.eq('senderExtId1');
      dataMessage = new DataMessage(
        20000,
        topic,
        new TextEncoder().encode('text2'),
        'sender2',
        'senderExtId2'
      );
      rt.realtimeReceiveDataMessage(dataMessage);
      expect(callbackIndex).to.eq(2);
      expect(resultDataMessage.timestampMs).to.eq(20000);
      expect(resultDataMessage.topic).to.eq(topic);
      expect(resultDataMessage.text()).to.eq('text2');
      expect(resultDataMessage.senderAttendeeId).to.eq('sender2');
      expect(resultDataMessage.senderExternalUserId).to.eq('senderExtId2');
    });

    it('will not trigger receive message callbacks if topic does not match', () => {
      let callbackIndex = 0;
      let resultDataMessage: DataMessage = null;
      const callback = (dataMessage: DataMessage): void => {
        callbackIndex++;
        resultDataMessage = dataMessage;
      };
      const topic = 'topic';
      rt.realtimeSubscribeToReceiveDataMessage(topic, callback);
      let dataMessage = new DataMessage(
        10000,
        topic,
        new TextEncoder().encode('text1'),
        'sender1',
        'senderExtId1'
      );
      rt.realtimeReceiveDataMessage(dataMessage);
      expect(callbackIndex).to.eq(1);
      expect(resultDataMessage.timestampMs).to.eq(10000);
      expect(resultDataMessage.topic).to.eq(topic);
      expect(resultDataMessage.text()).to.eq('text1');
      expect(resultDataMessage.senderAttendeeId).to.eq('sender1');
      expect(resultDataMessage.senderExternalUserId).to.eq('senderExtId1');
      dataMessage = new DataMessage(
        20000,
        'otherTopic',
        new TextEncoder().encode('text2'),
        'sender2',
        'senderExtId2'
      );
      rt.realtimeReceiveDataMessage(dataMessage);
      expect(callbackIndex).to.eq(1);
      expect(resultDataMessage.timestampMs).to.eq(10000);
      expect(resultDataMessage.topic).to.eq(topic);
      expect(resultDataMessage.text()).to.eq('text1');
      expect(resultDataMessage.senderAttendeeId).to.eq('sender1');
      expect(resultDataMessage.senderExternalUserId).to.eq('senderExtId1');
    });

    it('will not trigger receive message callbacks if unsubscribed', () => {
      let callbackIndex = 0;
      let resultDataMessage: DataMessage = null;
      const callback = (dataMessage: DataMessage): void => {
        callbackIndex++;
        resultDataMessage = dataMessage;
      };
      const topic = 'topic';
      rt.realtimeSubscribeToReceiveDataMessage(topic, callback);
      let dataMessage = new DataMessage(
        10000,
        topic,
        new TextEncoder().encode('text1'),
        'sender1',
        'senderExtId1'
      );
      rt.realtimeReceiveDataMessage(dataMessage);
      expect(callbackIndex).to.eq(1);
      expect(resultDataMessage.timestampMs).to.eq(10000);
      expect(resultDataMessage.topic).to.eq(topic);
      expect(resultDataMessage.text()).to.eq('text1');
      expect(resultDataMessage.senderAttendeeId).to.eq('sender1');
      expect(resultDataMessage.senderExternalUserId).to.eq('senderExtId1');
      dataMessage = new DataMessage(
        20000,
        topic,
        new TextEncoder().encode('text2'),
        'sender2',
        'senderExtId1'
      );
      rt.realtimeUnsubscribeFromReceiveDataMessage(topic);
      rt.realtimeReceiveDataMessage(dataMessage);
      expect(callbackIndex).to.eq(1);
      expect(resultDataMessage.timestampMs).to.eq(10000);
      expect(resultDataMessage.topic).to.eq(topic);
      expect(resultDataMessage.text()).to.eq('text1');
      expect(resultDataMessage.senderAttendeeId).to.eq('sender1');
      expect(resultDataMessage.senderExternalUserId).to.eq('senderExtId1');
    });

    it('can add multiple callbacks for the same topic', () => {
      let callbackIndex1 = 0;
      const callback1 = (_dataMessage: DataMessage): void => {
        callbackIndex1++;
      };
      let callbackIndex2 = 0;
      const callback2 = (_dataMessage: DataMessage): void => {
        callbackIndex2++;
      };
      const topic = 'topic';
      rt.realtimeSubscribeToReceiveDataMessage(topic, callback1);
      rt.realtimeSubscribeToReceiveDataMessage(topic, callback2);
      rt.realtimeReceiveDataMessage(
        new DataMessage(10000, topic, new TextEncoder().encode('text1'), 'sender1', 'senderExtId1')
      );
      expect(callbackIndex1).to.eq(1);
      expect(callbackIndex2).to.eq(1);
    });
  });

  describe('transcription controller', () => {
    it('can get transcriptionController', () => {
      expect(rt.transcriptionController).to.not.equal(null);
    });
  });

  describe('unsubscribe', () => {
    it('can unsubscribe from callbacks', () => {
      // subscribe to callbacks
      let callbacksRemoved = true;
      let fatalErrorCallbackRemoved = true;
      const AttendeeIdPresenceCallback = (_attendeeId: string, _present: boolean): void => {
        callbacksRemoved = false;
        throw new Error('fake error');
      };
      const SetCanUnmuteLocalAudioCallback = (_canUnmute: boolean): void => {
        callbacksRemoved = false;
      };
      const MuteAndUnmuteLocalAudioCallback = (_muted: boolean): void => {
        callbacksRemoved = false;
      };
      const LocalSignalStrengthChangeCallback = (_signalStrength: number): void => {
        callbacksRemoved = false;
      };
      const SendDataMessageCallback = (
        _topic: string,
        _data: Uint8Array | string | any, // eslint-disable-line @typescript-eslint/no-explicit-any
        _lifetimeMs?: number
      ): void => {
        callbacksRemoved = false;
      };

      const ReceiveDataMessageCallback = (_dataMessage: DataMessage): void => {
        callbacksRemoved = false;
      };
      const fatalErrorCallback = (_error: Error): void => {
        fatalErrorCallbackRemoved = false;
      };
      rt.realtimeSubscribeToAttendeeIdPresence(AttendeeIdPresenceCallback);
      rt.realtimeSubscribeToSetCanUnmuteLocalAudio(SetCanUnmuteLocalAudioCallback);
      rt.realtimeSubscribeToMuteAndUnmuteLocalAudio(MuteAndUnmuteLocalAudioCallback);
      rt.realtimeSubscribeToVolumeIndicator(
        'fakeAttendeeId',
        (
          _attendeeId: string,
          _volume: number | null,
          _muted: boolean | null,
          _signalStrength: number | null
        ) => {
          callbacksRemoved = false;
        }
      );
      rt.realtimeSubscribeToLocalSignalStrengthChange(LocalSignalStrengthChangeCallback);
      rt.realtimeSubscribeToSendDataMessage(SendDataMessageCallback);
      rt.realtimeSubscribeToReceiveDataMessage('topic', ReceiveDataMessageCallback);
      rt.realtimeSubscribeToFatalError(fatalErrorCallback);

      // attempt to trigger a fake error after unsubscribing to fatal errors
      rt.realtimeUnsubscribeToFatalError(fatalErrorCallback);
      rt.realtimeSetAttendeeIdPresence('unused', true, null, false, null);
      expect(fatalErrorCallbackRemoved).to.be.true;

      // unsubscribe from other callbacks
      callbacksRemoved = true;
      rt.realtimeUnsubscribeToAttendeeIdPresence(AttendeeIdPresenceCallback);
      rt.realtimeUnsubscribeToSetCanUnmuteLocalAudio(SetCanUnmuteLocalAudioCallback);
      rt.realtimeUnsubscribeToMuteAndUnmuteLocalAudio(MuteAndUnmuteLocalAudioCallback);
      rt.realtimeUnsubscribeFromVolumeIndicator('fakeAttendeeId');
      rt.realtimeUnsubscribeToLocalSignalStrengthChange(LocalSignalStrengthChangeCallback);
      rt.realtimeUnsubscribeFromSendDataMessage(SendDataMessageCallback);
      rt.realtimeUnsubscribeFromReceiveDataMessage('topic');

      // attempt to trigger callbacks
      rt.realtimeSetAttendeeIdPresence('unused', true, null, false, null);
      rt.realtimeSetCanUnmuteLocalAudio(false);
      rt.realtimeMuteLocalAudio();
      // also triggers local signal strength callbacks
      rt.realtimeUpdateVolumeIndicator('fakeAttendeeId', 0.5, null, 1, null);
      rt.realtimeSendDataMessage('topic', 'test message');
      rt.realtimeReceiveDataMessage(
        new DataMessage(
          10000,
          'topic',
          new TextEncoder().encode('text1'),
          'sender1',
          'senderExtId1'
        )
      );
      expect(callbacksRemoved).to.be.true;
    });
  });

  describe('position in frame', () => {
    it('can get correct position in frame', () => {
      let index = 0;
      const attendeesInFrame = 5;
      rt.realtimeSubscribeToAttendeeIdPresence(
        (
          _attendeeId: string,
          _present: boolean,
          _externalUserId: string,
          _dropped: boolean,
          posInFrame: RealtimeAttendeePositionInFrame
        ) => {
          expect(posInFrame.attendeeIndex).to.equal(index);
          expect(posInFrame.attendeesInFrame).to.equal(attendeesInFrame);
        }
      );
      for (index < attendeesInFrame; index++; ) {
        rt.realtimeSetAttendeeIdPresence(null, null, null, null, {
          attendeeIndex: index,
          attendeesInFrame: attendeesInFrame,
        });
      }
    });
  });

  // Most of these cannot occur unless the state object is somehow damaged.
  describe('unusual failures', () => {
    function matchError(message: string, altMessage: string = ''): sinon.SinonMatcher {
      return sinon.match
        .instanceOf(Error)
        .and(sinon.match.has('message', message).or(sinon.match.has('message', altMessage)));
    }

    it('handles broken attendeeIdChangesCallbacks', () => {
      const fatal = sinon.stub();
      rt.realtimeSubscribeToFatalError(fatal);

      // Break it.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const state: RealtimeState = ((rt as unknown) as any).state as RealtimeState;
      state.attendeeIdChangesCallbacks = undefined;

      rt.realtimeSubscribeToAttendeeIdPresence((_a, _p) => {});
      expect(fatal.calledOnce).to.be.true;
      const match = matchError(
        "Cannot read property 'push' of undefined",
        "Cannot read properties of undefined (reading 'push')"
      );
      expect(fatal.calledWith(match)).to.be.true;

      rt.realtimeUnsubscribeToAttendeeIdPresence((_a, _p) => {});
      expect(fatal.calledTwice).to.be.true;
    });

    it('handles broken CanUnmute callbacks', () => {
      const fatal = sinon.stub();
      rt.realtimeSubscribeToFatalError(fatal);

      // Break it.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const state: RealtimeState = ((rt as unknown) as any).state as RealtimeState;
      state.setCanUnmuteLocalAudioCallbacks = undefined;

      rt.realtimeSubscribeToSetCanUnmuteLocalAudio(_m => {});
      expect(fatal.calledOnce).to.be.true;
      const match = matchError(
        "Cannot read property 'push' of undefined",
        "Cannot read properties of undefined (reading 'push')"
      );
      expect(fatal.calledWith(match)).to.be.true;
      fatal.reset();

      rt.realtimeUnsubscribeToSetCanUnmuteLocalAudio(_m => {});
      const matchUn = matchError(
        "Cannot read property 'indexOf' of undefined",
        "Cannot read properties of undefined (reading 'indexOf')"
      );
      expect(fatal.calledWith(matchUn)).to.be.true;
    });

    it('handles broken signal strength callbacks', () => {
      const fatal = sinon.stub();
      rt.realtimeSubscribeToFatalError(fatal);

      // Break it.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const state: RealtimeState = ((rt as unknown) as any).state as RealtimeState;
      state.localSignalStrengthChangeCallbacks = undefined;

      rt.realtimeSubscribeToLocalSignalStrengthChange(_s => {});
      expect(fatal.calledOnce).to.be.true;
      expectError(
        fatal,
        "Cannot read property 'push' of undefined",
        "Cannot read properties of undefined (reading 'push')"
      );
      fatal.reset();

      rt.realtimeUnsubscribeToLocalSignalStrengthChange(_s => {});
      expectError(
        fatal,
        "Cannot read property 'indexOf' of undefined",
        "Cannot read properties of undefined (reading 'indexOf')"
      );
    });

    function expectError(stub: sinon.SinonStub, message: string, altMessage: string = ''): void {
      const match = matchError(message, altMessage);
      if (!stub.calledWith(match)) {
        chai.assert(false, `Expected error '${message}, but got ${stub.getCalls()[0].lastArg}`);
      }
      expect(stub.calledWith(match)).to.be.true;
    }

    it('handles broken receive datamessage callbacks', () => {
      const fatal = sinon.stub();
      rt.realtimeSubscribeToFatalError(fatal);

      // Break it.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const state: RealtimeState = ((rt as unknown) as any).state as RealtimeState;
      state.receiveDataMessageCallbacks = undefined;

      rt.realtimeSubscribeToReceiveDataMessage('a', _data => {});
      expect(fatal.calledOnce).to.be.true;
      expectError(
        fatal,
        "Cannot read property 'has' of undefined",
        "Cannot read properties of undefined (reading 'has')"
      );
      fatal.reset();

      rt.realtimeUnsubscribeFromReceiveDataMessage('a');
      expectError(
        fatal,
        "Cannot read property 'delete' of undefined",
        "Cannot read properties of undefined (reading 'delete')"
      );
    });

    it('handles broken send datamessage callbacks', () => {
      const fatal = sinon.stub();
      rt.realtimeSubscribeToFatalError(fatal);

      // Break it.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const state: RealtimeState = ((rt as unknown) as any).state as RealtimeState;
      state.sendDataMessageCallbacks = undefined;

      rt.realtimeSubscribeToSendDataMessage((_topic, _data) => {});
      expect(fatal.calledOnce).to.be.true;
      expectError(
        fatal,
        "Cannot read property 'push' of undefined",
        "Cannot read properties of undefined (reading 'push')"
      );
      fatal.reset();

      rt.realtimeUnsubscribeFromSendDataMessage((_topic, _data) => {});
      expectError(
        fatal,
        "Cannot read property 'indexOf' of undefined",
        "Cannot read properties of undefined (reading 'indexOf')"
      );
    });

    it('handles broken mute callbacks', () => {
      const fatal = sinon.stub();
      rt.realtimeSubscribeToFatalError(fatal);

      // Break it.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const state: RealtimeState = ((rt as unknown) as any).state as RealtimeState;
      state.muteAndUnmuteLocalAudioCallbacks = undefined;

      rt.realtimeSubscribeToMuteAndUnmuteLocalAudio(_m => {});
      expect(fatal.calledOnce).to.be.true;
      expectError(
        fatal,
        "Cannot read property 'push' of undefined",
        "Cannot read properties of undefined (reading 'push')"
      );
      fatal.reset();

      rt.realtimeUnsubscribeToMuteAndUnmuteLocalAudio(_m => {});
      expectError(
        fatal,
        "Cannot read property 'indexOf' of undefined",
        "Cannot read properties of undefined (reading 'indexOf')"
      );
    });

    it('handles broken fatal callbacks', () => {
      // Break it.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const state: RealtimeState = ((rt as unknown) as any).state as RealtimeState;
      state.fatalErrorCallbacks = undefined;

      const stub = sinon.stub();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((rt as unknown) as any).onError = stub;

      const cb = (): void => {
        throw new Error('bad');
      };
      rt.realtimeSubscribeToFatalError(cb);

      expect(stub.calledOnce).to.be.true;
      rt.realtimeUnsubscribeToFatalError(cb);
    });

    it('handles a throwing mute callback', () => {
      const fatal = sinon.stub();
      rt.realtimeSubscribeToFatalError(fatal);
      rt.realtimeSubscribeToMuteAndUnmuteLocalAudio(_m => {
        throw new Error('Oh no');
      });
      expect(fatal.notCalled).to.be.true;

      rt.realtimeMuteLocalAudio();

      expect(fatal.calledOnce).to.be.true;
      expectError(fatal, 'Oh no');

      fatal.reset();

      rt.realtimeUnmuteLocalAudio();

      expect(fatal.calledOnce).to.be.true;
      expectError(fatal, 'Oh no');
    });

    it('handles a send message callback that throws', () => {
      const fatal = sinon.stub();
      rt.realtimeSubscribeToFatalError(fatal);
      rt.realtimeSubscribeToSendDataMessage(_m => {
        throw new Error('Oh no');
      });

      rt.realtimeSendDataMessage('foo', 'bar', 1000);
      expectError(fatal, 'Oh no');
    });

    it('does not throw when it receives a message callback that throws', () => {
      const fatal = sinon.stub();
      rt.realtimeSubscribeToFatalError(fatal);
      rt.realtimeSubscribeToReceiveDataMessage('foo', _m => {
        throw new Error('Oh no');
      });

      const message = new DataMessage(Date.now(), 'foo', new Uint8Array(), 'abc', 'def', false);
      rt.realtimeReceiveDataMessage(message);
      expect(fatal.called).to.be.false;
    });
  });
});
