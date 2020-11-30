// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default class ChromeSDPMock {
  static readonly PLAN_B_AUDIO_ONLY_WITHOUT_CANDIDATES = `
v=0\r
o=- 686306289960731622 2 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio\r
a=msid-semantic: WMS 94e1e64f-0b5b-4b2d-9bfb-33cdb844ab1d\r
m=audio 9 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:-\r
a=ice-pwd:-\r
a=ice-options:trickle\r
a=fingerprint:sha-256 -\r
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
a=ssrc:1021397692 cname:5tvQ2X6iPzLp1X8s\r
a=ssrc:1021397692 msid:94e1e64f-0b5b-4b2d-9bfb-33cdb844ab1d e217e1f0-b19f-4b11-a0db-4d4e06712c02\r
a=ssrc:1021397692 mslabel:94e1e64f-0b5b-4b2d-9bfb-33cdb844ab1d\r
a=ssrc:1021397692 label:e217e1f0-b19f-4b11-a0db-4d4e06712c02\r
`;

  static readonly PLAN_B_AUDIO_SENDRECV_VIDEO_RECVONLY = `
v=0\r
o=- 5968517292719560421 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS b9cf6dee-1f58-4ce7-9be7-70da48e79cf9\r
m=audio 40442 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 10.1.31.230\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:2150896833 1 udp 41820159 1.1.1.1 40442 typ relay raddr 0.0.0.0 rport 0 generation 0 network-id 1 network-cost 1\r
a=ice-ufrag:-\r
a=ice-pwd:-\r
a=ice-options:trickle\r
a=fingerprint:sha-256 -\r
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
a=ssrc:653261681 cname:g/sNFqmMf4ssBEGx\r
a=ssrc:653261681 msid:b9cf6dee-1f58-4ce7-9be7-70da48e79cf9 25de26f6-9084-4524-aa84-3fa79ad0fe6a\r
a=ssrc:653261681 mslabel:b9cf6dee-1f58-4ce7-9be7-70da48e79cf9\r
a=ssrc:653261681 label:25de26f6-9084-4524-aa84-3fa79ad0fe6a\r
m=video 12960 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123 119 114 115 116\r
c=IN IP4 1.1.1.1\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:2150896833 1 udp 41820159 1.1.1.1 12960 typ relay raddr 0.0.0.0 rport 0 generation 0 network-id 1 network-cost 1\r
a=ice-ufrag:-\r
a=ice-pwd:-\r
a=ice-options:trickle\r
a=fingerprint:sha-256 73:3A:F7:57:39:88:E9:6B:EB:11:0F:6B:4F:F2:AF:75:9E:21:C3:1B:43:44:75:34:CA:67:EA:3B:45:95:34:64\r
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

  static readonly PLAN_B_AUDIO_SENDRECV_VIDEO_SENDRECV = `
