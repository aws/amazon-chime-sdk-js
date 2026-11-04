// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { AudioVideoFacade, DataMessage, DefaultModality } from 'amazon-chime-sdk-js';

import ApiClient, { MeetingLookup } from '../session/ApiClient';
import { STRINGS } from '../strings';
import { displayNameOf } from '../ui/dom';
import type { IconName } from '../ui/icons';
import Toast from '../ui/Toast';

interface RecordingPayload {
  /** The cloud capture pipeline the sender started is running. */
  capturing: boolean;
  /** The live connector the sender started is running. */
  broadcasting: boolean;
  /** The sender stopped the meeting's capture or broadcast, whoever had started it. */
  endedCapture?: boolean;
  endedBroadcast?: boolean;
}

type Announcement = Pick<RecordingPayload, 'capturing' | 'broadcasting'> & { sender: string };

export interface RecordingElements {
  /** Header indicator: "Recording (names)". */
  indicator: HTMLElement;
}

/** One recording choice, as the More menu lists it. */
export interface RecordingOption {
  id: 'button-record-cloud' | 'button-live-connector';
  label: string;
  icon: IconName;
  description: string;
  checked: boolean;
  /** A start or stop is in flight. */
  disabled: boolean;
  /** Why the option cannot be offered in this meeting, or null when it can. */
  unavailable: string | null;
  select(): void;
}

/**
 * Recording: a media capture pipeline to S3 and a live connector broadcast to IVS (the demo
 * servers make the bucket and channel on demand).
 *
 * Both cloud pipelines belong to the meeting. The "being recorded" indicator shows while the
 * server (`/meeting`, asked on joining and whenever an attendee joins or leaves) reports one
 * running, or while an attendee's announcement over a data message says so: the announcement is
 * the fast path and names who started it, and the server keeps the indicator up after they leave
 * and tells late joiners. A server answer never hides a live announcement, because it can lag a
 * start by a moment; announcements end with their sender's stop message or departure. Servers
 * without the route answer null, and then the announcements alone decide.
 */
export default class Recording {
  static readonly TOPIC = 'recording';
  /** Pipelines this attendee started and that are still running. */
  private capturing = false;
  private broadcasting = false;
  private replica = false;
  /** A start or stop request is in flight. */
  private captureBusy = false;
  private broadcastBusy = false;
  /** What remote attendees announced about the pipelines they started. */
  private readonly remoteRecorders = new Map<string, Announcement>();
  /** The server's view; null when it cannot say (older servers), so data messages decide. */
  private server: Pick<MeetingLookup, 'capturing' | 'broadcasting'> | null = null;
  /** Attendees who left; their announcements are dropped once the server has been asked. */
  private readonly departed = new Set<string>();
  private lookupInFlight = false;
  private lookupAgain = false;
  private destroyed = false;
  private readonly handler = (dataMessage: DataMessage): void => this.receive(dataMessage);
  private readonly presenceHandler = (attendeeId: string, present: boolean): void =>
    this.attendeePresenceChanged(attendeeId, present);

  constructor(
    private readonly audioVideo: AudioVideoFacade,
    private readonly api: ApiClient,
    private readonly meeting: string,
    private readonly localAttendeeId: string,
    private readonly elements: RecordingElements
  ) {
    this.audioVideo.realtimeSubscribeToReceiveDataMessage(Recording.TOPIC, this.handler);
    this.audioVideo.realtimeSubscribeToAttendeeIdPresence(this.presenceHandler);
    this.refreshServerState();
  }

  /** In a replica meeting cloud capture stays off. */
  setReplica(): void {
    this.replica = true;
  }

  get options(): RecordingOption[] {
    return [
      {
        id: 'button-record-cloud',
        label: STRINGS.recordToCloud,
        icon: 'circleDot',
        description: STRINGS.recordToCloudDescription,
        checked: this.meetingCapturing,
        disabled: this.captureBusy,
        unavailable: this.replica ? STRINGS.recordingNotOnReplica : null,
        select: () => void this.toggleCapture(),
      },
      {
        id: 'button-live-connector',
        label: STRINGS.broadcast,
        icon: 'radio',
        description: STRINGS.broadcastDescription,
        checked: this.meetingBroadcasting,
        disabled: this.broadcastBusy,
        unavailable: null,
        select: () => void this.toggleLiveConnector(),
      },
    ];
  }

