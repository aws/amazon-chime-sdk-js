# Meeting Events

The `eventDidReceive` observer method makes it easy to collect, process, and monitor meeting events.
You can use meeting events to identify and troubleshoot the cause of device and meeting failures.

To receive meeting events, add an observer, and implement the `eventDidReceive` observer method.

```js
const observer = {
  eventDidReceive(name, attributes) {
    // Handle a meeting event.
  }
}

meetingSession.audioVideo.addObserver(observer);
```

In the `eventDidReceive` observer method, we recommend that you handle each meeting event so that 
you don't have to worry about how your event processing would scale when the later versions of Chime SDK introduce new meeting events.

For example, the code outputs error information for four failure events at the "error" log level.

```js
eventDidReceive(name, attributes) {
  switch (name) {
    case 'audioInputFailed':
      console.error(`Failed to choose microphone: ${attributes.audioInputErrorMessage} in `, attributes);
      break;
    case 'videoInputFailed':
      console.error(`Failed to choose camera: ${attributes.videoInputErrorMessage} in `, attributes);
      break;
    case 'meetingStartFailed':
      console.error(`Failed to start a meeting: ${attributes.meetingErrorMessage} in `, attributes);
      break;
    case 'meetingFailed':
      console.error(`Failed during a meeting: ${attributes.meetingErrorMessage} in `, attributes);
      break;
    default:
      break;
}
```

Ensure that you are familiar with the attributes you want to use. See the following two examples.

The code logs the last 5 minutes of the `meetingHistory` attribute when a failure event occurs.
It's helpful to reduce the amount of data sent to your server application or analytics tool.

```js
eventDidReceive(name, attributes) {
  const { meetingHistory, ...otherAttributes } = attributes;
  const recentMeetingHistory = meetingHistory.filter(({ timestampMs }) => {
    return Date.now() - timestampMs < 5 * 60 * 1000;
  });

  switch (name) {
    case 'audioInputFailed':
    case 'videoInputFailed':
    case 'meetingStartFailed':
    case 'meetingFailed':
      console.error(`Failure: ${name} with attributes: `, {
        ...otherAttributes,
        recentMeetingHistory
      });
      break;
    default:
      break;
  }
}
```

This example prints out the `meetingStatus` attribute if it's available.
See the "Included in" column in the meeting and device attribute tables below for more information.

```js
eventDidReceive(name, attributes) {
  if (attributes.hasOwnProperty('meetingStatus')) {
    console.log(`The meeting ended with the status: ${attributes.meetingStatus} in `, attributes);
  }
}
```

## Meeting events and attributes

Chime SDK sends these meeting events.

