# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Add bandwidth policy to meeting session configuration to allow overriding default policies
- Add more content sharing integration tests

### Changed
- Simplify meeting demos to leverage externalUserId in roster
- Update PR template to add testing information

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
- Enabled the use of send-side bandwidth estimation
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
- Removed incomplete demo and component directories

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
- Getting Started guide
- Doc guide generator
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
- Adding app quit and meeting leave integration tests and retry for all other tests
- Limit WebSocket reconnect attempts
- Refactored default screen sharing session start to fix state corruption bug
- Update Travis script to separate unit and integration tests into different jobs.
- Validate session Id and disable extendedDebugging flag for SauceLabs
- Fixing infinite loop when retrying in audio and video integ tests
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
- Fixing screen share integration test
- Fix null or empty device handling
- Fix demo screen share button states
- Fix bug that caused screenview to stay off when screenshare was toggled
- Only set attendee active only if still in roster
- Fix preview not switching issue and stop track during disconnect
- Reset connectionHealthData before (re)connection
- Fix a bug that prevented device change from triggering observers
- Fixes for serverless demo deployment scripts
- Fixing integration test timeout and test sync between runs browsers
- Safari crashes when remote video tiles are added or toggled
- Fix unhandled Promise rejection in DefaultScreenSharingSession#start
- Fix canary deployment script
- Fix sip call integration test
- Fix Travis deployment script

## [1.0.0] - 2019-11-20
