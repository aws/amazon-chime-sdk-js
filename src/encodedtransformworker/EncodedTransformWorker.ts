// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { COMMON_MESSAGE_TYPES, TRANSFORM_NAMES } from './EncodedTransform';
import {
  AudioReceiverMetricsTransform,
  AudioSenderMetricsTransform,
  VideoReceiverMetricsTransform,
  VideoSenderMetricsTransform,
} from './MediaMetricsEncodedTransform';
import RedundantAudioEncodedTransform from './RedundantAudioEncodedTransform';

/**
 * Configuration for disabled transforms passed from main thread.
 */
export interface DisabledEncodedTransformsConfiguration {
  redundantAudio?: boolean;
}

/**
 * Web Worker entry point for WebRTC encoded media transforms.
 *
 * Manages transform pipelines for audio/video sender/receiver streams using either:
 * - RTCRtpScriptTransform API (modern browsers)
 * - createEncodedStreams() API (legacy fallback)
 *
 * Pipelines:
 * - Audio Sender: encoder → metrics → RED encode → network
 * - Audio Receiver: network → RED decode → metrics → decoder
 * - Video Sender/Receiver: encoder/network → metrics → network/decoder
 */
export default class EncodedTransformWorker {
  /**
   * Initializes the worker, sets up transform instances and event handlers.
   */
  static initializeWorker(): void {
    EncodedTransformWorker.log('Initializing EncodedTransformWorker');

    // Initialize transform instances
    EncodedTransformWorker.redundantAudioEncodedTransform = new RedundantAudioEncodedTransform();
    EncodedTransformWorker.audioSenderMetricsTransform = new AudioSenderMetricsTransform();
    EncodedTransformWorker.audioReceiverMetricsTransform = new AudioReceiverMetricsTransform();
    EncodedTransformWorker.videoSenderMetricsTransform = new VideoSenderMetricsTransform();
    EncodedTransformWorker.videoReceiverMetricsTransform = new VideoReceiverMetricsTransform();

    // Check the DedicatedWorkerGlobalScope for existence of RTCRtpScriptTransformer interface. If exists, then
    // RTCRtpScriptTransform is supported by this browser.
    // @ts-ignore
    if (self.RTCRtpScriptTransformer) {
      // @ts-ignore
      self.onrtctransform = (event: RTCTransformEvent) => {
        const transformer = event.transformer;
        const options = transformer.options;
        const disabledTransforms: DisabledEncodedTransformsConfiguration =
          options.disabledTransforms || {};

        EncodedTransformWorker.log(
          `Setting up transform: operation=${options.operation}, mediaType=${options.mediaType}, disabledTransforms=${JSON.stringify(disabledTransforms)}`
        );

        if (options.mediaType === 'audio' && options.operation === 'send') {
          EncodedTransformWorker.setupAudioSenderPipeline(transformer, disabledTransforms);
        } else if (options.mediaType === 'audio' && options.operation === 'receive') {
          EncodedTransformWorker.setupAudioReceiverPipeline(transformer, disabledTransforms);
        } else if (options.mediaType === 'video' && options.operation === 'send') {
          EncodedTransformWorker.setupVideoSenderPipeline(transformer);
        } else if (options.mediaType === 'video' && options.operation === 'receive') {
          EncodedTransformWorker.setupVideoReceiverPipeline(transformer);
        }
      };
    }

    // Message handler for configuration updates and legacy createEncodedStreams() API
    self.onmessage = (event: MessageEvent) => {
      const message = event.data;
      EncodedTransformWorker.log(`Received message: ${message.msgType || message.type}`);

      // Handle legacy createEncodedStreams() API
      if (message.msgType === 'StartEncodedTransformWorker') {
        EncodedTransformWorker.log('Setting up legacy encoded streams');
        const disabledTransforms: DisabledEncodedTransformsConfiguration =
          message.options?.disabledTransforms || {};

        if (message.audio?.send) {
          EncodedTransformWorker.setupAudioSenderPipeline(
            {
              readable: message.audio.send.readable,
              writable: message.audio.send.writable,
            },
            disabledTransforms
          );
        }
        if (message.audio?.receive) {
          EncodedTransformWorker.setupAudioReceiverPipeline(
            {
              readable: message.audio.receive.readable,
              writable: message.audio.receive.writable,
            },
            disabledTransforms
          );
        }
        if (message.video?.send) {
          EncodedTransformWorker.setupVideoSenderPipeline({
            readable: message.video.send.readable,
            writable: message.video.send.writable,
          });
        }
        if (message.video?.receive) {
          EncodedTransformWorker.setupVideoReceiverPipeline({
            readable: message.video.receive.readable,
            writable: message.video.receive.writable,
          });
        }
      } else if (
        message.transformName === TRANSFORM_NAMES.REDUNDANT_AUDIO &&
        EncodedTransformWorker.redundantAudioEncodedTransform
      ) {
        EncodedTransformWorker.redundantAudioEncodedTransform.handleMessage(message);
      } else {
        EncodedTransformWorker.log(
          `Unknown message type: ${message.type}, transformName: ${message.transformName}`
        );
      }
    };
  }

