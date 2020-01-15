// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ActiveSpeakerDetector from '../activespeakerdetector/ActiveSpeakerDetector';
import AudioMixController from '../audiomixcontroller/AudioMixController';
import AudioVideoControllerFacade from '../audiovideocontroller/AudioVideoControllerFacade';
import AudioVideoFacade from '../audiovideofacade/AudioVideoFacade';
import AudioVideoObserver from '../audiovideoobserver/AudioVideoObserver';
import DeviceController from '../devicecontroller/DeviceController';
import Logger from '../logger/Logger';
import MediaStreamBroker from '../mediastreambroker/MediaStreamBroker';
import MeetingSessionConfiguration from '../meetingsession/MeetingSessionConfiguration';
import MeetingSessionStatus from '../meetingsession/MeetingSessionStatus';
import RealtimeController from '../realtimecontroller/RealtimeController';
import VideoSubscribeContext from '../videosubscribecontext/VideoSubscribeContext';
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
  update(videoSubscribeContext: VideoSubscribeContext): boolean;

  /**
   * Restarts the local video device. The callback is called when the device
   * has been restarted.
   */
  restartLocalVideo(callback: () => void): void;

  /**
   * Restarts the local audio. This function assumes the peer connection is established and an active
   * audio stream must be chosen in [[DeviceController]]
   */
  restartLocalAudio(callback: () => void): Promise<void>;

  /**
   * Restarts the peer connection and/or the session.
   */
  reconnect(status: MeetingSessionStatus): boolean;

  /**
   * Handles the meeting session status and returns true if it will restart the session.
   */
  handleMeetingSessionStatus(status: MeetingSessionStatus): boolean;

  /**
   * Sets the max bandwidth for video publishing
   */
  setVideoMaxBandwidthKbps(maxBandwidthKbps: number): void;

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
   * Returns the [[AudioVideoFacade]] for this audio-video controller.
   */
  readonly facade: AudioVideoFacade;

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
   * Returns the [[DeviceController]] for this audio-video controller.
   */
  readonly deviceController: DeviceController;

  /**
   * Returns the [[MediaStreamBroker]] for this audio-video controller.
   */
  readonly mediaStreamBroker: MediaStreamBroker;

  /**
   * Returns the [[AudioMixController]] for this audio-video controller.
   */
  readonly audioMixController: AudioMixController;
}
