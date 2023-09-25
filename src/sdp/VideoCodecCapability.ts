// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { SdkVideoCodecCapability } from '../signalingprotocol/SignalingProtocol';
import { Eq } from '../utils/Types';

/**
 * `VideoCodecCapability` represents a higher level type to wrap `RTCRtpCodecCapability`
 * and the codec name used in the SDP, while also namespacing static create functions
 * for codecs supported in the SDK.
 *
 * Note that `codecName` is different then `codecCapability.mimeType`
 */
export default class VideoCodecCapability implements Eq {
  constructor(
    public readonly codecName: string,
    public readonly codecCapability: RTCRtpCodecCapability
  ) {}

  equals(other: this): boolean {
    return (
      other !== undefined &&
      this.codecName === other.codecName &&
      this.codecCapability.mimeType === other.codecCapability.mimeType &&
      this.codecCapability.clockRate === other.codecCapability.clockRate &&
      this.codecCapability.sdpFmtpLine === other.codecCapability.sdpFmtpLine
    );
  }

  /**
   * Returns the configuration of VP8 supported by the SDK
   */
  static vp8(): VideoCodecCapability {
    return new VideoCodecCapability('VP8', {
      clockRate: 90000,
      mimeType: 'video/VP8',
    });
  }

  /**
   * Returns the configuration of H.264 CBP supported by the SDK
   */
  static h264ConstrainedBaselineProfile(): VideoCodecCapability {
    return new VideoCodecCapability('H264', {
      clockRate: 90000,
      mimeType: 'video/H264',
      sdpFmtpLine: 'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f',
    });
  }

  /**
   * Returns the configuration of H.264 recommended by the SDK
   */
  static h264(): VideoCodecCapability {
    return VideoCodecCapability.h264ConstrainedBaselineProfile();
  }

  /**
   * Returns the configuration of AV1 recommended by the SDK
   */
  static av1main(): VideoCodecCapability {
    return new VideoCodecCapability('AV1', {
      clockRate: 90000,
      mimeType: 'video/AV1',
    });
  }

  /**
   * Returns the configuration of VP9 profile 0 supported by the SDK.
   * Profile 0 is for use with 8-bit source content.
   */
  static vp9profile0(): VideoCodecCapability {
    return new VideoCodecCapability('VP9', {
      clockRate: 90000,
      mimeType: 'video/VP9',
      sdpFmtpLine: 'profile-id=0',
    });
  }

  /**
   * Returns the configuration of codec corresponding to the signaled capability
   */
  static fromSignaled(capability: SdkVideoCodecCapability): VideoCodecCapability | undefined {
    switch (capability) {
      case SdkVideoCodecCapability.VP8:
        return VideoCodecCapability.vp8();
      case SdkVideoCodecCapability.H264_CONSTRAINED_BASELINE_PROFILE:
        return VideoCodecCapability.h264ConstrainedBaselineProfile();
      case SdkVideoCodecCapability.VP9_PROFILE_0:
        return this.vp9profile0();
      case SdkVideoCodecCapability.AV1_MAIN:
        return this.av1main();
      default:
        return undefined;
    }
  }
}
