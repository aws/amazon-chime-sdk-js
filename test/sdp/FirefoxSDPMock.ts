// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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
}
