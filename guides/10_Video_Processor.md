# Video Processing APIs

## Introduction

Amazon Chime SDK for JavaScript contains easy-to-use APIs for adding frame-by-frame processing to an outgoing video stream.

Amazon Chime SDK for JavaScript defines a video processing stage as `VideoFrameProcessor`. A `VideoFrameProcessor` takes an array of `VideoFrameBuffer`s, applies builder-defined processing and outputs an array of `VideoFrameBuffer`s. Processors can be chained by their inputs and outputs. The outputs of each processor can be linked to the inputs of the next processor. The last processor in the chain must implement `asCanvasImageSource` to return `CanvasImageSource`.

Once the video is processed in `VideoFrameProcessorPipeline`, it is rendered onto a [HTMLCanvasElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement) and transformed into a [MediaStream](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream).

To integrate video processing into meeting session, `VideoTransformDevice` should be used.

A typical workflow would be:

1. Create an array of custom `VideoFrameProcessor`s.
2. Create `VideoTransformDevice` with a `Device` and an array of custom `VideoFrameProcessor`s.
3. Call `meetingSession.audioVideo.chooseVideoInputDevice` with the `VideoTransformDevice`.


### Browser compatibility

The APIs for video processing in Amazon Chime SDK for JavaScript works in Firefox, Chrome, Chromium-based browsers (including Electron) on desktop and Android operating systems. A full compatibility table is below. Currently, the APIs for video processing do not support Safari on iOS devices due to [Webkit Bug](https://bugs.webkit.org/show_bug.cgi?id=181663). 
WebRTC Unified Plan is also required. Unified Plan is by default enabled in [MeetingSessionConfiguration.enableUnifiedPlanForChromiumBasedBrowsers](https://aws.github.io/amazon-chime-sdk-js/classes/meetingsessionconfiguration.html#enableunifiedplanforchromiumbasedbrowsers). If Unified Plan is disabled in the meeting, the call `meetingSession.audioVideo.chooseVideoInputDevice` with the `VideoTransformDevice` will throws error.


|Browser                                                                |Minimum supported version  
|---                                                                    |---                        
|Firefox                                                                |76                        
|Chromium-based browsers and environments, including Edge and Electron  |78                                             
|Android Chrome                                                         |78       
|Safari on MacOS                                                        |13.0                    
|iOS Safari                                                             |Not supported             

## Video Processing APIs and Usage

### VideoTransformDevice
`VideoTransformDevice` allows `VideoFrameProcessor`s to be applied to to a `Device` and provide a new object which can be passed into `meetingSession.audioVideo.chooseVideoInputDevice`.

`DefaultVideoTransformDevice` is the provided implementation of `VideoTransformDevice`. It requires four parameters: (1) `Logger` (2) `Device` (3) `Array<VideoFrameProcessor>`. 
The `DefaultVideoTransformDevice` uses `VideoFrameProcessorPipeline` under the hood and hides its complexity.


#### Construction and Starting Video Processing

The construction of the `DefaultVideoTransformDevice` will not start the camera or start processing. The method `meetingSession.audioVideo.chooseVideoInputDevice` is needed to be called. The device controller will use the inner `Device` to acquire the source `MediaStream` and start the processing pipeline at the same frame rate.
The parameters to `chooseVideoInputQuality` are used as constraints when device controller acquires the source `MediaStream`. 
After video input is chosen, `meetingSession.audioVideo.startLocalVideoTile` can be called to start streaming video.

#### Switching the Inner Device on VideoTransformDevice

To switch the inner `Device` on `DefaultVideoTransformDevice`, call `DefaultVideoTransformDevice.chooseNewInnerDevice` with a new `Device`.
`DefaultVideoTransformDevice.chooseNewInnerDevice` returns a new `DefaultVideoTransformDevice` but preserves the state of `VideoFrameProcessor`s. Then call `meetingSession.audioVideo.chooseVideoInputDevice` with the new transform device. 

#### Stopping VideoTransformDevice

To stop video processing for the chosen `DefaultVideoTransformDevice`, call `meetingSession.audioVideo.chooseVideoInputDevice` with different `DefaultVideoTransformDevice` or `null` to stop using previous `DefaultVideoTransformDevice`.  The method `meetingSession.audioVideo.stopLocalVideoTile` can also be used to stop the streaming.

After stopping the video processing, the inner `Device` will be released by device controller unless the inner `Device` is a `MediaStream` provided by users where it is their responsibility of users to handle the lifecycle. 

After `DefaultVideoTransformDevice` is no longer used by device controller, call `DefaultVideoTransformDevice.stop` to release the `VideoProcessor`s and underlying pipeline. After `stop` is called, users must discard the `DefaultVideoTransformDevice`.`DefaultVideoTransformDevice.stop` is necessary to release the internal resources.

#### Receiving lifecycle notifications with an observer

To receive notifications of lifecycle events, `DefaultVideoTransformDeviceObserver` can be added to the `DefaultVideoTransformDevice`. 
The full list of the callbacks:

1. `processingDidStart`

`processingDidStart` will be called when video processing starts.

2. `processingDidFailToStart`

`processingDidFailToStart` will be called when video processing could not start due to runtime errors. In this case, developers are expected to call `chooseVideoInputDevice` again with a valid `VideoInputDevice` to continue video sending. 

3. `processingDidStop`

`processingDidStop` will be called when video processing is stopped **expectedly**.

4. `processingLatencyTooHigh(latencyMs: number)` 

`processingLatencyTooHigh` will be called when the execution of processors slows the frame rate down by at least half.

### VideoFrameBuffer 
`VideoFrameBuffer` is an abstract interface that can be implemented to represent images or video sources. It is required to implement `asCanvasImageSource` to return `CanvasImageSource` and optionally, developers could implement `asCanvasElement` or `asTransferable` to facilitate processing algorithm to work with [HTMLCanvasElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement) or [Worker](https://developer.mozilla.org/en-US/docs/Web/API/Worker/Worker) respectively.

### VideoFrameProcessor

`VideoFrameProcessor` represents a processing stage. Internally,  processors are executed in a completely serial manner. Each pass will finish before the next pass begins. The input `VideoFrameBuffer`s are the video sources. Changing the property of buffers such as resizing will likely modify properties of the video sources and should be performed with care.

### Build a simple processor

The following example shows how to build a basic processor to resize the video frames.

```typescript
class VideoResizeProcessor implements VideoFrameProcessor { 
  constructor(private displayAspectRatio: number) {}

  async process(buffers: VideoFrameBuffer[]): VideoFrameBuffer[];
  async destroy(): Promise<void>;
}
```

To keep the properties of the original video, the processor have to copy the frame onto its own staging buffer in `process`.

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

The incoming video is painted onto the internal canvas.

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


The whole flow:

```typescript
import {
  DefaultVideoTransformDevice
} from 'amazon-chime-sdk-js';

const stages = [new VideoResizeProcessor(4/3)]; // constructs  processor

const transformDevice = new DefaultVideoTransformDevice(
  logger,
  'foobar', // device id string
  stages
);

await meetingSession.audioVideo.chooseVideoInputDevice(transformDevice);
meetingSession.audioVideo.startLocalVideo();

```