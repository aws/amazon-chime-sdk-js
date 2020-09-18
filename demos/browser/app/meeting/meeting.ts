// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import '../../style.scss';
import 'bootstrap';

import {
  AsyncScheduler,
  AudioVideoFacade,
  AudioVideoObserver,
  ClientMetricReport,
  ConsoleLogger,
  DefaultActiveSpeakerPolicy,
  DefaultAudioMixController,
  DefaultDeviceController,
  DefaultMeetingSession,
  Device,
  DeviceChangeObserver,
  LogLevel,
  Logger,
  MeetingSession,
  MeetingSessionConfiguration,
  MeetingSessionPOSTLogger,
  MeetingSessionStatus,
  MeetingSessionStatusCode,
  MeetingSessionVideoAvailability,
  ScreenMessageDetail,
  ScreenShareFacadeObserver,
  TimeoutScheduler,
  Versioning,
  VideoTileState,
  ClientVideoStreamReceivingReport,
} from '../../../../src/index';

class DemoTileOrganizer {
  public static MAX_TILES = 16;
  private tiles: { [id: number]: number } = {};
  public tileStates: {[id: number]: boolean } = {};

  acquireTileIndex(tileId: number): number {
    for (let index = 0; index < DemoTileOrganizer.MAX_TILES; index++) {
      if (this.tiles[index] === tileId) {
        return index;
      }
    }
    for (let index = 0; index < DemoTileOrganizer.MAX_TILES; index++) {
      if (!(index in this.tiles)) {
        this.tiles[index] = tileId;
        return index;
      }
    }
    throw new Error('no tiles are available');
  }

  releaseTileIndex(tileId: number): number {
    for (let index = 0; index < DemoTileOrganizer.MAX_TILES; index++) {
      if (this.tiles[index] === tileId) {
        delete this.tiles[index];
        return index;
      }
    }
    return DemoTileOrganizer.MAX_TILES;
  }
}

class TestSound {
  constructor(
    sinkId: string | null,
    frequency: number = 440,
    durationSec: number = 1,
    rampSec: number = 0.1,
    maxGainValue: number = 0.1
  ) {
    // @ts-ignore
    const audioContext: AudioContext = new (window.AudioContext || window.webkitAudioContext)();
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0;
    const oscillatorNode = audioContext.createOscillator();
    oscillatorNode.frequency.value = frequency;
    oscillatorNode.connect(gainNode);
    const destinationStream = audioContext.createMediaStreamDestination();
    gainNode.connect(destinationStream);
    const currentTime = audioContext.currentTime;
    const startTime = currentTime + 0.1;
    gainNode.gain.linearRampToValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(maxGainValue, startTime + rampSec);
    gainNode.gain.linearRampToValueAtTime(maxGainValue, startTime + rampSec + durationSec);
    gainNode.gain.linearRampToValueAtTime(0, startTime + rampSec * 2 + durationSec);
    oscillatorNode.start();
    const audioMixController = new DefaultAudioMixController();
    // @ts-ignore
    audioMixController.bindAudioDevice({ deviceId: sinkId });
    audioMixController.bindAudioElement(new Audio());
    audioMixController.bindAudioStream(destinationStream.stream);
    new TimeoutScheduler((rampSec * 2 + durationSec + 1) * 1000).start(() => {
      audioContext.close();
    });
  }
}

