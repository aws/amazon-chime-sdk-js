import Device from '../devicecontroller/Device';
import VideoTransformDevice from '../devicecontroller/VideoTransformDevice';
import Logger from '../logger/Logger';
import MLVideoFxDriver from './MLVideoFxDriver';
import MLVideoFxStreamHandler from './MLVideoFxStreamHandler';

/**
 * [[MLVideoFxTransformDevice]] will allow us to transform a regular device
 * into a format that will allow us to intercept it's MediaStream via a
 * [[MLVideoFxStreamHandler]] and apply frame-level effects via a
 * [[PMLVideoFxDriver]]
 */
export default class MLVideoFxTransformDevice implements VideoTransformDevice {
  private inputMediaStream: MediaStream;
  private streamHandler: MLVideoFxStreamHandler;

  constructor(private logger: Logger, private device: Device, private driver: MLVideoFxDriver) {
    // initialize the stream handler
    this.streamHandler = new MLVideoFxStreamHandler(logger, driver);
  }

  /**
   * remove access to a media stream and stop all running video tracks
   */
  async stop(): Promise<void> {
    this.inputMediaStream?.getVideoTracks().map(track => track.stop());
    this.inputMediaStream = null;
  }

  /**
   * return the associated intrinsic device of the [[MLVideoFxTransformDevice]]
   *
   */
  async intrinsicDevice(): Promise<Device> {
    return this.device;
  }

  /**
   * Replace whatever input stream we were previously using and start the configured
   * effect processes in the [[MLVideoFxStreamHandler]]
   */
  async transformStream(mediaStream?: MediaStream): Promise<MediaStream> {
    await this.streamHandler.setInputMediaStream(mediaStream);
    this.inputMediaStream = mediaStream;
    return this.streamHandler.getActiveOutputMediaStream();
  }

  /**
   * When our output stream disconnects, we must also stop observing on the input stream
   */
  onOutputStreamDisconnect(): void {
    this.logger.info('DefaultVideoTransformDevice: detach stopping input media stream');

    const deviceIsMediaStream = this.device && (this.device as MediaStream).id;

    this.streamHandler.stop();

    // Turn off the camera, unless device is a MediaStream
    if (!deviceIsMediaStream && this.inputMediaStream) {
      this.inputMediaStream.getVideoTracks().map(track => track.stop());
    }
  }

  /**
   * Return the output media stream from the [[MLVideoFxStreamHandler]]
   */
  get outputMediaStream(): MediaStream {
    return this.streamHandler.outputMediaStream;
  }

  /**
   * Swap out the inner device associated with the existing [[MLVideoFxTransformDevice]]
   * while also saving the associated assets in the videoEffectDriver
   */
  chooseNewInnerDevice(newDevice: Device): MLVideoFxTransformDevice {
    return new MLVideoFxTransformDevice(this.logger, newDevice, this.driver);
  }

  /**
   * Return the current inner device
   */
  getInnerDevice(): Device {
    return this.device;
  }
}
