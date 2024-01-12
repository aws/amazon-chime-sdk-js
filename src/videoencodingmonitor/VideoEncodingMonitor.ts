// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import ClientMetricReport from '../clientmetricreport/ClientMetricReport';
import VideoCodecCapability from '../sdp/VideoCodecCapability';

/**
 * [[VideoEncodingMonitor]] monitors video encoding issues and degrade video codec when necessary.
 */
export default class VideoEncodingMonitor {
  private continuousHighEncodeCpuCnt: number = 0;
  private continuousHwEncodeFailureCnt: number = 0;
  static readonly CONTINUOUS_HIGH_ENCODE_CPU_THRESHOLD = 10;
  static readonly CONTINUOUS_HW_ENCODE_FAILURE_THRESHOLD = 5;
  static readonly HIGH_ENCODE_CPU_MS_THRESHOLD: number = 500;

  /**
   * @param context Take context from monitor task
   */
  constructor(private context: AudioVideoControllerState) {}

  /**
   * Check video encoding metrics for high CPU usage with software encoder
   * software encoder and degrade video codec when necessary.
   */
  private checkHighEncodeCpu(videoMetricReport: { [id: string]: { [id: string]: {} } }): void {
    let cpuLimitationDuration: number = 0;
    let totalEncodingTimeInMs: number = 0;
    let isHardwareEncoder: boolean = false;

    const attendeeId = this.context.meetingSessionConfiguration.credentials.attendeeId;

    const metricData: { [id: string]: { [id: string]: {} } } = videoMetricReport[attendeeId];
    const streams = metricData ? Object.keys(metricData) : [];
    if (streams.length === 0) {
      return;
    }

    for (const ssrc of streams) {
      for (const [metricName, value] of Object.entries(metricData[ssrc])) {
        switch (metricName) {
          case 'videoUpstreamTotalEncodeTimePerSecond':
            totalEncodingTimeInMs = Math.trunc(Number(value));
            break;
          case 'videoUpstreamEncoderImplementation':
            isHardwareEncoder = value as boolean;
            break;
          case 'videoUpstreamCpuQualityLimitationDurationPerSecond':
            cpuLimitationDuration = Math.trunc(Number(value));
            break;
        }
      }
    }

    const cpuUsageIsHigh =
      !isHardwareEncoder &&
      (totalEncodingTimeInMs >= VideoEncodingMonitor.HIGH_ENCODE_CPU_MS_THRESHOLD ||
        cpuLimitationDuration > 0);
    if (cpuUsageIsHigh) {
      this.continuousHighEncodeCpuCnt++;
      if (
        this.continuousHighEncodeCpuCnt > VideoEncodingMonitor.CONTINUOUS_HIGH_ENCODE_CPU_THRESHOLD
      ) {
        this.degradeVideoCodec();
        this.context.statsCollector.videoCodecDegradationHighEncodeCpuDidReceive();
        this.continuousHighEncodeCpuCnt = 0;
      }
    } else {
      this.continuousHighEncodeCpuCnt = 0;
    }
  }

  /**
   * Check video encoding metrics for hardware video encoder failures and
   * degrade video codec when necessary.
   */
  private checkHwEncodeFailure(videoMetricReport: { [id: string]: { [id: string]: {} } }): void {
    let videoInputFps: number = 0;
    let videoEncodeFps: number = 0;
    let isHardwareEncoder: boolean = false;

    const attendeeId = this.context.meetingSessionConfiguration.credentials.attendeeId;

    const metricData: { [id: string]: { [id: string]: {} } } = videoMetricReport[attendeeId];
    const streams = metricData ? Object.keys(metricData) : [];
    if (streams.length === 0) {
      return;
    }

    for (const ssrc of streams) {
      for (const [metricName, value] of Object.entries(metricData[ssrc])) {
        switch (metricName) {
          case 'videoUpstreamFramesInputPerSecond':
            videoInputFps = Math.trunc(Number(value));
            break;
          case 'videoUpstreamFramesEncodedPerSecond':
            videoEncodeFps = Math.trunc(Number(value));
            break;
          case 'videoUpstreamEncoderImplementation':
            isHardwareEncoder = value as boolean;
            break;
        }
      }
    }

    const hwEncoderFailed = isHardwareEncoder && videoEncodeFps === 0 && videoInputFps > 0;
    if (hwEncoderFailed) {
      this.continuousHwEncodeFailureCnt++;
      if (
        this.continuousHwEncodeFailureCnt >
        VideoEncodingMonitor.CONTINUOUS_HW_ENCODE_FAILURE_THRESHOLD
      ) {
        this.degradeVideoCodec();
        this.context.statsCollector.videoCodecDegradationHwEncodeFailureDidReceive();
        this.continuousHwEncodeFailureCnt = 0;
      }
    } else {
      this.continuousHwEncodeFailureCnt = 0;
    }
    return;
  }

  /**
   * Degrade video codec to an alternative codec
   */
  private degradeVideoCodec(): void {
    // Degrade video codec if there are other codec options and current codec is not H264 CBP or VP8
    if (
      this.context.meetingSupportedVideoSendCodecPreferences !== undefined &&
      this.context.meetingSupportedVideoSendCodecPreferences.length > 1 &&
      !(
        this.context.meetingSupportedVideoSendCodecPreferences[0].equals(
          VideoCodecCapability.h264ConstrainedBaselineProfile()
        ) ||
        this.context.meetingSupportedVideoSendCodecPreferences[0].equals(VideoCodecCapability.vp8())
      )
    ) {
      const newMeetingSupportedVideoSendCodecPreferences: VideoCodecCapability[] = [];
      for (const capability of this.context.videoSendCodecPreferences) {
        if (!capability.equals(this.context.meetingSupportedVideoSendCodecPreferences[0])) {
          newMeetingSupportedVideoSendCodecPreferences.push(capability);
        }
      }
      if (newMeetingSupportedVideoSendCodecPreferences.length > 0) {
        this.context.logger.info(
          `Downgrading codec to ${newMeetingSupportedVideoSendCodecPreferences[0].codecName} due to slow encoding`
        );
        this.context.meetingSupportedVideoSendCodecPreferences = newMeetingSupportedVideoSendCodecPreferences;
        this.context.audioVideoController.setVideoCodecSendPreferences(
          newMeetingSupportedVideoSendCodecPreferences
        );
      } else {
        this.context.logger.warn(
          'Degrading video codec failed since there is no alternative codec to select'
        );
      }
    }
  }

  /**
   * Check video encoding metrics and degrade video codec when necessary.
   * @param clientMetricReport Client metric report with necessary metrics
   */
  encodingMonitor(clientMetricReport: ClientMetricReport): void {
    if (this.context.videoTileController.getLocalVideoTile() === null) {
      return;
    }
    const videoMetricReport = clientMetricReport.getObservableVideoMetrics();
    this.checkHighEncodeCpu(videoMetricReport);
    this.checkHwEncodeFailure(videoMetricReport);
  }
}
