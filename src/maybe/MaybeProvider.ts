// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default interface MaybeProvider<T> {
  /**
   * True if value is some, otherwise false
   */
  readonly isSome: boolean;

  /**
   * True if value is none, otherwise false
   */
  readonly isNone: boolean;

  /**
   * Transform the mapped element and return new MaybeProvider with the result
   * @param {(wrapped: T) => R} f
   * @returns {MaybeProvider<R>}
   */
  map<R>(f: (wrapped: T) => R): MaybeProvider<R>;

  flatMap<R>(f: (unwrapped: T) => MaybeProvider<R>): MaybeProvider<R>;

  /**
   * Return value
   * @returns {T}
   */
  get(): T;

  /**
   * Return value or provided value
   * @param {T} value
   * @returns {T}
   */
  getOrElse(value: T): T;

  /**
   * Default value wrapped in MaybeProvider<T>
   * @param {T} value
   * @returns {MaybeProvider<T>}
   */
  defaulting(value: T): MaybeProvider<T>;
}
