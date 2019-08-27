// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ActiveSpeakerDetectorFacade from '../activespeakerdetector/ActiveSpeakerDetectorFacade';
import AudioMixControllerFacade from '../audiomixcontroller/AudioMixControllerFacade';
import AudioVideoControllerFacade from '../audiovideocontroller/AudioVideoControllerFacade';
import DeviceController from '../devicecontroller/DeviceController';
import RealtimeControllerFacade from '../realtimecontroller/RealtimeControllerFacade';
import VideoTileControllerFacade from '../videotilecontroller/VideoTileControllerFacade';

export default interface AudioVideoFacade
  extends AudioVideoControllerFacade,
    VideoTileControllerFacade,
    AudioMixControllerFacade,
    RealtimeControllerFacade,
    ActiveSpeakerDetectorFacade,
    DeviceController {}
