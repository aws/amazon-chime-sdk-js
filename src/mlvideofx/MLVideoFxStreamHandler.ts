import Logger from '../logger/Logger';
import MLVideoFxDriver from './MLVideoFxDriver';

const DEFAULT_FRAMERATE = 15;
const MIN_FRAME_DELAY = 0;
const MS_PER_SECOND = 1000;

/** @internal */
interface HTMLCanvasElementWithCaptureStream extends HTMLCanvasElement {
  // Not in IE, but that's OK.
  captureStream(frameRate?: number): MediaStream;
}

/**
 * [[MLVideoFxStreamHandler]] Will be used to handle the stream associated with the
 * device in the MLVideoFxTransformDevice. It is responsible for triggering the
 * action in the MLVideoFxDriver and processing the transformed frames onto
 * the output canvas
 */
export default class MLVideoFxStreamHandler {
  private fr: number = DEFAULT_FRAMERATE;
  private lastTimeOut: ReturnType<typeof setTimeout> | undefined;

  // Inputs
  private videoInput: HTMLVideoElement = document.createElement('video') as HTMLVideoElement;
  private canvasInput: HTMLCanvasElement = document.createElement('canvas');
  private inputCtx = this.canvasInput.getContext('2d');
  private inputVideoStream: MediaStream | null = null;

  // Outputs
  private canvasOutput: HTMLCanvasElementWithCaptureStream = document.createElement(
    'canvas'
  ) as HTMLCanvasElementWithCaptureStream;
  private outputCtx = this.canvasOutput.getContext('2d');
  outputMediaStream: MediaStream = new MediaStream();

  // Constructor just sets a logger for the object
  constructor(private logger: Logger, private driver: MLVideoFxDriver) {}

  /**
   * If existing, return the output media stream. If not existing, create and return
   * a media stream off of our output canvas
   * @returns MediaStream
   */
  getActiveOutputMediaStream(): MediaStream {
    if (this.isOutputMediaStreamActive()) {
      return this.outputMediaStream;
    }
    this.outputMediaStream = this.canvasOutput.captureStream(this.fr);
    this.cloneInputAudioTracksToOutput();
    return this.outputMediaStream;
  }

  /**
   * Configure an inputMediaStream so that it is placed onto a HTML video element and
   * configure our transformation function (apply) to process as our stream continues
   * loading new data
   */
  async setInputMediaStream(inputMediaStream: MediaStream | null): Promise<void> {
    if (!inputMediaStream) {
      this.stop();
      return;
    }

    if (inputMediaStream.getVideoTracks().length === 0) {
      this.logger.error('No video tracks in input media stream, ignoring');
      return;
    }

    this.inputVideoStream = inputMediaStream;
    await this.startVideoOnMediaStream(this.inputVideoStream.getVideoTracks()[0]);
    this.cloneInputAudioTracksToOutput();
  }

  /**
   * Gives back the media stream
   * @returns The output media stream contained in the stream handler
   */
  async getInputMediaStream(): Promise<MediaStream | null> {
    return this.inputVideoStream;
  }

  /**
   * Start a media stream onto our HTML video/canvas element
   * @param inputMediaStream Media Stream to start on our video
   */
  // @ts-ignore
  private async startVideoOnMediaStream(videoTrack: MediaStreamTrack): Promise<void> {
    const settings = videoTrack.getSettings();
    this.canvasOutput.width = settings.width;
    this.canvasOutput.height = settings.height;
    this.videoInput.addEventListener('loadedmetadata', this.process); // this will be the trigger function
    this.videoInput.srcObject = this.inputVideoStream;
    // avoid iOS safari full screen video -- not sure what this does
    this.videoInput.setAttribute('playsinline', 'true');

    this.videoInput.load();
    try {
      await this.videoInput.play();
    } catch {
      this.logger.warn('Video element `play()` overriden by another `load()`');
    }
    return;
  }

