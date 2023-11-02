// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const { ChimeSDKMediaPipelines } = require('@aws-sdk/client-chime-sdk-media-pipelines');
const { ChimeSDKMeetings } = require('@aws-sdk/client-chime-sdk-meetings');
const { CloudWatchLogs } = require('@aws-sdk/client-cloudwatch-logs');
const { DynamoDB } = require('@aws-sdk/client-dynamodb');
const { Ivs } = require('@aws-sdk/client-ivs');

const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { metricScope } = require('aws-embedded-metrics');

// Store meetings in a DynamoDB table so attendees can join by meeting title
const ddb = new DynamoDB();

const currentRegion = process.env.REGION;
const chimeSDKMeetingsEndpoint = process.env.CHIME_SDK_MEETINGS_ENDPOINT;
const mediaPipelinesControlRegion = process.env.MEDIA_PIPELINES_CONTROL_REGION;
const chimeSDKMediaPipelinesEndpoint = process.env.CHIME_SDK_MEDIA_PIPELINES_ENDPOINT;

const ivs = new Ivs({
  // The key apiVersion is no longer supported in v3, and can be removed.
  // @deprecated The client uses the "latest" apiVersion.
  apiVersion: '2020-07-14',
});

const chimeSDKMeetings = new ChimeSDKMeetings({
  region: currentRegion,
});
if (chimeSDKMeetingsEndpoint) {
  chimeSDKMeetings.endpoint = chimeSDKMeetingsEndpoint;
}

// Create an AWS SDK Media Pipelines object.
const chimeSdkMediaPipelines = new ChimeSDKMediaPipelines({
  region: mediaPipelinesControlRegion,
});
chimeSdkMediaPipelines.endpoint = chimeSDKMediaPipelinesEndpoint;

// Read resource names from the environment
const {
  MEETINGS_TABLE_NAME,
  BROWSER_LOG_GROUP_NAME,
  BROWSER_MEETING_EVENT_LOG_GROUP_NAME,
  SQS_QUEUE_ARN,
  USE_EVENT_BRIDGE,
  BROWSER_EVENT_INGESTION_LOG_GROUP_NAME,
  CAPTURE_S3_DESTINATION_PREFIX,
  AWS_ACCOUNT_ID,
} = process.env;

// === Handlers ===

exports.index = async (event, context, callback) => {
  // Return the contents of the index page
  return response(200, 'text/html', fs.readFileSync('./index.html', { encoding: 'utf8' }));
};

