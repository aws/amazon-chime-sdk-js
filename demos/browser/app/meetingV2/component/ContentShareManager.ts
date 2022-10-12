// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  AsyncScheduler,
  AudioVideoFacade,
  ContentShareObserver,
  DefaultVideoTransformDevice,
  Logger,
} from 'amazon-chime-sdk-js';
import {
  AudioBufferMediaStreamProvider,
  AudioGainMediaStreamProvider,
  FileMediaStreamProvider,
  MergedMediaStreamProvider,
  ScreenShareMediaStreamProvider,
  SynthesizedStereoMediaStreamProvider,
  VideoTransformDeviceMediaStreamProvider,
} from '../util/mediastreamprovider/DemoMediaStreamProviders';
import MediaStreamProvider from '../util/mediastreamprovider/MediaStreamProvider';
import CircularCut from '../video/filters/CircularCut';

/**
 * Class to allow handling the UI interactions and display associated with content share.
 */
export default class ContentShareManager implements ContentShareObserver {
  static TestVideo: string =
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c0/Big_Buck_Bunny_4K.webm/Big_Buck_Bunny_4K.webm.360p.vp9.webm';
  static SourceOptionElementIds = [
    'dropdown-item-content-share-screen-capture',
    'dropdown-item-content-share-screen-test-video',
    'dropdown-item-content-share-test-mono-audio-speech',
    'dropdown-item-content-share-test-stereo-audio-speech',
    'dropdown-item-content-share-test-stereo-audio-tone',
    'dropdown-item-content-share-file-item',
  ];

  private started: boolean = false;
  private pendingLocalFileStart: boolean = false;
  private paused: boolean = false;

  private streamProvider: MediaStreamProvider | undefined = undefined;
  private transformedAudioStreamProvider: MediaStreamProvider | undefined = undefined;
  private transformedVideoStreamProvider: MediaStreamProvider | undefined = undefined;

  private frameRate: number | undefined = undefined;
  private enableCirculeCut: boolean = false;
  private enableVolumeReduction: boolean = false;

  constructor(
    private logger: Logger,
    private audioVideo: AudioVideoFacade,
    private usingStereoMusicAudioProfile: boolean
  ) {
    this.audioVideo.addContentShareObserver(this);
    this.initContentShareUI();
  }

  async start(): Promise<void> {
    let activeSourceSelection: Element | undefined = undefined;
    document.querySelectorAll('.content-share-source-option').forEach((element) => {
      if (element.classList.contains('active')) {
        activeSourceSelection = element;
      }
    });
    if (activeSourceSelection === undefined) {
      this.logger.error('No content share source selected');
      return;
    }

    this.streamProvider = undefined;
    switch (activeSourceSelection.id) {
      case 'dropdown-item-content-share-screen-capture': {
        try {
          this.logger.info(`Starting screen capture with frame rate ${this.frameRate}`);
          if (this.enableCirculeCut || this.enableVolumeReduction) {
            this.streamProvider = new ScreenShareMediaStreamProvider(this.frameRate || 15);
          } else {
            // Just use helper method
            await this.audioVideo.startContentShareFromScreenCapture(undefined, this.frameRate || undefined);
          }
        } catch (e) {
          // `getUserMedia` can throw
          this.logger.error(`Could not start content share: ${e}`);
          return;
        }
        break;
      }
      case 'dropdown-item-content-share-screen-test-video': {
        this.streamProvider = new FileMediaStreamProvider(ContentShareManager.TestVideo);
        break;
      }
      case 'dropdown-item-content-share-test-mono-audio-speech': {
        this.streamProvider = new AudioBufferMediaStreamProvider('audio_file', true);
        break;
      }
      case 'dropdown-item-content-share-test-stereo-audio-speech': {
        this.streamProvider = new AudioBufferMediaStreamProvider('stereo_audio_file', true);
        break;
      }
      case 'dropdown-item-content-share-test-stereo-audio-tone': {
        this.streamProvider = new SynthesizedStereoMediaStreamProvider(500, 1000);
        break;
      }
      case 'dropdown-item-content-share-file-item': {
        const fileList = document.getElementById('content-share-item') as HTMLInputElement;
        const file = fileList.files[0];
        if (!file) {
          this.logger.error('No content share file selected');
          return;
        }
        const url = URL.createObjectURL(file);
        this.streamProvider = new FileMediaStreamProvider(url);
        break;
      }
    }

    this.transformedAudioStreamProvider = undefined;
    this.transformedVideoStreamProvider = undefined;

    if (this.enableCirculeCut && (await this.streamProvider.getMediaStream()).getVideoTracks().length !== 0) {
      const stages = [new CircularCut()];
      const videoTransformDevice = new DefaultVideoTransformDevice(this.logger, undefined, stages);
      this.transformedVideoStreamProvider = new VideoTransformDeviceMediaStreamProvider(
        this.streamProvider,
        videoTransformDevice
      );
    }

    if (this.enableVolumeReduction && (await this.streamProvider.getMediaStream()).getAudioTracks().length !== 0) {
      this.transformedAudioStreamProvider = new AudioGainMediaStreamProvider(this.streamProvider, 0.1);
    }

    if (this.transformedAudioStreamProvider || this.transformedVideoStreamProvider) {
      this.streamProvider = new MergedMediaStreamProvider(
        this.transformedAudioStreamProvider !== undefined ? this.transformedAudioStreamProvider : this.streamProvider,
        this.transformedVideoStreamProvider !== undefined ? this.transformedVideoStreamProvider : this.streamProvider
      );
    }

    if (this.streamProvider !== undefined) {
      await this.audioVideo.startContentShare(await this.streamProvider.getMediaStream());
    }

    this.started = true;
    this.paused = false;
    this.updateContentShareUX();
  }

