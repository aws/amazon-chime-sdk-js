// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ActiveSpeakerPolicy from '../activespeakerpolicy/ActiveSpeakerPolicy';
import RealtimeController from '../realtimecontroller/RealtimeController';
import IntervalScheduler from '../scheduler/IntervalScheduler';
import ActiveSpeakerDetector from './ActiveSpeakerDetector';

/**
 * Implements the DefaultActiveSpeakerDetector with the [[ActiveSpeakerPolicy]]
 */
type DetectorCallback = (attendeeIds: string[]) => void;
type DetectorHandler = (attendeeId: string, present: boolean) => void;

export default class DefaultActiveSpeakerDetector implements ActiveSpeakerDetector {
  private speakerScores: { [attendeeId: string]: number } = {};
  private speakerMuteState: { [attendeeId: string]: boolean } = {};

  private activeSpeakers: string[] | undefined;

  private detectorCallbackToHandler: Map<DetectorCallback, DetectorHandler> = new Map<
    DetectorCallback,
    DetectorHandler
  >();
  private detectorCallbackToScoresTimer: Map<DetectorCallback, IntervalScheduler> = new Map<
    DetectorCallback,
    IntervalScheduler
  >();
  private detectorCallbackToActivityTimer: Map<DetectorCallback, IntervalScheduler> = new Map<
    DetectorCallback,
    IntervalScheduler
  >();
  private hasBandwidthPriority = false;

  private mostRecentUpdateTimestamp: { [attendeeId: string]: number } = {};

  constructor(
    private realtimeController: RealtimeController,
    private selfAttendeeId: string,
    private hasBandwidthPriorityCallback: (hasBandwidthPriority: boolean) => void,
    private waitIntervalMs: number = 1000,
    private updateIntervalMs: number = 200
  ) {}

  private needUpdate(attendeeId: string): boolean {
    if (!this.activeSpeakers) {
      return true;
    }
    return (
      (this.speakerScores[attendeeId] === 0 && this.activeSpeakers.includes(attendeeId)) ||
      (this.speakerScores[attendeeId] > 0 && !this.activeSpeakers.includes(attendeeId))
    );
  }

  private updateActiveSpeakers(
    policy: ActiveSpeakerPolicy,
    callback: DetectorCallback,
    attendeeId: string
  ): void {
    if (!this.needUpdate(attendeeId)) {
      return;
    }
    const sortedSpeakers: { attendeeId: string; activeScore: number }[] = [];

    const attendeeIds = Object.keys(this.speakerScores);
    for (let i = 0; i < attendeeIds.length; i++) {
      const attendeeId = attendeeIds[i];
      sortedSpeakers.push({ attendeeId: attendeeId, activeScore: this.speakerScores[attendeeId] });
    }

    const sortedAttendeeIds = sortedSpeakers
      .sort((s1, s2) => s2.activeScore - s1.activeScore)
      .filter(function (s) {
        return s.activeScore > 0;
      })
      .map(function (s) {
        return s.attendeeId;
      });
    this.activeSpeakers = sortedAttendeeIds;
    callback(sortedAttendeeIds);
    const selfIsActive =
      sortedAttendeeIds.length > 0 && sortedAttendeeIds[0] === this.selfAttendeeId;
    const hasBandwidthPriority =
      selfIsActive && policy.prioritizeVideoSendBandwidthForActiveSpeaker();
    const hasBandwidthPriorityDidChange = this.hasBandwidthPriority !== hasBandwidthPriority;
    if (hasBandwidthPriorityDidChange) {
      this.hasBandwidthPriority = hasBandwidthPriority;
      this.hasBandwidthPriorityCallback(hasBandwidthPriority);
    }
  }

  private updateScore(
    policy: ActiveSpeakerPolicy,
    callback: DetectorCallback,
    attendeeId: string,
    volume: number | null,
    muted: boolean | null
  ): void {
    const activeScore = policy.calculateScore(attendeeId, volume, muted);
    if (this.speakerScores[attendeeId] !== activeScore) {
      this.speakerScores[attendeeId] = activeScore;
      this.mostRecentUpdateTimestamp[attendeeId] = Date.now();
      this.updateActiveSpeakers(policy, callback, attendeeId);
    }
  }

  subscribe(
    policy: ActiveSpeakerPolicy,
    callback: DetectorCallback,
    scoresCallback?: (scores: { [attendeeId: string]: number }) => void,
    scoresCallbackIntervalMs?: number
  ): void {
    const handler = (attendeeId: string, present: boolean): void => {
      if (!present) {
        this.speakerScores[attendeeId] = 0;
        this.mostRecentUpdateTimestamp[attendeeId] = Date.now();
        this.updateActiveSpeakers(policy, callback, attendeeId);
        return;
      }
      this.realtimeController.realtimeSubscribeToVolumeIndicator(
        attendeeId,
        (
          attendeeId: string,
          volume: number | null,
          muted: boolean | null,
          _signalStrength: number | null
        ) => {
          this.mostRecentUpdateTimestamp[attendeeId] = Date.now();
          if (muted !== null) {
            this.speakerMuteState[attendeeId] = muted;
          }
          this.updateScore(policy, callback, attendeeId, volume, muted);
        }
      );
    };
    this.detectorCallbackToHandler.set(callback, handler);

    const activityTimer = new IntervalScheduler(this.updateIntervalMs);
    activityTimer.start(() => {
      for (const attendeeId in this.speakerScores) {
        if (Date.now() - this.mostRecentUpdateTimestamp[attendeeId] > this.waitIntervalMs) {
          this.updateScore(policy, callback, attendeeId, 0, this.speakerMuteState[attendeeId]);
        }
      }
    });
    this.detectorCallbackToActivityTimer.set(callback, activityTimer);

    if (scoresCallback && scoresCallbackIntervalMs) {
      const scoresTimer = new IntervalScheduler(scoresCallbackIntervalMs);
      scoresTimer.start(() => {
        scoresCallback(this.speakerScores);
      });
      this.detectorCallbackToScoresTimer.set(callback, scoresTimer);
    }
    this.realtimeController.realtimeSubscribeToAttendeeIdPresence(handler);
  }

  unsubscribe(callback: DetectorCallback): void {
    const handler = this.detectorCallbackToHandler.get(callback);
    this.detectorCallbackToHandler.delete(callback);
    if (handler) {
      this.realtimeController.realtimeUnsubscribeToAttendeeIdPresence(handler);
    }

    const activityTimer = this.detectorCallbackToActivityTimer.get(callback);
    if (activityTimer) {
      activityTimer.stop();
      this.detectorCallbackToActivityTimer.delete(callback);
    }

    const scoresTimer = this.detectorCallbackToScoresTimer.get(callback);
    if (scoresTimer) {
      scoresTimer.stop();
      this.detectorCallbackToHandler.delete(callback);
    }
  }
}
