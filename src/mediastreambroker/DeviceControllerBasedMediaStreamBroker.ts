// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DeviceController from '../devicecontroller/DeviceController';
import MediaStreamBroker from '../mediastreambroker/MediaStreamBroker';
import StatsCollector from '../statscollector/StatsCollector';

export default interface DeviceControllerBasedMediaStreamBroker
  extends DeviceController, MediaStreamBroker {
  // This interface combines a device controller with a media stream broker
  /**
   * Sets the StatsCollector for metrics reporting.
   * This is called after the StatsCollector is created during meeting start.
   */
  setStatsCollector?(statsCollector: StatsCollector): void;
}
