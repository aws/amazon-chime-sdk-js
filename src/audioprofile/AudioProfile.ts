// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DefaultBrowserBehavior from '../browserbehavior/DefaultBrowserBehavior';

/**
 * AudioProfile defines settings for audio quality.
 */
export default class AudioProfile {
  /**
   * Allows a builder to configure the opus encoder bitrate to
   * be used for the session to send audio. If null, the browser
   * internally sets a default bitrate.
   */
  audioBitrateBps: number | null;

  /**
   * Allows a builder to enable audio redundancy at the start of
   * the session. If enabled (and browser supports redundancy),
   * the amount of redundancy varies based on the amount of packet loss
   * detected in the client to server direction. This can consume upto
   * 3x the configured audio bitrate in high packet loss scenarios (> 20%).
   */
  private enableAudioRedundancy: boolean;

  /**
   * Constructs an AudioProfile. If no audio bitrate is supplied then the AudioProfile
   * does not adjust the browser's internal bitrate setting. If the enableAudioRedundancy
   * flag is not supplied then the AudioProfile enables it by default.
   */
  constructor(audioBitrateBps: number | null = null, enableAudioRedundancy: boolean = true) {
    this.audioBitrateBps = audioBitrateBps;
    this.enableAudioRedundancy =
      new DefaultBrowserBehavior().supportsAudioRedundancy() && enableAudioRedundancy;
  }

  /**
   * Creates an AudioProfile optimized for fullband speech (40 kbit/s mono).
   */
  static fullbandSpeechMono(enableAudioRedundancy: boolean = true): AudioProfile {
    return new AudioProfile(40000, enableAudioRedundancy);
  }

  /**
   * Creates an AudioProfile optimized for fullband music (64 kbit/s mono).
   */
  static fullbandMusicMono(enableAudioRedundancy: boolean = true): AudioProfile {
    return new AudioProfile(64000, enableAudioRedundancy);
  }

  /**
   * Creates an AudioProfile optimized for fullband stereo music (128 kbit/s stereo).
   */
  static fullbandMusicStereo(enableAudioRedundancy: boolean = true): AudioProfile {
    return new AudioProfile(128000, enableAudioRedundancy);
  }

  /**
   * Returns true if audio profile is set to stereo mode.
   */
  isStereo(): boolean {
    return this.audioBitrateBps === 128000;
  }

  /**
   * Returns true if redundancy is supported and enabled.
   */
  hasRedundancyEnabled(): boolean {
    return this.enableAudioRedundancy;
  }
}
