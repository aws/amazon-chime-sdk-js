// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import SimulcastLayers from '../simulcastlayers/SimulcastLayers';

export default interface SimulcastUplinkObserver {
  /**
   * Called when simulcast is enabled and simulcast uplink encoding layers get changed.
   */
  encodingSimulcastLayersDidChange(simulcastLayers: SimulcastLayers): void;
}
