// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DefaultAudioMixController from '../audiomixcontroller/DefaultAudioMixController';
import AudioVideoObserver from '../audiovideoobserver/AudioVideoObserver';
import DefaultBrowserBehavior from '../browserbehavior/DefaultBrowserBehavior';
import ContentShareObserver from '../contentshareobserver/ContentShareObserver';
import DefaultDeviceController from '../devicecontroller/DefaultDeviceController';
import PermissionDeniedError from '../devicecontroller/PermissionDeniedError';
import Logger from '../logger/Logger';
import MeetingSession from '../meetingsession/MeetingSession';
import MeetingSessionStatus from '../meetingsession/MeetingSessionStatus';
import TimeoutScheduler from '../scheduler/TimeoutScheduler';
import BaseTask from '../task/BaseTask';
import TimeoutTask from '../task/TimeoutTask';
import CheckAudioConnectivityFeedback from './CheckAudioConnectivityFeedback';
import CheckAudioInputFeedback from './CheckAudioInputFeedback';
import CheckAudioOutputFeedback from './CheckAudioOutputFeedback';
import CheckCameraResolutionFeedback from './CheckCameraResolutionFeedback';
import CheckContentShareConnectivityFeedback from './CheckContentShareConnectivityFeedback';
import CheckNetworkTCPConnectivityFeedback from './CheckNetworkTCPConnectivityFeedback';
import CheckNetworkUDPConnectivityFeedback from './CheckNetworkUDPConnectivityFeedback';
import CheckVideoConnectivityFeedback from './CheckVideoConnectivityFeedback';
import CheckVideoInputFeedback from './CheckVideoInputFeedback';
import MeetingReadinessChecker from './MeetingReadinessChecker';
import MeetingReadinessCheckerConfiguration from './MeetingReadinessCheckerConfiguration';

export default class DefaultMeetingReadinessChecker implements MeetingReadinessChecker {
  private static async delay(timeoutMs: number): Promise<void> {
    await new Promise(resolve => new TimeoutScheduler(timeoutMs).start(resolve));
  }

  private audioContext: AudioContext;
  private gainNode: GainNode;
  private oscillatorNode: OscillatorNode;
  private destinationStream: MediaStreamAudioDestinationNode;
  private originalURLRewriter: (url: string) => string;

  private browserBehavior: DefaultBrowserBehavior = new DefaultBrowserBehavior();

  constructor(
    private logger: Logger,
    private meetingSession: MeetingSession,
    private configuration: MeetingReadinessCheckerConfiguration = new MeetingReadinessCheckerConfiguration()
  ) {}

  async checkAudioInput(audioInputDeviceInfo: MediaDeviceInfo): Promise<CheckAudioInputFeedback> {
    try {
      await this.meetingSession.audioVideo.chooseAudioInputDevice(audioInputDeviceInfo);
      await this.meetingSession.audioVideo.chooseAudioInputDevice(null);
      return CheckAudioInputFeedback.Succeeded;
    } catch (error) {
      this.logger.error(`MeetingReadinessChecker: Audio input check failed with error ${error}`);
      if (error instanceof PermissionDeniedError) {
        return CheckAudioInputFeedback.PermissionDenied;
      }
      return CheckAudioInputFeedback.Failed;
    }
  }

  async checkAudioOutput(
    audioOutputDeviceInfo: MediaDeviceInfo,
    audioOutputVerificationCallback: () => Promise<boolean>,
    audioElement: HTMLAudioElement = null
  ): Promise<CheckAudioOutputFeedback> {
    try {
      const audioOutputDeviceId =
        audioOutputDeviceInfo && audioOutputDeviceInfo.deviceId
          ? audioOutputDeviceInfo.deviceId
          : '';
      await this.playTone(audioOutputDeviceId, 440, audioElement);
      const userFeedback = await audioOutputVerificationCallback();
      if (userFeedback) {
        return CheckAudioOutputFeedback.Succeeded;
      }
      return CheckAudioOutputFeedback.Failed;
    } catch (error) {
      this.logger.error(`MeetingReadinessChecker: Audio output check failed with error: ${error}`);
      return CheckAudioOutputFeedback.Failed;
    } finally {
      this.stopTone();
    }
  }

