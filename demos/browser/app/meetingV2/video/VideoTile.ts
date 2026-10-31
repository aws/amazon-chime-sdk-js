// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { STRINGS } from '../strings';
import { el } from '../ui/dom';
import { iconElement } from '../ui/icons';
import Menu from '../ui/Menu';

export type TileLevel = 'low' | 'medium' | 'high' | 'max';
export type DegradationPreference = 'balanced' | 'maintainResolution' | 'maintainFramerate';

export interface TileMenuHandlers {
  onPauseToggle?: () => void;
  onPinToggle?: () => void;
  onHideSelfView?: () => void;
  onMirrorToggle?: () => void;
  onTargetResolution?: (level: TileLevel) => void;
  onPriority?: (level: TileLevel) => void;
  onDegradationPreference?: (preference: DegradationPreference) => void;
}

const LEVELS: { value: TileLevel; label: string }[] = (
  ['low', 'medium', 'high', 'max'] as TileLevel[]
).map(value => ({ value, label: STRINGS.level[value] }));

const DEGRADATION: { value: DegradationPreference; label: string }[] = (
  ['balanced', 'maintainResolution', 'maintainFramerate'] as DegradationPreference[]
).map(value => ({ value, label: STRINGS.degradation[value] }));

/**
 * One video tile: the `<video>`, a nameplate with mute/hand/network badges, and a per-tile menu
 * (pin, pause, and in developer mode the remote video preference knobs of the priority downlink
 * policy).
 * All lookups are scoped to the element, so any number of tiles can coexist.
 */
export class DemoVideoTile extends HTMLElement {
  private videoEl!: HTMLVideoElement;
  private nameplateEl!: HTMLElement;
  private statusEl!: HTMLElement;
  private pauseStateEl!: HTMLElement;
  private attendeeIdEl!: HTMLElement;
  private reactionEl!: HTMLElement;
  private menuButton!: HTMLButtonElement;
  private menu!: Menu;
  private handlers: TileMenuHandlers = {};
  private showRemotePreferences: () => boolean = () => false;
  private _paused = false;
  private _pinned = false;
  private _muted: boolean | undefined;
  private _handRaised = false;
  private _signalStrength = 100;
  private targetResolution: TileLevel = 'high';
  private priority: TileLevel = 'medium';
  private degradation: DegradationPreference = 'balanced';
  private _attendeeId = '';
  private _tileIndex = -1;

  connectedCallback(): void {
    if (this.videoEl) {
      return;
    }
    this.className = 'video-tile';
    this.videoEl = el('video', { class: 'video-tile-video', autoplay: true, playsinline: true });
    this.nameplateEl = el('div', { class: 'video-tile-nameplate' });
    this.statusEl = el('span', { class: 'video-tile-status' });
    this.pauseStateEl = el('span', { class: 'video-tile-pause-state' });
    this.attendeeIdEl = el('div', { class: 'video-tile-attendee-id' });
    this.reactionEl = el('div', { class: 'video-tile-reaction', 'aria-hidden': 'true' });
    this.menuButton = el(
      'button',
      {
        type: 'button',
        class: 'icon-button video-tile-menu-button',
        'aria-label': STRINGS.videoTileOptions,
      },
      iconElement('ellipsisVertical')
    );
    const menuEl = el('div', { class: 'menu' });
    this.append(
      this.videoEl,
      el(
        'div',
        { class: 'video-tile-overlay' },
        el(
          'div',
          { class: 'video-tile-footer' },
          this.nameplateEl,
          this.statusEl,
          this.pauseStateEl
        )
      ),
      this.attendeeIdEl,
      this.reactionEl,
      this.menuButton,
      menuEl
    );
    this.menu = new Menu(menuEl, this.menuButton);
    this.menu.onOpen(() => this.buildMenu());
    if (this._tileIndex >= 0) {
      this.tileIndex = this._tileIndex;
    }
  }

  /** Index used by the integration tests to find `#video-N` and `#nameplate-N`. */
  set tileIndex(tileIndex: number) {
    this._tileIndex = tileIndex;
    if (this.videoEl) {
      this.videoEl.id = `video-${tileIndex}`;
      this.nameplateEl.id = `nameplate-${tileIndex}`;
      this.menuButton.id = `button-video-tile-config-${tileIndex}`;
      this.menu.element.id = `dropdown-video-tile-config-${tileIndex}`;
      this.menuButton.setAttribute('aria-controls', this.menu.element.id);
    }
  }

  setHandlers(handlers: TileMenuHandlers): void {
    this.handlers = handlers;
  }

  /** Asked each time the menu opens, so turning developer mode on or off applies at once. */
  setRemoteVideoPreferencesShown(shown: () => boolean): void {
    this.showRemotePreferences = shown;
  }

