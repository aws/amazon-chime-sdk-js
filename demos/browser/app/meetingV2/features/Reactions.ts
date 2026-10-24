// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { AudioVideoFacade, DataMessage } from 'amazon-chime-sdk-js';

import { STRINGS } from '../strings';
import { displayNameOf, el } from '../ui/dom';
import { setButtonIcon } from '../ui/icons';
import Menu from '../ui/Menu';

interface ReactionPayload {
  kind: 'emoji' | 'hand';
  value?: string;
  raised?: boolean;
}

export interface ReactionsElements {
  /** Dock button that opens the menu; it shows a hand while ours is raised. */
  reactionsButton: HTMLElement;
  /** Empty container the emoji and raise-hand items are built into. */
  reactionsMenu: HTMLElement;
  /** Stage overlay the floating reactions animate in. */
  overlay: HTMLElement;
}

export interface ReactionsCallbacks {
  /** Any attendee's hand, including ours: for the roster and the tiles. */
  onHandRaised: (attendeeId: string, raised: boolean) => void;
  onReaction: (attendeeId: string, emoji: string) => void;
}

const EMOJI: { emoji: string; label: string }[] = [
  { emoji: '👍', label: STRINGS.reactionNames.thumbsUp },
  { emoji: '👏', label: STRINGS.reactionNames.clap },
  { emoji: '❤️', label: STRINGS.reactionNames.heart },
  { emoji: '😂', label: STRINGS.reactionNames.laugh },
  { emoji: '😮', label: STRINGS.reactionNames.surprised },
  { emoji: '🎉', label: STRINGS.reactionNames.celebrate },
];

/**
 * Emoji reactions and raise hand, in one React menu as Teams has them, carried over the realtime
 * data message channel on their own topic. Hands are re-broadcast on every presence change so
 * late joiners see the current state.
 */
export default class Reactions {
  static readonly TOPIC = 'reaction';
  private readonly menu: Menu;
  private readonly handItem: HTMLButtonElement;
  private handRaised = false;
  private readonly handler = (dataMessage: DataMessage): void => this.receive(dataMessage);

  constructor(
    private readonly audioVideo: AudioVideoFacade,
    private readonly elements: ReactionsElements,
    private readonly localAttendeeId: string,
    private readonly callbacks: ReactionsCallbacks
  ) {
    this.menu = new Menu(elements.reactionsMenu, elements.reactionsButton);
    for (const { emoji, label } of EMOJI) {
      const item = this.menu.addItem({ label: emoji, onSelect: () => this.sendReaction(emoji) });
      item.classList.add('reaction-emoji');
      item.setAttribute('aria-label', label);
      item.title = label;
    }
    this.menu.addSeparator();
    this.handItem = this.menu.addItem({
      id: 'menu-item-raise-hand',
      label: STRINGS.raiseHand,
      icon: 'hand',
      onSelect: () => this.toggleHand(),
    });
    this.handItem.setAttribute('role', 'menuitemcheckbox');
    this.renderHand();
    this.audioVideo.realtimeSubscribeToReceiveDataMessage(Reactions.TOPIC, this.handler);
  }

  get isHandRaised(): boolean {
    return this.handRaised;
  }

  private toggleHand(): void {
    this.handRaised = !this.handRaised;
    this.send({ kind: 'hand', raised: this.handRaised });
    this.callbacks.onHandRaised(this.localAttendeeId, this.handRaised);
    this.renderHand();
  }

  /** Re-send a raised hand so an attendee who just joined learns about it. */
  rebroadcastHand(): void {
    if (this.handRaised) {
      this.send({ kind: 'hand', raised: true });
    }
  }

  sendReaction(emoji: string): void {
    this.send({ kind: 'emoji', value: emoji });
    this.showFloating(emoji, STRINGS.you);
    this.callbacks.onReaction(this.localAttendeeId, emoji);
  }

  destroy(): void {
    this.audioVideo.realtimeUnsubscribeFromReceiveDataMessage(Reactions.TOPIC);
    this.handRaised = false;
    this.renderHand();
    // The items carry the menu's click listeners; dropping them releases those too.
    this.menu.clear();
    this.menu.destroy();
  }

  private renderHand(): void {
    const raised = this.handRaised;
    this.handItem.setAttribute('aria-checked', String(raised));
    this.handItem.querySelector('.menu-label > span')!.textContent = raised
      ? STRINGS.lowerHand
      : STRINGS.raiseHand;
    const button = this.elements.reactionsButton;
    button.classList.toggle('hand-raised', raised);
    setButtonIcon(button, raised ? 'hand' : 'smile');
    button.setAttribute('aria-label', raised ? STRINGS.reactHandRaised : STRINGS.react);
    button.title = raised ? STRINGS.reactHandRaised : STRINGS.react;
  }

  private send(payload: ReactionPayload): void {
    this.audioVideo.realtimeSendDataMessage(Reactions.TOPIC, payload, 10_000);
  }

  private receive(dataMessage: DataMessage): void {
    if (dataMessage.senderAttendeeId === this.localAttendeeId) {
      return;
    }
    let payload: ReactionPayload;
    try {
      payload = dataMessage.json() as ReactionPayload;
    } catch {
      return;
    }
    const sender = displayNameOf(dataMessage.senderExternalUserId);
    if (payload.kind === 'hand') {
      this.callbacks.onHandRaised(dataMessage.senderAttendeeId, !!payload.raised);
    } else if (
      payload.kind === 'emoji' &&
      payload.value &&
      EMOJI.some(({ emoji }) => emoji === payload.value)
    ) {
      this.showFloating(payload.value, sender);
      this.callbacks.onReaction(dataMessage.senderAttendeeId, payload.value);
    }
  }

  private showFloating(emoji: string, sender: string): void {
    const node = el(
      'div',
      { class: 'reaction-float', style: `left: ${10 + Math.random() * 80}%` },
      el('span', { text: emoji }),
      el('span', { class: 'reaction-sender', text: sender })
    );
    this.elements.overlay.appendChild(node);
    node.addEventListener('animationend', () => node.remove());
  }
}
