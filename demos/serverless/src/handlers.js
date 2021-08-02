// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const AWS = require('aws-sdk');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { metricScope } = require('aws-embedded-metrics');

// Store meetings in a DynamoDB table so attendees can join by meeting title
const ddb = new AWS.DynamoDB();

// Create an AWS SDK Chime object. Region 'us-east-1' is currently required.
// Use the MediaRegion property below in CreateMeeting to select the region
// the meeting is hosted in.
const chime = new AWS.Chime({ region: 'us-east-1' });

// Set the AWS SDK Chime endpoint. The global endpoint is https://service.chime.aws.amazon.com.
chime.endpoint = new AWS.Endpoint(process.env.CHIME_ENDPOINT);

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
  return response(200, 'text/html', fs.readFileSync('./index.html', {encoding: 'utf8'}));
};

exports.join = async(event, context) => {
  const query = event.queryStringParameters;
  if (!query.title || !query.name || !query.region) {
    return response(400, 'application/json', JSON.stringify({error: 'Need parameters: title, name, region'}));
  }

  // Look up the meeting by its title. If it does not exist, create the meeting.
  let meeting = await getMeeting(query.title);
  if (!meeting) {
    const request = {
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

      // Tags associated with the meeting. They can be used in cost allocation console
      Tags: [
        { Key: 'Department', Value: 'RND'}
      ]
    };
    console.info('Creating new meeting: ' + JSON.stringify(request));
    meeting = await chime.createMeeting(request).promise();

    // Store the meeting in the table using the meeting title as the key.
    await putMeeting(query.title, meeting);
  }

  // Create new attendee for the meeting
  console.info('Adding new attendee');
  const attendee = (await chime.createAttendee({
    // The meeting ID of the created meeting to add the attendee to
    MeetingId: meeting.Meeting.MeetingId,

    // Any user ID you wish to associate with the attendeee.
    // For simplicity here, we use a random UUID for uniqueness
    // combined with the name the user provided, which can later
    // be used to help build the roster.
    ExternalUserId: `${uuidv4().substring(0, 8)}#${query.name}`.substring(0, 64),
  }).promise());

  // Return the meeting and attendee responses. The client will use these
  // to join the meeting.
  return response(200, 'application/json', JSON.stringify({
    JoinInfo: {
      Meeting: meeting,
      Attendee: attendee,
    },
  }, null, 2));
};

exports.end = async (event, context) => {
  // Fetch the meeting by title
  const meeting = await getMeeting(event.queryStringParameters.title);

  // End the meeting. All attendee connections will hang up.
  await chime.deleteMeeting({ MeetingId: meeting.Meeting.MeetingId }).promise();
  return response(200, 'application/json', JSON.stringify({}));
};

exports.start_capture = async (event, context) => {
  // Fetch the meeting by title
  const meeting = await getMeeting(event.queryStringParameters.title);
  meetingRegion = meeting.Meeting.MediaRegion;

  let captureS3Destination = `arn:aws:s3:::${CAPTURE_S3_DESTINATION_PREFIX}-${meetingRegion}/${meeting.Meeting.MeetingId}/`
  pipelineInfo = await chime.createMediaCapturePipeline({
    SourceType: "ChimeSdkMeeting",
    SourceArn: `arn:aws:chime::${AWS_ACCOUNT_ID}:meeting:${meeting.Meeting.MeetingId}`,
    SinkType: "S3Bucket",
    SinkArn: captureS3Destination,
  }).promise();
  await putCapturePipeline(event.queryStringParameters.title, pipelineInfo)

  response(response, 201, 'application/json', JSON.stringify(pipelineInfo));
};

exports.end_capture = async (event, context) => {
  // Fetch the capture info by title
  const pipelineInfo = await getCapturePipeline(event.queryStringParameters.title);
  if (pipelineInfo) {
    await chime.deleteMediaCapturePipeline({
      MediaPipelineId: pipelineInfo.MediaCapturePipeline.MediaPipelineId
    }).promise();
    response(response, 200, 'application/json', JSON.stringify({}));
  } else {
    response(response, 500, 'application/json', JSON.stringify({msg: "No pipeline to stop for this meeting"}))
  }
};

exports.fetch_credentials = async (event, context) => {
  const awsCredentials = {
    accessKeyId: AWS.config.credentials.accessKeyId,
    secretAccessKey: AWS.config.credentials.secretAccessKey,
    sessionToken: AWS.config.credentials.sessionToken,
  };

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
        message: log.message,
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
  }).promise();
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
  }).promise();
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
  }).promise();
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
  }).promise()
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

  const cloudWatchClient = new AWS.CloudWatchLogs({ apiVersion: '2014-03-28' });
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
    await cloudWatchClient.putLogEvents(putLogEventsInput).promise();
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
  }).promise();
  const foundStream = logStreamsResult.logStreams.find(logStream => logStream.logStreamName === logStreamName);
  if (foundStream) {
    return foundStream.uploadSequenceToken;
  }
  await cloudWatchClient.createLogStream({
    logGroupName: logGroupName,
    logStreamName: logStreamName,
  }).promise();
  return null;
}

async function createLogStream(event, logGroupName) {
  const body = JSON.parse(event.body);
  if (!body.meetingId || !body.attendeeId) {
    return response(400, 'application/json', JSON.stringify({
      error: 'Required properties: meetingId, attendeeId'
    }));
  }
  const cloudWatchClient = new AWS.CloudWatchLogs({ apiVersion: '2014-03-28' });
  await cloudWatchClient.createLogStream({
    logGroupName,
    logStreamName: createLogStreamName(body.meetingId, body.attendeeId)
  }).promise();
  return response(200, 'application/json', JSON.stringify({}));
}

function createLogStreamName(meetingId, attendeeId) {
  return `ChimeSDKMeeting_${meetingId}_${attendeeId}`;
}

function response(statusCode, contentType, body) {
  return {
    statusCode: statusCode,
    headers: { 'Content-Type': contentType },
    body: body,
    isBase64Encoded: false
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
      console.log('Logging metric -> ', metricName, ': ', metricValue );
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
