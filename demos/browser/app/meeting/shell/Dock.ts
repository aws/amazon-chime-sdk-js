// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type { RecordingOption } from '../features/Recording';
import { STRINGS } from '../strings';
import { runAction } from '../ui/actions';
import Dialog from '../ui/Dialog';
import { byId } from '../ui/dom';
import type { IconName } from '../ui/icons';
import Menu from '../ui/Menu';
import { StageLayout } from '../video/VideoTileCollection';
import SidePanel from './SidePanel';

export interface DockActions {
  readonly layout: StageLayout;
  readonly selfViewHidden: boolean;
  readonly transcriptionActive: boolean;
  readonly captions: 'on' | 'off' | 'starting';
  readonly recordingOptions: readonly RecordingOption[];
  readonly developerMode: boolean;
  readonly contentShareActive: boolean;
  readonly contentSharePaused: boolean;
  readonly contentShareOptimizable: boolean;
  readonly contentShareOptimizedForVideo: boolean;
  readonly videoOnlyStage: boolean;
  toggleMute(): void;
  toggleCamera(): Promise<void>;
  toggleContentSharePause(): Promise<void>;
  setContentShareOptimizedForVideo(on: boolean): void;
  toggleCaptions(): Promise<void>;
  stopTranscription(): Promise<void>;
  togglePromotion(): Promise<void>;
  setLayout(layout: StageLayout): void;
  setSelfViewHidden(hidden: boolean): void;
  setVideoOnlyStage(on: boolean): void;
  openSettings(): void;
  setDeveloperMode(on: boolean): void;
  openMeetingInfo(): void;
  readonly statsShowing: boolean;
  toggleStats(): void;
  copyJoinLink(): Promise<void>;
  leave(): Promise<void>;
  endMeeting(): Promise<void>;
}

/** Dock clicks and the More menu. Button state lives in `Toolbar`. */
export default class Dock {
  private readonly moreMenu: Menu;
  private readonly leaveDialog = Dialog.byId('leave-dialog');

  constructor(
    private readonly sidePanel: SidePanel,
    private readonly actions: DockActions
  ) {
    this.moreMenu = Menu.byId('dropdown-menu-more', byId('button-more'));
    this.moreMenu.onOpen(() => this.buildMoreMenu());
    this.wireButtons();
  }

  private wireButtons(): void {
    const { actions } = this;
    const on = (id: string, context: string, action: () => unknown): void =>
      byId(id).addEventListener('click', () => runAction(action, context));
    on('button-microphone', STRINGS.contextMute, () => actions.toggleMute());
    on('button-camera', STRINGS.contextCamera, () => actions.toggleCamera());
    on('button-participants', STRINGS.contextPanel, () => this.sidePanel.toggle('participants'));
    on('button-chat', STRINGS.contextPanel, () => this.sidePanel.toggle('chat'));
    on('button-promote-to-primary', STRINGS.contextPromotion, () => actions.togglePromotion());
    on('button-meeting-info', STRINGS.contextDetails, () => actions.openMeetingInfo());
    on('button-copy-join-link', STRINGS.contextCopyLink, () => actions.copyJoinLink());
    on('button-meeting-leave', STRINGS.contextLeave, () => this.openLeaveDialog('leave'));
    on('button-meeting-end', STRINGS.contextEnd, () => this.openLeaveDialog('end'));

    const confirm = (id: string, context: string, action: () => Promise<void>): void => {
      const button = byId<HTMLButtonElement>(id);
      button.addEventListener('click', () =>
        runAction(async () => {
          button.disabled = true;
          try {
            this.leaveDialog.close();
            await action();
          } finally {
            button.disabled = false;
          }
        }, context)
      );
    };
    confirm('button-confirm-leave', STRINGS.contextLeave, () => actions.leave());
    confirm('button-confirm-end', STRINGS.contextEnd, () => actions.endMeeting());
  }

  private openLeaveDialog(mode: 'leave' | 'end'): void {
    byId('leave-dialog-title').textContent = mode === 'end' ? STRINGS.endTitle : STRINGS.leaveTitle;
    byId('leave-dialog-body').textContent = mode === 'end' ? STRINGS.endBody : STRINGS.leaveBody;
    byId('button-confirm-leave').hidden = mode === 'end';
    byId('button-confirm-end').className =
      mode === 'end' ? 'button button-danger' : 'button button-ghost-danger';
    this.leaveDialog.open();
  }

