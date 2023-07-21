# Frequently Asked Questions

## General questions

### What is the Amazon Chime SDK?

The [Amazon Chime SDK](https://aws.amazon.com/chime/chime-sdk) is a set of real-time communications components that developers can use to quickly add audio calling, video calling, messaging, and screen sharing capabilities to their own web or mobile applications.  Developers can build on AWS's global communications infrastructure to deliver engaging experiences in their applications.

There are three client SDKs that can be used by applications based on operating system or use case. Each of these repos have walkthroughs, and links to demos and sample code:

Amazon Chime SDK for JavaScript https://github.com/aws/amazon-chime-sdk-js

Amazon Chime SDK for iOS https://github.com/aws/amazon-chime-sdk-ios

Amazon Chime SDK for Android https://github.com/aws/amazon-chime-sdk-android

### How much does the Amazon Chime SDK cost?

Amazon Chime uses utility-based pricing.  Meetings are billed based on attendee minutes (from the time an attendee joins and then leaves a meeting), in 0.1 minute increments.

Example 1: A 10 minute meeting with 2 people attending for the whole meeting costs 20 attendee minutes.

Example 2: A 10 minute meeting, with 2 people attending for the whole time, and 1 person joining for the last 5 minutes, costs 25 attendee minutes.

Billing starts when the attendee joins the meeting and leaves the meeting.  Calling [CreateAttendee](https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_CreateAttendee.html) or [BatchCreateAttendee](https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_BatchCreateAttendee.html) does not initiate billing, rather it just creates the join token to enable an attendee to join.

Additional information on pricing is available on the [Amazon Chime pricing page](https://aws.amazon.com/chime/pricing/#Chime_SDK_). If you have more questions, contact [Customer support](https://pages.awscloud.com/GLOBAL-aware-GC-Amazon-Chime-SDK-2020-reg.html).

### I have a question not addressed in this FAQ. What is my next step?

If you have feature requests or feedback, please fill out the [customer questionnaire](https://pages.awscloud.com/GLOBAL-aware-GC-Amazon-Chime-SDK-2020-reg.html) for us to reach out to you.

### Can I use the Amazon Chime application to join an Amazon Chime SDK meeting?

The meetings created by the Amazon Chime meetings application and the SDK are distinct. The Amazon Chime SDK is meant for customers who would like to build the experience into their existing applications and it is **not** a means to create an Amazon Chime meeting (with a PIN) that can be joined using the Amazon Chime meetings application. You cannot use the Amazon Chime SDK to build a custom client to join an Amazon Chime meeting with a PIN.

### Does the MeetingsNotificationsConfiguration only support SQS queues in us-east-1?

Yes, we currently support SNS topics or SQS queues located in `us-east-1` region only. For more details, please refer
 to [Meeting Notification Configuration API](https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_MeetingNotificationConfiguration.html).

### How can I learn about interruptions to the Amazon Chime service?

You can be notified about Amazon Chime service interruptions at the https://status.aws.amazon.com/ website. In addition you can set up [Amazon CloudWatch](https://aws.amazon.com/cloudwatch/) events via the [AWS Personal Health Dashboard](https://aws.amazon.com/premiumsupport/technology/personal-health-dashboard/) for the Amazon Chime service. You can find the Amazon Chime SLA on this [webpage](https://aws.amazon.com/chime/sla/).

## Browser support

### What browsers are supported by the Amazon Chime SDK for JavaScript?

You can find the complete list of browsers in this link: [Supported Browsers](https://docs.aws.amazon.com/chime-sdk/latest/dg/meetings-sdk.html#mtg-browsers). [WebRTC](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API) support in a browser is a prerequisite for the Amazon Chime SDK for JavaScript to run. Browsers that do not offer WebRTC support, like Internet Explorer, are not supported.

The SDK is built to target ES2015, both syntax and features. If you need your built application bundle to target legacy browsers that do not support ES2015 syntax, including Internet Explorer, you will need to transpile the SDK code using a transpiler like Babel, split your application bundle into multiple files that can be built with different targets and conditionally loaded, or generate multiple versions of your application to target specific browsers.

Note that due to limitations in transpilers, requirements of the web platform might result in transpiled ES5 code that raises an error when run, such as "Please use the 'new' operator, this DOM object constructor cannot be called as a function". Prefer using ES2015 code on supported platforms.


### Is the Amazon Chime SDK supported on mobile browsers?

The Amazon Chime SDK for JavaScript is supported on certain mobile browsers listed in the official Amazon Chime SDK documentation: https://docs.aws.amazon.com/chime-sdk/latest/dg/meetings-sdk.html#mtg-browsers. Developers can also build native mobile applications using the following SDKs (this option allows for meetings to continue when applications are sent to the background).

Amazon Chime SDK for iOS https://github.com/aws/amazon-chime-sdk-ios

Amazon Chime SDK for Android https://github.com/aws/amazon-chime-sdk-android


## Known browser issues
Please refer to [Known Browser and Compatibility Issues](https://github.com/aws/amazon-chime-sdk-js/issues/1059/) for more information.

### In macOS Safari, audio stops playing when I minimize or move the window to the background. Is this a known issue?

Safari on macOS has a [known Web Audio issue](https://bugs.webkit.org/show_bug.cgi?id=231105) that a [MediaStreamAudioDestinationNode](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamAudioDestinationNode) stops working when you minimize the window. The bug also occurs when you activate the full-screen mode and switch to another window. To remediate the issue, disable Web Audio by passing the `{ enableWebAudio: false }` argument, or no argument, to `new DefaultDeviceController`.

### I am unable to select an audio output device in some browsers, is this a known issue?

[Firefox](https://bugzilla.mozilla.org/show_bug.cgi?id=1152401) and [Safari](https://bugs.webkit.org/show_bug.cgi?id=179415) have known issues disallowing them from listing audio output devices on these browsers. While clients can continue the meeting using the default device, they will not be able to select devices in meetings. [Chrome and Firefox on iOS](https://bugs.webkit.org/show_bug.cgi?id=179415) also have the same issue.

[Android Chrome](https://bugs.chromium.org/p/chromium/issues/detail?id=635686&sort=-stars&q=android%20chrome%20bluetooth%20headphone&can=2) has a known issue switching between Bluetooth audio output devices. While clients can continue the meeting using the default device, there is a [bug](https://bugs.chromium.org/p/chromium/issues/detail?id=635686&sort=-stars&q=android%20chrome%20bluetooth%20headphone&can=2) related to switching to a Bluetooth audio output.

### I am getting `Cannot select audio output device. This browser does not support setSinkId` error on the browser console. Is this a known issue?

In the background, `bindAudioElement()`, `bindAudioStream()`, and `bindAudioDevice()` call the browser API [`setSinkId()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/setSinkId). The full list of browsers that support `setSinkId` API can be found [here](https://caniuse.com/?search=setsinkid). In Firefox, this feature is behind the `media.setsinkid.enabled` preference (needs to be set to `true`). To change preferences in Firefox, visit `about:config`.

Use `BrowserBehavior.supportsSetSinkId()` to determine whether the browser supports `setSinkId()` before calling these methods.

### My video disappears in Safari browsers, is this a known issue?

macOS and iOS Safari browsers have limitations when you use a camera in more than one apps or tab. 
For example, if you enable a video in two macOS Safari tabs, one video will go black. 
Make sure to close all other apps and tabs that are using the camera.

### I cannot join meeting in Firefox with no audio and video permission due to `no ice candidates were gathered` error, is this a known issue?

In Firefox, if access to camera or microphone has been granted to the site — either by currently having a video or audio input, or as a result of the user choosing to always allow access — and the profile has not been configured with `media.peerconnection.ice.default_address_only`, then ICE will gather all interface addresses. If the user has not granted the appropriate permissions, or if that preference has been set, then the ICE stack will limit ICE candidates to a default interface only. The default interface is the one that was used to load the page. This is a privacy mechanism in Firefox to stop sites from de-anonymizing VPN users via WebRTC leakage.

If the page itself is loaded via a different network interface than the one that is intended to be used by the Amazon Chime SDK to connect to Amazon Chime media resources, _e.g._, in a split-tunneling VPN where browser traffic uses the VPN interface but Amazon Chime video and audio does not, then ICE gathering will use the wrong interface, which can result in sub-optimal network routing or an inability to use audio or video functionality.

Customers and end users must ensure that either (a) end users do not use SDK applications in these kinds of split-tunneling scenarios, or (b) the SDK application always requests microphone permissions prior to beginning ICE.

## Known Build Issues

### Why is my build failing after upgrading to Amazon Chime SDK for JavaScript 3.7.0?

Amazon Chime SDK for JavaScript 3.7.0 included a bug fix to mitigate messaging session reconnection issue. Check [MessagingSession reconnects with refreshed endpoint and credentials if needed](https://github.com/aws/amazon-chime-sdk-js/commit/bce872c353edbb50908c5a0298f8113f1e8dcc82#diff-7ae45ad102eab3b6d7e7896acd08c427a9b25b346470d7bc6507b6481575d519) for more information on the fix. We added `@aws-sdk/client-chime-sdk-messaging` dependency necessary to mitigate the fix. `@aws-sdk/client-chime-sdk-messaging` pulls in `aws-sdk` v3 dependency and its dependencies cause the build to fail in all cases.

Depending on the bundler you use, certain additional configuration changes may be required to help the build to succeed. This is actually not an issue with Amazon Chime SDK for JavaScript rather an issue on how bundlers do module resolution and what distributions `@aws-sdk/client-chime-sdk-messaging`'s dependencies provide when bundlers try to resolve the imported modules.

As of now, builders have reported issues with rollup, esbuild, Nuxt2 framework and Webpack v4. In the following sections each issue is described separately and suggests certain configuration changes for the build to succeed.

#### Rollup

When a builder makes use of the rollup plugin: `rollup-plugin-includepaths` they may run into build issues where node modules and their methods are not found. For example, in the following warnings / errors the Node.js built-ins and the `createHash` method from `crypto` is not found.

```
(!) Missing shims for Node.js built-ins
Creating a browser bundle that depends on "os", "path", "url", "buffer", "http", "https", "stream", "process" and "util". You might need to include https://github.com/FredKSchott/rollup-plugin-polyfill-node
```

```
https://rollupjs.org/guide/en/#error-name-is-not-exported-by-module
node_modules/@aws-sdk/shared-ini-file-loader/dist-es/getSSOTokenFilepath.js (1:9)
1: import { createHash } from "crypto";
```

This node / browser incompatibility issue happens due to bundlers not using the right `runtimeConfig` defined in AWS JS SDK client's `package.json`. Clients in AWS JS SDK have defined a runtime config alias in their `package.json` like this: [Chime SDK Messaging client package.json](https://github.com/aws/aws-sdk-js-v3/blob/main/clients/client-chime-sdk-messaging/package.json#L91). If your bundler does not follow the `runtimeConfig` alias, you can get some incompatibility errors.

If the builder is using [rollup-plugin-includepaths](https://github.com/dot-build/rollup-plugin-includepaths) to use relative paths in their project. It is recommended that you use [rollup-plugin-alias](https://github.com/rollup/plugins/tree/master/packages/alias) to define an alias for relative paths. 

You can find more information about this build error in GitHub issue: [3.7.0 broke build with Rollup](https://github.com/aws/amazon-chime-sdk-js/issues/2455). If you still have questions about rollup alias and plugin settings please reach out to the plugin / rollup author.

#### Esbuild

When bundling an application using `esbuild`, it checks for dependency distributions depending on whether the imported package follows `require` that is CommonJS or `import` that is EcmaScript Module (ESM) approach. The dependency package can have its own dependencies which `esbuild` will try to resolve using the CommonJS or ESM distributions provided by the dependency package. Each package has to provide a link to the distribution path in their `package.json` using `main`, `module` or `browser` fields. In `@aws-sdk/client-chime-sdk-messaging` case, the `esbuild` runs into an issue where it cannot pick the distribution for `browser` specifially for one of the dependencies, thus, failing to build with below error:
```
"../node_modules/@aws-sdk/smithy-client"
          Attempting to load "../node_modules/@aws-sdk/smithy-client/dist-es/index.js" as a file
            Checking for file "index.js"
            Found file "index.js"
        Found main field "main" with path "./dist-cjs/index.js"
          No "browser" map found in directory "../node_modules/@aws-sdk/smithy-client"
          Attempting to load "../node_modules/@aws-sdk/smithy-client/dist-cjs/index.js" as a file
            Checking for file "index.js"
            Found file "index.js"
        Resolved to "../node_modules/@aws-sdk/smithy-client/dist-cjs/index.js" because of "require"
```

To resolve this, add `--main-fields=browser,module,main` when you bundle your application using `esbuild`. For more information, check [this issue](https://github.com/evanw/esbuild/issues/2692) we reported to `esbuild`.

#### Using Amazon Chime SDK for JavaScript in Nuxt2 framework

You can use Amazon Chime SDK for JavaScript in Nuxt2 framework. Nuxt2 framework uses Webpack v4 bundler for bundling the application. Webpack v4 has a known issue when bundling applications that use optional chaining operator. This is resolved in Webpack v5, but, Nuxt2 has not upgraded to use Webpack v5.

Thus, when bundling a Nuxt2 application which imports Amazon Chime SDK for JavaScript v3.7.0 and above, it runs into below error:
```
ERROR in ./node_modules/@aws-sdk/signature-v4/dist-es/getCanonicalHeaders.js 10:30
Module parse failed: Unexpected token (10:30)
You may need an appropriate loader to handle this file type, currently no loaders are configured to process this file. See https://webpack.js.org/concepts#loaders
|         const canonicalHeaderName = headerName.toLowerCase();
|         if (canonicalHeaderName in ALWAYS_UNSIGNABLE_HEADERS ||
>             unsignableHeaders?.has(canonicalHeaderName) ||
|             PROXY_HEADER_PATTERN.test(canonicalHeaderName) ||
|             SEC_HEADER_PATTERN.test(canonicalHeaderName)) {
 @ ./node_modules/@aws-sdk/signature-v4/dist-es/index.js 2:0-60 2:0-60
```

To resolve this, you have to override the `build` configuration in `nuxt.config.js` like below:
```
build: {
  transpile: ["aws-sdk"]
}
```

Check [this issue comment](https://github.com/aws/amazon-chime-sdk-js/issues/2498#issuecomment-1362279568) for more information on the issue.

## Meetings

### How do users authenticate into a meeting?

The Amazon Chime SDK uses join tokens to control access to meetings. These tokens are obtained when each attendee is [created](https://docs.aws.amazon.com/chime-sdk/latest/dg/mtgs-sdk-mtgs.html). The safe distribution of these tokens to the clients is the application developer’s responsibility. The Amazon Chime SDK does not authenticate end users. Developers can use services such as [Amazon Cognito](https://aws.amazon.com/cognito/), Open ID connect, Active Directory, or Facebook to log in end users to their application. You can tie external identity management to Amazon Chime SDK attendees by supplying an `externalUserId` when creating the attendee.

### When does an Amazon Chime SDK meeting end?

An Amazon Chime SDK meeting ends when you invoke the [DeleteMeeting](https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_DeleteMeeting.html) API action.

Also, a meeting automatically ends after a period of inactivity, based on the following rules:

* No audio connections are present in the meeting for more than five minutes.
* 24 hours have elapsed since the meeting was created.

Learn more about [Amazon Chime SDK](https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_Operations_Amazon_Chime_SDK_Meetings.html) namespace.

### How many simultaneous meetings can be hosted in an account? Can this limit be raised?

AWS accounts have a soft limit of [250 concurrent meetings](https://docs.aws.amazon.com/chime-sdk/latest/dg/meetings-sdk.html#mtg-limits). Your limit can be obtained from the [Service quotas console](https://docs.aws.amazon.com/general/latest/gr/aws_service_limits.html) in your AWS account. The limit is applied globally, based on the total number of active meetings across all regions. You can track your concurrent meeting usage in [Amazon CloudWatch](https://aws.amazon.com/cloudwatch/).  If your application needs to support more concurrent meetings, you can request limit increases through the [AWS Customer support portal](https://pages.awscloud.com/GLOBAL-aware-GC-Amazon-Chime-SDK-2020-reg.html).

### How many attendees can join an Amazon Chime SDK meeting? Can this limit be raised?

Amazon Chime SDK limits are defined [here](https://docs.aws.amazon.com/chime-sdk/latest/dg/meetings-sdk.html#mtg-limits). The service supports up to 250 attendees and by default up to 25 video senders in a meeting. An attendee is considered active unless it has been explicitly removed using `DeleteAttendee`. Attendee limits cannot be changed. The number of video senders can be adjusted, but all clients will still be limited to only 25 received videos at a time.

If your use case requires more than 250 attendees, consider using [meeting replication](https://docs.aws.amazon.com/chime-sdk/latest/dg/media-replication.html) to reach up to 10,000 participants, or a [live connector media pipeline](https://docs.aws.amazon.com/chime-sdk/latest/dg/connector-pipe-config.html) to output to RTMP.

### What happens to the subsequent participants who try to turn on the local video when the maximum number of video senders is already reached?

Once the limit of video senders is reached in a meeting, each subsequent participant that tries to turn on the local video will receive a Meeting Session status code of [VideoCallSwitchToViewOnly = 10](https://aws.github.io/amazon-chime-sdk-js/enums/meetingsessionstatuscode.html#videocallswitchtoviewonly) which in turn triggers the observer '[videoSendDidBecomeUnavailable](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideoobserver.html#videosenddidbecomeunavailable)'.

### Can I schedule Amazon Chime SDK meetings ahead of time?

The Amazon Chime SDK does not support scheduling meetings ahead of time. The moment [CreateMeeting](https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_CreateMeeting.html) or 
[CreateMeetingWithAttendees](https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_CreateMeetingWithAttendees.html) is invoked and the meeting is created, the auto end
 policies will apply. If no attendees join the meeting, it will end after 5 minutes. The application can create the meeting when drawing closer to the meeting start time or when the the first attendee is ready to join.

### What happens when I try to re-use same attendee response to join a meeting twice?
 
If two clients attempt to join the same meeting using the same `AttendeeId` or `ExternalUserId` response received from [CreateAttendee](https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_CreateAttendee.html) API then the first attendee will automatically leave the meeting with [`AudioJoinFromAnotherDevice`](https://aws.github.io/amazon-chime-sdk-js/enums/meetingsessionstatuscode.html#audiojoinedfromanotherdevice) meeting session status code. The `AudioJoinFromAnotherDevice` meeting session status code is triggered by the Amazon Chime backend.

### What does it mean when the Amazon Chime SDK for JavaScript throws an error with status code `SignalingBadRequest`, `MeetingEnded`, or `SignalingInternalServerError` while establishing a signaling connection to the Chime servers?

The `SignalingBadRequest` status code indicates that the Chime SDK for JavaScript has failed to establish a signaling connection to the Chime servers. The INFO-level browser logs may include the following messages:

```
sending join
notifying event: WebSocketClosed
stopped pinging (WebSocketClosed)
signaling connection closed by server with code 4403 and reason: attendee unavailable
handling status: SignalingBadRequest
session will not be reconnected: SignalingBadRequest
```

The possible reasons are as follows:

1. If you attempt to join a meeting using a deleted attendee's response, the Amazon Chime SDK for JavaScript throws an error with the status code `SignalingBadRequest`. Note that you or someone can delete an attendee in the [DeleteAttendee API](https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_DeleteAttendee.html) action.
2. The close code `4410` from the Chime backend indicates that an attendee has attempted to join an already-ended meeting. The Amazon Chime SDK for JavaScript throws an error with the status code `MeetingEnded`.
3. The close code between `4500` and `4599` (inclusive) indicates an internal server error in the Amazon Chime backend. In this case, the Amazon Chime SDK for JavaScript throws an error with the status code `SignalingInternalServerError`. Please [create a GitHub issue](https://github.com/aws/amazon-chime-sdk-js/issues/new/choose) including the Amazon Chime SDK browser logs.

### When does the Amazon Chime SDK retry the connection? Can I customize this retry behavior?

The Amazon Chime SDK for JavaScript retries the connection in the following situations.

* The SDK misses consecutive pong messages from the Chime server.
* The SDK detects a high rate of audio packet loss.
* The SDK experiences a significant audio delay.
* The SDK encounters a retryable error during the session. Retryable errors are errors with [retryable response status codes](https://aws.github.io/amazon-chime-sdk-js/classes/meetingsessionstatus.html#isfailure) received regarding the session. i.e. status code with `TaskFailed` or `SignalingInternalServerError` will handled for retries.

The SDK uses [ConnectionHealthPolicyConfiguration](https://aws.github.io/amazon-chime-sdk-js/classes/connectionhealthpolicyconfiguration.html) to trigger a reconnection. We recommend using the default configuration, but you can also provide the custom ConnectionHealthPolicyConfiguration object to change this behavior. 

```js
import {
  ConnectionHealthPolicyConfiguration,
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  LogLevel,
  MeetingSessionConfiguration
} from 'amazon-chime-sdk-js';

const logger = new ConsoleLogger('MyLogger', LogLevel.INFO);
const deviceController = new DefaultDeviceController(logger);

const healthPolicyConfiguration = new ConnectionHealthPolicyConfiguration();

// Default: 25 consecutive WebRTC stats with no packet. You can reduce this value for a faster retry.
healthPolicyConfiguration.connectionUnhealthyThreshold = 50;

// Default: 10000 ms
healthPolicyConfiguration.connectionWaitTimeMs = 20000;

// Default: 60000 ms delay
healthPolicyConfiguration.maximumAudioDelayMs = 30000; 

// Default: 10 data points
healthPolicyConfiguration.maximumAudioDelayDataPoints = 5;

// Default: 4 missed pongs. You can set the missed pongs upper threshold to zero to force restart the session.
healthPolicyConfiguration.missedPongsUpperThreshold = 4; 

const configuration = new MeetingSessionConfiguration(meetingResponse, attendeeResponse);

// Override the default health policy configuration.
configuration.connectionHealthPolicyConfiguration = healthPolicyConfiguration;

const meetingSession = new DefaultMeetingSession(
  configuration,
  logger,
  deviceController
);
```

### What should my application do in response to the status codes in `audioVideoDidStop`?

These status codes can be used for logging, debugging, and possible notification of end users, but in most cases should not be used for any retry behavior, as the audio video controller will already be retrying non-terminal errors (i.e. regardless of `MeetingSessionStatus.isTerminal`, your application should not try to immediately restart or recreate the audio video controller).

If `MeetingSessionStatus.isTerminal` returns `true`, you should remove any meeting UX in addition to notifying the user, as the audio video controller will not be retrying the connection.

See the documentation for `MeetingSessionStatusCode` [here](https://aws.github.io/amazon-chime-sdk-js/enums/meetingsessionstatuscode.html) for explanation of the values when used for `audioVideoDidStop`, which may be used to provide more detail when notifying end users, though more general failure messages are recommended unless otherwise noted.

### What is the timeout for connect and reconnect and where can I configure the value?

The maximum amount of time to allow for connecting is 15 seconds, which can be configurable in [MeetingSessionConfiguration](https://aws.github.io/amazon-chime-sdk-js/classes/meetingsessionconfiguration.html). The [reconnectTimeout](https://aws.github.io/amazon-chime-sdk-js/classes/meetingsessionconfiguration.html#reconnecttimeoutms) is configurable for how long you want to timeout the reconnection. The default value is 2 minutes.


## Media

### Which media regions is the Amazon Chime SDK available in? How do I choose the best media region to place my meetings?

You can find the full list of media regions that the Amazon Chime SDK supports [here](https://docs.aws.amazon.com/chime-sdk/latest/dg/chime-sdk-meetings-regions.html), along with how you can determine the best region for a client. Each client application can query for the best region and return it back to the server application, which can use the collected nearest-region information from each client to select a region for the meeting. This region can then be passed as the [MediaRegion](https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_CreateMeeting.html#chimesdk-meeting-chime_CreateMeeting-request-MediaRegion) 
parameter to [CreateMeeting](https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_CreateMeeting.html#API_meeting-chime_CreateMeeting_RequestBody) or 
[CreateMeetingWithAttendees](https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_CreateMeetingWithAttendees.html#API_meeting-chime_CreateMeetingWithAttendees_RequestBody).

### How do I choose video resolution, frame rate and bitrate?

Applications built with the Amazon Chime SDK for JavaScript can adjust video parameters before a meeting begins by using the [chooseVideoInputQuality and setVideoMaxBandwidthKbps](https://aws.github.io/amazon-chime-sdk-js/modules/qualitybandwidth_connectivity.html#adjust-local-video-quality) APIs.

### How can I stream music or video into a meeting?

You can use the [AudioVideoFacade.startContentShare(MediaStream)](https://aws.github.
io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#startcontentshare) API to stream audio and/or video content 
to the meetings. See the [meeting demo application](https://github.com/aws/amazon-chime-sdk-js/blob/main/demos/browser/app/meetingV2/meetingV2.ts#L1266) for an example of how to 
achieve this.

### When I stream video in Chrome, other attendees see a black screen. Is this a known issue?

The [AudioVideoFacade.startContentShare(MediaStream)](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#startcontentshare) API uses the HTMLMediaElement.captureStream API to stream video content content to the meeting. Chrome 88 and above have a [known issue](https://bugs.chromium.org/p/chromium/issues/detail?id=1156408) that the captureStream API does not send any data.

As a workaround, you can turn hardware acceleration off in Chrome (version 88.0.4324.146 and above) and then stream video. Go to Settings (`chrome://settings`), scroll down to System, and turn off "Use hardware acceleration when available".

### How do I broadcast an Amazon Chime SDK meeting?

You can deploy a web application broadcasting solution similar to the [Amazon Chime Meeting Broadcasting Demo](https://github.com/aws-samples/amazon-chime-meeting-broadcast-demo) to broadcast an Amazon Chime SDK meeting to RTMP-enabled streaming services by instead using a `MEETING_URL` consisting of the URL to the meeting to be broadcasted.

### How can I adjust my application to perform better under different network conditions?

See this [guide](https://aws.github.io/amazon-chime-sdk-js/modules/qualitybandwidth_connectivity.html) to learn how to monitor uplink and downlink bandwidth and what mitigations exist for different kinds of impairment.

### Does Amazon Chime SDK support simulcast?

The Amazon Chime SDK supports simulcast for Chromium-based browsers. See this [technical guide](https://aws.github.io/amazon-chime-sdk-js/modules/simulcast.html) for more information.

### Does the SDK support remote mute where one attendee can mute another?

Remote mute is the ability of one attendee in a meeting to mute another attendee. This feature is currently not supported server-side by the SDK. However, you can use [Amazon Chime SDK Data Messages](https://aws.github.io/amazon-chime-sdk-js/modules/apioverview.html#9-send-and-receive-data-messages-optional) to send a message containing the attendee or attendees that should mute, and clients can mute themselves when they receive those messages.

### How do I get connection indicator for media quality?

The [getObservableVideoMetrics](https://aws.github.io/amazon-chime-sdk-js/interfaces/clientmetricreport.html#getobservablevideometrics) API exposes video quality statistics. The `getObservableVideoMetrics` API returns following metrics:

```js
// Upstream metrics of local attendee
videoUpstreamBitrate,
videoUpstreamPacketsSent,
videoUpstreamPacketLossPercent,
videoUpstreamFramesEncodedPerSecond,
videoUpstreamFrameHeight,
videoUpstreamFrameWidth,

// Downstream metrics of remote attendees
videoDownstreamBitrate,
videoDownstreamPacketLossPercent,
videoDownstreamPacketsReceived,
videoDownstreamFramesDecodedPerSecond,
videoDownstreamFrameHeight,
videoDownstreamFrameWidth,
```

See this [guide](https://aws.github.io/amazon-chime-sdk-js/modules/qualitybandwidth_connectivity.html) for more information. 

## Demos

### I want to build a React application that uses the Amazon Chime SDK. Do you have a sample application that I can reference?

See this [blog post](https://aws.amazon.com/blogs/business-productivity/building-a-virtual-classroom-application-using-the-amazon-chime-sdk/) and [demo](https://github.com/aws-samples/amazon-chime-sdk-classroom-demo) for a building a virtual classroom using the Amazon Chime SDK for JavaScript.

### I want to build a React Native application that uses the Amazon Chime SDK. Do you have a sample application I can reference?

There is a React Native demo [here](https://github.com/aws-samples/amazon-chime-react-native-demo).

### Do I get billed for using the demos?

Your account will get billed for attendee minutes and for any other AWS resources used by the demo. Please use [AWS Cost Explorer](https://aws.amazon.com/aws-cost-management/aws-cost-explorer/) for details on cost breakdown.

### Does Amazon Chime SDK support recording functionality?

Yes. You can [record to Amazon S3 using media capture pipelines](https://docs.aws.amazon.com/chime-sdk/latest/dg/media-capture.html), or capture from a web browser. [This blog post](https://aws.amazon.
com/blogs/business-productivity/how-to-enable-client-side-recording-using-the-amazon-chime-sdk/) and [demo](https://github.com/aws-samples/amazon-chime-sdk-recording-demo) show how to enable client-side recording.

## Debugging

### How can I get Amazon Chime SDK logs for debugging?

Applications can get logs from Chime SDK by passing instances of `Logger` when instantiating [the MeetingSession object](https://aws.github.io/amazon-chime-sdk-js/interfaces/meetingsession.html). Amazon Chime SDK has some default implementations of logger that your application can use, such as [ConsoleLogger](https://aws.github.io/amazon-chime-sdk-js/classes/consolelogger.html) which logs into the browser console, [POSTLogger](https://aws.github.io/amazon-chime-sdk-js/classes/postlogger.html) which logs in [Amazon CloudWatch](https://aws.amazon.com/cloudwatch/) and [MultiLogger](https://aws.github.io/amazon-chime-sdk-js/classes/multilogger.html) which logs in multiple destinations.

### How do I file an issue for the Amazon Chime SDK for JavaScript?

You can use our [bug template](https://github.com/aws/amazon-chime-sdk-js/issues/new?assignees=&labels=bug&template=bug-report.md&title=) to file issues with logs (it is helpful to set the logging 
level as INFO) and exact reproduction steps. To help you faster, you can check the usage of the API in our [API overview](https://aws.github.io/amazon-chime-sdk-js/modules/apioverview.html), [demos](https://github.com/aws/amazon-chime-sdk-js/blob/main/README.md#examples) and the [usage section](https://github.com/aws/amazon-chime-sdk-js/blob/main/README.md#usage) in our Readme. In addition search our [issues database](https://github.com/aws/amazon-chime-sdk-js/issues?q=is:issue) as your concern may have been addressed previously and mitigations may have been posted.

## Networking

### What are the subnets and ports used by an application using the AWS SDK?

An application which calls Amazon Chime APIs via the [AWS SDK](https://aws.amazon.com/tools/), like [CreateMeeting](https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_CreateMeeting.html), connects to the global service endpoint in the `us-east-1` region: [service.chime.aws.amazon.com](https://service.chime.aws.amazon.com/), or [service-fips.chime.aws.amazon.com](https://service-fips.chime.aws.amazon.com/) with `TCP:443`.

The URIs resolve to IP addresses in the `AMAZON` subnets for `us-east-1`, as published in the [AWS ip-ranges.json](https://docs.aws.amazon.com/general/latest/gr/aws-ip-ranges.html).

### What are the subnets and ports used by a client running the Amazon Chime SDK?

A client running the Amazon Chime SDK connects to the Amazon Chime service via URIs (never direct IP addresses) that are part of the `*.chime.aws` domain.  The URIs resolve to IP addresses in the `CHIME_MEETINGS` subnets, as published in the [AWS ip-ranges.json](https://docs.aws.amazon.com/general/latest/gr/aws-ip-ranges.html), which is currently a single subnet: `99.77.128.0/18`.

The Amazon Chime SDK will use `TCP:443` for https and websocket connectivity, and `UDP:3478` for media.  If `UDP:3478` is blocked, the SDK falls back to TCP. However the video experience will be poor, and audio will use a region specific subnet assigned by [Amazon Elastic Compute Cloud (Amazon EC2)](https://aws.amazon.com/ec2/).

Some features such as Amazon Voice Focus require accessing Amazon CloudFront.

### Can a client running the Amazon Chime SDK connect to the service via a proxy?

The Amazon Chime SDK has URL [rewriter hooks](https://aws.github.io/amazon-chime-sdk-js/classes/meetingsessionurls.html#urlrewriter) that the application builder can use to munge the URLs to traverse unauthenticated proxies.  When traversing a proxy, all media is sent over TCP which impacts the user experience.

## Mobile browser

### Is screen capture supported on mobile browsers?

Amazon Chime SDK for JavaScript applications do not support content sharing on mobile browsers because a key dependency, WebRTC's [getDisplayMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia) is not available on these browsers. Clients joining from these devices can still view content shared by other participants in the call.

### Will Amazon Chime SDK for JavaScript meetings work in Chrome and Firefox in iOS?

Yes, the Amazon Chime JS SDK supports Chrome and Firefox on iOS. Refer to the official Amazon Chime SDK Documentation for more information: https://docs.aws.amazon.com/chime-sdk/latest/dg/meetings-sdk.html#mtg-browsers.

### I notice that my clients lose audio and drop from the meeting if the Chrome browser on Android stays in background for several minutes, is that a known issue?

This is a known issue and happens primarily due to this [Chromium bug](https://bugs.chromium.org/p/chromium/issues/detail?id=951418). At present we do not have a workaround.

### I only see iPhone or iPad microphone as audio input in iOS device, is that a known issue?

iOS Safari/Chrome/Firefox have a known issue where the device selection list only lists one audio input device even when there are multiple. For example
, if you plug in a wired headset to your iPhone, it will show up as iPhone microphone replacing the internal mic. For
 more information, please refer to [the Webkit issue](https://bugs.webkit.org/show_bug.cgi?id=174833). 

### I can hear clicking noise from an attendee using iPhone X devices (X, XS, and XR).

This was a known issue on iPhone X devices (X, XS, and XR) when using AudioContext-based APIs in iOS Safari 13 and below. Please upgrade your device to iOS 14 and try again. For more information, see our comment in [the WebKit issue](https://bugs.webkit.org/show_bug.cgi?id=204625#c6). 

### I cannot hear audio from other attendees using iOS devices after I unplug my wired headset.

iOS Safari/Chrome/Firefox browsers have a known issue where they do not automatically switch to the iOS internal speaker after users unplug
 their wired headset. For more information, please refer to [the Webkit issue](https://bugs.webkit.org/show_bug.cgi?id=216389).

### **I notice that if I turn on camera and put the browsers in background, others in the meeting will see black tile in Safari/Chrome/Firefox in iOS and frozen tile in Chrome in Android, is this a known issue?**

This is the default behavior that is specific to each browser. In Android, the video stream is muted when in background and thus, the video will show the last frame.
Note that for Android, if an attendee joins later after the video stream is in background, it will show as a blank tile since the last frame is blank.
For better user experience, we recommend considering [Chime SDK iOS](https://github.com/aws/amazon-chime-sdk-ios) and 
[Chime SDK Android](https://github.com/aws/amazon-chime-sdk-android).

### **When I join a meeting in Chrome in Android 8 or 9 with speakerphone, other people could not hear me. Switch to default mic fixes the issue.**

This seems to be a [bug](https://bugs.chromium.org/p/webrtc/issues/detail?id=11677) with Android 8 or 9 when using getUserMedia with speakerphone device Id that the audio stream will end after a brief moment. Using default device Id will fix this issue. Note that this only happens if users select speakerphone first. If you use default device when joining the meeting then switch to Speakerphone, this issue does not happen.

### **Why can I not grab device labels in Android Webview?**

This is a [bug](https://bugs.chromium.org/p/chromium/issues/detail?id=669492) with Chromium WebView. There is currently no fix for this issue, but you are able to provide default labels for devices.

### I see a slate which says "Your client does not support hardware acceleration" when I enable video on my device?

This error indicates that the device you are using does not support hardware acceleration decoding. However this does not impact the ability of this user to participate in Amazon Chime SDK meetings as the device can render and transmit VP8 streams to other parties in the call. Specifically for Chrome, you will need to enable [Simulcast](https://aws.github.io/amazon-chime-sdk-js/classes/meetingsessionconfiguration.html#enablesimulcastforunifiedplanchromiumbasedbrowsers).
In some cases, H.264 may be missing from the initial SDP offer [tracking Chromium bug](https://bugs.chromium.org/p/chromium/issues/detail?id=1047994)) causing this slate to appear. Rejoining the meeting can fix the videos to be rendered once again.

### I am not able to join an Amazon Chime SDK meeting from an Android 11 device running Chromium 83 based browsers, such as Samsung Internet (Version 13) or Chrome (Version 83). Is this a known issue?

This is a bug on Android 11 running Chromium 83 based browsers. You will observe this issue on the Samsung Internet browser (Version 13) since it is based on Chromium 83. Please check [ICE gathering stalls in Chrome on Android 11](https://bugs.chromium.org/p/chromium/issues/detail?id=1115498) bug for more information. This issue is not observed on the Samsung Internet browser (Version 12) or the latest Chrome for Android browser when tested on an Android 11 device.

### Does Amazon Voice Focus support the Samsung Internet browser?

Yes, Amazon Voice Focus supports the Samsung Internet browser (Chromium 83 or lower). However, it leads to a poor user experience because the preferred Chromium version is 87 or higher. Please check Amazon Voice Focus [browser compatibility matrix](https://aws.github.io/amazon-chime-sdk-js/modules/amazonvoice_focus.html#browser-compatibility) in Amazon Voice Focus guide.


## Audio and video

### My clients are unable to join the meeting and I see `navigator.mediaDevices is undefined`, what could be the reason?

Amazon Chime SDK for JavaScript uses WebRTC’s getUserMedia() when you invoke the `startAudioInput` or
`startVideoInput` APIs which can operate in [secure contexts inside a browser only](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#Privacy_and_security) for privacy concerns so you will need to access your browsers using HTTPS://. The hostname `localhost` and the loopback address `127.0.0.1` are exceptions.

### How can I create a video tile layout for my application?

Applications that show multiple video tiles on the screen will need to decide where to place the underlying video elements and how to apply CSS styling. Here are a few things to consider as you develop the tile layout for your application:

* A video whose source is a mobile device in portrait mode will display quite differently compared to a video in landscape mode from a laptop camera. The CSS object-fit rule can be applied to the video element to change how the content scales to fit the parent video element.
* Use the `VideoTileState` [videoStreamContentWidth and videoStreamContentHeight](https://aws.github.io/amazon-chime-sdk-js/classes/videotilestate.html) properties to determine the aspect ratio of the content.
* After calling [bindVideoElement](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideofacade.html#bindvideoelement), set up `resize` [event listeners on the HTMLVideoElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/videoWidth) to listen to intrinsic resolution from the video content.
* For landscape aspect ratios (width > height), apply the CSS rule `object-fit:cover` to the HTML element that will contain the video to crop and scale the video to the aspect ratio of the video element.
* For portrait aspect ratios (height > width), apply the CSS rule `object-fit:contain` to the HTML element that will contain the video to ensure that all video content can be seen.

### After leaving a meeting, the camera LED is still on indicating that the camera has not been released. What could be wrong?

When the camera LED remains on, it does not necessarily mean the device is broadcasting to the remote attendees. The LED will remain on until all media streams that use the device are released (its tracks are stopped). The following API methods release media streams.

```
// Select no video device (releases any previously selected device)
meetingSession.audioVideo.stopVideoInput();
```

### My clients are unable to successfully join audio calls from Safari, they get a `failed to get audio device for constraints null: Type error`, what could be the issue?

This error message is an indication that the browser application did not successfully acquire the media stream for 
audio or video from the device before the meeting starts. Application has not passed in the right device Id to the 
`startVideoInput` API. In this case you will see the following entry in the log where an empty string after 
`startVideoInput`:

```
[Info] 2020-06-18T17:43:55.380Z [INFO] VLR - API/DefaultDeviceController/startVideoInput "" -> "PermissionDeniedByBrowser"
```

This applies for video input as well.

### How can I show a custom UX when the browser prompts the user for permission to use microphone and camera?

Device labels are privileged since they add to the fingerprinting surface area of the browser session. In Chrome private tabs and in all Firefox tabs, the labels can only be read once a MediaStream is active. How to deal with this restriction depends on the desired UX. The device controller includes an injectable device label trigger which allows you to perform custom behavior in case there are no labels, such as creating a temporary audio/video stream to unlock the device names, which is the default behavior.

You may want to override this behavior to provide a custom UX such as a prompt explaining why microphone and camera 
access is being asked for by supplying your own function to setDeviceLabelTrigger(). See the [meeting demo application](https://github.com/aws/amazon-chime-sdk-js/blob/main/demos/browser/app/meetingV2/meetingV2.ts#L928) for 
an example.

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

### How can I speed up my meeting join times?

The most significant improvement comes from choosing the right region to host your meeting, as discussed earlier in this FAQ.

Meeting join comprises several steps, one of which is establishing a signaling connection. You can front-load this work by specifying `{ signalingOnly: true }` in a call to `start` as early as possible in your application — _e.g._, in a device picker or lobby view — and then calling `start` again to finish joining the meeting. The attendee will not be shown as having joined the meeting until the second `start` call completes.

## Messaging

### How do I receive Amazon Chime SDK channel messages without using the Amazon Chime SDK for JavaScript?

Follow the instructions in the ["Using websockets to receive messages" developer guide](https://docs.aws.amazon.com/chime-sdk/latest/dg/websockets.html#connect-api).
To sign the URL in Python, use the example code in the [GitHub issue #1241](https://github.com/aws/amazon-chime-sdk-js/issues/1241#issuecomment-830705541).