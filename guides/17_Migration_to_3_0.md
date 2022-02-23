# Migration from SDK v2 to SDK v3

## Installation

Installation involves adjusting your `package.json` to depend on version `3.0.0`.

```shell
npm install --save amazon-chime-sdk-js@3
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
- AudioDisconnectAudio
- AudioCallEnded
- TURNMeetingEnded
- StateMachineTransitionFailed
- AudioDeviceSwitched

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
})
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
})
```

### `forEachObserver` use cases
The `eventDidReceive` function that was part of `AudioVideoObserver` has been moved to `EventObserver` which is a observer that the `EventController` now handles. Because of this if you were you were to call `eventDidReceive` through `forEachObserver` on `AudioVideoController` this functionallity will no longer be possible in 3.x, however you will still be able to call `eventDidReceive` by using the `publishEvent` method on `EventController`. If you have a use case not covered by this method you can implement your own `EventController` or make a feature request.
