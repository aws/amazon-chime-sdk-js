// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { SdkSignalFrame } from '../signalingprotocol/SignalingProtocol.js';
import MeetingSessionStatusCode from './MeetingSessionStatusCode';

/**
 * [[MeetingSessionStatus]] indicates a status received regarding the session.
 */
export default class MeetingSessionStatus {
  constructor(private _statusCode: MeetingSessionStatusCode) {}

  statusCode(): MeetingSessionStatusCode {
    return this._statusCode;
  }

  isFailure(): boolean {
    switch (this._statusCode) {
      case MeetingSessionStatusCode.AudioAuthenticationRejected:
      case MeetingSessionStatusCode.AudioCallAtCapacity:
      case MeetingSessionStatusCode.AudioInternalServerError:
      case MeetingSessionStatusCode.AudioServiceUnavailable:
      case MeetingSessionStatusCode.AudioDisconnected:
      case MeetingSessionStatusCode.VideoCallAtSourceCapacity:
      case MeetingSessionStatusCode.SignalingBadRequest:
      case MeetingSessionStatusCode.SignalingInternalServerError:
      case MeetingSessionStatusCode.SignalingRequestFailed:
      case MeetingSessionStatusCode.StateMachineTransitionFailed:
      case MeetingSessionStatusCode.ICEGatheringTimeoutWorkaround:
      case MeetingSessionStatusCode.ConnectionHealthReconnect:
      case MeetingSessionStatusCode.RealtimeApiFailed:
      case MeetingSessionStatusCode.TaskFailed:
      case MeetingSessionStatusCode.NoAttendeePresent:
        return true;
      default:
        return false;
    }
  }

  isTerminal(): boolean {
    switch (this._statusCode) {
      case MeetingSessionStatusCode.Left:
      case MeetingSessionStatusCode.AudioJoinedFromAnotherDevice:
      case MeetingSessionStatusCode.AudioAuthenticationRejected:
      case MeetingSessionStatusCode.AudioCallAtCapacity:
      case MeetingSessionStatusCode.MeetingEnded:
      case MeetingSessionStatusCode.AudioDisconnected:
      case MeetingSessionStatusCode.TURNCredentialsForbidden:
      case MeetingSessionStatusCode.SignalingBadRequest:
      case MeetingSessionStatusCode.SignalingRequestFailed:
      case MeetingSessionStatusCode.VideoCallAtSourceCapacity:
      case MeetingSessionStatusCode.RealtimeApiFailed:
        return true;
      default:
        return false;
    }
  }

  isAudioConnectionFailure(): boolean {
    switch (this._statusCode) {
      case MeetingSessionStatusCode.AudioAuthenticationRejected:
      case MeetingSessionStatusCode.AudioInternalServerError:
      case MeetingSessionStatusCode.AudioServiceUnavailable:
      case MeetingSessionStatusCode.StateMachineTransitionFailed:
      case MeetingSessionStatusCode.ICEGatheringTimeoutWorkaround:
      case MeetingSessionStatusCode.SignalingBadRequest:
      case MeetingSessionStatusCode.SignalingInternalServerError:
      case MeetingSessionStatusCode.SignalingRequestFailed:
      case MeetingSessionStatusCode.RealtimeApiFailed:
      case MeetingSessionStatusCode.NoAttendeePresent:
        return true;
      default:
        return false;
    }
  }

  static fromSignalFrame(frame: SdkSignalFrame): MeetingSessionStatus {
    if (frame.error && frame.error.status) {
      return this.fromSignalingStatus(frame.error.status);
    } else if (frame.type === SdkSignalFrame.Type.AUDIO_STATUS) {
      if (frame.audioStatus) {
        return this.fromAudioStatus(frame.audioStatus.audioStatus);
      }
      return new MeetingSessionStatus(MeetingSessionStatusCode.SignalingRequestFailed);
    }
    return new MeetingSessionStatus(MeetingSessionStatusCode.OK);
  }

  private static fromAudioStatus(status: number): MeetingSessionStatus {
    // TODO: Add these numbers to proto definition and reference them here.
    switch (status) {
      case 200:
        return new MeetingSessionStatus(MeetingSessionStatusCode.OK);
      case 301:
        return new MeetingSessionStatus(MeetingSessionStatusCode.AudioJoinedFromAnotherDevice);
      case 302:
        return new MeetingSessionStatus(MeetingSessionStatusCode.AudioDisconnectAudio);
      case 403:
        return new MeetingSessionStatus(MeetingSessionStatusCode.AudioAuthenticationRejected);
      case 409:
        return new MeetingSessionStatus(MeetingSessionStatusCode.AudioCallAtCapacity);
      case 410:
        return new MeetingSessionStatus(MeetingSessionStatusCode.MeetingEnded);
      case 500:
        return new MeetingSessionStatus(MeetingSessionStatusCode.AudioInternalServerError);
      case 503:
        return new MeetingSessionStatus(MeetingSessionStatusCode.AudioServiceUnavailable);
      default:
        switch (Math.floor(status / 100)) {
          case 2:
            return new MeetingSessionStatus(MeetingSessionStatusCode.OK);
          default:
            return new MeetingSessionStatus(MeetingSessionStatusCode.AudioDisconnected);
        }
    }
  }

  private static fromSignalingStatus(status: number): MeetingSessionStatus {
    // TODO: Add these numbers to proto definition and reference them here.
    switch (status) {
      case 206:
        return new MeetingSessionStatus(MeetingSessionStatusCode.VideoCallSwitchToViewOnly);
      case 509:
        return new MeetingSessionStatus(MeetingSessionStatusCode.VideoCallAtSourceCapacity);
      default:
        switch (Math.floor(status / 100)) {
          case 2:
            return new MeetingSessionStatus(MeetingSessionStatusCode.OK);
          case 4:
            return new MeetingSessionStatus(MeetingSessionStatusCode.SignalingBadRequest);
          case 5:
            return new MeetingSessionStatus(MeetingSessionStatusCode.SignalingInternalServerError);
          default:
            return new MeetingSessionStatus(MeetingSessionStatusCode.SignalingRequestFailed);
        }
    }
  }
}
