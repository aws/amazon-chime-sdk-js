# Video Input Processing

## Introduction

Amazon Chime SDK for JavaScript contains easy-to-use APIs for adding frame-by-frame processing to an outgoing video stream.

Amazon Chime SDK for JavaScript defines a video processing stage as an implementation of the `VideoFrameProcessor` interface, which takes an array of `VideoFrameBuffer`s, applies builder-defined processing, and outputs an array of `VideoFrameBuffer`s. The outputs of each processor can be linked to the inputs of the next processor, with the last processor in the chain required to implement `asCanvasImageSource` to return `CanvasImageSource` so that the resulting frames can be rendered onto a [HTMLCanvasElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement) and transformed into a [MediaStream](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream).

To integrate video processing into meeting session, `VideoTransformDevice` should be used, which internally uses a `VideoFrameProcessorPipeline` to complete the aforementioned linking of stages and final canvas rendering.

A typical workflow would be:

1. Create an array of custom `VideoFrameProcessor`s.
2. Create a `VideoTransformDevice` from a `Device` and the array of `VideoFrameProcessor`s.
3. Call `meetingSession.audioVideo.startVideoInput` with the `VideoTransformDevice`.

### Browser compatibility

The APIs for video processing in Amazon Chime SDK for JavaScript work in Firefox, Chrome, Chromium-based browsers (including Electron) on desktop, and Android operating systems. A full compatibility table is below. Currently, the APIs for video processing do not support Safari/Chrome/Firefox on iOS devices due to [Webkit Bug 181663](https://bugs.webkit.org/show_bug.cgi?id=181663).

|Browser                                                                |Minimum supported version  
|---                                                                    |---
|Firefox                                                                |76
|Chromium-based browsers and environments, including Edge and Electron  |78
|Android Chrome                                                         |78
|Safari on MacOS                                                        |13.0
|iOS Safari                                                             |Not supported
|iOS Chrome                                                             |Not supported
|iOS Firefox                                                            |Not supported

## Video Processing APIs

### VideoTransformDevice

`VideoTransformDevice` allows `VideoFrameProcessor`s to be applied to to a `Device` and provide a new object which can be passed into `meetingSession.audioVideo.startVideoInput`.

`DefaultVideoTransformDevice` is the provided implementation of `VideoTransformDevice`. It takes the aforementioned `Device` and array of `VideoFrameProcessor`s, then uses `VideoFrameProcessorPipeline` under the hood and hides its complexity.

#### Construction and Starting Video Processing

The construction of the `DefaultVideoTransformDevice` will not start the camera or start processing. The method `meetingSession.audioVideo.startVideoInput` should be called just like for normal devices. The device controller will use the inner `Device` to acquire the source `MediaStream` and start the processing pipeline at the same frame rate. "Inner device" in this context refers to the original video stream coming from the selected camera.

The parameters to `chooseVideoInputQuality` are used as constraints on the source `MediaStream`. After the video input is chosen, `meetingSession.audioVideo.startLocalVideoTile` can be called to start streaming video.

```javascript
import {
  DefaultVideoTransformDevice
} from 'amazon-chime-sdk-js';

const stages = [new VideoResizeProcessor(4/3)]; // constructs  processor

const transformDevice = new DefaultVideoTransformDevice(
  logger,
  'foo', // device id string
  stages
);

await meetingSession.audioVideo.startVideoInput(transformDevice);
meetingSession.audioVideo.startLocalVideo();

```

#### Switching the Inner Device on VideoTransformDevice

To switch the inner `Device` on `DefaultVideoTransformDevice`, call `DefaultVideoTransformDevice.chooseNewInnerDevice` with a new `Device`.
`DefaultVideoTransformDevice.chooseNewInnerDevice` returns a new `DefaultVideoTransformDevice` but preserves the state of `VideoFrameProcessor`s. Then call `meetingSession.audioVideo.startVideoInput` with the new transform device.

```javascript
const newInnerDevice = 'bar';
if (transformDevice.getInnerDevice() !== innerDevice) {
  transformDevice = transformDevice.chooseNewInnerDevice(innerDevice);
}
```

#### Stopping VideoTransformDevice

To stop video processing for the chosen `DefaultVideoTransformDevice`, call `meetingSession.audioVideo.startVideoInput` with a different `Device` (possibly another `DefaultVideoTransformDevice`) or call `meetingSession.audioVideo.stopVideoInput` to stop using previous `DefaultVideoTransformDevice`.

After stopping the video processing, the inner `Device` will be released by device controller unless the inner `Device` is a `MediaStream` provided by users where it is their responsibility of users to handle the lifecycle.

After `DefaultVideoTransformDevice` is no longer used by device controller, call `DefaultVideoTransformDevice.stop` to release the `VideoProcessor`s and underlying pipeline. After `stop` is called, users must discard the `DefaultVideoTransformDevice` as it will not be reusable.`DefaultVideoTransformDevice.stop` is necessary to release the internal resources.

```javascript
await meetingSession.audioVideo.stopVideoInput();
transformDevice.stop();
```

Applications will need to stop and replace `DefaultVideoTransformDevice` when they want to change video processors or change the video input quality.

#### Receiving lifecycle notifications with an observer

To receive notifications of lifecycle events, a `DefaultVideoTransformDeviceObserver` can be added to the `DefaultVideoTransformDevice` and handlers added for the following:

| Observer                   | Description  |
|----------------------------|--------------|
| `processingDidStart`       | Called when video processing starts. |
| `processingDidFailToStart` | Called when video processing could not start due to runtime errors. In this case, developers are expected to call `startVideoInput` again with a valid `VideoInputDevice` to continue video sending. |
| `processingDidStop`        | Called when video processing is stopped **expectedly**. |
| `processingDidFailToStart` | Called when the execution of processors slows the frame rate down by at least half.|

### VideoFrameBuffer

`VideoFrameBuffer` is an abstract interface that can be implemented to represent images or video sources. It is required to implement `asCanvasImageSource` to return `CanvasImageSource`; optionally, developers can implement `asCanvasElement` or `asTransferable` to facilitate processing algorithm to work with [HTMLCanvasElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement)s or [Worker](https://developer.mozilla.org/en-US/docs/Web/API/Worker/Worker)s respectively.

### VideoFrameProcessor

`VideoFrameProcessor` represents a processing stage. Internally,  processors are executed in a completely serial manner. Each pass will finish before the next pass begins. The input `VideoFrameBuffer`s are the video sources. Changing the property of buffers such as resizing will likely modify properties of the video sources and should be performed with care.

### Building a simple processor

The following example shows how to build a basic processor to resize the video frames.  We first define an implementation of `VideoFrameProcessor`:

```javascript
class VideoResizeProcessor implements VideoFrameProcessor { 
  constructor(private displayAspectRatio) {}

  async process(buffers: VideoFrameBuffer[]): VideoFrameBuffer[];
  async destroy(): Promise<void>;
}
```

To keep the properties of the original video, the processor has to copy the frame onto its own staging buffer in `process`:

```typescript
class VideoResizeProcessor implements VideoFrameProcessor { 
  private targetCanvas: HTMLCanvasElement = document.createElement('canvas') as HTMLCanvasElement;
  private targetCanvasCtx: CanvasRenderingContext2D = this.targetCanvas.getContext('2d') as CanvasRenderingContext2D;
  private canvasVideoFrameBuffer = new CanvasVideoFrameBuffer(this.targetCanvas);

  private renderWidth: number = 0;
  private renderHeight: number = 0;
  private sourceWidth: number = 0;
  private sourceHeight: number = 0;
    
  async process(buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]>;
}
```

During processing, the incoming video is painted onto the internal canvas like in the following abbreviated:

```typescript
async process(buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
  const canvas = buffers[0].asCanvasElement();
  const frameWidth = canvas.width;
  const frameHeight = canvas.height;

  // error handling to skip resizing
  if (frameWidth === 0 || frameHeight === 0) {
    return buffers;
  }

  // re-calculate the cropped width and height
  .....

  // copy the frame to the intermediate canvas
  this.targetCanvasCtx.drawImage(canvas, this.dx, 0, this.renderWidth, this.renderHeight,
    0, 0, this.renderWidth, this.renderHeight);

  // replace the video frame with the resized one for subsequent processor
  buffers[0] = this.canvasVideoFrameBuffer;
  return buffers;
}
```

### Building an overlay processor

An overlay processor can be a customized processor for loading an external image. Note that this example accounts for the usage of [Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS):

```typescript
class VideoLoadImageProcessor implements VideoFrameProcessor { 
  // Create a HTMLCanvasElement
  private targetCanvas: HTMLCanvasElement = document.createElement('canvas') as HTMLCanvasElement;
  // Create a HTMLImageElement
  private image = document.createElement("img") as HTMLImageElement;

  // Load the image from source
  loadImage("https://someurl.any/page/bg.jpg", image);

  private targetCanvasCtx: CanvasRenderingContext2D = this.targetCanvas.getContext('2d') as CanvasRenderingContext2D;

  // Render the image on the canvas
  this.targetCanvasCtx.drawImage(image, image.width, image.height);

  private canvasVideoFrameBuffer = new CanvasVideoFrameBuffer(this.targetCanvas);

  // Function to load an image from an external source (absolute URL) and configure CORS to make sure the image is successfully loaded
  async function loadImage(url: string, elem: HTMLImageElement): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      elem.onload = (): void => resolve(elem);
      elem.onerror = reject;
      elem.src = url;
      // to configure CORS access for the fetch of the new image if it is not hosted on the same server
      elem.crossOrigin = "anonymous";
    });
  }

  async process(buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
    const canvas = buffers[0].asCanvasElement();
    // copy the frame to the intermediate canvas
    this.targetCanvasCtx.drawImage(canvas, 0, 0));

    // replace the video frame with the external image one for subsequent processor
    buffers[0] = this.canvasVideoFrameBuffer;
    return buffers;
  }
}
```

## Additional Video Processing Use-Cases

### Custom processor usage during meeting preview

Local video post processing can be previewed before transmitting to remote clients just for a normal device.

```javascript
import {
  DefaultVideoTransformDevice
} from 'amazon-chime-sdk-js';

const stages = [new VideoResizeProcessor(4/3)]; // constructs  processor
const videoElement = document.getElementById('video-preview');
const transformDevice = new DefaultVideoTransformDevice(
  logger,
  'foobar', // device id string
  stages
);

await meetingSession.audioVideo.startVideoInput(transformDevice);
meetingSession.audioVideo.startVideoPreviewForVideoInput(videoElement);
```

### Custom video processor usage for content share

The API `ContentShareControllerFacade.startContentShare` does not currently support passing in a `VideoTransformDevice` or similar. But the `DefaultVideoTransformDevice` makes it straight forward to apply transforms on a given `MediaStream`, and output a new `MediaStream`.

Note that for screen share usage we use [MediaDevices.getDisplayMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia) directly rather then the helper function `ContentShareControllerFacade.startContentShareFromScreenCapture`.

```javascript
import {
  DefaultVideoTransformDevice
} from 'amazon-chime-sdk-js';

mediaStream = navigator.mediaDevices.getDisplayMedia({
  audio: true,
  video: true
});

const stages = [new CircularCut()]; // constructs some custom processor
const transformDevice = new DefaultVideoTransformDevice(
  logger,
  undefined, // Not needed when using transform directly
  stages
);

await meetingSession.audioVideo.startContentShare(await transformDevice.transformStream(mediaStream));

// On completion
transformDevice.stop();
```

The `MediaStream` can also be from a file input or other source.
