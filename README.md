# Amazon Chime SDK for JavaScript

<a href="https://www.npmjs.com/package/amazon-chime-sdk-js"><img src="https://img.shields.io/npm/v/amazon-chime-sdk-js?style=flat-square"></a>
<a href="https://github.com/aws/amazon-chime-sdk-js/actions?query=workflow%3A%22CI+Workflow%22"><img src="https://github.com/aws/amazon-chime-sdk-js/workflows/CI%20Workflow/badge.svg"></a>
<a href="https://github.com/aws/amazon-chime-sdk-js/actions?query=workflow%3A%22Deploy+Demo+App+Workflow%22"><img src="https://github.com/aws/amazon-chime-sdk-js/workflows/Deploy%20Demo%20App%20Workflow/badge.svg"></a>
### Build video calling, audio calling, and screen sharing applications powered by Amazon Chime.

The Amazon Chime SDK makes it easy to add collaborative audio calling,
video calling, and screen share features to web applications by using
the same infrastructure services that power millions of Amazon Chime
online meetings.

This Amazon Chime SDK for JavaScript works by connecting to meeting session
resources that you have created in your AWS account. The SDK has everything
you need to build custom calling and collaboration experiences in your
web application, including methods to: configure meeting sessions, list and
select audio and video devices, start and stop screen share and screen share
viewing, receive callbacks when media events occur such as volume changes, and
control meeting features such as audio mute and video tile bindings.

To get started, see the following resources:

