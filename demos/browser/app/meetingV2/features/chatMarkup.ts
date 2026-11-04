// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Chat message formatting: the Markdown subset people actually type in a meeting chat (bold,
 * italic, inline code, links, line breaks), built as DOM nodes so no HTML from the wire is ever
 * parsed. Replaces a full Markdown engine to keep the bundle small.
 */

// Code spans and URLs are taken out first so emphasis markers inside them stay literal. A URL
// does not end in punctuation or an emphasis marker, so `**https://x.test**` keeps its `**`.
const LITERAL_PATTERN = /(`[^`\n]+`)|(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"*_])/g;
// Each literal is replaced by a private-use placeholder that no emphasis pattern can split.
const PLACEHOLDER = '\\uE000(\\d+)\\uE001';
// Characters that make `_` and `*` intraword (so `snake_case_name` stays literal).
const WORD_CHARS = 'A-Za-z0-9_\\u00C0-\\u024F';
// **bold**, then *italic* or _italic_ with a non-word character (or the start or end of the text)
// outside each marker; no lookbehind, which Safari before 16.4 cannot parse. The earliest match
// wins. Bold may contain italic (`**a *b***`), so it runs to the last `**` of the closing run.
const INLINE =
  '(\\*\\*.+?\\*\\*(?!\\*))' +
  `|(^|[^${WORD_CHARS}])(\\*[^*\\n]+\\*|_[^_\\n]+_)(?![${WORD_CHARS}])`;

interface Literal {
  kind: 'code' | 'link';
  text: string;
}

function link(url: string): HTMLAnchorElement {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.textContent = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  return anchor;
}

function code(text: string): HTMLElement {
  const element = document.createElement('code');
  element.textContent = text;
  return element;
}

function appendText(parent: Node, text: string): void {
  if (text) {
    parent.appendChild(document.createTextNode(text));
  }
}

/** Plain text with placeholders expanded back into code spans and links. */
function appendLiterals(parent: Node, text: string, literals: Literal[]): void {
  const pattern = new RegExp(PLACEHOLDER, 'g');
  let last = 0;
  for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
    appendText(parent, text.slice(last, match.index));
    const literal = literals[Number(match[1])];
    parent.appendChild(literal.kind === 'code' ? code(literal.text) : link(literal.text));
    last = match.index + match[0].length;
  }
  appendText(parent, text.slice(last));
}

function appendInline(parent: Node, text: string, literals: Literal[]): void {
  // A fresh regex per call: the recursion below would otherwise share `lastIndex`.
  const pattern = new RegExp(INLINE, 'g');
  let last = 0;
  for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
    const start = match.index + (match[2]?.length ?? 0);
    appendLiterals(parent, text.slice(last, start), literals);
    if (match[1]) {
      const strong = document.createElement('strong');
      appendInline(strong, match[1].slice(2, -2), literals);
      parent.appendChild(strong);
    } else {
      const em = document.createElement('em');
      appendInline(em, match[3].slice(1, -1), literals);
      parent.appendChild(em);
    }
    last = pattern.lastIndex;
  }
  appendLiterals(parent, text.slice(last), literals);
}

function appendLine(parent: Node, line: string): void {
  const literals: Literal[] = [];
  const masked = line
    .replace(/[\uE000\uE001]/g, '')
    .replace(LITERAL_PATTERN, (_whole, codeSpan: string | undefined, url: string | undefined) => {
      literals.push(
        codeSpan ? { kind: 'code', text: codeSpan.slice(1, -1) } : { kind: 'link', text: url! }
      );
      return `\uE000${literals.length - 1}\uE001`;
    });
  appendInline(parent, masked, literals);
}

/** Render a chat message into `target` (cleared first). Lines are separated by `<br>`. */
export function renderChatMessage(target: HTMLElement, text: string): void {
  target.replaceChildren();
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (index > 0) {
      target.appendChild(document.createElement('br'));
    }
    appendLine(target, line);
  });
}
