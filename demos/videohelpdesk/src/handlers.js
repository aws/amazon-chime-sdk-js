const AWS = require('aws-sdk');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const ddb = new AWS.DynamoDB();
const chime = new AWS.Chime({ region: 'us-east-1' });
chime.endpoint = new AWS.Endpoint('https://service.chime.aws.amazon.com/console');

exports.website = async (event, context, callback) => {
  return serveWebpage(callback, './website.html');
};

exports.helpDesk = async (event, context, callback) => {
  return serveWebpage(callback, './helpdesk.html');
};

exports.createTicket = async (event, context, callback) => {
  if (!event.queryStringParameters || !event.queryStringParameters.CustomerName) {
    return reply(callback, 400, {Error: 'Must provide CustomerName query parameter'});
  }

  const meeting = await chime.createMeeting({
    ClientRequestToken: uuidv4(),
    MediaRegion: 'us-east-1',
  }).promise();

  const meetingId = meeting.Meeting.MeetingId;

  const customerAttendee = await chime.createAttendee({
    MeetingId: meetingId,
    ExternalUserId: uuidv4(),
  }).promise();

  const helpDeskAttendee = await chime.createAttendee({
    MeetingId: meetingId,
    ExternalUserId: uuidv4(),
  }).promise();

  const ticketId = uuidv4();

  await ddb.putItem({
    Item: {
      'TicketId': { S: ticketId },
      'CreatedOnDate': {S: (new Date()).toISOString() },
      'Meeting': { S: JSON.stringify(meeting) },
      'MeetingId': { S: meetingId },
      'CustomerName': { S: event.queryStringParameters.CustomerName },
      'CustomerAttendee': { S: JSON.stringify(customerAttendee) },
      'HelpDeskAttendee': { S: JSON.stringify(helpDeskAttendee) },
      'TTL': { N: `${Math.floor(Date.now() / 1000) + 86400}` },
    },
    TableName: process.env.TICKETS_TABLE_NAME,
  }).promise();

  return reply(callback, 201, {
    TicketId: ticketId,
    Meeting: meeting,
    CustomerAttendee: customerAttendee,
  });
};

exports.getTickets = async (event, context, callback) => {
  return reply(callback, 200, (await ddb.scan({
    TableName: process.env.TICKETS_TABLE_NAME,
  }).promise()).Items.sort((a, b) => {
    if (a.CreatedOnDate.S < b.CreatedOnDate.S) return -1;
    if (a.CreatedOnDate.S > b.CreatedOnDate.S) return 1;
    return 0;
  }).map(item => {
    return {
      TicketId: item.TicketId.S,
      CreatedOnDate: item.CreatedOnDate.S,
      CustomerName: item.CustomerName.S,
    };
  }));
};

exports.getTicket = async (event, context, callback) => {
  if (!event.queryStringParameters || !event.queryStringParameters.TicketId) {
    return reply(callback, 400, {Error: 'Must provide TicketId query parameter'});
  }

  const ticketId = event.queryStringParameters.TicketId;

  let item;
  try {
    result = await ddb.getItem({
      Key: { TicketId: { S: ticketId, }, },
      TableName: process.env.TICKETS_TABLE_NAME,
    }).promise();
    item = result.Item;
    if (!item) {
      throw new Error('TicketId not found');
    }
  } catch (err) {
    return reply(callback, 404, {Error: `TicketId does not exist: ${ticketId}`});
  }

  const meetingId = item.MeetingId.S;
  try {
    await chime.getMeeting({
      MeetingId: meetingId
    }).promise();
  } catch (err) {
    await ddb.deleteItem({
      Key: { TicketId: { S: ticketId, }, },
      TableName: process.env.TICKETS_TABLE_NAME,
    }).promise();
    return reply(callback, 404, {Error: `Meeting no longer exists for TicketId: ${ticketId}`});
  }

  return reply(callback, 200, {
    TicketId: item.TicketId.S,
    CreatedOnDate: item.CreatedOnDate.S,
    Meeting: JSON.parse(item.Meeting.S).Meeting,
    CustomerName: item.CustomerName.S,
    HelpDeskAttendee: JSON.parse(item.HelpDeskAttendee.S).Attendee,
  });
};

exports.deleteTicket = async (event, context, callback) => {
  if (!event.queryStringParameters || !event.queryStringParameters.TicketId) {
    return reply(callback, 400, {Error: 'Must provide TicketId query parameter'});
  }

  const ticketId = event.queryStringParameters.TicketId;

  let item;
  try {
    result = await ddb.getItem({
      Key: { TicketId: { S: ticketId, }, },
      TableName: process.env.TICKETS_TABLE_NAME,
    }).promise();
    item = result.Item;
    if (!item) {
      throw new Error('TicketId not found');
    }
  } catch (err) {
    return reply(callback, 404, {Error: `TicketId does not exist: ${ticketId}`});
  }

  const meetingId = item.MeetingId.S;
  await ddb.deleteItem({
    Key: { TicketId: { S: ticketId, }, },
    TableName: process.env.TICKETS_TABLE_NAME,
  }).promise();

  await chime.deleteMeeting({
    MeetingId: meetingId,
  }).promise();

  return reply(callback, 200, {
    TicketId: ticketId,
  });
};

function reply(callback, statusCode, result) {
  callback(null, {
    statusCode: statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result, '', 2) + '\n',
    isBase64Encoded: false
  });
}

function serveWebpage(callback, page) {
  callback(null, {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html' },
    body: fs.readFileSync(page, { encoding: 'utf8' }),
    isBase64Encoded: false
  });
}
