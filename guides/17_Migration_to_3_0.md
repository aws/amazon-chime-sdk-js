# Migration from SDK v2 to SDK v3

## Installation

Installation involves adjusting your `package.json` to depend on version `3.0.0`.

```shell
npm install amazon-chime-sdk-js@3
```

Note that, currently only pre-release NPM versions of `3.0.0` are available until we do the final major version release. Do the following step to install the latest beta version for `amazon-chime-sdk-js`:

```shell
npm install amazon-chime-sdk-js@beta
```

__Version 3 of the Amazon Chime SDK for JavaScript makes a number of interface changes.__

__In many cases you should not need to adjust your application code at all. This will be the case if:__

* You do not implement your own `EventController` or construct `DefaultEventController` yourself.
* You do not pass a `EventReporter` yourself or use the reporter through `MeetingSession`.
* You do not explicitly add `eventDidReceive` observer using `addObserver(<class implementing AudioVideoObserver's eventDidReceive method>)` on any instances of an `AudioVideoFacade` or `AudioVideoController` such as `meetingSession.audioVideo.addObserver(<class implementing AudioVideoObserver's eventDidReceive method>)`

If your application does not meet all three criteria, read on.

### Messaging

#### Remove AWS global object from `MessagingSessionConfiguration.ts`

`MessagingSessionConfiguration` used to require to pass in the AWS global object for sigV4 signing which does not
work for aws-sdk v3. Starting with Amazon Chime SDK for JavaScript V3, you no longer have to pass in the global AWS object.

If your code looked like this:

```typescript
this.configuration = new MessagingSessionConfiguration(this.userArn, this.sessionId, endpoint.Endpoint.Url, chime, AWS);
```

change it to

```typescript
this.configuration = new MessagingSessionConfiguration(this.userArn, this.sessionId, endpoint.Endpoint.Url, chime);
```

#### Update `messagingSession.start` to return `Promise<void>` instead of `void`

In aws-sdk v3, region and credentials can be async function. In order to support aws-sdk v3, we update the start API
to async.

If your code looked like this:

```typescript
messagingSession.start();
```

change it to

```typescript
await messagingSession.start();
```

### MeetingStatusCode

The following meeting status code have been deprecated in v2.x and are now removed in v3.x, if your applications
handle them please remove.

* AudioDisconnectAudio
* AudioCallEnded
* TURNMeetingEnded
* StateMachineTransitionFailed
* AudioDeviceSwitched

### Updating `EventController` use cases

We have de-coupled the `EventController` from `AudioVideoController`. Check below for the new changes and if updates are needed for your implementation.

Use case 1: Update implementation of custom `EventController`

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

Use case 2: Update creation of `EventController`

```typescript
// Before in 2.x:
const configuration = new MeetingSessionConfiguration(…);
const logger = new Logger(…);
const eventReporter = new EventReporter(...)
…
const audioVideoController = new DefaultAudioVideoController(configuration, logger, ..., eventReporter);
const eventController = new DefaultEventController(audioVideoController, eventReporter)

// After in 3.x:
const configuration = new MeetingSessionConfiguration(…);
const logger = new Logger(…);
const eventReporter = new EventReporter(...)
…
const eventController = new DefaultEventController(configuration, logger, eventReporter)
const audioVideoController = new DefaultAudioVideoController(configuration, logger, ..., eventController);
```

### Updating `EventReporter` use cases

The `DefaultMeetingSession` constructor no longer takes in a `EventReporter` and instead optionally takes in an `EventController` or creates one if none is given.

Before in 2.x:

```typescript
const configuration = new MeetingSessionConfiguration(…);
const logger = new Logger(…);
const eventReporter = new EventReporter(...)
…
const deviceController = new DefaultDeviceController(logger);

this.meetingSession = new DefaultMeetingSession(configuration, logger, deviceController, eventReporter);
```

After in 3.x:

```typescript
const configuration = new MeetingSessionConfiguration(…);
const logger = new Logger(…);
const eventReporter = new EventReporter(...)
…
const deviceController = new DefaultDeviceController(logger);
const eventController = new DefaultEventController(configuration, logger, eventReporter)
this.meetingSession = new DefaultMeetingSession(configuration, logger, deviceController, eventController);
```

### `forEachObserver` use cases

