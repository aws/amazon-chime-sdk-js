// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default interface CustomEventMockInit<T = any> extends EventInit {
  detail?: T;
}
