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

// deploy.js copies these from ../browser, where api-server.js uses them too.
const { ensureCaptureBucket } = require('./captureBucket.js');
const {
  MEETING_ID_FORMAT,
  BadRequestError,
  createMeetingRequest,
  transcriptionConfiguration,
  requireCapabilities,
  liveConnectorRequest,
} = require('./meetingRequests.js');

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


const chimeSDKMeetings = new ChimeSDKMeetings({ region: currentRegion, endpoint: chimeSDKMeetingsEndpoint });

// Create an AWS SDK Media Pipelines object.
const chimeSdkMediaPipelines = new ChimeSDKMediaPipelines({
  region: mediaPipelinesControlRegion,
  endpoint: chimeSDKMediaPipelinesEndpoint
});

// Read resource names from the environment
const {
  MEETINGS_TABLE_NAME,
  BROWSER_LOG_GROUP_NAME,
  BROWSER_MEETING_EVENT_LOG_GROUP_NAME,
  SQS_QUEUE_ARN,
  USE_EVENT_BRIDGE,
  BROWSER_EVENT_INGESTION_LOG_GROUP_NAME,
  CAPTURE_S3_DESTINATION_PREFIX,
  CAPTURE_SERVICE_PRINCIPAL,
  AWS_ACCOUNT_ID,
  STACK_NAME,
} = process.env;

exports.index = async (event, context, callback) => {
  // Return the contents of the index page, with the policy the local servers send (deploy.js copies csp.js).
  const page = response(200, 'text/html', fs.readFileSync('./index.html', { encoding: 'utf8' }));
  page.headers['Content-Security-Policy'] = require('./csp.js');
  return page;
};