exports.join = async (event, context) => {
  const meetingIdFormat = /^[a-fA-F0-9]{8}(?:-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}$/
  const query = event.queryStringParameters;
  if (!query.title || !query.name) {
    return response(400, 'application/json', JSON.stringify({ error: 'Need parameters: title, name' }));
  }

  // Look up the meeting by its title
  let meeting = await getMeeting(query.title);

  let primaryMeeting = undefined
  if (query.primaryExternalMeetingId) {
    primaryMeeting = await getMeeting(query.primaryExternalMeetingId)
    if (primaryMeeting) {
      console.info(`Retrieved primary meeting ID ${primaryMeeting.Meeting.MeetingId} for external meeting ID ${query.primaryExternalMeetingId}`)
    } else if (meetingIdFormat.test(query.primaryExternalMeetingId)) {
      // Just in case, check if we were passed a regular meeting ID instead of an external ID
      try {
        primaryMeeting = await chimeSDKMeetings.getMeeting({
          MeetingId: query.primaryExternalMeetingId
        });
        if (primaryMeeting !== undefined) {
          console.info(`Retrieved primary meeting id ${primaryMeeting.Meeting.MeetingId}`);
          await putMeeting(query.primaryExternalMeetingId, primaryMeeting);
        }
      } catch (error) {
        console.info("Meeting ID doesnt' exist as a conference ID: " + error);
      }
    }
    if (!primaryMeeting) {
      return response(400, 'application/json', JSON.stringify({ error: 'Primary meeting has not been created' }));
    }
  }

  if (!meeting) {
    if (!query.region) {
      return response(400, 'application/json', JSON.stringify({ error: 'Need region parameter set if meeting has not yet been created' }));
    }
    // If the meeting does not exist, check if we were passed in a meeting ID instead of an external meeting ID.  If so, use that one
    try {
      if (meetingIdFormat.test(query.title)) {
        meeting = await chimeSDKMeetings.getMeeting({
          MeetingId: query.title
        });
      }
    } catch (error) {
      console.info("Meeting ID doesn't exist as a conference ID: " + error);
    }

    // If still no meeting, create one
    if (!meeting) {
      let request = {
        // Use a UUID for the client request token to ensure that any request retries
        // do not create multiple meetings.
        ClientRequestToken: uuidv4(),

        // Specify the media region (where the meeting is hosted).
        // In this case, we use the region selected by the user.
        MediaRegion: query.region,

        // Set up SQS notifications if being used
        NotificationsConfiguration: USE_EVENT_BRIDGE === 'false' ? { SqsQueueArn: SQS_QUEUE_ARN } : {},

        // Any meeting ID you wish to associate with the meeting.
        // For simplicity here, we use the meeting title.
        ExternalMeetingId: query.title.substring(0, 64),
      };
      if (primaryMeeting !== undefined) {
        request.PrimaryMeetingId = primaryMeeting.Meeting.MeetingId;
      }
      if (query.ns_es === 'true') {
        request.MeetingFeatures = {
          Audio: {
            // The EchoReduction parameter helps the user enable and use Amazon Echo Reduction.
            EchoReduction: 'AVAILABLE'
          }
        };
      }
      console.info('Creating new meeting: ' + JSON.stringify(request));
      meeting = await chimeSDKMeetings.createMeeting(request);

      // Extend meeting with primary external meeting ID if it exists
      if (primaryMeeting !== undefined) {
        meeting.Meeting.PrimaryExternalMeetingId = primaryMeeting.Meeting.ExternalMeetingId;
      }
    }

    // Store the meeting in the table using the meeting title as the key.
    await putMeeting(query.title, meeting);
  }

  // Create new attendee for the meeting
  console.info('Adding new attendee');
  const createAttendeeRequest = {
    // The meeting ID of the created meeting to add the attendee to
    MeetingId: meeting.Meeting.MeetingId,

    // Any user ID you wish to associate with the attendeee.
    // For simplicity here, we use a random UUID for uniqueness
    // combined with the name the user provided, which can later
    // be used to help build the roster.
    ExternalUserId: `${uuidv4().substring(0, 8)}#${query.name}`.substring(0, 64),
  };

  if (query.attendeeAudioCapability && !query.primaryExternalMeetingId) {
    createAttendeeRequest['Capabilities'] = {
      Audio : query.attendeeAudioCapability,
      Video : query.attendeeVideoCapability,
      Content: query.attendeeContentCapability,
    };
  }

  const attendee = (await chimeSDKMeetings.createAttendee(createAttendeeRequest));

  // Return the meeting and attendee responses. The client will use these
  // to join the meeting.
  let joinResponse = {
    JoinInfo: {
      Meeting: meeting,
      Attendee: attendee,
    },
  }
  if (meeting.Meeting.PrimaryExternalMeetingId !== undefined) {
    // Put this where it expects it, since it is not technically part of create meeting response
    joinResponse.JoinInfo.PrimaryExternalMeetingId = meeting.Meeting.PrimaryExternalMeetingId;
  }
  return response(200, 'application/json', JSON.stringify(joinResponse, null, 2));
};

exports.end = async (event, context) => {
  // Fetch the meeting by title
  const meeting = await getMeeting(event.queryStringParameters.title);

  // End the meeting. All attendee connections will hang up.
  await chimeSDKMeetings.deleteMeeting({ MeetingId: meeting.Meeting.MeetingId });
  return response(200, 'application/json', JSON.stringify({}));
};

// We currently don't store external users, so we rely on directly getting
// passed the Chime Attendee ID
exports.deleteAttendee = async (event, context) => {
  // Fetch the meeting by title
  const meeting = await getMeeting(event.queryStringParameters.title);

  // End the meeting. All attendee connections will hang up.
  await chimeSDKMeetings.deleteAttendee({
    MeetingId: meeting.Meeting.MeetingId,
    AttendeeId: event.queryStringParameters.attendeeId,
  });

  return response(200, 'application/json', JSON.stringify({}));
};

