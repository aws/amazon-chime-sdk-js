// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DefaultAudioMixController from '../audiomixcontroller/DefaultAudioMixController';
import AudioVideoObserver from '../audiovideoobserver/AudioVideoObserver';
import DefaultBrowserBehavior from '../browserbehavior/DefaultBrowserBehavior';
import ClientMetricReport from '../clientmetricreport/ClientMetricReport';
import ContentShareObserver from '../contentshareobserver/ContentShareObserver';
import DefaultDeviceController from '../devicecontroller/DefaultDeviceController';
import Device from '../devicecontroller/Device';
import PermissionDeniedError from '../devicecontroller/PermissionDeniedError';
import Logger from '../logger/Logger';
import MeetingSession from '../meetingsession/MeetingSession';
import MeetingSessionStatus from '../meetingsession/MeetingSessionStatus';
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
    return new Promise(resolve => setTimeout(resolve, timeoutMs));
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

  async checkAudioInput(audioInputDevice: Device): Promise<CheckAudioInputFeedback> {
    try {
      await this.meetingSession.audioVideo.startAudioInput(audioInputDevice);
      await this.meetingSession.audioVideo.stopAudioInput();
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
    audioOutputDeviceInfo: MediaDeviceInfo | string,
    audioOutputVerificationCallback: () => Promise<boolean>,
    audioElement: HTMLAudioElement = null
  ): Promise<CheckAudioOutputFeedback> {
    try {
      const audioOutputDeviceId = audioOutputDeviceInfo
        ? (DefaultDeviceController.getIntrinsicDeviceId(audioOutputDeviceInfo) as string)
        : '';
      await this.playTone(
        audioOutputDeviceId,
        this.configuration.audioOutputFrequency,
        audioElement
      );
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
    const maxGainValue = this.configuration.audioOutputGain;

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
    const maxGainValue = this.configuration.audioOutputGain;
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

  async checkVideoInput(videoInputDevice: Device): Promise<CheckVideoInputFeedback> {
    try {
      await this.meetingSession.audioVideo.startVideoInput(videoInputDevice);
      await this.meetingSession.audioVideo.stopVideoInput();
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
    videoInputDevice: MediaDeviceInfo | string,
    width: number,
    height: number
  ): Promise<CheckCameraResolutionFeedback> {
    let stream: MediaStream;
    try {
      const videoInputDeviceId = DefaultDeviceController.getIntrinsicDeviceId(
        videoInputDevice
      ) as string;
      const videoConstraint = {
        video: this.calculateVideoConstraint(videoInputDeviceId, width, height),
      };
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
    videoInputDeviceId: string,
    width: number,
    height: number
  ): MediaTrackConstraints {
    const dimension = this.browserBehavior.requiresResolutionAlignment(width, height);
    const trackConstraints: MediaTrackConstraints = {};
    if (this.browserBehavior.requiresNoExactMediaStreamConstraints()) {
      trackConstraints.deviceId = videoInputDeviceId;
      trackConstraints.width = width;
      trackConstraints.height = height;
    } else {
      trackConstraints.deviceId = { exact: videoInputDeviceId };
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

  async checkAudioConnectivity(audioInputDevice: Device): Promise<CheckAudioConnectivityFeedback> {
    let audioPresence = false;
    const audioConnectivityMetrics = {
      packetsReceived: 0,
    };
    const audioVideo = this.meetingSession.audioVideo;

    const checkAudioConnectivityMetricsObserver: AudioVideoObserver = {
      metricsDidReceive(clientMetricReport: ClientMetricReport) {
        clientMetricReport.getRTCStatsReport().forEach(report => {
          // TODO: remove mediaType in next version as it is deprecated
          // mediaType was deprecated and replaced with kind
          if (
            report.type === 'inbound-rtp' &&
            (report.mediaType === 'audio' || report.kind === 'audio')
          ) {
            audioConnectivityMetrics.packetsReceived = report.packetsReceived;
          }
        });
      },
    };

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
      await audioVideo.startAudioInput(audioInputDevice);
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
    audioVideo.addObserver(checkAudioConnectivityMetricsObserver);

    if (!(await this.startMeeting())) {
      audioVideo.removeObserver(checkAudioConnectivityMetricsObserver);
      audioVideo.realtimeUnsubscribeToAttendeeIdPresence(attendeePresenceHandler);
      await this.meetingSession.audioVideo.stopAudioInput();
      return CheckAudioConnectivityFeedback.ConnectionFailed;
    }
    await this.executeTimeoutTask(async () => {
      return this.isAudioConnectionSuccessful(audioPresence, audioConnectivityMetrics);
    });
    audioVideo.removeObserver(checkAudioConnectivityMetricsObserver);
    audioVideo.realtimeUnsubscribeToAttendeeIdPresence(attendeePresenceHandler);
    await this.stopMeeting();
    await this.meetingSession.audioVideo.stopAudioInput();
    return this.isAudioConnectionSuccessful(audioPresence, audioConnectivityMetrics)
      ? CheckAudioConnectivityFeedback.Succeeded
      : CheckAudioConnectivityFeedback.AudioNotReceived;
  }

  async checkVideoConnectivity(videoInputDevice: Device): Promise<CheckVideoConnectivityFeedback> {
    const audioVideo = this.meetingSession.audioVideo;
    let packetsSent = 0;
    const observer: AudioVideoObserver = {
      metricsDidReceive(clientMetricReport: ClientMetricReport) {
        const rawStats = clientMetricReport.getRTCStatsReport();
        rawStats.forEach(report => {
          // TODO: remove mediaType in next version as it is deprecated
          if (
            report.type === 'outbound-rtp' &&
            (report.mediaType === 'video' || report.kind === 'video')
          ) {
            packetsSent = report.packetsSent;
          }
        });
      },
    };
    try {
      await audioVideo.startVideoInput(videoInputDevice);
    } catch (error) {
      this.logger.error(
        `MeetingReadinessChecker: Failed to get video input device with error ${error}`
      );
      if (error instanceof PermissionDeniedError) {
        return CheckVideoConnectivityFeedback.VideoInputPermissionDenied;
      }
      return CheckVideoConnectivityFeedback.VideoInputRequestFailed;
    }

    audioVideo.addObserver(observer);
    if (!(await this.startMeeting())) {
      return CheckVideoConnectivityFeedback.ConnectionFailed;
    }

    audioVideo.startLocalVideoTile();
    await this.executeTimeoutTask(async () => {
      return packetsSent > 0;
    });
    await audioVideo.stopVideoInput();
    await this.stopMeeting();
    audioVideo.removeObserver(observer);
    if (packetsSent <= 0) {
      return CheckVideoConnectivityFeedback.VideoNotSent;
    }
    return CheckVideoConnectivityFeedback.Succeeded;
  }

  async checkNetworkUDPConnectivity(): Promise<CheckNetworkUDPConnectivityFeedback> {
    let candidatePairSucceed = false;
    const observer: AudioVideoObserver = {
      metricsDidReceive(clientMetricReport: ClientMetricReport) {
        const rawStats = clientMetricReport.getRTCStatsReport();
        rawStats.forEach(report => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            candidatePairSucceed = true;
          }
        });
      },
    };
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
    audioVideo.addObserver(observer);
    if (!(await this.startMeeting())) {
      this.meetingSession.configuration.urls.urlRewriter = this.originalURLRewriter;
      return CheckNetworkUDPConnectivityFeedback.ConnectionFailed;
    }
    await this.executeTimeoutTask(async () => {
      return candidatePairSucceed;
    });
    this.meetingSession.configuration.urls.urlRewriter = this.originalURLRewriter;
    await this.stopMeeting();
    audioVideo.removeObserver(observer);
    if (!candidatePairSucceed) {
      return CheckNetworkUDPConnectivityFeedback.ICENegotiationFailed;
    }
    return CheckNetworkUDPConnectivityFeedback.Succeeded;
  }

  async checkNetworkTCPConnectivity(): Promise<CheckNetworkTCPConnectivityFeedback> {
    let candidatePairSucceed = false;
    const observer: AudioVideoObserver = {
      metricsDidReceive(clientMetricReport: ClientMetricReport) {
        const rawStats = clientMetricReport.getRTCStatsReport();
        rawStats.forEach(report => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            candidatePairSucceed = true;
          }
        });
      },
    };
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
    audioVideo.addObserver(observer);
    if (!(await this.startMeeting())) {
      this.meetingSession.configuration.urls.urlRewriter = this.originalURLRewriter;
      return CheckNetworkTCPConnectivityFeedback.ConnectionFailed;
    }
    await this.executeTimeoutTask(async () => {
      return candidatePairSucceed;
    });
    this.meetingSession.configuration.urls.urlRewriter = this.originalURLRewriter;
    await this.stopMeeting();
    audioVideo.removeObserver(observer);
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

  private isAudioConnectionSuccessful(
    audioPresence: boolean,
    audioConnectivityMetrics: { packetsReceived: number }
  ): boolean {
    return audioPresence && audioConnectivityMetrics.packetsReceived > 0;
  }
}
