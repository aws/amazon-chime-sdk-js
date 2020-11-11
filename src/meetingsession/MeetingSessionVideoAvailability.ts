// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[MeetingSessionVideoAvailability]] contains the video availability information.
 */
export default class MeetingSessionVideoAvailability {
  /**
   * Indicates whether one or more remote video streams
   * are available for streaming. This can be used to decide whether or not to
   * switch the connection type to include video.
   */
  remoteVideoAvailable: boolean = false;

  /**
   * Indicates whether the server has a slot available for
   * this client's local video tile. If the client is already sending a local
   * video tile, then this will be true. This property can be used to decide
   * whether to offer the option to start the local video tile.
   */
  canStartLocalVideo: boolean = false;

  /**
   * Returns whether the fields are the same as that of another availability object.
   */
  equal(other: MeetingSessionVideoAvailability): boolean {
    return (
      this.remoteVideoAvailable === other.remoteVideoAvailable &&
      this.canStartLocalVideo === other.canStartLocalVideo
    );
  }

  /**
   * Returns a deep copy of this object.
   */
  clone(): MeetingSessionVideoAvailability {
    const cloned = new MeetingSessionVideoAvailability();
    cloned.remoteVideoAvailable = this.remoteVideoAvailable;
    cloned.canStartLocalVideo = this.canStartLocalVideo;
    return cloned;
  }
}