exports.get_attendee = async (event) => {
  const query = event.queryStringParameters;
  if (!query.title || !query.id) {
    return response(400, 'application/json', JSON.stringify({ error: 'Need parameters: title, id' }));
  }
  const meeting = await getMeeting(query.title);
  const attendeeResponse = await chimeSDKMeetings
    .getAttendee({
      MeetingId: meeting.Meeting.MeetingId,
      AttendeeId: query.id,
    });
  return response(200, 'application/json', JSON.stringify(attendeeResponse, null, 2));
};

exports.update_attendee_capabilities = async (event) => {
  const query = event.queryStringParameters;
  if (
    !query.title ||
    !query.attendeeId ||
    !query.audioCapability ||
    !query.videoCapability ||
    !query.contentCapability
  ) {
    return response(
      400,
      'application/json',
      JSON.stringify({
        error: 'Need parameters: title, attendeeId, audioCapability, videoCapability, contentCapability',
      })
    );
  }
  const meeting = await getMeeting(query.title);
  const attendeeCapsResponse = await chimeSDKMeetings
    .updateAttendeeCapabilities({
      MeetingId: meeting.Meeting.MeetingId,
      AttendeeId: query.attendeeId,
      Capabilities: {
        Audio: query.audioCapability,
        Video: query.videoCapability,
        Content: query.contentCapability,
      },
    });
  return response(200, 'application/json', JSON.stringify(attendeeCapsResponse));
};

exports.batch_update_attendee_capabilities_except = async (event) => {
  const query = event.queryStringParameters;
  if (
    !query.title ||
    !query.attendeeIds ||
    !query.audioCapability ||
    !query.videoCapability ||
    !query.contentCapability
  ) {
    return response(
      400,
      'application/json',
      JSON.stringify({
        error: 'Need parameters: title, attendeeIds, audioCapability, videoCapability, contentCapability',
      })
    );
  }
  const meeting = await getMeeting(query.title);
  const attendeeCapsExceptResponse = await chimeSDKMeetings
    .batchUpdateAttendeeCapabilitiesExcept({
      MeetingId: meeting.Meeting.MeetingId,
      ExcludedAttendeeIds: query.attendeeIds.split(',').map((attendeeId) => {
        return { AttendeeId: attendeeId };
      }),
      Capabilities: {
        Audio: query.audioCapability,
        Video: query.videoCapability,
        Content: query.contentCapability,
      },
    });
  return response(200, 'application/json', JSON.stringify(attendeeCapsExceptResponse));
};

