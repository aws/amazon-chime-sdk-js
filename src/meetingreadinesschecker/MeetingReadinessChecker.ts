// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import CheckAudioConnectivityFeedback from './CheckAudioConnectivityFeedback';
import CheckAudioInputFeedback from './CheckAudioInputFeedback';
import CheckAudioOutputFeedback from './CheckAudioOutputFeedback';
import CheckCameraResolutionFeedback from './CheckCameraResolutionFeedback';
import CheckContentShareConnectivityFeedback from './CheckContentShareConnectivityFeedback';
import CheckNetworkTCPConnectivityFeedback from './CheckNetworkTCPConnectivityFeedback';
import CheckNetworkUDPConnectivityFeedback from './CheckNetworkUDPConnectivityFeedback';
import CheckVideoConnectivityFeedback from './CheckVideoConnectivityFeedback';
import CheckVideoInputFeedback from './CheckVideoInputFeedback';

export default interface MeetingReadinessChecker {
  /**
   * Tests microphone (audio input) locally
   */
  checkAudioInput(audioInputDeviceInfo: MediaDeviceInfo): Promise<CheckAudioInputFeedback>;

  /**
   * Tests speaker (audio output) locally
   */
  checkAudioOutput(
    audioInputDeviceInfo: MediaDeviceInfo,
    audioOutputVerificationCallback: () => Promise<boolean>,
    audioElement?: HTMLAudioElement
  ): Promise<CheckAudioOutputFeedback>;

  /**
   * Tests camera (video input) locally
   */
  checkVideoInput(videoInputDevice: MediaDeviceInfo): Promise<CheckVideoInputFeedback>;

  /**
   * Tests supported camera resolution locally
   */
  checkCameraResolution(
    videoInputDevice: MediaDeviceInfo,
    width: number,
    height: number
  ): Promise<CheckCameraResolutionFeedback>;

  /**
  /*
   * Tests content share connectivity
   */
  checkContentShareConnectivity(sourceId?: string): Promise<CheckContentShareConnectivityFeedback>;

  /**
   * Tests audio connection
   */
  checkAudioConnectivity(
    audioInputDeviceInfo: MediaDeviceInfo
  ): Promise<CheckAudioConnectivityFeedback>;

  /**
   * Test video connection
   */
  checkVideoConnectivity(
    videoInputDeviceInfo: MediaDeviceInfo
  ): Promise<CheckVideoConnectivityFeedback>;

  /**
   * Tests for UDP network connectivity
   */
  checkNetworkUDPConnectivity(): Promise<CheckNetworkUDPConnectivityFeedback>;

  /**
   * Tests for TCP network connectivity
   */
  checkNetworkTCPConnectivity(): Promise<CheckNetworkTCPConnectivityFeedback>;
}
