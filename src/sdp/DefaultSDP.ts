// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import SDP from './SDP';
import SDPCandidateType from './SDPCandidateType';

/**
 * Implements [[SDP]]. [[SDP]] also includes a few helper functions for parsing string.
 */
export default class DefaultSDP implements SDP {
  private static CRLF: string = '\r\n';

  constructor(public sdp: string) {}

  clone(): DefaultSDP {
    return new DefaultSDP(this.sdp);
  }

  static isRTPCandidate(candidate: string): boolean {
    const match = /candidate[:](\S+) (\d+)/g.exec(candidate);
    if (match === null || match[2] !== '1') {
      return false;
    }
    return true;
  }

  static linesToSDP(lines: string[]): DefaultSDP {
    return new DefaultSDP(lines.join(DefaultSDP.CRLF));
  }

  static candidateTypeFromString(candidateType: string): SDPCandidateType | null {
    switch (candidateType) {
      case SDPCandidateType.Host:
        return SDPCandidateType.Host;
      case SDPCandidateType.ServerReflexive:
        return SDPCandidateType.ServerReflexive;
      case SDPCandidateType.PeerReflexive:
        return SDPCandidateType.PeerReflexive;
      case SDPCandidateType.Relay:
        return SDPCandidateType.Relay;
    }
    return null;
  }

  static candidateType(sdpLine: string): string | null {
    const match = /a[=]candidate[:].* typ ([a-z]+) /g.exec(sdpLine);
    if (match === null) {
      return null;
    }
    return DefaultSDP.candidateTypeFromString(match[1]);
  }

  static splitLines(blob: string): string[] {
    return blob
      .trim()
      .split('\n')
      .map((line: string) => {
        return line.trim();
      });
  }

  static splitSections(sdp: string): string[] {
    // each section starts with "m="
    const sections = sdp.split('\nm=');
    return sections.map((section: string, index: number) => {
      return (index > 0 ? 'm=' + section : section).trim() + DefaultSDP.CRLF;
    });
  }

  static findActiveCameraSection(sections: string[]): number {
    let cameraLineIndex = 0;
    let hasCamera = false;
    for (const sec of sections) {
      if (/^m=video/.test(sec)) {
        if (sec.indexOf('sendrecv') > -1) {
          hasCamera = true;
          break;
        }
      }
      cameraLineIndex++;
    }

    if (hasCamera === false) {
      cameraLineIndex = -1;
    }
    return cameraLineIndex;
  }

  static parseSSRCMedia(ssrcMediaAttributeLine: string): [number, string, string] {
    const separator = ssrcMediaAttributeLine.indexOf(' ');
    let ssrc = 0;
    let attribute = '';
    let value = '';

    ssrc = DefaultSDP.extractSSRCFromAttributeLine(ssrcMediaAttributeLine);
    const secondColon = ssrcMediaAttributeLine.indexOf(':', separator);
    if (secondColon > -1) {
      attribute = ssrcMediaAttributeLine.substr(separator + 1, secondColon - separator - 1);
      value = ssrcMediaAttributeLine.substr(secondColon + 1);
    } else {
      attribute = ssrcMediaAttributeLine.substr(separator + 1);
    }
    return [ssrc, attribute, value];
  }

  // a=ssrc-group:<semantics> <ssrc-id> ...
  static extractSSRCsFromFIDGroupLine(figGroupLine: string): string {
    const ssrcStringMatch = /^a=ssrc-group:FID\s(.+)/.exec(figGroupLine);
    return ssrcStringMatch[1];
  }

  // a=ssrc:<ssrc-id> <attribute> or a=ssrc:<ssrc-id> <attribute>:<value>, ssrc-id is a 32bit integer
  static extractSSRCFromAttributeLine(ssrcMediaAttributeLine: string): number {
    const ssrcStringMatch = /^a=ssrc:([0-9]+)\s/.exec(ssrcMediaAttributeLine);
    if (ssrcStringMatch === null) {
      return 0;
    }
    return parseInt(ssrcStringMatch[1], 10);
  }

