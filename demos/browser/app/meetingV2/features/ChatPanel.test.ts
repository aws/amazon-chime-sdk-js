// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// @vitest-environment happy-dom
import type { AudioVideoFacade } from 'amazon-chime-sdk-js';
import { describe, expect, it, vi } from 'vitest';

import DataMessage from '../../../../../src/datamessage/DataMessage';
import ChatPanel from './ChatPanel';

// The SDK's CommonJS bundle does not load under vitest (an import cycle), so the module under test
// gets the SDK's own DataMessage source instead.
vi.mock('amazon-chime-sdk-js', async () => ({
  DataMessage: (await import('../../../../../src/datamessage/DataMessage')).default,
}));

const LOCAL = 'local-attendee';

function setUp(): {
  chat: ChatPanel;
  deliver: (message: DataMessage) => void;
  messages: HTMLElement;
  composer: HTMLTextAreaElement;
  form: HTMLFormElement;
  newMessages: HTMLButtonElement;
} {
  document.body.innerHTML =
    '<div id="messages"></div><button id="new-messages"></button><form id="form"><textarea id="composer"></textarea></form>';
  let deliver: (message: DataMessage) => void = () => {};
  const audioVideo = {
    realtimeSubscribeToReceiveDataMessage: (_topic: string, handler: typeof deliver) => {
      deliver = handler;
    },
    realtimeUnsubscribeFromReceiveDataMessage: () => {},
    realtimeSendDataMessage: () => {},
  } as unknown as AudioVideoFacade;
  const messages = document.getElementById('messages')!;
  const composer = document.getElementById('composer') as HTMLTextAreaElement;
  const form = document.getElementById('form') as HTMLFormElement;
  const newMessages = document.getElementById('new-messages') as HTMLButtonElement;
  const chat = new ChatPanel(
    audioVideo,
    { messages, form, composer, newMessages },
    LOCAL,
    `x#Me`,
    () => {}
  );
  return { chat, deliver: message => deliver(message), messages, composer, form, newMessages };
}

const message = (timestampMs: number, sender: string, text: string): DataMessage =>
  new DataMessage(
    timestampMs,
    ChatPanel.TOPIC,
    new TextEncoder().encode(text),
    sender,
    `${sender}#${sender}`
  );

const bubbles = (messages: HTMLElement): string[] =>
  Array.from(
    messages.querySelectorAll('[class^="message-bubble-"]:not(.message-bubble-sender)')
  ).map(bubble => bubble.textContent ?? '');

describe('ChatPanel', () => {
  it('shows a remote message whose server time is older than our own last send', () => {
    const { deliver, messages, composer, form } = setUp();
    composer.value = 'mine';
    form.dispatchEvent(new Event('submit'));
    deliver(message(Date.now() - 60_000, 'remote', 'theirs'));

    expect(bubbles(messages)).toEqual(['mine', 'theirs']);
  });

  it('skips a redelivered message and a redelivered echo of our own', () => {
    const { deliver, messages, composer, form } = setUp();
    composer.value = 'mine';
    form.dispatchEvent(new Event('submit'));
    deliver(message(1000, 'remote', 'theirs'));
    deliver(message(1000, 'remote', 'theirs'));
    deliver(message(900, LOCAL, 'mine'));

    expect(bubbles(messages)).toEqual(['mine', 'theirs']);
  });

  it("keeps the reader's place when scrolled up and offers the way down", () => {
    const { deliver, messages, newMessages } = setUp();
    // happy-dom does no layout: a 1000 px list in a 300 px panel, scrolled to the top.
    Object.defineProperty(messages, 'scrollHeight', { value: 1000 });
    Object.defineProperty(messages, 'clientHeight', { value: 300 });
    messages.scrollTop = 0;
    deliver(message(1000, 'remote', 'while you read'));

    expect(messages.scrollTop).toBe(0);
    expect(newMessages.hidden).toBe(false);

    newMessages.click();
    expect(messages.scrollTop).toBe(1000);
    expect(newMessages.hidden).toBe(true);
  });

  it('stops listening after destroy', () => {
    const { chat, messages, composer, form } = setUp();
    chat.destroy();
    composer.value = 'mine';
    form.dispatchEvent(new Event('submit'));

    expect(bubbles(messages)).toEqual([]);
  });
});
