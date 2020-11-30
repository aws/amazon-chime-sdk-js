# Migration from SDK v1 to SDK v2

## Installation

Installation involves adjusting your `package.json` to depend on version `2.0.0`.

```shell
npm install --save amazon-chime-sdk-js@2
```

## Interface changes

Version 2 of the Amazon Chime SDK for JavaScript makes a small number of interface
changes, as well as removing some deprecated interfaces.

In many cases you should not need to adjust your application code at all. This will be the case if:

* You do not implement `AudioVideoFacade` or `DeviceController` yourself.
* You do not explicitly call `enableWebAudio` on any instances of `DeviceController` or
  `AudioVideoFacade`, or use the `MeetingSessionConfiguration` field `enableWebAudio`.
* You already handle errors in `chooseAudioInputDevice` with `catch`.
* You neither directly call, nor implement, the `bindAudio*` methods on `AudioMixController`.

If your application does not meet all four criteria, read on.

### Removing `enableWebAudio`

The `enableWebAudio` method on `DefaultDeviceController` would produce unexpected results if
called after the first audio device was selected, and as a synchronous API it was not possible
to reimplement it to behave correctly.

Additionally, it was not documented how the API should behave if Web Audio were to be disabled
while in use, or how it should be implemented correctly by other `DeviceController` classes.

This API method has been removed entirely, along with the corresponding field on
`MeetingSessionConfiguration`. The `MeetingSession` will no longer call `enableWebAudio` on the
corresponding `DeviceController`.

Applications should instead use the constructor argument added to
`DefaultDeviceConfiguration` to enable Web Audio at point of construction.

If your code looked like this:

```typescript
const configuration = new MeetingSessionConfiguration(…);
configuration.enableWebAudio = true;
…
const deviceController = new DefaultDeviceController(logger);
this.meetingSession = new DefaultMeetingSession(configuration, logger, deviceController);
this.audioVideo = this.meetingSession.audioVideo;
```

change it to

```typescript
const configuration = new MeetingSessionConfiguration(…);
…
const deviceController = new DefaultDeviceController(logger, { enableWebAudio: true });
this.meetingSession = new DefaultMeetingSession(configuration, logger, deviceController);
this.audioVideo = this.meetingSession.audioVideo;
```

If your code looked like this:

```typescript
const configuration = new MeetingSessionConfiguration(…);
…
const deviceController = new DefaultDeviceController(logger);
this.meetingSession = new DefaultMeetingSession(configuration, logger, deviceController);
this.audioVideo = this.meetingSession.audioVideo;
…
const enableWebAudio = await checkWhetherWebAudioNeeded();
deviceController.enableWebAudio(enableWebAudio);
```

change it to

```typescript
const configuration = new MeetingSessionConfiguration(…);
// …
const enableWebAudio = await checkWhetherWebAudioNeeded();
const deviceController = new DefaultDeviceController(logger, { enableWebAudio });
this.meetingSession = new DefaultMeetingSession(configuration, logger, deviceController);
this.audioVideo = this.meetingSession.audioVideo;
…
```

---

