// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Destroyable, { isDestroyable } from '../destroyable/Destroyable';
import {
  COMMON_MESSAGE_TYPES,
  EncodedTransformMessage,
} from '../encodedtransformworker/EncodedTransform';
import { DisabledEncodedTransformsConfiguration } from '../encodedtransformworker/EncodedTransformWorker';
import EncodedTransformWorkerCode from '../encodedtransformworkercode/EncodedTransformWorkerCode';
import Logger from '../logger/Logger';
import EncodedTransformWorkerManager, {
  EncodedTransformWorkerManagerObserver,
} from './EncodedTransformWorkerManager';
import MediaMetricsTransformManager from './MediaMetricsEncodedTransformManager';
import RedundantAudioEncodedTransformManager from './RedundantAudioEncodedTransformManager';

/**
 * Default implementation of EncodedTransformWorkerManager.
 * Manages a dedicated Web Worker and coordinates individual transform managers.
 */
export default class DefaultEncodedTransformWorkerManager
  implements EncodedTransformWorkerManager, Destroyable {
  private worker: Worker | null = null;
  private logger: Logger;
  private workerURL: string | null = null;
  private observers: Set<EncodedTransformWorkerManagerObserver> = new Set();
  private disabled: boolean = false;
  private disabledTransforms: DisabledEncodedTransformsConfiguration = {};

  private redManager: RedundantAudioEncodedTransformManager | null = null;
  private metricsManager: MediaMetricsTransformManager | null = null;

  // @ts-ignore
  private readonly supportsRTCScriptTransform: boolean = !!window.RTCRtpScriptTransform;
  // @ts-ignore
  private readonly supportsInsertableStreams: boolean =
    // @ts-ignore
    !!RTCRtpSender.prototype.createEncodedStreams;

  constructor(logger: Logger) {
    this.logger = logger;

    this.logger.info(
      `[EncodedTransform] API support - RTCRtpScriptTransform: ${this.supportsRTCScriptTransform}, createEncodedStreams: ${this.supportsInsertableStreams}`
    );

    if (!this.supportsRTCScriptTransform && !this.supportsInsertableStreams) {
      this.disable();
    }
  }

  /**
   * Check if media transforms are enabled
   */
  isEnabled(): boolean {
    return !this.disabled;
  }

  async start(disabledTransforms?: DisabledEncodedTransformsConfiguration): Promise<void> {
    this.disabledTransforms = disabledTransforms || {};
    await this.createWorker();

    // Create transform managers based on disabled configuration
    if (!disabledTransforms?.redundantAudio) {
      this.redManager = new RedundantAudioEncodedTransformManager(this.worker!, this.logger);
      await this.redManager.start();
    }
    this.metricsManager = new MediaMetricsTransformManager(this.worker!, this.logger);
    await this.metricsManager.start();

    this.logger.info('DefaultEncodedTransformManager initialized');
  }

  redundantAudioEncodeTransformManager(): RedundantAudioEncodedTransformManager | undefined {
    return this.redManager || undefined;
  }

  metricsTransformManager(): MediaMetricsTransformManager | undefined {
    return this.metricsManager || undefined;
  }

  setupAudioSenderTransform(sender: RTCRtpSender): void {
    this.setupTransform(sender, 'send', 'audio');
  }

  setupAudioReceiverTransform(receiver: RTCRtpReceiver): void {
    this.setupTransform(receiver, 'receive', 'audio');
  }

  setupVideoSenderTransform(sender: RTCRtpSender): void {
    this.setupTransform(sender, 'send', 'video');
  }

  setupVideoReceiverTransform(receiver: RTCRtpReceiver): void {
    this.setupTransform(receiver, 'receive', 'video');
  }

  /**
   * Helper to set up transform on sender or receiver
   */
  private setupTransform(
    senderOrReceiver: RTCRtpSender | RTCRtpReceiver,
    operation: 'send' | 'receive',
    mediaType: 'audio' | 'video'
  ): void {
    if (operation === 'send' && !(senderOrReceiver instanceof RTCRtpSender)) {
      throw new Error('Operation "send" requires an RTCRtpSender');
    }
    if (operation === 'receive' && !(senderOrReceiver instanceof RTCRtpReceiver)) {
      throw new Error('Operation "receive" requires an RTCRtpReceiver');
    }

    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    const options = {
      operation,
      mediaType,
      disabledTransforms: this.disabledTransforms,
    };

    if (this.supportsRTCScriptTransform) {
      // @ts-ignore
      senderOrReceiver.transform = new RTCRtpScriptTransform(this.worker, options);
    } else if (this.supportsInsertableStreams) {
      // @ts-ignore - Legacy API
      const streams = senderOrReceiver.createEncodedStreams();

      this.worker.postMessage(
        {
          msgType: 'StartEncodedTransformWorker',
          options,
          [mediaType]: { [operation]: streams },
        },
        [streams.readable, streams.writable]
      );
    }
  }

  async destroy(): Promise<void> {
    if (this.redManager) {
      this.redManager = null;
    }
    if (this.metricsManager) {
      if (isDestroyable(this.metricsManager)) {
        await this.metricsManager.destroy();
      }
      this.metricsManager = null;
    }

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    if (this.workerURL) {
      URL.revokeObjectURL(this.workerURL);
      this.workerURL = null;
    }

    this.observers.clear();
    this.logger.info('DefaultEncodedTransformManager destroyed');
  }

  /**
   * Stop all transform managers and reset to initial state
   */
  async stop(): Promise<void> {
    await this.redManager?.stop();
    await this.metricsManager?.stop();
  }

  /**
   * Add an observer to receive transform manager events
   */
  addObserver(observer: EncodedTransformWorkerManagerObserver): void {
    this.observers.add(observer);
  }

  /**
   * Remove an observer
   */
  removeObserver(observer: EncodedTransformWorkerManagerObserver): void {
    this.observers.delete(observer);
  }

  private handleWorkerMessage(event: MessageEvent): void {
    const message = event.data as EncodedTransformMessage;

    if (message.type === COMMON_MESSAGE_TYPES.LOG) {
      this.logger.info(`[${message.transformName}] ${message.message?.text}`);
      return;
    }

    // Route message to interested transform managers based on transform field
    if (this.redManager?.transformNames().includes(message.transformName)) {
      this.redManager.handleWorkerMessage(message);
    }
    if (this.metricsManager?.transformNames().includes(message.transformName)) {
      this.metricsManager.handleWorkerMessage(message);
    }
  }

  /**
   * Handle errors from the Web Worker
   * Disables transforms and notifies observers
   */
  private handleWorkerError(error: ErrorEvent): void {
    this.logger.error(
      `Web Worker error: ${error.message} at ${error.filename}:${error.lineno}:${error.colno}`
    );
    this.disable();

    const errorObj = new Error(`Web Worker error: ${error.message}`);
    for (const observer of this.observers) {
      try {
        observer.onEncodedTransformWorkerManagerFailed(errorObj);
      } catch (e) {
        this.logger.error(`Error notifying observer: ${e}`);
      }
    }
  }

  /**
   * Create a new Web Worker instance
   */
  private async createWorker(): Promise<void> {
    try {
      this.workerURL = URL.createObjectURL(
        new Blob([EncodedTransformWorkerCode], { type: 'application/javascript' })
      );
      this.worker = new Worker(this.workerURL);
      this.worker.onmessage = this.handleWorkerMessage.bind(this);
      this.worker.onerror = this.handleWorkerError.bind(this);

      this.logger.info('Web Worker created');
    } catch (error) {
      this.logger.error(`Failed to create Web Worker: ${error}`);
      this.disable();

      if (this.workerURL) {
        URL.revokeObjectURL(this.workerURL);
        this.workerURL = null;
      }

      // Rethrow - initialization failure should be handled by caller
      throw error;
    }
  }

  /**
   * Disable media transforms
   */
  private disable(): void {
    this.disabled = true;
    this.logger.info('Media transforms disabled');

    // Just call stop async
    this.stop();
  }
}
