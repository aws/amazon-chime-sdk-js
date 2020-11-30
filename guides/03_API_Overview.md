# API Overview

This guide gives an overview of the API methods you can use to create meeting with audio and video with a roster of attendees and basic controls. Several additional API methods that may be helpful are also described and marked optional.

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

### 1c. Create a meeting session configuration

Create a [MeetingSessionConfiguration](https://aws.github.io/amazon-chime-sdk-js/classes/meetingsessionconfiguration.html#constructor) object with the responses to [chime:CreateMeeting](https://docs.aws.amazon.com/chime/latest/APIReference/API_CreateMeeting.html) and [chime:CreateAttendee](https://docs.aws.amazon.com/chime/latest/APIReference/API_CreateAttendee.html). Your server application should make these API calls and securely pass the meeting and attendee responses to the browser client application.

```
const configuration = new MeetingSessionConfiguration(meetingResponse, attendeeResponse);
```

### 1d. Create a meeting session

Using the above objects, create a [DefaultMeetingSession](https://aws.github.io/amazon-chime-sdk-js/classes/defaultmeetingsession.html#constructor).

```
const meetingSession = new DefaultMeetingSession(configuration, logger, deviceController);
```

## 2. Configure the session

Before starting the meeting session, you should configure audio and video devices. By default, no devices are selected.

### 2a. Configure the device label trigger (optional)

When obtaining devices to configure, the browser may initially decline to provide device labels due to privacy restrictions. However, without device labels the application user will not be able to select devices by name. When no labels are present, the device-label trigger is run. The default implementation of the device-label trigger requests permission to the mic and camera. If the user grants permission, the device labels will become available.

You can override the behavior of the device-label trigger by calling meetingSession.audioVideo.[setDeviceLabelTrigger(trigger)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#setdevicelabeltrigger).

### 2b. Register a device-change observer (optional)

You can receive events about changes to available devices by implementing a [DeviceChangeObserver](https://aws.github.io/amazon-chime-sdk-js/interfaces/devicechangeobserver.html) and registering the observer with the device controller.

To add a DeviceChangeObserver, call deviceController.[addDeviceChangeObserver(observer)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#adddevicechangeobserver).

To remove a DeviceChangeObserver, call deviceController.[removeDeviceChangeObserver(observer)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#removedevicechangeobserver).

You can implement the following callbacks:

* [audioInputsChanged](https://aws.github.io/amazon-chime-sdk-js/interfaces/devicechangeobserver.html#audioinputschanged): occurs when audio inputs are changed
* [audioOutputsChanged](https://aws.github.io/amazon-chime-sdk-js/interfaces/devicechangeobserver.html#audiooutputschanged): occurs when audio outputs are changed
* [videoInputsChanged](https://aws.github.io/amazon-chime-sdk-js/interfaces/devicechangeobserver.html#videoinputschanged): occurs when video inputs are changed

### 2c. Configure the audio input device

To send audio to the remote attendees, list the available audio input devices and choose an input to use.

To retrieve a list of available audio input devices, call meetingSession.audioVideo.[listAudioInputDevices()](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#listaudioinputdevices).

To use the chosen audio input device, call meetingSession.audioVideo.[chooseAudioInputDevice(device)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#chooseaudioinputdevice).

### 2d. Preview microphone volume levels (optional)

You can create a WebAudio [AnalyserNode](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode) from the current audio input to generate a display such as a mic indicator. This is useful for allowing attendees to preview their microphone volume level prior to joining the meeting.

To create the AnalyserNode, call meetingSession.audioVideo.[createAnalyserNodeForAudioInput()](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#createanalysernodeforaudioinput).

### 2e. Configure the audio output device (optional)

On browsers that [support setSinkId](https://caniuse.com/#search=setSinkId), you can optionally list the available audio output devices and choose one to use.

To retrieve a list of available audio output devices, call meetingSession.audioVideo.[listAudioOutputDevices()](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#listaudiooutputdevices).

To use the chosen audio output device, call meetingSession.audioVideo.[chooseAudioOutputDevice(deviceId)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#chooseaudiooutputdevice).

### 2f. Bind the audio output to an audio element

To hear audio from the remote attendees, bind the audio output device to an HTMLAudioElement in the DOM. The element does not need to be visible; you can hide it with CSS style `display: none`.

To bind the chosen audio output device to a HTMLAudioElement, call meetingSession.audioVideo.[bindAudioElement(element)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#bindaudioelement).

To unbind the chosen audio output device, call meetingSession.audioVideo.[unbindAudioElement()](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#unbindaudioelement).

### 2g. Configure the video input device

To send video to remote attendees, list the available video input devices, optionally select video quality settings, and choose a device to use.

To get a list of available video input devices, call meetingSession.audioVideo.[listVideoInputDevices()](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#listvideoinputdevices).

You can configure the quality of the video that is sent to the remote attendees by calling meetingSession.audioVideo.[chooseVideoInputQuality(width, height, frameRate, maxBandwidthKbps)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#choosevideoinputquality). The changes take effect the next time a video input device is chosen. The default quality is 960x540 @ 15 fps with a maximum uplink bandwidth of 1400 kbps. The maximum supported quality settings are 1280x720 @ 30 fps with a maximum uplink bandwidth of 2400 Kbps. Actual quality achieved may vary throughout the call depending on what the device, system, and network can provide.

To use the chosen video input device, call meetingSession.audioVideo.[chooseVideoInputDevice(device)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#choosevideoinputdevice).

### 2h. Preview local camera in a video element (optional)

Before the session is started, you can start a preview of the video in an HTMLVideoElement in the DOM.

To start video preview, call meetingSession.audioVideo.[startVideoPreviewForVideoInput(element)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#choosevideoinputdevice).

To stop video preview, call meetingSession.audioVideo.[stopVideoPreviewForVideoInput(element)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#stopvideopreviewforvideoinput).

## 3. Register an audio-video observer

You can receive audio and video events by implementing the [AudioVideoObserver](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html) interface and registering the observer with the meeting session.

To add an AudioVideoObserver, call meetingSession.audioVideo.[addObserver(observer)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#addobserver).

To remove an AudioVideoObserver, call meetingSession.audioVideo.[removeObserver(observer)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#removeobserver).

You should implement the following key observer callbacks:

* [audioVideoDidStart](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#audiovideodidstart): occurs when the audio-video session finishes connecting
* [audioVideoDidStartConnecting](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#audiovideodidstartconnecting): occurs when the audio-video session is in the process of connecting or reconnecting
* [audioVideoDidStop](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#audiovideodidstop): occurs when the audio-video session has disconnected. Use the provided [MeetingSessionStatus](https://aws.github.io/amazon-chime-sdk-js/classes/meetingsessionstatus.html) to determine why the session disconnected.
* [videoTileDidUpdate](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#videotiledidupdate): occurs when either a video stream is started or updated. Use the provided VideoTileState to determine the tile ID and the attendee ID of the video stream.
* [videoTileWasRemoved](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#videotilewasremoved): occurs when a video stream stops and the reference to the tile (the tile ID) is deleted
* [videoAvailabilityDidChange](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#videoavailabilitydidchange): occurs video availability state has changed such as whether the attendee can start local video or whether remote video is available. See [MeetingSessionVideoAvailability](https://aws.github.io/amazon-chime-sdk-js/classes/meetingsessionvideoavailability.html) for more information.
* [videoSendDidBecomeUnavailable](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#videosenddidbecomeunavailable): occurs when attendee tries to start video but the maximum video limit of 16 tiles has already been reached by other attendees sharing their video

You may optionally listen to the following callbacks to monitor aspects of connection health:

* [connectionDidBecomePoor](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#connectiondidbecomepoor): occurs when the connection has been poor for a while
* [connectionDidSuggestStopVideo](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#connectiondidsuggeststopvideo): occurs when the connection has been poor while using video. You can use this to prompt the attendee to turn off video.
* [connectionHealthDidChange](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#connectionhealthdidchange): occurs when connection health has changed
* [estimatedDownlinkBandwidthLessThanRequired](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#estimateddownlinkbandwidthlessthanrequired): occurs when the total downlink video bandwidth estimation is less than the required video bitrate
* [metricsDidReceive](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#metricsdidreceive): occurs periodically when WebRTC media stats are available
* [videoNotReceivingEnoughData](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#videonotreceivingenoughdata): occurs when one or more remote video streams do not meet the expected average bitrate
* [videoReceiveBandwidthDidChange](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#videoreceivebandwidthdidchange): occurs when the available video receive bandwidth changed
* [videoSendBandwidthDidChange](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#videosendbandwidthdidchange): occurs when available video send bandwidth changed
* [videoSendHealthDidChange](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#videosendhealthdidchange): occurs when the actual video send bitrate or packets-per-second changes

## 4. Start and stop the session

Call this API after doing pre-requisite configuration (See previous sections). Otherwise, there will not be working audio and video.

To start the meeting session, call meetingSession.audioVideo.[start()](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#start). This method will initialize all underlying components, set up connections, and immediately start sending and receiving audio.

To stop the meeting session, call meetingSession.audioVideo.[stop()](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#stop).

The `stop()` method does not clean up observers. You can start and stop a session multiple times using the same observers. In other words observers are not tied to the lifecycle of the session.

## 5. Build a roster of participants using the real-time API

Use the following methods to learn when attendees join and leave and when their volume level, mute state, or signal strength changes.

When implementing a real-time callback, you must ensure that it never throws an exception. To preserve privacy, uncaught exceptions inside a real-time callback are treated as fatal: the session is disconnected immediately. The cautions around real-time callbacks do not apply to the observers. For example, uncaught exceptions are not fatal to observers (though they should be avoided).

Real-time volume indicator callbacks are called at a rate of 5 updates per second. Ensure that your application is able to smoothly render these updates to avoid causing unnecessary CPU load that could degrade the meeting experience.

*If you are using Angular*, ensure that all calls to the SDK are run outside of the Angular zone. Otherwise, the real-time messages received via the signaling channel and their real-time callbacks may cause the DOM to thrash with updates and degrade performance.

### 5a. Subscribe to attendee presence changes

To learn when attendees join or leave, subscribe to the attendee ID presence changes. The callback provides both the attendee ID and external user ID from [chime:CreateAttendee](https://docs.aws.amazon.com/chime/latest/APIReference/API_CreateAttendee.html) so that you may map between the two IDs.

To subscribe to attendee presence changes, call meetingSession.audioVideo.[realtimeSubscribeToAttendeeIdPresence(callback)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#realtimesubscribetoattendeeidpresence).

To unsubscribe to attendee presence changes, call meetingSession.audioVideo.[realtimeUnsubscribeToAttendeeIdPresence(callback)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#realtimeunsubscribetoattendeeidpresence).

### 5b. Subscribe to volume indicators

To show speaker volume, mute state, and signal strength for each attendee, subscribe to volume indicators for each attendee ID. You should subscribe and unsubscribe to attendee volume indicators as part of the attendee ID presence callback.

Volume is on a scale of 0 to 1 (no volume to max volume). Signal strength is on a scale of 0 to 1 (full packet loss to no packet loss). You can use the signal strength of remote attendees to show an indication of whether an attendee is experiencing packet loss and thus may be unable to communicate at the moment.

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

To unbind a tile, call meetingSession.audioVideo.[unbindVideoElement(tileId)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#unbindvideoelement).

A `tileId` is a unique identifier representing a video stream. When you stop and start, it generates a new `tileId`. You can have tileIds exceeding 16; they merely identify a particular stream uniquely. When you start video it consumes a video publishing slot, when you stop video it releases that video publishing slot. Pausing does not affect video publishing slots; it allows a remote to choose to not receive a video stream (and thus not consume bandwidth and CPU for that stream).

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

Each attendee can share one content share in addition to their main mic and camera. Each meeting may have two simultaneous content shares. Content share does not count towards the max video tile limit. There may be up to two content shares irrespective of how many attendees are sharing their camera.

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

If you send too many messages at once, your messages may be returned to you with the [throttled](https://aws.github.io/amazon-chime-sdk-js/classes/datamessage.html#throttled) flag set. The current throttling soft limit for Data Messages is Rate: 100, Burst: 200. If you continue to exceed the throttle limit (hard limit: Rate: 500, Burst: 10000), then the server may hang up the connection.

**Note:** Take care when using data messages for functionality involving *asymmetric permissions* (e.g. a moderator attendee sending a message to regular attendees). Any attendee may, in theory, send any message on any topic. You should always confirm that the message's [senderAttendeeId](https://aws.github.io/amazon-chime-sdk-js/classes/datamessage.html#senderattendeeid) belongs to an attendee that is allowed to send that type of message, and your handler should tolerate messages that are not serialized in the format you are expecting.
