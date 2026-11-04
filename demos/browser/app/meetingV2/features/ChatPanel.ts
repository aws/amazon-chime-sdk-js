// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { AudioVideoFacade, DataMessage } from 'amazon-chime-sdk-js';

import { STRINGS } from '../strings';
import { displayNameOf, el } from '../ui/dom';
import { renderChatMessage } from './chatMarkup';

export interface ChatElements {
  messages: HTMLElement;
  form: HTMLFormElement;
  composer: HTMLTextAreaElement;
  /** "New messages" chip, shown when a message arrives while the reader is scrolled up. */
  newMessages: HTMLButtonElement;
}

/** Chat over the SDK's realtime data messages; messages render through `chatMarkup` (no HTML). */
export default class ChatPanel {
  static readonly TOPIC = 'chat';
  static readonly LIFETIME_MS = 300_000;

  private lastMessageSender: string | null = null;
  /**
   * Messages the server delivered, by sender and server ingest time; a message still within its
   * lifetime is delivered again after a reconnect.
   */
  private readonly deliveredMessageIds = new Map<string, number>();
  /** Our own messages, rendered locally because the server does not echo them to the sender. */
  private readonly ownMessages: { text: string; sentAt: number }[] = [];
  private unread = 0;
  private panelVisible = false;
  private readonly handler = (dataMessage: DataMessage): void => this.receive(dataMessage);
  private readonly onSubmit = (event: Event): void => {
    event.preventDefault();
    this.send();
  };
  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  };
  /** The composer grows with what is typed, wrapped lines included, up to its CSS max-height. */
  private readonly onInput = (): void => {
    const { composer } = this.elements;
    composer.style.height = 'auto';
    composer.style.height = `${composer.scrollHeight}px`;
  };
  private readonly onScroll = (): void => {
    if (this.isAtBottom()) {
      this.elements.newMessages.hidden = true;
    }
  };
  private readonly onNewMessagesClick = (): void => this.scrollToBottom();

  constructor(
    private readonly audioVideo: AudioVideoFacade,
    private readonly elements: ChatElements,
    private readonly localAttendeeId: string,
    private readonly localExternalUserId: string,
    private readonly onUnreadChange: (count: number) => void
  ) {
    this.audioVideo.realtimeSubscribeToReceiveDataMessage(ChatPanel.TOPIC, this.handler);
    elements.form.addEventListener('submit', this.onSubmit);
    elements.composer.addEventListener('keydown', this.onKeyDown);
    elements.composer.addEventListener('input', this.onInput);
    elements.messages.addEventListener('scroll', this.onScroll);
    elements.newMessages.addEventListener('click', this.onNewMessagesClick);
  }

  setPanelVisible(visible: boolean): void {
    this.panelVisible = visible;
    if (visible) {
      this.unread = 0;
      this.onUnreadChange(0);
      this.scrollToBottom();
    }
  }

  private isAtBottom(): boolean {
    const { messages } = this.elements;
    return messages.scrollHeight - messages.scrollTop - messages.clientHeight < 24;
  }

  private scrollToBottom(): void {
    const { messages, newMessages } = this.elements;
    messages.scrollTop = messages.scrollHeight;
    newMessages.hidden = true;
  }

  focusComposer(): void {
    this.elements.composer.focus();
  }

  destroy(): void {
    this.audioVideo.realtimeUnsubscribeFromReceiveDataMessage(ChatPanel.TOPIC);
    this.elements.form.removeEventListener('submit', this.onSubmit);
    this.elements.composer.removeEventListener('keydown', this.onKeyDown);
    this.elements.composer.removeEventListener('input', this.onInput);
    this.elements.messages.removeEventListener('scroll', this.onScroll);
    this.elements.newMessages.removeEventListener('click', this.onNewMessagesClick);
    this.elements.newMessages.hidden = true;
    this.elements.composer.style.height = '';
  }

  private send(): void {
    const { composer } = this.elements;
    const text = composer.value.trim();
    if (!text) {
      return;
    }
    composer.value = '';
    composer.style.height = '';
    this.audioVideo.realtimeSendDataMessage(ChatPanel.TOPIC, text, ChatPanel.LIFETIME_MS);
    this.ownMessages.push({ text, sentAt: Date.now() });
    this.render(
      new DataMessage(
        Date.now(),
        ChatPanel.TOPIC,
        new TextEncoder().encode(text),
        this.localAttendeeId,
        this.localExternalUserId
      )
    );
  }

  private receive(dataMessage: DataMessage): void {
    if (dataMessage.throttled) {
      console.log('[DEMO] Message is throttled. Please resend');
      return;
    }
    const id = `${dataMessage.senderAttendeeId}/${dataMessage.timestampMs}`;
    if (this.deliveredMessageIds.has(id)) {
      return;
    }
    // Past their lifetime (by server time, so clock skew does not matter) messages are not
    // delivered again, so their ids can go.
    const oldest = dataMessage.timestampMs - ChatPanel.LIFETIME_MS;
    for (const [seen, timestampMs] of this.deliveredMessageIds) {
      if (timestampMs >= oldest) {
        break;
      }
      this.deliveredMessageIds.delete(seen);
    }
    this.deliveredMessageIds.set(id, dataMessage.timestampMs);
    if (dataMessage.senderAttendeeId === this.localAttendeeId && this.isOwnEcho(dataMessage)) {
      return;
    }
    this.render(dataMessage);
  }

  /** A redelivered message of ours that this page already rendered when it was sent. */
  private isOwnEcho(dataMessage: DataMessage): boolean {
    const oldest = Date.now() - ChatPanel.LIFETIME_MS;
    while (this.ownMessages.length > 0 && this.ownMessages[0].sentAt < oldest) {
      this.ownMessages.shift();
    }
    const text = dataMessage.text();
    const index = this.ownMessages.findIndex(message => message.text === text);
    if (index < 0) {
      return false;
    }
    this.ownMessages.splice(index, 1);
    return true;
  }

  private render(dataMessage: DataMessage): void {
    const { messages } = this.elements;
    const isSelf = dataMessage.senderAttendeeId === this.localAttendeeId;
    const sender = displayNameOf(dataMessage.senderExternalUserId);
    const time = new Date(dataMessage.timestampMs).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Keep the reader's place when they have scrolled up; a chip offers the way down.
    const follow = isSelf || this.isAtBottom();
    let group = messages.lastElementChild as HTMLElement | null;
    if (!group || this.lastMessageSender !== dataMessage.senderAttendeeId) {
      group = el(
        'div',
        { class: `message-group${isSelf ? ' self' : ''}` },
        el(
          'div',
          { class: 'message-bubble-sender' },
          el('span', { text: isSelf ? STRINGS.you : sender }),
          el('span', { text: time })
        )
      );
      messages.appendChild(group);
    }
    this.lastMessageSender = dataMessage.senderAttendeeId;

    const bubble = el('div', { class: isSelf ? 'message-bubble-self' : 'message-bubble-other' });
    renderChatMessage(bubble, dataMessage.text());
    group.appendChild(bubble);
    if (follow) {
      this.scrollToBottom();
    } else {
      this.elements.newMessages.hidden = false;
    }

    if (!isSelf && !this.panelVisible) {
      this.unread++;
      this.onUnreadChange(this.unread);
    }
  }
}