  private async playTone(
    sinkId: string | null,
    frequency: number | 440,
    audioElement: HTMLAudioElement | null
  ): Promise<void> {
    const rampSec = 0.1;
    const maxGainValue = 0.1;

    if (this.oscillatorNode) {
      this.stopTone();
    }
    this.audioContext = DefaultDeviceController.getAudioContext();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 0;
    this.oscillatorNode = this.audioContext.createOscillator();
    this.oscillatorNode.frequency.value = frequency;
    this.oscillatorNode.connect(this.gainNode);
    this.destinationStream = this.audioContext.createMediaStreamDestination();
    this.gainNode.connect(this.destinationStream);
    const currentTime = this.audioContext.currentTime;
    const startTime = currentTime + 0.1;
    this.gainNode.gain.linearRampToValueAtTime(0, startTime);
    this.gainNode.gain.linearRampToValueAtTime(maxGainValue, startTime + rampSec);
    this.oscillatorNode.start();

    // Because we always use `DefaultAudioMixController`, and both this class
    // and DAMC use `DefaultBrowserBehavior`, it is not possible for the `bindAudioDevice` call here to throw.
    // Nevertheless, we `catch` here and disable code coverage.

    const audioMixController = new DefaultAudioMixController(this.logger);

    try {
      if (this.browserBehavior.supportsSetSinkId()) {
        await audioMixController.bindAudioDevice({ deviceId: sinkId } as MediaDeviceInfo);
      }
    } catch (e) {
      /* istanbul ignore next */
      this.logger.error(`Failed to bind audio device: ${e}`);
    }
    try {
      await audioMixController.bindAudioElement(audioElement || new Audio());
    } catch (e) {
      this.logger.error(`Failed to bind audio element: ${e}`);
    }
    await audioMixController.bindAudioStream(this.destinationStream.stream);
  }

  private stopTone(): void {
    if (!this.audioContext || !this.gainNode || !this.oscillatorNode || !this.destinationStream) {
      return;
    }
    const durationSec = 1;
    const rampSec = 0.1;
    const maxGainValue = 0.1;
    const currentTime = this.audioContext.currentTime;
    this.gainNode.gain.linearRampToValueAtTime(maxGainValue, currentTime + rampSec + durationSec);
    this.gainNode.gain.linearRampToValueAtTime(0, currentTime + rampSec * 2 + durationSec);
    this.oscillatorNode.stop();
    this.oscillatorNode.disconnect(this.gainNode);
    this.gainNode.disconnect(this.destinationStream);
    this.oscillatorNode = null;
    this.gainNode = null;
    this.destinationStream = null;
  }

  async checkVideoInput(videoInputDeviceInfo: MediaDeviceInfo): Promise<CheckVideoInputFeedback> {
    try {
      await this.meetingSession.audioVideo.chooseVideoInputDevice(videoInputDeviceInfo);
      await this.meetingSession.audioVideo.chooseVideoInputDevice(null);
      return CheckVideoInputFeedback.Succeeded;
    } catch (error) {
      this.logger.error(`MeetingReadinessChecker: Video check failed with error ${error}`);
      if (error instanceof PermissionDeniedError) {
        return CheckVideoInputFeedback.PermissionDenied;
      }
      return CheckVideoInputFeedback.Failed;
    }
  }

