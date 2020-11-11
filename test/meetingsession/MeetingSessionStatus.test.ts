// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import MeetingSessionStatus from '../../src/meetingsession/MeetingSessionStatus';
import MeetingSessionStatusCode from '../../src/meetingsession/MeetingSessionStatusCode';
import {
  SdkAudioStatusFrame,
  SdkErrorFrame,
  SdkSignalFrame,
} from '../../src/signalingprotocol/SignalingProtocol.js';

describe('MeetingSessionStatus', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  const statusCodes = [
    MeetingSessionStatusCode.OK,
    MeetingSessionStatusCode.Left,
    MeetingSessionStatusCode.AudioJoinedFromAnotherDevice,
    MeetingSessionStatusCode.AudioDisconnectAudio,
    MeetingSessionStatusCode.AudioAuthenticationRejected,
    MeetingSessionStatusCode.AudioCallAtCapacity,
    MeetingSessionStatusCode.MeetingEnded,
    MeetingSessionStatusCode.AudioInternalServerError,
    MeetingSessionStatusCode.AudioServiceUnavailable,
    MeetingSessionStatusCode.AudioDisconnected,
    MeetingSessionStatusCode.VideoCallSwitchToViewOnly,
    MeetingSessionStatusCode.VideoCallAtSourceCapacity,
    MeetingSessionStatusCode.SignalingBadRequest,
    MeetingSessionStatusCode.SignalingInternalServerError,
    MeetingSessionStatusCode.SignalingRequestFailed,
    MeetingSessionStatusCode.StateMachineTransitionFailed,
    MeetingSessionStatusCode.TURNCredentialsForbidden,
    MeetingSessionStatusCode.ICEGatheringTimeoutWorkaround,
    MeetingSessionStatusCode.ConnectionHealthReconnect,
    MeetingSessionStatusCode.RealtimeApiFailed,
  ];

  describe('isFailure', () => {
    it('is a failure', () => {
      const failureSet = new Set([
        MeetingSessionStatusCode.AudioAuthenticationRejected,
        MeetingSessionStatusCode.AudioCallAtCapacity,
        MeetingSessionStatusCode.AudioInternalServerError,
        MeetingSessionStatusCode.AudioServiceUnavailable,
        MeetingSessionStatusCode.AudioDisconnected,
        MeetingSessionStatusCode.VideoCallAtSourceCapacity,
        MeetingSessionStatusCode.SignalingBadRequest,
        MeetingSessionStatusCode.SignalingInternalServerError,
        MeetingSessionStatusCode.SignalingRequestFailed,
        MeetingSessionStatusCode.StateMachineTransitionFailed,
        MeetingSessionStatusCode.ICEGatheringTimeoutWorkaround,
        MeetingSessionStatusCode.ConnectionHealthReconnect,
        MeetingSessionStatusCode.RealtimeApiFailed,
      ]);
      for (const statusCode of statusCodes) {
        const status = new MeetingSessionStatus(statusCode);
        expect(status.isFailure()).to.equal(failureSet.has(status.statusCode()));
      }
    });
  });

  describe('isTerminal', () => {
    it('is terminal', () => {
      const terminalSet = new Set([
        MeetingSessionStatusCode.Left,
        MeetingSessionStatusCode.AudioJoinedFromAnotherDevice,
        MeetingSessionStatusCode.AudioAuthenticationRejected,
        MeetingSessionStatusCode.AudioCallAtCapacity,
        MeetingSessionStatusCode.MeetingEnded,
        MeetingSessionStatusCode.AudioDisconnected,
        MeetingSessionStatusCode.SignalingBadRequest,
        MeetingSessionStatusCode.SignalingRequestFailed,
        MeetingSessionStatusCode.TURNCredentialsForbidden,
        MeetingSessionStatusCode.VideoCallAtSourceCapacity,
        MeetingSessionStatusCode.RealtimeApiFailed,
      ]);
      for (const statusCode of statusCodes) {
        const status = new MeetingSessionStatus(statusCode);
        expect(status.isTerminal()).to.equal(terminalSet.has(status.statusCode()));
      }
    });
  });

  describe('isAudioConnectionFailure', () => {
    it('is an audio connection failure', () => {
      const audioConnectionFailureSet = new Set([
        MeetingSessionStatusCode.AudioAuthenticationRejected,
        MeetingSessionStatusCode.AudioInternalServerError,
        MeetingSessionStatusCode.AudioServiceUnavailable,
        MeetingSessionStatusCode.StateMachineTransitionFailed,
        MeetingSessionStatusCode.ICEGatheringTimeoutWorkaround,
        MeetingSessionStatusCode.SignalingBadRequest,
        MeetingSessionStatusCode.SignalingInternalServerError,
        MeetingSessionStatusCode.SignalingRequestFailed,
        MeetingSessionStatusCode.RealtimeApiFailed,
      ]);
      for (const statusCode of statusCodes) {
        const status = new MeetingSessionStatus(statusCode);
        expect(status.isAudioConnectionFailure()).to.equal(
          audioConnectionFailureSet.has(status.statusCode())
        );
      }
    });
  });

  describe('fromSignalFrame', () => {
    it('handles errors', () => {
      const errorStatusCodes: { [code: number]: MeetingSessionStatusCode } = {
        206: MeetingSessionStatusCode.VideoCallSwitchToViewOnly,
        509: MeetingSessionStatusCode.VideoCallAtSourceCapacity,
        200: MeetingSessionStatusCode.OK,
        300: MeetingSessionStatusCode.SignalingRequestFailed,
        400: MeetingSessionStatusCode.SignalingBadRequest,
        500: MeetingSessionStatusCode.SignalingInternalServerError,
      };

      for (const errorStatusCode in errorStatusCodes) {
        const message = SdkSignalFrame.create();
        message.type = SdkSignalFrame.Type.JOIN;
        message.error = SdkErrorFrame.create();
        message.error.status = Number(errorStatusCode);
        const status = MeetingSessionStatus.fromSignalFrame(message);
        expect(status.statusCode()).to.equal(errorStatusCodes[errorStatusCode]);
      }
    });

    it('handles audio frames', () => {
      const audioStatusCodes: { [code: number]: MeetingSessionStatusCode } = {
        200: MeetingSessionStatusCode.OK,
        301: MeetingSessionStatusCode.AudioJoinedFromAnotherDevice,
        302: MeetingSessionStatusCode.AudioDisconnectAudio,
        403: MeetingSessionStatusCode.AudioAuthenticationRejected,
        409: MeetingSessionStatusCode.AudioCallAtCapacity,
        410: MeetingSessionStatusCode.MeetingEnded,
        500: MeetingSessionStatusCode.AudioInternalServerError,
        503: MeetingSessionStatusCode.AudioServiceUnavailable,
        201: MeetingSessionStatusCode.OK,
        400: MeetingSessionStatusCode.AudioDisconnected,
      };

      for (const audioStatusCode in audioStatusCodes) {
        const message = SdkSignalFrame.create();
        message.type = SdkSignalFrame.Type.AUDIO_STATUS;
        message.audioStatus = SdkAudioStatusFrame.create();
        message.audioStatus.audioStatus = Number(audioStatusCode);
        const status = MeetingSessionStatus.fromSignalFrame(message);
        expect(status.statusCode()).to.equal(audioStatusCodes[audioStatusCode]);
      }
    });

    it('handles audio frames but without audioStatus', () => {
      const message = SdkSignalFrame.create();
      message.type = SdkSignalFrame.Type.AUDIO_STATUS;
      const status = MeetingSessionStatus.fromSignalFrame(message);
      expect(status.statusCode()).to.equal(MeetingSessionStatusCode.SignalingRequestFailed);
    });

    it('handles non-error or non-audio frames', () => {
      const message = SdkSignalFrame.create();
      message.type = SdkSignalFrame.Type.JOIN;
      const status = MeetingSessionStatus.fromSignalFrame(message);
      expect(status.statusCode()).to.equal(MeetingSessionStatusCode.OK);
    });
  });
});