exports.start_transcription = async (event, context) => {
  // Fetch the meeting by title
  const meeting = await getMeeting(event.queryStringParameters.title);

  const languageCode = event.queryStringParameters.language;
  const region = event.queryStringParameters.region;
  let transcriptionConfiguration = {};
  let transcriptionStreamParams = {};
  if (event.queryStringParameters.transcriptionStreamParams) {
    transcriptionStreamParams = JSON.parse(event.queryStringParameters.transcriptionStreamParams);
  }
  if (event.queryStringParameters.engine === 'transcribe') {
    transcriptionConfiguration = {
      EngineTranscribeSettings: {
      }
    };
    if (languageCode) {
      transcriptionConfiguration.EngineTranscribeSettings.LanguageCode = languageCode;
    }
    if (region) {
      transcriptionConfiguration.EngineTranscribeSettings.Region = region;
    }
    if (transcriptionStreamParams.hasOwnProperty('contentIdentificationType')) {
      transcriptionConfiguration.EngineTranscribeSettings.ContentIdentificationType = transcriptionStreamParams.contentIdentificationType;
    }
    if (transcriptionStreamParams.hasOwnProperty('contentRedactionType')) {
      transcriptionConfiguration.EngineTranscribeSettings.ContentRedactionType = transcriptionStreamParams.contentRedactionType;
    }
    if (transcriptionStreamParams.hasOwnProperty('enablePartialResultsStability')) {
      transcriptionConfiguration.EngineTranscribeSettings.EnablePartialResultsStabilization = transcriptionStreamParams.enablePartialResultsStability;
    }
    if (transcriptionStreamParams.hasOwnProperty('partialResultsStability')) {
      transcriptionConfiguration.EngineTranscribeSettings.PartialResultsStability = transcriptionStreamParams.partialResultsStability;
    }
    if (transcriptionStreamParams.hasOwnProperty('piiEntityTypes')) {
      transcriptionConfiguration.EngineTranscribeSettings.PiiEntityTypes = transcriptionStreamParams.piiEntityTypes;
    }
    if (transcriptionStreamParams.hasOwnProperty('languageModelName')) {
      transcriptionConfiguration.EngineTranscribeSettings.LanguageModelName = transcriptionStreamParams.languageModelName;
    }
    if (transcriptionStreamParams.hasOwnProperty('identifyLanguage')) {
      transcriptionConfiguration.EngineTranscribeSettings.IdentifyLanguage = transcriptionStreamParams.identifyLanguage;
    }
    if (transcriptionStreamParams.hasOwnProperty('languageOptions')) {
      transcriptionConfiguration.EngineTranscribeSettings.LanguageOptions = transcriptionStreamParams.languageOptions;
    }
    if (transcriptionStreamParams.hasOwnProperty('preferredLanguage')) {
      transcriptionConfiguration.EngineTranscribeSettings.PreferredLanguage = transcriptionStreamParams.preferredLanguage;
    }
    if (transcriptionStreamParams.hasOwnProperty('vocabularyNames')) {
      transcriptionConfiguration.EngineTranscribeSettings.VocabularyNames = transcriptionStreamParams.vocabularyNames;
    }
    if (transcriptionStreamParams.hasOwnProperty('vocabularyFilterNames')) {
      transcriptionConfiguration.EngineTranscribeSettings.VocabularyFilterNames = transcriptionStreamParams.vocabularyFilterNames;
    }
  } else if (event.queryStringParameters.engine === 'transcribe_medical') {
    transcriptionConfiguration = {
      EngineTranscribeMedicalSettings: {
        LanguageCode: languageCode,
        Specialty: 'PRIMARYCARE',
        Type: 'CONVERSATION',
      }
    };
    if (region) {
      transcriptionConfiguration.EngineTranscribeMedicalSettings.Region = region;
    }
    if (transcriptionStreamParams.hasOwnProperty('contentIdentificationType')) {
      transcriptionConfiguration.EngineTranscribeMedicalSettings.ContentIdentificationType = transcriptionStreamParams.contentIdentificationType;
    }
  } else {
    return response(400, 'application/json', JSON.stringify({
      error: 'Unknown transcription engine'
    }));
  }

  // start transcription for the meeting
  await chimeSDKMeetings.startMeetingTranscription({
    MeetingId: meeting.Meeting.MeetingId,
    TranscriptionConfiguration: transcriptionConfiguration
  });
  return response(200, 'application/json', JSON.stringify({}));
};

exports.stop_transcription = async (event, context) => {
  // Fetch the meeting by title
  const meeting = await getMeeting(event.queryStringParameters.title);

  // stop transcription for the meeting
  await chimeSDKMeetings.stopMeetingTranscription({
    MeetingId: meeting.Meeting.MeetingId
  });
  return response(200, 'application/json', JSON.stringify({}));
};

exports.start_capture = async (event, context) => {
  // Fetch the meeting by title
  const meeting = await getMeeting(event.queryStringParameters.title);
  meetingRegion = meeting.Meeting.MediaRegion;

  let captureS3Destination = `arn:aws:s3:::${CAPTURE_S3_DESTINATION_PREFIX}-${meetingRegion}/${meeting.Meeting.MeetingId}/`
  const request = {
    SourceType: "ChimeSdkMeeting",
    SourceArn: `arn:aws:chime::${AWS_ACCOUNT_ID}:meeting:${meeting.Meeting.MeetingId}`,
    SinkType: "S3Bucket",
    SinkArn: captureS3Destination,
  };
  console.log("Creating new media capture pipeline: ", request)
  pipelineInfo = await chimeSdkMediaPipelines.createMediaCapturePipeline(request);

  await putCapturePipeline(event.queryStringParameters.title, pipelineInfo)
  console.log("Successfully created media capture pipeline: ", pipelineInfo);

  return response(201, 'application/json', JSON.stringify(pipelineInfo));
};

