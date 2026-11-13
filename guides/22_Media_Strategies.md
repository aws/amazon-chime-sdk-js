# Media Strategies

- [Media Strategies](#media-strategies)
  - [Overview](#overview)
  - [Supplying a strategy](#supplying-a-strategy)
  - [Implementing a strategy](#implementing-a-strategy)

## Overview

The Amazon Chime SDK for JavaScript creates peer connections with `RTCPeerConnection`, acquires the camera and microphone with `navigator.mediaDevices.getUserMedia`, and lists devices with `navigator.mediaDevices.enumerateDevices`. A media strategy supplies these three calls, and the SDK calls the strategy instead of the browser.

By default the SDK uses `StandardStrategy`, which calls the browser directly. An application that does not supply a strategy behaves exactly as before.

## Supplying a strategy

Pass the same strategy object to the device controller and to the meeting session configuration:

```js
import {
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  LogLevel,
  MeetingSessionConfiguration,
} from 'amazon-chime-sdk-js';

const logger = new ConsoleLogger('MyLogger', LogLevel.INFO);
const strategy = new MyStrategy(); // implements MediaStrategy

const deviceController = new DefaultDeviceController(logger, { strategy });
const configuration = new MeetingSessionConfiguration(meetingResponse, attendeeResponse);
configuration.strategy = strategy;

const meetingSession = new DefaultMeetingSession(configuration, logger, deviceController);
```

The device controller uses the strategy to acquire the camera and microphone and to list devices. The meeting session uses `MeetingSessionConfiguration.strategy` to create its peer connection, and the content share session copies it from the configuration. Use one object for both, so that devices and peer connections come from the same place.

## Implementing a strategy

Implement `MediaStrategy`. The simplest way is to extend `StandardStrategy` and override only the methods you need; the inherited methods call the browser.

```js
import { StandardStrategy } from 'amazon-chime-sdk-js';

class MyStrategy extends StandardStrategy {
  getUserMedia(constraints) {
    console.log('getUserMedia', constraints);
    return super.getUserMedia(constraints);
  }
}
```

The SDK still calls the browser directly in a few places that a strategy does not cover: screen capture for content share, the codec capability check in `DefaultBrowserBehavior`, `DefaultMeetingReadinessChecker`, and the device change listener in `MediaDeviceProxyHandler`.
