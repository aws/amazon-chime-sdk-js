// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import MeetingSessionTiming, {
  MeetingSessionLocalAudioTiming,
  MeetingSessionLocalVideoTiming,
  MeetingSessionRemoteAudioTiming,
  MeetingSessionRemoteVideoTiming,
  MeetingSessionSignalingTiming,
  MeetingSessionTimingObserver,
} from './MeetingSessionTiming';

/**
 * MeetingSessionTimingManager tracks all lifecycle timestamps for a meeting session
 * and emits them in batches via the observer.
 *
 * A batch begins when the first event is recorded (e.g. onStart, onRemoteVideoAdded)
 * and completes when all tracked categories have reached their terminal state
 * (e.g. signaling fully connected, audio first packet received, video first frame
 * rendered). If a batch does not complete within TIMEOUT_THRESHOLD_MS (15 s),
 * it is emitted with per-category timedOut flags.
 *
 * After each emission, already-reported state is cleared so that subsequent events
 * (e.g. a mid-call remote video add) trigger a new batch containing only new data.
 *
 * Categories are only included in a batch if their corresponding on*Added method
 * was called. For example, if local video is never started, the batch will not
 * wait for local video timing. Remote video entries that were never bound to a
 * video element are silently omitted.
 */
export default class MeetingSessionTimingManager {
  private static readonly TIMEOUT_THRESHOLD_MS = 15000;

  private observers = new Set<MeetingSessionTimingObserver>();
  private logger: Logger;
  private batchTimeout: ReturnType<typeof setTimeout> | null = null;

  private signalingTiming: MeetingSessionSignalingTiming = {};
  private isResubscribe: boolean = false;
  private remoteAudioTiming: MeetingSessionRemoteAudioTiming = {};
  private localAudioTiming: MeetingSessionLocalAudioTiming = {};
  private localVideoTiming: MeetingSessionLocalVideoTiming = {};
  private localVideoHasEmitted: boolean = false;
  private expectingRemoteVideo: boolean = false;
  private remoteVideoTiming: Map<number, MeetingSessionRemoteVideoTiming> = new Map();
  private boundRemoteVideoGroupIds: Set<number> = new Set();

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Adds an observer to receive timing data notifications.
   */
  addObserver(observer: MeetingSessionTimingObserver): void {
    this.observers.add(observer);
  }

  removeObserver(observer: MeetingSessionTimingObserver): void {
    this.observers.delete(observer);
  }

  /**
   * Starts the batch timer if not already started.
   * Called by onStart() and any on*Added() method.
   */
  private startBatchIfNeeded(): void {
    if (this.batchTimeout === null) {
      this.scheduleBatchTimeout();
    }
  }

  /**
   * Records the timestamp when audioVideo.start() was called.
   */
  onStart(): void {
    if (this.signalingTiming.startMs !== undefined) {
      this.logger.debug('onStart called multiple times, ignoring');
      return;
    }
    this.signalingTiming.startMs = this.getCurrentTimestamp();
    this.startBatchIfNeeded();
    this.logger.info(`MeetingSessionTimingManager: onStart at ${this.signalingTiming.startMs}`);
  }

  /**
   * Starts a resubscribe signaling timing entry.
   * Used for mid-meeting resubscribes (e.g. new remote video joins) to capture
   * the resubscribe latency (subscribe sent → ack → set remote description).
   * Only the resubscribe-relevant signaling fields are required for completion.
   */
  onResubscribeStart(): void {
    if (this.signalingTiming.startMs !== undefined) {
      this.logger.debug('onResubscribeStart: signaling timing already active, ignoring');
      return;
    }
    this.isResubscribe = true;
    this.signalingTiming.startMs = this.getCurrentTimestamp();
    this.startBatchIfNeeded();
    this.logger.debug(
      `MeetingSessionTimingManager: resubscribe started at ${this.signalingTiming.startMs}`
    );
  }

