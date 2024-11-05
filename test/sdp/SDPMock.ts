// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default class SDPMock {
  static readonly TEST_CANDIDATE: string = `a=candidate:Ha58b279 2 udp 2130706431 10.88.178.121 16386 typ host generation 0`;

  static readonly RTP_CANDIDATE: string = `candidate:MOCK9004 1 udp 2122260223 10.88.178.121 52788 typ host generation 0 ufrag PWwO network-id 2 network-cost 50`;

  static readonly PEER_REFLEXIVE_CANDIDATE: string = `a=candidate:750991856 2 udp 25108222 237.30.30.30 51472 typ prflx raddr 47.61.61.61 rport 54763 generation 0`;

  static readonly SERVER_REFLEXIVE_CANDIDATE: string = `a=candidate:1853887674 1 udp 1518280447 47.61.61.61 36768 typ srflx raddr 192.168.0.196 rport 36768 generation 0`;

  static readonly RELAY_CANDIDATE: string = `a=candidate:750991856 2 udp 25108222 237.30.30.30 51472 typ relay raddr 47.61.61.61 rport 54763 generation 0`;

  static readonly UNKNOWN_CANDIDATE: string = `a=candidate:750991856 2 udp 25108222 237.30.30.30 51472 typ unknown raddr 47.61.61.61 rport 54763 generation 0`;

  static readonly IS_CANDIDATE: string = `a=candidate:Hc0a80005 1 udp 2130706431 192.168.0.5 16386 typ host generation 0`;

  static readonly LOCAL_OFFER_WITHOUT_CANDIDATE: string = `v=0\r
o=- 0 0 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio\r
a=msid-semantic: WMS stream_label\r
m=audio 16386 UDP/TLS/RTP/SAVPF 111\r
c=IN IP4 0.0.0.0\r
a=rtcp:16386 IN IP4 10.88.178.121\r
a=ice-ufrag:fake\r
a=ice-pwd:fake\r
a=fingerprint:sha-256 fake\r
a=setup:passive\r
a=sendrecv\r
a=mid:audio\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=fmtp:111 minptime=20;useinbandfec=0\r
a=ssrc:216329669 cname:XLHfJRm1Es\r
a=ssrc:216329669 msid:stream_label a0\r
a=ssrc:216329669 mslabel:stream_label\r
a=ssrc:216329669 label:a0\r
`;

  static readonly LOCAL_OFFER_WITH_AUDIO_VIDEO: string = `v=0\r
o=- 8360888182273689563 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:video\r
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:13 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:3 urn:3gpp:video-orientation\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:8 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:9 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r
a=sendrecv\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 profile-id=0\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:100 VP9/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=fmtp:100 profile-id=2\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:124 red/90000\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124\r
a=rtpmap:123 ulpfec/90000\r
a=ssrc:138036785 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036785 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:1579984795 cname:87eXz3QiQBBvJFID\r
a=ssrc:1579984795 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036785 1579984795\r
a=ssrc:138036786 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036786 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:138036787 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036787 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036786 138036787\r
`;

  static readonly LOCAL_OFFER_WITH_AUDIO_VIDEO_VP9_NO_PROFILE_ID: string = `v=0\r
o=- 8360888182273689563 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:video\r
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:13 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:3 urn:3gpp:video-orientation\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:8 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:9 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r
a=sendrecv\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:124 red/90000\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124\r
a=rtpmap:123 ulpfec/90000\r
a=ssrc:138036785 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036785 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:1579984795 cname:87eXz3QiQBBvJFID\r
a=ssrc:1579984795 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036785 1579984795\r
a=ssrc:138036786 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036786 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:138036787 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036787 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036786 138036787\r
`;

  static readonly LOCAL_OFFER_WITH_AUDIO_VIDEO_PREFERS_VP9_PROFILE0: string = `v=0\r
o=- 8360888182273689563 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=video 9 UDP/TLS/RTP/SAVPF 98 96 97 99 100 101 102 122 127 121 125 107 108 109 124 120 123\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:video\r
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:13 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:3 urn:3gpp:video-orientation\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:8 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:9 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r
a=sendrecv\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 profile-id=0\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:100 VP9/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=fmtp:100 profile-id=2\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:124 red/90000\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124\r
a=rtpmap:123 ulpfec/90000\r
a=ssrc:138036785 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036785 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:1579984795 cname:87eXz3QiQBBvJFID\r
a=ssrc:1579984795 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036785 1579984795\r
a=ssrc:138036786 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036786 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:138036787 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036787 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036786 138036787\r
`;

  static readonly LOCAL_OFFER_WITH_AUDIO_VIDEO_PREFERS_VP9_NO_PROFILE_ID: string = `v=0\r
o=- 8360888182273689563 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=video 9 UDP/TLS/RTP/SAVPF 98 96 97 99 100 101 102 122 127 121 125 107 108 109 124 120 123\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:video\r
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:13 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:3 urn:3gpp:video-orientation\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:8 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:9 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r
a=sendrecv\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:124 red/90000\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124\r
a=rtpmap:123 ulpfec/90000\r
a=ssrc:138036785 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036785 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:1579984795 cname:87eXz3QiQBBvJFID\r
a=ssrc:1579984795 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036785 1579984795\r
a=ssrc:138036786 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036786 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:138036787 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036787 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036786 138036787\r
`;

  static readonly LOCAL_OFFER_WITH_AUDIO_VIDEO_AV1: string = `v=0\r
o=- 8360888182273689563 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:video\r
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:13 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:3 urn:3gpp:video-orientation\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:8 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:9 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r
a=sendrecv\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 AV1/90000\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 VP8/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 profile-id=0\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:100 VP9/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=fmtp:100 profile-id=2\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:124 red/90000\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124\r
a=rtpmap:123 ulpfec/90000\r
a=ssrc:138036785 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036785 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:1579984795 cname:87eXz3QiQBBvJFID\r
a=ssrc:1579984795 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036785 1579984795\r
a=ssrc:138036786 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036786 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:138036787 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036787 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036786 138036787\r
`;

  static readonly LOCAL_OFFER_WITH_AUDIO_VIDEO_WITH_STARTING_VIDEO_SEND_BITRATE: string = `v=0\r
o=- 8360888182273689563 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:video\r
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:13 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:3 urn:3gpp:video-orientation\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:8 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:9 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r
a=sendrecv\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96;x-google-start-bitrate=1000000\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 profile-id=0;x-google-start-bitrate=1000000\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98;x-google-start-bitrate=1000000\r
a=rtpmap:100 VP9/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=fmtp:100 profile-id=2;x-google-start-bitrate=1000000\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100;x-google-start-bitrate=1000000\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f;x-google-start-bitrate=1000000\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102;x-google-start-bitrate=1000000\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f;x-google-start-bitrate=1000000\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127;x-google-start-bitrate=1000000\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f;x-google-start-bitrate=1000000\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125;x-google-start-bitrate=1000000\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f;x-google-start-bitrate=1000000\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108;x-google-start-bitrate=1000000\r
a=rtpmap:124 red/90000\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124;x-google-start-bitrate=1000000\r
a=rtpmap:123 ulpfec/90000\r
a=ssrc:138036785 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036785 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:1579984795 cname:87eXz3QiQBBvJFID\r
a=ssrc:1579984795 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036785 1579984795\r
a=ssrc:138036786 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036786 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:138036787 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036787 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036786 138036787\r
`;

  static readonly LOCAL_OFFER_WITH_AUDIO_VIDEO_NO_DIRECTION: string = `v=0\r
o=- 8360888182273689563 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:video\r
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:13 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:3 urn:3gpp:video-orientation\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:8 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:9 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 profile-id=0\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:100 VP9/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=fmtp:100 profile-id=2\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:124 red/90000\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124\r
a=rtpmap:123 ulpfec/90000\r
a=ssrc:138036785 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036785 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:1579984795 cname:87eXz3QiQBBvJFID\r
a=ssrc:1579984795 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036785 1579984795\r
a=ssrc:138036786 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036786 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:138036787 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036787 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036786 138036787\r
`;

  static readonly LOCAL_OFFER_WITH_AUDIO_VIDEO_WITH_HEADER_EXTENSION: string = `v=0\r
o=- 8360888182273689563 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=extmap:4 http://www.webrtc.org/experiments/rtp-hdrext/video-layers-allocation00\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:video\r
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:13 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:3 urn:3gpp:video-orientation\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:8 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:9 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r
a=sendrecv\r
a=extmap:4 http://www.webrtc.org/experiments/rtp-hdrext/video-layers-allocation00\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 profile-id=0\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:100 VP9/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=fmtp:100 profile-id=2\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:124 red/90000\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124\r
a=rtpmap:123 ulpfec/90000\r
a=ssrc:138036785 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036785 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:1579984795 cname:87eXz3QiQBBvJFID\r
a=ssrc:1579984795 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036785 1579984795\r
a=ssrc:138036786 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036786 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:138036787 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036787 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036786 138036787\r
`;

  static readonly LOCAL_OFFER_WITH_ALL_HEADER_EXTENSIONS: string = `v=0\r
o=- 8360888182273689563 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:video\r
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:13 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:3 urn:3gpp:video-orientation\r
a=extmap:4 urn:3gpp:video-orientation\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:8 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:9 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r
a=extmap:10 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:11 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:12 urn:3gpp:video-orientation\r
a=sendrecv\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 profile-id=0\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:100 VP9/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=fmtp:100 profile-id=2\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:124 red/90000\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124\r
a=rtpmap:123 ulpfec/90000\r
a=ssrc:138036785 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036785 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:1579984795 cname:87eXz3QiQBBvJFID\r
a=ssrc:1579984795 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036785 1579984795\r
a=ssrc:138036786 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036786 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:138036787 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036787 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036786 138036787\r
`;

  static readonly LOCAL_OFFER_WITH_CONSECUTIVE_HEADER_EXTENSIONS: string = `v=0\r
o=- 8360888182273689563 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:video\r
a=extmap:3 urn:3gpp:video-orientation\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 profile-id=0\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:100 VP9/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=fmtp:100 profile-id=2\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:124 red/90000\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124\r
a=rtpmap:123 ulpfec/90000\r
a=ssrc:138036785 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036785 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:1579984795 cname:87eXz3QiQBBvJFID\r
a=ssrc:1579984795 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036785 1579984795\r
a=ssrc:138036786 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036786 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:138036787 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036787 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036786 138036787\r
`;

  static readonly LOCAL_OFFER_WITH_CONSECUTIVE_HEADER_EXTENSIONS_AND_LAYERS_ALLOCATION_EXTENSION: string = `v=0\r
o=- 8360888182273689563 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:video\r
a=extmap:3 urn:3gpp:video-orientation\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=extmap:4 http://www.webrtc.org/experiments/rtp-hdrext/video-layers-allocation00\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 profile-id=0\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:100 VP9/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=fmtp:100 profile-id=2\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:124 red/90000\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124\r
a=rtpmap:123 ulpfec/90000\r
a=ssrc:138036785 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036785 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:1579984795 cname:87eXz3QiQBBvJFID\r
a=ssrc:1579984795 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036785 1579984795\r
a=ssrc:138036786 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036786 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:138036787 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036787 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036786 138036787\r
`;

  static readonly LOCAL_OFFER_WITH_GAP_IN_HEADER_EXTENSIONS: string = `v=0\r
o=- 8360888182273689563 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:video\r
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:13 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:3 urn:3gpp:video-orientation\r
a=extmap:4 urn:3gpp:video-orientation\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:8 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:9 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r
a=extmap:10 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:11 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:12 urn:3gpp:video-orientation\r
a=sendrecv\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 profile-id=0\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:100 VP9/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=fmtp:100 profile-id=2\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:124 red/90000\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124\r
a=rtpmap:123 ulpfec/90000\r
a=ssrc:138036785 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036785 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:1579984795 cname:87eXz3QiQBBvJFID\r
a=ssrc:1579984795 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036785 1579984795\r
a=ssrc:138036786 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036786 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:138036787 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036787 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036786 138036787\r
`;

  static readonly LOCAL_OFFER_WITH_GAP_IN_HEADER_EXTENSIONS_AND_LAYERS_ALLOCATION_EXTENSION: string = `v=0\r
o=- 8360888182273689563 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:video\r
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:13 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:3 urn:3gpp:video-orientation\r
a=extmap:4 urn:3gpp:video-orientation\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:8 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:9 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r
a=extmap:10 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:11 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:12 urn:3gpp:video-orientation\r
a=sendrecv\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-layers-allocation00\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 profile-id=0\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:100 VP9/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=fmtp:100 profile-id=2\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:124 red/90000\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124\r
a=rtpmap:123 ulpfec/90000\r
a=ssrc:138036785 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036785 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:1579984795 cname:87eXz3QiQBBvJFID\r
a=ssrc:1579984795 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036785 1579984795\r
a=ssrc:138036786 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036786 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:138036787 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036787 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036786 138036787\r
`;

  static readonly LOCAL_OFFER_WITH_GAP_IN_HEADER_EXTENSIONS_AND_NO_LAYERS_ALLOCATION_EXTENSION: string = `v=0\r
o=- 8360888182273689563 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:video\r
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:13 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:3 urn:3gpp:video-orientation\r
a=extmap:4 urn:3gpp:video-orientation\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:8 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:9 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r
a=extmap:10 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:11 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:12 urn:3gpp:video-orientation\r
a=sendrecv\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 profile-id=0\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:100 VP9/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=fmtp:100 profile-id=2\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:124 red/90000\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124\r
a=rtpmap:123 ulpfec/90000\r
a=ssrc:138036785 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036785 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:1579984795 cname:87eXz3QiQBBvJFID\r
a=ssrc:1579984795 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036785 1579984795\r
a=ssrc:138036786 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036786 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:138036787 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036787 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036786 138036787\r
`;

  static readonly LOCAL_OFFER_WITH_LAYERS_ALLOCATION_EXTENSION_WITH_GAP_ID: string = `v=0\r
o=- 8360888182273689563 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:video\r
a=extmap:3 urn:3gpp:video-orientation\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:12 http://www.webrtc.org/experiments/rtp-hdrext/video-layers-allocation00\r
a=sendrecv\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 profile-id=0\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:100 VP9/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=fmtp:100 profile-id=2\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:124 red/90000\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124\r
a=rtpmap:123 ulpfec/90000\r
a=ssrc:138036785 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036785 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:1579984795 cname:87eXz3QiQBBvJFID\r
a=ssrc:1579984795 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036785 1579984795\r
a=ssrc:138036786 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036786 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:138036787 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036787 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036786 138036787\r
`;

  static readonly LOCAL_OFFER_WITH_LAYERS_ALLOCATION_EXTENSION_OVERRIDE_ID: string = `v=0\r
o=- 8360888182273689563 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:video\r
a=extmap:3 urn:3gpp:video-orientation\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:4 http://www.webrtc.org/experiments/rtp-hdrext/video-layers-allocation00\r
a=sendrecv\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 profile-id=0\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:100 VP9/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=fmtp:100 profile-id=2\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:124 red/90000\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124\r
a=rtpmap:123 ulpfec/90000\r
a=ssrc:138036785 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036785 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:1579984795 cname:87eXz3QiQBBvJFID\r
a=ssrc:1579984795 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036785 1579984795\r
a=ssrc:138036786 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036786 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:138036787 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036787 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036786 138036787\r
`;

  static readonly LOCAL_OFFER_WITH_ADDED_LAYERS_ALLOCATION_EXTENSION_WITH_GAP_ID: string = `v=0\r
o=- 8360888182273689563 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:video\r
a=extmap:3 urn:3gpp:video-orientation\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=extmap:12 http://www.webrtc.org/experiments/rtp-hdrext/video-layers-allocation00\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 profile-id=0\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:100 VP9/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=fmtp:100 profile-id=2\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:124 red/90000\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124\r
a=rtpmap:123 ulpfec/90000\r
a=ssrc:138036785 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036785 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:1579984795 cname:87eXz3QiQBBvJFID\r
a=ssrc:1579984795 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036785 1579984795\r
a=ssrc:138036786 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036786 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:138036787 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036787 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036786 138036787\r
`;

  static readonly LOCAL_OFFER_WITH_AUDIO_VIDEO_WITH_NO_SSRC_ATTRIBUTE_VALUE: string = `v=0\r
o=- 8360888182273689563 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:video\r
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:13 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:3 urn:3gpp:video-orientation\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:8 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:9 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r
a=sendrecv\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 profile-id=0\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:100 VP9/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=fmtp:100 profile-id=2\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:124 red/90000\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124\r
a=rtpmap:123 ulpfec/90000\r
a=ssrc:138036785 cname\r
a=ssrc:138036785 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:1579984795 \r
a=ssrc-group:FID 138036785 1579984795\r
a=ssrc:138036786 cname\r
a=ssrc:138036786 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:138036787 cname\r
a=ssrc:138036787 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036786 138036787\r
`;

  static readonly LOCAL_OFFER_WITH_AUDIO_VIDEO_WITHOUT_FID: string = `v=0\r
o=- 8360888182273689563 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:video\r
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:13 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:3 urn:3gpp:video-orientation\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:8 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:9 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r
a=sendrecv\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 profile-id=0\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:100 VP9/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=fmtp:100 profile-id=2\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:124 red/90000\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124\r
a=rtpmap:123 ulpfec/90000\r
a=ssrc:138036785 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036785 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:138036786 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036786 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
`;

  static readonly LOCAL_OFFER_WITH_RECV_VIDEO: string = `v=0\r
o=- 8360888182273689563 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:video\r
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:13 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:3 urn:3gpp:video-orientation\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:8 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:9 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r
a=recvonly\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 profile-id=0\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:100 VP9/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=fmtp:100 profile-id=2\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:124 red/90000\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124\r
a=rtpmap:123 ulpfec/90000\r
a=ssrc:138036785 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036785 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:138036786 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036786 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
`;

  static readonly LOCAL_OFFER_WITH_AUDIO_VIDEO_SIMULCAST_TWO_LAYERS: string = `v=0\r
o=- 8360888182273689563 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:video\r
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:13 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:3 urn:3gpp:video-orientation\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:8 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:9 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r
a=sendrecv\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 profile-id=0\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:100 VP9/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=fmtp:100 profile-id=2\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:124 red/90000\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124\r
a=rtpmap:123 ulpfec/90000\r
a=ssrc:138036785 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036785 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:1579984795 cname:87eXz3QiQBBvJFID\r
a=ssrc:1579984795 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036785 1579984795\r
a=ssrc:138036786 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036786 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:138036787 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036787 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036786 138036787\r
a=ssrc-group:SIM 138036785 138036786\r
`;

  static readonly CHROME_UNIFIED_PLAN_AUDIO_ONLY_WITH_VIDEO_CHECK_IN: string = `
v=0\r
o=- 891888470785474482 2 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE 0 1\r
a=msid-semantic: WMS 4c2b777b-b9d3-495a-85af-4c629c80cf01\r
m=audio 59832 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.14\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:4091836538 1 udp 2122260223 10.78.67.14 59832 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:3177677962 1 tcp 1518280447 10.78.67.14 9 typ host tcptype active generation 0 network-id 1\r network-cost 10\r
a=ice-ufrag:HKBb\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:0\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id\r
a=extmap:5 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id\r
a=sendrecv\r
a=msid:4c2b777b-b9d3-495a-85af-4c629c80cf01 3391c679-1264-4f5e-83f0-b7e93c1f8501\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:780341180 cname:x8+njF0A1kHuzXaV\r
a=ssrc:780341180 msid:4c2b777b-b9d3-495a-85af-4c629c80cf01 3391c679-1264-4f5e-83f0-b7e93c1f8501\r
a=ssrc:780341180 mslabel:4c2b777b-b9d3-495a-85af-4c629c80cf01\r
a=ssrc:780341180 label:3391c679-1264-4f5e-83f0-b7e93c1f8501\r
m=video 64385 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123 119 114 115 116\r
c=IN IP4 10.78.67.14\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:4091836538 1 udp 2122260223 10.78.67.14 64385 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:3177677962 1 tcp 1518280447 10.78.67.14 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:HKBb\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:1\r
a=inactive\r
a=rtcp-mux\r
a=rtcp-rsize\r
`;

  static readonly VIDEO_HOST_AUDIO_ANSWER: string = `v=0\r
o=- 0 0 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio\r
a=msid-semantic: WMS stream_label\r
m=audio 16386 UDP/TLS/RTP/SAVPF 111\r
c=IN IP4 10.88.178.121\r
a=rtcp:16386 IN IP4 10.88.178.121\r
a=candidate:Ha58b279 1 udp 2130706431 10.88.178.121 16386 typ host generation 0\r
a=candidate:Hc0a80005 1 udp 2130706431 192.168.0.5 16386 typ host generation 0\r
a=ice-ufrag:fake\r
a=ice-pwd:fake\r
a=fingerprint:sha-256 fake\r
a=setup:passive\r
a=sendrecv\r
a=mid:audio\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=fmtp:111 minptime=20;useinbandfec=0\r
a=ssrc:216329669 cname:XLHfJRm1Es\r
a=ssrc:216329669 msid:stream_label a0\r
a=ssrc:216329669 mslabel:stream_label\r
a=ssrc:216329669 label:a0\r
`;

  static readonly VIDEO_HOST_AUDIO_ANSWER_WITH_STEREO: string = `v=0\r
o=- 0 0 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio\r
a=msid-semantic: WMS stream_label\r
m=audio 16386 UDP/TLS/RTP/SAVPF 111\r
c=IN IP4 10.88.178.121\r
a=rtcp:16386 IN IP4 10.88.178.121\r
a=candidate:Ha58b279 1 udp 2130706431 10.88.178.121 16386 typ host generation 0\r
a=candidate:Hc0a80005 1 udp 2130706431 192.168.0.5 16386 typ host generation 0\r
a=ice-ufrag:fake\r
a=ice-pwd:fake\r
a=fingerprint:sha-256 fake\r
a=setup:passive\r
a=sendrecv\r
a=mid:audio\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=fmtp:111 minptime=20;useinbandfec=0;maxaveragebitrate=128000;stereo=1;sprop-stereo=1\r
a=ssrc:216329669 cname:XLHfJRm1Es\r
a=ssrc:216329669 msid:stream_label a0\r
a=ssrc:216329669 mslabel:stream_label\r
a=ssrc:216329669 label:a0\r
`;

  static readonly VIDEO_HOST_AUDIO_ANSWER_WITH_BUNDLE_AUDIO_VIDEO: string = `v=0\r
o=- 0 0 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS stream_label\r
m=audio 16386 UDP/TLS/RTP/SAVPF 111\r
c=IN IP4 10.88.178.121\r
a=rtcp:16386 IN IP4 10.88.178.121\r
a=candidate:Ha58b279 1 udp 2130706431 10.88.178.121 16386 typ host generation 0\r
a=candidate:Hc0a80005 1 udp 2130706431 192.168.0.5 16386 typ host generation 0\r
a=ice-ufrag:fake\r
a=ice-pwd:fake\r
a=fingerprint:sha-256 fake\r
a=setup:passive\r
a=sendrecv\r
a=mid:audio\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=fmtp:111 minptime=20;useinbandfec=0\r
a=ssrc:216329669 cname:XLHfJRm1Es\r
a=ssrc:216329669 msid:stream_label a0\r
a=ssrc:216329669 mslabel:stream_label\r
a=ssrc:216329669 label:a0\r
`;

  static readonly VIDEO_HOST_AUDIO_VIDEO_ANSWER: string = `v=0\r
o=- 0 0 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS stream_label\r
m=audio 16386 UDP/TLS/RTP/SAVPF 111\r
c=IN IP4 10.88.178.121\r
a=rtcp:16386 IN IP4 10.88.178.121\r
a=candidate:Ha58b279 1 udp 2130706431 10.88.178.121 16386 typ host generation 0\r
a=candidate:Hc0a80005 1 udp 2130706431 192.168.0.5 16386 typ host generation 0\r
a=ice-ufrag:fake\r
a=ice-pwd:fake\r
a=fingerprint:sha-256 fake\r
a=setup:passive\r
a=sendrecv\r
a=mid:audio\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=fmtp:111 minptime=20;useinbandfec=0\r
a=ssrc:216329669 cname:XLHfJRm1Es\r
a=ssrc:216329669 msid:stream_label a0\r
a=ssrc:216329669 mslabel:stream_label\r
a=ssrc:216329669 label:a0\r
m=video 16386 UDP/TLS/RTP/SAVPF 96 \r
c=IN IP4 10.88.178.121\r
a=rtcp:16386 IN IP4 10.88.178.121\r
a=candidate:Ha58b279 1 udp 2130706431 10.88.178.121 16386 typ host generation 0\r
a=candidate:Hc0a80005 1 udp 2130706431 192.168.0.5 16386 typ host generation 0\r
a=ice-ufrag:fake\r
a=ice-pwd:fake\r
a=fingerprint:sha-256 fake\r
a=setup:passive\r
a=sendrecv\r
a=mid:video\r
a=extmap:2 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:3 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:4 urn:3gpp:video-orientation\r
a=extmap:5 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=rtcp-mux\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 goog-remb\r
a=ssrc:358042235 cname:XLHfJRm1Es\r
a=ssrc:358042235 msid:stream_label track_2\r
a=ssrc:358042235 mslabel:stream_label\r
a=ssrc:358042235 label:track_2\r
`;

  static readonly VIDEO_HOST_AUDIO_ANSWER_WITH_VIDEO_COPIED: string = `v=0\r
o=- 0 0 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio\r
a=msid-semantic: WMS stream_label\r
m=audio 16386 UDP/TLS/RTP/SAVPF 111\r
c=IN IP4 10.88.178.121\r
a=rtcp:16386 IN IP4 10.88.178.121\r
a=candidate:Ha58b279 1 udp 2130706431 10.88.178.121 16386 typ host generation 0\r
a=candidate:Hc0a80005 1 udp 2130706431 192.168.0.5 16386 typ host generation 0\r
a=ice-ufrag:fake\r
a=ice-pwd:fake\r
a=fingerprint:sha-256 fake\r
a=setup:passive\r
a=sendrecv\r
a=mid:audio\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=fmtp:111 minptime=20;useinbandfec=0\r
a=ssrc:216329669 cname:XLHfJRm1Es\r
a=ssrc:216329669 msid:stream_label a0\r
a=ssrc:216329669 mslabel:stream_label\r
a=ssrc:216329669 label:a0\r
m=video 16386 UDP/TLS/RTP/SAVPF 96 \r
c=IN IP4 10.88.178.121\r
a=rtcp:16386 IN IP4 10.88.178.121\r
a=candidate:Ha58b279 1 udp 2130706431 10.88.178.121 16386 typ host generation 0\r
a=candidate:Hc0a80005 1 udp 2130706431 192.168.0.5 16386 typ host generation 0\r
a=ice-ufrag:fake\r
a=ice-pwd:fake\r
a=fingerprint:sha-256 fake\r
a=setup:passive\r
a=sendrecv\r
a=mid:video\r
a=extmap:2 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:3 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:4 urn:3gpp:video-orientation\r
a=extmap:5 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=rtcp-mux\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 goog-remb\r
a=ssrc:358042235 cname:XLHfJRm1Es\r
a=ssrc:358042235 msid:stream_label track_2\r
a=ssrc:358042235 mslabel:stream_label\r
a=ssrc:358042235 label:track_2\r
`;

  static readonly VIDEO_HOST_AUDIO_VIDEO_ANSWER_WITH_BANDWIDTH_RESTRICTION: string = `v=0\r
o=- 0 0 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS stream_label\r
m=audio 16386 UDP/TLS/RTP/SAVPF 111\r
c=IN IP4 10.88.178.121\r
a=rtcp:16386 IN IP4 10.88.178.121\r
a=candidate:Ha58b279 1 udp 2130706431 10.88.178.121 16386 typ host generation 0\r
a=candidate:Hc0a80005 1 udp 2130706431 192.168.0.5 16386 typ host generation 0\r
a=ice-ufrag:fake\r
a=ice-pwd:fake\r
a=fingerprint:sha-256 fake\r
a=setup:passive\r
a=sendrecv\r
a=mid:audio\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=fmtp:111 minptime=20;useinbandfec=0\r
a=ssrc:216329669 cname:XLHfJRm1Es\r
a=ssrc:216329669 msid:stream_label a0\r
a=ssrc:216329669 mslabel:stream_label\r
a=ssrc:216329669 label:a0\r
m=video 16386 UDP/TLS/RTP/SAVPF 96 \r
b=AS:600\r
c=IN IP4 10.88.178.121\r
a=rtcp:16386 IN IP4 10.88.178.121\r
a=candidate:Ha58b279 1 udp 2130706431 10.88.178.121 16386 typ host generation 0\r
a=candidate:Hc0a80005 1 udp 2130706431 192.168.0.5 16386 typ host generation 0\r
a=ice-ufrag:fake\r
a=ice-pwd:fake\r
a=fingerprint:sha-256 fake\r
a=setup:passive\r
a=sendrecv\r
a=mid:video\r
a=extmap:2 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:3 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:4 urn:3gpp:video-orientation\r
a=extmap:5 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=rtcp-mux\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 goog-remb\r
a=ssrc:358042235 cname:XLHfJRm1Es\r
a=ssrc:358042235 msid:stream_label track_2\r
a=ssrc:358042235 mslabel:stream_label\r
a=ssrc:358042235 label:track_2\r
`;

  static readonly VIDEO_HOST_AUDIO_VIDEO_ANSWER_WITH_BANDWIDTH_RESTRICTION_FOR_FIREFOX: string = `v=0\r
o=- 0 0 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS stream_label\r
m=audio 16386 UDP/TLS/RTP/SAVPF 111\r
c=IN IP4 10.88.178.121\r
a=rtcp:16386 IN IP4 10.88.178.121\r
a=candidate:Ha58b279 1 udp 2130706431 10.88.178.121 16386 typ host generation 0\r
a=candidate:Hc0a80005 1 udp 2130706431 192.168.0.5 16386 typ host generation 0\r
a=ice-ufrag:fake\r
a=ice-pwd:fake\r
a=fingerprint:sha-256 fake\r
a=setup:passive\r
a=sendrecv\r
a=mid:audio\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=fmtp:111 minptime=20;useinbandfec=0\r
a=ssrc:216329669 cname:XLHfJRm1Es\r
a=ssrc:216329669 msid:stream_label a0\r
a=ssrc:216329669 mslabel:stream_label\r
a=ssrc:216329669 label:a0\r
m=video 16386 UDP/TLS/RTP/SAVPF 96 \r
b=TIAS:600000\r
c=IN IP4 10.88.178.121\r
a=rtcp:16386 IN IP4 10.88.178.121\r
a=candidate:Ha58b279 1 udp 2130706431 10.88.178.121 16386 typ host generation 0\r
a=candidate:Hc0a80005 1 udp 2130706431 192.168.0.5 16386 typ host generation 0\r
a=ice-ufrag:fake\r
a=ice-pwd:fake\r
a=fingerprint:sha-256 fake\r
a=setup:passive\r
a=sendrecv\r
a=mid:video\r
a=extmap:2 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:3 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:4 urn:3gpp:video-orientation\r
a=extmap:5 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=rtcp-mux\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 goog-remb\r
a=ssrc:358042235 cname:XLHfJRm1Es\r
a=ssrc:358042235 msid:stream_label track_2\r
a=ssrc:358042235 mslabel:stream_label\r
a=ssrc:358042235 label:track_2\r
`;

  static readonly CHROME_UNIFIED_PLAN_AUDIO_VIDEO: string = `
v=0\r
o=- 891888470785474482 2 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE 0 1 2\r
a=msid-semantic: WMS 4c2b777b-b9d3-495a-85af-4c629c80cf01\r
m=audio 59832 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.14\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:4091836538 1 udp 2122260223 10.78.67.14 59832 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:3177677962 1 tcp 1518280447 10.78.67.14 9 typ host tcptype active generation 0 network-id 1\r network-cost 10\r
a=ice-ufrag:HKBb\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:0\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id\r
a=extmap:5 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id\r
a=sendrecv\r
a=msid:4c2b777b-b9d3-495a-85af-4c629c80cf01 3391c679-1264-4f5e-83f0-b7e93c1f8501\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:780341180 cname:x8+njF0A1kHuzXaV\r
a=ssrc:780341180 msid:4c2b777b-b9d3-495a-85af-4c629c80cf01 3391c679-1264-4f5e-83f0-b7e93c1f8501\r
a=ssrc:780341180 mslabel:4c2b777b-b9d3-495a-85af-4c629c80cf01\r
a=ssrc:780341180 label:3391c679-1264-4f5e-83f0-b7e93c1f8501\r
m=video 64385 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123 119 114 115 116\r
c=IN IP4 10.78.67.14\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:4091836538 1 udp 2122260223 10.78.67.14 64385 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:3177677962 1 tcp 1518280447 10.78.67.14 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:HKBb\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:1\r
a=inactive\r
a=rtcp-mux\r
a=rtcp-rsize\r
m=video 64385 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123 119 114 115 116\r
c=IN IP4 10.78.67.14\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:4091836538 1 udp 2122260223 10.78.67.14 64385 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:3177677962 1 tcp 1518280447 10.78.67.14 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:fake\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:1\r
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:13 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=sendrecv\r
a=msid:4c2b777b-b9d3-495a-85af-4c629c80cf01 319e9811-6873-4234-bd8f-848ca912bd0d\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=ssrc-group:FID 4011951679 3372699351\r
a=ssrc:4011951679 cname:x8+njF0A1kHuzXaV\r
a=ssrc:4011951679 msid:4c2b777b-b9d3-495a-85af-4c629c80cf01 319e9811-6873-4234-bd8f-848ca912bd0d\r
a=ssrc:4011951679 mslabel:4c2b777b-b9d3-495a-85af-4c629c80cf01\r
a=ssrc:4011951679 label:319e9811-6873-4234-bd8f-848ca912bd0d\r
a=ssrc:3372699351 cname:x8+njF0A1kHuzXaV\r
a=ssrc:3372699351 msid:4c2b777b-b9d3-495a-85af-4c629c80cf01 319e9811-6873-4234-bd8f-848ca912bd0d\r
a=ssrc:3372699351 mslabel:4c2b777b-b9d3-495a-85af-4c629c80cf01\r
a=ssrc:3372699351 label:319e9811-6873-4234-bd8f-848ca912bd0d\r
m=video 0 UDP/TLS/RTP/SAVPF 120 121 126 97\r
c=IN IP4 10.78.67.19\r
a=bundle-only\r
a=recvonly\r
a=end-of-candidates\r
a=extmap:1 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:2 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=fmtp:126 profile-level-id=42e01f;level-asymmetry-allowed=1;packetization-mode=1\r
a=fmtp:97 profile-level-id=42e01f;level-asymmetry-allowed=1\r
a=fmtp:120 max-fs=12288;max-fr=60\r
a=fmtp:121 max-fs=12288;max-fr=60\r
a=ice-pwd:fake\r
a=ice-ufrag:fake\r
a=mid:sdparta_2\r
a=rtcp:50142 IN IP4 10.78.67.19\r
a=rtcp-fb:120 nack\r
a=rtcp-fb:120 nack pli\r
a=rtcp-fb:120 ccm fir\r
a=rtcp-fb:120 goog-remb\r
a=rtcp-fb:121 nack\r
a=rtcp-fb:121 nack pli\r
a=rtcp-fb:121 ccm fir\r
a=rtcp-fb:121 goog-remb\r
a=rtcp-fb:126 nack\r
a=rtcp-fb:126 nack pli\r
a=rtcp-fb:126 ccm fir\r
a=rtcp-fb:126 goog-remb\r
a=rtcp-fb:97 nack\r
a=rtcp-fb:97 nack pli\r
a=rtcp-fb:97 ccm fir\r
a=rtcp-fb:97 goog-remb\r
a=rtcp-mux\r
a=rtpmap:120 VP8/90000\r
a=rtpmap:121 VP9/90000\r
a=rtpmap:126 H264/90000\r
a=rtpmap:97 H264/90000\r
a=setup:actpass\r
`;

  static readonly CHROME_UNIFIED_PLAN_AUDIO_VIDEO_TWO_RECEIVE: string = `
v=0\r
o=- 891888470785474482 2 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE 0 1 2\r
a=msid-semantic: WMS 4c2b777b-b9d3-495a-85af-4c629c80cf01\r
m=audio 59832 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.14\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:4091836538 1 udp 2122260223 10.78.67.14 59832 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:3177677962 1 tcp 1518280447 10.78.67.14 9 typ host tcptype active generation 0 network-id 1\r network-cost 10\r
a=ice-ufrag:HKBb\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:0\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id\r
a=extmap:5 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id\r
a=sendrecv\r
a=msid:4c2b777b-b9d3-495a-85af-4c629c80cf01 3391c679-1264-4f5e-83f0-b7e93c1f8501\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:780341180 cname:x8+njF0A1kHuzXaV\r
a=ssrc:780341180 msid:4c2b777b-b9d3-495a-85af-4c629c80cf01 3391c679-1264-4f5e-83f0-b7e93c1f8501\r
a=ssrc:780341180 mslabel:4c2b777b-b9d3-495a-85af-4c629c80cf01\r
a=ssrc:780341180 label:3391c679-1264-4f5e-83f0-b7e93c1f8501\r
m=video 64385 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123 119 114 115 116\r
c=IN IP4 10.78.67.14\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:4091836538 1 udp 2122260223 10.78.67.14 64385 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:3177677962 1 tcp 1518280447 10.78.67.14 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:HKBb\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:4\r
a=inactive\r
a=rtcp-mux\r
a=rtcp-rsize\r
m=video 64385 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123 119 114 115 116\r
c=IN IP4 10.78.67.14\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:4091836538 1 udp 2122260223 10.78.67.14 64385 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:3177677962 1 tcp 1518280447 10.78.67.14 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:fake\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:1\r
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:13 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=sendrecv\r
a=msid:4c2b777b-b9d3-495a-85af-4c629c80cf01 319e9811-6873-4234-bd8f-848ca912bd0d\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=ssrc-group:FID 4011951679 3372699351\r
a=ssrc:4011951679 cname:x8+njF0A1kHuzXaV\r
a=ssrc:4011951679 msid:4c2b777b-b9d3-495a-85af-4c629c80cf01 319e9811-6873-4234-bd8f-848ca912bd0d\r
a=ssrc:4011951679 mslabel:4c2b777b-b9d3-495a-85af-4c629c80cf01\r
a=ssrc:4011951679 label:319e9811-6873-4234-bd8f-848ca912bd0d\r
a=ssrc:3372699351 cname:x8+njF0A1kHuzXaV\r
a=ssrc:3372699351 msid:4c2b777b-b9d3-495a-85af-4c629c80cf01 319e9811-6873-4234-bd8f-848ca912bd0d\r
a=ssrc:3372699351 mslabel:4c2b777b-b9d3-495a-85af-4c629c80cf01\r
a=ssrc:3372699351 label:319e9811-6873-4234-bd8f-848ca912bd0d\r
m=video 0 UDP/TLS/RTP/SAVPF 120 121 126 97\r
c=IN IP4 10.78.67.19\r
a=bundle-only\r
a=recvonly\r
a=end-of-candidates\r
a=extmap:1 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:2 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=fmtp:126 profile-level-id=42e01f;level-asymmetry-allowed=1;packetization-mode=1\r
a=fmtp:97 profile-level-id=42e01f;level-asymmetry-allowed=1\r
a=fmtp:120 max-fs=12288;max-fr=60\r
a=fmtp:121 max-fs=12288;max-fr=60\r
a=ice-pwd:fake\r
a=ice-ufrag:fake\r
a=mid:1\r
a=rtcp:50142 IN IP4 10.78.67.19\r
a=rtcp-fb:120 nack\r
a=rtcp-fb:120 nack pli\r
a=rtcp-fb:120 ccm fir\r
a=rtcp-fb:120 goog-remb\r
a=rtcp-fb:121 nack\r
a=rtcp-fb:121 nack pli\r
a=rtcp-fb:121 ccm fir\r
a=rtcp-fb:121 goog-remb\r
a=rtcp-fb:126 nack\r
a=rtcp-fb:126 nack pli\r
a=rtcp-fb:126 ccm fir\r
a=rtcp-fb:126 goog-remb\r
a=rtcp-fb:97 nack\r
a=rtcp-fb:97 nack pli\r
a=rtcp-fb:97 ccm fir\r
a=rtcp-fb:97 goog-remb\r
a=rtcp-mux\r
a=rtpmap:120 VP8/90000\r
a=rtpmap:121 VP9/90000\r
a=rtpmap:126 H264/90000\r
a=rtpmap:97 H264/90000\r
a=setup:actpass\r
m=video 0 UDP/TLS/RTP/SAVPF 120 121 126 97\r
c=IN IP4 10.78.67.19\r
a=bundle-only\r
a=recvonly\r
a=end-of-candidates\r
a=extmap:1 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:2 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=fmtp:126 profile-level-id=42e01f;level-asymmetry-allowed=1;packetization-mode=1\r
a=fmtp:97 profile-level-id=42e01f;level-asymmetry-allowed=1\r
a=fmtp:120 max-fs=12288;max-fr=60\r
a=fmtp:121 max-fs=12288;max-fr=60\r
a=ice-pwd:fake\r
a=ice-ufrag:fake\r
a=mid:2\r
a=rtcp:50142 IN IP4 10.78.67.19\r
a=rtcp-fb:120 nack\r
a=rtcp-fb:120 nack pli\r
a=rtcp-fb:120 ccm fir\r
a=rtcp-fb:120 goog-remb\r
a=rtcp-fb:121 nack\r
a=rtcp-fb:121 nack pli\r
a=rtcp-fb:121 ccm fir\r
a=rtcp-fb:121 goog-remb\r
a=rtcp-fb:126 nack\r
a=rtcp-fb:126 nack pli\r
a=rtcp-fb:126 ccm fir\r
a=rtcp-fb:126 goog-remb\r
a=rtcp-fb:97 nack\r
a=rtcp-fb:97 nack pli\r
a=rtcp-fb:97 ccm fir\r
a=rtcp-fb:97 goog-remb\r
a=rtcp-mux\r
a=rtpmap:120 VP8/90000\r
a=rtpmap:121 VP9/90000\r
a=rtpmap:126 H264/90000\r
a=rtpmap:97 H264/90000\r
a=setup:actpass\r
`;

  static readonly MOZILLA_AUDIO_SDP: string = `
v=0\r
o=mozilla...THIS_IS_SDPARTA-60.6.3 2968292268851072187 1 IN IP4 0.0.0.0\r
s=-\r
t=0 0\r
a=sendrecv\r
a=fingerprint:sha-256 fake\r
a=group:BUNDLE sdparta_0 \r
a=ice-options:trickle\r
a=msid-semantic:WMS *\r
m=audio 56592 UDP/TLS/RTP/SAVPF 109 9 0 8 101\r
c=IN IP4 10.78.67.19\r
a=candidate:0 1 UDP 2122252543 10.78.67.19 56592 typ host\r
a=candidate:1 1 TCP 2105524479 10.78.67.19 9 typ host tcptype active\r
a=sendrecv\r
a=end-of-candidates\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2/recvonly urn:ietf:params:rtp-hdrext:csrc-audio-level\r
a=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=fmtp:109 maxplaybackrate=48000;stereo=1;useinbandfec=1\r
a=fmtp:101 0-15\r
a=ice-pwd:fake\r
a=ice-ufrag:fake\r
a=mid:sdparta_0\r
a=msid:{78699406-9dab-0344-9708-64023e638a0a} {4f049495-0c64-1243-bd64-d5ac4c146c65}\r
a=rtcp:52456 IN IP4 10.78.67.19\r
a=rtcp-mux\r
a=rtpmap:109 opus/48000/2\r
a=rtpmap:9 G722/8000/1\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:101 telephone-event/8000\r
a=setup:actpass\r
a=ssrc:243991484 cname:{9faef5f4-f304-c442-a84c-7744cc149ec8}\r
`;

  static readonly MOZILLA_AV_SENDING: string = `
v=0\r
o=mozilla...THIS_IS_SDPARTA-60.6.3 2968292268851072187 1 IN IP4 0.0.0.0\r
s=-\r
t=0 0\r
a=sendrecv\r
a=fingerprint:sha-256 fake\r
a=group:BUNDLE sdparta_0 sdparta_1 sdparta_2\r
a=ice-options:trickle\r
a=msid-semantic:WMS *\r
m=audio 56592 UDP/TLS/RTP/SAVPF 109 9 0 8 101\r
c=IN IP4 10.78.67.19\r
a=candidate:0 1 UDP 2122252543 10.78.67.19 56592 typ host\r
a=candidate:1 1 TCP 2105524479 10.78.67.19 9 typ host tcptype active\r
a=sendrecv\r
a=end-of-candidates\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2/recvonly urn:ietf:params:rtp-hdrext:csrc-audio-level\r
a=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=fmtp:109 maxplaybackrate=48000;stereo=1;useinbandfec=1\r
a=fmtp:101 0-15\r
a=ice-pwd:fake\r
a=ice-ufrag:fake\r
a=mid:sdparta_0\r
a=msid:{78699406-9dab-0344-9708-64023e638a0a} {4f049495-0c64-1243-bd64-d5ac4c146c65}\r
a=rtcp:52456 IN IP4 10.78.67.19\r
a=rtcp-mux\r
a=rtpmap:109 opus/48000/2\r
a=rtpmap:9 G722/8000/1\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:101 telephone-event/8000\r
a=setup:actpass\r
a=ssrc:243991484 cname:{9faef5f4-f304-c442-a84c-7744cc149ec8}\r
m=video 53683 UDP/TLS/RTP/SAVPF 120 121 126 97\r
c=IN IP4 10.78.67.19\r
a=candidate:0 1 UDP 2122252543 10.78.67.19 53683 typ host\r
a=candidate:1 1 TCP 2105524479 10.78.67.19 9 typ host tcptype active\r
a=candidate:0 2 UDP 2122252542 10.78.67.19 50834 typ host\r
a=candidate:1 2 TCP 2105524478 10.78.67.19 9 typ host tcptype active\r
a=inactive\r
a=end-of-candidates\r
a=extmap:1 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:2 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=fmtp:126 profile-level-id=42e01f;level-asymmetry-allowed=1;packetization-mode=1\r
a=fmtp:97 profile-level-id=42e01f;level-asymmetry-allowed=1\r
a=fmtp:120 max-fs=12288;max-fr=60\r
a=fmtp:121 max-fs=12288;max-fr=60\r
a=ice-pwd:fake\r
a=ice-ufrag:fake\r
a=mid:sdparta_1\r
a=rtcp:50834 IN IP4 10.78.67.19\r
a=rtcp-fb:120 nack\r
a=rtcp-fb:120 nack pli\r
a=rtcp-fb:120 ccm fir\r
a=rtcp-fb:120 goog-remb\r
a=rtcp-fb:121 nack\r
a=rtcp-fb:121 nack pli\r
a=rtcp-fb:121 ccm fir\r
a=rtcp-fb:121 goog-remb\r
a=rtcp-fb:126 nack\r
a=rtcp-fb:126 nack pli\r
a=rtcp-fb:126 ccm fir\r
a=rtcp-fb:126 goog-remb\r
a=rtcp-fb:97 nack\r
a=rtcp-fb:97 nack pli\r
a=rtcp-fb:97 ccm fir\r
a=rtcp-fb:97 goog-remb\r
a=rtcp-mux\r
a=rtpmap:120 VP8/90000\r
a=rtpmap:121 VP9/90000\r
a=rtpmap:126 H264/90000\r
a=rtpmap:97 H264/90000\r
a=setup:actpass\r
a=ssrc:2196953853 cname:{9faef5f4-f304-c442-a84c-7744cc149ec8}\r
m=video 0 UDP/TLS/RTP/SAVPF 120 121 126 97\r
c=IN IP4 10.78.67.19\r
a=bundle-only\r
a=candidate:0 1 UDP 2122252543 10.78.67.19 64360 typ host\r
a=candidate:1 1 TCP 2105524479 10.78.67.19 9 typ host tcptype active\r
a=candidate:0 2 UDP 2122252542 10.78.67.19 50142 typ host\r
a=candidate:1 2 TCP 2105524478 10.78.67.19 9 typ host tcptype active\r
a=recvonly\r
a=end-of-candidates\r
a=extmap:1 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:2 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=fmtp:126 profile-level-id=42e01f;level-asymmetry-allowed=1;packetization-mode=1\r
a=fmtp:97 profile-level-id=42e01f;level-asymmetry-allowed=1\r
a=fmtp:120 max-fs=12288;max-fr=60\r
a=fmtp:121 max-fs=12288;max-fr=60\r
a=ice-pwd:fake\r
a=ice-ufrag:fake\r
a=mid:sdparta_2\r
a=rtcp:50142 IN IP4 10.78.67.19\r
a=rtcp-fb:120 nack\r
a=rtcp-fb:120 nack pli\r
a=rtcp-fb:120 ccm fir\r
a=rtcp-fb:120 goog-remb\r
a=rtcp-fb:121 nack\r
a=rtcp-fb:121 nack pli\r
a=rtcp-fb:121 ccm fir\r
a=rtcp-fb:121 goog-remb\r
a=rtcp-fb:126 nack\r
a=rtcp-fb:126 nack pli\r
a=rtcp-fb:126 ccm fir\r
a=rtcp-fb:126 goog-remb\r
a=rtcp-fb:97 nack\r
a=rtcp-fb:97 nack pli\r
a=rtcp-fb:97 ccm fir\r
a=rtcp-fb:97 goog-remb\r
a=rtcp-mux\r
a=rtpmap:120 VP8/90000\r
a=rtpmap:121 VP9/90000\r
a=rtpmap:126 H264/90000\r
a=rtpmap:97 H264/90000\r
a=setup:actpass\r
a=ssrc:4211290897 cname:{9faef5f4-f304-c442-a84c-7744cc149ec8}\r
`;

  static readonly SAFARI_AV_SENDING = `
v=0\r
o=- 6724755849797858675 2 IN IP4 127.0.0.0\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS d9a63ff3-9dcd-490c-b4a5-464f3417e812\r
m=audio 9 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:rVEC\r
a=ice-pwd:NoQ1g+LmzdMFxjmifwQ5aKOz\r
a=ice-options:trickle\r
a=fingerprint:sha-256 87:8B:3A:57:A4:8B:72:67:02:B1:B4:F9:13:72:24:EE:63:E6:69:38:70:F2:DA:68:BC:90:50:9D:27:E1:EC:65\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:4085587676 cname:Zd1FwZ/qpoybYNVB\r
a=ssrc:4085587676 msid:d9a63ff3-9dcd-490c-b4a5-464f3417e812 96b453e9-c6a9-4eed-86e0-8d18dd52b5c8\r
a=ssrc:4085587676 mslabel:d9a63ff3-9dcd-490c-b4a5-464f3417e812\r
a=ssrc:4085587676 label:96b453e9-c6a9-4eed-86e0-8d18dd52b5c8\r
m=video 54073 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123 119 114 115 116\r
c=IN IP4 10.2.21.246\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:249905494 1 udp 41885695 10.2.21.246 54073 typ relay raddr 0.0.0.0 rport 0 generation 0 network-id 1\r
a=ice-ufrag:rVEC\r
a=ice-pwd:NoQ1g+LmzdMFxjmifwQ5aKOz\r
a=ice-options:trickle\r
a=fingerprint:sha-256 87:8B:3A:57:A4:8B:72:67:02:B1:B4:F9:13:72:24:EE:63:E6:69:38:70:F2:DA:68:BC:90:50:9D:27:E1:EC:65\r
a=setup:actpass\r
a=mid:video\r
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:13 urn:3gpp:video-orientation\r
a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:8 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:9 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r
a=recvonly\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 profile-id=0\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:100 VP9/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=fmtp:100 profile-id=2\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:124 H264/90000\r
a=rtcp-fb:124 goog-remb\r
a=rtcp-fb:124 transport-cc\r
a=rtcp-fb:124 ccm fir\r
a=rtcp-fb:124 nack\r
a=rtcp-fb:124 nack pli\r
a=fmtp:124 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=4d0032\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124\r
a=rtpmap:123 H264/90000\r
a=rtcp-fb:123 goog-remb\r
a=rtcp-fb:123 transport-cc\r
a=rtcp-fb:123 ccm fir\r
a=rtcp-fb:123 nack\r
a=rtcp-fb:123 nack pli\r
a=fmtp:123 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=640032\r
a=rtpmap:119 rtx/90000\r
a=fmtp:119 apt=123\r
a=rtpmap:114 red/90000\r
a=rtpmap:115 rtx/90000\r
a=fmtp:115 apt=114\r
a=rtpmap:116 ulpfec/90000\r
`;

  static readonly LOCAL_OFFER_WITH_AUDIO_VIDEO_WITH_AUDIO_BITRATE: string = `v=0\r
o=- 8360888182273689563 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1;maxaveragebitrate=$VALUE\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:video\r
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:13 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:3 urn:3gpp:video-orientation\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:8 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:9 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r
a=sendrecv\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 profile-id=0\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:100 VP9/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=fmtp:100 profile-id=2\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:124 red/90000\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124\r
a=rtpmap:123 ulpfec/90000\r
a=ssrc:138036785 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036785 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:1579984795 cname:87eXz3QiQBBvJFID\r
a=ssrc:1579984795 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036785 1579984795\r
a=ssrc:138036786 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036786 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:138036787 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036787 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036786 138036787\r
`;
  static readonly LOCAL_OFFER_WITH_AUDIO_VIDEO_SENDING = `v=0\r
o=- 2231580719842176600 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE 0 1\r
a=msid-semantic: WMS 5d72c0f4-9804-4e1b-94d4-d0ab0ef8f39c\r
m=audio 34517 UDP/TLS/RTP/SAVPF 111 103 9 102 0 8 105 13 110 113 126\r
c=IN IP4 10.3.27.95\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:1590270400 1 udp 33562623 225555.55.555.555 34517 typ relay raddr 0.0.0.0 rport 0 generation 0 network-cost 999\r
a=ice-ufrag:-\r
a=ice-pwd:-\r
a=ice-options:trickle\r
a=fingerprint:sha-256 -\r
a=setup:actpass\r
a=mid:0\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:9 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=sendrecv\r
a=msid:5d72c0f4-9804-4e1b-94d4-d0ab0ef8f39c 2191afc4-8438-4be8-a30a-c13782519955\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:102 ILBC/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:4126581560 cname:uRHftBjmhwofBLqY\r
a=ssrc:4126581560 msid:5d72c0f4-9804-4e1b-94d4-d0ab0ef8f39c 2191afc4-8438-4be8-a30a-c13782519955\r
a=ssrc:4126581560 mslabel:5d72c0f4-9804-4e1b-94d4-d0ab0ef8f39c\r
a=ssrc:4126581560 label:2191afc4-8438-4be8-a30a-c13782519955\r
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 127 125 104\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:-\r
a=ice-pwd:-\r
a=ice-options:trickle\r
a=fingerprint:sha-256 4D:0B:20:29:08:E8:10:78:5B:15:5D:F1:A8:C2:54:B3:A0:36:67:58:95:16:DE:6F:EF:6B:26:9A:67:65:D4:7C\r
a=setup:actpass\r
a=mid:1\r
a=extmap:2 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:3 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:4 urn:3gpp:video-orientation\r
a=extmap:5 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:10 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:9 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=sendrecv\r
a=msid:5d72c0f4-9804-4e1b-94d4-d0ab0ef8f39c 2b407f91-08d4-4ddb-bbdd-5b600f8912a7\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 H264/90000\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=fmtp:96 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=640c1f\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 H264/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:100 VP8/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:127 red/90000\r
a=rtpmap:125 rtx/90000\r
a=fmtp:125 apt=127\r
a=rtpmap:104 ulpfec/90000\r
a=ssrc-group:FID 2209845614 703070799\r
a=ssrc:2209845614 cname:uRHftBjmhwofBLqY\r
a=ssrc:2209845614 msid:5d72c0f4-9804-4e1b-94d4-d0ab0ef8f39c 2b407f91-08d4-4ddb-bbdd-5b600f8912a7\r
a=ssrc:2209845614 mslabel:5d72c0f4-9804-4e1b-94d4-d0ab0ef8f39c\r
a=ssrc:2209845614 label:2b407f91-08d4-4ddb-bbdd-5b600f8912a7\r
a=ssrc:703070799 cname:uRHftBjmhwofBLqY\r
a=ssrc:703070799 msid:5d72c0f4-9804-4e1b-94d4-d0ab0ef8f39c 2b407f91-08d4-4ddb-bbdd-5b600f8912a7\r
a=ssrc:703070799 mslabel:5d72c0f4-9804-4e1b-94d4-d0ab0ef8f39c\r
a=ssrc:703070799 label:2b407f91-08d4-4ddb-bbdd-5b600f8912a7\r
`;
  static readonly LOCAL_OFFER_WITH_AUDIO_VIDEO_SENDING_MULTIPLE_FMTP = `v=0\r
o=- 2231580719842176600 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE 0 1\r
a=msid-semantic: WMS 5d72c0f4-9804-4e1b-94d4-d0ab0ef8f39c\r
m=audio 34517 UDP/TLS/RTP/SAVPF 111 103 9 102 0 8 105 13 110 113 126\r
c=IN IP4 10.3.27.95\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:1590270400 1 udp 33562623 225555.55.555.555 34517 typ relay raddr 0.0.0.0 rport 0 generation 0 network-cost 999\r
a=ice-ufrag:-\r
a=ice-pwd:-\r
a=ice-options:trickle\r
a=fingerprint:sha-256 -\r
a=setup:actpass\r
a=mid:0\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:9 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=sendrecv\r
a=msid:5d72c0f4-9804-4e1b-94d4-d0ab0ef8f39c 2191afc4-8438-4be8-a30a-c13782519955\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:102 ILBC/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:4126581560 cname:uRHftBjmhwofBLqY\r
a=ssrc:4126581560 msid:5d72c0f4-9804-4e1b-94d4-d0ab0ef8f39c 2191afc4-8438-4be8-a30a-c13782519955\r
a=ssrc:4126581560 mslabel:5d72c0f4-9804-4e1b-94d4-d0ab0ef8f39c\r
a=ssrc:4126581560 label:2191afc4-8438-4be8-a30a-c13782519955\r
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 127 125 104\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:-\r
a=ice-pwd:-\r
a=ice-options:trickle\r
a=fingerprint:sha-256 4D:0B:20:29:08:E8:10:78:5B:15:5D:F1:A8:C2:54:B3:A0:36:67:58:95:16:DE:6F:EF:6B:26:9A:67:65:D4:7C\r
a=setup:actpass\r
a=mid:1\r
a=extmap:2 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:3 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:4 urn:3gpp:video-orientation\r
a=extmap:5 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:10 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:9 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=sendrecv\r
a=msid:5d72c0f4-9804-4e1b-94d4-d0ab0ef8f39c 2b407f91-08d4-4ddb-bbdd-5b600f8912a7\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 H264/90000\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=fmtp:96 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=640c1f\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 rtx/90000\r
a=fmtp:98 apt=96\r
a=rtpmap:99 H264/90000\r
a=rtcp-fb:99 goog-remb\r
a=rtcp-fb:99 transport-cc\r
a=rtcp-fb:99 ccm fir\r
a=rtcp-fb:99 nack\r
a=rtcp-fb:99 nack pli\r
a=fmtp:99 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:100 VP8/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:127 red/90000\r
a=rtpmap:125 rtx/90000\r
a=fmtp:125 apt=127\r
a=rtpmap:104 ulpfec/90000\r
a=ssrc-group:FID 2209845614 703070799\r
a=ssrc:2209845614 cname:uRHftBjmhwofBLqY\r
a=ssrc:2209845614 msid:5d72c0f4-9804-4e1b-94d4-d0ab0ef8f39c 2b407f91-08d4-4ddb-bbdd-5b600f8912a7\r
a=ssrc:2209845614 mslabel:5d72c0f4-9804-4e1b-94d4-d0ab0ef8f39c\r
a=ssrc:2209845614 label:2b407f91-08d4-4ddb-bbdd-5b600f8912a7\r
a=ssrc:703070799 cname:uRHftBjmhwofBLqY\r
a=ssrc:703070799 msid:5d72c0f4-9804-4e1b-94d4-d0ab0ef8f39c 2b407f91-08d4-4ddb-bbdd-5b600f8912a7\r
a=ssrc:703070799 mslabel:5d72c0f4-9804-4e1b-94d4-d0ab0ef8f39c\r
a=ssrc:703070799 label:2b407f91-08d4-4ddb-bbdd-5b600f8912a7\r
`;
  static readonly LOCAL_OFFER_WITH_AUDIO_VIDEO_SENDING_VP8_ONLY = `v=0\r
o=- 2231580719842176600 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE 0 1\r
a=msid-semantic: WMS 5d72c0f4-9804-4e1b-94d4-d0ab0ef8f39c\r
m=audio 34517 UDP/TLS/RTP/SAVPF 111 103 9 102 0 8 105 13 110 113 126\r
c=IN IP4 10.3.27.95\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:1590270400 1 udp 33562623 225555.55.555.555 34517 typ relay raddr 0.0.0.0 rport 0 generation 0 network-cost 999\r
a=ice-ufrag:-\r
a=ice-pwd:-\r
a=ice-options:trickle\r
a=fingerprint:sha-256 -\r
a=setup:actpass\r
a=mid:0\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:9 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=sendrecv\r
a=msid:5d72c0f4-9804-4e1b-94d4-d0ab0ef8f39c 2191afc4-8438-4be8-a30a-c13782519955\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:102 ILBC/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:4126581560 cname:uRHftBjmhwofBLqY\r
a=ssrc:4126581560 msid:5d72c0f4-9804-4e1b-94d4-d0ab0ef8f39c 2191afc4-8438-4be8-a30a-c13782519955\r
a=ssrc:4126581560 mslabel:5d72c0f4-9804-4e1b-94d4-d0ab0ef8f39c\r
a=ssrc:4126581560 label:2191afc4-8438-4be8-a30a-c13782519955\r
m=video 9 UDP/TLS/RTP/SAVPF 100 101 127 125 104\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:-\r
a=ice-pwd:-\r
a=ice-options:trickle\r
a=fingerprint:sha-256 4D:0B:20:29:08:E8:10:78:5B:15:5D:F1:A8:C2:54:B3:A0:36:67:58:95:16:DE:6F:EF:6B:26:9A:67:65:D4:7C\r
a=setup:actpass\r
a=mid:1\r
a=extmap:2 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:3 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:4 urn:3gpp:video-orientation\r
a=extmap:5 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:10 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:9 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=sendrecv\r
a=msid:5d72c0f4-9804-4e1b-94d4-d0ab0ef8f39c 2b407f91-08d4-4ddb-bbdd-5b600f8912a7\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:100 VP8/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:127 red/90000\r
a=rtpmap:125 rtx/90000\r
a=fmtp:125 apt=127\r
a=rtpmap:104 ulpfec/90000\r
a=ssrc-group:FID 2209845614 703070799\r
a=ssrc:2209845614 cname:uRHftBjmhwofBLqY\r
a=ssrc:2209845614 msid:5d72c0f4-9804-4e1b-94d4-d0ab0ef8f39c 2b407f91-08d4-4ddb-bbdd-5b600f8912a7\r
a=ssrc:2209845614 mslabel:5d72c0f4-9804-4e1b-94d4-d0ab0ef8f39c\r
a=ssrc:2209845614 label:2b407f91-08d4-4ddb-bbdd-5b600f8912a7\r
a=ssrc:703070799 cname:uRHftBjmhwofBLqY\r
a=ssrc:703070799 msid:5d72c0f4-9804-4e1b-94d4-d0ab0ef8f39c 2b407f91-08d4-4ddb-bbdd-5b600f8912a7\r
a=ssrc:703070799 mslabel:5d72c0f4-9804-4e1b-94d4-d0ab0ef8f39c\r
a=ssrc:703070799 label:2b407f91-08d4-4ddb-bbdd-5b600f8912a7\r
`;

  static readonly LOCAL_OFFER_WITH_AUDIO_VIDEO_WITH_STEREO: string = `v=0\r
o=- 8360888182273689563 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1;maxaveragebitrate=128000;stereo=1;sprop-stereo=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:video\r
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:13 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:3 urn:3gpp:video-orientation\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:8 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:9 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r
a=sendrecv\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 profile-id=0\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:100 VP9/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=fmtp:100 profile-id=2\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:124 red/90000\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124\r
a=rtpmap:123 ulpfec/90000\r
a=ssrc:138036785 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036785 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:1579984795 cname:87eXz3QiQBBvJFID\r
a=ssrc:1579984795 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036785 1579984795\r
a=ssrc:138036786 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036786 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:138036787 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036787 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036786 138036787\r
`;

  static readonly LOCAL_OFFER_WITH_AUDIO_VIDEO_FIREFOX: string = `v=0\r
o=- 8360888182273689563 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:111 opus/48000/2\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:111 G711/48000/2\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:111 opus/48000/2\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:video\r
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:13 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:3 urn:3gpp:video-orientation\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:8 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:9 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r
a=sendrecv\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 profile-id=0\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:100 VP9/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=fmtp:100 profile-id=2\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:124 red/90000\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124\r
a=rtpmap:123 ulpfec/90000\r
a=ssrc:138036785 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036785 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:1579984795 cname:87eXz3QiQBBvJFID\r
a=ssrc:1579984795 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036785 1579984795\r
a=ssrc:138036786 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036786 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:138036787 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036787 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036786 138036787\r
`;

  static readonly LOCAL_OFFER_WITH_AUDIO_VIDEO_WITH_STEREO_FIREFOX: string = `v=0\r
o=- 8360888182273689563 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1;maxaveragebitrate=128000;stereo=1;sprop-stereo=1\r
a=rtpmap:111 opus/48000/2\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:111 G711/48000/2\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1;maxaveragebitrate=128000;stereo=1;sprop-stereo=1\r
a=rtpmap:111 opus/48000/2\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:video\r
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:13 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:3 urn:3gpp:video-orientation\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:8 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:9 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r
a=sendrecv\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 profile-id=0\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:100 VP9/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=fmtp:100 profile-id=2\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:124 red/90000\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124\r
a=rtpmap:123 ulpfec/90000\r
a=ssrc:138036785 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036785 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:1579984795 cname:87eXz3QiQBBvJFID\r
a=ssrc:1579984795 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036785 1579984795\r
a=ssrc:138036786 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036786 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:138036787 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036787 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036786 138036787\r
`;

  static readonly LOCAL_OFFER_WITH_AUDIO_VIDEO_PREFERS_H264_CBP_THEN_VP8: string = `v=0\r
o=- 8360888182273689563 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=video 9 UDP/TLS/RTP/SAVPF 125 96 97 98 99 100 101 102 122 127 121 107 108 109 124 120 123\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:video\r
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:13 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:3 urn:3gpp:video-orientation\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:8 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:9 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r
a=sendrecv\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 profile-id=0\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:100 VP9/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=fmtp:100 profile-id=2\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:124 red/90000\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124\r
a=rtpmap:123 ulpfec/90000\r
a=ssrc:138036785 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036785 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:1579984795 cname:87eXz3QiQBBvJFID\r
a=ssrc:1579984795 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036785 1579984795\r
a=ssrc:138036786 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036786 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:138036787 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036787 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036786 138036787\r
`;

  static readonly LOCAL_OFFER_WITH_AUDIO_VIDEO_FAULTY_M_LINE: string = `v=0\r
o=- 8360888182273689563 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=video 9 UDP/TLS/RTP/SAVPF\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:video\r
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:13 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:3 urn:3gpp:video-orientation\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:8 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:9 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r
a=sendrecv\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 profile-id=0\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:100 VP9/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=fmtp:100 profile-id=2\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:124 red/90000\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124\r
a=rtpmap:123 ulpfec/90000\r
a=ssrc:138036785 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036785 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:1579984795 cname:87eXz3QiQBBvJFID\r
a=ssrc:1579984795 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036785 1579984795\r
a=ssrc:138036786 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036786 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:138036787 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036787 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036786 138036787\r
`;

  static readonly LOCAL_OFFER_WITH_AUDIO_VIDEO_FAULTY_RTPMAP_LINE: string = `v=0\r
o=- 8360888182273689563 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 107 108 109 124 120 123\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:video\r
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:13 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:3 urn:3gpp:video-orientation\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:8 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:9 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r
a=sendrecv\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 profile-id=0\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:100 VP9/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=fmtp:100 profile-id=2\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:124 red/90000\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124\r
a=rtpmap:123 ulpfec/90000\r
a=ssrc:138036785 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036785 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:1579984795 cname:87eXz3QiQBBvJFID\r
a=ssrc:1579984795 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036785 1579984795\r
a=ssrc:138036786 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036786 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:138036787 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036787 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036786 138036787\r
`;

  static readonly LOCAL_OFFER_WITH_AUDIO_VIDEO_FAULTY_RTPMAP_LINE_CLOCKRATE: string = `v=0\r
o=- 8360888182273689563 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 107 108 109 124 120 123\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:video\r
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:13 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:3 urn:3gpp:video-orientation\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:8 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:9 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r
a=sendrecv\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 VP8\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 profile-id=0\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:100 VP9/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=fmtp:100 profile-id=2\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:124 red/90000\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124\r
a=rtpmap:123 ulpfec/90000\r
a=ssrc:138036785 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036785 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:1579984795 cname:87eXz3QiQBBvJFID\r
a=ssrc:1579984795 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036785 1579984795\r
a=ssrc:138036786 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036786 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:138036787 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036787 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036786 138036787\r
`;

  static readonly LOCAL_OFFER_WITH_AUDIO_VIDEO_H264_PREFERRED: string = `v=0\r
o=- 8360888182273689563 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=video 9 UDP/TLS/RTP/SAVPF 125 96 97 98 99 100 101 102 122 127 121 107 108 109 124 120 123\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:video\r
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:13 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:3 urn:3gpp:video-orientation\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:8 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:9 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r
a=sendrecv\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 VP8\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 profile-id=0\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:100 VP9/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=fmtp:100 profile-id=2\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:124 red/90000\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124\r
a=rtpmap:123 ulpfec/90000\r
a=ssrc:138036785 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036785 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:1579984795 cname:87eXz3QiQBBvJFID\r
a=ssrc:1579984795 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036785 1579984795\r
a=ssrc:138036786 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036786 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:138036787 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036787 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036786 138036787\r
`;

  static readonly LOCAL_OFFER_WITH_AUDIO_VIDEO_H264_PREFERRED_FAULTY_FMTP_LINE: string = `v=0\r
o=- 8360888182273689563 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
m=audio 58349 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.78.67.19\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:26124455 1 udp 2122260223 10.78.67.19 58349 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:1326275671 1 tcp 1518280447 10.78.67.19 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:audio\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=sendrecv\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3647729951 cname:87eXz3QiQBBvJFID\r
a=ssrc:3647729951 msid:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
a=ssrc:3647729951 mslabel:vF4Jw4SEKVInbC6ELS82CbkoHH28gJF3YwCI\r
a=ssrc:3647729951 label:eb624d61-a40b-41ff-a6a3-520452a0e8e1\r
m=video 9 UDP/TLS/RTP/SAVPF 125 96 97 98 99 100 101 102 122 127 121 107 108 109 124 120 123\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:XWdt\r
a=ice-pwd:fake\r
a=ice-options:trickle\r
a=fingerprint:sha-256 fake\r
a=setup:actpass\r
a=mid:video\r
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:13 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:3 urn:3gpp:video-orientation\r
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:8 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:9 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r
a=sendrecv\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 VP8\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 profile-id=0\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:100 VP9/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=fmtp:100 profile-id=2\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:124 red/90000\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124\r
a=rtpmap:123 ulpfec/90000\r
a=ssrc:138036785 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036785 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:1579984795 cname:87eXz3QiQBBvJFID\r
a=ssrc:1579984795 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036785 1579984795\r
a=ssrc:138036786 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036786 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc:138036787 cname:87eXz3QiQBBvJFID\r
a=ssrc:138036787 msid:j5DVeGxmzCUECATU1d9Ni641UdUJ86wVscmP ecf9934b-2914-4e1d-a2f8-8bbd1fb31b8c\r
a=ssrc-group:FID 138036786 138036787\r
`;

  static readonly LOCAL_OFFER_WITH_AUDIO_RED: string = `v=0\r
o=mozilla-chrome 9163902593268737648 2 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE 0 1\r
a=extmap-allow-mixed\r
a=msid-semantic: WMS cd932a75-0354-4253-ad7d-e36f2414733d\r
m=audio 53948 UDP/TLS/RTP/SAVPF 63 111 103 104 9 0 8 106 105 13 18 110 112 113 126\r
c=IN IP4 10.2.26.104\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:1715190694 1 udp 41885951 10.2.26.104 53948 typ relay raddr 0.0.0.0 rport 0 generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:Eb5p\r
a=ice-pwd:EKti2/uvy5Svg/jnL2IuHoKL\r
a=ice-options:trickle\r
a=fingerprint:sha-256 11:55:66:F1:92:6A:75:3E:8A:37:DE:DF:44:8D:EF:0F:E0:EB:E1:22:39:DD:67:18:C9:80:99:F3:D4:BB:4A:D2\r
a=setup:actpass\r
a=mid:0\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=sendrecv\r
a=msid:cd932a75-0354-4253-ad7d-e36f2414733d 8d0e41a3-f4d5-488d-8296-5960bd1d70a0\r
a=rtcp-mux\r
a=rtpmap:63 red/48000/2\r
a=fmtp:63 111/111\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:18 G729B/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:4012659083 cname:ZP28PpLAHaoSlS7P\r
a=ssrc:4012659083 msid:cd932a75-0354-4253-ad7d-e36f2414733d 8d0e41a3-f4d5-488d-8296-5960bd1d70a0\r
`;

  static readonly LOCAL_OFFER_WITH_AUDIO_RED_BUT_MISSING_RED_AND_OPUS_RTPMAP_ATTRIBUTES: string = `v=0\r
o=mozilla-chrome 9163902593268737648 2 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE 0 1\r
a=extmap-allow-mixed\r
a=msid-semantic: WMS cd932a75-0354-4253-ad7d-e36f2414733d\r
m=audio 53948 UDP/TLS/RTP/SAVPF 63 111 103 104 9 0 8 106 105 13 18 110 112 113 126\r
c=IN IP4 10.2.26.104\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:1715190694 1 udp 41885951 10.2.26.104 53948 typ relay raddr 0.0.0.0 rport 0 generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:Eb5p\r
a=ice-pwd:EKti2/uvy5Svg/jnL2IuHoKL\r
a=ice-options:trickle\r
a=fingerprint:sha-256 11:55:66:F1:92:6A:75:3E:8A:37:DE:DF:44:8D:EF:0F:E0:EB:E1:22:39:DD:67:18:C9:80:99:F3:D4:BB:4A:D2\r
a=setup:actpass\r
a=mid:0\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=sendrecv\r
a=msid:cd932a75-0354-4253-ad7d-e36f2414733d 8d0e41a3-f4d5-488d-8296-5960bd1d70a0\r
a=rtcp-mux\r
a=fmtp:63 111/111\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:103 ISAC/16000\r
a=rtpmap:104 ISAC/32000\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:106 CN/32000\r
a=rtpmap:105 CN/16000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:18 G729B/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:112 telephone-event/32000\r
a=rtpmap:113 telephone-event/16000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:4012659083 cname:ZP28PpLAHaoSlS7P\r
a=ssrc:4012659083 msid:cd932a75-0354-4253-ad7d-e36f2414733d 8d0e41a3-f4d5-488d-8296-5960bd1d70a0\r
`;

  static readonly LOCAL_OFFER_WITH_MULTIPLE_H264_PROFILES = `v=0\r
o=- 1672124140717632411 2 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE 0 1 2\r
a=extmap-allow-mixed\r
a=msid-semantic: WMS f3dac474-f5f8-48c0-b0f6-114cfdac587b\r
m=audio 9 UDP/TLS/RTP/SAVPF 111 63 9 0 8 13 110 126\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:jgnF\r
a=ice-pwd:7ja8PGQpp7m6PqqxUOeizxUg\r
a=ice-options:trickle\r
a=fingerprint:sha-256 6A:8B:43:7D:CA:39:72:5A:2D:51:95:19:A9:0A:82:31:A2:63:1A:3D:E8:54:1D:15:FE:A0:37:3C:2C:36:DA:18\r
a=setup:actpass\r
a=mid:0\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=sendrecv\r
a=msid:f3dac474-f5f8-48c0-b0f6-114cfdac587b 06d8d1c6-49b6-45c0-8cd0-33586b0349f7\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:63 red/48000/2\r
a=fmtp:63 111/111\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:3405851280 cname:MgBxgJN8OLIit3KO\r
a=ssrc:3405851280 msid:f3dac474-f5f8-48c0-b0f6-114cfdac587b 06d8d1c6-49b6-45c0-8cd0-33586b0349f7\r
m=video 9 UDP/TLS/RTP/SAVPF 96 97 102 103 104 105 106 107 108 109 127 125 39 40 45 46 98 99 100 101 112 113 116 117 118\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:jgnF\r
a=ice-pwd:7ja8PGQpp7m6PqqxUOeizxUg\r
a=ice-options:trickle\r
a=fingerprint:sha-256 6A:8B:43:7D:CA:39:72:5A:2D:51:95:19:A9:0A:82:31:A2:63:1A:3D:E8:54:1D:15:FE:A0:37:3C:2C:36:DA:18\r
a=setup:actpass\r
a=mid:1\r
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:13 urn:3gpp:video-orientation\r
a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r
a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=extmap:10 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id\r
a=extmap:11 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id\r
a=sendrecv\r
a=msid:f3dac474-f5f8-48c0-b0f6-114cfdac587b b52e6030-df95-4b6e-84e4-abdb12a6d489\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=rtpmap:103 rtx/90000\r
a=fmtp:103 apt=102\r
a=rtpmap:104 H264/90000\r
a=rtcp-fb:104 goog-remb\r
a=rtcp-fb:104 transport-cc\r
a=rtcp-fb:104 ccm fir\r
a=rtcp-fb:104 nack\r
a=rtcp-fb:104 nack pli\r
a=fmtp:104 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:105 rtx/90000\r
a=fmtp:105 apt=104\r
a=rtpmap:106 H264/90000\r
a=rtcp-fb:106 goog-remb\r
a=rtcp-fb:106 transport-cc\r
a=rtcp-fb:106 ccm fir\r
a=rtcp-fb:106 nack\r
a=rtcp-fb:106 nack pli\r
a=fmtp:106 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=106\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=4d001f\r
a=rtpmap:125 rtx/90000\r
a=fmtp:125 apt=127\r
a=rtpmap:39 H264/90000\r
a=rtcp-fb:39 goog-remb\r
a=rtcp-fb:39 transport-cc\r
a=rtcp-fb:39 ccm fir\r
a=rtcp-fb:39 nack\r
a=rtcp-fb:39 nack pli\r
a=fmtp:39 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=4d001f\r
a=rtpmap:40 rtx/90000\r
a=fmtp:40 apt=39\r
a=rtpmap:45 AV1/90000\r
a=rtcp-fb:45 goog-remb\r
a=rtcp-fb:45 transport-cc\r
a=rtcp-fb:45 ccm fir\r
a=rtcp-fb:45 nack\r
a=rtcp-fb:45 nack pli\r
a=rtpmap:46 rtx/90000\r
a=fmtp:46 apt=45\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 profile-id=0\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:100 VP9/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=fmtp:100 profile-id=2\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:112 H264/90000\r
a=rtcp-fb:112 goog-remb\r
a=rtcp-fb:112 transport-cc\r
a=rtcp-fb:112 ccm fir\r
a=rtcp-fb:112 nack\r
a=rtcp-fb:112 nack pli\r
a=fmtp:112 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=64001f\r
a=rtpmap:113 rtx/90000\r
a=fmtp:113 apt=112\r
a=rtpmap:116 red/90000\r
a=rtpmap:117 rtx/90000\r
a=fmtp:117 apt=116\r
a=rtpmap:118 ulpfec/90000\r
a=ssrc-group:FID 2748666460 3612566398\r
a=ssrc:2748666460 cname:MgBxgJN8OLIit3KO\r
a=ssrc:2748666460 msid:f3dac474-f5f8-48c0-b0f6-114cfdac587b b52e6030-df95-4b6e-84e4-abdb12a6d489\r
a=ssrc:3612566398 cname:MgBxgJN8OLIit3KO\r
a=ssrc:3612566398 msid:f3dac474-f5f8-48c0-b0f6-114cfdac587b b52e6030-df95-4b6e-84e4-abdb12a6d489\r
`;
}
