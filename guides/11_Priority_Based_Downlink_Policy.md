# User Guide for Priority-based Downlink Policy

## Introduction

Amazon Chime SDK for JavaScript allows builders to choose a downlink policy on each device when joining a meeting. Downlink policies control the way how a recipient subscribes to the remote video sources. This document explains how to use the `VideoPriorityBasedPolicy` introduced in version 2.8, how it differs from the existing policies and how builders can take advantage of it to meet their use cases.

Amazon Chime SDK for JavaScript defines `VideoPriorityBasedPolicy` as the central class providing the ability to request remote video sources to receive and set their respective priorities. The policy ensures bandwidth is reserved for video sources with higher priorities. This policy can be used in conjunction with clients sending simulcast renditions of sources, as well as single stream or mixed environments.

The existing `AllHighestVideoBandwidthPolicy` and `AdaptiveProbePolicy` both subscribe to a fixed number of available remote video sources. Builders listen to `videoTileDidUpdate` when a new remote video source becomes available and call `pauseVideoTile` if they don’t want it to be seen, otherwise video sources will be consumed automatically. `VideoPriorityBasedPolicy` relies on builders subscribing to `AudioVideoObserver.remoteVideoSourcesDidChange` to receive updates on available remote sources, and then calling `chooseRemoteVideoSources` to set which video sources to receive and their related preferences. Note that when using `VideoPriorityBasePolicy`, if builders do not call `chooseRemoteVideoSources`, no videos will be subscribed to. `videoTileDidUpdate` will then be called if we are able to successfully subscribe to the stream.

Under constrained networks where simulcast is in use, `VideoPriorityBasedPolicy` may lower the resolution of remote video sources, starting with the lowest priority sources. All video sources are separeted into multiple groups by different priorities. If all video sources within same priority group are at the lowest resolution possible, or simulcast is not being used, the policy may further pause video tiles until the network has recovered. Same operations will be repeated group by group, from priority lowest to highest.

A typical workflow to use this policy would be:

1. When creating `meetingSession.configuration`, construct and set a `VideoPriorityBasedPolicy` object as the` videoDownlinkBandwidthPolicy`
2. Monitor callbacks on `AudioVideoObserver.remoteVideoSourcesDidChange` to receive updates on available sources.
3. Update `VideoPreference` for each video stream and then call `chooseRemoteVideoSources`
4. Repeat step 2 as needed to update the desired receiving set of remote sources and their priorities, either due to changes indicated by `AudioVideoObserver.remoteVideoSourcesDidChange` or other application events (like switching the current page of videos).


Note that applications still need to handle `videoTileDidUpdate` just as done without the policy. Detailed usage and explanation can be found below.

## APIs and Usage

**MeetingSessionConfiguration**
When initializing the meeting, builders can specify the usage of the `VideoPriorityBasedPolicy` by allocating the policy in the application and passing it in through the `MeetingSessionConfiguration` when the meeting session is started. 

**Notification of current available remote sources**
Once you are connected to the meeting, builders will be notified of available remote video sources via the existing `remoteVideoSourcesDidChange` callback.

**Priority and max size for each remote stream**
`VideoPreference` is used to contain the priority and size of remote video sources and content share to be received. There are three fields inside the `VideoPreference,` you could find more info for each field below.

* _*attendeeId:*_  The attendee ID this video tile belongs to. Note that screen share video will have a suffix of #content
* _*priority:*_ Provides relative priority of this attendee from 1 to x, where 1 is the highest priority. Remote videos are allowed to have the same priority signifying equal priority between them.
* *_targetSize:_* Optional parameter to control maximum simulcast layer to receive. Default value is High.

**Configuring the receipt and priority of remote video sources** 
The main API being used is:

```
chooseRemoteVideoSources(sources: VideoPreference[]): void
```

An array of `VideoPreference` is passed in to specify preference for each remote video. 
Be aware of the following when calling this function: 

* You must pass a complete array of VideoPreference objects each time you call chooseRemoteVideoSources. Each call overrides the behavior defined by any previous call. The AudioVideoController will unsubscribe from any existing video streams associated with attendee IDs that are not present in the new array. Do not modify the provided array after calling this function; for efficiency, the policy object does not clone the array.
* Including a remote video stream in this list does not guarantee that the video will be received. If there is insufficient bandwidth then the lowest priority video(s) will be paused and the client will be notified.
* A video tile will be created for all requested video streams. If there is insufficient bandwidth to receive the video then the policy will pause it and provide notification with a reason. *This is a difference in behavior from the current `AdaptiveProbePolicy` which removes the tile for this condition.*
* Content share is treated as another video stream**:** Builders will need to specify content video and its priority as well. It will not be auto subscribed to anymore when using priority based downlink policy.
* Any newly added remote videos (e.g. a new `VideoPreference` was added to the list) to the list will result in a `videoTileDidUpdate` event, and any removed remote videos (e.g. a `VideoPreference` was removed from the list, or an attendee left the meeting) will trigger a `videoTileWasRemoved` event.
* Any preferences entries associated with attendee IDs that are paused by the application or no longer available in the call will be ignored until unpaused.
* The policy may limit how often it updates the list of actual streams it subscribes to.

