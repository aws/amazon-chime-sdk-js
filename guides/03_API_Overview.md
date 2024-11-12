# API Overview

This guide gives an overview of the API methods you can use to create meeting with audio and video with a roster of attendees and basic controls. Several additional API methods that may be helpful are also described and marked optional.

- [API Overview](#api-overview)
  - [1. Create a session](#1-create-a-session)
    - [1a. Create a logger](#1a-create-a-logger)
    - [1b. Create a device controller](#1b-create-a-device-controller)
    - [1c. Create a meeting from your server application](#1c-create-a-meeting-from-your-server-application)
    - [1d. Create a meeting session configuration](#1d-create-a-meeting-session-configuration)
    - [1e. Create a meeting session](#1e-create-a-meeting-session)
  - [2. Configure the session](#2-configure-the-session)
    - [2a. Configure the device label trigger (optional)](#2a-configure-the-device-label-trigger-optional)
      - [Implement a view-only/observer/spectator experience](#implement-a-view-onlyobserverspectator-experience)
      - [Safari user are not able to join the meeting in view-only mode](#safari-user-are-not-able-to-join-the-meeting-in-view-only-mode)
    - [2b. Register a device-change observer (optional)](#2b-register-a-device-change-observer-optional)
    - [2c. Configure the audio input device](#2c-configure-the-audio-input-device)
    - [2d. Preview microphone volume levels (optional)](#2d-preview-microphone-volume-levels-optional)
    - [2e. Configure the audio output device (optional)](#2e-configure-the-audio-output-device-optional)
    - [2f. Bind the audio output to an audio element](#2f-bind-the-audio-output-to-an-audio-element)
    - [2g. Configure the video input device](#2g-configure-the-video-input-device)
    - [2h. Preview local camera in a video element (optional)](#2h-preview-local-camera-in-a-video-element-optional)
  - [3. Register an audio-video observer](#3-register-an-audio-video-observer)
  - [4. Start and stop the session](#4-start-and-stop-the-session)
    - [4a. Set ideal video max bandwidth kbps](#4a-set-ideal-video-max-bandwidth-kbps)
  - [5. Build a roster of participants using the real-time API](#5-build-a-roster-of-participants-using-the-real-time-api)
    - [5a. Subscribe to attendee presence changes](#5a-subscribe-to-attendee-presence-changes)
    - [5b. Subscribe to volume indicators](#5b-subscribe-to-volume-indicators)
    - [5c. Signal strength change (optional)](#5c-signal-strength-change-optional)
    - [5d. Subscribe to an active-speaker detector (optional)](#5d-subscribe-to-an-active-speaker-detector-optional)
  - [6. Mute and unmute microphone audio with the real-time API](#6-mute-and-unmute-microphone-audio-with-the-real-time-api)
    - [6a. Mute and unmute audio](#6a-mute-and-unmute-audio)
    - [6b. Prevent a local attendee from unmuting audio (optional)](#6b-prevent-a-local-attendee-from-unmuting-audio-optional)
  - [7. Share and display video](#7-share-and-display-video)
    - [7a. Share local video](#7a-share-local-video)
    - [7b. Display local and remote video](#7b-display-local-and-remote-video)
    - [7c. Pause and unpause video (optional)](#7c-pause-and-unpause-video-optional)
    - [7d. Find video tiles (optional)](#7d-find-video-tiles-optional)
  - [8. Share screen and other content (optional)](#8-share-screen-and-other-content-optional)
    - [8a. Start and stop the content share](#8a-start-and-stop-the-content-share)
    - [8b. Register a content share observer](#8b-register-a-content-share-observer)
  - [9. Send and receive data messages (optional)](#9-send-and-receive-data-messages-optional)

## 1. Create a session

The [MeetingSession](https://aws.github.io/amazon-chime-sdk-js/interfaces/meetingsession.html) and its [AudioVideoFacade](https://aws.github.io/amazon-chime-sdk-js/interfaces/meetingsession.html#audiovideo) are the starting points for creating meetings. To create a meeting session, you will first need a [Logger](https://aws.github.io/amazon-chime-sdk-js/interfaces/logger.html), [DeviceController](https://aws.github.io/amazon-chime-sdk-js/interfaces/devicecontrollerbasedmediastreambroker.html), and [MeetingSessionConfiguration](https://aws.github.io/amazon-chime-sdk-js/classes/meetingsessionconfiguration.html). The subsequent sections assume that you have created these four things.

### 1a. Create a logger

Create a [ConsoleLogger](https://aws.github.io/amazon-chime-sdk-js/classes/consolelogger.html) to log everything to the browser console. You can also implement the [Logger](https://aws.github.io/amazon-chime-sdk-js/interfaces/logger.html) interface to customize logging behavior.

```
const logger = new ConsoleLogger('MeetingLogs', LogLevel.INFO);
```

### 1b. Create a device controller

Create a [DefaultDeviceController](https://aws.github.io/amazon-chime-sdk-js/classes/defaultdevicecontroller.html#constructor) and pass in the Logger you created. This object allows you to enumerate and select audio and video devices and control some of their features, even before the meeting session has been created.

```
const deviceController = new DefaultDeviceController(logger);
```

### 1c. Create a meeting from your server application

Use AWS SDK to create the Chime object. Use the Chime object to get meeting and attendee objects from [CreateMeeting](https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_CreateMeeting.html) 
and [CreateAttendee](https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_CreateAttendee.html) Chime APIs. See [Getting responses from your 
server application](https://github.com/aws/amazon-chime-sdk-js#getting-responses-from-your-server-application) for more information.

### 1d. Create a meeting session configuration

Create a [MeetingSessionConfiguration](https://aws.github.io/amazon-chime-sdk-js/classes/meetingsessionconfiguration.html#constructor) object with the responses to [CreateMeeting](https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_CreateMeeting.html) and [CreateAttendee](https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_CreateAttendee.html). Your server application should make these API calls and securely pass the meeting and attendee responses to the browser client application.

```
const configuration = new MeetingSessionConfiguration(meetingResponse, attendeeResponse);
```

### 1e. Create a meeting session

Using the above objects, create a [DefaultMeetingSession](https://aws.github.io/amazon-chime-sdk-js/classes/defaultmeetingsession.html#constructor).

```
const meetingSession = new DefaultMeetingSession(configuration, logger, deviceController);
```

## 2. Configure the session

Before starting the meeting session, you should configure audio and video devices. By default, no devices are selected.

### 2a. Configure the device label trigger (optional)

When obtaining devices to configure, the browser may initially decline to provide device labels due to privacy restrictions. However, without device labels the application user will not be able to select devices by name. When no labels are present, the device-label trigger is run. The default implementation of the device-label trigger requests permission to the mic and camera. If the user grants permission, the device labels will become available.

You can override the behavior of the device-label trigger by calling meetingSession.audioVideo.[setDeviceLabelTrigger(trigger)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#setdevicelabeltrigger).

#### Implement a view-only/observer/spectator experience

To enable a view-only experience, you need to control the device permission prompts for audio and video. We suggest that you implement it based on `deviceLabelsTrigger`. By following this, you can achieve it with just little changes.

Note: The view-only mode doesn't impact the ability to view content or listen to audio in your meeting experience.

To suppress device permission prompts, let `deviceLabelTrigger` return an empty `MediaStream` before joining the meeting. Since it's an empty stream, the device permission prompts can't be triggered.

Note: Chrome and Safari don't expose the `deviceId` without granting device permission, but Firefox do. In Firefox, if you try to select the device with `deviceId`, the device permission prompts will be triggered.

To invoke device permission prompts, let `deviceLabelTrigger` return a `MediaStream` that contains your desired device kind. You can trigger it to grant device permission to the browser. After that, list and select the devices to regain the access to devices.

```js
// Suppress devices
audioVideo.setDeviceLabelTrigger(() => Promise.resolve(new MediaStream()));

audioVideo.start();

// Invoke devices
audioVideo.setDeviceLabelTrigger(async () => 
  await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
);
const audioInputDevices = await meetingSession.audioVideo.listAudioInputDevices();
const audioOutputDevices = await meetingSession.audioVideo.listAudioOutputDevices();
const videoInputDevices = await meetingSession.audioVideo.listVideoInputDevices();
await meetingSession.audioVideo.startAudioInput(audioInputDevice.deviceId);
await meetingSession.audioVideo.chooseAudioOutput(audioOutputDevice.deviceId);
await meetingSession.audioVideo.startVideoInput(videoInputDevices.deviceId);
```

#### Safari user are not able to join the meeting in view-only mode

Safari users may not be able to successfully join the meeting in view-only mode, due to this known issue [#474](https://github.com/aws/amazon-chime-sdk-js/issues/474). Since we are still working on this, you can fix it locally by allowing Safari's Autoplay. The specific steps are:

1. Open your application in the Safari app on your Mac.
2. Choose Safari > Settings for This Website.
  You can also Control-click in the Smart Search field, then choose Settings for This Website.
3. Hold the pointer to the right of Auto-Play, then click the pop-up menu and choose the option:
    * Allow All Auto-Play: Lets videos on this website play automatically.

### 2b. Register a device-change observer (optional)

You can receive events about changes to available devices by implementing a [DeviceChangeObserver](https://aws.github.io/amazon-chime-sdk-js/interfaces/devicechangeobserver.html) and registering the observer with the device controller.

To add a DeviceChangeObserver, call deviceController.[addDeviceChangeObserver(observer)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#adddevicechangeobserver).

To remove a DeviceChangeObserver, call deviceController.[removeDeviceChangeObserver(observer)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#removedevicechangeobserver).

You can implement the following callbacks:

* [audioInputsChanged](https://aws.github.io/amazon-chime-sdk-js/interfaces/devicechangeobserver.html#audioinputschanged): occurs when audio inputs are changed
* [audioOutputsChanged](https://aws.github.io/amazon-chime-sdk-js/interfaces/devicechangeobserver.html#audiooutputschanged): occurs when audio outputs are changed
* [videoInputsChanged](https://aws.github.io/amazon-chime-sdk-js/interfaces/devicechangeobserver.html#videoinputschanged): occurs when video inputs are changed
* [audioInputMuteStateChanged](https://aws.github.io/amazon-chime-sdk-js/interfaces/devicechangeobserver.html#audioinputmutestatechanged): occurs when the underlying OS or hardware mute setting is detected on an audio track input

### 2c. Configure the audio input device

To send audio to the remote attendees, list the available audio input devices and choose an input to use.

To retrieve a list of available audio input devices, call meetingSession.audioVideo.[listAudioInputDevices()](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#listaudioinputdevices).

To use the chosen audio input device, call meetingSession.audioVideo.[startAudioInput(device)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#startaudioinput).

### 2d. Preview microphone volume levels (optional)

You can create a WebAudio [AnalyserNode](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode) from the current audio input to generate a display such as a mic indicator. This is useful for allowing attendees to preview their microphone volume level prior to joining the meeting.

To create the AnalyserNode, call meetingSession.audioVideo.[createAnalyserNodeForAudioInput()](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#createanalysernodeforaudioinput).

### 2e. Configure the audio output device (optional)

On browsers that [support setSinkId](https://caniuse.com/#search=setSinkId), you can optionally list the available audio output devices and choose one to use.

To retrieve a list of available audio output devices, call meetingSession.audioVideo.[listAudioOutputDevices()](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#listaudiooutputdevices).

To use the chosen audio output device, call meetingSession.audioVideo.[chooseAudioOutput(deviceId)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#chooseaudiooutput).

### 2f. Bind the audio output to an audio element

To hear audio from the remote attendees, bind the audio output device to an HTMLAudioElement in the DOM. The element does not need to be visible; you can hide it with CSS style `display: none`.

To bind the chosen audio output device to a HTMLAudioElement, call meetingSession.audioVideo.[bindAudioElement(element)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#bindaudioelement).

To unbind the chosen audio output device, call meetingSession.audioVideo.[unbindAudioElement()](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#unbindaudioelement).

### 2g. Configure the video input device

To send video to remote attendees, list the available video input devices, optionally select video quality settings, and choose a device to use.

To get a list of available video input devices, call meetingSession.audioVideo.[listVideoInputDevices()](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#listvideoinputdevices).

You can configure the quality of the video that is sent to the remote attendees by calling meetingSession.audioVideo.
[chooseVideoInputQuality(width, height, frameRate)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#choosevideoinputquality). 
The changes take effect the next time a video input device is chosen. The default quality is 960x540 @ 15 fps. The maximum supported quality settings 
are 1280x720 @ 30 fps. Actual quality achieved may vary throughout the call depending on what the device and system can provide.

To start or switch a video input device, call meetingSession.audioVideo.[startVideoInput(device)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#startvideoinput).

To stop the current video input device, call meetingSession.audioVideo.[stopVideoInput](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#stopvideoinput).

### 2h. Preview local camera in a video element (optional)

Before the session is started, you can start a preview of the video in an HTMLVideoElement in the DOM.

To start video preview, call meetingSession.audioVideo.[startVideoPreviewForVideoInput(element)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#startvideopreviewforvideoinput).

To stop video preview, call meetingSession.audioVideo.[stopVideoPreviewForVideoInput(element)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#stopvideopreviewforvideoinput).

## 3. Register an audio-video observer

You can receive audio and video events by implementing the [AudioVideoObserver](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html) interface and registering the observer with the meeting session.

To add an AudioVideoObserver, call meetingSession.audioVideo.[addObserver(observer)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#addobserver).

To remove an AudioVideoObserver, call meetingSession.audioVideo.[removeObserver(observer)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#removeobserver).

You should implement the following key observer callbacks:

* [audioVideoDidStart](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#audiovideodidstart): occurs when the audio-video session finishes connecting.
* [audioVideoDidStartConnecting](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#audiovideodidstartconnecting): occurs when the audio-video session is in the process of connecting or reconnecting.
* [audioVideoDidStop](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#audiovideodidstop): occurs when the audio-video session has disconnected. Use the provided [MeetingSessionStatus](https://aws.github.io/amazon-chime-sdk-js/classes/meetingsessionstatus.html) to determine why the session disconnected.
* [videoTileDidUpdate](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#videotiledidupdate): occurs when either a video stream is started or updated. Use the provided VideoTileState to determine the tile ID and the attendee ID of the video stream.
* [videoTileWasRemoved](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#videotilewasremoved): occurs when a video stream stops and the reference to the tile (the tile ID) is deleted.
* [videoAvailabilityDidChange](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#videoavailabilitydidchange): occurs video availability state has changed such as whether the attendee can start local video or whether remote video is available. See [MeetingSessionVideoAvailability](https://aws.github.io/amazon-chime-sdk-js/classes/meetingsessionvideoavailability.html) for more information.
* [videoSendDidBecomeUnavailable](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#videosenddidbecomeunavailable): occurs when attendee tries to start video but the maximum video limit of 25 tiles has already been reached by other attendees sharing their video.

You may optionally listen to the following callbacks to monitor aspects of connection health:

* [connectionDidBecomePoor](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#connectiondidbecomepoor): occurs when the connection has been poor for a while
* [connectionDidSuggestStopVideo](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#connectiondidsuggeststopvideo): occurs when the connection has been poor while using video. You can use this to prompt the attendee to turn off video.
* [connectionHealthDidChange](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#connectionhealthdidchange): occurs when connection health has changed.
* [metricsDidReceive](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#metricsdidreceive): occurs periodically when WebRTC media stats are available.


## 4. Start and stop the session

After completing configuration of audio and video (see previous sections) call meetingSession.audioVideo.[start()](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#start). This method will initialize all underlying components, set up connections, and immediately start sending and receiving audio.

To stop the meeting session, call meetingSession.audioVideo.[stop()](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#stop).

The `stop()` method does not clean up observers. You can start and stop a session multiple times using the same observers. In other words observers are not tied to the lifecycle of the session.

You can specify a `signalingOnly` option when calling `start` to cause only the initial signaling connection to be established, then complete meeting join with a second call to `start` after choosing audio and video sources. This can improve meeting join latency. You can use this approach if you know that the user wants to join a meeting prior to wanting to share media or having selected input devices — for example, you can initialize the signaling connection early if you have a 'lobby' experience after choosing to join but before entering the interactive portion of the meeting.

### 4a. Set ideal video max bandwidth kbps

You can call meetingSession.audioVideo.[setVideoMaxBandwidthKbps](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#setvideomaxbandwidthkbps) to set the ideal video max bandwidth kbps.
The default value is 1400 kbps. Actual quality achieved may vary throughout the call depending on what system and network can provide.

## 5. Build a roster of participants using the real-time API

Use the following methods to learn when attendees join and leave and when their volume level, mute state, or signal strength changes.

When implementing a real-time callback, you must ensure that it never throws an exception. To preserve privacy, uncaught exceptions inside a real-time callback are treated as fatal: the session is disconnected immediately. The cautions around real-time callbacks do not apply to the observers. For example, uncaught exceptions are not fatal to observers (though they should be avoided).

Real-time volume indicator callbacks are called at a rate of 5 updates per second. Ensure that your application is able to smoothly render these updates to avoid causing unnecessary CPU load that could degrade the meeting experience.

*If you are using Angular*, ensure that all calls to the SDK are run outside of the Angular zone. Otherwise, the real-time messages received via the signaling channel and their real-time callbacks may cause the DOM to thrash with updates and degrade performance.

### 5a. Subscribe to attendee presence changes

To learn when attendees join or leave, subscribe to the attendee ID presence changes. The callback provides both the attendee ID and external user ID from [CreateAttendee](https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_CreateAttendee.html) so that you may map between the two IDs.

To subscribe to attendee presence changes, call meetingSession.audioVideo.[realtimeSubscribeToAttendeeIdPresence(callback)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#realtimesubscribetoattendeeidpresence).

To unsubscribe to attendee presence changes, call meetingSession.audioVideo.[realtimeUnsubscribeToAttendeeIdPresence(callback)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#realtimeunsubscribetoattendeeidpresence).

### 5b. Subscribe to volume indicators

To show speaker volume, mute state, and signal strength for each attendee, subscribe to volume indicators for each attendee ID. You should subscribe and unsubscribe to attendee volume indicators as part of the attendee ID presence callback.

Volume is on a scale of 0 to 1 (no volume to max volume). Signal strength is on a scale of 0 to 1 (full packet loss to no packet loss). You can use the signal strength of remote attendees to show an indication of whether an attendee is experiencing packet loss and thus may be unable to communicate at the moment.

Signal strength
* 0 - 100% loss of audio data
* < 0.5 - Between 50% to 100% loss of audio data
* >= 0.5 - Less than 50% loss of audio data

To subscribe to an attendee’s volume indicator, call meetingSession.audioVideo.[realtimeSubscribeToVolumeIndicator(attendeeId, callback)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#realtimesubscribetovolumeindicator).

To unsubscribe from an attendee’s volume indicator, call meetingSession.audioVideo.[realtimeUnsubscribeFromVolumeIndicator(attendeeId)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#realtimeunsubscribefromvolumeindicator).

### 5c. Signal strength change (optional)

To subscribe to the local attendee’s signal strength changes, call meetingSession.audioVideo.[realtimeSubscribeToLocalSignalStrengthChange(callback)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#realtimesubscribetolocalsignalstrengthchange).

To unsubscribe from the local attendee’s signal strength changes, call meetingSession.audioVideo.[realtimeUnsubscribeToLocalSignalStrengthChange(callback)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#realtimeunsubscribetolocalsignalstrengthchange).

### 5d. Subscribe to an active-speaker detector (optional)

If you are interested in detecting the active speaker (e.g. to display the active speaker’s video as a large, central tile), subscribe to the active-speaker detector with an active speaker policy such as the [DefaultActiveSpeakerPolicy](https://aws.github.io/amazon-chime-sdk-js/classes/defaultactivespeakerpolicy.html). You can receive updates when the list of active speakers changes. The list is ordered most active to least active. Active speaker policies use volume indicator changes to determine the prominence of each speaker over time.

`DefaultActiveSpeakerPolicy` algorithm works as follows: as you speak, your active speaker score rises and simultaneously decreases the score of others. There are some adjustable weightings in the constructor to control how reactive it is. In general, the defaults do a reasonable job of identifying the active speaker, preventing short noises or interjections from switching the active speaker, but also allowing take over to be relatively quick.

To subscribe to active speaker updates, call meetingSession.audioVideo.[subscribeToActiveSpeakerDetector(policy, callback)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#subscribetoactivespeakerdetector).

To unsubscribe from active speaker updates, call meetingSession.audioVideo.[unsubscribeFromActiveSpeakerDetector(callback)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#unsubscribefromactivespeakerdetector).

## 6. Mute and unmute microphone audio with the real-time API

Use the below real-time API methods to mute and unmute microphone audio. Mute is effective immediately and applied locally; no audio from the microphone will be transmitted to the server when muted.

When implementing a real-time callback, you must ensure that it never throws an exception. To preserve privacy, uncaught exceptions inside a real-time callback are treated as fatal: the session is disconnected immediately.

To ensure that attendee privacy is respected, pay close attention that the UI controls for mute are implemented properly with as direct a path possible to the mute and unmute methods. Use the real-time API to determine the current state of mute rather than keeping track of mute state yourself.

### 6a. Mute and unmute audio

To mute the local attendee’s audio, call meetingSession.audioVideo.[realtimeMuteLocalAudio()](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#realtimemutelocalaudio).

To unmute the local attendee’s audio, call meetingSession.audioVideo.[realtimeUnmuteLocalAudio()](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#realtimeunmutelocalaudio).

To determine if the local attendee’s audio is muted, call meetingSession.audioVideo.[realtimeIsLocalAudioMuted()](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#realtimeislocalaudiomuted).

To subscribe to changes in the local attendee’s audio mute state, call meetingSession.audioVideo.[realtimeSubscribeToMuteAndUnmuteLocalAudio(callback)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#realtimesubscribetomuteandunmutelocalaudio).

To unsubscribe from changes in the local attendee’s audio mute state, call meetingSession.audioVideo.[realtimeUnsubscribeToMuteAndUnmuteLocalAudio(callback)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#realtimeunsubscribetomuteandunmutelocalaudio).

### 6b. Prevent a local attendee from unmuting audio (optional)

Depending on the type of meeting application you are building, you may want to temporarily prevent the local attendee from unmuting (e.g. to avoid disruption if someone is presenting). If so, use the methods below rather than keeping track of your own can-unmute state.

To set whether or not the local attendee can unmute, call meetingSession.audioVideo.[realtimeSetCanUnmuteLocalAudio(canUnmute)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#realtimesetcanunmutelocalaudio).

To determine whether or not the local attendee can unmute, call meetingSession.audioVideo.[realtimeCanUnmuteLocalAudio()](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#realtimecanunmutelocalaudio).

To subscribe to changes in whether or not the local attendee can unmute, call meetingSession.audioVideo.[realtimeSubscribeToSetCanUnmuteLocalAudio(callback)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#realtimesubscribetosetcanunmutelocalaudio).

To unsubscribe from changes in whether or not the local attendee can unmute, call meetingSession.audioVideo.[realtimeUnsubscribeToSetCanUnmuteLocalAudio(callback)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#realtimeunsubscribetosetcanunmutelocalaudio).

## 7. Share and display video

A video tile is a binding of four key things: a tile ID, an attendee ID, that attendee’s video stream, and an HTMLVideoElement in the DOM. If all those things are present, the video tile is said to be active, and the video element displays video.

Local video is automatically displayed horizontally-mirrored by convention.

### 7a. Share local video

After choosing the video input and starting the meeting session, you can share the local attendee’s video with remote attendees.

To start sharing video with others, call meetingSession.audioVideo.[startLocalVideoTile()](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#startlocalvideotile).

To stop sharing video with others, call meetingSession.audioVideo.[stopLocalVideoTile()](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#stoplocalvideotile).

### 7b. Display local and remote video

You are responsible for maintaining HTMLVideoElement objects in the DOM and arranging their layout within the web page. To display a video, you must handle the [videoTileDidUpdate](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#videotiledidupdate) and [videoTileWasRemoved](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#videotilewasremoved) callbacks in an [AudioVideoObserver](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html). In the implementation of [videoTileDidUpdate](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#videotiledidupdate), bind the tile ID from the provided VideoTileState with the HTMLVideoElement in your DOM by calling meetingSession.audioVideo.[bindVideoElement(tileId, videoElement)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#bindvideoelement).

To unbind a tile, call meetingSession.audioVideo.[unbindVideoElement(tileId)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#unbindvideoelement). Note that this will also set `HTMLVideoElement.srcObject` to `null`. Call `unbindVideoElement(tileId, false)` to avoid the video element clean up. Check [this PR](https://github.com/aws/amazon-chime-sdk-js/pull/2217) description for more details.

A `tileId` is a unique identifier representing a video stream. When you stop and start, it generates a new `tileId`. You can have tileIds exceeding 25; they merely identify a particular stream uniquely. When you start video it consumes a video publishing slot, when you stop video it releases that video publishing slot. Pausing does not affect video publishing slots; it allows a remote to choose to not receive a video stream (and thus not consume bandwidth and CPU for that stream).

### 7c. Pause and unpause video (optional)

Video tiles may be paused individually. The server will not send paused video streams to the attendee requesting the pause. Pausing video does not affect remote attendees.

To pause video, call meetingSession.audioVideo.[pauseVideoTile(tileId)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#pausevideotile).

To resume a paused video, call meetingSession.audioVideo.[unpauseVideoTile(tileId)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#unpausevideotile).

### 7d. Find video tiles (optional)

Aside from the [videoTileDidUpdate](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#videotiledidupdate) and [videoTileWasRemoved](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#videotilewasremoved) callbacks in an [AudioVideoObserver](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html), video tile information can be gathered from the following methods.

To get all video tiles, call meetingSession.audioVideo.[getAllVideoTiles()](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#getallvideotiles).

To get all remote attendees’ video tiles, call meetingSession.audioVideo.[getAllRemoteVideoTiles()](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#getallremotevideotiles).

To get the local attendee’s video tile, call meetingSession.audioVideo.[getLocalVideoTile()](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#getlocalvideotile).

To get a video tile, call meetingSession.audioVideo.[getVideoTile(tileId)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#getvideotile).

## 8. Share screen and other content (optional)

You can share any [MediaStream](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream), such as from a screen capture or media file, as the content share for an attendee. When a content share is started, another attendee with the attendee ID `<attendee-id>#content` joins the meeting. The content audio and video appears like a regular attendee. You can subscribe to its volume indicator to show it in the roster and bind its video tile to a video element the same as you would for a regular attendee.

Each attendee can share one content share in addition to their main mic and camera. Each meeting may have two simultaneous content shares. Content share does not count towards the max video tile limit for both publishing and subscription. There may be up to two content shares irrespective of how many attendees are sharing their camera. Refer to [Amazon Chime SDK service quotas
](https://docs.aws.amazon.com/chime-sdk/latest/dg/meetings-sdk.html#mtg-limits) for details.

### 8a. Start and stop the content share

To start the content share, call meetingSession.audioVideo.[startContentShare(stream)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#startcontentshare).

To start sharing screen as a content share, call meetingSession.audioVideo.[startContentShareFromScreenCapture(sourceId)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#startcontentsharefromscreencapture).

To stop the content share, call meetingSession.audioVideo.[stopContentShare()](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#stopcontentshare).

To pause content share, call meetingSession.audioVideo.[pauseContentShare()](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#pausecontentshare).

To resume content share, call meetingSession.audioVideo.[unpauseContentShare()](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#unpausecontentshare).

### 8b. Register a content share observer

You can receive events about the content share by implementing a [ContentShareObserver](https://aws.github.io/amazon-chime-sdk-js/interfaces/contentshareobserver.html) and adding the observer to the meeting session.

To add a ContentShareObserver, call meetingSession.audioVideo.[addContentShareObserver(observer)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#addcontentshareobserver).

To remove a ContentShareObserver, call meetingSession.audioVideo.[removeContentShareObserver(observer)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#removecontentshareobserver).

You can implement the following callbacks:

* [contentShareDidStart](https://aws.github.io/amazon-chime-sdk-js/interfaces/contentshareobserver.html#contentsharedidstart): occurs when a content share session is started
* [contentShareDidStop](https://aws.github.io/amazon-chime-sdk-js/interfaces/contentshareobserver.html#contentsharedidstop): occurs when a content share session is stopped
* [contentShareDidPause](https://aws.github.io/amazon-chime-sdk-js/interfaces/contentshareobserver.html#contentsharedidpause): occurs when a content share session is paused
* [contentShareDidUnpause](https://aws.github.io/amazon-chime-sdk-js/interfaces/contentshareobserver.html#contentsharedidunpause): occurs when a content share session is resumed

## 9. Send and receive data messages (optional)

Attendees can broadcast small (2KB max) data messages to other attendees. Data messages can be used to signal attendees of changes to meeting state or develop custom collaborative features. Each message is sent on a particular topic, which allows you to tag messages according to their function to make it easier to handle messages of different types.

To send a message on a given topic, call meetingSession.audioVideo.[realtimeSendDataMessage()](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#realtimesenddatamessage). When sending a message if you specify a lifetime, then the media server stores the messages for the lifetime. Up to 1024 messages may be stored for a maximum of 5 minutes. Any attendee joining late or reconnecting will automatically receive the messages in this buffer once they connect. You can use this feature to help paper over gaps in connectivity or give attendees some context into messages that were recently received.

To receive messages on a given topic, set up a handler using the meetingSession.audioVideo.[realtimeSubscribeToReceiveDataMessage()](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#realtimesubscribetoreceivedatamessage). In the handler, you receive a [DataMessage](https://aws.github.io/amazon-chime-sdk-js/classes/datamessage.html) containing the payload of the message and other metadata about the message.

To unsubscribe the receive message handler, call meetingSession.audioVideo.[realtimeUnsubscribeFromReceiveDataMessage()](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#realtimeunsubscribefromreceivedatamessage).

If you send too many messages at once, your messages may be returned to you with the [throttled](https://aws.github.io/amazon-chime-sdk-js/classes/datamessage.html#throttled) flag set. The current throttling soft limit for Data 
Messages is 100 messages per second with the maximum burst size of 200 for a meeting (i.e. a 'token bucket' of size 
200 that refills at 100 tokens per second). If you continue to exceed the throttle limit, then the server may hang up the connection. The hard limit for each attendee is 200 
messages per second with the maximum burst of 2000 and for a meeting is 500 messages per second with the maximum 
burst of 10000.

**Note:** Take care when using data messages for functionality involving *asymmetric permissions* (e.g. a moderator attendee sending a message to regular attendees). Any attendee may, in theory, send any message on any topic. You should always confirm that the message's [senderAttendeeId](https://aws.github.io/amazon-chime-sdk-js/classes/datamessage.html#senderattendeeid) belongs to an attendee that is allowed to send that type of message, and your handler should tolerate messages that are not serialized in the format you are expecting.