  private buildMenu(): void {
    this.menu.clear();
    if (this.classList.contains('local')) {
      this.menu.addItem({
        label: this.classList.contains('mirrored') ? STRINGS.stopMirroring : STRINGS.mirrorMyVideo,
        icon: 'flipHorizontal',
        onSelect: () => this.handlers.onMirrorToggle?.(),
      });
      this.menu.addItem({
        label: STRINGS.hideSelfView,
        icon: 'eyeOff',
        onSelect: () => this.handlers.onHideSelfView?.(),
      });
      return;
    }
    this.menu.addItem({
      label: this._pinned ? STRINGS.unpin : STRINGS.pinToStage,
      icon: this._pinned ? 'pinOff' : 'pin',
      onSelect: () => this.handlers.onPinToggle?.(),
    });
    this.menu.addItem({
      label: this._paused ? STRINGS.resumeVideo : STRINGS.pauseVideo,
      icon: this._paused ? 'play' : 'pause',
      onSelect: () => this.handlers.onPauseToggle?.(),
    });
    if (!this.showRemotePreferences()) {
      return;
    }
    this.menu.addSeparator();
    this.menu.addHeader(STRINGS.targetResolution);
    this.menu.addRadioGroup(LEVELS, this.targetResolution, value => {
      this.targetResolution = value as TileLevel;
      this.handlers.onTargetResolution?.(this.targetResolution);
    });
    this.menu.addHeader(STRINGS.priority);
    this.menu.addRadioGroup(LEVELS, this.priority, value => {
      this.priority = value as TileLevel;
      this.handlers.onPriority?.(this.priority);
    });
    this.menu.addHeader(STRINGS.whenBandwidthConstrained);
    this.menu.addRadioGroup(DEGRADATION, this.degradation, value => {
      this.degradation = value as DegradationPreference;
      this.handlers.onDegradationPreference?.(this.degradation);
    });
  }

  show(isContent: boolean): void {
    this.classList.add('active');
    this.classList.toggle('content', isContent);
    if (isContent) {
      this.videoElement.style.objectFit = 'contain';
    }
  }

  hide(): void {
    this.classList.remove('active', 'featured', 'content', 'speaking', 'paused');
    this.reaction = '';
  }

  set featured(featured: boolean) {
    this.classList.toggle('featured', featured);
  }

  set speaking(speaking: boolean) {
    this.classList.toggle('speaking', speaking);
  }

  set local(local: boolean) {
    this.classList.toggle('local', local);
  }

  set mirrored(mirrored: boolean) {
    this.classList.toggle('mirrored', mirrored);
  }

  set paused(paused: boolean) {
    this._paused = paused;
    this.classList.toggle('paused', paused);
  }

  get paused(): boolean {
    return this._paused;
  }

  set pinned(pinned: boolean) {
    this._pinned = pinned;
    this.renderStatus();
  }

  get pinned(): boolean {
    return this._pinned;
  }

  setMuted(muted: boolean): void {
    this._muted = muted;
    this.renderStatus();
  }

  set handRaised(raised: boolean) {
    this._handRaised = raised;
    this.renderStatus();
  }

  /** 0..100 (percent) from the volume indicator; below 100 shows a weak-network badge. */
  set signalStrength(strength: number) {
    this._signalStrength = strength;
    this.renderStatus();
  }

  set reaction(emoji: string) {
    this.reactionEl.textContent = emoji;
  }

  private renderStatus(): void {
    if (!this.statusEl) {
      return;
    }
    this.statusEl.replaceChildren();
    if (this._muted) {
      this.statusEl.append(iconElement('micOff'));
    }
    if (this._handRaised) {
      this.statusEl.append(iconElement('hand'));
    }
    if (this._pinned) {
      this.statusEl.append(iconElement('pin'));
    }
    if (this._signalStrength < 100) {
      this.statusEl.append(
        el(
          'span',
          {
            title:
              this._signalStrength === 0 ? STRINGS.connectionLost : STRINGS.weakConnectionShort,
          },
          iconElement(this._signalStrength === 0 ? 'wifiOff' : 'wifiLow')
        )
      );
    }
  }

  get videoElement(): HTMLVideoElement {
    return this.videoEl;
  }

  set nameplate(nameplate: string) {
    this.nameplateEl.textContent = nameplate;
  }

  set attendeeId(attendeeId: string) {
    this._attendeeId = attendeeId;
    this.attendeeIdEl.textContent = attendeeId;
  }

  get attendeeId(): string {
    return this._attendeeId;
  }

  set pauseState(state: string) {
    this.pauseStateEl.textContent = state;
  }

  showVideoStats(
    keyStatsToShow: { [key: string]: string },
    metricsData: { [id: string]: { [key: string]: number } },
    streamDirection: string
  ): void {
    const streams = metricsData ? Object.keys(metricsData) : [];
    if (streams.length === 0) {
      return;
    }
    let statsInfo = this.querySelector<HTMLDivElement>('.stats-info');
    if (!statsInfo) {
      statsInfo = el('div', { class: 'stats-info' });
      this.videoEl.insertAdjacentElement('afterend', statsInfo);
    }
    const table = el('table');
    const header = table.insertRow(-1);
    header.insertCell(-1).textContent = STRINGS.videoStatistics;
    streams.forEach((_, index) => {
      header.insertCell(-1).textContent = STRINGS.streamColumn(streamDirection, index + 1);
    });
    for (const ssrc of streams) {
      for (const [metricName, value] of Object.entries(metricsData[ssrc])) {
        if (keyStatsToShow[metricName]) {
          const row = table.insertRow(-1);
          row.dataset.metric = metricName;
          row.insertCell(-1).textContent = keyStatsToShow[metricName];
          row.insertCell(-1).textContent = `${value}`;
        }
      }
    }
    statsInfo.replaceChildren(table);
  }

  clearVideoStats(): void {
    this.querySelector('.stats-info')?.remove();
  }
}

customElements.define('video-tile', DemoVideoTile);