  private buildMoreMenu(): void {
    const { moreMenu: menu, actions } = this;
    menu.clear();
    const detailsHidden = byId('button-meeting-info').offsetParent === null;
    if (detailsHidden) {
      menu.addItem({
        label: STRINGS.meetingDetails,
        icon: 'info',
        onSelect: () => this.actions.openMeetingInfo(),
      });
    }
    if (this.addOverflowItems() || detailsHidden) {
      menu.addSeparator();
    }
    menu.addHeader(STRINGS.layout);
    menu.addRadioGroup(
      [
        {
          value: 'speaker',
          label: STRINGS.layoutSpeaker,
          description: STRINGS.layoutSpeakerDescription,
          icon: 'layoutPanelTop',
        },
        {
          value: 'gallery',
          label: STRINGS.layoutGallery,
          description: STRINGS.layoutGalleryDescription,
          icon: 'layoutGrid',
        },
        {
          value: 'spotlight',
          label: STRINGS.layoutSpotlight,
          description: STRINGS.layoutSpotlightDescription,
          icon: 'focus',
        },
      ],
      actions.layout,
      value => actions.setLayout(value as StageLayout)
    );
    menu.addSeparator();
    this.addRecordingItems();
    if (actions.contentShareActive) {
      menu.addItem({
        id: 'dropdown-item-content-share-pause-resume',
        label: actions.contentSharePaused ? STRINGS.resumeSharing : STRINGS.pauseSharing,
        icon: actions.contentSharePaused ? 'play' : 'pause',
        onSelect: () => runAction(() => actions.toggleContentSharePause(), STRINGS.contextShare),
      });
      if (actions.contentShareOptimizable) {
        const on = actions.contentShareOptimizedForVideo;
        menu.addItem({
          id: 'dropdown-item-content-share-optimize-video',
          label: STRINGS.optimizeForVideoClip,
          icon: 'clapperboard',
          checked: on,
          onSelect: () => actions.setContentShareOptimizedForVideo(!on),
        });
      }
      menu.addSeparator();
    }
    if (actions.developerMode) {
      menu.addItem({
        label: actions.statsShowing ? STRINGS.hideMediaMetrics : STRINGS.showMediaMetrics,
        icon: 'activity',
        onSelect: () => actions.toggleStats(),
      });
    }
    menu.addItem({
      id: 'dropdown-item-developer-mode',
      label: STRINGS.developerOptions,
      icon: 'code',
      checked: actions.developerMode,
      onSelect: () => actions.setDeveloperMode(!actions.developerMode),
    });
    menu.addSeparator();
    menu.addItem({
      id: 'dropdown-item-captions',
      label: STRINGS.captions,
      icon: 'captions',
      checked: actions.captions !== 'off',
      disabled: actions.captions === 'starting',
      onSelect: () => runAction(() => actions.toggleCaptions(), STRINGS.contextCaptions),
    });
    if (actions.transcriptionActive) {
      menu.addItem({
        label: STRINGS.stopTranscriptionForEveryone,
        icon: 'captionsOff',
        onSelect: () => runAction(() => actions.stopTranscription(), STRINGS.contextCaptions),
      });
    }
    menu.addItem({
      label: actions.selfViewHidden ? STRINGS.showSelfView : STRINGS.hideSelfView,
      icon: actions.selfViewHidden ? 'eye' : 'eyeOff',
      onSelect: () => actions.setSelfViewHidden(!actions.selfViewHidden),
    });
    menu.addItem({
      label: STRINGS.videoOnlyStage,
      icon: 'video',
      checked: actions.videoOnlyStage,
      onSelect: () => actions.setVideoOnlyStage(!actions.videoOnlyStage),
    });
    menu.addItem({
      label: STRINGS.settings,
      icon: 'settings',
      onSelect: () => actions.openSettings(),
    });
  }

  private addRecordingItems(): void {
    const options = this.actions.recordingOptions;
    if (options.length === 0) {
      return;
    }
    const menu = this.moreMenu;
    menu.addHeader(STRINGS.record);
    const unavailable = new Map<string, string[]>();
    for (const option of options) {
      if (option.unavailable) {
        unavailable.set(option.unavailable, [
          ...(unavailable.get(option.unavailable) ?? []),
          option.label,
        ]);
        continue;
      }
      menu.addItem({
        id: option.id,
        label: option.label,
        description: option.description,
        icon: option.icon,
        checked: option.checked,
        disabled: option.disabled,
        onSelect: () => option.select(),
      });
    }
    for (const [reason, labels] of unavailable) {
      menu.addItem({
        label: STRINGS.unavailableRecordingOptions(labels),
        description: reason,
        icon: 'circleDot',
        disabled: true,
      });
    }
    menu.addSeparator();
  }

  /** Dock buttons the stylesheet hides on narrow screens, as items that click the button. */
  private addOverflowItems(): boolean {
    let added = false;
    const buttons = document.querySelectorAll<HTMLButtonElement>('footer.dock .dock-overflow');
    for (const button of buttons) {
      const developerOnly = button.classList.contains('developer-only');
      if (
        button.hidden ||
        (developerOnly && !this.actions.developerMode) ||
        getComputedStyle(button).display !== 'none'
      ) {
        continue;
      }
      const icon =
        (button.dataset.menuIcon as IconName | undefined) ??
        (button.querySelector('svg')?.cloneNode(true) as SVGElement | undefined);
      this.moreMenu.addItem({
        label: button.getAttribute('aria-label') ?? button.textContent ?? '',
        id: `dropdown-item-${button.id}`,
        icon,
        disabled: button.disabled,
        onSelect: () => button.click(),
      });
      added = true;
    }
    return added;
  }
}
