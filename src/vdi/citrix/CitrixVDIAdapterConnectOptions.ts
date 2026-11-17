// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../../logger/Logger';
import CitrixBootstrap from './CitrixBootstrap';
import CitrixUCSDK from './CitrixUCSDK';

export default interface CitrixVDIAdapterConnectOptions {
  ucsdk: CitrixUCSDK;
  bootstrap: CitrixBootstrap;
  /** Vendor name passed to `initBootstrap` and `initUCSDK`. */
  vendor: string;
  /** Limit for each wait, the window handle and then the endpoint connection. Defaults to 10000. */
  timeoutMs?: number;
  logger?: Logger;
}