  static matchPrefix(blob: string, prefix: string): string[] {
    return DefaultSDP.splitLines(blob).filter((line: string) => {
      return line.indexOf(prefix) === 0;
    });
  }

  lines(): string[] {
    return this.sdp.split(DefaultSDP.CRLF);
  }

  hasVideo(): boolean {
    return /^m=video/gm.exec(this.sdp) !== null;
  }

  hasCandidates(): boolean {
    const match = /a[=]candidate[:]/g.exec(this.sdp);
    if (match === null) {
      return false;
    }
    return true;
  }

  hasCandidatesForAllMLines(): boolean {
    const isAnyCLineUsingLocalHost = this.sdp.indexOf('c=IN IP4 0.0.0.0') > -1;
    const mLinesHaveCandidates = !isAnyCLineUsingLocalHost;
    return mLinesHaveCandidates;
  }

  withBundleAudioVideo(): DefaultSDP {
    const srcLines = this.lines();
    const dstLines: string[] = [];
    for (const line of srcLines) {
      const mod = line.replace(/^a=group:BUNDLE audio$/, 'a=group:BUNDLE audio video');
      if (mod !== line) {
        dstLines.push(mod);
        continue;
      }
      dstLines.push(line);
    }
    return DefaultSDP.linesToSDP(dstLines);
  }

  copyVideo(otherSDP: string): DefaultSDP {
    const otherLines: string[] = otherSDP.split(DefaultSDP.CRLF);
    const dstLines: string[] = DefaultSDP.splitLines(this.sdp);
    let inVideoMedia = false;
    for (const line of otherLines) {
      if (/^m=video/.test(line)) {
        inVideoMedia = true;
      } else if (/^m=/.test(line)) {
        inVideoMedia = false;
      }
      if (inVideoMedia) {
        dstLines.push(line);
      }
    }
    return DefaultSDP.linesToSDP(dstLines);
  }

  withoutCandidateType(candidateTypeToExclude: SDPCandidateType): DefaultSDP {
    return DefaultSDP.linesToSDP(
      this.lines().filter(line => DefaultSDP.candidateType(line) !== candidateTypeToExclude)
    );
  }

  withoutServerReflexiveCandidates(): DefaultSDP {
    return this.withoutCandidateType(SDPCandidateType.ServerReflexive);
  }

  withBandwidthRestriction(maxBitrateKbps: number, isUnifiedPlan: boolean): DefaultSDP {
    const srcLines: string[] = this.lines();
    const dstLines: string[] = [];
    for (const line of srcLines) {
      dstLines.push(line);
      if (/^m=video/.test(line)) {
        if (isUnifiedPlan) {
          dstLines.push(`b=TIAS:${maxBitrateKbps * 1000}`);
        } else {
          dstLines.push(`b=AS:${maxBitrateKbps}`);
        }
      }
    }
    return DefaultSDP.linesToSDP(dstLines);
  }

  // TODO: will remove this soon.
  withUnifiedPlanFormat(): DefaultSDP {
    let originalSdp = this.sdp;
    if (originalSdp.includes('mozilla')) {
      return this.clone();
    } else {
      originalSdp = originalSdp.replace('o=-', 'o=mozilla-chrome');
    }

    return new DefaultSDP(originalSdp);
  }

