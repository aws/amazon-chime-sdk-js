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

|  Publishers/Attendees  | Estimated Uplink Bandwidth |     Simulcast stream 1   |    Simulcast stream 2    |
|-----------------------:|:--------------------------:|:------------------------:|:------------------------:|
|  Attendees <= 2        |           Any              | 1280x720@15fps 1200 kbps |         Not used         |
|  Publishers <= 4 and   |        >= 1000 kbps        | 1280x720@15fps 1200 kbps | 320x180@15fps 300 kbps   |
|  Publishers  <= 6 and  |        >= 350 kbps         |  640x360@15fps 600 kbps  | 320x180@15fps 200 kbps   |
|  Publishers  <= 6 and  |        > 300 kbps          |  640x360@15fps 600 kbps  | 320x180@15fps 150 kbps   |
|  Publishers > 6  and   |        >= 350 kbps         |  640x360@15fps 350 kbps  | 320x180@15fps 200 kbps   |
|  Publishers > 6  and   |        >= 300 kbps         |  640x360@15fps 350 kbps  | 320x180@15fps 150 kbps   |
|  Any number publishers |        < 300 kbps          |         Not used         | 320x180@15fps 300 kbps   |

The table entries represent the maximum configuration.  When CPU and bandwidth consumption is overused, WebRTC will dynamically adjust bitrate, disable a layer or scale down resolution. The SimulcastUplinkPolicy has a monitoring mechanism which tracks the sending status and automatically adjusts without need for application intervention.

### Downlink  Bandwidth Policy

The [VideoAdaptiveProbePolicy](https://aws.github.io/amazon-chime-sdk-js/classes/videoadaptiveprobepolicy.html) adds functionality to take advantage of video simulcast.  The goal of this policy is to leave the complexity of managing the downlink bandwidth and decision of which streams to request inside the SDK and remove that burden from the application.  The policy monitors numerous pieces of information and uses that to determine which streams to subscribe to.  The data considered are:
1. Message from infrastructure enumerating video streams from each remote client
2. Estimated downlink bandwidth from WebRTC library
3. Media metrics such as packet loss and used bandwidth
4. Stream type - Screen share or camera device

The policy works by listening to any changes in the information listed above.  Anytime there is a change it re-evaluates the best mix of remote videos to fit within the target downlink bandwidth.  The policy is currently configured to try to request as many remote clients as possible, then increase resolution where possible.  It prioritizes screen share video above people video.  If there is insufficient bandwidth to request all far participants then only a certain number will be seen.

Applications will receive notifications of remote video being added or removed through the [videoTileDidUpdate](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#videotiledidupdate) and [videoTileWasRemoved](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#videotilewasremoved) callbacks. You can use [encodingSimulcastLayersDidChange](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#encodingSimulcastLayersDidChange) to know when the selected upstream simulcast resolutions change.

If the application pauses a remote video by calling [pauseVideoTile](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#pausevideotile), then this policy will not include that remote video in the list of available streams and therefore will not automatically subscribe or unsubscribe from it while it is in the paused state.

When using the policy it is recommended that applications do not take action on the downlink monitoring events such as [videoNotReceivingEnoughData](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#videonotreceivingenoughdata) or [estimatedDownlinkBandwidthLessThanRequired](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#estimateddownlinkbandwidthlessthanrequired) since it may conflict with decisions being made within the policy.

The VideoAdaptiveProbePolicy can be used with or without simulcast.  To enable it without simulcast set the [MeetingSessionConfiguration.videoDownlinkBandwidthPolicy](https://aws.github.io/amazon-chime-sdk-js/classes/meetingsessionconfiguration.html#videodownlinkbandwidthpolicy) to [VideoAdaptiveProbePolicy](https://aws.github.io/amazon-chime-sdk-js/classes/videoadaptiveprobepolicy.html).  If simulcast is not active, then the policy will only be able to add or remove remote videos.

### Creating a simulcast enabled meeting
First, create a meeting session configuration.
```javascript
import {
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  LogLevel,
  MeetingSessionConfiguration
} from 'amazon-chime-sdk-js';

const logger = new ConsoleLogger('MyLogger', LogLevel.INFO);
const deviceController = new DefaultDeviceController(logger);

// You need responses from server-side Chime API. See 'Getting responses from your server application' in the README.
const meetingResponse = // The response from the CreateMeeting API action.
const attendeeResponse = // The response from the CreateAttendee or BatchCreateAttendee API action.

// This meeting session configuration will be used to enable simulcast in the next step.
const configuration = new MeetingSessionConfiguration(meetingResponse, attendeeResponse);
```

Now you have to enable `enableUnifiedPlanForChromiumBasedBrowsers` and `enableSimulcastForUnifiedPlanChromiumBasedBrowsers` feature flags 
in the created [MeetingSessionConfiguration](https://aws.github.io/amazon-chime-sdk-js/classes/meetingsessionconfiguration.html).

```javascript
configuration.enableUnifiedPlanForChromiumBasedBrowsers = true;
configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = true;
```

Now create a meeting session with the simulcast enabled meeting session configuration.
```javascript
// In the examples below, you will use this meetingSession object.
const meetingSession = new DefaultMeetingSession(
  configuration,
  logger,
  deviceController
);
```

This `meetingSession` is now simulcast enabled and will have the `videoUplinkBandwidthPolicy` set to [DefaultSimulcastUplinkPolicy](https://aws.github.io/amazon-chime-sdk-js/classes/defaultsimulcastuplinkPolicy.html) and `videoDownlinkBandwidthPolicy` set to [VideoAdaptiveProbePolicy](https://aws.github.io/amazon-chime-sdk-js/classes/videoadaptiveprobepolicy.html). Due to these policies, the local and remote video resolutions may change. The video resolution depends on the available simulcast streams. The available simlucast streams are dependent on the number of attendees and the current bandwidth estimations. Check "Simulcast resolutions and behavior" section in this guide for more information.

### Receive upstream simulcast layer change notification

The active simulcast streams are represented by the [SimulcastLayers](https://aws.github.io/amazon-chime-sdk-js/enums/simulcastlayers.html) enum. Currently, the active upstream simulcast layers will only be either "Low and High", or "Low and Medium" or "Low". To receive upstream simulcast layer change notification do the following steps:

- Implement the [encodingSimulcastLayersDidChange](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#encodingsimulcastlayersdidchange) method from the [AudioVideoObserver](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html) interface.

- Then, add an instance of the `AudioVideoObserver` using the [addObserver](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#addobserver) method so you can receive the changed simulcast layer notification.

- Now when you are in a simulcast enabled meeting and your upstream simulcast layer is changed, you will be notified in the `encodingSimulcastLayersDidChange` callback with the updated simulcast layer.

```javascript
import { SimulcastLayers } from 'amazon-chime-sdk-js';

const SimulcastLayersMapping = {
  [SimulcastLayers.Low]: 'Low',
  [SimulcastLayers.LowAndMedium]: 'Low and Medium',
  [SimulcastLayers.LowAndHigh]: 'Low and High',
  [SimulcastLayers.Medium]: 'Medium',
  [SimulcastLayers.MediumAndHigh]: 'Medium and High',
  [SimulcastLayers.High]: 'High'
};

const observer = {
  encodingSimulcastLayersDidChange: simulcastLayers => {
    console.log(`current active simulcast layers changed to: ${SimulcastLayersMapping[simulcastLayers]}`);
  }
}

meetingSession.audioVideo.addObserver(observer);
```
