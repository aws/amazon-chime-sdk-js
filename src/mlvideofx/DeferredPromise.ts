// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[DeferredAssetPromise]] Is a wrapper around a javascript promise that
 * will allow us to resolve and reject the promise from outside of the
 * promise's executor block. This tool will be used in the MLVideoFxDriver
 * in order to coordinate the timing of assets being loaded via the
 * MLVideoFxEngine
 */
export default class DeferredPromise {
  private promise: Promise<void>;
  private reject: Function;
  private resolve: Function;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.reject = reject;
      this.resolve = resolve;
    })
  }

  /**
   * Get the promise 
   * @returns Promise<void> corresponding to asset load process
   */
  getPromise(): Promise<void> {
    return this.promise;
  }

  /**
   * Resolve this.promise. 
   * Note: Called after our engine worker receives notificaiton of a 
   * successful asset load 
   */
  resolvePromise() {
    this.resolve();
  }

  /**
   * Reject this.promise. 
   * Note: Called after our engine worker receives notificaiton of an 
   * unsuccessful asset load 
   */
  rejectPromise() {
    this.reject();
  }
}