  withOldFashionedMungingSimulcast(videoSimulcastLayerCount: number): DefaultSDP {
    if (videoSimulcastLayerCount < 2) {
      return this.clone();
    }

    const srcSDP: string = this.sdp;
    const sections = DefaultSDP.splitSections(srcSDP);
    if (sections.length < 2) {
      return new DefaultSDP(this.sdp);
    }

    const cameraLineIndex: number = DefaultSDP.findActiveCameraSection(sections);
    if (cameraLineIndex === -1) {
      return new DefaultSDP(this.sdp);
    }

    let cname = '';
    let msid = '';
    DefaultSDP.matchPrefix(sections[cameraLineIndex], 'a=ssrc:').forEach((line: string) => {
      const ssrcAttrTuple = DefaultSDP.parseSSRCMedia(line);
      if (ssrcAttrTuple[1] === 'cname') {
        cname = ssrcAttrTuple[2];
      } else if (ssrcAttrTuple[1] === 'msid') {
        msid = ssrcAttrTuple[2];
      }
    });

    const fidGroupMatch = DefaultSDP.matchPrefix(sections[cameraLineIndex], 'a=ssrc-group:FID ');
    if (cname === '' || msid === '' || fidGroupMatch.length < 1) {
      return new DefaultSDP(this.sdp);
    }

    const fidGroup = DefaultSDP.extractSSRCsFromFIDGroupLine(fidGroupMatch[0]);
    const cameraSectionLines = sections[cameraLineIndex]
      .trim()
      .split(DefaultSDP.CRLF)
      .filter((line: string) => {
        return line.indexOf('a=ssrc:') !== 0 && line.indexOf('a=ssrc-group:') !== 0;
      });

    const simulcastSSRCs = [];
    const [videoSSRC1, rtxSSRC1] = fidGroup.split(' ').map(ssrc => parseInt(ssrc, 10));

    let videoSSRC = videoSSRC1;
    let rtxSSRC = rtxSSRC1;
    for (let i = 0; i < videoSimulcastLayerCount; i++) {
      cameraSectionLines.push('a=ssrc:' + videoSSRC + ' cname:' + cname);
      cameraSectionLines.push('a=ssrc:' + videoSSRC + ' msid:' + msid);
      cameraSectionLines.push('a=ssrc:' + rtxSSRC + ' cname:' + cname);
      cameraSectionLines.push('a=ssrc:' + rtxSSRC + ' msid:' + msid);
      cameraSectionLines.push('a=ssrc-group:FID ' + videoSSRC + ' ' + rtxSSRC);
      simulcastSSRCs.push(videoSSRC);
      videoSSRC = videoSSRC + 1;
      rtxSSRC = videoSSRC + 1;
    }

    cameraSectionLines.push('a=ssrc-group:SIM ' + simulcastSSRCs.join(' '));
    sections[cameraLineIndex] = cameraSectionLines.join(DefaultSDP.CRLF) + DefaultSDP.CRLF;

    const newSDP = sections.join('');
    return new DefaultSDP(newSDP);
  }

  ssrcForVideoSendingSection(): string {
    const srcSDP: string = this.sdp;
    const sections = DefaultSDP.splitSections(srcSDP);
    if (sections.length < 2) {
      return '';
    }

    const cameraLineIndex: number = DefaultSDP.findActiveCameraSection(sections);
    if (cameraLineIndex === -1) {
      return '';
    }

    // TODO: match for Firefox. Currently all failures are not Firefox induced.
    const fidGroupMatch = DefaultSDP.matchPrefix(sections[cameraLineIndex], 'a=ssrc-group:FID ');
    if (fidGroupMatch.length < 1) {
      return '';
    }

    const fidGroup = DefaultSDP.extractSSRCsFromFIDGroupLine(fidGroupMatch[0]);
    const [videoSSRC1] = fidGroup.split(' ').map(ssrc => parseInt(ssrc, 10));

    return videoSSRC1.toString();
  }

  videoSendSectionHasDifferentSSRC(prevSdp: SDP): boolean {
    const ssrc1 = this.ssrcForVideoSendingSection();
    const ssrc2 = prevSdp.ssrcForVideoSendingSection();
    if (ssrc1 === '' || ssrc2 === '') {
      return false;
    }
    const ssrc1InNumber = parseInt(ssrc1, 10);
    const ssrc2InNumber = parseInt(ssrc2, 10);
    if (ssrc1InNumber === ssrc2InNumber) {
      return false;
    }
    return true;
  }
}
