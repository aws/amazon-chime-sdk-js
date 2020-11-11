// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[ReconnectController]] describes the status about the meeting session connection and makes decisions
 * based on the controller implementation.
 */
export default interface ReconnectController {
  /**
   * Resets the ReconnectController to its default state.
   */
  reset(): void;

  /**
   * Indicates that a connection attempt has started so that the reconnect deadline
   * can be set.
   * @param{boolean} isFirstConnection whether this is the first attempt to connect for this session
   */
  startedConnectionAttempt(isFirstConnection: boolean): void;

  /**
   * Indicates whether a connection attempt is already in progress.
   */
  hasStartedConnectionAttempt(): boolean;

  /**
   * Indicates whether the current connection attempt was the first.
   */
  isFirstConnection(): boolean;

  /**
   * Disables reconnect until the controller is next reset.
   */
  disableReconnect(): void;

  /**
   * Cancels any pending retry and disables reconnect. The cancel function supplied to the
   * retryWithBackoff will be called if there was a pending retry.
   */
  cancel(): void;

  /**
   * Switches the reconnect controller into a mode where it will only restart the
   * peer connection instead of restarting the session starting with the
   * signaling connection.
   */
  enableRestartPeerConnection(): void;

  /**
   * Returns whether only the peer connection should be restarted at this time.
   * @returns{boolean} Whether only the peer connection should be restarted
   */
  shouldOnlyRestartPeerConnection(): boolean;

  /**
   * Decides whether to retry the retryFunc after some amount of backoff depending
   * on the controller.
   * @returns{boolean} Whether the retry will be attempted
   */
  retryWithBackoff(retryFunc: () => void, cancelFunc: () => void): boolean;

  /**
   * Clones the controller.
   */
  clone(): ReconnectController;

  /**
   * Sets the last active external timestamp in milliseconds.
   */
  setLastActiveTimestampMs(timestampMs: number): void;
}
