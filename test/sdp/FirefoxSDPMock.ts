// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default class FirefoxSDPMock {
  static readonly AUDIO_SENDRECV_VIDEO_INACTIVE = `
v=0\r
o=mozilla...THIS_IS_SDPARTA-68.0.2 3142329940950624223 0 IN IP4 0.0.0.0\r
s=-\r
t=0 0\r
a=sendrecv\r
a=fingerprint:sha-256 -\r
a=group:BUNDLE 0 1\r
a=ice-options:trickle\r
a=msid-semantic:WMS *\r
m=audio 54925 UDP/TLS/RTP/SAVPF 109 9 0 8 101\r
c=IN IP4 192.168.8.221\r
a=candidate:0 1 UDP 2122252543 192.168.8.221 54925 typ host\r
a=candidate:1 1 TCP 2105524479 192.168.8.221 9 typ host tcptype active\r
a=candidate:0 2 UDP 2122252542 192.168.8.221 56890 typ host\r
a=candidate:1 2 TCP 2105524478 192.168.8.221 9 typ host tcptype active\r
a=sendrecv\r
a=end-of-candidates\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2/recvonly urn:ietf:params:rtp-hdrext:csrc-audio-level\r
a=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=fmtp:109 maxplaybackrate=48000;stereo=1;useinbandfec=1\r
a=fmtp:101 0-15\r
a=ice-pwd:-\r
a=ice-ufrag:-\r
a=mid:0\r
a=msid:{a2258681-6ca4-d647-9c75-f557a26b3b43} {e05a971c-e6f1-6144-aec5-d8497872c66b}\r
a=rtcp:56890 IN IP4 192.168.8.221\r
a=rtcp-mux\r
a=rtpmap:109 opus/48000/2\r
a=rtpmap:9 G722/8000/1\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:101 telephone-event/8000\r
a=setup:actpass\r
a=ssrc:3313782734 cname:{bb441f3e-5b1d-1e46-bcd6-c775b103d026}\r
m=video 56362 UDP/TLS/RTP/SAVPF 120 121 126 97\r
c=IN IP4 192.168.8.221\r
a=candidate:0 1 UDP 2122252543 192.168.8.221 56362 typ host\r
a=candidate:1 1 TCP 2105524479 192.168.8.221 9 typ host tcptype active\r
a=candidate:0 2 UDP 2122252542 192.168.8.221 54325 typ host\r
a=candidate:1 2 TCP 2105524478 192.168.8.221 9 typ host tcptype active\r
a=inactive\r
a=end-of-candidates\r
a=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=extmap:4 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:5 urn:ietf:params:rtp-hdrext:toffset\r
a=fmtp:126 profile-level-id=42e01f;level-asymmetry-allowed=1;packetization-mode=1\r
a=fmtp:97 profile-level-id=42e01f;level-asymmetry-allowed=1\r
a=fmtp:120 max-fs=12288;max-fr=60\r
a=fmtp:121 max-fs=12288;max-fr=60\r
a=ice-pwd:-\r
a=ice-ufrag:-\r
a=mid:1\r
a=rtcp:54325 IN IP4 192.168.8.221\r
a=rtcp-fb:120 nack\r
a=rtcp-fb:120 nack pli\r
a=rtcp-fb:120 ccm fir\r
a=rtcp-fb:120 goog-remb\r
a=rtcp-fb:121 nack;;\r
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
a=ssrc:3068016493 cname:{bb441f3e-5b1d-1e46-bcd6-c775b103d026}\r
`;

  static readonly AUDIO_SENDRECV_VIDEO_SENDRECV = `
v=0\r
o=mozilla...THIS_IS_SDPARTA-68.0.2 3142329940950624223 1 IN IP4 0.0.0.0\r
s=-\r
t=0 0\r
a=sendrecv\r
a=fingerprint:sha-256 -\r
a=group:BUNDLE 0 1\r
a=ice-options:trickle\r
a=msid-semantic:WMS *\r
m=audio 54925 UDP/TLS/RTP/SAVPF 109 9 0 8 101\r
c=IN IP4 192.168.8.221\r
a=candidate:0 1 UDP 2122252543 192.168.8.221 54925 typ host\r
a=candidate:1 1 TCP 2105524479 192.168.8.221 9 typ host tcptype active\r
a=sendrecv\r
a=end-of-candidates\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2/recvonly urn:ietf:params:rtp-hdrext:csrc-audio-level\r
a=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=fmtp:109 maxplaybackrate=48000;stereo=1;useinbandfec=1\r
a=fmtp:101 0-15\r
a=ice-pwd:-\r
a=ice-ufrag:-\r
a=mid:0\r
a=msid:{a2258681-6ca4-d647-9c75-f557a26b3b43} {e05a971c-e6f1-6144-aec5-d8497872c66b}\r
a=rtcp-mux\r
a=rtpmap:109 opus/48000/2\r
a=rtpmap:9 G722/8000/1\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:101 telephone-event/8000\r
a=setup:actpass\r
a=ssrc:3313782734 cname:{bb441f3e-5b1d-1e46-bcd6-c775b103d026}\r
m=video 9 UDP/TLS/RTP/SAVPF 120 121 126 97\r
c=IN IP4 0.0.0.0\r
a=sendrecv\r
a=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=extmap:4 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:5 urn:ietf:params:rtp-hdrext:toffset\r
a=fmtp:126 profile-level-id=42e01f;level-asymmetry-allowed=1;packetization-mode=1\r
a=fmtp:97 profile-level-id=42e01f;level-asymmetry-allowed=1\r
a=fmtp:120 max-fs=12288;max-fr=60\r
a=fmtp:121 max-fs=12288;max-fr=60\r
a=ice-pwd:-\r
a=ice-ufrag:-\r
a=mid:1\r
a=msid:{a2258681-6ca4-d647-9c75-f557a26b3b43} {acdaaea2-e00a-584d-b89f-02ed986525a8}\r
a=rtcp-fb:120 nack\r
a=rtcp-fb:120 nack pli\r
a=rtcp-fb:120 ccm fir\r
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
a=ssrc:3068016493 cname:{bb441f3e-5b1d-1e46-bcd6-c775b103d026}\r
`;

  static readonly FIREFOX_REMOTE_ANSWER_WITH_VP8_H264_UNSORTED = `v=0\r
o=- 0 0 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE 0 1 2\r
a=msid-semantic: WMS *\r
m=audio 17179 UDP/TLS/RTP/SAVPF 109\r
c=IN IP4 10.1.1.1\r
a=rtcp:17179 IN IP4 10.1.1.1\r
a=candidate:Ha02565e 1 udp 1694498815 10.2.0.1 17179 typ host generation 0\r
a=candidate:Ha02565e 2 udp 1694498815 10.2.0.1 17179 typ host generation 0\r
a=ice-ufrag:redact\r
a=ice-pwd:redact\r
a=fingerprint:sha-256 redact\r
a=setup:passive\r
a=mid:0\r
a=sendrecv\r
a=msid:audio audio\r
a=rtcp-mux\r
a=rtpmap:109 opus/48000/2\r
a=fmtp:109 minptime=10;useinbandfec=1\r
a=ssrc:1351822957 cname:wWMS8+dHNuVllwzN\r
m=video 9 UDP/TLS/RTP/SAVPF 126
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:redact\r
a=ice-pwd: redact\r
a=fingerprint:sha-256 redact\r
a=setup:passive\r
a=mid:1\r
a=extmap:4 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:5 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=inactive\r
a=rtcp-mux\r
a=rtpmap:126 H264/90000\r
a=rtcp-fb:126 ccm fir\r
a=rtcp-fb:126 nack\r
a=rtcp-fb:126 goog-remb\r
a=rtcp-fb:126 nack pli\r
a=fmtp:126 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
m=video 9 UDP/TLS/RTP/SAVPF 120 126\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:redact\r
a=ice-pwd:redacr\r
a=fingerprint:sha-256 redact\r
a=setup:passive\r
a=mid:2\r
a=extmap:4 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:5 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=sendonly\r
a=msid:v_2 WsVWY1Vb\r
a=rtcp-mux\r
a=rtpmap:120 VP8/90000\r
a=rtpmap:126 H264/90000\r
a=rtcp-fb:126 ccm fir\r
a=rtcp-fb:126 nack\r
a=rtcp-fb:126 goog-remb\r
a=rtcp-fb:126 nack pli\r
a=fmtp:126 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=ssrc:3539293854 cname:wWMS8+dHNuVllwzN\r
`;

  static readonly FIREFOX_REMOTE_ANSWER_WITH_VP8_ONLY = `v=0\r
o=- 0 0 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE 0 1 2\r
a=msid-semantic: WMS *\r
m=audio 17179 UDP/TLS/RTP/SAVPF 109\r
c=IN IP4 10.1.1.1\r
a=rtcp:17179 IN IP4 10.1.1.1\r
a=candidate:Ha02565e 1 udp 1694498815 10.2.0.1 17179 typ host generation 0\r
a=candidate:Ha02565e 2 udp 1694498815 10.2.0.1 17179 typ host generation 0\r
a=ice-ufrag:redact\r
a=ice-pwd:redact\r
a=fingerprint:sha-256 redact\r
a=setup:passive\r
a=mid:0\r
a=sendrecv\r
a=msid:audio audio\r
a=rtcp-mux\r
a=rtpmap:109 opus/48000/2\r
a=fmtp:109 minptime=10;useinbandfec=1\r
a=ssrc:1351822957 cname:wWMS8+dHNuVllwzN\r
m=video 9 UDP/TLS/RTP/SAVPF 126\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:redact\r
a=ice-pwd: redact\r
a=fingerprint:sha-256 redact\r
a=setup:passive\r
a=mid:1\r
a=extmap:4 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:5 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=inactive\r
a=rtcp-mux\r
a=rtpmap:126 H264/90000\r
a=rtcp-fb:126 ccm fir\r
a=rtcp-fb:126 nack\r
a=rtcp-fb:126 goog-remb\r
a=rtcp-fb:126 nack pli\r
a=fmtp:126 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
m=video 9 UDP/TLS/RTP/SAVPF 120\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:redact\r
a=ice-pwd:redacr\r
a=fingerprint:sha-256 redact\r
a=setup:passive\r
a=mid:2\r
a=extmap:4 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:5 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=sendonly\r
a=msid:v_2 WsVWY1Vb\r
a=rtcp-mux\r
a=rtpmap:120 VP8/90000\r
a=ssrc:3539293854 cname:wWMS8+dHNuVllwzN\r
`;

  static readonly FIREFOX_REMOTE_ANSWER_WITH_VP8_H264_SORTED = `v=0\r
o=- 0 0 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE 0 1 2\r
a=msid-semantic: WMS *\r
m=audio 17179 UDP/TLS/RTP/SAVPF 109\r
c=IN IP4 10.1.1.1\r
a=rtcp:17179 IN IP4 10.1.1.1\r
a=candidate:Ha02565e 1 udp 1694498815 10.2.0.1 17179 typ host generation 0\r
a=candidate:Ha02565e 2 udp 1694498815 10.2.0.1 17179 typ host generation 0\r
a=ice-ufrag:redact\r
a=ice-pwd:redact\r
a=fingerprint:sha-256 redact\r
a=setup:passive\r
a=mid:0\r
a=sendrecv\r
a=msid:audio audio\r
a=rtcp-mux\r
a=rtpmap:109 opus/48000/2\r
a=fmtp:109 minptime=10;useinbandfec=1\r
a=ssrc:1351822957 cname:wWMS8+dHNuVllwzN\r
m=video 9 UDP/TLS/RTP/SAVPF 126\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:redact\r
a=ice-pwd: redact\r
a=fingerprint:sha-256 redact\r
a=setup:passive\r
a=mid:1\r
a=extmap:4 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:5 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=inactive\r
a=rtcp-mux\r
a=rtpmap:126 H264/90000\r
a=rtcp-fb:126 ccm fir\r
a=rtcp-fb:126 nack\r
a=rtcp-fb:126 goog-remb\r
a=rtcp-fb:126 nack pli\r
a=fmtp:126 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
m=video 9 UDP/TLS/RTP/SAVPF 126 120\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:redact\r
a=ice-pwd:redacr\r
a=fingerprint:sha-256 redact\r
a=setup:passive\r
a=mid:2\r
a=extmap:4 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:5 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=sendonly\r
a=msid:v_2 WsVWY1Vb\r
a=rtcp-mux\r
a=rtpmap:120 VP8/90000\r
a=rtpmap:126 H264/90000\r
a=rtcp-fb:126 ccm fir\r
a=rtcp-fb:126 nack\r
a=rtcp-fb:126 goog-remb\r
a=rtcp-fb:126 nack pli\r
a=fmtp:126 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=ssrc:3539293854 cname:wWMS8+dHNuVllwzN\r
`;

  static readonly FIREFOX_NIGHTLY_79_REMOTE_ANSWER = `v=0\r
o=mozilla...THIS_IS_SDPARTA-79.0a1 6526644233327985811 0 IN IP4 0.0.0.0\r
s=-\r
t=0 0\r
a=fingerprint:sha-256 redact\r
a=group:BUNDLE 0 1\r
a=ice-options:trickle\r
a=msid-semantic:WMS *\r
m=audio 9 UDP/TLS/RTP/SAVPF 109 9 0 8 101\r
c=IN IP4 0.0.0.0\r
a=recvonly\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=fmtp:109 maxplaybackrate=48000;stereo=1;useinbandfec=1\r
a=fmtp:101 0-15\r
a=ice-pwd:redact\r
a=ice-ufrag:redact\r
a=mid:0\r
a=rtcp-mux\r
a=rtpmap:109 opus/48000/2\r
a=rtpmap:9 G722/8000/1\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000
a=rtpmap:101 telephone-event/8000/1\r
a=setup:active\r
a=ssrc:164410570 cname:{5580f368-d011-994a-adc0-f22684b6b5db}\r
m=video 9 UDP/TLS/RTP/SAVPF 120 124 121 125 126 127 97 98\r
c=IN IP4 0.0.0.0\r
a=recvonly\r
a=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=extmap:4 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:5 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:7 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=fmtp:126 profile-level-id=42e01f;level-asymmetry-allowed=1;packetization-mode=1\r
a=fmtp:97 profile-level-id=42e01f;level-asymmetry-allowed=1\r
a=fmtp:120 max-fs=12288;max-fr=60\r
a=fmtp:124 apt=120\r
a=fmtp:121 max-fs=12288;max-fr=60\r
a=fmtp:125 apt=121\r
a=fmtp:127 apt=126\r
a=fmtp:98 apt=97\r
a=ice-pwd:redact\r
a=ice-ufrag:bd872585\r
a=mid:1\r
a=rtcp-fb:120 nack\r
a=rtcp-fb:120 nack pli\r
a=rtcp-fb:120 ccm fir\r
a=rtcp-fb:120 goog-remb\r
a=rtcp-fb:120 transport-cc\r
a=rtcp-fb:121 nack\r
a=rtcp-fb:121 nack pli\r
a=rtcp-fb:121 ccm fir\r
a=rtcp-fb:121 goog-remb\r
a=rtcp-fb:121 transport-cc\r
a=rtcp-fb:126 nack\r
a=rtcp-fb:126 nack pli\r
a=rtcp-fb:126 ccm fir\r
a=rtcp-fb:126 goog-remb\r
a=rtcp-fb:126 transport-cc\r
a=rtcp-fb:97 nack\r
a=rtcp-fb:97 nack pli\r
a=rtcp-fb:97 ccm fir\r
a=rtcp-fb:97 goog-remb\r
a=rtcp-fb:97 transport-cc\r
a=rtcp-mux\r
a=rtpmap:120 VP8/90000\r
a=rtpmap:124 rtx/90000\r
a=rtpmap:121 VP9/90000\r
a=rtpmap:125 rtx/90000\r
a=rtpmap:126 H264/90000\r
a=rtpmap:127 rtx/90000\r
a=rtpmap:97 H264/90000\r
a=rtpmap:98 rtx/90000\r
a=setup:active\r
a=ssrc:685970712 cname:{5580f368-d011-994a-adc0-f22684b6b5db}\r
a=ssrc:3236966325 cname:{5580f368-d011-994a-adc0-f22684b6b5db}\r
a=ssrc-group:FID 685970712 3236966325\r
`;

  static readonly FIREFOX_NIGHTLY_79_REMOTE_ANSWER_H264_PREFERRED = `v=0\r
o=mozilla...THIS_IS_SDPARTA-79.0a1 6526644233327985811 0 IN IP4 0.0.0.0\r
s=-\r
t=0 0\r
a=fingerprint:sha-256 redact\r
a=group:BUNDLE 0 1\r
a=ice-options:trickle\r
a=msid-semantic:WMS *\r
m=audio 9 UDP/TLS/RTP/SAVPF 109 9 0 8 101\r
c=IN IP4 0.0.0.0\r
a=recvonly\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=fmtp:109 maxplaybackrate=48000;stereo=1;useinbandfec=1\r
a=fmtp:101 0-15\r
a=ice-pwd:redact\r
a=ice-ufrag:redact\r
a=mid:0\r
a=rtcp-mux\r
a=rtpmap:109 opus/48000/2\r
a=rtpmap:9 G722/8000/1\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000
a=rtpmap:101 telephone-event/8000/1\r
a=setup:active\r
a=ssrc:164410570 cname:{5580f368-d011-994a-adc0-f22684b6b5db}\r
m=video 9 UDP/TLS/RTP/SAVPF 97 124 121 125 126 127 120 98\r
c=IN IP4 0.0.0.0\r
a=recvonly\r
a=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=extmap:4 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:5 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:7 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=fmtp:126 profile-level-id=42e01f;level-asymmetry-allowed=1;packetization-mode=1\r
a=fmtp:97 profile-level-id=42e01f;level-asymmetry-allowed=1\r
a=fmtp:120 max-fs=12288;max-fr=60\r
a=fmtp:124 apt=120\r
a=fmtp:121 max-fs=12288;max-fr=60\r
a=fmtp:125 apt=121\r
a=fmtp:127 apt=126\r
a=fmtp:98 apt=97\r
a=ice-pwd:redact\r
a=ice-ufrag:bd872585\r
a=mid:1\r
a=rtcp-fb:120 nack\r
a=rtcp-fb:120 nack pli\r
a=rtcp-fb:120 ccm fir\r
a=rtcp-fb:120 goog-remb\r
a=rtcp-fb:120 transport-cc\r
a=rtcp-fb:121 nack\r
a=rtcp-fb:121 nack pli\r
a=rtcp-fb:121 ccm fir\r
a=rtcp-fb:121 goog-remb\r
a=rtcp-fb:121 transport-cc\r
a=rtcp-fb:126 nack\r
a=rtcp-fb:126 nack pli\r
a=rtcp-fb:126 ccm fir\r
a=rtcp-fb:126 goog-remb\r
a=rtcp-fb:126 transport-cc\r
a=rtcp-fb:97 nack\r
a=rtcp-fb:97 nack pli\r
a=rtcp-fb:97 ccm fir\r
a=rtcp-fb:97 goog-remb\r
a=rtcp-fb:97 transport-cc\r
a=rtcp-mux\r
a=rtpmap:120 VP8/90000\r
a=rtpmap:124 rtx/90000\r
a=rtpmap:121 VP9/90000\r
a=rtpmap:125 rtx/90000\r
a=rtpmap:126 H264/90000\r
a=rtpmap:127 rtx/90000\r
a=rtpmap:97 H264/90000\r
a=rtpmap:98 rtx/90000\r
a=setup:active\r
a=ssrc:685970712 cname:{5580f368-d011-994a-adc0-f22684b6b5db}\r
a=ssrc:3236966325 cname:{5580f368-d011-994a-adc0-f22684b6b5db}\r
a=ssrc-group:FID 685970712 3236966325\r
`;
}