  /**
   * Indicates that remote video is expected in the current batch.
   * The batch will not complete until at least one remote video entry
   * has been added and completed (or the batch times out).
   *
   * This method exists because the SDK's initial subscribe does not include
   * remote video — index ingestion is paused during the first subscribe,
   * so the downlink policy cannot select video streams until the connection
   * is established and a second subscribe (resubscribe) is triggered.
   */
  setExpectingRemoteVideo(): void {
    if (this.expectingRemoteVideo) {
      return;
    }
    this.expectingRemoteVideo = true;
    this.logger.debug('MeetingSessionTimingManager: expecting remote video in current batch');
  }

  /**
   * Clears the expectation that remote video will be part of the current batch.
   * Called when the downlink policy decides not to subscribe to any video,
   * so the batch is not held open waiting for remote video that will never arrive.
   */
  clearExpectingRemoteVideo(): void {
    if (!this.expectingRemoteVideo) {
      return;
    }
    this.expectingRemoteVideo = false;
    this.logger.debug('MeetingSessionTimingManager: no longer expecting remote video');
    this.maybeEmitBatch();
  }

  /**
   * Records the timestamp when join frame was sent.
   */
  onJoinSent(): void {
    if (this.signalingTiming.startMs === undefined) {
      this.logger.debug('Received join sent event after initial batch was sent, ignoring');
      return;
    }
    if (this.signalingTiming.joinSentMs !== undefined) {
      this.logger.debug('onJoinSent called multiple times, ignoring');
      return;
    }
    this.signalingTiming.joinSentMs = this.getCurrentTimestamp();
    this.maybeEmitBatch();
  }

  /**
   * Records the timestamp when join ack was received.
   */
  onJoinAckReceived(): void {
    if (this.signalingTiming.startMs === undefined) {
      this.logger.debug('Received join ack event after initial batch was sent, ignoring');
      return;
    }
    if (this.signalingTiming.joinAckReceivedMs !== undefined) {
      this.logger.debug('onJoinAckReceived called multiple times, ignoring');
      return;
    }
    this.signalingTiming.joinAckReceivedMs = this.getCurrentTimestamp();
    this.maybeEmitBatch();
  }

  /**
   * Records the timestamp when signaling WebSocket connection was established.
   */
  onTransportConnected(): void {
    if (this.signalingTiming.startMs === undefined) {
      this.logger.debug(
        'Received transport connected event after initial batch was sent, ignoring'
      );
      return;
    }
    if (this.signalingTiming.transportConnectedMs !== undefined) {
      this.logger.debug('onTransportConnected called multiple times, ignoring');
      return;
    }
    this.signalingTiming.transportConnectedMs = this.getCurrentTimestamp();
    this.maybeEmitBatch();
  }

  /**
   * Records the timestamp when SDP offer was created.
   */
  onCreateOfferCalled(): void {
    if (this.signalingTiming.startMs === undefined) {
      this.logger.debug('Received create offer event after initial batch was sent, ignoring');
      return;
    }
    if (this.signalingTiming.createOfferMs !== undefined) {
      this.logger.debug('onCreateOfferCalled called multiple times, ignoring');
      return;
    }
    this.signalingTiming.createOfferMs = this.getCurrentTimestamp();
    this.maybeEmitBatch();
  }

  /**
   * Records the timestamp when local description was set.
   */
  onSetLocalDescription(): void {
    if (this.signalingTiming.startMs === undefined) {
      this.logger.debug(
        'Received set local description event after initial batch was sent, ignoring'
      );
      return;
    }
    if (this.signalingTiming.setLocalDescriptionMs !== undefined) {
      this.logger.debug('onSetLocalDescription called multiple times, ignoring');
      return;
    }
    this.signalingTiming.setLocalDescriptionMs = this.getCurrentTimestamp();
    this.maybeEmitBatch();
  }

