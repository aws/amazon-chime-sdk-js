var AWS = require('aws-sdk');
var ddb = new AWS.DynamoDB();
const chime = new AWS.Chime({ region: 'us-east-1' });
chime.endpoint = new AWS.Endpoint('https://service.chime.aws.amazon.com/console');

const oneDayFromNow = Math.floor(Date.now() / 1000) + 60 * 60 * 24;

// Read resource names from the environment
const meetingsTableName = process.env.MEETINGS_TABLE_NAME;
const attendeesTableName = process.env.ATTENDEES_TABLE_NAME;
const sqsQueueArn = process.env.SQS_QUEUE_ARN;
const provideQueueArn = process.env.USE_EVENT_BRIDGE === 'false';
const logGroupName = process.env.BROWSER_LOG_GROUP_NAME;

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const getMeeting = async(meetingTitle) => {
  const result = await ddb.getItem({
    TableName: meetingsTableName,
    Key: {
      'Title': {
        S: meetingTitle
      },
    },
  }).promise();
  if (!result.Item) {
    return null;
  }
  const meetingData = JSON.parse(result.Item.Data.S);
  return meetingData;
}

const putMeeting = async(title, meetingInfo) => {
  await ddb.putItem({
    TableName: meetingsTableName,
    Item: {
      'Title': { S: title },
      'Data': { S: JSON.stringify(meetingInfo) },
      'TTL': {
        N: '' + oneDayFromNow
      }
    }
  }).promise();
}

const getAttendee = async(title, attendeeId) => {
  const result = await ddb.getItem({
    TableName: attendeesTableName,
    Key: {
      'AttendeeId': {
        S: `${title}/${attendeeId}`
      }
    }
  }).promise();
  if (!result.Item) {
    return 'Unknown';
  }
  return result.Item.Name.S;
}

const putAttendee = async(title, attendeeId, name) => {
  await ddb.putItem({
    TableName: attendeesTableName,
    Item: {
      'AttendeeId': {
        S: `${title}/${attendeeId}`
      },
      'Name': { S: name },
      'TTL': {
        N: '' + oneDayFromNow
      }
    }
  }).promise();
}

function getNotificationsConfig() {
  if (provideQueueArn) {
    return  {
      SqsQueueArn: sqsQueueArn,
    };
  }
  return {}
}

// ===== Join or create meeting ===================================
exports.createMeeting = async(event, context, callback) => {
  var response = {
    "statusCode": 200,
    "headers": {},
    "body": '',
    "isBase64Encoded": false
  };

  if (!event.queryStringParameters.title) {
    response["statusCode"] = 400;
    response["body"] = "Must provide title";
    callback(null, response);
    return;
  }
  const title = event.queryStringParameters.title;
  const region = event.queryStringParameters.region || 'us-east-1';
  let meetingInfo = await getMeeting(title);
  if (!meetingInfo) {
    const request = {
      ClientRequestToken: uuid(),
      MediaRegion: region,
      NotificationsConfiguration: getNotificationsConfig(),
    };
    console.info('Creating new meeting: ' + JSON.stringify(request));
    meetingInfo = await chime.createMeeting(request).promise();
    await putMeeting(title, meetingInfo);
  }

  const joinInfo = {
    JoinInfo: {
      Title: title,
      Meeting: meetingInfo.Meeting,
    },
  };

  response.body = JSON.stringify(joinInfo, '', 2);
  callback(null, response);
};

