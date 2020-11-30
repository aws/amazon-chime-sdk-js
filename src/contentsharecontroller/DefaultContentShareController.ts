// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioProfile from '../audioprofile/AudioProfile';
import AudioVideoController from '../audiovideocontroller/AudioVideoController';
import AudioVideoObserver from '../audiovideoobserver/AudioVideoObserver';
import ContentShareObserver from '../contentshareobserver/ContentShareObserver';
import Maybe from '../maybe/Maybe';
import MeetingSessionConfiguration from '../meetingsession/MeetingSessionConfiguration';
import MeetingSessionCredentials from '../meetingsession/MeetingSessionCredentials';
import MeetingSessionStatus from '../meetingsession/MeetingSessionStatus';
import DefaultModality from '../modality/DefaultModality';
import AsyncScheduler from '../scheduler/AsyncScheduler';
import VideoTile from '../videotile/VideoTile';
import ContentShareConstants from './ContentShareConstants';
import ContentShareController from './ContentShareController';
import ContentShareMediaStreamBroker from './ContentShareMediaStreamBroker';

export default class DefaultContentShareController
  implements ContentShareController, AudioVideoObserver {
  static createContentShareMeetingSessionConfigure(
    configuration: MeetingSessionConfiguration
  ): MeetingSessionConfiguration {
    const contentShareConfiguration = new MeetingSessionConfiguration();
    contentShareConfiguration.meetingId = configuration.meetingId;
    contentShareConfiguration.externalMeetingId = configuration.externalMeetingId;
    contentShareConfiguration.urls = configuration.urls;
    contentShareConfiguration.credentials = new MeetingSessionCredentials();
    contentShareConfiguration.credentials.attendeeId =
      configuration.credentials.attendeeId + ContentShareConstants.Modality;
    contentShareConfiguration.credentials.externalUserId = configuration.credentials.externalUserId;
    contentShareConfiguration.credentials.joinToken =
      configuration.credentials.joinToken + ContentShareConstants.Modality;
    return contentShareConfiguration;
  }

  private observerQueue: Set<ContentShareObserver> = new Set<ContentShareObserver>();
  private contentShareTile: VideoTile;

  constructor(
    private mediaStreamBroker: ContentShareMediaStreamBroker,
    private contentAudioVideo: AudioVideoController,
    private attendeeAudioVideo: AudioVideoController
  ) {
    this.contentAudioVideo.addObserver(this);
    this.setupContentShareEvents();
  }

  setContentAudioProfile(audioProfile: AudioProfile): void {
    this.contentAudioVideo.setAudioProfile(audioProfile);
  }

  async startContentShare(stream: MediaStream): Promise<void> {
    if (!stream) {
      return;
    }
    this.mediaStreamBroker.mediaStream = stream;
    for (let i = 0; i < this.mediaStreamBroker.mediaStream.getTracks().length; i++) {
      this.mediaStreamBroker.mediaStream.getTracks()[i].addEventListener('ended', () => {
        this.stopContentShare();
      });
    }
    this.contentAudioVideo.start();
    if (this.mediaStreamBroker.mediaStream.getVideoTracks().length > 0) {
      this.contentAudioVideo.videoTileController.startLocalVideoTile();
    }
  }

  async startContentShareFromScreenCapture(
    sourceId?: string,
    frameRate?: number
  ): Promise<MediaStream> {
    const mediaStream = await this.mediaStreamBroker.acquireScreenCaptureDisplayInputStream(
      sourceId,
      frameRate
    );
    await this.startContentShare(mediaStream);
    return mediaStream;
  }

  pauseContentShare(): void {
    if (this.mediaStreamBroker.toggleMediaStream(false)) {
      this.forEachContentShareObserver(observer => {
        Maybe.of(observer.contentShareDidPause).map(f => f.bind(observer)());
      });
    }
  }

  unpauseContentShare(): void {
    if (this.mediaStreamBroker.toggleMediaStream(true)) {
      this.forEachContentShareObserver(observer => {
        Maybe.of(observer.contentShareDidUnpause).map(f => f.bind(observer)());
      });
    }
  }

  stopContentShare(): void {
    this.contentAudioVideo.stop();
    this.mediaStreamBroker.cleanup();
  }

  addContentShareObserver(observer: ContentShareObserver): void {
    this.observerQueue.add(observer);
  }

  removeContentShareObserver(observer: ContentShareObserver): void {
    this.observerQueue.delete(observer);
  }

  forEachContentShareObserver(observerFunc: (observer: ContentShareObserver) => void): void {
    for (const observer of this.observerQueue) {
      new AsyncScheduler().start(() => {
        if (this.observerQueue.has(observer)) {
          observerFunc(observer);
        }
      });
    }
  }

  audioVideoDidStop(_sessionStatus: MeetingSessionStatus): void {
    // If the content attendee got dropped or could not connect, stopContentShare will not be called
    // so make sure to clean up the media stream.
    this.mediaStreamBroker.cleanup();
    if (this.contentShareTile) {
      this.attendeeAudioVideo.videoTileController.removeVideoTile(this.contentShareTile.id());
      this.contentShareTile = null;
    }
    this.forEachContentShareObserver(observer => {
      Maybe.of(observer.contentShareDidStop).map(f => f.bind(observer)());
    });
  }

  private setupContentShareEvents(): void {
    // We use realtimeSubscribeToAttendeeIdPresence instead of audioVideoDidStart because audioVideoDidStart fires
    // before the capacity check in Tincan while when realtimeSubscribeToAttendeeIdPresence fires, we know the
    // content attendee has been able to pass the capacity check and join the call so we can start the local
    // content share video
    this.attendeeAudioVideo.realtimeController.realtimeSubscribeToAttendeeIdPresence(
      (attendeeId: string, present: boolean, _externalUserId: string, _dropped: boolean): void => {
        const isContentAttendee = new DefaultModality(attendeeId).hasModality(
          DefaultModality.MODALITY_CONTENT
        );
        const isSelfAttendee =
          new DefaultModality(attendeeId).base() ===
          this.attendeeAudioVideo.configuration.credentials.attendeeId;
        if (!isContentAttendee || !isSelfAttendee || !present || this.contentShareTile) {
          return;
        }
        const stream = this.mediaStreamBroker.mediaStream;
        if (stream.getVideoTracks().length > 0) {
          this.contentShareTile = this.attendeeAudioVideo.videoTileController.addVideoTile();
          const track = stream.getVideoTracks()[0];
          let width, height;
          if (track.getSettings) {
            const cap: MediaTrackSettings = track.getSettings();
            width = cap.width as number;
            height = cap.height as number;
          } else {
            const cap: MediaTrackCapabilities = track.getCapabilities();
            width = cap.width as number;
            height = cap.height as number;
          }
          this.contentShareTile.bindVideoStream(
            this.contentAudioVideo.configuration.credentials.attendeeId,
            false,
            stream,
            width,
            height,
            null,
            this.contentAudioVideo.configuration.credentials.externalUserId
          );
        }
        this.forEachContentShareObserver(observer => {
          Maybe.of(observer.contentShareDidStart).map(f => f.bind(observer)());
        });
      }
    );
  }
}