  /**
   * Records the timestamp when remote description was set.
   */
  onSetRemoteDescription(): void {
    if (this.signalingTiming.startMs === undefined) {
      this.logger.debug(
        'Received set remote description event after initial batch was sent, ignoring'
      );
      return;
    }
    if (this.signalingTiming.setRemoteDescriptionMs !== undefined) {
      this.logger.debug('onSetRemoteDescription called multiple times, ignoring');
      return;
    }
    this.signalingTiming.setRemoteDescriptionMs = this.getCurrentTimestamp();
    this.maybeEmitBatch();
  }

  /**
   * Records the timestamp when ICE gathering started.
   */
  onIceGatheringStarted(): void {
    if (this.signalingTiming.startMs === undefined) {
      this.logger.debug(
        'Received ICE gathering started event after initial batch was sent, ignoring'
      );
      return;
    }
    if (this.signalingTiming.iceGatheringStartMs !== undefined) {
      this.logger.debug('onIceGatheringStarted called multiple times, ignoring');
      return;
    }
    this.signalingTiming.iceGatheringStartMs = this.getCurrentTimestamp();
    this.maybeEmitBatch();
  }

  /**
   * Records the timestamp when ICE gathering completed.
   */
  onIceGatheringComplete(): void {
    if (this.signalingTiming.startMs === undefined) {
      this.logger.debug(
        'Received ICE gathering complete event after initial batch was sent, ignoring'
      );
      return;
    }
    if (this.signalingTiming.iceGatheringCompleteMs !== undefined) {
      this.logger.debug('onIceGatheringComplete called multiple times, ignoring');
      return;
    }
    this.signalingTiming.iceGatheringCompleteMs = this.getCurrentTimestamp();
    this.maybeEmitBatch();
  }

  /**
   * Records the timestamp when ICE connection was established.
   */
  onIceConnected(): void {
    if (this.signalingTiming.startMs === undefined) {
      this.logger.debug('Received ICE connected event after initial batch was sent, ignoring');
      return;
    }
    if (this.signalingTiming.iceConnectedMs !== undefined) {
      this.logger.debug('onIceConnected called multiple times, ignoring');
      return;
    }
    this.signalingTiming.iceConnectedMs = this.getCurrentTimestamp();
    this.maybeEmitBatch();
  }

  /**
   * Records the timestamp when subscribe frame was sent.
   */
  onSubscribeSent(): void {
    if (this.signalingTiming.startMs === undefined) {
      this.logger.debug('Received subscribe sent event after initial batch was sent, ignoring');
      return;
    }
    if (this.signalingTiming.subscribeSentMs !== undefined) {
      this.logger.debug('onSubscribeSent called multiple times, ignoring');
      return;
    }
    this.signalingTiming.subscribeSentMs = this.getCurrentTimestamp();
    this.maybeEmitBatch();
  }

  /**
   * Records the timestamp when subscribe ack was received.
   */
  onSubscribeAckReceived(): void {
    if (this.signalingTiming.startMs === undefined) {
      this.logger.debug('Received subscribe ack event after initial batch was sent, ignoring');
      return;
    }
    if (this.signalingTiming.subscribeAckMs !== undefined) {
      this.logger.debug('onSubscribeAckReceived called multiple times, ignoring');
      return;
    }
    this.signalingTiming.subscribeAckMs = this.getCurrentTimestamp();
    this.maybeEmitBatch();
  }

  /**
   * Records the timestamp when remote audio track was added.
   */
  onRemoteAudioAdded(): void {
    if (this.remoteAudioTiming.addedMs !== undefined) {
      this.logger.debug('onRemoteAudioAdded called multiple times, ignoring');
      return;
    }
    this.remoteAudioTiming.addedMs = this.getCurrentTimestamp();
    this.startBatchIfNeeded();
    this.maybeEmitBatch();
  }

