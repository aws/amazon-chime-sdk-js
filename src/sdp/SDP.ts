// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import SDPCandidateType from './SDPCandidateType';
import SDPMediaSection from './SDPMediaSection';

/**
 * [[SDP]] includes a few helper functions for parsing sdp string.
 */
export default class SDP {
  private static CRLF: string = '\r\n';

  static rfc7587LowestBitrate = 6000;
  static rfc7587HighestBitrate = 510000;

  /**
   * Construts a new [[SDP]] object
   */
  constructor(public sdp: string) {}

  /**
   * Clones an SDP
   */
  clone(): SDP {
    return new SDP(this.sdp);
  }

  /**
   * Checks if the candidate is a valid RTP candidate
   */
  static isRTPCandidate(candidate: string): boolean {
    const match = /candidate[:](\S+) (\d+)/g.exec(candidate);
    if (match === null || match[2] !== '1') {
      return false;
    }
    return true;
  }

  /**
   * Constructs a new SDP with the given set of SDP lines.
   */
  static linesToSDP(lines: string[]): SDP {
    return new SDP(lines.join(SDP.CRLF));
  }

  /**
   * Returns an enum of [[candidateType]] for the given string.
   */
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

  /**
   * Returns the candidate type assocaited with the sdpline.
   */
  static candidateType(sdpLine: string): string | null {
    const match = /a[=]candidate[:].* typ ([a-z]+) /g.exec(sdpLine);
    if (match === null) {
      return null;
    }
    return SDP.candidateTypeFromString(match[1]);
  }

  /**
   * Returns the media type associated with the sdp line.
   */
  private static mediaType(sdpLine: string): 'audio' | 'video' | undefined {
    const match = /m=(audio|video)/g.exec(sdpLine);
    if (match === null) {
      return undefined;
    }
    return match[1] as 'audio' | 'video';
  }

  /**
   * Erase out "a=mid"  from the sdp line.
   */
  private static mid(sdpLine: string): string | undefined {
    if (!sdpLine.includes('a=mid:')) {
      return undefined;
    }
    return sdpLine.replace(/^(a=mid:)/, '');
  }

  /**
   * Return the direction associated with the sdp line.
   */
  private static direction(sdpLine: string): RTCRtpTransceiverDirection | undefined {
    const match = /a=(sendrecv|sendonly|recvonly|inactive)/g.exec(sdpLine);
    if (match === null) {
      return undefined;
    }
    return match[1] as RTCRtpTransceiverDirection;
  }

  /**
   * Format the sdp string into separate lines.
   */
  static splitLines(blob: string): string[] {
    return blob
      .trim()
      .split('\n')
      .map((line: string) => {
        return line.trim();
      });
  }

  /**
   * split the different sdp sections
   */
  static splitSections(sdp: string): string[] {
    // each section starts with "m="
    const sections = sdp.split('\nm=');
    return sections.map((section: string, index: number) => {
      return (index > 0 ? 'm=' + section : section).trim() + SDP.CRLF;
    });
  }

