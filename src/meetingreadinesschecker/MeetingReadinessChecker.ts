// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Device from '../devicecontroller/Device';
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
  checkAudioInput(audioInputDevice: Device): Promise<CheckAudioInputFeedback>;

  /**
   * Tests speaker (audio output) locally
   */
  checkAudioOutput(
    audioInputDeviceInfo: MediaDeviceInfo | string,
    audioOutputVerificationCallback: () => Promise<boolean>,
    audioElement?: HTMLAudioElement
  ): Promise<CheckAudioOutputFeedback>;

  /**
   * Tests camera (video input) locally
   */
  checkVideoInput(videoInputDevice: Device): Promise<CheckVideoInputFeedback>;

  /**
   * Tests supported camera resolution locally
   */
  checkCameraResolution(
    videoInputDevice: MediaDeviceInfo | string,
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
  checkAudioConnectivity(audioInputDevice: Device): Promise<CheckAudioConnectivityFeedback>;

  /**
   * Test video connection
   */
  checkVideoConnectivity(videoInputDevice: Device): Promise<CheckVideoConnectivityFeedback>;

  /**
   * Tests for UDP network connectivity
   */
  checkNetworkUDPConnectivity(): Promise<CheckNetworkUDPConnectivityFeedback>;

  /**
   * Tests for TCP network connectivity
   */
  checkNetworkTCPConnectivity(): Promise<CheckNetworkTCPConnectivityFeedback>;
}
