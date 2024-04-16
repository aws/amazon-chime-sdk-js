// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Video encoding connection policy names. The policy name is used in MonitorTask
 * to determine video codec degradation reason and report metrics accordingly.
 */
export enum VideoEncodingConnectionHealthPolicyName {
  VideoEncodingCpuHealth = 'Video Encoding CPU Health',
  VideoEncodingFramerateHealth = 'Video Encoding framerate Health',
}

export default VideoEncodingConnectionHealthPolicyName;
