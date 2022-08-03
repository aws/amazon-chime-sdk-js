// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoElementFactory from './VideoElementFactory';

export default class NoOpVideoElementFactory implements VideoElementFactory {
  create(): HTMLVideoElement {
    const element = {
      clientWidth: 400,
      clientHeight: 300,
      width: 400,
      height: 300,
      videoWidth: 400,
      videoHeight: 300,
      style: {
        transform: '',
      },
      hasAttribute: (): boolean => {
        return false;
      },
      removeAttribute: (): void => {},
      setAttribute: (): void => {},
      srcObject: false,
      pause: (): void => {},
      play: (): Promise<void> => {
        return Promise.resolve();
      },
    };
    // @ts-ignore
    return element;
  }
}
