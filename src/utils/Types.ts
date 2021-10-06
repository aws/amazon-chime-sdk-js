// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export interface Eq {
  /**
   * Return true if the other value is exactly equal to this value.
   *
   * @param other the value against which to compare.
   */
  equals(other: this): boolean;
}

export interface PartialOrd {
  /**
   * Compare this value to another, returning a relative value as documented by
   * [`Array.sort`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#description)
   *
   * @param other the value against which to compare.
   */
  partialCompare(other: this): number;
}

export class Maybe {
  static of<T>(value: T | null): MaybeProvider<T> {
    return value === undefined || value === null ? None.of() : Some.of(value);
  }
}

export interface MaybeProvider<T> {
  readonly isSome: boolean;
  readonly isNone: boolean;

  /**
   * Transform the mapped element and return a new {@link MaybeProvider} with the result.
   *
   * @param f the function to use
   */
  map<R>(f: (wrapped: T) => R): MaybeProvider<R>;

  flatMap<R>(f: (unwrapped: T) => MaybeProvider<R>): MaybeProvider<R>;

  get(): T;

  /**
   * Returns the some value or the provided default value.
   *
   * @param value the default value to use if this Maybe is none
   * @returns the default value or the some value
   */
  getOrElse(value: T): T;

  /**
   * Default value wrapped in MaybeProvider<T>.
   *
   * @param value the value to wrap
   * @returns a new {@link MaybeProvider}
   */
  defaulting(value: T): MaybeProvider<T>;
}

export class Some<T> implements MaybeProvider<T> {
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

export class None<T> implements MaybeProvider<T> {
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
