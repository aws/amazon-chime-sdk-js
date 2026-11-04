// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { AudioVideoFacade, ContentShareObserver, Logger } from 'amazon-chime-sdk-js';

import {
  AudioBufferMediaStreamProvider,
  AudioGainMediaStreamProvider,
  FileMediaStreamProvider,
  ScreenShareMediaStreamProvider,
  SynthesizedStereoMediaStreamProvider,
} from '../media/DemoMediaStreamProviders';
import MediaStreamProvider from '../media/MediaStreamProvider';
import { STRINGS } from '../strings';
import { runAction } from '../ui/actions';
import Menu from '../ui/Menu';
import Toast from '../ui/Toast';
import ContentShareOptions, { ContentShareOptionsElements } from './ContentShareOptions';

export type SourceId =
  | 'dropdown-item-content-share-screen-capture'
  | 'dropdown-item-content-share-screen-test-video'
  | 'dropdown-item-content-share-test-mono-audio-speech'
  | 'dropdown-item-content-share-test-stereo-audio-speech'
  | 'dropdown-item-content-share-test-stereo-audio-tone'
  | 'dropdown-item-content-share-file-item';

export interface ContentShareElements {
  /** Dock Share button: opens the menu while idle, stops the share while sharing. */
  button: HTMLButtonElement;
  menu: HTMLElement;
  /** One menu item per source, keyed by its id. */
  sources: Record<SourceId, HTMLElement>;
  fileInput: HTMLInputElement;
  includeAudio: HTMLElement;
  optimizeForVideo: HTMLElement;
  /** Menu item that opens the options dialog. */
  optionsItem: HTMLElement;
  options: ContentShareOptionsElements;
}

/**
 * Content share, modelled on Zoom's. While idle the Share dock button opens a popover: choosing
 * what to share starts it at once, and the checkboxes (computer sound, optimize for video clip)
 * apply to the next share. While sharing the button stops the share; pause/resume and the optimize
 * toggle live in the More menu. The developer dialog holds frame rate, processing and
 * simulcast/SVC knobs.
 */
export default class ContentShareManager implements ContentShareObserver {
  static TestVideo =
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c0/Big_Buck_Bunny_4K.webm/Big_Buck_Bunny_4K.webm.360p.vp9.webm';

  static SourceOptionElementIds: SourceId[] = [
    'dropdown-item-content-share-screen-capture',
    'dropdown-item-content-share-screen-test-video',
    'dropdown-item-content-share-test-mono-audio-speech',
    'dropdown-item-content-share-test-stereo-audio-speech',
    'dropdown-item-content-share-test-stereo-audio-tone',
    'dropdown-item-content-share-file-item',
  ];

  private started = false;
  private pendingLocalFileStart = false;
  private paused = false;
  /** The last thing shared; option changes restart with it. */
  private source: SourceId = 'dropdown-item-content-share-screen-capture';
  private includeAudio = true;
  private optimizeForVideo = false;
  private streamProvider: MediaStreamProvider | undefined = undefined;
  /** The running screen capture's video tracks. */
  private screenTracks: MediaStreamTrack[] = [];
  /** The blob URL of a shared local file, revoked when the share stops. */
  private fileUrl: string | undefined;
  private readonly menu: Menu;
  private readonly options: ContentShareOptions;
  private readonly listeners: [EventTarget, string, EventListener][] = [];

  constructor(
    private readonly logger: Logger,
    private readonly audioVideo: AudioVideoFacade,
    private readonly elements: ContentShareElements,
    private readonly usingStereoMusicAudioProfile: boolean,
    supportsSimulcast: boolean,
    supportsSVC: boolean,
    private readonly onStartedChange: (started: boolean) => void
  ) {
    this.audioVideo.addContentShareObserver(this);
    this.menu = new Menu(elements.menu, elements.button, false);
    // Most mobile browsers cannot share the screen; offer only what they can share.
    elements.sources['dropdown-item-content-share-screen-capture'].hidden =
      typeof navigator.mediaDevices?.getDisplayMedia !== 'function';
    this.initContentShareUI();
    this.options = new ContentShareOptions(
      elements.options,
      audioVideo,
      supportsSimulcast,
      supportsSVC,
      volumeReduction => {
        this.logger.info(
          `New value for content share volume reduction, restarting: ${volumeReduction}`
        );
        if (this.started) {
          runAction(() => this.restartWith(this.source), STRINGS.startingContentShareAction);
        }
      }
    );
  }

