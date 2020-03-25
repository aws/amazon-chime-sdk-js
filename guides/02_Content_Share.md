### Content Share

This guide explains how to share audio and video content such as screen capture or
media files in a meeting. This guide assumes you have already created a meeting and
added attendees to the meeting (see
[Getting Started](https://aws.github.io/amazon-chime-sdk-js/modules/gettingstarted.html)
for more information).

Content share methods are accessed from the
[audio-video facade](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html)
belonging to the meeting session.

#### Share content

Using the audio-video facade, start sharing content by calling
[startContentShare](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#startcontentshare)
and provide a
[MediaStream](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream):

```javascript
const meetingSession = // reference to MeetingSession
await meetingSession.audioVideo.startContentShare(mediaStream);
```

To start a screen capture, call the convenience method
[startContentShareFromScreenCapture](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#startcontentsharefromscreencapture).

When calling from a browser, leave `sourceId` empty. This will launch the
browser's native screen capture picker.

```javascript
const meetingSession = // reference to MeetingSession
await meetingSession.audioVideo.startContentShareFromScreenCapture();
```

When calling from Electron, build a screen capture picker into your application and
pass the `sourceId` of the chosen screen capture to the method. See the
[desktop-capture](https://github.com/hokein/electron-sample-apps/tree/master/desktop-capture)
sample application for more information.

```javascript
const meetingSession = // reference to MeetingSession
const sourceId = // get this from your custom Electron screen capture picker
await meetingSession. audioVideo.startContentShareFromScreenCapture(sourceId);
```

#### View the content share

Content shares are treated as regular audio-video attendees. The attendee ID of a
content share has a suffix of
[#content](https://aws.github.io/amazon-chime-sdk-js/enums/contentshareconstants.html#modality).
You receive real-time attendee presence and volume indicator callbacks
for content audio and video tile updates for content video.

To view the content share:

- Create an instance of [AudioVideoObserver](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html) that implements [videoTileDidUpdate](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#videotiledidupdate) to receive callbacks when the video tile is created and updated
- Add the observer with [addObserver](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#addobserver) method to receive events.
- In `videoTileDidUpdate`, bind the video tile to a video element in your app:

```javascript
const meetingSession = // reference to MeetingSession
const tileState = // reference to tileState parameter in videoTileDidUpdate
const videoElement = document.getElementById('video-element-id');
meetingSession.audioVideo.bindVideoElement(tileState.tileId , videoElement);
```

Use the
[isContent](https://aws.github.io/amazon-chime-sdk-js/classes/videotilestate.html#iscontent)
property of the
[TileState](https://aws.github.io/amazon-chime-sdk-js/classes/videotilestate.html)
to check if the video tile is a content share, and any add special logic you need
to handle the content share.

You can also use the [Modality](https://aws.github.io/amazon-chime-sdk-js/interfaces/modality.html)
class to determine that an attendee ID is a content share:

```javascript
if (new DefaultModality(attendeeId).hasModality(DefaultModality.MODALITY_CONTENT)) {
  // ...special handling for content share...
}
```

#### Pause and unpause the content share

To pause and unpause the content share, call
[pauseContentShare](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#pausecontentshare) and
[unpauseContentShare](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#unpausecontentshare).

```javascript
const meetingSession = // reference to MeetingSession
await meetingSession.audioVideo.pauseContentShare();
````

```javascript
const meetingSession = // reference to MeetingSession
await meetingSession.audioVideo.unpauseContentShare();
````

#### Stop the content share

To stop the content share, call
[stopContentShare](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#stopcontentshare).

```javascript
const meetingSession = // reference to MeetingSession
await meetingSession.audioVideo.stopContentShare();
````

#### Receive content share events

Implement methods from [ContentShareObserver](https://aws.github.io/amazon-chime-sdk-js/interfaces/contentshareobserver.html) and
add an instance of the observer using
[addContentShareObserver](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#addcontentshareobserver)
to receive events.
