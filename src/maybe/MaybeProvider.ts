// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default interface MaybeProvider<T> {
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