  /**
   * split the different sdp sections
   */
  private static findActiveCameraSection(sections: string[]): number {
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

  /**
   * Extract the SSRCs from the group line.
   *
   * a=ssrc-group:<semantics> <ssrc-id> ...
   */
  static extractSSRCsFromFIDGroupLine(figGroupLine: string): string {
    const ssrcStringMatch = /^a=ssrc-group:FID\s(.+)/.exec(figGroupLine);
    return ssrcStringMatch[1];
  }

  /**
   * Extracts the lines from the sdp blob that matches the given prefix.
   */
  static matchPrefix(blob: string, prefix: string): string[] {
    return SDP.splitLines(blob).filter((line: string) => {
      return line.indexOf(prefix) === 0;
    });
  }

  /**
   * Splits SDP string into lines
   */
  lines(): string[] {
    return this.sdp.split(SDP.CRLF);
  }

  /**
   * Checks if SDP has a video section.
   */
  hasVideo(): boolean {
    return /^m=video/gm.exec(this.sdp) !== null;
  }

  /**
   * Checks whether the SDP has candidates for any m-line
   */
  hasCandidates(): boolean {
    const match = /a[=]candidate[:]/g.exec(this.sdp);
    if (match === null) {
      return false;
    }
    return true;
  }

  /**
   * Checks whether the SDP has candidates for all m-lines
   */
  hasCandidatesForAllMLines(): boolean {
    const isAnyCLineUsingLocalHost = this.sdp.indexOf('c=IN IP4 0.0.0.0') > -1;
    const mLinesHaveCandidates = !isAnyCLineUsingLocalHost;
    return mLinesHaveCandidates;
  }

  /**
   * Removes candidates of a given type from SDP
   */
  withoutCandidateType(candidateTypeToExclude: SDPCandidateType): SDP {
    return SDP.linesToSDP(
      this.lines().filter(line => SDP.candidateType(line) !== candidateTypeToExclude)
    );
  }

  /**
   * Removes server reflexive candidate from SDP
   */
  withoutServerReflexiveCandidates(): SDP {
    return this.withoutCandidateType(SDPCandidateType.ServerReflexive);
  }

  /**
   * Inserts a parameter to the SDP local offer setting the desired average audio bitrate
   */
  withAudioMaxAverageBitrate(maxAverageBitrate: number | null): SDP {
    if (!maxAverageBitrate) {
      return this.clone();
    }
    maxAverageBitrate = Math.trunc(
      Math.min(Math.max(maxAverageBitrate, SDP.rfc7587LowestBitrate), SDP.rfc7587HighestBitrate)
    );
    const srcLines: string[] = this.lines();
    const fmtpAttributes = SDP.findOpusFmtpAttributes(srcLines);
    const dstLines = SDP.updateOpusFmtpAttributes(srcLines, fmtpAttributes, [
      `maxaveragebitrate=${maxAverageBitrate}`,
    ]);
    return SDP.linesToSDP(dstLines);
  }

  /**
   * Update the SDP to include stereo
   */
  withStereoAudio(): SDP {
    const srcLines: string[] = this.lines();
    const fmtpAttributes = SDP.findOpusFmtpAttributes(srcLines);
    const dstLines = SDP.updateOpusFmtpAttributes(srcLines, fmtpAttributes, [
      'stereo=1',
      'sprop-stereo=1',
    ]);
    return SDP.linesToSDP(dstLines);
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

  /**
   * Munges Unified-Plan SDP from different browsers to conform to one format
   * TODO: will remove this soon.
   */
  withUnifiedPlanFormat(): SDP {
    let originalSdp = this.sdp;
    if (originalSdp.includes('mozilla')) {
      return this.clone();
    } else {
      originalSdp = originalSdp.replace('o=-', 'o=mozilla-chrome');
    }

    return new SDP(originalSdp);
  }

  /**
   * Returns the total number of unique Rtp header extensions.
   */
  getUniqueRtpHeaderExtensionId(srcLines: string[]): number {
    const headerExtensionIds: number[] = [];

    for (const line of srcLines) {
      if (/^a=extmap:/.test(line.trim())) {
        const headerExtension = line.split('a=extmap:')[1].split(' ');
        const id = +headerExtension[0];
        if (!headerExtensionIds.includes(id)) {
          headerExtensionIds.push(id);
        }
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

  /**
   * To avoid resubscribing to preemptively turn off simulcast streams or to switch layers
   * negotiate with the back end to determine whether to use layers allocation header extension
   * this will not add the packet overhead unless negotiated to avoid waste
   */
  withVideoLayersAllocationRtpHeaderExtension(previousSdp: SDP): SDP {
    const url = `http://www.webrtc.org/experiments/rtp-hdrext/video-layers-allocation00`;

    // According to https://webrtc.googlesource.com/src/+/b62ee8ce94e5f10e0a94d6f112e715cc4d0cd9dc,
    // RTP header extension ID change would result in a hard failure. Therefore if the extension exists
    // in the previous SDP, use the same extension ID to avoid the failure. Otherwise use a new ID
    const previousId = previousSdp ? previousSdp.getRtpHeaderExtensionId(url) : -1;
    const id =
      previousId === -1 ? this.getUniqueRtpHeaderExtensionId(SDP.splitLines(this.sdp)) : previousId;

    const sections = SDP.splitSections(this.sdp);
    const newSections = [];
    for (let section of sections) {
      if (/^m=video/.test(section) && SDP.getRtpHeaderExtensionIdInSection(section, url) === -1) {
        // Add RTP header extension when it does not already exist
        const srcLines: string[] = SDP.splitLines(section);
        const dstLines: string[] = [];
        if (id === -1 || this.hasRtpHeaderExtensionId(id)) {
          // if all ids are used or the id is already used, we won't add new line to it
          newSections.push(section);
          continue;
        }

        for (const line of srcLines) {
          dstLines.push(line);
          if (/^a=sendrecv/.test(line.trim())) {
            const targetLine = `a=extmap:` + id + ` ` + url;
            dstLines.push(targetLine);
          }
        }
        section = dstLines.join(SDP.CRLF) + SDP.CRLF;
      } else if (
        previousId !== -1 &&
        /^m=video/.test(section) &&
        SDP.getRtpHeaderExtensionIdInSection(section, url) !== previousId
      ) {
        // Override extension ID if it does not match previous SDP
        const srcLines: string[] = SDP.splitLines(section);
        const dstLines: string[] = [];
        for (const line of srcLines) {
          if (/^a=extmap:/.test(line.trim())) {
            const headerExtension = line.split('a=extmap:')[1].split(' ');
            if (headerExtension[1] === url) {
              if (!this.hasRtpHeaderExtensionId(previousId)) {
                // If previous ID is used by another extension, remove it from this SDP
                const targetLine = `a=extmap:` + previousId + ` ` + url;
                dstLines.push(targetLine);
              }
              continue;
            }
          }
          dstLines.push(line);
        }
        section = dstLines.join(SDP.CRLF) + SDP.CRLF;
      }
      newSections.push(section);
    }
    const newSdp = newSections.join('');
    return new SDP(newSdp);
  }

  /**
   * Extracts the ssrc for the sendrecv video media section in SDP
   */
  ssrcForVideoSendingSection(): string {
    const srcSDP: string = this.sdp;
    const sections = SDP.splitSections(srcSDP);
    if (sections.length < 2) {
      return '';
    }

    const cameraLineIndex: number = SDP.findActiveCameraSection(sections);
    if (cameraLineIndex === -1) {
      return '';
    }

    // TODO: match for Firefox. Currently all failures are not Firefox induced.
    const fidGroupMatch = SDP.matchPrefix(sections[cameraLineIndex], 'a=ssrc-group:FID ');
    if (fidGroupMatch.length < 1) {
      return '';
    }

    const fidGroup = SDP.extractSSRCsFromFIDGroupLine(fidGroupMatch[0]);
    const [videoSSRC1] = fidGroup.split(' ').map(ssrc => parseInt(ssrc, 10));

    return videoSSRC1.toString();
  }

  /**
   * Returns whether the sendrecv video sections if exist have two different SSRCs in SDPs
   */
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

  /**
   * Removes H.264 from the send section.
   */
  removeH264SupportFromSendSection(): SDP {
    const srcSDP: string = this.sdp;
    const sections = SDP.splitSections(srcSDP);
    const cameraLineIndex: number = SDP.findActiveCameraSection(sections);
    if (cameraLineIndex === -1) {
      return new SDP(this.sdp);
    }
    const cameraSection = sections[cameraLineIndex];
    const cameraSectionLines = SDP.splitLines(cameraSection);
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

    sections[cameraLineIndex] = filteredLines.join(SDP.CRLF) + SDP.CRLF;

    const newSDP = sections.join('');
    return new SDP(newSDP);
  }

  /**
   * List of parsed media sections sections in order they occur on SDP.
   */
  mediaSections(): SDPMediaSection[] {
    const sections = SDP.splitSections(this.sdp);
    if (sections.length < 2) {
      return [];
    }

    const parsedMediaSections: SDPMediaSection[] = [];
    for (let i = 1; i < sections.length; i++) {
      const section = new SDPMediaSection();
      const lines = SDP.splitLines(sections[i]);
      for (const line of lines) {
        const mediaType = SDP.mediaType(line);
        if (mediaType !== undefined) {
          section.mediaType = mediaType;
          continue;
        }
        const direction = SDP.direction(line);
        if (direction !== undefined) {
          section.direction = direction;
          continue;
        }
        const mid = SDP.mid(line);
        if (mid !== undefined) {
          section.mid = mid;
          continue;
        }
      }
      parsedMediaSections.push(section);
    }
    return parsedMediaSections;
  }

  /**
   * Return RTP header extension ID if the extension exists in section. Return -1 otherwise
   */
  static getRtpHeaderExtensionIdInSection(section: string, url: string): number {
    const lines: string[] = SDP.splitLines(section);
    for (const line of lines) {
      if (/^a=extmap:/.test(line.trim())) {
        const headerExtension = line.split('a=extmap:')[1].split(' ');
        const id = +headerExtension[0];
        if (headerExtension[1] === url) {
          return id;
        }
      }
    }
    return -1;
  }

  /**
   * Return RTP header extension ID if the extension exists in SDP. Return -1 otherwise
   */
  getRtpHeaderExtensionId(url: string): number {
    const sections = SDP.splitSections(this.sdp);

    for (const section of sections) {
      if (/^m=video/.test(section)) {
        const id = SDP.getRtpHeaderExtensionIdInSection(section, url);
        if (id !== -1) {
          return id;
        }
      }
    }
    return -1;
  }

  /**
   * Return if extension ID exists in the SDP
   */
  hasRtpHeaderExtensionId(targetId: number): boolean {
    const lines = SDP.splitLines(this.sdp);

    for (const line of lines) {
      if (/^a=extmap:/.test(line.trim())) {
        const headerExtension = line.split('a=extmap:')[1].split(' ');
        const id = +headerExtension[0];
        if (id === targetId) {
          return true;
        }
      }
    }
    return false;
  }
}
