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
      case MeetingSessionStatusCode.AudioAttendeeRemoved:
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

  toString?(): string {
    switch (this._statusCode) {
      case MeetingSessionStatusCode.OK:
        return 'Everything is OK so far.';
      case MeetingSessionStatusCode.Left:
        return 'The attendee left the meeting.';
      case MeetingSessionStatusCode.AudioJoinedFromAnotherDevice:
        return 'The attendee joined from another device.';
      case MeetingSessionStatusCode.AudioAuthenticationRejected:
        return 'The meeting rejected the attendee.';
      case MeetingSessionStatusCode.AudioCallAtCapacity:
        return "The attendee couldn't join because the meeting was at capacity.";
      case MeetingSessionStatusCode.MeetingEnded:
        return 'The meeting ended.';
      case MeetingSessionStatusCode.AudioInternalServerError:
      case MeetingSessionStatusCode.AudioServiceUnavailable:
      case MeetingSessionStatusCode.AudioDisconnected:
        return 'The audio connection failed.';
      case MeetingSessionStatusCode.VideoCallSwitchToViewOnly:
        return "The attendee couldn't start the local video because the maximum video capacity was reached.";
      case MeetingSessionStatusCode.VideoCallAtSourceCapacity:
        return 'The connection failed due to an internal server error.';
      case MeetingSessionStatusCode.SignalingBadRequest:
      case MeetingSessionStatusCode.SignalingInternalServerError:
      case MeetingSessionStatusCode.SignalingRequestFailed:
        return 'The signaling connection failed.';
      case MeetingSessionStatusCode.ICEGatheringTimeoutWorkaround:
        return 'Gathering ICE candidates timed out. In Chrome, this might indicate that the browser is in a bad state after reconnecting to VPN.';
      case MeetingSessionStatusCode.ConnectionHealthReconnect:
        return 'The meeting was reconnected.';
      case MeetingSessionStatusCode.RealtimeApiFailed:
        return 'The real-time API failed. This status code might indicate that the callback you passed to the real-time API threw an exception.';
      case MeetingSessionStatusCode.TaskFailed:
        return 'The connection failed. See the error message for more details.';
      case MeetingSessionStatusCode.IncompatibleSDP:
        return 'The connection failed due to incompatible SDP.';
      case MeetingSessionStatusCode.TURNCredentialsForbidden:
        return 'The meeting ended, or the attendee was removed.';
      case MeetingSessionStatusCode.NoAttendeePresent:
        return 'The attendee was not present.';
      case MeetingSessionStatusCode.AudioAttendeeRemoved:
        return 'The meeting ended because attendee removed.';
      case MeetingSessionStatusCode.AudioVideoWasRemovedFromPrimaryMeeting:
        return 'The Primary meeting credentials provided are no longer valid. chime::DeleteAttendee may have been called on them.';
      case MeetingSessionStatusCode.AudioVideoDisconnectedWhilePromoted:
        return 'The client disconnected while promoted, which will automatically demote. The attendee must promote again to participate.';
      case MeetingSessionStatusCode.AudioDisconnectAudio:
        return 'The audio connection failed.';
      /* istanbul ignore next */
      default: {
        // You get a compile-time error if you do not handle any status code.
        const exhaustiveCheck: never = this._statusCode;
        throw new Error(`Unhandled case: ${exhaustiveCheck}`);
      }
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
    } else if (frame.type === SdkSignalFrame.Type.PRIMARY_MEETING_LEAVE) {
      return new MeetingSessionStatus(
        MeetingSessionStatusCode.AudioVideoWasRemovedFromPrimaryMeeting
      );
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
      case 411:
        return new MeetingSessionStatus(MeetingSessionStatusCode.AudioAttendeeRemoved);
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
    //
    // We don't bother adding additional codes with different prefixes, and we probably
    // shouldn't be prefixing all these errors (e.g. `AuthenticationRejected`) with the media type
    // since that doesn't make sense.
    switch (status) {
      case 206:
        return new MeetingSessionStatus(MeetingSessionStatusCode.VideoCallSwitchToViewOnly);
      case 509:
        return new MeetingSessionStatus(MeetingSessionStatusCode.VideoCallAtSourceCapacity);
      case 403:
        return new MeetingSessionStatus(MeetingSessionStatusCode.AudioAuthenticationRejected);
      case 409:
        return new MeetingSessionStatus(MeetingSessionStatusCode.AudioCallAtCapacity);
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