|Event name            |Description
|--                    |--
|`meetingStartRequested` |The meeting will start.
|`meetingStartSucceeded` |The meeting started.
|`meetingStartFailed`    |The meeting failed to start.
|`meetingEnded`          |The meeting ended.
|`meetingFailed`         |The meeting ended with one of the following failure [MeetingSessionStatusCode](https://aws.github.io/amazon-chime-sdk-js/enums/meetingsessionstatuscode.html): <br><ul><li>`AudioAuthenticationRejected`</li><li>`AudioCallAtCapacity`</li><li>`AudioDisconnected`</li><li>`AudioInternalServerError`</li><li>`AudioServiceUnavailable`</li><li>`ConnectionHealthReconnect`</li><li>`ICEGatheringTimeoutWorkaround`</li><li>`NoAttendeePresent`</li><li>`RealtimeApiFailed`</li><li>`SignalingBadRequest`</li><li>`SignalingInternalServerError`</li><li>`SignalingRequestFailed`</li><li>`StateMachineTransitionFailed`</li><li>`TaskFailed`</li><li>`VideoCallAtSourceCapacity`</li></ul>
|`attendeePresenceReceived`   |The attendee joined the meeting with the microphone.
|`audioInputSelected`    |The microphone was selected.
|`audioInputUnselected`  |The microphone was removed. You called `meetingSession.audioVideo.chooseAudioInputDevice` with `null`.
|`audioInputFailed`      |The microphone selection failed.
|`videoInputSelected`    |The camera was selected.
|`videoInputUnselected`  |The camera was removed. You called `meetingSession.audioVideo.chooseVideoInputDevice` with `null`.
|`videoInputFailed`      |The camera selection failed.

### Standard attributes

Chime SDK sends a meeting event with attributes. These standard attributes are available as part of every event type.

|Attribute|Description
|--|--
|`attendeeId`|The Amazon Chime SDK attendee ID.
|`browserMajorVersion`|The browser's major version.
|`browserName`|The browser name.
|`browserVersion`|The browser version.
|`deviceName`|The manufacturer and model name of the computer or mobile device. `Unavailable` indicates that the device name can't be found.
|`externalMeetingId`|The Amazon Chime SDK external meeting ID.
|`externalUserId`|The Amazon Chime SDK external user ID that can indicate an identify managed by your application.
|`meetingHistory`|The list of the meeting-history states. For more information, see the "The meeting history attribute" section.
|`meetingId`|The Amazon Chime SDK meeting ID.
|`osName`|The operating system.
|`osVersion`|The version of the operating system.
|`sdkName`|The Amazon Chime SDK name, such as `amazon-chime-sdk-js`.
|`sdkVersion`|The Amazon Chime SDK version.
|`timestampMs`|The local time, in milliseconds since 00:00:00 UTC on 1 January 1970, at which an event occurred.<br><br>Unit: Milliseconds

### Meeting attributes

The following table describes attributes for a meeting.

|Attribute|Description|Included in
|--|--|--
|`attendeePresenceDurationMs`|The time taken for the attendee to be present in the meeting.<br><br>Unit: Milliseconds|`attendeePresenceReceived`, `meetingEnded`, `meetingFailed`
|`iceGatheringDurationMs`|The time taken for connection's ICE gathering state to complete.<br><br>Unit: Milliseconds|`meetingStartSucceeded`, `meetingStartFailed`, `meetingEnded`, `meetingFailed`
|`maxVideoTileCount`|The maximum number of simultaneous video tiles shared during the meeting. This includes a local tile (your video), remote tiles, and content shares.<br><br>Unit: Count|`meetingStartSucceeded`, `meetingStartFailed`, `meetingEnded`, `meetingFailed`
|`meetingDurationMs`|The time that elapsed between the beginning (`AudioVideoObserver.audioVideoDidStart`) and the end (`AudioVideoObserver.audioVideoDidStop`) of the meeting.<br><br>Unit: Milliseconds|`meetingEnded`, `meetingFailed`
|`meetingErrorMessage`|The error message that explains why the meeting has failed.|`meetingStartFailed`, `meetingFailed`
|`meetingStartDurationMs`|The time that elapsed between the start request `meetingSession.audioVideo.start` and the beginning of the meeting `AudioVideoObserver.audioVideoDidStart`.<br><br>Unit: Milliseconds|`meetingStartSucceeded`, `meetingEnded`, `meetingFailed`
|`meetingStatus`|The meeting status when the meeting ended or failed. Note that this attribute indicates an enum name in [MeetingSessionStatusCode](https://aws.github.io/amazon-chime-sdk-js/enums/meetingsessionstatuscode.html), such as `Left` or `MeetingEnded`.|`meetingStartFailed`, `meetingEnded`, `meetingFailed`
|`poorConnectionCount`|The number of times the significant packet loss occurred during the meeting. Per count, you receive `AudioVideoObserver.connectionDidBecomePoor` or `AudioVideoObserver.connectionDidSuggestStopVideo`.<br><br>Unit: Count|`meetingStartSucceeded`, `meetingStartFailed`, `meetingEnded`, `meetingFailed`
|`retryCount`|The number of connection retries performed during the meeting.<br><br>Unit: Count|`meetingStartSucceeded`, `meetingStartFailed`, `meetingEnded`, `meetingFailed`
|`signalingOpenDurationMs`|The time taken for opening a WebSocket connection.<br><br>Unit: Milliseconds|`meetingStartSucceeded`, `meetingStartFailed`, `meetingEnded`, `meetingFailed`

### Device attributes

The following table describes attributes for the microphone and camera.

|Attribute|Description|Included in
|--|--|--
|`audioInputErrorMessage`|The error message that explains why the microphone selection failed.|`audioInputFailed`
|`videoInputErrorMessage`|The error message that explains why the camera selection failed.|`videoInputFailed`

### The meeting history attribute

The meeting history attribute is a list of states. Each state object contains the state name and timestamp.

```js
[
  {
    name: 'audioInputSelected',
    timestampMs: 1612166400000
  },
  {
    name: 'meetingStartSucceeded',
    timestampMs: 1612167400000
  },
  {
    name: 'meetingEnded',
    timestampMs: 1612167900000
  }
]
```

You can use the meeting history to track user actions and events from the creation of the `DefaultMeetingSession` object.
For example, if you started a meeting twice using the same `DefaultMeetingSession` object,
the meeting history will include two `meetingStartSucceeded`.

Note that meeting history can have a large number of states. Ensure that you process the meeting history
before sending it to your server application or analytics tool.

The following table lists available states.

|State|Description
|--|--
|`audioInputFailed`|The microphone selection failed.
|`audioInputSelected`|The microphone was selected.
|`audioInputUnselected`|The microphone was removed. You called `meetingSession.audioVideo.chooseAudioInputDevice` with `null`.
|`meetingEnded`|The meeting ended.
|`meetingFailed`|The meeting ended with the failure status.
|`meetingReconnected`|The meeting reconnected.
|`meetingStartFailed`|The meeting failed to start.
|`meetingStartRequested`|The meeting will start.
|`meetingStartSucceeded`|The meeting started.
|`receivingAudioDropped`|A significant number of receive-audio packets dropped.
|`signalingDropped`|WebSocket failed or closed with an error.
|`videoInputFailed`|The camera selection failed.
|`videoInputSelected`|The camera was selected.
|`videoInputUnselected`|The camera was removed. You called `meetingSession.audioVideo.chooseVideoInputDevice` with `null`.


## Example

[The Chime SDK serverless demo](https://github.com/aws/amazon-chime-sdk-js/tree/master/demos/serverless) uses Amazon CloudWatch Logs to collect, process, and analyze meeting events. For more information, see [the Meeting Dashboard section](https://github.com/aws/amazon-chime-sdk-js/tree/master/demos/serverless#meeting-dashboard) on the serverless demo page.