  async checkCameraResolution(
    videoInputDevice: MediaDeviceInfo,
    width: number,
    height: number
  ): Promise<CheckCameraResolutionFeedback> {
    const videoConstraint = {
      video: this.calculateVideoConstraint(videoInputDevice, width, height),
    };
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(videoConstraint);
    } catch (error) {
      this.logger.error(
        `MeetingReadinessChecker: Camera resolution check with width: ${width} height ${height} failed with error ${error}`
      );
      if (error && error.name === 'OverconstrainedError') {
        return CheckCameraResolutionFeedback.ResolutionNotSupported;
      }
      if (error && error.name === 'NotAllowedError') {
        return CheckCameraResolutionFeedback.PermissionDenied;
      }
      return CheckCameraResolutionFeedback.Failed;
    } finally {
      if (stream) {
        stream.getTracks().forEach(function (track) {
          track.stop();
        });
      }
    }
    return CheckCameraResolutionFeedback.Succeeded;
  }

  private calculateVideoConstraint(
    videoInputDevice: MediaDeviceInfo,
    width: number,
    height: number
  ): MediaTrackConstraints {
    const dimension = this.browserBehavior.requiresResolutionAlignment(width, height);
    const trackConstraints: MediaTrackConstraints = {};
    if (this.browserBehavior.requiresNoExactMediaStreamConstraints()) {
      trackConstraints.deviceId = videoInputDevice.deviceId;
      trackConstraints.width = width;
      trackConstraints.height = height;
    } else {
      trackConstraints.deviceId = { exact: videoInputDevice.deviceId };
      trackConstraints.width = { exact: dimension[0] };
      trackConstraints.height = { exact: dimension[1] };
    }
    return trackConstraints;
  }

  async checkContentShareConnectivity(
    sourceId?: string
  ): Promise<CheckContentShareConnectivityFeedback> {
    let isContentShareStarted = false;
    let isAudioVideoStarted = false;

    const contentShareObserver: ContentShareObserver = {
      contentShareDidStart: () => {
        isContentShareStarted = true;
      },
    };
    const observer: AudioVideoObserver = {
      audioVideoDidStart: () => {
        isAudioVideoStarted = true;
      },
    };

    try {
      this.meetingSession.audioVideo.addObserver(observer);
      this.meetingSession.audioVideo.start();

      this.meetingSession.audioVideo.addContentShareObserver(contentShareObserver);
      await this.meetingSession.audioVideo.startContentShareFromScreenCapture(sourceId);

      await this.executeTimeoutTask(async () => {
        return isAudioVideoStarted && isContentShareStarted;
      });

      if (!isAudioVideoStarted) {
        return CheckContentShareConnectivityFeedback.ConnectionFailed;
      }
      await this.stopMeeting();
      return isContentShareStarted
        ? CheckContentShareConnectivityFeedback.Succeeded
        : CheckContentShareConnectivityFeedback.TimedOut;
    } catch (error) {
      this.logger.error(`MeetingReadinessChecker: Content share check failed with error ${error}`);
      if (error.name === 'NotAllowedError') {
        return CheckContentShareConnectivityFeedback.PermissionDenied;
      } else {
        return CheckContentShareConnectivityFeedback.Failed;
      }
    } finally {
      this.meetingSession.audioVideo.removeObserver(observer);
      this.meetingSession.audioVideo.stopContentShare();
      this.meetingSession.audioVideo.removeContentShareObserver(contentShareObserver);
    }
  }

  async checkAudioConnectivity(
    audioInputDeviceInfo: MediaDeviceInfo
  ): Promise<CheckAudioConnectivityFeedback> {
    let audioPresence = false;
    const audioVideo = this.meetingSession.audioVideo;
    const attendeePresenceHandler = (
      attendeeId: string,
      present: boolean,
      _externalUserId: string,
      _dropped: boolean
    ): void => {
      if (attendeeId === this.meetingSession.configuration.credentials.attendeeId && present) {
        audioPresence = true;
      }
    };
    try {
      await audioVideo.chooseAudioInputDevice(audioInputDeviceInfo);
    } catch (error) {
      this.logger.error(
        `MeetingReadinessChecker: Failed to get audio input device with error ${error}`
      );
      if (error instanceof PermissionDeniedError) {
        return CheckAudioConnectivityFeedback.AudioInputPermissionDenied;
      }
      return CheckAudioConnectivityFeedback.AudioInputRequestFailed;
    }
    audioVideo.realtimeSubscribeToAttendeeIdPresence(attendeePresenceHandler);
    if (!(await this.startMeeting())) {
      audioVideo.realtimeUnsubscribeToAttendeeIdPresence(attendeePresenceHandler);
      try {
        await this.meetingSession.audioVideo.chooseAudioInputDevice(null);
      } catch (e) {
        this.logger.error(`MeetingReadinessChecker: Failed to choose null device with error ${e}`);
      }
      return CheckAudioConnectivityFeedback.ConnectionFailed;
    }
    await this.executeTimeoutTask(async () => {
      return audioPresence;
    });
    audioVideo.realtimeUnsubscribeToAttendeeIdPresence(attendeePresenceHandler);
    await this.stopMeeting();
    try {
      await this.meetingSession.audioVideo.chooseAudioInputDevice(null);
    } catch (e) {
      this.logger.error(`MeetingReadinessChecker: Failed to choose null device with error ${e}`);
    }
    return audioPresence
      ? CheckAudioConnectivityFeedback.Succeeded
      : CheckAudioConnectivityFeedback.AudioNotReceived;
  }

  async checkVideoConnectivity(
    videoInputDeviceInfo: MediaDeviceInfo
  ): Promise<CheckVideoConnectivityFeedback> {
    const audioVideo = this.meetingSession.audioVideo;

    try {
      await audioVideo.chooseVideoInputDevice(videoInputDeviceInfo);
    } catch (error) {
      this.logger.error(
        `MeetingReadinessChecker: Failed to get video input device with error ${error}`
      );
      if (error instanceof PermissionDeniedError) {
        return CheckVideoConnectivityFeedback.VideoInputPermissionDenied;
      }
      return CheckVideoConnectivityFeedback.VideoInputRequestFailed;
    }

    if (!(await this.startMeeting())) {
      return CheckVideoConnectivityFeedback.ConnectionFailed;
    }

    let packetsSent = 0;
    audioVideo.startLocalVideoTile();
    await this.executeTimeoutTask(async () => {
      const rawStats = await audioVideo.getRTCPeerConnectionStats();
      if (rawStats) {
        rawStats.forEach(report => {
          if (report.type === 'outbound-rtp' && report.mediaType === 'video') {
            packetsSent = report.packetsSent;
          }
        });
      }
      return packetsSent > 0;
    });
    audioVideo.stopLocalVideoTile();
    await this.stopMeeting();
    if (packetsSent <= 0) {
      return CheckVideoConnectivityFeedback.VideoNotSent;
    }
    return CheckVideoConnectivityFeedback.Succeeded;
  }

  async checkNetworkUDPConnectivity(): Promise<CheckNetworkUDPConnectivityFeedback> {
    try {
      this.originalURLRewriter = this.meetingSession.configuration.urls.urlRewriter;
    } catch (error) {
      this.logger.error(`MeetingSessionConfiguration.urls doesn't exist. Error: ${error}`);
      return CheckNetworkUDPConnectivityFeedback.MeetingSessionURLsNotInitialized;
    }
    this.meetingSession.configuration.urls.urlRewriter = (uri: string) => {
      const transformedUri = this.originalURLRewriter(uri);
      if (transformedUri.includes('transport=tcp')) {
        return '';
      }
      return transformedUri;
    };

    const audioVideo = this.meetingSession.audioVideo;
    if (!(await this.startMeeting())) {
      this.meetingSession.configuration.urls.urlRewriter = this.originalURLRewriter;
      return CheckNetworkUDPConnectivityFeedback.ConnectionFailed;
    }

    let candidatePairSucceed = false;
    await this.executeTimeoutTask(async () => {
      const rawStats = await audioVideo.getRTCPeerConnectionStats();
      if (rawStats) {
        rawStats.forEach(report => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            candidatePairSucceed = true;
          }
        });
      }
      return candidatePairSucceed;
    });

    this.meetingSession.configuration.urls.urlRewriter = this.originalURLRewriter;
    await this.stopMeeting();
    if (!candidatePairSucceed) {
      return CheckNetworkUDPConnectivityFeedback.ICENegotiationFailed;
    }
    return CheckNetworkUDPConnectivityFeedback.Succeeded;
  }

  async checkNetworkTCPConnectivity(): Promise<CheckNetworkTCPConnectivityFeedback> {
    try {
      this.originalURLRewriter = this.meetingSession.configuration.urls.urlRewriter;
    } catch (error) {
      this.logger.error(`MeetingSessionConfiguration.urls doesn't exist. Error: ${error}`);
      return CheckNetworkTCPConnectivityFeedback.MeetingSessionURLsNotInitialized;
    }

    this.meetingSession.configuration.urls.urlRewriter = (uri: string) => {
      const transformedUri = this.originalURLRewriter(uri);
      if (transformedUri.includes('transport=udp')) {
        return '';
      }
      return transformedUri;
    };

    const audioVideo = this.meetingSession.audioVideo;

    if (!(await this.startMeeting())) {
      this.meetingSession.configuration.urls.urlRewriter = this.originalURLRewriter;
      return CheckNetworkTCPConnectivityFeedback.ConnectionFailed;
    }

    let candidatePairSucceed = false;
    await this.executeTimeoutTask(async () => {
      const rawStats = await audioVideo.getRTCPeerConnectionStats();
      if (rawStats) {
        rawStats.forEach(report => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            candidatePairSucceed = true;
          }
        });
      }
      return candidatePairSucceed;
    });

    this.meetingSession.configuration.urls.urlRewriter = this.originalURLRewriter;
    await this.stopMeeting();
    if (!candidatePairSucceed) {
      return CheckNetworkTCPConnectivityFeedback.ICENegotiationFailed;
    }
    return CheckNetworkTCPConnectivityFeedback.Succeeded;
  }

  private async startMeeting(): Promise<boolean> {
    let isStarted = false;
    const observer: AudioVideoObserver = {
      audioVideoDidStart: () => {
        isStarted = true;
      },
    };
    this.meetingSession.audioVideo.addObserver(observer);
    this.meetingSession.audioVideo.start();
    await this.executeTimeoutTask(async () => {
      return isStarted;
    });
    this.meetingSession.audioVideo.removeObserver(observer);
    return isStarted;
  }

  private async stopMeeting(): Promise<boolean> {
    let isStopped = false;
    const observer: AudioVideoObserver = {
      audioVideoDidStop: (_sessionStatus: MeetingSessionStatus) => {
        isStopped = true;
      },
    };
    this.meetingSession.audioVideo.addObserver(observer);
    this.meetingSession.audioVideo.stop();
    await this.executeTimeoutTask(async () => {
      return isStopped;
    });
    this.meetingSession.audioVideo.removeObserver(observer);
    return isStopped;
  }

  private async executeTimeoutTask(conditionCheck: () => Promise<boolean>): Promise<boolean> {
    let isSuccess = false;
    class CheckForConditionTask extends BaseTask {
      private isCancelled = false;

      constructor(logger: Logger, private waitDurationMs: number) {
        super(logger);
      }

      cancel(): void {
        this.isCancelled = true;
      }

      async run(): Promise<void> {
        while (!this.isCancelled) {
          if (await conditionCheck()) {
            isSuccess = true;
            break;
          }
          await DefaultMeetingReadinessChecker.delay(this.waitDurationMs);
        }
      }
    }
    const timeoutTask = new TimeoutTask(
      this.logger,
      new CheckForConditionTask(this.logger, this.configuration.waitDurationMs),
      this.configuration.timeoutMs
    );
    await timeoutTask.run();
    return isSuccess;
  }
}
