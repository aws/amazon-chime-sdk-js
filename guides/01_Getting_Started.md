### Getting Started

This guide explains how to create a meeting, add an attendee to that meeting, and use the returned information to join a meeting application to the meeting and send and receive audio. This guide assumes you have:
- A meeting service responsible for creating and managing meetings and their attendees.
- A meeting application that communicates with the meeting service to receive meeting and attendee information which it uses to join the meeting.

#### Meeting Service

In your meeting service, create an AWS SDK Chime object. You must currently use
`us-east-1` as the region (you can select a MediaRegion in the following step).
The following example assumes your meeting service uses the AWS SDK for JavaScript
following an async/await pattern and that the Chime object has credentials for a
role with a policy that allows
[chime:CreateMeeting](https://docs.aws.amazon.com/chime/latest/APIReference/API_CreateMeeting.html) and
[chime:CreateAttendee](https://docs.aws.amazon.com/chime/latest/APIReference/API_CreateAttendee.html):

```javascript
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const chime = new AWS.Chime({region: 'us-east-1'});
```

Create a meeting using the `chime` object:

```javascript
const requestId = uuidv4();
const region = 'us-west-2'; // specify media placement region
try {
  const meeting = await chime.createMeeting({
    ClientRequestToken: requestId,
    MediaRegion: region,
  }).promise();
} catch (err) {
  // handle error - you can retry with the same requestId
}
const meetingId = meeting.Meeting.MeetingId; // meeting ID of the new meeting
```

Now create an attendee on the meeting:

```javascript
const externalUserId = uuidv4(); // or string ID you want to associate with the user
try {
  const attendee = await chime.createAttendee({
    MeetingId: meetingId,
    ExternalUserId: externalUserId,
  });
} catch (err) {
  // handle error - you can retry with the same externalUserId
}
const attendeeId = attendee.Attendee.AttendeeId // attendee ID of new attendee
```

Now securely transfer the `meeting` and `attendee` objects (e.g. in JSON) to your meeting application. These objects contain all the information needed for a
meeting application using the Amazon Chime SDK for JavaScript to join the meeting.

#### Meeting Application

Using the `meeting` and `attendee` objects supplied by the meeting service, create a new logger, device controller, meeting session configuration, and meeting session:

```javascript
import {
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  LogLevel,
  MeetingSessionConfiguration,
} from 'amazon-chime-sdk-js';
const logger = new ConsoleLogger('ChimeMeetingLogs', LogLevel.INFO);
const deviceController = new DefaultDeviceController(logger);
const configuration = new MeetingSessionConfiguration(meeting, attendee);
const meetingSession = new DefaultMeetingSession(configuration, logger, deviceController);
```

The meeting session as an audio-video API interface `meetingSession.audioVideo` with most of the control surface you will use for managing the meeting session. See [here](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html) for a list of methods you can use. Now select an audio device. In this example, you will select the first device, which usually represents the system default.

```javascript
try {
  const audioInputs = await meetingSession.audioVideo.listAudioInputDevices();
  await meetingSession.audioVideo.chooseAudioInputDevice(audioInputs[0].deviceId);
} catch (err) {
  // handle error - unable to acquire audio device perhaps due to permissions blocking
}
```

To hear audio from remote participants you will need to *bind* to an `<audio>` element on
your webpage (it can be hidden with `display:none`).

```javascript
const audioOutputElement = document.getElementById('<your-audio-element-id>');
meetingSession.audioVideo.bindAudioElement(audioOutputElement);
```

Now start the session:

```javascript
meetingSession.audioVideo.start();
```

At this point if you have two meeting applications with different attendees, they should
now be able to hear each other.

#### Next Steps

- Implement [AudioVideoObserver](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html). Add an instance of the observer using the [addObserver](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#addobserver) method so you can receive events.
- Use the `realtime` methods to handle audio control such as muting, unmuting, receiving attendee presence events, and receiving volume indicators for remote participants.
