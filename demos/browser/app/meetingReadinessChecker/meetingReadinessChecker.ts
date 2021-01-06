// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import '../../style.scss';
import 'bootstrap';

import {
  AsyncScheduler,
  AudioVideoFacade,
  CheckAudioConnectivityFeedback,
  CheckAudioInputFeedback,
  CheckAudioOutputFeedback,
  CheckCameraResolutionFeedback,
  CheckContentShareConnectivityFeedback,
  CheckNetworkTCPConnectivityFeedback,
  CheckNetworkUDPConnectivityFeedback,
  CheckVideoConnectivityFeedback,
  CheckVideoInputFeedback,
  ConsoleLogger,
  DefaultBrowserBehavior,
  DefaultDeviceController,
  DefaultMeetingReadinessChecker,
  DefaultMeetingSession,
  IntervalScheduler,
  Logger,
  LogLevel,
  MeetingReadinessChecker,
  MeetingSession,
  MeetingSessionConfiguration,
  MeetingSessionPOSTLogger,
  MultiLogger,
  Versioning,
} from 'amazon-chime-sdk-js';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { v4: uuidv4 } = require('uuid');

class SwappableLogger implements Logger {
  constructor(public inner: Logger) {}
  debug(debugFunction: string | (() => string)): void {
    this.inner.debug(debugFunction);
  }

  info(msg: string): void {
    this.inner.info(msg);
  }

  error(msg: string): void {
    this.inner.error(msg);
  }

  warn(msg: string): void {
    this.inner.warn(msg);
  }

  setLogLevel(level: LogLevel): void {
    this.inner.setLogLevel(level);
  }

  getLogLevel(): LogLevel {
    return this.inner.getLogLevel();
  }
}

