// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import VideoCodecCapability from '../../src/sdp/VideoCodecCapability';
import { SdkVideoCodecCapability } from '../../src/signalingprotocol/SignalingProtocol';

describe('VideoCodecCapability', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  describe('constructor', () => {
    it('should correctly assign codecName and codecCapability', () => {
      const codecCapability = {
        mimeType: 'video/test',
        clockRate: 90000,
        sdpFmtpLine: 'test-line',
      };
      const codec = new VideoCodecCapability('TestCodec', codecCapability);
      expect(codec.codecName).to.eq('TestCodec');
      expect(codec.codecCapability).to.deep.eq(codecCapability);
    });
  });

  describe('equals', () => {
    const codec1 = new VideoCodecCapability('TestCodec', {
      mimeType: 'video/test',
      clockRate: 90000,
    });
    const codec2 = new VideoCodecCapability('TestCodec', {
      mimeType: 'video/test',
      clockRate: 90000,
    });
    const codec3 = new VideoCodecCapability('TestCodec2', {
      mimeType: 'video/test2',
      clockRate: 80000,
    });

    it('should return true for the same codec', () => {
      expect(codec1.equals(codec2)).to.be.true;
    });

    it('should return false for different codecs', () => {
      expect(codec1.equals(codec3)).to.be.false;
    });
  });

  describe('fmtpLineMatches', () => {
    it('should return true for matching H264 fmtp lines ignoring level', () => {
      const h264Capability = VideoCodecCapability.h264MainProfile();
      const line =
        'a=fmtp:96 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=4d0032';
      expect(h264Capability.fmtpLineMatches(line, 96)).to.be.true;
    });

    it('should return false for non-matching H264 fmtp lines', () => {
      const h264Capability = VideoCodecCapability.h264MainProfile();
      const line =
        'a=fmtp:96 level-asymmetry-allowed=0;packetization-mode=1;profile-level-id=4d001f';
      expect(h264Capability.fmtpLineMatches(line, 96)).to.be.false;
    });

    it('should return true for matching non-H264 fmtp lines', () => {
      const vp9Profile0Capability = VideoCodecCapability.vp9Profile0();
      const line = 'a=fmtp:97 profile-id=0';
      expect(vp9Profile0Capability.fmtpLineMatches(line, 97)).to.be.true;
    });

    it('should return false for non-matching non-H264 fmtp lines', () => {
      const vp8Capability = VideoCodecCapability.vp8();
      const line = 'a=fmtp:97 different-codec-param';
      expect(vp8Capability.fmtpLineMatches(line, 97)).to.be.false;
    });

    it('should return false when fmtp line is not defined', () => {
      const vp8Capability = VideoCodecCapability.vp8();
      vp8Capability.codecCapability.sdpFmtpLine = undefined;
      const line = 'a=fmtp:97 codec-specific-param';
      expect(vp8Capability.fmtpLineMatches(line, 97)).to.be.false;
    });
  });

  describe('static methods', () => {
    it('vp8 should return correct VideoCodecCapability', () => {
      const codec = VideoCodecCapability.vp8();
      expect(codec.codecName).to.eq('VP8');
      expect(codec.codecCapability).to.deep.eq({
        clockRate: 90000,
        mimeType: 'video/VP8',
      });
    });

    it('h264BaselineProfile should return correct VideoCodecCapability', () => {
      const codec = VideoCodecCapability.h264BaselineProfile();
      expect(codec.codecName).to.eq('H264');
      expect(codec.codecCapability).to.deep.eq({
        clockRate: 90000,
        mimeType: 'video/H264',
        sdpFmtpLine: 'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f',
      });
    });

    it('h264ConstrainedBaselineProfile should return correct VideoCodecCapability', () => {
      const codec = VideoCodecCapability.h264ConstrainedBaselineProfile();
      expect(codec.codecName).to.eq('H264');
      expect(codec.codecCapability).to.deep.eq({
        clockRate: 90000,
        mimeType: 'video/H264',
        sdpFmtpLine: 'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f',
      });
    });

    it('h264MainProfile should return correct VideoCodecCapability', () => {
      const codec = VideoCodecCapability.h264MainProfile();
      expect(codec.codecName).to.eq('H264');
      expect(codec.codecCapability).to.deep.eq({
        clockRate: 90000,
        mimeType: 'video/H264',
        sdpFmtpLine: 'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=4d001f',
      });
    });

    it('h264HighProfile should return correct VideoCodecCapability', () => {
      const codec = VideoCodecCapability.h264HighProfile();
      expect(codec.codecName).to.eq('H264');
      expect(codec.codecCapability).to.deep.eq({
        clockRate: 90000,
        mimeType: 'video/H264',
        sdpFmtpLine: 'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=64001f',
      });
    });

    it('h264ConstrainedHighProfile should return correct VideoCodecCapability', () => {
      const codec = VideoCodecCapability.h264ConstrainedHighProfile();
      expect(codec.codecName).to.eq('H264');
      expect(codec.codecCapability).to.deep.eq({
        clockRate: 90000,
        mimeType: 'video/H264',
        sdpFmtpLine: 'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=640c1f',
      });
    });

    it('vp9Profile0 should return correct VideoCodecCapability', () => {
      const codec = VideoCodecCapability.vp9Profile0();
      expect(codec.codecName).to.eq('VP9');
      expect(codec.codecCapability).to.deep.eq({
        clockRate: 90000,
        mimeType: 'video/VP9',
        sdpFmtpLine: 'profile-id=0',
      });
    });

    it('h264 should return correct VideoCodecCapability', () => {
      const codec = VideoCodecCapability.h264();
      expect(codec).to.deep.equal(VideoCodecCapability.h264ConstrainedBaselineProfile());
    });

    it('vp9 should return correct VideoCodecCapability', () => {
      const codec = VideoCodecCapability.vp9();
      expect(codec).to.deep.equal(VideoCodecCapability.vp9Profile0());
    });

    it('av1 should return correct VideoCodecCapability', () => {
      const codec = VideoCodecCapability.av1();
      expect(codec).to.deep.equal(VideoCodecCapability.av1Main());
    });
  });

  describe('fromSignaled', () => {
    it('should return correct VideoCodecCapability for VP8', () => {
      const codec = VideoCodecCapability.fromSignaled(SdkVideoCodecCapability.VP8);
      expect(codec).to.deep.equal(VideoCodecCapability.vp8());
    });

    it('should return H264 Baseline Profile codec for SdkVideoCodecCapability.H264_BASELINE_PROFILE', () => {
      const codec = VideoCodecCapability.fromSignaled(
        SdkVideoCodecCapability.H264_BASELINE_PROFILE
      );
      expect(codec).to.deep.equal(VideoCodecCapability.h264BaselineProfile());
    });

    it('should return H264 Constrained Baseline Profile codec for SdkVideoCodecCapability.H264_CONSTRAINED_BASELINE_PROFILE', () => {
      const codec = VideoCodecCapability.fromSignaled(
        SdkVideoCodecCapability.H264_CONSTRAINED_BASELINE_PROFILE
      );
      expect(codec).to.deep.equal(VideoCodecCapability.h264ConstrainedBaselineProfile());
    });

    it('should return H264 Constrained Baseline Profile codec for SdkVideoCodecCapability.H264_MAIN_PROFILE', () => {
      const codec = VideoCodecCapability.fromSignaled(SdkVideoCodecCapability.H264_MAIN_PROFILE);
      expect(codec).to.deep.equal(VideoCodecCapability.h264MainProfile());
    });

    it('should return H264 Constrained Baseline Profile codec for SdkVideoCodecCapability.H264_HIGH_PROFILE', () => {
      const codec = VideoCodecCapability.fromSignaled(SdkVideoCodecCapability.H264_HIGH_PROFILE);
      expect(codec).to.deep.equal(VideoCodecCapability.h264HighProfile());
    });

    it('should return H264 Constrained Baseline Profile codec for SdkVideoCodecCapability.H264_CONSTRAINED_HIGH_PROFILE', () => {
      const codec = VideoCodecCapability.fromSignaled(
        SdkVideoCodecCapability.H264_CONSTRAINED_HIGH_PROFILE
      );
      expect(codec).to.deep.equal(VideoCodecCapability.h264ConstrainedHighProfile());
    });

    it('should return VP9 Profile 0 codec for SdkVideoCodecCapability.VP9_PROFILE_0', () => {
      const codec = VideoCodecCapability.fromSignaled(SdkVideoCodecCapability.VP9_PROFILE_0);
      expect(codec).to.deep.equal(VideoCodecCapability.vp9Profile0());
    });

    it('should return AV1 Main codec for SdkVideoCodecCapability.AV1_MAIN_PROFILE', () => {
      const codec = VideoCodecCapability.fromSignaled(SdkVideoCodecCapability.AV1_MAIN_PROFILE);
      expect(codec).to.deep.equal(VideoCodecCapability.av1Main());
    });

    it('should return undefined for an unknown codec', () => {
      const codec = VideoCodecCapability.fromSignaled(-1 as SdkVideoCodecCapability);
      expect(codec).to.be.undefined;
    });
  });
});