*(Note that the exact internal behavior of this policy may slightly change in future releases)*


**Receiving notifications that a remote video was paused due to bandwidth constraint**
If a remote video source is paused due to insufficient bandwidth, then the application will be notified through the existing notification mechanism by setting the VideoTileState to pausedDueToBandwidth. Note that there is already a member named `paused` in VideoTileState and that is used to track if the application paused the remote video.

## Builder Code Sample

Below, we are going to show one potential use case, “featured video”, that can be built on top of this policy.
A video tile can be featured by clicking a “Pin” button on it and its priority will be set to 1 whereas the rest unpinned tiles are set to 2 by default. The pinned tile will be displayed in a larger size and will not be paused/downgraded (if simulcast uplink policy being enabled on the remote side) until all of the rest are when encountering network constraint. 

First create an instance of `VideoPriorityBasedPolicy` that you will share with the meeting session. Then create a meeting session configuration and set `videoDownlinkBandwidthPolicy` to that created policy.

```
// `meetingLogger: Logger` created elsewhere
const priorityBasedDownlinkPolicy = new VideoPriorityBasedPolicy(meetingLogger);
// `configuration: MeetingSessionConfiguration` created elsewhere
configuration.videoDownlinkBandwidthPolicy = priorityBasedDownlinkPolicy;
```

Once connected to the meeting, we can an observer on `remoteVideoSourcesDidChange` and keep track of if which clients in the roster list are publishing video.

```
  // Assumes we are storing roster in a member variable like `roster: any = {};`
  remoteVideoSourcesDidChange(videoSources: VideoSource[]) {
    // Reset current hasVideo flag in roster list
    for (const attendeeId in this.roster) {
      this.roster[attendeeId].hasVideo = false;
    }
    // Update hasVideo flag based on latest data
    for(const source of videoSources) {
      if (this.roster.hasOwnProperty(source.attendee.attendeeId)) {
        this.roster[source.attendee.attendeeId].hasVideo = true;
      }
    }
    // Update downlink policy preferences accordingly
    // We will create this function below
    this.updateDownlinkPreference();
  }
```

We can then add a pin button to our application, and wire it up to change the priority of the respective video.  Update the tile button `click` callback to set or unset the pin status.

```
    pinButtonElement.addEventListener('click', () => {
      // Get the attendeeID associated with this tile
      const attendeeId = tileState.boundAttendeeId;
      // Change pin state
      this.roster[attendeeId].pinned = !this.roster[attendeeId].pinned;
      // Update label
      pauseButtonElement.innerText =
        (this.roster[attendeeId].pinned) ? 'Unpin' : 'Pin';
      // Update downlink policy to reflect pin/unpin change
      this.updateDownlinkPreference();
    });
```

We can then write `updateDownlinkPreference` which is shared by the above two snippets. This logic simply sets featured tiles to priority `1` and all others to priority `2`. This will ensure featured tiles are requested first at the highest resolution allowed by bandwidth and other participants are requested as bandwidth allows. To store the `VideoPreference` objects we use `VideoPreferences`, a set like data structure that allows efficient modification of an existing list while only copying when necessary.

```
  updateDownlinkPreference(): void {
    const videoPreferences: MutableVideoPreferences = VideoPreferences.prepare();
    for (const attendeeId in this.roster) {
      if (this.roster[attendeeId].hasVideo) {
        // Make pinned videos of equal high importance and the rest as secondary
        if (this.roster[attendeeId].pinned) {
          videoPreferences.add(new VideoPreference(attendeeId, 1, TargetDisplaySize.High));
        } else {
          videoPreferences.add(new VideoPreference(attendeeId, 2, TargetDisplaySize.Low));
        }
      }
    }
    this.priorityBasedDownlinkPolicy.chooseRemoteVideoSources(videoPreferences.build());
  } 
```

`chooseRemoteVideoSources` will trigger the remote selection logic based on the priority settings of each video tile then update the tile management accordingly. These steps are taken care of by the Amazon Chime SDK for JavaScript code.