  /**
   * Transform a singular frame from the input stream to apply desired
   * video effects. Then place the output image data onto our output canvas
   * configured with an output stream
   */
  process = async (_event: Event): Promise<void> => {
    if (!this.inputVideoStream) {
      return;
    }
    const processVideoStart = performance.now();

    // Draw the videoInput onto our input canvas
    if (this.videoInput.videoWidth) {
      this.canvasInput.width = this.videoInput.videoWidth;
      this.canvasInput.height = this.videoInput.videoHeight;
      // Draw video onto top left (0,0) coordinate of our canvas
      this.inputCtx.drawImage(this.videoInput, 0, 0);
    }

    // Collect out input frame data starting from the top left corner (0,0)
    // of the canvas
    const inputImageData = this.inputCtx.getImageData(
      0,
      0,
      this.canvasInput.width,
      this.canvasInput.height
    );

    // Transform input data
    const transformedImageData = await this.driver.apply(inputImageData);

    // Confirm that the output canvas is still matching video frame size
    this.canvasOutput.width = this.videoInput.videoWidth;
    this.canvasOutput.height = this.videoInput.videoHeight;

    // Place transformed data onto top left corner (0,0) of output canvas
    this.outputCtx.putImageData(transformedImageData, 0, 0);

    // Equation explanation:
    // processVideoLatency is the amout of time it took to calculate the final transformed frame.
    // (MS_PER_SECOND / this.fr) is the total amount of ms that must pass between each
    // frame processing so that we maintain the desired framerate
    // Therefore, after calculating the frame transformation, we must wait an additional
    // (MS_PER_SECOND / this.fr) - processVideoLatency to properly maintain the desired fps
    const processVideoLatency = performance.now() - processVideoStart;
    const nextFrameDelay = Math.max(MIN_FRAME_DELAY, MS_PER_SECOND / this.fr - processVideoLatency);

    // TODO(hunnorth): use requestAnimationFrame which is more organic and allows browser to
    // conserve resources by its choices.
    /* @ts-ignore */
    this.lastTimeout = setTimeout(this.process, nextFrameDelay);
  };

  /**
   * Stop invoking our transformation function and stop the video tracks associated
   * with our output media stream
   */
  stop(): void {
    this.videoInput.removeEventListener('loadedmetadata', this.process);
    this.videoInput.srcObject = null;

    this.destroyInputMediaAndBuffers();

    // Stop all the output tracks, but don't discard the media stream,
    // because it's how other parts of the codebase recognize when
    // a selected stream is part of this transform device.
    this.outputMediaStream?.getTracks().map(track => track.stop());

    // This will prevent the process loop from continuing to call itself
    if (this.lastTimeOut) {
      clearTimeout(this.lastTimeOut);
      this.lastTimeOut = undefined;
    }
  }

  /**
   * Stop the video tracks associated with our input media stream and remove
   * reference to input source
   */
  private destroyInputMediaAndBuffers(): void {
    this.inputVideoStream?.getTracks().map(track => track.stop());
    this.inputVideoStream = null;
  }

  /**
   * Copy over the audio tracks from our input stream into our output stream
   */
  private cloneInputAudioTracksToOutput(): void {
    if (!this.isOutputMediaStreamActive() || this.inputVideoStream === null) {
      this.logger.info('Not cloning input audio tracks to output, do not have media streams ready');
      return; // Just wait for `getActiveOutputMediaStream`
    }

    // Remove current audio tracks from output
    for (const audioTrack of this.outputMediaStream.getAudioTracks()) {
      this.logger.info(`Removing audio track ${audioTrack.id} from output stream`);
      this.outputMediaStream.removeTrack(audioTrack);
    }

    // Add new audio track to output
    for (const audioTrack of this.inputVideoStream.getAudioTracks()) {
      this.logger.info(`Adding audio track ${audioTrack.id} to output stream`);
      this.outputMediaStream.addTrack(audioTrack);
    }
  }

  /**
   * Return boolean representing status of our output media stream being active
   */
  private isOutputMediaStreamActive(): boolean {
    return this.outputMediaStream && this.outputMediaStream.active;
  }

  /**
   * Get the framerate
   */
  get framerate(): number {
    return this.fr;
  }

  /**
   * Set the framerate to a new value (must be greater than zero)
   */
  set framerate(value: number) {
    this.fr = value < 0 ? DEFAULT_FRAMERATE : value;
  }
}
