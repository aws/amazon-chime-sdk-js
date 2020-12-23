import {
  ConsoleLogger,
  DefaultDeviceController,
  MeetingSessionConfiguration,
  DefaultMeetingSession,
  LogLevel,
  AudioVideoObserver,
  MeetingSessionStatus,
  VideoTileState,
  AudioVideoFacade,
  MeetingSession,
  Versioning,
  MeetingSessionStatusCode
} from 'amazon-chime-sdk-js';

export class DemoMeetingApp implements AudioVideoObserver {
  static readonly BASE_URL: string = [location.protocol, '//', location.host, location.pathname.replace(/\/*$/, '/').replace('/v2', '')].join('');
  meeting: string | null = null;
  name: string | null = 'Tester';
  region: string | null = 'us-east-1';
  audioVideo: AudioVideoFacade | null = null;
  meetingSession: MeetingSession | null = null;

  previousTileState: { [tileId: string]: VideoTileState } = {};

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).app = this;
    try {
      this.initEventListeners();
      document.getElementById('button-container').style.display = 'none'; 
    } catch (error) {
      console.log(error);
      return;
    }
  }

  async authenticate() : Promise<string> {
    let joinInfo = (await this.joinMeeting()).JoinInfo;
    const configuration = new MeetingSessionConfiguration(joinInfo.Meeting, joinInfo.Attendee);
    this.initializeMeetingSession(configuration);
    const url = new URL(window.location.href);
    url.searchParams.set('m', this.meeting);
    history.replaceState({}, `${this.meeting}`, url.toString());
    return configuration.meetingId;
  }

  async initializeMeetingSession(configuration: MeetingSessionConfiguration): Promise<void> {
    let logger = new ConsoleLogger('SDK', LogLevel.INFO);
    const deviceController = new DefaultDeviceController(logger);
    this.meetingSession = new DefaultMeetingSession(configuration, logger, deviceController);
    this.audioVideo = this.meetingSession.audioVideo;
    this.audioVideo.addObserver(this);
    (document.getElementById('sdk-version') as HTMLSpanElement).innerText =
    "amazon-chime-sdk-js@" + Versioning.sdkVersion;

    // We only need the video input for this test app
    const videoInputDevices = await this.audioVideo.listVideoInputDevices();
    await this.audioVideo.chooseAudioInputDevice(null);
    await this.audioVideo.chooseAudioOutputDevice(null);
    const videoInputDeviceInfo = videoInputDevices[0];
    await this.audioVideo.chooseVideoInputDevice(videoInputDeviceInfo.deviceId);
  }


  initEventListeners (): void {
    const joinMeetingForm = document.getElementById('form-join-meeting') as HTMLFormElement;
    joinMeetingForm.addEventListener('submit', async e => {
      e.preventDefault();
      this.meeting = (document.getElementById('inputMeeting') as HTMLInputElement).value;
      this.name = (document.getElementById('inputName') as HTMLInputElement).value;
        let chimeMeetingId = await this.authenticate();
        await this.join();
        (document.getElementById(
          'chime-meeting-id'
        ) as HTMLSpanElement).innerText = `Meeting ID: ${chimeMeetingId}`;
      joinMeetingForm.reset();
    });


    const startLocalVideoButton = document.getElementById('start-local-video');
    startLocalVideoButton.addEventListener('click', async e => {
      try {
        // Defaults to default video device for now
        const videoInputList = await this.audioVideo.listVideoInputDevices();
        const device = videoInputList && videoInputList[0];
        await this.audioVideo.chooseVideoInputDevice(device);
        this.audioVideo.startLocalVideoTile();
      } catch (err) {
        console.error(`no video input device selected: ${err}`);
      }
    });

    const stopLocalVideoButton = document.getElementById('stop-local-video');
    stopLocalVideoButton.addEventListener('click', async e => {
        this.audioVideo.stopLocalVideoTile();
    });

    const bindVideoElementForm = document.getElementById('bind-video-element-form') as HTMLFormElement;
    const bindVideoElementTile = document.getElementById('bind-video-element-tile-id') as HTMLInputElement;
    const bindVideoElementVideoElement = document.getElementById('bind-video-element-video-element') as HTMLInputElement;
    bindVideoElementForm.addEventListener('submit', async e => {
      e.preventDefault();
      this.audioVideo.bindVideoElement(parseInt(bindVideoElementTile.value), document.getElementById(bindVideoElementVideoElement.value) as HTMLVideoElement);
      bindVideoElementForm.reset();
    });

    const unbindVideoElementForm = document.getElementById('unbind-video-element-form') as HTMLFormElement;
    const unbindVideoElementTile = document.getElementById('unbind-video-element-tile-id') as HTMLInputElement;
    unbindVideoElementForm.addEventListener('submit', e => {
      e.preventDefault();
      this.audioVideo.unbindVideoElement(parseInt(unbindVideoElementTile.value));
      unbindVideoElementForm.reset();
    });

  }

  // eslint-disable-next-line
  async joinMeeting(): Promise<any> {
    const response = await fetch(
      `${DemoMeetingApp.BASE_URL}join?title=${encodeURIComponent(this.meeting)}&name=${encodeURIComponent(this.name)}&region=${encodeURIComponent(this.region)}`,
      {
        method: 'POST',
      }
    );
    const json = await response.json();
    if (json.error) {
      throw new Error(`Server error: ${json.error}`);
    }
    return json;
  };

  async join(): Promise<void> {
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      console.error(event.reason);
    });
    this.audioVideo.start();
  };

  audioVideoDidStartConnecting(reconnecting: boolean): void {
    console.log(`AudioVideoDidStartConnecting was called. Reconnecting: ${reconnecting}`);
  };

  audioVideoDidStart(): void {
    console.log('AudioVideoDidStart was called');
    document.getElementById('button-container').style.display = 'block'; 
  };

  audioVideoDidStop(sessionStatus: MeetingSessionStatus): void {
    console.log('AudioVideoDidStop was called');
    const sessionStatusCode = sessionStatus.statusCode();
    if (sessionStatusCode === MeetingSessionStatusCode.Left) {
      console.log('You left the session');
    } 
    else if (sessionStatusCode === MeetingSessionStatusCode.MeetingEnded) {
      console.log('Meeting Ended');
    } else {
      console.log('Stopped with a session status code: ', sessionStatusCode);
    }

    (document.getElementById(
      'chime-meeting-id'
    ) as HTMLSpanElement).innerText = `Meeting ID:`;
    document.getElementById('button-container').style.display = 'none';
  }


  videoTileDidUpdate(tileState: VideoTileState): void {
    console.log(`Video Tile Updated: ${JSON.stringify(tileState, null, '  ')}`);
    if (!tileState.boundAttendeeId) {
      return;
    }

    // Manually parse the element id and stream id, since json stringify wont print out a mediaStream or HTMLVideoElement
    const boundVideoElementId = tileState.boundVideoElement && tileState.boundVideoElement.id;
    const boundVideoStreamId = tileState.boundVideoStream && tileState.boundVideoStream.id;
    const videoTileState = {...tileState, boundVideoElementId: boundVideoElementId, boundVideoStreamId: boundVideoStreamId};
    let videoTileStateObject;
    if (tileState.localTile) {
      videoTileStateObject = document.getElementById(`tile-1-state`);
      videoTileStateObject.innerText = JSON.stringify(videoTileState, null, '  ');
    } else {
      videoTileStateObject = document.getElementById(`tile-2-state`);
      videoTileStateObject.innerText = JSON.stringify(videoTileState, null, '  ');
    }
  };

  videoTileWasRemoved(tileId: number): void {
    const localVideoTileState = document.getElementById('tile-1-state');
    localVideoTileState.innerText = '';
    const remoteVideoTileState = document.getElementById('tile-2-state');
    remoteVideoTileState.innerText = '';
    console.log(`video tileId removed: ${tileId}`);
  }
}

window.addEventListener('load', () => {
  new DemoMeetingApp();
});
