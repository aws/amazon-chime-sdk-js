// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Maybe from './Maybe';
import MaybeProvider from './MaybeProvider';

export default class None<T> implements MaybeProvider<T> {
  readonly isSome: boolean = false;
  readonly isNone: boolean = true;

  private constructor() {}

  get(): T {
    throw new Error('value is null');
  }

  getOrElse(value: T): T {
    return value;
  }

  map<R>(_f: (_wrapped: T) => R): MaybeProvider<R> {
    return new None<R>();
  }

  flatMap<R>(_f: (_unwrapped: T) => MaybeProvider<R>): MaybeProvider<R> {
    return new None<R>();
  }

  defaulting(value: T): MaybeProvider<T> {
    return Maybe.of(this.getOrElse(value));
  }

  static of<T>(): MaybeProvider<T> {
    return new None();
  }
}
