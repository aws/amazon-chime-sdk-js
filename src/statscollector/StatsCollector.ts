// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import ClientMetricReport from '../clientmetricreport/ClientMetricReport';
import MeetingSessionLifecycleEvent from '../meetingsession/MeetingSessionLifecycleEvent';
import MeetingSessionLifecycleEventCondition from '../meetingsession/MeetingSessionLifecycleEventCondition';
import MeetingSessionStatus from '../meetingsession/MeetingSessionStatus';
import AudioLogEvent from './AudioLogEvent';
import VideoLogEvent from './VideoLogEvent';

/**
 * [[StatsCollector]] gathers statistics and sends metrics.
 */
export default interface StatsCollector {
  /**
   * Starts collecting statistics.
   */
  start(
    meetingSessionContext: AudioVideoControllerState,
    clientMetricReport?: ClientMetricReport
  ): boolean;

  /*
   * Stops the stats collector.
   */
  stop(): void;

  /**
   * Logs the audio event.
   */
  logAudioEvent(eventName: AudioLogEvent, attributes?: { [id: string]: string }): void;

  /**
   * Logs the video event.
   */
  logVideoEvent(eventName: VideoLogEvent, attributes?: { [id: string]: string }): void;

  /**
   * Logs the latency.
   */
  logLatency(eventName: string, timeMs: number, attributes?: { [id: string]: string }): void;

  /**
   * Logs the state timeout.
   */
  logStateTimeout(stateName: string, attributes?: { [id: string]: string }): void;

  /**
   * Logs the session status.
   */
  logMeetingSessionStatus(status: MeetingSessionStatus): void;

  /**
   * Logs the lifecycle event
   */
  logLifecycleEvent(
    lifecycleEvent: MeetingSessionLifecycleEvent,
    condition: MeetingSessionLifecycleEventCondition
  ): void;
}
