// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ClientMetricReport from '../clientmetricreport/ClientMetricReport';
import ClientVideoStreamReceivingReport from '../clientmetricreport/ClientVideoStreamReceivingReport';
import ConnectionHealthData from '../connectionhealthpolicy/ConnectionHealthData';
import EventAttributes from '../eventcontroller/EventAttributes';
import EventName from '../eventcontroller/EventName';
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
   * Called when metric of video outbound traffic is received.
   */
  videoSendHealthDidChange?(bitrateKbps: number, packetsPerSecond: number): void;

  /**
   * Called when available video sending bandwidth changed.
   */
  videoSendBandwidthDidChange?(
    newBandwidthKbps: number,
    oldBandwidthKbps: number,
    nackCountPerSecond?: number
  ): void;

  /**
   * Called when available video receiving bandwidth changed to trigger video subscription if needed.
   */
  videoReceiveBandwidthDidChange?(newBandwidthKbps: number, oldBandwidthKbps: number): void;

  /**
   * Called when total downlink video bandwidth estimation is less than required video bitrates.
   */
  estimatedDownlinkBandwidthLessThanRequired?(
    estimatedBandwidth: number,
    requiredBandwidth: number
  ): void;

  /**
   * Called when one or more remote video streams do not meet expected average bitrate.
   */
  videoNotReceivingEnoughData?(receivingDataMap: ClientVideoStreamReceivingReport[]): void;

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
   * Called when specific events occur during the meeting and includes attributes of the event. This can be used to
   * create analytics around meeting metric.
   */
  eventDidReceive?(name: EventName, attributes: EventAttributes): void;

  /**
   * Called when the remote video sending sources get changed.
   */
  remoteVideoSourcesDidChange?(videoSources: VideoSource[]): void;

  /**
   * Called when simulcast is enabled and simulcast uplink encoding layers get changed.
   */
  encodingSimulcastLayersDidChange?(simulcastLayers: SimulcastLayers): void;
}
