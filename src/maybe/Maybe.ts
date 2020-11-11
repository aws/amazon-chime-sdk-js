// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import MaybeProvider from './MaybeProvider';
import None from './None';
import Some from './Some';

export default class Maybe {
  static of<T>(value: T | null): MaybeProvider<T> {
    return value === undefined || value === null ? None.of() : Some.of(value);
  }
}
