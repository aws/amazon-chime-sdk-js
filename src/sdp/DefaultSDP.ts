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
    const isAnyCLineUsingLocalHost = this.sdp.indexOf('\r\nc=IN IP4 0.0.0.0\r\n') > -1;
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
}
