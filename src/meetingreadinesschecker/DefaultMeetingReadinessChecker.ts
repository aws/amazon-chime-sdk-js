// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DefaultAudioMixController from '../audiomixcontroller/DefaultAudioMixController';
import AudioVideoObserver from '../audiovideoobserver/AudioVideoObserver';
import ContentShareObserver from '../contentshareobserver/ContentShareObserver';
import DefaultDeviceController from '../devicecontroller/DefaultDeviceController';
import DevicePermission from '../devicecontroller/DevicePermission';
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

export default class DefaultMeetingReadinessChecker implements MeetingReadinessChecker {
  private static readonly TIMEOUT_MS = 10000;

  private static async delay(timeoutMs: number): Promise<void> {
    await new Promise(resolve => new TimeoutScheduler(timeoutMs).start(resolve));
  }

  private audioContext: AudioContext;
  private gainNode: GainNode;
  private oscillatorNode: OscillatorNode;
  private originalURLRewriter: (url: string) => string;

  constructor(private logger: Logger, private meetingSession: MeetingSession) {}

  async checkAudioInput(audioInputDeviceInfo: MediaDeviceInfo): Promise<CheckAudioInputFeedback> {
    try {
      let result = await this.meetingSession.audioVideo.chooseAudioInputDevice(
        audioInputDeviceInfo
      );
      if (
        result === DevicePermission.PermissionDeniedByBrowser ||
        result === DevicePermission.PermissionDeniedByUser
      ) {
        return CheckAudioInputFeedback.PermissionDenied;
      } else {
        await this.meetingSession.audioVideo.chooseAudioInputDevice(null);
        return CheckAudioInputFeedback.Success;
      }
    } catch (error) {
      this.logger.error(`MeetingReadinessChecker: Audio check failed with error ${error}`);
      return CheckAudioInputFeedback.Failure;
    }
  }

  async checkAudioOutput(
    audioOutputDeviceInfo: MediaDeviceInfo,
    callback: () => Promise<boolean>
  ): Promise<CheckAudioOutputFeedback> {
    try {
      const audioOutputDeviceId =
        audioOutputDeviceInfo && audioOutputDeviceInfo.deviceId
          ? audioOutputDeviceInfo.deviceId
          : '';
      this.playTone(audioOutputDeviceId, 440);
      let userFeedback = await callback();
      this.stopTone();
      if (userFeedback) {
        return CheckAudioOutputFeedback.Success;
      } else {
        return CheckAudioOutputFeedback.Failure;
      }
    } catch (e) {
      this.logger.error(`checkAudioOutput failed with error: ${e}`);
      return CheckAudioOutputFeedback.Failure;
    }
  }

  playTone(sinkId: string | null, frequency: number | 440): void {
    const rampSec = 0.1;
    const maxGainValue = 0.1;

    let destinationStream: MediaStreamAudioDestinationNode;
    this.audioContext = DefaultDeviceController.getAudioContext();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 0;
    this.oscillatorNode = this.audioContext.createOscillator();
    this.oscillatorNode.frequency.value = frequency;
    this.oscillatorNode.connect(this.gainNode);
    destinationStream = this.audioContext.createMediaStreamDestination();
    this.gainNode.connect(destinationStream);
    const currentTime = this.audioContext.currentTime;
    const startTime = currentTime + 0.1;
    this.gainNode.gain.linearRampToValueAtTime(0, startTime);
    this.gainNode.gain.linearRampToValueAtTime(maxGainValue, startTime + rampSec);
    this.oscillatorNode.start();
    const audioMixController = new DefaultAudioMixController();
    // @ts-ignore
    audioMixController.bindAudioDevice({ deviceId: sinkId });
    audioMixController.bindAudioElement(new Audio());
    audioMixController.bindAudioStream(destinationStream.stream);
  }

  stopTone(): void {
    const durationSec = 1;
    const rampSec = 0.1;
    const maxGainValue = 0.1;
    const currentTime = this.audioContext.currentTime;
    this.gainNode.gain.linearRampToValueAtTime(maxGainValue, currentTime + rampSec + durationSec);
    this.gainNode.gain.linearRampToValueAtTime(0, currentTime + rampSec * 2 + durationSec);
    this.oscillatorNode.stop();
    DefaultDeviceController.closeAudioContext();
  }

  async checkVideoInput(videoInputDeviceInfo: MediaDeviceInfo): Promise<CheckVideoInputFeedback> {
    try {
      const result = await this.meetingSession.audioVideo.chooseVideoInputDevice(
        videoInputDeviceInfo
      );
      if (
        result === DevicePermission.PermissionDeniedByBrowser ||
        result === DevicePermission.PermissionDeniedByUser
      ) {
        return CheckVideoInputFeedback.PermissionDenied;
      } else {
        await this.meetingSession.audioVideo.chooseVideoInputDevice(null);
        return CheckVideoInputFeedback.Success;
      }
    } catch (error) {
      this.logger.error(`MeetingReadinessChecker: Video check failed with error ${error}`);
      return CheckVideoInputFeedback.Failure;
    }
  }

  async checkCameraResolution(
    videoInputDevice: MediaDeviceInfo,
    width: number,
    height: number
  ): Promise<CheckCameraResolutionFeedback> {
    const videoConstraint = {
      video: { width: { exact: width }, height: { exact: height } },
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
      return CheckCameraResolutionFeedback.Failure;
    } finally {
      if (stream) {
        stream.getTracks().forEach(function(track) {
          track.stop();
        });
      }
    }
    return CheckCameraResolutionFeedback.Success;
  }

