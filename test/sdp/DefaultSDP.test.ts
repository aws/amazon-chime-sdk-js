// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import DefaultSDP from '../../src/sdp/DefaultSDP';
import SDPCandidateType from '../../src/sdp/SDPCandidateType';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';
import ChromeSDPMock from './ChromeSDPMock';
import FirefoxSDPMock from './FirefoxSDPMock';
import SafariSDPMock from './SafariSDPMock';
import SDPMock from './SDPMock';

describe('DefaultSDP', () => {
  let expect: Chai.ExpectStatic;
  const mockBehavior = new DOMMockBehavior();
  let mockBuilder: DOMMockBuilder;

  before(() => {
    expect = chai.expect;
  });

  beforeEach(() => {
    mockBehavior.browserName = 'firefox';
    mockBuilder = new DOMMockBuilder();
  });

  afterEach(() => {
    mockBuilder.cleanup();
  });

  describe('construction', () => {
    it('can be constructed', () => {
      const sdp = new DefaultSDP(SDPMock.VIDEO_HOST_AUDIO_ANSWER);
      expect(sdp).to.not.equal(null);
    });
  });

  describe('clone', () => {
    it('clones the SDP object', () => {
      const sdpA = new DefaultSDP(SDPMock.VIDEO_HOST_AUDIO_ANSWER);
      const sdpB = sdpA.clone();
      expect(sdpA.sdp).to.equal(sdpB.sdp);
    });
  });

  describe('hasVideo', () => {
    it('returns true if the sdp has a line for the video', () => {
      const sdp = new DefaultSDP(SDPMock.VIDEO_HOST_AUDIO_VIDEO_ANSWER);
      expect(sdp.hasVideo()).to.be.true;
    });
  });

  describe('hasCandidates', () => {
    it('returns false if SDP has no candidates', () => {
      const sdp = new DefaultSDP(SDPMock.LOCAL_OFFER_WITHOUT_CANDIDATE);
      const candidateExists = sdp.hasCandidates();
      expect(candidateExists).to.equal(false);
    });

    it('returns true if SDP has candidates', () => {
      const sdp = new DefaultSDP(SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO);
      const candidateExists = sdp.hasCandidates();
      expect(candidateExists).to.equal(true);
    });
  });

  describe('isRTPCandidate', () => {
    it('returns false if component type of ICE candidate is not RTP', () => {
      const isRTPCandidate = DefaultSDP.isRTPCandidate(SDPMock.TEST_CANDIDATE);
      expect(isRTPCandidate).to.equal(false);
    });

    it('returns true if component type of ICE candidate is RTP', () => {
      const isRTPCandidate = DefaultSDP.isRTPCandidate(SDPMock.IS_CANDIDATE);
      expect(isRTPCandidate).to.equal(true);
    });
  });

  describe('copyVideo', () => {
    it('copies the video media section from another SDP', () => {
      const sdpA = new DefaultSDP(SDPMock.VIDEO_HOST_AUDIO_VIDEO_ANSWER);
      const sdpB = new DefaultSDP(SDPMock.VIDEO_HOST_AUDIO_ANSWER);
      const sdpC = sdpB.copyVideo(sdpA.sdp);
      expect(sdpC.sdp).to.equal(SDPMock.VIDEO_HOST_AUDIO_ANSWER_WITH_VIDEO_COPIED);
    });
  });

  describe('withAudioMaxAverageBitrate', () => {
    it('adds the bitrate parameter', () => {
      const sdpA = new DefaultSDP(SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO);
      const sdpB = sdpA.withAudioMaxAverageBitrate(64000);
      expect(sdpB.sdp).to.equal(
        SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO_WITH_AUDIO_BITRATE.replace('$VALUE', '64000')
      );
    });

    it('updates an old bitrate parameter', () => {
      const sdpA = new DefaultSDP(SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO);
      const sdpB = sdpA.withAudioMaxAverageBitrate(64000).withAudioMaxAverageBitrate(48000);
      expect(sdpB.sdp).to.equal(
        SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO_WITH_AUDIO_BITRATE.replace('$VALUE', '48000')
      );
    });

    it('returns same SDP if null passed in', () => {
      const sdpA = new DefaultSDP(SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO);
      const sdpB = sdpA.withAudioMaxAverageBitrate(null);
      expect(sdpB.sdp).to.equal(sdpA.sdp);
    });

    it('returns same SDP if zero passed in', () => {
      const sdpA = new DefaultSDP(SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO);
      const sdpB = sdpA.withAudioMaxAverageBitrate(0);
      expect(sdpB.sdp).to.equal(sdpA.sdp);
    });

    it('returns same SDP if undefined passed in', () => {
      const sdpA = new DefaultSDP(SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO);
      const sdpB = sdpA.withAudioMaxAverageBitrate(undefined);
      expect(sdpB.sdp).to.equal(sdpA.sdp);
    });

    it('clamps to the lowest bitrate', () => {
      const sdpA = new DefaultSDP(SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO);
      const sdpB = sdpA.withAudioMaxAverageBitrate(1);
      expect(sdpB.sdp).to.equal(
        SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO_WITH_AUDIO_BITRATE.replace(
          '$VALUE',
          `${DefaultSDP.rfc7587LowestBitrate}`
        )
      );
    });

    it('clamps to the highest bitrate', () => {
      const sdpA = new DefaultSDP(SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO);
      const sdpB = sdpA.withAudioMaxAverageBitrate(Infinity);
      expect(sdpB.sdp).to.equal(
        SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO_WITH_AUDIO_BITRATE.replace(
          '$VALUE',
          `${DefaultSDP.rfc7587HighestBitrate}`
        )
      );
    });
  });

  describe('withBandwidthRestriction', () => {
    it('adds bandwidth line for Chrome', () => {
      const sdpA = new DefaultSDP(SDPMock.VIDEO_HOST_AUDIO_VIDEO_ANSWER);
      const sdpB = sdpA.withBandwidthRestriction(600, false);
      expect(sdpB.sdp).to.equal(SDPMock.VIDEO_HOST_AUDIO_VIDEO_ANSWER_WITH_BANDWIDTH_RESTRICTION);
    });

    it('adds bandwidth line for Firefox', () => {
      const sdpA = new DefaultSDP(SDPMock.VIDEO_HOST_AUDIO_VIDEO_ANSWER);
      const sdpB = sdpA.withBandwidthRestriction(600, true);
      expect(sdpB.sdp).to.equal(
        SDPMock.VIDEO_HOST_AUDIO_VIDEO_ANSWER_WITH_BANDWIDTH_RESTRICTION_FOR_FIREFOX
      );
    });
  });

  describe('withoutSDPMock.SERVER_REFLEXIVE_CANDIDATES', () => {
    it('removes server reflexive candidate', () => {
      const candidates = [
        SDPMock.PEER_REFLEXIVE_CANDIDATE,
        SDPMock.SERVER_REFLEXIVE_CANDIDATE,
        SDPMock.RELAY_CANDIDATE,
        SDPMock.TEST_CANDIDATE,
      ];
      const sdpA = new DefaultSDP(candidates.join('\r\n'));
      const sdpB = sdpA.withoutServerReflexiveCandidates();
      const candidatesB = [
        SDPMock.PEER_REFLEXIVE_CANDIDATE,
        SDPMock.RELAY_CANDIDATE,
        SDPMock.TEST_CANDIDATE,
      ];
      expect(sdpB.sdp).to.equal(candidatesB.join('\r\n'));
    });
  });

  describe('withoutCandidateType', () => {
    it('removes candidates of specific type', () => {
      const candidates = [
        SDPMock.PEER_REFLEXIVE_CANDIDATE,
        SDPMock.SERVER_REFLEXIVE_CANDIDATE,
        SDPMock.RELAY_CANDIDATE,
        SDPMock.TEST_CANDIDATE,
      ];
      const sdpA = new DefaultSDP(candidates.join('\r\n'));
      const sdpB = sdpA.withoutCandidateType(SDPCandidateType.Relay);
      const candidatesB = [
        SDPMock.PEER_REFLEXIVE_CANDIDATE,
        SDPMock.SERVER_REFLEXIVE_CANDIDATE,
        SDPMock.TEST_CANDIDATE,
      ];
      const sdpC = sdpA.withoutCandidateType(SDPCandidateType.Host);
      const candidatesC = [
        SDPMock.PEER_REFLEXIVE_CANDIDATE,
        SDPMock.SERVER_REFLEXIVE_CANDIDATE,
        SDPMock.RELAY_CANDIDATE,
      ];
      const sdpD = sdpA.withoutCandidateType(SDPCandidateType.PeerReflexive);
      const candidatesD = [
        SDPMock.SERVER_REFLEXIVE_CANDIDATE,
        SDPMock.RELAY_CANDIDATE,
        SDPMock.TEST_CANDIDATE,
      ];
      expect(sdpB.sdp).to.equal(candidatesB.join('\r\n'));
      expect(sdpC.sdp).to.equal(candidatesC.join('\r\n'));
      expect(sdpD.sdp).to.equal(candidatesD.join('\r\n'));
    });

    it('returns same SDP when no candidate', () => {
      const sdpA = new DefaultSDP(SDPMock.LOCAL_OFFER_WITHOUT_CANDIDATE);
      const sdpB = sdpA.withoutCandidateType(SDPCandidateType.Relay);
      expect(sdpB.sdp).to.equal(SDPMock.LOCAL_OFFER_WITHOUT_CANDIDATE);
    });

    it('returns same SDP when SDP candidate type is unknown', () => {
      const sdpA = new DefaultSDP(SDPMock.UNKNOWN_CANDIDATE);
      const sdpB = sdpA.withoutCandidateType(SDPCandidateType.Relay);
      expect(sdpB.sdp).to.equal(SDPMock.UNKNOWN_CANDIDATE);
    });
  });

  describe('withBundleAudioVideo', () => {
    it('converts BUNDLE audio to BUNDLE audio video', () => {
      const sdpA = new DefaultSDP(SDPMock.VIDEO_HOST_AUDIO_ANSWER);
      const sdpB = sdpA.withBundleAudioVideo();
      expect(sdpB.sdp).to.equal(SDPMock.VIDEO_HOST_AUDIO_ANSWER_WITH_BUNDLE_AUDIO_VIDEO);
    });
  });

  describe('withUnifiedPlanFormat', () => {
    it('returns same sdp for mozilla unified plan type sdp', () => {
      const sdpAudio = new DefaultSDP(SDPMock.MOZILLA_AUDIO_SDP).withUnifiedPlanFormat().sdp;
      expect(sdpAudio).to.equal(SDPMock.MOZILLA_AUDIO_SDP);
      const newSdp = new DefaultSDP(SDPMock.MOZILLA_AV_SENDING).withUnifiedPlanFormat().sdp;
      expect(newSdp).to.equal(SDPMock.MOZILLA_AV_SENDING);
    });

    it('replaces user origin attribute with mozilla-chrome keyword for Chrome sdp', () => {
      const newSdp = new DefaultSDP(
        SDPMock.CHROME_UNIFIED_PLAN_AUDIO_ONLY_WITH_VIDEO_CHECK_IN
      ).withUnifiedPlanFormat().sdp;
      expect(newSdp.includes('o=mozilla-chrome')).to.be.true;
    });
  });

  describe('hasCandidatesForAllMLines', () => {
    it('returns true if sdp does not have dummy ip in connection attributes', () => {
      const checkResult = new DefaultSDP(
        SDPMock.CHROME_UNIFIED_PLAN_AUDIO_ONLY_WITH_VIDEO_CHECK_IN
      ).hasCandidatesForAllMLines();
      expect(checkResult).to.be.true;
    });

    it('returns false if sdp does have dummy ip in connection attributes', () => {
      let checkResult = new DefaultSDP(
        SafariSDPMock.IOS_SAFARI_AUDIO_SENDRECV_VIDEO_INACTIVE
      ).hasCandidatesForAllMLines();
      expect(checkResult).to.be.false;

      checkResult = new DefaultSDP(
        SafariSDPMock.IOS_SAFARI_AUDIO_SENDRECV_VIDEO_INACTIVE
      ).hasCandidates();
      expect(checkResult).to.be.false;
    });
  });

  describe('withOldFashionedMungingSimulcast', () => {
    it('returns same SDP if SDP is garbage', () => {
      const sdpLocalOffer = new DefaultSDP('garbage data');
      const simulcastedSDP = new DefaultSDP(sdpLocalOffer.sdp).withOldFashionedMungingSimulcast(2);
      expect(simulcastedSDP.sdp).to.equal(sdpLocalOffer.sdp);
    });

    it('returns same SDP if SDP has no video section', () => {
      const simulcastedSDP = new DefaultSDP(
        SDPMock.VIDEO_HOST_AUDIO_ANSWER
      ).withOldFashionedMungingSimulcast(2);
      expect(simulcastedSDP.sdp).to.equal(SDPMock.VIDEO_HOST_AUDIO_ANSWER);
    });

    it('returns same SDP if only one layer is wanted for video', () => {
      const sdpLocalOffer = new DefaultSDP(SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO);
      const simulcastedSDP = new DefaultSDP(sdpLocalOffer.sdp).withOldFashionedMungingSimulcast(1);
      expect(simulcastedSDP.sdp).to.equal(sdpLocalOffer.sdp);
    });

    it('returns same SDP if video section has no ssrc attribute', () => {
      const sdpLocalOffer = new DefaultSDP(
        SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO_WITH_NO_SSRC_ATTRIBUTE_VALUE
      );
      const simulcastedSDP = new DefaultSDP(sdpLocalOffer.sdp).withOldFashionedMungingSimulcast(2);
      expect(simulcastedSDP.sdp).to.equal(sdpLocalOffer.sdp);
    });

    it('returns same SDP if video section has no FID group', () => {
      const sdpLocalOffer = new DefaultSDP(SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO_WITHOUT_FID);
      const simulcastedSDP = new DefaultSDP(sdpLocalOffer.sdp).withOldFashionedMungingSimulcast(2);
      expect(simulcastedSDP.sdp).to.equal(SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO_WITHOUT_FID);
    });

    it('returns same SDP if original SDP only has recv video section', () => {
      const simulcastedSDP = new DefaultSDP(
        SDPMock.LOCAL_OFFER_WITH_RECV_VIDEO
      ).withOldFashionedMungingSimulcast(2);
      expect(simulcastedSDP.sdp).to.equal(SDPMock.LOCAL_OFFER_WITH_RECV_VIDEO);
    });

    it('returns simulcasted SDP with 2 layers if SDP has correct PlanB sendrecv video section', () => {
      const simulcastedSDP = new DefaultSDP(
        SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO
      ).withOldFashionedMungingSimulcast(2).sdp;
      expect(simulcastedSDP).to.equal(SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO_SIMULCAST_TWO_LAYERS);
    });
  });

  describe('ssrcForVideoSendingSection', () => {
    it('audio only', () => {
      const sdp = new DefaultSDP(SafariSDPMock.IOS_SAFARI_AUDIO_SENDRECV_VIDEO_INACTIVE);
      expect(sdp.ssrcForVideoSendingSection()).to.deep.equal('');
      const sdpFirefox = new DefaultSDP(FirefoxSDPMock.AUDIO_SENDRECV_VIDEO_INACTIVE);
      expect(sdpFirefox.ssrcForVideoSendingSection()).to.deep.equal('');
    });

    it('video recvonly', () => {
      const sdp = new DefaultSDP(SafariSDPMock.IOS_SAFARI_AUDIO_SENDRECV_VIDEO_RECV);
      expect(sdp.ssrcForVideoSendingSection()).to.deep.equal('');
      const sdpPlanB = new DefaultSDP(ChromeSDPMock.PLAN_B_AUDIO_SENDRECV_VIDEO_RECVONLY);
      expect(sdpPlanB.ssrcForVideoSendingSection()).to.deep.equal('');
    });

    it('video sendrecv', () => {
      const sdp = new DefaultSDP(SafariSDPMock.SAFARI_AUDIO_VIDEO_SENDING);
      expect(sdp.ssrcForVideoSendingSection()).to.deep.equal('2209845614');
      // TODO: Not expecting Firefox to suffer from this issue
      const sdpFirefox = new DefaultSDP(FirefoxSDPMock.AUDIO_SENDRECV_VIDEO_SENDRECV);
      expect(sdpFirefox.ssrcForVideoSendingSection()).to.deep.equal('');

      const sdpChromePlanB = new DefaultSDP(ChromeSDPMock.PLAN_B_AUDIO_SENDRECV_VIDEO_SENDRECV);
      expect(sdpChromePlanB.ssrcForVideoSendingSection()).to.deep.equal('515437170');
    });
  });

  describe('videoSendSectionHasDifferentSSRC', () => {
    it('returns true if the ssrc for video sending changes', () => {
      const sdp1 = new DefaultSDP(ChromeSDPMock.PLAN_B_AUDIO_SENDRECV_VIDEO_SENDRECV);
      const sdp2 = new DefaultSDP(ChromeSDPMock.PLAN_B_AUDIO_SENDRECV_VIDEO_SENDRECV_2);
      expect(sdp1.videoSendSectionHasDifferentSSRC(sdp2)).to.equal(true);
      // from sending to sending and receiving
      const sdp3 = new DefaultSDP(SafariSDPMock.SAFARI_AUDIO_VIDEO_SENDING);
      const sdp4 = new DefaultSDP(SafariSDPMock.SAFARI_AUDIO_VIDEO_SENDING_RECEIVING);
      expect(sdp3.videoSendSectionHasDifferentSSRC(sdp4)).to.equal(false);
    });

    it('return false if the ssrc for video sending do not change', () => {
      const sdp1 = new DefaultSDP(SafariSDPMock.IOS_SAFARI_AUDIO_SENDRECV_VIDEO_RECV);
      const sdp2 = new DefaultSDP(SafariSDPMock.SAFARI_AUDIO_VIDEO_SENDING);
      expect(sdp1.videoSendSectionHasDifferentSSRC(sdp2)).to.equal(false);
      expect(sdp2.videoSendSectionHasDifferentSSRC(sdp1)).to.equal(false);
    });
  });

  describe('preferH264IfExists', () => {
    it('sorts codec preference', () => {
      const sdpObj = new DefaultSDP(FirefoxSDPMock.FIREFOX_REMOTE_ANSWER_WITH_VP8_H264_UNSORTED);
      expect(sdpObj.preferH264IfExists().sdp).to.deep.equal(
        FirefoxSDPMock.FIREFOX_REMOTE_ANSWER_WITH_VP8_H264_SORTED
      );
      const newSdpObj = new DefaultSDP(FirefoxSDPMock.FIREFOX_NIGHTLY_79_REMOTE_ANSWER);
      expect(newSdpObj.preferH264IfExists().sdp).to.deep.equal(
        FirefoxSDPMock.FIREFOX_NIGHTLY_79_REMOTE_ANSWER_H264_PREFERRED
      );
    });

    it('does nothing if the preference is sorted', () => {
      const newSdpObj = new DefaultSDP(FirefoxSDPMock.FIREFOX_REMOTE_ANSWER_WITH_VP8_H264_SORTED);
      expect(newSdpObj.preferH264IfExists().sdp).to.deep.equal(
        FirefoxSDPMock.FIREFOX_REMOTE_ANSWER_WITH_VP8_H264_SORTED
      );
    });

    it('does nothing if only contain VP8 or H264', () => {
      const sdpObj = new DefaultSDP(FirefoxSDPMock.FIREFOX_REMOTE_ANSWER_WITH_VP8_ONLY);
      expect(sdpObj.preferH264IfExists().sdp).to.deep.equal(
        FirefoxSDPMock.FIREFOX_REMOTE_ANSWER_WITH_VP8_ONLY
      );
    });
  });
});
