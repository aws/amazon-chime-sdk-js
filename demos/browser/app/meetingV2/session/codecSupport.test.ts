// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import { videoCodecSupport } from './codecSupport';

const chrome = { hasChromiumWebRTC: () => true, supportsScalableVideoCoding: () => true };
const firefox = { hasChromiumWebRTC: () => false, supportsScalableVideoCoding: () => false };

describe('videoCodecSupport', () => {
  it('allows simulcast with the default codec on Chromium', () => {
    expect(videoCodecSupport(chrome, 'default')).toEqual({ simulcast: true, svc: true });
  });

  it('rules out simulcast for SVC codecs and SVC for simulcast-only codecs', () => {
    expect(videoCodecSupport(chrome, 'vp9Profile0')).toEqual({ simulcast: false, svc: true });
    expect(videoCodecSupport(chrome, 'av1Main')).toEqual({ simulcast: false, svc: false });
    expect(videoCodecSupport(chrome, 'vp8')).toEqual({ simulcast: true, svc: false });
  });

  it('allows neither on a browser without Chromium WebRTC or SVC', () => {
    expect(videoCodecSupport(firefox, 'default')).toEqual({ simulcast: false, svc: false });
  });
});
