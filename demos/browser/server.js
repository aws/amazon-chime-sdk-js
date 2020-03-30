// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable */
const compression = require('compression');
const fs = require('fs');
const url = require('url');
const uuid = require('uuid/v4');
const AWS = require('aws-sdk');
/* eslint-enable */

let hostname = '127.0.0.1';
let port = 8080;
let protocol = 'http';
let options = {};

const chime = new AWS.Chime({ region: 'us-east-1' });
const alternateEndpoint = process.env.ENDPOINT;
if (alternateEndpoint) {
  console.log('Using endpoint: ' + alternateEndpoint);
  chime.createMeeting({ ClientRequestToken: uuid() }, () => {});
  AWS.NodeHttpClient.sslAgent.options.rejectUnauthorized = false;
  chime.endpoint = new AWS.Endpoint(alternateEndpoint);
} else {
  chime.endpoint = new AWS.Endpoint('https://service.chime.aws.amazon.com/console');
}

const meetingCache = {};
const attendeeCache = {};

const log = message => {
  console.log(`${new Date().toISOString()} ${message}`);
};

const app = process.env.npm_config_app || 'meetingV2';

const server = require(protocol).createServer(options, async (request, response) => {
  log(`${request.method} ${request.url} BEGIN`);
  compression({})(request, response, () => {});
  try {
    if (
      request.method === 'GET' &&
      (request.url === '/' || request.url === '/v2/' || request.url.startsWith('/?'))
    ) {
      response.statusCode = 200;
      response.setHeader('Content-Type', 'text/html');
      response.end(fs.readFileSync(`dist/${app}.html`));
    } else if (request.method === 'POST' && request.url.startsWith('/join?')) {
      const query = url.parse(request.url, true).query;
      const title = query.title;
      const name = query.name;
      if (!meetingCache[title]) {
        meetingCache[title] = await chime
          .createMeeting({
            ClientRequestToken: uuid(),
            // NotificationsConfiguration: {
            //   SqsQueueArn: 'Paste your arn here',
            //   SnsTopicArn: 'Paste your arn here'
            // }
          })
          .promise();
        attendeeCache[title] = {};
      }
      const joinInfo = {
        JoinInfo: {
          Title: title,
          Meeting: meetingCache[title].Meeting,
          Attendee: (
            await chime
              .createAttendee({
                MeetingId: meetingCache[title].Meeting.MeetingId,
                ExternalUserId: uuid(),
              })
              .promise()
          ).Attendee,
        },
      };
      attendeeCache[title][joinInfo.JoinInfo.Attendee.AttendeeId] = name;
      response.statusCode = 201;
      response.setHeader('Content-Type', 'application/json');
      response.write(JSON.stringify(joinInfo), 'utf8');
      response.end();
      log(JSON.stringify(joinInfo, null, 2));
    } else if (request.method === 'GET' && request.url.startsWith('/attendee?')) {
      const query = url.parse(request.url, true).query;
      const attendeeInfo = {
        AttendeeInfo: {
          AttendeeId: query.attendee,
          Name: attendeeCache[query.title][query.attendee],
        },
      };
      response.statusCode = 200;
      response.setHeader('Content-Type', 'application/json');
      response.write(JSON.stringify(attendeeInfo), 'utf8');
      response.end();
      log(JSON.stringify(attendeeInfo, null, 2));
    } else if (request.method === 'POST' && request.url.startsWith('/meeting?')) {
      const query = url.parse(request.url, true).query;
      const title = query.title;
      if (!meetingCache[title]) {
        meetingCache[title] = await chime
          .createMeeting({
            ClientRequestToken: uuid(),
            // NotificationsConfiguration: {
            //   SqsQueueArn: 'Paste your arn here',
            //   SnsTopicArn: 'Paste your arn here'
            // }
          })
          .promise();
        attendeeCache[title] = {};
      }
      const joinInfo = {
        JoinInfo: {
          Title: title,
          Meeting: meetingCache[title].Meeting,
        },
      };
      response.statusCode = 201;
      response.setHeader('Content-Type', 'application/json');
      response.write(JSON.stringify(joinInfo), 'utf8');
      response.end();
      log(JSON.stringify(joinInfo, null, 2));
    } else if (request.method === 'POST' && request.url.startsWith('/end?')) {
      const query = url.parse(request.url, true).query;
      const title = query.title;
      await chime
        .deleteMeeting({
          MeetingId: meetingCache[title].Meeting.MeetingId,
        })
        .promise();
      response.statusCode = 200;
      response.end();
    } else if (request.method === 'POST' && request.url.startsWith('/logs')) {
      console.log('Writing logs to cloudwatch');
      response.end('Writing logs to cloudwatch');
    } else {
      response.statusCode = 404;
      response.setHeader('Content-Type', 'text/plain');
      response.end('404 Not Found');
    }
  } catch (err) {
    log(`server caught error: ${err}`);
    response.statusCode = 403;
    response.setHeader('Content-Type', 'application/json');
    response.write(JSON.stringify({ error: err.message }), 'utf8');
    response.end();
  }
  log(`${request.method} ${request.url} END`);
});

server.listen(port, hostname, () => {
  log(`server running at ${protocol}://${hostname}:${port}/`);
});
