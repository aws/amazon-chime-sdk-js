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
   * Returns whether the codec capability fmtp line matches. This will not
   * attempt to match H.264 profile levels (e.g. 5.2, 3.1), see internal comments for
   * more detailed information.
   *
   * This function is meant to only be used internally.
   */
  fmtpLineMatches(line: string, expectedPayloadType: number): boolean {
    const codecCapabilityFmtpLine = this.codecCapability.sdpFmtpLine;
    if (!codecCapabilityFmtpLine) {
      return false;
    }

    if (this.codecName === 'H264') {
      // Given that most H.264 decoders for the past decade can support level 5.2, we do not bother checking the Profile Level
      // with regards to canonically defined, meeting wide, H.264 profile options (i.e. we intentionally do not split up `h264HighProfile`
      // into `h264HighProfileLevel52, `h264HighProfileLevel31`, etc.).
      //
      // Additionally, Chrome bundles FFmpeg software decoders which while advertised as 3.1, will happily decode any bitrate/resolution.
      //
      // If maximum compatability with H.264 is desired by a builder they should stick to H.264 Constrained Baseline Profile.
      const profileLevelIdRegex = /profile-level-id=([0-9a-f]{4})[0-9a-f]{2}/i;
      const modifiedCodecCapabilityFmtpLine = codecCapabilityFmtpLine.replace(
        profileLevelIdRegex,
        'profile-level-id=$1'
      );
      const modifiedLine = line.replace(profileLevelIdRegex, 'profile-level-id=$1');

      return modifiedLine.startsWith(
        `a=fmtp:${expectedPayloadType} ${modifiedCodecCapabilityFmtpLine}`
      );
    }
    return line.startsWith(`a=fmtp:${expectedPayloadType} ${codecCapabilityFmtpLine}`);
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
   * Returns the configuration of H.264 Baseline Profile supported by the SDK.
   *
   * This profile is more likely to use hardware for encode on most browsers
   * then constrained baseline profile.
   */
  static h264BaselineProfile(): VideoCodecCapability {
    return new VideoCodecCapability('H264', {
      clockRate: 90000,
      mimeType: 'video/H264',
      sdpFmtpLine: 'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f',
    });
  }

  /**
   * Returns the configuration of H.264 CBP supported by the SDK.
   *
   * This profile is required in all WebRTC implementations and typically
   * uses software for the encode for stability. Hardware decode is common.
   */
  static h264ConstrainedBaselineProfile(): VideoCodecCapability {
    return new VideoCodecCapability('H264', {
      clockRate: 90000,
      mimeType: 'video/H264',
      sdpFmtpLine: 'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f',
    });
  }

  /**
   * Returns the configuration of H.264 Main Profile supported by the SDK
   *
   * This profile is more likely to use hardware for encode on most browsers
   * then constrained baseline profile. It may have modest quality/bitrate improvements
   * over baseline/constrained baseline profile.
   */
  static h264MainProfile(): VideoCodecCapability {
    return new VideoCodecCapability('H264', {
      clockRate: 90000,
      mimeType: 'video/H264',
      sdpFmtpLine: 'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=4d001f',
    });
  }

  /**
   * Returns the configuration of H.264 High Profile supported by the SDK.
   *
   * Currently most browsers do not have software fallback for high profile
   * which may impact stability. Its usage should be done with caution.
   *
   * On MacOS, until https://bugs.chromium.org/p/chromium/issues/detail?id=1520287 is
   * resolved, receivers will fail to allocate the decoder for this profile if the sender switches away and back
   * to this codec (e.g. fallback for a Firefox receiver, and then recovery when the Firefox
   * receiver leaves).
   *
   *
   */
  static h264HighProfile(): VideoCodecCapability {
    return new VideoCodecCapability('H264', {
      clockRate: 90000,
      mimeType: 'video/H264',
      sdpFmtpLine: 'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=64001f',
    });
  }

  /**
   * Returns the configuration of H.264 Constrained High Profile supported by the SDK
   *
   * This is only available on Safari. The same notes on H.264 High Profile apply to this
   * codec. Its usage is not recommended.
   */
  static h264ConstrainedHighProfile(): VideoCodecCapability {
    return new VideoCodecCapability('H264', {
      clockRate: 90000,
      mimeType: 'video/H264',
      sdpFmtpLine: 'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=640c1f',
    });
  }

  /**
   * Returns the configuration of H.264 recommended by the SDK for maximum compatability.
   */
  static h264(): VideoCodecCapability {
    return VideoCodecCapability.h264ConstrainedBaselineProfile();
  }

  /**
   * Returns the configuration of VP9 profile 0 supported by the SDK.
   * Profile 0 is for use with 8-bit source content.
   */
  static vp9Profile0(): VideoCodecCapability {
    return new VideoCodecCapability('VP9', {
      clockRate: 90000,
      mimeType: 'video/VP9',
      sdpFmtpLine: 'profile-id=0',
    });
  }

  /**
   * Returns the configuration of AV1 recommended by the SDK
   */
  static vp9(): VideoCodecCapability {
    return VideoCodecCapability.vp9Profile0();
  }

  /**
   * Returns the configuration of AV1 main profile used by the SDK
   */
  static av1Main(): VideoCodecCapability {
    return new VideoCodecCapability('AV1', {
      clockRate: 90000,
      mimeType: 'video/AV1',
    });
  }

  /**
   * Returns the configuration of AV1 recommended by the SDK
   */
  static av1(): VideoCodecCapability {
    return VideoCodecCapability.av1Main();
  }

  /**
   * Returns the configuration of codec corresponding to the signaled capability
   */
  static fromSignaled(capability: SdkVideoCodecCapability): VideoCodecCapability | undefined {
    switch (capability) {
      case SdkVideoCodecCapability.VP8:
        return VideoCodecCapability.vp8();
      case SdkVideoCodecCapability.H264_BASELINE_PROFILE:
        return VideoCodecCapability.h264BaselineProfile();
      case SdkVideoCodecCapability.H264_CONSTRAINED_BASELINE_PROFILE:
        return VideoCodecCapability.h264ConstrainedBaselineProfile();
      case SdkVideoCodecCapability.H264_MAIN_PROFILE:
        return VideoCodecCapability.h264MainProfile();
      case SdkVideoCodecCapability.H264_HIGH_PROFILE:
        return VideoCodecCapability.h264HighProfile();
      case SdkVideoCodecCapability.H264_CONSTRAINED_HIGH_PROFILE:
        return VideoCodecCapability.h264ConstrainedHighProfile();
      case SdkVideoCodecCapability.VP9_PROFILE_0:
        return VideoCodecCapability.vp9Profile0();
      case SdkVideoCodecCapability.AV1_MAIN_PROFILE:
        return VideoCodecCapability.av1Main();
      default:
        return undefined;
    }
  }
}
