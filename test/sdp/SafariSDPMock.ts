// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default class SafariSDPMock {
  static readonly IOS_SAFARI_AUDIO_SENDRECV_VIDEO_INACTIVE = `
  v=0\r
  o=- 3789843322349027177 2 IN IP4 127.0.0.1\r
  s=-\r
  t=0 0\r
  a=group:BUNDLE 0 1 2\r
  a=msid-semantic: WMS 137102f5-4628-4a17-9e21-6086db3433a8\r
  m=audio 9 UDP/TLS/RTP/SAVPF 111 103 9 102 0 8 105 13 110 113 126\r
  c=IN IP4 0.0.0.0
  a=rtcp:9 IN IP4 0.0.0.0\r
  a=ice-ufrag:-\r
  a=ice-pwd:-\r
  a=ice-options:trickle\r
  a=fingerprint:sha-256 -\r
  a=setup:actpass\r
  a=mid:0\r
  a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
  a=extmap:9 urn:ietf:params:rtp-hdrext:sdes:mid\r
  a=sendrecv\r
  a=msid:137102f5-4628-4a17-9e21-6086db3433a8 d742caa5-7055-4bff-98ca-c956d12f938d\r
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
  a=ssrc:3217976799 cname:rSy6SO9sS3kRP6k8\r
  a=ssrc:3217976799 msid:137102f5-4628-4a17-9e21-6086db3433a8 d742caa5-7055-4bff-98ca-c956d12f938d\r
  a=ssrc:3217976799 mslabel:137102f5-4628-4a17-9e21-6086db3433a8\r
  a=ssrc:3217976799 label:d742caa5-7055-4bff-98ca-c956d12f938d\r
  m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 127 125 104\r
  c=IN IP4 0.0.0.0
  a=rtcp:9 IN IP4 0.0.0.0\r
  a=ice-ufrag:-\r
  a=ice-pwd:-\r
  a=ice-options:trickle\r
  a=fingerprint:sha-256 -\r
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
  a=inactive\r
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
  `;

  static readonly IOS_SAFARI_AUDIO_SENDRECV_VIDEO_RECV = `
v=0\r
o=- 3789843322349027177 2 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE 0 1 2\r
a=msid-semantic: WMS 137102f5-4628-4a17-9e21-6086db3433a8\r
m=audio 9 UDP/TLS/RTP/SAVPF 111 103 9 102 0 8 105 13 110 113 126\r
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:-\r
a=ice-pwd:-\r
a=ice-options:trickle\r
a=fingerprint:sha-256 -\r
a=setup:actpass\r
a=mid:0\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:9 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=sendrecv\r
a=msid:137102f5-4628-4a17-9e21-6086db3433a8 d742caa5-7055-4bff-98ca-c956d12f938d\r
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
a=ssrc:3217976799 cname:rSy6SO9sS3kRP6k8\r
a=ssrc:3217976799 msid:137102f5-4628-4a17-9e21-6086db3433a8 d742caa5-7055-4bff-98ca-c956d12f938d\r
a=ssrc:3217976799 mslabel:137102f5-4628-4a17-9e21-6086db3433a8\r
a=ssrc:3217976799 label:d742caa5-7055-4bff-98ca-c956d12f938d\r
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 127 125 104\r
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:-\r
a=ice-pwd:-\r
a=ice-options:trickle\r
a=fingerprint:sha-256 -\r
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
a=inactive\r
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
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 127 125 104\r
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:-\r
a=ice-pwd:-\r
a=ice-options:trickle\r
a=fingerprint:sha-256 -\r
a=setup:actpass\r
a=mid:2\r
a=extmap:2 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:3 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:4 urn:3gpp:video-orientation\r
a=extmap:5 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:10 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:9 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=recvonly\r
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
`;

  static readonly SAFARI_AUDIO_VIDEO_SENDING = `v=0\r
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

  static readonly SAFARI_AUDIO_VIDEO_SENDING_RECEIVING = `v=0\r
o=- 2231580719842176600 3 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE 0 1 2\r
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
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 127 125 104\r
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:-\r
a=ice-pwd:-\r
a=ice-options:trickle\r
a=fingerprint:sha-256 -\r
a=setup:actpass\r
a=mid:2\r
a=extmap:2 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:3 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:4 urn:3gpp:video-orientation\r
a=extmap:5 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:10 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:9 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=recvonly\r
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
`;
}
