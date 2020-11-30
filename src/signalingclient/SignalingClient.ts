// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import SignalingClientObserver from '../signalingclientobserver/SignalingClientObserver';
import {
  SdkClientMetricFrame,
  SdkDataMessageFrame,
  SdkPingPongFrame,
} from '../signalingprotocol/SignalingProtocol.js';
import SignalingClientConnectionRequest from './SignalingClientConnectionRequest';
import SignalingClientJoin from './SignalingClientJoin';
import SignalingClientSubscribe from './SignalingClientSubscribe';

/**
 * [[SignalingClient]] is the top-level interface for opening a signaling connection over WebSocket.
 */
export default interface SignalingClient {
  /**
   * Adds an observer to the observer queue with immediate effect.
   *
   * @param {SignalingClientObserver} observer The observer to add to the queue.
   */
  registerObserver(observer: SignalingClientObserver): void;

  /**
   * Removes an observer from the observer queue with immediate effect.
   *
   * @param {SignalingClientObserver} observer The observer to remove from the queue.
   */
  removeObserver(observer: SignalingClientObserver): void;

  /**
   * Enqueues an attempt to open a signaling connection over WebSocket.
   *
   * Once initiated, a WebSocketConnecting event is sent to observers. If successful, a
   * WebSocketOpen event is sent out. If the connection could not be established for any reason,
   * a WebSocketFailed event is sent followed by WebSocketClosed event. If any existing connection
   * is open, then that is first closed (and the WebSocketClosed event is sent out) before the
   * open is tried.
   *
   * @param {SignalingClientConnectionRequest} request The request to enqueue.
   */
  openConnection(request: SignalingClientConnectionRequest): void;

  /**
   * Sends a ping or pong with an id.
   *
   * @param {SdkPingPongFrame} the ping or pong frame to send.
   * @return number the ms timestamp when the message was sent.
   */
  pingPong(pingPongFrame: SdkPingPongFrame): number;

  /**
   * Sends a join frame with the given settings.
   *
   * @param {SignalingClientJoin} settings How to configure the Join frame.
   */
  join(settings: SignalingClientJoin): void;

  /**
   * Sends a subscribe frame with the given settings.
   *
   * @param {SignalingClientSubscribe} settings How to configure the Subscribe frame.
   */
  subscribe(settings: SignalingClientSubscribe): void;

  /**
   * Sends a leave frame.
   */
  leave(): void;

  /**
   * Sends a client stats frame.
   */
  sendClientMetrics(clientMetricFrame: SdkClientMetricFrame): void;

  /**
   * Send a message frame to data channel
   */
  sendDataMessage(messageFrame: SdkDataMessageFrame): void;

  /**
   * Closes any existing connection.
   *
   * Prior to closing, it delivers a WebSocketClosing event. Upon receipt of the final
   * WebSocket close event, the connection request queue is serviced. If there is no connection
   * to close, this function just services the connection request queue and returns.
   */
  closeConnection(): void;

  /**
   * Mute or unmute the client
   *
   * @param {boolean} muted Whether the client is to be muted (true) or unmuted (false)
   */
  mute(muted: boolean): void;

  /**
   * Returns whether the client has a connection open in the ready state
   *
   * @return {boolean} Whether the client has a connection open in the ready state
   */
  ready(): boolean;

  /**
   * Sends a pause frame with the given stream ids.
   */
  pause(streamIds: number[]): void;

  /**
   * Sends a resume frame with the given stream ids.
   */
  resume(streamIds: number[]): void;
}
