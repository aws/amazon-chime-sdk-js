// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Maybe from './Maybe';
import MaybeProvider from './MaybeProvider';

export default class Some<T> implements MaybeProvider<T> {
  readonly isSome: boolean = true;
  readonly isNone: boolean = false;

  private constructor(private value: T) {}

  map<R>(f: (wrapped: T) => R): MaybeProvider<R> {
    return Maybe.of(f(this.value));
  }

  flatMap<R>(f: (unwrapped: T) => MaybeProvider<R>): MaybeProvider<R> {
    return f(this.value);
  }

  get(): T {
    return this.value;
  }

  getOrElse(_value: T): T {
    return this.value;
  }

  defaulting(value: T): MaybeProvider<T> {
    return Maybe.of(this.getOrElse(value));
  }

  static of<T>(value: T): MaybeProvider<T> {
    if (value === null || value === undefined) {
      throw new Error('value is ${value}');
    }
    return new Some(value);
  }
}
