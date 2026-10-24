// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { byId } from '../ui/dom';

export type FlowId =
  | 'flow-fatal'
  | 'flow-authenticate'
  | 'flow-sip-authenticate'
  | 'flow-sip-uri'
  | 'flow-failed-meeting'
  | 'flow-failed-join'
  | 'flow-left'
  | 'flow-need-permission'
  | 'flow-permission-denied'
  | 'flow-devices'
  | 'flow-meeting';

/** Full-screen "flows". One is visible at a time; switching moves focus to the new screen. */
export default class Flows {
  private current: FlowId | undefined;

  show(flow: FlowId): void {
    if (this.current === flow) {
      return;
    }
    document.querySelectorAll<HTMLElement>('.flow').forEach(element => {
      element.hidden = element.id !== flow;
    });
    this.current = flow;
    const target = byId(flow);
    const focusTarget = target.querySelector<HTMLElement>('[autofocus], h1');
    if (focusTarget) {
      if (!focusTarget.hasAttribute('tabindex') && focusTarget.tagName === 'H1') {
        focusTarget.tabIndex = -1;
      }
      focusTarget.focus({ preventScroll: true });
    }
  }

  get currentFlow(): FlowId | undefined {
    return this.current;
  }
}
