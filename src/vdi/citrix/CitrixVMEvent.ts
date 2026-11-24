// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/** An event the UCSDK passes to the `setVMEventCallback` callback. */
export default interface CitrixVMEvent {
  event: string;
  [key: string]: unknown;
}
