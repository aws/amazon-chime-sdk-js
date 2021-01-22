// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
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
      if (!this.context.turnCredentials) {
        this.context.peer.removeEventListener(
          'icegatheringstatechange',
          this.context.iceGatheringStateEventHandler
        );
      }
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
    if (this.context.browserBehavior.requiresCheckForSdpConnectionAttributes()) {
      if (new DefaultSDP(this.context.peer.localDescription.sdp).hasCandidatesForAllMLines()) {
        this.context.logger.info(
          `ice gathering already complete; bypass gathering, current local description ${this.context.peer.localDescription.sdp}`
        );
        return;
      }
    } else {
      this.context.logger.info(
        `iOS device does not require checking for connection attributes in SDP, current local description ${this.context.peer.localDescription.sdp}`
      );
    }

    /*
     * To bypass waiting for events, it is required that "icegatheringstate" to be complete and sdp to have candidate
     * For Firefox, it takes long for iceGatheringState === 'complete'
     * Ref: https://github.com/aws/amazon-chime-sdk-js/issues/609
     */
    if (
      (this.context.browserBehavior.hasFirefoxWebRTC() ||
        this.context.peer.iceGatheringState === 'complete') &&
      new DefaultSDP(this.context.peer.localDescription.sdp).hasCandidates()
    ) {
      this.context.logger.info(
        'ice gathering state is complete and candidates are in SDP; bypass gathering'
      );
      return;
    }
    try {
      await new Promise<void>((resolve, reject) => {
        this.cancelPromise = (error: Error) => {
          this.removeEventListener();
          reject(error);
        };

        if (!this.context.turnCredentials) {
          // if one day, we found a case where a FinishGatheringICECandidate did not resolve but ice gathering state is complete and SDP answer has ice candidates
          // we may need to enable this
          this.context.iceGatheringStateEventHandler = () => {
            if (this.context.peer.iceGatheringState === 'complete') {
              this.removeEventListener();
              resolve();
              return;
            }
          };
          this.context.peer.addEventListener(
            'icegatheringstatechange',
            this.context.iceGatheringStateEventHandler
          );
        }

        this.context.iceCandidateHandler = (event: RTCPeerConnectionIceEvent) => {
          this.context.logger.info(
            `ice candidate: ${event.candidate ? event.candidate.candidate : '(null)'} state: ${
              this.context.peer.iceGatheringState
            }`
          );
          // Ice candidate arrives, do not need to wait anymore.
          // https://webrtcglossary.com/trickle-ice/
          if (event.candidate) {
            if (DefaultSDP.isRTPCandidate(event.candidate.candidate)) {
              this.context.iceCandidates.push(event.candidate);
            }

            // Could there be a case the candidate is not written to SDP ?
            if (this.context.turnCredentials && this.context.iceCandidates.length >= 1) {
              this.context.logger.info('gathered at least one relay candidate');
              this.removeEventListener();
              resolve();
              return;
            }
          }

          // Ice candidate gathering is complete, additional barrier to make sure sdp contain an ice candidate.
          // TODO: Could there be a race where iceGatheringState is flipped after this task is run ? This could only be handled if ice state is monitored persistently.
          if (this.context.peer.iceGatheringState === 'complete') {
            this.context.logger.info('done gathering ice candidates');
            this.removeEventListener();
            if (
              !new DefaultSDP(this.context.peer.localDescription.sdp).hasCandidates() ||
              this.context.iceCandidates.length === 0
            ) {
              reject(new Error('no ice candidates were gathered'));
            } else {
              resolve();
            }
          }
        };
        // SDK does not catch candidate itself and send to sever. Rather, WebRTC handles candidate events and writes candidate to SDP.
        this.context.peer.addEventListener('icecandidate', this.context.iceCandidateHandler);
        this.startTimestampMs = Date.now();
      });
    } catch (error) {
      throw error;
    } finally {
      /* istanbul ignore else */
      if (this.startTimestampMs) {
        this.context.iceGatheringDurationMs = Math.round(Date.now() - this.startTimestampMs);
      }
    }
  }
}