exports.end_capture = async (event, context) => {
  // Fetch the capture info by title
  const pipelineInfo = await getCapturePipeline(event.queryStringParameters.title);
  if (pipelineInfo) {
    await chimeSdkMediaPipelines.deleteMediaCapturePipeline({
      MediaPipelineId: pipelineInfo.MediaCapturePipeline.MediaPipelineId
    });
    return response(200, 'application/json', JSON.stringify({}));
  } else {
    return response(500, 'application/json', JSON.stringify({ msg: "No pipeline to stop for this meeting" }))
  }
};


exports.start_live_connector = async (event, context) => {
  // Fetch the meeting by title
  const meeting = await getMeeting(event.queryStringParameters.title);
  meetingRegion = meeting.Meeting.MediaRegion;
  const ivsChannelNamePrefix = "liveConnector"
  const ivsChannelName = `${ivsChannelNamePrefix}-${meetingRegion}`;
  ivsEndpoint = ''
  rtmpURL = ''
  ivsPlaybackUrl = ''
  ivsChannelArn = ''
  const params = {
    name: ivsChannelName,
  };
  const ivsCreateChannelResponse = await ivs.createChannel(params);
  ivsPlaybackUrl = ivsCreateChannelResponse.channel.playbackUrl
  ivsEndpoint = ivsCreateChannelResponse.channel.ingestEndpoint
  ivsStreamKey = ivsCreateChannelResponse.streamKey.value
  ivsChannelArn = ivsCreateChannelResponse.channel.arn
  rtmpURL = "rtmps://" + ivsEndpoint + ":443/app/" + ivsStreamKey
  console.log("Successfully created ivs channel: ", ivsCreateChannelResponse)
  const request =
      {
        Sinks: [
          {
            RTMPConfiguration: {
              AudioChannels: "Stereo",
              AudioSampleRate: "48000",
              Url: rtmpURL
            },
            SinkType: "RTMP"
          }
        ],
        Sources: [
          {
            ChimeSdkMeetingLiveConnectorConfiguration: {
              Arn: `arn:aws:chime::${AWS_ACCOUNT_ID}:meeting:${meeting.Meeting.MeetingId}`,
              CompositedVideo: {
                GridViewConfiguration: {
                  ContentShareLayout: "Vertical",
                },
                Layout: "GridView",
                Resolution: "FHD",
              },
              MuxType: "AudioWithCompositedVideo"
            },
            SourceType: "ChimeSdkMeeting"
          }
        ]
      };
  console.log("Creating new media live connector pipeline: ", request)
  liveConnectorPipelineInfo = await chimeSdkMediaPipelines.createMediaLiveConnectorPipeline(request);
  await putLiveConnectorPipeline(event.queryStringParameters.title, liveConnectorPipelineInfo)
  await putIvsArn(event.queryStringParameters.title, ivsChannelArn)
  console.log("Successfully created media live connector pipeline: ", liveConnectorPipelineInfo)
  liveConnectorPipelineInfo["playBackUrl"] = ivsPlaybackUrl
  return response(201, 'application/json', JSON.stringify(liveConnectorPipelineInfo));
};

exports.end_live_connector = async (event, context) => {
  // Fetch the live connector pipeline info by title
  const liveConnectorPipelineInfo = await getLiveConnectorPipeline(event.queryStringParameters.title);
  if (liveConnectorPipelineInfo) {
    const ivsChannelArn = await getIvsArn(event.queryStringParameters.title)
    await chimeSdkMediaPipelines.deleteMediaPipeline({
      MediaPipelineId: liveConnectorPipelineInfo.MediaLiveConnectorPipeline.MediaPipelineId
    });

    try {
      await delay(3000);
      await ivs.deleteChannel({arn: ivsChannelArn})
    }
    catch (e) {
      console.log("error deleting ivs :" + e)
    }
    return response(200, 'application/json', JSON.stringify({}));
  } else {
    return response(500, 'application/json', JSON.stringify({ msg: "No pipeline to stop for this meeting" }))
  }
};

