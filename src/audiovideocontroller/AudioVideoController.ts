// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ActiveSpeakerDetector from '../activespeakerdetector/ActiveSpeakerDetector';
import AudioMixController from '../audiomixcontroller/AudioMixController';
import AudioVideoControllerFacade from '../audiovideocontroller/AudioVideoControllerFacade';
import AudioVideoObserver from '../audiovideoobserver/AudioVideoObserver';
import EventController from '../eventcontroller/EventController';
import Logger from '../logger/Logger';
import MediaStreamBroker from '../mediastreambroker/MediaStreamBroker';
import MeetingSessionConfiguration from '../meetingsession/MeetingSessionConfiguration';
import MeetingSessionStatus from '../meetingsession/MeetingSessionStatus';
import RealtimeController from '../realtimecontroller/RealtimeController';
import VideoTileController from '../videotilecontroller/VideoTileController';

/**
 * [[AudioVideoController]] manages the signaling and peer connections.
 */
export default interface AudioVideoController extends AudioVideoControllerFacade {
  /**
   * Iterates through each observer, so that their notification functions may
   * be called.
   */
  forEachObserver(observerFunc: (observer: AudioVideoObserver) => void): void;

  /**
   * Updates the peer connection when video tiles have changed.
   */
  update(): boolean;

  /**
   * Restarts the local video device. The callback is called when the device
   * has been restarted.
   */
  restartLocalVideo(callback: () => void): void;

  /**
   * Replaces the local video device without a WebRTC negotiation on the sender side and
   * avoids that all video subscribers to re-negotiate at the same time.
   * This is an optimized way of replacing video stream and requires `WebRTC Unified Plan`.
   * See {@link MeetingSessionConfiguration.enableUnifiedPlanForChromiumBasedBrowsers} and
   * {@link BrowserBehavior.requiresUnifiedPlan}.
   */
  replaceLocalVideo?(callback: () => void): Promise<void>;

  /**
   * Restarts the local audio. This function assumes the peer connection is established and an active
   * audio stream must be chosen in [[DeviceController]]
   */
  restartLocalAudio(callback: () => void): Promise<void>;

  /**
   * Restarts the peer connection and/or the session.
   */
  reconnect(status: MeetingSessionStatus, error: Error | null): boolean;

  /**
   * Handles the meeting session status and returns true if it will restart the session.
   */
  handleMeetingSessionStatus(status: MeetingSessionStatus, error: Error | null): boolean;

  /**
   * Sets the max bandwidth for video publishing
   */
  setVideoMaxBandwidthKbps(maxBandwidthKbps: number): void;

  /**
   * Pauses receiving stream on peer connection by streamId
   */
  pauseReceivingStream(streamId: number): void;

  /**
   * Resumes receiving stream on peer connection by streamId
   */
  resumeReceivingStream(streamId: number): void;

  /**
   * Returns the session configuration for this audio-video controller.
   */
  readonly configuration: MeetingSessionConfiguration;

  /**
   * Returns the [[RealtimeController]] for this audio-video controller.
   */
  readonly realtimeController: RealtimeController;

  /**
   * Returns the [[ActiveSpeakerDetector]] for this audio-video controller.
   */
  readonly activeSpeakerDetector: ActiveSpeakerDetector;

  /**
   * Returns the [[VideoTileController]] for this audio-video controller.
   */
  readonly videoTileController: VideoTileController;

  /**
   * Returns the [[Logger]] for this audio-video controller.
   */
  readonly logger: Logger;

  /**
   * Returns the RTCPeerConnection for this audio-video controller if there is
   * one.
   */
  readonly rtcPeerConnection: RTCPeerConnection | null;

  /**
   * Returns the [[MediaStreamBroker]] for this audio-video controller.
   */
  readonly mediaStreamBroker: MediaStreamBroker;

  /**
   * Returns the [[AudioMixController]] for this audio-video controller.
   */
  readonly audioMixController: AudioMixController;

  /**
   * Returns the [[EventController]] for this audio-video controller.
   */
  readonly eventController?: EventController;
}
