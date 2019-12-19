// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import '../../style.scss';
import 'bootstrap';
import {
  AsyncScheduler,
  AudioVideoFacade,
  AudioVideoObserver,
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  Device,
  DeviceChangeObserver,
  LogLevel,
  MeetingSession,
  MeetingSessionConfiguration,
  MeetingSessionStatus,
  MeetingSessionStatusCode,
  MeetingSessionVideoAvailability,
  ScreenMessageDetail,
  VideoTileState,
} from '../../../../src/index';

interface JavaScriptInterface {
  getResponse(): any;
  getName(): any;
  getMeetingID(): any;
  getRegion(): any;
  setLeaving(): any;
  setEnding(): any;
}

declare var ChimeSDK: JavaScriptInterface;

class DemoTileOrganizer {
  private static MAX_TILES = 2;
  private tiles: { [id: number]: number } = {};

  acquireTileIndex(tileId: number): number {
    for (let index = 1; index < DemoTileOrganizer.MAX_TILES; index++) {
      if (this.tiles[index] === tileId) {
        return index;
      }
    }
    for (let index = 1; index < DemoTileOrganizer.MAX_TILES; index++) {
      if (!(index in this.tiles)) {
        this.tiles[index] = tileId;
        return index;
      }
    }
    throw new Error('no tiles are available');
  }

  releaseTileIndex(tileId: number): number {
    for (let index = 1; index < DemoTileOrganizer.MAX_TILES; index++) {
      if (this.tiles[index] === tileId) {
        delete this.tiles[index];
        return index;
      }
    }
    return DemoTileOrganizer.MAX_TILES;
  }
}

export class DemoMeetingApp implements AudioVideoObserver, DeviceChangeObserver {

  static readonly DID: string = '+17035550122';
  
  private selectedVideoInput: string | null = null;

  showActiveSpeakerScores = true;
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
  roster: any = {};
  tileIndexToTileId: { [id: number]: number } = {};
  tileIdToTileIndex: { [id: number]: number } = {};
  response: any = {}

  buttonStates: { [key: string]: boolean } = {
    'button-microphone': true,
    'button-camera': false,
    'button-speaker': true,
    'button-screen-view': false,
  };

  constructor() {

    (global as any).app = this;
    this.initEventListeners();
    this.getName();
    this.getMeetingID();
    this.getRegion();
    this.getResponse();
    this.authenticate(); 

    this.setClickHandler('tile-area', () => {
      const header = document.getElementById('header');
      if (header.style.visibility === 'visible') {
        header.style.visibility = 'hidden';
      } else {
        header.style.visibility = 'visible';
      }
    });

    this.setClickHandler('header', () => {
      const header = document.getElementById('header');
      header.style.visibility = 'visible';
    })

    new AsyncScheduler().start(
      async (): Promise<void> => {
        this.switchToFlow('flow-meeting');
        this.showProgress('progress-join');
        await this.join();
        this.displayButtonStates();
        await this.openAudioInputFromSelection();
        await this.openVideoInputFromSelection(
          (document.getElementById('video-input') as HTMLSelectElement).value,
          true
        );
        await this.openAudioOutputFromSelection();
        this.hideProgress('progress-join');

        if (this.toggleButton('button-camera') && this.canStartLocalVideo) {
          await this.openVideoInputFromSelection(null, false);
          this.audioVideo.startLocalVideoTile();
        }
      }
    );
  }

  initEventListeners(): void {

    const videoInput = document.getElementById('video-input') as HTMLSelectElement;
    videoInput.addEventListener('change', async (_ev: Event) => {
      this.log('Video input device is changed');
      await this.openVideoInputFromSelection(videoInput.value, true);
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
        const tileElement = document.getElementById(`tile-0`) as HTMLDivElement;
        if (this.toggleButton('button-camera') && this.canStartLocalVideo) {
          await this.openVideoInputFromSelection(null, false);
          this.audioVideo.startLocalVideoTile();
          tileElement.style.visibility = 'visible';
        } else {
          this.audioVideo.stopLocalVideoTile();
          this.hideTile(0);
          tileElement.style.visibility = 'hidden';
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
        const screenViewDiv = document.getElementById('tile-2') as HTMLDivElement;
        if (this.toggleButton('button-screen-view')) {
          screenViewDiv.style.display = 'block';
          screenViewDiv.style.visibility = 'visible';
          (document.getElementById('tile-0') as HTMLDivElement).style.visibility = 'hidden';
          this.meetingSession.screenShareView.start(screenViewDiv);
        } else {
          screenViewDiv.style.display = 'none';
          this.hideTile(2);
          (document.getElementById('tile-0') as HTMLDivElement).style.visibility = 'visible';
        }
        this.layoutVideoTiles();
      });
    });

