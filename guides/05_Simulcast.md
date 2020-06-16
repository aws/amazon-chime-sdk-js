# Video Simulcast

In multi-party video calls, attendees can enable the simulcast feature to enhance the overall video quality. Simulcast is a standardized technique where the video publishers create multiple renditions, or layers, of the same video source and video subscribers have the flexibility to choose the rendition that best fits their needs based on such factors as available bandwidth, compute and screen size.
The uplink policy controls the configuration of the renditions through camera capture and encoding parameters. The simulcast-enabled uplink policy is [SimulcastUplinkPolicy](https://aws.github.io/amazon-chime-sdk-js/classes/simulcastuplinkpolicy.html).

Simulcast is currently disabled by default. To enable it [MeetingSessionConfiguration.enableUnifiedPlanForChromiumBasedBrowsers](https://aws.github.io/amazon-chime-sdk-js/classes/meetingsessionconfiguration.html#enableunifiedplanforchromiumbasedbrowsers) and [MeetingSessionConfiguration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers](https://aws.github.io/amazon-chime-sdk-js/classes/meetingsessionconfiguration.html#enablesimulcastforunifiedplanchromiumbasedbrowsers) must both be set. With those set to true, the simulcast uplink policy will be automatically selected. We currently do not allow overriding the uplink policy when enable simulcast is set to true. Currently, only Chrome 76 and above is supported.

The [VideoAdaptiveProbePolicy](https://aws.github.io/amazon-chime-sdk-js/classes/videoadaptiveprobepolicy.html) downlink policy adaptively subscribes to the best simulcast layer and is automatically selected if [MeetingSessionConfiguration.enableUnifiedPlanForChromiumBasedBrowsers](https://aws.github.io/amazon-chime-sdk-js/classes/meetingsessionconfiguration.html#enableunifiedplanforchromiumbasedbrowsers) and [MeetingSessionConfiguration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers](https://aws.github.io/amazon-chime-sdk-js/classes/meetingsessionconfiguration.html#enablesimulcastforunifiedplanchromiumbasedbrowsers) are set to true.

## Details

### Simulcast overview

Simulcast support is built into the WebRTC library in the majority of browsers.  The video input resolution is used to initially configure the attributes and maximum number of allowed simulcast streams.  In WebRTC, if the RTCRtpSender is configured to have three layers of encoding, then the top layer is specified by the video input resolution. The resolution of the middle layer is scaled down by two vertically and horizontally by WebRTC. The lower layer is scaled down by four.  The WebRTC library supports a maximum of three simulcast layers, and only when the input resolution is 960x540 or higher will all three be available.

The recommended resolution in JS SDK is 1280x720. This resolution will provide the most flexibility and allow subscribers to maintain smoother video quality transitions.  In certain circumstances, like mobile browsers, the input resolution may not be high enough to support all desired simulcast streams, so the logic will adapt appropriately to send as many as possible.

The SimulcastUplinkPolicy configures RTCRtpSender to have three encoding layers, but only ever enables two of them.  Which two are enabled is based on a variety of factors.   Experiments show that configuring RTCRtpSender with three encoding layers up front and dynamically enabling and disabling layers provides a better experience and reduces the burden of having to dynamically  manage capture resolution and encoding parameters.

### Simulcast resolutions and behavior

WebRTC ultimately controls how much data is being sent to the network based on its bandwidth estimation algorithm. It's very hard to circumvent the estimated bandwidth or trick WebRTC into sending more than it estimates. Most browsers expose WebRTC peer connection statistics which developers can access to retrieve the estimated available bandwidths for uplink or downlink.

The estimated available bandwidth reveals some information of the health of the E2E network and can trigger various WebRTC behaviors when facing network adversity or in recovering from a network glitch. SimulcastUplinkPolicy does its best to anticipate and react to the underlying WebRTC behavior and work with it to avoid further impact on the video quality of services.

The SimulcastUplinkPolicy implements the following logic:

| Publishers | Estimated Uplink Bandwidth |     Simulcast stream 1   |    Simulcast stream 2    |
|-----------:|:--------------------------:|:------------------------:|:------------------------:|
|   <= 2 and |        >= 1600 kbps        | 1280x720@15fps 1200 kbps | 320x180@15fps 300 kbps   |
|   <= 2 and |        >= 1100 kbps        |  960x540@15fps 900 kbps  | 240x140@15fps 200 kbps   |
|   <= 4 and |        >= 600 kbps         |  960x540@15fps 600 kbps  | 240x140@15fps 200 kbps   |
|    > 4 or  |         < 600 kbps         |  640x360@15fps 400 kbps  | 320x180@15fps 200 kbps   |

When CPU and bandwidth consumption is overused, WebRTC can disable a layer or scale down resolution dynamically. The SimulcastUplinkPolicy has a monitoring mechanism which tracks the sending status and automatically adjusts without need for application intervention.

### Downlink  Bandwidth Policy

The [VideoAdaptiveProbePolicy](https://aws.github.io/amazon-chime-sdk-js/classes/videoadaptiveprobepolicy.html) adds functionality to take advantage of video simulcast.  The goal of this policy is to leave the complexity of managing the downlink bandwidth and decision of which streams to request inside the SDK and remove that burden from the application.  The policy monitors numerous pieces of information and uses that to determine which streams to subscribe to.  The data considered are:
1. Message from infrastructure enumerating video streams from each remote client
2. Estimated downlink bandwidth from WebRTC library
3. Media metrics such as packet loss and used bandwidth
4. Stream type - Screen share or camera device

The policy works by listening to any changes in the information listed above.  Anytime there is a change it re-evaluates the best mix of remote videos to fit within the target downlink bandwidth.  The policy is currently configured to try to request as many remote clients as possible, then increase resolution where possible.  It prioritizes screen share video above people video.  If there is insufficient bandwidth to request all far participants then only a certain number will be seen.

Applications will receive notifications of remote video being added or removed through the [videoTileDidUpdate](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#videotiledidupdate) and [videoTileWasRemoved](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#videotilewasremoved) callbacks.  There will not be any notifications when switches are made between the different simulcast resolutions.

If the application pauses a remote video by calling [pauseVideoTile](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#pausevideotile), then this policy will not include that remote video in the list of available streams and therefore will not automatically subscribe or unsubscribe from it while it is in the paused state.

When using the policy it is recommended that applications do not take action on the downlink monitoring events such as [videoNotReceivingEnoughData](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#videonotreceivingenoughdata) or [estimatedDownlinkBandwidthLessThanRequired](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#estimateddownlinkbandwidthlessthanrequired) since it may conflict with decisions being made within the policy.

The VideoAdaptiveProbePolicy can be used with or without simulcast.  To enable it without simulcast set the [MeetingSessionConfiguration.videoDownlinkBandwidthPolicy](https://aws.github.io/amazon-chime-sdk-js/classes/meetingsessionconfiguration.html#videodownlinkbandwidthpolicy) to [VideoAdaptiveProbePolicy](https://aws.github.io/amazon-chime-sdk-js/classes/videoadaptiveprobepolicy.html).  If simulcast is not active, then the policy will only be able to add or remove remote videos.

