// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DragEvent from '../dragobserver/DragEvent';

export default interface DragContext {
  isMouseDown: boolean;
  last?: DragEvent;
}
