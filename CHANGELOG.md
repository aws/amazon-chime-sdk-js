# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.23.0] - 2024-05-14

### Added

### Removed

### Changed

### Fixed

- Fixed rare race conditions with simulcast + server side network adaptation on third attendee join.

## [3.22.0] - 2024-03-15

### Added

- Added `groupId` to `VideoTileState` for mapping metrics other then those from `getObservableVideoMetrics` when using server side network adaptation.
- Added support for Node version 22

### Removed

### Changed

- Avoid subscribes when simulcast is enabled but not currently sending, or when using server side network adaptation.

### Fixed

- Fixed reconnections not triggering `audioVideoWasDemotedFromPrimaryMeeting`.

## [3.21.1] - 2024-03-28

### Added

### Removed

### Changed

### Fixed

- Fixed packets received check on Safari 17.3 and below

## [3.21.0] - 2024-02-12

### Added

- Add automatic codec degradation logic when CPU usage of software encoder is high or video encoding of encoder fails.

### Removed

### Changed

- Simplified simulcast uplink policy to not unnecesarily try to compensate for uplink bandwidth estimation.
- Avoid unnecessary transceiver creation by using no-video policy for content share.

### Fixed

- Fixed unnecessary cropping on some camera capturers when simulcast was enabled.

## [3.20.0] - 2023-12-12

### Added

- Add support for node 20 and drop support for node < 18.
- Add support for H.264 profiles besides Constrained Baseline Profile.
- Fix MeetingReadinessChecker demo by checking for audio `kind`

### Removed

### Changed

### Fixed

- Fix reconnections when setting audio Attendee Capability to 'None' or 'Send' mid call. The connection health monitor will now look at all packets received on all candidate pairs instead of just audio received media packets.
- Setup passthrough streams for insertable streams case in the redundant audio worker so that passthrough streams do not get blocked on the main thread.
- Disable redundant audio for Chrome 106 and earlier to fix video decoder failure on old Chrome versions with redundant audio turned on.

## [3.19.0] - 2023-09-20

### Added
- Add support for high-definition WebRTC sessions with 1080p webcam video and 4K screen share. Developers can choose video encoding bitrates up to 2.5Mbps, frame rates up to 30fps, and the codec, including new options VP9, AV1, and scalable video coding (SVC).
- Update AWS SDK version to 3.477.0

### Removed

### Changed
- Revert: Improve reconnection behavior on signaling disconnection mid call or during join/subscribe. This was leading to unexpected `AudioJoinedFromAnotherDevice` events in certain edge conditions. It will be re-released in a later version.

### Fixed
- Prevent video processing with filters from being throttled when an attendees meeting tab moves into the background.
- Do not allow redundant audio worker to enqueue any audio payloads larger than 1000 bytes to avoid permanently stopping the audio flow.
- Make uplink loss estimation more accurate so that redundant audio does not turn off prematurely.

## [3.18.2] - 2023-10-09

### Added

### Removed

### Changed

### Fixed
- Save the redundant audio worker code during build time so that the worker code stays intact and is able to be loaded

## [3.18.1] - 2023-09-29

### Added

### Removed

### Changed

### Fixed
- Fixed bug that prevented sending and receiving audio, video, and content share when using Simulcast and Redundant Audio at the same time

## [3.18.0] - 2023-09-11

### Added
- Support sending and receiving redundant audio data to help reduce the effects of packet loss on audio quality. See README for more details.
- Send a few additional metrics to backend

### Removed

### Changed

### Fixed
- Fixed audio send failing for the rest of the meeting when writing frames larger than 1000 bytes in Chrome, which could be caused by sending redundant audio

## [3.17.0] - 2023-08-15

### Added

- Allow receiving notification messages from server and print messages received to console
- Add a new meeting event, `deviceLabelTriggerFailed`, for device label trigger failures. By default, the Chime SDK for JavaScript requests access to the microphone and camera in order to retrieve device labels. The SDK will send the `deviceLabelTriggerFailed` event when either the microphone, camera or both requests fail. (Before this PR, the SDK would emit `audioInputFailed` and `videoInputFailed` events simultaneously, which could lead to confusion.) If a custom function is supplied with `meetingSession.audioVideo.setDeviceLabelTrigger`, the SDK will send this event when the custom function is not successful.

### Removed
- Resolution constraint for content share

- Remove unused legacy TURN credentials path.

### Changed
- Improve reconnection behavior on signaling disconnection mid call or during join/subscribe

### Fixed

- Do not display a warning message when invoking `meetingSession.audioVideo.setVideoCodecSendPreferences` prior to the start of the session.

## [3.16.0] - 2023-06-26

### Added

### Removed

- Remove max video bandwidth in guide.

### Changed

- Added recommendations to use server side network adaptation, and clarified support on all browsers. Removed demo features and information on network adaptation configuration that is not used when server side network adaptation is used.
- Set `esModuleInterop` to `true` in tsconfig.json, and update several import statements.
- Update documentation reference to chime-sdk.
- Add RTC Speak/Mic Audio Level in proto file
- Add `audioUpstreamLevel`, `audioDownstreamLevel` to the `ClientMetricReport`

### Fixed

- Bump protobufjs from 6.11.3 to 7.2.4.
- Fixed usage of `this` in `VideoCodecCapability` constructors.
- Fixed a race condition error if calling `startContentShare` then `stopContentShare` right after.
- Invoke MediaStreamBrokerObservers in the next event loop tick to prevent race conditions with the browser's `RTCRtpSender.replaceTrack` API call.

## [3.15.0] - 2023-05-01

### Added

