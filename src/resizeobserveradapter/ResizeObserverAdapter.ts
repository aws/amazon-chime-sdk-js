// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default interface ResizeObserverAdapter {
  /**
   * Observe
   * @param target
   */
  observe(target: Element): void;

  /**
   * Unobserve
   * @param target
   */
  unobserve(target: Element): void;
}
