// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { renderChatMessage } from './chatMarkup';

const render = (text: string): string => {
  const target = document.createElement('div');
  renderChatMessage(target, text);
  return target.innerHTML;
};

describe('renderChatMessage', () => {
  it('formats bold, italic and code without parsing HTML', () => {
    expect(render('say **hi** to _them_ with `x < y`')).toBe(
      'say <strong>hi</strong> to <em>them</em> with <code>x &lt; y</code>'
    );
    expect(render('<img src=x onerror=alert(1)>')).toBe('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('links URLs in a new tab and keeps trailing punctuation out of the link', () => {
    expect(render('see https://example.com/a?b=1, ok')).toBe(
      'see <a href="https://example.com/a?b=1" target="_blank" rel="noopener noreferrer">https://example.com/a?b=1</a>, ok'
    );
  });

  it('nests emphasis and breaks lines', () => {
    expect(render('**bold *and italic***\nnext')).toBe(
      '<strong>bold <em>and italic</em></strong><br>next'
    );
  });

  it('keeps a URL with two underscores as one link', () => {
    const url =
      'https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_CreateMeeting.html';
    expect(render(`see ${url} for details`)).toBe(
      `see <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a> for details`
    );
  });

  it('leaves underscores and stars inside words literal', () => {
    expect(render('rename snake_case_name and 2*3*4')).toBe('rename snake_case_name and 2*3*4');
  });

  it('leaves emphasis markers inside a URL literal', () => {
    const url = 'https://example.com/*a*/b_c_d';
    expect(render(`${url} and _x_`)).toBe(
      `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a> and <em>x</em>`
    );
  });

  it('formats emphasis at the start and end of the text and around links', () => {
    expect(render('_word_ and *word*')).toBe('<em>word</em> and <em>word</em>');
    expect(render('**https://example.com**')).toBe(
      '<strong><a href="https://example.com" target="_blank" rel="noopener noreferrer">https://example.com</a></strong>'
    );
  });
});