export class DemoMeetingApp implements AudioVideoObserver, DeviceChangeObserver {
  static readonly DID: string = '+17035550122';
  static readonly BASE_URL: string = [location.protocol, '//', location.host, location.pathname.replace(/\/*$/, '/')].join('');
  static readonly LOGGER_BATCH_SIZE: number = 85;
  static readonly LOGGER_INTERVAL_MS: number = 2000;

  showActiveSpeakerScores = false;
  activeSpeakerLayout = true;
  meeting: string | null = null;
  name: string | null = null;
  voiceConnectorId: string | null = null;
  sipURI: string | null = null;
  region: string | null = null;
  meetingSession: MeetingSession | null = null;
  audioVideo: AudioVideoFacade | null = null;
  tileOrganizer: DemoTileOrganizer = new DemoTileOrganizer();
  canStartLocalVideo: boolean = true;
  // eslint-disable-next-line
  roster: any = {};
  tileIndexToTileId: { [id: number]: number } = {};
  tileIdToTileIndex: { [id: number]: number } = {};

  cameraDeviceIds: string[] = [];
  microphoneDeviceIds: string[] = [];

  buttonStates: { [key: string]: boolean } = {
    'button-microphone': true,
    'button-camera': false,
    'button-speaker': true,
    'button-screen-share': false,
    'button-screen-view': false,
    'button-pause-screen-share': false,
  };

  // feature flags
  enableWebAudio = false;
  enableUnifiedPlanForChromiumBasedBrowsers = true;
  enableSimulcast = false;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).app = this;
    this.switchToFlow('flow-authenticate');
    (document.getElementById('sdk-version') as HTMLSpanElement).innerText =
      "amazon-chime-sdk-js@" + Versioning.sdkVersion;
    this.initEventListeners();
    this.initParameters();
    this.setMediaRegion();
    this.setUpVideoTileElementResizer();
  }

  initParameters(): void {
    const meeting = new URL(window.location.href).searchParams.get('m');
    if (meeting) {
      (document.getElementById('inputMeeting') as HTMLInputElement).value = meeting;
      (document.getElementById('inputName') as HTMLInputElement).focus();
    } else {
      (document.getElementById('inputMeeting') as HTMLInputElement).focus();
    }
  }

  initEventListeners(): void {
    window.addEventListener('resize', () => {
      this.layoutVideoTiles();
    });

    document.getElementById('form-authenticate').addEventListener('submit', e => {
      e.preventDefault();
      this.meeting = (document.getElementById('inputMeeting') as HTMLInputElement).value;
      this.name = (document.getElementById('inputName') as HTMLInputElement).value;
      this.region = (document.getElementById('inputRegion') as HTMLInputElement).value;
      new AsyncScheduler().start(
        async (): Promise<void> => {
          this.showProgress('progress-authenticate');
          let chimeMeetingId: string = '';
          try {
            chimeMeetingId = await this.authenticate();
          } catch (error) {
            (document.getElementById(
              'failed-meeting'
            ) as HTMLDivElement).innerText = `Meeting ID: ${this.meeting}`;
            (document.getElementById('failed-meeting-error') as HTMLDivElement).innerText =
              error.message;
            this.switchToFlow('flow-failed-meeting');
            return;
          }
          (document.getElementById(
            'meeting-id'
          ) as HTMLSpanElement).innerText = `${this.meeting} (${this.region})`;
          (document.getElementById(
            'chime-meeting-id'
          ) as HTMLSpanElement).innerText = `${chimeMeetingId}`;
          (document.getElementById('info-meeting') as HTMLSpanElement).innerText = this.meeting;
          (document.getElementById('info-name') as HTMLSpanElement).innerText = this.name;
          this.switchToFlow('flow-devices');
          await this.openAudioInputFromSelection();
          try {
            await this.openVideoInputFromSelection(
              (document.getElementById('video-input') as HTMLSelectElement).value,
              true
            );
          } catch (err) {
            this.log('no video input device selected');
          }
          await this.openAudioOutputFromSelection();
          this.hideProgress('progress-authenticate');
        }
      );
    });

    document.getElementById('to-sip-flow').addEventListener('click', e => {
      e.preventDefault();
      this.switchToFlow('flow-sip-authenticate');
    });

    document.getElementById('form-sip-authenticate').addEventListener('submit', e => {
      e.preventDefault();
      this.meeting = (document.getElementById('sip-inputMeeting') as HTMLInputElement).value;
      this.voiceConnectorId = (document.getElementById(
        'voiceConnectorId'
      ) as HTMLInputElement).value;

      new AsyncScheduler().start(
        async (): Promise<void> => {
          this.showProgress('progress-authenticate');
          try {
            const region = this.region || 'us-east-1';
            const response = await fetch(
              `${DemoMeetingApp.BASE_URL}join?title=${encodeURIComponent(this.meeting)}&name=${encodeURIComponent(DemoMeetingApp.DID)}&region=${encodeURIComponent(region)}`,
              {
                method: 'POST',
              }
            );
            const json = await response.json();
            const joinToken = json.JoinInfo.Attendee.Attendee.JoinToken;
            this.sipURI = `sip:${DemoMeetingApp.DID}@${this.voiceConnectorId};transport=tls;X-joinToken=${joinToken}`;
            this.switchToFlow('flow-sip-uri');
          } catch (error) {
            (document.getElementById(
              'failed-meeting'
            ) as HTMLDivElement).innerText = `Meeting ID: ${this.meeting}`;
            (document.getElementById('failed-meeting-error') as HTMLDivElement).innerText =
              error.message;
            this.switchToFlow('flow-failed-meeting');
            return;
          }
          const sipUriElement = document.getElementById('sip-uri') as HTMLInputElement;
          sipUriElement.value = this.sipURI;
          this.hideProgress('progress-authenticate');
        }
      );
    });

    document.getElementById('copy-sip-uri').addEventListener('click', () => {
      const sipUriElement = document.getElementById('sip-uri') as HTMLInputElement;
      sipUriElement.select();
      document.execCommand('copy');
    });

    const audioInput = document.getElementById('audio-input') as HTMLSelectElement;
    audioInput.addEventListener('change', async (_ev: Event) => {
      this.log('audio input device is changed');
      await this.openAudioInputFromSelection();
    });

    const videoInput = document.getElementById('video-input') as HTMLSelectElement;
    videoInput.addEventListener('change', async (_ev: Event) => {
      this.log('video input device is changed');
      try {
        await this.openVideoInputFromSelection(videoInput.value, true);
      } catch (err) {
        this.log('no video input device selected');
      }
    });

    const videoInputQuality = document.getElementById('video-input-quality') as HTMLSelectElement;
    videoInputQuality.addEventListener('change', async (_ev: Event) => {
      this.log('Video input quality is changed');
      switch (videoInputQuality.value) {
        case '360p':
          this.audioVideo.chooseVideoInputQuality(640, 360, 15, 600);
          break;
        case '540p':
          this.audioVideo.chooseVideoInputQuality(960, 540, 15, 1400);
          break;
        case '720p':
          this.audioVideo.chooseVideoInputQuality(1280, 720, 15, 1400);
          break;
      }
      try {
        await this.openVideoInputFromSelection(videoInput.value, true);
      } catch (err) {
        this.log('no video input device selected');
      }
    });

    const optionalFeatures = document.getElementById('optional-features') as HTMLSelectElement;
    optionalFeatures.addEventListener('change', async (_ev: Event) => {
      const collections = optionalFeatures.selectedOptions;
      this.enableSimulcast = false;
      this.enableWebAudio = false;
      for (let i = 0; i < collections.length; i++) {
        // hard code magic
        if (collections[i].label === 'simulcast') {
          this.enableSimulcast = true;
        }
        if (collections[i].label === 'webaudio') {
          this.enableWebAudio = true;
        }
      }
    });

    const audioOutput = document.getElementById('audio-output') as HTMLSelectElement;
    audioOutput.addEventListener('change', async (_ev: Event) => {
      this.log('audio output device is changed');
      await this.openAudioOutputFromSelection();
    });

    document.getElementById('button-test-sound').addEventListener('click', e => {
      e.preventDefault();
      const audioOutput = document.getElementById('audio-output') as HTMLSelectElement;
      new TestSound(audioOutput.value);
    });

    document.getElementById('form-devices').addEventListener('submit', e => {
      e.preventDefault();
      new AsyncScheduler().start(async () => {
        try {
          this.showProgress('progress-join');
          await this.join();
          this.audioVideo.stopVideoPreviewForVideoInput(document.getElementById(
            'video-preview'
          ) as HTMLVideoElement);
          this.audioVideo.chooseVideoInputDevice(null);
          this.hideProgress('progress-join');
          this.displayButtonStates();
          this.switchToFlow('flow-meeting');
        } catch (error) {
          document.getElementById('failed-join').innerText = `Meeting ID: ${this.meeting}`;
          document.getElementById('failed-join-error').innerText = `Error: ${error.message}`;
        }
      });
    });

    const buttonMute = document.getElementById('button-microphone');
    buttonMute.addEventListener('mousedown', _e => {
      if (this.toggleButton('button-microphone')) {
        this.audioVideo.realtimeUnmuteLocalAudio();
      } else {
        this.audioVideo.realtimeMuteLocalAudio();
      }
    });

    const buttonVideo = document.getElementById('button-camera');
    buttonVideo.addEventListener('click', _e => {
      new AsyncScheduler().start(async () => {
        if (this.toggleButton('button-camera') && this.canStartLocalVideo) {
          try {
            let camera: string = videoInput.value;
            if (videoInput.value === 'None') {
              camera = this.cameraDeviceIds.length ? this.cameraDeviceIds[0] : 'None';
            }
            await this.openVideoInputFromSelection(camera, false);
            this.audioVideo.startLocalVideoTile();
          } catch (err) {
            this.log('no video input device selected');
          }
        } else {
          this.audioVideo.stopLocalVideoTile();
          this.hideTile(16);
        }
      });
    });

    const buttonScreenShare = document.getElementById('button-screen-share');
    buttonScreenShare.addEventListener('click', () => {
      new AsyncScheduler().start(async () => {
        const button1 = 'button-screen-share';
        const button2 = 'button-pause-screen-share';
        if (this.buttonStates[button1]) {
          this.meetingSession.screenShare.stop()
            .catch(error => {
              this.log(error);
            })
            .finally(() => {
              this.buttonStates[button1] = false;
              this.buttonStates[button2] = false;
              this.displayButtonStates();
            });
        } else {
          const self = this;
          const observer: ScreenShareFacadeObserver = {
            didStopScreenSharing(): void {
              self.buttonStates[button1] = false;
              self.buttonStates[button2] = false;
              self.displayButtonStates();
            },
          };
          this.meetingSession.screenShare.registerObserver(observer);
          this.meetingSession.screenShare.start().then(() => {
            this.buttonStates[button1] = true;
            this.displayButtonStates();
          });
        }
      });
    });

    const buttonPauseScreenShare = document.getElementById('button-pause-screen-share');
    buttonPauseScreenShare.addEventListener('click', () => {
      new AsyncScheduler().start(async () => {
        const button = 'button-pause-screen-share';
        if (this.buttonStates[button]) {
          this.meetingSession.screenShare.unpause().then(() => {
            this.buttonStates[button] = false;
            this.displayButtonStates();
          });
        } else {
          const self = this;
          const observer: ScreenShareFacadeObserver = {
            didUnpauseScreenSharing(): void {
              self.buttonStates[button] = false;
              self.displayButtonStates();
            },
          };
          this.meetingSession.screenShare.registerObserver(observer);
          this.meetingSession.screenShare.pause().then(() => {
            this.buttonStates[button] = true;
            this.displayButtonStates();
          }).catch(error => {
            this.log(error);
          });
        }
      });
    });

    const buttonSpeaker = document.getElementById('button-speaker');
    buttonSpeaker.addEventListener('click', _e => {
      new AsyncScheduler().start(async () => {
        if (this.toggleButton('button-speaker')) {
          this.audioVideo.bindAudioElement(document.getElementById(
            'meeting-audio'
          ) as HTMLAudioElement);
        } else {
          this.audioVideo.unbindAudioElement();
        }
      });
    });

    const buttonScreenView = document.getElementById('button-screen-view');
    buttonScreenView.addEventListener('click', _e => {
      new AsyncScheduler().start(async () => {
        if (this.toggleButton('button-screen-view')) {
          const screenViewDiv = document.getElementById('tile-17') as HTMLDivElement;
          screenViewDiv.style.display = 'block';
          this.meetingSession.screenShareView.start(screenViewDiv);
        } else {
          this.meetingSession.screenShareView.stop()
            .catch(error => {
              this.log(error);
            })
            .finally(() => this.hideTile(17));
        }
        this.layoutVideoTiles();
      });
    });

    const buttonMeetingEnd = document.getElementById('button-meeting-end');
    buttonMeetingEnd.addEventListener('click', _e => {
      const confirmEnd = (new URL(window.location.href).searchParams.get('confirm-end')) === 'true';
      const prompt = 'Are you sure you want to end the meeting for everyone? The meeting cannot be used after ending it.';
      if (confirmEnd && !window.confirm(prompt)) {
        return;
      }
      new AsyncScheduler().start(async () => {
        (buttonMeetingEnd as HTMLButtonElement).disabled = true;
        await this.endMeeting();
        this.leave();
        (buttonMeetingEnd as HTMLButtonElement).disabled = false;
        // @ts-ignore
        window.location = window.location.pathname;
      });
    });

    const buttonMeetingLeave = document.getElementById('button-meeting-leave');
    buttonMeetingLeave.addEventListener('click', _e => {
      new AsyncScheduler().start(async () => {
        (buttonMeetingLeave as HTMLButtonElement).disabled = true;
        this.leave();
        (buttonMeetingLeave as HTMLButtonElement).disabled = false;
        // @ts-ignore
        window.location = window.location.pathname;
      });
    });
  }

  setUpVideoTileElementResizer(): void {
    for (let i = 0; i <= DemoTileOrganizer.MAX_TILES; i++) {
      const videoElem = document.getElementById(`video-${i}`) as HTMLVideoElement;
      videoElem.onresize = () => {
        if (videoElem.videoHeight > videoElem.videoWidth) {
          // portrait mode
          this.log(`video-${i} changed to portrait mode resolution ${videoElem.videoWidth}x${videoElem.videoHeight}`);
          videoElem.style.objectFit = 'contain';
        } else {
          videoElem.style.objectFit = 'cover';
        }
      };
    }
  }

  getSupportedMediaRegions(): Array<string> {
    const supportedMediaRegions: Array<string> = [];
    const mediaRegion = (document.getElementById("inputRegion")) as HTMLSelectElement;
    for (var i = 0; i < mediaRegion.length; i++) {
      supportedMediaRegions.push(mediaRegion.value);
    }
    return supportedMediaRegions;
  }

  async getNearestMediaRegion(): Promise<string> {
    const nearestMediaRegionResponse = await fetch(
      `https://nearest-media-region.l.chime.aws`,
      {
        method: 'GET',
      }
    );
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
          if (supportedMediaRegions.indexOf(nearestMediaRegion) === -1 ) {
            supportedMediaRegions.push(nearestMediaRegion);
            const mediaRegionElement = (document.getElementById("inputRegion")) as HTMLSelectElement;
            const newMediaRegionOption = document.createElement("option");
            newMediaRegionOption.value = nearestMediaRegion;
            newMediaRegionOption.text = nearestMediaRegion + " (" + nearestMediaRegion + ")";
            mediaRegionElement.add(newMediaRegionOption, null);
          }
          (document.getElementById('inputRegion') as HTMLInputElement).value = nearestMediaRegion;
        } catch (error) {
          this.log('Default media region selected: ' + error.message);
        }
      });
  }

  toggleButton(button: string, state?: 'on' | 'off'): boolean {
    if (state === 'on') {
      this.buttonStates[button] = true;
    } else if (state === 'off') {
      this.buttonStates[button] = false;
    } else {
      this.buttonStates[button] = !this.buttonStates[button];
    }
    this.displayButtonStates();
    return this.buttonStates[button];
  }

  displayButtonStates(): void {
    for (const button in this.buttonStates) {
      const element = document.getElementById(button);
      const drop = document.getElementById(`${button}-drop`);
      const on = this.buttonStates[button];
      element.classList.add(on ? 'btn-success' : 'btn-outline-secondary');
      element.classList.remove(on ? 'btn-outline-secondary' : 'btn-success');
      (element.firstElementChild as SVGElement).classList.add(on ? 'svg-active' : 'svg-inactive');
      (element.firstElementChild as SVGElement).classList.remove(
        on ? 'svg-inactive' : 'svg-active'
      );
      if (drop) {
        drop.classList.add(on ? 'btn-success' : 'btn-outline-secondary');
        drop.classList.remove(on ? 'btn-outline-secondary' : 'btn-success');
      }
    }
  }

  showProgress(id: string): void {
    (document.getElementById(id) as HTMLDivElement).style.visibility = 'visible';
  }

  hideProgress(id: string): void {
    (document.getElementById(id) as HTMLDivElement).style.visibility = 'hidden';
  }

  switchToFlow(flow: string): void {
    this.analyserNodeCallback = () => {};
    Array.from(document.getElementsByClassName('flow')).map(
      e => ((e as HTMLDivElement).style.display = 'none')
    );
    (document.getElementById(flow) as HTMLDivElement).style.display = 'block';
  }

  audioInputsChanged(_freshAudioInputDeviceList: MediaDeviceInfo[]): void {
    this.populateAudioInputList();
  }

  videoInputsChanged(_freshVideoInputDeviceList: MediaDeviceInfo[]): void {
    this.populateVideoInputList();
  }

  audioOutputsChanged(_freshAudioOutputDeviceList: MediaDeviceInfo[]): void {
    this.populateAudioOutputList();
  }

  estimatedDownlinkBandwidthLessThanRequired(estimatedDownlinkBandwidthKbps: number, requiredVideoDownlinkBandwidthKbps: number ): void {
    this.log(`Estimated downlink bandwidth is ${estimatedDownlinkBandwidthKbps} is less than required bandwidth for video ${requiredVideoDownlinkBandwidthKbps}`);
  }

  videoNotReceivingEnoughData(videoReceivingReports: ClientVideoStreamReceivingReport[]): void {
    this.log(`One or more video streams are not receiving expected amounts of data ${JSON.stringify(videoReceivingReports)}`);
  }

  metricsDidReceive(clientMetricReport: ClientMetricReport): void {
    const metricReport = clientMetricReport.getObservableMetrics();
    if (typeof metricReport.availableSendBandwidth === 'number' && !isNaN(metricReport.availableSendBandwidth)) {
      (document.getElementById('video-uplink-bandwidth') as HTMLSpanElement).innerText =
        'Available Uplink Bandwidth: ' + String(metricReport.availableSendBandwidth / 1000) + ' Kbps';
    } else if (typeof metricReport.availableOutgoingBitrate === 'number' && !isNaN(metricReport.availableOutgoingBitrate)) {
      (document.getElementById('video-uplink-bandwidth') as HTMLSpanElement).innerText =
      'Available Uplink Bandwidth: ' + String(metricReport.availableOutgoingBitrate / 1000) + ' Kbps';
    } else {
      (document.getElementById('video-uplink-bandwidth') as HTMLSpanElement).innerText =
      'Available Uplink Bandwidth: Unknown';
    }

    if (typeof metricReport.availableReceiveBandwidth === 'number' && !isNaN(metricReport.availableReceiveBandwidth)) {
      (document.getElementById('video-downlink-bandwidth') as HTMLSpanElement).innerText =
        'Available Downlink Bandwidth: ' + String(metricReport.availableReceiveBandwidth / 1000) + ' Kbps';
    } else if (typeof metricReport.availableIncomingBitrate === 'number' && !isNaN(metricReport.availableIncomingBitrate)) {
      (document.getElementById('video-downlink-bandwidth') as HTMLSpanElement).innerText =
      'Available Downlink Bandwidth: ' + String(metricReport.availableIncomingBitrate / 1000) + ' Kbps';
    } else {
      (document.getElementById('video-downlink-bandwidth') as HTMLSpanElement).innerText =
        'Available Downlink Bandwidth: Unknown';
    }
  }

  async initializeMeetingSession(configuration: MeetingSessionConfiguration): Promise<void> {
    let logger: Logger;
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      logger = new ConsoleLogger('SDK', LogLevel.INFO);
    } else {
      logger = new MeetingSessionPOSTLogger(
        'SDK',
        configuration,
        DemoMeetingApp.LOGGER_BATCH_SIZE,
        DemoMeetingApp.LOGGER_INTERVAL_MS,
        `${DemoMeetingApp.BASE_URL}logs`,
        LogLevel.INFO
      );
    }
    const deviceController = new DefaultDeviceController(logger);
    configuration.enableWebAudio = this.enableWebAudio;
    configuration.enableUnifiedPlanForChromiumBasedBrowsers = this.enableUnifiedPlanForChromiumBasedBrowsers;
    configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = this.enableSimulcast;
    this.meetingSession = new DefaultMeetingSession(configuration, logger, deviceController);
    this.audioVideo = this.meetingSession.audioVideo;

    this.audioVideo.addDeviceChangeObserver(this);
    this.setupDeviceLabelTrigger();
    await this.populateAllDeviceLists();
    this.setupMuteHandler();
    this.setupCanUnmuteHandler();
    this.setupSubscribeToAttendeeIdPresenceHandler();
    this.setupScreenViewing();
    this.audioVideo.addObserver(this);
  }

  setClickHandler(elementId: string, f: () => void): void {
    document.getElementById(elementId).addEventListener('click', () => {
      f();
    });
  }

  async join(): Promise<void> {
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      this.log(event.reason);
    });
    await this.openAudioInputFromSelection();
    await this.openAudioOutputFromSelection();
    this.audioVideo.start();
    await this.meetingSession.screenShare.open();
    await this.meetingSession.screenShareView.open();
  }

  leave(): void {
    this.meetingSession.screenShare
      .stop()
      .catch(() => {})
      .finally(() => {
        return this.meetingSession.screenShare.close();
      });
    this.meetingSession.screenShareView.close();
    this.audioVideo.stop();
    this.roster = {};
  }

  setupMuteHandler(): void {
    const handler = (isMuted: boolean): void => {
      this.log(`muted = ${isMuted}`);
    };
    this.audioVideo.realtimeSubscribeToMuteAndUnmuteLocalAudio(handler);
    const isMuted = this.audioVideo.realtimeIsLocalAudioMuted();
    handler(isMuted);
  }

  setupCanUnmuteHandler(): void {
    const handler = (canUnmute: boolean): void => {
      this.log(`canUnmute = ${canUnmute}`);
    };
    this.audioVideo.realtimeSubscribeToSetCanUnmuteLocalAudio(handler);
    handler(this.audioVideo.realtimeCanUnmuteLocalAudio());
  }

  updateRoster(): void {
    const roster = document.getElementById('roster');
    const newRosterCount = Object.keys(this.roster).length;
    while (roster.getElementsByTagName('li').length < newRosterCount) {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.appendChild(document.createElement('span'));
      li.appendChild(document.createElement('span'));
      roster.appendChild(li);
    }
    while (roster.getElementsByTagName('li').length > newRosterCount) {
      roster.removeChild(roster.getElementsByTagName('li')[0]);
    }
    const entries = roster.getElementsByTagName('li');
    let i = 0;
    for (const attendeeId in this.roster) {
      const spanName = entries[i].getElementsByTagName('span')[0];
      const spanStatus = entries[i].getElementsByTagName('span')[1];
      let statusClass = 'badge badge-pill ';
      let statusText = '\xa0'; // &nbsp
      if (this.roster[attendeeId].signalStrength < 1) {
        statusClass += 'badge-warning';
      } else if (this.roster[attendeeId].signalStrength === 0) {
        statusClass += 'badge-danger';
      } else if (this.roster[attendeeId].muted) {
        statusText = 'MUTED';
        statusClass += 'badge-secondary';
      } else if (this.roster[attendeeId].active) {
        statusText = 'SPEAKING';
        statusClass += 'badge-success';
      } else if (this.roster[attendeeId].volume > 0) {
        statusClass += 'badge-success';
      }
      this.updateProperty(spanName, 'innerText', this.roster[attendeeId].name);
      this.updateProperty(spanStatus, 'innerText', statusText);
      this.updateProperty(spanStatus, 'className', statusClass);
      i++;
    }
  }

  updateProperty(obj: any, key: string, value: string) {
    if (value !== undefined && obj[key] !== value) {
      obj[key] = value;
    }
  }

  setupSubscribeToAttendeeIdPresenceHandler(): void {
    const handler = (attendeeId: string, present: boolean): void => {
      this.log(`${attendeeId} present = ${present}`);
      if (!present) {
        delete this.roster[attendeeId];
        this.updateRoster();
        return;
      }
      this.audioVideo.realtimeSubscribeToVolumeIndicator(
        attendeeId,
        async (
          attendeeId: string,
          volume: number | null,
          muted: boolean | null,
          signalStrength: number | null,
          externalUserId: string,
        ) => {
          if (!this.roster[attendeeId]) {
            this.roster[attendeeId] = { name: '' };
          }
          if (volume !== null) {
            this.roster[attendeeId].volume = Math.round(volume * 100);
          }
          if (muted !== null) {
            this.roster[attendeeId].muted = muted;
          }
          if (signalStrength !== null) {
            this.roster[attendeeId].signalStrength = Math.round(signalStrength * 100);
          }
          this.roster[attendeeId].name = externalUserId.split('#')[1];
          this.updateRoster();
        }
      );
    };
    this.audioVideo.realtimeSubscribeToAttendeeIdPresence(handler);
    const activeSpeakerHandler = (attendeeIds: string[]): void => {
      for (const attendeeId in this.roster) {
        this.roster[attendeeId].active = false;
      }
      for (const attendeeId of attendeeIds) {
        if (this.roster[attendeeId]) {
          this.roster[attendeeId].active = true;
          break; // only show the most active speaker
        }
      }
      this.layoutVideoTiles();
    };
    this.audioVideo.subscribeToActiveSpeakerDetector(
      new DefaultActiveSpeakerPolicy(),
      activeSpeakerHandler,
      (scores: {[attendeeId:string]: number}) => {
        for (const attendeeId in scores) {
          if (this.roster[attendeeId]) {
            this.roster[attendeeId].score = scores[attendeeId];
          }
        }
        this.updateRoster();
      },
      this.showActiveSpeakerScores ? 100 : 0,
    );
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
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async endMeeting(): Promise<any> {
    await fetch(`${DemoMeetingApp.BASE_URL}end?title=${encodeURIComponent(this.meeting)}`, {
      method: 'POST',
    });
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
        this.switchToFlow('flow-need-permission');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        this.switchToFlow('flow-devices');
        return stream;
      }
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

  populateInMeetingDeviceList(
    elementId: string,
    genericName: string,
    devices: MediaDeviceInfo[],
    additionalOptions: string[],
    callback: (name: string) => void
  ): void {
    const menu = document.getElementById(elementId) as HTMLDivElement;
    while (menu.firstElementChild) {
      menu.removeChild(menu.firstElementChild);
    }
    for (let i = 0; i < devices.length; i++) {
      this.createDropdownMenuItem(menu, devices[i].label || `${genericName} ${i + 1}`, () => {
        callback(devices[i].deviceId);
      });
    }
    if (additionalOptions.length > 0) {
      this.createDropdownMenuItem(menu, '──────────', () => {}).classList.add('text-center');
      for (const additionalOption of additionalOptions) {
        this.createDropdownMenuItem(
          menu,
          additionalOption,
          () => {
            callback(additionalOption);
          },
          `${elementId}-${additionalOption.replace(/\s/g, '-')}`
        );
      }
    }
    if (!menu.firstElementChild) {
      this.createDropdownMenuItem(menu, 'Device selection unavailable', () => {});
    }
  }

  createDropdownMenuItem(
    menu: HTMLDivElement,
    title: string,
    clickHandler: () => void,
    id?: string
  ): HTMLButtonElement {
    const button = document.createElement('button') as HTMLButtonElement;
    menu.appendChild(button);
    button.innerText = title;
    button.classList.add('dropdown-item');
    if (id !== undefined) {
      button.id = id;
    }
    button.addEventListener('click', () => {
      clickHandler();
    });
    return button;
  }

  async populateAllDeviceLists(): Promise<void> {
    await this.populateAudioInputList();
    await this.populateVideoInputList();
    await this.populateAudioOutputList();
  }

  async populateAudioInputList(): Promise<void> {
    const genericName = 'Microphone';
    const additionalDevices = ['None', '440 Hz'];
    this.populateDeviceList(
      'audio-input',
      genericName,
      await this.audioVideo.listAudioInputDevices(),
      additionalDevices
    );
    this.populateInMeetingDeviceList(
      'dropdown-menu-microphone',
      genericName,
      await this.audioVideo.listAudioInputDevices(),
      additionalDevices,
      async (name: string) => {
        await this.audioVideo.chooseAudioInputDevice(this.audioInputSelectionToDevice(name));
      }
    );
  }

  async populateVideoInputList(): Promise<void> {
    const genericName = 'Camera';
    const additionalDevices = ['None', 'Blue', 'SMPTE Color Bars'];
    this.populateDeviceList(
      'video-input',
      genericName,
      await this.audioVideo.listVideoInputDevices(),
      additionalDevices
    );
    this.populateInMeetingDeviceList(
      'dropdown-menu-camera',
      genericName,
      await this.audioVideo.listVideoInputDevices(),
      additionalDevices,
      async (name: string) => {
        try {
          await this.openVideoInputFromSelection(name, false);
        } catch (err) {
          this.log('no video input device selected');
        }
      }
    );
    const cameras = await this.audioVideo.listVideoInputDevices();
    this.cameraDeviceIds = cameras.map((deviceInfo) => {
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
    this.populateInMeetingDeviceList(
      'dropdown-menu-speaker',
      genericName,
      await this.audioVideo.listAudioOutputDevices(),
      additionalDevices,
      async (name: string) => {
        await this.audioVideo.chooseAudioOutputDevice(name);
      }
    );
  }

  private analyserNodeCallback = () => {};

  async openAudioInputFromSelection(): Promise<void> {
    const audioInput = document.getElementById('audio-input') as HTMLSelectElement;
    await this.audioVideo.chooseAudioInputDevice(
      this.audioInputSelectionToDevice(audioInput.value)
    );
    this.startAudioPreview();
  }

  setAudioPreviewPercent(percent: number): void {
    const audioPreview = document.getElementById('audio-preview');
    if (audioPreview.getAttribute('aria-valuenow') !== `${percent}`) {
      audioPreview.style.width = `${percent}%`;
      audioPreview.setAttribute('aria-valuenow', `${percent}`);
    }
    const transitionDuration = '33ms';
    if (audioPreview.style.transitionDuration !== transitionDuration) {
      audioPreview.style.transitionDuration = transitionDuration;
    }
  }

  startAudioPreview(): void {
    this.setAudioPreviewPercent(0);
    const analyserNode = this.audioVideo.createAnalyserNodeForAudioInput();
    if (!analyserNode) {
      return;
    }
    if (!analyserNode.getByteTimeDomainData) {
      document.getElementById('audio-preview').parentElement.style.visibility = 'hidden';
      return;
    }
    const data = new Uint8Array(analyserNode.fftSize);
    let frameIndex = 0;
    this.analyserNodeCallback = () => {
      if (frameIndex === 0) {
        analyserNode.getByteTimeDomainData(data);
        const lowest = 0.01;
        let max = lowest;
        for (const f of data) {
          max = Math.max(max, (f - 128) / 128);
        }
        let normalized = (Math.log(lowest) - Math.log(max)) / Math.log(lowest);
        let percent = Math.min(Math.max(normalized * 100, 0), 100);
        this.setAudioPreviewPercent(percent);
      }
      frameIndex = (frameIndex + 1) % 2;
      requestAnimationFrame(this.analyserNodeCallback);
    };
    requestAnimationFrame(this.analyserNodeCallback);
  }

  async openAudioOutputFromSelection(): Promise<void> {
    const audioOutput = document.getElementById('audio-output') as HTMLSelectElement;
    await this.audioVideo.chooseAudioOutputDevice(audioOutput.value);
    const audioMix = document.getElementById('meeting-audio') as HTMLAudioElement;
    await this.audioVideo.bindAudioElement(audioMix);
  }

  private selectedVideoInput: string | null = null;

  async openVideoInputFromSelection(selection: string | null, showPreview: boolean): Promise<void> {
    if (selection) {
      this.selectedVideoInput = selection;
    }
    this.log(`Switching to: ${this.selectedVideoInput}`);
    const device = this.videoInputSelectionToDevice(this.selectedVideoInput);
    if (device === null) {
      if (showPreview) {
        this.audioVideo.stopVideoPreviewForVideoInput(document.getElementById(
          'video-preview'
        ) as HTMLVideoElement);
      }
      this.audioVideo.stopLocalVideoTile();
      this.toggleButton('button-camera', 'off');
      // choose video input null is redundant since we expect stopLocalVideoTile to clean up
      await this.audioVideo.chooseVideoInputDevice(device);
      throw new Error('no video device selected');
    }
    await this.audioVideo.chooseVideoInputDevice(device);
    if (showPreview) {
      this.audioVideo.startVideoPreviewForVideoInput(document.getElementById(
        'video-preview'
      ) as HTMLVideoElement);
    }
  }

  private audioInputSelectionToDevice(value: string): Device {
    if (value === '440 Hz') {
      return DefaultDeviceController.synthesizeAudioDevice(440);
    } else if (value === 'None') {
      return null;
    }
    return value;
  }

  private videoInputSelectionToDevice(value: string): Device {
    if (value === 'Blue') {
      return DefaultDeviceController.synthesizeVideoDevice('blue');
    } else if (value === 'SMPTE Color Bars') {
      return DefaultDeviceController.synthesizeVideoDevice('smpte');
    } else if (value === 'None') {
      return null;
    }
    return value;
  }

  async authenticate(): Promise<string> {
    let joinInfo = (await this.joinMeeting()).JoinInfo;
    const configuration = new MeetingSessionConfiguration(joinInfo.Meeting, joinInfo.Attendee);
    await this.initializeMeetingSession(configuration);
    const url = new URL(window.location.href);
    url.searchParams.set('m', this.meeting);
    history.replaceState({}, `${this.meeting}`, url.toString());
    return configuration.meetingId;
  }

  log(str: string): void {
    console.log(`[DEMO] ${str}`);
  }

  audioVideoDidStartConnecting(reconnecting: boolean): void {
    this.log(`session connecting. reconnecting: ${reconnecting}`);
  }

  audioVideoDidStart(): void {
    this.log('session started');
  }

  audioVideoDidStop(sessionStatus: MeetingSessionStatus): void {
    this.log(`session stopped from ${JSON.stringify(sessionStatus)}`);
    if (sessionStatus.statusCode() === MeetingSessionStatusCode.AudioCallEnded) {
      this.log(`meeting ended`);
      // @ts-ignore
      window.location = window.location.pathname;
    }
  }

  videoTileDidUpdate(tileState: VideoTileState): void {
    this.log(`video tile updated: ${JSON.stringify(tileState, null, '  ')}`);
    if (!tileState.boundAttendeeId) {
      return;
    }
    const tileIndex = tileState.localTile
      ? 16
      : this.tileOrganizer.acquireTileIndex(tileState.tileId);
    const tileElement = document.getElementById(`tile-${tileIndex}`) as HTMLDivElement;
    const videoElement = document.getElementById(`video-${tileIndex}`) as HTMLVideoElement;
    const nameplateElement = document.getElementById(`nameplate-${tileIndex}`) as HTMLDivElement;

    const pauseButtonElement = document.getElementById(`video-pause-${tileIndex}`) as HTMLButtonElement;

    pauseButtonElement.addEventListener('click', () => {
        if (!tileState.paused) {
          this.audioVideo.pauseVideoTile(tileState.tileId);
          pauseButtonElement.innerText = 'Resume';
        } else {
          this.audioVideo.unpauseVideoTile(tileState.tileId);
          pauseButtonElement.innerText = 'Pause';
        }
    });

    this.log(`binding video tile ${tileState.tileId} to ${videoElement.id}`);
    this.audioVideo.bindVideoElement(tileState.tileId, videoElement);
    this.tileIndexToTileId[tileIndex] = tileState.tileId;
    this.tileIdToTileIndex[tileState.tileId] = tileIndex;
    const rosterName = tileState.boundExternalUserId.split('#')[1];
    if (nameplateElement.innerText !== rosterName) {
      nameplateElement.innerText = rosterName;
    }
    tileElement.style.display = 'block';
    this.layoutVideoTiles();
  }

  videoTileWasRemoved(tileId: number): void {
    this.log(`video tile removed: ${tileId}`);
    this.hideTile(this.tileOrganizer.releaseTileIndex(tileId));
  }

  videoAvailabilityDidChange(availability: MeetingSessionVideoAvailability): void {
    this.canStartLocalVideo = availability.canStartLocalVideo;
    this.log(`video availability changed: canStartLocalVideo  ${availability.canStartLocalVideo}`);
  }

  hideTile(tileIndex: number): void {
    const tileElement = document.getElementById(`tile-${tileIndex}`) as HTMLDivElement;
    tileElement.style.display = 'none';
    this.layoutVideoTiles();
  }

  tileIdForAttendeeId(attendeeId: string): number | null {
    for (const tile of this.audioVideo.getAllVideoTiles()) {
      const state = tile.state();
      if (state.boundAttendeeId === attendeeId) {
        return state.tileId;
      }
    }
    return null;
  }

  activeTileId(): number | null {
    for (const attendeeId in this.roster) {
      if (this.roster[attendeeId].active) {
        return this.tileIdForAttendeeId(attendeeId);
      }
    }
    return null;
  }

  layoutVideoTiles(): void {
    if (!this.meetingSession) {
      return;
    }
    const selfAttendeeId = this.meetingSession.configuration.credentials.attendeeId;
    const selfTileId = this.tileIdForAttendeeId(selfAttendeeId);
    const visibleTileIndices = this.visibleTileIndices();
    let activeTileId = this.activeTileId();
    const selfIsVisible = visibleTileIndices.includes(this.tileIdToTileIndex[selfTileId]);
    if (visibleTileIndices.length === 2 && selfIsVisible) {
      activeTileId = this.tileIndexToTileId[
        visibleTileIndices[0] === selfTileId ? visibleTileIndices[1] : visibleTileIndices[0]
      ];
    }
    const hasVisibleActiveSpeaker = visibleTileIndices.includes(
      this.tileIdToTileIndex[activeTileId]
    );
    if (this.activeSpeakerLayout && hasVisibleActiveSpeaker) {
      this.layoutVideoTilesActiveSpeaker(visibleTileIndices, activeTileId);
    } else {
      this.layoutVideoTilesGrid(visibleTileIndices);
    }
  }

  visibleTileIndices(): number[] {
    let tiles: number[] = [];
    const screenViewTileIndex = 17;
    for (let tileIndex = 0; tileIndex <= screenViewTileIndex; tileIndex++) {
      const tileElement = document.getElementById(`tile-${tileIndex}`) as HTMLDivElement;
      if (tileElement.style.display === 'block') {
        if (tileIndex === screenViewTileIndex) {
          // Hide videos when viewing screen
          for (const tile of tiles) {
            const tileToSuppress = document.getElementById(`tile-${tile}`) as HTMLDivElement;
            tileToSuppress.style.visibility = 'hidden';
          }
          tiles = [screenViewTileIndex];
        } else {
          tiles.push(tileIndex);
        }
      }
    }
    return tiles;
  }

  layoutVideoTilesActiveSpeaker(visibleTileIndices: number[], activeTileId: number): void {
    const tileArea = document.getElementById('tile-area') as HTMLDivElement;
    const width = tileArea.clientWidth;
    const height = tileArea.clientHeight;
    const widthToHeightAspectRatio = 16 / 9;
    const maximumRelativeHeightOfOthers = 0.3;

    const activeWidth = width;
    const activeHeight = width / widthToHeightAspectRatio;
    const othersCount = visibleTileIndices.length - 1;
    let othersWidth = width / othersCount;
    let othersHeight = width / widthToHeightAspectRatio;
    if (othersHeight / activeHeight > maximumRelativeHeightOfOthers) {
      othersHeight = activeHeight * maximumRelativeHeightOfOthers;
      othersWidth = othersHeight * widthToHeightAspectRatio;
    }
    if (othersCount === 0) {
      othersHeight = 0;
    }
    const totalHeight = activeHeight + othersHeight;
    const othersTotalWidth = othersWidth * othersCount;
    const othersXOffset = width / 2 - othersTotalWidth / 2;
    const activeYOffset = height / 2 - totalHeight / 2;
    const othersYOffset = activeYOffset + activeHeight;

    let othersIndex = 0;
    for (let i = 0; i < visibleTileIndices.length; i++) {
      const tileIndex = visibleTileIndices[i];
      const tileId = this.tileIndexToTileId[tileIndex];
      let x = 0,
        y = 0,
        w = 0,
        h = 0;
      if (tileId === activeTileId) {
        x = 0;
        y = activeYOffset;
        w = activeWidth;
        h = activeHeight;
      } else {
        x = othersXOffset + othersIndex * othersWidth;
        y = othersYOffset;
        w = othersWidth;
        h = othersHeight;
        othersIndex += 1;
      }
      this.updateTilePlacement(tileIndex, x, y, w, h);
    }
  }

  updateTilePlacement(tileIndex: number, x: number, y: number, w: number, h: number): void {
    const tile = document.getElementById(`tile-${tileIndex}`) as HTMLDivElement;
    const insetWidthSize = 4;
    const insetHeightSize = insetWidthSize / (16 / 9);
    tile.style.position = 'absolute';
    tile.style.left = `${x + insetWidthSize}px`;
    tile.style.top = `${y + insetHeightSize}px`;
    tile.style.width = `${w - insetWidthSize * 2}px`;
    tile.style.height = `${h - insetHeightSize * 2}px`;
    tile.style.margin = '0';
    tile.style.padding = '0';
    tile.style.visibility = 'visible';
    const video = document.getElementById(`video-${tileIndex}`) as HTMLDivElement;
    if (video) {
      video.style.position = 'absolute';
      video.style.left = '0';
      video.style.top = '0';
      video.style.width = `${w}px`;
      video.style.height = `${h}px`;
      video.style.margin = '0';
      video.style.padding = '0';
      video.style.borderRadius = '8px';
    }
    const nameplate = document.getElementById(`nameplate-${tileIndex}`) as HTMLDivElement;
    const nameplateSize = 24;
    const nameplatePadding = 10;
    nameplate.style.position = 'absolute';
    nameplate.style.left = '0px';
    nameplate.style.top = `${h - nameplateSize - nameplatePadding}px`;
    nameplate.style.height = `${nameplateSize}px`;
    nameplate.style.width = `${w}px`;
    nameplate.style.margin = '0';
    nameplate.style.padding = '0';
    nameplate.style.paddingLeft = `${nameplatePadding}px`;
    nameplate.style.color = '#fff';
    nameplate.style.backgroundColor = 'rgba(0,0,0,0)';
    nameplate.style.textShadow = '0px 0px 5px black';
    nameplate.style.letterSpacing = '0.1em';
    nameplate.style.fontSize = `${nameplateSize - 6}px`;

    let button = document.getElementById(`video-pause-${tileIndex}`) as HTMLButtonElement;

    if (button) {
      button.style.position = 'absolute';
      button.style.display = 'inline-block';
      button.style.right = '0px';
      button.style.top = `${h - nameplateSize - nameplatePadding}px`;
      button.style.height = `${nameplateSize}px`;
      button.style.margin = '0';
      button.style.padding = '0';
      button.style.paddingRight = `${nameplatePadding}px`;
      button.style.color = '#fff';
      button.style.backgroundColor = 'rgba(0,0,0,0)';
      button.style.textShadow = '0px 0px 5px black';
      button.style.letterSpacing = '0.1em';
      button.style.fontSize = `${nameplateSize - 6}px`;
      button.style.border = 'none';
    }
  }

  layoutVideoTilesGrid(visibleTileIndices: number[]): void {
    const tileArea = document.getElementById('tile-area') as HTMLDivElement;
    const width = tileArea.clientWidth;
    const height = tileArea.clientHeight;
    const widthToHeightAspectRatio = 16 / 9;
    let columns = 1;
    let totalHeight = 0;
    let rowHeight = 0;
    for (; columns < 18; columns++) {
      const rows = Math.ceil(visibleTileIndices.length / columns);
      rowHeight = width / columns / widthToHeightAspectRatio;
      totalHeight = rowHeight * rows;
      if (totalHeight <= height) {
        break;
      }
    }
    for (let i = 0; i < visibleTileIndices.length; i++) {
      const w = Math.floor(width / columns);
      const h = Math.floor(rowHeight);
      const x = (i % columns) * w;
      const y = Math.floor(i / columns) * h + (height / 2 - totalHeight / 2);
      this.updateTilePlacement(visibleTileIndices[i], x, y, w, h);
    }
  }

  private setupScreenViewing(): void {
    const self = this;
    this.meetingSession.screenShareView.registerObserver({
      streamDidStart(screenMessageDetail: ScreenMessageDetail): void {
        const rosterEntry = self.roster[screenMessageDetail.attendeeId];
        document.getElementById('nameplate-17').innerText = rosterEntry ? rosterEntry.name : '';
      },
      streamDidStop(_screenMessageDetail: ScreenMessageDetail): void {
        document.getElementById('nameplate-17').innerText = 'No one is sharing screen';
      },
    });
  }

  connectionDidBecomePoor(): void {
    this.log('connection is poor');
  }

  connectionDidSuggestStopVideo(): void {
    this.log('suggest turning the video off');
  }

  videoSendDidBecomeUnavailable(): void {
    this.log('sending video is not available');
  }

  connectionDidBecomeGood(): void {
    this.log('connection is good now');
  }
}

window.addEventListener('load', () => {
  new DemoMeetingApp();
});
