// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import '../../style.scss';
import 'bootstrap';

import {
  MeetingReadinessChecker,
  CheckAudioInputFeedback,
  CheckAudioOutputFeedback,
  CheckCameraResolutionFeedback,
  CheckVideoInputFeedback,
  AsyncScheduler,
  AudioVideoFacade,
  DefaultBrowserBehavior,
  MeetingSession,
  MeetingSessionConfiguration,
  Versioning,
  DefaultMeetingReadinessChecker,
  DefaultMeetingSession,
  DefaultDeviceController,
  MeetingSessionPOSTLogger,
  MultiLogger,
  Logger,
  LogLevel,
  ConsoleLogger,
  CheckVideoConnectivityFeedback,
  CheckContentShareConnectivityFeedback,
  CheckAudioConnectivityFeedback,
  CheckNetworkTCPConnectivityFeedback,
  CheckNetworkUDPConnectivityFeedback, IntervalScheduler,
} from '../../../../src/index';

const { v4: uuidv4 } = require('uuid');

export class DemoMeetingApp {
  static readonly BASE_URL: string = [location.protocol, '//', location.host, location.pathname.replace(/\/*$/, '/')].join('');
  static readonly LOGGER_BATCH_SIZE: number = 85;
  static readonly LOGGER_INTERVAL_MS: number = 2000;

  cameraDeviceIds: string[] = [];
  microphoneDeviceIds: string[] = [];

  meeting: string | null = null;
  name: string | null = null;
  region: string | null = null;
  meetingSession: MeetingSession | null = null;
  audioVideo: AudioVideoFacade | null = null;
  deviceController: DefaultDeviceController;
  meetingReadinessChecker: MeetingReadinessChecker | null = null;
  canStartLocalVideo: boolean = true;
  defaultBrowserBehaviour: DefaultBrowserBehavior;
  canHear: boolean | null = null;

  // feature flags
  enableWebAudio = false;
  enableUnifiedPlanForChromiumBasedBrowsers = false;
  enableSimulcast = false;

  markdown = require('markdown-it')({ linkify: true });
  lastMessageSender: string | null = null;
  lastReceivedMessageTimestamp = 0;
  analyserNodeCallback: () => void;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).app = this;
    (document.getElementById('sdk-version-readiness') as HTMLSpanElement).innerText =
      'amazon-chime-sdk-js@' + Versioning.sdkVersion;
    this.initEventListeners();
    this.initParameters();
    this.setMediaRegion();
    this.switchToFlow('flow-authenticate');
  }

  switchToFlow(flow: string): void {
    this.analyserNodeCallback = () => { };
    Array.from(document.getElementsByClassName('flow')).map(
      e => ((e as HTMLDivElement).style.display = 'none')
    );
    (document.getElementById(flow) as HTMLDivElement).style.display = 'block';
  }

  initParameters(): void {
    this.defaultBrowserBehaviour = new DefaultBrowserBehavior();
    this.meeting = `READINESS_CHECKER-${uuidv4()}`;
    this.name = `READINESS_CHECKER${uuidv4()}`;
    this.region = (document.getElementById('inputRegion') as HTMLInputElement).value;
    //start meeting
    new AsyncScheduler().start(
      async (): Promise<void> => {
        let chimeMeetingId: string = '';

        try {
          chimeMeetingId = await this.authenticate();
          this.log(`chimeMeetingId: ${chimeMeetingId}`);
        } catch (error) {
          return error;
        }
      }
    );
  }

  getAudioInputDevice = async () => {
    const audio_input_devices = await this.deviceController.listAudioInputDevices();
    let audio_input = audio_input_devices[0];
    const dropdown_list = document.getElementById('audio-input') as HTMLSelectElement;
    for(let i=0; i < audio_input_devices.length; i++) {
      if(audio_input_devices[i].deviceId === dropdown_list.value) {
        audio_input = audio_input_devices[i];
      }
    }
    return audio_input;
  };

  getAudioOutputDevice = async () => {
    const audio_output_devices = await this.deviceController.listAudioOutputDevices();
    let audio_output = audio_output_devices[0];
    const dropdown_list = document.getElementById('audio-output') as HTMLSelectElement;
    for(let i = 0; i < audio_output_devices.length; i++) {
      if(audio_output_devices[i].deviceId === dropdown_list.value) {
        audio_output = audio_output_devices[i];
      }
    }
    return audio_output;
  };

  getVideoInputDevice = async () => {
    const video_input_devices = await this.deviceController.listVideoInputDevices();
    let video_input = video_input_devices[0];
    const dropdown_list = document.getElementById('video-input') as HTMLSelectElement;
    for(let i=0; i < video_input_devices.length; i++) {
      if(video_input_devices[i].deviceId === dropdown_list.value) {
        video_input = video_input_devices[i];
      }
    }
    return video_input;
  };

  audioTest = async () => {
    this.createReadinessHtml('speaker-test', 'spinner-border');
    const audio_output = await this.getAudioOutputDevice();
    let speaker_user_feedback_html = document.getElementById('speaker-user-feedback');
    speaker_user_feedback_html.style.display = 'inline-block';


    const audio_output_resp = await this.meetingReadinessChecker.checkAudioOutput(audio_output, () => {
      return new Promise((resolve) => {
        const scheduler = new IntervalScheduler(1000);
        scheduler.start(() => {
          if (this.canHear !== null) {
            scheduler.stop();
            resolve(this.canHear);
          }
        });
      });
    });

    let textToDisplay = CheckAudioOutputFeedback[audio_output_resp];
    this.createReadinessHtml('speaker-test', textToDisplay);
    speaker_user_feedback_html.style.display = 'none';
    return audio_output_resp;
  };

  micTest = async () => {
    this.createReadinessHtml('mic-test', 'spinner-border');
    const audio_input = await this.getAudioInputDevice();
    const audio_input_resp = await this.meetingReadinessChecker.checkAudioInput(audio_input);
    //update HTML element
    this.createReadinessHtml('mic-test', CheckAudioInputFeedback[audio_input_resp])
    return audio_input_resp;
  };

  videoTest = async () => {
    this.createReadinessHtml('video-test', 'spinner-border');
    const video_input = await this.getVideoInputDevice();
    const video_input_resp = await this.meetingReadinessChecker.checkVideoInput(video_input);
    //update HTML element
    let textToDisplay = CheckVideoInputFeedback[video_input_resp];
    this.createReadinessHtml('video-test', textToDisplay)
    return video_input_resp;
  };

  cameraTest = async () => {
    this.createReadinessHtml('camera-test2', 'spinner-border');
    const video_input = await this.getVideoInputDevice();
    const camera_resolution_resp1 = await this.meetingReadinessChecker.checkCameraResolution(video_input,640,480);
    const camera_resolution_resp2 = await this.meetingReadinessChecker.checkCameraResolution(video_input,1280,720);
    const camera_resolution_resp3 = await this.meetingReadinessChecker.checkCameraResolution(video_input,1920,1080);
    //update HTML element
    let textToDisplay = `${CheckCameraResolutionFeedback[camera_resolution_resp1]}@640x480p`;
    this.createReadinessHtml('camera-test1', textToDisplay);
    textToDisplay = `${CheckCameraResolutionFeedback[camera_resolution_resp2]}@1280x720p`;
    this.createReadinessHtml('camera-test2', textToDisplay);
    textToDisplay = `${CheckCameraResolutionFeedback[camera_resolution_resp3]}@1920x1080p`;
    this.createReadinessHtml('camera-test3', textToDisplay);
    return;
  };

  contentShareTest = async () => {
    this.createReadinessHtml('contentshare-test', 'spinner-border');
    const content_share_resp = await this.meetingReadinessChecker.checkContentShareConnectivity();
    this.createReadinessHtml('contentshare-test', CheckContentShareConnectivityFeedback[content_share_resp]);
    return content_share_resp;
  };

  audioConnectivityTest = async () => {
    this.createReadinessHtml('audioconnectivity-test', 'spinner-border');
    const audio_input = await this.getAudioInputDevice();
    const audio_connectivity_resp = await this.meetingReadinessChecker.checkAudioConnectivity(audio_input);
    this.createReadinessHtml('audioconnectivity-test', CheckAudioConnectivityFeedback[audio_connectivity_resp]);
    return audio_connectivity_resp;
  };

  videoConnectivityTest = async () => {
    this.createReadinessHtml('videoconnectivity-test', 'spinner-border');
    let video_input = await this.getVideoInputDevice();
    let video_connectivity_resp = await this.meetingReadinessChecker.checkVideoConnectivity(video_input);
    this.createReadinessHtml('videoconnectivity-test', CheckVideoConnectivityFeedback[video_connectivity_resp]);
    return video_connectivity_resp;
  };

  networkTcpTest = async () => {
    this.createReadinessHtml('networktcp-test', 'spinner-border');
    let network_tcp_resp = await this.meetingReadinessChecker.checkNetworkTCPConnectivity();
    this.createReadinessHtml('networktcp-test', CheckNetworkTCPConnectivityFeedback[network_tcp_resp]);
    return network_tcp_resp;
  };

  networkUdpTest = async () => {
    this.createReadinessHtml('networkudp-test', 'spinner-border');
    let network_udp_resp = await this.meetingReadinessChecker.checkNetworkUDPConnectivity();
    this.createReadinessHtml('networkudp-test', CheckNetworkUDPConnectivityFeedback[network_udp_resp]);
    return network_udp_resp;
  };

  createReadinessHtml(id:string, textToDisplay:string) {
    //update HTML element
    var readinessElement = document.getElementById(id) as HTMLElement;
    readinessElement.innerHTML = '';
    readinessElement.innerText = textToDisplay;
    if(id==='readiness-header') {
      return;
    } else if(textToDisplay==='spinner-border') {
      readinessElement.innerHTML = '';
      readinessElement.className = '';
      readinessElement.className = 'spinner-border';
    }
    else if (textToDisplay.includes('Success')) {
      readinessElement.className = '';
      readinessElement.className = 'badge badge-success';
    } else {
      readinessElement.className = 'badge badge-warning';
    }
  }

  delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }

  initEventListeners(): void {
    //event listener for user feedback for speaker output
    document.getElementById('speaker-yes').addEventListener('input', e => {
      e.preventDefault();
      this.canHear = true;
    });
    document.getElementById('speaker-no').addEventListener('input', e => {
      e.preventDefault();
      this.canHear = false;
    });

    document.getElementById('form-authenticate').addEventListener('submit', async e => {
      e.preventDefault();
      this.switchToFlow('flow-readinesstest');
      //create new HTML header
      (document.getElementById('sdk-version') as HTMLSpanElement).innerText =
      'amazon-chime-sdk-js@' + Versioning.sdkVersion;
      this.createReadinessHtml('readiness-header', "Readiness tests underway...");
      await this.audioTest();
      await this.micTest();
      await this.videoTest();
      await this.cameraTest();
      await this.networkUdpTest();
      await this.networkTcpTest();
      await this.audioConnectivityTest();
      await this.videoConnectivityTest();
      await this.contentShareTest();
      this.createReadinessHtml('readiness-header', "Readiness tests complete!");
      await this.endMeeting();
    });
  }

  showElement(id: string): void {
    (document.getElementById(id) as HTMLDivElement).style.visibility = 'visible';
    return;
  }
  hideElement(id: string): void {
    (document.getElementById(id) as HTMLDivElement).style.visibility = 'hidden';
    return;
  }

  async authenticate(): Promise<string> {
    let joinInfo = (await this.joinMeeting()).JoinInfo;
    const configuration = new MeetingSessionConfiguration(joinInfo.Meeting, joinInfo.Attendee);
    await this.initializeMeetingSession(configuration);
    return configuration.meetingId;
  }

  async initializeMeetingSession(configuration: MeetingSessionConfiguration): Promise<void> {
    let logger: Logger;
    const logLevel = LogLevel.INFO;
    const consoleLogger = (logger = new ConsoleLogger('SDK', logLevel));
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      logger = consoleLogger;
    } else {
      logger = new MultiLogger(
        consoleLogger,
        new MeetingSessionPOSTLogger(
          'SDK',
          configuration,
          DemoMeetingApp.LOGGER_BATCH_SIZE,
          DemoMeetingApp.LOGGER_INTERVAL_MS,
          `${DemoMeetingApp.BASE_URL}logs`,
          logLevel
        )
      );
    }
    this.deviceController = new DefaultDeviceController(logger);
    configuration.enableWebAudio = this.enableWebAudio;
    configuration.enableUnifiedPlanForChromiumBasedBrowsers = this.enableUnifiedPlanForChromiumBasedBrowsers;
    configuration.attendeePresenceTimeoutMs = 15000;
    configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = this.enableSimulcast;
    this.meetingSession = new DefaultMeetingSession(configuration, logger, this.deviceController);
    this.audioVideo = this.meetingSession.audioVideo;
    this.meetingReadinessChecker = new DefaultMeetingReadinessChecker(logger, this.meetingSession);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).meetingReadinessChecker = this.meetingReadinessChecker;

    this.setupDeviceLabelTrigger();
    await this.populateAllDeviceLists();
  }

  setupDeviceLabelTrigger(): void {
    // Note that device labels are privileged since they add to the
    // fingerprinting surface area of the browser session. In Chrome private
    // tabs and in all Firefox tabs, the labels can only be read once a
    // MediaStream is active. How to deal with this restriction depends on the
    // desired UX. The device controller includes an injectable device label
    // trigger which allows you to perform custom behavior in case there are no
    // labels, such as creating a temporary audio/video stream to unlock the
    // device names, which is the default behavior. Here we override the
    // trigger to also show an alert to let the user know that we are asking for
    // mic/camera permission.
    //
    // Also note that Firefox has its own device picker, which may be useful
    // for the first device selection. Subsequent device selections could use
    // a custom UX with a specific device id.
    this.audioVideo.setDeviceLabelTrigger(
      async (): Promise<MediaStream> => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        return stream;
      }
    );
  }

  async populateAllDeviceLists(): Promise<void> {
    await this.populateAudioInputList();
    await this.populateVideoInputList();
    await this.populateAudioOutputList();
  }

  async populateAudioInputList(): Promise<void> {
    const genericName = 'Microphone';
    const additionalDevices = ['None'];
    this.populateDeviceList(
      'audio-input',
      genericName,
      await this.audioVideo.listAudioInputDevices(),
      additionalDevices
    );
  }

  async populateVideoInputList(): Promise<void> {
    const genericName = 'Camera';
    const additionalDevices = ['None'];
    this.populateDeviceList(
      'video-input',
      genericName,
      await this.audioVideo.listVideoInputDevices(),
      additionalDevices
    );
    const cameras = await this.audioVideo.listVideoInputDevices();
    this.cameraDeviceIds = cameras.map(deviceInfo => {
      return deviceInfo.deviceId;
    });
  }

  async populateAudioOutputList(): Promise<void> {
    const genericName = 'Speaker';
    const additionalDevices: string[] = [];
    this.populateDeviceList(
      'audio-output',
      genericName,
      await this.audioVideo.listAudioOutputDevices(),
      additionalDevices
    );
  }

  populateDeviceList(
    elementId: string,
    genericName: string,
    devices: MediaDeviceInfo[],
    additionalOptions: string[]
  ): void {
    const list = document.getElementById(elementId) as HTMLSelectElement;
    while (list.firstElementChild) {
      list.removeChild(list.firstElementChild);
    }
    for (let i = 0; i < devices.length; i++) {
      const option = document.createElement('option');
      list.appendChild(option);
      option.text = devices[i].label || `${genericName} ${i + 1}`;
      option.value = devices[i].deviceId;
    }
    if (additionalOptions.length > 0) {
      const separator = document.createElement('option');
      separator.disabled = true;
      separator.text = '──────────';
      list.appendChild(separator);
      for (const additionalOption of additionalOptions) {
        const option = document.createElement('option');
        list.appendChild(option);
        option.text = additionalOption;
        option.value = additionalOption;
      }
    }
    if (!list.firstElementChild) {
      const option = document.createElement('option');
      option.text = 'Device selection unavailable';
      list.appendChild(option);
    }
  }

  async join(): Promise<void> {
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      this.log(event.reason);
    });
    this.audioVideo.start();
  }
  // eslint-disable-next-line
  async joinMeeting(): Promise<any> {
    const response = await fetch(
      `${DemoMeetingApp.BASE_URL}join?title=${encodeURIComponent(
        this.meeting
      )}&name=${encodeURIComponent(this.name)}&region=${encodeURIComponent(this.region)}`,
      {
        method: 'POST',
      }
    );
    const json = await response.json();
    if (json.error) {
      throw new Error(`Server error: ${json.error}`);
    }
    return json;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async endMeeting(): Promise<any> {
    await fetch(`${DemoMeetingApp.BASE_URL}end?title=${encodeURIComponent(this.meeting)}`, {
      method: 'POST',
    });
  }

  getSupportedMediaRegions(): Array<string> {
    const supportedMediaRegions: Array<string> = [];
    const mediaRegion = document.getElementById('inputRegion') as HTMLSelectElement;
    for (var i = 0; i < mediaRegion.length; i++) {
      supportedMediaRegions.push(mediaRegion.value);
    }
    return supportedMediaRegions;
  }

  async getNearestMediaRegion(): Promise<string> {
    const nearestMediaRegionResponse = await fetch(`https://nearest-media-region.l.chime.aws`, {
      method: 'GET',
    });
    const nearestMediaRegionJSON = await nearestMediaRegionResponse.json();
    const nearestMediaRegion = nearestMediaRegionJSON.region;
    return nearestMediaRegion;
  }

  setMediaRegion(): void {
    new AsyncScheduler().start(
      async (): Promise<void> => {
        try {
          const nearestMediaRegion = await this.getNearestMediaRegion();
          if (nearestMediaRegion === '' || nearestMediaRegion === null) {
            throw new Error('Nearest Media Region cannot be null or empty');
          }
          const supportedMediaRegions: Array<string> = this.getSupportedMediaRegions();
          if (supportedMediaRegions.indexOf(nearestMediaRegion) === -1) {
            supportedMediaRegions.push(nearestMediaRegion);
            const mediaRegionElement = document.getElementById('inputRegion') as HTMLSelectElement;
            const newMediaRegionOption = document.createElement('option');
            newMediaRegionOption.value = nearestMediaRegion;
            newMediaRegionOption.text = nearestMediaRegion + ' (' + nearestMediaRegion + ')';
            mediaRegionElement.add(newMediaRegionOption, null);
          }
          (document.getElementById('inputRegion') as HTMLInputElement).value = nearestMediaRegion;
        } catch (error) {
          this.log('Default media region selected: ' + error.message);
        }
      }
    );
  }

  log(str: string): void {
    console.log(`[Meeting Readiness Checker] ${str}`);
  }
}
window.addEventListener('load', () => {
  new DemoMeetingApp();
});