* [Amazon Chime](https://aws.amazon.com/chime)
* [Amazon Chime SDK Security](https://aws.amazon.com/blogs/business-productivity/understanding-security-in-the-amazon-chime-application-and-sdk/)
* [Amazon Chime SDK Pricing](https://aws.amazon.com/chime/pricing/#Chime_SDK_)
* [Amazon Chime SDK for JavaScript Supported Browsers](https://docs.aws.amazon.com/chime/latest/dg/meetings-sdk.html#mtg-browsers)
* [Amazon Chime SDK Technical Blogs](https://aws.amazon.com/blogs/business-productivity/tag/amazon-chime-sdk/)
* [Amazon Chime SDK Developer Guide](https://docs.aws.amazon.com/chime/latest/dg/meetings-sdk.html)
* [Amazon Chime SDK API Reference](https://docs.aws.amazon.com/chime/latest/APIReference/Welcome.html)
* [Amazon Chime SDK for JavaScript Documentation](https://aws.github.io/amazon-chime-sdk-js)

And review the following guides:

* [Getting Started](https://aws.github.io/amazon-chime-sdk-js/modules/gettingstarted.html)
* [API Overview](https://aws.github.io/amazon-chime-sdk-js/modules/apioverview.html)
* [Content Share](https://aws.github.io/amazon-chime-sdk-js/modules/contentshare.html)
* [Quality, Bandwidth, and Connectivity](https://aws.github.io/amazon-chime-sdk-js/modules/qualitybandwidth_connectivity.html)
* [Simulcast](https://aws.github.io/amazon-chime-sdk-js/modules/simulcast.html)
* [Meeting events](https://aws.github.io/amazon-chime-sdk-js/modules/meetingevents.html)
* [Frequently Asked Questions](https://aws.github.io/amazon-chime-sdk-js/modules/faqs.html)
* [Migrating from v1.0 to v2.0](https://aws.github.io/amazon-chime-sdk-js/modules/migrationto_2_0.html)
* [Integrating Amazon Voice Focus into your application](https://aws.github.io/amazon-chime-sdk-js/modules/amazonvoice_focus.html)
* [Adding frame-by-frame processing to an outgoing video stream](https://github.com/aws/amazon-chime-sdk-js/blob/master/guides/10_Video_Processor.md)

## Examples

- [Meeting Demo](https://github.com/aws/amazon-chime-sdk-js/tree/master/demos/browser) - A browser
 meeting application with a local server
- [Serverless Meeting Demo](https://github.com/aws/amazon-chime-sdk-js/tree/master/demos/serverless) - A self-contained serverless meeting application
- [Video Help Desk](https://github.com/aws/amazon-chime-sdk-js/tree/master/demos/videohelpdesk) - A tutorial that shows how to build a website widget that allows a customer to make a video call to a help desk
- [Single JS](https://github.com/aws/amazon-chime-sdk-js/tree/master/demos/singlejs) - A script to bundle the SDK into a single `.js` file
- [Recording Demo](https://github.com/aws-samples/amazon-chime-sdk-recording-demo) - Recording the meeting's audio, video and screen share in high definition
- [Virtual Classroom](https://github.com/aws-samples/amazon-chime-sdk-classroom-demo) - An online classroom built with Electron and React
- [Live Events](https://github.com/aws-samples/amazon-chime-live-events) - Interactive live events solution
- [PSTN Integration](https://github.com/aws-samples/amazon-chime-sdk-pstn-integration) - Integrating PSTN callers with Amazon Chime SDK meetings
- [React Components and Demo](https://github.com/aws/amazon-chime-sdk-component-library-react) - A component library for building meetings

## Installation

Make sure you have Node.js version 10 or higher. Node 14 is recommended and supported.

To add the Amazon Chime SDK for JavaScript into an existing application,
install the package directly from npm:

```
npm install amazon-chime-sdk-js --save
```

Note that the Amazon Chime SDK for JavaScript targets ES2015, which is fully compatible with
all supported browsers.

## Setup

### Meeting session
Create a meeting session in your client application.

```js
import {
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  LogLevel,
  MeetingSessionConfiguration
} from 'amazon-chime-sdk-js';

const logger = new ConsoleLogger('MyLogger', LogLevel.INFO);
const deviceController = new DefaultDeviceController(logger);

// You need responses from server-side Chime API. See below for details.
const meetingResponse = /* The response from the CreateMeeting API action */;
const attendeeResponse = /* The response from the CreateAttendee or BatchCreateAttendee API action */;
const configuration = new MeetingSessionConfiguration(meetingResponse, attendeeResponse);

// In the usage examples below, you will use this meetingSession object.
const meetingSession = new DefaultMeetingSession(
  configuration,
  logger,
  deviceController
);
```

#### Getting responses from your server application

You can use an AWS SDK, the AWS Command Line Interface (AWS CLI), or the REST API
to make API calls. In this section, you will use the AWS SDK for JavaScript in your server application, e.g. Node.js.
See [Amazon Chime SDK API Reference](https://docs.aws.amazon.com/chime/latest/APIReference/Welcome.html) for more information.

> ⚠️ The server application does not require the Amazon Chime SDK for JavaScript.

```js
const AWS = require('aws-sdk');
const { v4: uuid } = require('uuid');

// You must use "us-east-1" as the region for Chime API and set the endpoint.
const chime = new AWS.Chime({ region: 'us-east-1' });
chime.endpoint = new AWS.Endpoint('https://service.chime.aws.amazon.com');

const meetingResponse = await chime.createMeeting({
  ClientRequestToken: uuid(),
  MediaRegion: 'us-west-2' // Specify the region in which to create the meeting.
}).promise();

const attendeeResponse = await chime.createAttendee({
  MeetingId: meetingResponse.Meeting.MeetingId,
  ExternalUserId: uuid() // Link the attendee to an identity managed by your application.
}).promise();
```

Now securely transfer the `meetingResponse` and `attendeeResponse` objects to your client application.
These objects contain all the information needed for a client application using the Amazon Chime SDK for JavaScript to join the meeting.

The value of the MediaRegion parameter in the createMeeting() should ideally be set to the one of the media regions which is closest to the user creating a meeting. An implementation can be found under the topic 'Choosing the nearest media Region' in the [Amazon Chime SDK Media Regions documentation](https://docs.aws.amazon.com/chime/latest/dg/chime-sdk-meetings-regions.html).

### Messaging session
Create a messaging session in your client application to receive messages from Amazon Chime SDK for Messaging.
```js
import * as AWS from 'aws-sdk/global';
import * as Chime from 'aws-sdk/clients/chime';

import {
  ConsoleLogger,
  DefaultMessagingSession,
  LogLevel,
  MessagingSessionConfiguration,
} from 'amazon-chime-sdk-js';

const logger = new ConsoleLogger('SDK', LogLevel.INFO);
const chime = new Chime({ region: 'us-east-1' });
const endpoint = await chime.getMessagingSessionEndpoint().promise();

const userArn = /* The userArn */;
const sessionId = /* The sessionId */;
const configuration = new MessagingSessionConfiguration(userArn, sessionId, endpoint.Endpoint.Url, chime, AWS);
const messagingSession = new DefaultMessagingSession(configuration, logger);
```
## Building and testing

```
git fetch --tags https://github.com/aws/amazon-chime-sdk-js
npm run build
npm run test
```

After running `npm run test` the first time, you can use `npm run test:fast` to
speed up the test suite.

Tags are fetched in order to correctly generate versioning metadata.

To view code coverage results open `coverage/index.html` in your browser
after running `npm run test`.

## Generating the documentation

To generate JavaScript API reference documentation run:

```
npm run build
npm run doc
```

Then open `docs/index.html` in your browser.

## Reporting a suspected vulnerability

If you discover a potential security issue in this project we ask that you notify AWS/Amazon Security via our
[vulnerability reporting page](https://aws.amazon.com/security/vulnerability-reporting/).
Please do **not** create a public GitHub issue.

## Usage

- [Device](#device)
- [Starting a session](#starting-a-session)
- [Audio](#audio)
- [Video](#video)
- [Screen and content share](#screen-and-content-share)
- [Attendees](#attendees)
- [Monitoring and alerts](#monitoring-and-alerts)
- [Stopping a session](#stopping-a-session)
- [Meeting readiness checker](#meeting-readiness-checker)
- [Selecting an Audio Profile](#selecting-an-audio-profile)
- [Starting a Messaging Session](#starting-a-messaging-session)

### Device

> Note: Before starting a session, you need to choose your microphone, speaker, and camera.

**Use case 1.** List audio input, audio output, and video input devices. The browser will ask for microphone and camera permissions.

```js
const audioInputDevices = await meetingSession.audioVideo.listAudioInputDevices();
const audioOutputDevices = await meetingSession.audioVideo.listAudioOutputDevices();
const videoInputDevices = await meetingSession.audioVideo.listVideoInputDevices();

// An array of MediaDeviceInfo objects
audioInputDevices.forEach(mediaDeviceInfo => {
  console.log(`Device ID: ${mediaDeviceInfo.deviceId} Microphone: ${mediaDeviceInfo.label}`);
});
```

**Use case 2.** Choose audio input and audio output devices by passing the `deviceId` of a `MediaDeviceInfo` object.

```js
const audioInputDeviceInfo = /* An array item from meetingSession.audioVideo.listAudioInputDevices */;
await meetingSession.audioVideo.chooseAudioInputDevice(audioInputDeviceInfo.deviceId);

const audioOutputDeviceInfo = /* An array item from meetingSession.audioVideo.listAudioOutputDevices */;
await meetingSession.audioVideo.chooseAudioOutputDevice(audioOutputDeviceInfo.deviceId);
```

**Use case 3.** Choose a video input device by passing the `deviceId` of a `MediaDeviceInfo` object.

If there is an LED light next to the attendee's camera, it will be turned on indicating that it is now capturing from the camera.
You probably want to choose a video input device when you start sharing your video.

```js
const videoInputDeviceInfo = /* An array item from meetingSession.audioVideo.listVideoInputDevices */;
await meetingSession.audioVideo.chooseVideoInputDevice(videoInputDeviceInfo.deviceId);

// You can pass null to choose none. If the previously chosen camera has an LED light on,
// it will turn off indicating the camera is no longer capturing.
await meetingSession.audioVideo.chooseVideoInputDevice(null);
```

**Use case 4.** Add a device change observer to receive the updated device list.
For example, when you pair Bluetooth headsets with your computer, `audioInputsChanged` and `audioOutputsChanged` are called
with the device list including headsets.

```js
const observer = {
  audioInputsChanged: freshAudioInputDeviceList => {
    // An array of MediaDeviceInfo objects
    freshAudioInputDeviceList.forEach(mediaDeviceInfo => {
      console.log(`Device ID: ${mediaDeviceInfo.deviceId} Microphone: ${mediaDeviceInfo.label}`);
    });
  },
  audioOutputsChanged: freshAudioOutputDeviceList => {
    console.log('Audio outputs updated: ', freshAudioOutputDeviceList);
  },
  videoInputsChanged: freshVideoInputDeviceList => {
    console.log('Video inputs updated: ', freshVideoInputDeviceList);
  }
};

meetingSession.audioVideo.addDeviceChangeObserver(observer);
````

### Starting a session

**Use case 5.** Start a session. To hear audio, you need to bind a device and stream to an `<audio>` element.
Once the session has started, you can talk and listen to attendees.
Make sure you have chosen your microphone and speaker (See the "Device" section), and at least one other attendee has joined the session.

```js
const audioElement = /* HTMLAudioElement object e.g. document.getElementById('audio-element-id') */;
meetingSession.audioVideo.bindAudioElement(audioElement);

const observer = {
  audioVideoDidStart: () => {
    console.log('Started');
  }
};

meetingSession.audioVideo.addObserver(observer);

meetingSession.audioVideo.start();
```

**Use case 6.** Add an observer to receive session lifecycle events: connecting, start, and stop.

> Note: You can remove an observer by calling `meetingSession.audioVideo.removeObserver(observer)`.
In a component-based architecture (such as React, Vue, and Angular), you may need to add an observer
when a component is mounted, and remove it when unmounted.

```js
const observer = {
  audioVideoDidStart: () => {
    console.log('Started');
  },
  audioVideoDidStop: sessionStatus => {
    // See the "Stopping a session" section for details.
    console.log('Stopped with a session status code: ', sessionStatus.statusCode());
  },
  audioVideoDidStartConnecting: reconnecting => {
    if (reconnecting) {
      // e.g. the WiFi connection is dropped.
      console.log('Attempting to reconnect');
    }
  }
};

meetingSession.audioVideo.addObserver(observer);
```

### Audio

> Note: So far, you've added observers to receive device and session lifecycle events.
In the following use cases, you'll use the real-time API methods to send and receive volume indicators and control mute state.

**Use case 7.** Mute and unmute an audio input.

```js
// Mute
meetingSession.audioVideo.realtimeMuteLocalAudio();

// Unmute
const unmuted = meetingSession.audioVideo.realtimeUnmuteLocalAudio();
if (unmuted) {
  console.log('Other attendees can hear your audio');
} else {
  // See the realtimeSetCanUnmuteLocalAudio use case below.
  console.log('You cannot unmute yourself');
}
```

**Use case 8.** To check whether the local microphone is muted, use this method rather than keeping track of your own mute state.

```js
const muted = meetingSession.audioVideo.realtimeIsLocalAudioMuted();
if (muted) {
  console.log('You are muted');
} else {
  console.log('Other attendees can hear your audio');
}
```

**Use case 9.** Disable unmute. If you want to prevent users from unmuting themselves (for example during a presentation), use these methods rather than keeping track of your own can-unmute state.

```js
meetingSession.audioVideo.realtimeSetCanUnmuteLocalAudio(false);

// Optional: Force mute.
meetingSession.audioVideo.realtimeMuteLocalAudio();

const unmuted = meetingSession.audioVideo.realtimeUnmuteLocalAudio();
console.log(`${unmuted} is false. You cannot unmute yourself`)
```

**Use case 10.** Subscribe to volume changes of a specific attendee. You can use this to build a real-time volume indicator UI.

```js
import { DefaultModality } from 'amazon-chime-sdk-js';

// This is your attendee ID. You can also subscribe to another attendee's ID.
// See the "Attendees" section for an example on how to retrieve other attendee IDs
// in a session.
const presentAttendeeId = meetingSession.configuration.credentials.attendeeId;

meetingSession.audioVideo.realtimeSubscribeToVolumeIndicator(
  presentAttendeeId,
  (attendeeId, volume, muted, signalStrength) => {
    const baseAttendeeId = new DefaultModality(attendeeId).base();
    if (baseAttendeeId !== attendeeId) {
      // See the "Screen and content share" section for details.
      console.log(`The volume of ${baseAttendeeId}'s content changes`);
    }

    // A null value for any field means that it has not changed.
    console.log(`${attendeeId}'s volume data: `, {
      volume, // a fraction between 0 and 1
      muted, // a boolean
      signalStrength // 0 (no signal), 0.5 (weak), 1 (strong)
    });
  }
);
```

**Use case 11.** Subscribe to mute or signal strength changes of a specific attendee. You can use this to build UI for only mute or only signal strength changes.

```js
// This is your attendee ID. You can also subscribe to another attendee's ID.
// See the "Attendees" section for an example on how to retrieve other attendee IDs
// in a session.
const presentAttendeeId = meetingSession.configuration.credentials.attendeeId;

// To track mute changes
meetingSession.audioVideo.realtimeSubscribeToVolumeIndicator(
  presentAttendeeId,
  (attendeeId, volume, muted, signalStrength) => {
    // A null value for volume, muted and signalStrength field means that it has not changed.
    if (muted === null) {
      // muted state has not changed, ignore volume and signalStrength changes
      return;
    }

    // mute state changed
    console.log(`${attendeeId}'s mute state changed: `, {
      muted, // a boolean
    });
  }
);

// To track signal strength changes
meetingSession.audioVideo.realtimeSubscribeToVolumeIndicator(
  presentAttendeeId,
  (attendeeId, volume, muted, signalStrength) => {
    // A null value for volume, muted and signalStrength field means that it has not changed.
    if (signalStrength === null) {
      // signalStrength has not changed, ignore volume and muted changes
      return;
    }

    // signal strength changed
    console.log(`${attendeeId}'s signal strength changed: `, {
      signalStrength // 0 (no signal), 0.5 (weak), 1 (strong)
    });
  }
);
```

**Use case 12.** Detect the most active speaker. For example, you can enlarge the active speaker's video element if available.

```js
import { DefaultActiveSpeakerPolicy } from 'amazon-chime-sdk-js';

const activeSpeakerCallback = attendeeIds => {
  if (attendeeIds.length) {
    console.log(`${attendeeIds[0]} is the most active speaker`);
  }
};

meetingSession.audioVideo.subscribeToActiveSpeakerDetector(
  new DefaultActiveSpeakerPolicy(),
  activeSpeakerCallback
);
````

### Video

> Note: In Chime SDK terms, a video tile is an object containing an attendee ID,
a video stream, etc. To view a video in your application, you must bind a tile to a `<video>` element.
> - Make sure you bind a tile to the same video element until the tile is removed.
> - A local video tile can be identified using `localTile` property.
> - A tile is created with a new tile ID when the same remote attendee restarts the video.

**Use case 13.** Start sharing your video. The local video element is flipped horizontally (mirrored mode).

```js
const videoElement = /* HTMLVideoElement object e.g. document.getElementById('video-element-id') */;

// Make sure you have chosen your camera. In this use case, you will choose the first device.
const videoInputDevices = await meetingSession.audioVideo.listVideoInputDevices();

// The camera LED light will turn on indicating that it is now capturing.
// See the "Device" section for details.
await meetingSession.audioVideo.chooseVideoInputDevice(videoInputDevices[0].deviceId);

const observer = {
  // videoTileDidUpdate is called whenever a new tile is created or tileState changes.
  videoTileDidUpdate: tileState => {
    // Ignore a tile without attendee ID and other attendee's tile.
    if (!tileState.boundAttendeeId || !tileState.localTile) {
      return;
    }

    meetingSession.audioVideo.bindVideoElement(tileState.tileId, videoElement);
  }
};

meetingSession.audioVideo.addObserver(observer);

meetingSession.audioVideo.startLocalVideoTile();
```

**Use case 14.** Stop sharing your video.

```js
const videoElement = /* HTMLVideoElement object e.g. document.getElementById('video-element-id') */;

let localTileId = null;
const observer = {
  videoTileDidUpdate: tileState => {
    // Ignore a tile without attendee ID and other attendee's tile.
    if (!tileState.boundAttendeeId || !tileState.localTile) {
      return;
    }

    // videoTileDidUpdate is also invoked when you call startLocalVideoTile or tileState changes.
    // The tileState.active can be false in poor Internet connection, when the user paused the video tile, or when the video tile first arrived.
    console.log(`If you called stopLocalVideoTile, ${tileState.active} is false.`);
    meetingSession.audioVideo.bindVideoElement(tileState.tileId, videoElement);
    localTileId = tileState.tileId;
  },
  videoTileWasRemoved: tileId => {
    if (localTileId === tileId) {
      console.log(`You called removeLocalVideoTile. videoElement can be bound to another tile.`);
      localTileId = null;
    }
  }
};

meetingSession.audioVideo.addObserver(observer);

meetingSession.audioVideo.stopLocalVideoTile();

// Optional: You can remove the local tile from the session.
meetingSession.audioVideo.removeLocalVideoTile();
```

**Use case 15.** View one attendee video, e.g. in a 1-on-1 session.

```js
const videoElement = /* HTMLVideoElement object e.g. document.getElementById('video-element-id') */;

const observer = {
  // videoTileDidUpdate is called whenever a new tile is created or tileState changes.
  videoTileDidUpdate: tileState => {
    // Ignore a tile without attendee ID, a local tile (your video), and a content share.
    if (!tileState.boundAttendeeId || tileState.localTile || tileState.isContent) {
      return;
    }

    meetingSession.audioVideo.bindVideoElement(tileState.tileId, videoElement);
  }
};

meetingSession.audioVideo.addObserver(observer);
```

**Use case 16.** View up to 16 attendee videos. Assume that you have 16 video elements in your application,
and that an empty cell means it's taken.

```js
/*
  No one is sharing video               e.g. 9 attendee videos (9 empty cells)

  Next available:                       Next available:
  videoElements[0]                      videoElements[7]
  ╔════╦════╦════╦════╗                 ╔════╦════╦════╦════╗
  ║  0 ║  1 ║  2 ║  3 ║                 ║    ║    ║    ║    ║
  ╠════╬════╬════╬════╣                 ╠════╬════╬════╬════╣
  ║  4 ║  5 ║  6 ║  7 ║                 ║    ║    ║    ║  7 ║
  ╠════╬════╬════╬════╣                 ╠════╬════╬════╬════╣
  ║  8 ║  9 ║ 10 ║ 11 ║                 ║  8 ║    ║ 10 ║    ║
  ╠════╬════╬════╬════╣                 ╠════╬════╬════╬════╣
  ║ 12 ║ 13 ║ 14 ║ 15 ║                 ║ 12 ║ 13 ║ 14 ║ 15 ║
  ╚════╩════╩════╩════╝                 ╚════╩════╩════╩════╝
 */
const videoElements = [/* an array of 16 HTMLVideoElement objects in your application */];

// index-tileId pairs
const indexMap = {};

const acquireVideoElement = tileId => {
  // Return the same video element if already bound.
  for (let i = 0; i < 16; i += 1) {
    if (indexMap[i] === tileId) {
      return videoElements[i];
    }
  }
  // Return the next available video element.
  for (let i = 0; i < 16; i += 1) {
    if (!indexMap.hasOwnProperty(i)) {
      indexMap[i] = tileId;
      return videoElements[i];
    }
  }
  throw new Error('no video element is available');
};

const releaseVideoElement = tileId => {
  for (let i = 0; i < 16; i += 1) {
    if (indexMap[i] === tileId) {
      delete indexMap[i];
      return;
    }
  }
};

const observer = {
  // videoTileDidUpdate is called whenever a new tile is created or tileState changes.
  videoTileDidUpdate: tileState => {
    // Ignore a tile without attendee ID, a local tile (your video), and a content share.
    if (!tileState.boundAttendeeId || tileState.localTile || tileState.isContent) {
      return;
    }

    meetingSession.audioVideo.bindVideoElement(
      tileState.tileId,
      acquireVideoElement(tileState.tileId)
    );
  },
  videoTileWasRemoved: tileId => {
    releaseVideoElement(tileId);
  }
};

meetingSession.audioVideo.addObserver(observer);
```

**Use case 17.** Add an observer to know all the remote video sources when changed.
```js
const observer = {
  remoteVideoSourcesDidChange: videoSources => {
    videoSources.forEach(videoSource => {
      const { attendee } = videoSource;
      console.log(`An attendee (${attendee.attendeeId} ${attendee.externalUserId}) is sending video`);
    });
  }
};

meetingSession.audioVideo.addObserver(observer);
```
You can also call below method to know all the remote video sources:
> Note: `getRemoteVideoSources` method is different from `getAllRemoteVideoTiles`,
`getRemoteVideoSources` returns all the remote video sources that are available to be viewed,
while `getAllRemoteVideoTiles` returns the ones that are actually being seen.
```js
const videoSources = meetingSession.audioVideo.getRemoteVideoSources();
videoSources.forEach(videoSource => {
  const { attendee } = videoSource;
  console.log(`An attendee (${attendee.attendeeId} ${attendee.externalUserId}) is sending video`);
});
```

### Screen and content share

> Note: When you or other attendees share content (a screen capture, a video file, or any other MediaStream object),
the content attendee (attendee-id#content) joins the session and shares content as if a regular attendee shares a video.
>
> For example, your attendee ID is "my-id". When you call `meetingSession.audioVideo.startContentShare`,
the content attendee "my-id#content" will join the session and share your content.

**Use case 18.** Start sharing your screen.

```js
import { DefaultModality } from 'amazon-chime-sdk-js';

const observer = {
  videoTileDidUpdate: tileState => {
    // Ignore a tile without attendee ID and videos.
    if (!tileState.boundAttendeeId || !tileState.isContent) {
      return;
    }

    const yourAttendeeId = meetingSession.configuration.credentials.attendeeId;

    // tileState.boundAttendeeId is formatted as "attendee-id#content".
    const boundAttendeeId = tileState.boundAttendeeId;

    // Get the attendee ID from "attendee-id#content".
    const baseAttendeeId = new DefaultModality(boundAttendeeId).base();
    if (baseAttendeeId === yourAttendeeId) {
      console.log('You called startContentShareFromScreenCapture');
    }
  },
  contentShareDidStart: () => {
    console.log('Screen share started');
  },
  contentShareDidStop: () => {
    // Chime SDK allows 2 simultaneous content shares per meeting.
    // This method will be invoked if two attendees are already sharing content
    // when you call startContentShareFromScreenCapture or startContentShare.
    console.log('Screen share stopped');
  }
};

meetingSession.audioVideo.addContentShareObserver(observer);
meetingSession.audioVideo.addObserver(observer);

// A browser will prompt the user to choose the screen.
const contentShareStream = await meetingSession.audioVideo.startContentShareFromScreenCapture();
```

If you want to display the content share stream for the sharer, you can bind the returned content share stream to a
 video element using `connectVideoStreamToVideoElement` from DefaultVideoTile.

```js
DefaultVideoTile.connectVideoStreamToVideoElement(contentShareStream, videoElement, false);
```

**Use case 19.** Start sharing your screen in an environment that does not support a screen picker dialog. e.g. Electron

```js
const sourceId = /* Window or screen ID e.g. the ID of a DesktopCapturerSource object in Electron */;

await meetingSession.audioVideo.startContentShareFromScreenCapture(sourceId);
```

**Use case 20.** Start streaming your video file from an `<input>` element of type `file`.

```js
const videoElement = /* HTMLVideoElement object e.g. document.getElementById('video-element-id') */;
const inputElement = /* HTMLInputElement object e.g. document.getElementById('input-element-id') */;

inputElement.addEventListener('change', async () => {
  const file = inputElement.files[0];
  const url = URL.createObjectURL(file);
  videoElement.src = url;
  await videoElement.play();

  const mediaSream = videoElement.captureStream(); /* use mozCaptureStream for Firefox e.g. videoElement.mozCaptureStream(); */
  await meetingSession.audioVideo.startContentShare(mediaSream);
  inputElement.value = '';
});
```

**Use case 21.** Stop sharing your screen or content.

```js
const observer = {
  contentShareDidStop: () => {
    console.log('Content share stopped');
  }
};

meetingSession.audioVideo.addContentShareObserver(observer);

await meetingSession.audioVideo.stopContentShare();
```

**Use case 22.** View up to 2 attendee content or screens. Chime SDK allows 2 simultaneous content shares per meeting.

```js
import { DefaultModality } from 'amazon-chime-sdk-js';

const videoElementStack = [/* an array of 2 HTMLVideoElement objects in your application */];

// tileId-videoElement map
const tileMap = {};

const observer = {
  videoTileDidUpdate: tileState => {
    // Ignore a tile without attendee ID and videos.
    if (!tileState.boundAttendeeId || !tileState.isContent) {
      return;
    }

    const yourAttendeeId = meetingSession.configuration.credentials.attendeeId;

    // tileState.boundAttendeeId is formatted as "attendee-id#content".
    const boundAttendeeId = tileState.boundAttendeeId;

    // Get the attendee ID from "attendee-id#content".
    const baseAttendeeId = new DefaultModality(boundAttendeeId).base();
    if (baseAttendeeId !== yourAttendeeId) {
      console.log(`${baseAttendeeId} is sharing screen now`);

      // Get the already bound video element if available, or use an unbound element.
      const videoElement = tileMap[tileState.tileId] || videoElementStack.pop();
      if (videoElement) {
        tileMap[tileState.tileId] = videoElement;
        meetingSession.audioVideo.bindVideoElement(tileState.tileId, videoElement);
      } else {
        console.log('No video element is available');
      }
    }
  },
  videoTileWasRemoved: tileId => {
    // Release the unused video element.
    const videoElement = tileMap[tileId];
    if (videoElement) {
      videoElementStack.push(videoElement);
      delete tileMap[tileId];
    }
  }
};

meetingSession.audioVideo.addObserver(observer);
```

### Attendees

**Use case 23.** Subscribe to attendee presence changes. When an attendee joins or leaves a session,
the callback receives `presentAttendeeId` and `present` (a boolean).

```js
const attendeePresenceSet = new Set();
const callback = (presentAttendeeId, present) => {
  console.log(`Attendee ID: ${presentAttendeeId} Present: ${present}`);
  if (present) {
    attendeePresenceSet.add(presentAttendeeId);
  } else {
    attendeePresenceSet.delete(presentAttendeeId);
  }
};

meetingSession.audioVideo.realtimeSubscribeToAttendeeIdPresence(callback);
```

**Use case 24.** Create a simple roster by subscribing to attendee presence and volume changes.

```js
import { DefaultModality } from 'amazon-chime-sdk-js';

const roster = {};

meetingSession.audioVideo.realtimeSubscribeToAttendeeIdPresence(
  (presentAttendeeId, present) => {
    if (!present) {
      delete roster[presentAttendeeId];
      return;
    }

    meetingSession.audioVideo.realtimeSubscribeToVolumeIndicator(
      presentAttendeeId,
      (attendeeId, volume, muted, signalStrength) => {
        const baseAttendeeId = new DefaultModality(attendeeId).base();
        if (baseAttendeeId !== attendeeId) {
          // Optional: Do not include the content attendee (attendee-id#content) in the roster.
          // See the "Screen and content share" section for details.
          return;
        }

        if (roster.hasOwnProperty(attendeeId)) {
          // A null value for any field means that it has not changed.
          roster[attendeeId].volume = volume; // a fraction between 0 and 1
          roster[attendeeId].muted = muted; // A booolean
          roster[attendeeId].signalStrength = signalStrength; // 0 (no signal), 0.5 (weak), 1 (strong)
        } else {
          // Add an attendee.
          // Optional: You can fetch more data, such as attendee name,
          // from your server application and set them here.
          roster[attendeeId] = {
            attendeeId,
            volume,
            muted,
            signalStrength
          };
        }
      }
    );
  }
);
```

### Monitoring and alerts

**Use case 25.** Add an observer to receive video metrics. See `AudioVideoObserver` for more available metrics,
such as WebRTC statistics processed by Chime SDK.

```js
const observer = {
  videoSendHealthDidChange: (bitrateKbps, packetsPerSecond) => {
    console.log(`Sending bitrate in kilobits per second: ${bitrateKbps} and ${packetsPerSecond}`);
  },
  videoSendBandwidthDidChange: (newBandwidthKbps, oldBandwidthKbps) => {
    console.log(`Sending bandwidth changed from ${oldBandwidthKbps} to ${newBandwidthKbps}`);
  },
  videoReceiveBandwidthDidChange: (newBandwidthKbps, oldBandwidthKbps) => {
    console.log(`Receiving bandwidth changed from ${oldBandwidthKbps} to ${newBandwidthKbps}`);
  }
};

meetingSession.audioVideo.addObserver(observer);
```

**Use case 26.** Add an observer to receive alerts. You can use these alerts to notify users of connection problems.

```js
const observer = {
  connectionDidBecomePoor: () => {
    console.log('Your connection is poor');
  },
  connectionDidSuggestStopVideo: () => {
    console.log('Recommend turning off your video');
  },
  videoSendDidBecomeUnavailable: () => {
    // Chime SDK allows a total of 16 simultaneous videos per meeting.
    // If you try to share more video, this method will be called.
    // See videoAvailabilityDidChange below to find out when it becomes available.
    console.log('You cannot share your video');
  },
  videoAvailabilityDidChange: videoAvailability => {
    // canStartLocalVideo will also be true if you are already sharing your video.
    if (videoAvailability.canStartLocalVideo) {
      console.log('You can share your video');
    } else {
      console.log('You cannot share your video');
    }
  }
};

meetingSession.audioVideo.addObserver(observer);
```

### Stopping a session

**Use case 27.** Leave a session.

```js
import { MeetingSessionStatusCode } from 'amazon-chime-sdk-js';

const observer = {
  audioVideoDidStop: sessionStatus => {
    const sessionStatusCode = sessionStatus.statusCode();
    if (sessionStatusCode === MeetingSessionStatusCode.Left) {
      /*
        - You called meetingSession.audioVideo.stop().
        - When closing a browser window or page, Chime SDK attempts to leave the session.
      */
      console.log('You left the session');
    } else {
      console.log('Stopped with a session status code: ', sessionStatusCode);
    }
  }
};

meetingSession.audioVideo.addObserver(observer);

meetingSession.audioVideo.stop();
```

**Use case 28.** Add an observer to get notified when a session has ended.

```js
import { MeetingSessionStatusCode } from 'amazon-chime-sdk-js';

const observer = {
  audioVideoDidStop: sessionStatus => {
    const sessionStatusCode = sessionStatus.statusCode();
    if (sessionStatusCode === MeetingSessionStatusCode.MeetingEnded) {
      /*
        - You (or someone else) have called the DeleteMeeting API action in your server application.
        - You attempted to join a deleted meeting.
        - No audio connections are present in the meeting for more than five minutes.
        - Fewer than two audio connections are present in the meeting for more than 30 minutes.
        - Screen share viewer connections are inactive for more than 30 minutes.
        - The meeting time exceeds 24 hours.
        See https://docs.aws.amazon.com/chime/latest/dg/mtgs-sdk-mtgs.html for details.
      */
      console.log('The session has ended');
    } else {
      console.log('Stopped with a session status code: ', sessionStatusCode);
    }
  }
};

meetingSession.audioVideo.addObserver(observer);
```

### Meeting readiness checker

**Use case 29.** Initialize the meeting readiness checker.

```js
import { DefaultMeetingReadinessChecker } from 'amazon-chime-sdk-js';

// In the usage examples below, you will use this meetingReadinessChecker object.
const meetingReadinessChecker = new DefaultMeetingReadinessChecker(logger, meetingSession);
```

**Use case 30.** Use the meeting readiness checker to perform local checks.

```js
import { CheckAudioInputFeedback } from 'amazon-chime-sdk-js';

const audioInputDeviceInfo = /* An array item from meetingSession.audioVideo.listAudioInputDevices */;
const audioInputFeedback = await meetingReadinessChecker.checkAudioInput(audioInputDeviceInfo.deviceId);

switch (audioInputFeedback) {
  case CheckAudioInputFeedback.Succeeded:
    console.log('Succeeded');
    break;
  case CheckAudioInputFeedback.Failed:
    console.log('Failed');
    break;
  case CheckAudioInputFeedback.PermissionDenied:
    console.log('Permission denied');
    break;
}
```

**Use case 31.** Use the meeting readiness checker to perform end-to-end checks, e.g. audio, video, and content share.

```js
import {
  CheckAudioConnectivityFeedback,
  CheckContentShareConnectivityFeedback,
  CheckVideoConnectivityFeedback
} from 'amazon-chime-sdk-js';

// Tests audio connection
const audioDeviceInfo = /* An array item from meetingSession.audioVideo.listAudioInputDevices */;
const audioFeedback = await meetingReadinessChecker.checkAudioConnectivity(audioDeviceInfo.deviceId);
console.log(`Feedback result: ${CheckAudioConnectivityFeedback[audioFeedback]}`);

// Test video connection
const videoInputInfo = /* An array item from meetingSession.audioVideo.listVideoInputDevices */;
const videoFeedback = await meetingReadinessChecker.checkVideoConnectivity(videoInputInfo.deviceId);
console.log(`Feedback result: ${CheckVideoConnectivityFeedback[videoFeedback]}`);

// Tests content share connectivity
const contentShareFeedback = await meetingReadinessChecker.checkContentShareConnectivity();
console.log(`Feedback result: ${CheckContentShareConnectivityFeedback[contentShareFeedback]}`);
```

**Use case 32.** Use the meeting readiness checker to perform network checks, e.g. TCP and UDP.

```js
import {
  CheckNetworkUDPConnectivityFeedback,
  CheckNetworkTCPConnectivityFeedback
} from 'amazon-chime-sdk-js';

// Tests for UDP network connectivity
const networkUDPFeedback = await meetingReadinessChecker.checkNetworkUDPConnectivity();
console.log(`Feedback result: ${CheckNetworkUDPConnectivityFeedback[networkUDPFeedback]}`);

// Tests for TCP network connectivity
const networkTCPFeedback = await meetingReadinessChecker.checkNetworkTCPConnectivity();
console.log(`Feedback result: ${CheckNetworkTCPConnectivityFeedback[networkTCPFeedback]}`);
```

### Selecting an audio profile

**Use case 32.** Set the audio quality of the main audio input to optimize for speech or music:

Use the following setting to optimize the audio bitrate of the main audio input for fullband speech with a mono channel:

```js
meetingSession.audioVideo.setAudioProfile(AudioProfile.fullbandSpeechMono());
````

**Use case 33.** Set the audio quality of content share audio to optimize for speech or music:

Use the following setting to optimize the audio bitrate of content share audio for fullband music with a mono channel:

```js
meetingSession.audioVideo.setContentAudioProfile(AudioProfile.fullbandMusicMono());
```

### Starting a messaging session

**Use case 34.** Setup an observer to receive events: connecting, start, stop and receive message; and 
start a messaging session. 

> Note: You can remove an observer by calling `messagingSession.removeObserver(observer)`.
In a component-based architecture (such as React, Vue, and Angular), you may need to add an observer
when a component is mounted, and remove it when unmounted.
>
```js
const observer = {
  messagingSessionDidStart: () => {
    console.log('Session started');
  },
  messagingSessionDidStartConnecting: reconnecting => {
    if (reconnecting) {
      console.log('Start reconnecting');
    } else {
      console.log('Start connecting');
    }
  },
  messagingSessionDidStop: event => {
    console.log(`Closed: ${event.code} ${event.reason}`);
  },
  messagingSessionDidReceiveMessage: message => {
    console.log(`Receive message type ${message.type}`);
  }
};

messagingSession.addObserver(observer);
messagingSession.start();
```
## Notice

The use of Amazon Voice Focus via this SDK involves the downloading and execution of code at runtime by end users.

The use of Amazon Voice Focus runtime code is subject to additional notices. See [this NOTICES file](https://static.sdkassets.chime.aws/workers/NOTICES.txt) for details. You agree to make these additional notices available to all end users who use Amazon Voice Focus runtime code via this SDK.

---

Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
