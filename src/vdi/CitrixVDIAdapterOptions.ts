// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import CitrixUCSDK from './CitrixUCSDK';

export default interface CitrixVDIAdapterOptions {
  /** Initialized UCSDK object. */
  ucsdk: CitrixUCSDK;
  /** Hex window handle of the top-level window, from the Citrix Bootstrap. */
  windowHandle: string;
  logger?: Logger;
}
