// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import SDP from '../../src/sdp/SDP';
import SDPCandidateType from '../../src/sdp/SDPCandidateType';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';
import ChromeSDPMock from './ChromeSDPMock';
import FirefoxSDPMock from './FirefoxSDPMock';
import SafariSDPMock from './SafariSDPMock';
import SDPMock from './SDPMock';

describe('SDP', () => {
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
      const sdp = new SDP(SDPMock.VIDEO_HOST_AUDIO_ANSWER);
      expect(sdp).to.not.equal(null);
    });
  });

  describe('clone', () => {
    it('clones the SDP object', () => {
      const sdpA = new SDP(SDPMock.VIDEO_HOST_AUDIO_ANSWER);
      const sdpB = sdpA.clone();
      expect(sdpA.sdp).to.equal(sdpB.sdp);
    });
  });

  describe('hasVideo', () => {
    it('returns true if the sdp has a line for the video', () => {
      const sdp = new SDP(SDPMock.VIDEO_HOST_AUDIO_VIDEO_ANSWER);
      expect(sdp.hasVideo()).to.be.true;
    });
  });

  describe('hasCandidates', () => {
    it('returns false if SDP has no candidates', () => {
      const sdp = new SDP(SDPMock.LOCAL_OFFER_WITHOUT_CANDIDATE);
      const candidateExists = sdp.hasCandidates();
      expect(candidateExists).to.equal(false);
    });

    it('returns true if SDP has candidates', () => {
      const sdp = new SDP(SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO);
      const candidateExists = sdp.hasCandidates();
      expect(candidateExists).to.equal(true);
    });
  });

  describe('isRTPCandidate', () => {
    it('returns false if component type of ICE candidate is not RTP', () => {
      const isRTPCandidate = SDP.isRTPCandidate(SDPMock.TEST_CANDIDATE);
      expect(isRTPCandidate).to.equal(false);
    });

    it('returns true if component type of ICE candidate is RTP', () => {
      const isRTPCandidate = SDP.isRTPCandidate(SDPMock.IS_CANDIDATE);
      expect(isRTPCandidate).to.equal(true);
    });
  });

  describe('withAudioMaxAverageBitrate', () => {
    it('adds the bitrate parameter', () => {
      const sdpA = new SDP(SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO);
      const sdpB = sdpA.withAudioMaxAverageBitrate(64000);
      expect(sdpB.sdp).to.equal(
        SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO_WITH_AUDIO_BITRATE.replace('$VALUE', '64000')
      );
    });

    it('updates an old bitrate parameter', () => {
      const sdpA = new SDP(SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO);
      const sdpB = sdpA.withAudioMaxAverageBitrate(64000).withAudioMaxAverageBitrate(48000);
      expect(sdpB.sdp).to.equal(
        SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO_WITH_AUDIO_BITRATE.replace('$VALUE', '48000')
      );
    });

    it('returns same SDP if null passed in', () => {
      const sdpA = new SDP(SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO);
      const sdpB = sdpA.withAudioMaxAverageBitrate(null);
      expect(sdpB.sdp).to.equal(sdpA.sdp);
    });

    it('returns same SDP if zero passed in', () => {
      const sdpA = new SDP(SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO);
      const sdpB = sdpA.withAudioMaxAverageBitrate(0);
      expect(sdpB.sdp).to.equal(sdpA.sdp);
    });

    it('returns same SDP if undefined passed in', () => {
      const sdpA = new SDP(SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO);
      const sdpB = sdpA.withAudioMaxAverageBitrate(undefined);
      expect(sdpB.sdp).to.equal(sdpA.sdp);
    });

    it('clamps to the lowest bitrate', () => {
      const sdpA = new SDP(SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO);
      const sdpB = sdpA.withAudioMaxAverageBitrate(1);
      expect(sdpB.sdp).to.equal(
        SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO_WITH_AUDIO_BITRATE.replace(
          '$VALUE',
          `${SDP.rfc7587LowestBitrate}`
        )
      );
    });

    it('clamps to the highest bitrate', () => {
      const sdpA = new SDP(SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO);
      const sdpB = sdpA.withAudioMaxAverageBitrate(Infinity);
      expect(sdpB.sdp).to.equal(
        SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO_WITH_AUDIO_BITRATE.replace(
          '$VALUE',
          `${SDP.rfc7587HighestBitrate}`
        )
      );
    });
  });

  describe('withStereoAudio', () => {
    it('adds the stereo parameters correctly for fmtp that follows opus rtpmap', () => {
      const sdpA = new SDP(SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO);
      const sdpB = sdpA.withAudioMaxAverageBitrate(128000).withStereoAudio();
      expect(sdpB.sdp).to.equal(SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO_WITH_STEREO);
    });

    it('adds the stereo parameters correctly for fmtp that precedes opus rtpmap', () => {
      const sdpA = new SDP(SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO_FIREFOX);
      const sdpB = sdpA.withAudioMaxAverageBitrate(128000).withStereoAudio();
      expect(sdpB.sdp).to.equal(SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO_WITH_STEREO_FIREFOX);
    });
  });

  describe('withVideoLayersAllocationRtpHeaderExtension', () => {
    it('does not add layers allocation line if no id is available', () => {
      const sdpA = new SDP(SDPMock.LOCAL_OFFER_WITH_ALL_HEADER_EXTENSIONS);
      const sdpB = sdpA.withVideoLayersAllocationRtpHeaderExtension(null);
      expect(sdpB.sdp).to.equal(SDPMock.LOCAL_OFFER_WITH_ALL_HEADER_EXTENSIONS);
    });

    it('adds layers allocation line if available', () => {
      const sdpA = new SDP(SDPMock.LOCAL_OFFER_WITH_CONSECUTIVE_HEADER_EXTENSIONS);
      const sdpB = sdpA.withVideoLayersAllocationRtpHeaderExtension(null);
      expect(sdpB.sdp).to.equal(
        SDPMock.LOCAL_OFFER_WITH_CONSECUTIVE_HEADER_EXTENSIONS_AND_LAYERS_ALLOCATION_EXTENSION
      );
    });

    it('adds layers allocation line if available in gap', () => {
      const sdpA = new SDP(SDPMock.LOCAL_OFFER_WITH_GAP_IN_HEADER_EXTENSIONS);
      const sdpB = sdpA.withVideoLayersAllocationRtpHeaderExtension(null);
      expect(sdpB.sdp).to.equal(
        SDPMock.LOCAL_OFFER_WITH_GAP_IN_HEADER_EXTENSIONS_AND_LAYERS_ALLOCATION_EXTENSION
      );
    });

    it('adds layers allocation line if there is ID available and extension not in previous SDP', () => {
      const sdpA = new SDP(SDPMock.LOCAL_OFFER_WITH_CONSECUTIVE_HEADER_EXTENSIONS);
      const sdpPrev = new SDP(SDPMock.LOCAL_OFFER_WITH_CONSECUTIVE_HEADER_EXTENSIONS);
      const sdpB = sdpA.withVideoLayersAllocationRtpHeaderExtension(sdpPrev);
      expect(sdpB.sdp).to.equal(
        SDPMock.LOCAL_OFFER_WITH_CONSECUTIVE_HEADER_EXTENSIONS_AND_LAYERS_ALLOCATION_EXTENSION
      );
    });

    it('adds layers allocation line if id available in gap and extension not in previous SDP', () => {
      const sdpA = new SDP(SDPMock.LOCAL_OFFER_WITH_GAP_IN_HEADER_EXTENSIONS);
      const sdpPrev = new SDP(SDPMock.LOCAL_OFFER_WITH_CONSECUTIVE_HEADER_EXTENSIONS);
      const sdpB = sdpA.withVideoLayersAllocationRtpHeaderExtension(sdpPrev);
      expect(sdpB.sdp).to.equal(
        SDPMock.LOCAL_OFFER_WITH_GAP_IN_HEADER_EXTENSIONS_AND_LAYERS_ALLOCATION_EXTENSION
      );
    });

    it('adds layers allocation line using extension id of previous SDP', () => {
      const sdpA = new SDP(SDPMock.LOCAL_OFFER_WITH_CONSECUTIVE_HEADER_EXTENSIONS);
      const sdpPrev = new SDP(SDPMock.LOCAL_OFFER_WITH_LAYERS_ALLOCATION_EXTENSION_WITH_GAP_ID);
      const sdpB = sdpA.withVideoLayersAllocationRtpHeaderExtension(sdpPrev);
      expect(sdpB.sdp).to.equal(
        SDPMock.LOCAL_OFFER_WITH_ADDED_LAYERS_ALLOCATION_EXTENSION_WITH_GAP_ID
      );
    });

    it('does not add layers allocation line if it already exists', () => {
      const sdpA = new SDP(SDPMock.LOCAL_OFFER_WITH_LAYERS_ALLOCATION_EXTENSION_WITH_GAP_ID);
      const sdpB = sdpA.withVideoLayersAllocationRtpHeaderExtension(null);
      expect(sdpB.sdp).to.equal(SDPMock.LOCAL_OFFER_WITH_LAYERS_ALLOCATION_EXTENSION_WITH_GAP_ID);
    });

    it('remove layers allocation line if previous ID is used by another extension', () => {
      const sdpA = new SDP(
        SDPMock.LOCAL_OFFER_WITH_GAP_IN_HEADER_EXTENSIONS_AND_LAYERS_ALLOCATION_EXTENSION
      );
      const sdpPrev = new SDP(SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO_WITH_HEADER_EXTENSION);
      const sdpB = sdpA.withVideoLayersAllocationRtpHeaderExtension(sdpPrev);
      expect(sdpB.sdp).to.equal(
        SDPMock.LOCAL_OFFER_WITH_GAP_IN_HEADER_EXTENSIONS_AND_NO_LAYERS_ALLOCATION_EXTENSION
      );
    });

    it('override layers allocation extension id if differs from previous ID', () => {
      const sdpA = new SDP(SDPMock.LOCAL_OFFER_WITH_LAYERS_ALLOCATION_EXTENSION_WITH_GAP_ID);
      const sdpPrev = new SDP(SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO_WITH_HEADER_EXTENSION);
      const sdpB = sdpA.withVideoLayersAllocationRtpHeaderExtension(sdpPrev);
      expect(sdpB.sdp).to.equal(SDPMock.LOCAL_OFFER_WITH_LAYERS_ALLOCATION_EXTENSION_OVERRIDE_ID);
    });

    it('do not add layers allocation extension if previous ID is used by another ID', () => {
      const sdpA = new SDP(
        SDPMock.LOCAL_OFFER_WITH_GAP_IN_HEADER_EXTENSIONS_AND_NO_LAYERS_ALLOCATION_EXTENSION
      );
      const sdpPrev = new SDP(SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO_WITH_HEADER_EXTENSION);
      const sdpB = sdpA.withVideoLayersAllocationRtpHeaderExtension(sdpPrev);
      expect(sdpB.sdp).to.equal(
        SDPMock.LOCAL_OFFER_WITH_GAP_IN_HEADER_EXTENSIONS_AND_NO_LAYERS_ALLOCATION_EXTENSION
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
      const sdpA = new SDP(candidates.join('\r\n'));
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
      const sdpA = new SDP(candidates.join('\r\n'));
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
      const sdpA = new SDP(SDPMock.LOCAL_OFFER_WITHOUT_CANDIDATE);
      const sdpB = sdpA.withoutCandidateType(SDPCandidateType.Relay);
      expect(sdpB.sdp).to.equal(SDPMock.LOCAL_OFFER_WITHOUT_CANDIDATE);
    });

    it('returns same SDP when SDP candidate type is unknown', () => {
      const sdpA = new SDP(SDPMock.UNKNOWN_CANDIDATE);
      const sdpB = sdpA.withoutCandidateType(SDPCandidateType.Relay);
      expect(sdpB.sdp).to.equal(SDPMock.UNKNOWN_CANDIDATE);
    });
  });

  describe('withUnifiedPlanFormat', () => {
    it('returns same sdp for mozilla unified plan type sdp', () => {
      const sdpAudio = new SDP(SDPMock.MOZILLA_AUDIO_SDP).withUnifiedPlanFormat().sdp;
      expect(sdpAudio).to.equal(SDPMock.MOZILLA_AUDIO_SDP);
      const newSdp = new SDP(SDPMock.MOZILLA_AV_SENDING).withUnifiedPlanFormat().sdp;
      expect(newSdp).to.equal(SDPMock.MOZILLA_AV_SENDING);
    });

    it('replaces user origin attribute with mozilla-chrome keyword for Chrome sdp', () => {
      const newSdp = new SDP(
        SDPMock.CHROME_UNIFIED_PLAN_AUDIO_ONLY_WITH_VIDEO_CHECK_IN
      ).withUnifiedPlanFormat().sdp;
      expect(newSdp.includes('o=mozilla-chrome')).to.be.true;
    });
  });

  describe('hasCandidatesForAllMLines', () => {
    it('returns true if sdp does not have dummy ip in connection attributes', () => {
      const checkResult = new SDP(
        SDPMock.CHROME_UNIFIED_PLAN_AUDIO_ONLY_WITH_VIDEO_CHECK_IN
      ).hasCandidatesForAllMLines();
      expect(checkResult).to.be.true;
    });

    it('returns false if sdp does have dummy ip in connection attributes', () => {
      let checkResult = new SDP(
        SafariSDPMock.IOS_SAFARI_AUDIO_SENDRECV_VIDEO_INACTIVE
      ).hasCandidatesForAllMLines();
      expect(checkResult).to.be.false;

      checkResult = new SDP(SafariSDPMock.IOS_SAFARI_AUDIO_SENDRECV_VIDEO_INACTIVE).hasCandidates();
      expect(checkResult).to.be.false;
    });
  });

  describe('ssrcForVideoSendingSection', () => {
    it('audio only', () => {
      const sdp = new SDP(SafariSDPMock.IOS_SAFARI_AUDIO_SENDRECV_VIDEO_INACTIVE);
      expect(sdp.ssrcForVideoSendingSection()).to.deep.equal('');
      const sdpFirefox = new SDP(FirefoxSDPMock.AUDIO_SENDRECV_VIDEO_INACTIVE);
      expect(sdpFirefox.ssrcForVideoSendingSection()).to.deep.equal('');
    });

    it('video recvonly', () => {
      const sdp = new SDP(SafariSDPMock.IOS_SAFARI_AUDIO_SENDRECV_VIDEO_RECV);
      expect(sdp.ssrcForVideoSendingSection()).to.deep.equal('');
      const sdpPlanB = new SDP(ChromeSDPMock.PLAN_B_AUDIO_SENDRECV_VIDEO_RECVONLY);
      expect(sdpPlanB.ssrcForVideoSendingSection()).to.deep.equal('');
    });

    it('video sendrecv', () => {
      const sdp = new SDP(SafariSDPMock.SAFARI_AUDIO_VIDEO_SENDING);
      expect(sdp.ssrcForVideoSendingSection()).to.deep.equal('2209845614');
      // TODO: Not expecting Firefox to suffer from this issue
      const sdpFirefox = new SDP(FirefoxSDPMock.AUDIO_SENDRECV_VIDEO_SENDRECV);
      expect(sdpFirefox.ssrcForVideoSendingSection()).to.deep.equal('');

      const sdpChromePlanB = new SDP(ChromeSDPMock.PLAN_B_AUDIO_SENDRECV_VIDEO_SENDRECV);
      expect(sdpChromePlanB.ssrcForVideoSendingSection()).to.deep.equal('515437170');
    });
  });

  describe('videoSendSectionHasDifferentSSRC', () => {
    it('returns true if the ssrc for video sending changes', () => {
      const sdp1 = new SDP(ChromeSDPMock.PLAN_B_AUDIO_SENDRECV_VIDEO_SENDRECV);
      const sdp2 = new SDP(ChromeSDPMock.PLAN_B_AUDIO_SENDRECV_VIDEO_SENDRECV_2);
      expect(sdp1.videoSendSectionHasDifferentSSRC(sdp2)).to.equal(true);
      // from sending to sending and receiving
      const sdp3 = new SDP(SafariSDPMock.SAFARI_AUDIO_VIDEO_SENDING);
      const sdp4 = new SDP(SafariSDPMock.SAFARI_AUDIO_VIDEO_SENDING_RECEIVING);
      expect(sdp3.videoSendSectionHasDifferentSSRC(sdp4)).to.equal(false);
    });

    it('return false if the ssrc for video sending do not change', () => {
      const sdp1 = new SDP(SafariSDPMock.IOS_SAFARI_AUDIO_SENDRECV_VIDEO_RECV);
      const sdp2 = new SDP(SafariSDPMock.SAFARI_AUDIO_VIDEO_SENDING);
      expect(sdp1.videoSendSectionHasDifferentSSRC(sdp2)).to.equal(false);
      expect(sdp2.videoSendSectionHasDifferentSSRC(sdp1)).to.equal(false);
    });
  });

  describe('removeH264SupportFromSendSection', () => {
    it('Remove H264 codec from video section', () => {
      const sdpObj = new SDP(SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO_SENDING);
      expect(sdpObj.removeH264SupportFromSendSection().sdp).to.deep.equal(
        SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO_SENDING_VP8_ONLY
      );

      const sdpObj2 = new SDP(SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO_SENDING_MULTIPLE_FMTP);
      expect(sdpObj2.removeH264SupportFromSendSection().sdp).to.deep.equal(
        SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO_SENDING_VP8_ONLY
      );
    });

    it('Does not do anything if no video', () => {
      const sdpObj = new SDP(SafariSDPMock.IOS_SAFARI_AUDIO_SENDRECV_VIDEO_INACTIVE);
      expect(sdpObj.removeH264SupportFromSendSection().sdp).to.deep.equal(
        SafariSDPMock.IOS_SAFARI_AUDIO_SENDRECV_VIDEO_INACTIVE
      );
    });

    it('Does not do anything if VP8 only', () => {
      const sdpObj = new SDP(SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO_SENDING_VP8_ONLY);
      expect(sdpObj.removeH264SupportFromSendSection().sdp).to.deep.equal(
        SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO_SENDING_VP8_ONLY
      );
    });
  });

  describe('mediaSections', () => {
    it('Returns empty list without media sections', () => {
      const sdpObj = new SDP(FirefoxSDPMock.NO_MEDIA_SECTION);
      const mediaSections = sdpObj.mediaSections();

      expect(mediaSections.length).to.equal(0);
    });

    it('Returns correct list', () => {
      const sdpObj = new SDP(FirefoxSDPMock.AUDIO_SENDRECV_VIDEO_MULTIPLE);
      const mediaSections = sdpObj.mediaSections();

      expect(mediaSections.length).to.equal(6);

      expect(mediaSections[0].mediaType).to.equal('audio');
      expect(mediaSections[0].mid).to.equal('0');
      expect(mediaSections[0].direction).to.equal('sendrecv');

      expect(mediaSections[1].mediaType).to.equal('video');
      expect(mediaSections[1].mid).to.equal('1');
      expect(mediaSections[1].direction).to.equal('sendrecv');

      expect(mediaSections[2].mediaType).to.equal('video');
      expect(mediaSections[2].mid).to.equal('2');
      expect(mediaSections[2].direction).to.equal('sendrecv');

      expect(mediaSections[3].mediaType).to.equal('video');
      expect(mediaSections[3].mid).to.equal('3');
      expect(mediaSections[3].direction).to.equal('recvonly');

      expect(mediaSections[4].mediaType).to.equal('video');
      expect(mediaSections[4].mid).to.equal('4');
      expect(mediaSections[4].direction).to.equal('sendonly');

      expect(mediaSections[5].mediaType).to.equal('video');
      expect(mediaSections[5].mid).to.equal('5');
      expect(mediaSections[5].direction).to.equal('inactive');
    });
  });
});