  get isStarted(): boolean {
    return this.started;
  }

  get isPaused(): boolean {
    return this.paused;
  }

  get isOptimizedForVideo(): boolean {
    return this.optimizeForVideo;
  }

  /** Only a screen capture can switch between sharp text and smooth motion. */
  get canOptimizeForVideo(): boolean {
    return this.started && this.screenTracks.length > 0;
  }

  /** As in Zoom, optimizing also shares sound, and it applies to a running screen share at once. */
  setOptimizeForVideo(on: boolean): void {
    this.optimizeForVideo = on;
    Menu.setChecked(this.elements.optimizeForVideo, on);
    if (on) {
      this.includeAudio = true;
      Menu.setChecked(this.elements.includeAudio, true);
    }
    for (const track of this.screenTracks) {
      track.contentHint = ContentShareManager.contentHint(on);
    }
  }

  /**
   * 'motion' keeps the frame rate up at the cost of text sharpness. Off leaves the hint unset: the
   * browser treats a screen as detail, and the SDK sets 'text' for AV1 on each negotiation.
   */
  private static contentHint(optimizeForVideo: boolean): string {
    return optimizeForVideo ? 'motion' : '';
  }

  async start(source: SourceId = this.source): Promise<void> {
    this.source = source;
    this.streamProvider = undefined;
    this.screenTracks = [];
    this.revokeFileUrl();
    switch (source) {
      case 'dropdown-item-content-share-screen-capture': {
        this.logger.info(
          `Starting screen capture: frameRate=${this.options.frameRate} audio=${this.includeAudio} optimizeForVideo=${this.optimizeForVideo}`
        );
        const provider = new ScreenShareMediaStreamProvider({
          frameRate: this.options.frameRate,
          includeAudio: this.includeAudio,
        });
        try {
          const stream = await provider.getMediaStream();
          this.screenTracks = stream.getVideoTracks();
          for (const track of this.screenTracks) {
            track.contentHint = ContentShareManager.contentHint(this.optimizeForVideo);
          }
        } catch (e) {
          // `getDisplayMedia` throws NotAllowedError when the user cancels the picker.
          this.logger.error(`Could not start content share: ${e}`);
          if ((e as Error).name !== 'NotAllowedError') {
            ContentShareManager.toastStartFailure(e);
          }
          this.onStartedChange(false);
          return;
        }
        this.streamProvider = provider;
        break;
      }
      case 'dropdown-item-content-share-screen-test-video':
        this.streamProvider = new FileMediaStreamProvider(ContentShareManager.TestVideo);
        break;
      case 'dropdown-item-content-share-test-mono-audio-speech':
        this.streamProvider = new AudioBufferMediaStreamProvider('audio_file', true);
        break;
      case 'dropdown-item-content-share-test-stereo-audio-speech':
        this.streamProvider = new AudioBufferMediaStreamProvider('stereo_audio_file', true);
        break;
      case 'dropdown-item-content-share-test-stereo-audio-tone':
        this.streamProvider = new SynthesizedStereoMediaStreamProvider(500, 1000);
        break;
      case 'dropdown-item-content-share-file-item': {
        const file = this.elements.fileInput.files?.[0];
        if (!file) {
          this.logger.error('No content share file selected');
          this.onStartedChange(false);
          return;
        }
        this.fileUrl = URL.createObjectURL(file);
        this.streamProvider = new FileMediaStreamProvider(this.fileUrl);
        break;
      }
    }

    let stream: MediaStream | undefined;
    try {
      if (this.streamProvider) {
        if (
          this.options.volumeReduction &&
          (await this.streamProvider.getMediaStream()).getAudioTracks().length !== 0
        ) {
          this.streamProvider = new AudioGainMediaStreamProvider(this.streamProvider, 0.1);
        }
        stream = await this.streamProvider.getMediaStream();
        await this.audioVideo.startContentShare(stream);
      }
    } catch (error) {
      // For example a file the browser cannot play.
      this.logger.error(`Could not start content share: ${error}`);
      ContentShareManager.toastStartFailure(error);
      stream?.getTracks().forEach(track => track.stop());
      this.streamProvider?.pause();
      this.streamProvider = undefined;
      this.screenTracks = [];
      this.revokeFileUrl();
      this.started = false;
      this.paused = false;
      this.updateContentShareUX();
      return;
    }

    this.started = true;
    this.paused = false;
    this.updateContentShareUX();
  }