exports.audio_file = async (event, context) => {
  return response(200, 'audio/mpeg', fs.readFileSync('./speech.mp3', { encoding: 'base64' }), true);
};

exports.stereo_audio_file = async (event, context) => {
  return response(200, 'audio/mpeg', fs.readFileSync('./speech_stereo.mp3', { encoding: 'base64' }), true);
};

exports.fetch_credentials = async (event, context) => {
  const awsCredentials = await chimeSDKMeetings.config.credentials();

  return response(200, 'application/json', JSON.stringify(awsCredentials));
};

exports.logs = async (event, context) => {
  return putLogEvents(event, BROWSER_LOG_GROUP_NAME, (logs, meetingId, attendeeId) => {
    const logEvents = [];
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      const timestamp = new Date(log.timestampMs).toISOString();
      const message = `${timestamp} [${log.sequenceNumber}] [${log.logLevel}] [meeting: ${meetingId}] [attendee: ${attendeeId}]: ${log.message}`;
      logEvents.push({
        message,
        timestamp: log.timestampMs
      });
    }
    return logEvents;
  });
};

exports.log_meeting_event = async (event, context) => {
  return putLogEvents(event, BROWSER_MEETING_EVENT_LOG_GROUP_NAME, (logs, meetingId, attendeeId) => {
    const logEvents = [];
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];

      // log.message must be a JSON string. CloudWatch Logs Insights will represent
      // nested JSON fields using the dot notation, e.g. attributes.sdkVersion
      logEvents.push({
        message: log.message,
        timestamp: log.timestampMs
      });
      addSignalMetricsToCloudWatch(log.message, meetingId, attendeeId);
    }
    return logEvents;
  });
};

exports.log_event_ingestion = async (event, context) => {
  return putLogEvents(event, BROWSER_EVENT_INGESTION_LOG_GROUP_NAME, (logs, meetingId, attendeeId) => {
    const logEvents = [];
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      const message = `[${log.logLevel}] [meeting: ${meetingId}] [attendee: ${attendeeId}]: ${log.message}`;
      logEvents.push({
        message,
        timestamp: log.timestampMs
      });
      addEventIngestionMetricsToCloudWatch(log, meetingId, attendeeId);
    }
    return logEvents;
  });
};

// Called when SQS receives records of meeting events and logs out those records
exports.sqs_handler = async (event, context, callback) => {
  console.log(event.Records);
  return {};
}

// Called when EventBridge receives a meeting event and logs out the event
exports.event_bridge_handler = async (event, context, callback) => {
  console.log(event);
  return {};
}

exports.create_log_stream = async event => {
  return createLogStream(event, BROWSER_LOG_GROUP_NAME);
}

exports.create_browser_event_log_stream = async event => {
  return createLogStream(event, BROWSER_MEETING_EVENT_LOG_GROUP_NAME);
}

exports.create_browser_event_ingestion_log_stream = async event => {
  return createLogStream(event, BROWSER_EVENT_INGESTION_LOG_GROUP_NAME);
}

// === Helpers ===

// Retrieves the meeting from the table by the meeting title
async function getMeeting(title) {
  const result = await ddb.getItem({
    TableName: MEETINGS_TABLE_NAME,
    Key: {
      'Title': {
        S: title
      },
    },
  });
  return result.Item ? JSON.parse(result.Item.Data.S) : null;
}

// Stores the meeting in the table using the meeting title as the key
async function putMeeting(title, meeting) {
  await ddb.putItem({
    TableName: MEETINGS_TABLE_NAME,
    Item: {
      'Title': { S: title },
      'Data': { S: JSON.stringify(meeting) },
      'TTL': {
        N: `${Math.floor(Date.now() / 1000) + 60 * 60 * 24}` // clean up meeting record one day from now
      }
    }
  });
}