exports.join = answeringBadRequests(async (event, context) => {
  const query = event.queryStringParameters;
  if (!query.title || !query.name) {
    return response(400, 'application/json', JSON.stringify({ error: 'Need parameters: title, name' }));
  }

  // Look up the meeting by its title
  let meeting = await getMeeting(query.title);
  if (meeting) {
    // Rows live for a day, but meetings end a few minutes after the last attendee leaves; reusing
    // a dead id would make createAttendee fail, so check first and replace the row if it ended.
    try {
      await chimeSDKMeetings.getMeeting({ MeetingId: meeting.Meeting.MeetingId });
    } catch (error) {
      if (error.name !== 'NotFoundException') {
        throw error;
      }
      console.info(`Meeting ${meeting.Meeting.MeetingId} for "${query.title}" has ended; creating a new one`);
      meeting = null;
    }
  }

  let primaryMeeting = undefined
  if (query.primaryExternalMeetingId) {
    primaryMeeting = await getMeeting(query.primaryExternalMeetingId)
    if (primaryMeeting) {
      console.info(`Retrieved primary meeting ID ${primaryMeeting.Meeting.MeetingId} for external meeting ID ${query.primaryExternalMeetingId}`)
    } else if (MEETING_ID_FORMAT.test(query.primaryExternalMeetingId)) {
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
      if (MEETING_ID_FORMAT.test(query.title)) {
        meeting = await chimeSDKMeetings.getMeeting({
          MeetingId: query.title
        });
      }
    } catch (error) {
      console.info("Meeting ID doesn't exist as a conference ID: " + error);
    }

    // If still no meeting, create one
    if (!meeting) {
      const request = createMeetingRequest(query, primaryMeeting, uuidv4());
      // Set up SQS notifications if being used
      request.NotificationsConfiguration = USE_EVENT_BRIDGE === 'false' ? { SqsQueueArn: SQS_QUEUE_ARN } : {};
      try {
        console.info('Creating new meeting: ' + JSON.stringify(request));
        meeting = await chimeSDKMeetings.createMeeting(request);
      } catch (error) {
        console.error('Failed to create new meeting: ' + JSON.stringify(error));
        let statusCode = 400;
        if (error.code == "ServiceFailureException" || error.code == "ServiceUnavailableException"){
          statusCode = 500;
        }
        return response(statusCode, 'application/json', JSON.stringify({ error: error.message }));
      }

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
    createAttendeeRequest.Capabilities = requireCapabilities({
      audioCapability: query.attendeeAudioCapability,
      videoCapability: query.attendeeVideoCapability,
      contentCapability: query.attendeeContentCapability,
    });
  }

  try {
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
  } catch (error) {
    console.error('Failed to create new attendee: ' + JSON.stringify(error));
    let statusCode = 400;
    if (error.code == "ServiceFailureException" || error.code == "ServiceUnavailableException"){
      statusCode = 500;
    }
    return response(statusCode, 'application/json', JSON.stringify({ error: error.message }));
  }
});

// Whether a meeting with this title exists (and where), for the join screen. Creates nothing.
exports.meeting = async (event, context) => {
  const title = event.queryStringParameters && event.queryStringParameters.title;
  const known = title ? await getMeeting(title) : null;
  const meetingId = known ? known.Meeting.MeetingId : MEETING_ID_FORMAT.test(title || '') ? title : undefined;
  let found;
  if (meetingId) {
    try {
      found = await chimeSDKMeetings.getMeeting({ MeetingId: meetingId });
    } catch (error) {
      if (error.name !== 'NotFoundException') {
        throw error;
      }
    }
  }
  const [capture, liveConnector] = found
    ? await Promise.all([getCapturePipeline(title), getLiveConnectorPipeline(title)])
    : [null, null];
  return response(200, 'application/json', JSON.stringify({
    exists: !!found,
    mediaRegion: found ? found.Meeting.MediaRegion : undefined,
    capturing: !!capture,
    broadcasting: !!liveConnector,
  }));
};

exports.end = async (event, context) => {
  // Fetch the meeting by title
  const meeting = await getMeeting(event.queryStringParameters.title);

  // End the meeting. All attendee connections will hang up.
  await chimeSDKMeetings.deleteMeeting({ MeetingId: meeting.Meeting.MeetingId });

  // Ending the meeting stops its pipelines but would leave the broadcast's IVS channel.
  try {
    await stopLiveConnector(event.queryStringParameters.title);
  } catch (error) {
    console.warn(`Could not stop the broadcast: ${error.name}`);
  }
  return response(200, 'application/json', JSON.stringify({}));
};

exports.get_attendee = async (event) => {
  const query = event.queryStringParameters;
  if (!query.title || !query.id) {
    return response(400, 'application/json', JSON.stringify({ error: 'Need parameters: title, id' }));
  }
  const meeting = await getMeeting(query.title);
  const { Attendee } = await chimeSDKMeetings
    .getAttendee({
      MeetingId: meeting.Meeting.MeetingId,
      AttendeeId: query.id,
    });
  // Never return the join token: any participant can ask about any attendee.
  return response(200, 'application/json', JSON.stringify({
    Attendee: {
      AttendeeId: Attendee.AttendeeId,
      ExternalUserId: Attendee.ExternalUserId,
      Capabilities: Attendee.Capabilities,
    },
  }, null, 2));
};

exports.update_attendee_capabilities = answeringBadRequests(async (event) => {
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
  await chimeSDKMeetings
    .updateAttendeeCapabilities({
      MeetingId: meeting.Meeting.MeetingId,
      AttendeeId: query.attendeeId,
      Capabilities: requireCapabilities(query),
    });
  // The AWS response carries the attendee's join token; the client needs nothing back.
  return response(200, 'application/json', JSON.stringify({}));
});

exports.batch_update_attendee_capabilities_except = answeringBadRequests(async (event) => {
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
      Capabilities: requireCapabilities(query),
    });
  return response(200, 'application/json', JSON.stringify(attendeeCapsExceptResponse));
});

