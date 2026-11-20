// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import CitrixBootstrap from './CitrixBootstrap';
import CitrixUCSDK from './CitrixUCSDK';

export default interface CitrixVDIAdapterConnectOptions {
  ucsdk: CitrixUCSDK;
  bootstrap: CitrixBootstrap;
  /** Vendor name passed to `initBootstrap` and `initUCSDK`. */
  vendor: string;
  /** Limit for the whole of `connect`: the window handle and the endpoint connection. Defaults to 15000. */
  timeoutMs?: number;
  logger?: Logger;
}