  /**
   * Records the timestamp when first audio packet was received.
   */
  onRemoteAudioFirstPacketReceived(): void {
    if (this.remoteAudioTiming.addedMs === undefined) {
      this.logger.warn('Received remote audio first packet before audio was added, ignoring');
      return;
    }
    if (this.remoteAudioTiming.firstPacketReceivedMs !== undefined) {
      this.logger.debug('onRemoteAudioFirstPacketReceived called multiple times, ignoring');
      return;
    }
    this.remoteAudioTiming.firstPacketReceivedMs = this.getCurrentTimestamp();
    this.maybeEmitBatch();
  }

  /**
   * Records the timestamp when local audio track was added.
   */
  onLocalAudioAdded(): void {
    if (this.localAudioTiming.addedMs !== undefined) {
      this.logger.debug('onLocalAudioAdded called multiple times, ignoring');
      return;
    }
    this.localAudioTiming.addedMs = this.getCurrentTimestamp();
    this.startBatchIfNeeded();
    this.maybeEmitBatch();
  }

  /**
   * Records the timestamp when first audio packet was sent.
   */
  onLocalAudioFirstPacketSent(): void {
    if (this.localAudioTiming.addedMs === undefined) {
      this.logger.warn('Received local audio first packet sent before audio was added, ignoring');
      return;
    }
    if (this.localAudioTiming.firstPacketSentMs !== undefined) {
      this.logger.debug('onLocalAudioFirstPacketSent called multiple times, ignoring');
      return;
    }
    this.localAudioTiming.firstPacketSentMs = this.getCurrentTimestamp();
    this.maybeEmitBatch();
  }

  /**
   * Records the timestamp when local video track was added.
   */
  onLocalVideoAdded(): void {
    if (this.localVideoTiming.addedMs !== undefined || this.localVideoHasEmitted) {
      this.logger.debug('onLocalVideoAdded called multiple times, ignoring');
      return;
    }
    this.localVideoTiming.addedMs = this.getCurrentTimestamp();
    this.startBatchIfNeeded();
    this.maybeEmitBatch();
  }

  /**
   * Records the timestamp when first video frame was sent.
   */
  onLocalVideoFirstFrameSent(): void {
    if (this.localVideoTiming.addedMs === undefined) {
      this.logger.warn('Received local video first frame sent before video was added, ignoring');
      return;
    }
    if (this.localVideoTiming.firstFrameSentMs !== undefined) {
      this.logger.debug('onLocalVideoFirstFrameSent called multiple times, ignoring');
      return;
    }
    this.localVideoTiming.firstFrameSentMs = this.getCurrentTimestamp();
    this.maybeEmitBatch();
  }

  /**
   * Marks local video timing as removed and triggers batch completion check.
   * This allows the timing data to be emitted with the removed flag.
   */
  onLocalVideoRemoved(): void {
    if (this.localVideoTiming.addedMs === undefined) {
      this.logger.debug('onLocalVideoRemoved called without prior add, ignoring');
      return;
    }
    this.localVideoTiming.removed = true;
    this.localVideoHasEmitted = false;
    this.logger.debug('Local video timing marked as removed');
    this.maybeEmitBatch();
  }

  /**
   * Starts tracking timing for a remote video subscription.
   * Records the added timestamp for the given group_id.
   * If a timer already exists for this group_id, it is replaced.
   *
   * @param groupId The group ID of the remote video subscription
   */
  onRemoteVideoAdded(groupId: number): void {
    this.remoteVideoTiming.set(groupId, {
      addedMs: this.getCurrentTimestamp(),
    });
    this.startBatchIfNeeded();
    this.logger.debug(`Remote video timer started for group_id=${groupId}`);
  }

  /**
   * Records that a remote video tile has been bound to a video element.
   * Only bound remote videos are included in timing emissions.
   * Unbound remote videos are silently omitted from the batch.
   *
   * @param groupId The group ID of the remote video subscription
   */
  onRemoteVideoBound(groupId: number): void {
    this.boundRemoteVideoGroupIds.add(groupId);
  }

