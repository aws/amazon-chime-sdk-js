### Migration from SDK v1 to SDK v2

Version 2 of the Amazon Chime SDK for JavaScript makes a small number of interface
changes, as well as removing some deprecated interfaces.

In many cases you should not need to adjust your application code at all. This will be the case
if:

* You do not implement `AudioVideoFacade` or `DeviceController` yourself.
* You do not explicitly call `enableWebAudio` on any instances of `DeviceController` or
  `AudioVideoFacade`, or use the `MeetingSessionConfiguration` field `enableWebAudio`.

If you do, please read on.

#### Removing `enableWebAudio`

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

#### Introducing `AudioInputDevice` and `VideoInputDevice`

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
  async chooseAudioInputDevice(device: Device): Promise<DevicePermission> {
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
  async chooseAudioInputDevice(device: AudioInputDevice): Promise<DevicePermission> {
    if (isAudioTransformDevice(device)) {
      // Handle transform devices, should you need to.
      throw new Error('My app does not use transform devices.');
    }
    // Previous code can remain unchanged.
    // …
  }
}
```

At present `VideoInputDevice` is identical to `Device`, and so the only change you need to make is to change the parameter type of `chooseVideoInputDevice` from `Device` to `VideoInputDevice`.

If you use the type `Device` for a field or variable and pass that value to
`choose{Audio,Video}InputDevice`, your code should continue to work without changes.
