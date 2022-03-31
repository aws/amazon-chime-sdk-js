// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ClientMetricReport from '../clientmetricreport/ClientMetricReport';
import ConnectionHealthData from '../connectionhealthpolicy/ConnectionHealthData';
import MeetingSessionStatus from '../meetingsession/MeetingSessionStatus';
import MeetingSessionVideoAvailability from '../meetingsession/MeetingSessionVideoAvailability';
import SimulcastLayers from '../simulcastlayers/SimulcastLayers';
import VideoSource from '../videosource/VideoSource';
import VideoTileState from '../videotile/VideoTileState';

export default interface AudioVideoObserver {
  /**
   * Called when the session is connecting or reconnecting.
   */
  audioVideoDidStartConnecting?(reconnecting: boolean): void;

  /**
   * Called when the session has started.
   */
  audioVideoDidStart?(): void;

  /**
   * Called when the session has stopped from a started state with the reason
   * provided in the status.
   */
  audioVideoDidStop?(sessionStatus: MeetingSessionStatus): void;

  /**
   * Called whenever a tile has been created or updated.
   */
  videoTileDidUpdate?(tileState: VideoTileState): void;

  /**
   * Called whenever a tile has been removed.
   */
  videoTileWasRemoved?(tileId: number): void;

  /**
   * Called when video availability has changed. This information can be used to decide whether to
   * switch the connection type to video and whether or not to offer the option to start the local
   * video tile.
   */
  videoAvailabilityDidChange?(availability: MeetingSessionVideoAvailability): void;

  /**
   * Called when the media stats are available.
   */
  metricsDidReceive?(clientMetricReport: ClientMetricReport): void;

  /**
   * Called when connection health has changed.
   */
  connectionHealthDidChange?(connectionHealthData: ConnectionHealthData): void;

  /**
   * Called when the connection has been poor for a while if meeting only uses audio.
   */
  connectionDidBecomePoor?(): void;

  /**
   * Called when the connection has been poor if meeting uses video so that the observer
   * can prompt the user about turning off video.
   */
  connectionDidSuggestStopVideo?(): void;

  /**
   * Called when connection has changed to good from poor. This will be fired regardless whether the meeting
   * is audio-only or uses audio video.
   */
  connectionDidBecomeGood?(): void;

  /**
   * Called when a user tries to start a video but by the time the backend processes the request,
   * video capacity has been reached and starting local video is not possible. This can be used to
   * trigger a message to the user about the situation.
   */
  videoSendDidBecomeUnavailable?(): void;

  /**
   * Called when the remote video sending sources get changed.
   */
  remoteVideoSourcesDidChange?(videoSources: VideoSource[]): void;

  /**
   * Called when simulcast is enabled and simulcast uplink encoding layers get changed.
   */
  encodingSimulcastLayersDidChange?(simulcastLayers: SimulcastLayers): void;

  /**
   * This observer callback will only be called for attendees in Replica meetings.
   *
   * Indicates that the client is no longer authenticated to the Primary meeting
   * and can no longer share media. `status` will contain a `MeetingSessionStatusCode` of the following:
   *
   * * `MeetingSessionStatusCode.OK`: `demoteFromPrimaryMeeting` was used to remove the attendee.
   * * `MeetingSessionStatusCode.AudioAuthenticationRejected`: `chime::DeleteAttendee` was called on the Primary
   *   meeting attendee used in `promoteToPrimaryMeeting`.
   * * `MeetingSessionStatusCode.SignalingBadRequest`: Other failure, possibly due to disconnect
   *   or timeout. These failures are likely retryable. Any disconnection will trigger an automatic
   *   demotion to avoid unexpected or unwanted promotion state on reconnection.
   */
  audioVideoWasDemotedFromPrimaryMeeting?(status: MeetingSessionStatus): void;
}
