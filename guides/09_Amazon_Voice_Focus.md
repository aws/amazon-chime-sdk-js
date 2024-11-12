# Integrating Amazon Voice Focus and Echo Reduction into your Amazon Chime SDK for JavaScript application

- [Integrating Amazon Voice Focus and Echo Reduction into your Amazon Chime SDK for JavaScript application](#integrating-amazon-voice-focus-and-echo-reduction-into-your-amazon-chime-sdk-for-javascript-application)
  - [What is Amazon Voice Focus?](#what-is-amazon-voice-focus)
  - [What is Echo Reduction?](#what-is-echo-reduction)
  - [Amazon Voice Focus on the web](#amazon-voice-focus-on-the-web)
  - [When should I use Amazon Voice Focus?](#when-should-i-use-amazon-voice-focus)
  - [When should I use Echo Reduction?](#when-should-i-use-echo-reduction)
  - [Can I use Amazon Voice Focus and Echo Reduction in my application?](#can-i-use-amazon-voice-focus-and-echo-reduction-in-my-application)
    - [Browser compatibility](#browser-compatibility)
    - [SIMD support](#simd-support)
    - [Content delivery, caching and bandwidth](#content-delivery-caching-and-bandwidth)
  - [Preparing your application](#preparing-your-application)
    - [Content Security Policy](#content-security-policy)
    - [Cross-Origin Opener Policy](#cross-origin-opener-policy)
  - [Frames](#frames)
  - [Checking for support before offering noise suppression and echo reduction](#checking-for-support-before-offering-noise-suppression-and-echo-reduction)
  - [Adding Amazon Voice Focus to your application](#adding-amazon-voice-focus-to-your-application)
  - [Adding Echo Reduction to your application](#adding-echo-reduction-to-your-application)
    - [Request](#request)
- [Check for support](#check-for-support)
  - [Configuration](#configuration)
  - [Enabling Voice Focus with Echo Reduction](#enabling-voice-focus-with-echo-reduction)
    - [1. Create a meeting with support for Echo Reduction using Amazon Chime SDK Meetings namespace](#1-create-a-meeting-with-support-for-echo-reduction-using-amazon-chime-sdk-meetings-namespace)
    - [2. Enabling Echo Reduction at the client level](#2-enabling-echo-reduction-at-the-client-level)
  - [Disabling Amazon Voice Focus and Echo Reduction and switching devices](#disabling-amazon-voice-focus-and-echo-reduction-and-switching-devices)
  - [Destroying Amazon Voice Focus worker thread from your application](#destroying-amazon-voice-focus-worker-thread-from-your-application)
  - [Disabling Echo Reduction from your application](#disabling-echo-reduction-from-your-application)
  - [Adapting to performance constraints](#adapting-to-performance-constraints)
    - [Usage preference](#usage-preference)
    - [Variant selection](#variant-selection)
    - [Execution preference](#execution-preference)
    - [Name](#name)
    - [Configuring SIMD](#configuring-simd)
    - [Disabling estimation entirely](#disabling-estimation-entirely)
  - [Observer notifications](#observer-notifications)
  - [Automatic gain control](#automatic-gain-control)
  - [Accessing and using configurations](#accessing-and-using-configurations)


## What is Amazon Voice Focus?

Amazon Voice Focus is a noise suppressor that uses machine learning to reduce unwanted background noise in your users’ microphone input. Unlike conventional noise suppressors, Amazon Voice Focus reduces fan noise, road noise, typing, rustling paper, lawnmowers, barking dogs, and other kinds of non-speech input, allowing your users to focus on the human voice.

Amazon Voice Focus offers multiple complexity levels, allowing you to trade some quality to support a wider range of devices. The Amazon Chime SDK will by default automatically choose the right complexity level at runtime based on device performance.

Amazon Voice Focus is integrated into the `browser` demo application. To try it out, launch the demo with `npm run start`, choose “Web Audio” on the first screen, then either check the “Voice Focus” box in the lobby view, or click “Voice Focus” in the device picker after joining the meeting.

## What is Echo Reduction?

Echo reduction helps keep echoes and sounds from a user’s loudspeaker that get picked up by their microphone—from circulating back into meeting audio and bringing discussions to a standstill. The echo reduction feature is available in conjunction with the noise reduction provided by Amazon Voice Focus. 

Echo reduction is enabled at the meeting level when you call the CreateMeeting or CreateMeetingWithAttendees APIs. Enabling the feature this way allows others who join the meeting to enable echo reduction as desired.

The feature is integrated into the `browser` demo application. To try it out, launch the demo with `npm run start`, choose “Web Audio” and “Use Echo Reduction (new meetings only)” on the first screen, then either check the “Voice Focus” box in the lobby view, or click “Voice Focus” in the device picker after joining the meeting.

Amazon Chime Echo Reduction is a premium feature, please refer to the [Pricing](https://aws.amazon.com/chime/pricing/#Chime_SDK_) page for details.

## Amazon Voice Focus on the web

Amazon Voice Focus runs in the end user’s web browser, leveraging modern web platform features including Web Audio, Audio Worklet, and WebAssembly. See the section “[Can I use Amazon Voice Focus in my application?](#can-i-use-amazon-voice-focus-in-my-application)” for browser version requirements.

Amazon Voice Focus is available as part of the Amazon Chime SDK for JavaScript from version 2.0 onward.

Because Amazon Voice Focus on the web requires Web Audio, construct your `DeviceController` with Web Audio support, passing the `{ enableWebAudio: true }` argument to `new DefaultDeviceController`.

When testing Amazon Voice Focus in the `browser` demo application, remember to choose “Web Audio” in the feature picker on the first screen.

## When should I use Amazon Voice Focus?

Amazon Voice Focus is ideal for situations in which users will experience background noise and only care about human speech. Because it reduces almost all non-voice sound, it works best in applications where the person’s voice is the most important part of the interaction. When your users are in shared or noisy spaces, Amazon Voice Focus can substantially reduce distracting background noises that contribute to a poor meeting experience.

Quiet environments, and situations in which other sound is important (music lessons, for example) will see less benefit from Amazon Voice Focus, and in some of those situations Amazon Voice Focus will impair the user experience by eliminating important audio.

Additionally, situations in which multiple human speakers might overlap at different volume levels, as might be the case with several participants in a room with a single laptop, might exhibit unwanted suppression of the quietest participants.

Applications with demanding CPU utilization, like games, might not leave enough compute resources for Amazon Voice Focus to work smoothly, particularly on resource-constrained devices.

If you think your application might be used in these scenarios, take care to test your application with Amazon Voice Focus, and give your users the ability to control whether to enable noise suppression, as well as to turn it off during a meeting.

## When should I use Echo Reduction?

Echo Reduction is ideal for situations in which a user's loudspeaker will be the primary output device for meeting audio.  When multiple users are attending a meeting from the same device as in a conference room or when an individual remote attendee is not wearing headphones, Echo Reduction can enhance the meeting experience by reducing the echo caused due to the loudspeaker output feeding back into the microphone. 

If you think your application might be used in these scenarios, take care to test your application with Echo Reduction, and give your users the ability to control whether to enable echo reduction, as well as to turn it off during a meeting.

## Can I use Amazon Voice Focus and Echo Reduction in my application?

Echo Reduction is built over Amazon Voice Focus and hence all the prerequisites and constraints applied to Amazon Voice Focus hold true for Echo Reduction as well.

### Browser compatibility

Amazon Voice Focus and Echo Reduction in the Amazon Chime SDK for JavaScript works in Firefox, Chrome, and Chromium-based browsers (including Electron) on desktop, Android, and iOS operating systems, and Safari 14.1 and later on macOS and some iOS devices. A full compatibility table is below.

|Browser                                                                |Minimum supported version  |Preferred version  |Notes               |
|---                                                                    |---                        |---                |---                 |
|Firefox                                                                |76                         |83+                |                    |
|Chromium-based browsers and environments, including Edge and Electron  |78                         |87+                |                    |
|Safari                                                                 |14.1                       |-                  |                    |
|Android browser                                                        |78*                        |87*                |Typically too slow. |
|iOS Safari                                                             |iOS 14                     |-                  |                    |
|iOS Chrome                                                             |iOS 14                     |-                  |                    |
|iOS Firefox                                                            |iOS 14                     |-                  |                    |


Amazon Voice Focus and Echo Reduction are more CPU-intensive than conventional noise suppression systems, and the web runtime affects performance. As such, not all mobile devices or lower-spec laptop or desktop computers will be sufficiently powerful, or will be able to use Amazon Voice Focus and Echo Reduction while also supporting multiple video streams and rich application functionality.

The default configuration will adapt to available processor power and adjust quality accordingly, but some browsers and devices will simply be unable to enable the feature. Android browsers are theoretically compatible, but typically cannot meet the performance requirements. iOS 14 ships Safari 14, and relatively modern iPhones (*e.g.*, iPhone X) have been found to be fast enough.

See the sections “[Checking for support before offering noise suppression](#checking-for-support-before-offering-noise-suppression)” and “[Adapting to performance constraints](#adapting-to-performance-constraints)” for more details about checking for support and adapting to capabilities.

### SIMD support

Amazon Voice Focus and Echo Reduction are more efficient in environments that support Single Instruction, Multiple Data (SIMD), and will use less CPU for a given complexity level when it is enabled. Low-powered devices running browsers without SIMD support might be unable to use any complexity level of Amazon Voice Focus and Echo Reduction.

See the section “[Configuring SIMD](#configuring-simd)” for more details about controlling SIMD usage.

### Content delivery, caching and bandwidth

Amazon Voice Focus and Echo Reduction model files are loaded from an Amazon Content Delivery Network (CDN) at runtime. This provides low-latency global distribution without the need to serve a full suite of files as part of your application.

Model files range in size from 200KB up to 8MB, depending on the complexity level selected by you or by the SDK’s own performance estimator, and depending on the capabilities of the user’s browser. Model files will be cached indefinitely by end users’ browsers, so that subsequent uses of Amazon Voice Focus on the same device will take less time to initialize.

In addition to having network connectivity to [Amazon Chime’s media services, as described in the documentation](https://docs.aws.amazon.com/chime-sdk/latest/dg/what-is-chime-sdk.html), the use of Amazon Voice Focus and Echo Reduction requires access to Amazon CloudFront via HTTPS (port 443). All requests will be to subdomains of `sdkassets.chime.aws`. End users whose network configurations prevent access to this CDN, or applications that do not include the correct domain in Content Security Policy (see below), will fail support checks and be unable to use Amazon Voice Focus and Echo Reduction.

CloudFront’s IP address ranges are documented in the [Amazon CloudFront Developer Guide](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/LocationsOfEdgeServers.html).

The overhead of loading model files can add latency to parts of your application. A browser loading the `c20` model over a residential broadband connection will typically download and compile the model in around 500ms, but global internet speeds and latencies can vary. The browser cache will make subsequent loads significantly faster. Check for support and create Amazon Voice Focus and Echo Reduction resources at appropriate times to minimize the impact of this latency: for example, during a lobby or device picker interaction.

## Preparing your application

### Content Security Policy

Modern web applications use [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) to protect users from certain classes of attacks. You will need to include the following in your policy to allow the Amazon Chime SDK access to resources it needs at runtime:

* `script-src` and `script-src-elem`: add `https://*.sdkassets.chime.aws` to load audio processing code to run in the browser’s audio renderer thread.
* `connect-src`: add `https://*.sdkassets.chime.aws` to load model files via `fetch`.
* `worker-src`: add `blob:` to load worker JavaScript across origins.
* `child-src`: add `blob:` to load worker JavaScript across origins (only in Safari).

In Chrome 95 and later, compiled WebAssembly modules cannot be passed across module boundaries, so your application must be permitted to evaluate those modules. You must add the following to `script-src` and `script-src-elem`:

* `'wasm-eval'` and `'wasm-unsafe-eval'` to compile fetched WebAssembly in your application.

In Chrome 96 and later, the Amazon Voice Focus worker needs an additional policy entry to allow it to compile WebAssembly. If your application does not specify a fixed `variant` in its model spec, or uses a worker-based execution mode, then you must add the following to `script-src` and `script-src-elem`:

* `'unsafe-eval'` to allow the worker to compile the estimator and/or noise suppression code.

This might be an unintentional regression in Chrome; an [issue has been filed](https://bugs.chromium.org/p/chromium/issues/detail?id=1259726).

If you omit any of these entries, or if you use both HTTP headers and `http-equiv` `meta` tags to specify policy and inadvertently exclude any of these by intersection, then Amazon Voice Focus will not be able to initialize, and will either appear to be unsupported or will fail to create a suppressed audio device. You will see errors in your browser console like:

```
Refused to connect to
'https://static.sdkassets.chime.aws/workers/worker-v1.js…'
because it violates the document's Content Security Policy.
```

or

```
Refused to load the script
'https://static.sdkassets.chime.aws/processors/worklet-inline-processor…'
because it violates the following Content Security Policy directive…
```

If you need guidance with correct CSP configuration to use Amazon Voice Focus and Echo Reduction, contact AWS Support.

### Cross-Origin Opener Policy

Some execution modes require careful configuration of web security, including less common headers like [`Cross-Origin-Opener-Policy`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy). To opt in to these execution modes, send

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

when serving your application HTML. These headers are optional but advised: they improve web security, as well as allowing the browser to support technologies like `SharedArrayBuffer`.

## Frames

Before attempting to use Amazon Voice Focus and Echo Reduction, make sure that your application is not running in an iframe. Browsers, particularly Chromium-based browsers like Chrome, Electron, and Edge, can restrict use of real-time scheduling in iframes (called "subframes" in Chromium). This results in choppy and unintelligible audio.

You can check whether your page or application is running in a subframe by using Chromium's `about:tracing` page.

1. Load your application as normal.
2. Press **Record** in the tracing page.
3. Choose "Manually select settings", click **None** on both sides, check `audio-worklet` and `webaudio.audionode` on the right side and `webaudio` on the left, then press **Record**.
4. In your application, start audio and activate Amazon Voice Focus.
5. Return to the tracing page and press **Stop**.
6. Expand the "Renderer" row for your page in the main part of the window. Make sure you see "Realtime AudioWorklet thread".
7. Click **Processes** in the top right. Make sure the one that shows your page title _does not_ say "Subframe".

The Amazon Voice Focus and Echo Reduction support check in `VoiceFocusDeviceTransformer.isSupported` will warn to its provided logger if run in an iframe, and will report no support if `{ allowIFrame: false }` is provided as part of its options argument.

## Checking for support before offering noise suppression and echo reduction

Some browsers support the Amazon Chime SDK but do not support Amazon Voice Focus and Echo Reduction. Additionally, some devices are not fast enough to keep up with real-time audio while suppressing noise.

The SDK provides a static method to allow you to cheaply check for the required browser features:

```typescript
import { VoiceFocusDeviceTransformer } from 'amazon-chime-sdk-js';
…
const isVoiceFocusSupported = await VoiceFocusDeviceTransformer.isSupported();
```

If `isSupported` returns `true`, you can instantiate a transformer. This will measure the runtime environment and perform some initialization, and so its `isSupported` method is more accurate.

```typescript
let transformer: VoiceFocusDeviceTransformer;
try {
  transformer = await VoiceFocusDeviceTransformer.create();
  isVoiceFocusSupported = transformer.isSupported();
} catch (e) {
  // Will only occur due to invalid input or transient errors (e.g., network).
  isVoiceFocusSupported = false;
}
```

By default this will also pre-load the model file and prepare Amazon Voice Focus and Echo Reduction for use. Failure to load necessary resources will result in `isSupported` returning `false`. If you do not want to pre-load resources — *e.g.*, if you would rather the download occur later, or you are not sure if the user will use noise suppression — pass the optional `preload` argument:

```typescript
const spec = {};
const options = {
  preload: false,
  logger,
};

transformer = await VoiceFocusDeviceTransformer(spec, options);
```

Check for both of these kinds of support prior to offering noise suppression and echo reduction to users. The ideal time to do so is during pre-meeting setup.

Your device controller must support Web Audio to use Amazon Voice Focus and Echo Reduction. If you do not wish to enable Web Audio universally, you can use your support check as a condition:

```typescript
this.deviceController = new DefaultDeviceController({
  enableWebAudio: isVoiceFocusSupported
});
```

## Adding Amazon Voice Focus to your application

Amazon Voice Focus integrates with the SDK by providing a new kind of audio input device: one that wraps another audio input and applies noise suppression to it.

## Adding Echo Reduction to your application

Echo Reduction integrates with the SDK by providing a new kind of audio input device: one that wraps another audio input and applies echo reduction to it. There is another input node which takes the speaker output as input and feeds this to the model to perform echo reduction.

The Echo Reduction capability is enabled at the meeting level when `CreateMeeting` or `CreateMeetingWithAttendees` is called. This allows others who join the meeting to enable Echo Reduction (not enabled automatically).

### Request

```typescript
POST /meetings HTTP/1.1
Content-type: application/json
{
   ClientRequestToken: "string",
   ExternalMeetingId: "string",
   MediaRegion: "string",
   MeetingHostId: "string",
   NotificationsConfiguration: { 
      SnsTopicArn: "string",
      SqsQueueArn: "string"
   },
   MeetingFeatures: {
     Audio: {
       EchoReduction: "AVAILABLE"
     }
   }
}
```

Where `MeetingFeatures` is an optional parameter which contains a list of audio and video features that are enabled at the meeting level. The `Audio` sub-element is an optional category of meeting features which contains audio-specific configurations, such as operating parameters for Voice Focus. The `EchoReduction` configuration makes Echo Reduction available to clients who wish to connect to the meeting. It is an optional parameter which accepts the string `'AVAILABLE'`. 


# Check for support

Once you have checked for support and created a transformer, you create a `VoiceFocusTransformDevice` from a user’s selected audio input as follows:

```typescript
const chosenAudioInput = 'abcdef';    // Device ID, stream, or constraints
const vfDevice = await transformer.createTransformDevice(chosenAudioInput);
```

If the transformer returned that Amazon Voice Focus/Echo Reduction is not supported, or it failed to initialize, this method returns `undefined`. In that case, fall back to the user's chosen audio input and indicate to the user that noise suppression is not enabled.

The returned `VoiceFocusTransformDevice` can be supplied to a `startAudioInput` call in the usual way:

```typescript
const deviceToUse = vfDevice || chosenAudioInput;
await deviceController.startAudioInput(deviceToUse);
if (vfDevice) {
  console.log('Amazon Voice Focus enabled');
}
```

As noted above, the device controller must support Web Audio.

## Configuration

Both `isSupported` and `create` accept _specifications_ — `VoiceFocusSpec` structures — as input. These allow you to describe the model attributes, execution approach, and other configuration options that define how the feature should operate.

To use Amazon Voice Focus, the name section of the specification should be set to `'default'` whereas to use Echo Reduction, the name section of the specification should be set to `'ns_es'`. Echo Reduction can only be enabled while creating the meeting.

```typescript
spec = { ...
   name: 'default' // for Amazon Voice Focus
   ...
}
spec = { ...
   name: 'ns_es' // for Echo Reduction 
   ...
}
```

Most developers will not need to provide a specification: the defaults are chosen to work well and adapt to runtime constraints. Some options are described in the section “[Adapting to performance constraints](#adapting-to-performance-constraints)”.

A specification is used to derive a runtime _configuration_ when a transformer is created. A configuration is an opaque blob derived within a particular runtime context. The configuration drives exactly how noise suppression will be applied to an input stream. Applications can access these configurations in order to support unusual interaction patterns; see “[Accessing and using configurations](#accessing-and-using-configurations)”.

## Enabling Voice Focus with Echo Reduction

> ⚠️ To use the Echo Reduction feature, you must migrate to the [Amazon Chime SDK Meetings](https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_Operations_Amazon_Chime_SDK_Meetings.html) namespace. To do so, you can follow the steps in the [Migrating to the Amazon Chime SDK Meetings namespace](https://docs.aws.amazon.com/chime-sdk/latest/dg/meeting-namespace-migration.html).

Enabling Voice Focus with Echo Reduction is a two step process: 

### 1. Create a meeting with support for Echo Reduction using Amazon Chime SDK Meetings namespace

The Amazon Chime SDK Meetings namespace uses a new service principal: meetings.chime.amazonaws.com. If you have SQS, SNS, or other IAM access policies that grant access to the service, you need to update those polices to grant access to the new service principal.

More information regarding this change can be found [here](https://docs.aws.amazon.com/chime-sdk/latest/dg/meeting-namespace-migration.html).

Create your meeting by calling the CreateMeeting API and specifying the Echo Reduction flag as `'AVAILABLE'`.

```typescript
// You must migrate to the Amazon Chime SDK Meetings namespace.
const chime = AWS.ChimeSDKMeetings({ region: "eu-central-1" });

// Create meeting 
const meetingInfo = await chime.createMeeting({
  ...
  MeetingFeatures: {
    Audio: {
      EchoReduction: 'AVAILABLE' 
    }
  } 
}).promise();

// Add attendee 
const attendeeInfo = await chime.createAttendee({...});
const joinInfo = { 
  JoinInfo: {
    Meeting: meetingInfo,
    Attendee: attendeeInfo,
  }
}
```

### 2. Enabling Echo Reduction at the client level

Once you have created the meeting with the correct flags, you can pass in the `joinInfo` when creating the Voice Focus device. Please note the usage of the `ns_es` as the spec name for Echo Reduction. Use `default` if you would like to use Voice Focus without Echo Reduction.

```typescript
// Select the Echo Reduction model
const spec: VoiceFocusSpec = {
  name: 'ns_es',
  ...
};

// Create the Voice Focus device
const transformer = await VoiceFocusDeviceTransformer.create(spec, { logger }, joinInfo);

this.audioVideo = this.meetingSession.audioVideo;
const vfDevice = await transformer.createTransformDevice(chosenAudioInput);

// Enable Echo Reduction on this client
await vfDevice.observeMeetingAudio(this.audioVideo);
```

## Disabling Amazon Voice Focus and Echo Reduction and switching devices

In some cases you might wish to temporarily or permanently disable noise suppression and echo reduction during a call: perhaps to reduce CPU utilization or to allow background noise to be heard.

You can do so by simply selecting the inner device without Amazon Voice Focus, which will fall back to the browser’s own simple noise suppressor:

```typescript
await deviceController.startAudioInput(chosenAudioInput);
console.log('Amazon Voice Focus disabled');
```

You can re-enable Amazon Voice Focus and Echo Reduction again by reselecting the transform device:

```typescript
await deviceController.startAudioInput(vfDevice);
console.log('Amazon Voice Focus re-enabled');
```

If a user switches microphone inputs, *e.g.*, after plugging in a headset, you can reuse the setup work involved in building the transform device by choosing a new inner device:

```typescript
this.voiceFocusDevice = await transformer.createTransformDevice(chosenAudioInput);
…
// New device selected. Swap it out.
this.voiceFocusDevice = await this.voiceFocusDevice.chooseNewInnerDevice(newDevice);
await deviceController.startAudioInput(this.voiceFocusDevice);
console.log('Amazon Voice Focus switched to new device', newDevice);
```

## Destroying Amazon Voice Focus worker thread from your application

In some cases, you might want to completely stop the worker thread that runs the `VoiceFocusDeviceTransformer`. In that case, you can use the `destroyVoiceFocus` method to completely remove the Voice Focus worker thread. After destroying the `VoiceFocusDeviceTransformer`, you'd now have to create a new one. This might be useful if you intend to completely remove Voice Focus from your application at some point. If there was a `VoiceFocusTransformerDevice` associated with the destroyed transformer, that `VoiceFocusTransformerDevice` will stop working, as the transformer has been destroyed. You can also call `VoiceFocusTransformerDevice.stop()` to stop the worker thread, but that assumes that you've already created a `VoiceFocusTransformerDevice`. If you haven't created a `VoiceFocusTransformerDevice` already, you should use `VoiceFocusDeviceTransformer.destroyVoiceFocus` to destroy the Voice Focus worker thread.

```typescript
const transformer = await VoiceFocusDeviceTransformer.create(spec, { logger });

await VoiceFocusDeviceTransformer.destroyVoiceFocus(transformer);
console.log('Amazon Voice Focus stopped');
```

If you're concerned about having a worker thread running in the background even while not using Voice Focus, consider using the `preload=false` option as shown above, rather than destroying the `VoiceFocusDeviceTransformer`.

## Disabling Echo Reduction from your application

During the meeting, you can disable Echo Reduction using the following code. This will just disable the Echo Reduction part of Voice Focus, while maintaining the Noise Reduction:

```typescript
await vfDevice.unObserveMeetingAudio(this.audioVideo);
```

## Adapting to performance constraints

As mentioned previously, you can supply a `VoiceFocusSpec` object when configuring a device transformer. The following options allow you to tune Amazon Voice Focus’s behavior for uncommon circumstances.

### Usage preference

The complexity of your application (*e.g.*, the number of active video tiles, or other work being done in the page) and the behavior of your user (*e.g.*, switching tabs) can interfere with the smooth processing of audio. The default configuration, `{ usagePreference: 'interactivity' }`, biases for interactivity and is relatively conservative.

If you are confident that your users will be using your application exclusively, without multitasking or switching tabs, you can specify `{ usagePreference: 'quality' }` when configuring the device transformer. This setting makes it more likely that the noise suppressor will choose to use alternative execution modes that allow for higher quality models to be selected at the cost of making audio input more prone to glitching if the page loses focus.

### Variant selection

If you have precise control over your runtime environment, you can specify the complexity level the SDK will use by providing a `variant` parameter: one of `c100`, `c50`, `c20`, or `c10`.

`c100` is the highest quality and most expensive, and requires SIMD on most devices. `c10` is the lowest quality and has the lowest CPU footprint. We advise you to test your deployed configurations carefully before specifying an explicit variant.

### Execution preference

If you have precise control over your runtime environment, you can specify the execution approach that the SDK will use. The allowed values are `auto`, `inline,` and `worker`. Use the `executionPreference` specifier to define these.

In general, use `auto`. If you think you need control over the execution approach, contact AWS Support.

### Name

To use Amazon Voice Focus, the name section of the specification should be set to `'default'` whereas to use Echo Reduction, the name section of the specification should be set to `'ns_es'`. Echo Reduction can only be enabled while creating the meeting.

### Configuring SIMD

SIMD dramatically accelerates Amazon Voice Focus and Echo Reduction, reducing CPU load and/or allowing higher quality models to be used.

Release versions of Firefox and Chrome do not enable SIMD support by default. If you have control over the browser environment of your end users, you can set Firefox’s `javascript.options.wasm_simd` preference to `true` in `about:config`, or toggle `[chrome://flags/#enable-webassembly-simd](http://chrome//flags/#enable-webassembly-simd)` in Chrome.

You can enable SIMD in an Electron application by adding `--enable-features=WebAssemblySimd` to your startup flags, then supplying `{ simd: 'force' }` as part of your specification.

Until SIMD support stabilizes, compatibility is subject to change. In particular you will need to explicitly opt in to the use of SIMD in Chrome, because detection is unreliable; as with Electron, specify `{ simd: 'force' }` when configuring the device transformer. Detection of SIMD capability is automatic in Firefox.

You can opt-in for a Chrome Origin Trial to [test SIMD on Chrome browsers](https://developers.chrome.com/origintrials/#/view_trial/-4708513410415853567).

### Disabling estimation entirely

If you specify a non-`auto` `executionPreference` and a `variant`, no estimation work will be done: the SDK will use the values you provide. If you additionally specify `simd`, the execution approach chosen is predictable and fixed, and no capability testing or estimation is required.

For example, to force the use of a high-quality model in an Electron application built with SIMD enabled:

```typescript
const spec: VoiceFocusSpec = {
  variant: 'c50',
  executionPreference: 'inline',
  simd: 'force',
};

const transformer = await VoiceFocusDeviceTransformer.create(spec, { logger });
```

or to force the use of the highest quality model, which typically requires offload to a Web Worker:

```typescript
const spec: VoiceFocusSpec = {
  variant: 'c100',
  executionPreference: 'worker',
  simd: 'force',
};

const transformer = await VoiceFocusDeviceTransformer.create(spec, { logger });
```

We recommend that you allow estimation to adapt to the runtime environment: it is difficult to predict in advance the correct execution preference and model complexity, and choosing a too-complex model or the wrong execution approach can result in audio glitches or high CPU utilization that affects the rest of the application.

## Observer notifications

You can optionally implement the `VoiceFocusTransformDeviceObserver` interface and use `addObserver` to receive callbacks when one of two things occur:

* `voiceFocusFellBackToInnerStream`: if applying noise suppression or echo reduction to an audio device failed, causing the SDK to fall back to using the inner device with the browser’s own noise suppression, this will be called. This should be uncommon, but this allows you to adapt your UI to failure.
* `voiceFocusInsufficientResources`: if the noise suppressor or the echo reducer is unable to keep up with input audio, and the execution mode is able to determine this, then `voiceFocusInsufficientResources` will be invoked approximately every 15 milliseconds. The user will not themselves hear any audio glitching: bad audio will be heard by *other participants in the meeting*. Disabling noise suppression or other application features might be necessary to avoid continued disruption of the user experience.

## Automatic gain control

Web browsers include mechanisms for automatically adjusting input volume, termed Automatic Gain Control (AGC).

AGC in mainstream browsers is fairly simplistic: it periodically adjusts your device input volume to improve the situation when your microphone is too quiet or too loud. As a developer you can control this with `[MediaTrackConstraints.autoGainControl](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/autoGainControl)`. This is enabled by default when your application asks for a microphone input.

Amazon Voice Focus and Echo Reduction the built-in AGC by default. If you need additional control of the user’s volume, you can apply a [`GainNode`](https://developer.mozilla.org/en-US/docs/Web/API/GainNode) in a custom `AudioTransformDevice` in series *after* the Amazon Voice Focus node.

If the interaction of the built-in AGC with Amazon Voice Focus or Echo Reduction produces undesirable effects, you can disable it by passing `{ agc: { useBuiltInAGC: false } }` when constructing the transform device.

## Accessing and using configurations

Configurations — instances of `VoiceFocusConfig` — are opaque blobs derived by resolving a specification against a runtime environment. They are exact descriptions of exactly how Amazon Voice Focus and Echo Reduction will operate. As such, they are extremely specific to a point in time, hardware capabilities, browser version, and SDK version. They should not be persisted, transferred between browsers, or mutated.

You can retrieve the configuration of a `VoiceFocusDeviceTransformer` with the `getConfiguration` method, and you can retrieve a configuration without instantiating a transformer by calling the `VoiceFocusDeviceTransformer.configure` static method instead of `VoiceFocusDeviceTransformer.create`. The latter accepts a configuration as a third argument to instantiate a transformer with an existing configuration.

These functions allow the work of creating a transformer to be split or reused across execution contexts. For example, you might compute a configuration from a spec each time your app launches, making subsequent initialization faster, or you might reuse a configuration in a second window by sending an existing transformer's configuration via `postMessage`.

Creating a configuration via `VoiceFocusDeviceTransformer.configure` also supports pre-resolving model URLs, which can be useful when a new browser execution context needs to be rapidly built in order to join a meeting, and saving even a single HTTP request is worthwhile.

The send side might look like this:

```javascript
const spec = {};
const options = { logger };

const config = await VoiceFocusDeviceTransformer.configure(spec, options);
const newWindow = window.open('/other');
newWindow.postMessage({
  message: 'vf',
  config,
});
```

and the receiver like this:

```javascript
const spec = {};
const options = { logger };
let transformerPromise;

window.onmessage = (m) => {
  const { message, config } = m;
  if (message === 'vf') {
    transformerPromise = VoiceFocusDeviceTransformer.create(spec, options, config);
  }
};
```