  // Singleton transform instances shared across all pipelines
  private static redundantAudioEncodedTransform: RedundantAudioEncodedTransform | null = null;
  private static audioSenderMetricsTransform: AudioSenderMetricsTransform | null = null;
  private static audioReceiverMetricsTransform: AudioReceiverMetricsTransform | null = null;
  private static videoSenderMetricsTransform: VideoSenderMetricsTransform | null = null;
  private static videoReceiverMetricsTransform: VideoReceiverMetricsTransform | null = null;

  /**
   * Posts a log message to the main thread.
   * @param msg The message to log
   */
  static log(msg: string): void {
    // @ts-ignore
    self.postMessage({
      type: COMMON_MESSAGE_TYPES.LOG,
      transformName: 'EncodedTransformWorker',
      message: { text: msg },
    });
  }

  /**
   * Sets up audio sender pipeline: encoder → metrics → RED encode → network.
   * If RED is disabled: encoder → metrics → network.
   * @param transformer The RTCRtpScriptTransformer or legacy streams object
   * @param disabledTransforms Configuration for disabled transforms
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static setupAudioSenderPipeline(
    transformer: any,
    disabledTransforms: DisabledEncodedTransformsConfiguration
  ): void {
    const metricsTransform = new TransformStream({
      transform: EncodedTransformWorker.audioSenderMetricsTransform!.transform.bind(
        EncodedTransformWorker.audioSenderMetricsTransform
      ),
    });

    if (disabledTransforms.redundantAudio) {
      // Skip RED transform when disabled
      transformer.readable.pipeThrough(metricsTransform).pipeTo(transformer.writable);
    } else {
      const redEncodeTransform = new TransformStream({
        transform: EncodedTransformWorker.redundantAudioEncodedTransform!.senderTransform.bind(
          EncodedTransformWorker.redundantAudioEncodedTransform
        ),
      });

      transformer.readable
        .pipeThrough(metricsTransform)
        .pipeThrough(redEncodeTransform)
        .pipeTo(transformer.writable);
    }
  }

  /**
   * Sets up video sender pipeline: encoder → metrics → network.
   * @param transformer The RTCRtpScriptTransformer or legacy streams object
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static setupVideoSenderPipeline(transformer: any): void {
    const metricsTransform = new TransformStream({
      transform: EncodedTransformWorker.videoSenderMetricsTransform!.transform.bind(
        EncodedTransformWorker.videoSenderMetricsTransform
      ),
    });
    transformer.readable.pipeThrough(metricsTransform).pipeTo(transformer.writable);
  }

  /**
   * Sets up audio receiver pipeline: network → RED decode → metrics → decoder.
   * If RED is disabled: network → metrics → decoder.
   * @param transformer The RTCRtpScriptTransformer or legacy streams object
   * @param disabledTransforms Configuration for disabled transforms
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static setupAudioReceiverPipeline(
    transformer: any,
    disabledTransforms: DisabledEncodedTransformsConfiguration
  ): void {
    const metricsTransform = new TransformStream({
      transform: EncodedTransformWorker.audioReceiverMetricsTransform!.transform.bind(
        EncodedTransformWorker.audioReceiverMetricsTransform
      ),
    });

    if (disabledTransforms.redundantAudio) {
      // Skip RED transform when disabled
      transformer.readable.pipeThrough(metricsTransform).pipeTo(transformer.writable);
    } else {
      const redDecodeTransform = new TransformStream({
        transform: EncodedTransformWorker.redundantAudioEncodedTransform!.receivePacketLogTransform.bind(
          EncodedTransformWorker.redundantAudioEncodedTransform
        ),
      });

      transformer.readable
        .pipeThrough(redDecodeTransform)
        .pipeThrough(metricsTransform)
        .pipeTo(transformer.writable);
    }
  }

  /**
   * Sets up video receiver pipeline: network → metrics → decoder.
   * @param transformer The RTCRtpScriptTransformer or legacy streams object
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static setupVideoReceiverPipeline(transformer: any): void {
    const metricsTransform = new TransformStream({
      transform: EncodedTransformWorker.videoReceiverMetricsTransform!.transform.bind(
        EncodedTransformWorker.videoReceiverMetricsTransform
      ),
    });
    transformer.readable.pipeThrough(metricsTransform).pipeTo(transformer.writable);
  }
}