exports.start_transcription = answeringBadRequests(async (event, context) => {
  // Fetch the meeting by title
  const meeting = await getMeeting(event.queryStringParameters.title);

  const configuration = transcriptionConfiguration(event.queryStringParameters);
  if (!configuration) {
    return response(400, 'application/json', JSON.stringify({
      error: 'Unknown transcription engine'
    }));
  }

  // start transcription for the meeting
  await chimeSDKMeetings.startMeetingTranscription({
    MeetingId: meeting.Meeting.MeetingId,
    TranscriptionConfiguration: configuration
  });
  return response(200, 'application/json', JSON.stringify({}));
});

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
  const title = event.queryStringParameters.title;
  // Fetch the meeting by title
  const meeting = await getMeeting(title);
  // A second Record press or a retried request gets the running pipeline, not another one.
  const existing = await getCapturePipeline(title);
  if (existing) {
    return response(200, 'application/json', JSON.stringify({ MediaCapturePipeline: existing.MediaCapturePipeline }));
  }
  // The meeting's own Region keeps its recording there.
  let bucket;
  try {
    bucket = await ensureCaptureBucket({
      accountId: AWS_ACCOUNT_ID,
      region: meeting.Meeting.MediaRegion,
      prefix: CAPTURE_S3_DESTINATION_PREFIX,
      servicePrincipal: CAPTURE_SERVICE_PRINCIPAL,
    });
  } catch (error) {
    if (error.name !== 'CaptureBucketUnavailableError') {
      throw error;
    }
    console.error(error);
    return response(409, 'application/json', JSON.stringify({ error: error.message }));
  }
  // Every stack in the account shares the bucket, so each writes under its own name.
  const captureS3Destination = `arn:aws:s3:::${bucket}/${STACK_NAME}/${meeting.Meeting.MeetingId}/`;
  const request = {
    SourceType: "ChimeSdkMeeting",
    SourceArn: `arn:aws:chime::${AWS_ACCOUNT_ID}:meeting:${meeting.Meeting.MeetingId}`,
    SinkType: "S3Bucket",
    SinkArn: captureS3Destination,
  };
  console.log("Creating new media capture pipeline: ", request)
  const pipelineInfo = await chimeSdkMediaPipelines.createMediaCapturePipeline(request);

  await putCapturePipeline(title, pipelineInfo)
  console.log("Successfully created media capture pipeline: ", pipelineInfo);

  return response(201, 'application/json', JSON.stringify({ MediaCapturePipeline: pipelineInfo.MediaCapturePipeline }));
};

exports.end_capture = async (event, context) => {
  // Fetch the capture info by title. Stopping when nothing is running (or the pipeline already
  // ended) succeeds, and the record is cleared so GET /meeting stops reporting it.
  const title = event.queryStringParameters.title;
  const pipelineInfo = await getCapturePipeline(title);
  if (pipelineInfo) {
    try {
      await chimeSdkMediaPipelines.deleteMediaCapturePipeline({
        MediaPipelineId: pipelineInfo.MediaCapturePipeline.MediaPipelineId
      });
    } catch (error) {
      if (error.name !== 'NotFoundException') {
        throw error;
      }
    }
    await removeMeetingAttribute(title, 'CaptureData');
  }
  return response(200, 'application/json', JSON.stringify({}));
};


exports.start_live_connector = async (event, context) => {
  const title = event.queryStringParameters.title;
  // Fetch the meeting by title
  const meeting = await getMeeting(title);
  // A second Broadcast press or a retried request gets the running pipeline, not another channel
  // and pipeline.
  const existing = await getLiveConnectorPipeline(title);
  if (existing) {
    return response(200, 'application/json', JSON.stringify({
      MediaPipelineId: existing.MediaLiveConnectorPipeline.MediaPipelineId,
      playBackUrl: existing.playBackUrl,
    }));
  }
  const meetingRegion = meeting.Meeting.MediaRegion;
  const ivsChannelNamePrefix = "liveConnector"
  const ivsChannelName = `${ivsChannelNamePrefix}-${meetingRegion}`;
  const params = {
    name: ivsChannelName,
  };
  const ivsCreateChannelResponse = await ivs.createChannel(params);
  const ivsPlaybackUrl = ivsCreateChannelResponse.channel.playbackUrl
  const ivsEndpoint = ivsCreateChannelResponse.channel.ingestEndpoint
  const ivsStreamKey = ivsCreateChannelResponse.streamKey.value
  const ivsChannelArn = ivsCreateChannelResponse.channel.arn
  // The RTMP URL carries the stream key: never log it (or the create-channel response) or return it.
  const rtmpURL = "rtmps://" + ivsEndpoint + ":443/app/" + ivsStreamKey
  console.log("Successfully created ivs channel: ", ivsChannelArn)
  const request = liveConnectorRequest(AWS_ACCOUNT_ID, meeting.Meeting.MeetingId, rtmpURL);
  console.log("Creating new media live connector pipeline for meeting ", meeting.Meeting.MeetingId)
  let liveConnectorPipelineInfo;
  try {
    liveConnectorPipelineInfo = await chimeSdkMediaPipelines.createMediaLiveConnectorPipeline(request);
  } catch (error) {
    await ivs.deleteChannel({ arn: ivsChannelArn }).catch(e => console.log("error deleting ivs :" + e));
    throw error;
  }
  const mediaPipelineId = liveConnectorPipelineInfo.MediaLiveConnectorPipeline.MediaPipelineId;
  // Store only what end_live_connector and a repeated start need, not the sink URL.
  await putLiveConnectorPipeline(title, {
    MediaLiveConnectorPipeline: { MediaPipelineId: mediaPipelineId },
    playBackUrl: ivsPlaybackUrl,
  })
  await putIvsArn(title, ivsChannelArn)
  console.log("Successfully created media live connector pipeline: ", mediaPipelineId)
  return response(201, 'application/json', JSON.stringify({ MediaPipelineId: mediaPipelineId, playBackUrl: ivsPlaybackUrl }));
};

