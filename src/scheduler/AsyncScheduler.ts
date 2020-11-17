// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import TimeoutScheduler from './TimeoutScheduler';

/**
 * [[AsyncScheduler]] enqueues the callback for the soonest available run of the
 * event loop.
 */
export default class AsyncScheduler extends TimeoutScheduler {
  constructor() {
    super(0);
  }
}
