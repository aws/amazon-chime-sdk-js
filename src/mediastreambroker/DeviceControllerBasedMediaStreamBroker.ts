// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DeviceController from '../devicecontroller/DeviceController';
import MediaStreamBroker from '../mediastreambroker/MediaStreamBroker';

export default interface DeviceControllerBasedMediaStreamBroker
  extends DeviceController,
    MediaStreamBroker {
  // This interface combines a device controller with a media stream broker
}
