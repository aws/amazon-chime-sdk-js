// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import SDP from './SDP';
import SDPCandidateType from './SDPCandidateType';
import SDPMediaSection from './SDPMediaSection';

/**
 * Implements [[SDP]]. [[SDP]] also includes a few helper functions for parsing string.
 */
export default class DefaultSDP implements SDP {
  private static CRLF: string = '\r\n';

  static rfc7587LowestBitrate = 6000;
  static rfc7587HighestBitrate = 510000;

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

  private static mediaType(sdpLine: string): 'audio' | 'video' | undefined {
    const match = /m=(audio|video)/g.exec(sdpLine);
    if (match === null) {
      return undefined;
    }
    return match[1] as 'audio' | 'video';
  }

  private static mid(sdpLine: string): string | undefined {
    if (!sdpLine.includes('a=mid:')) {
      return undefined;
    }
    return sdpLine.replace(/^(a=mid:)/, '');
  }

  private static direction(sdpLine: string): RTCRtpTransceiverDirection | undefined {
    const match = /a=(sendrecv|sendonly|recvonly|inactive)/g.exec(sdpLine);
    if (match === null) {
      return undefined;
    }
    return match[1] as RTCRtpTransceiverDirection;
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

  // a=ssrc-group:<semantics> <ssrc-id> ...
  static extractSSRCsFromFIDGroupLine(figGroupLine: string): string {
    const ssrcStringMatch = /^a=ssrc-group:FID\s(.+)/.exec(figGroupLine);
    return ssrcStringMatch[1];
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

  withoutCandidateType(candidateTypeToExclude: SDPCandidateType): DefaultSDP {
    return DefaultSDP.linesToSDP(
      this.lines().filter(line => DefaultSDP.candidateType(line) !== candidateTypeToExclude)
    );
  }

  withoutServerReflexiveCandidates(): DefaultSDP {
    return this.withoutCandidateType(SDPCandidateType.ServerReflexive);
  }

  withAudioMaxAverageBitrate(maxAverageBitrate: number | null): DefaultSDP {
    if (!maxAverageBitrate) {
      return this.clone();
    }
    maxAverageBitrate = Math.trunc(
      Math.min(
        Math.max(maxAverageBitrate, DefaultSDP.rfc7587LowestBitrate),
        DefaultSDP.rfc7587HighestBitrate
      )
    );
    const srcLines: string[] = this.lines();
    const fmtpAttributes = DefaultSDP.findOpusFmtpAttributes(srcLines);
    const dstLines = DefaultSDP.updateOpusFmtpAttributes(srcLines, fmtpAttributes, [
      `maxaveragebitrate=${maxAverageBitrate}`,
    ]);
    return DefaultSDP.linesToSDP(dstLines);
  }

  withStereoAudio(): DefaultSDP {
    const srcLines: string[] = this.lines();
    const fmtpAttributes = DefaultSDP.findOpusFmtpAttributes(srcLines);
    const dstLines = DefaultSDP.updateOpusFmtpAttributes(srcLines, fmtpAttributes, [
      'stereo=1',
      'sprop-stereo=1',
    ]);
    return DefaultSDP.linesToSDP(dstLines);
  }

  /**
   * Here we loop through each line in the SDP
   * and construct an array containing the fmtp
   * attribute for all the audio m lines that use
   * the opus codec. If it doesn't use opus codec
   * we add null to the array which tells
   * updateOpusFmtpAttributes that no update is
   * needed for that particular fmtp attribute line
   */
  static findOpusFmtpAttributes(sdpLines: string[]): string[] | null {
    const opusRtpMapRegex = /^a=rtpmap:\s*(\d+)\s+opus\/48000/;
    let lookingForOpusRtpMap = false;
    const fmtpAttributes: (string | null)[] = [];

    for (const line of sdpLines) {
      if (line.startsWith('m=audio')) {
        fmtpAttributes.push(null);
        lookingForOpusRtpMap = true;
      }
      if (line.startsWith('m=video')) {
        // Opus rtpmap is only part of audio m lines section
        // Set this to false as we don't need to perform regex
        // matches for video section
        lookingForOpusRtpMap = false;
      }
      if (lookingForOpusRtpMap) {
        const match = opusRtpMapRegex.exec(line);
        if (match !== null) {
          fmtpAttributes[fmtpAttributes.length - 1] = `a=fmtp:${match[1]} `;
        }
      }
    }
    return fmtpAttributes;
  }

  /**
   * Update the fmtp lines in each audio m section
   * that correspond to the opus codec with the parameters
   * specifief in additionalParams
   */
  static updateOpusFmtpAttributes(
    srcLines: string[],
    fmtpAttributes: (string | null)[],
    additionalParams: string[]
  ): string[] {
    const dstLines: string[] = [];
    let fmtpIndex = 0;
    let currFmtpAttribute: string | null = null;
    for (const line of srcLines) {
      if (line.startsWith('m=audio')) {
        currFmtpAttribute = fmtpAttributes[fmtpIndex];
        fmtpIndex++;
      }
      if (line.startsWith('m=video')) {
        currFmtpAttribute = null;
      }
      if (currFmtpAttribute && line.startsWith(currFmtpAttribute)) {
        const oldParameters: string[] = line.slice(currFmtpAttribute.length).split(';');
        const newParameters: string[] = [];
        // If an existing parameter is in additionalParams
        // dont add it to newParameters as it will be replaced
        for (const parameter of oldParameters) {
          const index = additionalParams.findIndex(element =>
            element.startsWith(parameter.split('=')[0])
          );
          if (index < 0) {
            newParameters.push(parameter);
          }
        }
        for (const parameter of additionalParams) {
          newParameters.push(parameter);
        }
        dstLines.push(currFmtpAttribute + newParameters.join(';'));
      } else {
        dstLines.push(line);
      }
    }
    return dstLines;
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

  getUniqueRtpHeaderExtensionId(srcLines: string[]): number {
    const headerExtensionIds: number[] = [];

    for (const line of srcLines) {
      if (/^a=extmap:/.test(line.trim())) {
        const headerExtension = line.split('a=extmap:')[1].split(' ');
        const id = +headerExtension[0];
        headerExtensionIds.push(id);
      }
    }

    headerExtensionIds.sort((a, b) => a - b);
    let previousId = 0; // header extension cannot be 0, refer https://datatracker.ietf.org/doc/html/rfc5285
    for (const id of headerExtensionIds) {
      if (id - previousId > 1) {
        return previousId + 1;
      }
      previousId = id;
    }

    // One-Byte Header header extension cannot be bigger than 14, refer https://datatracker.ietf.org/doc/html/rfc5285
    return previousId === 14 ? -1 : previousId + 1;
  }

  // negotiate with the back end to determine whether to use layers allocation header extension
  // to avoid resubscribing to preemptively turn off simulcast streams or to switch layers
  // this will not add the packet overhead unless negotiated to avoid waste
  withVideoLayersAllocationRtpHeaderExtension(): DefaultSDP {
    const sections = DefaultSDP.splitSections(this.sdp);

    const newSections = [];
    for (let section of sections) {
      if (/^m=video/.test(section)) {
        const srcLines: string[] = DefaultSDP.splitLines(section);
        const dstLines: string[] = [];
        const id = this.getUniqueRtpHeaderExtensionId(srcLines);
        if (id === -1) {
          // if all ids are used, we won't add new line to it
          newSections.push(section);
          continue;
        }

        for (const line of srcLines) {
          dstLines.push(line);
          if (/^a=sendrecv/.test(line.trim())) {
            const targetLine =
              `a=extmap:` +
              id +
              ` http://www.webrtc.org/experiments/rtp-hdrext/video-layers-allocation00`;
            dstLines.push(targetLine);
          }
        }
        section = dstLines.join(DefaultSDP.CRLF) + DefaultSDP.CRLF;
      }
      newSections.push(section);
    }
    const newSdp = newSections.join('');
    return new DefaultSDP(newSdp);
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

  removeH264SupportFromSendSection(): DefaultSDP {
    const srcSDP: string = this.sdp;
    const sections = DefaultSDP.splitSections(srcSDP);
    const cameraLineIndex: number = DefaultSDP.findActiveCameraSection(sections);
    if (cameraLineIndex === -1) {
      return new DefaultSDP(this.sdp);
    }
    const cameraSection = sections[cameraLineIndex];
    const cameraSectionLines = DefaultSDP.splitLines(cameraSection);
    const payloadTypesForH264: number[] = [];
    const primaryPayloadTypeToFeedbackPayloadTypes: Map<number, number[]> = new Map();
    // Loop through camera section (m=video)
    cameraSectionLines.forEach(attribute => {
      // Find the payload type with H264 codec line (e.g., a=rtpmap:<payload> H264/90000)
      if (/^a=rtpmap:/.test(attribute)) {
        const payloadMatch = /^a=rtpmap:([0-9]+)\s/.exec(attribute);
        if (payloadMatch && attribute.toLowerCase().includes('h264')) {
          payloadTypesForH264.push(parseInt(payloadMatch[1], 10));
        }
      }

      // Loop through the rtx payload and create a mapping between it and the primary payload.
      // a=fmtp:<rtx payload> apt=<primary payload>
      if (/^a=fmtp:/.test(attribute)) {
        const feedbackMatches = /^a=fmtp:([0-9]+) apt=([0-9]+)/.exec(attribute);
        if (feedbackMatches && feedbackMatches.length === 3) {
          const feedbackPayloadType = parseInt(feedbackMatches[1], 10);
          const primaryPayloadType = parseInt(feedbackMatches[2], 10);
          if (primaryPayloadTypeToFeedbackPayloadTypes.has(primaryPayloadType)) {
            primaryPayloadTypeToFeedbackPayloadTypes
              .get(primaryPayloadType)
              .push(feedbackPayloadType);
          } else {
            primaryPayloadTypeToFeedbackPayloadTypes.set(primaryPayloadType, [feedbackPayloadType]);
          }
        }
      }
    });

    // Add the rtx payloads corresponding to the H264 codec to the remove list
    const payloadTypesToRemove: Set<Number> = new Set();
    for (const type of payloadTypesForH264) {
      payloadTypesToRemove.add(type);

      const feedbackTypes = primaryPayloadTypeToFeedbackPayloadTypes.get(type);
      if (feedbackTypes) {
        for (const feedbackType of feedbackTypes) {
          payloadTypesToRemove.add(feedbackType);
        }
      }
    }

    // Remove H264 payload from the media line. m=video 9 UDP/+++ <payload> <payload> <payload>
    if (payloadTypesForH264.length > 0) {
      const mline = cameraSectionLines[0].split(' ');
      cameraSectionLines[0] = mline
        .filter((text: string) => !payloadTypesToRemove.has(parseInt(text)))
        .join(' ');
    }

    // Filter out lines with H264 payload
    const filteredLines = cameraSectionLines.filter((line: string) => {
      if (!line.includes('rtpmap') && !line.includes('rtcp-fb') && !line.includes('fmtp')) {
        return true;
      }
      for (const type of payloadTypesToRemove) {
        if (line.includes(type.toString())) {
          return false;
        }
      }
      return true;
    });

    sections[cameraLineIndex] = filteredLines.join(DefaultSDP.CRLF) + DefaultSDP.CRLF;

    const newSDP = sections.join('');
    return new DefaultSDP(newSDP);
  }

  mediaSections(): SDPMediaSection[] {
    const sections = DefaultSDP.splitSections(this.sdp);
    if (sections.length < 2) {
      return [];
    }

    const parsedMediaSections: SDPMediaSection[] = [];
    for (let i = 1; i < sections.length; i++) {
      const section = new SDPMediaSection();
      const lines = DefaultSDP.splitLines(sections[i]);
      for (const line of lines) {
        const mediaType = DefaultSDP.mediaType(line);
        if (mediaType !== undefined) {
          section.mediaType = mediaType;
          continue;
        }
        const direction = DefaultSDP.direction(line);
        if (direction !== undefined) {
          section.direction = direction;
          continue;
        }
        const mid = DefaultSDP.mid(line);
        if (mid !== undefined) {
          section.mid = mid;
          continue;
        }
      }
      parsedMediaSections.push(section);
    }
    return parsedMediaSections;
  }
}
