# Event Ingestion

We send the [Amazon Chime SDK meeting events](https://aws.github.io/amazon-chime-sdk-js/modules/meetingevents.html#meeting-events-and-attributes) to the Amazon Chime backend to analyze meeting health trends or identify common failures. This helps to improve your meeting experience.

- [Event Ingestion](#event-ingestion)
  - [Sensitive attributes](#sensitive-attributes)
  - [Opt out of Event Ingestion](#opt-out-of-event-ingestion)

## Sensitive attributes

The Amazon Chime SDK for JavaScript will not send below sensitive attributes to the Amazon Chime backend.

|Attribute|Description
|--|--
|`externalMeetingId`|The Amazon Chime SDK external meeting ID.
|`externalUserId`|The Amazon Chime SDK external user ID that can indicate an identity managed by your application.

## Opt out of Event Ingestion
   
Event ingestion is enabled for clients using [AWS SDK v2.934.0](https://github.com/aws/aws-sdk-js/blob/master/CHANGELOG.md#29340) and above. To opt out of event ingestion, provide `NoOpEventReporter` to `DefaultMeetingSession` while creating the meeting session.

```js
import {
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  LogLevel,
  MeetingSessionConfiguration,
  NoOpEventReporter,
  EventReporter,
  DefaultEventController
} from 'amazon-chime-sdk-js';

const logger = new ConsoleLogger('MyLogger', LogLevel.INFO);
const deviceController = new DefaultDeviceController(logger);

// You need responses from server-side Chime API. See below for details.
const meetingResponse = // The response from the CreateMeeting API action.
const attendeeResponse = // The response from the CreateAttendee or BatchCreateAttendee API action.
const configuration = new MeetingSessionConfiguration(meetingResponse, attendeeResponse);

// Use NoOpEventReporter to opt-out of event ingestion.
const eventReporter = new NoOpEventReporter();

const meetingSession = new DefaultMeetingSession(
  configuration,
  logger,
  deviceController,
  new DefaultEventController(configuration, logger, eventReporter)
);
```