export class DemoMeetingApp {
  static readonly BASE_URL: string = [
    location.protocol,
    '//',
    location.host,
    location.pathname.replace(/\/*$/, '/'),
  ].join('');
  static readonly LOGGER_BATCH_SIZE: number = 85;
  static readonly LOGGER_INTERVAL_MS: number = 2000;

  cameraDeviceIds: string[] = [];
  microphoneDeviceIds: string[] = [];

  meeting: string | null = null;
  name: string | null = null;
  region: string | null = null;
  meetingSession: MeetingSession | null = null;
  audioVideo: AudioVideoFacade | null = null;
  logger: SwappableLogger;
  deviceController: DefaultDeviceController;
  meetingReadinessChecker: MeetingReadinessChecker | null = null;
  canStartLocalVideo: boolean = true;
  defaultBrowserBehaviour: DefaultBrowserBehavior;
  canHear: boolean | null = null;

  // feature flags
  enableWebAudio = false;
  enableUnifiedPlanForChromiumBasedBrowsers = false;
  enableSimulcast = false;

  // eslint-disable-next-line @typescript-eslint/no-var-requires
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

    const logLevel = LogLevel.INFO;
    this.logger = new SwappableLogger(new ConsoleLogger('SDK', logLevel));
  }

  switchToFlow(flow: string): void {
    this.analyserNodeCallback = () => {};
    Array.from(document.getElementsByClassName('flow')).map(
      e => ((e as HTMLDivElement).style.display = 'none')
    );
    (document.getElementById(flow) as HTMLDivElement).style.display = 'block';
  }

  initParameters(): void {
    this.defaultBrowserBehaviour = new DefaultBrowserBehavior();
    // Initialize logger and device controller to populate device list
    new AsyncScheduler().start(
      async (): Promise<void> => {
        await this.initializeDeviceController();
        await this.initializeLogger();
        const button = document.getElementById('authenticate') as HTMLButtonElement;
        button.disabled = false;
      }
    );
  }

  async startMeetingAndInitializeMeetingReadinessChecker(): Promise<string> {
    //start meeting
    let chimeMeetingId = '';
    this.meeting = `READINESS_CHECKER-${uuidv4()}`;
    this.name = `READINESS_CHECKER${uuidv4()}`;
    try {
      this.region = (document.getElementById('inputRegion') as HTMLInputElement).value;
      chimeMeetingId = await this.authenticate();
      this.log(`chimeMeetingId: ${chimeMeetingId}`);
      return chimeMeetingId;
    } catch (error) {
      const httpErrorMessage =
        'UserMedia is not allowed in HTTP sites. Either use HTTPS or enable media capture on insecure sites.';
      (document.getElementById(
        'failed-meeting'
      ) as HTMLDivElement).innerText = `Meeting ID: ${this.meeting}`;
      (document.getElementById('failed-meeting-error') as HTMLDivElement).innerText =
        window.location.protocol === 'http:' ? httpErrorMessage : error.message;
      this.switchToFlow('flow-failed-meeting');
      return null;
    }
  }

  async authenticate(): Promise<string> {
    const joinInfo = (await this.joinMeeting()).JoinInfo;
    const configuration = new MeetingSessionConfiguration(joinInfo.Meeting, joinInfo.Attendee);
    await this.initializeMeetingSession(configuration);
    return configuration.meetingId;
  }

  async createLogStream(configuration: MeetingSessionConfiguration): Promise<void> {
    const body = JSON.stringify({
      meetingId: configuration.meetingId,
      attendeeId: configuration.credentials.attendeeId,
    });
    try {
      const response = await fetch(`${DemoMeetingApp.BASE_URL}create_log_stream`, {
        method: 'POST',
        body,
      });
      if (response.status === 200) {
        console.log('Log stream created');
      }
    } catch (error) {
      console.error(error.message);
    }
  }

  getAudioInputDevice = async (): Promise<MediaDeviceInfo> => {
    const audioInputDevices = await this.deviceController.listAudioInputDevices();
    const dropdownList = document.getElementById('audio-input') as HTMLSelectElement;
    return this.getDevice(audioInputDevices, dropdownList);
  };

  getAudioOutputDevice = async (): Promise<MediaDeviceInfo> => {
    const audioOutputDevices = await this.deviceController.listAudioOutputDevices();
    const dropdownList = document.getElementById('audio-output') as HTMLSelectElement;
    return this.getDevice(audioOutputDevices, dropdownList);
  };

  getVideoInputDevice = async (): Promise<MediaDeviceInfo> => {
    const videoInputDevices = await this.deviceController.listVideoInputDevices();
    const dropdownList = document.getElementById('video-input') as HTMLSelectElement;
    return this.getDevice(videoInputDevices, dropdownList);
  };

  getDevice = async (
    deviceList: MediaDeviceInfo[],
    dropdownList: HTMLSelectElement
  ): Promise<MediaDeviceInfo> => {
    let device = deviceList[0];
    for (let i = 0; i < deviceList.length; i++) {
      if (deviceList[i].deviceId === dropdownList.value) {
        device = deviceList[i];
      }
    }
    return device;
  };

  speakerTest = async (): Promise<void> => {
    const button = document.getElementById('speakertest-button') as HTMLButtonElement;
    button.disabled = false;
  };

  audioTest = async (): Promise<CheckAudioOutputFeedback> => {
    const speakerTestResult = document.getElementById('speaker-test');
    speakerTestResult.style.display = 'inline-block';
    this.createReadinessHtml('speaker-test', 'spinner-border');
    const audioOutput = await this.getAudioOutputDevice();
    const speakerUserFeedbackHtml = document.getElementById('speaker-user-feedback');
    const audioElement = document.getElementById('speaker-test-audio-element') as HTMLAudioElement;
    speakerUserFeedbackHtml.style.display = 'inline-block';

    const audioOutputResp = await this.meetingReadinessChecker.checkAudioOutput(
      audioOutput,
      () => {
        return new Promise(resolve => {
          const scheduler = new IntervalScheduler(1000);
          scheduler.start(() => {
            if (this.canHear !== null) {
              scheduler.stop();
              resolve(this.canHear);
            }
          });
        });
      },
      audioElement
    );

    const textToDisplay = CheckAudioOutputFeedback[audioOutputResp];
    this.createReadinessHtml('speaker-test', textToDisplay);
    speakerUserFeedbackHtml.style.display = 'none';
    return audioOutputResp;
  };

  micTest = async (): Promise<CheckAudioInputFeedback> => {
    this.createReadinessHtml('mic-test', 'spinner-border');
    const audioInput = await this.getAudioInputDevice();
    const audioInputResp = await this.meetingReadinessChecker.checkAudioInput(audioInput);
    this.createReadinessHtml('mic-test', CheckAudioInputFeedback[audioInputResp]);
    return audioInputResp;
  };

  videoTest = async (): Promise<CheckVideoInputFeedback> => {
    this.createReadinessHtml('video-test', 'spinner-border');
    const videoInput = await this.getVideoInputDevice();
    const videoInputResp = await this.meetingReadinessChecker.checkVideoInput(videoInput);
    const textToDisplay = CheckVideoInputFeedback[videoInputResp];
    this.createReadinessHtml('video-test', textToDisplay);
    return videoInputResp;
  };

  cameraTest = async (): Promise<void> => {
    this.createReadinessHtml('camera-test2', 'spinner-border');
    const videoInput = await this.getVideoInputDevice();
    const cameraResolutionResp1 = await this.meetingReadinessChecker.checkCameraResolution(
      videoInput,
      640,
      480
    );
    const cameraResolutionResp2 = await this.meetingReadinessChecker.checkCameraResolution(
      videoInput,
      1280,
      720
    );
    const cameraResolutionResp3 = await this.meetingReadinessChecker.checkCameraResolution(
      videoInput,
      1920,
      1080
    );
    let textToDisplay = `${CheckCameraResolutionFeedback[cameraResolutionResp1]}@640x480p`;
    this.createReadinessHtml('camera-test1', textToDisplay);
    textToDisplay = `${CheckCameraResolutionFeedback[cameraResolutionResp2]}@1280x720p`;
    this.createReadinessHtml('camera-test2', textToDisplay);
    textToDisplay = `${CheckCameraResolutionFeedback[cameraResolutionResp3]}@1920x1080p`;
    this.createReadinessHtml('camera-test3', textToDisplay);
    return;
  };

  contentShareTest = async (): Promise<void> => {
    const button = document.getElementById('contentshare-button') as HTMLButtonElement;
    button.disabled = false;
  };

  audioConnectivityTest = async (): Promise<CheckAudioConnectivityFeedback> => {
    this.createReadinessHtml('audioconnectivity-test', 'spinner-border');
    const audioInput = await this.getAudioInputDevice();
    const audioConnectivityResp = await this.meetingReadinessChecker.checkAudioConnectivity(
      audioInput
    );
    this.createReadinessHtml(
      'audioconnectivity-test',
      CheckAudioConnectivityFeedback[audioConnectivityResp]
    );
    return audioConnectivityResp;
  };

  videoConnectivityTest = async (): Promise<CheckVideoConnectivityFeedback> => {
    this.createReadinessHtml('videoconnectivity-test', 'spinner-border');
    const videoInput = await this.getVideoInputDevice();
    const videoConnectivityResp = await this.meetingReadinessChecker.checkVideoConnectivity(
      videoInput
    );
    this.createReadinessHtml(
      'videoconnectivity-test',
      CheckVideoConnectivityFeedback[videoConnectivityResp]
    );
    return videoConnectivityResp;
  };

  networkTcpTest = async (): Promise<CheckNetworkTCPConnectivityFeedback> => {
    this.createReadinessHtml('networktcp-test', 'spinner-border');
    const networkTcpResp = await this.meetingReadinessChecker.checkNetworkTCPConnectivity();
    this.createReadinessHtml(
      'networktcp-test',
      CheckNetworkTCPConnectivityFeedback[networkTcpResp]
    );
    return networkTcpResp;
  };

  networkUdpTest = async (): Promise<CheckNetworkUDPConnectivityFeedback> => {
    this.createReadinessHtml('networkudp-test', 'spinner-border');
    const networkUdpResp = await this.meetingReadinessChecker.checkNetworkUDPConnectivity();
    this.createReadinessHtml(
      'networkudp-test',
      CheckNetworkUDPConnectivityFeedback[networkUdpResp]
    );
    return networkUdpResp;
  };

  continueTestExecution = async (): Promise<void> => {
    await this.micTest();
    await this.videoTest();
    await this.cameraTest();
    await this.networkUdpTest();
    await this.networkTcpTest();
    await this.audioConnectivityTest();
    await this.videoConnectivityTest();
    await this.contentShareTest();
  };

  createReadinessHtml(id: string, textToDisplay: string): void {
    const readinessElement = document.getElementById(id) as HTMLElement;
    readinessElement.innerHTML = '';
    readinessElement.innerText = textToDisplay;
    if (id === 'readiness-header') {
      return;
    } else if (textToDisplay === 'spinner-border') {
      readinessElement.innerHTML = '';
      readinessElement.className = '';
      readinessElement.className = 'spinner-border';
    } else if (textToDisplay.includes('Succeeded')) {
      readinessElement.className = '';
      readinessElement.className = 'badge badge-success';
    } else {
      readinessElement.className = 'badge badge-warning';
    }
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

    const speakerTestButton = document.getElementById('speakertest-button') as HTMLButtonElement;
    speakerTestButton.addEventListener('click', async () => {
      speakerTestButton.style.display = 'none';
      await this.audioTest();
      speakerTestButton.disabled = true;
      await this.continueTestExecution();
    });

    const contentShareButton = document.getElementById('contentshare-button') as HTMLButtonElement;
    contentShareButton.addEventListener('click', async () => {
      contentShareButton.style.display = 'none';
      const contentShareResult = document.getElementById('contentshare-test');
      contentShareResult.style.display = 'inline-block';
      this.createReadinessHtml('contentshare-test', 'spinner-border');
      const contentShareResp = await this.meetingReadinessChecker.checkContentShareConnectivity();
      this.createReadinessHtml(
        'contentshare-test',
        CheckContentShareConnectivityFeedback[contentShareResp]
      );
      contentShareButton.disabled = true;
      this.createReadinessHtml('readiness-header', 'Readiness tests complete!');
    });

    document.getElementById('form-authenticate').addEventListener('submit', async e => {
      e.preventDefault();
      if (!!(await this.startMeetingAndInitializeMeetingReadinessChecker())) {
        this.switchToFlow('flow-readinesstest');
        //create new HTML header
        (document.getElementById('sdk-version') as HTMLSpanElement).innerText =
          'amazon-chime-sdk-js@' + Versioning.sdkVersion;
        this.createReadinessHtml('readiness-header', 'Readiness tests underway...');
        await this.speakerTest();
      }
    });
  }

  async initializeDeviceController(): Promise<void> {
    this.deviceController = new DefaultDeviceController(this.logger, {
      enableWebAudio: this.enableWebAudio,
    });
    await this.populateAllDeviceLists();
  }

  async initializeLogger(configuration?: MeetingSessionConfiguration): Promise<void> {
    const logLevel = LogLevel.INFO;
    const consoleLogger = new ConsoleLogger('SDK', logLevel);
    if (
      location.hostname === 'localhost' ||
      location.hostname === '127.0.0.1' ||
      !configuration
    ) {
      this.logger.inner = consoleLogger;
    } else {
      await this.createLogStream(configuration);
      this.logger.inner = new MultiLogger(
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
  }

  async initializeMeetingSession(configuration: MeetingSessionConfiguration): Promise<void> {
    await this.initializeLogger(configuration);
    configuration.enableUnifiedPlanForChromiumBasedBrowsers = this.enableUnifiedPlanForChromiumBasedBrowsers;
    configuration.attendeePresenceTimeoutMs = 15000;
    configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = this.enableSimulcast;
    this.meetingSession = new DefaultMeetingSession(
      configuration,
      this.logger,
      this.deviceController
    );
    this.audioVideo = this.meetingSession.audioVideo;
    this.meetingReadinessChecker = new DefaultMeetingReadinessChecker(
      this.logger,
      this.meetingSession
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).meetingReadinessChecker = this.meetingReadinessChecker;

    this.setupDeviceLabelTrigger();
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
      await this.deviceController.listAudioInputDevices(),
      additionalDevices
    );
  }

  async populateVideoInputList(): Promise<void> {
    const genericName = 'Camera';
    const additionalDevices = ['None'];
    this.populateDeviceList(
      'video-input',
      genericName,
      await this.deviceController.listVideoInputDevices(),
      additionalDevices
    );
    const cameras = await this.deviceController.listVideoInputDevices();
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
      await this.deviceController.listAudioOutputDevices(),
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

  getSupportedMediaRegions(): string[] {
    const supportedMediaRegions: string[] = [];
    const mediaRegion = document.getElementById('inputRegion') as HTMLSelectElement;
    for (let i = 0; i < mediaRegion.length; i++) {
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
          const supportedMediaRegions: string[] = this.getSupportedMediaRegions();
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