exports.join = async(event, context, callback) => {
  var response = {
    "statusCode": 200,
    "headers": {},
    "body": '',
    "isBase64Encoded": false
  };

  if (!event.queryStringParameters.title || !event.queryStringParameters.name) {
    response["statusCode"] = 400;
    response["body"] = "Must provide title and name";
    callback(null, response);
    return;
  }
  const title = event.queryStringParameters.title;
  const name = event.queryStringParameters.name;
  const region = event.queryStringParameters.region || 'us-east-1';
  let meetingInfo = await getMeeting(title);
  if (!meetingInfo) {
    const request = {
      ClientRequestToken: uuid(),
      MediaRegion: region,
      NotificationsConfiguration: getNotificationsConfig(),
    };
    console.info('Creating new meeting: ' + JSON.stringify(request));
    meetingInfo = await chime.createMeeting(request).promise();
    await putMeeting(title, meetingInfo);
  }

  console.info('Adding new attendee');
  const attendeeInfo = (await chime.createAttendee({
      MeetingId: meetingInfo.Meeting.MeetingId,
      ExternalUserId: uuid(),
    }).promise());

  putAttendee(title, attendeeInfo.Attendee.AttendeeId, name);

  const joinInfo = {
    JoinInfo: {
      Title: title,
      Meeting: meetingInfo.Meeting,
      Attendee: attendeeInfo.Attendee
    },
  };

  response.body = JSON.stringify(joinInfo, '', 2);
  callback(null, response);
};

exports.attendee = async(event, context, callback) => {
  var response = {
    "statusCode": 200,
    "headers": {},
    "body": '',
    "isBase64Encoded": false
  };
  const title = event.queryStringParameters.title;
  const attendeeId = event.queryStringParameters.attendee;
  const attendeeInfo = {
    AttendeeInfo: {
      AttendeeId: attendeeId,
      Name: await getAttendee(title, attendeeId),
    },
  };
  response.body = JSON.stringify(attendeeInfo, '', 2);
  callback(null, response);
};

exports.end = async(event, context, callback) => {
  var response = {
    "statusCode": 200,
    "headers": {},
    "body": '',
    "isBase64Encoded": false
  };
  const title = event.queryStringParameters.title;
  let meetingInfo = await getMeeting(title);
  await chime.deleteMeeting({
    MeetingId: meetingInfo.Meeting.MeetingId,
  }).promise();
  callback(null, response);
};

async function ensureLogStream(cloudWatchClient, logStreamName) {
  var describeLogStreamsParams = {
    "logGroupName": logGroupName,
    "logStreamNamePrefix": logStreamName
  };
  var response = await cloudWatchClient.describeLogStreams(describeLogStreamsParams).promise();
  var foundStream = response.logStreams.find(s => s.logStreamName === logStreamName);
  if (foundStream) {
    return foundStream.uploadSequenceToken;
  }
  var putLogEventsInput = {
    "logGroupName": logGroupName,
    "logStreamName": logStreamName
  };
  await cloudWatchClient.createLogStream(putLogEventsInput).promise();
  return null;
}

exports.logs = async (event, context) => {
  var response = {
    "statusCode": 200,
    "headers": {},
    "body": '',
    "isBase64Encoded": false
  };
  {
    var body = JSON.parse(event.body);
    if (!body.logs || !body.meetingId || !body.attendeeId || !body.appName) {
      response.body = "Empty Parameters Received";
      response.statusCode = 400;
      return response;
    }
    const logStreamName = "ChimeSDKMeeting_" + body.meetingId.toString();
    var cloudWatchClient = new AWS.CloudWatchLogs({
      apiVersion: '2014-03-28'
    });
    var putLogEventsInput = {
      "logGroupName": logGroupName,
      "logStreamName": logStreamName
    };
    var uploadSequence = await ensureLogStream(cloudWatchClient, logStreamName);
    if (uploadSequence) {
      putLogEventsInput["sequenceToken"] = uploadSequence;
    }
    var logEvents = [];
    if (body.logs.length > 0) {
      for (let i = 0; i < body.logs.length; i++) {
        var log = body.logs[i];
        var timestampIso = new Date(log.timestampMs).toISOString();
        var message = `${timestampIso} [${log.sequenceNumber}] [${log.logLevel}] [mid: ${body.meetingId.toString()}] [aid: ${body.attendeeId}]: ${log.message}`;
        logEvents.push({
          "message": message,
          "timestamp": log.timestampMs
        });
      }
      putLogEventsInput["logEvents"] = logEvents;
      await cloudWatchClient.putLogEvents(putLogEventsInput).promise();
    }
  }
  return response;
};