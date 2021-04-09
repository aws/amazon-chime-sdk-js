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

  private cancelPromise: undefined | ((error: Error) => void);

  constructor(private context: AudioVideoControllerState) {
    super(context.logger);
  }

  cancel(): void {
    // Just in case. The baseCancel behavior should prevent this.
    /* istanbul ignore else */
    if (this.cancelPromise) {
      const error = new Error(
        `canceling ${this.name()} due to the meeting status code: ${
          MeetingSessionStatusCode.NoAttendeePresent
        }`
      );
      this.cancelPromise(error);
      delete this.cancelPromise;
    }
  }

  async run(): Promise<void> {
    const attendeeId = this.context.meetingSessionConfiguration.credentials.attendeeId;
    return new Promise<void>((resolve, reject) => {
      const handler = (
        presentAttendeeId: string,
        present: boolean,
        _externalUserId: string | undefined,
        _dropped: boolean | undefined,
        _pos: RealtimeAttendeePositionInFrame | undefined
      ): void => {
        if (attendeeId === presentAttendeeId && present) {
          this.context.realtimeController.realtimeUnsubscribeToAttendeeIdPresence(handler);
          resolve();
          delete this.cancelPromise;
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
