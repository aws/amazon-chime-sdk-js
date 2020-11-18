// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Device from './Device';
import VideoTransformDevice from './VideoTransformDevice';

type VideoInputDevice = Device | VideoTransformDevice;

export default VideoInputDevice;