// Retrieves capture data for a meeting by title
async function getCapturePipeline(title) {
  const result = await ddb.getItem({
    TableName: MEETINGS_TABLE_NAME,
    Key: {
      'Title': {
        S: title
      }
    }
  });
  return result.Item && result.Item.CaptureData ? JSON.parse(result.Item.CaptureData.S) : null;
}

// Adds meeting capture data to the meeting table
async function putCapturePipeline(title, capture) {
  await ddb.updateItem({
    TableName: MEETINGS_TABLE_NAME,
    Key: {
      'Title': { S: title }
    },
    UpdateExpression: "SET CaptureData = :capture",
    ExpressionAttributeValues: {
      ":capture": { S: JSON.stringify(capture) }
    }
  })
}

// Retrieves live connector data for a meeting by title
async function getLiveConnectorPipeline(title) {
  const result = await ddb.getItem({
    TableName: MEETINGS_TABLE_NAME,
    Key: {
      'Title': {
        S: title
      }
    }
  });
  return result.Item && result.Item.LiveConnectorData ? JSON.parse(result.Item.LiveConnectorData.S) : null;
}

// Adds meeting live connector data to the meeting table
async function putLiveConnectorPipeline(title, liveConnector) {
  await ddb.updateItem({
    TableName: MEETINGS_TABLE_NAME,
    Key: {
      'Title': {S: title}
    },
    UpdateExpression: "SET LiveConnectorData = :liveConnector",
    ExpressionAttributeValues: {
      ":liveConnector": {S: JSON.stringify(liveConnector)}
    }
  })
}

// Retrieves live connector data for a meeting by title
async function getIvsArn(title) {
  const result = await ddb.getItem({
    TableName: MEETINGS_TABLE_NAME,
    Key: {
      'Title': {
        S: title
      }
    }
  });
  return result.Item && result.Item.IvsArnData ? JSON.parse(result.Item.IvsArnData.S) : null;
}

// Adds meeting live connector data to the meeting table
async function putIvsArn(title, ivsArn) {
  await ddb.updateItem({
    TableName: MEETINGS_TABLE_NAME,
    Key: {
      'Title': {S: title}
    },
    UpdateExpression: "SET IvsArnData = :ivsArn",
    ExpressionAttributeValues: {
      ":ivsArn": {S: JSON.stringify(ivsArn)}
    }
  })
}


async function putLogEvents(event, logGroupName, createLogEvents) {
  const body = JSON.parse(event.body);
  if (!body.logs || !body.meetingId || !body.attendeeId || !body.appName) {
    return response(400, 'application/json', JSON.stringify({
      error: 'Required properties: logs, meetingId, attendeeId, appName'
    }));
  } else if (!body.logs.length) {
    return response(200, 'application/json', JSON.stringify({}));
  }

  const cloudWatchClient = new CloudWatchLogs({
    // The key apiVersion is no longer supported in v3, and can be removed.
    // @deprecated The client uses the "latest" apiVersion.
    apiVersion: '2014-03-28',
  });
  const putLogEventsInput = {
    logGroupName,
    logStreamName: createLogStreamName(body.meetingId, body.attendeeId),
    logEvents: createLogEvents(body.logs, body.meetingId, body.attendeeId)
  };
  const uploadSequenceToken = await ensureLogStream(cloudWatchClient, logGroupName, putLogEventsInput.logStreamName);
  if (uploadSequenceToken) {
    putLogEventsInput.sequenceToken = uploadSequenceToken;
  }

  try {
    await cloudWatchClient.putLogEvents(putLogEventsInput);
  } catch (error) {
    const errorMessage = `Failed to put CloudWatch log events with error ${error} and params ${JSON.stringify(putLogEventsInput)}`;
    if (error.code === 'InvalidSequenceTokenException' || error.code === 'DataAlreadyAcceptedException') {
      console.warn(errorMessage);
    } else {
      console.error(errorMessage);
    }
  }

  return response(200, 'application/json', JSON.stringify({}));
}

