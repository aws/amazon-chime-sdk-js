// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioProfile from '../audioprofile/AudioProfile';
import FullJitterBackoff from '../backoff/FullJitterBackoff';
import NoOpDebugLogger from '../logger/NoOpDebugLogger';
import NoOpMediaStreamBroker from '../mediastreambroker/NoOpMediaStreamBroker';
import MeetingSessionConfiguration from '../meetingsession/MeetingSessionConfiguration';
import MeetingSessionCredentials from '../meetingsession/MeetingSessionCredentials';
import MeetingSessionURLs from '../meetingsession/MeetingSessionURLs';
import DefaultReconnectController from '../reconnectcontroller/DefaultReconnectController';
import DefaultWebSocketAdapter from '../websocketadapter/DefaultWebSocketAdapter';
import DefaultAudioVideoController from './DefaultAudioVideoController';

export default class NoOpAudioVideoController extends DefaultAudioVideoController {
  constructor(configuration?: MeetingSessionConfiguration) {
    const emptyConfiguration = new MeetingSessionConfiguration();
    emptyConfiguration.meetingId = '';
    emptyConfiguration.externalMeetingId = '';
    emptyConfiguration.credentials = new MeetingSessionCredentials();
    emptyConfiguration.credentials.attendeeId = '';
    emptyConfiguration.credentials.joinToken = '';
    emptyConfiguration.urls = new MeetingSessionURLs();
    emptyConfiguration.urls.turnControlURL = '';
    emptyConfiguration.urls.audioHostURL = '';
    emptyConfiguration.urls.screenViewingURL = '';
    emptyConfiguration.urls.screenDataURL = '';
    emptyConfiguration.urls.screenSharingURL = 'wss://localhost/';
    emptyConfiguration.urls.signalingURL = 'wss://localhost/';
    super(
      configuration ? configuration : emptyConfiguration,
      new NoOpDebugLogger(),
      new DefaultWebSocketAdapter(new NoOpDebugLogger()),
      new NoOpMediaStreamBroker(),
      new DefaultReconnectController(0, new FullJitterBackoff(0, 0, 0))
    );
  }

  setAudioProfile(_audioProfile: AudioProfile): void {}

  start(): void {}

  stop(): void {}
}
