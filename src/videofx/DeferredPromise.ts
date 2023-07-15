// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[DeferredPromise]] Is a wrapper around a javascript promise that
 * will allow us to resolve and reject the promise from outside of the
 * promise's executor block.
 */
export class DeferredPromise<T> {
  private promise: Promise<T>;
  private reject: Function;
  private resolve: Function;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  /**
   * Get the promise associated with the DeferredPromise.
   * @returns Promise<T>
   */
  getPromise(): Promise<T> {
    return this.promise;
  }

  /**
   * Resolve this.promise.
   */
  resolvePromise(resolveParameter?: T): void {
    this.resolve(resolveParameter);
  }

  /**
   * Resolve this.promise with a resolveParameter. Then,
   * replace the resolved promise with a new promise.
   */
  resolveAndReplacePromise(resolveParameter?: T): void {
    this.resolve(resolveParameter);
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  /**
   * Reject this.promise.
   */
  rejectPromise(rejectError: Error): void {
    this.reject(rejectError);
  }

  /**
   * Reject this.promise with a reject parameter. Then,
   * replace the rejected promise with a new promise.
   */
  rejectAndReplacePromise(rejectError: Error): void {
    this.reject(rejectError);
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}