v=0\r
o=- 7345059195707651833 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS TOmAOsNrKxIfFaR9JWPXBonS54OctNYmMnNQ tTx7YfISFm940QbBpbvZqA9A4NGu4pIUJFJC\r
m=audio 52356 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 192.168.88.142\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:1806732060 1 udp 2122260223 192.168.88.142 52356 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:624130028 1 tcp 1518280447 192.168.88.142 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:-\r
a=ice-pwd:-\r
a=ice-options:trickle\r
a=fingerprint:sha-256 -\r
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
a=ssrc:3425585450 cname:D+kwzluzo0WmVUa2\r
a=ssrc:3425585450 msid:TOmAOsNrKxIfFaR9JWPXBonS54OctNYmMnNQ fe0326d3-6518-4bfc-be76-3989c80b5e29\r
a=ssrc:3425585450 mslabel:TOmAOsNrKxIfFaR9JWPXBonS54OctNYmMnNQ\r
a=ssrc:3425585450 label:fe0326d3-6518-4bfc-be76-3989c80b5e29\r
m=video 57559 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123 119 114 115 116\r
c=IN IP4 192.168.88.142\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:1806732060 1 udp 2122260223 192.168.88.142 57559 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:624130028 1 tcp 1518280447 192.168.88.142 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:-\r
a=ice-pwd:-\r
a=ice-options:trickle\r
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
a=ssrc-group:FID 515437170 2659142211\r
a=ssrc:515437170 cname:D+kwzluzo0WmVUa2\r
a=ssrc:515437170 msid:tTx7YfISFm940QbBpbvZqA9A4NGu4pIUJFJC 6393b586-e81a-4b9a-9bfc-97c925a343d0\r
a=ssrc:515437170 mslabel:tTx7YfISFm940QbBpbvZqA9A4NGu4pIUJFJC\r
a=ssrc:515437170 label:6393b586-e81a-4b9a-9bfc-97c925a343d0\r
a=ssrc:2659142211 cname:D+kwzluzo0WmVUa2\r
a=ssrc:2659142211 msid:tTx7YfISFm940QbBpbvZqA9A4NGu4pIUJFJC 6393b586-e81a-4b9a-9bfc-97c925a343d0\r
a=ssrc:2659142211 mslabel:tTx7YfISFm940QbBpbvZqA9A4NGu4pIUJFJC\r
a=ssrc:2659142211 label:6393b586-e81a-4b9a-9bfc-97c925a343d0\r
`;

  static readonly PLAN_B_AUDIO_SENDRECV_VIDEO_SENDRECV_2 = `v=0\r
o=- 7345059195707651833 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE audio video\r
a=msid-semantic: WMS TOmAOsNrKxIfFaR9JWPXBonS54OctNYmMnNQ tTx7YfISFm940QbBpbvZqA9A4NGu4pIUJFJC\r
m=audio 52356 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r
c=IN IP4 192.168.88.142\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:1806732060 1 udp 2122260223 192.168.88.142 52356 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:624130028 1 tcp 1518280447 192.168.88.142 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:-\r
a=ice-pwd:-\r
a=ice-options:trickle\r
a=fingerprint:sha-256 -\r
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
a=ssrc:3425585450 cname:D+kwzluzo0WmVUa2\r
a=ssrc:3425585450 msid:TOmAOsNrKxIfFaR9JWPXBonS54OctNYmMnNQ fe0326d3-6518-4bfc-be76-3989c80b5e29\r
a=ssrc:3425585450 mslabel:TOmAOsNrKxIfFaR9JWPXBonS54OctNYmMnNQ\r
a=ssrc:3425585450 label:fe0326d3-6518-4bfc-be76-3989c80b5e29\r
m=video 57559 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123 119 114 115 116\r
c=IN IP4 192.168.88.142\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=candidate:1806732060 1 udp 2122260223 192.168.88.142 57559 typ host generation 0 network-id 1 network-cost 10\r
a=candidate:624130028 1 tcp 1518280447 192.168.88.142 9 typ host tcptype active generation 0 network-id 1 network-cost 10\r
a=ice-ufrag:-\r
a=ice-pwd:-\r
a=ice-options:trickle\r
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
a=ssrc-group:FID 315437171 2659142211\r
a=ssrc:315437171 cname:D+kwzluzo0WmVUa2\r
a=ssrc:315437171 msid:tTx7YfISFm940QbBpbvZqA9A4NGu4pIUJFJC 6393b586-e81a-4b9a-9bfc-97c925a343d0\r
a=ssrc:315437171 mslabel:tTx7YfISFm940QbBpbvZqA9A4NGu4pIUJFJC\r
a=ssrc:315437171 label:6393b586-e81a-4b9a-9bfc-97c925a343d0\r
a=ssrc:2659142211 cname:D+kwzluzo0WmVUa2\r
a=ssrc:2659142211 msid:tTx7YfISFm940QbBpbvZqA9A4NGu4pIUJFJC 6393b586-e81a-4b9a-9bfc-97c925a343d0\r
a=ssrc:2659142211 mslabel:tTx7YfISFm940QbBpbvZqA9A4NGu4pIUJFJC\r
a=ssrc:2659142211 label:6393b586-e81a-4b9a-9bfc-97c925a343d0\r
`;
}
