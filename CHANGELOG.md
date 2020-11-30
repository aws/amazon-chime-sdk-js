# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Add continuous integration workflow support for contributions from forked repos
- [Documentation] What happens when participants try to `startLocalVideoTile` when local video tile limit reached

### Changed

### Removed


### Fixed


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
- Remove  `device` demo from demos

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
- Add base infrastucture for demo app in react
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
