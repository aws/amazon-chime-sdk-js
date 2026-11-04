// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export interface JoinRequest {
  meeting: string;
  name: string;
  region: string;
  primaryExternalMeetingId?: string;
  audioCapability?: string;
  videoCapability?: string;
  contentCapability?: string;
  echoReduction: boolean;
  videoMaxResolution: 'None' | 'HD' | 'FHD';
  contentMaxResolution: 'None' | 'FHD' | 'UHD';
  maxAttendeeCount: number | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export type JoinInfo = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface MeetingLookup {
  exists: boolean;
  mediaRegion?: string;
  /** A cloud media capture pipeline is running for the meeting. */
  capturing: boolean;
  /** A live connector (IVS) broadcast is running for the meeting. */
  broadcasting: boolean;
}

/**
 * Client for the demo's own HTTP API (`api-server.js` locally, the serverless demo when deployed).
 * Every mutating call is a POST; parameters travel in the query string because that is what the
 * serverless demo's API Gateway routes expect.
 */
export default class ApiClient {
  static readonly BASE_URL: string = [
    location.protocol,
    '//',
    location.host,
    location.pathname.replace(/\/*$/, '/'),
  ].join('');

  constructor(private readonly baseUrl: string = ApiClient.BASE_URL) {}

  async join(request: JoinRequest): Promise<{ JoinInfo: JoinInfo }> {
    const params = new URLSearchParams({
      title: request.meeting,
      name: request.name,
      region: request.region,
      ns_es: String(request.echoReduction),
      v_rs: request.videoMaxResolution,
      c_rs: request.contentMaxResolution,
    });
    if (request.maxAttendeeCount !== null) {
      params.set('a_cnt', String(request.maxAttendeeCount));
    }
    if (request.primaryExternalMeetingId) {
      params.set('primaryExternalMeetingId', request.primaryExternalMeetingId);
    }
    if (request.audioCapability) {
      params.set('attendeeAudioCapability', request.audioCapability);
    }
    if (request.videoCapability) {
      params.set('attendeeVideoCapability', request.videoCapability);
    }
    if (request.contentCapability) {
      params.set('attendeeContentCapability', request.contentCapability);
    }
    return this.post('join', params);
  }

  async endMeeting(meeting: string): Promise<void> {
    await this.post('end', new URLSearchParams({ title: meeting }), false);
  }

  async startCapture(meeting: string): Promise<void> {
    await this.post('startCapture', new URLSearchParams({ title: meeting }), false);
  }

  async endCapture(meeting: string): Promise<void> {
    await this.post('endCapture', new URLSearchParams({ title: meeting }), false);
  }

  async startLiveConnector(meeting: string): Promise<{ playBackUrl?: string }> {
    return this.post('startLiveConnector', new URLSearchParams({ title: meeting }));
  }

  async endLiveConnector(meeting: string): Promise<void> {
    await this.post('endLiveConnector', new URLSearchParams({ title: meeting }), false);
  }

  async startTranscription(
    meeting: string,
    engine: string,
    language: string,
    region: string,
    transcriptionStreamParams: object
  ): Promise<void> {
    await this.post(
      'start_transcription',
      new URLSearchParams({
        title: meeting,
        engine,
        language,
        region,
        transcriptionStreamParams: JSON.stringify(transcriptionStreamParams),
      })
    );
  }

  async stopTranscription(meeting: string): Promise<void> {
    await this.post('stop_transcription', new URLSearchParams({ title: meeting }));
  }

  async getAttendee(
    meeting: string,
    attendeeId: string
  ): Promise<{ Attendee: { Capabilities: { Audio: string; Video: string; Content: string } } }> {
    const response = await fetch(
      `${this.baseUrl}get_attendee?${new URLSearchParams({ title: meeting, id: attendeeId })}`
    );
    return this.parse(response);
  }

  async updateAttendeeCapabilities(
    meeting: string,
    attendeeId: string,
    audioCapability: string,
    videoCapability: string,
    contentCapability: string
  ): Promise<void> {
    await this.post(
      'update_attendee_capabilities',
      new URLSearchParams({
        title: meeting,
        attendeeId,
        audioCapability,
        videoCapability,
        contentCapability,
      })
    );
  }

  async updateAttendeeCapabilitiesExcept(
    meeting: string,
    attendeeIds: string[],
    audioCapability: string,
    videoCapability: string,
    contentCapability: string
  ): Promise<void> {
    await this.post(
      'batch_update_attendee_capabilities_except',
      new URLSearchParams({
        title: meeting,
        attendeeIds: attendeeIds.join(','),
        audioCapability,
        videoCapability,
        contentCapability,
      })
    );
  }

  /** Whether a meeting with this title exists; null when the server cannot say (older servers lack the route). */
  async lookupMeeting(title: string): Promise<MeetingLookup | null> {
    try {
      const response = await fetch(`${this.baseUrl}meeting?${new URLSearchParams({ title })}`);
      if (!response.ok) {
        return null;
      }
      const json = await response.json();
      return {
        exists: !!json.exists,
        mediaRegion: json.mediaRegion || undefined,
        capturing: !!json.capturing,
        broadcasting: !!json.broadcasting,
      };
    } catch {
      return null;
    }
  }

  /** Log-stream endpoints exist only in the serverless deployment; anything else is "no". */
  async createLogStream(pathname: string, meetingId: string, attendeeId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}${pathname}`, {
        method: 'POST',
        body: JSON.stringify({ meetingId, attendeeId }),
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  url(pathname: string): string {
    return `${this.baseUrl}${pathname}`;
  }

  private async post(
    pathname: string,
    params: URLSearchParams,
    expectJson: boolean = true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    const response = await fetch(`${this.baseUrl}${pathname}?${params}`, { method: 'POST' });
    if (!expectJson) {
      if (!response.ok) {
        await this.parse(response);
      }
      return undefined;
    }
    return this.parse(response);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async parse(response: Response): Promise<any> {
    const json = await response.json().catch(() => ({}));
    // The server answers errors with `{ error }`; the debug-mode stubs use `{ Error }`.
    const message = json.error ?? json.Error;
    if (message || !response.ok) {
      throw new Error(`Server error: ${message ?? `HTTP ${response.status}`}`);
    }
    return json;
  }
}
