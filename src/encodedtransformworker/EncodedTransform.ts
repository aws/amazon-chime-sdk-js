// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Transform name constants to ensure consistency between worker and manager.
 */
export const TRANSFORM_NAMES = {
  REDUNDANT_AUDIO: 'AudioRed',
  AUDIO_SENDER: 'AudioSender',
  AUDIO_RECEIVER: 'AudioReceiver',
  VIDEO_SENDER: 'VideoSender',
  VIDEO_RECEIVER: 'VideoReceiver',
} as const;

/**
 * Common message types used by all transforms.
 */
export const COMMON_MESSAGE_TYPES = {
  LOG: 'Log',
  METRICS: 'Metrics',
} as const;

/**
 * Messages exchanged between main thread and Web Worker for transform configuration.
 */
export interface EncodedTransformMessage {
  type: string;
  transformName: string;
  message?: Record<string, string>;
}

/**
 * Abstract base class for WebRTC encoded media transforms running in a Web Worker.
 * Provides logging infrastructure and message handling for transform implementations.
 */
export default abstract class EncodedTransform {
  protected shouldLog: boolean = true;

  protected transformName(): string {
    return this.constructor.name;
  }

  /**
   * Processes an encoded frame. Implements TransformStream transformer interface.
   */
  abstract transform(
    frame: RTCEncodedAudioFrame | RTCEncodedVideoFrame,
    controller: TransformStreamDefaultController<RTCEncodedAudioFrame | RTCEncodedVideoFrame>
  ): void;

  /**
   * Handles configuration messages from the main thread. Override in subclasses.
   */
  handleMessage(_message: EncodedTransformMessage): void {
    // Default: no-op
  }

  protected log(message: string): void {
    if (!this.shouldLog) return;

    self.postMessage({
      type: COMMON_MESSAGE_TYPES.LOG,
      transformName: this.transformName(),
      message: { text: message },
    });
  }
}
