// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';

export default class CSPMonitor {
  private static loggers: Set<Logger> = new Set<Logger>();
  private static shouldRegisterCSPMonitor: boolean = true;
  private static added = false;

  /* istanbul ignore next */
  static register(): void {
    if (!('document' in global) || !document.addEventListener) {
      return;
    }
    if (CSPMonitor.shouldRegisterCSPMonitor) {
      if (!CSPMonitor.added) {
        document.addEventListener('securitypolicyviolation', CSPMonitor.listener);
        CSPMonitor.added = true;
      }
    }
  }

  /* istanbul ignore next */
  static unregister(): void {
    if (!('document' in global) || !document.removeEventListener) {
      return;
    }
    document.removeEventListener('securitypolicyviolation', CSPMonitor.listener);
    CSPMonitor.loggers = new Set<Logger>();
    CSPMonitor.added = false;
  }

  static disable(): void {
    CSPMonitor.shouldRegisterCSPMonitor = false;
    CSPMonitor.unregister();
  }

  static addLogger(logger: Logger): void {
    if (logger) {
      CSPMonitor.loggers.add(logger);
    }
  }

  static removeLogger(logger: Logger): void {
    if (logger) {
      CSPMonitor.loggers.delete(logger);
    }
  }

  /* istanbul ignore next */
  private static listener = (event: SecurityPolicyViolationEvent): void => {
    const message =
      'Security Policy Violation\n' +
      `Blocked URI: ${event.blockedURI}\n` +
      `Violated Directive: ${event.violatedDirective}\n` +
      `Original Policy: ${event.originalPolicy}\n` +
      `Document URI: ${event.documentURI}\n` +
      `Source File: ${event.sourceFile}\n` +
      `Line No.: ${event.lineNumber}\n`;

    for (const logger of CSPMonitor.loggers) {
      logger.error(message);
    }
    if (CSPMonitor.loggers.size === 0) {
      console.error(message);
    }
  };
}
