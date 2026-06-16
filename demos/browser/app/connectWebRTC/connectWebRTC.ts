// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import './connectWebRTC.scss';

import {
  AudioInputDevice,
  AudioVideoFacade,
  AudioVideoObserver,
  BackgroundBlurProcessor,
  BackgroundBlurVideoFrameProcessor,
  BackgroundReplacementProcessor,
  BackgroundReplacementVideoFrameProcessor,
  ConsoleLogger,
  DefaultBrowserBehavior,
  DefaultDeviceController,
  DefaultMeetingSession,
  DefaultVideoTransformDevice,
  DeviceChangeObserver,
  Logger,
  LogLevel,
  MeetingSession,
  MeetingSessionConfiguration,
  MeetingSessionStatus,
  MeetingSessionVideoAvailability,
  VideoFxConfig,
  VideoFxProcessor,
  VideoInputDevice,
  VideoTileState,
  Versioning,
  VoiceFocusDeviceTransformer,
  VoiceFocusPaths,
  VoiceFocusSpec,
  VoiceFocusTransformDevice,
} from 'amazon-chime-sdk-js';

type ButtonState = 'on' | 'off' | 'disabled';

type VideoFilterName = 'None' | 'Background Blur 2.0 - Low' |
 'Background Blur 2.0 - Medium' | 'Background Blur 2.0 - High' |
 'Background Replacement 2.0 - (Default)';

