// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DragType from './DragType';

export default interface DragEvent {
  type: DragType;
  coords: [number, number];
  last?: DragEvent;
}
