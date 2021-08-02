// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export function wait(waitTimeMs: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, waitTimeMs));
}
