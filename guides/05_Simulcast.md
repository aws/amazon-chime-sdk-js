# Video Simulcast

In multi-party video calls, attendees can enable the simulcast feature to enhance the overall video quality. Simulcast is a standardized technique where the video publishers create multiple renditions, or layers, of the same video source and video subscribers have the flexibility to choose the rendition that best fits their needs based on such factors as available bandwidth, compute and screen size.
The uplink policy controls the configuration of the renditions through camera capture and encoding parameters. The simulcast-enabled uplink policy is [SimulcastUplinkPolicy](https://aws.github.io/amazon-chime-sdk-js/interfaces/simulcastuplinkpolicy.html).

Simulcast is currently disabled by default. To enable it [MeetingSessionConfiguration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers](https://aws.github.io/amazon-chime-sdk-js/classes/meetingsessionconfiguration.html#enablesimulcastforunifiedplanchromiumbasedbrowsers) must be set. Currently, only Chrome 76 and above is supported.

When enabling simulcast, you should use [VideoPriorityBasedPolicy](https://aws.github.io/amazon-chime-sdk-js/classes/videoprioritybasedpolicy) to allow switching between layers in response to application use-cases or network adaptation. More details about priority-based downlink policy can be 
found [here](https://aws.github.io/amazon-chime-sdk-js/modules/prioritybased_downlink_policy.html).

- [Video Simulcast](#video-simulcast)
  - [Details](#details)
    - [Simulcast overview](#simulcast-overview)
    - [Simulcast resolutions and behavior](#simulcast-resolutions-and-behavior)
    - [Downlink  Bandwidth Policy](#downlink--bandwidth-policy)
    - [Creating a simulcast enabled meeting](#creating-a-simulcast-enabled-meeting)
    - [Receive upstream simulcast layer change notification](#receive-upstream-simulcast-layer-change-notification)
    - [Custom Simulcast Policy](#custom-simulcast-policy)
    - [Enable Simulcast For Content Share](#enable-simulcast-for-content-share)

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

Note that simulcast is disabled when there are only 2 or fewer attendees.  This is because WebRTC has additional functionality to request lower bitrates from the remote end, and we will forward these requests if there are no competing receivers (i.e. if the receiving estimates it has 200kbps downlink bandwidth available, this will be sent and relayed in a message to the sending client).  Therefore there is no need for simulcast based adaption.

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

Now enable `enableSimulcastForUnifiedPlanChromiumBasedBrowsers` feature flag
in the created [MeetingSessionConfiguration](https://aws.github.io/amazon-chime-sdk-js/classes/meetingsessionconfiguration.html).

```javascript
configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = true;

// Specify the apdative probe downlink policy
configuration.videoDownlinkBandwidthPolicy = new VideoPriorityBasedPolicy(logger);
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

This `meetingSession` is now simulcast enabled and will have the `videoUplinkBandwidthPolicy` set to [DefaultSimulcastUplinkPolicy](https://aws.github.io/amazon-chime-sdk-js/classes/defaultsimulcastuplinkPolicy.html). Due to these policies, the local and remote video resolutions may change. The video resolution depends on the available simulcast streams. The available simlucast streams are dependent on the number of attendees and the current bandwidth estimations. Check "Simulcast resolutions and behavior" section in this guide for more information.

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

### Custom Simulcast Policy

If the default simulcast uplink policy does not work for you, you can create your own simulcast video uplink policy 
by implementing [SimulcastUplinkPolicy](https://aws.github.io/amazon-chime-sdk-js/interfaces/simulcastuplinkpolicy.html) 
and set the video uplink policy via [MeetingSessionConfiguration.videoUplinkBandwidthPolicy](https://aws.github.io/amazon-chime-sdk-js/classes/meetingsessionconfiguration.html#videouplinkbandwidthpolicy).

```typescript
export default class MySimulcastUplinkPolicy implements SimulcastUplinkPolicy {
}

const browserBehavior = new DefaultBrowserBehavior();

if (browserBehavior.isSimulcastSupported()) {
  meetingConfiguration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = true;
  meetingConfiguration.videoUplinkBandwidthPolicy = new MySimulcastUplinkPolicy();
}
```

### Enable Simulcast For Content Share

You can use `enableSimulcastForContentShare` to toggle simulcast on/off for content share. Note that you don't have 
to set `enableSimulcastForUnifiedPlanChromiumBasedBrowsers` yourself as this configuration will be set automatically 
for content share attendee as part of `enableSimulcastForContentShare`.

```js
// Enable simulcast
await meetingSession.audioVideo.enableSimulcastForContentShare(true);
await meetingSession.audioVideo.startContentShareFromScreenCapture();

// Disable simulcast
await meetingSession.audioVideo.enableSimulcastForContentShare(false);
await meetingSession.audioVideo.startContentShareFromScreenCapture();
```

Below is the default simulcast encoding parameters:

| Encoding Parameters      | Simulcast stream 1 | Simulcast stream 2 |
|:------------------------:|:------------------:|:------------------:|
| Max bitrate              |      1200 kbps     |      300 kbps      |
| Scale resolution down by |         1          |         2          |
| Max framerate            |  Same as capture framerate (default is 15fps) |   5   |

You can override the encoding parameters to tailor to the type of content. 
For example, for motion content, you may want to scale resolution down more but keep a high framerate for the low 
quality layer but for static content, you may want to only reduce the framerate and keep a high resolution.

```js
// Enable simulcast and override the low layer encoding parameters
await meetingSession.audioVideo.enableSimulcastForContentShare(true, {
  low: {
    maxBitrateKbps: 350,
    scaleResolutionDownBy: 4,
    maxFramerate: 10,
  }
});
await meetingSession.audioVideo.startContentShareFromScreenCapture();
```
