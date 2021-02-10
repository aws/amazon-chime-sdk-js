# Frequently Asked Questions

## General questions

### What is the Amazon Chime SDK?

The [Amazon Chime SDK](https://aws.amazon.com/chime/chime-sdk) is a set of real-time communications components that developers can use to quickly add audio calling, video calling, and screen sharing capabilities to their own web or mobile applications. Developers can leverage the same communication infrastructure and services that power Amazon Chime, an online meetings service from AWS, and deliver engaging experiences in their applications.

There are three client SDKs that can be used by applications based on the use case. Each of these repos have walkthroughs, and links to demos and sample code:

Amazon Chime SDK for JavaScript https://github.com/aws/amazon-chime-sdk-js

Amazon Chime SDK for iOS https://github.com/aws/amazon-chime-sdk-ios

Amazon Chime SDK for Android https://github.com/aws/amazon-chime-sdk-android

### How much does the Amazon Chime SDK cost?

Amazon Chime uses utility-based pricing.  Meetings are billed based on attendee minutes (from the time an attendee joins and then leaves a meeting), in 0.1 minute increments.

Example 1: A 10 minute meeting with 2 people attending for the whole meeting costs 20 attendee minutes.

Example 2: A 10 minute meeting, with 2 people attending for the whole time, and 1 person joining for the last 5 minutes, costs 25 attendee minutes.

Billing starts when the attendee joins the meeting and leaves the meeting.  Calling [CreateAttendee](https://docs.aws.amazon.com/chime/latest/APIReference/API_CreateAttendee.html) or [BatchCreateAttendee](https://docs.aws.amazon.com/chime/latest/APIReference/API_BatchCreateAttendee.html) does not initiate billing, rather it just creates the join token to enable an attendee to join.

Additional information on pricing is available on the [Amazon Chime pricing page](https://aws.amazon.com/chime/pricing/#Chime_SDK_). If you have more questions, contact [Customer support](https://pages.awscloud.com/GLOBAL-aware-GC-Amazon-Chime-SDK-2020-reg.html).

### I have a question not addressed in this FAQ. What is my next step?

If you have feature requests or feedback, please fill out the [customer questionnaire](https://pages.awscloud.com/GLOBAL-aware-GC-Amazon-Chime-SDK-2020-reg.html) for us to reach out to you.

### Can I use the Amazon Chime application to join an Amazon Chime SDK meeting?

The meetings created by the Amazon Chime Application and the SDK are distinct. Amazon Chime SDK is meant for customers who would like to build the experience into their existing applications and it is **NOT** a means to create an Amazon Chime meeting (with a PIN) that can be joined using our client application. You cannot use the Amazon Chime SDK to build a custom client to join an Amazon Chime meeting with a PIN.

### Does the MeetingsNotificationsConfiguration only support SQS queues in us-east-1?

Yes, we currently support SNS topics or SQS queues located in us-east-1 region only. For more details, please refer
 to [Meeting Notification Configuration API](https://docs.aws.amazon.com/chime/latest/APIReference/API_MeetingNotificationConfiguration.html).

### How can I learn about interruptions to the Amazon Chime service?

You can be notified about Amazon Chime service interruptions at the https://status.aws.amazon.com/ website. In addition you can set up [Amazon CloudWatch](https://aws.amazon.com/cloudwatch/) events via the [AWS Personal Health Dashboard](https://aws.amazon.com/premiumsupport/technology/personal-health-dashboard/) for the Amazon Chime service. You can find the Amazon Chime SLA on this [webpage](https://aws.amazon.com/chime/sla/).

## Browser support

### What browsers are supported by the Amazon Chime SDK for JavaScript?

You can find the complete list of browsers in this link: [Supported Browsers](https://docs.aws.amazon.com/chime/latest/dg/meetings-sdk.html#mtg-browsers). [WebRTC](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API) support in a browser is a prerequisite for Amazon Chime SDK to run. Browsers that do not offer WebRTC support, like Internet Explorer, are not supported.

The SDK is built to target ES2015, both syntax and features. If you need your built application bundle to target legacy browsers that do not support ES2015 syntax, including Internet Explorer, you will need to transpile the SDK code using a transpiler like Babel, split your application bundle into multiple files that can be built with different targets and conditionally loaded, or generate multiple versions of your application to target specific browsers.

Note that due to limitations in transpilers, requirements of the web platform might result in transpiled ES5 code that raises an error when run, such as "Please use the 'new' operator, this DOM object constructor cannot be called as a function". Prefer using ES2015 code on supported platforms.

### I am unable to select an audio output device in some browsers, is this a known issue?

[Firefox](https://bugzilla.mozilla.org/show_bug.cgi?id=1152401) and [Safari](https://bugs.webkit.org/show_bug.cgi?id=179415) have known issues disallowing them from listing audio output devices on these browsers. While clients can continue the meeting using the default device, they will not be able to select devices in meetings.

[Android Chrome](https://bugs.chromium.org/p/chromium/issues/detail?id=635686&sort=-stars&q=android%20chrome%20bluetooth%20headphone&can=2) has a known issue switching between Bluetooth audio output devices. While clients can continue the meeting using the default device, there is a [bug](https://bugs.chromium.org/p/chromium/issues/detail?id=635686&sort=-stars&q=android%20chrome%20bluetooth%20headphone&can=2) related to switching to a Bluetooth audio output.

### I am getting `Cannot select audio output device. This browser does not support setSinkId` error on the browser console. Is this a known issue?

In the background, `bindAudioElement()`, `bindAudioStream()`, and `bindAudioDevice()` call the browser API [`setSinkId()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/setSinkId). The full list of browsers that support `setSinkId` API can be found [here](https://caniuse.com/?search=setsinkid). In Firefox, this feature is behind the `media.setsinkid.enabled` preference (needs to be set to `true`). To change preferences in Firefox, visit `about:config`.

Use `BrowserBehavior.supportsSetSinkId()` to determine whether the browser supports `setSinkId()` before calling these methods.

### My video disappears in Safari browsers, is this a known issue?

macOS and iOS Safari browsers have limitations when you use a camera in more than one apps or tab. 
For example, if you enable a video in two macOS Safari tabs, one video will go black. 
Make sure to close all other apps and tabs that are using the camera.

### I cannot join meeting in Firefox with no audio and video permission due to `no ice candidates were gathered` error, is this a known issue?

In Firefox, if access to camera or microphone has been granted to the site — either by currently having a video or audio input, or as a result of the user choosing to always allow access — and the profile has not been configured with media.peerconnection.ice.default_address_only, then ICE will gather all interface addresses. If the user has not granted the appropriate permissions, or if that preference has been set, then the ICE stack will limit ICE candidates to a default interface only. The default interface is the one that was used to load the page. This is a privacy mechanism in Firefox to stop sites from de-anonymizing VPN users via WebRTC leakage.

If the page itself is loaded via a different network interface than the one that is intended to be used by the Chime SDK to connect to Chime media resources, e.g., in a split-tunneling VPN where browser traffic uses the VPN interface but Chime video and audio does not, then ICE gathering will use the wrong interface, which can result in sub-optimal network routing or an inability to use audio or video functionality.

Customers and end users must ensure that either (a) end users do not use SDK applications in these kinds of split-tunneling scenarios, or (b) the SDK application always requests microphone permissions prior to beginning ICE.
 

### Is the Amazon Chime SDK supported on mobile browsers?

Amazon Chime SDK for JavaScript is supported on certain mobile browsers, specifically Chrome/Android and Safari/iOS. Developers can also build native mobile applications using the following SDKs (this option allows for meetings to continue when applications are sent to the background).

Amazon Chime SDK for iOS https://github.com/aws/amazon-chime-sdk-ios

Amazon Chime SDK for Android https://github.com/aws/amazon-chime-sdk-android

## Meetings

### How do users authenticate into a meeting?

Amazon Chime SDK uses join tokens to participate in Amazon Chime meetings that are obtained when each attendee is [created](https://docs.aws.amazon.com/chime/latest/dg/mtgs-sdk-mtgs.html). The safe distribution of these tokens to the clients is the application developer’s responsibility. Amazon Chime SDK does not authenticate end users. Developers could use services such as [Amazon Cognito](https://aws.amazon.com/cognito/), Open ID connect, Active Directory, or Facebook to log in end users to their application. You can tie external identity management with Amazon Chime SDK attendees using externalUserId argument supplied at the attendee creation time.

### When does an Amazon Chime SDK meeting end?

An Amazon Chime SDK meeting ends when you run the [DeleteMeeting](https://docs.aws.amazon.com/chime/latest/APIReference/API_DeleteMeeting.html) API action. Also, a meeting automatically ends after a period of inactivity, based on the following rules:

* No audio connections are present in the meeting for more than five minutes.
* Only one audio connection is present in the meeting for more than 30 minutes.
* 24 hours have elapsed since the meeting was created.

### How many simultaneous meetings can be hosted in an account? Can this limit be raised?

AWS accounts have a soft limit of [250 concurrent meetings](https://docs.aws.amazon.com/chime/latest/dg/meetings-sdk.html#mtg-limits). Your limit can be obtained from the [Service quotas console](https://docs.aws.amazon.com/general/latest/gr/aws_service_limits.html) in your AWS account. The limit is applied globally, based on the total number of active meetings across all regions. You can track your concurrent meeting usage in [Amazon CloudWatch](https://aws.amazon.com/cloudwatch/).  If your application needs to support more concurrent meetings, you can request limit increases through the [AWS Customer support portal](https://pages.awscloud.com/GLOBAL-aware-GC-Amazon-Chime-SDK-2020-reg.html).

### How many attendees can join an Amazon Chime SDK meeting? Can this limit be raised?

Amazon Chime SDK limits are defined [here](https://docs.aws.amazon.com/chime/latest/dg/meetings-sdk.html#mtg-limits). The service supports up to 250 attendees and up to 16 video participants in a meeting (video limit is enforced separately). An attendee is considered active unless it has been explicitly removed using DeleteAttendee API call. Attendee limits cannot be changed.

If your use case requires more than 250 attendees, consider using a [broadcasting solution](https://github.com/aws-samples/amazon-chime-meeting-broadcast-demo).

### What happens to the subsequent participants who try to turn on the local video while 16 participants have already turned on the local video?

Once the limit of 16 is reached in a meeting, for all the subsequent participants who try to turn on the local video, the SDK sets the Meeting Session status code to [VideoCallSwitchToViewOnly = 10](https://github.com/aws/amazon-chime-sdk-js/blob/bfc4c600fb7e68f2d358ecb6c7fd096d30b2d430/src/meetingsession/MeetingSessionStatusCode.ts#L73) which in turn triggers the observer '[videoSendDidBecomeUnavailable](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#videosenddidbecomeunavailable)'.

### Can I schedule Amazon Chime SDK meetings ahead of time?

The Amazon Chime SDK does not support scheduling meetings ahead of time. The moment [CreateMeeting](https://docs.aws.amazon.com/chime/latest/APIReference/API_CreateMeeting.html) or 
[CreateMeetingWithAttendees](https://docs.aws.amazon.com/chime/latest/APIReference/API_CreateMeetingWithAttendees.html) is invoked and the meeting is created, the auto end
 policies will kick in and if no one joins the meeting, it will close within 5 minutes. The application can create the meeting when drawing closer to the meeting start time or when the the first attendee is ready to join.

## Media

### Which media regions is the Amazon Chime SDK available in? How do I choose the best media region to place my meetings?

You can find the full list of media regions that the Amazon Chime SDK supports [here](https://docs.aws.amazon.com/chime/latest/dg/chime-sdk-meetings-regions.html), along with how you can determine the best region for a client. Each client application can query for the best region and return it back to the server application, which can use the collected nearest-region information from each client to select a region for the meeting. This region can then be passed as the [MediaRegion](https://docs.aws.amazon.com/chime/latest/APIReference/API_CreateMeeting.html#chime-CreateMeeting-request-MediaRegion) 
parameter to [CreateMeeting](https://docs.aws.amazon.com/chime/latest/APIReference/API_CreateMeeting.html#API_CreateMeeting_RequestBody) or 
[CreateMeetingWithAttendees](https://docs.aws.amazon.com/chime/latest/APIReference/API_CreateMeetingWithAttendees.html#API_CreateMeetingWithAttendees_RequestBody).

### How do I choose video resolution, frame rate and bitrate?

Applications built with the Amazon Chime SDK for JavaScript can adjust video parameters before a meeting begins by using the [chooseVideoInputQuality](https://aws.github.io/amazon-chime-sdk-js/modules/qualitybandwidth_connectivity.html#adjust-local-video-quality) API.

### How can I stream music or video into a meeting?

You can use the [AudioVideoFacade.startContentShare(MediaStream)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#startcontentshare) API to stream audio and/or video content to the meetings. See the [meeting demo application](https://github.com/aws/amazon-chime-sdk-js/blob/ee8831f2fe7747e52fdef49db0dc1dfc2a4778f6/demos/browser/app/meetingV2/meetingV2.ts#L1266) for an example of how to achieve this.

### When I stream video in Chrome, other attendees see a black screen. Is this a known issue?

The [AudioVideoFacade.startContentShare(MediaStream)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#startcontentshare) API uses the HTMLMediaElement.captureStream API to stream video content content to the meeting. Chrome 88 and above have a [known issue](https://bugs.chromium.org/p/chromium/issues/detail?id=1156408) that the captureStream API does not send any data.

As a workaround, you can turn hardware acceleration off in Chrome (88.0.4324.146 and above) and then stream video. Go to Settings (`chrome://settings`), scroll down to the System, and turn "Use hardware acceleration when available" off.

### How do I broadcast an Amazon Chime SDK meeting?

You can deploy a web application broadcasting solution similar to the [Amazon Chime Meeting Broadcasting Demo](https://github.com/aws-samples/amazon-chime-meeting-broadcast-demo) to broadcast an Amazon Chime SDK meeting to RTMP-enabled streaming services by instead using a `MEETING_URL` consisting of the URL to the meeting to be broadcasted.

### How can I adjust my application to perform better under different network conditions?

See this [guide](https://aws.github.io/amazon-chime-sdk-js/modules/qualitybandwidth_connectivity.html) to learn how to monitor uplink and downlink bandwidth and what mitigations exist for different kinds of impairment.

### Does Amazon Chime SDK support simulcast?

Amazon Chime SDK supports simulcast for Chromium-based browsers. See this [technical guide](https://aws.github.io/amazon-chime-sdk-js/modules/simulcast.html) for more information.

### Does the SDK support remote mute where one attendee can mute another?

Remote mute is the ability of one attendee in a meeting to mute another attendee. This feature is currently not supported server-side by the SDK. However, you can use [Amazon Chime SDK Data Messages](https://aws.github.io/amazon-chime-sdk-js/modules/apioverview.html#9-send-and-receive-data-messages-optional) to send a message containing the attendee or attendees that should mute, and clients can mute themselves when they receive those messages.

## Demos

### I want to build a React application that uses the Amazon Chime SDK. Do you have a sample application that I can reference?

Amazon Chime has published a [blog post](https://aws.amazon.com/blogs/business-productivity/building-a-virtual-classroom-application-using-the-amazon-chime-sdk/) and [demo](https://github.com/aws-samples/amazon-chime-sdk-classroom-demo) for a building a virtual classroom using the Amazon Chime SDK for JavaScript.

### I want to build a React Native application that uses the Amazon Chime SDK. Do you have a sample application I can reference?

Amazon Chime SDK has published a react native demo that can be accessed [here](https://github.com/aws-samples/amazon-chime-react-native-demo).

### Do I get billed for using the demos?

Your account will get billed for attendee minutes and for any other AWS resources used by the demo. Please use [AWS Cost Explorer](https://aws.amazon.com/aws-cost-management/aws-cost-explorer/) for details on cost breakdown.

### Does Amazon Chime SDK support recording functionality?

No. Currently the Amazon Chime SDK does not support meeting recording out of the box. However, we have published a [blog post](https://aws.amazon.com/blogs/business-productivity/how-to-enable-client-side-recording-using-the-amazon-chime-sdk/) and a [demo](https://github.com/aws-samples/amazon-chime-sdk-recording-demo) demonstrating how to enable client-side recording using the Amazon Chime SDK.

## Debugging

### How can I get Amazon Chime SDK logs for debugging?

Applications can get logs from Chime SDK by passing instances of Logger when instantiating [the MeetingSession object](https://github.com/aws/amazon-chime-sdk-js/blob/master/src/meetingsession/MeetingSession.ts#L14). Amazon Chime SDK has some default implementations of logger that your application can use, such as [ConsoleLogger](https://github.com/aws/amazon-chime-sdk-js/blob/8e5802c04031ac62a2c5c5fe75af5bb4ffbf12d0/src/logger/ConsoleLogger.ts) which logs into the browser console, [MeetingSessionPOSTLogger](https://github.com/aws/amazon-chime-sdk-js/blob/8e5802c04031ac62a2c5c5fe75af5bb4ffbf12d0/src/logger/MeetingSessionPOSTLogger.ts) which logs in [Amazon CloudWatch](https://aws.amazon.com/cloudwatch/) and [MultiLogger](https://github.com/aws/amazon-chime-sdk-js/blob/8e5802c04031ac62a2c5c5fe75af5bb4ffbf12d0/src/logger/MultiLogger.ts) which logs in multiple destinations.

### How do I file an issue for the Amazon Chime SDK for JavaScript?

You can use our [bug template](https://github.com/aws/amazon-chime-sdk-js/issues/new?assignees=&labels=bug&template=bug-report.md&title=) to file issues with logs (it is helpful to set the logging level as INFO) and exact reproduction steps. To help you faster, you can check the usage of the API in our [API overview](https://aws.github.io/amazon-chime-sdk-js/modules/apioverview.html), [demos](https://github.com/aws/amazon-chime-sdk-js/blob/master/README.md#examples) and the [usage section](https://github.com/aws/amazon-chime-sdk-js/blob/master/README.md#usage) in our Readme. In addition search our [issues database](https://github.com/aws/amazon-chime-sdk-js/issues?q=is:issue) as your concern may have been addressed previously and mitigations may have been posted.

## Networking

### What are the subnets and ports used by an application using the AWS SDK?

An application which calls Amazon Chime APIs via the [AWS SDK](https://aws.amazon.com/tools/), like [CreateMeeting](https://docs.aws.amazon.com/chime/latest/APIReference/API_CreateMeeting.html), connects to the global service endpoint in the us-east-1 region: [service.chime.aws.amazon.com](https://service.chime.aws.amazon.com/), or [service-fips.chime.aws.amazon.com](https://service-fips.chime.aws.amazon.com/) with TCP:443.

The URIs resolve to IP addresses in the AMAZON subnets for us-east-1, as published in the [AWS ip-ranges.json](https://docs.aws.amazon.com/general/latest/gr/aws-ip-ranges.html).

### What are the subnets and ports used by a client running the Amazon Chime SDK?

A client running the Amazon Chime SDK connects to the Amazon Chime service via URIs (never direct IP addresses) that are part of the *.chime.aws domain.  The URIs resolve to IP addresses in the CHIME_MEETINGS subnets, as published in the [AWS ip-ranges.json](https://docs.aws.amazon.com/general/latest/gr/aws-ip-ranges.html), which is currently a single subnet: 99.77.128.0/18.

The Amazon Chime SDK will use TCP:443 for https and websocket connectivity, and UDP:3478 for media.  If UDP:3478 is blocked, the SDK falls back to TCP, however the video experience will be poor, and audio will use a region specific subnet assigned by [Amazon Elastic Compute Cloud (Amazon EC2)](https://aws.amazon.com/ec2/).

### Can a client running the Amazon Chime SDK connect to the service via a proxy?

The Amazon Chime SDK has URL [rewriter hooks](https://aws.github.io/amazon-chime-sdk-js/classes/meetingsessionurls.html#urlrewriter) that the application builder can use to munge the URLs to traverse unauthenticated proxies.  When traversing a proxy, all media is sent over TCP which impacts the user experience.

## Mobile browser

### Is screen capture supported on mobile browsers?

Amazon Chime SDK for JavaScript applications do not support content sharing on mobile browsers because a key dependency, WebRTC's [getDisplayMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia) is not available on these browsers. Clients joining from these devices can still view content shared by other participants in the call.

### Will Amazon Chime SDK for JavaScript meetings work in Chrome and Firefox in iOS?

At present, Amazon Chime SDK for JavaScript is supported on Safari/iOS only. Other browsers are missing a key dependency, [GetUserMedia](https://bugs.webkit.org/show_bug.cgi?id=208667).

### When loading a webpage in iOS WebView, my application gets a TypeError: undefined is not an object (evaluating 'navigator.mediaDevices.addEventListener'), what could be the issue ?

This is because Safari embedded [web view does not support WebRTC](https://forums.developer.apple.com/thread/88052). The mitigation is to use the Amazon Chime SDK for iOS to build a native application: https://github.com/aws/amazon-chime-sdk-ios

### I notice that my clients lose audio and drop from the meeting if the Chrome browser on Android stays in background for several minutes, is that a known issue?

This is a known issue and happens primarily due to this [Chromium bug](https://bugs.chromium.org/p/chromium/issues/detail?id=951418). At present we do not have a workaround.

### I only see iPhone or iPad microphone as audio input in iOS device, is that a known issue?

iOS Safari has a known issue where it only lists one audio input device even when there are multiple. For example
, if you plug in a wired headset to your iPhone, it will show up as iPhone microphone replacing the internal mic. For
 more information, please refer to [the Webkit issue](https://bugs.webkit.org/show_bug.cgi?id=174833). 

### I can hear clicking noise from an attendee using iPhone X devices (X, XS, and XR).

This was a known issue on iPhone X devices (X, XS, and XR) when using AudioContext-based APIs in iOS Safari 13 and below. Please upgrade your device to iOS 14 and try again. For more information, see our comment in [the WebKit issue](https://bugs.webkit.org/show_bug.cgi?id=204625#c6). 

### I cannot hear audio from other attendees using iOS devices after I unplug my wired headset.

iOS Safari has a known issue where it does not automatically switch to the iOS internal speaker after users unplug
 their wired headset. For more information, please refer to [the Webkit issue](https://bugs.webkit.org/show_bug.cgi?id=216389).

### **I notice that if I turn on camera and put the browsers in background, others in the meeting will see black tile in Safari in iOS and frozen tile in Chrome in Android, is this a known issue?**

This is the default behavior that is specific to each browser. In Android, the video stream is muted when in background and thus, the video will show the last frame.
Note that for Android, if an attendee joins later after the video stream is in background, it will show as a blank tile since the last frame is blank.
For better user experience, we recommend considering [Chime SDK iOS](https://github.com/aws/amazon-chime-sdk-ios) and 
[Chime SDK Android](https://github.com/aws/amazon-chime-sdk-android).

### **When I join a meeting in Chrome in Android 8 or 9 with speakerphone, other people could not hear me. Switch to default mic fixes the issue.**

This seems to be a [bug](https://bugs.chromium.org/p/webrtc/issues/detail?id=11677) with Android 8 or 9 when using getUserMedia with speakerphone device Id that the audio stream will end after a brief moment. Using default device Id will fix this issue. Note that this only happens if users select speakerphone first. If you use default device when joining the meeting then switch to Speakerphone, this issue does not happen.

### I see a slate which says "Your client does not support hardware acceleration" when I enable video on my device?

This error indicates that the device you are using does not support hardware acceleration decoding. However this does not impact the ability of this user to participate in Amazon Chime SDK meetings as the device can render and transmit VP8 streams to other parties in the call. Specifically for Chrome, you will need to enable Unified Plan support by setting this [flag](https://aws.github.io/amazon-chime-sdk-js/classes/meetingsessionconfiguration.html#enableunifiedplanforchromiumbasedbrowsers) to true or enable [Simulcast](https://aws.github.io/amazon-chime-sdk-js/classes/meetingsessionconfiguration.html#enablesimulcastforunifiedplanchromiumbasedbrowsers).
In some cases, H.264 may be missing from the initial SDP offer [tracking Chromium bug](https://bugs.chromium.org/p/chromium/issues/detail?id=1047994)) causing this slate to appear. Rejoining the meeting can fix the videos to be rendered once again.

### I am not able to join an Amazon Chime SDK meeting from an Android 11 device running Chromium 83 based browsers, such as Samsung Internet (Version 13) or Chrome (Version 83). Is this a known issue?

This is a bug on Android 11 running Chromium 83 based browsers. You will observe this issue on the Samsung Internet browser (Version 13) since it is based on Chromium 83. Please check [ICE gathering stalls in Chrome on Android 11](https://bugs.chromium.org/p/chromium/issues/detail?id=1115498) bug for more information. This issue is not observed on the Samsung Internet browser (Version 12) or the latest Chrome for Android browser when tested on an Android 11 device.

### Does Amazon Voice Focus support the Samsung Internet browser?

Yes, Amazon Voice Focus supports the Samsung Internet browser (Chromium 83 or lower). However, it leads to a poor user experience because the preferred Chromium version is 87 or higher. Please check Amazon Voice Focus [browser compatibility matrix](https://github.com/aws/amazon-chime-sdk-js/blob/master/guides/09_Amazon_Voice_Focus.md#browser-compatibility) in Amazon Voice Focus guide.


## Audio and video

### My clients are unable to join the meeting and I see `navigator.mediaDevices is undefined`, what could be the reason?

Amazon Chime SDK for JavaScript uses WebRTC’s getUserMedia() when you invoke the chooseVideoInputDevice API which can operate in [secure contexts inside a browser only](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#Privacy_and_security) for privacy concerns so you will need to access your browsers using HTTPS://. The hostname `localhost` and the loopback address `127.0.0.1` are exceptions.

### How can I create a video tile layout for my application?

Applications that show multiple video tiles on the screen will need to decide where to place the underlying video elements and how to apply CSS styling. Here are a few things to consider as you develop the tile layout for your application:

* A video whose source is a mobile device in portrait mode will display quite differently compared to a video in landscape mode from a laptop camera. The CSS object-fit rule can be applied to the video element to change how the content scales to fit the parent video element.
* Use the `VideoTileState` [videoStreamContentWidth and videoStreamContentHeight](https://github.com/aws/amazon-chime-sdk-js/blob/master/src/videotile/VideoTileState.ts) properties to determine the aspect ratio of the content.
* After calling [bindVideoElement](https://github.com/aws/amazon-chime-sdk-js/blob/master/src/audiovideofacade/DefaultAudioVideoFacade), set up `resize` [event listeners on the HTMLVideoElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/videoWidth) to listen to intrinsic resolution from the video content.
* For landscape aspect ratios (width > height), apply the CSS rule `object-fit:cover` to the HTML element that will contain the video to crop and scale the video to the aspect ratio of the video element.
* For portrait aspect ratios (height > width), apply the CSS rule `object-fit:contain` to the HTML element that will contain the video to ensure that all video content can be seen.

### After leaving a meeting, the camera LED is still on indicating that the camera has not been released. What could be wrong?

When the camera LED remains on, it does not necessarily mean the device is broadcasting to the remote attendees. The LED will remain on until all media streams that use the device are released (its tracks are stopped). The following API methods release media streams.

```
// Select no video device (releases any previously selected device)
meetingSession.audioVideo.chooseVideoInputDevice(null);

// Stop local video tile (stops sharing the video tile in the meeting)
meetingSession.audioVideo.stopLocalVideoTile();

// Stop a video preview that was previously started (before session starts)
meetingSession.audioVideo.stopVideoPreviewForVideoInput(previewVideoElement);

// Stop the meeting session (audio and video)
meetingSession.audioVideo.stop();
```

### My clients are unable to successfully join audio calls from Safari, they get a `failed to get audio device for constraints null: Type error`, what could be the issue?

This error message is an indication that the browser application did not successfully acquire the media stream for audio or video from the device before the meeting starts. Application has not passed in the right device Id to the `chooseVideoInputDevice` API. In this case you will see the following entry in the log where an empty string after `chooseVideoInputDevice`:

```
[Info] 2020-06-18T17:43:55.380Z [INFO] VLR - API/DefaultDeviceController/chooseVideoInputDevice "" -> "PermissionDeniedByBrowser"
```

This applies for video input as well.

### How can I show a custom UX when the browser prompts the user for permission to use microphone and camera?

Device labels are privileged since they add to the fingerprinting surface area of the browser session. In Chrome private tabs and in all Firefox tabs, the labels can only be read once a MediaStream is active. How to deal with this restriction depends on the desired UX. The device controller includes an injectable device label trigger which allows you to perform custom behavior in case there are no labels, such as creating a temporary audio/video stream to unlock the device names, which is the default behavior.

You may want to override this behavior to provide a custom UX such as a prompt explaining why microphone and camera access is being asked for by supplying your own function to setDeviceLabelTrigger(). See the [meeting demo application](https://github.com/aws/amazon-chime-sdk-js/blob/b0e1b16b83b9d56b2a6354b0509aa888ef7b983c/demos/browser/app/meetingV2/meetingV2.ts#L928) for an example.

```
meetingSession.audioVideo.setDeviceLabelTrigger(
  async (): Promise<MediaStream> => {
    // For example, let the user know that the browser is asking for microphone and camera permissions.
    showCustomUX();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    hideCustomUX();
    return stream;
  }
);
```
