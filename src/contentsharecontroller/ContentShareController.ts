// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ContentShareObserver from '../contentshareobserver/ContentShareObserver';
import ContentShareControllerFacade from './ContentShareControllerFacade';

export default interface ContentShareController extends ContentShareControllerFacade {
  /**
   * Iterates through each observer, so that their notification functions may
   * be called.
   */
  forEachContentShareObserver(observerFunc: (observer: ContentShareObserver) => void): void;
}