  /**
   * Records that a remote video tile has been unbound from its video element.
   * The group ID is removed from the bound set so it no longer blocks batch emission.
   *
   * @param groupId The group ID of the remote video subscription
   */
  onRemoteVideoUnbound(groupId: number): void {
    this.boundRemoteVideoGroupIds.delete(groupId);
    this.maybeEmitBatch();
  }

  /**
   * Records the timestamp when first video packet was received for a group_id.
   * Only the first call for each group_id records the timestamp.
   * @param groupId The group ID of the remote video subscription
   */
  onRemoteVideoFirstPacketReceived(groupId: number): void {
    const state = this.remoteVideoTiming.get(groupId);
    if (!state) {
      this.logger.warn(`onRemoteVideoFirstPacketReceived: No timer found for group_id=${groupId}`);
      return;
    }
    if (state.firstPacketReceivedMs !== undefined) {
      this.logger.debug(
        `onRemoteVideoFirstPacketReceived called multiple times for group_id=${groupId}, ignoring`
      );
      return;
    }
    state.firstPacketReceivedMs = this.getCurrentTimestamp();
    this.maybeEmitBatch();
  }

  /**
   * Records the timestamp when first video frame was rendered for a group_id.
   * @param groupId The group ID of the remote video subscription
   * @param metadata The VideoFrameCallbackMetadata from requestVideoFrameCallback, if available
   */
  onRemoteVideoFirstFrameRendered(groupId: number, metadata?: VideoFrameCallbackMetadata): void {
    const state = this.remoteVideoTiming.get(groupId);
    if (!state) {
      this.logger.warn(`onRemoteVideoFirstFrameRendered: No timer found for group_id=${groupId}`);
      return;
    }
    if (state.firstFrameRenderedMs !== undefined) {
      this.logger.debug(
        `onRemoteVideoFirstFrameRendered called multiple times for group_id=${groupId}, ignoring`
      );
      return;
    }
    // Use expectedDisplayTime from RVFC metadata when available for a more
    // accurate render timestamp; fall back to Date.now().
    state.firstFrameRenderedMs =
      metadata?.expectedDisplayTime !== undefined
        ? Math.round(performance.timeOrigin + metadata.expectedDisplayTime)
        : this.getCurrentTimestamp();
    this.maybeEmitBatch();
  }

  /**
   * Marks timing state for a remote video subscription as removed.
   * The timing data will be emitted with the removed flag.
   * @param groupId The group ID of the remote video subscription
   */
  onRemoteVideoRemoved(groupId: number): void {
    const state = this.remoteVideoTiming.get(groupId);
    if (state) {
      state.removed = true;
      this.logger.debug(`Remote video timing marked as removed for group_id=${groupId}`);
      this.maybeEmitBatch();
    }
  }

  /**
   * Clears all timing state and resets the manager for a new session.
   * This should be called when starting a new meeting session.
   */
  reset(): void {
    this.cancelBatchTimeout();

    this.signalingTiming = {};
    this.isResubscribe = false;
    this.remoteAudioTiming = {};
    this.localAudioTiming = {};
    this.localVideoTiming = {};
    this.localVideoHasEmitted = false;
    this.expectingRemoteVideo = false;
    this.remoteVideoTiming.clear();
    this.boundRemoteVideoGroupIds.clear();

    this.logger.info('MeetingSessionTimingManager: reset');
  }

  /**
   * Stops the timeout check interval and cleans up resources.
   * This should be called when the meeting session ends.
   */
  destroy(): void {
    this.cancelBatchTimeout();
    this.observers.clear();
    this.logger.info('MeetingSessionTimingManager: destroyed');
  }

  /**
   * Returns the current timestamp in milliseconds since epoch.
   */
  private getCurrentTimestamp(): number {
    return Date.now();
  }