  /** Re-announce an active recording so attendees who just joined see who started it. */
  rebroadcast(): void {
    if (this.capturing || this.broadcasting) {
      this.send();
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.audioVideo.realtimeUnsubscribeFromReceiveDataMessage(Recording.TOPIC);
    this.audioVideo.realtimeUnsubscribeToAttendeeIdPresence(this.presenceHandler);
  }

  private get meetingCapturing(): boolean {
    return (
      this.capturing ||
      !!this.server?.capturing ||
      Array.from(this.remoteRecorders.values()).some(payload => payload.capturing)
    );
  }

  private get meetingBroadcasting(): boolean {
    return (
      this.broadcasting ||
      !!this.server?.broadcasting ||
      Array.from(this.remoteRecorders.values()).some(payload => payload.broadcasting)
    );
  }

  /**
   * Only a recorder leaving needs the server's view (is their pipeline still running?); late
   * joiners learn from the lookup at construction, and starts and stops arrive as data messages.
   * Asking on every presence change would cost every attendee a lookup per join or leave.
   */
  private attendeePresenceChanged(attendeeId: string, present: boolean): void {
    if (
      present ||
      new DefaultModality(attendeeId).hasModality(DefaultModality.MODALITY_CONTENT) ||
      !this.remoteRecorders.has(attendeeId)
    ) {
      return;
    }
    this.departed.add(attendeeId);
    this.refreshServerState();
  }

  /**
   * Ask the server which pipelines are running. Calls made while a lookup is in flight are folded
   * into one more lookup after it, whose answer replaces the stale one.
   */
  private refreshServerState(): void {
    if (this.lookupInFlight) {
      this.lookupAgain = true;
      return;
    }
    this.lookupInFlight = true;
    void this.api.lookupMeeting(this.meeting).then(lookup => {
      this.lookupInFlight = false;
      if (this.destroyed) {
        return;
      }
      if (this.lookupAgain) {
        this.lookupAgain = false;
        this.refreshServerState();
        return;
      }
      this.applyServerState(lookup);
    });
  }

  /** A null lookup keeps the last answer: `server` stays null only without the route. */
  private applyServerState(lookup: MeetingLookup | null): void {
    for (const attendeeId of this.departed) {
      this.remoteRecorders.delete(attendeeId);
    }
    this.departed.clear();
    if (lookup) {
      this.server = { capturing: lookup.capturing, broadcasting: lookup.broadcasting };
    }
    this.updateUX();
  }

  private send(ended: Pick<RecordingPayload, 'endedCapture' | 'endedBroadcast'> = {}): void {
    const payload: RecordingPayload = {
      capturing: this.capturing,
      broadcasting: this.broadcasting,
      ...ended,
    };
    this.audioVideo.realtimeSendDataMessage(Recording.TOPIC, payload, 10_000);
  }

  private receive(dataMessage: DataMessage): void {
    if (dataMessage.senderAttendeeId === this.localAttendeeId) {
      return;
    }
    let payload: RecordingPayload;
    try {
      payload = dataMessage.json() as RecordingPayload;
    } catch {
      return;
    }
    const sender = displayNameOf(dataMessage.senderExternalUserId);
    // The sender may have stopped a pipeline someone else (or we) started.
    const wasRecording = this.meetingCapturing || this.meetingBroadcasting;
    if (payload.endedCapture) {
      this.endedElsewhere('capturing');
    }
    if (payload.endedBroadcast) {
      this.endedElsewhere('broadcasting');
    }
    const endedOne = (payload.endedCapture || payload.endedBroadcast) && wasRecording;
    const previous = this.remoteRecorders.get(dataMessage.senderAttendeeId);
    if (payload.capturing || payload.broadcasting) {
      this.remoteRecorders.set(dataMessage.senderAttendeeId, {
        capturing: !!payload.capturing,
        broadcasting: !!payload.broadcasting,
        sender,
      });
      if (!previous) {
        Toast.show({
          message: payload.capturing
            ? STRINGS.startedRecording(sender)
            : STRINGS.startedBroadcasting(sender),
          durationMs: 6000,
        });
      }
    } else {
      this.remoteRecorders.delete(dataMessage.senderAttendeeId);
      if (previous || endedOne) {
        Toast.show({ message: STRINGS.stoppedRecording(sender), durationMs: 4000 });
      }
    }
    this.updateUX();
  }

  /** Another attendee stopped the meeting's capture or broadcast, maybe one we started. */
  private endedElsewhere(kind: 'capturing' | 'broadcasting'): void {
    this[kind] = false;
    this.clearRemote(kind);
  }

  private updateUX(): void {
    const { indicator } = this.elements;
    const capturing = this.meetingCapturing;
    const broadcasting = this.meetingBroadcasting;
    indicator.hidden = !(capturing || broadcasting);
    // Name who is recording, the way Teams and Zoom do, so nobody has to ask.
    const remote = Array.from(this.remoteRecorders.values());
    const by = [
      ...(this.capturing || this.broadcasting ? [STRINGS.recordingYou] : []),
      ...remote.map(payload => payload.sender),
    ];
    const label = indicator.querySelector('.recording-label') ?? indicator;
    label.textContent = by.length > 0 ? STRINGS.recordingBy(by) : STRINGS.recording;
    indicator.title = broadcasting ? STRINGS.recordingOrBroadcastTitle : STRINGS.recordingTitle;
  }

  /** Stops the meeting's capture whoever started it; the servers treat a stop as idempotent. */
  private async toggleCapture(): Promise<void> {
    if (this.destroyed || this.captureBusy || this.replica) {
      return;
    }
    this.captureBusy = true;
    try {
      if (this.meetingCapturing) {
        await this.api.endCapture(this.meeting);
        this.capturing = false;
        this.clearRemote('capturing');
        Toast.show({ message: STRINGS.recordingStopped, durationMs: 4000 });
        this.send({ endedCapture: true });
      } else {
        await this.api.startCapture(this.meeting);
        this.capturing = true;
        Toast.show({ message: STRINGS.recordingToCloud, durationMs: 5000 });
        this.send();
      }
    } catch (error) {
      Toast.show({ message: STRINGS.couldNotChangeRecording((error as Error).message) });
    } finally {
      this.captureBusy = false;
      this.updateUX();
    }
  }

  private async toggleLiveConnector(): Promise<void> {
    if (this.destroyed || this.broadcastBusy) {
      return;
    }
    this.broadcastBusy = true;
    try {
      if (this.meetingBroadcasting) {
        await this.api.endLiveConnector(this.meeting);
        this.broadcasting = false;
        this.clearRemote('broadcasting');
        this.send({ endedBroadcast: true });
      } else {
        const response = await this.api.startLiveConnector(this.meeting);
        this.broadcasting = true;
        Toast.show({
          message: response.playBackUrl
            ? STRINGS.broadcastingAt(response.playBackUrl)
            : STRINGS.broadcastingStarted,
          durationMs: response.playBackUrl ? 0 : 5000,
        });
        this.send();
      }
    } catch (error) {
      Toast.show({ message: STRINGS.couldNotChangeBroadcast((error as Error).message) });
    } finally {
      this.broadcastBusy = false;
      this.updateUX();
    }
  }

  /** Once the meeting's pipeline is stopped, nobody's announcement of it holds any more. */
  private clearRemote(kind: 'capturing' | 'broadcasting'): void {
    if (this.server) {
      this.server[kind] = false;
    }
    for (const [attendeeId, payload] of this.remoteRecorders) {
      payload[kind] = false;
      if (!payload.capturing && !payload.broadcasting) {
        this.remoteRecorders.delete(attendeeId);
      }
    }
  }
}