// Creates log stream if necessary and returns the current sequence token
async function ensureLogStream(cloudWatchClient, logGroupName, logStreamName) {
  const logStreamsResult = await cloudWatchClient.describeLogStreams({
    logGroupName: logGroupName,
    logStreamNamePrefix: logStreamName,
  });
  const foundStream = logStreamsResult.logStreams.find(logStream => logStream.logStreamName === logStreamName);
  if (foundStream) {
    return foundStream.uploadSequenceToken;
  }
  await cloudWatchClient.createLogStream({
    logGroupName: logGroupName,
    logStreamName: logStreamName,
  });
  return null;
}

async function createLogStream(event, logGroupName) {
  const body = JSON.parse(event.body);
  if (!body.meetingId || !body.attendeeId) {
    return response(400, 'application/json', JSON.stringify({
      error: 'Required properties: meetingId, attendeeId'
    }));
  }
  const cloudWatchClient = new CloudWatchLogs({
    // The key apiVersion is no longer supported in v3, and can be removed.
    // @deprecated The client uses the "latest" apiVersion.
    apiVersion: '2014-03-28',
  });
  await cloudWatchClient.createLogStream({
    logGroupName,
    logStreamName: createLogStreamName(body.meetingId, body.attendeeId)
  });
  return response(200, 'application/json', JSON.stringify({}));
}

function createLogStreamName(meetingId, attendeeId) {
  return `ChimeSDKMeeting_${meetingId}_${attendeeId}`;
}

function delay(milliseconds){
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}


function response(statusCode, contentType, body, isBase64Encoded = false) {
  return {
    statusCode: statusCode,
    headers: { 
      'Content-Type': contentType,
      // enable shared array buffer for videoFxProcessor
      'Cross-Origin-Opener-Policy': 'same-origin', 
      // enable shared array buffer for videoFxProcessor
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    body: body,
    isBase64Encoded,
  };
}

function addSignalMetricsToCloudWatch(logMsg, meetingId, attendeeId) {
  const logMsgJson = JSON.parse(logMsg);
  const metricList = ['signalingOpenDurationMs', 'iceGatheringDurationMs', 'attendeePresenceDurationMs', 'meetingStartDurationMs'];
  const putMetric =
      metricScope(metrics => (metricName, metricValue, meetingId, attendeeId) => {
        metrics.setProperty('MeetingId', meetingId);
        metrics.setProperty('AttendeeId', attendeeId);
        metrics.putMetric(metricName, metricValue);
      });
  for (let metricIndex = 0; metricIndex <= metricList.length; metricIndex += 1) {
    const metricName = metricList[metricIndex];
    if (logMsgJson.attributes.hasOwnProperty(metricName)) {
      const metricValue = logMsgJson.attributes[metricName];
      console.log('Logging metric -> ', metricName, ': ', metricValue);
      putMetric(metricName, metricValue, meetingId, attendeeId);
    }
  }
}

function addEventIngestionMetricsToCloudWatch(log, meetingId, attendeeId) {
  const putMetric =
      metricScope(metrics => (metricName, metricValue, meetingId, attendeeId) => {
        metrics.setProperty('MeetingId', meetingId);
        metrics.setProperty('AttendeeId', attendeeId);
        metrics.putMetric(metricName, metricValue);
      });
  const { logLevel, message } = log;
  let errorMetricValue = 0;
  let retryMetricValue = 0;
  let ingestionTriggerSuccessMetricValue = 0;
  let networkErrors = 0;
  if (logLevel === 'WARN' && message.includes('Retry count limit reached')) {
    retryMetricValue = 1;
  } else if (logLevel === 'ERROR') {
    errorMetricValue = 1;
  } else if (message.includes('send successful')) {
    ingestionTriggerSuccessMetricValue = 1;
  } else if (message.match(/(NetworkError|AbortError|Failed to fetch)/g) !== null) {
    networkErrors = 1;
  }
  putMetric('EventIngestionTriggerSuccess', ingestionTriggerSuccessMetricValue, meetingId, attendeeId);
  putMetric('EventIngestionError', errorMetricValue, meetingId, attendeeId);
  putMetric('EventIngestionRetryCountLimitReached', retryMetricValue, meetingId, attendeeId);
  putMetric('EventIngestionNetworkErrors', networkErrors, meetingId, attendeeId);
}
