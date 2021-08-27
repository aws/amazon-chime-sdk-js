// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export function wait(waitTimeMs: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, waitTimeMs));
}

// This is impossible to adequately test in Node, so Istanbul ignore.
/* istanbul ignore next */
export function isIFramed(): boolean {
  // Same-origin iframes can check `nodeName`.
  // We can also check whether the parent window and the top window are the same.
  // Cross-origin iframes will throw on the `parent` check, so catch here.
  try {
    return window.frameElement?.nodeName === 'IFRAME' || parent !== top;
  } catch (e) {
    // Very likely to be a cross-origin iframe.
    return true;
  }
}