exports.end_live_connector = async (event, context) => {
  await stopLiveConnector(event.queryStringParameters.title);
  return response(200, 'application/json', JSON.stringify({}));
};

// Stopping when nothing is running (or the pipeline already ended) succeeds, and the record is
// cleared so GET /meeting stops reporting it.
async function stopLiveConnector(title) {
  const liveConnectorPipelineInfo = await getLiveConnectorPipeline(title);
  if (liveConnectorPipelineInfo) {
    const ivsChannelArn = await getIvsArn(title)
    try {
      await chimeSdkMediaPipelines.deleteMediaPipeline({
        MediaPipelineId: liveConnectorPipelineInfo.MediaLiveConnectorPipeline.MediaPipelineId
      });
    } catch (error) {
      if (error.name !== 'NotFoundException') {
        throw error;
      }
    }

    await removeMeetingAttribute(title, 'LiveConnectorData');
    // IVS refuses to delete a channel while it is live, which it stays for a few seconds after its
    // pipeline stops. Six tries keep this inside the 30 s function timeout.
    for (let attempt = 1; attempt <= 6; attempt++) {
      await delay(3000);
      try {
        await ivs.deleteChannel({ arn: ivsChannelArn });
        break;
      } catch (e) {
        if (e.name !== 'ConflictException' || attempt === 6) {
          console.log("error deleting ivs :" + e);
          break;
        }
      }
    }
  }
}

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
  // Strongly consistent so GET /meeting reflects a start or stop right away.
  const result = await ddb.getItem({
    TableName: MEETINGS_TABLE_NAME,
    ConsistentRead: true,
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
  // Strongly consistent so GET /meeting reflects a start or stop right away.
  const result = await ddb.getItem({
    TableName: MEETINGS_TABLE_NAME,
    ConsistentRead: true,
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

// Drops one attribute (e.g. CaptureData) from a meeting's row. The condition stops updateItem
// from creating a row with no Data when the row has already expired.
async function removeMeetingAttribute(title, attributeName) {
  try {
    await ddb.updateItem({
      TableName: MEETINGS_TABLE_NAME,
      Key: {
        'Title': { S: title }
      },
      UpdateExpression: 'REMOVE #attribute',
      ConditionExpression: 'attribute_exists(#title)',
      ExpressionAttributeNames: { '#attribute': attributeName, '#title': 'Title' },
    });
  } catch (error) {
    if (error.name !== 'ConditionalCheckFailedException') {
      throw error;
    }
  }
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

// meetingRequests.js rejects invalid parameters with BadRequestError; answer it with a 400.
function answeringBadRequests(handler) {
  return async (event, context) => {
    try {
      return await handler(event, context);
    } catch (error) {
      if (!(error instanceof BadRequestError)) {
        throw error;
      }
      return response(400, 'application/json', JSON.stringify({ error: error.message }));
    }
  };
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
