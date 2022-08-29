# Managing Video Codecs in Meetings

After raw video frames are captured (e.g. from a camera outputting an RGBA pixel matrix) they are *encoded* before being sent on the network to reduce their size. On the receiving end, they are *decoded* back to raw data before being displayed or recorded. The pattern is similar to compression and decompression patterns in, for example, `.zip` files, however in the realm of media, these *codecs* (a portmanteau of *encoder* and *decoder*) are heavily specialized to audio or video, and the choice of codec can dramatically effect end user experience and the features of your application.

The Amazon Chime SDK for Javascript supports setting a list of video codec preferences which will be used to select the encoder for an individual client. The API allows setting fallback codecs to, if desired, ensure that all participants in the call can receive video from senders as long as there is some intersection between the chosen codecs and the receive capabilities. This document will cover how to use the API, its effects, and some possible use cases for using it.

## Setting Video Send Codec Preferences

Application builders can use [`AudioVideoControllerFacade.setVideoCodecSendPreferences`](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideocontrollerfacade.html#setvideocodecsendpreferences) for control over video send codecs. The fallback behavior is indicated in the documentation and can be made clear with a few examples. Not calling this function is functionally equivalent to the following:
```
// Assumes a meeting session has already been created and stored in `this.meetingSession`

this.meetingSession.audioVideo.setVideoCodecSendPreferences([VideoCodecCapability.h264()]);
```

This implies the following:
* Ignoring other restrictions, the sending client will transmit video into the meeting using the H.264 video codec.
* The sending client *will not* fallback to any other codec if another attendee joins without an H.264 decoder (which may occur on some browsers, see notes below). That receiving attendee will not receive this video.
* If the sending client does not support encoding H.264, then it will fall back to any video codec that the browser supports (even though it wasn't set via `setVideoCodecSendPreferences`), that is also supported by the meeting (currently this meeting level configuration is not exposed). As meetings at this time support only H.264 CBP and VP8, that means the client would fall back to VP8.

For more complex fallback behavior, consider the following example:
```
this.meetingSession.audioVideo.setVideoCodecSendPreferences([VideoCodecCapability.h264(), VideoCodecCapability.vp8()]);
```

This implies the following:
* Ignoring other restrictions, the sending client will transmit video into the meeting using the H.264 video codec.
* The sending client *will* fallback to VP8 other codec if another attendee joins with H.264 decode support, but does have VP8 decode support.
* If the sending client does not support encoding H.264, then it will fall back to VP8 (not technically a change in behavior, but will be more relevant when accounting for additional codecs).

A similar API [`ContentShareControllerFacade.setContentShareVideoCodecPreferences`](https://aws.github.io/amazon-chime-sdk-js/interfaces/contentsharecontrollerfacade.html#setcontentsharevideocodecpreferences) exists to control content share video send codecs and it is used in identical fashion, e.g.:
```
this.meetingSession.audioVideo.setContentShareVideoCodecPreferences([VideoCodecCapability.h264(), VideoCodecCapability.vp8()]);
```

## Considerations for Adjusting Video Send Codec Defaults

The default behavior in the Amazon Chime SDK client libraries noted above is chosen to minimize CPU and maintain backwards compatible behavior. However, depending on your applications use case, you may wish to adjust from the defaults to best fit your end-users. This section will cover various impacts of that choice which should be considered.

#### Hardware vs. Software Codecs

Video codecs can be implemented one of two ways:
* Software codecs are written in user space code and ran on CPU, incurring higher CPU and battery usage, but generally being more stable. Usage of software codecs is often limited due to licensing, depending on the codec used.
* Hardware codecs are ran on specialized physical components (i.e. *not* on CPU), which generally limit CPU requirements and battery usage. Often the licensing of codecs is offloaded to the device manufacture.

Note that while a *codec* refers to both encoding and decoding, the implementation doesn't need to be coupled. For example a client may encode using a software encoder, but decode using a hardware encoder. Similarily there are various implementations, both software and hardware, for any given codec. The codec specification ensures that these implementations are interoperable.

### Browser/Device Support
Not all browsers support all codecs. In particular H.264 support is often dependent on the existance of hardware support. Given that VP8 and H.264 are generally widely available, we can instead call out a few use cases where H.264 is not supported:
* Some older Android devices do not have hardware H.264 codecs and therefore will not be able to encode or decode H.264.
* Some custom or old Chrome builds may not have H.264 enabled.

If your application encounters significant end-user issues with not being able to receive H.264 (which will currently be replaced by a static VP8 video stream with an error message), you may want to consider calling [`setVideoCodecSendPreferences`](https://aws.github.io/amazon-chime-sdk-js/interfaces/audiovideocontrollerfacade.html#setvideocodecsendpreferences) with either VP8 only or VP8 as a fallback.

#### Avoiding Browser/Device Specific Bugs
Occasionally, Browser or OS updates (particularily on mobile) may bring along bugs and issues related to specific codecs (particularily when hardware is in use). In this case, you may not want to wait on JS SDK versions to manually change the default send codec. For example, if you detect that iOS clients are sending significantly lower bitrates then expected, it may be due to a recent release impacting hardware encoders. For example, builders can temporarily use only VP8 for iOS Safari clients:

```
if (new DefaultBrowserBehavior().isIOSSafari()) {
  this.meetingSession.audioVideo.setVideoCodecSendPreferences([VideoCodecCapability.vp8()]);
}
```

If you suspect issues with a given codec/device/browser combination, please cut a Github issue so Amazon Chime SDK developers can investigate and provide guidance.

### Battery/CPU Usage
As mentioned above, hardware codecs generally require less CPU and battery load. Therefore application builders should acknoledge that there will be, for example, marginally worse battery life for clients which they switch to send VP8, which is usually using software implementations. This effects the receive side as well, a switch to VP8 is more impactful to applications which receive and display a significant amount of remote videos.

### Bandwidth Usage & General Performance

VP8 and H.264 perform similarily from an end-user experience in terms of video quality for a given bitrate. Therefore ignoring browser/device specific bugs, video quality should not likely be a factor in the choice to pick a specific video codec to send.