  async checkContentShareConnectivity(): Promise<CheckContentShareConnectivityFeedback> {
    let isContentShareStarted = false;

    const contentShareObserver: ContentShareObserver = {
      contentShareDidStart: () => {
        isContentShareStarted = true;
      },
    };

    if (!(await this.startMeeting())) {
      return CheckContentShareConnectivityFeedback.ConnectionFailure;
    }

    try {
      this.meetingSession.audioVideo.addContentShareObserver(contentShareObserver);
      await this.meetingSession.audioVideo.startContentShareFromScreenCapture();

      await this.executeTimeoutTask(async () => {
        return isContentShareStarted;
      });
      await this.stopMeeting();
      return isContentShareStarted
        ? CheckContentShareConnectivityFeedback.Success
        : CheckContentShareConnectivityFeedback.Timeout;
    } catch (error) {
      this.logger.error(`MeetingReadinessChecker: Content share check failed with error ${error}`);
      if (error.name === 'NotAllowedError') {
        return CheckContentShareConnectivityFeedback.PermissionDenied;
      } else {
        return CheckContentShareConnectivityFeedback.Failure;
      }
    } finally {
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
      const permissionResult = await audioVideo.chooseAudioInputDevice(audioInputDeviceInfo);
      if (
        permissionResult === DevicePermission.PermissionDeniedByBrowser ||
        permissionResult === DevicePermission.PermissionDeniedByUser
      ) {
        return CheckAudioConnectivityFeedback.AudioInputPermissionDenied;
      }
    } catch (error) {
      this.logger.error(
        `MeetingReadinessChecker: Failed to get audio input device with error ${error}`
      );
      return CheckAudioConnectivityFeedback.FailureToGetAudioInput;
    }
    audioVideo.realtimeSubscribeToAttendeeIdPresence(attendeePresenceHandler);
    if (!(await this.startMeeting())) {
      audioVideo.realtimeUnsubscribeToAttendeeIdPresence(attendeePresenceHandler);
      return CheckAudioConnectivityFeedback.ConnectionFailure;
    }
    await this.executeTimeoutTask(async () => {
      return audioPresence;
    });
    audioVideo.realtimeUnsubscribeToAttendeeIdPresence(attendeePresenceHandler);
    await this.stopMeeting();
    return audioPresence
      ? CheckAudioConnectivityFeedback.Success
      : CheckAudioConnectivityFeedback.NoAudioPresence;
  }

  async checkVideoConnectivity(
    videoInputDeviceInfo: MediaDeviceInfo
  ): Promise<CheckVideoConnectivityFeedback> {
    const audioVideo = this.meetingSession.audioVideo;

    try {
      const permissionResult = await audioVideo.chooseVideoInputDevice(videoInputDeviceInfo);
      if (
        permissionResult === DevicePermission.PermissionDeniedByBrowser ||
        permissionResult === DevicePermission.PermissionDeniedByUser
      ) {
        return CheckVideoConnectivityFeedback.VideoInputPermissionDenied;
      }
    } catch (error) {
      this.logger.error(
        `MeetingReadinessChecker: Failed to get video input device with error ${error}`
      );
      return CheckVideoConnectivityFeedback.FailureToGetVideoInput;
    }

    if (!(await this.startMeeting())) {
      return CheckVideoConnectivityFeedback.ConnectionFailure;
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
      return CheckVideoConnectivityFeedback.NoPackageSentToServer;
    }
    return CheckVideoConnectivityFeedback.Success;
  }

  async checkNetworkUDPConnectivity(): Promise<CheckNetworkUDPConnectivityFeedback> {
    try {
      this.originalURLRewriter = this.meetingSession.configuration.urls.urlRewriter;
    } catch (e) {
      this.logger.error(`Meeting session not initialized`);
      return CheckNetworkUDPConnectivityFeedback.MeetingSessionNotInitialized;
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
      return CheckNetworkUDPConnectivityFeedback.ConnectionFailure;
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
      return CheckNetworkUDPConnectivityFeedback.ICENegotiationUnsuccessful;
    }
    return CheckNetworkUDPConnectivityFeedback.Success;
  }

  async checkNetworkTCPConnectivity(): Promise<CheckNetworkTCPConnectivityFeedback> {
    try {
      this.originalURLRewriter = this.meetingSession.configuration.urls.urlRewriter;
    } catch (e) {
      this.logger.error(`Meeting session not initialized`);
      return CheckNetworkTCPConnectivityFeedback.MeetingSessionNotInitialized;
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
      return CheckNetworkTCPConnectivityFeedback.ConnectionFailure;
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
      return CheckNetworkTCPConnectivityFeedback.ICENegotiationUnsuccessful;
    }
    return CheckNetworkTCPConnectivityFeedback.Success;
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

      cancel(): void {
        this.isCancelled = true;
      }

      async run(): Promise<void> {
        while (!this.isCancelled) {
          if (await conditionCheck()) {
            isSuccess = true;
            break;
          }
          await DefaultMeetingReadinessChecker.delay(3000);
        }
      }
    }
    const timeoutTask = new TimeoutTask(
      this.logger,
      new CheckForConditionTask(this.logger),
      DefaultMeetingReadinessChecker.TIMEOUT_MS
    );
    await timeoutTask.run();
    return isSuccess;
  }
}
