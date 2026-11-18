// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import LevelMeter from '../devices/LevelMeter';
import MediaStreamProvider from '../media/MediaStreamProvider';
import { STRINGS } from '../strings';
import Dialog from '../ui/Dialog';
import { byId } from '../ui/dom';
import Toast from '../ui/Toast';
import { contentSourceProvider, SourceId } from './ContentShareManager';

interface Preview {
  provider: MediaStreamProvider;
  stream?: MediaStream;
  fileUrl?: string;
  level?: AudioContext;
}

/** Previews a content share source on this device, before joining; nothing is sent. */
export default class ContentShareTest {
  private readonly dialog = Dialog.byId('content-share-test-dialog');
  private readonly sources = Array.from(
    byId('content-share-test-sources').querySelectorAll<HTMLButtonElement>('[data-source]')
  );
  private readonly fileInput = byId<HTMLInputElement>('content-share-test-file');
  private readonly includeAudio = byId<HTMLInputElement>('content-share-test-include-audio');
  private readonly video = byId<HTMLVideoElement>('content-share-test-preview');
  private readonly placeholder = byId('content-share-test-placeholder');
  private readonly placeholderLabel = this.placeholder.querySelector('.preview-placeholder-label')!;
  private readonly placeholderText = this.placeholderLabel.textContent;
  private readonly status = byId('content-share-test-status');
  private readonly stopButton = byId<HTMLButtonElement>('content-share-test-stop');
  private readonly fileMedia = byId<HTMLVideoElement>('content-share-test-file-media');
  private readonly levelMeter = new LevelMeter(() => [byId('content-share-test-level')]);
  private preview: Preview | undefined;
  private sequence = 0;

  constructor() {
    for (const source of this.sources) {
      source.addEventListener('click', () => this.choose(source));
    }
    const screen = this.sourceButton('dropdown-item-content-share-screen-capture');
    screen.hidden = typeof navigator.mediaDevices?.getDisplayMedia !== 'function';
    this.fileInput.addEventListener('change', () => {
      const file = this.fileInput.files?.[0];
      this.fileInput.value = '';
      if (file) {
        void this.start('dropdown-item-content-share-file-item', file);
      }
    });
    this.stopButton.addEventListener('click', () => this.stop());
    this.dialog.onClose(() => this.stop());
  }

  open(): void {
    this.dialog.open();
  }

  private sourceButton(source: SourceId): HTMLButtonElement {
    return this.sources.find(button => button.dataset.source === source)!;
  }

  private choose(button: HTMLButtonElement): void {
    const source = button.dataset.source as SourceId;
    if (source === 'dropdown-item-content-share-file-item') {
      this.fileInput.click();
    } else {
      void this.start(source);
    }
  }

  private async start(source: SourceId, file?: File): Promise<void> {
    this.stop();
    const sequence = this.sequence;
    const fileUrl = file ? URL.createObjectURL(file) : undefined;
    const preview: Preview = {
      provider: contentSourceProvider(source, {
        includeAudio: this.includeAudio.checked,
        fileUrl,
        fileElement: this.fileMedia,
      }),
      fileUrl,
    };
    this.preview = preview;
    this.setPressed(source);
    this.stopButton.disabled = false;
    this.status.textContent = STRINGS.contentShareTestStarting;
    try {
      preview.stream = await preview.provider.getMediaStream();
    } catch (error) {
      if (sequence === this.sequence) {
        this.stop();
        // Cancelling the browser's picker rejects with NotAllowedError.
        if ((error as Error).name !== 'NotAllowedError') {
          Toast.show({
            message: STRINGS.failed(STRINGS.contextContentShareTest, (error as Error).message),
          });
        }
      }
      return;
    }
    if (sequence !== this.sequence) {
      this.release(preview);
      return;
    }
    this.show(preview);
  }

  private show(preview: Preview): void {
    const stream = preview.stream!;
    const [video] = stream.getVideoTracks();
    const sound = stream.getAudioTracks().length > 0;
    this.video.srcObject = video ? stream : null;
    this.placeholder.hidden = !!video;
    this.placeholderLabel.textContent = STRINGS.contentShareTestNoVideo;
    const { width, height } = video?.getSettings() ?? {};
    this.status.textContent = video
      ? STRINGS.contentShareTestVideo(width, height, sound)
      : STRINGS.contentShareTestSoundOnly;
    for (const track of stream.getTracks()) {
      track.addEventListener('ended', () => {
        if (this.preview === preview && stream.getTracks().every(t => t.readyState === 'ended')) {
          this.stop();
        }
      });
    }
    if (sound) {
      const context = new AudioContext();
      const analyser = context.createAnalyser();
      context.createMediaStreamSource(stream).connect(analyser);
      preview.level = context;
      this.levelMeter.attach(analyser);
    }
  }

  private stop(): void {
    this.sequence += 1;
    const preview = this.preview;
    this.preview = undefined;
    this.levelMeter.detach();
    this.video.srcObject = null;
    this.placeholder.hidden = false;
    this.placeholderLabel.textContent = this.placeholderText;
    this.status.textContent = '';
    this.stopButton.disabled = true;
    this.setPressed(undefined);
    if (preview) {
      this.release(preview);
    }
  }

  private release(preview: Preview): void {
    preview.stream?.getTracks().forEach(track => track.stop());
    void preview.level?.close();
    if (preview.fileUrl) {
      if (this.fileMedia.getAttribute('src') === preview.fileUrl) {
        this.fileMedia.pause();
        this.fileMedia.removeAttribute('src');
        this.fileMedia.load();
      }
      URL.revokeObjectURL(preview.fileUrl);
    }
  }

  private setPressed(source: SourceId | undefined): void {
    for (const button of this.sources) {
      button.setAttribute('aria-pressed', String(button.dataset.source === source));
    }
  }
}
