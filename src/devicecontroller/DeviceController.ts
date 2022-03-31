// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Destroyable from '../destroyable/Destroyable';
import DeviceControllerFacade from './DeviceControllerFacade';

export default interface DeviceController extends DeviceControllerFacade, Destroyable {}
