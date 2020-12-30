// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import BrowserBehavior from '../browserbehavior/BrowserBehavior';
import DefaultBrowserBehavior from '../browserbehavior/DefaultBrowserBehavior';
import Device from '../devicecontroller/Device';
import VideoTransformDevice from '../devicecontroller/VideoTransformDevice';
import Logger from '../logger/Logger';
import DefaultVideoFrameProcessorPipeline from './DefaultVideoFrameProcessorPipeline';
import DefaultVideoTransformDeviceObserver from './DefaultVideoTransformDeviceObserver';
import VideoFrameProcessor from './VideoFrameProcessor';
import VideoFrameProcessorPipeline from './VideoFrameProcessorPipeline';
import VideoFrameProcessorPipelineObserver from './VideoFrameProcessorPipelineObserver';

/**
 * [[DefaultVideoTransformDevice]] is an augmented [[VideoInputDevice]].
 * It transform the input {@link Device} with an array of {@link VideoFrameProcessor} to produce a `MediaStream`.
 */
export default class DefaultVideoTransformDevice
  implements VideoTransformDevice, VideoFrameProcessorPipelineObserver {
  private pipe: VideoFrameProcessorPipeline;
  private inputMediaStream: MediaStream;
  private observers: Set<DefaultVideoTransformDeviceObserver> = new Set<
    DefaultVideoTransformDeviceObserver
  >();

  constructor(
    private logger: Logger,
    private device: Device,
    private processors: VideoFrameProcessor[],
    private browserBehavior: BrowserBehavior = new DefaultBrowserBehavior()
  ) {
    this.pipe = new DefaultVideoFrameProcessorPipeline(this.logger, this.processors);
    this.pipe.addObserver(this);
  }

  /**
   * getter for `outputMediaStream`.
   * `outputMediaStream` is returned by internal {@link VideoFrameProcessorPipeline}.
   * It is possible, but unlikely, that this accessor will throw.
   */
  get outputMediaStream(): MediaStream {
    return this.pipe.outputMediaStream;
  }

  /**
   * `chooseNewInnerDevice` preserves the inner pipeline and processing state and switches
   * the inner device. Since the pipeline and processors are shared with the new transform device
   * only one transform device can be used.
   */
  chooseNewInnerDevice(newDevice: Device): DefaultVideoTransformDevice {
    const newTransformDevice = new DefaultVideoTransformDevice(
      this.logger,
      newDevice,
      this.processors,
      this.browserBehavior
    );
    newTransformDevice.pipe = this.pipe;
    return newTransformDevice;
  }

  /**
   * Return the inner device as provided during construction.
   */
  getInnerDevice(): Device {
    return this.device;
  }

  async intrinsicDevice(): Promise<Device> {
    const trackConstraints: MediaTrackConstraints = {};

    // Empty string and null.
    if (!this.device) {
      return trackConstraints;
    }

    // Device ID.
    if (typeof this.device === 'string') {
      if (this.browserBehavior.requiresNoExactMediaStreamConstraints()) {
        trackConstraints.deviceId = this.device;
      } else {
        trackConstraints.deviceId = { exact: this.device };
      }
      return trackConstraints;
    }

    if ((this.device as MediaStream).id) {
      // Nothing we can do.
      return this.device;
    }

    // It's constraints.
    return {
      ...this.device,
      ...trackConstraints,
    };
  }

  /**
   * Create {@link VideoFrameProcessorPipeline} if there is not a existing one and start video processors.
   * Returns output `MediaStream` produced by {@link VideoFrameProcessorPipeline}.
   */
  async transformStream(mediaStream?: MediaStream): Promise<MediaStream> {
    await this.pipe.setInputMediaStream(mediaStream);
    this.inputMediaStream = mediaStream;
    return this.pipe.getActiveOutputMediaStream();
  }

  /**
   * onOutputStreamDisconnect is called when device controller wants to detach
   * the transform device. The default behavior is to stop the output
   * media stream and release the input the media stream. If the input media stream
   * is the provided device, it will not be released.
   */
  onOutputStreamDisconnect(): void {
    this.logger.info('DefaultVideoTransformDevice: detach stopping input media stream');

    const deviceIsMediaStream = this.device && (this.device as MediaStream).id;

    // Stop processing but keep the pipe and processors
    this.pipe.stop();

    // Turn off the camera, unless device is a MediaStream
    if (!deviceIsMediaStream) {
      if (this.inputMediaStream) {
        for (const track of this.inputMediaStream.getVideoTracks()) {
          track.stop();
        }
      }
    }
  }

  /**
   * Dispose of the inner workings of the transform device, including pipeline and processors.
   * `stop` can only be called when the transform device is not used by device controller anymore.
   * After `stop` is called, all transform devices which share the pipeline must be discarded.
   */
  async stop(): Promise<void> {
    if (this.inputMediaStream) {
      for (const track of this.inputMediaStream.getVideoTracks()) {
        track.stop();
      }
    }

    this.pipe.destroy();
    this.inputMediaStream = null;
  }

  /**
   * Add an observer to receive notifications about lifecycle events.
   * See {@link DefaultVideoTransformDeviceObserver} for details.
   * If the observer has already been added, this method call has no effect.
   */
  addObserver(observer: DefaultVideoTransformDeviceObserver): void {
    this.observers.add(observer);
  }

  /**
   * Remove an existing observer. If the observer has not been previously. this method call has no effect.
   */
  removeObserver(observer: DefaultVideoTransformDeviceObserver): void {
    this.observers.add(observer);
  }

  processingDidStart(): void {
    this.logger.info('video transform device processing started');
    this.forEachObserver(observer => {
      if (observer.processingDidStart) {
        observer.processingDidStart();
      }
    });
  }

  processingLatencyTooHigh(latencyMs: number): void {
    this.forEachObserver(observer => {
      if (observer.processingLatencyTooHigh) {
        observer.processingLatencyTooHigh(latencyMs);
      }
    });
  }

  processingDidFailToStart(): void {
    this.logger.info('video transform device processing failed to start');
    this.forEachObserver(observer => {
      if (observer.processingDidFailToStart) {
        observer.processingDidFailToStart();
      }
    });
  }

  processingDidStop(): void {
    this.logger.info('video transform device processing stopped');
    this.forEachObserver(observer => {
      if (observer.processingDidStop) {
        observer.processingDidStop();
      }
    });
  }

  private forEachObserver(
    observerFunc: (observer: VideoFrameProcessorPipelineObserver) => void
  ): void {
    for (const observer of this.observers) {
      setTimeout(() => {
        observerFunc(observer);
      }, 0);
    }
  }
}