The `eventDidReceive` function that was part of `AudioVideoObserver` has been moved to `EventObserver` which is a observer that the `EventController` now handles. Because of this if you were you were to call `eventDidReceive` through `forEachObserver` on `AudioVideoController` this functionality will no longer be possible in 3.x, however you will still be able to call `eventDidReceive` by using the `publishEvent` method on `EventController`. If you have a use case not covered by this method you can implement your own `EventController` or make a feature request.

### WebRTC Metrics

Before in 2.x:

The `DefaultStatsCollector` used a hybrid approach to obtain WebRTC stats from browser:

* For Chromium-based browsers, call [legacy (non-promise-based) `getStats` API](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/getStats#obsolete_syntax)
* For any other browsers, call [standardized (promise-based) `getStats` API](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/getStats#syntax)

After in 3.x:

The [legacy (non-promise-based) `getStats` API](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/getStats#obsolete_syntax) will be removed and [standardized (promise-based) `getStats` API](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/getStats#syntax) will be used for all browsers.

SDK exposed some common WebRTC metrics publicly via the `metricsDidReceive` event. We did not make any change to `metricsDidReceive` itself. However In V3, the legacy WebRTC metric specs will be removed or replaced by equivalent standardized metrics. Here is a table that summarizes all the changes and offers the steps to migrate.

| No. | MetricSpec                | SpecName                       | Migration Step                                                   | Details                                                                                                                                                                                                   |
| --- | ------------------------- | ------------------------------ | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | observableMetricSpec      | audioSpeakerDelayMs            | None                                                             | Before: __googCurrentDelayMs__<br><br>Now: __jitterBufferMs__ = (Current.jitterBufferDelay - Previous.jitterBufferDelay) / (Current.jitterBufferEmittedCount - Previous.jitterBufferEmittedCount) \* 1000 |
| 2   | observableMetricSpec      | audioDecoderLoss               | None                                                             | Before: __googDecodingCTN__<br><br>Now: __decoderLoss__ = (Current.concealedSamples - Previous.concealedSamples) / (Current.totalSamplesReceived - Previous.totalSamplesReceived) \* 100                  |
| 3   | observableMetricSpec      | googNackCountReceivedPerSecond | This spec is removed, use __nackCount__ instead                  |                                                                                                                                                                                                           |
| 4   | observableMetricSpec      | availableSendBandwidth         | This spec is removed, use __availableOutgoingBitrate__ instead   |                                                                                                                                                                                                           |
| 5   | observableMetricSpec      | availableReceiveBandwidth      | This spec is removed, use __availableIncomingBitrate__ instead   |                                                                                                                                                                                                           |
| 6   | observableVideoMetricSpec | videoUpstreamGoogFrameHeight   | This spec is removed, use __videoUpstreamFrameHeight__ instead   |                                                                                                                                                                                                           |
| 7   | observableVideoMetricSpec | videoUpstreamGoogFrameWidth    | This spec is removed, use __videoUpstreamFrameWidth__ instead.   |                                                                                                                                                                                                           |
| 8   | observableVideoMetricSpec | videoDownstreamGoogFrameHeight | This spec is removed, use __videoDownstreamFrameHeight__ instead |                                                                                                                                                                                                           |
| 9   | observableVideoMetricSpec | videoDownstreamGoogFrameWidth  | This spec is removed, use __videoDownstreamFrameWidth__ instead  |                                                                                                                                                                                                           |

#### Get raw RTCStatsReport

We add a new `rtcStatsReport` property to `DefaultClientMetricReport` to store raw [`RTCStatsReport`](https://developer.mozilla.org/en-US/docs/Web/API/RTCStatsReport) and expose it via `metricsDidReceive(clientMetricReport: ClientMetricReport)` event. You can get the `rtcStatsReport` via `clientMetricReport.getRTCStatsReport()`. These metrics are updated every second.

Before in 2.x:

> Note: The `getRTCPeerConnectionStats()` is on its way to be deprecated. Please use the new API `clientMetricReport.getRTCStatsReport()` returned by `metricsDidReceive(clientMetricReport)` callback instead.

```typescript
  const report: RTCStatsReport = await audioVideo.getRTCPeerConnectionStats();
```

After in 3.x:

It's recommended to use this one. It can also improve the performance a bit as now you don't need to explicitly call `getStats` API again.

```typescript
const observer = {
  metricsDidReceive(clientMetricReport: ClientMetricReport): void {
    const report: RTCStatsReport = clientMetricReport.getRTCStatsReport();
  }
};
audioVideo.addObserver(observer);
```
