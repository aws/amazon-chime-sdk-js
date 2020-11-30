// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import CustomEventMockInit from './CustomEventMockInit';

export default class CustomEventMock<T> {
  constructor(public readonly type: string, _eventInitDict?: CustomEventMockInit<T>) {}
}
