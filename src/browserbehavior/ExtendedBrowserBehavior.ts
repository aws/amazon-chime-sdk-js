// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { BrowserBehavior } from '..';

/**
 * This interface contains methods on {@link DefaultBrowserBehavior} that were
 * incorrectly omitted from {@link BrowserBehavior}, plus new methods that
 * were added since the last major version.
 *
 * Members of this interface can change without a major version bump to accommodate new browser
 * bugs and capabilities. If you extend this type, you might need to rework your code for new minor
 * versions of this library.
 */
export default interface ExtendedBrowserBehavior extends BrowserBehavior {
  requiresResolutionAlignment(width: number, height: number): [number, number];
  requiresGroupIdMediaStreamConstraints(): boolean;
  requiresContextRecreationForAudioWorklet(): boolean;
}