- Set max bitrate to 1500kbps.
- Add resolution constraint to content share (1080p@30fps).
- Added opt-in server side network adaption enablement flag `ServerSideNetworkAdaption.BandwidthProbingAndRemoteVideoQualityAdaption`. See [this section in the guide](https://aws.github.io/amazon-chime-sdk-js/modules/prioritybased_downlink_policy.html#server-side-network-adaption) for more details.
- Content share issue with above change

### Removed

### Changed

- Clarify quotas for content-sharing publishing and subscriptions in API Overview.
- Fallback `majorVersion()` to `-1` if `version` is `null` in `DefaultBrowserBehavior`.

### Fixed

## [3.14.1] - 2023-05-26

### Added

### Removed

### Changed

- Update chime sdk messaging client version.

### Fixed

## [3.14.0] - 2023-04-11

### Added

- Add new guide for `VideoFXProcessor`.
- Add Android Chrome support for `VideoFXProcessor`.

### Removed

### Changed

- Add fallback value for `DefaultBrowserBehavior.browser` when `detect()` can not parse browser UserAgent.

### Fixed

## [3.13.0] - 2023-03-28

### Added

- Send client utc offset with attendee JOIN frame over signalling channel.
- Add an unified interface (videofx processor) with new implementation for ML features, namely background blur 2.0 and background replacement 2.0. This includes improvement to the underlying model for better segmentation, better image processing algorithms to blur the background, and other miscellanies bug-fixes/features.

### Removed

### Changed

- Evaluate `SendingAudioFailureConnectionHealthPolicy` only after getting connected i.e. after `audioVideoDidStart()` is called. This avoids false positive triggers of `sendingAudioFailed` at the start of a meeting session.

### Fixed

## [3.12.0] - 2023-02-14

### Added

### Removed

### Changed

### Fixed

- Refactored various state cleanup to `AudioVideoControllerState.resetConnectionSpecificState`.
- Update `supportsCanvasCapturedStreamPlayback` in `DefaultBrowserBehavior` to fix background blur and replacement
  support check failures in iPad.

## [3.11.0] - 2023-01-03

### Added

- Added flag `disablePeriodicKeyframeRequestOnContentSender` to `MeetingSessionConfiguration` for applications that would like to experiment with disabling the 10 second keyframe request interval which is default on the backend.

### Removed

### Changed

- To support future use case of allowing users to join a meeting without the need for a microphone or empty audio stream, update `checkAudioConnectivity` logic inside `DefaultMeetingReadinessChecker` accordingly, to check for audio packets received metrics using `metricsDidReceive` observer in addition to attendee presence condition. Previously, the audio connectivity check used to implicitly test that audio was being sent out from the client and being received by the server. Now this check will include a test for attendee presence, showing that the signal connection has been established, and audio packets being received, showing that the data connection has been established.

### Fixed

- Fix ES2015 target builds by fixing voicefocus js file.
- Added missing state cleanup for various video components on reconnect to mitigate missing remote or local video.

## [3.10.0] - 2022-11-02

### Added

- Add `destroy()` method to `VoiceFocus` class.
- Add `destroyVoiceFocus` method to `VoiceFocusDeviceTransformer` class.
- Add guide to show how to use the `destroyVoiceFocus` method in the `VoiceFocusDeviceTransformer` class.

### Removed

### Changed

- Update documentation for `MeetingSessionStatusCode` to clarify the origin and meaning of each. Included information on use of `isTerminal` flag to determine if retry will be automatically attempted.

### Fixed

- Fix codec intersection logic to avoid unnecessary renegotiations.

## [3.9.0] - 2022-09-21

### Added

- Add the audio output gain and frequency to the meeting readiness checker's configuration. The readiness checker uses this value to set the "Play Tone" gain and frequency.
- Add support for background filter starting from iOS 16 for major browsers Safari, Chrome, and Firefox (except on iPad).

### Removed

### Changed

- Add metric derived from string metric in metric report.
- Send `audioInputFailed` and `videoInputFailed` if there is error getting device labels.
- Updated `DefaultVideoFrameProcessorPipeline` to clone audio tracks to the output `MediaStream` instead of dropping them. This allows more straightforward usage of the pipeline on content sharing like file playback.

### Fixed

- Fixed missing videos, or unnecessarily long freezes when switching simulcast streams.

## [3.8.0] - 2022-08-18

### Added

- Add encoder/decoder is in hardware metric and stream dimension to signaling protocol
- Report encode/decode time and if encoder/decoder is in hardware, and add encoder/decoder name as a metric dimension

### Removed

### Changed

- Fix a confusing function name from `millisecondsPerSecond` to `averageTimeSpentPerSecondInMilliseconds`.
- Move `requiresPlaybackLatencyHintForAudioContext` to `ExtendedBrowserBehavior`.

### Fixed

- `MessagingSession` reconnect loop did not break on error past reconnect deadline. Infinite reconnect loop was caused due to `firstConnectionAttemptTimestamp` not being set as `startedConnectionAttempt` was not invoked. Check <https://github.com/aws/amazon-chime-sdk-js/issues/2372> for details.
- `MessagingSession` `getMessagingSessionEndpoint` call is now backwards compatible with AWS JS SDK v2.
- Use a default "playback" `latencyHint` when creating the `AudioContext` on Windows. Also adds a `setDefaultLatencyHint` API to `DefaultDeviceController` to allow for overriding.
- Fix behavior of websocket disconnects before a session is connected. Session.start() promise shall fail in the scenario.
- Queue messages before a messaging session is established to avoid dropping them.

## [3.7.0] - 2022-07-05

### Added

- Add support in `MessagingSession` to allow websocket connection for messaging service to select sort by for Prefetch.
- Added two new meeting events: `sendingAudioFailed` to indicate a failure in sending audio packets out and `sendingAudioRecovered` to indicate recovery after a `sendingAudioFailed` event.
- Added a new `ConnectionHealthPolicy` named `SendingAudioFailureConnectionHealthPolicy` to evaluate and trigger the above events. Also, added `sendingAudioFailureSamplesToConsider` and `sendingAudioFailureInitialWaitTimeMs` to `ConnectionHealthPolicyConfiguration` fields for configuring the new health policy.
- Added a new field `consecutiveStatsWithNoAudioPacketsSent` in `ConnectionHealthData` for evaluating the `SendingAudioFailureConnectionHealthPolicy`.

### Removed

### Changed

- Update package.json to include Node 18.
- Refactored `connectionHealthDidChange()` in `MonitorTask` by creating a new `applyHealthPolicy()` method to reduce redundancy in the health policy evaluation.
- Modified `SignalingAndMetricsConnectionMonitor` to update `consecutiveStatsWithNoAudioPacketsSent`.
- Reset `connectionHealthData` on every connect (as opposed to doing it only when `signalingClient` is not initialized). This allows us to honor the cool-down time in both `SendingAudioFailureConnectionHealthPolicy` and `UnusableAudioWarningConnectionHealthPolicy` in case when the connection is failing due to an error like "no ice candidates were gathered".

### Fixed

- Fix `AbortError` when turning video ON in Safari.
- `MessagingSession` reconnects with refreshed endpoint and credentials if needed.  `EndpointUrl` on `MessagingSessionConfiguration` is deprecated as it is resolved by calling `getMessagingSessionEndpoint` internally.

## [3.6.0] - 2022-06-23

### Added

- Add a new API `enableSimulcastForContentShare` to enable simulcast for content share so that content share could be shown in network constrained clients. The lower quality layer has 300 kbps max bitrate, resolution scale factor of 2, and 5 max framerate.
- Add APIs `setVideoCodecSendPreferences` and `setContentShareVideoCodecPreferences` to allow configuration of codec being used to send. See the [JS SDK guide](https://aws.github.io/amazon-chime-sdk-js/modules/videocodecs.html) for more details.
- Added tracer logs to missing subscribe and unsubscribe methods.
- Added opt-in server side network adaption enablement flag `ServerSideNetworkAdaption.EnableBandwidthProbing`. See [this section in the guide](https://aws.github.io/amazon-chime-sdk-js/modules/prioritybased_downlink_policy.html#server-side-network-adaption) for more details.

### Removed

### Changed

### Fixed

- Fix issue closing a web worker in Amazon Voice Focus's inline worklet.

## [3.5.0] - 2022-06-02

### Added

- Add a workaround for <https://bugs.webkit.org/show_bug.cgi?id=241152> to play a paused video element in Safari.

### Removed

- Removed deprecated WebRTC constraints `googCpuOveruseDetection` and `googCombinedAudioVideoBwe` which were [being removed or were already no-ops](https://groups.google.com/g/discuss-webrtc/c/85e-f_siCws)

### Changed

- Bump `protobufjs` from 6.8.8 to 6.11.3.
- Update `DOMBlobMock` to accommodate `@types/node` changes.

### Fixed

- Fix issue where Amazon Voice Focus stops working after changing device while muted.
- Remove the `isChanged` flag as it breaks some old muting funtionality causing Amazon Voice Focus to stop working.
- Fix issue where Amazon Voice Focus could stop working after changing the mute state of a null device or changing the device shortly after.
- Fix an issue for mute local when there is no audio input.
- Fix trucation of video subscriptions not occuring if the resubscribe was driven by `MonitorTask`.
- Fix protobuf generation script for upgrade.
- Optional chain signaling client observer removal to fix [issue](https://github.com/aws/amazon-chime-sdk-js/issues/2265) if  `audioVideo.stop()` is called before `audioVideo.start()`.

## [3.4.0] - 2022-05-24

### Added

- Add the reserved status code AudioDisconnectAudio.
- Add support in `MessagingSession` to allow websocket connection for messaging service to enable Prefetch feature.

### Removed

### Changed

- Add reset function to uplink policy interface, and ignore indexes in nscale policy if the number of published videos did not change.

### Fixed

- Rate limited CPU warnings to at most once a minute in Voice Focus library, so that builder logs are not flooded.

## [3.3.0] - 2022-05-12

### Added

- Add support for hosting meetings in US GovCloud regions.
- Add support for starting live transcription in US GovCloud regions.

### Removed

### Changed

- Assume SDP section is sendrecv if no direction is present. This should have no impact on media negotiation.

### Fixed

- Replace `startVideoInput(null)` and `startAudioInput(null)` with`stopVideoInput` and `stopAudioInput` for video, audio test in meeting readiness checker to stop video, audio input.
- Replace the deprecated API `getRTCPeerConnectionStats` with `metricsDidReceive` in meeting readiness checker.
- Prevent `realtimeUnsubscribeFromVolumeIndicator` from causing a fatal error when there are no subscriptions for the `attendeeId`.
- Subscribe to `audioOutputDidChange` in audio mix controller to fix the issue where the audio output is not updated before meeting start.

## [3.2.0] - 2022-04-27

### Added

- Add browser support information to content share guide.
- Readd layers allocation negotiation in Chromium based browsers to avoid resubscribing to preemptively turn off simulcast streams or to switch layers. Avoid duplicate RTP header extension and changing extension id.

### Removed

### Changed

- Clean up the HTML video element bounded to `VideoTileState` using `unbindVideoElement` API to fix Safari memory leak. If you do not intend to clean the video element, call `unbindVideoElement` API with `cleanUpVideoElement` set to `false`. Check [PR#2217](https://github.com/aws/amazon-chime-sdk-js/pull/2217) for detailed information.

### Fixed

- Fix issue where video resolution and framerate changes when toggle video transform.

## [3.1.0] - 2022-04-07

### Added

- Add `audioUpstreamRoundTripTimeMs`, `audioUpstreamJitterMs`, and `audioDownstreamJitterMs` to `observableMetricSpec`.
- Add `videoUpstreamRoundTripTimeMs`, `videoUpstreamJitterMs`, and `videoDownstreamJitterMs`, and `videoDownstreamDelayMs` to `observableVideoMetricSpec`.

### Removed

- No longer stop video stream when calling `stopLocalVideoTile`. This was added as a workaround to prevent crash in old Safari versions but no longer needed.

### Changed

- Subscribe and unsubscribe to `MediaStreamBrokerObserver` in `AudioVideoController` at the end of every connection and disconnection to avoid trying to replace local audio and video during connection.
- Update `getMediaType` method to check the property `kind` instead of `mediaType` of a `RawMetricReport`.

### Fixed

- Fixed state not being reset if an `AudioVideoController` is reused after `stop`.

- Fix a bug that `remote-inbound-rtp` `RTCStatsReport` and `remote-outbound-rtp` `RTCStatsReport` of "video" `kind` are accidentally filtered.
- Fix the incorrect calculation of aggregation WebRTC metric spec (`audioSpeakerDelayMs`, `decoderLoss`).

## [3.0.0] - 2022-03-30

Amazon Chime SDK for JavaScript v3 is here !! 🎉🎉🎉

Amazon Chime SDK for JavaScript v3 includes major improvements for device management, WebRTC metrics, and the
messaging session.

- **Device management:** Decouple audio and video device management from the meeting sessions. For example, a user can select their preferred devices on a video preview page and continue using the same devices to join the session. After joining the session, a user can instantly switch devices without interrupting the ongoing meeting session.
- **WebRTC metrics:** Publish the standardized WebRTC metrics for all supported browsers.
- **Messaging session:** Add support for AWS SDK for JavaScript v3 for messaging session.
- **Dropping support:** Deprecate Safari 12 support and Plan B in Session Description Protocol (SDP) negotiations.

Below is a list of all changes in the Chime SDK for JavaScript v3. Please refer to the [Migraton guide from v2 to v3](https://aws.github.io/amazon-chime-sdk-js/modules/migrationto_3_0.html) for
more information.

### Added

- Add `rtcStatsReport` property to `ClientMetricReport` to store raw [`RTCStatsReport`](https://developer.mozilla.org/en-US/docs/Web/API/RTCStatsReport) and expose it via `metricsDidReceive` event.

### Removed

- Remove support for Plan B as well as Safari (and iOS) 12+. The minimum Safari and iOS supported version is now 13.
- Remove [legacy (non-promise-based) `getStats` API](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/getStats#obsolete_syntax) call in `DefaultStatsCollector`. This API was previously used to obtain WebRTC metrics only for Chromium-based browsers. Now SDK obtains WebRTC metrics for all browsers via [standardized (promise-based) `getStats` API](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/getStats#syntax).
- Remove all deprecated meeting status code.
- Remove `videoSendHealthDidChange`, `videoSendBandwidthDidChange`, `videoNotReceivingEnoughData`, and `videoReceiveBandwidthDidChange`. Use `metricsDidReceive` to obtain metrics instead.
- Remove `estimatedDownlinkBandwidthLessThanRequired`.
- Remove synthesize video APIs such as SMTP.
- Removed SDP interface.
- Remove `StatsCollector` interface.
- Remove `ClientMetricReport` interface.

### Changed

- Rename `DefaultStatsCollector` to `StatsCollector`.
- Rename `DefaultClientMetricReport` to `ClientMetricReport`.
- Change `chooseAudioInputDevice` to explicit APIs `startAudioInput` and `stopAudioInput`. Application will need to
  call `stopVideoInput` at the end of the call to explicitly stop active audio stream.
- Change `chooseVideoInputDevice` to explicit APIs `startVideoInput` and `stopVideoInput`. Application will need to
  call `stopVideoInput` now to explicitly stop active video stream.
- Minor name change to `chooseAudioOutputDevice` to `chooseAudioOutput`.
- `startVideoPreviewForVideoInput` and `stopVideoPreviewForVideoInput` will no longer turn on and off video stream.
  This allows applications to join meeting without reselecting video again.
- Remove max bandwidth kbps parameter in `chooseVideoInputQuality` as it is not related to device. Applications can
  set video max bandwidth kbps from `audioVideo.setVideoMaxBandwidthKbps`.
- Extend the `DeviceController` interface to include `Destroyable`
- Rename `MeetingSessionPOSTLogger` to `POSTLogger`.
- Update `POSTLogger` to implement the `Logger` interface.
- Remove `MeetingSessionConfiguration` dependency from `MeetingSessionPOSTLogger`.
  Builders need to add `metadata` to `POSTLogger` if they want to include information such as `appName`, `meetingId` and so on with the HTTP POST request made by `POSTLogger` when sending logs to builder provided URL.
  Please check 3.0 migration guide for more information.
- Decoupled `EventController` from `AudioVideo` and `MeetingSession`.

### Fixed

- Fix a bug where joining without selecting any audio device failed when Web Audio is enabled.
- Fix a minor log info for video input ended event where we say resetting to null device when we just stop the video
  input.

## [3.0.0-beta.2] - 2022-03-09

### Added

- Added support for use of replicated meetings to extend meeting sizes to up to 10k view only participants with glareless promotion ability. See the Chime Developer Guide and the [JS SDK guide](https://aws.github.io/amazon-chime-sdk-js/modules/replicatedmeetings.html) for more details.

### Removed

- Remove `StatsCollector` interface.
- Remove `ClientMetricReport` interface.
- Remove `clientMetricReport` parameter from `StatsCollector.start()` API.
- Remove synthesize video APIs such as SMTP.

### Changed

- Rename `DefaultStatsCollector` to `StatsCollector`.
- Rename `DefaultClientMetricReport` to `ClientMetricReport`.
- Change `chooseAudioInputDevice` to explicit APIs `startAudioInput` and `stopAudioInput`. Application will need to
  call `stopVideoInput` at the end of the call to explicitly stop active audio stream.
- Change `chooseVideoInputDevice` to explicit APIs `startVideoInput` and `stopVideoInput`. Application will need to
  call `stopVideoInput` now to explicitly stop active video stream.
- Minor name change to `chooseAudioOutputDevice` to `chooseAudioOutput`.
- `startVideoPreviewForVideoInput` and `stopVideoPreviewForVideoInput` will no longer turn on and off video stream.
  This allows applications to join meeting without reselecting video again.
- Remove max bandwidth kbps parameter in `chooseVideoInputQuality` as it is not related to device. Applications can
  set video max bandwidth kbps from `audioVideo.setVideoMaxBandwidthKbps`.
- Rename `MeetingSessionPOSTLogger` to `POSTLogger`.
- Update `POSTLogger` to implement the `Logger` interface.
- Remove `MeetingSessionConfiguration` dependency from `MeetingSessionPOSTLogger`.
  Builders need to add `metadata` to `POSTLogger` if they want to include information such as `appName`, `meetingId` and so on with the HTTP POST request made by `POSTLogger` when sending logs to builder provided URL.
  Please check 3.0 migration guide for more information.

### Fixed

## [3.0.0-beta.1] - 2022-02-23

### Added

- Add compression support when sending and receiving sdp messages.
- Add automatic language identification support from Amazon Transcribe for live transcription APIs.
- Add `rtcStatsReport` property to `DefaultClientMetricReport` to store raw [`RTCStatsReport`](https://developer.mozilla.org/en-US/docs/Web/API/RTCStatsReport) and expose it via `metricsDidReceive` event.

### Removed

- Removed SDP interface.
- Remove [legacy (non-promise-based) `getStats` API](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/getStats#obsolete_syntax) call in `DefaultStatsCollector`. This API was previously used to obtain WebRTC metrics only for Chromium-based browsers. Now SDK obtains WebRTC metrics for all browsers via [standardized (promise-based) `getStats` API](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/getStats#syntax).
- Remove `browserBehavior` from the constructor of `DefaultStatsCollector`.

### Changed

- Change `resolveSpec` and `resolveOptions` in BackgroundBlurVideoFrameProcessor and BackgroundReplacementVideoFrameProcessor to clone parameter objects.

### Fixed

- Clone the video preference input in `chooseRemoteVideoSources` API in `VideoPriorityBasedPolicy` to avoid mutation that can cause video preferences to not be sorted and lead to wrong video subscription determination by the policy.
- Fix a screen share issue by resetting the sdp compression state during join requests.
- Fix a video orientation issue when Background Blur/Background Replacement is enabled.

## [3.0.0-beta.0] - 2022-02-08

### Added

### Removed

- Remove support for Plan B as well as Safari (and iOS) 12+. The minimum Safari and iOS supported version is now 13. Also clean up all plan-B code path.
- Remove all deprecated meeting status code.

### Changed

- Decoupled `EventController` from `AudioVideo` and `MeetingSession`.
- Add support for pre-release in Versioning.
- Removed upward BWE throttling logic in VideoPriorityBasedPolicyConfig, which was increasing recovery time more then intended, whereas its main focus was towards slowing downturns in BWE when the network is actually stable. We may come back to configuring the recovery delay another time.
- Add support for aws-sdk js v3 for messaging session.

### Fixed

- Fix a worker resource leak with `BackgroundBlurProcessor` and `BackgroundReplacementProcessor`.

## [2.27.0] - 2022-01-27

### Added

### Removed

### Changed

- Changed `VideoPriorityBasedPolicyConfig` to be dependent on bandwidth fluctuation so that `VideoPriorityBasedPolicy` will not drop/resume video instantly when network bandwidth changes. (#1921).
- Adjust the recovery behavior of `VideoPriorityBasedPolicy` to not get stuck at low estimates, not overeact to spurious packet loss when probing, and not let the time between probes raise to 60 seconds (reduced to maximum of 30 seconds).

### Fixed

- Fix the reconnecting issue (#1985) by skipping the "close" event if it does not arrive in two seconds.
- Add a workaround to avoid 480p resolution scale down when there are 5-8 videos for the default video uplink policy for Chromium browsers version 98 on Windows and use 360p instead.

## [2.26.0] - 2022-01-14

### Added

### Removed

### Changed

- Made `SimulcastUplinkObserver.encodingSimulcastLayersDidChange` (_not_ `AudioVideoObserver.encodingSimulcastLayersDidChange`) synchronous.

### Fixed

- Fixed delays in advertising simulcast stream switches due to asynchronous and out of order checks.
- Fixed Firefox video tiles containing stale frames from previous transceivers by not attempting to reuse inactive transceivers. This switches to using `RTCRtpTransceiver.stop` when possible and may fix other incorrect tile bugs.
- Fix the bug that the max bandwidth set by the chooseVideoInputQuality API is ignored when the Chime SDK retries the connection.
- Added additional pausing of `MonitorTask` and `ReceiveVideoStreamIndexTask` to avoid modifying mutable state mid-subscribe.
- Fix the bug that the max bandwidth is ignored if the chooseVideoInputQuality API is called before starting a meeting.
- Use optional chaining to prevent an error from undefined transceiverEncoding in FF.

## [2.25.0] - 2022-01-11

### Added

- Ability to choose remote video sources in `AllHighestVideoBandwidthPolicy`. see [guide](https://aws.github.io/amazon-chime-sdk-js/modules/videolayout.html#downlink-policy).
- Add `BackgroundReplacementVideoFrameProcessor` that will create a `VideoFrameProcessor` to apply a background image to an outgoing video stream.

### Removed

### Fixed

- Correct the minimum supported Firefox version to `75` to match the official [documentation](https://docs.aws.amazon.com/chime/latest/dg/meetings-sdk.html#mtg-browsers).

### Changed

- Enforced a video receive limit incase the number of videos shared in the meeting are greater than the limit. The current limit is 25, which can change in future.
- Clarified a comment in `DefaultSimulcastUplinkPolicy`.

## [2.24.0] - 2021-12-17

### Added

- Add `supportDownlinkBandwidthEstimation` API to check whether browsers support downlink bandwidth estimation which requires for priority based downlink policy to work.
- Add `keepLastFrameWhenPaused` in `DefaultVideoTile` as an option to keep last frame when pausing a video tile.
- Add error name for custom device controller error.
- Added pagination option to meeting demo when priority downlink policy is used.
- Add `ApplicationMetadata` to enable builders to send their application name or version to the Amazon Chime backend. This is an opt-in addition.
- Add a new `AudioProfile` called `fullbandMusicStereo` which can be passed into `setAudioProfile` to support sending and receiving stereo audio through main audio input and output. This can also be passed into `setContentAudioProfile` to support sending stereo audio as content.
- [Demo] Add new checkbox on join screen to select new `fullbandMusicStereo` audio profile.
- [Demo] Add new dropdown items in microphone dropdown menu to test sending stereo audio as main audio input.
- [Demo] Add new dropdown items in content share dropdown menu to test sending stereo audio as content.

### Removed

### Fixed

- Fixed updates to mutable state during subscribe leading to non-existant/frozen video streams.
- Fixed inconsistent default maxBitrate values in the NScaleVideoUplinkBandwithPolicy constructor leading to the default ideal max bitrate not being honored.

### Changed

- Clarified comment in `DefaultSimulcastUplinkPolicy`.

## [2.23.1] - 2021-12-17

### Fixed

- Temporararily removed munging of layers allocation extension to mitigate Chrome M97 change which led to `setLocalDescription` failures. This was not yet being negotiated by the remote end, so this will not have any impact on media quality.

## [2.23.0] - 2021-11-22

### Added

- Add support for Echo Reduction when using Voice Focus.

### Removed

### Fixed

- Switched `DefaultSimulcastUplinkPolicy` non-simulcast mode's enabled stream to mitigate Chromium not reconfiguring encoder on reconnect when using the top stream. This impacts only the non-simulcast mode of the simulcast policy when is when there are 2 or less participants (not 2 or less senders).

### Changed

## [2.22.0] - 2021-11-18

### Added

- Add documentation in video processor on how to add a customized professor with new image loading.
- Adds support to live transcription for new features including PII content identification and redaction, partial results stabilization, and custom language models for Amazon Transcribe and PHI content identification for Amazon Transcribe Medical.

### Removed

### Fixed

- Fix priority downlink policy bandwidth estimation metrics to work with Safari.
- Add a workaround to switch to VP8 for iOS 15.1 due to [Safari bug](https://bugs.webkit.org/show_bug.cgi?id=232416) that causes crash with H.264 encoding.
- Add a workaround to switch to VP8 for iOS 15.1 due to [Safari bug](https://bugs.webkit.org/show_bug.cgi?id=232416) for iOS WebView that causes crash with H.264 encoding.
- Make `tileWillBePausedByDownlinkPolicy` observer update synchronous without `setTimeout`.

### Changed

## [2.21.1] - 2021-11-09

### Added

- Add documentation on how to update a deployment of the serverless demo.
- Update background blur options to allow for skipping frames to improve CPU utilization.

### Removed

### Fixed

- Take into account portrait video dimension when calculating resolution scaling for NScale video bandwidth uplink policy.

### Changed

- Change the serverless demo's `deploy.js` script to rebuild the demo on each run. This should remove a manual step of rebuilding the demo.
- Disable NScale resolution scaling for Android device due to Android H.264 encoding.
- Minor clean up of code in `BackgroundBlurProcessorProvided` class.
- Refactored some video demo components into classes and seperate files.

## [2.21.0] - 2021-11-01

### Added

- Add support for layers allocation negotiation in Chromium based browsers to avoid resubscribing to preemptively turn off simulcast streams or to switch layers.
- Update browser compatibility doc for background blur
- Add a doc to guide builders on managing video quality for different video layouts. See [guide](https://aws.github.io/amazon-chime-sdk-js/modules/videolayout.html).

### Removed

### Fixed

- Fix disabling of send streams when local video was not enabled by integrating empty encoder params into `VideoStreamIndex` when sending is disabled.
- Fix `visibilitychange` typo in `InMemoryJSONEventBuffer`.

### Changed

- Ignore `enableUnifiedPlanForChromiumBasedBrowsers` value (i.e. treat as always equaling the current default value of `true`) in `MeetingSesstionConfiguration`. Chrome is [in the processing](https://groups.google.com/g/discuss-webrtc/c/UBtZfawdIAA/m/m-4wnVHXBgAJ) of deprecating and removing Plan-B which would cause breakage in applications still trying to use it. This will have no effect on SDK behavior` and has been the default since 1.17.0.
- Change `appVersionName` and `appVersionCode` fields to `appName` and `appVersion` respectively.
- Update similar log messages in `DefaultMessagingSession` and `DefaultSignalingClient`.

## [2.20.1] - 2021-10-27

### Fixed

- Prevent error `'scaleResolutionDownBy' member of RTCRtpEncodingParameters is not a finite floating-point value` thrown by NScale video uplink bandwidth policy when there is no height information from the sending video stream.

## [2.20.0] - 2021-10-18

### Added

- Add background blur video frame processor to enable background blur on streaming video. See [guide](https://aws.github.io/amazon-chime-sdk-js/modules/backgroundfilter_video_processor.html).

### Removed

### Fixed

### Changed

## [2.19.0] - 2021-10-14

### Added

- Add API `isSimulcastSupported` so applications can check whether simulcast can be enabled and pass corresponding policy.
- Add `bindToTileController` optional method to `VideoDownlinkBandwidthPolicy`.
- Add [Content Security Policy](https://aws.github.io/amazon-chime-sdk-js/modules/contentsecurity_policy.html) setup guide for customers who want to secure their application and add CSP headers.
- Add `securitypolicyviolation` event listener to listen for CSP violations. If customers have set up CSP for their app, the event listener will detect violations and print warnings.

### Removed

- Remove Getting Started documentation guide and use [API overview](https://aws.github.io/amazon-chime-sdk-js/modules/apioverview.html) to cover the development in more details.
- Remove interface matching rule for all the components so that it is not required to have an interface of the same name for each component directory.

### Fixed

- Amazon Voice Focus now works in Chrome 95 or later: WebAssembly policy changes required a change in how modules were loaded. This requires additional Content Security Policy changes, which are documented in the [CSP guide](https://aws.github.io/amazon-chime-sdk-js/modules/contentsecurity_policy.html) and the [Amazon Voice Focus guide](https://aws.github.io/amazon-chime-sdk-js/modules/amazonvoice_focus.html).
- Add safeguard in `ReceivedVideoInputTask` to prevent crashing when video input stream does not contain any video track.
- Add missing `captureOutputPrefix` param for SDK demo app in release script.
- Add opt-in region `eu-south-1` to meetings demo in deploy-canary-demo script to support media capture canary.
- Fix bug: DOMException: The play() request was interrupted by a new load request. <https://goo.gl/LdLk22>.
- Fix `removeObserver` function in `DefaultVideoTransformDevice`.
- Fix handling pausing when using default preference for priority-based video bandwidth policy.
- Bind tile controller for any downlink policy that implements `bindToTileController` such as
  `VideoAdaptiveProbePolicy`.
- Do not pause streams that do not exist in conference in `VideoPriorityBasedPolicy`.

### Changed

- Allow passing in custom video simulcast uplink policy that implements the `SimulcastUplinkPolicy` interface.
- Change the default video downlink policy to `VideoAdaptiveProbePolicy` to match with documentation.
- Move configuration default from meeting session configuration to audio video controller.
- Update the default priority-based video downlink policy to adjust target size based on number of videos in the meeting.
- Add a new section "Known Browser Issues" in FAQ.html.
- Refactor some types to avoid a circular dependency (#1565).
- Update package.json to include npm 8.
- Update mocha to version 9.

## [2.18.0] - 2021-09-22

### Added

- Add events `meetingReconnected`, `signalingDropped` and `receivingAudioDropped` to `eventDidReceive` by publishing them as stand alone events. Currently, these events were only included in the meeting history attribute when a meeting event is published.
- Added support for skipping full SDP renegotiations when switching simulcast streams. This will result in less freezing when switching between layers in response to a network event as done in `VideoPriorityBasedPolicy`. This will have no impact if not using simulcast.
- Add link to SIP Media Application examples in README.

### Removed

### Fixed

- Add safeguard for Nscale policy in case we increase to more than 25 videos.

### Changed

- Move `toLowerCasePropertyNames` inside `Utils.ts` and add test coverage.
- Reduced uplink resubscription when only stream encoding is changed by adding bypassing path.
- The browser demo now offers a configuration menu on each video tile. This menu replaces the 'Pin' button, which previously set the priority of the corresponding remote video to 1, and then rest to 2. The new configuration menu allows the user to specify the desired video quality and priority, which will be respected by simulcast and priority downlink policies. This is useful for testing or to demonstrate the behavior of those policies.
- Switched to using Web Components for video tiles in the browser demo.
- Migrate SauceLabs mobile tests to new api.

## [2.17.0] - 2021-09-08

### Added

- Add `audioInputMuteStateChanged` to the `DeviceChangeObserver` interface. This is called whenever the device is changed or is muted or unmuted, allowing applications to adapt to OS-level mute state for input devices.
- Added Android WebView Sample UI test to workflow.
- Add a new optional API `getVideoTileForAttendeeId` in `VideoTileController` and raise the `tileWillBePausedByDownlinkPolicy` event for empty video tiles.
- Amazon Voice Focus will now trigger the `onCPUWarning` method on the `VoiceFocusTransformDeviceDelegate` when using the default inline execution mode. This will be called when the browser fails to schedule the worklet in a timely fashion (_e.g._, when the meeting code is running in an iframe /subframe) or when changes in the CPU environment (_e.g._, thermal throttling) cause the worklet to take too long for each audio render quantum.
- Amazon Voice Focus will now trigger the `voiceFocusInsufficientResources` method on the `VoiceFocusTransformDeviceDelegate` when using the default inline execution mode. This will be called when the browser fails to schedule the worklet in a timely fashion (_e.g._, when the meeting code is running in an iframe /subframe) or when changes in the CPU environment (_e.g._, thermal throttling) cause the worklet to take too long for each audio render quantum.
- Add retry logic in FAQs.
- The Amazon Voice Focus support check, `VoiceFocusDeviceTransformer.isSupported`, now warns to the logger when run in an iframe, and can be configured to fail in that case.
- Add documentation in Video Processing APIs on how to add filters in the preview window.

### Changed

- Clarify why not use default downlink policy with simulcast.
- Corrected argument `isUnifiedPlan` in `withBandwidthRestriction` to `isFirefox`. Also marked as deprecated since we no longer use it.
- Update data message limit in the API Overview guide.
- Do not trigger real time attendee presence event for local attendee if they are not appear in audio info frame during reconnection.
- Update `startVideoPreviewForVideoInput` to support filters in the preview window.
- Update browser demo to showcase preview filter capability.

### Removed

### Fixed

- Fix priority-based downlink policy to not unpaused tiles that are not paused by the policy.
- Fix empty video tiles when using priority-based downlink policy.
- Fix simulcast guide that adaptive probe downlink policy is not enabled by default.
- Fix a link format in simulcast guide.
- No longer put useless 'pin' and 'pause' buttons on local tile in demo.
- Choose a null device or media stream without a deviceId without first listing devices no longer logs `Device cache is not populated`.

## [2.16.1] - 2021-08-23

### Fixed

- Fix default priority downlink policy to update default preference correctly.

## [2.16.0] - 2021-08-17

### Added

- Add `RealtimeSubscribeToAttendeeIdPresenceCallback` type for `realtimeSubscribeToAttendeeIdPresence` callback to document the callback parameters.
- Added support for Android WebView
- Add a SignalClientEvent check in `SubscribeAndReceiveSubscribeAckTask` to immediately cancel the task when websocket connection is terminated.

### Changed

- Update the default behavior of NScale video uplink bandwidth policy to scale down resolution based on the number
  of videos.

### Removed

### Fixed

- Fix race condition in Safari when disconnect and connect stream from video element.

## [2.15.0] - 2021-08-04

### Added

- Supports integration with Amazon Transcribe and Amazon Transcribe Medical for live transcription. The Amazon Chime Service uses its active talker algorithm to select the top two active talkers, and sends their audio to Amazon Transcribe (or Amazon Transcribe Medical) in your AWS account. User-attributed transcriptions are then sent directly to every meeting attendee via data messages. Use transcriptions to overlay subtitles, build a transcript, or perform real-time content analysis. For more information, visit [the live transcription guide](https://docs.aws.amazon.com/chime/latest/dg/meeting-transcription.html).
- [Demo] Add live transcription functionality. You will need to have a serverless deployment to create new AWS Lambda endpoints for live transcription. Follow [the live transcription guide](https://docs.aws.amazon.com/chime/latest/dg/meeting-transcription.html) to create necessary service-linked role so that the demo app can call Amazon Transcribe and Amazon Transcribe Medical on your behalf.
- Exposed Amazon Voice Focus model complexity as a type in order to support
  showcasing complexity limitation in the meeting demo.
- Packet-per-second (PPS) logging is now enabled in the meeting demo by
  default. If the browser sends an incorrect packet rate, this will be logged
  as an error in the console.
- Add a warning log in `InMemoryJSONEventBuffer`'s `send` function when retrying starts.

### Changed

- Update `InMemoryJSONEventBuffer` to retry with backoff.

### Removed

### Fixed

- Stop `activeDevice` video track before selecting a new device to prevent `NotReadableError` when calling `getUserMedia` for a new video input device.
- Fix priority-based downlink policy default behavior.
- Fix client event ingestion guide rendering in typedoc.

## [2.14.0] - 2021-07-23

### Added

- Added `VideoPriorityBasedPolicyConfig` to control video downlink policy with network event response and recovery delays. Check [User Guide for Priority-based Downlink Policy](https://aws.github.io/amazon-chime-sdk-js/modules/prioritybased_downlink_policy.html#user-guide-for-priority-based-downlink-policy) for more information.
- Amazon Chime SDK Project Board Overview and Guide.
- Added 25 video tile support for demo app.

### Changed

- [Documentation] Update priority based downlink policy guide.
- Lookup `groupId` from device cache instead of directly from media stream when selecting input device.
- [Documentation] Update documentation for 25 video tiles.

### Removed

### Fixed

- Improve the meeting event guide.
- Fixed Project Board guide with correct community template link.
- Updated Amazon Voice Focus integration guide to reflect recent Safari versions.
- Import current Amazon Voice Focus code, which ensures that stereo inputs are downmixed to mono.

## [2.13.0] - 2021-06-29

### Added

### Changed

### Removed

### Fixed

- Improve the meeting event guide

## [2.13.0] - 2021-06-29

### Added

- Add events ingestion to report meeting events to Amazon Chime backend.
  Check [Client Event Ingestion guide](https://aws.github.io/amazon-chime-sdk-js/modules/clientevent_ingestion.html) for more information.
- Add `videoUpstreamPacketLossPercent` and `videoDownstreamPacketsReceived` metrics for video streams
- [Documentation] Add documentation for view-only mode.
- Use SESSION_ESTABLISH event to indicate success of Chime SDK for Messaging successful websocket connection

### Changed

### Removed

### Fixed

## [2.12.0] - 2021-06-23

### Added

- [Documentation] Add documentation for `getObservableVideoMetrics`.
- [Documentation] Update FAQ and public documentation to add more information on SignalingBadRequest related error codes.
- [Documentation] Rephrase the terms in the status code documentations.

### Changed

- Bump maxVideos limit to 25

### Removed

### Fixed

- Pre-started signaling connections no longer cause a delay in joining if the
  user takes more than a minute to join the meeting.
- Fix choosing input device API when passing in a media stream.

## [2.11.0] - 2021-06-04

### Added

- Bind tileController during the initialization of DefaultAudioVideoController for VideoPriorityBasedPolicy.
- Add more debug logging for choose input device.
- Add the meeting and device error sections in the meeting-event guide.
- Add a `forceUpdate` parameter to use when listing devices. In some cases, builders need to delay the triggering of permission dialogs, _e.g._, when joining a meeting in view-only mode, and then later be able to trigger a permission prompt in order to show device labels. This parameter allows cached device labels to be forcibly discarded and recomputed after the device label trigger is run.

### Changed

- Log error instead of throwing error if the signaling client is not ready to send data message.
- Now when `setDeviceLabelTrigger` is called, if the `deviceInfoCache` contains a device with no label, `deviceInfoCache` will be cleared.

### Removed

- Remove deprecated unwired webrtc constraints from device controller and peer connection construction.
- Removed unnecessary restriction on VideoPriorityBasedPolicy to always subscribe to at least one stream.

### Fixed

- Fixed missing upstream video metrics for Firefox browsers.
- Fix build script to run on Windows by specifying ruby when running ruby scripts and rimraf to remove folder.

## [2.10.0] - 2021-05-19

### Added

- Add new message `MeetingSessionStatusCode` `AudioAttendeeRemoved` to handle the new audio server status code 411.
- Add support for `WKWebView` on iOS.
- Output a warning message when the volume adapter cleans up the self-attendee after reconnection.
- Add FAQ for more information on `AudioJoinFromAnotherDevice` meeting session status code.
- Add downstream audio webrtc metrics in `observableMetricSpec`.
- Add `getObservableVideoMetrics` and in `ClientMetricReport` to expose video stream metrics in webrtc.
- Update `SignalingProtocol` with optional video metric fields.

### Changed

- Update guide for priority based downlink policy.
- Bump version for lodash, y18n, and ssri dependencies.
- Mark `getObservableVideoMetrics` optional in ClientMetricReprt and `videoStreamIndex` and `selfAttendeeId` optional in `DefaultClientMetricReport`.

### Removed

### Fixed

- Do not start local video tile if there is no stream for content share.

- Media streams are no longer discarded during reconnects. This fixes an issue
  where initial signaling connection failures could cause a client to be unable
  to join a meeting with audio if Web Audio were enabled.

## [2.9.0] - 2021-05-10

### Added

- Add the Messaging section in FAQs to describe how to receive messages
  without using the Chime SDK for JavaScript.
- `DefaultAudioVideoFacade.start` now takes an options argument. You can use
  this to trigger a signaling socket connection prior to device selection: call
  `audioVideo.start({ signalingOnly: true })`, and then later call
  `audioVideo.start()` as usual.
- Added a 'abort-on-reconnect' query parameter to demo URL to trigger fatal
  on reconnection for use in integration tests (default false).

### Changed

- `startVideoPreviewForVideoInput` uses the active video input stream instead
  of calling `getUserMedia` again.
- Meeting connections now do more work in parallel, which will improve
  meeting join times.

### Removed

### Fixed

- Fix `npm run start:hot` in the browser demo.

## [2.8.0] - 2021-04-23

### Added

- Added new downlink policy `VideoPriorityBasedPolicy`, providing the ability
  to explicitly request remote video sources to receive and set their respective priorities. See
  [this guide](https://aws.github.io/amazon-chime-sdk-js/modules/prioritybased_downlink_policy.html)
  for more details and a code walkthrough of using the new policy.
  _(Note that the exact internal behavior of this policy may slightly change in future releases.)_
- Add optional header parameter to the `MeetingSessionPOSTLogger`.
- Add extra logging for synthesizing an audio stream.
- Add logging for `attendeePresenceReceived`.
- Add reconnection configuration in `MeetingSessionConfiguration`.
- Add NodeJS 16 to supported engines.

### Changed

- Disable audio properties on the peer connection if the join information
  does not include an audio host URL.
- `package-lock.json` files now use the v2 lockfile format.
- Configuration files now live in `/config`.

### Removed

### Fixed

- `DefaultDeviceController` recreates the `AudioContext` as needed when
  selecting non-transform devices, and does not do so when the `AudioContext`
  is suspended.
- Generated documentation no longer includes private members.
- Include the default error message in "meetingStartFailed" and "meetingFailed" events.
- Fix truncation in bps to kbps conversion that causes stream to stop under low bitrate.

## [2.7.0] - 2021-04-05

### Added

- [Demo] Add Tensorflow BodyPix segmentation demo for `VideoProcessor`.
- Added a workaround for a Chrome issue where Bluetooth audio would sound
  choppy for other participants when Web Audio was enabled. This workaround
  recreates the Web Audio context each time an input device is selected.

### Changed

- Update `SignalingProtocol` with optional video metric fields and optional join flags.
- `DefaultDeviceController` and `DefaultActiveSpeakerDetector` now conform to a
  new `Destroyable` interface, allowing resources to be explicitly discarded
  when a meeting is over.
- `MeetingSessionPOSTLogger` conforms to `Destroyable`. You should call
  `destroy` when you are done logging unless you plan to close the window.

### Removed

### Fixed

- Improve some unit tests.
- Fewer observers are now retained after meetings end. This should reduce
  leaks.
- Correctly close input streams when ending a call while using a video
  transform device.

## [2.6.2] - 2021-03-24

### Fixed

- Calling `realtimeSetLocalAudioInput` as part of `AudioVideoController.restartLocalAudio()` to
  fix local mute/unmute issue while switching audio devices.

## [2.6.1] - 2021-03-17

### Fixed

- Fix infinite loop when calling `chooseAudioInputDevice` with a
  `MediaDeviceInfo` instance.

## [2.6.0] - 2021-03-09

### Added

- Add `SingleNodeAudioTransformDevice` to make simple audio transforms easier to write.
- Reuse `VoiceFocusAudioNode` instances across transform device operations.
- Allow a complete configuration to be retrieved from and passed to a
  `VoiceFocusDeviceTransformer`, making it easier to instantiate a new
  transformer in a different scope with the same measured settings.
- Add End-to-end Integration test for Video Test App
- `MeetingSessionPOSTLogger` now matches the regular `Logger` API signature.

### Changed

- Allow device checker APIs to take devices as input, rather than only MediaDeviceInfo objects.
- Enable SIMD autodetection for Amazon Voice Focus in Chrome 90+.
- Clean up task cancel hooks after they cease to be relevant.
- Enable sender-side bandwidth estimation in Safari.
- Clean up usage of audioDeviceInformation in ReceiveAudioInputTask.

### Removed

- Removed audioDeviceInformation from AudioVideoControllerState.

### Fixed

- Upgrade ua-parser-js package version to latest.
- Don't automatically upgrade dev-dependencies to avoid a breaking typedoc upgrade.
- Safely handle calling logger `debug` methods with `undefined`.

## [2.5.0] - 2021-02-16

### Added

- Add GatheringICECandidate Finish Duration to Meeting Event and to demo app.
- Add `attendeePresenceReceived`, `audioInputSelected`, `videoInputSelected`,
  `audioInputUnselected`, and `videoInputUnselected` meeting events.
- Compute and add `meetingStartDurationMs` as part of the attributes of the
  `attendeePresenceReceived` meeting event.
- Add the file sharing workaround for Chrome 88 in FAQs.
- Add support for Chrome for iOS and Firefox for iOS.

### Changed

- [Demo] Set `attendeePresenceTimeoutMs` to use value passed as parameter in the URL.

### Removed

### Fixed

- `DefaultDeviceController` now attempts to resume a suspended `AudioContext`
  when choosing a transform device (#1062).
- `DefaultVideoStreamIndex` now ignores old group IDs from a given attendee ID (#1029).

## [2.4.1] - 2021-01-28

### Added

### Changed

### Removed

### Fixed

- Disable reconnecting in AudioVideoControllerFacade's `stop` method.
  Add documentation for the `stop` method.
- Fix dropped attendee presence during network reconnects.
- Add back `.play()` call explicitly for Safari browser to prevent video pause issue for local video.

## [2.4.0] - 2021-01-08

### Added

- Add support for Amazon Voice Focus support in Safari Technology Preview for macOS.
  Builders using an explicit revision or asset group must make sure to use a
  revision no earlier than this; an error will be thrown in Safari if older
  revisions are used.

### Changed

- Corrected `null` type on `DefaultVideoFrameProcessorPipeline` and `DefaultVideoTransformDevice`.
- Amazon Voice Focus now makes better use of available CPU resources,
  extending support to lower-end devices and improving quality on higher-end
  devices.

### Removed

### Fixed

- [Documentation] Corrected name for `voiceFocusInsufficientResources` in documentation.
- Allow for `realtimeUnsubscribeFromVolumeIndicator` to unsubscribe from specific callbacks.
- Correctly mute video elements when bound, preventing local echo when sharing tabs via content
  share.
- [Demo] Local content share (e.g., video files) now plays audio through the selected audio
  output device, rather than the default device, in browsers that support `setSinkId`.

## [2.3.0] - 2020-12-21

### Added

- Add Samsung Internet browser for Android as a supported browser.
- [Documentation] Add documentation for video processing APIs.
- Add `DefaultVideoTransformDevice` to implement `VideoTransformDevice`.
  `VideoFrameProcessor`, `VideoFrameProcessorPipeline` and `VideoFrameBuffer` interfaces
  are added to support `DefaultVideoTransformDevice` and allow processing steps to be applied to device.
  The method `chooseVideoInputDevice` in `DefaultDeviceController` can handle `VideoTransformDevice` now.

### Changed

### Removed

### Fixed

## [2.2.1] - 2020-12-11

### Added

### Changed

### Removed

### Fixed

- Binding audio elements will no longer throw an error unless calling code is
  trying to choose an output device in a browser that does not support
  `setSinkId`, and the demo will not log an error in these cases.
- [Demo] The meeting readiness checker no longer re-initializes the device output list
  after the user picks a device.
- [Test] Fix Amazon Voice Focus integration/canary test.
- [Demo] Additional best practices around choosing audio output devices.

## [2.2.0] - 2020-12-04

### Added

- [Documentation] What happens when participants try to `startLocalVideoTile` when local video tile limit reached

### Changed

- Log error if pass undefined device when calling choose input device
- Doing typecheck for MediaDeviceInfo
- Set automated integ test coverage on recent version of browsers

### Removed

### Fixed

- Allow Amazon Voice Focus code to load (but not function) in unsupported
  browsers that do not define `globalThis`.
- Fix uncaught promise exception for bindAudioOutput API
- [Demo] Fix meeting readiness checker speaker test failing in Safari
- [Demo] Validate metrics data while showing video WebRTC stats

## [2.1.0] - 2020-11-23

### Added

- [Documentation] Add demo video stats widget information to the quality and bandwidth guide
- [Documentation] Updated migration document to add more information about `bindAudioDevice()` API behavior
- Add APIs to create a messaging session with Amazon Chime SDK for Messaging

### Changed

### Removed

- [Test] Remove check for `/v2` in canary URL

### Fixed

- [Script] Update postpublish script to enable termination protection for prod canary stack.
- [Documentation] Update the Amazon Chime SDK Media Regions documentation link in the README
- Reimplement error handling in `DefaultRealtimeController` to generate less garbage.
- Add github actions fix to conditionally run integ tests
- [Documentation] Correct docstring for `VoiceFocusTransformDevice`.
- [Script] Add prepublish script to verify CDN configuration.

## [2.0.0] - 2020-11-18

### Added

- Add a constructor argument to `DefaultDeviceController` to specify whether Web Audio should be
  supported. Use this instead of `enableWebAudio`.
- Add an `AudioTransformDevice` type that can be supplied to `chooseAudioInputDevice`, allowing the
  injection of custom device constraints and Web Audio nodes as pseudo-devices.
- Add `VideoTransformDevice` interface placeholder. This interface mirrors `AudioTransformDevice`.
  Choosing `VideoTransformDevice`s in `DefaultDeviceController` will be implemented in a future release.
- Add Amazon Voice Focus, which allows you to create an audio input device that suppresses
  background noise.
- Add `AudioProfile` for configuring audio quality.
- Add `setAudioProfile` and `setContentAudioProfile` audio-video facade methods for setting audio quality.
- Added `GetUserMediaError` errors which are thrown for `chooseAudioInputDevice` and
  `chooseVideoInputDevice` API failures.
- [Demo] Show video WebRTC stats and attendeeId on video tile hover.
- [Demo] Add audio quality settings to meeting demo.

### Changed

- The project now produces ES2015 output, rather than ES5 output that refers to ES2015
  features. The SDK supports only modern browsers, and is increasingly dependent on ES2015
  features. This change leads to more compact bundles and aligns the supported JavaScript
  language variant with the supported runtime features.

  If you need your built application bundle to target browsers that do not
  support ES2015 syntax, including Internet Explorer, you will need to transpile the SDK code
  using a transpiler like Babel, or split your application bundle into multiple files that can
  be conditionally loaded. Note that transpiling some parts of the SDK might result in ES5 code
  that does not work when run.

- `DeviceController.createAnalyserNodeForAudioInput` now returns a `RemovableAnalyserNode` that
  knows how to unhook its own inputs. This allows you to correctly clean up, which avoids issues
  with Safari when used with Web Audio. The demo has been adjusted to do so.
- Modify `WebSocketAdapter.send` to accept string parameters.
- Changed `chooseAudioInputDevice` and `chooseVideoInputDevice` to return void and reject with a
  hierarchy of errors instead of either rejecting with an error and otherwise returning
  `DevicePermission`.

### Removed

- Remove `enableWebAudio` from `DeviceController` and related types. Use the constructor argument
  instead.
- Remove V1 meeting app. The V2 meeting app is now the only meeting app deployed. Do not supply /V2/
  paths when loading the app, if you deployed both.
- Remove legacy screen share.
- Remove `DevicePermission`.

### Fixed

- Fix Github Actions CI workflow to include all integ tests.
- Update the clicking sound answer in FAQs.
- [Test] Make sure to remove v2 from URL when trying to create meeting
- Correct import in `NoOpAudioVideoController`.

## [1.22.0] - 2020-11-10

### Added

- Add github actions continuous integration workflow and deploy workflow
- Add simulcast uplink policy layer change notification methods and observer
- Add `getRemoteVideoSources` method and `remoteVideoSourcesDidChange` observer
- [Documentation] Add question to FAQ about android chrome bluetooth audio devices

### Changed

- [Documentation] Updated HTTP to HTTPS in README URL links
- [Documentation] Improved documentation for running integration tests locally
- [Test] Updated browserstack URL formation to use HTTPS
- Upgraded eslint to understand modern TypeScript syntax, including `import type`
- [Demo] change optional feature selection to be list of input box to allow combination
- [Documentation] Update README to replace deprecated `AudioCallEnded` with `MeetingEnded`
- [Documentation] Update few `VideoTileController` and `VideoTile` APIs documentation
- [Documentation] Added deprecation message and log for `enableWebAudio` API in DeviceController
- Improve `DefaultEventController` to create less garbage

### Removed

### Fixed

- Make the event controller optional in the AudioVideoController interface
- Handle undefined attendeeId when calling `realtimeSetAttendeeIdPresence`
- Fix `DefaultModality` base check
- [Test] Fix a typo in integ tests
- [Demo] Fix serverless deploy script to not print out logs
- [Test] Make sure to error out if failed to grab Sauce Lab sessions
- Fixed deploy github action with correct keys
- Remote video may switch transceivers/videoTiles on simulcast change or camera toggle
- Fix github actions deploy workflow
- Fix issue with calling closeCurrentTest twice when timeout waiting for an attendee in integ test

## [1.21.0] - 2020-10-29

### Added

- [Demo] Add default SSE to meeting notifications queue in CF template
- Add meeting events

### Changed

### Removed

- Removed check for `iceGatheringState` to be complete for bypassing gathering ice candidate again

### Fixed

- Allow the build to complete in the absence of a Git checkout

## [1.20.2] - 2020-10-20

### Added

### Changed

- [Documentation] Update README to add information about `tileState.active`
- Update PR template to ask demo testing question

### Removed

### Fixed

- Reduced sessionId resolution to 32 bits and removed Long dependency
- Handle case where meeting or attendee response properties can accept null or undefined

## [1.20.0] - 2020-10-15

### Added

- Add a Travis check to make sure version update
- Add metrics for Selenium initialization metrics for integration tests
- Create log stream before logging begins
- Make AWS SDK for Java camelCased meeting-attendee response compatible with Chime SDK for JavaScript
- Mark InvalidSequenceTokenExceptions as warning
- Add an optional parameter to the serverless demo deployment script to specify Chime endpoint, and deploy to a new devo stage that talks to gamma Chime endpoint for canary
- Add extended debugging for saucelab sessions
- Add data message throttle limits to documentation
- Add `audioSessionId` to join frame to always drop when reconnecting
- Add audioSessionId to join frame to always drop when reconnecting

### Changed

- Update test results to Sauce Labs before emitting CloudWatch metrics for integration tests
- Mark `AudioInternalServerError` and `SignalingInternalServerError` as non-terminal errors
- Replace `awesome-typescript-loader` with `ts-loader`
- Alter the API signature for `Logger.debug` to accept strings, not just functions
- Update meeting readiness checker demo app with new regions CPT, MXP, BOM and ICN
- Update meeting readiness checker demo app to create meeting after the checker starts
- Alter the versioning script to require less ritual
- Correct TypeScript build to generate correct artifacts in `build/`
- Fall back to `null` device if there is any error while acquiring the audio device

### Removed

### Fixed

- Make sure integration test returns FAILED if there is error
- [Test] Make sure to reset ready status between retries
- No video after connection failure
- Fix video track sometimes being removed and added on simulcast receive stream switch
- Enabled termination protection for serverless demo CloudFormation stack
- Simulcast optimizations
- Correct TypeScript build to generate correct artifacts in `build/`
- Correct TypeScript configuration for demo app

## [1.19.0] - 2020-09-29

### Added

- Add MeetingReadinessCheckerConfiguration to allow custom configuration for meeting readiness checker

### Changed

- Update Travis config to improve PR build speed
- Disable configs in saucelab capabilities
- Use credentials sent via signaling connection JOIN_ACK to improve audio-video startup time.
- [Demo] Adjust demo css to prevent unecessary scrollbars on windows and stretching in video grid
- Update dependencies to TypeScript 4, `ts-loader`, and modern linting
- [Demo] Update dependencies, too.
- Remove unnecessary startAudioPreview in meeting demo
- Fix video tile with incorrect bound attendee ID and external User ID

### Removed

- Revert the "Create log stream before logging begins" commit
- Revert "Fix unbinding video tile bug" commit
- Revert "Fix issue with removeLocalVideoTile not removing video tile for remote attendees" commit
- Remove "./guides/docs.ts" and the composite setting from tsconfig.json
- Reverted " Add continuous integration workflow support for contributions from forked repos"

### Fixed

- Fix Maven installation script
- Fix SIP integration test
- Fixed v1 meeting bug related to bootstrap row class
- Fix meeting readiness checker integration test

## [1.18.0] - 2020-09-22

### Added

- Add meeting readiness checker integ tests to travis config
- Add optional parameter `sourceId` to checkContentShareConnectivity API
- Add getVideoInputQualitySettings to retrieve the current video settings
- Add documentation for DefaultActiveSpeakerPolicy constructor

### Changed

- Use pip to install aws sam cli for deployment script
- Added meetings tags to serverless demo
- Update PR template to add question about protocol and API change
- Add demos/browser package-lock to git, update webpack and jquery versions
- Update integration-watchlist to include demos/browser with no exception for package.json
- Change error to warn for logging Cloudwatch errors
- Update README with use case to handle `realtimeSubscribeToVolumeIndicator` updates efficiently
- Change error messaging for getUserMedia error
- Change demo video grid to CSS
- Update new known issues in FAQs and PTSN sample in README

### Removed

### Fixed

- Fixed bug related to unbinding a video element
- Fix tone does not stop when calling MeetingReadinessChecker.checkAudioOutput multiple times
- Fixed demo css format issue from updating to bootstrap 4.5.1
- Fix a minor syntax in DefaultSessionStateController

## [1.17.2] - 2020-09-08

### Added

### Changed

### Removed

### Fixed

- Change default encode resolution back to 960x540

## [1.17.0] - 2020-09-04

### Added

- Add npm login and logout as part of publish script
- Add Meeting Readiness Checker APIs

### Changed

- Change WebRTC semantics to Unified Plan by default for Chromium-based browsers
- Update video simulcast guide doc
- Update readme to include link to React components repo

### Removed

### Fixed

- Fixed removeLocalVideoTile so that the video tile is removed correctly for the user and attendees
- Handle timing issue of receiving index during resubscribe
- Mitigate Brew Sam installation issue
- Remove set command in travis awscli installation script
- Add `--no-fail-on-empty-changeset` flag in deploy script to not fail for empty changeset

## [1.16.0] - 2020-08-20

### Added

- Added auth-token based npm login and logout scripts for npm package publishing
- Update demo app with new regions CPT, MXP, BOM and ICN

### Changed

- Update the dependency version for the singlejs demo

### Removed

- Remove `device` demo from demos

### Fixed

- Fix and modify simulcast uplink policy to fix freezing and reduce switches
- Exclude self content share video stream index

## [1.15.0] - 2020-08-10

### Added

- Add comments for VideoTileState class and instructions in FAQ document
- Add reference to CreateMeetingWithAttendees in FAQ

### Changed

- Bump elliptic from 6.5.2 to 6.5.3 in /demos/device
- Log info when stop pinging due to Websocket closed
- Change the demo app to show content share video back to sharer
- Change bootstrap version for meeting demo to 4.5.0
- Change content share video check to use attendee name instead of video element index

### Removed

### Fixed

- Ensure all simulcast stream resolution are 16-aligned to avoid pixel3(XL) encoder issue
- Fix race condition in Chromium browsers when consecutive audio bind operations take place
- Fix invalid constraints and disable Unified Plan in safari 12.0
- Fix isSupported API in DefaultBrowserBehavior return true for Firefox on Android

## [1.14.0] - 2020-07-28

### Added

- Add content share video test integration test
- Add function to query outbound WebRTC video stats in browser demo
- Add error message for TaskFailed errors

### Changed

- Return the screen capture media stream for startContentShareFromScreenCapture

### Removed

### Fixed

- Fix exception thrown in Safari when multiple startVideoPreviewForVideoInput() are made

## [1.13.0] - 2020-07-21

### Added

### Changed

- Use POST instead of GET for TURN control endpoint

### Removed

### Fixed

- Fix demo app responsiveness issue
- Fix content share test video in Firefox
- Marking `TURNMeetingEnded` error as terminal to prevent session from reconnecting

## [1.12.0] - 2020-07-17

### Added

- Add device name for mobile integration tests
- Added new FAQs and updated Readme to include new demos for PSTN calling and live events
- Add test report URL for mobile integration tests
- Add Firefox to Travis integration tests
- Add README for integration tests
- Add log to list the set of constraints supported by the browser
- Add device change observer events when the current audio/video input stream ended

### Changed

- Fix title for FAQ guide
- Change DefaultDeviceController video MediaTrackConstraint parameters to be "ideal" explicitly
- Use a single instance of AudioContext
- Use the SDK default sample rate 48,000 Hz for an AudioBuffer object if the AudioContext sample rate doesn't work

### Removed

### Fixed

- Fix typo in VideoStreamDescription when stream is disabled by WebRTC
- Fix issue where audio input is not able to switch in Firefox
- Fix handling WebRTC Track event with no associated streams
- Increase log interval to avoid multiple Cloudwatch requests at once
- Fix incorrect log level for terminal error code
- Catch exceptions taking place when putLogEvents fails
- Fix content share test video in Firefox

## [1.11.0] - 2020-06-30

### Added

- Add meeting demo parameter for broadcasting user
- Add simulcast guide link in README and Quality Bandwidth Connectivity doc
- Add a MediaDevices proxy to support the devicechange event in some Android Chrome browsers

### Changed

### Removed

- Remove browser demo optional feature HTMLSelectElement multiple attribute

### Fixed

- Fix CloudWatch metrics for Linux and Android integration tests
- Fix create meeting request for audio and video e2e integration tests
- Fix multiple issues with integration tests
- Fix uuidv4 import
- Fix missing uuidv4 import in integration test
- Disable w3c check for Chrome Android webdriver integration tests
- Fix setSinkId() from throwing DOMException in Chromium browsers
- Fixing the ability to choose default input in browsers when default changes

## [1.10.0] - 2020-06-23

### Added

- Add position in frame to attendee updates
- Add stale-issue bot configuration
- Add simulcast support and provides new uplink downlink policies
- Add MultiLogger to support logging to multiple Logger instances
- Add resize listener on HTMLVideoElement in demo
- Add simulcast integration tests
- Add unit tests for source files previously excluded in test coverage

### Changed

- Use GET instead of POST to obtain TURN credentials
- Move integration tests to use meeting V2 demo
- Update to add ability to run integration tests in mobile devices

### Removed

### Fixed

- Update cloudwatch log stream ID to have attendee_id
- Fix Firefox 68 codec preference issues
- Fix uplink max bitrate value calculation

## [1.9.0] - 2020-06-12

### Added

### Changed

- Bump websocket-extensions from 0.1.3 to 0.1.4
- Update SignalingProtocol.proto and use SDK version in JoinFrame

### Removed

### Fixed

- Fix duplicate tiles and error logs due to external id race condition
- Suppress presence leave when attendee has already joined from another device (#427)

## [1.8.0] - 2020-06-05

### Added

- Add an integration tests to check remote video when reconnecting
- Add device controller tests
- Add option to run integration tests in Sauce Labs headless

### Changed

- Switch demo DDB table to on demand
- Restart the session if an attendee is not present during initial connection

### Removed

### Fixed

- Handle user revoking video input permission
- Fix FinishGatheringICECandidatesTask when there are no turn credentials
- Fix log line to print device constraints
- Fix build line to take out duplicate npm install
- Fix video audio preview for mobile devices
- Fix black remote video tiles on reconnect
- Fix LED light issue
- Fix typo in MeetingNotificaionsEvent present in template.yaml

## [1.7.0] - 2020-05-23

### Added

- Add connectionDidBecomeGood callback in AudioVideoObserver
- Add an integration test for Data Message
- Add the device selection to the "Starting a session" example
- Added Bandwidth and connectivity guide
- Add 'dropped' boolean attribute to realtime interface to indicate attendee drop

### Changed

- Support styling and Markdown for meeting demo chat
- Update signaling protocol

### Removed

### Fixed

- Fix Firefox version 76 missing/grey tiles
- Fix data message integration tests
- Fix several integration test name
- Mark 403 (Forbidden) for fetching turn credentials as terminal error and avoid retrying.
- Fix Android Pixel3 Chrome Video artifacts on far sites
- Don't throw the "cannot replace" message if the device controller is not bound to any audio-video controller

## [1.6.2] - 2020-05-18

### Fixed

- Disable audio capture for Electron Screen Capture

## [1.6.0] - 2020-05-15

### Added

- Allow option to skip device selection page in demo app.
- Add demo hook for debugging media connections
- Add github link to getNearestMediaRegion method in README.md
- Add data message APIs

### Changed

- Allow audio for screen capture in Chrome and Edge browsers
- Decouple the get call request from the UI
- Use getSettings if possible on MediaStream and move some info logs to debug level
- Use innerText instead of innerHTML

### Removed

### Fixed

- Fix minor coding styles for data message APIs

## [1.5.0] - 2020-05-07

### Added

- Add bandwidth policy to meeting session configuration to allow overriding default policies
- Add more content sharing integration tests
- Add gifs to read me file to show latest npm version and downloads
- Add method to get the nearest media region
- Display meeting and attendee IDs in the demo

### Changed

- Simplify meeting demos to leverage externalUserId in roster
- Update PR template to add testing information
- Support a mobile-friendly demo
- Increase the size of content share video tile for the demo app in small screen
- Update reconnection parameters in ConnectionHealthPolicyConfiguration

### Removed

- Remove unused VideoAdaptiveSubscribePolicy

### Fixed

- Fix serverless deploy script to work on Windows
- Clean up and fix serverless package bundling
- Do not mirror local video for rear-facing camera
- Fix sip url for meeting demo
- Fix local video freeze in Safari after toggling off and on
- Fix meeting demo content share turning off on attendee join
- Disable audio sample constraints when not using WebAudio
- Reset Sauce Lab session to make sure clean state
- Fix integration test emit metrics
- Fix the CloudWatch log handler

### Security

- Bump package-lock.json jquery to 3.5.0 and yargs-parser to 18.1.3

## [1.4.0] - 2020-04-24

### Added

- Expose an API for GetStats from RTCPeerConnection
- Add BrowserBehavior test for supported video codecs
- Expose ExternalUserID on videoTileDidUpdate

### Changed

- Use getByteTimeDomainData to support iOS Safari in meeting demo
- Update README to incorporate documentation feedback

### Removed

### Fixed

- Fix broken link in GitHub main page README

## [1.3.0] - 2020-04-17

### Added

- Enable the use of send-side bandwidth estimation
- Add guide for content sharing
- Display meeting id in the demo app
- Add additional callback in AudioVideoObserver to indicate video downlink pressure
- Add meeting demo parameter for recording user
- Add a script demo to bundle Chime SDK into a single JS file
- Add device demo
- Add base infrastructure for demo app in react
- Add pricing link in README
- Add an overview of API methods
- Add IoT integration to device demo
- Add option to run integration tests locally
- Add the use case guide
- Upgrade dependency aws-iot-device-sdk version
- Add externalUserId to the tile properties
- Add post publish script
- Add feature flag to enable WebRTC Unified Plan for Chromium-based browsers
- Add link to Amazon Chime SDK Security in README

### Changed

- Prevent prebuild from increase patch number when publishing to NPM
- Change the cloudwatch log message format
- Only run integration tests if files on watchlist were modified
- Temporarily only run test in Chrome for Travis integration tests
- Allow content share frame rate to be configurable
- Move demo guides to demo folders
- Fix the default video resolution comment in DeviceController

### Removed

- Remove unimplemented callbacks remoteDidMuteAudio and remoteDidUnmuteAudio on AudioVideoObserver
- Remove the minimal demo app
- Remove incomplete demo and component directories

### Fixed

- Fix retry logic for integration test
- Update typedocs to 0.16 and re-generate doc files
- Fix issue in Travis script that prevents integration tests from running
- Fix markdown formatting with backticks in API overview
- Fix an issue that a dev dependnecy @types/dom-mediacapture-record is not getting installed
- Fix typo in README.md file
- Ensure that attendee presence leave and join are ordered correctly
- Fix video element issue in Iphone
- Fix post publish script to also include meeting v1
- Use build:publish for publish script
- Fix Travis deploy failure

## [1.2.1] - 2020-03-20

### Added

- Add BITRATES in SdkSignalFrame Type and regenerate corresponding JS and TS protocol files.
- Add new ContentShareController APIs
- Add Getting Started guide
- Add doc guide generator
- Add basic component library setup
- Add injectable session URL rewrite function to support proxies
- Add POSTLogger for meeting sessions
- Integrate POSTLogger into the demo app
- Add content share integration test
- Enable POSTLogger for the serverless demo app
- Add max-content-share query parameter to allow 2 content share at the same time
- Add an integration test that checks only 2 content share are allowed

### Changed

- Add observer event for content sharing
- Stop content share if the media stream end
- Trap video sending SSRC change in two consecutive negotiation
- Do not bypass ice gathering based on sdp connection attributes for Safari on iOS
- Show SDK version in the demo meeting app
- Automatically patch a version for each commit
- Allow to specify manual version in publish script
- Automatically deploy meetingV2 to serverless demo
- Expose external user ID in places where attendee ID is present in RealtimeController
- Improve error output in the deploy script
- Do not reconnect if the session has not received monitoring data for a while
- Skip tests when merging to master
- Bump acorn dependency in package-lock.json to 6.4.1 to address CVE-2020-7598
- Use max-bundle RTCRtpPolicy for Firefox
- Throw error in Travis if integration test failed

### Fixed

- Remove line endings in the keyword when searching for connection attributes in SDP
- Fix pause and resume video functionality
- Fix DefaultTransceiverController async function signature
- Make DefaultBrowserBehavior implement BrowserBehavior interface
- Fix publish script to use npm version
- Add stage to saucelabs session name for integration tests
- Fix audio-video session stop to return Left status code
- Fix crash in demo app when click on screen share view
- Fix integration test completion time writer
- Fix the ping pong reconnection issue
- Fix example code in the getting started guide
- Fix browser versions for integration tests
- Fix present npm audit issues and automatically fix during build when possible

## [1.1.0] - 2020-02-04

### Added

- Add browser support for Safari and Opera
- Add CHANGELOG.md
- Allow for pausing screen sharing
- Add GitHub page with API documentation
- Add an alternative to WebAudio device controller and add a flag to disable the use of WebAudio
- Add option to confirm meeting end
- Implement keyframe request handling
- Add deploy step to deploy latest sdk changes
- Add a ConnectionHealthPolicyConfiguration property in the meeting session configuration
- Add support additional media regions
- Add video help desk tutorial
- Enable integration tests for travis builds
- Add ping/pong to screen sharing start code path to ensure socket is viable
- Enable integration tests for safari 12
- Write timestamp for latest canary completion time

### Changed

- Enforce SDP to have candidates for FinishGatheringICECandidateTask to resolve
- Add event listeners on peer connection to log state change
- Add client metrics for Safari
- Add SIP integration test
- Block screensharing start if the browser is Safari
- Expose extra bitrate estimation metrics
- Improve reconnect callback fidelity
- Update copyright and fix copyright check
- Improve logging for screen sharing
- Add source node to audio graph for silent devices
- Move screen view data connection open and close
- Improve handling of closed signaling connections
- Update README.md to clarify when to use npm install
- Add app quit and meeting leave integration tests and retry for all other tests
- Limit WebSocket reconnect attempts
- Refactor default screen sharing session start to fix state corruption bug
- Update Travis script to separate unit and integration tests into different jobs.
- Validate session Id and disable extendedDebugging flag for SauceLabs
- Fix infinite loop when retrying in audio and video integ tests
- Make sure both participants in audio and video tests reach finish state before retrying
- Trigger videoSendBandwidthDidChange and videoReceiveBandwidthDidChange for Safari
- Do not disconnect video element with different srcObj when destroying video tile
- Make meeting V2 the default demo meeting app

### Removed

- Remove SDP class withPlanBSimulcast method
- Remove noSignalStatusReceived from ReconnectionHealthPolicy and remove SignalStrengthBarsConnectionHealthPolicy.

### Fixed

- Add cleanup code for failed open screen sharing
- Handle error in screen viewing send echo response
- Fix several error handling issues
- Fix ReconnectingPromisedWebSocket timeout
- Ensure to null webSocket reference on abnormal close
- Use async scheduler for video tile disconnect
- Set device to null when active device unplugged
- Fix mobile safari detection
- Fix chooseVideoInputDevice with null
- Release chosen video stream on stopVideoPreview
- Fix Safari ICE failure issue by set bundle policy to max-bundle
- Fix to ignore error on screen viewing courtesy stop
- Fix meeting leave integration tests
- Reject an unresolved promise when canceling CreateSDPTask
- Fix Firefox keyframing
- Fix screen share integration test
- Fix null or empty device handling
- Fix demo screen share button states
- Fix bug that caused screenview to stay off when screenshare was toggled
- Only set attendee active only if still in roster
- Fix preview not switching issue and stop track during disconnect
- Reset connectionHealthData before (re)connection
- Fix a bug that prevented device change from triggering observers
- Fix serverless demo deployment scripts
- Fix integration test timeout and test sync between runs browsers
- Fix Safari crashes when remote video tiles are added or toggled
- Fix unhandled Promise rejection in DefaultScreenSharingSession#start
- Fix canary deployment script
- Fix SIP call integration test
- Fix Travis deployment script

## [1.0.0] - 2019-11-20

### Added

- Release first version of library
