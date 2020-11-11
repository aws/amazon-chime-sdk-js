// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import MeetingSessionStatusCode from '../meetingsession/MeetingSessionStatusCode';
import RealtimeAttendeePositionInFrame from '../realtimecontroller/RealtimeAttendeePositionInFrame';
import BaseTask from './BaseTask';

/*
 * [[WaitForAttendeePresenceTask]] waits until an attendee presence event happens.
 */
export default class WaitForAttendeePresenceTask extends BaseTask {
  protected taskName = 'WaitForAttendeePresenceTask';

  private cancelPromise: (error: Error) => void;

  constructor(private context: AudioVideoControllerState) {
    super(context.logger);
  }

  cancel(): void {
    const error = new Error(
      `canceling ${this.name()} due to the meeting status code: ${
        MeetingSessionStatusCode.NoAttendeePresent
      }`
    );
    this.cancelPromise && this.cancelPromise(error);
  }

  async run(): Promise<void> {
    const attendeeId = this.context.meetingSessionConfiguration.credentials.attendeeId;
    return new Promise<void>((resolve, reject) => {
      const handler = (
        presentAttendeeId: string,
        present: boolean,
        _externalUserId: string,
        _dropped: boolean,
        _pos: RealtimeAttendeePositionInFrame
      ): void => {
        if (attendeeId === presentAttendeeId && present) {
          this.context.realtimeController.realtimeUnsubscribeToAttendeeIdPresence(handler);
          resolve();
        }
      };

      this.cancelPromise = (error: Error) => {
        this.context.realtimeController.realtimeUnsubscribeToAttendeeIdPresence(handler);
        reject(error);
      };

      this.context.realtimeController.realtimeSubscribeToAttendeeIdPresence(handler);
    });
  }
}
