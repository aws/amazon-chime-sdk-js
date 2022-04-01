// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Destroyable from '../destroyable/Destroyable';
import EventController from '../eventcontroller/EventController';
import DeviceControllerFacade from './DeviceControllerFacade';

/**
 * When you are done using a `DeviceController`, you should perform some
 * cleanup steps in order to avoid memory leaks:
 *
 * 1. Call DeviceController.destroy to stop all active audio and video inputs.
 * 2. Remove any device change observers that you registered by using
 *    {@link DeviceControllerFacade.removeDeviceChangeObserver}.
 * 3. Drop your reference to the controller to allow it to be garbage collected.
 */
export default interface DeviceController extends DeviceControllerFacade, Destroyable {
  /**
   * EventController for publishing events.
   */
  eventController?: EventController | undefined;
}