  /**
   * Checks if signaling timing is complete.
   * Complete when all signaling timestamps are set.
   */
  private isSignalingComplete(): boolean {
    const s = this.signalingTiming;
    const resubscribeComplete =
      s.createOfferMs !== undefined &&
      s.setLocalDescriptionMs !== undefined &&
      s.subscribeSentMs !== undefined &&
      s.subscribeAckMs !== undefined &&
      s.setRemoteDescriptionMs !== undefined;
    /* istanbul ignore next */
    if (this.isResubscribe) {
      /* istanbul ignore next */
      return resubscribeComplete;
    }
    return (
      resubscribeComplete &&
      s.joinSentMs !== undefined &&
      s.joinAckReceivedMs !== undefined &&
      s.transportConnectedMs !== undefined &&
      s.iceGatheringStartMs !== undefined &&
      s.iceGatheringCompleteMs !== undefined &&
      s.iceConnectedMs !== undefined
    );
  }

  /**
   * Checks if remote audio timing is complete.
   * Only checks added_ms && first_packet_received_ms.
   * first_frame_rendered_ms is optional (not required for completion).
   */
  private isRemoteAudioComplete(): boolean {
    return (
      this.remoteAudioTiming.removed === true ||
      (this.remoteAudioTiming.addedMs !== undefined &&
        this.remoteAudioTiming.firstPacketReceivedMs !== undefined)
    );
  }

  /**
   * Checks if local audio timing is complete.
   * Only checks added_ms && first_packet_sent_ms.
   * first_frame_captured_ms is optional (not required for completion).
   */
  private isLocalAudioComplete(): boolean {
    return (
      this.localAudioTiming.removed === true ||
      (this.localAudioTiming.addedMs !== undefined &&
        this.localAudioTiming.firstPacketSentMs !== undefined)
    );
  }

  /**
   * Checks if local video timing is complete.
   * Only checks added_ms && first_frame_sent_ms.
   * first_frame_captured_ms is optional.
   */
  private isLocalVideoComplete(): boolean {
    return (
      this.localVideoTiming.removed === true ||
      (this.localVideoTiming.addedMs !== undefined &&
        this.localVideoTiming.firstFrameSentMs !== undefined)
    );
  }

  /**
   * Checks if a remote video timing entry is complete.
   * Complete when all three timestamps are set, or when removed.
   */
  private isRemoteVideoComplete(state: MeetingSessionRemoteVideoTiming): boolean {
    return (
      state.removed === true ||
      (state.addedMs !== undefined && state.firstFrameRenderedMs !== undefined)
    );
  }

