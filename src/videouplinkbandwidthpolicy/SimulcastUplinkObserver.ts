// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import SimulcastLayers from '../simulcastlayers/SimulcastLayers';

export default interface SimulcastUplinkObserver {
  /**
   * Called when simulcast uplink encoding renditions change
   */
  encodingSimulcastLayersDidChange(simulcastLayers: SimulcastLayers): void;
}
