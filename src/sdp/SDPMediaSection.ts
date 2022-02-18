// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Represents parsed attributes of a media section (i.e. associated with a single m-line)
 */
export default class SDPMediaSection {
  mediaType: 'audio' | 'video';
  mid: string;
  direction: RTCRtpTransceiverDirection;
}
