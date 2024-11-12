# Quality, Bandwidth, and Connectivity

The Amazon Chime SDK for JavaScript, in conjunction with WebRTC, allows you to configure quality and bandwidth options for meeting sessions. It provides both automatic and manual controls to adapt to changing network conditions. Finding the right balance of quality and performance can be challenging when either the client's network or CPU is constrained. As network reliability and available bandwidth decrease, quality and functionality trade-offs must be made in real time to preserve the viability of the meeting. This guide gives an overview of challenges associated with devices and networks, degradation detection mechanisms, and mitigations for various levels of degradation.

- [Quality, Bandwidth, and Connectivity](#quality-bandwidth-and-connectivity)
  - [Goals](#goals)
  - [Challenges](#challenges)
  - [Detection Mechanisms](#detection-mechanisms)
    - [Events for monitoring local attendee downlink](#events-for-monitoring-local-attendee-downlink)
    - [Events for monitoring remote attendee uplink](#events-for-monitoring-remote-attendee-uplink)
    - [Metrics exposed directly from the WebRTC peer connection](#metrics-exposed-directly-from-the-webrtc-peer-connection)
    - [Events for monitoring currently active simulast layers](#events-for-monitoring-currently-active-simulast-layers)
  - [Mitigations](#mitigations)
    - [Automatic mitigations](#automatic-mitigations)
    - [Mitigations to conserve CPU](#mitigations-to-conserve-cpu)
      - [Application profiling](#application-profiling)
      - [Choose a lower local video quality](#choose-a-lower-local-video-quality)
      - [Pause remote videos](#pause-remote-videos)
    - [Mitigations to conserve bandwidth](#mitigations-to-conserve-bandwidth)
      - [Adjust local video quality](#adjust-local-video-quality)
      - [Turning off local video](#turning-off-local-video)
      - [Configure a video uplink policy](#configure-a-video-uplink-policy)
      - [Use active speaker detection](#use-active-speaker-detection)
      - [Configure a video downlink policy](#configure-a-video-downlink-policy)
    - [Use video simulcast](#use-video-simulcast)


## Goals

When designing an application that shares audio and video you should determine which functionality is most important to your end users. Just as responsive web design allows a single web application to adapt to changing screen sizes, the audio-video component of your application can also be responsive to changing device and network conditions. For example, in a collaborative meeting it may be acceptable to gracefully degrade to an audio-only experience. However, in a presentation where the screen is shared, the presenter audio and screen share video may be the most important.

## Challenges

To join an Amazon Chime SDK meeting, each client traverses the public internet to connect to the media services for that meeting which are hosted by the [AWS Global Infrastructure](https://aws.amazon.com/about-aws/global-infrastructure/) in one of the available SDK media regions. The following key factors influence the client experience:

- **Application performance:** if your client application is consuming a lot of CPU, then it may hinder the device from simultaneously processing media and transmitting and receiving network packets.
- **Client device performance:** transcoding audio and video in real-time is CPU intensive and may both decrease performance and further constrain the device's network adapter. Browsers may or may not support hardware acceleration depending on the codec profile and device hardware. Furthermore, browsers do not allow you to directly monitor CPU usage, so it can be difficult to tell whether CPU consumption is a factor in performance issues for your end-user devices.
- **Differences in uplink and downlink:** In order for an attendee to send audio or video to a remote attendee, both the sender's uplink and the receiver's downlink must have enough bandwidth. However, most end users will be on a network that has more downlink (receiving) bandwidth than uplink (sending) bandwidth. It can be challenging to determine whether a drop in quality is due to constraints of the sender, the receiver, or both.
- **Last mile network connectivity:** issues with WiFi, local area network, or the internet service provider may limit the effective bandwidth due to packet loss, bandwidth caps, or other hardware limitations.
- **Complexity and length of the network path:** meeting attendees that are geographically distant from the SDK media region may experience higher packet loss, jitter, and round-trip times due to the number of intermediate networks, which may vary in quality.

## Detection Mechanisms

The Amazon Chime SDK for JavaScript produces several kinds of events on the [AudioVideoObserver](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html) to monitor connectivity and quality. Use the following events and key health metrics to monitor the performance of the meeting session in real time. For code snippets showing how to subscribe to these events, see [Monitoring and Alerts](https://github.com/aws/amazon-chime-sdk-js#monitoring-and-alerts).

*Metrics derived from WebRTC stats are not guaranteed to be present in all browsers. In such cases the value may be missing.*

*For the browser support columns below, "All" refers to the browsers officially supported by the Chime SDK.*

### Events for monitoring local attendee downlink

|Event | Notes | Browsers |
|------------ | ------------- | ------------- |
|[connectionDidSuggestStopVideo](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#connectiondidsuggeststopvideo) | Indicates that the audio connection is experiencing packet loss. Stopping local video and pausing remote video tiles may help the connection recover by reducing CPU usage and network consumption. | All |
|[connectionDidBecomeGood](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#connectiondidbecomegood) | Indicates that the audio connection has improved. | All |
|[connectionDidBecomePoor](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#connectiondidbecomepoor) | Similar to the previous metric, but is fired when local video is already turned off. | All |

### Events for monitoring remote attendee uplink

|Event | Notes | Browsers |
|------------ | ------------- | ------------- |
|[realtimeSubscribeToVolumeIndicator](https://aws.github.io/amazon-chime-sdk-js/interfaces/realtimecontroller.html#realtimesubscribetovolumeindicator) | The `signalStrength` field indicates whether the server is receiving the remote attendee's audio. A value of 1 indicates a good connection, a value of 0.5 or 0 indicates some or total packet loss. Since each attendee receives the signal strength for all attendees, this event can be used to monitor the ability of attendees to share their audio in real-time. | All |

### Metrics exposed directly from the WebRTC peer connection

|Event| Notes | Browsers |
|------------ | ------------- | ------------- |
|[metricsDidReceive](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#metricsdidreceive) | Exposes the WebRTC getStats metrics. There may be differences among browsers as to which metrics are reported. | All |

> Note: We have built a video WebRTC statistics widget in the demo browser meeting app. This widget is shown as an overlay on the video, when the video is enabled.
>
> You get the following WebRTC stats in the video stats widget:
>
> Upstream video information: Frame height, Frame width, Bitrate (bps), Packets Sent, Frame Rate (fps), Audio Jitter.
>
> Downstream video information: Frame height, Frame width, Bitrate (bps), Packet Loss (%), Frame Rate (fps).
>
> You can also use this event to get the raw [`RTCStatsReport`](https://developer.mozilla.org/en-US/docs/Web/API/RTCStatsReport) through `clientMetricReport.getRTCStatsReport()`
>
> You can check the implementation in the [demo app](https://github.com/aws/amazon-chime-sdk-js/blob/main/demos/browser/app/meetingV2/meetingV2.ts) to build your own custom widget
> (look for `getObservableVideoMetrics` method in the demo). This video stats widget is built using the [getObservableVideoMetrics](https://aws.github.io/amazon-chime-sdk-js/interfaces/clientmetricreport.html#getobservablevideometrics) and the [metricsDidReceive](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#metricsdidreceive) APIs. Through the information provided in these stats, the application can monitor key attributes and take action. For instance if the bitrate or resolution falls below a certain threshold, the user could be notified in some manner, or diagnostic reporting could take place.


### Events for monitoring currently active simulast layers

|Event | Notes | Browsers |
|------------ | ------------- | ------------- |
|[encodingSimulcastLayersDidChange](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#encodingsimulcastlayersdidchange) | Called when simulcast is enabled and simulcast uplink encoding layers are changed. Check the [simulcast guide](https://aws.github.io/amazon-chime-sdk-js/modules/simulcast.html#receive-upstream-simulcast-layer-change-notification) for more information on simulcast. | Chromium-based |

## Mitigations

### Automatic mitigations

WebRTC will automatically reduce video frame rate, resolution, and bandwidth if it detects that it is unable to send video at the specified rate due to bandwidth or CPU.

### Mitigations to conserve CPU

#### Application profiling

Use the browser's built-in developer tools to profile your application and determine whether there are any hotspots. When handling real-time events (prefixed with `realtime`) ensure that you are doing as little processing as possible. See the [API Overview section on building a roster](https://aws.github.io/amazon-chime-sdk-js/modules/apioverview.html#5-build-a-roster-of-participants-using-the-real-time-api) for more information. In particular, look out for expensive DOM updates (such as when manipulating the roster or video tile layout).

When possible, profile on devices that have similar performance characteristics to the ones you expect to be used by your end users.

#### Choose a lower local video quality

Sometimes it is better to sacrifice video quality in order to prioritize audio. You can call [chooseVideoInputQuality(width, height, frameRate)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#choosevideoinputquality) and [setVideoMaxBandwidthKbps(maxBandwidthKbps)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#setvideomaxbandwidthkbps) to lower the maximum bandwidth in real-time. You can also adjust the resolution and frame rate if you call the method before starting local video (or stop and then restart the local video). See the section below on values you can use for `chooseVideoInputQuality`.

#### Pause remote videos

Calling [pauseVideoTile](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#pausevideotile)  on remote video tiles will reduce the amount of CPU consumed due to decoding remote attendee video.

### Mitigations to conserve bandwidth

In the absence of packet loss, keep in mind that the sender uplink and receiver downlink consume the same bandwidth for each video tile. Mitigations affecting one sender's uplink can benefit all receiver's downlinks. This means that in order to help receiver's, sometimes the best course of action is to lower the bandwidth consumed by the sender.

#### Adjust local video quality

You can choose a video quality of up to 1280x720 (720p) at 30 fps using [chooseVideoInputQuality(width, height, frameRate)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#choosevideoinputquality) and [setVideoMaxBandwidthKbps(maxBandwidthKbps)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#setvideomaxbandwidthkbps) APIs before the meeting session begins. However, in some cases it is not necessary to send the highest quality and you can use a lower values. For example, if the size of the video tile is small then the highest quality may not be worth the additional bandwidth and CPU overhead.

Example:

```js
// 360p
meetingSession.audioVideo.chooseVideoInputQuality(640, 360, 15);
meetingSession.audioVideo.setVideoMaxBandwidthKbps(600);

// 540p
meetingSession.audioVideo.chooseVideoInputQuality(960, 540, 15);
meetingSession.audioVideo.setVideoMaxBandwidthKbps(1400);

// 720p
meetingSession.audioVideo.chooseVideoInputQuality(1280, 720, 15);
meetingSession.audioVideo.setVideoMaxBandwidthKbps(1400);
```

The default resolution in the SDK is 540p at 15 fps and 1400 Kbps. Lower resolutions can be set if you anticipate a low bandwidth situation. Browser and codec support for very low resolutions may vary.

The value `maxBandwidthKbps` is a recommendation you make to WebRTC to use as the upper limit for upstream sending bandwidth. The Chime SDK default is 1400 Kbps for this value. The following table provides recommendations of minimum bandwidth value per resolution for typical video-conferencing scenarios. Note that when low values are selected the video can be appear pixelated. Using 15 fps instead of 30 fps will substantially decrease the required bit rate and may be acceptable for low-motion content.

| Resolution | Frame Rate Per Sec | Min Kbps |
| ------------ | ------------- | ------------- |
| 180p | 30 | 100 |
| 360p | 30 | 250 |
| 480p | 30 | 400 |
| 540p | 30 | 500 |
| 720p | 30 | 1400 |

Setting a frame rate below 15 is not recommend and will cause the video to appear jerky and will not significantly improve the bandwidth consumed since key frames will still be sent occasionally. It would be better to adjust the resolution than set a very low frame rate.

#### Turning off local video

In some situations it may be best to turn off the local video tile to improve audio uplink, CPU consumption, or remote attendee downlink.

You can also observe the [connectionDidSuggestStopVideo](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#connectiondidsuggeststopvideo) event to monitor audio packet loss and use that as a cue to turn off local video using [stopLocalVideoTile](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#stoplocalvideotile).

#### Configure a video uplink policy

The SDK by default uses the [NScaleVideoUplinkBandwidthPolicy](https://aws.github.io/amazon-chime-sdk-js/classes/nscalevideouplinkbandwidthpolicy.html) which monitors number of participants in the meeting and automatically scales down the maxBandwidthKbps as the number of remote video tiles increases. This can be customized by implementing a [VideoUplinkBandwidth Policy](https://aws.github.io/amazon-chime-sdk-js/classes/meetingsessionconfiguration.html#videouplinkbandwidthpolicy) and setting it in the [MeetingSessionConfiguration](https://aws.github.io/amazon-chime-sdk-js/classes/meetingsessionconfiguration.html#videouplinkbandwidthpolicy) class.

#### Use active speaker detection

You can use the [active speaker detector](https://aws.github.io/amazon-chime-sdk-js/modules/apioverview.html#5d-subscribe-to-an-active-speaker-detector-optional) to show only the video of the active speakers and pause other videos.

#### Configure a video downlink policy

By default the SDK uses the [AllHighestVideoBandwidthPolicy](https://aws.github.io/amazon-chime-sdk-js/classes/allhighestvideobandwidthpolicy.html) which will not adapt to local receive network conditions and always subscribes to the highest quality video of all participant, but [VideoPriorityBasedPolicy](https://aws.github.io/amazon-chime-sdk-js/classes/videoprioritybasedpolicy.html) will downgrade or pause videos in response to network constraints. Additional configuration of that policy is required to select which remote videos to subscribe to, see [the guide](https://aws.github.io/amazon-chime-sdk-js/modules/prioritybased_downlink_policy.html) for more information. Downgrades are only possible if [simulcast or SVC is enabled](https://aws.github.io/amazon-chime-sdk-js/modules/simulcast.html#).

You can customize the default downlink policy by setting the [VideoDownlinkBandwidthPolicy](https://aws.github.io/amazon-chime-sdk-js/classes/meetingsessionconfiguration.html#videodownlinkbandwidthpolicy) in [MeetingSessionConfiguration](https://aws.github.io/amazon-chime-sdk-js/classes/meetingsessionconfiguration.html#videodownlinkbandwidthpolicy) class.

### Use video simulcast

Simulcast is a standardized technique in WebRTC to enhance video quality in a multi-party call. Amazon Chime SDK for JavaScript provides a video simulcast solution for Chromium-based browsers. To use simulcast, please refer to the documentation [here](https://aws.github.io/amazon-chime-sdk-js/modules/simulcast.html#).