  async stop(): Promise<void> {
    this.audioVideo.stopContentShare();
    this.streamProvider?.pause();

    this.started = false;
    this.updateContentShareUX();
  }

  private initContentShareUI(): void {
    const buttonContentShare = document.getElementById('button-content-share');
    buttonContentShare.addEventListener('click', (_e) => {
      if (!this.started) {
        this.start();
      } else {
        this.stop();
      }
    });

    const buttonPauseContentShare = document.getElementById('dropdown-item-content-share-pause-resume');
    buttonPauseContentShare.addEventListener('click', (_e) => {
      if (!this.started) {
        this.logger.error('Content share cannot be paused if content share is not enabled');
        return;
      }
      AsyncScheduler.nextTick(async () => {
        if (this.paused) {
          this.audioVideo.unpauseContentShare();
          this.streamProvider?.resume();
        } else {
          this.audioVideo.pauseContentShare();
          this.streamProvider?.pause();
        }
        this.paused = !this.paused;
        this.updateContentShareUX();
      });
    });

    for (const id of ContentShareManager.SourceOptionElementIds) {
      document.getElementById(id).addEventListener('click', (event) => {
        (event.target as HTMLElement).classList.add('active');
        for (const idToMaybeStrip of ContentShareManager.SourceOptionElementIds) {
          if (id === idToMaybeStrip) {
            continue;
          }
          document.getElementById(idToMaybeStrip).classList.remove('active');
        }

        if (this.started) {
          // If we have already started content share with a different source, immediately
          // restart with the new one selected
          this.stop();
          // This restart will be completed by event listener below
          if (id === 'dropdown-item-content-share-file-item') {
            this.pendingLocalFileStart = true;
          }

          this.start();
        }
      });
    }
    document.getElementById('content-share-item').addEventListener('change', (_e) => {
      if (this.pendingLocalFileStart) {
        this.start();
        this.pendingLocalFileStart = false;
      }
    });

    if (!this.usingStereoMusicAudioProfile) {
      document.getElementById('dropdown-item-content-share-test-stereo-audio-speech').style.display = 'none';
      document.getElementById('dropdown-item-content-share-test-stereo-audio-tone').style.display = 'none';
    }

    document.getElementById('button-save-content-share-configs').addEventListener('click', () => {
      this.frameRate = parseInt((document.getElementById('content-capture-frame-rate') as HTMLInputElement).value, 10);

      const previousEnableVolumeReduction = this.enableVolumeReduction;
      const previousEnableCircularCut = this.enableCirculeCut;
      this.enableVolumeReduction = (document.getElementById(
        'content-enable-volume-reduction'
      ) as HTMLInputElement).checked;
      this.enableCirculeCut = (document.getElementById('content-enable-circular-cut') as HTMLInputElement).checked;
      if (
        previousEnableVolumeReduction !== this.enableVolumeReduction ||
        previousEnableCircularCut !== this.enableCirculeCut
      ) {
        this.logger.info(
          `New values for content share media processing, restarting. enableVolumeReduction:${this.enableVolumeReduction}, enableCirculeCut:${this.enableCirculeCut}`
        );
        if (this.started) {
          this.stop();
          this.start();
        }
      }

      const enableSimulcastForContentShare = (document.getElementById('content-enable-simulcast') as HTMLInputElement)
        .checked;
      if (enableSimulcastForContentShare) {
        const lowMaxBitratesKbps =
          parseInt((document.getElementById('content-simulcast-low-max-bitratekbps') as HTMLInputElement).value) ||
          undefined;
        const lowScaleFactor =
          parseInt((document.getElementById('content-simulcast-low-scale-factor') as HTMLInputElement).value) ||
          undefined;
        const lowMaxFramerate =
          parseInt((document.getElementById('content-simulcast-low-max-framerate') as HTMLInputElement).value) ||
          undefined;
        const highMaxBitratesKbps =
          parseInt((document.getElementById('content-simulcast-high-max-bitratekbps') as HTMLInputElement).value) ||
          undefined;
        const highScaleFactor =
          parseInt((document.getElementById('content-simulcast-high-scale-factor') as HTMLInputElement).value) ||
          undefined;
        const highMaxFramerate =
          parseInt((document.getElementById('content-simulcast-high-max-framerate') as HTMLInputElement).value) ||
          undefined;
        this.audioVideo.enableSimulcastForContentShare(true, {
          low: {
            maxBitrateKbps: lowMaxBitratesKbps,
            scaleResolutionDownBy: lowScaleFactor,
            maxFramerate: lowMaxFramerate,
          },
          high: {
            maxBitrateKbps: highMaxBitratesKbps,
            scaleResolutionDownBy: highScaleFactor,
            maxFramerate: highMaxFramerate,
          },
        });
      } else {
        this.audioVideo.enableSimulcastForContentShare(false);
      }
    });
  }

  private updateContentShareUX(): void {
    this.logger.info(`Updating content share UX, started:${this.started} paused:${this.paused}`);
    const contentSharePauseResumeElement = document.getElementById('dropdown-item-content-share-pause-resume');
    contentSharePauseResumeElement.style.display = this.started ? 'block' : 'none';
    contentSharePauseResumeElement.innerHTML = `${this.paused ? 'Resume' : 'Pause'} Content Share`;
  }

  contentShareDidStart(): void {
    this.logger.info('Content share started');
  }

  contentShareDidStop(): void {
    this.logger.info('Content share stopped');
  }

  contentShareDidPause(): void {
    this.logger.info('Content share paused');
  }

  contentShareDidUnpause(): void {
    this.logger.info('Content share unpaused');
  }
}
