// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import AudioProfile from '../../src/audioprofile/AudioProfile';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import MeetingSessionConfiguration from '../../src/meetingsession/MeetingSessionConfiguration';
import MeetingSessionCredentials from '../../src/meetingsession/MeetingSessionCredentials';

describe('NoOpAudioVideoController', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  it('can be constructed', () => {
    expect(new NoOpAudioVideoController()).to.exist;
  });

  it('can be constructed with a configuration', () => {
    const meetingId = 'meeting-id';
    const configuration = new MeetingSessionConfiguration();
    configuration.meetingId = meetingId;
    configuration.credentials = new MeetingSessionCredentials();
    configuration.credentials.attendeeId = 'attendee-id';
    const audioVideoController = new NoOpAudioVideoController(configuration);
    expect(audioVideoController.configuration.meetingId).to.equal(meetingId);
  });

  it('can call setAudioProfile', () => {
    const audioProfile = AudioProfile.fullbandSpeechMono();
    new NoOpAudioVideoController().setAudioProfile(audioProfile);
  });
});