  async stop(): Promise<void> {
    this.audioVideo.stopContentShare();
    this.streamProvider?.pause();
    this.screenTracks = [];
    this.revokeFileUrl();
    this.started = false;
    this.updateContentShareUX();
  }

  /** Stop, or start again with what was shared last (the screen at first). */
  toggle(): void {
    if (this.started) {
      runAction(() => this.stop(), STRINGS.stoppingContentShareAction);
    } else {
      runAction(() => this.start(), STRINGS.startingContentShareAction);
    }
  }

  async togglePause(): Promise<void> {
    if (!this.started) {
      return;
    }
    if (this.paused) {
      this.audioVideo.unpauseContentShare();
      this.streamProvider?.resume();
    } else {
      this.audioVideo.pauseContentShare();
      this.streamProvider?.pause();
    }
    this.paused = !this.paused;
    this.updateContentShareUX();
  }

  destroy(): void {
    this.audioVideo.removeContentShareObserver(this);
    for (const [target, type, listener] of this.listeners) {
      target.removeEventListener(type, listener);
    }
    this.listeners.length = 0;
    this.revokeFileUrl();
    this.menu.destroy();
    this.options.destroy();
  }

  private static toastStartFailure(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    Toast.show({ message: STRINGS.failed(STRINGS.startingContentShareAction, message) });
  }

  private revokeFileUrl(): void {
    if (this.fileUrl) {
      URL.revokeObjectURL(this.fileUrl);
      this.fileUrl = undefined;
    }
  }

  private listen(target: EventTarget, type: string, listener: EventListener): void {
    target.addEventListener(type, listener);
    this.listeners.push([target, type, listener]);
  }

  private async restartWith(source: SourceId): Promise<void> {
    if (this.started) {
      await this.stop();
    }
    await this.start(source);
  }

  private initContentShareUI(): void {
    const { button, sources, fileInput, includeAudio, optimizeForVideo } = this.elements;
    this.listen(button, 'click', () => {
      if (this.started) {
        runAction(() => this.stop(), STRINGS.stoppingContentShareAction);
      } else {
        this.menu.toggle();
      }
    });

    this.listen(this.elements.optionsItem, 'click', () => {
      this.menu.close();
      this.options.open();
    });

    for (const id of ContentShareManager.SourceOptionElementIds) {
      this.listen(sources[id], 'click', () => {
        this.menu.close();
        if (id === 'dropdown-item-content-share-file-item') {
          // The share starts once the file is chosen.
          this.pendingLocalFileStart = true;
          fileInput.click();
          return;
        }
        runAction(() => this.restartWith(id), STRINGS.startingContentShareAction);
      });
    }
    this.listen(fileInput, 'change', () => {
      if (this.pendingLocalFileStart && fileInput.files?.length) {
        this.pendingLocalFileStart = false;
        runAction(
          () => this.restartWith('dropdown-item-content-share-file-item'),
          STRINGS.startingContentShareAction
        );
      }
    });

    this.listen(includeAudio, 'click', () => {
      this.includeAudio = !this.includeAudio;
      Menu.setChecked(includeAudio, this.includeAudio);
    });
    this.listen(optimizeForVideo, 'click', () => this.setOptimizeForVideo(!this.optimizeForVideo));

    if (!this.usingStereoMusicAudioProfile) {
      this.elements.menu
        .querySelectorAll<HTMLElement>('.stereo-only')
        .forEach(item => (item.hidden = true));
    }
  }

  private updateContentShareUX(): void {
    this.logger.info(`Updating content share UX, started:${this.started} paused:${this.paused}`);
    this.onStartedChange(this.started);
  }

  contentShareDidStart(): void {
    this.logger.info('Content share started');
  }

  contentShareDidStop(): void {
    this.logger.info('Content share stopped');
    if (this.started) {
      // Stopped from outside (e.g. the browser's "Stop sharing" bar or another presenter).
      this.started = false;
      this.screenTracks = [];
      this.updateContentShareUX();
    }
  }

  contentShareDidPause(): void {
    this.logger.info('Content share paused');
  }

  contentShareDidUnpause(): void {
    this.logger.info('Content share unpaused');
  }
}
