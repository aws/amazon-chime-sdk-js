// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[SessionStateControllerDeferPriority]] indicates the priority level of the action
 * being deferred. For example, stop is more important than update so if forced
 * to pick between the two stop should be chosen.
 */
export enum SessionStateControllerDeferPriority {
  DoNotDefer = 0,
  Low = 1,
  Medium = 2,
  High = 3,
  VeryHigh = 4,
}

export default SessionStateControllerDeferPriority;