  /**
   * Checks if all batch timings are complete.
   * Each category is only required if its corresponding on*Added was called.
   */
  private areAllBatchTimingsComplete(): boolean {
    if (this.signalingTiming.startMs !== undefined && !this.isSignalingComplete()) {
      return false;
    }
    if (this.remoteAudioTiming.addedMs !== undefined && !this.isRemoteAudioComplete()) {
      return false;
    }
    if (this.localAudioTiming.addedMs !== undefined && !this.isLocalAudioComplete()) {
      return false;
    }
    if (this.localVideoTiming.addedMs !== undefined && !this.isLocalVideoComplete()) {
      return false;
    }
    // If we're expecting remote video, hold the batch until at least one
    // bound remote video entry has completed.
    if (this.expectingRemoteVideo) {
      let hasBoundComplete = false;
      for (const [groupId, state] of this.remoteVideoTiming) {
        if (this.boundRemoteVideoGroupIds.has(groupId) && this.isRemoteVideoComplete(state)) {
          hasBoundComplete = true;
          break;
        }
      }
      if (!hasBoundComplete) {
        return false;
      }
    }
    for (const [groupId, state] of this.remoteVideoTiming) {
      if (!this.boundRemoteVideoGroupIds.has(groupId)) {
        continue;
      }
      if (!this.isRemoteVideoComplete(state)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Checks if the batch is complete and emits if so.
   */
  private maybeEmitBatch(): void {
    if (this.areAllBatchTimingsComplete()) {
      this.emitAndReset(false);
    }
  }

  /**
   * Builds and notifies the observer with timing data, then clears
   * the reported state so future events start a fresh batch.
   */
  private emitAndReset(batchTimedOut: boolean): void {
    const timing = this.buildMeetingSessionTiming(batchTimedOut);

    // Track that local video has been emitted so resubscribes don't re-add it
    if (
      this.localVideoTiming.addedMs !== undefined &&
      this.isLocalVideoComplete() &&
      !this.localVideoTiming.removed
    ) {
      this.localVideoHasEmitted = true;
    }

    // Clear everything that was just reported
    this.clearReportedState();

    if (this.observers.size === 0) {
      this.logger.warn('MeetingSessionTimingManager: No observers set, timing data discarded');
      return;
    }

    for (const observer of this.observers) {
      try {
        observer.onMeetingSessionTimingReady(timing);
      } catch (error) {
        this.logger.error(`MeetingSessionTimingManager: Error notifying observer: ${error}`);
      }
    }
  }

  /**
   * Clears state that was included in the last emission so it is not re-sent.
   * Resets the batch timer so new events can start a fresh batch.
   */
  private clearReportedState(): void {
    this.cancelBatchTimeout();
    this.signalingTiming = {};
    this.isResubscribe = false;
    this.remoteAudioTiming = {};
    this.localAudioTiming = {};
    this.localVideoTiming = {};
    this.expectingRemoteVideo = false;
    this.remoteVideoTiming.clear();
    this.boundRemoteVideoGroupIds.clear();
  }

  /**
   * Builds the MeetingSessionTiming structure from current state.
   * Per-struct timedOut flags: a struct is timed out if the batch timed out AND that struct is not complete.
   * @param batchTimedOut Whether the batch timed out
   */
  private buildMeetingSessionTiming(batchTimedOut: boolean): MeetingSessionTiming {
    const signaling: MeetingSessionSignalingTiming[] = [];
    const remoteAudio: MeetingSessionRemoteAudioTiming[] = [];
    const localAudio: MeetingSessionLocalAudioTiming[] = [];
    const localVideo: MeetingSessionLocalVideoTiming[] = [];
    const remoteVideos: MeetingSessionRemoteVideoTiming[] = [];

    if (this.signalingTiming.startMs !== undefined) {
      signaling.push({
        ...this.signalingTiming,
        timedOut: batchTimedOut && !this.isSignalingComplete(),
      });
    }

    if (this.remoteAudioTiming.addedMs !== undefined) {
      remoteAudio.push({
        ...this.remoteAudioTiming,
        timedOut: batchTimedOut && !this.isRemoteAudioComplete(),
      });
    }

    if (this.localAudioTiming.addedMs !== undefined) {
      localAudio.push({
        ...this.localAudioTiming,
        timedOut: batchTimedOut && !this.isLocalAudioComplete(),
      });
    }

    if (this.localVideoTiming.addedMs !== undefined) {
      localVideo.push({
        ...this.localVideoTiming,
        timedOut: batchTimedOut && !this.isLocalVideoComplete(),
      });
    }

    for (const [groupId, state] of this.remoteVideoTiming) {
      if (state.addedMs !== undefined && this.boundRemoteVideoGroupIds.has(groupId)) {
        remoteVideos.push({
          ...state,
          groupId,
          timedOut: batchTimedOut && !this.isRemoteVideoComplete(state),
        });
      }
    }

    return { signaling, remoteAudio, localAudio, localVideo, remoteVideos };
  }

  private scheduleBatchTimeout(): void {
    this.batchTimeout = setTimeout(() => {
      this.batchTimeout = null;
      this.logger.warn('Batch timing timeout');
      this.emitAndReset(true);
    }, MeetingSessionTimingManager.TIMEOUT_THRESHOLD_MS);
  }

  private cancelBatchTimeout(): void {
    if (this.batchTimeout !== null) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }
}
