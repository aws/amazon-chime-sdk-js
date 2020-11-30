// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Logger } from '../../libs/voicefocus/types';
import SDKLogger from '../logger/Logger';

/** @internal */
function stringify(args: unknown[]): string {
  return args
    .map((v: unknown) => {
      if (typeof v === 'object') {
        return JSON.stringify(v);
      }
      return `${v}`;
    })
    .join(' ');
}

/** @internal */
export default class LoggerAdapter implements Logger {
  constructor(private base: SDKLogger) {}

  debug(...args: unknown[]): void {
    this.base.debug(stringify(args));
  }

  info(...args: unknown[]): void {
    this.base.info(stringify(args));
  }

  warn(...args: unknown[]): void {
    this.base.warn(stringify(args));
  }

  error(...args: unknown[]): void {
    this.base.error(stringify(args));
  }
}
