// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { EncodedTransformMessage } from '../encodedtransformworker/EncodedTransform';
import Logger from '../logger/Logger';

/**
 * Abstract base class for managing specific transform types.
 *
 * Each TransformManager handles configuration and lifecycle for a particular transform.
 */
export default abstract class EncodedTransformManager {
  protected worker: Worker;
  protected logger: Logger;

  /**
   * Creates a new EncodedTransformManager.
   * @param worker The Web Worker instance for encoded transforms
   * @param logger Logger instance for debugging
   */
  constructor(worker: Worker, logger: Logger) {
    this.worker = worker;
    this.logger = logger;
  }

  /**
   * Get the transform name that this manager handles
   * Used to match against message.transformName from the worker
   */
  abstract transformNames(): string[];

  /**
   * Handle a message from the Web Worker
   */
  abstract handleWorkerMessage(message: EncodedTransformMessage): void;

  /**
   * Start the transform manager
   */
  abstract start(): Promise<void>;

  /**
   * Stop the transform manager and reset state
   */
  abstract stop(): Promise<void>;

  /**
   * Send a message to the Web Worker
   */
  protected postMessage(message: EncodedTransformMessage): void {
    this.worker.postMessage(message);
  }
}
