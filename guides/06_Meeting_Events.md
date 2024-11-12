# Meeting Events

- [Meeting Events](#meeting-events)
  - [Meeting events and attributes](#meeting-events-and-attributes)
    - [Standard attributes](#standard-attributes)
    - [Meeting attributes](#meeting-attributes)
    - [Device attributes](#device-attributes)
    - [The meeting history attribute](#the-meeting-history-attribute)
    - [Meeting error messages](#meeting-error-messages)
    - [Device error messages](#device-error-messages)
    - [Audio transmission related events](#audio-transmission-related-events)
  - [Example](#example)

The `eventDidReceive` observer method makes it easy to collect, process, and monitor meeting events.
You can use meeting events to identify and troubleshoot the cause of device and meeting failures.

To receive meeting events, add an observer, and implement the `eventDidReceive` observer method.

```js
const observer = {
  eventDidReceive(name, attributes) {
    // Handle a meeting event.
  }
}

meetingSession.eventController.addObserver(observer);
```

In the `eventDidReceive` observer method, we recommend that you handle each meeting event so that 
you don't have to worry about how your event processing would scale when the later versions of the Chime SDK for JavaScript introduce new meeting events.

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

<br>

## Meeting events and attributes

The Chime SDK for JavaScript sends these meeting events.

|Event name            |Description
|--                    |--
|`meetingStartRequested` |The meeting will start.
|`meetingStartSucceeded` |The meeting started.
|`meetingReconnected`    |The meeting reconnected.
|`meetingStartFailed`    |The meeting failed to start due to the following failure [MeetingSessionStatusCode](https://aws.github.io/amazon-chime-sdk-js/enums/meetingsessionstatuscode.html): <br><ul><li>`AudioCallAtCapacity`</li><li>`MeetingEnded`</li><li>`SignalingBadRequest`</li><li>`TaskFailed`</li></ul>For more information, see the ["Meeting error messages" section](#meeting-error-messages).
|`meetingEnded`          |The meeting ended.
|`meetingFailed`         |The meeting ended with one of the following failure [MeetingSessionStatusCode](https://aws.github.io/amazon-chime-sdk-js/enums/meetingsessionstatuscode.html): <br><ul><li>`AudioAttendeeRemoved`</li><li>`AudioJoinedFromAnotherDevice`</li><li>`RealtimeApiFailed`</li><li>`TaskFailed`</li></ul>For more information, see the ["Meeting error messages" section](#meeting-error-messages).
|`attendeePresenceReceived`   |The attendee joined the meeting with the microphone.
|`deviceLabelTriggerFailed`    |The device label trigger failed. By default, the Chime SDK for JavaScript requests access to the microphone and camera in order to retrieve device labels. The SDK sends this event when either the microphone, camera, or both requests fail.<br><br>If you have configured a custom function with `meetingSession.audioVideo.setDeviceLabelTrigger`, the SDK sends this event when your function fails.
|`audioInputSelected`    |The microphone was selected.
|`audioInputUnselected`  |The microphone was removed. You called `meetingSession.audioVideo.stopAudioInput`.
|`audioInputFailed`      |The microphone selection failed.
|`videoInputSelected`    |The camera was selected.
|`videoInputUnselected`  |The camera was removed. You called `meetingSession.audioVideo.stopVideoInput`.
|`videoInputFailed`      |The camera selection failed.
|`signalingDropped`      |The WebSocket failed or closed with an error.
|`receivingAudioDropped` |A significant number of receive-audio packets dropped.
|`sendingAudioFailed`    |Sending audio packets failed for `N` samples consecutively after an initial wait time of `T`. You can configure these values in [ConnectionHealthPolicyConfiguration](https://aws.github.io/amazon-chime-sdk-js/classes/connectionhealthpolicyconfiguration.html) where `N` = `sendingAudioFailureSamplesToConsider` and `T` = `sendingAudioFailureInitialWaitTimeMs`.
|`sendingAudioRecovered` |Sending audio packets successful after failure.

<br>

### Standard attributes

The Chime SDK for JavaScript sends a meeting event with attributes. These standard attributes are available as part of every event type.

|Attribute|Description
|--|--
|`attendeeId`|The Amazon Chime SDK attendee ID.
|`browserMajorVersion`|The browser's major version.
|`browserName`|The browser name.
|`browserVersion`|The browser version.
|`deviceName`|The manufacturer and model name of the computer or mobile device. `Unavailable` indicates that the device name can't be found.
|`externalMeetingId`|The Amazon Chime SDK external meeting ID.
|`externalUserId`|The Amazon Chime SDK external user ID that can indicate an identify managed by your application.
|`meetingHistory`|The list of the meeting-history states. For more information, see the ["The meeting history attribute" section](#the-meeting-history-attribute).
|`meetingId`|The Amazon Chime SDK meeting ID.
|`osName`|The operating system.
|`osVersion`|The version of the operating system.
|`sdkName`|The Amazon Chime SDK name, such as `amazon-chime-sdk-js`.
|`sdkVersion`|The Amazon Chime SDK version.
|`timestampMs`|The local time, in milliseconds since 00:00:00 UTC on 1 January 1970, at which an event occurred.<br><br>Unit: Milliseconds

<br>

### Meeting attributes

The following table describes attributes for a meeting.

|Attribute|Description|Included in
|--|--|--
|`attendeePresenceDurationMs`|The time taken for the attendee to be present in the meeting.<br><br>Unit: Milliseconds|`attendeePresenceReceived`, `meetingEnded`, `meetingFailed`, `meetingReconnected`, `receivingAudioDropped`, `signalingDropped`, `sendingAudioFailed`, `sendingAudioRecovered`
|`iceGatheringDurationMs`|The time taken for connection's ICE gathering state to complete.<br><br>Unit: Milliseconds|`meetingStartSucceeded`, `meetingStartFailed`, `meetingEnded`, `meetingFailed`, `meetingReconnected`, `receivingAudioDropped`, `signalingDropped`, `sendingAudioFailed`, `sendingAudioRecovered`
|`maxVideoTileCount`|The maximum number of simultaneous video tiles shared during the meeting. This includes a local tile (your video), remote tiles, and content shares.<br><br>Unit: Count|`meetingStartSucceeded`, `meetingStartFailed`, `meetingEnded`, `meetingFailed`, `meetingReconnected`, `receivingAudioDropped`, `signalingDropped`
|`meetingDurationMs`|The time that elapsed between the beginning (`AudioVideoObserver.audioVideoDidStart`) and the end (`AudioVideoObserver.audioVideoDidStop`) of the meeting.<br><br>Unit: Milliseconds|`meetingEnded`, `meetingFailed`, `meetingReconnected`, `receivingAudioDropped`, `signalingDropped`, `sendingAudioFailed`, `sendingAudioRecovered`
|`meetingErrorMessage`|The error message that explains why the meeting has failed. For more information, see the ["Meeting error messages" section](#meeting-error-messages). |`meetingStartFailed`, `meetingFailed`
|`meetingStartDurationMs`|The time that elapsed between the start request `meetingSession.audioVideo.start` and the beginning of the meeting `AudioVideoObserver.audioVideoDidStart`.<br><br>Unit: Milliseconds|`meetingStartSucceeded`, `meetingEnded`, `meetingFailed`, `meetingReconnected`, `receivingAudioDropped`, `signalingDropped`, `sendingAudioFailed`, `sendingAudioRecovered`
|`meetingStatus`|The meeting status when the meeting ended or failed. Note that this attribute indicates an enum name in [MeetingSessionStatusCode](https://aws.github.io/amazon-chime-sdk-js/enums/meetingsessionstatuscode.html), such as `Left` or `MeetingEnded`.|`meetingStartFailed`, `meetingEnded`, `meetingFailed`, `meetingReconnected`
|`poorConnectionCount`|The number of times the significant packet loss occurred during the meeting. Per count, you receive `AudioVideoObserver.connectionDidBecomePoor` or `AudioVideoObserver.connectionDidSuggestStopVideo`.<br><br>Unit: Count|`meetingStartSucceeded`, `meetingStartFailed`, `meetingEnded`, `meetingFailed`, `meetingReconnected`, `receivingAudioDropped`, `signalingDropped`
|`retryCount`|The number of connection retries performed during the meeting.<br><br>Unit: Count|`meetingStartSucceeded`, `meetingStartFailed`, `meetingEnded`, `meetingFailed`, `meetingReconnected`, `receivingAudioDropped`, `signalingDropped`
|`signalingOpenDurationMs`|The time taken for opening a WebSocket connection.<br><br>Unit: Milliseconds|`meetingStartSucceeded`, `meetingStartFailed`, `meetingEnded`, `meetingFailed`, `meetingReconnected`, `receivingAudioDropped`, `signalingDropped`, `sendingAudioFailed`, `sendingAudioRecovered`

<br>

### Device attributes

The following table describes attributes for the microphone and camera.

|Attribute|Description|Included in
|--|--|--
|`audioInputErrorMessage`|The error message that explains why the microphone selection failed. For more information, see the ["Device error messages" section](#device-error-messages).|`audioInputFailed`
|`videoInputErrorMessage`|The error message that explains why the camera selection failed. For more information, see the ["Device error messages" section](#device-error-messages).|`videoInputFailed`
|`deviceLabelTriggerErrorMessage`|The error message that explains why the device label trigger failed. For more information, see the ["Device error messages" section](#device-error-messages).|`deviceLabelTriggerFailed`

<br>

### The meeting history attribute

The meeting history attribute is a list of states. Each state object contains the event name and timestamp.

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

<br>

### Meeting error messages

When the meeting failed to start, the Chime SDK for JavaScript catches an error and 
publishes the `meetingStartFailed` event with the `meetingErrorMessage` attribute.
The following table shows common error messages you may receive when failing to join a meeting.

|Messages|Status code|Suggested resolution
|--|--|--
|The attendee couldn't join because the meeting was at capacity.|AudioCallAtCapacity|Ensure that the number of attendees does not exceed the maximum limit (250). See the [Amazon Chime SDK quotas](https://docs.aws.amazon.com/chime-sdk/latest/dg/meetings-sdk.html#mtg-limits). You can also track the number of attendees in your server application using the [Amazon Chime SDK event notifications](https://docs.aws.amazon.com/chime-sdk/latest/dg/mtgs-sdk-notifications.html).
|The meeting already ended.|MeetingEnded|Ensure that you or someone else have not deleted a meeting using the [DeleteMeeting](https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_DeleteMeeting.html) API action in your server application. A meeting also automatically ends after a period of inactivity. See the [Chime SDK developer guide](https://docs.aws.amazon.com/chime-sdk/latest/dg/mtgs-sdk-mtgs.html) for details.
|The signaling connection was closed with code (close code) and reason: (reason)|SignalingBadRequest|Ensure that you do not use the deleted attendee's response in the `DefaultMeetingSession` object to start the meeting. You also should not use the attendee response from the ended meeting that you created with the same `ClientRequestToken` parameter before.
|1. WebSocket connection failed<br>2. OpenSignalingConnectionTask got canceled while waiting to open signaling connection|TaskFailed|Ensure that you have a stable internet connection.
|no ice candidates were gathered|TaskFailed|Ensure that either you do not use your application in split-tunneling scenarios or your application always requests microphone permissions before beginning ICE. See the [Chime SDK for JavaScript FAQs](https://aws.github.io/amazon-chime-sdk-js/modules/faqs.html#i-cannot-join-meeting-in-firefox-with-no-audio-and-video-permission-due-to-no-ice-candidates-were-gathered-error-is-this-a-known-issue).

<br>

The Chime SDK for JavaScript also raises the `meetingFailed` event containing the `meetingErrorMessage` attribute if the meeting stops due to an error.
The following table lists common error messages from a stopped meeting.

|Messages|Status code|Suggested resolution
|--|--|--
|The meeting ended because attendee removed.|AudioAttendeeRemoved|Ensure that you or someone else have not called the [DeleteMeeting](https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_DeleteMeeting.html) API action in your server application to delete the attendee present in the meeting.
|The attendee joined from another device.|AudioJoinedFromAnotherDevice|Ensure that you do not use the same attendee response from the [CreateAttendee](https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_CreateAttendee.html), [BatchCreateAttendee](https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_BatchCreateAttendee.html), or [CreateMeetingWithAttendees](https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_CreateMeetingWithAttendees.html) API action in two or more meetings simultaneously.
|(An error message from your real-time callback)|RealtimeApiFailed| Ensure that the callback you passed to the real-time API, such as `meetingSession.audioVideo.realtimeSubscribeToVolumeIndicator`, does not throw an exception.
|1. WebSocket connection failed<br>2. OpenSignalingConnectionTask got canceled while waiting to open signaling connection|TaskFailed|Ensure that you have a stable internet connection. You can also follow the [Quality, Bandwidth, and Connectivity guide](https://aws.github.io/amazon-chime-sdk-js/modules/qualitybandwidth_connectivity.html) to monitor network connectivity and suggest mitigations.

<br>

### Device error messages

The `audioInputErrorMessage` and `videoInputErrorMessage` may indicate the browser's [getUserMedia API exceptions](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#exceptions). When you call 
`meetingSession.audioVideo.startAudioInput` or `meetingSession.audioVideo.startVideoInput`, the Chime SDK for 
JavaScript uses the browser's [`getUserMedia` API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) to acquire access to your device. When the getUserMedia API throws an error, the Chime SDK for JavaScript catches an error and publishes the `audioInputFailed` or `videoInputFailed` event containing a browser's error message.

The `deviceLabelTriggerErrorMessage` can also include the exceptions from the browser's [getUserMedia API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#exceptions). By default, the Chime SDK for JavaScript asks for access to the microphone and the camera to retrieve device labels. If the request for either the microphone, the camera, or both fails, the SDK triggers the `deviceLabelTriggerFailed` event with exceptions from the getUserMedia API. If you have set a custom function using `meetingSession.audioVideo.setDeviceLabelTrigger`, the SDK will capture the error message generated by your function.

|Messages|Suggested resolution
|--|--
|1. TypeError: Failed to execute 'getUserMedia' on 'MediaDevices': At least one of audio and video must be requested<br>2. NotAllowedError: The request is not allowed by the user agent or the platform in the current context.<br>3. TypeError: Type error|Ensure that you allow permission to the media devices. Also, the browser should have access to the media devices.
|NotReadableError: Could not start video source|Ensure that you do not use the media devices in other browser tabs or applications. A hardware error may also occur at the operating system or browser. If the problem persists, restart the browser and try again.

<br>

### Audio transmission related events

The Amazon Chime SDK for JavaScript publishes the following events to report issues with audio transmission and receipt:

- The `receivingAudioDropped` event is triggered when the packet loss for receiving audio is high. This can be used to warn users about potential network connectivity issues but if you are already using the [connectionDidSuggestStopVideo](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#connectiondidsuggeststopvideo) or [connectionDidBecomePoor](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#connectiondidbecomepoor) callbacks you do not need to take any action as these callbacks are triggered on the same predicate.

- The `sendingAudioFailed` event is triggered when audio packets are not sent out consistently. This event can be used to alert the user that their audio is not reaching other attendees or to ask them to take a manual action such as changing the input audio device or restarting the application. When there's a recovery in the audio packets sent, the `sendingAudioRecovered` event is published which can be used to acknowledge that the user action did succeed.  Unlike the `receivingAudioDropped` event, there are no additional callbacks which are invoked for this case. There are few caveats attached to these events listed below:
  - In certain genuine use-cases where applications want to allow users to join as an observer without any audio input (view-only mode), we may trigger the `sendingAudioFailed` event in Firefox and Safari. This behaviour is due to a [known issue](https://github.com/aws/amazon-chime-sdk-js/issues/474) which actually sends such attendees into a reconnection loop and eventually results in meeting failure. This behavior won't occur once the bug is fixed, but until then builders can try the workarounds mentioned [here](https://github.com/aws/amazon-chime-sdk-js/issues/474#issuecomment-870861009).

Once published these events undergo a cool-down period to avoid overwhelming the event observer
in case of an erratic network/audio device. In addition to this, within a connection, the number of times the events are published is also capped to a maximum. `cooldownTimeMs` and `maximumTimesToWarn` are the respective thresholds for this behaviour whose values are defined in [ConnectionHealthPolicyConfiguration](https://aws.github.io/amazon-chime-sdk-js/classes/connectionhealthpolicyconfiguration.html).

<br>

## Example

Follow the instructions in the [Monitoring and troubleshooting with Amazon Chime SDK meeting events](https://aws.amazon.com/blogs/business-productivity/monitoring-and-troubleshooting-with-amazon-chime-sdk-meeting-events) blog post to create your Amazon CloudWatch dashboard.