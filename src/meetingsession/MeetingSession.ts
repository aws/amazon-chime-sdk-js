// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoFacade from '../audiovideofacade/AudioVideoFacade';
import DeviceController from '../devicecontroller/DeviceController';
import Logger from '../logger/Logger';
import ScreenShareFacade from '../screensharefacade/ScreenShareFacade';
import ScreenShareViewFacade from '../screenshareviewfacade/ScreenShareViewFacade';
import MeetingSessionConfiguration from './MeetingSessionConfiguration';

export default interface MeetingSession {
  readonly configuration: MeetingSessionConfiguration;
  readonly logger: Logger;
  readonly audioVideo: AudioVideoFacade;
  readonly screenShare: ScreenShareFacade;
  readonly screenShareView: ScreenShareViewFacade;
  readonly deviceController: DeviceController;
}