    const buttonMeetingLeave = document.getElementById('button-meeting-leave');
    buttonMeetingLeave.addEventListener('click', _e => {
      new AsyncScheduler().start(async () => {
        (buttonMeetingLeave as HTMLButtonElement).disabled = true;
        this.leave();
        (buttonMeetingLeave as HTMLButtonElement).disabled = false;
        this.setLeaving();
      });
    });

    const buttonMeetingEnd = document.getElementById('button-meeting-end');
    buttonMeetingEnd.addEventListener('click', _e => {
      new AsyncScheduler().start(async () => {
        (buttonMeetingEnd as HTMLButtonElement).disabled = true;
        this.leave();
        (buttonMeetingEnd as HTMLButtonElement).disabled = false;
        this.setEnding();
      });
    });
  }

  toggleButton(button: string): boolean {
    this.buttonStates[button] = !this.buttonStates[button];
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
    Array.from(document.getElementsByClassName('flow')).map(
      e => (
        (e as HTMLDivElement).style.display = 'none',
        (e as HTMLDivElement).style.visibility = 'hidden'
      )
    );
    (document.getElementById(flow) as HTMLDivElement).style.display = 'block';
    (document.getElementById(flow) as HTMLDivElement).style.visibility = 'visible';
  }

  videoInputsChanged(_freshVideoInputDeviceList: MediaDeviceInfo[]): void {
    this.populateVideoInputList();
  }

  initializeMeetingSession(configuration: MeetingSessionConfiguration): void {
    const logger = new ConsoleLogger('SDK', LogLevel.INFO);
    const deviceController = new DefaultDeviceController(logger);
    this.meetingSession = new DefaultMeetingSession(configuration, logger, deviceController);
    this.audioVideo = this.meetingSession.audioVideo;
    this.audioVideo.addDeviceChangeObserver(this);
    this.setupDeviceLabelTrigger();
    this.populateAllDeviceLists();
    this.setupMuteHandler();
    this.setupCanUnmuteHandler();
    this.setupScreenViewing();
    this.audioVideo.addObserver(this);
  }

  setClickHandler(elementId: string, f: () => void): void {
    document.getElementById(elementId).addEventListener('click', () => {
      f();
    });
  }

  async join(): Promise<void> {
    await this.openAudioInputFromSelection();
    await this.openAudioOutputFromSelection();
    this.audioVideo.start();
    await this.meetingSession.screenShareView.open();
  }

  leave(): void {
    this.meetingSession.screenShare
      .stop()
      .catch(() => {})
      .finally(() => {
        return this.meetingSession.screenShare.close();
      });
    this.meetingSession.screenShareView.stop();
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

  setupDeviceLabelTrigger(): void {
    this.audioVideo.setDeviceLabelTrigger(
      async (): Promise<MediaStream> => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
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
    button.innerHTML = title;
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
    await this.populateVideoInputList();
  }

  async populateVideoInputList(): Promise<void> {
    const genericName = 'Camera';
    const additionalDevices: string[] = [];
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
        this.selectedVideoInput = name;
        await this.audioVideo.chooseVideoInputDevice(
          this.videoInputSelectionToDevice(this.selectedVideoInput)
        );
      }
    );
  }

  async openAudioInputFromSelection(): Promise<void> {
    const audioInput = document.getElementById('audio-input') as HTMLSelectElement;
    await this.audioVideo.chooseAudioInputDevice(
      this.audioInputSelectionToDevice(audioInput.value)
    );
  }

  async openAudioOutputFromSelection(): Promise<void> {
    const audioMix = document.getElementById('meeting-audio') as HTMLAudioElement;
    await this.audioVideo.bindAudioElement(audioMix);
  }

  async openVideoInputFromSelection(selection: string | null, showPreview: boolean): Promise<void> {
    if (selection) {
      this.selectedVideoInput = selection;
    }
    this.log(`Switching to: ${this.selectedVideoInput}`);
    await this.audioVideo.chooseVideoInputDevice(
      this.videoInputSelectionToDevice(this.selectedVideoInput)
    );
  }

  private audioInputSelectionToDevice(value: string): Device {
    return value;
  }

  private videoInputSelectionToDevice(value: string): Device {
    return value;
  }

  authenticate(): void {
    let joinInfo =  this.response.JoinInfo;
    this.initializeMeetingSession(
      new MeetingSessionConfiguration(joinInfo.Meeting, joinInfo.Attendee)
    );
    const url = new URL(window.location.href);
    url.searchParams.set('m', this.meeting);
    history.replaceState({}, `${this.meeting}`, url.toString());
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
      this.setLeaving();
    }
  }

  videoTileWasRemoved(tileId: number): void {
    this.log(`video tile removed: ${tileId}`);
    this.hideTile(this.tileOrganizer.releaseTileIndex(tileId));
  }

  videoAvailabilityDidChange(availability: MeetingSessionVideoAvailability): void {
    this.canStartLocalVideo = availability.canStartLocalVideo;
    this.log(`video availability changed: canStartLocalVideo  ${availability.canStartLocalVideo}`);
  }

  videoTileDidUpdate(tileState: VideoTileState): void {
    this.log(`video tile updated: ${JSON.stringify(tileState, null, '  ')}`);

    const tileIndex = tileState.localTile
      ? 0
      : this.tileOrganizer.acquireTileIndex(tileState.tileId);

    const tileElement = document.getElementById(`tile-${tileIndex}`) as HTMLDivElement;
    const videoElement = document.getElementById(`video-${tileIndex}`) as HTMLVideoElement;
    this.log(`binding video tile ${tileState.tileId} to ${videoElement.id}`);
    this.audioVideo.bindVideoElement(tileState.tileId, videoElement);
    this.tileIndexToTileId[tileIndex] = tileState.tileId;
    this.tileIdToTileIndex[tileState.tileId] = tileIndex;
    tileElement.style.display = 'block';
    this.layoutVideoTiles();
  }

  hideTile(tileIndex: number): void {
    const tileElement = document.getElementById(`tile-${tileIndex}`) as HTMLDivElement;
    tileElement.style.display = 'none';
    this.layoutVideoTiles();
  }

  visibleTileIndices(): number[] {
    let tiles: number[] = [];
    const screenViewTileIndex = 2;
    for (let tileIndex = 0; tileIndex <= screenViewTileIndex; tileIndex++) {
      const tileElement = document.getElementById(`tile-${tileIndex}`) as HTMLDivElement;
      if (tileElement.style.display === 'block') {
        if (tileIndex === screenViewTileIndex) {
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
    const visibleTileIndices = this.visibleTileIndices();
    this.layoutVideoTilesGrid(visibleTileIndices);
  }

  layoutVideoTilesGrid(visibleTileIndices: number[]): void {
    for (let i = 1; i < visibleTileIndices.length; i++) {
      this.updateTilePlacement(visibleTileIndices[i]);
    }
  }

  updateTilePlacement(tileIndex: Number): void {
    const tile = document.getElementById(`tile-${tileIndex}`) as HTMLDivElement;
    tile.style.visibility = 'visible';
  }

  private setupScreenViewing(): void {
    this.meetingSession.screenShareView.registerObserver({
      streamDidStart(_screenMessageDetail: ScreenMessageDetail): void {
        this.log('Screen Share Started');
      },
      streamDidStop(_screenMessageDetail: ScreenMessageDetail): void {
        this.kog('Screen Share Stoped');
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

  getResponse(): void {
    this.response = JSON.parse(ChimeSDK.getResponse());
  }

  getName(): void {
    this.name = ChimeSDK.getName();
  }

  getMeetingID(): void {
    this.meeting = ChimeSDK.getMeetingID();
  }

  getRegion(): void {
    this.region = ChimeSDK.getRegion();
  }

  setLeaving(): void {
    ChimeSDK.setLeaving();
  }

  setEnding(): void {
    ChimeSDK.setEnding();
  }
}

window.addEventListener('load', () => {
new DemoMeetingApp();
});
