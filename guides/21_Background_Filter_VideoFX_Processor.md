# Integrating background filters into a client application<a id="background-filters"></a>

This section explains how to programmatically filter video backgrounds by using background blur 2\.0 and background replacement 2\.0\. To add a background filter to a video stream, you need to create a `VideoFxProcessor` that contains a `VideoFxConfig` object\. You then insert that processor into a `VideoTransformDevice`\.

The background filter processor uses a TensorFlow Lite machine learning model, JavaScript Web Workers, and WebAssembly to apply a filter to the background of each frame in the video stream\. These assets are downloaded at runtime when you create a `VideoFxProcessor`\.

The new background blur and replacement filters are integrated into the [browser demo application on GitHub](https://github.com/aws/amazon-chime-sdk-js/tree/main/demos/browser)\. To try it out, launch the demo with `npm run start`, join the meeting, then click the camera to enable video\. From the video filter drop down, choose one of the **Background Blur 2\.0** or **Background Replacement 2\.0** options\.

**Topics**
- [About using background filters](#about-using-background-filters)
  - [Using the cross-origin opener policy](#cross-origin-policy)
  - [SIMD support](#simd-support)
  - [WebGL2 support](#webgl2-support)
  - [Content delivery and bandwidth](#delivery-caching-bandwidth)
  - [Browser compatibility](#filters-browser-compat)
- [Using a content security policy](#content-security)
- [Adding background filters to your application](#add-filters)
  - [Checking for support before offering a filter](#support-check)
  - [Creating a VideoFxConfig object](#create-videofxconfig)
  - [Creating a VideoFxProcessor object](#create-videofxprocessor)
  - [Creating the VideoTransformDevice object](#create-video-transform)
  - [Tuning resource utilization](#tuning)
  - [Starting video input](#start-video-input)
  - [Stopping video input](#stop-video-input)
- [Example background filter](#example-bg-filter)

# About using background filters<a id="about-using-background-filters"></a>

## Using the cross\-origin opener policy<a id="cross-origin-policy"></a>

To limit memory usage, the module prefers to use a `SharedArrayBuffer` for processing\. However, this requires that you carefully configure web security\. You must set both of these headers when serving your application HTML:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

The server must set these because they have no meta\-tag equivalents\. If you don't set these headers, the background filters may use slightly more RAM\.

Background filters can be CPU\-intensive and GPU\-intensive\. Some mobile devices and lower\-specification laptop or desktop computers may not have the power to run the filters along with multiple video streams\.

## SIMD support<a id="simd-support"></a>

Background filters are more efficient in environments that support Single Instruction, Multiple Data (SIMD). The filters use less CPU for a given complexity level when you enable SIMD\. Low\-powered devices running browsers without SIMD support may not run background filters\.

## WebGL2 support<a id="webgl2-support"></a>

The `VideoFxProcessor` object requires browsers that support WebGL2 in order to access the GPU on the client device\.

## Content delivery and bandwidth<a id="delivery-caching-bandwidth"></a>

An Amazon content delivery network loads the machine\-learning\-model files for background filters at runtime\. This provides low\-latency global distribution without the need to serve a full suite of files as part of your application\. However, loading model files can add latency to parts of your application\. To help mitigate that impact, browsers cache the model files indefinitely\. That cache makes subsequent loads significantly faster\. As a best practice, check for supported browsers, then create the background filter resources when users may not notice any latency\. For example, you can download model files while users wait in a lobby, or while they use a device picker\.

Your application must connect to the following:
+ Amazon Chime SDK media services\. 
+ Amazon CloudFront via HTTPS (port 443).

All requests are to subdomains of `sdkassets.chime.aws`\. Applications that can't access the content delivery network or don't include the correct domain in their [content security policy](#content-security) will fail their support checks and be unable to use the filters\.

For more information about CloudFront’s IP address ranges, see [ Locations and IP address ranges of CloudFront edge servers](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/LocationsOfEdgeServers.html) in the *Amazon CloudFront Developer Guide*\.

## Browser compatibility<a id="filters-browser-compat"></a>

The following table lists the browsers and version that support background filters\.


| Browser | Minimum supported version | 
| --- | --- | 
| Firefox | 76\+ | 
| Chromium\-based browsers and environments, including Edge and Electron | 78\+ | 
| Android Chrome | 110\+ | 
| Safari on macOS | 16\.3\+ | 
| Safari on iOS \(iPhone, iPad\) | 16\.x | 
| Chrome on iOS | 110\.0\.0\.x\.x | 
| Firefox on iOS \(iPhone iPad\) | 111\.0\+ | 

# Using a Content Security Policy<a id="content-security"></a>
Modern web applications use Content Security Policy to protect users from certain classes of attacks. An application that utilizes the `VideoFxProcessor` will need to include the following in policy directives to allow the Amazon Chime SDK access to resources it needs at runtime:
## Required CSP Directives ##
### Script Policy ###
To function, the `VideoFxProcessor` class must load JavaScript classes at runtime from an Amazon\-owned CDN\. These classes implement post\-processing for video using WebGL2\. To grant an application access to fetching and running these classes, you must include the following directives:
```
script-src       'self' blob: https://*.sdkassets.chime.aws
script-src-elem  'self' blob: https://*.sdkassets.chime.aws
```
Please note that `script-src` and `script-src-elem` directives are both required for full support on Safari and Firefox browsers\.
### Worker Policy ###
The `VideoFxProcessor` loads JavaScript classes as a blob to run a web worker thread, which processes video using Machine Learning (ML) models\. To grant an application access to fetching and using this worker, include:
```
worker-src       'self' blob: https://*.sdkassets.chime.aws
```
### WebAssembly Policy ###
The `VideoFxProcessor` loads a WebAssembly (Wasm) module from the same Amazon-owned CDN\. In Chrome 95 and later, compiled Wasm modules cannot be passed across multiple module boundaries\. To allow fetching and instantiating these modules, please also include `'wasm-unsafe-eval'` to the `script-src` directive\. 

One can read further on the Content Security Policy’s documentation for WebAssembly [here](https://github.com/WebAssembly/content-security-policy/blob/main/proposals/CSP.md)\.  Ideally the `wasm-eval` tag would be better used, however it yet to gain official standardization. Correspondence on the directive can be found [here](https://bugs.chromium.org/p/v8/issues/detail?id=7041)\.
## Optional CSP Directives ##
### Background Image Policy ###
To use the background replacement filter with a dynamically loaded background image, `VideoFxProcessor` must be able to access the image\. Include a `connect-src` directive with the domain that hosts the image\.
## Example CSP Declaration ##
Here is an example csp declaration to permit the use of the `VideoFxProcessor`\. Please note that the definitions in the `connect-src` tag are not `VideoFxProcessor` specfic but are related to video/audio in Chime meetings.
```
<meta http-equiv="Content-Security-Policy" 
  content= "base-uri         'self';
  connect-src      'self' https://*.chime.aws wss://*.chime.aws https://*.amazonaws.com wss://*.chime.aws https://*.ingest.chime.aws;
  script-src       'self' blob: 'wasm-unsafe-eval' https://*.sdkassets.chime.aws;
  script-src-elem  'self' blob: https://*.sdkassets.chime.aws;
  worker-src       'self' blob: https://*.sdkassets.chime.aws;
">
```
## CSP Errors ##
If any any of the required directives are omitted then the VideoFxProcessor will not be able to properly instantiate and the processor will be unsupported\. Additionally, the following (or similar) errors will likely appear in the browser console:
```
Refused to connect to
'https://static.sdkassets.chime.aws/ml_media_fx/otherassets/worker.js'
because it violates the document's content security policy.
```

# Adding background filters to your application<a id="add-filters"></a>

The process of adding background filters follows these broad steps:
+ Check for supported browsers\.
+ Create a `VideoFxConfig` object with the configuration you’d like to use\.
+ Use the configuration object to create a `VideoFxProcessor` object\.
+ Include the `VideoFxProcessor` object in a `VideoTransformDevice` \.
+ Use the `VideoTransformDevice` to start the video input\.

**Note**  
To complete those steps, you must first: 
* Create a `Logger`\.
* Choose a video device of class `MediaDeviceInfo`\.
* Successfully join a `MeetingSession`\.

Steps in the following sections explain how to complete the process\.

## Checking for support before offering a filter<a id="support-check"></a>

The Amazon Chime SDK provides an asynchronous static method that checks for supported browsers and attempts to download the required assets\. However, it does not check for device performance\. As a best practice, always ensure the users' browsers and devices can support the filters before you offer the filters\.

```
import {
    VideoFxProcessor
} from 'amazon-chime-sdk-js';

if (!await VideoFxProcessor.isSupported(logger)) {     
    // logger is optional for isSupported
}
```

## Creating a VideoFxConfig object<a id="create-videofxconfig"></a>

You can define configurations for `backgroundBlur` and `backgroundReplacement` in the same object\. However, you can't set `isEnabled` to `true` for both filters at the same time\. That's an invalid configuration\.

The `VideoFxConfig` class does no validation of its own\. Validation occurs in the next step\.

The following example shows a valid `VideoFxConfig`\.

```
const videoFxConfig: VideoFxConfig = {
    backgroundBlur: {
        isEnabled: false,
        strength: 'medium'
    },
    backgroundReplacement: {
        isEnabled: false,
        backgroundImageURL: 'space.jpg',
        defaultColor: undefined,
    }
}
```

The following tables list the `VideoFxProcessor` properties that you can specify in the `VideoFxConfig` object\.

**Background blur**  
Background blur takes the following properties:


| Property | Type | Description | 
| --- | --- | --- | 
| `isEnabled` | `boolean` | When `true`, the filter blurs the background\. | 
| `strength` | `string` | Determines the extent of blurring\. Valid values: `low` \| `medium` \| `high`\. | 

**Background replacement**  
Background replacement takes the following parameters:


| Property | Type | Description | 
| --- | --- | --- | 
| `isEnabled` | `boolean` | When `true`, the filter replaces the background\. | 
| `backgroundImageURL` | `string` | The URL of the background image\. The filter resizes the image dynamically to the dimensions of the current screen\. You can use a string such as `https://...` or a data URL such as `data:image/jpeg;base64`\. | 
| `defaultColor` | `string` | A hex color string such as `000000` or `FFFFFF`, or a string such as `black` or `white`\. If you don't specify an image URL, the processor uses the `defaultColor` as the background\. If you don't specify a `defaultColor` the processor defaults to black\. | 

## Creating a VideoFxProcessor object<a id="create-videofxprocessor"></a>

When creating the VideoFxProcessor object, AWS servers download the runtime assets, or a browser cache loads the assets\. If network or CSP configurations prevent access to the assets, the `VideoFxProcessor.create` operation throws an exception\. The resulting VideoFxProcessor is configured as a no\-op processor, which won’t affect the video stream\.

```
let videoFxProcessor: VideoFxProcessor | undefined = undefined;
try {
  videoFxProcessor = await VideoFxProcessor.create(logger, videoFxConfig);
} catch (error) {
  logger.warn(error.toString());
}
```

`VideoFxProcessor.create` also attempts to load the image from `backgroundReplacement.backgroundImageURL`\. If the image fails to load, the processor throws an exception\. The processor also throws exceptions for other reasons, such as invalid configurations, unsupported browsers, or underpowered hardware\. 

**Changing a configuration at runtime**  
You can change a `VideoFxProcessor` configuration at runtime by using the `videoFxProcessor.setEffectConfig` parameter\. The following example shows how to enable background replacement and disable background blur\.

**Note**  
You can only specify one type of background replacement at a time\. Specify a value for `backgroundImageURL` or `defaultColor`, but not both\.

```
videoFxConfig.backgroundBlur.isEnabled = false;
videoFxConfig.backgroundReplacement.isEnabled = true;
try {
  await videoFxProcessor.setEffectConfig(videoFxConfig);
} catch(error) {
  logger.error(error.toString())
}
```

If `setEffectConfig` throws an exception, the previous configuration remains in effect\. `setEffectConfig` throws exceptions under conditions similar to those that cause `VideoFxProcessor.create` to throw exceptions\.

The following example shows how to change a background image while the video runs\.

```
videoFxConfig.backgroundReplacement.backgroundImageURL = "https://my-domain.com/my-other-image.jpg";
try {
  await videoFxProcessor.setEffectConfig(videoFxConfig);
} catch(error) {
  logger.error(error.toString())
}
```

## Creating the VideoTransformDevice object<a id="create-video-transform"></a>

The following example shows how to create a `VideoTransformDevice` object that contains the `VideoFxProcessor`\.

```
// assuming that logger and videoInputDevice have already been set    
const videoTransformDevice = new DefaultVideoTransformDevice(
  logger,
  videoInputDevice,
  [videoFxProcessor]
);
```

## Tuning resource utilization<a id="tuning"></a>

When creating the `VideoFxProcessor`, you can supply the optional `processingBudgetPerFrame` parameter and control the amount of CPU and GPU that the filters use\.

```
let videoFxProcessor: VideoFxProcessor | undefined = undefined;
const processingBudgetPerFrame = 50;
try {
  videoFxProcessor = await VideoFxProcessor.create(logger, videoFxConfig, processingBudgetPerFrame);
} catch (error) {
  logger.warn(error.toString());
}
```

The `VideoFxProcessor` requires time to process a frame\. The amount of time depends on the device, the browser, and what else is running in the browser or on the device\. The processor uses the concept of a *budget* to target the amount of time used to process and render each frame\.

Processing time is in milliseconds\. As an example of how to use a budget, 1 second has 1000ms\. Targeting 15 frames per second of video capture results in a total budget of 1000ms/15fps = 66ms\. You can set a budget of 50% of that, or 33ms, by supplying the value `50` in the `processingBudgetPerFrame` parameter, as shown in the example above\.

The `VideoFxProcessor` then tries to process the frames within the budget specified\. If processing runs over budget, the processor reduces visual quality to stay within budget\. The processor continues to reduce visual quality to a minimum, at which point it stops reducing\. This processing duration is measured continually, so if more resources become available, such as another app closing and freeing up CPU, the processor raises visual quality again until it hits the budget, or maximum visual quality is achieved\.

If you don't supply a value to `processingBudgetPerFrame`, the `VideoFxProcessor` defaults to `50`\.

## Starting video input<a id="start-video-input"></a>

The following example shows how to use the `VideoTransformDevice` object to start video input\. 

```
// assuming that meetingSession has already been created
await meetingSession.audioVideo.startVideoInput(videoTransformDevice);
meetingSession.audioVideo.start();
meetingSession.audioVideo.startLocalVideoTile();
```

## Stopping video input<a id="stop-video-input"></a>

The following example shows how to stop video input\. 

```
await meetingSession.audioVideo.stopVideoInput();
```

# Example background filter<a id="example-bg-filter"></a>

The following example shows how to implement the filters\.

```
import {
    VideoFxConfig,
    VideoFxTypeConversion,
    VideoTransformDevice,
    DefaultVideoTransformDevice,
    Logger,
    VideoFxProcessor,
    MeetingSession
} from 'amazon-chime-sdk-js';

let videoTransformDevice: VideoTransformDevice | undefined = undefined;
let videoFxProcessor: VideoFxProcessor | undefined = undefined;

const videoFxConfig: VideoFxConfig = {
    backgroundBlur: {
        isEnabled: false,
        strength: "medium"
    },
    backgroundReplacement: {
        isEnabled: false,
        backgroundImageURL: 'space.jpg',
        defaultColor: undefined,
    }
}

export const addEffectsToMeeting = async (videoInputDevice: MediaDeviceInfo, meetingSession: MeetingSession, logger: Logger): Promise<void> => {
    try {
        videoFxProcessor = await VideoFxProcessor.create(logger, videoFxConfig);
    } catch (error) {
        logger.error(error.toString());
        return;
    }

    videoTransformDevice = new DefaultVideoTransformDevice(
        logger,
        videoInputDevice,
        [videoFxProcessor]
    );

    await meetingSession.audioVideo.startVideoInput(videoTransformDevice);
}

export const enableReplacement = async (logger: Logger) => {
    videoFxConfig.backgroundBlur.isEnabled = false;
    videoFxConfig.backgroundReplacement.isEnabled = true;
    await updateVideoFxConfig(videoFxConfig, logger);
}

export const enableBlur = async (logger: Logger) => {
    videoFxConfig.backgroundReplacement.isEnabled = false;
    videoFxConfig.backgroundBlur.isEnabled = true;
    await updateVideoFxConfig(videoFxConfig, logger);
}

export const pauseEffects = async (logger: Logger) => {
    videoFxConfig.backgroundReplacement.isEnabled = false;
    videoFxConfig.backgroundBlur.isEnabled = false;
    await updateVideoFxConfig(videoFxConfig, logger);

}

export const setReplacementImage = async (newImageUrl: string, logger: Logger) => {
    videoFxConfig.backgroundReplacement.backgroundImageURL = newImageUrl;
    videoFxConfig.backgroundReplacement.defaultColor = undefined;
    await updateVideoFxConfig(videoFxConfig, logger);
}

export const setReplacementDefaultColor = async (newHexColor: string, logger: Logger) => {
    videoFxConfig.backgroundReplacement.defaultColor = newHexColor;
    videoFxConfig.backgroundReplacement.backgroundImageURL = undefined;
    await updateVideoFxConfig(videoFxConfig, logger);
}

export const setBlurStrength = async (newStrength: number, logger: Logger) => {
    videoFxConfig.backgroundBlur.strength = VideoFxTypeConversion.useBackgroundBlurStrengthType(newStrength);
    await updateVideoFxConfig(videoFxConfig, logger);
}

export const updateVideoFxConfig = async (config: VideoFxConfig, logger: Logger) => {
    try {
        await videoFxProcessor.setEffectConfig(videoFxConfig);
    } catch (error) {
        logger.error(error.toString())
    }
}

export const turnOffEffects = () => {
    const innerDevice = await videoTransformDevice?.intrinsicDevice();
    await videoTransformDevice?.stop();
    videoTransformDevice = undefined;
    videoFxProcessor = undefined;
    await meetingSession.audioVideo.startVideoInput(innerDevice);
}
```
