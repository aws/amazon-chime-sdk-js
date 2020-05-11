// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ActiveSpeakerPolicy from './ActiveSpeakerPolicy';

export default class DefaultActiveSpeakerPolicy implements ActiveSpeakerPolicy {
  private volumes: { [attendeeId: string]: number } = {};

  constructor(
    private speakerWeight: number = 0.9,
    private cutoffThreshold: number = 0.01,
    private silenceThreshold = 0.2,
    private takeoverRate = 0.2
  ) {}

  calculateScore(attendeeId: string, volume: number | null, muted: boolean | null): number {
    if (muted || volume === null) {
      volume = 0;
    }
    if (!this.volumes.hasOwnProperty(attendeeId)) {
      this.volumes[attendeeId] = 0;
    }
    if (volume > this.silenceThreshold) {
      volume = 1.0;
    } else {
      volume = 0.0;
    }
    let score = this.volumes[attendeeId] * this.speakerWeight + volume * (1 - this.speakerWeight);
    this.volumes[attendeeId] = score;
    for (const otherAttendeeId in this.volumes) {
      if (otherAttendeeId !== attendeeId) {
        this.volumes[otherAttendeeId] = Math.max(
          this.volumes[otherAttendeeId] - this.takeoverRate * volume,
          0
        );
      }
    }
    if (score < this.cutoffThreshold) {
      return 0;
    }
    return score;
  }

  prioritizeVideoSendBandwidthForActiveSpeaker(): boolean {
    return true;
  }
}
