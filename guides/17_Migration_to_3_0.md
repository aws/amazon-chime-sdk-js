# Migration from SDK v2 to SDK v3

- [Migration from SDK v2 to SDK v3](#migration-from-sdk-v2-to-sdk-v3)
  - [Installation](#installation)
  - [Device controller](#device-controller)
    - [Updates to the audio input API](#updates-to-the-audio-input-api)
    - [Updates to the video input API](#updates-to-the-video-input-api)
    - [Updates to the audio output API](#updates-to-the-audio-output-api)
    - [Updates to the video preview APIs](#updates-to-the-video-preview-apis)
    - [Updates to the video input quality API](#updates-to-the-video-input-quality-api)
    - [Removing synthesize video API](#removing-synthesize-video-api)
  - [Messaging](#messaging)
    - [Remove AWS global object from `MessagingSessionConfiguration.ts`](#remove-aws-global-object-from-messagingsessionconfigurationts)
    - [Update `messagingSession.start` to return `Promise<void>` instead of `void`](#update-messagingsessionstart-to-return-promisevoid-instead-of-void)
  - [Meeting Status Code](#meeting-status-code)
  - [AudioVideo events](#audiovideo-events)
  - [`MeetingSessionPOSTLogger` to `POSTLogger`](#meetingsessionpostlogger-to-postlogger)
  - [Event Controller](#event-controller)
    - [Update implementation of custom `EventController`](#update-implementation-of-custom-eventcontroller)
    - [Update creation of `EventController`.](#update-creation-of-eventcontroller)
    - [Update `eventDidReceive` observer](#update-eventdidreceive-observer)
  - [WebRTC Metrics](#webrtc-metrics)
    - [Get raw RTCStatsReport](#get-raw-rtcstatsreport)


## Installation

Installation involves adjusting your `package.json` to depend on version `3.0.0`.

```shell
npm install amazon-chime-sdk-js@3
```

**Version 3 of the Amazon Chime SDK for JavaScript makes a number of interface changes.**

## Device controller

### Updates to the audio input API

We've changed `chooseAudioInputDevice` to `startAudioInput` because you can also pass non-device objects, such as [MediaStream](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream) and [MediaTrackConstraints](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints).

```js
const audioInputDeviceInfo = // An array item from meetingSession.audioVideo.listAudioInputDevices;

// Before
await meetingSession.audioVideo.chooseAudioInputDevice(audioInputDeviceInfo.deviceId);

// After
await meetingSession.audioVideo.startAudioInput(audioInputDeviceInfo.deviceId);
```

In v3, you should call `stopAudioInput` to stop sending an audio stream when your Chime SDK meeting ends.

```js
const observer = {
  audioVideoDidStop: async sessionStatus => {
    // v3
    await meetingSession.audioVideo.stopAudioInput();

    // Or use the destroy API to call stopAudioInput and stopVideoInput.
    meetingSession.deviceController.destroy();
  },
};
meetingSession.audioVideo.addObserver(observer);
```

### Updates to the video input API

We've changed `chooseVideoInputDevice` to `startVideoInput` because you can also pass non-device objects, such as [MediaStream](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream) and [MediaTrackConstraints](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints).

```js
const videoInputDeviceInfo = // An array item from meetingSession.audioVideo.listVideoInputDevices;

// Before
await meetingSession.audioVideo.chooseVideoInputDevice(videoInputDeviceInfo.deviceId);

// After
await meetingSession.audioVideo.startVideoInput(videoInputDeviceInfo.deviceId);
```

In v3, you should call `stopVideoInput` to stop the video input stream. `null` is no longer a valid input for 
`startVideoInput` (`null` is also removed from `Device` type). Calling `stopLocalVideoTile` will stop sending the 
video stream to media server and unbind the video element, but it will not stop the video stream.

```js
// Before
await meetingSession.audioVideo.chooseVideoInputDevice(null);
await meetingSession.audioVideo.stopLocalVideoTile();

// After
// This will auto trigger stopLocalVideoTile during meeting
await meetingSession.audioVideo.stopVideoInput();
```

### Updates to the audio output API

We've changed `chooseAudioOutputDevice` to `chooseAudioOutput` to follow the naming convention in the input APIs.

```js
const audioOutputDeviceInfo = // An array item from meetingSession.audioVideo.listAudioOutputDevices;

// Before
await meetingSession.audioVideo.chooseAudioOutputDevice(audioOutputDeviceInfo.deviceId);

// After
await meetingSession.audioVideo.chooseAudioOutput(audioOutputDeviceInfo.deviceId);
```

### Updates to the video preview APIs

In v3, `startVideoPreviewForVideoInput` and `stopVideoPreviewForVideoInput` do not affect a video input published by `startVideoInput` (`chooseVideoInputDevice` in v2) anymore.

```js
const videoInputDeviceInfo = // An array item from meetingSession.audioVideo.listVideoInputDevices;
await meetingSession.audioVideo.startVideoInput(videoInputDeviceInfo.deviceId);

const previewElement = document.getElementById('video-preview');
meetingSession.audioVideo.startVideoPreviewForVideoInput(previewElement);

meetingSession.audioVideo.stopVideoPreviewForVideoInput(previewElement);

// In v3, stopVideoPreviewForVideoInput does not implicitly stop the video published by startVideoInput.
// You should call stopVideoInput if you want to stop sending a video stream.
await meetingSession.audioVideo.stopVideoInput();
```

### Updates to the video input quality API

In v3, we've removed the `maxBandwidthKbps` parameter from `chooseVideoInputQuality` because it's not related to the video input device.

Instead, you can set the ideal video maximum bandwidth using `setVideoMaxBandwidthKbps`.

```js
// Before
meetingSession.audioVideo.chooseVideoInputQuality(960, 540, 15, 1000);

// After
meetingSession.audioVideo.chooseVideoInputQuality(960, 540, 15);
meetingSession.audioVideo.setVideoMaxBandwidthKbps(1000);
```

### Removing synthesize video API

In v3, we've removed `synthesizeVideoDevice` and `createEmptyVideoDevice` APIs. 
They are now available in our [meeting demo](https://github.com/aws/amazon-chime-sdk-js/blob/main/demos/browser/app/meetingV2/video/SyntheticVideoDeviceFactory.ts).

## Messaging

### Remove AWS global object from `MessagingSessionConfiguration.ts`

`MessagingSessionConfiguration` used to require to pass in the AWS global object for sigV4 signing which does not
work for aws-sdk v3. Starting with Amazon Chime SDK for JavaScript V3, you no longer have to pass in the global AWS object.

```js
// Before
this.configuration = new MessagingSessionConfiguration(this.userArn, this.sessionId, undefined, chime, AWS);

// After
this.configuration = new MessagingSessionConfiguration(this.userArn, this.sessionId, undefined, chime);
```

### Update `messagingSession.start` to return `Promise<void>` instead of `void`

In aws-sdk v3, region and credentials can be async function. In order to support aws-sdk v3, we update the start API
to async.

```js
// Before
messagingSession.start();

// After
await messagingSession.start();
```

## Meeting Status Code

The following meeting status code have been deprecated in v2.x and are now removed in v3.x, if your applications
handle them please remove.

- AudioDisconnectAudio
- AudioCallEnded
- TURNMeetingEnded
- StateMachineTransitionFailed
- AudioDeviceSwitched

## AudioVideo events

We have removed below `AudioVideo` events in v3.

- videoSendHealthDidChange
- videoSendBandwidthDidChange
- videoReceiveBandwidthDidChange
- videoNotReceivingEnoughData
- estimatedDownlinkBandwidthLessThanRequired

`estimatedDownlinkBandwidthLessThanRequired` and `videoNotReceivingEnoughData` can not be replicated anymore but you can make use of priority-based downlink to manage videos instead.


```js
  // Before
const observer = {
  videoSendHealthDidChange: (bitrateKbps, packetsPerSecond) => {
    console.log(`Sending video bitrate in kilobits per second: ${videoUpstreamBitrate} and ${videoUpstreamPacketPerSecond}`);
  },
  videoSendBandwidthDidChange: (newBandwidthKbps, oldBandwidthKbps) => {
    console.log(`Sending bandwidth is ${availableSendBandwidth}, nack count per second is ${nackCountPerSecond}, and old bandwidth is ${this.oldSendBandwidth}`);
  },
  videoReceiveBandwidthDidChange: (newBandwidthKbps, oldBandwidthKbps) => {
    console.log(`Receiving bandwidth is ${availableRecvBandwidth}, and old bandwidth is ${this.oldRecvBandwidth}`);
  },
}
// After
const observer = {
  oldSendBandwidthKbs: 0,
  oldRecvBandwidthKbs: 0,
  metricsDidReceive: (clientMetricReport) => {
    const metricReport = clientMetricReport.getObservableMetrics();

    const {
      videoPacketSentPerSecond,
      videoUpstreamBitrate,
      nackCountPerSecond,
    } = metricReport;
    const availableSendBandwidthKbs = metricReport.availableOutgoingBitrate / 1000;
    const availableRecvBandwidthKbs = metricReport.availableIncomingBitrate / 1000;

    // videoSendHealthDidChange
    console.log(`Sending video bitrate in kilobits per second: ${videoUpstreamBitrate / 1000} and sending packets per second: ${videoPacketSentPerSecond}`);

    // videoSendBandwidthDidChange
    if (this.oldSendBandwidthKbs != availableSendBandwidthKbs) {
      console.log(`Sending bandwidth is ${availableSendBandwidthKbs}, nack count per second is ${nackCountPerSecond}, and old bandwidth is ${this.oldSendBandwidthKbs}`);
      this.oldSendBandwidthKbs = availableSendBandwidthKbs;
    }

    // videoReceiveBandwidthDidChange
    if (this.oldRecvBandwidthKbs != availableRecvBandwidthKbs) {
      console.log(`Receiving bandwidth is ${availableRecvBandwidthKbs}, and old bandwidth is ${this.oldRecvBandwidthKbs}`);
      this.oldRecvBandwidthKbs = availableRecvBandwidthKbs;
    }
  },
};

meetingSession.audioVideo.addObserver(observer);
```

## `MeetingSessionPOSTLogger` to `POSTLogger`

We have renamed `MeetingSessionPOSTLogger` to `POSTLogger` and removed the `MeetingSessionConfiguration` dependency. You don't need to pass the `MeetingSessionConfiguration` object to the `POSTLogger` constructor anymore.

```js
// You need responses from server-side Chime API. See below for details.
const meetingResponse = // The response from the CreateMeeting API action.
const attendeeResponse = // The response from the CreateAttendee API action.

// Before
const meetingSessionConfiguration = new MeetingSessionConfiguration(meetingResponse, attendeeResponse);
const meetingSessionPOSTLogger = new MeetingSessionPOSTLogger(
  'SDK',
  configuration,
  20, // LOGGER_BATCH_SIZE
  2000, // LOGGER_INTERVAL_MS
  URL,
  LogLevel.INFO
);

// After
const logger = new POSTLogger({
  url: 'URL TO POST LOGS',
});
```

You can create a `POSTLogger` object with `headers`, `logLevel`, `metadata`, and other options. See the `POSTLoggerOptions` documentation for more information.

```js
const logger = new POSTLogger({
  url: 'URL TO POST LOGS',
  // Add "headers" to each HTTP POST request.
  headers: {
    'Chime-Bearer': 'authentication-token'
  },
  logLevel: LogLevel.INFO,
  // Add "metadata" to each HTTP POST request body.
  metadata: {
    appName: 'Your app name',
    meetingId: meetingResponse.Meeting.MeetingId,
    attendeeId: attendeeResponse.Attendee.AttendeeId,
  },
});

// You can also set new metadata after initializing POSTLogger.
// For example, you can set metadata after receiving API responses from your server application.
logger.metadata = {
  appName: 'Your app name',
  meetingId: meetingResponse.Meeting.MeetingId,
  attendeeId: attendeeResponse.Attendee.AttendeeId,
};
```

## Event Controller

We have de-coupled the `EventController` from `AudioVideoController`. Check below for the new changes and if updates are needed for your implementation.

### Update implementation of custom `EventController`

```typescript
interface EventController {
  // Adds an observer for event published to this controller.
  addObserver(observer: EventObserver): void;

  // Removes an observer for event published to this controller.
  removeObserver(observer: EventObserver): void;

  // EventReporter that the EventController uses to send events to the Amazon Chime backend.
  readonly eventReporter?: EventReporter;

  // pushMeetingState has been deprecated
}
```

### Update creation of `EventController`.
The `DefaultMeetingSession` constructor no longer takes in a `EventReporter` and instead optionally takes in an `EventController` or creates one if none is given.

```js
const configuration = new MeetingSessionConfiguration(…);
const logger = new ConsoleLogger(…);
const eventReporter = new EventReporter(...)

// Before
this.meetingSession = new DefaultMeetingSession(configuration, logger, ..., eventReporter);

// After
const eventController = new DefaultEventController(configuration, logger, eventReporter)
this.meetingSession = new DefaultMeetingSession(configuration, logger, ..., eventController);
```

### Update `eventDidReceive` observer

The `eventDidReceive` function that was part of `AudioVideoObserver` has been moved to `EventObserver` which is an observer that the `EventController` now handles. Because of this if you were to call `eventDidReceive` through `forEachObserver` on `AudioVideoController` this functionality will no longer be possible in 3.x, however you will still be able to call `eventDidReceive` by using the `publishEvent` method on `EventController`. If you have a use case not covered by this method you can implement your own `EventController` or make a feature request.

## WebRTC Metrics

Before:

The `DefaultStatsCollector` used a hybrid approach to obtain WebRTC stats from browser:

- For Chromium-based browsers, call [legacy (non-promise-based) `getStats` API](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/getStats#obsolete_syntax)
- For any other browsers, call [standardized (promise-based) `getStats` API](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/getStats#syntax)

After:

The [legacy (non-promise-based) `getStats` API](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/getStats#obsolete_syntax) will be removed and [standardized (promise-based) `getStats` API](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/getStats#syntax) will be used for all browsers.

SDK exposed some common WebRTC metrics publicly via the `metricsDidReceive` event. We did not make any change to `metricsDidReceive` itself. However In V3, the legacy WebRTC metric specs will be removed or replaced by equivalent standardized metrics. Here is a table that summarizes all the changes and offers the steps to migrate.

| No. | MetricSpec                | SpecName                       | Migration Step                                                   | Details                                                                                                                                                                                                   |
| --- | ------------------------- | ------------------------------ | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | observableMetricSpec      | audioSpeakerDelayMs            | None                                                             | Before: **googCurrentDelayMs**<br><br>Now: **jitterBufferMs** = (Current.jitterBufferDelay - Previous.jitterBufferDelay) / (Current.jitterBufferEmittedCount - Previous.jitterBufferEmittedCount) \* 1000 |
| 2   | observableMetricSpec      | audioDecoderLoss               | None                                                             | Before: **googDecodingCTN**<br><br>Now: **decoderLoss** = (Current.concealedSamples - Previous.concealedSamples) / (Current.totalSamplesReceived - Previous.totalSamplesReceived) \* 100                  |
| 3   | observableMetricSpec      | googNackCountReceivedPerSecond | This spec is removed, use **nackCount** instead                  |                                                                                                                                                                                                           |
| 4   | observableMetricSpec      | availableSendBandwidth         | This spec is removed, use **availableOutgoingBitrate** instead   |                                                                                                                                                                                                           |
| 5   | observableMetricSpec      | availableReceiveBandwidth      | This spec is removed, use **availableIncomingBitrate** instead   |                                                                                                                                                                                                           |
| 6   | observableVideoMetricSpec | videoUpstreamGoogFrameHeight   | This spec is removed, use **videoUpstreamFrameHeight** instead   |                                                                                                                                                                                                           |
| 7   | observableVideoMetricSpec | videoUpstreamGoogFrameWidth    | This spec is removed, use **videoUpstreamFrameWidth** instead.   |                                                                                                                                                                                                           |
| 8   | observableVideoMetricSpec | videoDownstreamGoogFrameHeight | This spec is removed, use **videoDownstreamFrameHeight** instead |                                                                                                                                                                                                           |
| 9   | observableVideoMetricSpec | videoDownstreamGoogFrameWidth  | This spec is removed, use **videoDownstreamFrameWidth** instead  |                                                                                                                                                                                                           |

### Get raw RTCStatsReport

We add a new `rtcStatsReport` property to `DefaultClientMetricReport` to store raw [`RTCStatsReport`](https://developer.mozilla.org/en-US/docs/Web/API/RTCStatsReport) and expose it via `metricsDidReceive(clientMetricReport: ClientMetricReport)` event. You can get the `rtcStatsReport` via `clientMetricReport.getRTCStatsReport()`. These metrics are updated every second.

Before:

> Note: The `getRTCPeerConnectionStats()` is on its way to be deprecated. Please use the new API `clientMetricReport.getRTCStatsReport()` returned by `metricsDidReceive(clientMetricReport)` callback instead.

```typescript
const report: RTCStatsReport = await audioVideo.getRTCPeerConnectionStats();
```

After:

It's recommended to use this one. It can also improve the performance a bit as now you don't need to explicitly call `getStats` API again.

```typescript
const observer = {
  metricsDidReceive(clientMetricReport: ClientMetricReport): void {
    const report: RTCStatsReport = clientMetricReport.getRTCStatsReport();
  },
};
audioVideo.addObserver(observer);
```
