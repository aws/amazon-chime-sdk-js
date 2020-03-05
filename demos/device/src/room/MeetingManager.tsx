import {
  AudioVideoFacade,
  AudioVideoObserver,
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  LogLevel,
  MeetingSessionConfiguration,
  ScreenShareViewFacade,
  ScreenObserver,
} from '../../../../build/index';

const BASE_URL = [
  location.protocol,
  '//',
  location.host,
  location.pathname.replace(/\/*$/, '/'),
].join('');

class MeetingManager {
  private meetingSession: DefaultMeetingSession;
  private audioVideo: AudioVideoFacade;
  private screenShareView: ScreenShareViewFacade;
  private title: string;

  async initializeMeetingSession(configuration: MeetingSessionConfiguration): Promise<any> {
    const logger = new ConsoleLogger('DEV-SDK', LogLevel.DEBUG);
    const deviceController = new DefaultDeviceController(logger);
    configuration.enableWebAudio = false;
    this.meetingSession = new DefaultMeetingSession(configuration, logger, deviceController);
    this.audioVideo = this.meetingSession.audioVideo;
    // TODO: Update ScreenShareView to use new introduced content-based screen sharing.
    this.screenShareView = this.meetingSession.screenShareView;

    await this.setupAudioDevices();
  }

  async setupAudioDevices(): Promise<void> {
    const audioOutput = await this.audioVideo.listAudioOutputDevices();
    const defaultOutput = audioOutput[0] && audioOutput[0].deviceId;
    await this.audioVideo.chooseAudioOutputDevice(defaultOutput);

    const audioInput = await this.audioVideo.listAudioInputDevices();
    const defaultInput = audioInput[0] && audioInput[0].deviceId;
    await this.audioVideo.chooseAudioInputDevice(defaultInput);
  }

  registerScreenShareObservers(observer: ScreenObserver): void {
    if (!this.screenShareView) {
      console.log('ScreenView not initialize. Cannot add observer');
      return;
    }
    this.screenShareView.registerObserver(observer);
  }

  addAudioVideoObserver(observer: AudioVideoObserver): void {
    if (!this.audioVideo) {
      console.error('AudioVideo not initialized. Cannot add observer');
      return;
    }
    this.audioVideo.addObserver(observer);
  }

  removeMediaObserver(observer: AudioVideoObserver): void {
    if (!this.audioVideo) {
      console.error('AudioVideo not initialized. Cannot remove observer');
      return;
    }

    this.audioVideo.removeObserver(observer);
  }

  removeScreenShareObserver(observer: ScreenObserver): void {
    if (!this.screenShareView) {
      console.error('ScreenView not initialized. Cannot remove observer');
      return;
    }

    this.screenShareView.unregisterObserver(observer);
  }

  bindVideoTile(id: number, videoEl: HTMLVideoElement): void {
    this.audioVideo.bindVideoElement(id, videoEl);
  }

  async startLocalVideo(): Promise<void> {
    const videoInput = await this.audioVideo.listVideoInputDevices();
    const defaultVideo = videoInput[0];
    await this.audioVideo.chooseVideoInputDevice(defaultVideo);
    this.audioVideo.startLocalVideoTile();
  }

  stopLocalVideo(): void {
    this.audioVideo.stopLocalVideoTile();
  }

  async startViewingScreenShare(screenViewElement: HTMLDivElement): Promise<void> {
    this.screenShareView.start(screenViewElement).catch(error => console.error(error));
  }

  stopViewingScreenShare(): void {
    this.screenShareView.stop().catch(error => {
      console.error(error);
    });
  }

  async joinMeeting(meetingId: string, name: string): Promise<any> {
    const url = `${BASE_URL}join?title=${encodeURIComponent(meetingId)}&name=${encodeURIComponent(
      name
    )}`;
    const res = await fetch(url, { method: 'POST' });
    const data = await res.json();
    this.title = data.JoinInfo.Title;
    await this.initializeMeetingSession(
      new MeetingSessionConfiguration(data.JoinInfo.Meeting, data.JoinInfo.Attendee)
    );
    await this.meetingSession.screenShareView.open();
    this.audioVideo.start();
  }

  async endMeeting(): Promise<any> {
    await fetch(`${BASE_URL}end?title=${encodeURIComponent(this.title)}`, {
      method: 'POST',
    });
    this.leaveMeeting();
  }

  leaveMeeting(): void {
    this.stopViewingScreenShare();
    this.meetingSession.screenShareView.close();
    this.audioVideo.stop();
  }

  async getAttendee(attendeeId: string): Promise<string> {
    const response = await fetch(
      `${BASE_URL}attendee?title=${encodeURIComponent(this.title)}&attendee=${encodeURIComponent(
        attendeeId
      )}`
    );
    const json = await response.json();
    return json.AttendeeInfo.Name;
  }

  bindAudioElement(ref: HTMLAudioElement) {
    this.audioVideo.bindAudioElement(ref);
  }

  unbindAudioElement(): void {
    this.audioVideo.unbindAudioElement();
  }
}

export default new MeetingManager();
