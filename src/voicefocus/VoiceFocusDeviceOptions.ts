// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { VoiceFocusFetchBehavior } from '../../libs/voicefocus/types';
import { AssetSpec } from '../../libs/voicefocus/voicefocus';
import Logger from '../logger/Logger';

/**
 * A set of options that can be supplied when creating an Amazon Voice Focus device.
 */
export default interface VoiceFocusDeviceOptions extends AssetSpec {
  /** A {@link Logger|Logger} to which log output will be written. */
  logger?: Logger;
  /** If `true`, Amazon Voice Focus assets will be loaded from the network as soon as possible.
   *  If `false`, load will be delayed until the device is used to create an input stream. */
  preload?: boolean;

  /** @internal */
  fetchBehavior?: VoiceFocusFetchBehavior;
}