### Update `bindAudioElement()`, `bindAudioStream()` and `bindAudioDevice()` to return `Promise<void>` instead of `boolean`
The `bindAudioElement()` API in `AudioMixControllerFacade` was previously a synchronous function which used to return `boolean`.
Under the hood, it used to call [`setSinkId()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/setSinkId)
which is an asynchronous function.

As part of this change, three APIs in `AudioMixController` were changed to return `Promise<void>`. These APIs are listed below.

```typescript
// Old Syntax
bindAudioElement(element: HTMLAudioElement): boolean;
bindAudioStream(stream: MediaStream): boolean;
bindAudioDevice(device: MediaDeviceInfo | null): boolean;

// New Syntax
bindAudioElement(element: HTMLAudioElement): Promise<void>;
bindAudioStream(stream: MediaStream): Promise<void>;
bindAudioDevice(device: MediaDeviceInfo | null): Promise<void>;
````

Additionally, `AudioMixController`'s constructor now takes an additional optional `logger` parameter.
If the `logger` is passed, it will log the errors for any of the operations in `AudioMixController`.

```typescript
constructor(private logger?: Logger) {}
```

If your code looked like this

```typescript
audioMixController.bindAudioDevice({ deviceId: sinkId });
audioMixController.bindAudioElement(new Audio());
audioMixController.bindAudioStream(destinationStream.stream);
```

change it to

```typescript
try {
  await audioMixController.bindAudioDevice({ deviceId: this.sinkId });
} catch (e) {
  console.error('Failed to bind audio device', e);
}
try {
  await audioMixController.bindAudioElement(new Audio());
} catch (e) {
  console.error('Failed to bind audio element', e);
}
await audioMixController.bindAudioStream(destinationStream.stream);
```

Additionally, if the browser does not support [`setSinkId()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/setSinkId) API, the `bindAudioDevice()` will throw an
error with a message 'Cannot select audio output device. This browser does not support setSinkId.'
Check https://caniuse.com/?search=setSinkId for the setSinkId browser support.

---

### Introducing `AudioInputDevice` and `VideoInputDevice`

These two types describe `DeviceController`'s methods for selecting audio and
video inputs respectively. They both include the space of `Device`s, which are the 'intrinsic'
device kinds provided by the browser: identifiers, constraints, and streams. `AudioInputDevice`
extends these by adding the concept of an `AudioTransformDevice`, which can rewrite an inner
device on request, and optionally provide an arbitrary Web Audio graph to use as an additional
transformation pipeline.

You can use `AudioTransformDevice` to implement effects such as reverb, gain, _etc_.

Because `chooseAudioInputDevice` and `chooseVideoInputDevice` now have new type signatures, if
you implement the related interfaces (`AudioVideoFacade` or `DeviceController`) yourself, you will need to adjust your code.

If you have an implementation like:

```typescript
class MyDeviceController implements DeviceController {
  async chooseAudioInputDevice(device: Device): Promise<void> {
    // device must be a string, stream, constraints, or null.
    // …
    return permission;
  }
}
```

you must change your code to be:

```typescript
import {
  // …
  isAudioTransformDevice,
} from 'amazon-chime-sdk-js';

class MyDeviceController implements DeviceController {
  async chooseAudioInputDevice(device: AudioInputDevice): Promise<void> {
    if (isAudioTransformDevice(device)) {
      // Handle transform devices, should you need to.
      throw new Error('My app does not use transform devices.');
    }
    // Previous code can remain unchanged.
    // …
  }
}
```

A similar adjustment is needed for `VideoInputDevice`. v2.0 does not include any
`VideoTransformDevice`s.

If you use the type `Device` for a field or variable and pass that value to
`choose{Audio,Video}InputDevice`, your code should continue to work without changes.

---

### Introducing the `GetUserMediaError` type

v2.0 introduces new error types which will be thrown in case of any failures in `chooseAudioInputDevice` and `chooseVideoInputDevice` APIs in the `DeviceController`.

Here is the list of new error classes introduced in version 2.0:

* `GetUserMediaError`
  * `NotFoundError`
  * `NotReadableError`
  * `OverconstrainedError`
  * `PermissionDeniedError`
  * `TypeError`

Here is an example of handling `PermissionDeniedError`:

```typescript
try {
  await this.audiovideo.chooseAudioInputDevice(device);
} catch (e) {
  if (e instanceof PermissionDeniedError) {
    console.error('Permission denied', e);
  }
}
```

---

### Introducing `supportsSetSinkId()` in `DefaultBrowserBehavior`

This new helper API returns a boolean `true` if the browser supports [`setSinkId()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/setSinkId), otherwise returning `false`.

Here is how the code would look like:

```typescript
if (!this.browserBehavior.supportsSetSinkId()) {
  throw new Error(
    'Cannot select audio output device. This browser does not support setSinkId.'
  );
} else {
  console.log('The browser supports setSinkId() API');
}
```

---

### Deprecating legacy screen share

From version 2.0 onwards, the Amazon Chime SDK for JavaScript will no longer include the deprecated screen share API identified by `ScreenShareFacade` and `ScreenShareViewFacade` and all related code.
Customers should use our Video Based Content Sharing detailed in our [Content Share guide](https://github.com/aws/amazon-chime-sdk-js/blob/master/guides/02_Content_Share.md).
