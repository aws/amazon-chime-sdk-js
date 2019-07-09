// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import MeetingSessionStatusCode from '../meetingsession/MeetingSessionStatusCode';
import DefaultSDP from '../sdp/DefaultSDP';
import BaseTask from './BaseTask';

/*
 * [[FinishGatheringICECandidatesTask]] add ice-candidate event handler on peer connection to
 * collect ice candidates and wait for peer connection ice gathering state to complete
 */
export default class FinishGatheringICECandidatesTask extends BaseTask {
  protected taskName = 'FinishGatheringICECandidatesTask';

  private static CHROME_VPN_TIMEOUT_MS = 5000;

  private startTimestampMs: number;
  private cancelPromise: (error: Error) => void;

  constructor(
    private context: AudioVideoControllerState,
    private chromeVpnTimeoutMs: number = FinishGatheringICECandidatesTask.CHROME_VPN_TIMEOUT_MS
  ) {
    super(context.logger);
  }

  private removeEventListener(): void {
    if (this.context.peer) {
      this.context.peer.removeEventListener('icecandidate', this.context.iceCandidateHandler);
    }
  }

  cancel(): void {
    let error = new Error(`canceling ${this.name()}`);

    // TODO: Remove when the Chrome VPN reconnect bug is fixed.
    // In Chrome, SDK may fail to establish TURN session after VPN reconnect.
    // https://bugs.chromium.org/p/webrtc/issues/detail?id=9097
    if (this.context.browserBehavior.requiresIceCandidateGatheringTimeoutWorkaround()) {
      if (this.chromeVpnTimeoutMs < this.context.meetingSessionConfiguration.connectionTimeoutMs) {
        const duration = Date.now() - this.startTimestampMs;
        if (duration > this.chromeVpnTimeoutMs) {
          error = new Error(
            `canceling ${this.name()} due to the meeting status code: ${
              MeetingSessionStatusCode.ICEGatheringTimeoutWorkaround
            }`
          );
        }
      }
    }

    this.cancelPromise && this.cancelPromise(error);
  }

  async run(): Promise<void> {
    if (!this.context.peer) {
      this.logAndThrow(`session does not have peer connection; bypass ice gathering`);
    }

    if (new DefaultSDP(this.context.peer.localDescription.sdp).hasCandidatesForAllMLines()) {
      this.context.logger.info('ice gathering already complete; bypass gathering');
      return;
    }

    // On video recvonly cases, Safari unified plan has multiple
    // m=video section connection line of IP 0.0.0.0 which fails previous check
    // We observe this task time out when there are more than 4 video attendees
    // The timeout is observed on a duplicate negotiation, which is tracked in #240.
    // FinishGatheringICECandidatesTask is just a "wait" on "at least one ice candidate"
    // or "complete" icegatheringstate before we can establish connection.
    // The "gathering" is completely handled by browsers
    // TODO: clean up the logic after addressing #240. And deeper investigation on Unified Plan
    if (
      this.context.browserBehavior.requiresIceCandidateCompletionBypass() &&
      this.context.peer.iceGatheringState === 'complete'
    ) {
      this.context.logger.info('safari ice gathering state is complete; bypass gathering');
      return;
    }

    await new Promise<void>((resolve, reject) => {
      this.cancelPromise = (error: Error) => {
        this.removeEventListener();
        reject(error);
      };

      this.context.iceCandidateHandler = (event: RTCPeerConnectionIceEvent) => {
        this.context.logger.info(
          `ice candidate: ${event.candidate ? event.candidate.candidate : '(null)'} state: ${
            this.context.peer.iceGatheringState
          }`
        );

        if (event.candidate) {
          if (DefaultSDP.isRTPCandidate(event.candidate.candidate)) {
            this.context.iceCandidates.push(event.candidate);
          }
          if (this.context.turnCredentials && this.context.iceCandidates.length >= 1) {
            this.context.logger.info('gathered at least one relay candidate');
            this.removeEventListener();
            resolve();
            return;
          }
        }

        // TODO: re-evaluate ice negotiation task
        if (this.context.peer.iceGatheringState === 'complete') {
          // if (this.context.peer.iceGatheringState === 'complete') {
          this.context.logger.info('done gathering ice candidates');
          this.removeEventListener();
          if (this.context.iceCandidates.length === 0) {
            reject(new Error('no ice candidates were gathered'));
          } else {
            resolve();
          }
        }
      };

      // TODO: register listener before SetLocalDescription to avoid race
      this.context.peer.addEventListener('icecandidate', this.context.iceCandidateHandler);
      this.startTimestampMs = Date.now();
    });
  }
}
