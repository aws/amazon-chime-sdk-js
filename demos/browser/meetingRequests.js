// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// Shared by api-server.js and handlers.js (deploy.js copies this file into the Lambda package).

const MEETING_ID_FORMAT = /^[a-fA-F0-9]{8}(?:-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}$/;
const CAPABILITIES = new Set(['SendReceive', 'Send', 'Receive', 'None']);

const TRANSCRIBE_STREAM_PARAMS = [
  ['contentIdentificationType', 'ContentIdentificationType'],
  ['contentRedactionType', 'ContentRedactionType'],
  ['enablePartialResultsStability', 'EnablePartialResultsStabilization'],
  ['partialResultsStability', 'PartialResultsStability'],
  ['piiEntityTypes', 'PiiEntityTypes'],
  ['languageModelName', 'LanguageModelName'],
  ['identifyLanguage', 'IdentifyLanguage'],
  ['languageOptions', 'LanguageOptions'],
  ['preferredLanguage', 'PreferredLanguage'],
  ['vocabularyNames', 'VocabularyNames'],
  ['vocabularyFilterNames', 'VocabularyFilterNames'],
];

// Each server answers it with a 400 carrying the message.
class BadRequestError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BadRequestError';
  }
}

function createMeetingRequest(query, primaryMeeting, clientRequestToken) {
  const request = {
    ClientRequestToken: clientRequestToken,
    MediaRegion: query.region,
    ExternalMeetingId: query.title.substring(0, 64),
  };
  if (primaryMeeting !== undefined) {
    request.PrimaryMeetingId = primaryMeeting.Meeting.MeetingId;
  }
  const features = {};
  if (query.ns_es === 'true') {
    features.Audio = { EchoReduction: 'AVAILABLE' };
  }
  if (query.v_rs === 'FHD' || query.v_rs === 'None') {
    features.Video = { MaxResolution: query.v_rs };
  }
  if (query.c_rs === 'UHD' || query.c_rs === 'None') {
    features.Content = { MaxResolution: query.c_rs };
  }
  const maxAttendees = Number(query.a_cnt);
  if (Number.isInteger(maxAttendees) && maxAttendees > 1 && maxAttendees <= 250) {
    features.Attendee = { MaxCount: maxAttendees };
  }
  if (Object.keys(features).length > 0) {
    request.MeetingFeatures = features;
  }
  return request;
}

function transcriptionConfiguration(query) {
  let params = {};
  if (query.transcriptionStreamParams) {
    try {
      params = JSON.parse(query.transcriptionStreamParams);
    } catch {
      throw new BadRequestError('transcriptionStreamParams is not valid JSON');
    }
  }
  if (query.engine === 'transcribe') {
    const settings = {};
    if (query.language) {
      settings.LanguageCode = query.language;
    }
    if (query.region) {
      settings.Region = query.region;
    }
    for (const [param, field] of TRANSCRIBE_STREAM_PARAMS) {
      if (params.hasOwnProperty(param)) {
        settings[field] = params[param];
      }
    }
    return { EngineTranscribeSettings: settings };
  }
  if (query.engine === 'transcribe_medical') {
    const settings = {
      LanguageCode: query.language,
      Specialty: 'PRIMARYCARE',
      Type: 'CONVERSATION',
    };
    if (query.region) {
      settings.Region = query.region;
    }
    if (params.hasOwnProperty('contentIdentificationType')) {
      settings.ContentIdentificationType = params.contentIdentificationType;
    }
    return { EngineTranscribeMedicalSettings: settings };
  }
  return undefined;
}

function requireCapabilities(query) {
  const capabilities = {
    Audio: query.audioCapability,
    Video: query.videoCapability,
    Content: query.contentCapability,
  };
  for (const value of Object.values(capabilities)) {
    if (!CAPABILITIES.has(value)) {
      throw new BadRequestError(`Invalid capability: ${value}`);
    }
  }
  return capabilities;
}

// CreateAttendee rejects capabilities the meeting features rule out; no video also means no content.
function attendeeCapabilities(query, meetingFeatures) {
  const capabilities = requireCapabilities(query);
  if (meetingFeatures?.Video?.MaxResolution === 'None') {
    capabilities.Video = 'None';
    capabilities.Content = 'None';
  }
  if (meetingFeatures?.Content?.MaxResolution === 'None') {
    capabilities.Content = 'None';
  }
  return capabilities;
}

function liveConnectorRequest(accountId, meetingId, rtmpUrl) {
  return {
    Sinks: [
      {
        RTMPConfiguration: {
          AudioChannels: 'Stereo',
          AudioSampleRate: '48000',
          Url: rtmpUrl,
        },
        SinkType: 'RTMP',
      },
    ],
    Sources: [
      {
        ChimeSdkMeetingLiveConnectorConfiguration: {
          Arn: `arn:aws:chime::${accountId}:meeting:${meetingId}`,
          CompositedVideo: {
            GridViewConfiguration: {
              ContentShareLayout: 'Vertical',
            },
            Layout: 'GridView',
            Resolution: 'FHD',
          },
          MuxType: 'AudioWithCompositedVideo',
        },
        SourceType: 'ChimeSdkMeeting',
      },
    ],
  };
}

module.exports = {
  MEETING_ID_FORMAT,
  BadRequestError,
  createMeetingRequest,
  transcriptionConfiguration,
  requireCapabilities,
  attendeeCapabilities,
  liveConnectorRequest,
};
