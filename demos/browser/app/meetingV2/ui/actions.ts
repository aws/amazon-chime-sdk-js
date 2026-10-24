// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { STRINGS } from '../strings';
import Toast from './Toast';

/**
 * Runs a click handler and turns a rejection into a toast, so no UI action leaves an unhandled
 * promise behind. `context` completes "Failed <context>: <message>".
 */
export function runAction(action: () => Promise<unknown> | unknown, context: string): void {
  Promise.resolve()
    .then(action)
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[DEMO] Failed ${context}`, error);
      Toast.show({ message: STRINGS.failed(context, message) });
    });
}
