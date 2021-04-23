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
  MeetingSessionStatusCode,
  VideoPriorityBasedPolicy,
  VideoPreference,
  VideoPreferences,
  TargetDisplaySize,
} from 'amazon-chime-sdk-js';

export class DemoMeetingApp implements AudioVideoObserver {
  static readonly BASE_URL: string = [location.protocol, '//', location.host, location.pathname.replace(/\/*$/, '/').replace('/v2', '')].join('');
  meeting: string | null = null;
  name: string | null = 'Tester';
  region: string | null = 'us-east-1';
  audioVideo: AudioVideoFacade | null = null;
  meetingSession: MeetingSession | null = null;
  priorityBasedDownlinkPolicy: VideoPriorityBasedPolicy | null = null;

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
    this.priorityBasedDownlinkPolicy = new VideoPriorityBasedPolicy(logger);
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

    const pinVideoTileForm = document.getElementById('pin-video-tile-form') as HTMLFormElement;
    const pinAttendeeId = document.getElementById('pin-attendee-id') as HTMLInputElement;
    pinVideoTileForm.addEventListener('submit', e => {
      e.preventDefault();
      const videoPreferences = VideoPreferences.prepare();
      videoPreferences.add(new VideoPreference(pinAttendeeId.value, 1, TargetDisplaySize.High));
      this.priorityBasedDownlinkPolicy.chooseRemoteVideoSources(videoPreferences.build());
      const videoPreferenceObject = document.getElementById(`video-preference`);
      videoPreferenceObject.innerText = '';
      for (const preference of videoPreferences.build()) {
        videoPreferenceObject.innerText += JSON.stringify(preference, null, '  ');
      }
      pinVideoTileForm.reset();
    });

    const unpinVideoTileForm = document.getElementById('unpin-video-tile-form') as HTMLFormElement;
    const unpinAttendeeId = document.getElementById('unpin-attendee-id') as HTMLInputElement;
    unpinVideoTileForm.addEventListener('submit', e => {
      e.preventDefault();
      const videoPreferences = VideoPreferences.prepare();
      videoPreferences.add(new VideoPreference(unpinAttendeeId.value, 2, TargetDisplaySize.High));
      this.priorityBasedDownlinkPolicy.chooseRemoteVideoSources(videoPreferences.build());
      const videoPreferenceObject = document.getElementById(`video-preference`);
      videoPreferenceObject.innerText = '';
      for (const preference of videoPreferences.build()) {
        videoPreferenceObject.innerText += JSON.stringify(preference, null, '  ');
      }
      unpinVideoTileForm.reset();
    });

    const addVideoTileForm = document.getElementById('add-video-tile-form') as HTMLFormElement;
    addVideoTileForm.addEventListener('submit', e => {
      e.preventDefault();
      const tileId = this.audioVideo.addVideoTile().id();
      let videoTileIdObject = document.getElementById(`video-tile-id`);
      videoTileIdObject.innerText = JSON.stringify(tileId, null, '  ');;
      addVideoTileForm.reset();
    });

    const hasStartedLocalVideoTileForm = document.getElementById('has-started-local-video-tile-form') as HTMLFormElement;
    hasStartedLocalVideoTileForm.addEventListener('submit', e => {
      e.preventDefault();
      const hasStartedLocalVideoTileValue = this.audioVideo.hasStartedLocalVideoTile();
      let hasStartedLocalVideoTileBooleanObject = document.getElementById(`has-started-local-video-tile-boolean`);
      hasStartedLocalVideoTileBooleanObject.innerText = JSON.stringify(hasStartedLocalVideoTileValue, null, '  ');;
      hasStartedLocalVideoTileForm.reset();
    });

    const getLocalVideoTileForm = document.getElementById('get-local-video-tile-form') as HTMLFormElement;
    getLocalVideoTileForm.addEventListener('submit', e => {
      e.preventDefault();
      const localVideoTile = this.audioVideo.getLocalVideoTile().id();
      let videoTileIdObject = document.getElementById(`local-video-tile-id`);
      videoTileIdObject.innerText = JSON.stringify(localVideoTile, null, '  ');;
      getLocalVideoTileForm.reset();
    });

    const getAllVideoTilesForm = document.getElementById('get-all-video-tiles-form') as HTMLFormElement;
    getAllVideoTilesForm.addEventListener('submit', e => {
      e.preventDefault();
      const videoTiles = this.audioVideo.getAllVideoTiles();
      let videoTilesCountObject = document.getElementById(`total-video-tiles-count`);
      videoTilesCountObject.innerText = JSON.stringify(videoTiles.length, null, '  ');;
      getAllVideoTilesForm.reset();
      let videoTilesListObject = document.getElementById(`all-video-tiles`);
      for (const videoTile of videoTiles) {
        videoTilesListObject.innerText += JSON.stringify(videoTile.state(), null, '  ');
      }
    });

    const getAllRemoteVideoTilesForm = document.getElementById('get-all-remote-video-tiles-form') as HTMLFormElement;
    getAllRemoteVideoTilesForm.addEventListener('submit', e => {
      e.preventDefault();
      const totalRemoteVideoTilesCount = this.audioVideo.getAllRemoteVideoTiles().length;
      let remoteVideoTilesCountObject = document.getElementById(`total-remote-video-tiles-count`);
      remoteVideoTilesCountObject.innerText = JSON.stringify(totalRemoteVideoTilesCount, null, '  ');;
      getAllRemoteVideoTilesForm.reset();
    });


    const haveVideoTileForAttendeeIdForm = document.getElementById('have-video-tile-for-attendeeId-form') as HTMLFormElement;
    haveVideoTileForAttendeeIdForm.addEventListener('submit', e => {
      e.preventDefault();
      const attendeeIdInput = document.getElementById('have-video-tile-for-attendee-id') as HTMLInputElement;
      // @ts-ignore
      const haveVideoTileForAttendeeIdValue = this.audioVideo.videoTileController.haveVideoTileForAttendeeId(attendeeIdInput.value);

      let haveVideoTileForAttendeeIdValueObject = document.getElementById(`have-video-tile-for-attendeeId-boolean`);
      haveVideoTileForAttendeeIdValueObject.innerText = JSON.stringify(haveVideoTileForAttendeeIdValue, null, '  ');;
      haveVideoTileForAttendeeIdForm.reset();
    });

    const haveVideoTilesWithStreamsForm = document.getElementById('have-video-tiles-with-streams-form') as HTMLFormElement;
    haveVideoTilesWithStreamsForm.addEventListener('submit', e => {
      e.preventDefault();
      // @ts-ignore
      const haveVideoTilesWithStreamsBoolean = this.audioVideo.videoTileController.haveVideoTilesWithStreams();
      let haveVideoTilesWithStreamsBooleanObject = document.getElementById(`have-video-tiles-with-streams-boolean`);
      haveVideoTilesWithStreamsBooleanObject.innerText = JSON.stringify(haveVideoTilesWithStreamsBoolean, null, '  ');;
      haveVideoTilesWithStreamsForm.reset();
    });

    const removeAllVideoTilesForm = document.getElementById('remove-all-video-tiles-form') as HTMLFormElement;
    removeAllVideoTilesForm.addEventListener('submit', e => {
      e.preventDefault();
      this.audioVideo.removeAllVideoTiles();
      removeAllVideoTilesForm.reset();
      const videoTilesListObject = document.getElementById('video-tiles');
      videoTilesListObject.innerText = '';
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