const BASE_URL: string = [
  location.protocol,
  '//',
  location.host,
  location.pathname.replace(/\/*$/, '/'),
].join('');

const search = new URLSearchParams(document.location.search);
const VOICE_FOCUS_CDN = search.get('voiceFocusCDN') || undefined;
const VOICE_FOCUS_PATHS: VoiceFocusPaths | undefined = VOICE_FOCUS_CDN && {
  processors: `${VOICE_FOCUS_CDN}processors/`,
  wasm: `${VOICE_FOCUS_CDN}wasm/`,
  workers: `${VOICE_FOCUS_CDN}workers/`,
  models: `${VOICE_FOCUS_CDN}wasm/`,
};

class ConnectWebRTCApp implements AudioVideoObserver, DeviceChangeObserver {
  meetingSession: MeetingSession | null = null;
  audioVideo: AudioVideoFacade | null = null;
  deviceController: DefaultDeviceController | undefined = undefined;
  logger: Logger;
  defaultBrowserBehavior = new DefaultBrowserBehavior();

  customerName: string | null = null;
  contactFlowArn: string | null = null;
  contactId: string | null = null;

  // Voice Focus
  voiceFocusTransformer: VoiceFocusDeviceTransformer | undefined;
  voiceFocusDevice: VoiceFocusTransformDevice | undefined;
  supportsVoiceFocus = false;
  enableVoiceFocus = false;

  // Video filters
  supportsVideoFx = false;
  videoFxProcessor: VideoFxProcessor | undefined;
  chosenVideoTransformDevice: DefaultVideoTransformDevice | undefined;
  chosenVideoFilter: VideoFilterName = 'None';
  blurProcessor: BackgroundBlurProcessor | undefined;
  replacementProcessor: BackgroundReplacementProcessor | undefined;

  DEFAULT_VIDEO_FX_CONFIG: VideoFxConfig = {
    backgroundBlur: { isEnabled: true, strength: 'high' },
    backgroundReplacement: { isEnabled: false, backgroundImageURL: null, defaultColor: 'black' },
  };

  buttonStates: { [key: string]: ButtonState } = {
    'button-microphone': 'on',
    'button-camera': 'off',
    'button-speaker': 'on',
    'button-video-filter': 'off',
  };

  // Tiles
  localTileId: number | null = null;
  remoteTileId: number | null = null;

  constructor() {
    this.logger = new ConsoleLogger('ConnectWebRTC', LogLevel.INFO);

    (document.getElementById('sdk-version') as HTMLSpanElement).innerText =
      'amazon-chime-sdk-js@' + Versioning.sdkVersion;

    this.initEventListeners();
    this.switchToFlow('flow-authenticate');
  }

  initEventListeners(): void {
    document.getElementById('form-authenticate').addEventListener('submit', async (e) => {
      e.preventDefault();
      this.customerName = (document.getElementById('inputCustomerName') as HTMLInputElement).value;
      this.contactFlowArn = (document.getElementById('inputContactFlowArn') as HTMLInputElement).value;

      this.showProgress('progress-authenticate');
      try {
        await this.authenticate();
        this.switchToFlow('flow-devices');
        await this.openAudioInputFromSelection();
        await this.openVideoInputFromSelection();
        await this.openAudioOutputFromSelection();
        (document.getElementById('info-name') as HTMLSpanElement).innerText = this.customerName;
      } catch (error) {
        console.error('Failed to start WebRTC contact:', error);
        document.getElementById('failed-meeting').innerText = `Contact Flow: ${this.contactFlowArn}`;
        document.getElementById('failed-meeting-error').innerText = `Error: ${(error as Error).message}`;
        this.switchToFlow('flow-failed-meeting');
      } finally {
        this.hideProgress('progress-authenticate');
      }
    });

    document.getElementById('form-devices').addEventListener('submit', async (e) => {
      e.preventDefault();
      this.showProgress('progress-join');
      try {
        await this.join();
        this.switchToFlow('flow-meeting');
        (document.getElementById('contact-id') as HTMLElement).innerText = `Contact: ${this.contactId || ''}`;
      } catch (error) {
        console.error('Failed to join:', error);
        document.getElementById('failed-meeting').innerText = `Contact: ${this.contactId || ''}`;
        document.getElementById('failed-meeting-error').innerText = `Error: ${(error as Error).message}`;
        this.switchToFlow('flow-failed-meeting');
      } finally {
        this.hideProgress('progress-join');
      }
    });

    document.getElementById('button-meeting-leave').addEventListener('click', async () => {
      await this.leave();
    });

    document.getElementById('button-meeting-failed-retry').addEventListener('click', () => {
      this.switchToFlow('flow-authenticate');
    });

    // Microphone
    document.getElementById('button-microphone').addEventListener('click', () => {
      if (this.buttonStates['button-microphone'] === 'on') {
        this.audioVideo?.realtimeMuteLocalAudio();
        this.toggleButton('button-microphone', 'off');
      } else {
        this.audioVideo?.realtimeUnmuteLocalAudio();
        this.toggleButton('button-microphone', 'on');
      }
    });

    // Camera
    document.getElementById('button-camera').addEventListener('click', async () => {
      if (this.buttonStates['button-camera'] === 'on') {
        this.audioVideo?.stopLocalVideoTile();
        this.toggleButton('button-camera', 'off');
      } else {
        await this.openVideoInputFromSelection();
        this.audioVideo?.startLocalVideoTile();
        this.toggleButton('button-camera', 'on');
      }
    });

    // Speaker
    document.getElementById('button-speaker').addEventListener('click', () => {
      if (this.buttonStates['button-speaker'] === 'on') {
        this.audioVideo?.unbindAudioElement();
        this.toggleButton('button-speaker', 'off');
      } else {
        this.audioVideo?.bindAudioElement(document.getElementById('meeting-audio') as HTMLAudioElement);
        this.toggleButton('button-speaker', 'on');
      }
    });

    // Voice Focus checkbox on device selection page
    document.getElementById('add-voice-focus').addEventListener('change', async (e) => {
      this.enableVoiceFocus = (e.target as HTMLInputElement).checked;
      await this.openAudioInputFromSelection();
    });

    // Audio input selection
    document.getElementById('audio-input').addEventListener('change', async () => {
      await this.openAudioInputFromSelection();
    });

    // Video input selection
    document.getElementById('video-input').addEventListener('change', async () => {
      await this.openVideoInputFromSelection();
    });

    // Video filter selection
    document.getElementById('video-input-filter').addEventListener('change', async () => {
      const filter = (document.getElementById('video-input-filter') as HTMLSelectElement).value as VideoFilterName;
      await this.applyVideoFilter(filter);
    });

    // Audio output selection
    document.getElementById('audio-output').addEventListener('change', async () => {
      await this.openAudioOutputFromSelection();
    });
  }

  async authenticate(): Promise<void> {
    const connectEndpoint = localStorage.getItem('connectEndpoint') || undefined;
    const response = await fetch(`${BASE_URL}start-webrtc-contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: this.customerName,
        contactFlowArn: this.contactFlowArn,
        connectEndpoint,
      }),
    });
    const json = await response.json();
    if (json.error) {
      throw new Error(`Server error: ${json.error}`);
    }

    this.contactId = json.ContactId;
    this.participantToken = json.ParticipantToken;

    const configuration = new MeetingSessionConfiguration(
      json.ConnectionData.Meeting,
      json.ConnectionData.Attendee,
    );

    await this.initVoiceFocus();
    await this.initializeMeetingSession(configuration);
  }

  async initVoiceFocus(): Promise<void> {
    const spec: VoiceFocusSpec = { name: 'default', paths: VOICE_FOCUS_PATHS };
    try {
      const isSupported = await VoiceFocusDeviceTransformer.isSupported(spec, { logger: this.logger });
      if (isSupported) {
        this.voiceFocusTransformer = await VoiceFocusDeviceTransformer.create(spec, { logger: this.logger });
        this.supportsVoiceFocus = true;
      }
    } catch (e) {
      this.logger.error(`Voice Focus not supported: ${e}`);
    }
  }

  async initializeMeetingSession(configuration: MeetingSessionConfiguration): Promise<void> {
    this.deviceController = new DefaultDeviceController(this.logger, { enableWebAudio: this.supportsVoiceFocus });
    this.meetingSession = new DefaultMeetingSession(configuration, this.logger, this.deviceController);
    this.audioVideo = this.meetingSession.audioVideo;
    this.audioVideo.addDeviceChangeObserver(this);
    this.audioVideo.addObserver(this);
    this.setupDeviceLabelTrigger();
    await this.populateDeviceLists();
    await this.populateVideoFilterList();
  }

  setupDeviceLabelTrigger(): void {
    const callback = async (): Promise<MediaStream> => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      return stream;
    };
    this.audioVideo.setDeviceLabelTrigger(callback);
  }

  async populateDeviceLists(): Promise<void> {
    const audioInputDevices = await this.audioVideo.listAudioInputDevices();
    const videoInputDevices = await this.audioVideo.listVideoInputDevices();
    const audioOutputDevices = await this.audioVideo.listAudioOutputDevices();

    this.populateSelect('audio-input', audioInputDevices);
    this.populateSelect('video-input', videoInputDevices);
    this.populateSelect('audio-output', audioOutputDevices);
  }

  populateSelect(elementId: string, devices: MediaDeviceInfo[]): void {
    const select = document.getElementById(elementId) as HTMLSelectElement;
    select.innerHTML = '';
    for (const device of devices) {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.text = device.label || `Device ${device.deviceId.substring(0, 8)}`;
      select.add(option);
    }
  }

  async populateVideoFilterList(): Promise<void> {
    const select = document.getElementById('video-input-filter') as HTMLSelectElement;
    select.innerHTML = '';

    const noneOption = document.createElement('option');
    noneOption.value = 'None';
    noneOption.text = 'None';
    select.add(noneOption);

    try {
      this.supportsVideoFx = await VideoFxProcessor.isSupported(this.logger);
    } catch (e) {
      this.logger.info('VideoFx not supported');
    }

    if (this.supportsVideoFx) {
      for (const filter of [
        'Background Blur 2.0 - Low',
        'Background Blur 2.0 - Medium',
        'Background Blur 2.0 - High',
        'Background Replacement 2.0 - (Default)',
      ]) {
        const option = document.createElement('option');
        option.value = filter;
        option.text = filter;
        select.add(option);
      }
    } else {
      const supportsBlur = await BackgroundBlurVideoFrameProcessor.isSupported();
      const supportsReplacement = await BackgroundReplacementVideoFrameProcessor.isSupported();
      if (supportsBlur) {
        const option = document.createElement('option');
        option.value = 'Background Blur 2.0 - High';
        option.text = 'Background Blur';
        select.add(option);
      }
      if (supportsReplacement) {
        const option = document.createElement('option');
        option.value = 'Background Replacement 2.0 - (Default)';
        option.text = 'Background Replacement';
        select.add(option);
      }
    }
  }

  async openAudioInputFromSelection(): Promise<void> {
    const deviceId = (document.getElementById('audio-input') as HTMLSelectElement).value;
    let device: AudioInputDevice = deviceId;

    if (this.enableVoiceFocus && this.voiceFocusTransformer) {
      this.voiceFocusDevice = await this.voiceFocusTransformer.createTransformDevice(deviceId);
      if (this.voiceFocusDevice) {
        device = this.voiceFocusDevice;
      }
    } else {
      this.voiceFocusDevice = undefined;
    }

    await this.audioVideo?.startAudioInput(device);
    this.startAudioPreview();
  }

  startAudioPreview(): void {
    const analyserNode = this.audioVideo?.createAnalyserNodeForAudioInput();
    if (!analyserNode) return;

    const data = new Uint8Array(analyserNode.fftSize);
    const previewEl = document.getElementById('audio-preview') as HTMLElement;
    let frameId: number;

    const update = (): void => {
      analyserNode.getByteTimeDomainData(data);
      let max = 128;
      for (let i = 0; i < data.length; i++) {
        max = Math.max(max, data[i]);
      }
      const normalized = (max - 128) / 128;
      const percent = Math.min(100, Math.round(normalized * 100 * 2));
      previewEl.style.width = `${percent}%`;
      frameId = requestAnimationFrame(update);
    };
    update();

    // Clean up on page transition
    const observer = new MutationObserver(() => {
      if (document.getElementById('flow-devices')?.style.display === 'none') {
        cancelAnimationFrame(frameId);
        observer.disconnect();
      }
    });
    observer.observe(document.getElementById('flow-devices')!, { attributes: true, attributeFilter: ['style'] });
  }

  async openVideoInputFromSelection(): Promise<void> {
    const deviceId = (document.getElementById('video-input') as HTMLSelectElement).value;
    let device: VideoInputDevice = deviceId;

    if (this.chosenVideoTransformDevice) {
      this.chosenVideoTransformDevice = this.chosenVideoTransformDevice.chooseNewInnerDevice(deviceId);
      device = this.chosenVideoTransformDevice;
    }

    await this.audioVideo?.startVideoInput(device);

    // Preview
    const previewEl = document.getElementById('video-preview') as HTMLVideoElement;
    this.audioVideo?.startVideoPreviewForVideoInput(previewEl);
  }

  async openAudioOutputFromSelection(): Promise<void> {
    const deviceId = (document.getElementById('audio-output') as HTMLSelectElement).value;
    await this.audioVideo?.chooseAudioOutput(deviceId);
  }

  async applyVideoFilter(filter: VideoFilterName): Promise<void> {
    if (filter === 'None') {
      if (this.chosenVideoTransformDevice) {
        await this.chosenVideoTransformDevice.stop();
        this.chosenVideoTransformDevice = undefined;
      }
      this.chosenVideoFilter = 'None';
      await this.openVideoInputFromSelection();
      return;
    }

    const deviceId = (document.getElementById('video-input') as HTMLSelectElement).value;

    if (this.supportsVideoFx) {
      const config: VideoFxConfig = { ...this.DEFAULT_VIDEO_FX_CONFIG };
      if (filter.includes('Replacement')) {
        config.backgroundBlur = { isEnabled: false, strength: 'high' };
        config.backgroundReplacement = { isEnabled: true, backgroundImageURL: null, defaultColor: 'black' };
      } else {
        let strength: 'low' | 'medium' | 'high' = 'high';
        if (filter.includes('Low')) strength = 'low';
        else if (filter.includes('Medium')) strength = 'medium';
        config.backgroundBlur = { isEnabled: true, strength };
        config.backgroundReplacement = { isEnabled: false, backgroundImageURL: null, defaultColor: 'black' };
      }

      if (!this.videoFxProcessor) {
        this.videoFxProcessor = await VideoFxProcessor.create(this.logger, config);
      } else {
        await this.videoFxProcessor.setEffectConfig(config);
      }

      if (this.chosenVideoTransformDevice) {
        await this.chosenVideoTransformDevice.stop();
      }
      this.chosenVideoTransformDevice = new DefaultVideoTransformDevice(
        this.logger, deviceId, [this.videoFxProcessor]
      );
    } else {
      if (filter.includes('Replacement')) {
        if (!this.replacementProcessor) {
          this.replacementProcessor = await BackgroundReplacementVideoFrameProcessor.create();
        }
        if (this.chosenVideoTransformDevice) {
          await this.chosenVideoTransformDevice.stop();
        }
        this.chosenVideoTransformDevice = new DefaultVideoTransformDevice(
          this.logger, deviceId, [this.replacementProcessor]
        );
      } else {
        if (!this.blurProcessor) {
          this.blurProcessor = await BackgroundBlurVideoFrameProcessor.create();
        }
        if (this.chosenVideoTransformDevice) {
          await this.chosenVideoTransformDevice.stop();
        }
        this.chosenVideoTransformDevice = new DefaultVideoTransformDevice(
          this.logger, deviceId, [this.blurProcessor]
        );
      }
    }

    this.chosenVideoFilter = filter;
    await this.audioVideo?.startVideoInput(this.chosenVideoTransformDevice);
  }

  async join(): Promise<void> {
    this.audioVideo.start();
    this.audioVideo.bindAudioElement(document.getElementById('meeting-audio') as HTMLAudioElement);
  }

  async leave(): Promise<void> {
    this.audioVideo?.stop();
  }

  // AudioVideoObserver
  audioVideoDidStart(): void {
    this.logger.info('Meeting started');
  }

  audioVideoDidStop(sessionStatus: MeetingSessionStatus): void {
    const code = sessionStatus.statusCode();
    this.logger.info(`Meeting stopped: ${code}`);
    this.cleanup();
    this.switchToFlow('flow-authenticate');
  }

  private cleanup(): void {
    this.voiceFocusDevice?.stop();
    this.voiceFocusDevice = undefined;
    this.chosenVideoTransformDevice?.stop();
    this.chosenVideoTransformDevice = undefined;
    this.localTileId = null;
    this.remoteTileId = null;
    this.meetingSession = null;
    this.audioVideo = null;
  }

  videoTileDidUpdate(tileState: VideoTileState): void {
    if (!tileState.boundAttendeeId) return;

    if (tileState.localTile) {
      this.localTileId = tileState.tileId;
      const localVideo = document.getElementById('tile-local') as HTMLVideoElement;
      this.audioVideo.bindVideoElement(tileState.tileId, localVideo);
    } else {
      this.remoteTileId = tileState.tileId;
      const remoteVideo = document.getElementById('tile-remote') as HTMLVideoElement;
      this.audioVideo.bindVideoElement(tileState.tileId, remoteVideo);
      const nameplate = document.getElementById('remote-nameplate') as HTMLElement;
      nameplate.innerText = tileState.boundExternalUserId?.split('#').pop() || '';
    }
  }

  videoTileWasRemoved(tileId: number): void {
    if (tileId === this.localTileId) {
      this.localTileId = null;
    } else if (tileId === this.remoteTileId) {
      this.remoteTileId = null;
      const nameplate = document.getElementById('remote-nameplate') as HTMLElement;
      nameplate.innerText = '';
    }
  }

  videoAvailabilityDidChange(availability: MeetingSessionVideoAvailability): void {
    this.logger.info(`Video availability changed: canStartLocalVideo=${availability.canStartLocalVideo}`);
  }

  // DeviceChangeObserver
  audioInputsChanged(freshDevices: MediaDeviceInfo[]): void {
    this.populateSelect('audio-input', freshDevices);
  }

  audioOutputsChanged(freshDevices: MediaDeviceInfo[]): void {
    this.populateSelect('audio-output', freshDevices);
  }

  videoInputsChanged(freshDevices: MediaDeviceInfo[]): void {
    this.populateSelect('video-input', freshDevices);
  }

  private toggleButton(id: string, state: ButtonState): void {
    this.buttonStates[id] = state;
    const button = document.getElementById(id);
    if (state === 'on') {
      button.classList.add('btn-success');
      button.classList.remove('btn-outline-secondary');
    } else {
      button.classList.remove('btn-success');
      button.classList.add('btn-outline-secondary');
    }
  }

  switchToFlow(flow: string): void {
    Array.from(document.getElementsByClassName('flow')).forEach((el) => {
      (el as HTMLElement).style.display = 'none';
    });
    document.getElementById(flow).style.display = 'block';
  }

  private showProgress(id: string): void {
    document.getElementById(id).classList.remove('progress-hidden');
  }

  private hideProgress(id: string): void {
    document.getElementById(id).classList.add('progress-hidden');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new ConnectWebRTCApp();
});
