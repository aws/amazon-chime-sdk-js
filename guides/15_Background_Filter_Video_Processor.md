# Integrating background filters into your Amazon Chime SDK for JavaScript application

## What is a background filter?

The background filter API allows builders to enable background filtering on a video stream. You can select from background blur filtering or replacement filter processors. To add a background filter to a video stream the builder needs to create a `VideoFrameProcessor` using `BackgroundBlurVideoFrameProcessor` or `BackgroundReplacementVideoFrameProcessor` and then insert that processor into a `VideoTransformDevice`. The video frame processor uses a TensorFlow Lite (TFLite) machine learning (ML) model along with JavaScript Web Workers and WebAssembly (WASM) to apply the filter to the background of each frame in the video stream. These assets are downloaded at runtime when the video frame processor is created and not provided in the source directly.

Background blur and replacement are integrated into the [browser demo](https://github.com/aws/amazon-chime-sdk-js/tree/master/demos/browser) application. To try it out, launch the demo with `npm run start`, join the meeting, click on the camera icon to enable video, then select the video filter drop down and select `Background Blur` or `Background Replacement`.

## Background filtering on the web

Background filtering runs in the end user’s web browser, leveraging modern web platform features including WebAssembly and SIMD. See the section “[Can I use background filtering in my application?](#can-i-use-amazon-background-filtering-in-my-application)” for browser version requirements.

Background blur is available as part of the Amazon Chime SDK for JavaScript from version 2.20 onward. 
Background replacement is available as part of the Amazon Chime SDK for JavaScript from version 2.24 onward.

## Can I use background filtering in my application?

### Browser compatibility

Background filtering in the Amazon Chime SDK for JavaScript works in Firefox, Chrome, and Chromium-based browsers (including Electron) on desktop, Android, and Safari 14.1 and later on macOS. 

There is a known issue with `VideoFrameProcessor` in Safari 15: see [github issue 1059](https://github.com/aws/amazon-chime-sdk-js/issues/1059)

Background filtering can be CPU-intensive and the web runtime affects performance. As such, not all mobile devices or lower-spec laptop or desktop computers will be sufficiently powerful, or will be able to use background filtering while also supporting multiple video streams and rich application functionality.

See the sections “[Checking for support before offering background filtering](#checking-for-support-before-offering-background-filtering)” for more details about checking for support.


### SIMD support

Background blur is more efficient in environments that support Single Instruction, Multiple Data (SIMD), and will use less CPU for a given complexity level when it is enabled. Low-powered devices running browsers without SIMD support might be unable to use background filtering.

### Content delivery, caching and bandwidth

Background blur model files are loaded from an Amazon Content Delivery Network (CDN) at runtime. This provides low-latency global distribution without the need to serve a full suite of files as part of your application.

Model files will be cached indefinitely by end users’ browsers, so that subsequent uses of background filtering on the same device will take less time to initialize.

In addition to having network connectivity to [Amazon Chime’s media services, as described in the documentation](https://docs.aws.amazon.com/chime/latest/dg/chime-components.html), the use of background filtering requires access to Amazon CloudFront via HTTPS (port 443). All requests will be to subdomains of `sdkassets.chime.aws`. End users whose network configurations prevent access to this CDN, or applications that do not include the correct domain in Content Security Policy (see below), will fail support checks and be unable to use background filtering.

CloudFront’s IP address ranges are documented in the [Amazon CloudFront Developer Guide](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/LocationsOfEdgeServers.html).

The overhead of loading model files can add latency to parts of your application. The browser cache will make subsequent loads significantly faster. Check for support and create background filtering resources at appropriate times to minimize the impact of this latency: for example, during a lobby or device picker interaction.

## Preparing your application

### Content Security Policy

Modern web applications use [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) to protect users from certain classes of attacks. You will need to include the following in your policy to allow the Amazon Chime SDK access to resources it needs at runtime:

* `script-src` and `script-src-elem`: add `https://*.sdkassets.chime.aws` to load video processing code.
* `connect-src`: add `https://*.sdkassets.chime.aws` to load model files via `fetch`.
* `worker-src`: add `blob:` to load worker JavaScript across origins.
* `child-src`: add `blob:` to load worker JavaScript across origins (only in Safari).

If you omit any of these entries, or if you use both HTTP headers and `http-equiv` `meta` tags to specify policy and inadvertently exclude any of these by intersection, then background filtering will not be able to initialize, and will either appear to be unsupported or will create a no-op video frame processor. You will see errors in your browser console like:

```
Refused to connect to
'https://static.sdkassets.chime.aws/bgblur/workers/worker.js…'
because it violates the document's Content Security Policy.
```

If you need guidance with correct CSP configuration to use background filtering, contact AWS Support.

### Cross-Origin Opener Policy

Some execution modes require careful configuration of web security, including less common headers like [`Cross-Origin-Opener-Policy`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy). To opt in to these execution modes, send

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

when serving your application HTML. These headers are optional but advised: they improve web security, as well as allowing the browser to support technologies like `SharedArrayBuffer`.

## Checking for support before offering background filtering

Some browsers support the Amazon Chime SDK but do not support background filtering. Additionally, some devices are not fast enough to keep up with real-time video while filtering the background.

The SDK provides an async static method to allow you to cheaply check for the required browser features:

```typescript
// Background Blur
import { BackgroundBlurVideoFrameProcessor } from 'amazon-chime-sdk-js';
await BackgroundBlurVideoFrameProcessor.isSupported();

// Background Replacement
import { BackgroundReplacemenetVideoFrameProcessor } from 'amazon-chime-sdk-js';
await BackgroundReplacementVideoFrameProcessor.isSupported();
```

If `isSupported` resolves to `true`, you can instantiate the blur video frame processor.

```typescript
// Background Blur
const processors = [];
if (await BackgroundBlurVideoFrameProcessor.isSupported()) {
    const blurProcessor = await BackgroundBlurVideoFrameProcessor.create();
    processors.push(blurProcessor);
}

// Background Replacement
const processors = [];
if (await BackgroundReplacementVideoFrameProcessor.isSupported()) {
    const replacementProcessor = await BackgroundReplacementVideoFrameProcessor.create();
    processors.push(replacementProcessor);
}
```

The create method will pre-load the model file and prepare background filtering for use. Failure to load necessary resources will result in `isSupported` returning `false`. In the event that the builder creates the processor and it is not supported a no-op video frame processor will be returned and background filtering will not be applied.

## Adding background filtering to your application

Background filtering integrates with the SDK by providing a new implementation of the `VideoFrameProcessor`

Once you have checked for support and created a background processor, you add the processor to the transform device.

```typescript
// Background Blur
const processors = [];
if (await BackgroundBlurVideoFrameProcessor.isSupported()) {
    const blurProcessor = await BackgroundBlurVideoFrameProcessor.create();
    processors.push(blurProcessor);
}
let transformDevice = new DefaultVideoTransformDevice(logger, device, processors);

// Background Replacement
BackgroundReplacementVideoFrameProcessor
const processors = [];
if (await BackgroundReplacementVideoFrameProcessor.isSupported()) {
    const image = await fetch('https://pathtoimage.jpeg'); 
    const imageBlob = await image.blob();
    options = { imageBlob };
    const replacementProcessor = await BackgroundReplacementVideoFrameProcessor.create(null, options); 
    processors.push(replacementProcessor);
}
let transformDevice = new DefaultVideoTransformDevice(logger, device, processors);
```

## Configuration

Both `isSupported` and `create` accept _specifications_ — `BackgroundFilterSpec` and `BackgroundBlurOptions` or `BackgroundReplacementOptions` structures — as input. The `BackgroundFilterSpec` allows you to describe the model attributes, CDN paths, and other configuration options that define how the feature should operate. The `BackgroundBlurOptions` and `BackgroundReplacementOptions` allows you to configure runtime options like observer reporting period, logging and the amount of blur strength to apply to the video.

Most developers will not need to provide a specification: the defaults are chosen to work well and adapt to runtime constraints. 

**BackgroundBlurOptions**

```typescript
interface BackgroundBlurOptions {
  logger?: Logger;
  reportingPeriodMillis?: number;
  filterCPUUtilization?: number;
  blurStrength?: number;
}
```

* logger: A logger to which log output will be written.
* reportingPeriodMillis: How often the video frame processor will report observed events. 
* blurStrength: The amount of blur that will be applied to a video stream. 
* filterCPUUtilization: The threshold CPU utilization to trigger skipping background filter updates which will reduce the amount of CPU used by background filtering. For example, If the reporting period is set to 1000 ms and 500 ms was dedicated to processing the background filter, then the CPU utilization for that reporting period is 50%. If `filterCPUUtilization` is set to 50 it will cause a `filterCPUUtilizationHigh` event to be fired from the `BackgroundBlurVideoFrameProcessorObserver`.

**BackgroundReplacementOptions**

```typescript
interface BackgroundReplacementOptions {
  logger?: Logger;
  reportingPeriodMillis?: number;
  filterCPUUtilization?: number;
  imageBlob?: Blob;
}
```

The logger, reportingPeriodMillis, and filterCPUUtilization work in the exact same way as with `BackgroundBlurOptions`. 

* imageBlob: This is a blob that contains an image that will be used in the background. If an image blob is not provided a solid color will be displayed. The Blob can be created in many different ways (e.g. https fetch, file upload, etc.). If you are using fetch to load the image blob we recommend using HTTPS for a security reasons.

### CPU Utilization mitigation 

The `BackgroundBlurOptions` and `BackgroundReplacementOptions` interfaces have a `filterCPUUtilization` field that allows you to configure the amount of CPU utilized by the background filtering processor. The JS SDK uses this field to determine when the `filterCPUUtilizationHigh` event will fire on the `BackgroundBlurVideoFrameProcessorObserver` and `BackgroundReplacementVideoFrameProcessorObserver`. The JS SDK also uses the event internally to determine if the `filterCPUUtilization` is being exceeded. To mitigate excessive CPU usage, the SDK will begin to skip background segmentation until the CPU utilization is at or below the configured percentage set in the `filterCPUUtilization` field. A lower CPU utilization will increase amount of skipped background segmenting while maintaining the desired CPU levels. A higher CPU utilization will reduce skipped background segmenting, but increase CPU usage. 

## Observer notifications

You can optionally implement the `BackgroundBlurVideoFrameProcessorObserver` and `BackgroundReplacementVideoFrameProcessorObserver` interfaces and use `addObserver` to receive callbacks when an event occurs:

* `filterFrameDurationHigh`:  This event occurs when the amount of time it takes to apply the background filtering is longer than expected. The measurement is taken from the time the process method starts to when it returns. For example, if the video is running at 15 frames per seconds and we are averaging more than 67 ms (1000 ms reporting period / 15 fps) to apply background filtering, then a very large portion of each frame's maximum processing time is taken up by processing background filtering.
* `filterCPUUtilizationHigh`: This event occurs when the CPU utilization of background filtering exceeds the `filterCPUUtilization` defined in the `BackgroundBlurOptions` and `BackgroundReplacementOptions`. This can be used as a trigger to disable background filtering if CPU utilization is too high.

```typescript
// For Background Blur
// create a reference to the blur observer
const blurObserver: BackgroundBlurVideoFrameProcessorObserver = {
  filterFrameDurationHigh: (event) => {
    console.log(`background filter duration high: framed dropped - ${event.framesDropped}, avg - ${event.avgFilterDurationMillis} ms, frame rate - ${event.framerate}, period - ${event.periodMillis} ms`);
  },
  filterCPUUtilizationHigh:(event) => {
    console.log(`background filter CPU high: CPU utilization is high ${event.cpuUtilization}`);
  }, 
}

// add the observer to the processor
processor.addObserver(blurObserver);

// remove the observer using the reference. for e.g, on meeting leave or turning the bgblur feature/filter off.
processor.removeObserver(blurObserver);
```

```typescript
// For Background Replacement
// create a reference to the replacement observer
const replacementObserver: BackgroundReplacementVideoFrameProcessorObserver = {
  filterFrameDurationHigh: (event) => {
    console.log(`background filter duration high: framed dropped - ${event.framesDropped}, avg - ${event.avgFilterDurationMillis} ms, frame rate - ${event.framerate}, period - ${event.periodMillis} ms`);
  },
  filterCPUUtilizationHigh:(event) => {
    console.log(`background filter CPU high: CPU utilization is high ${event.cpuUtilization}`);
  }, 
}

// add the observer to the processor
processor.addObserver(replacementObserver);

// remove the observer using the reference. for e.g, on meeting leave or turning the bg replacement feature/filter off.
processor.removeObserver(replacementObserver);
```

