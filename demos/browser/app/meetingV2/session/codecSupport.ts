// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export interface CodecBrowser {
  hasChromiumWebRTC(): boolean;
  supportsScalableVideoCoding(): boolean;
}

export interface VideoCodecSupport {
  simulcast: boolean;
  svc: boolean;
}

/**
 * Which camera send modes the browser and the chosen codec allow. The Settings dialog and the
 * session configuration both read this, so the switches never offer what the session will drop.
 * Chromium simulcasts only H.264 and VP8 (`default` lets the SDK pick one of those); SVC needs
 * VP9 or the SDK's default preference on a browser with scalable video coding.
 */
export function videoCodecSupport(browser: CodecBrowser, videoCodec: string): VideoCodecSupport {
  return {
    simulcast: browser.hasChromiumWebRTC() && !['av1Main', 'vp9Profile0'].includes(videoCodec),
    svc: browser.supportsScalableVideoCoding() && ['default', 'vp9Profile0'].includes(videoCodec),
  };
}
